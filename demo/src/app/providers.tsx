"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Mock ZkLoginClient for demo mode
class MockZkLoginClient {
  private address: string | null = null;

  async initializeSession() {
    const nonce = `mock_nonce_${Date.now()}`;
    const maxEpoch = 12345678;
    return {
      nonce,
      ephemeralPublicKey: "mock_eph_pk_" + Math.random().toString(36).slice(2),
      maxEpoch,
      ephemeralKeyPair: { publicKey: "mock_pk", secretKey: "mock_sk" },
    };
  }

  getAuthorizationUrl(provider: string, redirectUri: string) {
    return `/api/auth/mock-callback?provider=${provider}&redirect=${encodeURIComponent(redirectUri)}`;
  }

  async completeOAuth() {
    return { accessToken: "mock_token", idToken: "mock_id_token", expiresIn: 3600, tokenType: "Bearer" };
  }

  async getSalt() {
    return "mock_salt_" + Math.random().toString(36).slice(2);
  }

  async computeAddress() {
    this.address = "GDEMO" + Math.random().toString(36).slice(2).toUpperCase().padEnd(51, "X");
    return { address: this.address, addressSeed: "mock_seed", issuer: "https://accounts.google.com" };
  }

  async generateProof() {
    return {
      proof: { a: { x: "1", y: "2" }, b: { x: ["3", "4"], y: ["5", "6"] }, c: { x: "7", y: "8" } },
      publicInputs: { ephPkHash: "hash", maxEpoch: 12345678, addressSeed: "seed", issHash: "iss", jwkModulusHash: "mod" },
    };
  }

  async registerSession() {
    return "mock_session_" + Date.now();
  }

  async getBalance() {
    return "100.0000000";
  }

  getAddress() {
    return this.address;
  }

  clearSession() {
    this.address = null;
  }

  async transfer() {
    return { hash: "mock_tx_" + Date.now(), ledger: 12345, success: true };
  }
}

// Wallet state
interface WalletState {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  balance: string | null;
  error: string | null;
}

// Context type
interface ZkLoginContextType {
  client: MockZkLoginClient | null;
  wallet: WalletState;
  initSession: () => Promise<{ nonce: string; authUrl: string }>;
  completeAuth: (code: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const ZkLoginContext = createContext<ZkLoginContextType | null>(null);

export function useZkLogin() {
  const context = useContext(ZkLoginContext);
  if (!context) {
    throw new Error("useZkLogin must be used within Providers");
  }
  return context;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<MockZkLoginClient | null>(null);
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isLoading: false,
    address: null,
    balance: null,
    error: null,
  });

  // Initialize client on mount
  useEffect(() => {
    console.log("🎭 Running in DEMO MODE - no backend services required");
    const zkClient = new MockZkLoginClient();
    setClient(zkClient);
  }, []);

  // Initialize OAuth session
  const initSession = async () => {
    if (!client) throw new Error("Client not initialized");

    setWallet((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const session = await client.initializeSession();
      const authUrl = client.getAuthorizationUrl(
        "google",
        `${window.location.origin}/api/auth/callback`
      );

      return { nonce: session.nonce, authUrl };
    } catch (error) {
      setWallet((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  };

  // Complete OAuth and setup wallet
  const completeAuth = async (code: string) => {
    if (!client) throw new Error("Client not initialized");

    setWallet((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await client.completeOAuth();
      await client.getSalt();
      const { address } = await client.computeAddress();
      await client.generateProof();
      await client.registerSession();
      const balance = await client.getBalance();

      setWallet({
        isConnected: true,
        isLoading: false,
        address,
        balance,
        error: null,
      });
    } catch (error) {
      setWallet((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    client?.clearSession();
    setWallet({
      isConnected: false,
      isLoading: false,
      address: null,
      balance: null,
      error: null,
    });
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (!client || !wallet.address) return;

    try {
      const balance = await client.getBalance();
      setWallet((prev) => ({ ...prev, balance }));
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  };

  return (
    <ZkLoginContext.Provider
      value={{
        client,
        wallet,
        initSession,
        completeAuth,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </ZkLoginContext.Provider>
  );
}
