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
 * SDK Error class
 */
export class ZkLoginError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = "ZkLoginError";
  }
}
