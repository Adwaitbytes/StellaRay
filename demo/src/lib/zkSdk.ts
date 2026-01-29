/**
 * Stellaray ZK Eligibility SDK
 *
 * Public SDK module for third-party dApps to integrate ZK eligibility proofs.
 * Uses Stellar X-Ray Protocol (Protocol 25) for on-chain verification.
 *
 * Usage:
 *   import { ZkEligibilitySDK } from '@stellaray/zk-sdk';
 *
 *   const sdk = new ZkEligibilitySDK({ network: 'testnet' });
 *
 *   // Generate a solvency proof
 *   const proof = await sdk.proveSolvency({
 *     walletAddress: 'GXXX...',
 *     threshold: '100',
 *     actualBalance: '500',
 *   });
 *
 *   // Verify the proof
 *   const result = await sdk.verify(proof);
 *   console.log(result.valid); // true
 */

import {
  generateEligibilityProof,
  poseidonHash,
  poseidonCommit,
  shortenHex,
  formatProofId,
  getXRayProtocolInfo,
  type ProofType,
  type ProofInput,
  type SolvencyProofInput,
  type IdentityProofInput,
  type EligibilityProofInput,
  type HistoryProofInput,
  type EligibilityProof,
  type VerificationResult,
  type G1Point,
  type G2Point,
  type Groth16Proof,
  type VerificationKey,
  BN254_FP_MODULUS,
  BN254_FR_ORDER,
  BN254_G1_GENERATOR,
  BN254_G2_GENERATOR,
  POSEIDON_PARAMS,
} from './zkEligibility';

// ============================================================================
// SDK Configuration
// ============================================================================

export interface ZkSdkConfig {
  network: 'testnet' | 'mainnet';
  apiBaseUrl?: string;
  verifierContractId?: string;
}

// ============================================================================
// SDK Class
// ============================================================================

export class ZkEligibilitySDK {
  private config: Required<ZkSdkConfig>;

  constructor(config: ZkSdkConfig) {
    this.config = {
      network: config.network,
      apiBaseUrl: config.apiBaseUrl || '',
      verifierContractId:
        config.verifierContractId ||
        'CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6',
    };
  }

  /**
   * Generate a Proof of Solvency
   * Proves: balance >= threshold (without revealing balance)
   */
  async proveSolvency(params: {
    walletAddress: string;
    threshold: string;
    actualBalance: string;
    asset?: string;
  }): Promise<EligibilityProof> {
    if (parseFloat(params.actualBalance) < parseFloat(params.threshold)) {
      throw new Error('Cannot prove solvency: balance is below threshold');
    }

    return generateEligibilityProof({
      type: 'solvency',
      walletAddress: params.walletAddress,
      threshold: params.threshold,
      actualBalance: params.actualBalance,
      asset: params.asset || 'XLM',
      network: this.config.network,
    });
  }

  /**
   * Generate a Proof of Identity
   * Proves: verified identity without revealing personal data
   */
  async proveIdentity(params: {
    walletAddress: string;
    email: string;
    provider: string;
    subject: string;
    salt?: string;
  }): Promise<EligibilityProof> {
    return generateEligibilityProof({
      type: 'identity',
      walletAddress: params.walletAddress,
      identityCommitment: '',
      email: params.email,
      provider: params.provider,
      subject: params.subject,
      salt: params.salt || crypto.randomUUID(),
    });
  }

  /**
   * Generate a Proof of Eligibility
   * Proves: arbitrary criteria met without revealing private data
   */
  async proveEligibility(params: {
    walletAddress: string;
    criteria: string;
    privateData: Record<string, string>;
  }): Promise<EligibilityProof> {
    const criteriaHash = await poseidonHash(params.criteria);

    return generateEligibilityProof({
      type: 'eligibility',
      walletAddress: params.walletAddress,
      criteria: params.criteria,
      criteriaHash,
      privateData: params.privateData,
    });
  }

  /**
   * Generate a Proof of History
   * Proves: transaction history properties without revealing transactions
   */
  async proveHistory(params: {
    walletAddress: string;
    minTransactions: number;
    actualCount: number;
    minVolume?: string;
    actualVolume?: string;
    asset?: string;
  }): Promise<EligibilityProof> {
    if (params.actualCount < params.minTransactions) {
      throw new Error('Cannot prove history: actual count is below minimum');
    }

    return generateEligibilityProof({
      type: 'history',
      walletAddress: params.walletAddress,
      minTransactions: params.minTransactions,
      actualCount: params.actualCount,
      minVolume: params.minVolume || '0',
      actualVolume: params.actualVolume || '0',
      asset: params.asset || 'XLM',
      network: this.config.network,
    });
  }

  /**
   * Verify a proof via the API
   */
  async verify(proof: EligibilityProof): Promise<VerificationResult> {
    const baseUrl = this.config.apiBaseUrl;
    const response = await fetch(`${baseUrl}/api/zk-proofs/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Verification failed');
    }

    const data = await response.json();
    return data.verification;
  }

  /**
   * Get protocol info
   */
  getProtocolInfo() {
    return getXRayProtocolInfo();
  }

  /**
   * Get the verification contract ID
   */
  getVerifierContract(): string {
    return this.config.verifierContractId;
  }
}

// ============================================================================
// Public Exports
// ============================================================================

export {
  // Core functions
  generateEligibilityProof,
  poseidonHash,
  poseidonCommit,
  shortenHex,
  formatProofId,
  getXRayProtocolInfo,

  // Constants
  BN254_FP_MODULUS,
  BN254_FR_ORDER,
  BN254_G1_GENERATOR,
  BN254_G2_GENERATOR,
  POSEIDON_PARAMS,
};

export type {
  // Proof types
  ProofType,
  ProofInput,
  SolvencyProofInput,
  IdentityProofInput,
  EligibilityProofInput,
  HistoryProofInput,
  EligibilityProof,
  VerificationResult,

  // Curve types
  G1Point,
  G2Point,
  Groth16Proof,
  VerificationKey,
};
