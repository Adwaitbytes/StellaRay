/**
 * Core Module Exports
 *
 * Production-ready cryptographic primitives and utilities for zkLogin.
 */

// Blake2b hashing
export { blake2b, blake2b256, blake2b256Async, blake2bPersonalized } from "./blake2b";

// Stellar XDR encoding
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
} from "./stellar-xdr";
export type {
  NetworkType,
  Asset,
  PaymentOp,
  InvokeHostFunctionOp,
  SorobanValue,
  SorobanAuth,
  TransactionEnvelope,
  Operation,
} from "./stellar-xdr";

// Soroban smart contract client
export {
  SorobanClient,
  SOROBAN_RPC_URLS,
  HORIZON_URLS,
  createContractClient,
} from "./soroban-client";
export type {
  InvokeOptions,
  SimulationResult,
  SubmissionResult,
  AccountInfo,
  LedgerEntry,
} from "./soroban-client";

// Persistent storage
export { StorageManager, MemoryStorage, getStorage } from "./storage";
export type { StoredSession, StorageOptions } from "./storage";

// Wallet adapter
export {
  ZkLoginWalletAdapter,
  createWallet,
  getWallet,
  setGlobalWallet,
} from "./wallet-adapter";
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
} from "./wallet-adapter";
