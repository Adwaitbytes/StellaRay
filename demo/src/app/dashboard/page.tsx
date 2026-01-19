"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ExternalLink,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import {
  generateWalletFromSub,
  fundAccount,
  getBalances,
  getTransactions,
  sendPayment,
  isValidAddress,
  formatBalance,
  shortenAddress,
  accountExists,
  type AccountBalance,
  type Transaction,
} from "@/lib/stellar";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Wallet state
  const [publicKey, setPublicKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Initialize wallet
  const initializeWallet = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get sub from session (Google user ID)
      const sub = (session as any).sub || session.user.email;
      const wallet = generateWalletFromSub(sub);

      setPublicKey(wallet.publicKey);
      setSecretKey(wallet.secretKey);

      // Check if account exists, fund if not
      const exists = await accountExists(wallet.publicKey);
      if (!exists) {
        await fundAccount(wallet.publicKey);
        // Wait a moment for the account to be funded
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Load balances and transactions
      const [bal, txs] = await Promise.all([
        getBalances(wallet.publicKey),
        getTransactions(wallet.publicKey),
      ]);

      setBalances(bal);
      setTransactions(txs);
    } catch (err: any) {
      console.error("Wallet init error:", err);
      setError(err.message || "Failed to initialize wallet");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session) {
      initializeWallet();
    }
  }, [status, session, router, initializeWallet]);

  // Refresh data
  const refreshData = async () => {
    if (!publicKey) return;

    setIsRefreshing(true);
    try {
      const [bal, txs] = await Promise.all([
        getBalances(publicKey),
        getTransactions(publicKey),
      ]);
      setBalances(bal);
      setTransactions(txs);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send transaction
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    if (!isValidAddress(sendTo)) {
      setSendError("Invalid Stellar address");
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setSendError("Invalid amount");
      return;
    }

    const xlmBalance = balances.find((b) => b.asset === "XLM");
    if (!xlmBalance || parseFloat(xlmBalance.balance) < amount + 1) {
      setSendError("Insufficient balance (need extra 1 XLM for fees/reserve)");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendPayment(secretKey, sendTo, sendAmount, sendMemo);
      setSendSuccess(`Transaction successful! Hash: ${result.hash.slice(0, 16)}...`);
      setSendTo("");
      setSendAmount("");
      setSendMemo("");

      // Refresh after successful send
      setTimeout(() => {
        refreshData();
        setShowSendModal(false);
        setSendSuccess(null);
      }, 3000);
    } catch (err: any) {
      setSendError(err.message || "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner !w-10 !h-10" />
        <p className="text-zinc-400">
          {isLoading ? "Setting up your wallet..." : "Loading..."}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={initializeWallet} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const xlmBalance = balances.find((b) => b.asset === "XLM")?.balance || "0";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Stellar Gateway</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Testnet
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Welcome, {session?.user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-zinc-400">Manage your Stellar wallet</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <div className="glass-card p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Total Balance</p>
                  <div className="balance-display">
                    {formatBalance(xlmBalance)}
                    <span className="text-2xl ml-2 text-zinc-400">XLM</span>
                  </div>
                </div>
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Address */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 mb-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 mb-1">Wallet Address</p>
                  <p className="font-mono text-sm truncate">{publicKey}</p>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
                <button
                  onClick={copyAddress}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  Receive
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Account Info</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-zinc-400">Network</span>
                <span className="font-medium">Testnet</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-zinc-400">Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-zinc-400">Signed in as</span>
                <span className="font-medium truncate max-w-[150px]">
                  {session?.user?.email}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-sm text-indigo-300">
                <strong>Tip:</strong> This is a testnet wallet. Get free test XLM from the Stellar Friendbot!
              </p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <button
              onClick={refreshData}
              className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Plus className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No transactions yet</p>
                <p className="text-sm text-zinc-600 mt-1">
                  Send or receive XLM to see your transaction history
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="tx-item flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "receive"
                            ? "bg-green-500/20"
                            : "bg-red-500/20"
                        }`}
                      >
                        {tx.type === "receive" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === "receive" ? "Received" : "Sent"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {tx.type === "receive"
                            ? `From ${shortenAddress(tx.from)}`
                            : `To ${shortenAddress(tx.to)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          tx.type === "receive"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {tx.type === "receive" ? "+" : "-"}
                        {formatBalance(tx.amount)} {tx.asset}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSendModal(false)}
          />
          <div className="relative w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Send XLM</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSend}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="G..."
                    className="input-field font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Amount (XLM)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0000001"
                    min="0.0000001"
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Available: {formatBalance(xlmBalance)} XLM
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Memo (optional)
                  </label>
                  <input
                    type="text"
                    value={sendMemo}
                    onChange={(e) => setSendMemo(e.target.value)}
                    placeholder="Add a note..."
                    maxLength={28}
                    className="input-field"
                  />
                </div>

                {sendError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {sendError}
                  </div>
                )}

                {sendSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    {sendSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="spinner !w-5 !h-5" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send XLM
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
