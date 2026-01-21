//! # Stellar zkLogin ZK Verifier Contract
//!
//! This contract implements Groth16 proof verification for zkLogin authentication.
//! Currently a simplified version - full BN254 pairing support will be added in Protocol 25.
//!
//! ## Key Features:
//! - Proof structure validation
//! - Nullifier tracking for replay protection
//! - Verification key management
//! - Session expiration checking

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, BytesN, Env, Vec,
};

/// G1 point on curve (64 bytes: x || y)
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct G1Point {
    pub x: BytesN<32>,
    pub y: BytesN<32>,
}

/// G2 point on curve (128 bytes)
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct G2Point {
    pub x_c1: BytesN<32>,
    pub x_c0: BytesN<32>,
    pub y_c1: BytesN<32>,
    pub y_c0: BytesN<32>,
}

/// Groth16 proof structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct Groth16Proof {
    pub a: G1Point,
    pub b: G2Point,
    pub c: G1Point,
}

/// Verification key for Groth16 proofs
#[contracttype]
#[derive(Clone, Debug)]
pub struct VerificationKey {
    pub alpha: G1Point,
    pub beta: G2Point,
    pub gamma: G2Point,
    pub delta: G2Point,
    pub ic: Vec<G1Point>,
}

/// zkLogin public inputs
#[contracttype]
#[derive(Clone, Debug)]
pub struct ZkLoginPublicInputs {
    pub eph_pk_hash: BytesN<32>,
    pub max_epoch: u64,
    pub address_seed: BytesN<32>,
    pub iss_hash: BytesN<32>,
    pub jwk_modulus_hash: BytesN<32>,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    Admin,
    VerificationKey,
    Nullifier(BytesN<32>),
    Initialized,
}

/// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    InvalidVerificationKey = 4,
    InvalidProof = 5,
    VerificationFailed = 6,
    ProofAlreadyUsed = 7,
    InvalidPublicInputsCount = 8,
    SessionExpired = 9,
}

#[contract]
pub struct ZkVerifier;

#[contractimpl]
impl ZkVerifier {
    /// Initialize the ZK verifier contract
    pub fn initialize(env: Env, admin: Address, vk: VerificationKey) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        // zkLogin has 5 public inputs, so IC should have 6 elements
        if vk.ic.len() != 6 {
            return Err(Error::InvalidVerificationKey);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VerificationKey, &vk);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Verify a zkLogin proof
    /// Note: Full Groth16 pairing verification will be added in Protocol 25.
    /// Currently validates structure and prevents replay attacks.
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

        // Compute nullifier from proof
        let nullifier = Self::compute_nullifier(&env, &proof);

        // Check nullifier hasn't been used
        if env.storage().persistent().has(&DataKey::Nullifier(nullifier.clone())) {
            return Err(Error::ProofAlreadyUsed);
        }

        // Validate proof structure (non-zero points)
        let zero = BytesN::from_array(&env, &[0u8; 32]);
        if proof.a.x == zero && proof.a.y == zero {
            return Err(Error::InvalidProof);
        }

        // Record nullifier to prevent replay
        env.storage().persistent().set(&DataKey::Nullifier(nullifier.clone()), &true);
        env.storage().persistent().extend_ttl(&DataKey::Nullifier(nullifier), 3110400, 3110400);

        // Return true - full verification in Protocol 25
        Ok(true)
    }

    /// Compute nonce for session binding
    pub fn compute_nonce(
        env: Env,
        eph_pk_high: BytesN<32>,
        eph_pk_low: BytesN<32>,
        max_epoch: u64,
        randomness: BytesN<32>,
    ) -> BytesN<32> {
        let max_epoch_bytes = Self::u64_to_bytes32(&env, max_epoch);
        Self::hash_4(&env, &eph_pk_high, &eph_pk_low, &max_epoch_bytes, &randomness)
    }

    /// Compute address seed from OAuth identity
    pub fn compute_address_seed(
        env: Env,
        kc_name_hash: BytesN<32>,
        kc_value_hash: BytesN<32>,
        aud_hash: BytesN<32>,
        salt: BytesN<32>,
    ) -> BytesN<32> {
        let salt_hash = Self::hash_1(&env, &salt);
        Self::hash_4(&env, &kc_name_hash, &kc_value_hash, &aud_hash, &salt_hash)
    }

    /// Compute ephemeral public key hash
    pub fn compute_eph_pk_hash(
        env: Env,
        eph_pk_high: BytesN<32>,
        eph_pk_low: BytesN<32>,
    ) -> BytesN<32> {
        Self::hash_2(&env, &eph_pk_high, &eph_pk_low)
    }

    /// Update verification key (admin only)
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

    // === Internal Functions ===

    fn compute_nullifier(env: &Env, proof: &Groth16Proof) -> BytesN<32> {
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.a.x.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.a.y.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.c.x.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &proof.c.y.to_array()));
        env.crypto().sha256(&data).into()
    }

    fn u64_to_bytes32(env: &Env, val: u64) -> BytesN<32> {
        let mut bytes = [0u8; 32];
        bytes[24..32].copy_from_slice(&val.to_be_bytes());
        BytesN::from_array(env, &bytes)
    }

    fn hash_1(env: &Env, a: &BytesN<32>) -> BytesN<32> {
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &[0u8; 32]));
        data.append(&soroban_sdk::Bytes::from_slice(env, &a.to_array()));
        env.crypto().sha256(&data).into()
    }

    fn hash_2(env: &Env, a: &BytesN<32>, b: &BytesN<32>) -> BytesN<32> {
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &a.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &b.to_array()));
        env.crypto().sha256(&data).into()
    }

    fn hash_4(env: &Env, a: &BytesN<32>, b: &BytesN<32>, c: &BytesN<32>, d: &BytesN<32>) -> BytesN<32> {
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &a.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &b.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &c.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &d.to_array()));
        env.crypto().sha256(&data).into()
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

        let nonce = client.compute_nonce(&eph_pk_high, &eph_pk_low, &max_epoch, &randomness);
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
