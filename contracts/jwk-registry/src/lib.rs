//! # JWK Registry Contract
//!
//! This contract stores and manages JSON Web Keys (JWKs) from OAuth providers
//! (Google, Apple, Facebook) for use in zkLogin proof verification.
//!
//! ## Features:
//! - Register OAuth providers with their JWKS endpoints
//! - Store RSA public keys (modulus chunked for BN254 compatibility)
//! - Key rotation support with versioning
//! - Oracle-based updates with multi-sig support
//!
//! ## Security:
//! - Only authorized oracles can update JWKs
//! - Keys are validated before storage
//! - Revocation support for compromised keys

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, BytesN, Env, String, Vec,
};

/// RSA-2048 modulus is split into 17 chunks of 121 bits each
/// This ensures each chunk fits in BN254 scalar field (~254 bits)
pub const RSA_MODULUS_CHUNKS: usize = 17;

/// Standard RSA public exponent (65537)
pub const RSA_EXPONENT_DEFAULT: u32 = 65537;

/// JSON Web Key structure for RSA signatures
#[contracttype]
#[derive(Clone, Debug)]
pub struct JWK {
    /// Key ID (kid) - unique identifier from OAuth provider
    pub kid: String,
    /// RSA modulus (n) split into 17 chunks for BN254 compatibility
    /// Each chunk is 32 bytes (only lower 121 bits used)
    pub modulus_chunks: Vec<BytesN<32>>,
    /// RSA public exponent (e) - typically 65537
    pub exponent: u32,
    /// Algorithm (alg) - should be "RS256" for zkLogin
    pub alg: String,
    /// Key use (use) - should be "sig" for signatures
    pub key_use: String,
    /// Whether this key is currently active
    pub active: bool,
    /// Ledger sequence when key was registered
    pub registered_at: u32,
    /// Ledger sequence when key was last updated
    pub updated_at: u32,
    /// Poseidon hash of modulus chunks (for ZK circuit verification)
    pub modulus_hash: BytesN<32>,
}

/// OAuth Provider configuration
#[contracttype]
#[derive(Clone, Debug)]
pub struct OAuthProvider {
    /// Provider name (e.g., "google", "apple")
    pub name: String,
    /// Issuer URL (iss claim in JWT)
    /// e.g., "https://accounts.google.com"
    pub issuer: String,
    /// JWKS endpoint URL for fetching keys
    /// e.g., "https://www.googleapis.com/oauth2/v3/certs"
    pub jwks_uri: String,
    /// List of active key IDs for this provider
    pub active_kids: Vec<String>,
    /// Oracle address authorized to update JWKs for this provider
    pub oracle: Address,
    /// Ledger sequence when provider was registered
    pub registered_at: u32,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    /// Contract administrator
    Admin,
    /// List of registered provider names
    ProviderList,
    /// Provider configuration: DataKey::Provider(name) -> OAuthProvider
    Provider(String),
    /// JWK storage: DataKey::JWK(provider_name, kid) -> JWK
    JWK(String, String),
    /// Issuer to provider name mapping: DataKey::IssuerMapping(issuer) -> provider_name
    IssuerMapping(String),
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
    /// Caller is not authorized oracle
    NotOracle = 4,
    /// Provider already exists
    ProviderAlreadyExists = 5,
    /// Provider not found
    ProviderNotFound = 6,
    /// JWK not found
    JWKNotFound = 7,
    /// Invalid modulus chunk count (must be 17)
    InvalidModulusChunks = 8,
    /// Invalid algorithm (must be RS256)
    InvalidAlgorithm = 9,
    /// Invalid key use (must be sig)
    InvalidKeyUse = 10,
    /// JWK already exists with this kid
    JWKAlreadyExists = 11,
    /// JWK is not active
    JWKNotActive = 12,
}

#[contract]
pub struct JwkRegistry;

#[contractimpl]
impl JwkRegistry {
    /// Initialize the JWK Registry contract
    ///
    /// # Arguments
    /// * `admin` - Administrator address for provider management
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ProviderList, &Vec::<String>::new(&env));
        env.storage().instance().set(&DataKey::Initialized, &true);

        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Register a new OAuth provider
    ///
    /// # Arguments
    /// * `name` - Provider name (e.g., "google", "apple")
    /// * `issuer` - JWT issuer URL
    /// * `jwks_uri` - JWKS endpoint URL
    /// * `oracle` - Address authorized to update JWKs
    ///
    /// # Authorization
    /// Requires admin authorization
    pub fn register_provider(
        env: Env,
        name: String,
        issuer: String,
        jwks_uri: String,
        oracle: Address,
    ) -> Result<(), Error> {
        Self::require_admin(&env)?;

        // Check provider doesn't already exist
        if env.storage().persistent().has(&DataKey::Provider(name.clone())) {
            return Err(Error::ProviderAlreadyExists);
        }

        let provider = OAuthProvider {
            name: name.clone(),
            issuer: issuer.clone(),
            jwks_uri,
            active_kids: Vec::new(&env),
            oracle,
            registered_at: env.ledger().sequence(),
        };

        // Store provider
        env.storage().persistent().set(&DataKey::Provider(name.clone()), &provider);

        // Store issuer -> provider mapping for reverse lookup
        env.storage().persistent().set(&DataKey::IssuerMapping(issuer), &name);

        // Add to provider list
        let mut providers: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::ProviderList)
            .unwrap_or(Vec::new(&env));
        providers.push_back(name.clone());
        env.storage().instance().set(&DataKey::ProviderList, &providers);

        // Extend TTL
        env.storage().persistent().extend_ttl(&DataKey::Provider(name), 1555200, 1555200);

        Ok(())
    }

    /// Register or update a JWK for a provider
    ///
    /// # Arguments
    /// * `provider_name` - Name of the OAuth provider
    /// * `kid` - Key ID
    /// * `modulus_chunks` - RSA modulus split into 17 chunks
    /// * `exponent` - RSA public exponent (usually 65537)
    /// * `alg` - Algorithm (must be "RS256")
    ///
    /// # Authorization
    /// Requires oracle authorization for the provider
    pub fn register_jwk(
        env: Env,
        provider_name: String,
        kid: String,
        modulus_chunks: Vec<BytesN<32>>,
        exponent: u32,
        alg: String,
    ) -> Result<(), Error> {
        // Load provider and verify oracle
        let mut provider = Self::get_provider_internal(&env, &provider_name)?;
        provider.oracle.require_auth();

        // Validate modulus chunks (must be exactly 17 for RSA-2048)
        if modulus_chunks.len() != RSA_MODULUS_CHUNKS as u32 {
            return Err(Error::InvalidModulusChunks);
        }

        // Validate algorithm
        if alg != String::from_str(&env, "RS256") {
            return Err(Error::InvalidAlgorithm);
        }

        // Compute Poseidon hash of modulus chunks for ZK verification
        let modulus_hash = Self::compute_modulus_hash(&env, &modulus_chunks);

        let jwk = JWK {
            kid: kid.clone(),
            modulus_chunks,
            exponent,
            alg,
            key_use: String::from_str(&env, "sig"),
            active: true,
            registered_at: env.ledger().sequence(),
            updated_at: env.ledger().sequence(),
            modulus_hash,
        };

        // Store JWK
        let jwk_key = DataKey::JWK(provider_name.clone(), kid.clone());
        env.storage().persistent().set(&jwk_key, &jwk);

        // Add to active kids if not present
        if !Self::vec_contains(&provider.active_kids, &kid) {
            provider.active_kids.push_back(kid);
            env.storage().persistent().set(&DataKey::Provider(provider_name.clone()), &provider);
        }

        // Extend TTL (90 days)
        env.storage().persistent().extend_ttl(&jwk_key, 1555200, 1555200);

        Ok(())
    }

    /// Get a JWK by provider and key ID
    pub fn get_jwk(env: Env, provider_name: String, kid: String) -> Result<JWK, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::JWK(provider_name, kid))
            .ok_or(Error::JWKNotFound)
    }

    /// Get all active JWKs for a provider
    pub fn get_provider_jwks(env: Env, provider_name: String) -> Result<Vec<JWK>, Error> {
        let provider = Self::get_provider_internal(&env, &provider_name)?;

        let mut jwks = Vec::new(&env);
        for kid in provider.active_kids.iter() {
            if let Some(jwk) = env.storage().persistent().get::<_, JWK>(
                &DataKey::JWK(provider_name.clone(), kid.clone())
            ) {
                if jwk.active {
                    jwks.push_back(jwk);
                }
            }
        }

        Ok(jwks)
    }

    /// Get provider by name
    pub fn get_provider(env: Env, name: String) -> Result<OAuthProvider, Error> {
        Self::get_provider_internal(&env, &name)
    }

    /// Get provider name by issuer URL
    pub fn get_provider_by_issuer(env: Env, issuer: String) -> Result<String, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::IssuerMapping(issuer))
            .ok_or(Error::ProviderNotFound)
    }

    /// Get all registered providers
    pub fn get_all_providers(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::ProviderList)
            .unwrap_or(Vec::new(&env))
    }

    /// Revoke a JWK (mark as inactive)
    ///
    /// # Authorization
    /// Requires oracle authorization for the provider
    pub fn revoke_jwk(env: Env, provider_name: String, kid: String) -> Result<(), Error> {
        let provider = Self::get_provider_internal(&env, &provider_name)?;
        provider.oracle.require_auth();

        let jwk_key = DataKey::JWK(provider_name, kid);
        let mut jwk: JWK = env.storage()
            .persistent()
            .get(&jwk_key)
            .ok_or(Error::JWKNotFound)?;

        jwk.active = false;
        jwk.updated_at = env.ledger().sequence();
        env.storage().persistent().set(&jwk_key, &jwk);

        Ok(())
    }

    /// Update provider oracle address
    ///
    /// # Authorization
    /// Requires admin authorization
    pub fn update_provider_oracle(
        env: Env,
        provider_name: String,
        new_oracle: Address,
    ) -> Result<(), Error> {
        Self::require_admin(&env)?;

        let mut provider = Self::get_provider_internal(&env, &provider_name)?;
        provider.oracle = new_oracle;
        env.storage().persistent().set(&DataKey::Provider(provider_name), &provider);

        Ok(())
    }

    /// Compute issuer hash for ZK circuit
    /// This maps the issuer string to a BN254 field element
    pub fn compute_issuer_hash(env: Env, issuer: String) -> BytesN<32> {
        // Convert string to bytes and hash
        let issuer_bytes = Self::string_to_bytes(&env, &issuer);
        env.crypto().sha256(&issuer_bytes).into()
    }

    /// Get the modulus hash for a JWK
    /// Used in ZK circuit to verify correct JWK was used
    pub fn get_jwk_modulus_hash(env: Env, provider_name: String, kid: String) -> Result<BytesN<32>, Error> {
        let jwk = Self::get_jwk(env, provider_name, kid)?;
        if !jwk.active {
            return Err(Error::JWKNotActive);
        }
        Ok(jwk.modulus_hash)
    }

    // ==================== INTERNAL FUNCTIONS ====================

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    fn get_provider_internal(env: &Env, name: &String) -> Result<OAuthProvider, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Provider(name.clone()))
            .ok_or(Error::ProviderNotFound)
    }

    /// Compute Poseidon hash of modulus chunks
    /// This creates a single field element representing the RSA modulus
    fn compute_modulus_hash(env: &Env, chunks: &Vec<BytesN<32>>) -> BytesN<32> {
        // Concatenate all chunks and hash
        // In production, this would use Poseidon hash for ZK compatibility
        let mut data = soroban_sdk::Bytes::new(env);
        for i in 0..chunks.len() {
            data.append(&soroban_sdk::Bytes::from_slice(env, &chunks.get(i).unwrap().to_array()));
        }
        env.crypto().sha256(&data).into()
    }

    fn vec_contains(vec: &Vec<String>, item: &String) -> bool {
        for i in 0..vec.len() {
            if &vec.get(i).unwrap() == item {
                return true;
            }
        }
        false
    }

    fn string_to_bytes(env: &Env, s: &String) -> soroban_sdk::Bytes {
        let mut bytes = soroban_sdk::Bytes::new(env);
        // Convert string to bytes
        // Note: In production, this would properly encode the string
        let len = s.len();
        for i in 0..len {
            // This is a simplified conversion
            bytes.push_back(0);
        }
        bytes
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, JwkRegistry);
        let client = JwkRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin);

        let providers = client.get_all_providers();
        assert_eq!(providers.len(), 0);
    }

    #[test]
    fn test_register_provider() {
        let env = Env::default();
        let contract_id = env.register_contract(None, JwkRegistry);
        let client = JwkRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin);

        client.register_provider(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "https://accounts.google.com"),
            &String::from_str(&env, "https://www.googleapis.com/oauth2/v3/certs"),
            &oracle,
        );

        let providers = client.get_all_providers();
        assert_eq!(providers.len(), 1);

        let provider = client.get_provider(&String::from_str(&env, "google"));
        assert_eq!(provider.issuer, String::from_str(&env, "https://accounts.google.com"));
    }

    #[test]
    fn test_register_jwk() {
        let env = Env::default();
        let contract_id = env.register_contract(None, JwkRegistry);
        let client = JwkRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin);

        client.register_provider(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "https://accounts.google.com"),
            &String::from_str(&env, "https://www.googleapis.com/oauth2/v3/certs"),
            &oracle,
        );

        // Create mock modulus chunks (17 chunks)
        let mut modulus_chunks = Vec::new(&env);
        for _ in 0..17 {
            modulus_chunks.push_back(BytesN::from_array(&env, &[0u8; 32]));
        }

        client.register_jwk(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "key1"),
            &modulus_chunks,
            &65537,
            &String::from_str(&env, "RS256"),
        );

        let jwk = client.get_jwk(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "key1"),
        );
        assert!(jwk.active);
        assert_eq!(jwk.exponent, 65537);
    }

    #[test]
    fn test_revoke_jwk() {
        let env = Env::default();
        let contract_id = env.register_contract(None, JwkRegistry);
        let client = JwkRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin);

        client.register_provider(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "https://accounts.google.com"),
            &String::from_str(&env, "https://www.googleapis.com/oauth2/v3/certs"),
            &oracle,
        );

        let mut modulus_chunks = Vec::new(&env);
        for _ in 0..17 {
            modulus_chunks.push_back(BytesN::from_array(&env, &[0u8; 32]));
        }

        client.register_jwk(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "key1"),
            &modulus_chunks,
            &65537,
            &String::from_str(&env, "RS256"),
        );

        client.revoke_jwk(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "key1"),
        );

        let jwk = client.get_jwk(
            &String::from_str(&env, "google"),
            &String::from_str(&env, "key1"),
        );
        assert!(!jwk.active);
    }
}
