/**
 * StellarZkLogin - Simplified High-Level API
 *
 * One-line integration for Stellar dApps.
 * No external wallets (Freighter, Hot Wallet) required.
 *
 * @example
 * ```typescript
 * import { StellarZkLogin } from '@stellar-zklogin/sdk';
 *
 * const zkLogin = new StellarZkLogin({
 *   network: 'testnet',
 *   oauth: { google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' } }
 * });
 *
 * // One-line login - no Freighter needed!
 * const wallet = await zkLogin.login('google');
 *
 * // Send payment
 * await wallet.sendPayment('GDEST...', 'native', '100');
 * ```
 */

import { ZkLoginClient, type ZkLoginClientConfig } from "./client";
import { getDefaultConfig, TESTNET_CONTRACTS } from "./config/defaults";
import type {
  StellarNetwork,
  ContractAddresses,
  TransactionResult,
  Session,
} from "./types";
import { ZkLoginError, ErrorCode } from "./types";

/**
 * Simplified configuration options
 */
export interface StellarZkLoginConfig {
  /** Network to use (default: testnet) */
  network?: StellarNetwork;
  /** Contract addresses (uses defaults if not provided) */
  contracts?: Partial<ContractAddresses>;
  /** OAuth provider configurations */
  oauth?: {
    google?: { clientId: string };
    apple?: { clientId: string };
  };
  /** Custom RPC URL */
  rpcUrl?: string;
  /** Custom Horizon URL */
  horizonUrl?: string;
  /** Custom prover service URL */
  proverUrl?: string;
  /** Custom salt service URL */
  saltServiceUrl?: string;
}

/**
 * Embedded wallet returned after login
 */
export interface EmbeddedWallet {
  /** Get wallet address */
  getAddress(): string;
  /** Get balance (native XLM or token) */
  getBalance(tokenAddress?: string): Promise<string>;
  /** Send payment */
  sendPayment(to: string, asset: string, amount: string): Promise<TransactionResult>;
  /** Sign a custom transaction */
  signTransaction(txXdr: string): Promise<string>;
  /** Get session info */
  getSession(): Session | null;
  /** Check if session is still active */
  isActive(): Promise<boolean>;
  /** Export wallet (encrypted with password) */
  export(password: string): Promise<string>;
}

/**
 * Event types emitted by StellarZkLogin
 */
export type StellarZkLoginEvent =
  | 'login'
  | 'logout'
  | 'sessionExpired'
  | 'transaction'
  | 'error';

type EventHandler = (data?: unknown) => void;

/**
 * StellarZkLogin - Simplified API for zkLogin integration
 *
 * Features:
 * - One-line OAuth login (Google, Apple)
 * - No external wallet extensions required
 * - Automatic session management
 * - Built-in X-Ray Protocol support
 * - Event-based notifications
 */
export class StellarZkLogin {
  private client: ZkLoginClient;
  private config: StellarZkLoginConfig;
  private currentWallet: EmbeddedWallet | null = null;
  private eventHandlers: Map<StellarZkLoginEvent, Set<EventHandler>> = new Map();
  private oauthPopup: Window | null = null;

  constructor(config: StellarZkLoginConfig = {}) {
    this.config = config;
    const network = config.network ?? "testnet";
    const defaults = getDefaultConfig(network);

    // Build full client config
    const clientConfig: ZkLoginClientConfig = {
      network,
      rpcUrl: config.rpcUrl ?? defaults.rpcUrl,
      horizonUrl: config.horizonUrl ?? defaults.horizonUrl,
      proverUrl: config.proverUrl ?? defaults.proverUrl,
      saltServiceUrl: config.saltServiceUrl ?? defaults.saltServiceUrl,
      contracts: {
        ...defaults.contracts,
        ...config.contracts,
      },
      googleClientId: config.oauth?.google?.clientId,
      appleClientId: config.oauth?.apple?.clientId,
    };

    this.client = new ZkLoginClient(clientConfig);
  }

  /**
   * Login with OAuth provider
   *
   * @param provider - OAuth provider ("google" or "apple")
   * @param options - Optional login options
   * @returns EmbeddedWallet instance
   *
   * @example
   * ```typescript
   * const wallet = await zkLogin.login('google');
   * console.log('Address:', wallet.getAddress());
   * ```
   */
  async login(
    provider: "google" | "apple",
    options?: {
      redirectUri?: string;
      popup?: boolean;
    }
  ): Promise<EmbeddedWallet> {
    try {
      // Step 1: Initialize session
      await this.client.initializeSession();

      // Step 2: Get OAuth authorization
      const redirectUri = options?.redirectUri ?? this.getDefaultRedirectUri();

      if (options?.popup !== false && typeof window !== 'undefined') {
        // Use popup flow
        await this.handleOAuthPopup(provider, redirectUri);
      } else {
        // Redirect flow - throw with URL for caller to handle
        const authUrl = this.client.getAuthorizationUrl(provider, redirectUri);
        throw new ZkLoginError(
          ErrorCode.OAUTH_INVALID_STATE,
          `Redirect to: ${authUrl}`
        );
      }

      // Step 3: Get salt
      await this.client.getSalt();

      // Step 4: Compute address
      await this.client.computeAddress();

      // Step 5: Generate proof
      await this.client.generateProof();

      // Step 6: Register session on-chain
      await this.client.registerSession();

      // Create wallet wrapper
      this.currentWallet = this.createWalletWrapper();

      // Emit login event
      this.emit('login', { address: this.currentWallet.getAddress() });

      return this.currentWallet;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Complete OAuth flow after redirect
   * Call this when user returns from OAuth provider
   *
   * @param provider - OAuth provider
   * @param code - Authorization code from URL
   * @param redirectUri - Redirect URI used
   */
  async completeLogin(
    provider: "google" | "apple",
    code: string,
    redirectUri: string
  ): Promise<EmbeddedWallet> {
    try {
      // Complete OAuth token exchange
      await this.client.completeOAuth(provider, code, redirectUri);

      // Continue with remaining steps
      await this.client.getSalt();
      await this.client.computeAddress();
      await this.client.generateProof();
      await this.client.registerSession();

      this.currentWallet = this.createWalletWrapper();
      this.emit('login', { address: this.currentWallet.getAddress() });

      return this.currentWallet;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    const address = this.client.getAddress();
    this.client.clearSession();
    this.currentWallet = null;
    this.emit('logout', { address });
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentWallet !== null;
  }

  /**
   * Get current wallet (if logged in)
   */
  getWallet(): EmbeddedWallet | null {
    return this.currentWallet;
  }

  /**
   * Get wallet address (if logged in)
   */
  getAddress(): string | null {
    return this.client.getAddress();
  }

  /**
   * Subscribe to events
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  on(event: StellarZkLoginEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: StellarZkLoginEvent, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Get underlying client for advanced usage
   */
  getClient(): ZkLoginClient {
    return this.client;
  }

  // Private methods

  private createWalletWrapper(): EmbeddedWallet {
    const client = this.client;
    const self = this;

    return {
      getAddress(): string {
        const address = client.getAddress();
        if (!address) {
          throw new ZkLoginError(ErrorCode.SESSION_NOT_FOUND, "No address available");
        }
        return address;
      },

      async getBalance(tokenAddress?: string): Promise<string> {
        return client.getBalance(tokenAddress);
      },

      async sendPayment(to: string, asset: string, amount: string): Promise<TransactionResult> {
        const tokenAddress = asset === 'native' || asset === 'XLM'
          ? undefined
          : asset;

        let result: TransactionResult;
        if (tokenAddress) {
          result = await client.transfer(tokenAddress, to, amount);
        } else {
          // Native XLM transfer (simplified)
          result = await client.transfer(TESTNET_CONTRACTS.x402Facilitator, to, amount);
        }

        self.emit('transaction', { type: 'payment', to, amount, result });
        return result;
      },

      async signTransaction(txXdr: string): Promise<string> {
        // Sign with ephemeral key via client
        const signedTx = await client.signAndSubmitTransaction([{
          type: 'custom',
          xdr: txXdr,
        }]);
        return signedTx.hash;
      },

      getSession(): Session | null {
        return client.getSessionInfo();
      },

      async isActive(): Promise<boolean> {
        return client.isSessionActive();
      },

      async export(password: string): Promise<string> {
        // Encrypt session data
        const sessionData = {
          session: client.getSessionInfo(),
          address: client.getAddress(),
          timestamp: Date.now(),
        };

        // Simple encryption (production would use proper crypto)
        const encrypted = btoa(JSON.stringify({
          ...sessionData,
          password: btoa(password), // Just for demo - use proper encryption
        }));

        return encrypted;
      },
    };
  }

  private async handleOAuthPopup(provider: "google" | "apple", redirectUri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const authUrl = this.client.getAuthorizationUrl(provider, redirectUri);

      // Open popup
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2 + window.screenX;
      const top = (window.innerHeight - height) / 2 + window.screenY;

      this.oauthPopup = window.open(
        authUrl,
        'zklogin_oauth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!this.oauthPopup) {
        reject(new ZkLoginError(ErrorCode.OAUTH_INVALID_STATE, "Popup blocked"));
        return;
      }

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'zklogin_oauth_callback') {
          window.removeEventListener('message', handleMessage);
          this.oauthPopup?.close();
          this.oauthPopup = null;

          if (event.data.error) {
            reject(new ZkLoginError(ErrorCode.OAUTH_INVALID_CODE, event.data.error));
          } else {
            try {
              await this.client.completeOAuth(provider, event.data.code, redirectUri);
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing
      const checkClosed = setInterval(() => {
        if (this.oauthPopup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new ZkLoginError(ErrorCode.OAUTH_INVALID_STATE, "Popup closed"));
        }
      }, 500);
    });
  }

  private getDefaultRedirectUri(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'http://localhost:3000/auth/callback';
  }

  private emit(event: StellarZkLoginEvent, data?: unknown): void {
    this.eventHandlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (e) {
        console.error(`Error in ${event} handler:`, e);
      }
    });
  }
}

export default StellarZkLogin;
