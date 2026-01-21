"use client";

import { Activity, Cpu, Hash, Timer, TrendingUp, Shield, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchXRayMetrics, formatNumber, type XRayMetrics } from "@/lib/xray";

interface ProofMetricsProps {
  isDark?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ProofMetrics({
  isDark = true,
  autoRefresh = true,
  refreshInterval = 5000
}: ProofMetricsProps) {
  const [metrics, setMetrics] = useState<XRayMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadMetrics = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchXRayMetrics();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMetrics]);

  if (loading && !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className={`p-4 border-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/30'} animate-pulse`}
          >
            <div className={`h-4 w-20 ${isDark ? 'bg-white/20' : 'bg-black/20'} mb-2`} />
            <div className={`h-8 w-16 ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className={`p-6 border-4 ${isDark ? 'border-red-500/50 bg-red-500/10' : 'border-red-500/50 bg-red-500/10'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{error}</span>
        </div>
        <button
          onClick={loadMetrics}
          className={`px-4 py-2 border-2 ${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'} font-black text-sm`}
        >
          RETRY
        </button>
      </div>
    );
  }

  const metricCards = [
    {
      icon: Shield,
      label: "PROOFS VERIFIED",
      value: formatNumber(metrics?.proofsVerified || 0),
      color: "#39FF14",
      subtext: "Groth16 proofs"
    },
    {
      icon: Cpu,
      label: "BN254 OPS",
      value: formatNumber(metrics?.bn254Operations || 0),
      color: "#00D4FF",
      subtext: "Curve operations"
    },
    {
      icon: Hash,
      label: "POSEIDON",
      value: formatNumber(metrics?.poseidonHashes || 0),
      color: "#FF10F0",
      subtext: "Native hashes"
    },
    {
      icon: Timer,
      label: "AVG VERIFY",
      value: `${metrics?.avgVerificationMs || 0}ms`,
      color: "#FFD600",
      subtext: "Per proof"
    },
    {
      icon: TrendingUp,
      label: "GAS SAVED",
      value: `${metrics?.gasSavingsPercent || 0}%`,
      color: "#39FF14",
      subtext: "vs WASM"
    },
    {
      icon: Activity,
      label: "SUCCESS",
      value: `${metrics?.successRate || 0}%`,
      color: "#00FF88",
      subtext: "Verification rate"
    },
  ];

  return (
    <div className="space-y-4">
      {/* Refresh indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
          <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Live data • Updated {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className={`flex items-center gap-1 px-2 py-1 text-xs ${isDark ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'}`}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((metric, idx) => (
          <div
            key={idx}
            className={`p-4 border-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white/30'} transition-all hover:scale-105 relative overflow-hidden`}
          >
            {/* Live indicator for first metric */}
            {idx === 0 && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-ping" />
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              <span className={`text-[10px] font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {metric.label}
              </span>
            </div>
            <p className="text-2xl font-black" style={{ color: metric.color }}>
              {metric.value}
            </p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {metric.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProofMetrics;
