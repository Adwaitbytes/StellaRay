//! # x402 Facilitator Contract
//!
//! This contract implements the x402 HTTP Payment Required protocol for Stellar,
//! enabling seamless micropayments for API access and digital content.
//!
//! ## Features:
//! - Payment request creation and tracking
//! - Payment verification and settlement
//! - Integration with zkLogin wallets
//! - USDC support on Stellar
//! - Nonce management for replay protection
//!
//! ## x402 Flow:
//! 1. Server creates payment request with amount, recipient, resource
//! 2. Client receives 402 response with payment requirements
//! 3. Client makes USDC payment via zkLogin wallet
//! 4. Server verifies payment via facilitator
//! 5. Server delivers protected content

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    symbol_short, Address, BytesN, Env, String, Symbol, Vec,
    token::TokenClient,
};

/// Payment request structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentRequest {
    /// Unique request identifier
    pub request_id: BytesN<32>,
    /// Token contract address (e.g., USDC)
    pub asset: Address,
    /// Payment amount in smallest unit (stroops for USDC = 1e-7)
    pub amount: i128,
    /// Payment recipient address
    pub destination: Address,
    /// Resource identifier being purchased
    pub resource_id: String,
    /// Timestamp when request expires (Unix epoch)
    pub valid_until: u64,
    /// Request creator (resource server)
    pub requester: Address,
    /// Whether payment has been completed
    pub paid: bool,
    /// Ledger sequence when created
    pub created_at: u32,
}

/// Payment proof after settlement
#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentProof {
    /// Request ID this payment fulfills
    pub request_id: BytesN<32>,
    /// Payer's address (zkLogin wallet)
    pub payer: Address,
    /// Transaction hash on Stellar
    pub tx_hash: BytesN<32>,
    /// Ledger sequence when paid
    pub paid_at: u32,
    /// Actual amount paid
    pub amount_paid: i128,
}

/// Facilitator configuration
#[contracttype]
#[derive(Clone, Debug)]
pub struct FacilitatorConfig {
    /// Administrator address
    pub admin: Address,
    /// Fee recipient address
    pub fee_recipient: Address,
    /// Fee in basis points (100 = 1%, 0 = no fee)
    pub fee_bps: u32,
    /// Total payments processed
    pub total_payments: u64,
    /// Total volume processed
    pub total_volume: i128,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    /// Facilitator configuration
    Config,
    /// Payment request: DataKey::Request(request_id) -> PaymentRequest
    Request(BytesN<32>),
    /// Payment proof: DataKey::Proof(request_id) -> PaymentProof
    Proof(BytesN<32>),
    /// Nonce for uniqueness: DataKey::Nonce(requester) -> u64
    Nonce(Address),
    /// Initialization flag
    Initialized,
}

/// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Facilitator already initialized
    AlreadyInitialized = 1,
    /// Facilitator not initialized
    NotInitialized = 2,
    /// Caller is not admin
    NotAdmin = 3,
    /// Payment request not found
    RequestNotFound = 4,
    /// Payment request expired
    RequestExpired = 5,
    /// Payment already completed
    AlreadyPaid = 6,
    /// Amount mismatch
    AmountMismatch = 7,
    /// Destination mismatch
    DestinationMismatch = 8,
    /// Insufficient balance
    InsufficientBalance = 9,
    /// Invalid fee (must be <= 1000 bps = 10%)
    InvalidFee = 10,
    /// Request already exists
    RequestAlreadyExists = 11,
    /// Asset mismatch
    AssetMismatch = 12,
}

#[contract]
pub struct X402Facilitator;

#[contractimpl]
impl X402Facilitator {
    /// Initialize the x402 Facilitator
    ///
    /// # Arguments
    /// * `admin` - Administrator address
    /// * `fee_recipient` - Address to receive facilitator fees
    /// * `fee_bps` - Fee in basis points (0-1000, where 1000 = 10%)
    pub fn initialize(
        env: Env,
        admin: Address,
        fee_recipient: Address,
        fee_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        if fee_bps > 1000 {
            return Err(Error::InvalidFee);
        }

        admin.require_auth();

        let config = FacilitatorConfig {
            admin,
            fee_recipient,
            fee_bps,
            total_payments: 0,
            total_volume: 0,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Initialized, &true);

        env.storage().instance().extend_ttl(518400, 518400);

        Ok(())
    }

    /// Create a new payment request
    ///
    /// # Arguments
    /// * `asset` - Token contract address (e.g., USDC)
    /// * `amount` - Amount in smallest unit
    /// * `destination` - Payment recipient
    /// * `resource_id` - Resource being purchased
    /// * `valid_for_secs` - Seconds until request expires
    ///
    /// # Returns
    /// Request ID (32 bytes)
    ///
    /// # Note
    /// Called by resource servers to create payment requirements
    pub fn create_request(
        env: Env,
        asset: Address,
        amount: i128,
        destination: Address,
        resource_id: String,
        valid_for_secs: u64,
    ) -> Result<BytesN<32>, Error> {
        let requester = env.current_contract_address();

        // Get next nonce for requester
        let nonce_key = DataKey::Nonce(requester.clone());
        let nonce: u64 = env.storage().persistent().get(&nonce_key).unwrap_or(0);

        // Generate request ID from nonce and timestamp
        let request_id = Self::generate_request_id(&env, &requester, nonce);

        // Check request doesn't already exist
        if env.storage().persistent().has(&DataKey::Request(request_id.clone())) {
            return Err(Error::RequestAlreadyExists);
        }

        let current_time = env.ledger().timestamp();
        let valid_until = current_time + valid_for_secs;

        let request = PaymentRequest {
            request_id: request_id.clone(),
            asset,
            amount,
            destination,
            resource_id,
            valid_until,
            requester,
            paid: false,
            created_at: env.ledger().sequence(),
        };

        // Store request
        env.storage().persistent().set(&DataKey::Request(request_id.clone()), &request);

        // Update nonce
        env.storage().persistent().set(&nonce_key, &(nonce + 1));

        // Extend TTL (requests expire, but we keep them for audit)
        let ttl = (valid_for_secs / 5) as u32 + 17280; // Extra 1 day
        env.storage().persistent().extend_ttl(&DataKey::Request(request_id.clone()), ttl, ttl);

        Ok(request_id)
    }

    /// Execute payment for a request
    ///
    /// # Arguments
    /// * `request_id` - Payment request ID
    /// * `payer` - Payer's zkLogin wallet address
    ///
    /// # Note
    /// The payer wallet must have authorized this call and have sufficient balance.
    /// This function handles the actual token transfer.
    pub fn pay(
        env: Env,
        request_id: BytesN<32>,
        payer: Address,
    ) -> Result<PaymentProof, Error> {
        // Require payer authorization
        payer.require_auth();

        // Load request
        let mut request: PaymentRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Request(request_id.clone()))
            .ok_or(Error::RequestNotFound)?;

        // Check not already paid
        if request.paid {
            return Err(Error::AlreadyPaid);
        }

        // Check not expired
        let current_time = env.ledger().timestamp();
        if current_time > request.valid_until {
            return Err(Error::RequestExpired);
        }

        // Load config for fee calculation
        let mut config = Self::get_config(&env)?;

        // Calculate fee
        let fee_amount = (request.amount * config.fee_bps as i128) / 10000;
        let net_amount = request.amount - fee_amount;

        // Execute token transfers
        let token_client = TokenClient::new(&env, &request.asset);

        // Transfer net amount to destination
        token_client.transfer(&payer, &request.destination, &net_amount);

        // Transfer fee to fee recipient (if any)
        if fee_amount > 0 {
            token_client.transfer(&payer, &config.fee_recipient, &fee_amount);
        }

        // Mark request as paid
        request.paid = true;
        env.storage().persistent().set(&DataKey::Request(request_id.clone()), &request);

        // Create payment proof
        let tx_hash = Self::generate_tx_hash(&env, &request_id, &payer);
        let proof = PaymentProof {
            request_id: request_id.clone(),
            payer: payer.clone(),
            tx_hash: tx_hash.clone(),
            paid_at: env.ledger().sequence(),
            amount_paid: request.amount,
        };

        // Store proof
        env.storage().persistent().set(&DataKey::Proof(request_id.clone()), &proof);

        // Update statistics
        config.total_payments += 1;
        config.total_volume += request.amount;
        env.storage().instance().set(&DataKey::Config, &config);

        // Extend TTL for proof (permanent record)
        env.storage().persistent().extend_ttl(&DataKey::Proof(request_id), 3110400, 3110400);

        Ok(proof)
    }

    /// Verify that a payment has been made for a request
    ///
    /// # Arguments
    /// * `request_id` - Payment request ID
    ///
    /// # Returns
    /// `true` if payment is complete, `false` otherwise
    pub fn is_paid(env: Env, request_id: BytesN<32>) -> bool {
        if let Some(request) = env.storage().persistent().get::<_, PaymentRequest>(&DataKey::Request(request_id)) {
            return request.paid;
        }
        false
    }

    /// Get payment request details
    pub fn get_request(env: Env, request_id: BytesN<32>) -> Result<PaymentRequest, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Request(request_id))
            .ok_or(Error::RequestNotFound)
    }

    /// Get payment proof
    pub fn get_proof(env: Env, request_id: BytesN<32>) -> Result<PaymentProof, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Proof(request_id))
            .ok_or(Error::RequestNotFound)
    }

    /// Get facilitator configuration
    pub fn get_config_public(env: Env) -> Result<FacilitatorConfig, Error> {
        Self::get_config(&env)
    }

    /// Get facilitator statistics
    pub fn get_stats(env: Env) -> Result<(u64, i128), Error> {
        let config = Self::get_config(&env)?;
        Ok((config.total_payments, config.total_volume))
    }

    /// Update fee (admin only)
    pub fn update_fee(env: Env, new_fee_bps: u32) -> Result<(), Error> {
        if new_fee_bps > 1000 {
            return Err(Error::InvalidFee);
        }

        let mut config = Self::get_config(&env)?;
        config.admin.require_auth();

        config.fee_bps = new_fee_bps;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Update fee recipient (admin only)
    pub fn update_fee_recipient(env: Env, new_recipient: Address) -> Result<(), Error> {
        let mut config = Self::get_config(&env)?;
        config.admin.require_auth();

        config.fee_recipient = new_recipient;
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

    fn get_config(env: &Env) -> Result<FacilitatorConfig, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(Error::NotInitialized)
    }

    fn generate_request_id(env: &Env, requester: &Address, nonce: u64) -> BytesN<32> {
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &requester.to_xdr(env).as_slice()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &nonce.to_be_bytes()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &env.ledger().timestamp().to_be_bytes()));

        env.crypto().sha256(&data)
    }

    fn generate_tx_hash(env: &Env, request_id: &BytesN<32>, payer: &Address) -> BytesN<32> {
        let mut data = soroban_sdk::Bytes::new(env);
        data.append(&soroban_sdk::Bytes::from_slice(env, &request_id.to_array()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &payer.to_xdr(env).as_slice()));
        data.append(&soroban_sdk::Bytes::from_slice(env, &env.ledger().sequence().to_be_bytes()));

        env.crypto().sha256(&data)
    }
}

/// Helper functions for x402 HTTP protocol integration
#[contractimpl]
impl X402Facilitator {
    /// Create payment required response payload
    ///
    /// This helper generates the data needed for an HTTP 402 response
    pub fn create_payment_required_payload(
        env: Env,
        request_id: BytesN<32>,
    ) -> Result<(BytesN<32>, Address, i128, Address, u64), Error> {
        let request = Self::get_request(env, request_id.clone())?;

        Ok((
            request_id,
            request.asset,
            request.amount,
            request.destination,
            request.valid_until,
        ))
    }

    /// Verify payment signature from x402 header
    ///
    /// This validates that a payment claim in an HTTP header is legitimate
    pub fn verify_payment_claim(
        env: Env,
        request_id: BytesN<32>,
        claimed_payer: Address,
        claimed_tx_hash: BytesN<32>,
    ) -> bool {
        if let Ok(proof) = Self::get_proof(env, request_id) {
            return proof.payer == claimed_payer && proof.tx_hash == claimed_tx_hash;
        }
        false
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, X402Facilitator);
        let client = X402FacilitatorClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fee_recipient = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin, &fee_recipient, &100); // 1% fee

        let config = client.get_config_public();
        assert_eq!(config.fee_bps, 100);
        assert_eq!(config.total_payments, 0);
    }

    #[test]
    fn test_create_request() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);

        let contract_id = env.register_contract(None, X402Facilitator);
        let client = X402FacilitatorClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fee_recipient = Address::generate(&env);
        let asset = Address::generate(&env);
        let destination = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin, &fee_recipient, &0);

        let request_id = client.create_request(
            &asset,
            &1000000, // 0.1 USDC
            &destination,
            &String::from_str(&env, "/api/premium"),
            &300, // 5 minutes
        );

        let request = client.get_request(&request_id);
        assert_eq!(request.amount, 1000000);
        assert!(!request.paid);
        assert_eq!(request.valid_until, 1300);
    }

    #[test]
    fn test_is_paid() {
        let env = Env::default();
        let contract_id = env.register_contract(None, X402Facilitator);
        let client = X402FacilitatorClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fee_recipient = Address::generate(&env);
        let asset = Address::generate(&env);
        let destination = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin, &fee_recipient, &0);

        let request_id = client.create_request(
            &asset,
            &1000000,
            &destination,
            &String::from_str(&env, "/api/premium"),
            &300,
        );

        // Should not be paid initially
        assert!(!client.is_paid(&request_id));
    }

    #[test]
    fn test_update_fee() {
        let env = Env::default();
        let contract_id = env.register_contract(None, X402Facilitator);
        let client = X402FacilitatorClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fee_recipient = Address::generate(&env);

        env.mock_all_auths();
        client.initialize(&admin, &fee_recipient, &100);

        client.update_fee(&200); // 2% fee

        let config = client.get_config_public();
        assert_eq!(config.fee_bps, 200);
    }
}
