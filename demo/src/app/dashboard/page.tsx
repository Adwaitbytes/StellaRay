"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
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
  TrendingDown,
  QrCode,
  Download,
  Clock,
  Zap,
  Shield,
  Activity,
  DollarSign,
  ChevronRight,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
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
import {
  CONTRACT_IDS,
  areContractsConfigured,
  getContractStatus,
  GatewayFactory,
  formatContractId,
  getContractExplorerUrl,
} from "@/lib/soroban";

const EXPLORER_URL = "https://stellar.expert/explorer/testnet";

// QR Code component using canvas
const QRCode = ({ value, size = 200 }: { value: string; size?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR-like pattern generator (visual representation)
    const moduleCount = 25;
    const moduleSize = size / moduleCount;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#39FF14';

    // Generate deterministic pattern from address
    const hash = value.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    // Draw finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
      ctx.fillStyle = '#39FF14';
      ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
    };

    drawFinder(0, 0);
    drawFinder(moduleCount - 7, 0);
    drawFinder(0, moduleCount - 7);

    // Draw data modules
    for (let i = 0; i < moduleCount; i++) {
      for (let j = 0; j < moduleCount; j++) {
        // Skip finder pattern areas
        if ((i < 8 && j < 8) || (i < 8 && j > moduleCount - 9) || (i > moduleCount - 9 && j < 8)) continue;

        const seed = (hash + i * 31 + j * 17 + value.charCodeAt(i % value.length)) % 100;
        if (seed > 45) {
          ctx.fillStyle = '#39FF14';
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize - 1, moduleSize - 1);
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-none"
    />
  );
};

// Particle background component
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }> = [];

    const colors = ['#39FF14', '#FF10F0', '#00D4FF', '#FFFF00'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '40';
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(57, 255, 20, ${0.1 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

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
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState<Transaction | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // New state for enhanced features
  const [xlmPrice, setXlmPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [showBalance, setShowBalance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastTxCount, setLastTxCount] = useState(0);

  // Contract integration state
  const [contractsConfigured, setContractsConfigured] = useState(false);
  const [totalWallets, setTotalWallets] = useState<number>(0);

  // Sound effects
  const playSound = useCallback((type: 'success' | 'error' | 'notification') => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    } else if (type === 'error') {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [soundEnabled]);

  // Fetch XLM price
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
    const interval = setInterval(fetchPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch contract status
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

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    playSound(type);
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
      setLastTxCount(txs.length);
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

  // Auto-refresh and notification for new transactions
  useEffect(() => {
    if (!publicKey) return;

    const checkNewTransactions = async () => {
      try {
        const txs = await getTransactions(publicKey);
        if (txs.length > lastTxCount && lastTxCount > 0) {
          playSound('notification');
          showToast('New transaction received!', 'success');
        }
        setTransactions(txs);
        setLastTxCount(txs.length);
      } catch (err) {
        console.error('Auto-refresh error:', err);
      }
    };

    const interval = setInterval(checkNewTransactions, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [publicKey, lastTxCount, playSound]);

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
      setLastTxCount(txs.length);
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

    const xlmBalance = balances.find((b) => b.asset === "XLM");
    if (!xlmBalance || parseFloat(xlmBalance.balance) < amount + 1) {
      setSendError("Insufficient balance (need extra 1 XLM for reserve)");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendPayment(secretKey, sendTo, sendAmount, sendMemo);
      setSendSuccess(`Success! Hash: ${result.hash.slice(0, 12)}...`);
      playSound('success');
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
      playSound('error');
    } finally {
      setIsSending(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Animated Logo */}
          <div className="relative">
            <div className="w-24 h-24 border-4 border-[#39FF14] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black text-[#39FF14]">S</span>
            </div>
            <div className="absolute -inset-2 border border-[#39FF14]/30 animate-ping" />
          </div>

          {/* Loading Steps */}
          <div className="space-y-3 text-center">
            <p className="font-black text-xl text-white">INITIALIZING WALLET</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[#39FF14] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#39FF14] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#39FF14] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2 text-[#39FF14]">
              <Check className="w-4 h-4" />
              <span>CONNECTED</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
            <div className="flex items-center gap-2 text-[#39FF14] animate-pulse">
              <Zap className="w-4 h-4" />
              <span>SYNCING</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
            <div className="flex items-center gap-2 text-white/40">
              <Shield className="w-4 h-4" />
              <span>READY</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-[#FF3131] flex items-center justify-center animate-pulse">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <p className="font-bold text-white text-lg text-center max-w-md">{error}</p>
          <button onClick={initializeWallet} className="group relative">
            <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1" />
            <div className="relative px-8 py-4 bg-black text-[#39FF14] font-black border-2 border-[#39FF14]">
              TRY AGAIN
            </div>
          </button>
        </div>
      </div>
    );
  }

  const xlmBalance = balances.find((b) => b.asset === "XLM")?.balance || "0";
  const usdValue = xlmPrice ? (parseFloat(xlmBalance) * xlmPrice).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <ParticleBackground />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 flex items-center gap-3 font-bold ${
            toast.type === 'success' ? 'bg-[#39FF14] text-black' : 'bg-[#FF3131] text-white'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-40 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#39FF14] blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-10 h-10 bg-[#39FF14] flex items-center justify-center">
                  <span className="text-xl font-black text-black">S</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-black">STELLAR</span>
                <span className="font-black text-[#39FF14]">GATEWAY</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white/5 transition-all"
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#39FF14]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/40" />
                )}
              </button>

              {/* Live Price */}
              {xlmPrice && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10">
                  <Activity className="w-4 h-4 text-[#39FF14]" />
                  <span className="font-bold text-sm">${xlmPrice.toFixed(4)}</span>
                  <span className={`text-xs font-bold ${priceChange >= 0 ? 'text-[#39FF14]' : 'text-[#FF3131]'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              )}

              <div className="px-3 py-1.5 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-bold hidden sm:block">
                TESTNET
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-3 py-2 border border-white/20 text-white/60 hover:text-white hover:border-[#FF3131] hover:bg-[#FF3131]/10 transition-all text-sm font-bold"
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
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#39FF14] text-sm font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              WELCOME BACK
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">
              {session?.user?.name?.split(" ")[0]?.toUpperCase() || "ANON"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white/5 transition-all"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <div className="relative border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
              {/* Animated Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#39FF14]/20 via-[#00D4FF]/20 to-[#FF10F0]/20 animate-gradient-x" />

              <div className="relative p-6 sm:p-8 bg-black/80">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-white/40 text-sm font-bold mb-2">TOTAL BALANCE</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#39FF14]">
                        {showBalance ? formatBalance(xlmBalance) : '••••••'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white/40">XLM</span>
                    </div>
                    {usdValue && showBalance && (
                      <div className="flex items-center gap-2 mt-2">
                        <DollarSign className="w-4 h-4 text-[#00D4FF]" />
                        <span className="text-lg font-bold text-white/60">${usdValue} USD</span>
                        {priceChange !== 0 && (
                          <span className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-[#39FF14]' : 'text-[#FF3131]'}`}>
                            {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(priceChange).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="w-12 h-12 border border-white/20 flex items-center justify-center hover:bg-[#39FF14] hover:border-[#39FF14] hover:text-black transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-[#39FF14]" : ""}`} />
                  </button>
                </div>

                {/* Address */}
                <div className="bg-black/50 border border-white/10 p-4 mb-6">
                  <p className="text-white/40 text-xs font-bold mb-2">WALLET ADDRESS</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm text-white/80 break-all">
                      {showBalance ? publicKey : publicKey.slice(0, 8) + '••••••••' + publicKey.slice(-8)}
                    </code>
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
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-4 py-3 sm:py-4 bg-black text-[#39FF14] font-black border-2 border-[#39FF14] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
                      <Send className="w-5 h-5" />
                      <span className="text-xs sm:text-base">SEND</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowReceiveModal(true)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-4 py-3 sm:py-4 bg-black text-[#00D4FF] font-black border-2 border-[#00D4FF] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
                      <QrCode className="w-5 h-5" />
                      <span className="text-xs sm:text-base">RECEIVE</span>
                    </div>
                  </button>
                  <button
                    onClick={exportTransactions}
                    disabled={transactions.length === 0}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#FF10F0] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-4 py-3 sm:py-4 bg-black text-[#FF10F0] font-black border-2 border-[#FF10F0] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform disabled:opacity-50">
                      <Download className="w-5 h-5" />
                      <span className="text-xs sm:text-base">EXPORT</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="border border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="p-6">
              <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#39FF14]" />
                ACCOUNT INFO
              </h3>

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
                  <span className="text-white/40 font-bold">Assets</span>
                  <span className="font-black">{balances.length}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/40 font-bold">Transactions</span>
                  <span className="font-black">{transactions.length}</span>
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

        {/* Smart Contracts Status */}
        {contractsConfigured && (
          <div className="mt-6 border border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="p-6">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FF10F0]" />
                SOROBAN CONTRACTS
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ZK Verifier */}
                <div className="bg-black/50 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#39FF14] animate-pulse" />
                    <span className="text-xs text-white/40 font-bold">ZK VERIFIER</span>
                  </div>
                  <a
                    href={getContractExplorerUrl(CONTRACT_IDS.ZK_VERIFIER)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#39FF14] hover:underline"
                  >
                    {formatContractId(CONTRACT_IDS.ZK_VERIFIER)}
                  </a>
                </div>

                {/* Gateway Factory */}
                <div className="bg-black/50 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#00D4FF] animate-pulse" />
                    <span className="text-xs text-white/40 font-bold">FACTORY</span>
                  </div>
                  <a
                    href={getContractExplorerUrl(CONTRACT_IDS.GATEWAY_FACTORY)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#00D4FF] hover:underline"
                  >
                    {formatContractId(CONTRACT_IDS.GATEWAY_FACTORY)}
                  </a>
                  {totalWallets > 0 && (
                    <p className="text-xs text-white/40 mt-1">{totalWallets} wallets</p>
                  )}
                </div>

                {/* JWK Registry */}
                <div className="bg-black/50 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#FF10F0] animate-pulse" />
                    <span className="text-xs text-white/40 font-bold">JWK REGISTRY</span>
                  </div>
                  <a
                    href={getContractExplorerUrl(CONTRACT_IDS.JWK_REGISTRY)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#FF10F0] hover:underline"
                  >
                    {formatContractId(CONTRACT_IDS.JWK_REGISTRY)}
                  </a>
                </div>

                {/* x402 Facilitator */}
                <div className="bg-black/50 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#FFFF00] animate-pulse" />
                    <span className="text-xs text-white/40 font-bold">x402 PAYMENTS</span>
                  </div>
                  <a
                    href={getContractExplorerUrl(CONTRACT_IDS.X402_FACILITATOR)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#FFFF00] hover:underline"
                  >
                    {formatContractId(CONTRACT_IDS.X402_FACILITATOR)}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#FF10F0]" />
              TRANSACTIONS
            </h2>
            <div className="flex items-center gap-2">
              {transactions.length > 0 && (
                <button
                  onClick={exportTransactions}
                  className="flex items-center gap-2 text-white/40 hover:text-[#FF10F0] transition-colors text-sm font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">EXPORT CSV</span>
                </button>
              )}
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 text-white/40 hover:text-[#39FF14] transition-colors text-sm font-bold"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                REFRESH
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="border border-white/10 bg-black/50 p-12 text-center">
              <div className="w-20 h-20 border-2 border-dashed border-white/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Wallet className="w-10 h-10 text-white/20" />
              </div>
              <p className="font-black text-xl text-white/60">NO TRANSACTIONS YET</p>
              <p className="text-white/40 mt-2 max-w-sm mx-auto">
                Send or receive XLM to see your transaction history here
              </p>
              <button
                onClick={() => setShowReceiveModal(true)}
                className="mt-6 px-6 py-3 bg-[#39FF14] text-black font-black hover:bg-[#39FF14]/80 transition-colors"
              >
                GET YOUR ADDRESS
              </button>
            </div>
          ) : (
            <div className="border border-white/10 divide-y divide-white/10">
              {transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  onClick={() => setShowTxModal(tx)}
                  className="flex items-center justify-between p-4 sm:p-6 bg-black/50 hover:bg-white/5 transition-all cursor-pointer group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110 ${
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
                        {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <a
                      href={`${EXPLORER_URL}/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
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
            <div className="flex items-center justify-between p-6 border-b border-[#39FF14]/30 bg-[#39FF14]">
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <Send className="w-5 h-5" />
                SEND XLM
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="w-10 h-10 bg-black text-[#39FF14] flex items-center justify-center hover:bg-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-white/40">
                      Available: <span className="text-[#39FF14]">{formatBalance(xlmBalance)} XLM</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSendAmount((parseFloat(xlmBalance) - 1.5).toFixed(7))}
                      className="text-[#00D4FF] font-bold hover:underline"
                    >
                      MAX
                    </button>
                  </div>
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

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md border-2 border-[#00D4FF] bg-black animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-[#00D4FF]/30 bg-[#00D4FF]">
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                RECEIVE XLM
              </h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-10 h-10 bg-black text-[#00D4FF] flex items-center justify-center hover:bg-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              {/* QR Code */}
              <div className="bg-black p-4 border-2 border-[#39FF14] mb-6">
                <QRCode value={publicKey} size={200} />
              </div>

              <p className="text-white/40 text-sm font-bold mb-2 text-center">
                YOUR STELLAR ADDRESS
              </p>

              <div className="w-full bg-black/50 border border-white/10 p-4 mb-4">
                <code className="font-mono text-xs text-white/80 break-all block text-center">
                  {publicKey}
                </code>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => {
                    copyAddress();
                    setShowReceiveModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#39FF14] text-black font-black hover:bg-[#39FF14]/80 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  COPY ADDRESS
                </button>
                <a
                  href={`${EXPLORER_URL}/account/${publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 flex items-center justify-center bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>

              <p className="text-white/40 text-xs mt-4 text-center">
                Share this address to receive XLM on Stellar Testnet
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg border-2 border-[#FF10F0] bg-black animate-slide-up">
            <div className={`flex items-center justify-between p-6 border-b border-[#FF10F0]/30 ${
              showTxModal.type === 'receive' ? 'bg-[#39FF14]' : 'bg-[#FF10F0]'
            }`}>
              <h3 className={`text-xl font-black flex items-center gap-2 ${
                showTxModal.type === 'receive' ? 'text-black' : 'text-white'
              }`}>
                {showTxModal.type === 'receive' ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
                {showTxModal.type === 'receive' ? 'RECEIVED' : 'SENT'}
              </h3>
              <button
                onClick={() => setShowTxModal(null)}
                className={`w-10 h-10 flex items-center justify-center ${
                  showTxModal.type === 'receive' ? 'bg-black text-[#39FF14]' : 'bg-black text-[#FF10F0]'
                } hover:bg-gray-900`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount */}
              <div className="text-center py-4">
                <p className={`text-4xl font-black ${
                  showTxModal.type === 'receive' ? 'text-[#39FF14]' : 'text-[#FF10F0]'
                }`}>
                  {showTxModal.type === 'receive' ? '+' : '-'}{formatBalance(showTxModal.amount)} XLM
                </p>
                {xlmPrice && (
                  <p className="text-white/40 mt-1">
                    ≈ ${(parseFloat(showTxModal.amount) * xlmPrice).toFixed(2)} USD
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/40 font-bold">Date</span>
                  <span className="font-bold">
                    {new Date(showTxModal.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/40 font-bold">From</span>
                  <a
                    href={`${EXPLORER_URL}/account/${showTxModal.from}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-[#00D4FF] hover:underline"
                  >
                    {shortenAddress(showTxModal.from)}
                  </a>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/40 font-bold">To</span>
                  <a
                    href={`${EXPLORER_URL}/account/${showTxModal.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-[#00D4FF] hover:underline"
                  >
                    {shortenAddress(showTxModal.to)}
                  </a>
                </div>
                <div className="py-2 border-b border-white/10">
                  <span className="text-white/40 font-bold block mb-1">Transaction Hash</span>
                  <code className="font-mono text-xs text-white/60 break-all">
                    {showTxModal.id}
                  </code>
                </div>
              </div>

              <a
                href={`${EXPLORER_URL}/tx/${showTxModal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#00D4FF] text-black font-black hover:bg-[#00D4FF]/80 transition-colors"
              >
                VIEW ON EXPLORER
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
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
        @keyframes gradient-x {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
// Redeploy Tue, Jan 20, 2026  4:15:49 PM
