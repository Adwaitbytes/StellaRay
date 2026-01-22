/**
 * Stellar zkLogin SDK - World's Best zkLogin Implementation
 *
 * The most powerful, easy-to-use zkLogin SDK for Stellar blockchain.
 * Replace traditional wallets with social login in just 3 lines of code.
 *
 * Features:
 * - Zero wallet extensions required
 * - Login with Google, Apple, and more
 * - Automatic session management
 * - IndexedDB persistence with encryption
 * - Full Soroban smart contract support
 * - X-Ray Protocol (BN254 + Poseidon) integration
 * - React hooks and components included
 *
 * @example Quick Start (3 lines)
 * ```typescript
 * import { createWallet } from '@stellar-zklogin/sdk';
 *
 * const wallet = createWallet({ appName: 'My dApp', oauthClients: { google: 'YOUR_ID' } });
 * const account = await wallet.connect('google');
 * console.log('Logged in:', account.address);
 * ```
 *
 * @example React Integration
 * ```tsx
 * import { ZkLoginProvider, useWallet, LoginButton } from '@stellar-zklogin/sdk/react';
 *
 * function App() {
 *   return (
 *     <ZkLoginProvider config={{ appName: 'My dApp', oauthClients: { google: 'ID' } }}>
 *       <MyDApp />
 *     </ZkLoginProvider>
 *   );
 * }
 *
 * function MyDApp() {
 *   const { isConnected, address, connect, disconnect } = useWallet();
 *   if (!isConnected) return <LoginButton provider="google" />;
 *   return <div>Welcome {address}!</div>;
 * }
 * ```
 *
 * @packageDocumentation
 */

// ==========================================
// SIMPLE API - Start Here
// ==========================================

// The easiest way to integrate - just import createWallet
export {
  ZkLoginWalletAdapter,
  createWallet,
  getWallet,
  setGlobalWallet,
} from "./core/wallet-adapter";
export type {
  WalletConfig,
  WalletAccount,
  WalletEvent,
  WalletEventType,
  WalletEventListener,
  ConnectionStatus,
  OAuthProvider,
  BalanceInfo,
  TransactionRequest,
  ContractCallRequest,
  SignedTransaction,
} from "./core/wallet-adapter";

// ==========================================
// LEGACY API - For Backward Compatibility
// ==========================================

// Original high-level API
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
// CORE MODULES - Production-Ready Primitives
// ==========================================

// Blake2b cryptographic hashing (proper implementation)
export {
  blake2b,
  blake2b256,
  blake2b256Async,
  blake2bPersonalized,
} from "./core/blake2b";

// Stellar XDR encoding/decoding
export {
  XdrWriter,
  XdrReader,
  encodeStrKey,
  decodeStrKey,
  isValidAddress,
  isValidContractAddress,
  toStroops,
  fromStroops,
  NETWORK_PASSPHRASE,
  VERSION_BYTES,
  OperationType,
  encodeAsset,
  encodePaymentOp,
  encodeSorobanValue,
  encodeTransaction,
  computeTransactionHash,
} from "./core/stellar-xdr";
export type {
  NetworkType,
  Asset,
  PaymentOp,
  InvokeHostFunctionOp,
  SorobanValue,
  SorobanAuth,
  TransactionEnvelope,
  Operation as XdrOperation,
} from "./core/stellar-xdr";

// Soroban smart contract client
export {
  SorobanClient,
  SOROBAN_RPC_URLS,
  HORIZON_URLS,
  createContractClient,
} from "./core/soroban-client";
export type {
  InvokeOptions,
  SimulationResult,
  SubmissionResult,
  AccountInfo,
  LedgerEntry,
} from "./core/soroban-client";

// Persistent storage with encryption
export { StorageManager, MemoryStorage, getStorage } from "./core/storage";
export type { StoredSession, StorageOptions } from "./core/storage";

// ==========================================
// ADVANCED API - Low-Level Access
// ==========================================

// Core zkLogin client
export { ZkLoginClient, type ZkLoginClientConfig } from "./client";

// OAuth providers
export {
  GoogleOAuthProvider,
  AppleOAuthProvider,
  type OAuthProvider as OAuthProviderType,
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

// x402 payment protocol
export {
  X402PaymentClient,
  type PaymentRequest,
  type PaymentResponse,
  type X402Config,
} from "./x402";

// Transaction builder (legacy)
export {
  TransactionBuilder,
  type TransactionOptions,
  type SignedTransaction as LegacySignedTransaction,
} from "./transaction";

// Address utilities
export {
  computeAddressSeed,
  computeNonce,
  computeEphPkHash,
  deriveZkLoginAddress,
} from "./utils/Address";

// Crypto utilities (Poseidon - Protocol 25 compatible)
export {
  poseidonHash,
  hashBytesToField,
  hashModulusToField,
  computeEphPkHash as cryptoComputeEphPkHash,
  computeAddressSeed as cryptoComputeAddressSeed,
  computeNonce as cryptoComputeNonce,
  mod,
  modPow,
  modInverse,
  bigintToBytes,
  bytesToBigint,
  hexToBytes,
  bytesToHex,
} from "./utils/crypto";

// Types
export * from "./types";

// ==========================================
// VERSION & PROTOCOL 25 INFO
// ==========================================

/**
 * SDK Version - Updated for Protocol 25 (X-Ray)
 *
 * Version 2.1.0 includes:
 * - Protocol 25 Poseidon hashing compatibility
 * - BN254 elliptic curve support
 * - Native Groth16 verification integration
 * - soroban-poseidon compatible hashing
 */
export const SDK_VERSION = "2.1.0";

/**
 * Protocol 25 (X-Ray) information
 *
 * Stellar's Protocol 25 introduces native cryptographic primitives
 * for zero-knowledge proofs:
 *
 * - **BN254 Elliptic Curve (CAP-0074)**: Native pairing operations
 *   for Groth16 proof verification on-chain
 *
 * - **Poseidon Hash (CAP-0075)**: ZK-friendly hash function
 *   optimized for use in circuits and on-chain verification
 *
 * @see https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25
 */
export const PROTOCOL_25 = {
  version: 25,
  name: "X-Ray",
  caps: ["CAP-0074", "CAP-0075"],
  features: {
    bn254: {
      description: "BN254 elliptic curve operations for Groth16 verification",
      hostFunctions: {
        g1Add: "bn254_g1_add",
        g1Mul: "bn254_g1_mul",
        pairingCheck: "bn254_multi_pairing_check",
      },
      gasSavings: "94%", // Compared to WASM implementation
    },
    poseidon: {
      description: "ZK-friendly hash function for circuit inputs",
      hostFunctions: {
        permutation: "poseidon_permutation",
        permutation2: "poseidon2_permutation",
      },
      supportedStateSizes: [2, 3, 4, 5, 6],
      sdkPackage: "soroban-poseidon",
      sdkVersion: "25.0.0-rc.1",
      gasSavings: "90%", // Compared to WASM implementation
    },
  },
  timeline: {
    testnetVote: "2026-01-07",
    mainnetVote: "2026-01-22",
  },
  links: {
    announcement: "https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25",
    cap74: "https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md",
    cap75: "https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md",
    sorobanPoseidon: "https://github.com/stellar/rs-soroban-poseidon",
  },
} as const;
