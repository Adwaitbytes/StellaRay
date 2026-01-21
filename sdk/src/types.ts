/**
 * Core types for Stellar zkLogin Gateway SDK
 */

/**
 * Network configuration
 */
export type StellarNetwork = "mainnet" | "testnet" | "futurenet" | "standalone";

/**
 * Contract addresses for a deployed zkLogin system
 */
export interface ContractAddresses {
  zkVerifier: string;
  smartWalletWasmHash: string;
  gatewayFactory: string;
  jwkRegistry: string;
  x402Facilitator: string;
}

/**
 * BN254 G1 point (affine coordinates)
 */
export interface G1Point {
  x: string;
  y: string;
}

/**
 * BN254 G2 point (affine coordinates, extension field)
 */
export interface G2Point {
  x: [string, string];
  y: [string, string];
}

/**
 * Groth16 proof structure
 */
export interface Groth16Proof {
  a: G1Point;
  b: G2Point;
  c: G1Point;
}

/**
 * zkLogin public inputs
 */
export interface ZkLoginPublicInputs {
  ephPkHash: string;
  maxEpoch: number;
  addressSeed: string;
  issHash: string;
  jwkModulusHash: string;
}

/**
 * Complete ZK proof with public inputs
 */
export interface ZkProofWithInputs {
  proof: Groth16Proof;
  publicInputs: ZkLoginPublicInputs;
}

/**
 * Session information stored on-chain
 */
export interface Session {
  sessionId: string;
  ephemeralPublicKey: string;
  maxEpoch: number;
  createdAt: number;
  active: boolean;
}

/**
 * JWT claims relevant for zkLogin
 */
export interface JWTClaims {
  iss: string;
  sub: string;
  aud: string;
  nonce: string;
  exp: number;
  iat: number;
}

/**
 * JWK (JSON Web Key) for RSA
 */
export interface JWK {
  kty: "RSA";
  n: string;
  e: string;
  kid: string;
  use?: "sig";
  alg?: "RS256";
}

/**
 * OAuth provider information
 */
export interface OAuthProviderInfo {
  name: string;
  issuer: string;
  jwksUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
}

/**
 * Wallet configuration
 */
export interface WalletConfig {
  zkVerifierAddress: string;
  jwkRegistryAddress: string;
  guardianAddress?: string;
  issuerHash: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  hash: string;
  ledger: number;
  success: boolean;
  resultXdr?: string;
}

/**
 * Asset identifier (Stellar format)
 */
export interface Asset {
  code: string;
  issuer?: string;
}

/**
 * Native XLM asset
 */
export const NATIVE_ASSET: Asset = { code: "XLM" };

/**
 * x402 payment scheme
 */
export type X402Scheme = "stellar-exact" | "stellar-range";

/**
 * x402 payment payload
 */
export interface X402Payload {
  asset: string;
  amount: string;
  destination: string;
  validUntil: number;
  resourceId?: string;
  memo?: string;
}

/**
 * x402 payment required response
 */
export interface X402PaymentRequired {
  x402Version: number;
  scheme: X402Scheme;
  network: string;
  payload: X402Payload;
}

/**
 * x402 payment proof for header
 */
export interface X402PaymentProof {
  transactionHash: string;
  payer: string;
  timestamp: number;
}

/**
 * Error codes for SDK operations
 */
export enum ErrorCode {
  // OAuth errors
  OAUTH_INVALID_STATE = "OAUTH_INVALID_STATE",
  OAUTH_INVALID_CODE = "OAUTH_INVALID_CODE",
  OAUTH_TOKEN_EXPIRED = "OAUTH_TOKEN_EXPIRED",

  // Session errors
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_INVALID = "SESSION_INVALID",

  // Proof errors
  PROOF_GENERATION_FAILED = "PROOF_GENERATION_FAILED",
  PROOF_VERIFICATION_FAILED = "PROOF_VERIFICATION_FAILED",

  // Transaction errors
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",

  // x402 errors
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_EXPIRED = "PAYMENT_EXPIRED",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  RPC_ERROR = "RPC_ERROR",

  // General errors
  INVALID_INPUT = "INVALID_INPUT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * SDK Error class with detailed information
 */
export class ZkLoginError extends Error {
  /** Error timestamp */
  public timestamp: number;
  /** Stack trace (if available) */
  public originalStack?: string;
  /** Additional context */
  public context?: Record<string, unknown>;

  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ZkLoginError";
    this.timestamp = Date.now();
    this.context = context;

    if (cause?.stack) {
      this.originalStack = cause.stack;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZkLoginError);
    }
  }

  /**
   * Create error from unknown catch
   */
  static from(error: unknown, code: ErrorCode = ErrorCode.UNKNOWN_ERROR): ZkLoginError {
    if (error instanceof ZkLoginError) {
      return error;
    }
    if (error instanceof Error) {
      return new ZkLoginError(code, error.message, error);
    }
    return new ZkLoginError(code, String(error));
  }

  /**
   * Check if error is a specific code
   */
  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    const nonRecoverable = [
      ErrorCode.PROOF_VERIFICATION_FAILED,
      ErrorCode.INVALID_INPUT,
    ];
    return !nonRecoverable.includes(this.code);
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.OAUTH_INVALID_STATE]: "Authentication session expired. Please try again.",
      [ErrorCode.OAUTH_INVALID_CODE]: "Authentication failed. Please try again.",
      [ErrorCode.OAUTH_TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
      [ErrorCode.SESSION_EXPIRED]: "Your session has expired. Please log in again.",
      [ErrorCode.SESSION_NOT_FOUND]: "Session not found. Please log in.",
      [ErrorCode.SESSION_INVALID]: "Invalid session. Please log in again.",
      [ErrorCode.PROOF_GENERATION_FAILED]: "Failed to generate authentication proof. Please try again.",
      [ErrorCode.PROOF_VERIFICATION_FAILED]: "Authentication verification failed.",
      [ErrorCode.TRANSACTION_FAILED]: "Transaction failed. Please try again.",
      [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance for this transaction.",
      [ErrorCode.PAYMENT_REQUIRED]: "Payment required to access this resource.",
      [ErrorCode.PAYMENT_FAILED]: "Payment failed. Please try again.",
      [ErrorCode.PAYMENT_EXPIRED]: "Payment window expired. Please try again.",
      [ErrorCode.NETWORK_ERROR]: "Network error. Please check your connection.",
      [ErrorCode.RPC_ERROR]: "Blockchain connection error. Please try again.",
      [ErrorCode.INVALID_INPUT]: "Invalid input provided.",
      [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred.",
    };
    return messages[this.code] || this.message;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(),
      timestamp: this.timestamp,
      context: this.context,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

// ==========================================
// Utility Types
// ==========================================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = ZkLoginError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = ZkLoginError> = Promise<Result<T, E>>;

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Event emitter type
 */
export type EventListener<T> = (data: T) => void;

/**
 * Unsubscribe function
 */
export type Unsubscribe = () => void;

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Required keys utility
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Callback with result
 */
export type ResultCallback<T> = (result: Result<T>) => void;

// ==========================================
// Validation Helpers
// ==========================================

/**
 * Validate Stellar address format
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * Validate Stellar contract address format
 */
export function isValidStellarContract(address: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(address);
}

/**
 * Validate amount string
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0 && /^\d+(\.\d{1,7})?$/.test(amount);
}

/**
 * Assert condition or throw
 */
export function assert(condition: boolean, message: string, code = ErrorCode.INVALID_INPUT): asserts condition {
  if (!condition) {
    throw new ZkLoginError(code, message);
  }
}

/**
 * Assert value is not null/undefined
 */
export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  assert(value !== null && value !== undefined, message);
}
