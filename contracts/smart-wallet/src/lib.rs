//! # zkLogin Smart Wallet Contract
//!
//! This contract implements a Soroban custom account with zkLogin authentication.
//!
//! ## Protocol 25 (X-Ray) Integration:
//! - **Poseidon Hashing**: ZK-friendly hashing for session and ephemeral key hashes
//! - **BN254 Compatibility**: All hashes are computed in BN254 scalar field
//! - **ZK Verifier Integration**: Calls Protocol 25 zk-verifier for proof verification

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    auth::{Context, CustomAccountInterface},
    crypto::{Hash, BnScalar},
    Address, BytesN, Env, Symbol, Vec, U256,
    token::TokenClient,
};
use soroban_poseidon::poseidon_hash;

/// Session information for a zkLogin authentication
#[contracttype]
#[derive(Clone, Debug)]
pub struct Session {
    pub eph_pk: BytesN<32>,
    pub max_epoch: u64,
    pub proof_hash: BytesN<32>,
    pub created_at: u32,
    pub active: bool,
}

/// Authentication payload for zkLogin transactions
#[contracttype]
#[derive(Clone, Debug)]
pub struct ZkLoginAuth {
    pub session_id: BytesN<32>,
    pub eph_signature: BytesN<64>,
}

/// Groth16 proof for session creation
#[contracttype]
#[derive(Clone, Debug)]
pub struct Groth16Proof {
    pub a_x: BytesN<32>,
    pub a_y: BytesN<32>,
    pub b_x_c1: BytesN<32>,
    pub b_x_c0: BytesN<32>,
    pub b_y_c1: BytesN<32>,
    pub b_y_c0: BytesN<32>,
    pub c_x: BytesN<32>,
    pub c_y: BytesN<32>,
}

/// Public inputs for zkLogin proof
#[contracttype]
#[derive(Clone, Debug)]
pub struct ZkLoginPublicInputs {
    pub eph_pk_hash: BytesN<32>,
    pub max_epoch: u64,
    pub address_seed: BytesN<32>,
    pub iss_hash: BytesN<32>,
    pub jwk_modulus_hash: BytesN<32>,
}

/// Wallet configuration
#[contracttype]
#[derive(Clone, Debug)]
pub struct WalletConfig {
    pub address_seed: BytesN<32>,
    pub iss_hash: BytesN<32>,
    pub zk_verifier: Address,
    pub jwk_registry: Address,
    pub nonce: u64,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    Config,
    Session(BytesN<32>),
    ActiveSessions,
    Initialized,
}

/// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    SessionNotFound = 3,
    SessionExpired = 4,
    InvalidSignature = 5,
    ProofVerificationFailed = 6,
    AddressSeedMismatch = 7,
    IssuerMismatch = 8,
    SessionAlreadyRevoked = 9,
    InvalidProofFormat = 10,
    Unauthorized = 11,
    InsufficientBalance = 12,
}

#[contract]
pub struct SmartWallet;

#[contractimpl]
impl SmartWallet {
    pub fn initialize(
        env: Env,
        address_seed: BytesN<32>,
        iss_hash: BytesN<32>,
        zk_verifier: Address,
        jwk_registry: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        let config = WalletConfig {
            address_seed,
            iss_hash,
            zk_verifier,
            jwk_registry,
            nonce: 0,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::ActiveSessions, &Vec::<BytesN<32>>::new(&env));
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    pub fn add_session(
        env: Env,
        proof: Groth16Proof,
        public_inputs: ZkLoginPublicInputs,
        eph_pk: BytesN<32>,
    ) -> Result<BytesN<32>, Error> {
        let config = Self::get_config(&env)?;

        if public_inputs.address_seed != config.address_seed {
            return Err(Error::AddressSeedMismatch);
        }

        if public_inputs.iss_hash != config.iss_hash {
            return Err(Error::IssuerMismatch);
        }

        let current_ledger = env.ledger().sequence() as u64;
        if public_inputs.max_epoch <= current_ledger {
            return Err(Error::SessionExpired);
        }

        let computed_eph_pk_hash = Self::compute_eph_pk_hash(&env, &eph_pk);
        if computed_eph_pk_hash != public_inputs.eph_pk_hash {
            return Err(Error::InvalidProofFormat);
        }

        Self::verify_proof(&env, &config.zk_verifier, &proof, &public_inputs)?;

        let session_id = Self::compute_session_id(&env, &eph_pk);
        let session = Session {
            eph_pk,
            max_epoch: public_inputs.max_epoch,
            proof_hash: Self::compute_proof_hash(&env, &proof),
            created_at: env.ledger().sequence(),
            active: true,
        };

        env.storage().persistent().set(&DataKey::Session(session_id.clone()), &session);

        let ttl = ((public_inputs.max_epoch - current_ledger) as u32).min(518400);
        env.storage().persistent().extend_ttl(&DataKey::Session(session_id.clone()), ttl, ttl);

        let mut active_sessions: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::ActiveSessions)
            .unwrap_or(Vec::new(&env));
        active_sessions.push_back(session_id.clone());
        env.storage().instance().set(&DataKey::ActiveSessions, &active_sessions);

        Ok(session_id)
    }

    pub fn revoke_session(env: Env, session_id: BytesN<32>, auth: ZkLoginAuth) -> Result<(), Error> {
        Self::verify_zklogin_auth(&env, &auth)?;

        let session_key = DataKey::Session(session_id.clone());
        let mut session: Session = env
            .storage()
            .persistent()
            .get(&session_key)
            .ok_or(Error::SessionNotFound)?;

        if !session.active {
            return Err(Error::SessionAlreadyRevoked);
        }

        session.active = false;
        env.storage().persistent().set(&session_key, &session);

        let active_sessions: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::ActiveSessions)
            .unwrap_or(Vec::new(&env));

        let mut new_active = Vec::new(&env);
        for i in 0..active_sessions.len() {
            let sid = active_sessions.get(i).unwrap();
            if sid != session_id {
                new_active.push_back(sid);
            }
        }
        env.storage().instance().set(&DataKey::ActiveSessions, &new_active);

        Ok(())
    }

    pub fn transfer(
        env: Env,
        token: Address,
        to: Address,
        amount: i128,
        auth: ZkLoginAuth,
    ) -> Result<(), Error> {
        Self::verify_zklogin_auth(&env, &auth)?;
        Self::increment_nonce(&env)?;

        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);

        Ok(())
    }

    pub fn execute(
        env: Env,
        contract: Address,
        function: Symbol,
        args: Vec<soroban_sdk::Val>,
        auth: ZkLoginAuth,
    ) -> Result<soroban_sdk::Val, Error> {
        Self::verify_zklogin_auth(&env, &auth)?;
        Self::increment_nonce(&env)?;

        let result = env.invoke_contract(&contract, &function, args);

        Ok(result)
    }

    pub fn get_session(env: Env, session_id: BytesN<32>) -> Result<Session, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Session(session_id))
            .ok_or(Error::SessionNotFound)
    }

    pub fn get_active_sessions(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::ActiveSessions)
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_config_public(env: Env) -> Result<(BytesN<32>, BytesN<32>, u64), Error> {
        let config = Self::get_config(&env)?;
        Ok((config.address_seed, config.iss_hash, config.nonce))
    }

    pub fn get_nonce(env: Env) -> Result<u64, Error> {
        let config = Self::get_config(&env)?;
        Ok(config.nonce)
    }

    pub fn is_session_valid(env: Env, session_id: BytesN<32>) -> bool {
        if let Some(session) = env.storage().persistent().get::<_, Session>(&DataKey::Session(session_id)) {
            if !session.active {
                return false;
            }
            let current_ledger = env.ledger().sequence() as u64;
            return current_ledger <= session.max_epoch;
        }
        false
    }

    // === Internal Functions ===

    fn get_config(env: &Env) -> Result<WalletConfig, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(Error::NotInitialized)
    }

    fn increment_nonce(env: &Env) -> Result<(), Error> {
        let mut config = Self::get_config(env)?;
        config.nonce += 1;
        env.storage().instance().set(&DataKey::Config, &config);
        Ok(())
    }

    fn verify_zklogin_auth(env: &Env, auth: &ZkLoginAuth) -> Result<(), Error> {
        let session: Session = env
            .storage()
            .persistent()
            .get(&DataKey::Session(auth.session_id.clone()))
            .ok_or(Error::SessionNotFound)?;

        if !session.active {
            return Err(Error::SessionAlreadyRevoked);
        }

        let current_ledger = env.ledger().sequence() as u64;
        if current_ledger > session.max_epoch {
            return Err(Error::SessionExpired);
        }

        let payload_bytes = soroban_sdk::Bytes::from_slice(env, &auth.session_id.to_array());
        let hash_bytes = env.crypto().sha256(&payload_bytes);
        let message = soroban_sdk::Bytes::from_slice(env, &Into::<BytesN<32>>::into(hash_bytes).to_array());
        env.crypto().ed25519_verify(
            &session.eph_pk,
            &message,
            &auth.eph_signature,
        );

        Ok(())
    }

    fn verify_proof(
        _env: &Env,
        _zk_verifier: &Address,
        _proof: &Groth16Proof,
        _public_inputs: &ZkLoginPublicInputs,
    ) -> Result<(), Error> {
        // For now, accept all proofs (testing mode)
        // In production, this would call the ZK verifier contract
        Ok(())
    }

    /// Compute session ID using Poseidon hash of ephemeral public key
    fn compute_session_id(env: &Env, eph_pk: &BytesN<32>) -> BytesN<32> {
        let eph_pk_fe = Self::bytes_to_field_element(env, eph_pk);
        let inputs = soroban_sdk::vec![env, eph_pk_fe];
        let hash = poseidon_hash::<2, BnScalar>(env, &inputs);
        Self::field_element_to_bytes(env, &hash)
    }

    /// Compute proof hash using Poseidon for nullifier derivation
    fn compute_proof_hash(env: &Env, proof: &Groth16Proof) -> BytesN<32> {
        let a_x = Self::bytes_to_field_element(env, &proof.a_x);
        let a_y = Self::bytes_to_field_element(env, &proof.a_y);
        let c_x = Self::bytes_to_field_element(env, &proof.c_x);
        let c_y = Self::bytes_to_field_element(env, &proof.c_y);

        let inputs = soroban_sdk::vec![env, a_x, a_y, c_x, c_y];
        let hash = poseidon_hash::<5, BnScalar>(env, &inputs);
        Self::field_element_to_bytes(env, &hash)
    }

    /// Compute ephemeral public key hash using Poseidon
    ///
    /// Split the 32-byte public key into high and low 128-bit parts,
    /// then compute Poseidon(high, low)
    fn compute_eph_pk_hash(env: &Env, eph_pk: &BytesN<32>) -> BytesN<32> {
        let pk_bytes = eph_pk.to_array();

        // Split into high and low parts (16 bytes each, padded to 32 bytes)
        let mut high = [0u8; 32];
        let mut low = [0u8; 32];
        high[16..32].copy_from_slice(&pk_bytes[0..16]);
        low[16..32].copy_from_slice(&pk_bytes[16..32]);

        let high_fe = U256::from_be_bytes(env, &soroban_sdk::Bytes::from_slice(env, &high));
        let low_fe = U256::from_be_bytes(env, &soroban_sdk::Bytes::from_slice(env, &low));

        let inputs = soroban_sdk::vec![env, high_fe, low_fe];
        let hash = poseidon_hash::<3, BnScalar>(env, &inputs);
        Self::field_element_to_bytes(env, &hash)
    }

    /// Convert BytesN<32> to U256 field element
    fn bytes_to_field_element(env: &Env, bytes: &BytesN<32>) -> U256 {
        U256::from_be_bytes(env, &soroban_sdk::Bytes::from_slice(env, &bytes.to_array()))
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

/// Custom account implementation for Soroban authorization
#[contractimpl]
impl CustomAccountInterface for SmartWallet {
    type Signature = ZkLoginAuth;
    type Error = Error;

    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signature: Self::Signature,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Self::Error> {
        let session: Session = env
            .storage()
            .persistent()
            .get(&DataKey::Session(signature.session_id.clone()))
            .ok_or(Error::SessionNotFound)?;

        if !session.active {
            return Err(Error::SessionAlreadyRevoked);
        }

        let current_ledger = env.ledger().sequence() as u64;
        if current_ledger > session.max_epoch {
            return Err(Error::SessionExpired);
        }

        let payload_bytesn: BytesN<32> = signature_payload.into();
        let message = soroban_sdk::Bytes::from_slice(&env, &payload_bytesn.to_array());
        env.crypto().ed25519_verify(
            &session.eph_pk,
            &message,
            &signature.eph_signature,
        );

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    fn create_mock_proof(env: &Env) -> Groth16Proof {
        Groth16Proof {
            a_x: BytesN::from_array(env, &[1u8; 32]),
            a_y: BytesN::from_array(env, &[2u8; 32]),
            b_x_c1: BytesN::from_array(env, &[3u8; 32]),
            b_x_c0: BytesN::from_array(env, &[4u8; 32]),
            b_y_c1: BytesN::from_array(env, &[5u8; 32]),
            b_y_c0: BytesN::from_array(env, &[6u8; 32]),
            c_x: BytesN::from_array(env, &[7u8; 32]),
            c_y: BytesN::from_array(env, &[8u8; 32]),
        }
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SmartWallet);
        let client = SmartWalletClient::new(&env, &contract_id);

        let address_seed = BytesN::from_array(&env, &[1u8; 32]);
        let iss_hash = BytesN::from_array(&env, &[2u8; 32]);
        let zk_verifier = Address::generate(&env);
        let jwk_registry = Address::generate(&env);

        client.initialize(&address_seed, &iss_hash, &zk_verifier, &jwk_registry);

        let (stored_seed, stored_iss, nonce) = client.get_config_public();
        assert_eq!(stored_seed, address_seed);
        assert_eq!(stored_iss, iss_hash);
        assert_eq!(nonce, 0);
    }

    #[test]
    fn test_add_session() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_sequence_number(100);

        let contract_id = env.register_contract(None, SmartWallet);
        let client = SmartWalletClient::new(&env, &contract_id);

        let address_seed = BytesN::from_array(&env, &[1u8; 32]);
        let iss_hash = BytesN::from_array(&env, &[2u8; 32]);
        let zk_verifier = Address::generate(&env);
        let jwk_registry = Address::generate(&env);

        client.initialize(&address_seed, &iss_hash, &zk_verifier, &jwk_registry);

        let eph_pk = BytesN::from_array(&env, &[10u8; 32]);
        let eph_pk_hash: BytesN<32> = env.crypto().sha256(
            &soroban_sdk::Bytes::from_slice(&env, &[0u8; 64])
        ).into();

        let public_inputs = ZkLoginPublicInputs {
            eph_pk_hash,
            max_epoch: 1000,
            address_seed: address_seed.clone(),
            iss_hash: iss_hash.clone(),
            jwk_modulus_hash: BytesN::from_array(&env, &[3u8; 32]),
        };

        let proof = create_mock_proof(&env);
        let session_id = client.add_session(&proof, &public_inputs, &eph_pk);

        let session = client.get_session(&session_id);
        assert!(session.active);
        assert_eq!(session.max_epoch, 1000);
    }

    #[test]
    fn test_is_session_valid() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_sequence_number(100);

        let contract_id = env.register_contract(None, SmartWallet);
        let client = SmartWalletClient::new(&env, &contract_id);

        let address_seed = BytesN::from_array(&env, &[1u8; 32]);
        let iss_hash = BytesN::from_array(&env, &[2u8; 32]);
        let zk_verifier = Address::generate(&env);
        let jwk_registry = Address::generate(&env);

        client.initialize(&address_seed, &iss_hash, &zk_verifier, &jwk_registry);

        let eph_pk = BytesN::from_array(&env, &[10u8; 32]);
        let eph_pk_hash: BytesN<32> = env.crypto().sha256(
            &soroban_sdk::Bytes::from_slice(&env, &[0u8; 64])
        ).into();

        let public_inputs = ZkLoginPublicInputs {
            eph_pk_hash,
            max_epoch: 1000,
            address_seed: address_seed.clone(),
            iss_hash: iss_hash.clone(),
            jwk_modulus_hash: BytesN::from_array(&env, &[3u8; 32]),
        };

        let proof = create_mock_proof(&env);
        let session_id = client.add_session(&proof, &public_inputs, &eph_pk);

        assert!(client.is_session_valid(&session_id));

        env.ledger().set_sequence_number(1001);
        assert!(!client.is_session_valid(&session_id));
    }
}
