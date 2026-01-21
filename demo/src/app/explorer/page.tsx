"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Shield,
  Cpu,
  Hash,
  Clock,
  Activity,
  Download,
  Sun,
  Moon,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Award,
  Globe,
  Target,
  Calculator,
  GitBranch,
} from "lucide-react";
import { ZKProofVisualizer } from "@/components/ZKProofVisualizer";
import { GasSavingsComparison } from "@/components/GasSavingsComparison";
import { ProofTimeline } from "@/components/ProofTimeline";
import { ProofMetrics } from "@/components/ProofMetrics";
import { NetworkActivityMonitor } from "@/components/NetworkActivityMonitor";
import { BN254CurveExplorer } from "@/components/BN254CurveExplorer";
import { ProofBenchmark } from "@/components/ProofBenchmark";
import { PrivacyCalculator } from "@/components/PrivacyCalculator";
import { IdentityBadgeSystem } from "@/components/IdentityBadgeSystem";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import {
  fetchXRayMetrics,
  fetchXRayStatus,
  generateProofData,
  fetchRecentProofs,
  formatNumber,
  type ProofData,
  type XRayStatus,
} from "@/lib/xray";

export default function ExplorerPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visualizer" | "comparison" | "timeline" | "network" | "curve" | "benchmark" | "privacy" | "badges" | "analytics">("visualizer");
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  // Dynamic state
  const [proof, setProof] = useState<ProofData | null>(null);
  const [protocolStatus, setProtocolStatus] = useState<XRayStatus | null>(null);
  const [recentProofs, setRecentProofs] = useState<ProofData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [status, proofs] = await Promise.all([
        fetchXRayStatus(),
        fetchRecentProofs(5),
      ]);

      setProtocolStatus(status);
      setRecentProofs(proofs);

      // Set current proof to the most recent one or generate new
      if (proofs.length > 0) {
        setProof(proofs[0]);
      } else {
        setProof(generateProofData());
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
      // Fallback to generated data
      setProof(generateProofData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh proof data
  useEffect(() => {
    const interval = setInterval(() => {
      const newProof = generateProofData();
      setProof(newProof);
      setRecentProofs(prev => [newProof, ...prev.slice(0, 4)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportProof = () => {
    if (!proof) return;
    const dataStr = JSON.stringify(proof, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-${proof.id.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectProof = (p: ProofData) => {
    setProof(p);
    // Show notification
    setSelectedNotification(`Viewing proof ${p.id.slice(0, 10)}...`);
    setTimeout(() => setSelectedNotification(null), 2000);
    // Scroll to proof details on mobile
    if (typeof window !== 'undefined') {
      const proofDetails = document.getElementById('proof-details');
      if (proofDetails && window.innerWidth < 1024) {
        proofDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (loading && !proof) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'}`}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#39FF14]" />
          <span className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>Loading X-Ray Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'}`}>
      {/* Selection Notification */}
      {selectedNotification && (
        <div className="fixed top-24 right-6 z-50 px-6 py-4 bg-[#39FF14] text-black font-black animate-pulse">
          {selectedNotification}
        </div>
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'} border-b-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className={`w-12 h-12 border-4 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} flex items-center justify-center transition-all`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 bg-[#39FF14] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tighter">PROOF</span>
                  <span className="text-xl font-black tracking-tighter text-[#39FF14]">EXPLORER</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                disabled={loading}
                className={`w-12 h-12 border-4 ${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'} flex items-center justify-center transition-all`}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-12 h-12 border-4 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} flex items-center justify-center transition-all`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className={`px-4 py-2 border-4 ${isDark ? 'border-[#39FF14] text-[#39FF14]' : 'border-[#00AA55] text-[#00AA55]'} font-black text-sm flex items-center gap-2`}>
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
                X-RAY PROTOCOL {protocolStatus?.protocolVersion || 25}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2">
            ZK PROOF <span className="text-[#39FF14]">EXPLORER</span>
          </h1>
          <p className={`${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Live zero-knowledge proof data from Stellar X-Ray Protocol.
            {protocolStatus && (
              <span className="ml-2 text-[#39FF14]">
                • {protocolStatus.status.toUpperCase()} on {protocolStatus.network.toUpperCase()}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 border-4 border-yellow-500/50 bg-yellow-500/10 flex items-center gap-3`}>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className={isDark ? 'text-white' : 'text-black'}>{error} - Showing generated data</span>
          </div>
        )}

        {/* Metrics Overview */}
        <div className="mb-8">
          <ProofMetrics isDark={isDark} autoRefresh={true} refreshInterval={5000} />
        </div>

        {/* Recent Proofs List */}
        {recentProofs.length > 0 && (
          <div className={`mb-6 p-4 border-4 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>RECENT PROOFS (Click to view details)</p>
              {proof && (
                <span className="text-xs text-[#39FF14] font-mono">
                  Selected: {proof.id.slice(0, 10)}...
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {recentProofs.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => selectProof(p)}
                  className={`px-4 py-3 border-2 text-xs font-mono transition-all cursor-pointer ${
                    proof?.id === p.id
                      ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14] scale-105 shadow-lg shadow-[#39FF14]/20'
                      : `${isDark ? 'border-white/30 hover:border-[#39FF14] hover:bg-[#39FF14]/10 hover:text-[#39FF14]' : 'border-black/30 hover:border-[#00AA55] hover:bg-[#00AA55]/10'}`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {proof?.id === p.id && <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />}
                    <span>{p.id.slice(0, 10)}...</span>
                    {idx === 0 && <span className="text-[10px] text-[#39FF14] font-black">LATEST</span>}
                  </div>
                </button>
              ))}
            </div>
            <p className={`mt-3 text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              Click any proof to view its details in the panel <span className="hidden lg:inline">on the right →</span><span className="lg:hidden">below ↓</span>
            </p>
          </div>
        )}

        {/* Tab Navigation - Core Features */}
        <div className="mb-3">
          <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>CORE FEATURES</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "visualizer", label: "VISUALIZER", icon: Activity },
              { id: "comparison", label: "GAS COMPARISON", icon: Cpu },
              { id: "timeline", label: "TIMELINE", icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-4 font-black text-xs transition-all ${
                  activeTab === tab.id
                    ? 'border-[#39FF14] bg-[#39FF14] text-black'
                    : `${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation - Advanced Features */}
        <div className="mb-6">
          <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>ADVANCED FEATURES</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "network", label: "NETWORK", icon: Globe },
              { id: "curve", label: "BN254 CURVE", icon: GitBranch },
              { id: "benchmark", label: "BENCHMARK", icon: Target },
              { id: "privacy", label: "PRIVACY", icon: Shield },
              { id: "badges", label: "BADGES", icon: Award },
              { id: "analytics", label: "ANALYTICS", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-4 font-black text-xs transition-all ${
                  activeTab === tab.id
                    ? 'border-[#00D4FF] bg-[#00D4FF] text-black'
                    : `${isDark ? 'border-white/30 hover:border-white' : 'border-black/30 hover:border-black'}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`grid gap-6 ${['network', 'curve', 'benchmark', 'privacy', 'badges', 'analytics'].includes(activeTab) ? '' : 'lg:grid-cols-3'}`}>
          <div className={['network', 'curve', 'benchmark', 'privacy', 'badges', 'analytics'].includes(activeTab) ? '' : 'lg:col-span-2'}>
            {/* Core Features */}
            {activeTab === "visualizer" && <ZKProofVisualizer isDark={isDark} />}
            {activeTab === "comparison" && <GasSavingsComparison isDark={isDark} />}
            {activeTab === "timeline" && <ProofTimeline isDark={isDark} />}

            {/* Advanced Features - Full Width */}
            {activeTab === "network" && <NetworkActivityMonitor isDark={isDark} />}
            {activeTab === "curve" && <BN254CurveExplorer isDark={isDark} />}
            {activeTab === "benchmark" && <ProofBenchmark isDark={isDark} />}
            {activeTab === "privacy" && <PrivacyCalculator isDark={isDark} />}
            {activeTab === "badges" && <IdentityBadgeSystem isDark={isDark} />}
            {activeTab === "analytics" && <AdvancedAnalyticsDashboard isDark={isDark} />}
          </div>

          {/* Proof Details Sidebar - Only show for core features */}
          {proof && !['network', 'curve', 'benchmark', 'privacy', 'badges', 'analytics'].includes(activeTab) && (
            <div id="proof-details" className={`border-4 ${isDark ? 'border-white' : 'border-black'} h-fit`}>
              <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'} flex items-center justify-between`}>
                <span className="font-black text-sm">PROOF_DATA.JSON</span>
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
              </div>
              <div className="p-6 space-y-6">
                {/* Status */}
                <div>
                  <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>STATUS</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#39FF14]" />
                    <span className="font-black text-[#39FF14]">{proof.status}</span>
                  </div>
                </div>

                {/* Proof ID */}
                <div>
                  <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>PROOF ID</p>
                  <div className="flex items-center gap-2">
                    <code className={`text-xs font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      {proof.id.slice(0, 20)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(proof.id, 'proof-id')}
                      className={`w-6 h-6 flex items-center justify-center ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                    >
                      {copied === 'proof-id' ? <Check className="w-3 h-3 text-[#39FF14]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Type & Curve */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>TYPE</p>
                    <span className="font-black text-[#00D4FF]">{proof.type}</span>
                  </div>
                  <div>
                    <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>CURVE</p>
                    <span className="font-black text-[#FF10F0]">{proof.curve}</span>
                  </div>
                </div>

                {/* Performance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>VERIFY TIME</p>
                    <span className="font-black text-[#FFD600]">{proof.verificationTime}ms</span>
                  </div>
                  <div>
                    <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>GAS USED</p>
                    <span className="font-black">{formatNumber(proof.gasUsed)}</span>
                  </div>
                </div>

                {/* Block Info */}
                {proof.blockNumber && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>BLOCK</p>
                      <span className="font-mono text-sm">{proof.blockNumber.toLocaleString()}</span>
                    </div>
                    <div>
                      <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>TIMESTAMP</p>
                      <span className="text-xs">{new Date(proof.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}

                {/* Public Inputs */}
                <div>
                  <p className={`text-xs font-black mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>PUBLIC INPUTS</p>
                  <div className="space-y-2">
                    {proof.publicInputs.map((input, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 border-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}
                      >
                        <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>{input.name}</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-[#39FF14]">{input.value}</code>
                          <button
                            onClick={() => copyToClipboard(input.fullValue || input.value, input.name)}
                            className={`w-6 h-6 flex items-center justify-center ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                          >
                            {copied === input.name ? <Check className="w-3 h-3 text-[#39FF14]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={exportProof}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 border-4 ${isDark ? 'border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black' : 'border-[#0099CC] text-[#0099CC] hover:bg-[#0099CC] hover:text-white'} font-black text-xs transition-all`}
                  >
                    <Download className="w-4 h-4" />
                    EXPORT JSON
                  </button>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(proof, null, 2), 'full-proof')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 border-4 ${isDark ? 'border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black' : 'border-[#00AA55] text-[#00AA55] hover:bg-[#00AA55] hover:text-white'} font-black text-xs transition-all`}
                  >
                    {copied === 'full-proof' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === 'full-proof' ? 'COPIED!' : 'COPY ALL'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Info Section */}
        <div className={`mt-8 border-4 ${isDark ? 'border-white' : 'border-black'}`}>
          <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#39FF14]' : 'border-black bg-[#00AA55]'}`}>
            <span className="font-black text-black">X-RAY_PROTOCOL_INFO.MD</span>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#00D4FF]" />
                  CAP-0074: BN254 Host Functions
                </h3>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-[#39FF14]">•</span>
                    <span><code className="text-[#00D4FF]">bn254_g1_add()</code> - G1 point addition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#39FF14]">•</span>
                    <span><code className="text-[#00D4FF]">bn254_g1_mul()</code> - G1 scalar multiplication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#39FF14]">•</span>
                    <span><code className="text-[#00D4FF]">bn254_multi_pairing_check()</code> - Multi-pairing verification</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-[#FF10F0]" />
                  CAP-0075: Poseidon Permutation
                </h3>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-[#39FF14]">•</span>
                    <span>ZK-friendly hash function optimized for circuits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#39FF14]">•</span>
                    <span>State sizes: t=2, 3, 4, 5 supported</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#39FF14]">•</span>
                    <span>BN254 Fr field (scalar field)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
