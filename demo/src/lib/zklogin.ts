/**
 * ZK Login Integration Library
 *
 * This module provides actual zero-knowledge proof generation and wallet derivation
 * using the @stellar-zklogin/sdk. This replaces the placeholder hash-based
 * wallet generation with real cryptographic ZK proofs.
 */

import {
  ZkLoginClient,
  StellarZkLogin,
  ProverClient,
  GoogleOAuthProvider,
  getDefaultConfig,
  getDefaultContracts,
  computeAddressSeed,
  computeNonce,
  deriveZkLoginAddress,
  TESTNET_CONTRACTS,
  MAINNET_CONTRACTS,
  type ZkLoginClientConfig,
  type ZkProofWithInputs,
  type StellarNetwork,
  type EmbeddedWallet,
} from '@stellar-zklogin/sdk';
import { getCurrentNetwork, type NetworkType } from './stellar';

// SDK configuration
const PROVER_SERVICE_URL = process.env.NEXT_PUBLIC_PROVER_URL || 'https://prover.zklogin.stellaray.fun';
const SALT_SERVICE_URL = process.env.NEXT_PUBLIC_SALT_SERVICE_URL || 'https://salt.zklogin.stellaray.fun';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/**
 * ZK Wallet Session - stores the proof and ephemeral key info
 */
export interface ZkWalletSession {
  address: string;
  addressSeed: string;
  issuer: string;
  proof: ZkProofWithInputs | null;
  ephemeralPublicKey: string;
  maxEpoch: number;
  createdAt: number;
  expiresAt: number;
  provider: 'google' | 'apple';
  email?: string;
  subject: string;
  salt: string;
}

/**
 * ZK Login State - manages the current login session
 */
export interface ZkLoginState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  session: ZkWalletSession | null;
  error: string | null;
}

// Singleton client instance
let zkLoginClient: ZkLoginClient | null = null;
let stellarZkLogin: StellarZkLogin | null = null;

/**
 * Get network type for SDK (convert our NetworkType to SDK's StellarNetwork)
 */
function getSdkNetwork(network?: NetworkType): StellarNetwork {
  return (network || getCurrentNetwork()) as StellarNetwork;
}

/**
 * Get the default contracts for a network
 */
export function getContracts(network?: NetworkType) {
  const net = getSdkNetwork(network);
  return net === 'mainnet' ? MAINNET_CONTRACTS : TESTNET_CONTRACTS;
}

/**
 * Initialize the ZkLoginClient for low-level access
 */
export function initializeZkLoginClient(network?: NetworkType): ZkLoginClient {
  if (zkLoginClient) return zkLoginClient;

  const net = getSdkNetwork(network);
  const defaultConfig = getDefaultConfig(net);

  const config: ZkLoginClientConfig = {
    network: net,
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || defaultConfig.rpcUrl,
    horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || defaultConfig.horizonUrl,
    proverUrl: PROVER_SERVICE_URL,
    saltServiceUrl: SALT_SERVICE_URL,
    contracts: getContracts(network),
    googleClientId: GOOGLE_CLIENT_ID,
  };

  zkLoginClient = new ZkLoginClient(config);
  return zkLoginClient;
}

/**
 * Initialize the high-level StellarZkLogin API
 */
export function initializeStellarZkLogin(network?: NetworkType): StellarZkLogin {
  if (stellarZkLogin) return stellarZkLogin;

  const net = getSdkNetwork(network);

  stellarZkLogin = new StellarZkLogin({
    network: net,
    oauth: {
      google: GOOGLE_CLIENT_ID ? { clientId: GOOGLE_CLIENT_ID } : undefined,
    },
    proverUrl: PROVER_SERVICE_URL,
    saltServiceUrl: SALT_SERVICE_URL,
    contracts: getContracts(network),
  });

  return stellarZkLogin;
}

/**
 * Get the current ZkLoginClient instance
 */
export function getZkLoginClient(): ZkLoginClient | null {
  return zkLoginClient;
}

/**
 * Get the current StellarZkLogin instance
 */
export function getStellarZkLogin(): StellarZkLogin | null {
  return stellarZkLogin;
}

/**
 * Start the ZK login flow - Step 1: Initialize session
 * Returns the nonce that should be included in the OAuth request
 */
export async function startZkLogin(network?: NetworkType): Promise<{
  nonce: string;
  ephemeralPublicKey: string;
  maxEpoch: number;
  authUrl: string;
}> {
  const client = initializeZkLoginClient(network);

  // Initialize session - creates ephemeral keypair and computes nonce
  const session = await client.initializeSession();

  // Get the Google OAuth authorization URL with the nonce
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth/callback/google`
    : 'http://localhost:3000/api/auth/callback/google';

  const authUrl = client.getAuthorizationUrl('google', redirectUri);

  return {
    nonce: session.nonce,
    ephemeralPublicKey: session.ephemeralPublicKey,
    maxEpoch: session.maxEpoch,
    authUrl,
  };
}

/**
 * Complete the ZK login flow - Step 2: After OAuth callback
 * This generates the actual ZK proof
 */
export async function completeZkLogin(
  code: string,
  redirectUri: string,
  network?: NetworkType
): Promise<ZkWalletSession> {
  const client = initializeZkLoginClient(network);

  // Exchange OAuth code for JWT token
  const token = await client.completeOAuth('google', code, redirectUri);

  // Get salt from salt service
  const salt = await client.getSalt();

  // Compute deterministic wallet address
  const { address, addressSeed, issuer } = await client.computeAddress();

  // Generate ZK proof
  const proof = await client.generateProof();

  // Get session info
  const sessionInfo = client.getSessionInfo();

  // Parse the JWT to get user info
  const jwtPayload = parseJwt(token.idToken);

  const session: ZkWalletSession = {
    address,
    addressSeed,
    issuer,
    proof,
    ephemeralPublicKey: sessionInfo?.ephemeralPublicKey || '',
    maxEpoch: sessionInfo?.maxEpoch || 0,
    createdAt: Date.now(),
    expiresAt: sessionInfo?.maxEpoch ? Date.now() + (sessionInfo.maxEpoch * 5000) : Date.now() + 86400000,
    provider: 'google',
    email: jwtPayload.email,
    subject: jwtPayload.sub,
    salt,
  };

  // Store session
  storeZkSession(session);

  return session;
}

/**
 * One-line login using the high-level API
 */
export async function zkLogin(provider: 'google' | 'apple' = 'google', network?: NetworkType): Promise<EmbeddedWallet> {
  const zkLogin = initializeStellarZkLogin(network);
  return zkLogin.login(provider);
}

/**
 * Logout and clear session
 */
export function zkLogout(): void {
  if (stellarZkLogin) {
    stellarZkLogin.logout();
  }
  if (zkLoginClient) {
    zkLoginClient.clearSession();
  }
  clearZkSession();
  zkLoginClient = null;
  stellarZkLogin = null;
}

/**
 * Check if user is logged in with ZK
 */
export function isZkLoggedIn(): boolean {
  if (stellarZkLogin) {
    return stellarZkLogin.isLoggedIn();
  }
  const session = getStoredZkSession();
  return session !== null && session.expiresAt > Date.now();
}

/**
 * Get the current wallet address
 */
export function getZkWalletAddress(): string | null {
  if (stellarZkLogin) {
    return stellarZkLogin.getAddress();
  }
  const session = getStoredZkSession();
  return session?.address || null;
}

/**
 * Get the current ZK session
 */
export function getZkSession(): ZkWalletSession | null {
  return getStoredZkSession();
}

/**
 * Compute ZK wallet address from user claims (used for address derivation)
 */
export async function computeZkAddress(
  keyClaimName: string,
  keyClaimValue: string,
  audience: string,
  salt: string,
  issuer: string,
): Promise<string> {
  // Compute address seed using Poseidon hash
  const addressSeed = await computeAddressSeed(keyClaimName, keyClaimValue, audience, salt);

  // Derive wallet address using Blake2b
  const address = await deriveZkLoginAddress(issuer, addressSeed);

  return address;
}

/**
 * Generate a ZK proof for the current session
 */
export async function generateZkProof(): Promise<ZkProofWithInputs | null> {
  const client = getZkLoginClient();
  if (!client) return null;

  return client.generateProof();
}

/**
 * Verify that the prover service is available
 */
export async function checkProverHealth(): Promise<{ status: string; version: string } | null> {
  try {
    const prover = new ProverClient({ baseUrl: PROVER_SERVICE_URL });
    return await prover.health();
  } catch (error) {
    console.error('Prover health check failed:', error);
    return null;
  }
}

/**
 * Get salt from the salt service for a user
 */
export async function getSaltForUser(jwt: string): Promise<string> {
  try {
    const response = await fetch(`${SALT_SERVICE_URL}/get-salt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jwt }),
    });

    if (!response.ok) {
      throw new Error('Failed to get salt from salt service');
    }

    const data = await response.json();
    return data.salt;
  } catch (error) {
    console.error('Salt service error:', error);
    throw error;
  }
}

// Session storage utilities
const ZK_SESSION_KEY = 'stellaray_zk_session';

function storeZkSession(session: ZkWalletSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ZK_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store ZK session:', error);
  }
}

function getStoredZkSession(): ZkWalletSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ZK_SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as ZkWalletSession;

    // Check if expired
    if (session.expiresAt < Date.now()) {
      clearZkSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get ZK session:', error);
    return null;
  }
}

function clearZkSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ZK_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear ZK session:', error);
  }
}

// JWT parsing utility
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return {};
  }
}

/**
 * ZK Login Configuration - exposed for external use
 */
export const zkLoginConfig = {
  proverUrl: PROVER_SERVICE_URL,
  saltServiceUrl: SALT_SERVICE_URL,
  googleClientId: GOOGLE_CLIENT_ID,
};

/**
 * Export SDK utilities for direct access
 */
export {
  computeAddressSeed,
  computeNonce,
  deriveZkLoginAddress,
  TESTNET_CONTRACTS,
  MAINNET_CONTRACTS,
  getDefaultConfig,
  getDefaultContracts,
};

export type {
  ZkLoginClientConfig,
  ZkProofWithInputs,
  StellarNetwork,
  EmbeddedWallet,
};
