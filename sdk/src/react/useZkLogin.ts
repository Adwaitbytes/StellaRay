/**
 * useZkLogin Hook
 *
 * Primary hook for zkLogin authentication.
 */

import { useZkLoginContext } from './Provider';
import type { EmbeddedWallet } from '../StellarZkLogin';

/**
 * Return type for useZkLogin hook
 */
export interface UseZkLoginReturn {
  /** Login with OAuth provider */
  login: (provider: 'google' | 'apple') => Promise<EmbeddedWallet>;
  /** Logout current user */
  logout: () => void;
  /** Whether user is logged in */
  isLoggedIn: boolean;
  /** Whether login is in progress */
  isLoading: boolean;
  /** Current wallet (if logged in) */
  wallet: EmbeddedWallet | null;
  /** Wallet address (if logged in) */
  address: string | null;
  /** Last error */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for zkLogin authentication
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   const { login, isLoggedIn, isLoading, wallet, error } = useZkLogin();
 *
 *   if (isLoading) return <div>Logging in...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (isLoggedIn) return <div>Welcome! Address: {wallet?.getAddress()}</div>;
 *
 *   return (
 *     <button onClick={() => login('google')}>
 *       Login with Google
 *     </button>
 *   );
 * }
 * ```
 */
export function useZkLogin(): UseZkLoginReturn {
  const { login, logout, isLoggedIn, isLoading, wallet, error, clearError } = useZkLoginContext();

  const address = wallet?.getAddress() ?? null;

  return {
    login,
    logout,
    isLoggedIn,
    isLoading,
    wallet,
    address,
    error,
    clearError,
  };
}

export default useZkLogin;
