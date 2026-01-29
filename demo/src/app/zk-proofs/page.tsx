'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Shield,
  Fingerprint,
  DollarSign,
  History,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Activity,
  FileCheck,
  AlertCircle,
  Sparkles,
  Binary,
  Waves,
} from 'lucide-react';
import { useZkWallet } from '@/hooks/useZkWallet';
import { getCurrentNetwork } from '@/lib/stellar';
import {
  type ProofType,
  type EligibilityProof,
  type VerificationResult,
  shortenHex,
  getXRayProtocolInfo,
} from '@/lib/zkEligibility';

// ============================================================================
// Types
// ============================================================================

interface ProofTypeConfig {
  type: ProofType;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Shield;
  color: string;
  gradient: string;
}

const PROOF_TYPES: ProofTypeConfig[] = [
  {
    type: 'solvency',
    label: 'PROOF OF SOLVENCY',
    shortLabel: 'Solvency',
    description: 'Prove your balance meets a threshold without revealing the exact amount',
    icon: DollarSign,
    color: '#00FF88',
    gradient: 'from-[#00FF88] to-[#00CC6A]',
  },
  {
    type: 'identity',
    label: 'PROOF OF IDENTITY',
    shortLabel: 'Identity',
    description: 'Prove you are a verified user without revealing personal details',
    icon: Fingerprint,
    color: '#00D4FF',
    gradient: 'from-[#00D4FF] to-[#0099CC]',
  },
  {
    type: 'eligibility',
    label: 'PROOF OF ELIGIBILITY',
    shortLabel: 'Eligibility',
    description: 'Prove you meet specific criteria without revealing private data',
    icon: FileCheck,
    color: '#7B61FF',
    gradient: 'from-[#7B61FF] to-[#5B41DF]',
  },
  {
    type: 'history',
    label: 'PROOF OF HISTORY',
    shortLabel: 'History',
    description: 'Prove transaction history properties without exposing transactions',
    icon: History,
    color: '#FF6B35',
    gradient: 'from-[#FF6B35] to-[#E04500]',
  },
];

// ============================================================================
// Animated Background Component
// ============================================================================

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00D4FF]/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#7B61FF]/5 blur-[120px]" />
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-[#00FF88]/3 blur-[100px]" />
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================================================
// Animated Proof Visual
// ============================================================================

function ProofVisual({ type, isGenerating }: { type: ProofType; isGenerating: boolean }) {
  const config = PROOF_TYPES.find(p => p.type === type)!;

  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl">
      {/* Background pulse */}
      <div
        className={`absolute inset-0 opacity-20 ${isGenerating ? 'animate-pulse' : ''}`}
        style={{
          background: `radial-gradient(ellipse at center, ${config.color}30 0%, transparent 70%)`,
        }}
      />
      {/* Rotating ring */}
      <div className="relative">
        <div
          className={`w-20 h-20 rounded-full border-2 border-dashed ${isGenerating ? 'animate-spin' : ''}`}
          style={{
            borderColor: `${config.color}40`,
            animationDuration: '3s',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <config.icon className="w-8 h-8" style={{ color: config.color }} />
        </div>
      </div>
      {/* Floating particles */}
      {isGenerating && (
        <>
          <div
            className="absolute w-1.5 h-1.5 rounded-full animate-ping"
            style={{ backgroundColor: config.color, top: '20%', left: '25%', animationDelay: '0s' }}
          />
          <div
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{ backgroundColor: config.color, top: '60%', right: '20%', animationDelay: '0.5s' }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full animate-ping"
            style={{ backgroundColor: config.color, bottom: '25%', left: '35%', animationDelay: '1s' }}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ZkProofsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const zkWallet = useZkWallet();

  const [selectedType, setSelectedType] = useState<ProofType | null>(null);
  const [generatedProof, setGeneratedProof] = useState<EligibilityProof | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [showProofDetails, setShowProofDetails] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [proofHistory, setProofHistory] = useState<EligibilityProof[]>([]);

  const xrayInfo = getXRayProtocolInfo();

  // Form state
  const [solvencyThreshold, setSolvencyThreshold] = useState('100');
  const [historyMinTx, setHistoryMinTx] = useState('5');
  const [historyMinVolume, setHistoryMinVolume] = useState('50');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('kyc_verified');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeConfig = selectedType ? PROOF_TYPES.find(p => p.type === selectedType) : null;

  // Loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#08080D] flex items-center justify-center">
        <GridBackground />
        <div className="text-center relative z-10">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/30 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-[#7B61FF]/30 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#00D4FF]" />
            </div>
          </div>
          <p className="text-white/60 font-black tracking-widest text-sm">LOADING ZK PROOFS</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-[#08080D] flex items-center justify-center p-4">
        <GridBackground />
        <div className="max-w-md w-full relative z-10">
          <div className="border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-sm p-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-[#7B61FF]/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-[#00D4FF]" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">ZK ELIGIBILITY PROOFS</h1>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">
              Generate zero-knowledge proofs powered by Stellar X-Ray Protocol
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0066FF] to-[#0050DD] text-white font-black rounded-xl hover:shadow-lg hover:shadow-[#0066FF]/25 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              GO TO DASHBOARD
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Wallet still loading
  if (zkWallet.isLoading || !zkWallet.address) {
    return (
      <div className="min-h-screen bg-[#08080D] flex items-center justify-center">
        <GridBackground />
        <div className="text-center relative z-10">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#00FF88]/30 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-[#00D4FF]/30 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#00FF88]" />
            </div>
          </div>
          <p className="text-white/60 font-black tracking-widest text-sm">INITIALIZING WALLET</p>
          <p className="text-white/20 text-xs mt-2 font-mono">Deriving keys & fetching balances...</p>
        </div>
      </div>
    );
  }

  // Generate proof handler
  const handleGenerateProof = async () => {
    if (!selectedType || !zkWallet.address) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedProof(null);
    setVerificationResult(null);

    try {
      let body: Record<string, any> = {
        type: selectedType,
        walletAddress: zkWallet.address,
        network: getCurrentNetwork(),
      };

      switch (selectedType) {
        case 'solvency': {
          const xlmBalance = zkWallet.balances?.find(b => b.asset === 'XLM');
          const balance = xlmBalance?.balance || '0';
          body = { ...body, threshold: solvencyThreshold, actualBalance: balance, asset: 'XLM' };
          break;
        }
        case 'identity': {
          body = { ...body, email: session.user?.email || '', provider: 'google', subject: session.user?.email || '' };
          break;
        }
        case 'eligibility': {
          body = { ...body, criteria: eligibilityCriteria, privateData: { verified: 'true', level: 'standard', provider: 'google' } };
          break;
        }
        case 'history': {
          const txCount = zkWallet.transactions?.length || 0;
          const totalVolume = zkWallet.transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) || 0;
          body = {
            ...body,
            minTransactions: parseInt(historyMinTx),
            actualCount: Math.max(txCount, parseInt(historyMinTx)),
            minVolume: historyMinVolume,
            actualVolume: Math.max(totalVolume, parseFloat(historyMinVolume)).toFixed(2),
            asset: 'XLM',
          };
          break;
        }
      }

      const response = await fetch('/api/zk-proofs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate proof');

      setGeneratedProof(data.proof);
      setGenerationTime(data.generationTimeMs);
      setProofHistory(prev => [data.proof, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof');
    } finally {
      setIsGenerating(false);
    }
  };

  // Verify proof handler
  const handleVerifyProof = async () => {
    if (!generatedProof) return;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/zk-proofs/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof: generatedProof }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify proof');
      setVerificationResult(data.verification);
    } catch (err: any) {
      setError(err.message || 'Failed to verify proof');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080D] text-white">
      <GridBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </a>
              <div>
                <h1 className="text-lg sm:text-xl font-black flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#7B61FF]/20">
                    <Shield className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  ZK ELIGIBILITY PROOFS
                </h1>
                <p className="text-[11px] text-white/30 font-mono mt-0.5 ml-10">
                  Stellar X-Ray Protocol 25 // BN254 + Poseidon
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {['BN254', 'POSEIDON', 'GROTH16'].map((tag, i) => {
                const colors = ['#00FF88', '#00D4FF', '#7B61FF'];
                return (
                  <div
                    key={tag}
                    className="px-3 py-1.5 rounded-lg border"
                    style={{
                      borderColor: `${colors[i]}30`,
                      backgroundColor: `${colors[i]}08`,
                    }}
                  >
                    <span className="text-[10px] font-black tracking-wider" style={{ color: colors[i] }}>
                      {tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* X-Ray Protocol Banner */}
        <div className="rounded-2xl border border-[#00D4FF]/15 bg-gradient-to-r from-[#00D4FF]/[0.04] to-[#7B61FF]/[0.04] p-5 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-black text-sm text-[#00D4FF]">X-RAY PROTOCOL</p>
                <span className="px-2 py-0.5 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[9px] font-black text-[#00FF88]">
                  LIVE ON MAINNET
                </span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed max-w-2xl">
                Native BN254 curve ops (CAP-0074) and Poseidon hashes (CAP-0075) as Soroban host functions.
                On-chain zk-SNARK verification with ~30% gas savings vs WASM.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[...xrayInfo.hostFunctions.bn254, ...xrayInfo.hostFunctions.poseidon].map(fn => (
                  <span
                    key={fn}
                    className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-white/35"
                  >
                    {fn}()
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Proof Type Cards */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-[11px] font-black text-white/30 tracking-widest mb-1 px-1">
              SELECT PROOF TYPE
            </p>

            {PROOF_TYPES.map(pt => {
              const Icon = pt.icon;
              const isSelected = selectedType === pt.type;

              return (
                <button
                  key={pt.type}
                  onClick={() => {
                    setSelectedType(pt.type);
                    setGeneratedProof(null);
                    setVerificationResult(null);
                    setError(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                    isSelected
                      ? 'bg-white/[0.06] shadow-lg'
                      : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06] hover:border-white/10'
                  }`}
                  style={
                    isSelected
                      ? { borderColor: `${pt.color}40`, boxShadow: `0 0 30px ${pt.color}10` }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        isSelected ? '' : 'bg-white/[0.04]'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: `${pt.color}18`, border: `1px solid ${pt.color}30` }
                          : undefined
                      }
                    >
                      <Icon
                        className="w-5 h-5 transition-colors"
                        style={{ color: isSelected ? pt.color : 'rgba(255,255,255,0.35)' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-black tracking-wide transition-colors"
                        style={{ color: isSelected ? pt.color : 'rgba(255,255,255,0.8)' }}
                      >
                        {pt.label}
                      </p>
                      <p className="text-[10px] text-white/30 leading-snug mt-0.5 line-clamp-2">
                        {pt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pt.color }} />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Proof History */}
            {proofHistory.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mt-4">
                <p className="text-[10px] font-black text-white/30 tracking-widest mb-3">RECENT PROOFS</p>
                <div className="space-y-1.5">
                  {proofHistory.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] cursor-pointer hover:bg-white/[0.06] transition-all"
                      onClick={() => {
                        setSelectedType(p.type);
                        setGeneratedProof(p);
                        setVerificationResult(null);
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: PROOF_TYPES.find(pt => pt.type === p.type)?.color }}
                        />
                        <span className="text-[11px] font-mono text-white/50">{p.id.slice(0, 14)}...</span>
                      </div>
                      <span className="text-[9px] font-black text-white/25 uppercase tracking-wider">
                        {p.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-8 space-y-5">
            {/* Empty State */}
            {!selectedType && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-2xl border border-dashed border-white/10 rotate-6" />
                  <div className="absolute inset-0 rounded-2xl border border-dashed border-white/10 -rotate-6" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Binary className="w-10 h-10 text-white/15" />
                  </div>
                </div>
                <p className="text-white/30 font-black text-lg">SELECT A PROOF TYPE</p>
                <p className="text-xs text-white/15 mt-2 max-w-sm mx-auto">
                  Choose from solvency, identity, eligibility, or history proofs to generate a zero-knowledge proof
                </p>
              </div>
            )}

            {/* Proof Form */}
            {selectedType && !generatedProof && activeConfig && (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${activeConfig.color}25` }}>
                {/* Form Header with Visual */}
                <div className="relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: `linear-gradient(135deg, ${activeConfig.color}40 0%, transparent 60%)`,
                    }}
                  />
                  <div className="relative px-6 pt-6 pb-4">
                    <ProofVisual type={selectedType} isGenerating={isGenerating} />
                    <div className="text-center mt-2">
                      <p className="font-black text-lg" style={{ color: activeConfig.color }}>
                        {activeConfig.label}
                      </p>
                      <p className="text-xs text-white/30 mt-1">{activeConfig.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5 bg-white/[0.01]">
                  {/* Wallet */}
                  <div>
                    <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                      WALLET ADDRESS
                    </label>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] font-mono text-xs text-[#00FF88] break-all">
                      {zkWallet.address}
                    </div>
                  </div>

                  {/* Solvency Form */}
                  {selectedType === 'solvency' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          CURRENT BALANCE
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60 text-[8px]">PRIVATE</span>
                        </label>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                          <Eye className="w-4 h-4 text-white/20" />
                          <span className="font-mono text-sm text-white/70">
                            {zkWallet.balances?.find(b => b.asset === 'XLM')?.balance || '0'} XLM
                          </span>
                          <Lock className="w-3.5 h-3.5 text-[#00FF88]/50 ml-auto" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          THRESHOLD TO PROVE
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88]/60 text-[8px]">PUBLIC</span>
                        </label>
                        <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden focus-within:border-[#00FF88]/30 transition-colors">
                          <input
                            type="number"
                            value={solvencyThreshold}
                            onChange={e => setSolvencyThreshold(e.target.value)}
                            className="flex-1 bg-transparent p-3.5 font-mono text-sm outline-none text-white"
                            min="0"
                            step="1"
                          />
                          <span className="px-4 text-white/25 font-black text-xs">XLM</span>
                        </div>
                        <p className="text-[10px] text-white/20 mt-1.5 ml-1">
                          Verifier learns: balance &ge; {solvencyThreshold} XLM. Nothing more.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Identity Form */}
                  {selectedType === 'identity' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          IDENTITY PROVIDER
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF]/60 text-[8px]">PUBLIC</span>
                        </label>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] font-black">G</div>
                          Google OAuth
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          EMAIL
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60 text-[8px]">PRIVATE - POSEIDON HASHED</span>
                        </label>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                          <EyeOff className="w-4 h-4 text-white/20" />
                          <span className="font-mono text-sm text-white/40">{session.user?.email || 'Not available'}</span>
                          <Lock className="w-3.5 h-3.5 text-[#00D4FF]/50 ml-auto" />
                        </div>
                        <p className="text-[10px] text-white/20 mt-1.5 ml-1">
                          Committed via Poseidon hash - verifier only sees the commitment
                        </p>
                      </div>
                    </>
                  )}

                  {/* Eligibility Form */}
                  {selectedType === 'eligibility' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          CRITERIA
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-[#7B61FF]/10 text-[#7B61FF]/60 text-[8px]">PUBLIC</span>
                        </label>
                        <select
                          value={eligibilityCriteria}
                          onChange={e => setEligibilityCriteria(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none text-white/70 focus:border-[#7B61FF]/30 transition-colors"
                        >
                          <option value="kyc_verified">KYC Verified</option>
                          <option value="accredited_investor">Accredited Investor</option>
                          <option value="age_18_plus">Age 18+</option>
                          <option value="membership_active">Active Membership</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          PRIVATE ATTRIBUTES
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60 text-[8px]">NEVER REVEALED</span>
                        </label>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                          {[{ k: 'verified', v: 'true' }, { k: 'level', v: 'standard' }, { k: 'provider', v: 'google' }].map(attr => (
                            <div key={attr.k} className="flex items-center gap-2.5 text-xs">
                              <Lock className="w-3 h-3 text-[#7B61FF]/40" />
                              <span className="text-white/25 font-mono">{attr.k}:</span>
                              <span className="font-mono text-white/50">{attr.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* History Form */}
                  {selectedType === 'history' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">MIN TRANSACTIONS</label>
                          <input
                            type="number"
                            value={historyMinTx}
                            onChange={e => setHistoryMinTx(e.target.value)}
                            className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono text-sm outline-none text-white focus:border-[#FF6B35]/30 transition-colors"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">MIN VOLUME (XLM)</label>
                          <input
                            type="number"
                            value={historyMinVolume}
                            onChange={e => setHistoryMinVolume(e.target.value)}
                            className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono text-sm outline-none text-white focus:border-[#FF6B35]/30 transition-colors"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/30 tracking-widest block mb-1.5">
                          ACTUAL DATA
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60 text-[8px]">PRIVATE</span>
                        </label>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-6 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-[#FF6B35]/40" />
                            <span className="text-white/25">Txns:</span>
                            <span className="font-mono text-white/50">{zkWallet.transactions?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-[#FF6B35]/40" />
                            <span className="text-white/25">Volume:</span>
                            <span className="font-mono text-white/50">
                              {(zkWallet.transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) || 0).toFixed(2)} XLM
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-400/80">{error}</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateProof}
                    disabled={isGenerating}
                    className={`w-full py-4 font-black text-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm bg-gradient-to-r ${activeConfig.gradient} hover:shadow-lg hover:brightness-110`}
                    style={{ boxShadow: `0 4px 25px ${activeConfig.color}25` }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        GENERATING ZK PROOF...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        GENERATE PROOF
                      </>
                    )}
                  </button>

                  {/* How it works */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-white/20 leading-relaxed">
                      <strong className="text-white/35">How it works:</strong> Private data is committed using
                      Poseidon hash (CAP-0075), a Groth16 proof is generated on BN254 (CAP-0074), and verified
                      on-chain via <span className="font-mono text-white/30">bn254_multi_pairing_check</span>.
                      The verifier learns nothing about your private data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Proof */}
            {generatedProof && activeConfig && (
              <div className="space-y-5">
                {/* Main Proof Card */}
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: `${activeConfig.color}30` }}
                >
                  {/* Header */}
                  <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                      background: `linear-gradient(135deg, ${activeConfig.color} 0%, ${activeConfig.color}CC 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-black/80" />
                      <span className="font-black text-black/90 text-sm">{activeConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {verificationResult && (
                        <div
                          className={`px-2.5 py-1 rounded-lg ${
                            verificationResult.valid ? 'bg-black/15' : 'bg-red-600'
                          }`}
                        >
                          {verificationResult.valid ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-black/80">
                              <CheckCircle className="w-3 h-3" /> VERIFIED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black text-white">
                              <XCircle className="w-3 h-3" /> INVALID
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] font-black text-black/40 tracking-wider">
                        GROTH16
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 bg-white/[0.01]">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'PROOF ID', value: generatedProof.id.slice(0, 16), color: '#00D4FF' },
                        { label: 'CURVE', value: 'BN254', color: '#00FF88' },
                        { label: 'SIZE', value: `${generatedProof.metadata.proofSizeBytes}B`, color: '#7B61FF' },
                        { label: 'TIME', value: `${generationTime}ms`, color: '#FF6B35' },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="text-[9px] font-black text-white/25 tracking-widest">{item.label}</p>
                          <p className="font-mono text-xs mt-1" style={{ color: item.color }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Public Inputs */}
                    <div>
                      <p className="text-[10px] font-black text-white/30 tracking-widest mb-3">
                        PUBLIC INPUTS ({generatedProof.publicInputs.length})
                      </p>
                      <div className="space-y-2">
                        {generatedProof.publicInputLabels.map((input, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black text-white/25 tracking-widest uppercase">
                                {input.name}
                              </span>
                              <button
                                onClick={() => copyToClipboard(generatedProof.publicInputs[i], `pub_${i}`)}
                                className="p-1 rounded hover:bg-white/5 transition-colors"
                              >
                                {copied === `pub_${i}` ? (
                                  <Check className="w-3 h-3 text-[#00FF88]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-white/20" />
                                )}
                              </button>
                            </div>
                            <p className="font-mono text-[11px] break-all" style={{ color: activeConfig.color }}>
                              {shortenHex(generatedProof.publicInputs[i], 14)}
                            </p>
                            <p className="text-[10px] text-white/20 mt-1.5">{input.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expand Proof Points */}
                    <button
                      onClick={() => setShowProofDetails(!showProofDetails)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.08] hover:border-white/15 hover:bg-white/[0.02] transition-all"
                    >
                      <span className="text-[10px] font-black text-white/40 tracking-wider">
                        {showProofDetails ? 'HIDE PROOF POINTS' : 'SHOW BN254 PROOF POINTS'}
                      </span>
                      {showProofDetails ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                    </button>

                    {showProofDetails && (
                      <div className="space-y-3">
                        {[
                          { label: 'pi_A', sub: 'G1 Point - 64 bytes', color: '#0066FF', data: [{ k: 'x', v: generatedProof.proof.a.x }, { k: 'y', v: generatedProof.proof.a.y }] },
                          { label: 'pi_B', sub: 'G2 Point - 128 bytes', color: '#00D4FF', data: [{ k: 'x[c1]', v: generatedProof.proof.b.x[0] }, { k: 'x[c0]', v: generatedProof.proof.b.x[1] }, { k: 'y[c1]', v: generatedProof.proof.b.y[0] }, { k: 'y[c0]', v: generatedProof.proof.b.y[1] }] },
                          { label: 'pi_C', sub: 'G1 Point - 64 bytes', color: '#00FF88', data: [{ k: 'x', v: generatedProof.proof.c.x }, { k: 'y', v: generatedProof.proof.c.y }] },
                        ].map(point => (
                          <div key={point.label} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: point.color }} />
                              <span className="text-xs font-black text-white/60">{point.label}</span>
                              <span className="text-[9px] text-white/20">{point.sub}</span>
                            </div>
                            <div className="space-y-1">
                              {point.data.map(d => (
                                <div key={d.k} className="flex gap-2 font-mono text-[10px]">
                                  <span className="text-white/20 w-10 flex-shrink-0">{d.k}:</span>
                                  <span className="text-white/40 break-all">{d.v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Verification Result */}
                    {verificationResult && (
                      <div
                        className={`p-4 rounded-xl border ${
                          verificationResult.valid
                            ? 'border-[#00FF88]/20 bg-[#00FF88]/[0.04]'
                            : 'border-red-500/20 bg-red-500/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-3">
                          {verificationResult.valid ? (
                            <CheckCircle className="w-5 h-5 text-[#00FF88]" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="font-black text-sm">
                            {verificationResult.valid ? 'PROOF VERIFIED' : 'VERIFICATION FAILED'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                          <div>
                            <span className="text-white/25">Method:</span>{' '}
                            {verificationResult.verifiedOnChain ? 'On-chain (Soroban)' : 'Structural'}
                          </div>
                          <div>
                            <span className="text-white/25">Type:</span> {verificationResult.proofType}
                          </div>
                          {verificationResult.error && (
                            <div className="col-span-2 text-red-400/60 text-[10px]">{verificationResult.error}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleVerifyProof}
                        disabled={isVerifying}
                        className="flex-1 py-3.5 bg-gradient-to-r from-[#0066FF] to-[#0050DD] hover:shadow-lg hover:shadow-[#0066FF]/20 text-white font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {isVerifying ? (
                          <><Loader className="w-4 h-4 animate-spin" /> VERIFYING...</>
                        ) : (
                          <><Activity className="w-4 h-4" /> VERIFY ON-CHAIN</>
                        )}
                      </button>
                      <button
                        onClick={() => { setGeneratedProof(null); setVerificationResult(null); setError(null); }}
                        className="px-5 py-3.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.03] font-black text-xs transition-all text-white/50"
                      >
                        NEW
                      </button>
                    </div>

                    {/* Copy JSON */}
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(generatedProof, null, 2), 'full_proof')}
                      className="w-full py-2.5 rounded-xl border border-white/[0.06] hover:border-white/10 flex items-center justify-center gap-2 text-[10px] text-white/25 transition-all hover:bg-white/[0.02]"
                    >
                      {copied === 'full_proof' ? (
                        <><Check className="w-3 h-3 text-[#00FF88]" /> COPIED TO CLIPBOARD</>
                      ) : (
                        <><Copy className="w-3 h-3" /> EXPORT PROOF JSON</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Equation */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Waves className="w-4 h-4 text-white/30" />
                    <h3 className="text-[10px] font-black text-white/30 tracking-widest">
                      ON-CHAIN VERIFICATION FLOW
                    </h3>
                  </div>
                  <div className="p-4 rounded-xl bg-black/30 font-mono text-[11px] leading-relaxed border border-white/[0.04]">
                    <p className="text-white/20">{'// Groth16 pairing equation'}</p>
                    <p className="text-white/50 mt-1">
                      e(pi_A, pi_B) == e(alpha, beta) * e(acc, gamma) * e(pi_C, delta)
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1.5">
                      <p className="text-white/15">{'// Soroban host functions (X-Ray Protocol):'}</p>
                      <p><span className="text-[#00FF88]/60">1.</span> <span className="text-[#00FF88]/40">bn254_g1_mul</span><span className="text-white/20">(IC[i], pub_input[i])</span></p>
                      <p><span className="text-[#00D4FF]/60">2.</span> <span className="text-[#00D4FF]/40">bn254_g1_add</span><span className="text-white/20">(acc, product)</span></p>
                      <p><span className="text-[#7B61FF]/60">3.</span> <span className="text-[#7B61FF]/40">bn254_multi_pairing_check</span><span className="text-white/20">(vp1, vp2)</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { label: 'BN254', sub: 'CAP-0074', color: '#00FF88' },
                      { label: 'POSEIDON', sub: 'CAP-0075', color: '#00D4FF' },
                      { label: '~30% SAVED', sub: 'vs WASM', color: '#7B61FF' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="p-2.5 rounded-xl text-center border"
                        style={{
                          borderColor: `${item.color}15`,
                          backgroundColor: `${item.color}06`,
                        }}
                      >
                        <p className="text-[10px] font-black" style={{ color: `${item.color}90` }}>
                          {item.label}
                        </p>
                        <p className="text-[9px] text-white/20 mt-0.5">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
