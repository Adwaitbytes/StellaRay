/**
 * Stellar zkLogin Gateway SDK
 *
 * Complete TypeScript SDK for zkLogin-based authentication on Stellar
 * with x402 HTTP payment protocol support.
 */

// Core client
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
