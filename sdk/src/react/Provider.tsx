/**
 * ZkLogin Provider Component
 *
 * Provides zkLogin context to all child components.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StellarZkLogin, type StellarZkLoginConfig, type EmbeddedWallet } from '../StellarZkLogin';
import { XRayClient, type XRayMetrics, type XRayStatus } from '../xray';

/**
 * ZkLogin context value
 */
export interface ZkLoginContextValue {
  /** ZkLogin SDK instance */
  zkLogin: StellarZkLogin;
  /** X-Ray client instance */
  xray: XRayClient;
  /** Current wallet (if logged in) */
  wallet: EmbeddedWallet | null;
  /** Whether user is logged in */
  isLoggedIn: boolean;
  /** Whether login is in progress */
  isLoading: boolean;
  /** Last error */
  error: Error | null;
  /** Login with OAuth provider */
  login: (provider: 'google' | 'apple') => Promise<EmbeddedWallet>;
  /** Logout */
  logout: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * ZkLogin provider props
 */
export interface ZkLoginProviderProps {
  /** SDK configuration */
  config: StellarZkLoginConfig;
  /** Child components */
  children: React.ReactNode;
  /** Auto-restore session from storage */
  autoRestore?: boolean;
  /** Callback when login completes */
  onLogin?: (wallet: EmbeddedWallet) => void;
  /** Callback when logout completes */
  onLogout?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * ZkLogin React context
 */
export const ZkLoginContext = createContext<ZkLoginContextValue | null>(null);

/**
 * Hook to access ZkLogin context
 */
export function useZkLoginContext(): ZkLoginContextValue {
  const context = useContext(ZkLoginContext);
  if (!context) {
    throw new Error('useZkLoginContext must be used within a ZkLoginProvider');
  }
  return context;
}

/**
 * ZkLogin Provider component
 *
 * Wraps your app to provide zkLogin functionality to all child components.
 *
 * @example
 * ```tsx
 * <ZkLoginProvider
 *   config={{
 *     network: 'testnet',
 *     oauth: { google: { clientId: 'YOUR_CLIENT_ID' } }
 *   }}
 *   onLogin={(wallet) => console.log('Logged in:', wallet.getAddress())}
 * >
 *   <App />
 * </ZkLoginProvider>
 * ```
 */
export function ZkLoginProvider({
  config,
  children,
  autoRestore = true,
  onLogin,
  onLogout,
  onError,
}: ZkLoginProviderProps): React.ReactElement {
  // Initialize SDK instances
  const zkLogin = useMemo(() => new StellarZkLogin(config), []);
  const xray = useMemo(() => new XRayClient({ network: config.network }), [config.network]);

  // State
  const [wallet, setWallet] = useState<EmbeddedWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Event handlers
  useEffect(() => {
    zkLogin.on('login', (data: any) => {
      const w = zkLogin.getWallet();
      setWallet(w);
      onLogin?.(w!);
    });

    zkLogin.on('logout', () => {
      setWallet(null);
      onLogout?.();
    });

    zkLogin.on('error', (err: any) => {
      setError(err);
      onError?.(err);
    });

    zkLogin.on('sessionExpired', () => {
      setWallet(null);
    });

    return () => {
      zkLogin.off('login', () => {});
      zkLogin.off('logout', () => {});
      zkLogin.off('error', () => {});
      zkLogin.off('sessionExpired', () => {});
    };
  }, [zkLogin, onLogin, onLogout, onError]);

  // Auto-restore session
  useEffect(() => {
    if (autoRestore && !wallet) {
      // Check for existing session
      const existingWallet = zkLogin.getWallet();
      if (existingWallet) {
        setWallet(existingWallet);
      }
    }
  }, [autoRestore, zkLogin, wallet]);

  // Login handler
  const login = useCallback(async (provider: 'google' | 'apple'): Promise<EmbeddedWallet> => {
    setIsLoading(true);
    setError(null);

    try {
      const w = await zkLogin.login(provider);
      setWallet(w);
      return w;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [zkLogin]);

  // Logout handler
  const logout = useCallback(() => {
    zkLogin.logout();
    setWallet(null);
    setError(null);
  }, [zkLogin]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value: ZkLoginContextValue = useMemo(() => ({
    zkLogin,
    xray,
    wallet,
    isLoggedIn: wallet !== null,
    isLoading,
    error,
    login,
    logout,
    clearError,
  }), [zkLogin, xray, wallet, isLoading, error, login, logout, clearError]);

  return (
    <ZkLoginContext.Provider value={value}>
      {children}
    </ZkLoginContext.Provider>
  );
}

export default ZkLoginProvider;
