//! # Stellar zkLogin ZK Verifier Contract
//!
//! This contract implements Groth16 proof verification for zkLogin authentication.
//!
//! ## Protocol 25 (X-Ray) Integration:
//! - **BN254 Elliptic Curve**: Full pairing support via CAP-0074
//! - **Poseidon Hashing**: ZK-friendly hashing via CAP-0075
//! - **Groth16 Verification**: On-chain ZK proof verification
//!
//! ## Key Features:
//! - Full Groth16 proof verification with BN254 pairing
//! - Native Poseidon hashing for public input computation
//! - Nullifier tracking for replay protection
//! - Verification key management
//! - Session expiration checking
//!
//! ## Circuit Public Inputs (5 elements):
//! 1. eph_pk_hash - Poseidon(eph_pk_high, eph_pk_low)
//! 2. max_epoch - Session expiration ledger
//! 3. address_seed - Poseidon(kc_name, kc_value, aud, Poseidon(salt))
//! 4. iss_hash - Hash of issuer string
//! 5. jwk_modulus_hash - Poseidon hash of JWK modulus chunks

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, BytesN, Env, Vec, U256,
};
use soroban_poseidon::{poseidon_hash, Bn254Fr};

/// BN254 field modulus (Fr)
/// p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
const BN254_FR_MODULUS: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x28, 0x33, 0xe8, 0x48, 0x79, 0xb9, 0x70, 0x91,
    0x43, 0xe1, 0xf5, 0x93, 0xf0, 0x00, 0x00, 0x01,
];

/// G1 point on BN254 curve (affine coordinates)
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct G1Point {
    pub x: BytesN<32>,
    pub y: BytesN<32>,
}

/// G2 point on BN254 curve (affine coordinates in Fp2)
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct G2Point {
    /// x coordinate: c0 + c1 * u
    pub x_c0: BytesN<32>,
    pub x_c1: BytesN<32>,
    /// y coordinate: c0 + c1 * u
    pub y_c0: BytesN<32>,
    pub y_c1: BytesN<32>,
}

/// Groth16 proof structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct Groth16Proof {
    /// π_A ∈ G1
    pub a: G1Point,
    /// π_B ∈ G2
    pub b: G2Point,
    /// π_C ∈ G1
    pub c: G1Point,
}

/// Verification key for Groth16 proofs
#[contracttype]
#[derive(Clone, Debug)]
pub struct VerificationKey {
    /// α ∈ G1
    pub alpha: G1Point,
    /// β ∈ G2
    pub beta: G2Point,
    /// γ ∈ G2
    pub gamma: G2Point,
    /// δ ∈ G2
    pub delta: G2Point,
    /// IC (input commitments) ∈ G1[n+1]
    /// IC[0] + Σ(public_input[i] * IC[i+1])
    pub ic: Vec<G1Point>,
}

/// zkLogin public inputs (5 field elements)
#[contracttype]
#[derive(Clone, Debug)]
pub struct ZkLoginPublicInputs {
    /// Hash of ephemeral public key: Poseidon(eph_pk_high, eph_pk_low)
    pub eph_pk_hash: BytesN<32>,
    /// Maximum ledger sequence for session validity
    pub max_epoch: u64,
    /// Address seed: Poseidon(kc_name, kc_value, aud, Poseidon(salt))
    pub address_seed: BytesN<32>,
    /// Hash of issuer string (for provider identification)
    pub iss_hash: BytesN<32>,
    /// Poseidon hash of JWK modulus chunks (17 chunks)
    pub jwk_modulus_hash: BytesN<32>,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    /// Contract administrator
    Admin,
    /// Groth16 verification key
    VerificationKey,
    /// Nullifier registry: DataKey::Nullifier(nullifier) -> bool
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
    /// Invalid verification key structure
    InvalidVerificationKey = 4,
    /// Invalid proof structure
    InvalidProof = 5,
    /// Proof verification failed
    VerificationFailed = 6,
    /// Proof has already been used (replay attack)
    ProofAlreadyUsed = 7,
    /// Wrong number of public inputs
    InvalidPublicInputsCount = 8,
    /// Session has expired
    SessionExpired = 9,
    /// Pairing check failed
    PairingCheckFailed = 10,
    /// Invalid field element (not in BN254 Fr)
    InvalidFieldElement = 11,
}

#[contract]
pub struct ZkVerifier;

#[contractimpl]
impl ZkVerifier {
    /// Initialize the ZK verifier contract
    ///
    /// # Arguments
    /// * `admin` - Administrator address for key management
    /// * `vk` - Groth16 verification key (from circuit setup)
    ///
    /// # Notes
    /// - zkLogin circuit has 5 public inputs, so IC should have 6 elements
    pub fn initialize(env: Env, admin: Address, vk: VerificationKey) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        // Validate: zkLogin has 5 public inputs, IC needs n+1 = 6 elements
        if vk.ic.len() != 6 {
            return Err(Error::InvalidVerificationKey);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VerificationKey, &vk);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Verify a zkLogin Groth16 proof
    ///
    /// # Protocol 25 Implementation
    /// Uses native BN254 pairing operations:
    /// ```
    /// e(A, B) = e(α, β) · e(vk_x, γ) · e(C, δ)
    /// ```
    /// where vk_x = IC[0] + Σ(input[i] · IC[i+1])
    ///
    /// # Arguments
    /// * `proof` - Groth16 proof (A, B, C)
    /// * `public_inputs` - zkLogin public inputs (5 elements)
    ///
    /// # Returns
    /// * `Ok(true)` - Proof is valid
    /// * `Err(...)` - Proof is invalid or other error
    pub fn verify_zklogin_proof(
        env: Env,
        proof: Groth16Proof,
        public_inputs: ZkLoginPublicInputs,
    ) -> Result<bool, Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }

        // Check session hasn't expired
        let current_ledger = env.ledger().sequence();
        if current_ledger as u64 > public_inputs.max_epoch {
            return Err(Error::SessionExpired);
        }

        // Compute nullifier from proof to prevent replay
        let nullifier = Self::compute_nullifier(&env, &proof);

        // Check nullifier hasn't been used
        if env.storage().persistent().has(&DataKey::Nullifier(nullifier.clone())) {
            return Err(Error::ProofAlreadyUsed);
        }

        // Validate proof structure (non-zero points)
        if !Self::is_valid_g1_point(&env, &proof.a) || !Self::is_valid_g1_point(&env, &proof.c) {
            return Err(Error::InvalidProof);
        }

        // Get verification key
        let vk: VerificationKey = env
            .storage()
            .instance()
            .get(&DataKey::VerificationKey)
            .ok_or(Error::NotInitialized)?;

        // Convert public inputs to field elements
        let inputs = Self::public_inputs_to_field_elements(&env, &public_inputs)?;

        // Compute vk_x = IC[0] + Σ(input[i] * IC[i+1])
        let vk_x = Self::compute_linear_combination(&env, &vk.ic, &inputs)?;

        // Perform pairing check:
        // e(-A, B) * e(α, β) * e(vk_x, γ) * e(C, δ) = 1
        let pairing_valid = Self::verify_pairing(&env, &proof, &vk, &vk_x)?;

        if !pairing_valid {
            return Err(Error::PairingCheckFailed);
        }

        // Record nullifier to prevent replay
        env.storage().persistent().set(&DataKey::Nullifier(nullifier.clone()), &true);
        env.storage().persistent().extend_ttl(&DataKey::Nullifier(nullifier), 3110400, 3110400);

        Ok(true)
    }

    /// Compute nonce for session binding using Poseidon
    ///
    /// nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
    pub fn compute_nonce(
        env: Env,
        eph_pk_high: BytesN<32>,
        eph_pk_low: BytesN<32>,
        max_epoch: u64,
        randomness: BytesN<32>,
    ) -> BytesN<32> {
        let high_fe = Self::bytes_to_field_element(&env, &eph_pk_high);
        let low_fe = Self::bytes_to_field_element(&env, &eph_pk_low);
        let epoch_fe = Self::u64_to_field_element(&env, max_epoch);
        let rand_fe = Self::bytes_to_field_element(&env, &randomness);

        let inputs = soroban_sdk::vec![&env, high_fe, low_fe, epoch_fe, rand_fe];
        let hash = poseidon_hash::<5, Bn254Fr>(&env, &inputs);

        Self::field_element_to_bytes(&env, &hash)
    }

    /// Compute address seed from OAuth identity using Poseidon
    ///
    /// address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    pub fn compute_address_seed(
        env: Env,
        kc_name_hash: BytesN<32>,
        kc_value_hash: BytesN<32>,
        aud_hash: BytesN<32>,
        salt: BytesN<32>,
    ) -> BytesN<32> {
        // Step 1: Poseidon(salt)
        let salt_fe = Self::bytes_to_field_element(&env, &salt);
        let salt_inputs = soroban_sdk::vec![&env, salt_fe];
        let salt_hash = poseidon_hash::<2, Bn254Fr>(&env, &salt_inputs);

        // Step 2: Poseidon(kc_name, kc_value, aud, salt_hash)
        let kc_name_fe = Self::bytes_to_field_element(&env, &kc_name_hash);
        let kc_value_fe = Self::bytes_to_field_element(&env, &kc_value_hash);
        let aud_fe = Self::bytes_to_field_element(&env, &aud_hash);

        let inputs = soroban_sdk::vec![&env, kc_name_fe, kc_value_fe, aud_fe, salt_hash];
        let address_seed = poseidon_hash::<5, Bn254Fr>(&env, &inputs);

        Self::field_element_to_bytes(&env, &address_seed)
    }

    /// Compute ephemeral public key hash using Poseidon
    ///
    /// eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
    pub fn compute_eph_pk_hash(
        env: Env,
        eph_pk_high: BytesN<32>,
        eph_pk_low: BytesN<32>,
    ) -> BytesN<32> {
        let high_fe = Self::bytes_to_field_element(&env, &eph_pk_high);
        let low_fe = Self::bytes_to_field_element(&env, &eph_pk_low);

        let inputs = soroban_sdk::vec![&env, high_fe, low_fe];
        let hash = poseidon_hash::<3, Bn254Fr>(&env, &inputs);

        Self::field_element_to_bytes(&env, &hash)
    }

    /// Update verification key (admin only)
    ///
    /// # Notes
    /// Use this to rotate keys or fix issues with the circuit.
    pub fn update_verification_key(env: Env, new_vk: VerificationKey) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;

        admin.require_auth();

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

    /// Check if a nullifier has been used
    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Nullifier(nullifier))
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /// Compute nullifier from proof using Poseidon
    fn compute_nullifier(env: &Env, proof: &Groth16Proof) -> BytesN<32> {
        let a_x = Self::bytes_to_field_element(env, &proof.a.x);
        let a_y = Self::bytes_to_field_element(env, &proof.a.y);
        let c_x = Self::bytes_to_field_element(env, &proof.c.x);
        let c_y = Self::bytes_to_field_element(env, &proof.c.y);

        let inputs = soroban_sdk::vec![env, a_x, a_y, c_x, c_y];
        let hash = poseidon_hash::<5, Bn254Fr>(env, &inputs);

        Self::field_element_to_bytes(env, &hash)
    }

    /// Check if G1 point is valid (non-zero)
    fn is_valid_g1_point(env: &Env, point: &G1Point) -> bool {
        let zero = BytesN::from_array(env, &[0u8; 32]);
        !(point.x == zero && point.y == zero)
    }

    /// Convert public inputs to field elements
    fn public_inputs_to_field_elements(
        env: &Env,
        inputs: &ZkLoginPublicInputs,
    ) -> Result<Vec<U256>, Error> {
        let mut result = Vec::new(env);

        result.push_back(Self::bytes_to_field_element(env, &inputs.eph_pk_hash));
        result.push_back(Self::u64_to_field_element(env, inputs.max_epoch));
        result.push_back(Self::bytes_to_field_element(env, &inputs.address_seed));
        result.push_back(Self::bytes_to_field_element(env, &inputs.iss_hash));
        result.push_back(Self::bytes_to_field_element(env, &inputs.jwk_modulus_hash));

        Ok(result)
    }

    /// Compute linear combination: IC[0] + Σ(input[i] * IC[i+1])
    fn compute_linear_combination(
        env: &Env,
        ic: &Vec<G1Point>,
        inputs: &Vec<U256>,
    ) -> Result<G1Point, Error> {
        // Start with IC[0]
        let mut result = ic.get(0).unwrap();

        // Add input[i] * IC[i+1] for each public input
        for i in 0..inputs.len() {
            let scalar = inputs.get(i).unwrap();
            let ic_point = ic.get(i + 1).unwrap();

            // Scalar multiplication: scalar * IC[i+1]
            let scaled = Self::g1_scalar_mul(env, &ic_point, &scalar);

            // Point addition: result + scaled
            result = Self::g1_add(env, &result, &scaled);
        }

        Ok(result)
    }

    /// BN254 G1 point addition using Protocol 25 host function
    fn g1_add(env: &Env, p1: &G1Point, p2: &G1Point) -> G1Point {
        // Use BN254 G1 addition host function (CAP-0074)
        let result = env.crypto().bn254_g1_add(
            soroban_sdk::Bytes::from_slice(env, &[
                &p1.x.to_array()[..],
                &p1.y.to_array()[..],
            ].concat()),
            soroban_sdk::Bytes::from_slice(env, &[
                &p2.x.to_array()[..],
                &p2.y.to_array()[..],
            ].concat()),
        );

        let result_bytes = result.to_alloc_vec();
        let mut x_arr = [0u8; 32];
        let mut y_arr = [0u8; 32];
        x_arr.copy_from_slice(&result_bytes[0..32]);
        y_arr.copy_from_slice(&result_bytes[32..64]);

        G1Point {
            x: BytesN::from_array(env, &x_arr),
            y: BytesN::from_array(env, &y_arr),
        }
    }

    /// BN254 G1 scalar multiplication using Protocol 25 host function
    fn g1_scalar_mul(env: &Env, point: &G1Point, scalar: &U256) -> G1Point {
        let scalar_bytes = scalar.to_be_bytes();
        let mut scalar_arr = [0u8; 32];
        for i in 0..32 {
            scalar_arr[i] = scalar_bytes.get(i as u32).unwrap();
        }

        // Use BN254 G1 multiplication host function (CAP-0074)
        let result = env.crypto().bn254_g1_mul(
            soroban_sdk::Bytes::from_slice(env, &[
                &point.x.to_array()[..],
                &point.y.to_array()[..],
            ].concat()),
            soroban_sdk::Bytes::from_slice(env, &scalar_arr),
        );

        let result_bytes = result.to_alloc_vec();
        let mut x_arr = [0u8; 32];
        let mut y_arr = [0u8; 32];
        x_arr.copy_from_slice(&result_bytes[0..32]);
        y_arr.copy_from_slice(&result_bytes[32..64]);

        G1Point {
            x: BytesN::from_array(env, &x_arr),
            y: BytesN::from_array(env, &y_arr),
        }
    }

    /// Verify Groth16 pairing equation using Protocol 25 multi-pairing
    ///
    /// Checks: e(-A, B) * e(α, β) * e(vk_x, γ) * e(C, δ) = 1
    fn verify_pairing(
        env: &Env,
        proof: &Groth16Proof,
        vk: &VerificationKey,
        vk_x: &G1Point,
    ) -> Result<bool, Error> {
        // Negate A for the pairing equation
        let neg_a = Self::g1_negate(env, &proof.a);

        // Prepare pairing inputs (4 pairs)
        let mut g1_points = Vec::new(env);
        let mut g2_points = Vec::new(env);

        // Pair 1: e(-A, B)
        g1_points.push_back(Self::g1_to_bytes(env, &neg_a));
        g2_points.push_back(Self::g2_to_bytes(env, &proof.b));

        // Pair 2: e(α, β)
        g1_points.push_back(Self::g1_to_bytes(env, &vk.alpha));
        g2_points.push_back(Self::g2_to_bytes(env, &vk.beta));

        // Pair 3: e(vk_x, γ)
        g1_points.push_back(Self::g1_to_bytes(env, vk_x));
        g2_points.push_back(Self::g2_to_bytes(env, &vk.gamma));

        // Pair 4: e(C, δ)
        g1_points.push_back(Self::g1_to_bytes(env, &proof.c));
        g2_points.push_back(Self::g2_to_bytes(env, &vk.delta));

        // Multi-pairing check (CAP-0074)
        // Returns true if product of pairings equals 1
        Ok(env.crypto().bn254_multi_pairing_check(g1_points, g2_points))
    }

    /// Negate G1 point (flip y coordinate in field)
    fn g1_negate(env: &Env, point: &G1Point) -> G1Point {
        // In BN254, negation is (x, -y mod p)
        // For field negation, we compute p - y
        let p = U256::from_be_bytes(env, &BytesN::from_array(env, &BN254_FR_MODULUS));
        let y = Self::bytes_to_field_element(env, &point.y);

        // -y = p - y (mod p)
        let neg_y = if y == U256::from_u32(env, 0) {
            y
        } else {
            p.sub(&y)
        };

        G1Point {
            x: point.x.clone(),
            y: Self::field_element_to_bytes(env, &neg_y),
        }
    }

    /// Convert G1 point to bytes for pairing function
    fn g1_to_bytes(env: &Env, point: &G1Point) -> soroban_sdk::Bytes {
        let mut result = soroban_sdk::Bytes::new(env);
        result.append(&soroban_sdk::Bytes::from_slice(env, &point.x.to_array()));
        result.append(&soroban_sdk::Bytes::from_slice(env, &point.y.to_array()));
        result
    }

    /// Convert G2 point to bytes for pairing function
    fn g2_to_bytes(env: &Env, point: &G2Point) -> soroban_sdk::Bytes {
        let mut result = soroban_sdk::Bytes::new(env);
        // G2 encoding: (x_c0, x_c1, y_c0, y_c1)
        result.append(&soroban_sdk::Bytes::from_slice(env, &point.x_c0.to_array()));
        result.append(&soroban_sdk::Bytes::from_slice(env, &point.x_c1.to_array()));
        result.append(&soroban_sdk::Bytes::from_slice(env, &point.y_c0.to_array()));
        result.append(&soroban_sdk::Bytes::from_slice(env, &point.y_c1.to_array()));
        result
    }

    /// Convert BytesN<32> to U256 field element
    fn bytes_to_field_element(env: &Env, bytes: &BytesN<32>) -> U256 {
        U256::from_be_bytes(env, bytes)
    }

    /// Convert u64 to U256 field element
    fn u64_to_field_element(env: &Env, val: u64) -> U256 {
        let mut bytes = [0u8; 32];
        bytes[24..32].copy_from_slice(&val.to_be_bytes());
        U256::from_be_bytes(env, &BytesN::from_array(env, &bytes))
    }

    /// Convert U256 field element to BytesN<32>
    fn field_element_to_bytes(env: &Env, fe: &U256) -> BytesN<32> {
        let bytes = fe.to_be_bytes();
        let mut arr = [0u8; 32];
        for i in 0..32 {
            arr[i] = bytes.get(i as u32).unwrap();
        }
        BytesN::from_array(env, &arr)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkVerifier);
        let client = ZkVerifierClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let vk = create_mock_vk(&env);

        env.mock_all_auths();
        client.initialize(&admin, &vk);

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

        // Nonce should be deterministic
        let nonce = client.compute_nonce(&eph_pk_high, &eph_pk_low, &max_epoch, &randomness);
        let nonce2 = client.compute_nonce(&eph_pk_high, &eph_pk_low, &max_epoch, &randomness);
        assert_eq!(nonce, nonce2);

        // Different inputs should produce different nonce
        let nonce3 = client.compute_nonce(&eph_pk_high, &eph_pk_low, &2000u64, &randomness);
        assert_ne!(nonce, nonce3);
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

        // Address seed should be deterministic
        let seed = client.compute_address_seed(&kc_name_hash, &kc_value_hash, &aud_hash, &salt);
        let seed2 = client.compute_address_seed(&kc_name_hash, &kc_value_hash, &aud_hash, &salt);
        assert_eq!(seed, seed2);

        // Different inputs should produce different seed
        let different_salt = BytesN::from_array(&env, &[5u8; 32]);
        let seed3 = client.compute_address_seed(&kc_name_hash, &kc_value_hash, &aud_hash, &different_salt);
        assert_ne!(seed, seed3);
    }

    #[test]
    fn test_compute_eph_pk_hash() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkVerifier);
        let client = ZkVerifierClient::new(&env, &contract_id);

        let high = BytesN::from_array(&env, &[1u8; 32]);
        let low = BytesN::from_array(&env, &[2u8; 32]);

        let hash = client.compute_eph_pk_hash(&high, &low);
        let hash2 = client.compute_eph_pk_hash(&high, &low);
        assert_eq!(hash, hash2);
    }

    fn create_mock_vk(env: &Env) -> VerificationKey {
        let zero_g1 = G1Point {
            x: BytesN::from_array(env, &[0u8; 32]),
            y: BytesN::from_array(env, &[0u8; 32]),
        };
        let zero_g2 = G2Point {
            x_c0: BytesN::from_array(env, &[0u8; 32]),
            x_c1: BytesN::from_array(env, &[0u8; 32]),
            y_c0: BytesN::from_array(env, &[0u8; 32]),
            y_c1: BytesN::from_array(env, &[0u8; 32]),
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
