"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ExternalLink,
  X,
  AlertCircle,
  Wallet,
  Sparkles,
  TrendingUp,
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

const EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [publicKey, setPublicKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const initializeWallet = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setIsLoading(true);
      setError(null);

      const sub = (session as any).sub || session.user.email;
      const wallet = generateWalletFromSub(sub);

      setPublicKey(wallet.publicKey);
      setSecretKey(wallet.secretKey);

      const exists = await accountExists(wallet.publicKey);
      if (!exists) {
        await fundAccount(wallet.publicKey);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

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
      showToast("Data refreshed", "success");
    } catch (err) {
      console.error("Refresh error:", err);
      showToast("Failed to refresh", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    showToast("Address copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

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
      setSendError("Insufficient balance (need extra 1 XLM for reserve)");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendPayment(secretKey, sendTo, sendAmount, sendMemo);
      setSendSuccess(`Success! Hash: ${result.hash.slice(0, 12)}...`);
      setSendTo("");
      setSendAmount("");
      setSendMemo("");

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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF10F0]/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#39FF14] border-t-transparent animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-[#39FF14]/20" />
          </div>
          <p className="font-bold text-white/60 tracking-wider">
            {isLoading ? "SETTING UP WALLET..." : "LOADING..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 bg-[#FF3131] flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-white" />
        </div>
        <p className="font-bold text-white text-lg text-center max-w-md">{error}</p>
        <button onClick={initializeWallet} className="group relative">
          <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1" />
          <div className="relative px-6 py-3 bg-black text-[#39FF14] font-black border-2 border-[#39FF14]">
            TRY AGAIN
          </div>
        </button>
      </div>
    );
  }

  const xlmBalance = balances.find((b) => b.asset === "XLM")?.balance || "0";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#FF10F0]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-4 py-3 flex items-center gap-3 font-bold text-sm ${
            toast.type === 'success' ? 'bg-[#39FF14] text-black' : 'bg-[#FF3131] text-white'
          }`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#39FF14] blur-lg opacity-50" />
                <div className="relative w-10 h-10 bg-[#39FF14] flex items-center justify-center">
                  <span className="text-xl font-black text-black">S</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-black">STELLAR</span>
                <span className="font-black text-[#39FF14]">GATEWAY</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="px-3 py-1.5 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-bold hidden sm:block">
                TESTNET
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-3 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors text-sm font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-[#39FF14] text-sm font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            WELCOME BACK
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">
            {session?.user?.name?.split(" ")[0]?.toUpperCase() || "ANON"}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <div className="relative border border-white/10 bg-white/[0.02]">
              {/* Glow */}
              <div className="absolute -inset-px bg-gradient-to-r from-[#39FF14]/20 via-transparent to-[#FF10F0]/20 blur-xl opacity-50" />

              <div className="relative p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-white/40 text-sm font-bold mb-2">TOTAL BALANCE</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#39FF14]">
                        {formatBalance(xlmBalance)}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white/40">XLM</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-white/40">Stellar Testnet</span>
                    </div>
                  </div>
                  <button
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="w-12 h-12 border border-white/20 flex items-center justify-center hover:bg-white/5 hover:border-[#39FF14] transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-[#39FF14]" : "text-white/60"}`} />
                  </button>
                </div>

                {/* Address */}
                <div className="bg-black/50 border border-white/10 p-4 mb-6">
                  <p className="text-white/40 text-xs font-bold mb-2">WALLET ADDRESS</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm text-white/80 break-all">{publicKey}</code>
                    <button
                      onClick={copyAddress}
                      className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[#39FF14] hover:border-[#39FF14] hover:text-black transition-all flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`${EXPLORER_URL}/account/${publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[#00D4FF] hover:border-[#00D4FF] hover:text-black transition-all flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-[#39FF14] font-black border-2 border-[#39FF14] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
                      <Send className="w-5 h-5" />
                      SEND
                    </div>
                  </button>
                  <button
                    onClick={copyAddress}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-[#00D4FF] font-black border-2 border-[#00D4FF] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
                      <ArrowDownLeft className="w-5 h-5" />
                      RECEIVE
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="p-6">
              <h3 className="font-black text-lg mb-6">ACCOUNT INFO</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/40 font-bold">Network</span>
                  <span className="font-black text-[#39FF14]">TESTNET</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/40 font-bold">Status</span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#39FF14] animate-pulse" />
                    <span className="font-black">ACTIVE</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/40 font-bold">Email</span>
                  <span className="font-bold text-sm truncate max-w-[140px]">
                    {session?.user?.email}
                  </span>
                </div>
              </div>

              <a
                href={`${EXPLORER_URL}/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 border border-[#00D4FF] text-[#00D4FF] font-bold hover:bg-[#00D4FF] hover:text-black transition-all"
              >
                VIEW ON EXPLORER
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black">TRANSACTIONS</h2>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-white/40 hover:text-[#39FF14] transition-colors text-sm font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              REFRESH
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.02] p-12 text-center">
              <div className="w-16 h-16 border border-white/20 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white/20" />
              </div>
              <p className="font-black text-lg text-white/60">NO TRANSACTIONS YET</p>
              <p className="text-white/40 text-sm mt-1">
                Send or receive XLM to see your history
              </p>
            </div>
          ) : (
            <div className="border border-white/10 divide-y divide-white/10">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 sm:p-6 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 flex items-center justify-center ${
                        tx.type === "receive" ? "bg-[#39FF14]" : "bg-[#FF10F0]"
                      }`}
                    >
                      {tx.type === "receive" ? (
                        <ArrowDownLeft className="w-6 h-6 text-black" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-black">
                        {tx.type === "receive" ? "RECEIVED" : "SENT"}
                      </p>
                      <p className="text-sm text-white/40">
                        {tx.type === "receive"
                          ? `From ${shortenAddress(tx.from)}`
                          : `To ${shortenAddress(tx.to)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-black text-lg ${
                        tx.type === "receive" ? "text-[#39FF14]" : "text-[#FF10F0]"
                      }`}>
                        {tx.type === "receive" ? "+" : "-"}
                        {formatBalance(tx.amount)} XLM
                      </p>
                      <p className="text-sm text-white/40">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={`${EXPLORER_URL}/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[#00D4FF] hover:border-[#00D4FF] hover:text-black transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md border-2 border-[#39FF14] bg-black animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#39FF14]/30 bg-[#39FF14]">
              <h3 className="text-xl font-black text-black">SEND XLM</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="w-10 h-10 bg-black text-[#39FF14] flex items-center justify-center hover:bg-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white/40 text-sm font-bold mb-2">
                    RECIPIENT ADDRESS
                  </label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="G..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white font-mono text-sm focus:border-[#39FF14] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/40 text-sm font-bold mb-2">
                    AMOUNT (XLM)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0000001"
                    min="0.0000001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white focus:border-[#39FF14] focus:outline-none transition-colors"
                    required
                  />
                  <p className="text-sm text-white/40 mt-2">
                    Available: <span className="text-[#39FF14]">{formatBalance(xlmBalance)} XLM</span>
                  </p>
                </div>

                <div>
                  <label className="block text-white/40 text-sm font-bold mb-2">
                    MEMO (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={sendMemo}
                    onChange={(e) => setSendMemo(e.target.value)}
                    placeholder="Add a note..."
                    maxLength={28}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white focus:border-[#39FF14] focus:outline-none transition-colors"
                  />
                </div>

                {sendError && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#FF3131]/20 border border-[#FF3131] text-[#FF3131]">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm">{sendError}</span>
                  </div>
                )}

                {sendSuccess && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#39FF14]/20 border border-[#39FF14] text-[#39FF14]">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm">{sendSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="group relative w-full mt-4"
                >
                  <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                  <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-[#39FF14] font-black border-2 border-[#39FF14] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
                    {isSending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#39FF14] border-t-transparent animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        SEND XLM
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease;
        }
      `}</style>
    </div>
  );
}
