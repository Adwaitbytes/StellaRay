"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  TrendingUp,
  TrendingDown,
  QrCode,
  Download,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Activity,
  Zap,
  Shield,
  Radio,
  Code,
} from "lucide-react";
import Link from "next/link";
import { XRayStatusBadge } from "@/components/XRayStatusBadge";
import { ProofMetrics } from "@/components/ProofMetrics";
import { ProofTimeline } from "@/components/ProofTimeline";
import { GasSavingsComparison } from "@/components/GasSavingsComparison";
import { ZKProofVisualizer } from "@/components/ZKProofVisualizer";
import { TransactionXRayBadge } from "@/components/TransactionXRayBadge";
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
import { fetchXRayMetrics, formatNumber, type XRayMetrics } from "@/lib/xray";
import {
  CONTRACT_IDS,
  areContractsConfigured,
  GatewayFactory,
  formatContractId,
  getContractExplorerUrl,
} from "@/lib/soroban";

const EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isDark, setIsDark] = useState(true);
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
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState<Transaction | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const [xlmPrice, setXlmPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [showBalance, setShowBalance] = useState(true);

  const [contractsConfigured, setContractsConfigured] = useState(false);
  const [totalWallets, setTotalWallets] = useState<number>(0);
  const [xrayMetrics, setXrayMetrics] = useState<XRayMetrics | null>(null);
  const [xrayLoading, setXrayLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true');
        const data = await res.json();
        if (data.stellar) {
          setXlmPrice(data.stellar.usd);
          setPriceChange(data.stellar.usd_24h_change || 0);
        }
      } catch (err) {
        console.error('Price fetch error:', err);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      const configured = areContractsConfigured();
      setContractsConfigured(configured);
      if (configured) {
        try {
          const count = await GatewayFactory.getWalletCount();
          setTotalWallets(count);
        } catch (err) {
          console.error('Error fetching contract data:', err);
        }
      }
    };
    fetchContractData();
  }, []);

  // Fetch X-Ray metrics
  useEffect(() => {
    const loadXrayMetrics = async () => {
      try {
        setXrayLoading(true);
        const data = await fetchXRayMetrics();
        setXrayMetrics(data);
      } catch (err) {
        console.error('Error fetching X-Ray metrics:', err);
      } finally {
        setXrayLoading(false);
      }
    };
    loadXrayMetrics();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadXrayMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'From', 'To', 'Hash'].join(','),
      ...transactions.map(tx => [
        new Date(tx.timestamp).toISOString(),
        tx.type,
        tx.amount,
        tx.from,
        tx.to,
        tx.id
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stellar-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transactions exported!', 'success');
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
    const xlmBal = balances.find((b) => b.asset === "XLM");
    if (!xlmBal || parseFloat(xlmBal.balance) < amount + 1) {
      setSendError("Insufficient balance");
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
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FF88]/5 via-transparent to-[#FF3366]/5" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-[#00FF88]/50" />
        <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-[#FF3366]/50" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-[#00D4FF]/50" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-[#FFD600]/50" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo with pulse animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 border-2 border-white/20 flex items-center justify-center bg-[#0A0A0A] animate-pulse">
              <Wallet className="w-10 h-10 text-[#00FF88]" />
            </div>
            <div className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-[#00FF88]" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FF3366]" />
            <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-[#00D4FF]" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#FFD600]" />
          </div>

          {/* Brand */}
          <h1 className="text-2xl font-black tracking-tighter text-white mb-1">
            STELLAR<span className="text-[#FF3366]">GATEWAY</span>
          </h1>

          {/* Animated dots */}
          <div className="flex items-center gap-1 mt-6">
            <div className="w-2 h-2 bg-[#00FF88] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#00D4FF] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#FF3366] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          <p className="mt-4 font-medium text-white/40 text-xs tracking-widest uppercase">Loading wallet</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'}`}>
        <div className="w-20 h-20 bg-[#FF3366] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-white" />
        </div>
        <p className={`font-black text-xl mb-4 ${isDark ? 'text-white' : 'text-black'}`}>ERROR</p>
        <p className={`text-center max-w-md mb-8 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{error}</p>
        <button
          onClick={initializeWallet}
          className={`px-8 py-4 font-black border-4 ${isDark ? 'border-white text-white hover:bg-white hover:text-black' : 'border-black text-black hover:bg-black hover:text-white'} transition-all`}
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  const xlmBalance = balances.find((b) => b.asset === "XLM")?.balance || "0";
  const usdValue = xlmPrice ? (parseFloat(xlmBalance) * xlmPrice).toFixed(2) : null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'}`}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50">
          <div className={`px-6 py-4 font-black ${toast.type === 'success' ? 'bg-[#00FF88] text-black' : 'bg-[#FF3366] text-white'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'} border-b-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center text-2xl font-black`}>
                S
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-black tracking-tighter">STELLAR</span>
                <span className="text-2xl font-black tracking-tighter text-[#FF3366]">GATEWAY</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Price */}
              {xlmPrice && (
                <div className={`hidden sm:flex items-center gap-3 px-4 py-2 border-4 ${isDark ? 'border-white/30' : 'border-black/30'}`}>
                  <Activity className="w-4 h-4 text-[#00D4FF]" />
                  <span className="font-black">${xlmPrice.toFixed(4)}</span>
                  <span className={`font-black text-sm ${priceChange >= 0 ? 'text-[#00FF88]' : 'text-[#FF3366]'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              )}

              {/* SDK Link */}
              <Link
                href="/sdk"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black' : 'border-[#00AA55] text-[#00AA55] hover:bg-[#00AA55] hover:text-white'} font-black text-sm transition-all`}
              >
                <Code className="w-4 h-4" />
                SDK
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-12 h-12 border-4 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} flex items-center justify-center transition-all`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Testnet */}
              <div className={`hidden sm:block px-4 py-2 border-4 ${isDark ? 'border-[#00FF88] text-[#00FF88]' : 'border-[#00AA55] text-[#00AA55]'} font-black text-sm`}>
                TESTNET
              </div>

              {/* Sign Out */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-white/30 hover:border-[#FF3366] hover:text-[#FF3366]' : 'border-black/30 hover:border-[#CC0033] hover:text-[#CC0033]'} font-black text-sm transition-all`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">EXIT</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-12">
        {/* Welcome */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>WELCOME BACK</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
              {session?.user?.name?.split(" ")[0]?.toUpperCase() || "USER"}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className={`w-12 h-12 border-4 ${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'} flex items-center justify-center transition-all`}
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`w-12 h-12 border-4 ${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'} flex items-center justify-center transition-all`}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-[#FF3366]" />
                    <div className="w-4 h-4 bg-[#FFD600]" />
                    <div className="w-4 h-4 bg-[#00FF88]" />
                  </div>
                  <span className="font-black text-sm">WALLET.EXE</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Balance */}
                <div className="mb-8">
                  <p className={`font-bold text-sm mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>TOTAL BALANCE</p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl sm:text-6xl font-black text-[#00FF88]">
                      {showBalance ? formatBalance(xlmBalance) : '••••••'}
                    </span>
                    <span className={`text-2xl font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>XLM</span>
                  </div>
                  {usdValue && showBalance && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>≈ ${usdValue} USD</span>
                      {priceChange !== 0 && (
                        <span className={`font-black text-sm ${priceChange >= 0 ? 'text-[#00FF88]' : 'text-[#FF3366]'}`}>
                          {priceChange >= 0 ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
                          {' '}{Math.abs(priceChange).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className={`p-4 border-4 ${isDark ? 'border-white/20' : 'border-black/20'} mb-6`}>
                  <p className={`font-bold text-xs mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>WALLET ADDRESS</p>
                  <div className="flex items-center gap-3">
                    <code className={`flex-1 font-mono text-sm break-all ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                      {showBalance ? publicKey : publicKey.slice(0, 8) + '••••••••' + publicKey.slice(-8)}
                    </code>
                    <button
                      onClick={copyAddress}
                      className={`w-10 h-10 border-4 ${isDark ? 'border-white/30 hover:border-[#00FF88] hover:text-[#00FF88]' : 'border-black/30 hover:border-[#00AA55] hover:text-[#00AA55]'} flex items-center justify-center transition-all`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`${EXPLORER_URL}/account/${publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 border-4 ${isDark ? 'border-white/30 hover:border-[#00D4FF] hover:text-[#00D4FF]' : 'border-black/30 hover:border-[#0099CC] hover:text-[#0099CC]'} flex items-center justify-center transition-all`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className={`relative flex flex-col items-center gap-2 p-4 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'} border-4 border-[#00D4FF] font-black group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform`}>
                      <Send className="w-6 h-6 text-[#00D4FF]" />
                      <span className="text-sm">SEND</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowReceiveModal(true)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#00FF88] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className={`relative flex flex-col items-center gap-2 p-4 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'} border-4 border-[#00FF88] font-black group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform`}>
                      <QrCode className="w-6 h-6 text-[#00FF88]" />
                      <span className="text-sm">RECEIVE</span>
                    </div>
                  </button>
                  <button
                    onClick={exportTransactions}
                    disabled={transactions.length === 0}
                    className="group relative disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-[#FFD600] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className={`relative flex flex-col items-center gap-2 p-4 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'} border-4 border-[#FFD600] font-black group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform`}>
                      <Download className="w-6 h-6 text-[#FFD600]" />
                      <span className="text-sm">EXPORT</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className={`border-4 ${isDark ? 'border-white' : 'border-black'} h-fit`}>
            <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}>
              <span className="font-black text-sm">ACCOUNT_INFO.DAT</span>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { label: 'NETWORK', value: 'TESTNET', color: 'text-[#00FF88]' },
                  { label: 'STATUS', value: 'ACTIVE', color: 'text-[#00FF88]', dot: true },
                  { label: 'ASSETS', value: balances.length.toString() },
                  { label: 'TXS', value: transactions.length.toString() },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-3 border-b-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <span className={`font-bold text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>{item.label}</span>
                    <span className={`font-black flex items-center gap-2 ${item.color || ''}`}>
                      {item.dot && <div className="w-2 h-2 bg-[#00FF88]" />}
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="pt-2">
                  <span className={`font-bold text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>EMAIL</span>
                  <p className="font-bold text-sm mt-1 truncate">{session?.user?.email}</p>
                </div>
              </div>

              <a
                href={`${EXPLORER_URL}/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 flex items-center justify-center gap-2 w-full py-3 border-4 ${isDark ? 'border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black' : 'border-[#0099CC] text-[#0099CC] hover:bg-[#0099CC] hover:text-white'} font-black text-sm transition-all`}
              >
                VIEW ON EXPLORER
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Contracts */}
        {contractsConfigured && (
          <div className={`mt-6 border-4 ${isDark ? 'border-white' : 'border-black'}`}>
            <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#FF3366]" />
                <span className="font-black text-sm">SOROBAN_CONTRACTS.SYS</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'ZK_VERIFIER', id: CONTRACT_IDS.ZK_VERIFIER, color: '#00D4FF' },
                  { name: 'FACTORY', id: CONTRACT_IDS.GATEWAY_FACTORY, color: '#FF3366' },
                  { name: 'JWK_REGISTRY', id: CONTRACT_IDS.JWK_REGISTRY, color: '#00FF88' },
                  { name: 'X402_PAYMENTS', id: CONTRACT_IDS.X402_FACILITATOR, color: '#FFD600' },
                ].map((contract, i) => (
                  <div key={i} className={`p-4 border-4 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2" style={{ backgroundColor: contract.color }} />
                      <span className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>{contract.name}</span>
                    </div>
                    <a
                      href={getContractExplorerUrl(contract.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs hover:underline"
                      style={{ color: contract.color }}
                    >
                      {formatContractId(contract.id)}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* X-Ray Protocol Section */}
        <div className={`mt-6 border-4 ${isDark ? 'border-[#39FF14]/30 bg-gradient-to-r from-[#39FF14]/5 to-transparent' : 'border-[#00AA55]/30 bg-gradient-to-r from-[#00AA55]/5 to-transparent'}`}>
          <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-[#39FF14]/30' : 'border-[#00AA55]/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#39FF14] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-black'}`}>X-RAY PROTOCOL</h2>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>Stellar Protocol 25 - Native ZK Primitives</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
                <span className="text-[#39FF14] font-black text-xs">LIVE ON TESTNET</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 border-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/30'} ${xrayLoading ? 'animate-pulse' : ''}`}>
                <p className={`text-xs font-black mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>BN254 OPS</p>
                <p className="text-2xl font-black text-[#39FF14]">
                  {xrayMetrics ? formatNumber(xrayMetrics.bn254Operations) : '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>Curve operations</p>
              </div>
              <div className={`p-4 border-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/30'} ${xrayLoading ? 'animate-pulse' : ''}`}>
                <p className={`text-xs font-black mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>POSEIDON</p>
                <p className="text-2xl font-black text-[#00D4FF]">
                  {xrayMetrics ? formatNumber(xrayMetrics.poseidonHashes) : '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>Native hashes</p>
              </div>
              <div className={`p-4 border-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/30'} ${xrayLoading ? 'animate-pulse' : ''}`}>
                <p className={`text-xs font-black mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>GAS SAVED</p>
                <p className="text-2xl font-black text-[#FF10F0]">
                  {xrayMetrics ? `${xrayMetrics.gasSavingsPercent}%` : '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>vs WASM impl</p>
              </div>
              <div className={`p-4 border-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/30'} ${xrayLoading ? 'animate-pulse' : ''}`}>
                <p className={`text-xs font-black mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>AVG VERIFY</p>
                <p className="text-2xl font-black text-[#FFD600]">
                  {xrayMetrics ? `${xrayMetrics.avgVerificationMs}ms` : '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>Per proof</p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-3">
              <div className={`px-4 py-2 border-2 ${isDark ? 'border-[#39FF14]/30 bg-[#39FF14]/10' : 'border-[#00AA55]/30 bg-[#00AA55]/10'}`}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#39FF14]" />
                  <span className={`text-xs font-black ${isDark ? 'text-[#39FF14]' : 'text-[#00AA55]'}`}>GROTH16 VERIFIED</span>
                </div>
              </div>
              <div className={`px-4 py-2 border-2 ${isDark ? 'border-[#00D4FF]/30 bg-[#00D4FF]/10' : 'border-[#0099CC]/30 bg-[#0099CC]/10'}`}>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#00D4FF]" />
                  <span className={`text-xs font-black ${isDark ? 'text-[#00D4FF]' : 'text-[#0099CC]'}`}>BN254 NATIVE</span>
                </div>
              </div>
              <div className={`px-4 py-2 border-2 ${isDark ? 'border-[#FF10F0]/30 bg-[#FF10F0]/10' : 'border-[#CC0088]/30 bg-[#CC0088]/10'}`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FF10F0]" />
                  <span className={`text-xs font-black ${isDark ? 'text-[#FF10F0]' : 'text-[#CC0088]'}`}>POSEIDON HASH</span>
                </div>
              </div>
              <a
                href="/explorer"
                className={`px-4 py-2 border-2 ${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'} transition-all`}
              >
                <span className={`text-xs font-black ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                  EXPLORE PROOFS →
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className={`mt-6 border-4 ${isDark ? 'border-white' : 'border-black'}`}>
          <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'} flex items-center justify-between`}>
            <span className="font-black text-sm">TRANSACTIONS.LOG</span>
            <span className="font-bold text-sm">{transactions.length} RECORDS</span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 border-4 border-dashed ${isDark ? 'border-white/30' : 'border-black/30'} flex items-center justify-center mx-auto mb-4`}>
                <Wallet className={`w-8 h-8 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
              </div>
              <p className="font-black mb-2">NO TRANSACTIONS</p>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Send or receive XLM to see history</p>
            </div>
          ) : (
            <div className="divide-y-4 divide-transparent">
              {transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  onClick={() => setShowTxModal(tx)}
                  className={`flex items-center justify-between p-4 sm:p-6 cursor-pointer transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${idx > 0 ? `border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'}` : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center ${tx.type === "receive" ? 'bg-[#00FF88]' : 'bg-[#FF3366]'}`}>
                      {tx.type === "receive" ? (
                        <ArrowDownLeft className="w-6 h-6 text-black" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-black">{tx.type === "receive" ? "RECEIVED" : "SENT"}</p>
                      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        {tx.type === "receive" ? `From ${shortenAddress(tx.from)}` : `To ${shortenAddress(tx.to)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${tx.type === "receive" ? 'text-[#00FF88]' : 'text-[#FF3366]'}`}>
                      {tx.type === "receive" ? "+" : "-"}{formatBalance(tx.amount)} XLM
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className={`w-full max-w-md border-4 ${isDark ? 'border-white bg-[#0A0A0A]' : 'border-black bg-[#F5F5F5]'}`}>
            <div className={`flex items-center justify-between p-6 border-b-4 bg-[#00D4FF] ${isDark ? 'border-white' : 'border-black'}`}>
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <Send className="w-5 h-5" />
                SEND XLM
              </h3>
              <button onClick={() => setShowSendModal(false)} className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>RECIPIENT</label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="G..."
                    className={`w-full px-4 py-3 border-4 ${isDark ? 'border-white/30 bg-transparent text-white' : 'border-black/30 bg-transparent text-black'} font-mono text-sm focus:border-[#00D4FF] outline-none transition-colors`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>AMOUNT</label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0000001"
                    className={`w-full px-4 py-3 border-4 ${isDark ? 'border-white/30 bg-transparent text-white' : 'border-black/30 bg-transparent text-black'} font-mono focus:border-[#00D4FF] outline-none transition-colors`}
                    required
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className={isDark ? 'text-white/50' : 'text-black/50'}>Available: {formatBalance(xlmBalance)} XLM</span>
                    <button type="button" onClick={() => setSendAmount((parseFloat(xlmBalance) - 1.5).toFixed(7))} className="text-[#00D4FF] font-black">MAX</button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>MEMO (OPTIONAL)</label>
                  <input
                    type="text"
                    value={sendMemo}
                    onChange={(e) => setSendMemo(e.target.value)}
                    placeholder="Note..."
                    maxLength={28}
                    className={`w-full px-4 py-3 border-4 ${isDark ? 'border-white/30 bg-transparent text-white' : 'border-black/30 bg-transparent text-black'} focus:border-[#00D4FF] outline-none transition-colors`}
                  />
                </div>
                {sendError && (
                  <div className="px-4 py-3 bg-[#FF3366] text-white font-black text-sm">{sendError}</div>
                )}
                {sendSuccess && (
                  <div className="px-4 py-3 bg-[#00FF88] text-black font-black text-sm">{sendSuccess}</div>
                )}
                <button
                  type="submit"
                  disabled={isSending}
                  className="group relative w-full"
                >
                  <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1" />
                  <div className={`relative flex items-center justify-center gap-2 px-6 py-4 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'} font-black border-4 border-[#00D4FF]`}>
                    {isSending ? (
                      <div className="w-5 h-5 border-4 border-[#00D4FF] border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        EXECUTE TRANSFER
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className={`w-full max-w-md border-4 ${isDark ? 'border-white bg-[#0A0A0A]' : 'border-black bg-[#F5F5F5]'}`}>
            <div className={`flex items-center justify-between p-6 border-b-4 bg-[#00FF88] ${isDark ? 'border-white' : 'border-black'}`}>
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                RECEIVE XLM
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className={`p-4 border-4 ${isDark ? 'border-white' : 'border-black'} mb-6 bg-white`}>
                <QRCodeSVG
                  value={publicKey}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <p className={`font-bold text-sm mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>YOUR ADDRESS</p>
              <div className={`w-full p-4 border-4 ${isDark ? 'border-white/20' : 'border-black/20'} mb-4`}>
                <code className="font-mono text-xs break-all block text-center">{publicKey}</code>
              </div>
              <button
                onClick={() => { copyAddress(); setShowReceiveModal(false); }}
                className="group relative w-full"
              >
                <div className="absolute inset-0 bg-[#00FF88] translate-x-1 translate-y-1" />
                <div className={`relative flex items-center justify-center gap-2 px-6 py-4 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'} font-black border-4 border-[#00FF88]`}>
                  <Copy className="w-5 h-5" />
                  COPY ADDRESS
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className={`w-full max-w-lg border-4 ${isDark ? 'border-white bg-[#0A0A0A]' : 'border-black bg-[#F5F5F5]'}`}>
            <div className={`flex items-center justify-between p-6 border-b-4 ${showTxModal.type === 'receive' ? 'bg-[#00FF88]' : 'bg-[#FF3366]'} ${isDark ? 'border-white' : 'border-black'}`}>
              <h3 className={`text-xl font-black flex items-center gap-2 ${showTxModal.type === 'receive' ? 'text-black' : 'text-white'}`}>
                {showTxModal.type === 'receive' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                {showTxModal.type === 'receive' ? 'RECEIVED' : 'SENT'}
              </h3>
              <button onClick={() => setShowTxModal(null)} className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-4 mb-4">
                <p className={`text-4xl font-black ${showTxModal.type === 'receive' ? 'text-[#00FF88]' : 'text-[#FF3366]'}`}>
                  {showTxModal.type === 'receive' ? '+' : '-'}{formatBalance(showTxModal.amount)} XLM
                </p>
                {xlmPrice && (
                  <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>≈ ${(parseFloat(showTxModal.amount) * xlmPrice).toFixed(2)} USD</p>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'DATE', value: new Date(showTxModal.timestamp).toLocaleString() },
                  { label: 'FROM', value: shortenAddress(showTxModal.from), link: `${EXPLORER_URL}/account/${showTxModal.from}` },
                  { label: 'TO', value: shortenAddress(showTxModal.to), link: `${EXPLORER_URL}/account/${showTxModal.to}` },
                ].map((item, i) => (
                  <div key={i} className={`flex justify-between py-3 border-b-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <span className={`font-bold text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>{item.label}</span>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[#00D4FF] hover:underline">{item.value}</a>
                    ) : (
                      <span className="font-bold text-sm">{item.value}</span>
                    )}
                  </div>
                ))}
                <div className="pt-2">
                  <span className={`font-bold text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>HASH</span>
                  <code className={`font-mono text-xs break-all block mt-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>{showTxModal.id}</code>
                </div>
              </div>
              <a
                href={`${EXPLORER_URL}/tx/${showTxModal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-full block mt-6"
              >
                <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1" />
                <div className={`relative flex items-center justify-center gap-2 px-6 py-4 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'} font-black border-4 border-[#00D4FF]`}>
                  VIEW ON EXPLORER
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
