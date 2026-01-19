//! # Gateway Factory Contract
//!
//! This contract deploys and manages zkLogin smart wallets with deterministic
//! addresses derived from OAuth identities.
//!
//! ## Features:
//! - Deterministic wallet address prediction before deployment
//! - CREATE2-style deployment with address_seed as salt
//! - Wallet registry for address lookups
//! - Configuration management for ZK verifier and JWK registry
//!
//! ## Address Derivation:
//! ```
//! address = Blake2b_256(0x05 || iss_len || iss || address_seed)
//! ```
//! where address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    symbol_short, Address, BytesN, Env, Symbol, Vec,
};

/// zkLogin address flag (matches Sui's 0x05 for zkLogin addresses)
const ZKLOGIN_FLAG: u8 = 0x05;

/// Factory configuration
#[contracttype]
#[derive(Clone, Debug)]
pub struct FactoryConfig {
    /// Administrator address
    pub admin: Address,
    /// WASM hash of smart wallet contract
    pub wallet_wasm_hash: BytesN<32>,
    /// ZK verifier contract address
    pub zk_verifier: Address,
    /// JWK registry contract address
    pub jwk_registry: Address,
    /// Total wallets deployed
    pub wallet_count: u64,
}

/// Wallet deployment record
#[contracttype]
#[derive(Clone, Debug)]
pub struct WalletRecord {
    /// Deployed wallet address
    pub wallet_address: Address,
    /// Address seed used for derivation
    pub address_seed: BytesN<32>,
    /// Issuer hash
    pub iss_hash: BytesN<32>,
    /// Ledger sequence when deployed
    pub deployed_at: u32,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    /// Factory configuration
    Config,
    /// Wallet by address seed: DataKey::Wallet(address_seed) -> WalletRecord
    Wallet(BytesN<32>),
    /// Wallet by address: DataKey::WalletByAddress(address) -> address_seed
    WalletByAddress(Address),
    /// Initialization flag
    Initialized,
}

/// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Factory already initialized
    AlreadyInitialized = 1,
    /// Factory not initialized
    NotInitialized = 2,
    /// Caller is not admin
    NotAdmin = 3,
    /// Wallet already exists for this address seed
    WalletAlreadyExists = 4,
    /// Wallet not found
    WalletNotFound = 5,
    /// Invalid WASM hash
    InvalidWasmHash = 6,
    /// Deployment failed
    DeploymentFailed = 7,
}

#[contract]
pub struct GatewayFactory;

#[contractimpl]
impl GatewayFactory {
    /// Initialize the Gateway Factory
    ///
    /// # Arguments
    /// * `admin` - Administrator address
    /// * `wallet_wasm_hash` - WASM hash of the smart wallet contract
    /// * `zk_verifier` - Address of ZK verifier contract
    /// * `jwk_registry` - Address of JWK registry contract
    pub fn initialize(
        env: Env,
        admin: Address,
        wallet_wasm_hash: BytesN<32>,
        zk_verifier: Address,
        jwk_registry: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        let config = FactoryConfig {
            admin,
            wallet_wasm_hash,
            zk_verifier,
            jwk_registry,
            wallet_count: 0,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Initialized, &true);

        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Predict wallet address before deployment
    ///
    /// This allows the frontend to show the user their wallet address
    /// before they complete the OAuth flow and generate a ZK proof.
    ///
    /// # Arguments
    /// * `iss_hash` - Hash of OAuth issuer
    /// * `address_seed` - Derived address seed from OAuth identity
    ///
    /// # Returns
    /// Predicted wallet contract address
    ///
    /// # Formula
    /// ```
    /// address = Blake2b_256(0x05 || iss_hash || address_seed)
    /// ```
    pub fn predict_address(
        env: Env,
        iss_hash: BytesN<32>,
        address_seed: BytesN<32>,
    ) -> Address {
        Self::compute_wallet_address(&env, &iss_hash, &address_seed)
    }

    /// Deploy a new zkLogin smart wallet
    ///
    /// # Arguments
    /// * `address_seed` - Derived from Poseidon(kc_name, kc_value, aud, salt_hash)
    /// * `iss_hash` - Hash of OAuth issuer
    ///
    /// # Returns
    /// Deployed wallet contract address
    ///
    /// # Note
    /// If wallet already exists, returns existing address without redeploying
    pub fn deploy_wallet(
        env: Env,
        address_seed: BytesN<32>,
        iss_hash: BytesN<32>,
    ) -> Result<Address, Error> {
        // Check if wallet already exists
        if let Some(record) = env.storage().persistent().get::<_, WalletRecord>(&DataKey::Wallet(address_seed.clone())) {
            return Ok(record.wallet_address);
        }

        let mut config = Self::get_config(&env)?;

        // Generate deterministic salt from address_seed
        let salt = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &address_seed.to_array()));

        // Deploy wallet contract
        let wallet_address = env.deployer()
            .with_current_contract(salt)
            .deploy(config.wallet_wasm_hash.clone());

        // Initialize the deployed wallet
        let init_args: Vec<soroban_sdk::Val> = soroban_sdk::vec![
            &env,
            address_seed.clone().into_val(&env),
            iss_hash.clone().into_val(&env),
            config.zk_verifier.clone().into_val(&env),
            config.jwk_registry.clone().into_val(&env),
        ];

        env.invoke_contract::<()>(
            &wallet_address,
            &Symbol::new(&env, "initialize"),
            init_args,
        );

        // Store wallet record
        let record = WalletRecord {
            wallet_address: wallet_address.clone(),
            address_seed: address_seed.clone(),
            iss_hash,
            deployed_at: env.ledger().sequence(),
        };

        env.storage().persistent().set(&DataKey::Wallet(address_seed.clone()), &record);
        env.storage().persistent().set(&DataKey::WalletByAddress(wallet_address.clone()), &address_seed);

        // Extend TTL (permanent storage)
        env.storage().persistent().extend_ttl(&DataKey::Wallet(address_seed), 3110400, 3110400);
        env.storage().persistent().extend_ttl(&DataKey::WalletByAddress(wallet_address.clone()), 3110400, 3110400);

        // Update wallet count
        config.wallet_count += 1;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(wallet_address)
    }

    /// Get wallet address by address seed
    pub fn get_wallet(env: Env, address_seed: BytesN<32>) -> Result<Address, Error> {
        let record: WalletRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Wallet(address_seed))
            .ok_or(Error::WalletNotFound)?;

        Ok(record.wallet_address)
    }

    /// Get wallet record by address seed
    pub fn get_wallet_record(env: Env, address_seed: BytesN<32>) -> Result<WalletRecord, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Wallet(address_seed))
            .ok_or(Error::WalletNotFound)
    }

    /// Get address seed by wallet address
    pub fn get_address_seed_by_wallet(env: Env, wallet_address: Address) -> Result<BytesN<32>, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::WalletByAddress(wallet_address))
            .ok_or(Error::WalletNotFound)
    }

    /// Check if a wallet exists for an address seed
    pub fn wallet_exists(env: Env, address_seed: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Wallet(address_seed))
    }

    /// Get total number of deployed wallets
    pub fn get_wallet_count(env: Env) -> Result<u64, Error> {
        let config = Self::get_config(&env)?;
        Ok(config.wallet_count)
    }

    /// Get factory configuration
    pub fn get_factory_config(env: Env) -> Result<FactoryConfig, Error> {
        Self::get_config(&env)
    }

    /// Update wallet WASM hash (admin only)
    ///
    /// # Note
    /// This only affects new deployments. Existing wallets remain unchanged.
    pub fn update_wallet_wasm(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        let mut config = Self::get_config(&env)?;
        config.admin.require_auth();

        config.wallet_wasm_hash = new_wasm_hash;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Update ZK verifier address (admin only)
    ///
    /// # Note
    /// This only affects new deployments. Existing wallets remain unchanged.
    pub fn update_zk_verifier(env: Env, new_zk_verifier: Address) -> Result<(), Error> {
        let mut config = Self::get_config(&env)?;
        config.admin.require_auth();

        config.zk_verifier = new_zk_verifier;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Update JWK registry address (admin only)
    ///
    /// # Note
    /// This only affects new deployments. Existing wallets remain unchanged.
    pub fn update_jwk_registry(env: Env, new_jwk_registry: Address) -> Result<(), Error> {
        let mut config = Self::get_config(&env)?;
        config.admin.require_auth();

        config.jwk_registry = new_jwk_registry;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Transfer admin role (admin only)
    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let mut config = Self::get_config(&env)?;
        config.admin.require_auth();

        config.admin = new_admin;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    // ==================== INTERNAL FUNCTIONS ====================

    fn get_config(env: &Env) -> Result<FactoryConfig, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(Error::NotInitialized)
    }

    /// Compute deterministic wallet address
    ///
    /// Uses Blake2b hash with zkLogin flag prefix
    fn compute_wallet_address(env: &Env, iss_hash: &BytesN<32>, address_seed: &BytesN<32>) -> Address {
        // Build preimage: 0x05 || iss_hash || address_seed
        let mut preimage = soroban_sdk::Bytes::new(env);
        preimage.push_back(ZKLOGIN_FLAG);
        preimage.append(&soroban_sdk::Bytes::from_slice(env, &iss_hash.to_array()));
        preimage.append(&soroban_sdk::Bytes::from_slice(env, &address_seed.to_array()));

        // Compute Blake2b hash (using SHA256 as placeholder for Blake2b)
        let hash = env.crypto().sha256(&preimage);

        // Convert to contract address
        Address::from_contract_id(&hash)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, GatewayFactory);
        let client = GatewayFactoryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let wasm_hash = BytesN::from_array(&env, &[1u8; 32]);
        let zk_verifier = Address::generate(&env);
        let jwk_registry = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin, &wasm_hash, &zk_verifier, &jwk_registry);

        let count = client.get_wallet_count();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_predict_address() {
        let env = Env::default();
        let contract_id = env.register_contract(None, GatewayFactory);
        let client = GatewayFactoryClient::new(&env, &contract_id);

        let iss_hash = BytesN::from_array(&env, &[1u8; 32]);
        let address_seed = BytesN::from_array(&env, &[2u8; 32]);

        // Predict address is deterministic
        let addr1 = client.predict_address(&iss_hash, &address_seed);
        let addr2 = client.predict_address(&iss_hash, &address_seed);
        assert_eq!(addr1, addr2);

        // Different seeds produce different addresses
        let different_seed = BytesN::from_array(&env, &[3u8; 32]);
        let addr3 = client.predict_address(&iss_hash, &different_seed);
        assert_ne!(addr1, addr3);
    }

    #[test]
    fn test_wallet_exists() {
        let env = Env::default();
        let contract_id = env.register_contract(None, GatewayFactory);
        let client = GatewayFactoryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let wasm_hash = BytesN::from_array(&env, &[1u8; 32]);
        let zk_verifier = Address::generate(&env);
        let jwk_registry = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin, &wasm_hash, &zk_verifier, &jwk_registry);

        let address_seed = BytesN::from_array(&env, &[2u8; 32]);

        // Wallet should not exist initially
        assert!(!client.wallet_exists(&address_seed));
    }
}
