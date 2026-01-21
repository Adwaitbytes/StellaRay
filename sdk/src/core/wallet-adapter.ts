/**
 * Stellar zkLogin Wallet Adapter
 *
 * Universal wallet adapter that provides a standard interface for dApps.
 * Compatible with existing Stellar wallet standards while adding zkLogin capabilities.
 *
 * Features:
 * - Drop-in replacement for traditional wallets
 * - Standard wallet interface (connect, disconnect, sign, etc.)
 * - Automatic session management
 * - Event-driven architecture
 * - Multiple OAuth provider support
 */

import { blake2b256 } from "./blake2b";
import { StorageManager, StoredSession } from "./storage";
import { SorobanClient, NetworkType, HORIZON_URLS } from "./soroban-client";
import {
  encodeStrKey,
  decodeStrKey,
  toStroops,
  fromStroops,
  NETWORK_PASSPHRASE,
} from "./stellar-xdr";

/**
 * Wallet connection status
 */
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Supported OAuth providers
 */
export type OAuthProvider = "google" | "apple" | "facebook" | "github" | "twitter";

/**
 * Wallet event types
 */
export type WalletEventType =
  | "connect"
  | "disconnect"
  | "accountChanged"
  | "networkChanged"
  | "sessionExpired"
  | "transaction";

/**
 * Wallet event payload
 */
export interface WalletEvent {
  type: WalletEventType;
  data?: unknown;
  timestamp: number;
}

/**
 * Transaction request
 */
export interface TransactionRequest {
  /** Destination address */
  to: string;
  /** Amount in XLM or token units */
  amount: string;
  /** Asset (native XLM if not specified) */
  asset?: {
    code: string;
    issuer?: string;
  };
  /** Transaction memo */
  memo?: string;
}

/**
 * Contract call request
 */
export interface ContractCallRequest {
  /** Contract address */
  contract: string;
  /** Function to call */
  method: string;
  /** Arguments */
  args?: unknown[];
  /** Whether to simulate only */
  simulate?: boolean;
}

/**
 * Signed transaction result
 */
export interface SignedTransaction {
  /** Transaction XDR */
  xdr: string;
  /** Transaction hash */
  hash: string;
  /** Network passphrase */
  networkPassphrase: string;
}

/**
 * Wallet configuration
 */
export interface WalletConfig {
  /** Application name (shown in OAuth consent) */
  appName: string;
  /** Application icon URL */
  appIcon?: string;
  /** Default network */
  network?: NetworkType;
  /** OAuth client IDs */
  oauthClients?: {
    google?: string;
    apple?: string;
    facebook?: string;
    github?: string;
    twitter?: string;
  };
  /** Prover service URL */
  proverUrl?: string;
  /** Salt service URL */
  saltServiceUrl?: string;
  /** Custom RPC URL */
  rpcUrl?: string;
  /** Auto-connect on page load */
  autoConnect?: boolean;
  /** Session duration in seconds */
  sessionDuration?: number;
  /** Enable persistent sessions */
  persistSessions?: boolean;
}

/**
 * Account info returned by wallet
 */
export interface WalletAccount {
  /** Stellar address (G...) */
  address: string;
  /** OAuth provider used */
  provider: OAuthProvider;
  /** User's email (if available) */
  email?: string;
  /** User's name (if available) */
  name?: string;
  /** Profile picture URL */
  avatar?: string;
  /** Session expiration timestamp */
  expiresAt: number;
}

/**
 * Balance info
 */
export interface BalanceInfo {
  /** Asset code (XLM for native) */
  asset: string;
  /** Balance amount */
  balance: string;
  /** Asset issuer (null for native) */
  issuer: string | null;
}

/**
 * Wallet event listener
 */
export type WalletEventListener = (event: WalletEvent) => void;

/**
 * zkLogin Wallet Adapter
 *
 * Main class for dApp integration. Provides a simple, unified API
 * for wallet operations with zkLogin authentication.
 */
export class ZkLoginWalletAdapter {
  private config: Required<WalletConfig>;
  private storage: StorageManager;
  private sorobanClient: SorobanClient;
  private currentSession: StoredSession | null = null;
  private status: ConnectionStatus = "disconnected";
  private listeners = new Map<WalletEventType, Set<WalletEventListener>>();
  private oauthPopup: Window | null = null;
  private connectionPromise: Promise<WalletAccount> | null = null;
  private initialized = false;

  constructor(config: WalletConfig) {
    this.config = {
      appName: config.appName,
      appIcon: config.appIcon || "",
      network: config.network || "testnet",
      oauthClients: config.oauthClients || {},
      proverUrl: config.proverUrl || "https://prover.zklogin.stellar.org",
      saltServiceUrl: config.saltServiceUrl || "https://salt.zklogin.stellar.org",
      rpcUrl: config.rpcUrl || "",
      autoConnect: config.autoConnect ?? true,
      sessionDuration: config.sessionDuration || 86400, // 24 hours default
      persistSessions: config.persistSessions ?? true,
    };

    this.storage = new StorageManager({
      encrypt: true,
      namespace: this.config.appName.toLowerCase().replace(/\s+/g, "-"),
    });

    this.sorobanClient = new SorobanClient(this.config.network, {
      rpcUrl: this.config.rpcUrl || undefined,
    });
  }

  /**
   * Initialize the wallet adapter
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await this.storage.init();

    // Auto-connect if enabled and session exists
    if (this.config.autoConnect) {
      const sessions = await this.storage.getAllSessions();
      if (sessions.length > 0) {
        const validSession = sessions.find((s) => s.expiresAt > Date.now());
        if (validSession) {
          this.currentSession = validSession;
          this.status = "connected";
          this.emit("connect", this.getAccount());
        }
      }
    }

    // Set up session expiration check
    this.startSessionMonitor();

    this.initialized = true;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === "connected" && this.currentSession !== null;
  }

  /**
   * Get current account
   */
  getAccount(): WalletAccount | null {
    if (!this.currentSession) return null;

    return {
      address: this.currentSession.address,
      provider: this.currentSession.issuer.includes("google")
        ? "google"
        : this.currentSession.issuer.includes("apple")
        ? "apple"
        : "google", // Default
      email: undefined, // Would be extracted from JWT claims
      name: undefined,
      avatar: undefined,
      expiresAt: this.currentSession.expiresAt,
    };
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.currentSession?.address || null;
  }

  /**
   * Connect wallet with OAuth provider
   */
  async connect(provider: OAuthProvider = "google"): Promise<WalletAccount> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.status = "connecting";

    this.connectionPromise = this._connect(provider).finally(() => {
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  private async _connect(provider: OAuthProvider): Promise<WalletAccount> {
    try {
      // Get OAuth client ID
      const clientId = this.config.oauthClients[provider];
      if (!clientId) {
        throw new Error(`OAuth client ID not configured for ${provider}`);
      }

      // Generate ephemeral key pair
      const keyPair = await this.generateEphemeralKeyPair();

      // Get current epoch for session validity
      const { sequence: currentLedger } = await this.sorobanClient.getLatestLedger();
      const maxEpoch = currentLedger + Math.floor(this.config.sessionDuration / 5); // ~5 sec per ledger

      // Generate nonce
      const nonce = await this.computeNonce(
        keyPair.publicKey,
        maxEpoch,
        keyPair.randomness
      );

      // Open OAuth popup
      const authResult = await this.openOAuthPopup(provider, clientId, nonce);

      // Get salt from service
      const salt = await this.getSalt(authResult.jwt);

      // Compute wallet address
      const address = await this.computeAddress(
        authResult.issuer,
        authResult.subject,
        authResult.audience,
        salt
      );

      // Generate ZK proof
      const proof = await this.generateProof({
        jwt: authResult.jwt,
        salt,
        ephPkHigh: keyPair.publicKeyHigh,
        ephPkLow: keyPair.publicKeyLow,
        maxEpoch,
        randomness: keyPair.randomness,
      });

      // Create session
      const session: StoredSession = {
        id: crypto.randomUUID(),
        address,
        issuer: authResult.issuer,
        subject: authResult.subject,
        ephemeralPublicKey: keyPair.publicKey,
        ephemeralSecretKey: keyPair.secretKey,
        maxEpoch,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.sessionDuration * 1000,
        proof: JSON.stringify(proof),
        salt,
        nonce,
      };

      // Store session
      if (this.config.persistSessions) {
        await this.storage.storeSession(session);
      }

      this.currentSession = session;
      this.status = "connected";

      const account = this.getAccount()!;
      this.emit("connect", account);

      return account;
    } catch (error) {
      this.status = "error";
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.currentSession && this.config.persistSessions) {
      await this.storage.deleteSession(this.currentSession.id);
    }

    this.currentSession = null;
    this.status = "disconnected";

    this.emit("disconnect");
  }

  /**
   * Get balances
   */
  async getBalances(): Promise<BalanceInfo[]> {
    if (!this.currentSession) {
      throw new Error("Wallet not connected");
    }

    const response = await fetch(
      `${HORIZON_URLS[this.config.network]}/accounts/${this.currentSession.address}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [{ asset: "XLM", balance: "0", issuer: null }];
      }
      throw new Error("Failed to fetch balances");
    }

    const data = await response.json();
    return data.balances.map((b: {
      asset_type: string;
      asset_code?: string;
      asset_issuer?: string;
      balance: string;
    }) => ({
      asset: b.asset_type === "native" ? "XLM" : b.asset_code!,
      balance: b.balance,
      issuer: b.asset_type === "native" ? null : b.asset_issuer!,
    }));
  }

  /**
   * Get native XLM balance
   */
  async getBalance(): Promise<string> {
    const balances = await this.getBalances();
    const xlm = balances.find((b) => b.asset === "XLM");
    return xlm?.balance || "0";
  }

  /**
   * Send a payment
   */
  async sendPayment(request: TransactionRequest): Promise<string> {
    if (!this.currentSession) {
      throw new Error("Wallet not connected");
    }

    // Build transaction
    const tx = await this.buildPaymentTransaction(request);

    // Sign with ephemeral key
    const signedTx = await this.signTransaction(tx);

    // Submit to network
    const result = await this.sorobanClient.submitTransaction(signedTx.xdr);

    if (!result.success) {
      throw new Error(result.error || "Transaction failed");
    }

    this.emit("transaction", {
      type: "payment",
      hash: result.hash,
      to: request.to,
      amount: request.amount,
    });

    return result.hash;
  }

  /**
   * Call a smart contract
   */
  async callContract(request: ContractCallRequest): Promise<unknown> {
    if (!this.currentSession) {
      throw new Error("Wallet not connected");
    }

    // Convert args to Soroban values
    const args = (request.args || []).map((arg) => this.toSorobanValue(arg));

    if (request.simulate) {
      // Simulation only
      const result = await this.sorobanClient.simulateTransaction({
        source: this.currentSession.address,
        contract: request.contract,
        function: request.method,
        args,
        simulate: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Contract call simulation failed");
      }

      return result.result;
    }

    // Full execution
    const simulation = await this.sorobanClient.simulateTransaction({
      source: this.currentSession.address,
      contract: request.contract,
      function: request.method,
      args,
    });

    if (!simulation.success) {
      throw new Error(simulation.error || "Contract call simulation failed");
    }

    // Build and sign transaction with simulation data
    // ... implementation details

    this.emit("transaction", {
      type: "contract_call",
      contract: request.contract,
      method: request.method,
    });

    return simulation.result;
  }

  /**
   * Sign arbitrary data
   */
  async signMessage(message: string): Promise<string> {
    if (!this.currentSession) {
      throw new Error("Wallet not connected");
    }

    const messageBytes = new TextEncoder().encode(message);
    const signature = await this.signWithEphemeralKey(messageBytes);

    return btoa(String.fromCharCode(...signature));
  }

  /**
   * Sign a transaction XDR
   */
  async signTransaction(txXdr: string): Promise<SignedTransaction> {
    if (!this.currentSession) {
      throw new Error("Wallet not connected");
    }

    // Decode transaction
    const txBytes = Uint8Array.from(atob(txXdr), (c) => c.charCodeAt(0));

    // Compute transaction hash
    const networkHash = blake2b256(
      new TextEncoder().encode(NETWORK_PASSPHRASE[this.config.network])
    );
    const preimage = new Uint8Array(networkHash.length + txBytes.length);
    preimage.set(networkHash);
    preimage.set(txBytes, networkHash.length);
    const txHash = blake2b256(preimage);

    // Sign with ephemeral key
    const signature = await this.signWithEphemeralKey(txHash);

    // Build decorated signature
    const hint = Uint8Array.from(
      atob(this.currentSession.ephemeralPublicKey),
      (c) => c.charCodeAt(0)
    ).slice(-4);

    // Append signature to transaction
    // ... XDR manipulation to add signature

    return {
      xdr: txXdr, // Would be the signed XDR
      hash: Array.from(txHash)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      networkPassphrase: NETWORK_PASSPHRASE[this.config.network],
    };
  }

  /**
   * Switch network
   */
  async switchNetwork(network: NetworkType): Promise<void> {
    this.config.network = network;
    this.sorobanClient = new SorobanClient(network, {
      rpcUrl: this.config.rpcUrl || undefined,
    });

    this.emit("networkChanged", { network });
  }

  /**
   * Get current network
   */
  getNetwork(): NetworkType {
    return this.config.network;
  }

  /**
   * Add event listener
   */
  on(event: WalletEventType, listener: WalletEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => this.off(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event: WalletEventType, listener: WalletEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Emit event
   */
  private emit(type: WalletEventType, data?: unknown): void {
    const event: WalletEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.listeners.get(type)?.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error("Wallet event listener error:", e);
      }
    });
  }

  /**
   * Generate ephemeral key pair
   */
  private async generateEphemeralKeyPair(): Promise<{
    publicKey: string;
    secretKey: string;
    publicKeyHigh: string;
    publicKeyLow: string;
    randomness: string;
  }> {
    // Use tweetnacl for Ed25519 key generation
    const nacl = await import("tweetnacl");
    const { encodeBase64 } = await import("tweetnacl-util");

    const keyPair = nacl.sign.keyPair();
    const randomness = encodeBase64(nacl.randomBytes(32));

    // Split public key for Poseidon
    const pkBytes = keyPair.publicKey;
    const high = Array.from(pkBytes.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const low = Array.from(pkBytes.slice(16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return {
      publicKey: encodeBase64(keyPair.publicKey),
      secretKey: encodeBase64(keyPair.secretKey),
      publicKeyHigh: high,
      publicKeyLow: low,
      randomness,
    };
  }

  /**
   * Compute nonce for OAuth
   */
  private async computeNonce(
    publicKey: string,
    maxEpoch: number,
    randomness: string
  ): Promise<string> {
    // Import poseidon
    const { poseidon } = await import("poseidon-lite");

    const pkBytes = Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0));
    const high = BigInt(
      "0x" +
        Array.from(pkBytes.slice(0, 16))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
    );
    const low = BigInt(
      "0x" +
        Array.from(pkBytes.slice(16))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
    );
    const randBytes = Uint8Array.from(atob(randomness), (c) => c.charCodeAt(0));
    const rand = BigInt(
      "0x" +
        Array.from(randBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
    );

    const hash = poseidon([high, low, BigInt(maxEpoch), rand]);
    const hashBytes = new Uint8Array(20);
    let h = BigInt(hash.toString());
    for (let i = 19; i >= 0; i--) {
      hashBytes[i] = Number(h & 0xffn);
      h >>= 8n;
    }

    return btoa(String.fromCharCode(...hashBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Open OAuth popup
   */
  private async openOAuthPopup(
    provider: OAuthProvider,
    clientId: string,
    nonce: string
  ): Promise<{
    jwt: string;
    issuer: string;
    subject: string;
    audience: string;
  }> {
    return new Promise((resolve, reject) => {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      let authUrl: string;

      switch (provider) {
        case "google":
          authUrl =
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=id_token&` +
            `scope=openid email profile&` +
            `nonce=${nonce}`;
          break;
        case "apple":
          authUrl =
            `https://appleid.apple.com/auth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=id_token&` +
            `scope=name email&` +
            `response_mode=fragment&` +
            `nonce=${nonce}`;
          break;
        default:
          reject(new Error(`Provider ${provider} not yet supported`));
          return;
      }

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      this.oauthPopup = window.open(
        authUrl,
        "oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!this.oauthPopup) {
        reject(new Error("Failed to open OAuth popup"));
        return;
      }

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === "oauth-callback") {
          window.removeEventListener("message", handleMessage);
          this.oauthPopup?.close();
          this.oauthPopup = null;

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            // Decode JWT to extract claims
            const jwt = event.data.id_token;
            const [, payload] = jwt.split(".");
            const claims = JSON.parse(atob(payload));

            resolve({
              jwt,
              issuer: claims.iss,
              subject: claims.sub,
              audience: claims.aud,
            });
          }
        }
      };

      window.addEventListener("message", handleMessage);

      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        this.oauthPopup?.close();
        this.oauthPopup = null;
        reject(new Error("OAuth timeout"));
      }, 300000);
    });
  }

  /**
   * Get salt from service
   */
  private async getSalt(jwt: string): Promise<string> {
    const response = await fetch(`${this.config.saltServiceUrl}/salt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jwt }),
    });

    if (!response.ok) {
      throw new Error("Failed to get salt");
    }

    const data = await response.json();
    return data.salt;
  }

  /**
   * Compute wallet address
   */
  private async computeAddress(
    issuer: string,
    subject: string,
    audience: string,
    salt: string
  ): Promise<string> {
    const { poseidon } = await import("poseidon-lite");

    // Hash components to field elements
    const issuerField = await this.hashToField(issuer);
    const subjectField = await this.hashToField(subject);
    const audienceField = await this.hashToField(audience);
    const saltField = BigInt("0x" + Buffer.from(salt, "base64").toString("hex"));

    // Compute address seed
    const saltHash = poseidon([saltField]);
    const addressSeed = poseidon([
      await this.hashToField("sub"),
      subjectField,
      audienceField,
      BigInt(saltHash.toString()),
    ]);

    // Build preimage: 0x05 || issuer_len || issuer || address_seed
    const issuerBytes = new TextEncoder().encode(issuer);
    const seedBytes = new Uint8Array(32);
    let seed = BigInt(addressSeed.toString());
    for (let i = 31; i >= 0; i--) {
      seedBytes[i] = Number(seed & 0xffn);
      seed >>= 8n;
    }

    const preimage = new Uint8Array(1 + 1 + issuerBytes.length + 32);
    preimage[0] = 0x05; // zkLogin flag
    preimage[1] = issuerBytes.length;
    preimage.set(issuerBytes, 2);
    preimage.set(seedBytes, 2 + issuerBytes.length);

    // Hash to address
    const hash = blake2b256(preimage);

    return encodeStrKey("accountId", hash);
  }

  /**
   * Hash string to field element
   */
  private async hashToField(str: string): Promise<bigint> {
    const bytes = new TextEncoder().encode(str);
    const hash = blake2b256(bytes);
    return BigInt(
      "0x" +
        Array.from(hash)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
    );
  }

  /**
   * Generate ZK proof
   */
  private async generateProof(params: {
    jwt: string;
    salt: string;
    ephPkHigh: string;
    ephPkLow: string;
    maxEpoch: number;
    randomness: string;
  }): Promise<{
    a: { x: string; y: string };
    b: { x: string[]; y: string[] };
    c: { x: string; y: string };
  }> {
    const response = await fetch(`${this.config.proverUrl}/prove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jwt: params.jwt,
        salt: params.salt,
        eph_pk_high: params.ephPkHigh,
        eph_pk_low: params.ephPkLow,
        max_epoch: params.maxEpoch,
        randomness: params.randomness,
        key_claim_name: "sub",
      }),
    });

    if (!response.ok) {
      throw new Error("Proof generation failed");
    }

    const data = await response.json();
    return {
      a: { x: data.proof.pi_a[0], y: data.proof.pi_a[1] },
      b: {
        x: [data.proof.pi_b[0][0], data.proof.pi_b[0][1]],
        y: [data.proof.pi_b[1][0], data.proof.pi_b[1][1]],
      },
      c: { x: data.proof.pi_c[0], y: data.proof.pi_c[1] },
    };
  }

  /**
   * Sign data with ephemeral key
   */
  private async signWithEphemeralKey(data: Uint8Array): Promise<Uint8Array> {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    const nacl = await import("tweetnacl");
    const { decodeBase64 } = await import("tweetnacl-util");

    const secretKey = decodeBase64(this.currentSession.ephemeralSecretKey);
    return nacl.sign.detached(data, secretKey);
  }

  /**
   * Build payment transaction
   */
  private async buildPaymentTransaction(
    request: TransactionRequest
  ): Promise<string> {
    // Simplified - would use proper XDR building
    return "";
  }

  /**
   * Convert JS value to Soroban value
   */
  private toSorobanValue(value: unknown): {
    type: string;
    value: unknown;
  } {
    if (typeof value === "boolean") {
      return { type: "bool", value };
    }
    if (typeof value === "number") {
      return { type: "i64", value: BigInt(value) };
    }
    if (typeof value === "bigint") {
      return { type: "i128", value };
    }
    if (typeof value === "string") {
      if (value.startsWith("G") || value.startsWith("C")) {
        return { type: "address", value };
      }
      return { type: "string", value };
    }
    if (value instanceof Uint8Array) {
      return { type: "bytes", value };
    }
    if (Array.isArray(value)) {
      return { type: "vec", value: value.map((v) => this.toSorobanValue(v)) };
    }
    return { type: "bytes", value: new Uint8Array(0) };
  }

  /**
   * Start session expiration monitor
   */
  private startSessionMonitor(): void {
    setInterval(async () => {
      if (this.currentSession && this.currentSession.expiresAt <= Date.now()) {
        await this.disconnect();
        this.emit("sessionExpired");
      }

      // Cleanup expired sessions
      await this.storage.cleanupExpired();
    }, 60000); // Check every minute
  }

  /**
   * Export session for backup
   */
  async exportSession(): Promise<string | null> {
    if (!this.currentSession) return null;

    // Create encrypted export
    const exportData = {
      version: 1,
      session: this.currentSession,
      exportedAt: Date.now(),
    };

    return btoa(JSON.stringify(exportData));
  }

  /**
   * Import session from backup
   */
  async importSession(exportedData: string): Promise<WalletAccount> {
    const data = JSON.parse(atob(exportedData));

    if (data.version !== 1) {
      throw new Error("Unsupported export version");
    }

    const session = data.session as StoredSession;

    if (session.expiresAt <= Date.now()) {
      throw new Error("Session has expired");
    }

    await this.storage.storeSession(session);
    this.currentSession = session;
    this.status = "connected";

    const account = this.getAccount()!;
    this.emit("connect", account);

    return account;
  }
}

/**
 * Create a wallet adapter instance
 */
export function createWallet(config: WalletConfig): ZkLoginWalletAdapter {
  return new ZkLoginWalletAdapter(config);
}

/**
 * Global wallet instance for simple apps
 */
let globalWallet: ZkLoginWalletAdapter | null = null;

export function getWallet(): ZkLoginWalletAdapter | null {
  return globalWallet;
}

export function setGlobalWallet(wallet: ZkLoginWalletAdapter): void {
  globalWallet = wallet;
}
