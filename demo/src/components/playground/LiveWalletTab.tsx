"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Wallet, Activity, TrendingUp, Zap, Shield } from "lucide-react";
import LiveWalletConnect from "./LiveWalletConnect";
import LiveWalletDashboard from "./LiveWalletDashboard";

interface LiveWalletTabProps {
  isDark: boolean;
}

interface WalletState {
  address: string;
  balances: { asset: string; amount: string }[];
  transactions: {
    hash: string;
    type: string;
    amount: string;
    to: string;
    date: string;
  }[];
}

interface MetricDef {
  icon: typeof Wallet;
  label: string;
  value: number;
  suffix: string;
  color: string;
}

const METRICS: MetricDef[] = [
  {
    icon: Shield,
    label: "PROOFS VERIFIED",
    value: 15847,
    suffix: "",
    color: "#39FF14",
  },
  {
    icon: Zap,
    label: "BN254 OPERATIONS",
    value: 47541,
    suffix: "",
    color: "#0066FF",
  },
  {
    icon: TrendingUp,
    label: "GAS SAVINGS",
    value: 94,
    suffix: "%",
    color: "#FFD600",
  },
  {
    icon: Activity,
    label: "POSEIDON HASHES",
    value: 31694,
    suffix: "",
    color: "#00D4FF",
  },
  {
    icon: Wallet,
    label: "AVG VERIFICATION",
    value: 12,
    suffix: "ms",
    color: "#FF3366",
  },
];

function generateAddress(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let addr = "G";
  for (let i = 0; i < 55; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

function generateTxHash(): string {
  const hex = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += hex[Math.floor(Math.random() * hex.length)];
  }
  return hash;
}

function useAnimatedCounter(target: number, active: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    const startTime = performance.now();

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, active, duration]);

  return value;
}

function MetricCard({
  metric,
  active,
  isDark,
}: {
  metric: MetricDef;
  active: boolean;
  isDark: boolean;
}) {
  const animatedValue = useAnimatedCounter(metric.value, active);
  const Icon = metric.icon;

  const formatted =
    metric.value >= 1000
      ? animatedValue.toLocaleString()
      : String(animatedValue);

  return (
    <div
      className={`border-2 sm:border-4 p-3 sm:p-4 ${
        isDark ? "border-white/20 bg-[#0A0A0A]" : "border-black/20 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: metric.color }} />
        <span
          className={`text-[10px] sm:text-xs font-black uppercase ${
            isDark ? "text-white/50" : "text-black/50"
          }`}
        >
          {metric.label}
        </span>
      </div>
      <p
        className={`font-black text-xl sm:text-2xl font-mono ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        {formatted}
        {metric.suffix}
      </p>
    </div>
  );
}

export default function LiveWalletTab({ isDark }: LiveWalletTabProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [proofStatus, setProofStatus] = useState<
    "generating" | "ready" | "none"
  >("none");

  const simulateConnect = useCallback(async () => {
    setIsConnecting(true);
    setProofStatus("generating");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const address = generateAddress();
    setWallet({
      address,
      balances: [
        { asset: "XLM", amount: "10,000.00" },
        { asset: "USDC", amount: "250.00" },
        { asset: "yXLM", amount: "5,000.00" },
      ],
      transactions: [],
    });

    setIsConnected(true);
    setIsConnecting(false);
    setProofStatus("ready");
  }, []);

  const simulateSend = useCallback(
    async (to: string, amount: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!wallet) return;

      const newTx = {
        hash: generateTxHash(),
        type: "Payment",
        amount,
        to,
        date: new Date().toISOString(),
      };

      const currentXlm = parseFloat(
        wallet.balances
          .find((b) => b.asset === "XLM")!
          .amount.replace(/,/g, "")
      );
      const newXlm = (currentXlm - parseFloat(amount)).toFixed(2);
      const formattedXlm = parseFloat(newXlm).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      });

      setWallet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          balances: prev.balances.map((b) =>
            b.asset === "XLM" ? { ...b, amount: formattedXlm } : b
          ),
          transactions: [newTx, ...prev.transactions],
        };
      });
    },
    [wallet]
  );

  const handleRefresh = useCallback(() => {
    setProofStatus("generating");
    setTimeout(() => setProofStatus("ready"), 1200);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setWallet(null);
    setProofStatus("none");
  }, []);

  if (!isConnected) {
    return (
      <LiveWalletConnect
        onConnect={simulateConnect}
        isConnecting={isConnecting}
        isDark={isDark}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 p-2 sm:p-5">
      {/* Dashboard: columns 1-2 */}
      <div className="lg:col-span-2">
        <LiveWalletDashboard
          address={wallet!.address}
          balances={wallet!.balances}
          transactions={wallet!.transactions}
          proofStatus={proofStatus}
          onSend={simulateSend}
          onRefresh={handleRefresh}
          onDisconnect={handleDisconnect}
          isDark={isDark}
        />
      </div>

      {/* Metrics sidebar: column 3 */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#39FF14]" />
          <span
            className={`font-black text-[10px] sm:text-xs uppercase ${
              isDark ? "text-white/60" : "text-black/60"
            }`}
          >
            NETWORK METRICS
          </span>
        </div>

        {METRICS.map((metric) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            active={isConnected}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
}
