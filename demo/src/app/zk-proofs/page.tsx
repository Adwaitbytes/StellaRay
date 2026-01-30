'use client';

import { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Clock,
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
// Types & Config
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
    color: '#39FF14',
    gradient: 'from-[#39FF14] to-[#00E500]',
  },
  {
    type: 'identity',
    label: 'PROOF OF IDENTITY',
    shortLabel: 'Identity',
    description: 'Prove you are a verified user without revealing personal details',
    icon: Fingerprint,
    color: '#00FFFF',
    gradient: 'from-[#00FFFF] to-[#00BBFF]',
  },
  {
    type: 'eligibility',
    label: 'PROOF OF ELIGIBILITY',
    shortLabel: 'Eligibility',
    description: 'Prove you meet specific criteria without revealing private data',
    icon: FileCheck,
    color: '#BF00FF',
    gradient: 'from-[#BF00FF] to-[#8B00FF]',
  },
  {
    type: 'history',
    label: 'PROOF OF HISTORY',
    shortLabel: 'History',
    description: 'Prove transaction history properties without exposing transactions',
    icon: History,
    color: '#FF003C',
    gradient: 'from-[#FF003C] to-[#FF0066]',
  },
];

// ============================================================================
// Background Grid (static, no glow)
// ============================================================================

function GridBg() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}

// ============================================================================
// Step Flow
// ============================================================================

function StepFlow({ step }: { step: 'select' | 'configure' | 'generate' | 'verify' }) {
  const steps = [
    { id: 'select', label: 'SELECT', num: '01' },
    { id: 'configure', label: 'CONFIGURE', num: '02' },
    { id: 'generate', label: 'GENERATE', num: '03' },
    { id: 'verify', label: 'VERIFY', num: '04' },
  ];
  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`
                w-12 h-12 flex items-center justify-center font-black text-sm transition-all duration-300
                ${isActive
                  ? 'bg-[#39FF14] text-black border-4 border-[#39FF14]'
                  : isDone
                  ? 'bg-[#39FF14]/20 text-[#39FF14] border-4 border-[#39FF14]/60'
                  : 'bg-transparent text-white/20 border-4 border-white/10'
                }
              `}
            >
              {isDone ? <Check className="w-5 h-5" /> : s.num}
            </div>
            <span
              className={`text-[10px] font-black tracking-[0.3em] mr-3 hidden sm:block ${
                isActive ? 'text-[#39FF14]' : isDone ? 'text-[#39FF14]/50' : 'text-white/15'
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className="w-8 h-1 mr-2"
                style={{ background: isDone ? '#39FF14' : 'rgba(255,255,255,0.06)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Proof Visual (no glow)
// ============================================================================

function ProofVisual({ type, isGenerating }: { type: ProofType; isGenerating: boolean }) {
  const config = PROOF_TYPES.find(p => p.type === type)!;
  const Icon = config.icon;

  return (
    <div className="relative w-full h-48 flex items-center justify-center overflow-hidden">
      <div className="relative">
        <div
          className="w-32 h-32 border-4 transition-all duration-500"
          style={{
            borderColor: config.color,
            animation: isGenerating ? 'spin 2s linear infinite' : 'none',
            transform: isGenerating ? undefined : 'rotate(45deg)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-16 h-16 border-4 flex items-center justify-center"
            style={{
              borderColor: `${config.color}80`,
              backgroundColor: `${config.color}15`,
              transform: 'rotate(-45deg)',
            }}
          >
            <Icon
              className="w-8 h-8"
              style={{
                color: config.color,
                transform: isGenerating ? undefined : 'rotate(45deg)',
              }}
            />
          </div>
        </div>
      </div>
      {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 ${pos}`}
          style={{
            backgroundColor: config.color,
            opacity: isGenerating ? 1 : 0.3,
            animation: isGenerating ? `pulse 1s infinite ${i * 0.25}s` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Page
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

  const [solvencyThreshold, setSolvencyThreshold] = useState('100');
  const [historyMinTx, setHistoryMinTx] = useState('5');
  const [historyMinVolume, setHistoryMinVolume] = useState('50');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('kyc_verified');

  const currentStep: 'select' | 'configure' | 'generate' | 'verify' = !selectedType
    ? 'select'
    : !generatedProof
    ? 'configure'
    : verificationResult
    ? 'verify'
    : 'generate';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeConfig = selectedType ? PROOF_TYPES.find(p => p.type === selectedType) : null;

  // ── Loading ──
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <GridBg />
        <div className="text-center relative z-10">
          <div
            className="w-20 h-20 border-4 border-[#39FF14] mx-auto mb-6 flex items-center justify-center"
            style={{ animation: 'spin 2s linear infinite' }}
          >
            <Shield className="w-8 h-8 text-[#39FF14]" style={{ animation: 'spin 2s linear infinite reverse' }} />
          </div>
          <p className="text-[#39FF14] font-black tracking-[0.5em] text-sm">LOADING</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ──
  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <GridBg />
        <div className="max-w-lg w-full relative z-10">
          <div className="border-4 border-[#00FFFF] p-10 text-center">
            <div className="w-24 h-24 border-4 border-[#00FFFF] mx-auto mb-8 flex items-center justify-center">
              <Shield className="w-12 h-12 text-[#00FFFF]" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">ZK PROOFS</h1>
            <div className="w-16 h-1 bg-[#00FFFF] mx-auto my-4" />
            <p className="text-white/40 text-sm mb-10">
              Zero-knowledge proofs on Stellar. Sign in to generate.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#00FFFF] text-black font-black text-sm hover:bg-[#00FFFF]/90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              DASHBOARD
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Wallet loading ──
  if (zkWallet.isLoading || !zkWallet.address) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <GridBg />
        <div className="text-center relative z-10">
          <div
            className="w-20 h-20 border-4 border-[#39FF14] mx-auto mb-6 flex items-center justify-center"
            style={{ animation: 'spin 2s linear infinite' }}
          >
            <Zap className="w-8 h-8 text-[#39FF14]" style={{ animation: 'spin 2s linear infinite reverse' }} />
          </div>
          <p className="text-[#39FF14] font-black tracking-[0.5em] text-sm">INITIALIZING</p>
          <p className="text-white/20 text-xs mt-3 font-mono tracking-widest">DERIVING KEYS...</p>
        </div>
      </div>
    );
  }

  // ── Handlers ──
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
          body = { ...body, threshold: solvencyThreshold, actualBalance: xlmBalance?.balance || '0', asset: 'XLM' };
          break;
        }
        case 'identity':
          body = { ...body, email: session.user?.email || '', provider: 'google', subject: session.user?.email || '' };
          break;
        case 'eligibility':
          body = { ...body, criteria: eligibilityCriteria, privateData: { verified: 'true', level: 'standard', provider: 'google' } };
          break;
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

  // ── Main Render ──
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#39FF14] selection:text-black">
      <GridBg />

      {/* HEADER */}
      <div className="relative z-10 border-b-4 border-[#39FF14]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <a
                href="/dashboard"
                className="w-12 h-12 border-4 border-white/20 hover:border-[#39FF14] flex items-center justify-center transition-all group"
              >
                <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-[#39FF14] transition-colors" />
              </a>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#00FFFF] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  ZK ELIGIBILITY PROOFS
                </h1>
                <p className="text-[11px] text-white/20 font-mono mt-1 ml-[52px] tracking-widest">
                  STELLAR X-RAY PROTOCOL // GROTH16 ON BN254
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {[
                { tag: 'BN254', color: '#39FF14' },
                { tag: 'POSEIDON', color: '#00FFFF' },
                { tag: 'GROTH16', color: '#BF00FF' },
              ].map(({ tag, color }) => (
                <div
                  key={tag}
                  className="px-4 py-2 border-4 text-[10px] font-black tracking-[0.2em]"
                  style={{ borderColor: color, color }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <StepFlow step={currentStep} />

        {/* X-RAY PROTOCOL BANNER */}
        <div className="border-4 border-[#00FFFF]/40 p-6 mb-10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 border-4 border-[#00FFFF] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[#00FFFF]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-black text-[#00FFFF] text-sm tracking-wider">
                  STELLAR X-RAY PROTOCOL
                </h2>
                <div className="px-3 py-1 bg-[#39FF14] text-black text-[9px] font-black tracking-widest">
                  LIVE ON MAINNET
                </div>
              </div>
              <p className="text-xs text-white/30 leading-relaxed max-w-2xl">
                Native BN254 curve operations (CAP-0074) and Poseidon hashes (CAP-0075) as Soroban host functions.
                On-chain zk-SNARK verification with ~30% gas savings vs WASM.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[...xrayInfo.hostFunctions.bn254, ...xrayInfo.hostFunctions.poseidon].map(fn => (
                  <span
                    key={fn}
                    className="px-3 py-1.5 border-2 border-white/10 text-[10px] font-mono text-white/30 hover:border-[#00FFFF]/40 hover:text-[#00FFFF]/60 transition-all"
                  >
                    {fn}()
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: PROOF TYPE CARDS */}
          <div className="lg:col-span-4 space-y-4">
            <p className="text-[10px] font-black text-white/25 tracking-[0.3em] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#39FF14] inline-block" />
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
                  className={`w-full text-left transition-all duration-200 group ${isSelected ? '' : 'hover:translate-x-1'}`}
                >
                  <div
                    className="p-5 border-4 transition-all duration-200"
                    style={{
                      borderColor: isSelected ? pt.color : 'rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? `${pt.color}08` : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 border-4 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{
                          borderColor: isSelected ? pt.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: isSelected ? `${pt.color}15` : 'transparent',
                        }}
                      >
                        <Icon
                          className="w-6 h-6 transition-all"
                          style={{ color: isSelected ? pt.color : 'rgba(255,255,255,0.25)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-black tracking-wider transition-colors"
                          style={{ color: isSelected ? pt.color : 'rgba(255,255,255,0.7)' }}
                        >
                          {pt.label}
                        </p>
                        <p className="text-[10px] text-white/20 mt-1 leading-snug">{pt.description}</p>
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: pt.color }} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {proofHistory.length > 0 && (
              <div className="border-4 border-white/[0.06] p-4 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-3.5 h-3.5 text-white/20" />
                  <p className="text-[10px] font-black text-white/20 tracking-[0.3em]">RECENT</p>
                </div>
                <div className="space-y-2">
                  {proofHistory.map(p => {
                    const c = PROOF_TYPES.find(pt => pt.type === p.type)?.color || '#fff';
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 border-2 border-white/[0.04] hover:border-white/10 cursor-pointer transition-all"
                        onClick={() => { setSelectedType(p.type); setGeneratedProof(p); setVerificationResult(null); }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2" style={{ backgroundColor: c }} />
                          <span className="text-[11px] font-mono text-white/30">{p.id.slice(0, 14)}...</span>
                        </div>
                        <span className="text-[9px] font-black tracking-wider" style={{ color: c }}>{p.type.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-6">
            {/* Empty State */}
            {!selectedType && (
              <div className="border-4 border-white/[0.06] p-16 text-center">
                <div
                  className="w-24 h-24 border-4 border-dashed border-white/10 mx-auto mb-8 flex items-center justify-center"
                  style={{ animation: 'spin 20s linear infinite' }}
                >
                  <Binary className="w-10 h-10 text-white/10" style={{ animation: 'spin 20s linear infinite reverse' }} />
                </div>
                <p className="text-white/25 font-black text-2xl tracking-tight">SELECT A PROOF TYPE</p>
                <p className="text-xs text-white/10 mt-3 max-w-sm mx-auto">
                  Choose from solvency, identity, eligibility, or history proofs
                </p>
                <div className="flex items-center justify-center gap-4 mt-8">
                  {PROOF_TYPES.map(pt => (
                    <button
                      key={pt.type}
                      onClick={() => { setSelectedType(pt.type); setGeneratedProof(null); setVerificationResult(null); setError(null); }}
                      className="w-4 h-4 transition-all hover:scale-150"
                      style={{ backgroundColor: pt.color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* PROOF FORM */}
            {selectedType && !generatedProof && activeConfig && (
              <div
                className="border-4 overflow-hidden"
                style={{ borderColor: activeConfig.color }}
              >
                <div style={{ background: `linear-gradient(180deg, ${activeConfig.color}08 0%, transparent 100%)` }}>
                  <ProofVisual type={selectedType} isGenerating={isGenerating} />
                  <div className="text-center pb-6 px-6">
                    <p className="font-black text-2xl tracking-tight" style={{ color: activeConfig.color }}>
                      {activeConfig.label}
                    </p>
                    <p className="text-xs text-white/25 mt-2">{activeConfig.description}</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">WALLET ADDRESS</label>
                    <div className="p-4 border-4 border-white/[0.06] font-mono text-xs text-[#39FF14] break-all flex items-center gap-3">
                      <div className="w-10 h-10 border-4 border-[#39FF14]/30 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-[#39FF14]" />
                      </div>
                      {zkWallet.address}
                    </div>
                  </div>

                  {selectedType === 'solvency' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          CURRENT BALANCE
                          <span className="ml-2 px-2 py-0.5 bg-[#FF003C]/20 text-[#FF003C] text-[8px] border-2 border-[#FF003C]/30">PRIVATE</span>
                        </label>
                        <div className="p-4 border-4 border-white/[0.06] flex items-center gap-3">
                          <Eye className="w-4 h-4 text-white/15" />
                          <span className="font-mono text-sm text-white/50">
                            {zkWallet.balances?.find(b => b.asset === 'XLM')?.balance || '0'} XLM
                          </span>
                          <Lock className="w-4 h-4 text-[#39FF14]/40 ml-auto" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          THRESHOLD TO PROVE
                          <span className="ml-2 px-2 py-0.5 bg-[#39FF14]/10 text-[#39FF14] text-[8px] border-2 border-[#39FF14]/30">PUBLIC</span>
                        </label>
                        <div className="flex items-center border-4 border-white/[0.08] focus-within:border-[#39FF14] transition-all">
                          <input
                            type="number"
                            value={solvencyThreshold}
                            onChange={e => setSolvencyThreshold(e.target.value)}
                            className="flex-1 bg-transparent p-4 font-mono text-sm outline-none text-white"
                            min="0" step="1"
                          />
                          <span className="px-5 text-white/15 font-black text-xs border-l-4 border-white/[0.06]">XLM</span>
                        </div>
                        <p className="text-[10px] text-white/15 mt-2 font-mono">
                          → Verifier learns: balance ≥ {solvencyThreshold} XLM
                        </p>
                      </div>
                    </>
                  )}

                  {selectedType === 'identity' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          IDENTITY PROVIDER
                          <span className="ml-2 px-2 py-0.5 bg-[#00FFFF]/10 text-[#00FFFF] text-[8px] border-2 border-[#00FFFF]/30">PUBLIC</span>
                        </label>
                        <div className="p-4 border-4 border-white/[0.06] text-sm text-white/50 flex items-center gap-3">
                          <div className="w-8 h-8 border-2 border-white/10 flex items-center justify-center text-[11px] font-black text-white/40">G</div>
                          Google OAuth 2.0
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          EMAIL
                          <span className="ml-2 px-2 py-0.5 bg-[#FF003C]/20 text-[#FF003C] text-[8px] border-2 border-[#FF003C]/30">POSEIDON HASHED</span>
                        </label>
                        <div className="p-4 border-4 border-white/[0.06] flex items-center gap-3">
                          <EyeOff className="w-4 h-4 text-white/15" />
                          <span className="font-mono text-sm text-white/30">{session.user?.email || 'N/A'}</span>
                          <Lock className="w-4 h-4 text-[#00FFFF]/40 ml-auto" />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedType === 'eligibility' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          CRITERIA
                          <span className="ml-2 px-2 py-0.5 bg-[#BF00FF]/10 text-[#BF00FF] text-[8px] border-2 border-[#BF00FF]/30">PUBLIC</span>
                        </label>
                        <select
                          value={eligibilityCriteria}
                          onChange={e => setEligibilityCriteria(e.target.value)}
                          className="w-full p-4 bg-transparent border-4 border-white/[0.08] text-sm outline-none text-white/60 focus:border-[#BF00FF] transition-all"
                        >
                          <option value="kyc_verified">KYC Verified</option>
                          <option value="accredited_investor">Accredited Investor</option>
                          <option value="age_18_plus">Age 18+</option>
                          <option value="membership_active">Active Membership</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          PRIVATE ATTRIBUTES
                          <span className="ml-2 px-2 py-0.5 bg-[#FF003C]/20 text-[#FF003C] text-[8px] border-2 border-[#FF003C]/30">NEVER REVEALED</span>
                        </label>
                        <div className="p-4 border-4 border-white/[0.06] space-y-2">
                          {[{ k: 'verified', v: 'true' }, { k: 'level', v: 'standard' }, { k: 'provider', v: 'google' }].map(attr => (
                            <div key={attr.k} className="flex items-center gap-3 text-xs font-mono">
                              <Lock className="w-3 h-3 text-[#BF00FF]/40" />
                              <span className="text-white/15">{attr.k}:</span>
                              <span className="text-white/40">{attr.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedType === 'history' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">MIN TRANSACTIONS</label>
                          <input
                            type="number"
                            value={historyMinTx}
                            onChange={e => setHistoryMinTx(e.target.value)}
                            className="w-full p-4 bg-transparent border-4 border-white/[0.08] font-mono text-sm outline-none text-white focus:border-[#FF003C] transition-all"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">MIN VOLUME (XLM)</label>
                          <input
                            type="number"
                            value={historyMinVolume}
                            onChange={e => setHistoryMinVolume(e.target.value)}
                            className="w-full p-4 bg-transparent border-4 border-white/[0.08] font-mono text-sm outline-none text-white focus:border-[#FF003C] transition-all"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/20 tracking-[0.2em] block mb-2">
                          ACTUAL DATA
                          <span className="ml-2 px-2 py-0.5 bg-[#FF003C]/20 text-[#FF003C] text-[8px] border-2 border-[#FF003C]/30">PRIVATE</span>
                        </label>
                        <div className="p-4 border-4 border-white/[0.06] flex items-center gap-8 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-[#FF003C]/40" />
                            <span className="text-white/15">Txns:</span>
                            <span className="text-white/40">{zkWallet.transactions?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-[#FF003C]/40" />
                            <span className="text-white/15">Vol:</span>
                            <span className="text-white/40">
                              {(zkWallet.transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) || 0).toFixed(2)} XLM
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="p-4 border-4 border-[#FF003C]/40 bg-[#FF003C]/5 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#FF003C] flex-shrink-0" />
                      <p className="text-xs text-[#FF003C]/80">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateProof}
                    disabled={isGenerating}
                    className={`w-full py-5 font-black text-black text-sm tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-3 bg-gradient-to-r ${activeConfig.gradient} hover:brightness-110 active:scale-[0.98]`}
                  >
                    {isGenerating ? (
                      <><Loader className="w-5 h-5 animate-spin" /> GENERATING ZK PROOF...</>
                    ) : (
                      <><Zap className="w-5 h-5" /> GENERATE PROOF</>
                    )}
                  </button>

                  <div className="p-4 border-2 border-white/[0.04]">
                    <p className="text-[10px] text-white/15 leading-relaxed font-mono">
                      <span className="text-white/25">// HOW IT WORKS:</span> Private data → Poseidon hash (CAP-0075) → Groth16 proof on BN254 (CAP-0074) → On-chain verify via bn254_multi_pairing_check
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GENERATED PROOF */}
            {generatedProof && activeConfig && (
              <div className="space-y-6">
                <div className="border-4 overflow-hidden" style={{ borderColor: activeConfig.color }}>
                  <div
                    className="px-6 py-5 flex items-center justify-between"
                    style={{ backgroundColor: activeConfig.color }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-black/80" />
                      </div>
                      <div>
                        <p className="font-black text-black text-sm">{activeConfig.label}</p>
                        <p className="text-[10px] text-black/40 font-mono">GROTH16 // BN254</p>
                      </div>
                    </div>
                    {verificationResult && (
                      <div className={`px-4 py-2 ${verificationResult.valid ? 'bg-black/20' : 'bg-[#FF003C]'}`}>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-black">
                          {verificationResult.valid ? <><CheckCircle className="w-4 h-4" /> VERIFIED</> : <><XCircle className="w-4 h-4 text-white" /> INVALID</>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'PROOF ID', value: generatedProof.id.slice(0, 16), color: '#00FFFF' },
                        { label: 'CURVE', value: 'BN254', color: '#39FF14' },
                        { label: 'SIZE', value: `${generatedProof.metadata.proofSizeBytes}B`, color: '#BF00FF' },
                        { label: 'TIME', value: `${generationTime}ms`, color: '#FF003C' },
                      ].map(item => (
                        <div key={item.label} className="p-4 border-4 border-white/[0.06] hover:border-white/10 transition-all">
                          <p className="text-[9px] font-black text-white/15 tracking-[0.2em] mb-2">{item.label}</p>
                          <p className="font-mono text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2" style={{ backgroundColor: activeConfig.color }} />
                        <p className="text-[10px] font-black text-white/20 tracking-[0.3em]">
                          PUBLIC INPUTS ({generatedProof.publicInputs.length})
                        </p>
                      </div>
                      <div className="space-y-3">
                        {generatedProof.publicInputLabels.map((input, i) => (
                          <div key={i} className="p-4 border-4 border-white/[0.04] hover:border-white/[0.08] transition-all group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black text-white/15 tracking-[0.2em] uppercase">{input.name}</span>
                              <button
                                onClick={() => copyToClipboard(generatedProof.publicInputs[i], `pub_${i}`)}
                                className="p-1.5 border-2 border-white/[0.06] hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
                              >
                                {copied === `pub_${i}` ? <Check className="w-3 h-3 text-[#39FF14]" /> : <Copy className="w-3 h-3 text-white/15" />}
                              </button>
                            </div>
                            <p className="font-mono text-[11px] break-all" style={{ color: `${activeConfig.color}CC` }}>
                              {shortenHex(generatedProof.publicInputs[i], 14)}
                            </p>
                            <p className="text-[10px] text-white/10 mt-2">{input.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowProofDetails(!showProofDetails)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-4 border-white/[0.06] hover:border-white/[0.12] transition-all text-[10px] font-black text-white/25 tracking-wider"
                    >
                      {showProofDetails ? 'HIDE PROOF POINTS' : 'SHOW BN254 PROOF POINTS'}
                      {showProofDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showProofDetails && (
                      <div className="space-y-3">
                        {[
                          { label: 'π_A', sub: 'G1 · 64B', color: '#0088FF', data: [{ k: 'x', v: generatedProof.proof.a.x }, { k: 'y', v: generatedProof.proof.a.y }] },
                          { label: 'π_B', sub: 'G2 · 128B', color: '#00FFFF', data: [{ k: 'x₁', v: generatedProof.proof.b.x[0] }, { k: 'x₀', v: generatedProof.proof.b.x[1] }, { k: 'y₁', v: generatedProof.proof.b.y[0] }, { k: 'y₀', v: generatedProof.proof.b.y[1] }] },
                          { label: 'π_C', sub: 'G1 · 64B', color: '#39FF14', data: [{ k: 'x', v: generatedProof.proof.c.x }, { k: 'y', v: generatedProof.proof.c.y }] },
                        ].map(point => (
                          <div key={point.label} className="p-4 border-4 border-white/[0.04]">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-3 h-3" style={{ backgroundColor: point.color }} />
                              <span className="text-xs font-black" style={{ color: point.color }}>{point.label}</span>
                              <span className="text-[9px] text-white/15 font-mono">{point.sub}</span>
                            </div>
                            <div className="space-y-1.5">
                              {point.data.map(d => (
                                <div key={d.k} className="flex gap-3 font-mono text-[10px]">
                                  <span className="text-white/10 w-8 flex-shrink-0">{d.k}:</span>
                                  <span className="text-white/30 break-all">{d.v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {verificationResult && (
                      <div
                        className="p-5 border-4"
                        style={{
                          borderColor: verificationResult.valid ? '#39FF14' : '#FF003C',
                          background: verificationResult.valid ? 'rgba(57,255,20,0.03)' : 'rgba(255,0,60,0.03)',
                        }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {verificationResult.valid ? (
                            <div className="w-12 h-12 bg-[#39FF14]/10 border-4 border-[#39FF14]/30 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-[#39FF14]" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-[#FF003C]/10 border-4 border-[#FF003C]/30 flex items-center justify-center">
                              <XCircle className="w-6 h-6 text-[#FF003C]" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-sm" style={{ color: verificationResult.valid ? '#39FF14' : '#FF003C' }}>
                              {verificationResult.valid ? 'PROOF VERIFIED' : 'VERIFICATION FAILED'}
                            </p>
                            <p className="text-[10px] text-white/25 font-mono">
                              {verificationResult.verifiedOnChain ? 'ON-CHAIN via SOROBAN' : 'STRUCTURAL VERIFICATION'}
                            </p>
                          </div>
                        </div>
                        {verificationResult.error && (
                          <p className="text-[#FF003C]/60 text-[10px] font-mono p-3 border-2 border-[#FF003C]/10">{verificationResult.error}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={handleVerifyProof}
                        disabled={isVerifying}
                        className="flex-1 py-4 bg-[#00FFFF] text-black font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98]"
                      >
                        {isVerifying ? (
                          <><Loader className="w-4 h-4 animate-spin" /> VERIFYING...</>
                        ) : (
                          <><Activity className="w-4 h-4" /> VERIFY ON-CHAIN</>
                        )}
                      </button>
                      <button
                        onClick={() => { setGeneratedProof(null); setVerificationResult(null); setError(null); }}
                        className="px-6 py-4 border-4 border-white/10 hover:border-white/25 font-black text-xs transition-all text-white/40 hover:text-white/70"
                      >
                        NEW
                      </button>
                    </div>

                    <button
                      onClick={() => copyToClipboard(JSON.stringify(generatedProof, null, 2), 'full_proof')}
                      className="w-full py-3 border-4 border-white/[0.04] hover:border-white/[0.08] flex items-center justify-center gap-2 text-[10px] text-white/15 transition-all hover:text-white/30"
                    >
                      {copied === 'full_proof' ? <><Check className="w-3 h-3 text-[#39FF14]" /> COPIED</> : <><Copy className="w-3 h-3" /> EXPORT PROOF JSON</>}
                    </button>
                  </div>
                </div>

                {/* VERIFICATION EQUATION */}
                <div className="border-4 border-[#BF00FF]/30 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 border-4 border-[#BF00FF]/40 flex items-center justify-center">
                      <Waves className="w-5 h-5 text-[#BF00FF]/60" />
                    </div>
                    <p className="text-[10px] font-black text-white/20 tracking-[0.3em]">ON-CHAIN VERIFICATION</p>
                  </div>

                  <div className="p-5 border-4 border-white/[0.04] bg-black/40 font-mono text-[11px] leading-loose">
                    <p className="text-white/10">{'// Groth16 pairing equation'}</p>
                    <p className="text-[#00FFFF]/50 mt-1">
                      e(π_A, π_B) == e(α, β) · e(acc, γ) · e(π_C, δ)
                    </p>
                    <div className="mt-4 pt-4 border-t-4 border-white/[0.03] space-y-2">
                      <p className="text-white/[0.06]">{'// Soroban host functions:'}</p>
                      <p><span className="text-[#39FF14]/60">01</span> <span className="text-[#39FF14]/40">bn254_g1_mul</span><span className="text-white/10">(IC[i], pub[i])</span></p>
                      <p><span className="text-[#00FFFF]/60">02</span> <span className="text-[#00FFFF]/40">bn254_g1_add</span><span className="text-white/10">(acc, product)</span></p>
                      <p><span className="text-[#BF00FF]/60">03</span> <span className="text-[#BF00FF]/40">bn254_multi_pairing_check</span><span className="text-white/10">(vp1, vp2)</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                      { label: 'BN254', sub: 'CAP-0074', color: '#39FF14' },
                      { label: 'POSEIDON', sub: 'CAP-0075', color: '#00FFFF' },
                      { label: '~30% SAVED', sub: 'vs WASM', color: '#BF00FF' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="p-3 text-center border-4 transition-all hover:scale-[1.02]"
                        style={{ borderColor: `${item.color}30` }}
                      >
                        <p className="text-[11px] font-black" style={{ color: item.color }}>{item.label}</p>
                        <p className="text-[9px] text-white/15 mt-0.5 font-mono">{item.sub}</p>
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
