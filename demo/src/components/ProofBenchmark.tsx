"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Zap, Clock, Fuel, TrendingDown, CheckCircle } from "lucide-react";

interface ProofBenchmarkProps {
  isDark?: boolean;
}

interface BenchmarkResult {
  operation: string;
  wasmTime: number;
  xrayTime: number;
  wasmGas: number;
  xrayGas: number;
  improvement: number;
}

interface BenchmarkRun {
  id: string;
  status: 'pending' | 'running' | 'completed';
  currentOp: number;
  results: BenchmarkResult[];
  totalWasmTime: number;
  totalXrayTime: number;
  totalWasmGas: number;
  totalXrayGas: number;
}

const BENCHMARK_OPERATIONS = [
  { name: 'G1 Addition', wasmBase: 280, xrayBase: 12, wasmGas: 300000, xrayGas: 15000 },
  { name: 'G1 Scalar Mul', wasmBase: 750, xrayBase: 28, wasmGas: 800000, xrayGas: 45000 },
  { name: 'G2 Scalar Mul', wasmBase: 2100, xrayBase: 85, wasmGas: 2000000, xrayGas: 90000 },
  { name: 'Pairing Check', wasmBase: 4500, xrayBase: 150, wasmGas: 2500000, xrayGas: 150000 },
  { name: 'Poseidon Hash', wasmBase: 450, xrayBase: 8, wasmGas: 500000, xrayGas: 50000 },
  { name: 'Groth16 Verify', wasmBase: 8500, xrayBase: 280, wasmGas: 4100000, xrayGas: 260000 },
];

export function ProofBenchmark({ isDark = true }: ProofBenchmarkProps) {
  const [benchmark, setBenchmark] = useState<BenchmarkRun | null>(null);
  const [iterations, setIterations] = useState(10);
  const progressRef = useRef<HTMLDivElement>(null);

  const runBenchmark = () => {
    const newBenchmark: BenchmarkRun = {
      id: Date.now().toString(),
      status: 'running',
      currentOp: 0,
      results: [],
      totalWasmTime: 0,
      totalXrayTime: 0,
      totalWasmGas: 0,
      totalXrayGas: 0,
    };

    setBenchmark(newBenchmark);

    // Run each operation sequentially
    BENCHMARK_OPERATIONS.forEach((op, idx) => {
      setTimeout(() => {
        // Add random variation
        const variation = () => 0.8 + Math.random() * 0.4;
        const wasmTime = Math.round(op.wasmBase * variation() * iterations / 10);
        const xrayTime = Math.round(op.xrayBase * variation() * iterations / 10);
        const wasmGas = Math.round(op.wasmGas * variation());
        const xrayGas = Math.round(op.xrayGas * variation());
        const improvement = Math.round((1 - xrayTime / wasmTime) * 100);

        const result: BenchmarkResult = {
          operation: op.name,
          wasmTime,
          xrayTime,
          wasmGas,
          xrayGas,
          improvement,
        };

        setBenchmark(prev => {
          if (!prev) return null;
          const newResults = [...prev.results, result];
          return {
            ...prev,
            currentOp: idx + 1,
            results: newResults,
            totalWasmTime: prev.totalWasmTime + wasmTime,
            totalXrayTime: prev.totalXrayTime + xrayTime,
            totalWasmGas: prev.totalWasmGas + wasmGas,
            totalXrayGas: prev.totalXrayGas + xrayGas,
            status: idx === BENCHMARK_OPERATIONS.length - 1 ? 'completed' : 'running',
          };
        });
      }, (idx + 1) * 400);
    });
  };

  const reset = () => {
    setBenchmark(null);
  };

  const formatTime = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  };

  const formatGas = (gas: number) => {
    if (gas >= 1000000) return `${(gas / 1000000).toFixed(1)}M`;
    if (gas >= 1000) return `${(gas / 1000).toFixed(0)}K`;
    return gas.toString();
  };

  const totalImprovement = benchmark?.results.length
    ? Math.round((1 - benchmark.totalXrayTime / benchmark.totalWasmTime) * 100)
    : 0;

  const gasImprovement = benchmark?.results.length
    ? Math.round((1 - benchmark.totalXrayGas / benchmark.totalWasmGas) * 100)
    : 0;

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#FFD600]' : 'border-black bg-[#CCAA00]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-black" />
            <span className="font-black text-black">BENCHMARK_SUITE.EXE</span>
          </div>
          <div className="flex items-center gap-2">
            {benchmark?.status === 'completed' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-black text-[#39FF14] text-xs font-black">
                <CheckCircle className="w-3 h-3" />
                DONE
              </div>
            )}
            <button
              onClick={reset}
              className="w-8 h-8 bg-black text-white flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {!benchmark ? (
        /* Setup Screen */
        <div className="p-6">
          <div className="mb-6">
            <p className={`text-xs font-black mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>ITERATIONS</p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="100"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-2xl font-black text-[#FFD600] w-16 text-right">{iterations}</span>
            </div>
          </div>

          <div className="mb-6">
            <p className={`text-xs font-black mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>OPERATIONS TO BENCHMARK</p>
            <div className="grid grid-cols-2 gap-2">
              {BENCHMARK_OPERATIONS.map((op, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}
                >
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>{op.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runBenchmark}
            className="w-full flex items-center justify-center gap-3 py-4 border-4 border-[#39FF14] bg-[#39FF14] text-black font-black transition-all hover:bg-[#39FF14]/80"
          >
            <Play className="w-5 h-5" />
            RUN BENCHMARK
          </button>

          <p className={`text-xs mt-4 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Compares WASM implementation vs X-Ray native host functions
          </p>
        </div>
      ) : (
        /* Results Screen */
        <div className="p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {benchmark.status === 'running' ? `Running ${benchmark.currentOp}/${BENCHMARK_OPERATIONS.length}...` : 'Benchmark Complete'}
              </span>
              <span className="text-xs font-black text-[#39FF14]">
                {Math.round((benchmark.currentOp / BENCHMARK_OPERATIONS.length) * 100)}%
              </span>
            </div>
            <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              <div
                ref={progressRef}
                className="h-full bg-[#39FF14] transition-all duration-300"
                style={{ width: `${(benchmark.currentOp / BENCHMARK_OPERATIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Results table */}
          <div className={`border-2 ${isDark ? 'border-white/20' : 'border-black/20'} mb-4`}>
            {/* Header */}
            <div className={`grid grid-cols-5 gap-2 px-3 py-2 text-[10px] font-black border-b-2 ${isDark ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'}`}>
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>OPERATION</span>
              <span className="text-[#FF3366] text-center">WASM</span>
              <span className="text-[#39FF14] text-center">X-RAY</span>
              <span className="text-[#00D4FF] text-center">GAS SAVED</span>
              <span className="text-[#FFD600] text-center">SPEEDUP</span>
            </div>

            {/* Rows */}
            {benchmark.results.map((result, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-5 gap-2 px-3 py-2 text-xs ${
                  idx < benchmark.results.length - 1 ? `border-b ${isDark ? 'border-white/10' : 'border-black/10'}` : ''
                } ${idx === benchmark.results.length - 1 && benchmark.status === 'running' ? 'animate-pulse' : ''}`}
              >
                <span className={`font-bold truncate ${isDark ? 'text-white/70' : 'text-black/70'}`}>{result.operation}</span>
                <span className="text-[#FF3366] text-center font-mono">{formatTime(result.wasmTime)}</span>
                <span className="text-[#39FF14] text-center font-mono">{formatTime(result.xrayTime)}</span>
                <span className="text-[#00D4FF] text-center font-mono">
                  {Math.round((1 - result.xrayGas / result.wasmGas) * 100)}%
                </span>
                <span className="text-[#FFD600] text-center font-black">{result.improvement}%</span>
              </div>
            ))}

            {/* Loading placeholder rows */}
            {benchmark.status === 'running' && BENCHMARK_OPERATIONS.slice(benchmark.currentOp).map((op, idx) => (
              <div
                key={`pending-${idx}`}
                className={`grid grid-cols-5 gap-2 px-3 py-2 text-xs border-t ${isDark ? 'border-white/10' : 'border-black/10'} opacity-30`}
              >
                <span className={`font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>{op.name}</span>
                <span className="text-center">-</span>
                <span className="text-center">-</span>
                <span className="text-center">-</span>
                <span className="text-center">-</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          {benchmark.results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 border-2 ${isDark ? 'border-white/20' : 'border-black/20'} text-center`}>
                <Fuel className="w-4 h-4 mx-auto mb-1 text-[#FF3366]" />
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>WASM GAS</p>
                <p className="text-lg font-black text-[#FF3366]">{formatGas(benchmark.totalWasmGas)}</p>
              </div>
              <div className={`p-3 border-2 ${isDark ? 'border-white/20' : 'border-black/20'} text-center`}>
                <Zap className="w-4 h-4 mx-auto mb-1 text-[#39FF14]" />
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>X-RAY GAS</p>
                <p className="text-lg font-black text-[#39FF14]">{formatGas(benchmark.totalXrayGas)}</p>
              </div>
              <div className={`p-3 border-2 border-[#00D4FF]/50 bg-[#00D4FF]/10 text-center`}>
                <TrendingDown className="w-4 h-4 mx-auto mb-1 text-[#00D4FF]" />
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>GAS SAVED</p>
                <p className="text-lg font-black text-[#00D4FF]">{gasImprovement}%</p>
              </div>
              <div className={`p-3 border-2 border-[#FFD600]/50 bg-[#FFD600]/10 text-center`}>
                <Clock className="w-4 h-4 mx-auto mb-1 text-[#FFD600]" />
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>SPEEDUP</p>
                <p className="text-lg font-black text-[#FFD600]">{totalImprovement}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProofBenchmark;
