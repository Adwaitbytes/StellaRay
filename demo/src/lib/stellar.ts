import * as StellarSdk from "@stellar/stellar-sdk";

// Network types
export type NetworkType = "testnet" | "mainnet";

// Network configuration
export interface NetworkConfig {
  name: string;
  horizonUrl: string;
  rpcUrl: string;
  passphrase: string;
  friendbotUrl?: string;
  explorerUrl: string;
  contracts: {
    zkVerifier: string;
    smartWalletWasmHash: string;
    gatewayFactory: string;
    jwkRegistry: string;
    x402Facilitator: string;
  };
}

// Network configurations
export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    name: "Testnet",
    horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
    passphrase: StellarSdk.Networks.TESTNET,
    friendbotUrl: process.env.NEXT_PUBLIC_FRIENDBOT_URL || "https://friendbot.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
    contracts: {
      zkVerifier: process.env.NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID || "CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6",
      smartWalletWasmHash: process.env.NEXT_PUBLIC_SMART_WALLET_WASM_HASH || "2a7e72543da92134de77821c920b82e6c5fb7cd02b5283cfeb87deb894e14d5d",
      gatewayFactory: process.env.NEXT_PUBLIC_GATEWAY_FACTORY_CONTRACT_ID || "CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76",
      jwkRegistry: process.env.NEXT_PUBLIC_JWK_REGISTRY_CONTRACT_ID || "CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I",
      x402Facilitator: process.env.NEXT_PUBLIC_X402_FACILITATOR_CONTRACT_ID || "CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ",
    },
  },
  mainnet: {
    name: "Mainnet",
    horizonUrl: process.env.NEXT_PUBLIC_MAINNET_HORIZON_URL || "https://horizon.stellar.org",
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "https://soroban.stellar.org",
    passphrase: StellarSdk.Networks.PUBLIC,
    friendbotUrl: undefined, // No friendbot on mainnet
    explorerUrl: "https://stellar.expert/explorer/public",
    contracts: {
      zkVerifier: process.env.NEXT_PUBLIC_MAINNET_ZK_VERIFIER_CONTRACT_ID || "",
      smartWalletWasmHash: process.env.NEXT_PUBLIC_MAINNET_SMART_WALLET_WASM_HASH || "",
      gatewayFactory: process.env.NEXT_PUBLIC_MAINNET_GATEWAY_FACTORY_CONTRACT_ID || "",
      jwkRegistry: process.env.NEXT_PUBLIC_MAINNET_JWK_REGISTRY_CONTRACT_ID || "",
      x402Facilitator: process.env.NEXT_PUBLIC_MAINNET_X402_FACILITATOR_CONTRACT_ID || "",
    },
  },
};

// Current network state (can be changed at runtime)
let currentNetwork: NetworkType = (process.env.NEXT_PUBLIC_DEFAULT_NETWORK as NetworkType) || "testnet";

// Get current network
export function getCurrentNetwork(): NetworkType {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("stellar_network");
    if (stored === "mainnet" || stored === "testnet") {
      currentNetwork = stored;
    }
  }
  return currentNetwork;
}

// Set current network
export function setCurrentNetwork(network: NetworkType): void {
  currentNetwork = network;
  if (typeof window !== "undefined") {
    localStorage.setItem("stellar_network", network);
  }
}

// Get network config
export function getNetworkConfig(network?: NetworkType): NetworkConfig {
  return NETWORKS[network || getCurrentNetwork()];
}

// Check if mainnet contracts are deployed
export function isMainnetReady(): boolean {
  const mainnet = NETWORKS.mainnet;
  return !!(
    mainnet.contracts.zkVerifier &&
    mainnet.contracts.gatewayFactory &&
    mainnet.contracts.jwkRegistry
  );
}

// Create server for current network
function createServer(network?: NetworkType): StellarSdk.Horizon.Server {
  const config = getNetworkConfig(network);
  return new StellarSdk.Horizon.Server(config.horizonUrl);
}

export interface WalletKeys {
  publicKey: string;
  secretKey: string;
}

export interface AccountBalance {
  asset: string;
  balance: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: string;
  asset: string;
  from: string;
  to: string;
  timestamp: string;
  memo?: string;
}

// Generate deterministic wallet from Google sub ID
export function generateWalletFromSub(sub: string, network?: NetworkType): WalletKeys {
  const net = network || getCurrentNetwork();
  // Create deterministic seed from Google sub + network
  const encoder = new TextEncoder();
  const data = encoder.encode(`stellar-zklogin-${sub}-${net}-v1`);

  // Use the sub as entropy for key generation
  // In production, this would use proper ZK derivation
  const hash = StellarSdk.hash(Buffer.from(data));
  const keypair = StellarSdk.Keypair.fromRawEd25519Seed(hash);

  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

// Fund account using Friendbot (testnet only)
export async function fundAccount(publicKey: string, network?: NetworkType): Promise<boolean> {
  const config = getNetworkConfig(network);

  if (!config.friendbotUrl) {
    throw new Error("Friendbot is only available on testnet. Please fund your mainnet account through an exchange or another wallet.");
  }

  try {
    const response = await fetch(`${config.friendbotUrl}?addr=${publicKey}`);
    if (!response.ok) {
      const text = await response.text();
      // Account already funded - this is fine, not an error
      if (text.includes("already funded") || text.includes("createAccountAlreadyExist") || text.includes("bad_request")) {
        console.log("Account already funded, continuing...");
        return true;
      }
      throw new Error(`Friendbot error: ${text}`);
    }
    return true;
  } catch (error: any) {
    // If the error message indicates already funded, that's fine
    if (error.message?.includes("already funded") || error.message?.includes("bad_request")) {
      return true;
    }
    console.error("Fund account error:", error);
    throw error;
  }
}

// Check if account exists
export async function accountExists(publicKey: string, network?: NetworkType): Promise<boolean> {
  try {
    const server = createServer(network);
    await server.loadAccount(publicKey);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

// Get account balances
export async function getBalances(publicKey: string, network?: NetworkType): Promise<AccountBalance[]> {
  try {
    const server = createServer(network);
    const account = await server.loadAccount(publicKey);
    return account.balances.map((b: any) => ({
      asset: b.asset_type === "native" ? "XLM" : `${b.asset_code}`,
      balance: b.balance,
    }));
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [{ asset: "XLM", balance: "0" }];
    }
    throw error;
  }
}

// Get transaction history
export async function getTransactions(publicKey: string, network?: NetworkType): Promise<Transaction[]> {
  try {
    const server = createServer(network);
    const payments = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(20)
      .call();

    return payments.records
      .filter((p: any) => p.type === "payment" || p.type === "create_account")
      .map((p: any) => ({
        id: p.id,
        type: p.type === "create_account" ? "receive" : p.from === publicKey ? "send" : "receive",
        amount: p.amount || p.starting_balance || "0",
        asset: p.asset_type === "native" || !p.asset_type ? "XLM" : p.asset_code,
        from: p.from || p.funder || "",
        to: p.to || p.account || "",
        timestamp: p.created_at,
        memo: "",
      }));
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

// Send payment
export async function sendPayment(
  secretKey: string,
  destination: string,
  amount: string,
  memo?: string,
  network?: NetworkType
): Promise<{ hash: string; success: boolean }> {
  try {
    const config = getNetworkConfig(network);
    const server = createServer(network);
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.passphrase,
    });

    transactionBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount,
      })
    );

    if (memo) {
      transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    const transaction = transactionBuilder.setTimeout(180).build();
    transaction.sign(sourceKeypair);

    const result = await server.submitTransaction(transaction);
    return { hash: result.hash, success: true };
  } catch (error: any) {
    console.error("Send payment error:", error);
    throw new Error(error.response?.data?.extras?.result_codes?.operations?.[0] || error.message);
  }
}

// Validate Stellar address
export function isValidAddress(address: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Format balance for display
export function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.01) return num.toFixed(7);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

// Shorten address for display
export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Get explorer URL for transaction
export function getExplorerUrl(hash: string, type: "tx" | "account" | "contract" = "tx", network?: NetworkType): string {
  const config = getNetworkConfig(network);
  const typeMap = { tx: "tx", account: "account", contract: "contract" };
  return `${config.explorerUrl}/${typeMap[type]}/${hash}`;
}

// Get network display name
export function getNetworkDisplayName(network?: NetworkType): string {
  return getNetworkConfig(network).name;
}

// Check if current network has friendbot
export function hasFriendbot(network?: NetworkType): boolean {
  return !!getNetworkConfig(network).friendbotUrl;
}
