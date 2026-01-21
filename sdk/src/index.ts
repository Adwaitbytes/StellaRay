/**
 * Stellar zkLogin Gateway SDK
 *
 * Complete TypeScript SDK for zkLogin-based authentication on Stellar.
 * No external wallets (Freighter, Hot Wallet) required.
 *
 * @example
 * ```typescript
 * import { StellarZkLogin } from '@stellar-zklogin/sdk';
 *
 * const zkLogin = new StellarZkLogin({
 *   network: 'testnet',
 *   oauth: { google: { clientId: 'YOUR_ID' } }
 * });
 *
 * const wallet = await zkLogin.login('google');
 * console.log('Address:', wallet.getAddress());
 * ```
 */

// ==========================================
// Main API (Simplified)
// ==========================================

// Primary entry point - simplified high-level API
export {
  StellarZkLogin,
  type StellarZkLoginConfig,
  type EmbeddedWallet,
  type StellarZkLoginEvent,
} from "./StellarZkLogin";

// Default export for convenience
export { default } from "./StellarZkLogin";

// ==========================================
// X-Ray Protocol
// ==========================================

export {
  XRayClient,
  type XRayClientConfig,
  type XRayMetrics,
  type XRayStatus,
  type XRayEvent,
  type GasEstimate,
} from "./xray";

// ==========================================
// Configuration
// ==========================================

export {
  TESTNET_CONTRACTS,
  MAINNET_CONTRACTS,
  DEFAULT_RPC_URLS,
  DEFAULT_HORIZON_URLS,
  getDefaultContracts,
  getDefaultConfig,
} from "./config";

// ==========================================
// Advanced API (Low-Level)
// ==========================================

// Core client (for advanced usage)
export { ZkLoginClient, type ZkLoginClientConfig } from "./client";

// OAuth providers
export {
  GoogleOAuthProvider,
  AppleOAuthProvider,
  type OAuthProvider,
  type OAuthConfig,
  type OAuthToken,
} from "./oauth";

// Key management
export {
  EphemeralKeyManager,
  type EphemeralKeyPair,
  type SessionKey,
} from "./keys";

// Prover client
export {
  ProverClient,
  type ZkProof,
  type Groth16Proof,
  type PublicInputs,
  type ProverConfig,
} from "./prover";

// x402 payment
export {
  X402PaymentClient,
  type PaymentRequest,
  type PaymentResponse,
  type X402Config,
} from "./x402";

// Transaction builder
export {
  TransactionBuilder,
  type TransactionOptions,
  type SignedTransaction,
} from "./transaction";

// Address utilities
export {
  computeAddressSeed,
  computeNonce,
  computeEphPkHash,
  deriveZkLoginAddress,
} from "./utils/address";

// Crypto utilities
export {
  poseidonHash,
  hashBytesToField,
  hashModulusToField,
} from "./utils/crypto";

// Types
export * from "./types";
