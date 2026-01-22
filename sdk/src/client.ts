/**
 * Main ZkLogin Client
 *
 * Orchestrates the complete zkLogin flow:
 * 1. Initialize session with ephemeral keys
 * 2. Complete OAuth authentication
 * 3. Get user salt
 * 4. Compute deterministic address
 * 5. Generate ZK proof
 * 6. Register session on-chain
 * 7. Sign and submit transactions
 */

import { EphemeralKeyManager, type EphemeralKeyPair } from "./keys";
import { GoogleOAuthProvider, AppleOAuthProvider, type OAuthToken } from "./oauth";
import { ProverClient } from "./prover";
import { X402PaymentClient } from "./x402";
import { TransactionBuilder, type SignedTransaction, type Operation } from "./transaction";
import {
  computeAddressSeed,
  computeNonce,
  deriveZkLoginAddress,
} from "./utils/Address";
import {
  type StellarNetwork,
  type ContractAddresses,
  type Session,
  type JWTClaims,
  type ZkProofWithInputs,
  type TransactionResult,
  ErrorCode,
  ZkLoginError,
} from "./types";

/**
 * Configuration for ZkLoginClient
 */
export interface ZkLoginClientConfig {
  /** Stellar network to use */
  network: StellarNetwork;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Horizon endpoint URL */
  horizonUrl: string;
  /** Prover service URL */
  proverUrl: string;
  /** Salt service URL */
  saltServiceUrl: string;
  /** Contract addresses */
  contracts: ContractAddresses;
  /** Google OAuth client ID (optional) */
  googleClientId?: string;
  /** Apple OAuth client ID (optional) */
  appleClientId?: string;
}

/**
 * Initialization result from step 1
 */
interface InitSession {
  nonce: string;
  ephemeralPublicKey: string;
  maxEpoch: number;
  ephemeralKeyPair: EphemeralKeyPair;
}

/**
 * Address computation result
 */
interface ComputedAddress {
  address: string;
  addressSeed: string;
  issuer: string;
}

/**
 * Main ZkLogin Client class
 */
export class ZkLoginClient {
  private config: ZkLoginClientConfig;
  private keyManager: EphemeralKeyManager;
  private proverClient: ProverClient;
  private x402Client: X402PaymentClient;
  private transactionBuilder: TransactionBuilder;

  // OAuth providers
  private googleProvider?: GoogleOAuthProvider;
  private appleProvider?: AppleOAuthProvider;

  // Session state
  private currentSession?: {
    ephemeralKeyPair: EphemeralKeyPair;
    maxEpoch: number;
    nonce: string;
    randomness: string;
    jwt?: string;
    salt?: string;
    address?: string;
    addressSeed?: string;
    issuer?: string;
    proof?: ZkProofWithInputs;
    sessionId?: string;
  };

  constructor(config: ZkLoginClientConfig) {
    this.config = config;
    this.keyManager = new EphemeralKeyManager();
    this.proverClient = new ProverClient({ baseUrl: config.proverUrl });
    this.x402Client = new X402PaymentClient({
      network: config.network,
      facilitatorAddress: config.contracts.x402Facilitator,
    });
    this.transactionBuilder = new TransactionBuilder({
      network: config.network,
      rpcUrl: config.rpcUrl,
      horizonUrl: config.horizonUrl,
    });

    // Initialize OAuth providers
    if (config.googleClientId) {
      this.googleProvider = new GoogleOAuthProvider({
        clientId: config.googleClientId,
      });
    }
    if (config.appleClientId) {
      this.appleProvider = new AppleOAuthProvider({
        clientId: config.appleClientId,
      });
    }
  }

  /**
   * Step 1: Initialize a new session
   *
   * Creates an ephemeral key pair and computes the nonce for OAuth.
   *
   * @param maxEpochOffset - Number of ledgers until session expires (default: 17280 = ~1 day)
   */
  async initializeSession(maxEpochOffset: number = 17280): Promise<InitSession> {
    // Get current ledger sequence
    const currentLedger = await this.transactionBuilder.getCurrentLedger();
    const maxEpoch = currentLedger + maxEpochOffset;

    // Generate ephemeral key pair
    const ephemeralKeyPair = this.keyManager.generateKeyPair();

    // Generate randomness
    const randomness = this.keyManager.generateRandomness();

    // Compute nonce: Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
    const { high, low } = this.keyManager.splitPublicKey(ephemeralKeyPair.publicKey);
    const nonce = await computeNonce(high, low, maxEpoch, randomness);

    // Store session state
    this.currentSession = {
      ephemeralKeyPair,
      maxEpoch,
      nonce,
      randomness,
    };

    return {
      nonce,
      ephemeralPublicKey: ephemeralKeyPair.publicKey,
      maxEpoch,
      ephemeralKeyPair,
    };
  }

  /**
   * Get OAuth authorization URL
   *
   * @param provider - OAuth provider ("google" or "apple")
   * @param redirectUri - Redirect URI after OAuth
   */
  getAuthorizationUrl(provider: "google" | "apple", redirectUri: string): string {
    if (!this.currentSession) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "Session not initialized. Call initializeSession() first."
      );
    }

    const oauthProvider = provider === "google" ? this.googleProvider : this.appleProvider;
    if (!oauthProvider) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        `OAuth provider "${provider}" not configured.`
      );
    }

    return oauthProvider.getAuthorizationUrl(redirectUri, this.currentSession.nonce);
  }

  /**
   * Step 2: Complete OAuth flow
   *
   * Exchanges authorization code for JWT token.
   *
   * @param provider - OAuth provider
   * @param code - Authorization code from OAuth redirect
   * @param redirectUri - Redirect URI (must match authorization request)
   */
  async completeOAuth(
    provider: "google" | "apple",
    code: string,
    redirectUri: string
  ): Promise<OAuthToken> {
    if (!this.currentSession) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "Session not initialized. Call initializeSession() first."
      );
    }

    const oauthProvider = provider === "google" ? this.googleProvider : this.appleProvider;
    if (!oauthProvider) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        `OAuth provider "${provider}" not configured.`
      );
    }

    const token = await oauthProvider.exchangeCode(code, redirectUri);

    // Store JWT
    this.currentSession.jwt = token.idToken;
    this.currentSession.issuer = oauthProvider.getIssuer();

    return token;
  }

  /**
   * Step 3: Get user salt from salt service
   */
  async getSalt(): Promise<string> {
    if (!this.currentSession?.jwt) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "No JWT available. Complete OAuth first."
      );
    }

    const response = await fetch(`${this.config.saltServiceUrl}/get-salt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jwt: this.currentSession.jwt }),
    });

    if (!response.ok) {
      throw new ZkLoginError(
        ErrorCode.NETWORK_ERROR,
        `Salt service error: ${response.statusText}`
      );
    }

    const { salt } = await response.json();
    this.currentSession.salt = salt;

    return salt;
  }

  /**
   * Step 4: Compute deterministic wallet address
   */
  async computeAddress(): Promise<ComputedAddress> {
    if (!this.currentSession?.jwt || !this.currentSession.salt) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "JWT and salt required. Complete OAuth and getSalt first."
      );
    }

    const claims = this.parseJWT(this.currentSession.jwt);

    // Compute address seed: Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    const addressSeed = await computeAddressSeed(
      "sub",
      claims.sub,
      claims.aud,
      this.currentSession.salt
    );

    // Derive zkLogin address
    const address = await deriveZkLoginAddress(claims.iss, addressSeed);

    // Store in session
    this.currentSession.address = address;
    this.currentSession.addressSeed = addressSeed;

    return {
      address,
      addressSeed,
      issuer: claims.iss,
    };
  }

  /**
   * Step 5: Generate ZK proof
   */
  async generateProof(): Promise<ZkProofWithInputs> {
    if (!this.currentSession?.jwt || !this.currentSession.salt) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "Session state incomplete. Complete previous steps first."
      );
    }

    const { high, low } = this.keyManager.splitPublicKey(
      this.currentSession.ephemeralKeyPair.publicKey
    );

    const proof = await this.proverClient.generateProof({
      jwt: this.currentSession.jwt,
      salt: this.currentSession.salt,
      ephPkHigh: high,
      ephPkLow: low,
      maxEpoch: this.currentSession.maxEpoch,
      randomness: this.currentSession.randomness,
      keyClaimName: "sub",
    });

    // Store proof
    this.currentSession.proof = proof;

    return proof;
  }

  /**
   * Step 6: Register session on-chain
   */
  async registerSession(): Promise<string> {
    if (!this.currentSession?.proof || !this.currentSession.address) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "Proof and address required. Generate proof first."
      );
    }

    // Build session registration transaction
    const tx = await this.transactionBuilder.buildSessionRegistration({
      walletAddress: this.currentSession.address,
      proof: this.currentSession.proof.proof,
      publicInputs: this.currentSession.proof.publicInputs,
      ephemeralPublicKey: this.currentSession.ephemeralKeyPair.publicKey,
      maxEpoch: this.currentSession.maxEpoch,
    });

    // Submit transaction
    const result = await this.transactionBuilder.submitTransaction(tx);

    if (!result.success) {
      throw new ZkLoginError(
        ErrorCode.TRANSACTION_FAILED,
        "Failed to register session on-chain"
      );
    }

    // Extract session ID from result
    const sessionId = result.hash; // Simplified - actual would parse result
    this.currentSession.sessionId = sessionId;

    return sessionId;
  }

  /**
   * Step 7+: Sign and submit a transaction
   */
  async signAndSubmitTransaction(
    operations: Operation[]
  ): Promise<TransactionResult> {
    if (!this.currentSession?.sessionId || !this.currentSession.address) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "No active session. Register session first."
      );
    }

    // Check session expiration
    const currentLedger = await this.transactionBuilder.getCurrentLedger();
    if (currentLedger > this.currentSession.maxEpoch) {
      throw new ZkLoginError(
        ErrorCode.SESSION_EXPIRED,
        "Session has expired. Initialize a new session."
      );
    }

    // Build transaction
    const tx = await this.transactionBuilder.buildTransaction({
      sourceAddress: this.currentSession.address,
      operations,
    });

    // Sign with ephemeral key
    const signedTx = await this.signWithEphemeralKey(tx);

    // Submit
    return this.transactionBuilder.submitTransaction(signedTx);
  }

  /**
   * Transfer tokens from zkLogin wallet
   */
  async transfer(
    tokenAddress: string,
    destination: string,
    amount: string
  ): Promise<TransactionResult> {
    // Validate session exists
    if (!this.currentSession?.address) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "No active session. Please login first."
      );
    }

    // Validate inputs
    if (!tokenAddress || !destination || !amount) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        "Token address, destination, and amount are required"
      );
    }

    // Create a Soroban token transfer operation
    const operation: Operation = {
      type: "invokeHostFunction",
      contract: tokenAddress,
      function: "transfer",
      from: this.currentSession.address,
      to: destination,
      amount,
    };

    return this.signAndSubmitTransaction([operation]);
  }

  /**
   * Get wallet balance
   */
  async getBalance(tokenAddress?: string): Promise<string> {
    if (!this.currentSession?.address) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "No wallet address available."
      );
    }

    return this.transactionBuilder.getBalance(
      this.currentSession.address,
      tokenAddress
    );
  }

  /**
   * Get x402 payment client for HTTP payments
   */
  getPaymentClient(): X402PaymentClient {
    if (!this.currentSession?.address) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "Initialize session and compute address first."
      );
    }

    this.x402Client.setPayerWallet(
      this.currentSession.address,
      async (tx) => this.signWithEphemeralKey(tx)
    );

    return this.x402Client;
  }

  /**
   * Fetch with automatic x402 payment handling
   */
  async fetchWithPayment(url: string, options?: RequestInit): Promise<Response> {
    const paymentClient = this.getPaymentClient();
    return paymentClient.fetchWithPayment(url, options);
  }

  /**
   * Get current session info
   */
  getSessionInfo(): Session | null {
    if (!this.currentSession?.sessionId) {
      return null;
    }

    return {
      sessionId: this.currentSession.sessionId,
      ephemeralPublicKey: this.currentSession.ephemeralKeyPair.publicKey,
      maxEpoch: this.currentSession.maxEpoch,
      createdAt: Date.now(), // Would track actual creation time
      active: true,
    };
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.currentSession?.address ?? null;
  }

  /**
   * Check if session is active
   */
  async isSessionActive(): Promise<boolean> {
    if (!this.currentSession?.sessionId) {
      return false;
    }

    const currentLedger = await this.transactionBuilder.getCurrentLedger();
    return currentLedger <= this.currentSession.maxEpoch;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = undefined;
    this.keyManager.clearStoredKey();
  }

  // Private helper methods

  private parseJWT(jwt: string): JWTClaims {
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      throw new ZkLoginError(ErrorCode.INVALID_INPUT, "Invalid JWT format");
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

    return {
      iss: payload.iss,
      sub: payload.sub,
      aud: typeof payload.aud === "string" ? payload.aud : payload.aud[0],
      nonce: payload.nonce,
      exp: payload.exp,
      iat: payload.iat,
    };
  }

  /**
   * Sign a transaction XDR with the ephemeral key
   * Returns the signed XDR
   */
  async signTransactionXdr(txXdr: string): Promise<string> {
    const signedTx = await this.signWithEphemeralKey(txXdr);
    return signedTx.txXdr; // Return the signed XDR
  }

  private async signWithEphemeralKey(tx: string): Promise<SignedTransaction> {
    if (!this.currentSession?.ephemeralKeyPair) {
      throw new ZkLoginError(
        ErrorCode.SESSION_NOT_FOUND,
        "No ephemeral key available"
      );
    }

    const signed = this.keyManager.sign(
      Buffer.from(tx, "base64"),
      this.currentSession.ephemeralKeyPair
    );

    return {
      txXdr: tx,
      signature: Buffer.from(signed).toString("base64"),
      sessionId: this.currentSession.sessionId!,
    };
  }
}
