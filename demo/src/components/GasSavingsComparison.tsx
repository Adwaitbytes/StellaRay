"use client";

import { TrendingDown, Zap, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchXRayMetrics, type XRayMetrics } from "@/lib/xray";

interface GasSavingsComparisonProps {
  isDark?: boolean;
}

interface GasMetric {
  operation: string;
  wasmGas: number;
  xrayGas: number;
}

export function GasSavingsComparison({ isDark = true }: GasSavingsComparisonProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [metrics, setMetrics] = useState<XRayMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchXRayMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to load gas comparison data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(loadMetrics, 15000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  // Animation effect
  useEffect(() => {
    if (!loading && metrics) {
      const timer = setTimeout(() => {
        setAnimatedProgress(100);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, metrics]);

  const formatGas = (gas: number | undefined | null) => {
    if (gas === undefined || gas === null) return '0';
    if (gas >= 1000000) return `${(gas / 1000000).toFixed(1)}M`;
    if (gas >= 1000) return `${(gas / 1000).toFixed(0)}K`;
    return gas.toString();
  };

  // Loading state
  if (loading && !metrics) {
    return (
      <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#39FF14]' : 'border-black bg-[#00AA55]'}`}>
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-black" />
            <span className="font-black text-black">GAS_COMPARISON.BENCHMARK</span>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#39FF14]" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#39FF14]' : 'border-black bg-[#00AA55]'}`}>
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-black" />
            <span className="font-black text-black">GAS_COMPARISON.BENCHMARK</span>
          </div>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{error}</span>
          </div>
          <button onClick={loadMetrics} className="px-4 py-2 border-2 border-white/30 font-black text-sm">
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // Build gas metrics from API data - map API fields to component fields
  const apiOperations = metrics?.gasComparison?.operations || [];
  const gasMetrics: GasMetric[] = apiOperations.length > 0
    ? apiOperations.map((op: any) => ({
        operation: op.name || op.operation || "Unknown",
        wasmGas: op.wasm || op.wasmGas || 0,
        xrayGas: op.xray || op.xrayGas || 0,
      }))
    : [
        { operation: "Pairing Check", wasmGas: 2500000, xrayGas: 150000 },
        { operation: "G1 Scalar Mul", wasmGas: 800000, xrayGas: 45000 },
        { operation: "G1 Addition", wasmGas: 300000, xrayGas: 15000 },
        { operation: "Poseidon Hash", wasmGas: 500000, xrayGas: 50000 },
      ];

  const totalWasm = metrics?.gasComparison?.wasmTotal || gasMetrics.reduce((acc, m) => acc + m.wasmGas, 0);
  const totalXray = metrics?.gasComparison?.xrayTotal || gasMetrics.reduce((acc, m) => acc + m.xrayGas, 0);
  const savingsPercent = metrics?.gasSavingsPercent || Math.round((1 - totalXray / totalWasm) * 100);

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#39FF14]' : 'border-black bg-[#00AA55]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-black" />
            <span className="font-black text-black">GAS_COMPARISON.BENCHMARK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
            <span className="text-xs font-black text-black">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Comparison Header */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`text-center p-3 border-2 ${isDark ? 'border-[#FF3366]/50' : 'border-[#CC0033]/50'}`}>
            <p className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>WASM (OLD)</p>
            <p className="text-xl font-black text-[#FF3366]">{formatGas(totalWasm)}</p>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className={`w-8 h-8 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          </div>
          <div className={`text-center p-3 border-2 ${isDark ? 'border-[#39FF14]/50' : 'border-[#00AA55]/50'}`}>
            <p className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>X-RAY (NEW)</p>
            <p className="text-xl font-black text-[#39FF14]">{formatGas(totalXray)}</p>
          </div>
        </div>

        {/* Operations Breakdown */}
        <div className="space-y-3 mb-6">
          {gasMetrics.map((metric, idx) => {
            const savings = Math.round((1 - metric.xrayGas / metric.wasmGas) * 100);
            const progressWidth = (animatedProgress / 100) * savings;

            return (
              <div key={idx} className={`p-3 border-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {metric.operation}
                  </span>
                  <span className="text-xs font-black text-[#39FF14]">-{savings}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-[#FF3366] to-[#39FF14] transition-all duration-1000"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#FF3366] font-mono">{formatGas(metric.wasmGas)}</span>
                    <span className={isDark ? 'text-white/30' : 'text-black/30'}>→</span>
                    <span className="text-[#39FF14] font-mono">{formatGas(metric.xrayGas)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Savings */}
        <div className={`p-4 border-4 ${isDark ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-[#00AA55] bg-[#00AA55]/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-[#39FF14]" />
              <div>
                <p className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>TOTAL SAVINGS</p>
                <p className="text-3xl font-black text-[#39FF14]">{savingsPercent}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Less gas per proof</p>
              <p className={`text-sm font-black ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {formatGas(totalWasm - totalXray)} saved
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GasSavingsComparison;
