// ZK Multi-Custody Wallet Contract
// Multiple OAuth identities control one wallet with K-of-N threshold

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, vec, Bytes, BytesN, Env, Symbol, Vec,
};

/// Identity commitment (Poseidon hash of OAuth provider + sub)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Guardian {
    pub commitment: BytesN<32>,  // Poseidon(iss || sub)
    pub label: Bytes,            // Human-readable label
    pub added_at: u64,           // Timestamp
    pub active: bool,            // Can be deactivated
}

/// Wallet configuration
#[contracttype]
#[derive(Clone, Debug)]
pub struct MultiCustodyConfig {
    pub guardians: Vec<Guardian>,
    pub threshold: u32,           // K in K-of-N
    pub nonce: u64,              // For replay protection
    pub created_at: u64,
    pub timelock_seconds: Option<u64>,  // Optional timelock for large txs
    pub timelock_threshold: Option<i128>, // Amount that triggers timelock
}

/// ZK Proof structure (Groth16)
#[contracttype]
#[derive(Clone, Debug)]
pub struct ZkProof {
    pub proof_a: (BytesN<32>, BytesN<32>),
    pub proof_b: ((BytesN<32>, BytesN<32>), (BytesN<32>, BytesN<32>)),
    pub proof_c: (BytesN<32>, BytesN<32>),
    pub public_inputs: Vec<BytesN<32>>,
}

/// Collected proof for a pending transaction
#[contracttype]
#[derive(Clone, Debug)]
pub struct CollectedProof {
    pub proof: ZkProof,
    pub commitment_index: u32,   // Which guardian approved
    pub nullifier: BytesN<32>,   // Prevents double-submission
    pub submitted_at: u64,
}

/// Transaction status
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TxStatus {
    PendingApprovals,
    TimelockPending,
    ReadyToExecute,
    Executed,
    Cancelled,
    Expired,
}

/// Pending transaction awaiting approvals
#[contracttype]
#[derive(Clone, Debug)]
pub struct PendingTransaction {
    pub tx_id: BytesN<32>,
    pub transaction_type: Symbol,  // "transfer", "execute", etc.
    pub transaction_data: Bytes,   // Serialized transaction
    pub collected_proofs: Vec<CollectedProof>,
    pub expires_at: u64,
    pub executable_at: Option<u64>, // For timelocked txs
    pub status: TxStatus,
    pub created_at: u64,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    Config,
    PendingTx(BytesN<32>),
    PendingTxList,
    ProofNullifier(BytesN<32>), // Track used nullifiers
}

#[contract]
pub struct ZkMultiCustodyContract;

#[contractimpl]
impl ZkMultiCustodyContract {
    /// Initialize a new multi-custody wallet
    pub fn initialize(
        env: Env,
        guardians: Vec<Guardian>,
        threshold: u32,
        timelock_seconds: Option<u64>,
        timelock_threshold: Option<i128>,
        creator_proof: ZkProof,
    ) -> Result<(), Error> {
        // Validate inputs
        if threshold == 0 || threshold > guardians.len() {
            return Err(Error::InvalidThreshold);
        }

        if guardians.len() < 2 {
            return Err(Error::InsufficientGuardians);
        }

        // Verify creator proof is valid for one of the guardians
        let creator_commitment = Self::extract_commitment_from_proof(&creator_proof)?;
        let mut valid_creator = false;
        for guardian in guardians.iter() {
            if guardian.commitment == creator_commitment {
                valid_creator = true;
                break;
            }
        }

        if !valid_creator {
            return Err(Error::CreatorNotInGuardians);
        }

        // Store configuration
        let config = MultiCustodyConfig {
            guardians,
            threshold,
            nonce: 0,
            created_at: env.ledger().timestamp(),
            timelock_seconds,
            timelock_threshold,
        };

        env.storage().persistent().set(&DataKey::Config, &config);

        // Initialize empty pending tx list
        let pending_list: Vec<BytesN<32>> = vec![&env];
        env.storage()
            .persistent()
            .set(&DataKey::PendingTxList, &pending_list);

        Ok(())
    }

    /// Initiate a new transaction (requires 1 ZK proof to start)
    pub fn initiate_transaction(
        env: Env,
        transaction_type: Symbol,
        transaction_data: Bytes,
        initiator_proof: ZkProof,
        expiry_seconds: u64,
    ) -> Result<BytesN<32>, Error> {
        let mut config: MultiCustodyConfig = env
            .storage()
            .persistent()
            .get(&DataKey::Config)
            .ok_or(Error::NotInitialized)?;

        // Verify initiator proof
        let commitment = Self::verify_and_extract_commitment(&env, &initiator_proof, &config)?;

        // Find guardian index
        let mut guardian_index = None;
        for (i, guardian) in config.guardians.iter().enumerate() {
            if guardian.commitment == commitment && guardian.active {
                guardian_index = Some(i as u32);
                break;
            }
        }

        let guardian_index = guardian_index.ok_or(Error::GuardianNotFound)?;

        // Generate transaction ID
        let tx_id = Self::generate_tx_id(&env, &transaction_data, config.nonce);
        config.nonce += 1;
        env.storage().persistent().set(&DataKey::Config, &config);

        // Create nullifier for this proof
        let nullifier = Self::generate_nullifier(&env, &commitment, &tx_id);

        // Check nullifier hasn't been used
        if env
            .storage()
            .persistent()
            .has(&DataKey::ProofNullifier(nullifier.clone()))
        {
            return Err(Error::ProofAlreadyUsed);
        }

        // Mark nullifier as used
        env.storage()
            .persistent()
            .set(&DataKey::ProofNullifier(nullifier.clone()), &true);

        // Create first collected proof
        let first_proof = CollectedProof {
            proof: initiator_proof,
            commitment_index: guardian_index,
            nullifier,
            submitted_at: env.ledger().timestamp(),
        };

        let mut collected_proofs = vec![&env];
        collected_proofs.push_back(first_proof);

        // Check if timelock required
        let executable_at = if let Some(amount) = Self::extract_amount(&transaction_data) {
            if let Some(threshold) = config.timelock_threshold {
                if amount >= threshold {
                    Some(env.ledger().timestamp() + config.timelock_seconds.unwrap_or(0))
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };

        // Determine initial status
        let status = if config.threshold == 1 {
            if executable_at.is_some() {
                TxStatus::TimelockPending
            } else {
                TxStatus::ReadyToExecute
            }
        } else {
            TxStatus::PendingApprovals
        };

        // Create pending transaction
        let pending_tx = PendingTransaction {
            tx_id: tx_id.clone(),
            transaction_type,
            transaction_data,
            collected_proofs,
            expires_at: env.ledger().timestamp() + expiry_seconds,
            executable_at,
            status,
            created_at: env.ledger().timestamp(),
        };

        // Store pending transaction
        env.storage()
            .persistent()
            .set(&DataKey::PendingTx(tx_id.clone()), &pending_tx);

        // Add to pending list
        let mut pending_list: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::PendingTxList)
            .unwrap_or(vec![&env]);
        pending_list.push_back(tx_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::PendingTxList, &pending_list);

        Ok(tx_id)
    }

    /// Submit an approval proof for a pending transaction
    pub fn submit_approval(
        env: Env,
        tx_id: BytesN<32>,
        approval_proof: ZkProof,
    ) -> Result<TxStatus, Error> {
        let config: MultiCustodyConfig = env
            .storage()
            .persistent()
            .get(&DataKey::Config)
            .ok_or(Error::NotInitialized)?;

        let mut pending_tx: PendingTransaction = env
            .storage()
            .persistent()
            .get(&DataKey::PendingTx(tx_id.clone()))
            .ok_or(Error::TransactionNotFound)?;

        // Check transaction not expired
        if env.ledger().timestamp() > pending_tx.expires_at {
            pending_tx.status = TxStatus::Expired;
            env.storage()
                .persistent()
                .set(&DataKey::PendingTx(tx_id), &pending_tx);
            return Err(Error::TransactionExpired);
        }

        // Check transaction not already executed/cancelled
        if pending_tx.status == TxStatus::Executed || pending_tx.status == TxStatus::Cancelled {
            return Err(Error::TransactionFinalized);
        }

        // Verify approval proof
        let commitment =
            Self::verify_and_extract_commitment(&env, &approval_proof, &config)?;

        // Find guardian index
        let mut guardian_index = None;
        for (i, guardian) in config.guardians.iter().enumerate() {
            if guardian.commitment == commitment && guardian.active {
                guardian_index = Some(i as u32);
                break;
            }
        }

        let guardian_index = guardian_index.ok_or(Error::GuardianNotFound)?;

        // Check if this guardian already approved
        for collected in pending_tx.collected_proofs.iter() {
            if collected.commitment_index == guardian_index {
                return Err(Error::AlreadyApproved);
            }
        }

        // Generate nullifier
        let nullifier = Self::generate_nullifier(&env, &commitment, &tx_id);

        // Check nullifier hasn't been used
        if env
            .storage()
            .persistent()
            .has(&DataKey::ProofNullifier(nullifier.clone()))
        {
            return Err(Error::ProofAlreadyUsed);
        }

        // Mark nullifier as used
        env.storage()
            .persistent()
            .set(&DataKey::ProofNullifier(nullifier.clone()), &true);

        // Add proof to collected proofs
        let collected_proof = CollectedProof {
            proof: approval_proof,
            commitment_index: guardian_index,
            nullifier,
            submitted_at: env.ledger().timestamp(),
        };

        pending_tx.collected_proofs.push_back(collected_proof);

        // Check if threshold met
        if pending_tx.collected_proofs.len() >= config.threshold {
            if pending_tx.executable_at.is_some() {
                pending_tx.status = TxStatus::TimelockPending;
            } else {
                pending_tx.status = TxStatus::ReadyToExecute;
            }
        }

        // Save updated pending transaction
        env.storage()
            .persistent()
            .set(&DataKey::PendingTx(tx_id), &pending_tx);

        Ok(pending_tx.status)
    }

    /// Execute a transaction that has met its threshold
    pub fn execute_transaction(env: Env, tx_id: BytesN<32>) -> Result<(), Error> {
        let mut pending_tx: PendingTransaction = env
            .storage()
            .persistent()
            .get(&DataKey::PendingTx(tx_id.clone()))
            .ok_or(Error::TransactionNotFound)?;

        // Check status is ready to execute
        if pending_tx.status != TxStatus::ReadyToExecute {
            return Err(Error::NotReadyToExecute);
        }

        // Check timelock if applicable
        if let Some(executable_at) = pending_tx.executable_at {
            if env.ledger().timestamp() < executable_at {
                return Err(Error::TimelockNotExpired);
            }
        }

        // Execute the transaction based on type
        Self::execute_transaction_internal(&env, &pending_tx)?;

        // Mark as executed
        pending_tx.status = TxStatus::Executed;
        env.storage()
            .persistent()
            .set(&DataKey::PendingTx(tx_id.clone()), &pending_tx);

        // Remove from pending list
        let pending_list: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::PendingTxList)
            .unwrap_or(vec![&env]);

        let mut new_list = vec![&env];
        for pending_id in pending_list.iter() {
            if pending_id != tx_id {
                new_list.push_back(pending_id);
            }
        }
        env.storage()
            .persistent()
            .set(&DataKey::PendingTxList, &new_list);

        Ok(())
    }

    /// Get wallet configuration
    pub fn get_config(env: Env) -> Result<MultiCustodyConfig, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Config)
            .ok_or(Error::NotInitialized)
    }

    /// Get pending transaction details
    pub fn get_pending_tx(
        env: Env,
        tx_id: BytesN<32>,
    ) -> Result<PendingTransaction, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::PendingTx(tx_id))
            .ok_or(Error::TransactionNotFound)
    }

    /// Get all pending transactions
    pub fn get_all_pending(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::PendingTxList)
            .unwrap_or(vec![&env])
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    fn verify_and_extract_commitment(
        _env: &Env,
        proof: &ZkProof,
        config: &MultiCustodyConfig,
    ) -> Result<BytesN<32>, Error> {
        // Verify ZK proof (call to ZK verifier contract)
        // For now, extract commitment from public inputs
        let commitment = Self::extract_commitment_from_proof(proof)?;

        // Verify commitment exists in guardians list
        let mut found = false;
        for guardian in config.guardians.iter() {
            if guardian.commitment == commitment && guardian.active {
                found = true;
                break;
            }
        }

        if !found {
            return Err(Error::InvalidProof);
        }

        Ok(commitment)
    }

    fn extract_commitment_from_proof(proof: &ZkProof) -> Result<BytesN<32>, Error> {
        // Commitment should be the first public input
        proof
            .public_inputs
            .get(0)
            .ok_or(Error::InvalidProof)
            .map(|x| x.clone())
    }

    fn generate_tx_id(env: &Env, data: &Bytes, nonce: u64) -> BytesN<32> {
        // Generate deterministic transaction ID
        // In real implementation, use Poseidon hash
        let mut id_data = Bytes::new(env);
        id_data.append(data);
        id_data.append(&Bytes::from_array(env, &nonce.to_be_bytes()));

        let hash = env.crypto().keccak256(&id_data);
        BytesN::from_array(env, &hash.to_array())
    }

    fn generate_nullifier(
        env: &Env,
        commitment: &BytesN<32>,
        tx_id: &BytesN<32>,
    ) -> BytesN<32> {
        // Generate nullifier to prevent proof reuse
        // In real implementation, use Poseidon(commitment, tx_id)
        let mut nullifier_data = Bytes::new(env);
        nullifier_data.append(&Bytes::from_array(env, &commitment.to_array()));
        nullifier_data.append(&Bytes::from_array(env, &tx_id.to_array()));

        let hash = env.crypto().keccak256(&nullifier_data);
        BytesN::from_array(env, &hash.to_array())
    }

    fn extract_amount(_data: &Bytes) -> Option<i128> {
        // Parse transaction data to extract amount
        // Simplified for now
        None
    }

    fn execute_transaction_internal(
        _env: &Env,
        pending_tx: &PendingTransaction,
    ) -> Result<(), Error> {
        // Execute based on transaction type
        // This would call actual Stellar operations
        // For now, just validate the structure

        if pending_tx.transaction_data.len() == 0 {
            return Err(Error::InvalidTransactionData);
        }

        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InvalidThreshold = 2,
    InsufficientGuardians = 3,
    CreatorNotInGuardians = 4,
    GuardianNotFound = 5,
    InvalidProof = 6,
    TransactionNotFound = 7,
    TransactionExpired = 8,
    TransactionFinalized = 9,
    AlreadyApproved = 10,
    ProofAlreadyUsed = 11,
    NotReadyToExecute = 12,
    TimelockNotExpired = 13,
    InvalidTransactionData = 14,
}
