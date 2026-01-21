import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = process.env.NEXT_PUBLIC_FRIENDBOT_URL || "https://friendbot.stellar.org";

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

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
export function generateWalletFromSub(sub: string): WalletKeys {
  // Create deterministic seed from Google sub
  const encoder = new TextEncoder();
  const data = encoder.encode(`stellar-zklogin-${sub}-v1`);

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
export async function fundAccount(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
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
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
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
export async function getBalances(publicKey: string): Promise<AccountBalance[]> {
  try {
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
export async function getTransactions(publicKey: string): Promise<Transaction[]> {
  try {
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
  memo?: string
): Promise<{ hash: string; success: boolean }> {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
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
