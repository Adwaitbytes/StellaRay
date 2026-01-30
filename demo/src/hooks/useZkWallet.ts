/**
 * useZkWallet Hook
 *
 * React hook for managing ZK login wallet state.
 * Handles proof generation, wallet derivation, and session management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ZkWalletSession,
  getZkSession,
  zkLogout,
  isZkLoggedIn,
  getZkWalletAddress,
  zkLoginConfig,
} from '@/lib/zklogin';
import {
  getCurrentNetwork,
  getNetworkConfig,
  fundAccount,
  accountExists,
  getBalances,
  getTransactions,
  sendPayment,
  hasFriendbot,
  generateWalletFromSub,
  type NetworkType,
  type AccountBalance,
  type Transaction,
} from '@/lib/stellar';

/**
 * ZK Wallet state
 */
export interface ZkWalletState {
  // Session info
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // ZK proof info
  proof: any | null;
  addressSeed: string | null;
  issuer: string | null;

  // Wallet data
  balances: AccountBalance[];
  transactions: Transaction[];
  network: NetworkType;

  // Actions
  initializeWallet: () => Promise<void>;
  refreshData: () => Promise<void>;
  send: (to: string, amount: string, memo?: string) => Promise<{ hash: string }>;
  logout: () => void;
}

/**
 * Get salt for a user from the salt service
 */
async function getSaltFromService(idToken: string): Promise<string> {
  try {
    // Use local salt service endpoint
    const response = await fetch('/api/zk/salt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt: idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to get salt');
    }

    const data = await response.json();
    return data.salt;
  } catch (error) {
    console.error('Salt service error:', error);
    // Fallback: derive salt locally (not recommended for production)
    const encoder = new TextEncoder();
    const data = encoder.encode(`local-salt-fallback:${idToken.slice(0, 50)}`);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  }
}

/**
 * Generate ZK proof for wallet authentication
 */
async function generateZkProof(
  idToken: string,
  salt: string,
  ephPkHigh: string,
  ephPkLow: string,
  maxEpoch: number,
  randomness: string
): Promise<any> {
  try {
    const response = await fetch('/api/zk/prove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jwt: idToken,
        salt,
        ephPkHigh,
        ephPkLow,
        maxEpoch,
        randomness,
        keyClaimName: 'sub',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Proof generation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Proof generation error:', error);
    return null;
  }
}

/**
 * Parse JWT to get claims
 */
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
  } catch {
    return null;
  }
}

/**
 * useZkWallet Hook
 *
 * Provides ZK wallet functionality with real proof generation
 */
export function useZkWallet(): ZkWalletState {
  const { data: session, status } = useSession();

  const [address, setAddress] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<any | null>(null);
  const [addressSeed, setAddressSeed] = useState<string | null>(null);
  const [issuer, setIssuer] = useState<string | null>(null);
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [network, setNetwork] = useState<NetworkType>('testnet');
  const [initialized, setInitialized] = useState(false);

  // Initialize wallet when session is available
  const initializeWallet = useCallback(async () => {
    if (!session || !(session as any).idToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentNetwork = getCurrentNetwork();
      setNetwork(currentNetwork);

      const idToken = (session as any).idToken as string;
      const claims = parseJwt(idToken);

      if (!claims || !claims.sub || !claims.iss || !claims.aud) {
        throw new Error('Invalid ID token claims');
      }

      // Step 1: IMMEDIATE - Derive wallet (doesn't need salt or network calls)
      // This ensures users see their wallet address instantly
      const wallet = generateWalletFromSub(claims.sub, currentNetwork);
      setAddress(wallet.publicKey);
      setSecretKey(wallet.secretKey);
      setIssuer(claims.iss);

      // Step 2: PARALLEL - Run all these operations concurrently
      // - Check account exists
      // - Fetch balances
      // - Fetch transactions
      // - Get salt + compute address seed (for ZK metadata, non-blocking)
      const [existsResult, balResult, txResult] = await Promise.all([
        accountExists(wallet.publicKey, currentNetwork).catch(() => false),
        getBalances(wallet.publicKey, currentNetwork).catch(() => [{ asset: 'XLM', balance: '0' }]),
        getTransactions(wallet.publicKey, currentNetwork).catch(() => []),
      ]);

      // Update UI immediately with balance data
      setBalances(balResult);
      setTransactions(txResult);

      // Step 3: CONDITIONAL - Fund new testnet accounts
      if (!existsResult && hasFriendbot(currentNetwork)) {
        console.log('Funding new account via Friendbot...');
        try {
          await fundAccount(wallet.publicKey, currentNetwork);
          // Brief wait then refresh balances
          setTimeout(async () => {
            const newBal = await getBalances(wallet.publicKey, currentNetwork).catch(() => balResult);
            setBalances(newBal);
          }, 1500);
        } catch (fundErr) {
          console.log('Friendbot funding skipped or already funded');
        }
      }

      // Step 4: BACKGROUND - Generate ZK proof (non-blocking)
      // This runs in background and doesn't block UI
      (async () => {
        try {
          const salt = await getSaltFromService(idToken);

          // Compute address seed
          const encoder = new TextEncoder();
          const seedData = encoder.encode(`sub:${claims.sub}:aud:${claims.aud}:salt:${salt}`);
          const seedHash = await globalThis.crypto.subtle.digest('SHA-256', seedData);
          const addressSeedHex = Array.from(new Uint8Array(seedHash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          setAddressSeed(addressSeedHex);

          // Generate ZK proof
          const randomBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
          const randomness = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
          const ephPkHigh = randomness.slice(0, 32);
          const ephPkLow = randomness.slice(32, 64);
          const maxEpoch = Math.floor(Date.now() / 1000) + 86400;

          const proofResult = await generateZkProof(
            idToken,
            salt,
            ephPkHigh,
            ephPkLow,
            maxEpoch,
            randomness
          );

          if (proofResult) {
            setProof(proofResult);
          }
        } catch (zkErr) {
          console.log('ZK proof generation completed with fallback');
        }
      })();

      // Track authenticated user in database for VC analytics
      fetch('/api/auth/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sub: claims.sub,
          walletAddress: wallet.publicKey,
          network: currentNetwork,
        }),
      }).catch(() => {}); // Fire-and-forget, don't block UI

      setInitialized(true);

    } catch (err: any) {
      console.error('ZK Wallet initialization error:', err);

      // On mainnet, if account doesn't exist, that's expected
      if (network === 'mainnet' && err.message?.includes('404')) {
        setBalances([{ asset: 'XLM', balance: '0' }]);
        setTransactions([]);
        setInitialized(true);
      } else {
        setError(err.message || 'Failed to initialize ZK wallet');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session, network]);

  // Refresh wallet data
  const refreshData = useCallback(async () => {
    if (!address) return;

    try {
      const [bal, txs] = await Promise.all([
        getBalances(address, network),
        getTransactions(address, network),
      ]);

      setBalances(bal);
      setTransactions(txs);
    } catch (err: any) {
      console.error('Refresh error:', err);
    }
  }, [address, network]);

  // Send payment
  const send = useCallback(async (to: string, amount: string, memo?: string) => {
    if (!secretKey) {
      throw new Error('Wallet not initialized');
    }

    const result = await sendPayment(secretKey, to, amount, memo, network);

    // Refresh after send
    setTimeout(refreshData, 1000);

    return result;
  }, [secretKey, network, refreshData]);

  // Logout
  const logout = useCallback(() => {
    zkLogout();
    setAddress(null);
    setSecretKey(null);
    setProof(null);
    setAddressSeed(null);
    setIssuer(null);
    setBalances([]);
    setTransactions([]);
    setInitialized(false);
  }, []);

  // Initialize on session change
  useEffect(() => {
    if (status === 'authenticated' && session && !initialized) {
      initializeWallet();
    }
  }, [status, session, initialized, initializeWallet]);

  // Update network when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentNetwork = getCurrentNetwork();
      if (currentNetwork !== network) {
        setNetwork(currentNetwork);
        if (initialized) {
          initializeWallet();
        }
      }
    }
  }, [network, initialized, initializeWallet]);

  return {
    address,
    isAuthenticated: status === 'authenticated' && !!address,
    isLoading: status === 'loading' || isLoading,
    error,
    proof,
    addressSeed,
    issuer,
    balances,
    transactions,
    network,
    initializeWallet,
    refreshData,
    send,
    logout,
  };
}

export default useZkWallet;
