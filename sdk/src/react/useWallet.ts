/**
 * useWallet Hook
 *
 * Hook for wallet operations (balance, transfers, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { useZkLoginContext } from './Provider';
import type { TransactionResult } from '../types';

/**
 * Balance state
 */
export interface Balance {
  asset: string;
  balance: string;
  loading: boolean;
}

/**
 * Return type for useWallet hook
 */
export interface UseWalletReturn {
  /** Wallet address */
  address: string | null;
  /** Native XLM balance */
  balance: string | null;
  /** Whether balance is loading */
  balanceLoading: boolean;
  /** Refresh balance */
  refreshBalance: () => Promise<void>;
  /** Send payment */
  sendPayment: (to: string, asset: string, amount: string) => Promise<TransactionResult>;
  /** Check if wallet is active */
  isActive: () => Promise<boolean>;
  /** Get token balance */
  getTokenBalance: (tokenAddress: string) => Promise<string>;
  /** Transaction history (last N) */
  transactions: TransactionResult[];
  /** Whether a transaction is pending */
  isPending: boolean;
  /** Last transaction error */
  error: Error | null;
}

/**
 * Hook for wallet operations
 *
 * @example
 * ```tsx
 * function WalletPage() {
 *   const { address, balance, sendPayment, isPending } = useWallet();
 *
 *   const handleSend = async () => {
 *     await sendPayment('GDEST...', 'native', '10');
 *   };
 *
 *   return (
 *     <div>
 *       <p>Address: {address}</p>
 *       <p>Balance: {balance} XLM</p>
 *       <button onClick={handleSend} disabled={isPending}>
 *         {isPending ? 'Sending...' : 'Send 10 XLM'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWallet(): UseWalletReturn {
  const { wallet } = useZkLoginContext();

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const address = wallet?.getAddress() ?? null;

  // Fetch balance on mount and when wallet changes
  const refreshBalance = useCallback(async () => {
    if (!wallet) {
      setBalance(null);
      return;
    }

    setBalanceLoading(true);
    try {
      const bal = await wallet.getBalance();
      setBalance(bal);
    } catch (err) {
      setError(err as Error);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet]);

  // Auto-refresh balance
  useEffect(() => {
    refreshBalance();

    // Refresh every 30 seconds
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  // Send payment
  const sendPayment = useCallback(async (
    to: string,
    asset: string,
    amount: string
  ): Promise<TransactionResult> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    setIsPending(true);
    setError(null);

    try {
      const result = await wallet.sendPayment(to, asset, amount);
      setTransactions(prev => [result, ...prev.slice(0, 9)]);
      await refreshBalance();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [wallet, refreshBalance]);

  // Check if active
  const isActive = useCallback(async (): Promise<boolean> => {
    if (!wallet) return false;
    return wallet.isActive();
  }, [wallet]);

  // Get token balance
  const getTokenBalance = useCallback(async (tokenAddress: string): Promise<string> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    return wallet.getBalance(tokenAddress);
  }, [wallet]);

  return {
    address,
    balance,
    balanceLoading,
    refreshBalance,
    sendPayment,
    isActive,
    getTokenBalance,
    transactions,
    isPending,
    error,
  };
}

export default useWallet;
