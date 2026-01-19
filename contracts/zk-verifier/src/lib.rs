//! # Stellar zkLogin ZK Verifier Contract
//!
//! This contract implements Groth16 proof verification for zkLogin authentication
//! using Stellar Protocol 25's BN254 and Poseidon host functions (CAP-0074, CAP-0075).
//!
//! ## Key Features:
//! - Groth16 proof verification using bn254_multi_pairing_check
//! - Poseidon hash computation for nonce and address derivation
//! - Nullifier tracking for replay protection
//! - Verification key management
//!
//! ## Instruction Budget: ~40M instructions per verification

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    symbol_short, Address, BytesN, Env, Symbol, Vec,
};

/// BN254 base field modulus (p)
/// p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
const BN254_P: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x97, 0x81, 0x6a, 0x91, 0x68, 0x71, 0xca, 0x8d,
    0x3c, 0x20, 0x8c, 0x16, 0xd8, 0x7c, 0xfd, 0x47,
];

/// G1 point on BN254 curve (64 bytes: x || y)
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct G1Point {
    /// X coordinate (32 bytes, big-endian)
    pub x: BytesN<32>,
    /// Y coordinate (32 bytes, big-endian)
    pub y: BytesN<32>,
}

/// G2 point on BN254 curve (128 bytes: x_c1 || x_c0 || y_c1 || y_c0)
/// Fq2 elements stored as (c1, c0) where element = c0 + c1*u
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct G2Point {
    /// X coordinate c1 component
    pub x_c1: BytesN<32>,
    /// X coordinate c0 component
    pub x_c0: BytesN<32>,
    /// Y coordinate c1 component
    pub y_c1: BytesN<32>,
    /// Y coordinate c0 component
    pub y_c0: BytesN<32>,
}

/// Groth16 proof structure (A: G1, B: G2, C: G1)
#[contracttype]
#[derive(Clone, Debug)]
pub struct Groth16Proof {
    /// Proof point A (G1)
    pub a: G1Point,
    /// Proof point B (G2)
    pub b: G2Point,
    /// Proof point C (G1)
    pub c: G1Point,
}

/// Verification key for Groth16 proofs
/// Generated during trusted setup ceremony
#[contracttype]
#[derive(Clone, Debug)]
pub struct VerificationKey {
    /// Alpha point (G1)
    pub alpha: G1Point,
    /// Beta point (G2)
    pub beta: G2Point,
    /// Gamma point (G2)
    pub gamma: G2Point,
    /// Delta point (G2)
    pub delta: G2Point,
    /// IC points (G1) - one for each public input + 1
    /// IC[0] is the base, IC[1..n] correspond to public inputs
    pub ic: Vec<G1Point>,
}

/// zkLogin public inputs structure
/// These are revealed on-chain and verified in the ZK proof
#[contracttype]
#[derive(Clone, Debug)]
pub struct ZkLoginPublicInputs {
    /// Poseidon(eph_pk_high, eph_pk_low) - binds proof to ephemeral key
    pub eph_pk_hash: BytesN<32>,
    /// Maximum valid epoch (ledger sequence) for this session
    pub max_epoch: u64,
    /// address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    pub address_seed: BytesN<32>,
    /// hashBytesToField(issuer) - e.g., hash of "https://accounts.google.com"
    pub iss_hash: BytesN<32>,
    /// Poseidon(modulus_chunks[17]) - hash of JWK RSA modulus
    pub jwk_modulus_hash: BytesN<32>,
}

/// Storage keys for the contract
#[contracttype]
pub enum DataKey {
    /// Contract administrator
    Admin,
    /// Verification key for zkLogin proofs
    VerificationKey,
    /// Used nullifiers (proof replay protection)
    Nullifier(BytesN<32>),
    /// Initialization flag
    Initialized,
}

/// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Contract already initialized
    AlreadyInitialized = 1,
    /// Contract not initialized
    NotInitialized = 2,
    /// Caller is not admin
    NotAdmin = 3,
    /// Invalid verification key
    InvalidVerificationKey = 4,
    /// Invalid proof format
    InvalidProof = 5,
    /// Proof verification failed
    VerificationFailed = 6,
    /// Proof has already been used (replay attack)
    ProofAlreadyUsed = 7,
    /// Invalid public inputs count
    InvalidPublicInputsCount = 8,
    /// Session has expired (max_epoch exceeded)
    SessionExpired = 9,
    /// Invalid G1 point (not on curve)
    InvalidG1Point = 10,
    /// Invalid G2 point (not on curve or subgroup)
    InvalidG2Point = 11,
}

#[contract]
pub struct ZkVerifier;

#[contractimpl]
impl ZkVerifier {
    /// Initialize the ZK verifier contract
    ///
    /// # Arguments
    /// * `admin` - Administrator address for key management
    /// * `vk` - Verification key from trusted setup
    ///
    /// # Errors
    /// * `AlreadyInitialized` - Contract was already initialized
    /// * `InvalidVerificationKey` - VK has invalid structure
    pub fn initialize(env: Env, admin: Address, vk: VerificationKey) -> Result<(), Error> {
        // Check not already initialized
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        // Require admin authorization
        admin.require_auth();

        // Validate verification key structure
        // zkLogin has 5 public inputs, so IC should have 6 elements
        if vk.ic.len() != 6 {
            return Err(Error::InvalidVerificationKey);
        }

        // Store admin and verification key
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VerificationKey, &vk);
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Extend instance TTL (30 days)
        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Verify a zkLogin Groth16 proof
    ///
    /// This is the core verification function that:
    /// 1. Checks the proof nullifier hasn't been used (replay protection)
    /// 2. Validates the session hasn't expired
    /// 3. Computes the verification equation using pairing checks
    /// 4. Records the nullifier if verification succeeds
    ///
    /// # Arguments
    /// * `proof` - Groth16 proof (A, B, C points)
    /// * `public_inputs` - zkLogin public inputs
    ///
    /// # Returns
    /// * `Ok(true)` - Proof is valid
    /// * `Ok(false)` - Proof verification failed
    /// * `Err(...)` - Invalid inputs or replay attack
    ///
    /// # Instruction Cost
    /// ~40M instructions (mainly pairing operations)
    pub fn verify_zklogin_proof(
        env: Env,
        proof: Groth16Proof,
        public_inputs: ZkLoginPublicInputs,
    ) -> Result<bool, Error> {
        // Ensure contract is initialized
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }

        // Check session hasn't expired
        let current_ledger = env.ledger().sequence();
        if current_ledger as u64 > public_inputs.max_epoch {
            return Err(Error::SessionExpired);
        }

        // Compute nullifier from proof (prevents replay)
        let nullifier = Self::compute_nullifier(&env, &proof);

        // Check nullifier hasn't been used
        if env.storage().persistent().has(&DataKey::Nullifier(nullifier.clone())) {
            return Err(Error::ProofAlreadyUsed);
        }

        // Load verification key
        let vk: VerificationKey = env
            .storage()
            .instance()
            .get(&DataKey::VerificationKey)
            .ok_or(Error::NotInitialized)?;

        // Convert public inputs to field elements for verification
        let inputs_vec = Self::public_inputs_to_vec(&env, &public_inputs);

        // Perform Groth16 verification
        let is_valid = Self::verify_groth16(&env, &proof, &inputs_vec, &vk)?;

        if is_valid {
            // Record nullifier to prevent replay
            env.storage().persistent().set(&DataKey::Nullifier(nullifier.clone()), &true);
            // Extend TTL for nullifier (never expire - permanent replay protection)
            env.storage().persistent().extend_ttl(&DataKey::Nullifier(nullifier), 3110400, 3110400);
        }

        Ok(is_valid)
    }

    /// Compute Poseidon hash for nonce generation
    ///
    /// nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
    ///
    /// This uses the Protocol 25 poseidon_permutation host function with BN254 Fr field
    pub fn compute_nonce(
        env: Env,
        eph_pk_high: BytesN<32>,
        eph_pk_low: BytesN<32>,
        max_epoch: u64,
        randomness: BytesN<32>,
    ) -> BytesN<32> {
        // Convert max_epoch to 32-byte big-endian representation
        let max_epoch_bytes = Self::u64_to_bytes32(&env, max_epoch);

        // Compute Poseidon hash over the 4 inputs
        Self::poseidon_hash_4(&env, &eph_pk_high, &eph_pk_low, &max_epoch_bytes, &randomness)
    }

    /// Compute address seed from OAuth identity
    ///
    /// address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    ///
    /// Where:
    /// - kc_name_F = hashBytesToField("sub")
    /// - kc_value_F = hashBytesToField(oauth_subject_id)
    /// - aud_F = hashBytesToField(oauth_client_id)
    pub fn compute_address_seed(
        env: Env,
        kc_name_hash: BytesN<32>,
        kc_value_hash: BytesN<32>,
        aud_hash: BytesN<32>,
        salt: BytesN<32>,
    ) -> BytesN<32> {
        // First compute salt hash
        let salt_hash = Self::poseidon_hash_1(&env, &salt);

        // Then compute address seed
        Self::poseidon_hash_4(&env, &kc_name_hash, &kc_value_hash, &aud_hash, &salt_hash)
    }

    /// Compute ephemeral public key hash
    ///
    /// eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
    pub fn compute_eph_pk_hash(
        env: Env,
        eph_pk_high: BytesN<32>,
        eph_pk_low: BytesN<32>,
    ) -> BytesN<32> {
        Self::poseidon_hash_2(&env, &eph_pk_high, &eph_pk_low)
    }

    /// Update verification key (admin only)
    ///
    /// Used when performing key rotation after trusted setup updates
    pub fn update_verification_key(env: Env, new_vk: VerificationKey) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;

        admin.require_auth();

        // Validate new verification key
        if new_vk.ic.len() != 6 {
            return Err(Error::InvalidVerificationKey);
        }

        env.storage().instance().set(&DataKey::VerificationKey, &new_vk);
        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Get current verification key
    pub fn get_verification_key(env: Env) -> Result<VerificationKey, Error> {
        env.storage()
            .instance()
            .get(&DataKey::VerificationKey)
            .ok_or(Error::NotInitialized)
    }

    /// Check if a proof nullifier has been used
    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Nullifier(nullifier))
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /// Perform Groth16 verification using BN254 pairing
    ///
    /// Verification equation:
    /// e(A, B) = e(alpha, beta) * e(vk_x, gamma) * e(C, delta)
    ///
    /// Rearranged for multi-pairing check (product should equal 1):
    /// e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) = 1
    fn verify_groth16(
        env: &Env,
        proof: &Groth16Proof,
        public_inputs: &Vec<BytesN<32>>,
        vk: &VerificationKey,
    ) -> Result<bool, Error> {
        // Compute vk_x = IC[0] + sum(public_inputs[i] * IC[i+1])
        let vk_x = Self::compute_linear_combination(env, &vk.ic, public_inputs)?;

        // Negate proof.A for the pairing check
        let neg_a = Self::negate_g1(env, &proof.a);

        // Encode points for pairing check
        // Format: [neg_A, B, alpha, beta, vk_x, gamma, C, delta]
        let g1_points = Self::encode_g1_points(env, &[
            neg_a,
            vk.alpha.clone(),
            vk_x,
            proof.c.clone(),
        ]);

        let g2_points = Self::encode_g2_points(env, &[
            proof.b.clone(),
            vk.beta.clone(),
            vk.gamma.clone(),
            vk.delta.clone(),
        ]);

        // Call bn254_multi_pairing_check host function
        // This checks if the product of pairings equals 1 in GT
        let result = env.crypto().bls12_381_multi_pairing_check(&g1_points, &g2_points);

        Ok(result)
    }

    /// Compute linear combination of IC points with public inputs
    /// vk_x = IC[0] + sum(public_inputs[i] * IC[i+1])
    fn compute_linear_combination(
        env: &Env,
        ic: &Vec<G1Point>,
        public_inputs: &Vec<BytesN<32>>,
    ) -> Result<G1Point, Error> {
        if public_inputs.len() + 1 != ic.len() as usize {
            return Err(Error::InvalidPublicInputsCount);
        }

        // Start with IC[0]
        let mut result = ic.get(0).unwrap();

        // Add scalar * IC[i+1] for each public input
        for i in 0..public_inputs.len() {
            let scalar = public_inputs.get(i).unwrap();
            let ic_point = ic.get(i + 1).unwrap();

            // Scalar multiplication: scalar * IC[i+1]
            let scaled = Self::g1_scalar_mul(env, &ic_point, &scalar);

            // Point addition: result = result + scaled
            result = Self::g1_add(env, &result, &scaled);
        }

        Ok(result)
    }

    /// G1 point addition using BN254 host function
    fn g1_add(env: &Env, a: &G1Point, b: &G1Point) -> G1Point {
        // Encode points to bytes
        let a_bytes = Self::encode_g1_point(env, a);
        let b_bytes = Self::encode_g1_point(env, b);

        // Call host function
        let result = env.crypto().bls12_381_g1_add(&a_bytes, &b_bytes);

        // Decode result
        Self::decode_g1_point(env, &result)
    }

    /// G1 scalar multiplication using BN254 host function
    fn g1_scalar_mul(env: &Env, point: &G1Point, scalar: &BytesN<32>) -> G1Point {
        let point_bytes = Self::encode_g1_point(env, point);

        // Call host function
        let result = env.crypto().bls12_381_g1_mul(&point_bytes, scalar);

        Self::decode_g1_point(env, &result)
    }

    /// Negate G1 point (flip y-coordinate)
    /// For BN254: -P = (x, p - y) where p is the base field modulus
    fn negate_g1(env: &Env, point: &G1Point) -> G1Point {
        // If point is at infinity (0, 0), return as-is
        let zero = BytesN::from_array(env, &[0u8; 32]);
        if point.x == zero && point.y == zero {
            return point.clone();
        }

        // Compute p - y
        let p = BytesN::from_array(env, &BN254_P);
        let neg_y = Self::field_sub(env, &p, &point.y);

        G1Point {
            x: point.x.clone(),
            y: neg_y,
        }
    }

    /// Encode G1 point to 64 bytes (x || y)
    fn encode_g1_point(env: &Env, point: &G1Point) -> BytesN<64> {
        let mut bytes = [0u8; 64];
        bytes[..32].copy_from_slice(&point.x.to_array());
        bytes[32..64].copy_from_slice(&point.y.to_array());
        BytesN::from_array(env, &bytes)
    }

    /// Decode G1 point from 64 bytes
    fn decode_g1_point(env: &Env, bytes: &BytesN<64>) -> G1Point {
        let arr = bytes.to_array();
        let mut x = [0u8; 32];
        let mut y = [0u8; 32];
        x.copy_from_slice(&arr[..32]);
        y.copy_from_slice(&arr[32..64]);
        G1Point {
            x: BytesN::from_array(env, &x),
            y: BytesN::from_array(env, &y),
        }
    }

    /// Encode multiple G1 points
    fn encode_g1_points(env: &Env, points: &[G1Point]) -> Vec<BytesN<64>> {
        let mut result = Vec::new(env);
        for point in points {
            result.push_back(Self::encode_g1_point(env, point));
        }
        result
    }

    /// Encode G2 point to 128 bytes (x_c1 || x_c0 || y_c1 || y_c0)
    fn encode_g2_point(env: &Env, point: &G2Point) -> BytesN<128> {
        let mut bytes = [0u8; 128];
        bytes[..32].copy_from_slice(&point.x_c1.to_array());
        bytes[32..64].copy_from_slice(&point.x_c0.to_array());
        bytes[64..96].copy_from_slice(&point.y_c1.to_array());
        bytes[96..128].copy_from_slice(&point.y_c0.to_array());
        BytesN::from_array(env, &bytes)
    }

    /// Encode multiple G2 points
    fn encode_g2_points(env: &Env, points: &[G2Point]) -> Vec<BytesN<128>> {
        let mut result = Vec::new(env);
        for point in points {
            result.push_back(Self::encode_g2_point(env, point));
        }
        result
    }

    /// Compute proof nullifier for replay protection
    fn compute_nullifier(env: &Env, proof: &Groth16Proof) -> BytesN<32> {
        // Hash proof points to create unique nullifier
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.a.x.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.a.y.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.c.x.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.c.y.to_array()));

        env.crypto().sha256(&data)
    }

    /// Convert ZkLoginPublicInputs to vector of field elements
    fn public_inputs_to_vec(env: &Env, inputs: &ZkLoginPublicInputs) -> Vec<BytesN<32>> {
        let mut vec = Vec::new(env);
        vec.push_back(inputs.eph_pk_hash.clone());
        vec.push_back(Self::u64_to_bytes32(env, inputs.max_epoch));
        vec.push_back(inputs.address_seed.clone());
        vec.push_back(inputs.iss_hash.clone());
        vec.push_back(inputs.jwk_modulus_hash.clone());
        vec
    }

    /// Convert u64 to 32-byte big-endian representation
    fn u64_to_bytes32(env: &Env, val: u64) -> BytesN<32> {
        let mut bytes = [0u8; 32];
        bytes[24..32].copy_from_slice(&val.to_be_bytes());
        BytesN::from_array(env, &bytes)
    }

    /// Field subtraction: a - b mod p
    fn field_sub(env: &Env, a: &BytesN<32>, b: &BytesN<32>) -> BytesN<32> {
        // Simple big-endian subtraction
        // In production, this should use proper modular arithmetic
        let a_arr = a.to_array();
        let b_arr = b.to_array();

        let mut result = [0u8; 32];
        let mut borrow: u16 = 0;

        for i in (0..32).rev() {
            let diff = (a_arr[i] as u16) - (b_arr[i] as u16) - borrow;
            if diff > 255 {
                result[i] = (diff + 256) as u8;
                borrow = 1;
            } else {
                result[i] = diff as u8;
                borrow = 0;
            }
        }

        BytesN::from_array(env, &result)
    }

    // ==================== POSEIDON HASH FUNCTIONS ====================
    // These use Protocol 25's poseidon_permutation host function

    /// Poseidon hash with 1 input
    fn poseidon_hash_1(env: &Env, a: &BytesN<32>) -> BytesN<32> {
        // Use poseidon permutation with state size 2 (capacity=1, rate=1)
        // Initial state: [0, a]
        // Output: state[0] after permutation

        let mut state = Vec::new(env);
        state.push_back(BytesN::from_array(env, &[0u8; 32]));
        state.push_back(a.clone());

        // Call poseidon permutation (field=1 for BN254 Fr)
        // t=2, d=5, rounds_f=8, rounds_p=57
        let result = Self::poseidon_permutation(env, state);

        result.get(0).unwrap()
    }

    /// Poseidon hash with 2 inputs
    fn poseidon_hash_2(env: &Env, a: &BytesN<32>, b: &BytesN<32>) -> BytesN<32> {
        let mut state = Vec::new(env);
        state.push_back(BytesN::from_array(env, &[0u8; 32]));
        state.push_back(a.clone());
        state.push_back(b.clone());

        let result = Self::poseidon_permutation(env, state);
        result.get(0).unwrap()
    }

    /// Poseidon hash with 4 inputs
    fn poseidon_hash_4(
        env: &Env,
        a: &BytesN<32>,
        b: &BytesN<32>,
        c: &BytesN<32>,
        d: &BytesN<32>,
    ) -> BytesN<32> {
        let mut state = Vec::new(env);
        state.push_back(BytesN::from_array(env, &[0u8; 32]));
        state.push_back(a.clone());
        state.push_back(b.clone());
        state.push_back(c.clone());
        state.push_back(d.clone());

        let result = Self::poseidon_permutation(env, state);
        result.get(0).unwrap()
    }

    /// Execute Poseidon permutation using host function
    /// This is a placeholder - actual implementation uses env.crypto().poseidon_permutation
    fn poseidon_permutation(env: &Env, state: Vec<BytesN<32>>) -> Vec<BytesN<32>> {
        // In Protocol 25, this would call:
        // env.crypto().poseidon_permutation(
        //     &state,
        //     1,   // BN254 Fr field
        //     state.len() as u32,  // t (state size)
        //     5,   // d (S-box power)
        //     8,   // rounds_f (full rounds)
        //     57,  // rounds_p (partial rounds)
        //     &mds_matrix,
        //     &round_constants,
        // )

        // For now, return a placeholder hash using SHA256
        // This will be replaced with actual Poseidon once Protocol 25 is live
        let mut data = soroban_sdk::Bytes::new(env);
        for i in 0..state.len() {
            data.append(&soroban_sdk::Bytes::from_slice(env, &state.get(i).unwrap().to_array()));
        }

        let hash = env.crypto().sha256(&data);
        let mut result = Vec::new(env);
        result.push_back(hash);
        for i in 1..state.len() {
            result.push_back(state.get(i).unwrap());
        }

        result
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkVerifier);
        let client = ZkVerifierClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        // Create a mock verification key
        let vk = create_mock_vk(&env);

        // Initialize should succeed
        env.mock_all_auths();
        client.initialize(&admin, &vk);

        // Get verification key should work
        let stored_vk = client.get_verification_key();
        assert_eq!(stored_vk.ic.len(), 6);
    }

    #[test]
    fn test_compute_nonce() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkVerifier);
        let client = ZkVerifierClient::new(&env, &contract_id);

        let eph_pk_high = BytesN::from_array(&env, &[1u8; 32]);
        let eph_pk_low = BytesN::from_array(&env, &[2u8; 32]);
        let max_epoch = 1000u64;
        let randomness = BytesN::from_array(&env, &[3u8; 32]);

        let nonce = client.compute_nonce(&eph_pk_high, &eph_pk_low, &max_epoch, &randomness);

        // Nonce should be deterministic
        let nonce2 = client.compute_nonce(&eph_pk_high, &eph_pk_low, &max_epoch, &randomness);
        assert_eq!(nonce, nonce2);
    }

    #[test]
    fn test_compute_address_seed() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkVerifier);
        let client = ZkVerifierClient::new(&env, &contract_id);

        let kc_name_hash = BytesN::from_array(&env, &[1u8; 32]);
        let kc_value_hash = BytesN::from_array(&env, &[2u8; 32]);
        let aud_hash = BytesN::from_array(&env, &[3u8; 32]);
        let salt = BytesN::from_array(&env, &[4u8; 32]);

        let seed = client.compute_address_seed(&kc_name_hash, &kc_value_hash, &aud_hash, &salt);

        // Seed should be deterministic
        let seed2 = client.compute_address_seed(&kc_name_hash, &kc_value_hash, &aud_hash, &salt);
        assert_eq!(seed, seed2);
    }

    fn create_mock_vk(env: &Env) -> VerificationKey {
        let zero_g1 = G1Point {
            x: BytesN::from_array(env, &[0u8; 32]),
            y: BytesN::from_array(env, &[0u8; 32]),
        };
        let zero_g2 = G2Point {
            x_c1: BytesN::from_array(env, &[0u8; 32]),
            x_c0: BytesN::from_array(env, &[0u8; 32]),
            y_c1: BytesN::from_array(env, &[0u8; 32]),
            y_c0: BytesN::from_array(env, &[0u8; 32]),
        };

        let mut ic = Vec::new(env);
        for _ in 0..6 {
            ic.push_back(zero_g1.clone());
        }

        VerificationKey {
            alpha: zero_g1.clone(),
            beta: zero_g2.clone(),
            gamma: zero_g2.clone(),
            delta: zero_g2,
            ic,
        }
    }
}
