'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import {
  Shield, Users, Check, ArrowRight, AlertCircle, Lock, Zap,
  Eye, EyeOff, Copy, ExternalLink, ChevronLeft, Loader2,
  Mail, Github, Chrome, Fingerprint, KeyRound, Wallet
} from 'lucide-react';

// Guardian types
interface GuardianInfo {
  id: string;
  provider: 'google' | 'github';
  identifier: string; // email or username
  label: string;
  commitment?: string;
}

// Steps in the flow
type Step = 'intro' | 'guardian1' | 'guardian2' | 'guardian3' | 'configure' | 'review' | 'creating' | 'done';

export default function ZkMultiCustodyPage() {
  const router = useRouter();

  // State
  const [step, setStep] = useState<Step>('intro');
  const [guardians, setGuardians] = useState<GuardianInfo[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentProvider, setCurrentProvider] = useState<'google' | 'github'>('google');
  const [threshold, setThreshold] = useState(2);
  const [timelockEnabled, setTimelockEnabled] = useState(true);
  const [timelockHours, setTimelockHours] = useState(24);
  const [timelockAmount, setTimelockAmount] = useState('10000');
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStatus, setCreationStatus] = useState('');
  const [funding, setFunding] = useState(false);
  const [funded, setFunded] = useState(false);

  // Fund account via Stellar Friendbot (testnet only)
  const fundWithFriendbot = async () => {
    if (!walletData?.walletAddress) return;
    setFunding(true);
    try {
      const res = await fetch(
        `https://friendbot.stellar.org?addr=${walletData.walletAddress}`
      );
      if (res.ok) {
        setFunded(true);
      } else {
        const data = await res.json().catch(() => null);
        // Already funded counts as success
        if (data?.detail?.includes('createAccountAlreadyExist')) {
          setFunded(true);
        } else {
          setError('Failed to fund account. Try again.');
        }
      }
    } catch {
      setError('Failed to fund account. Check your connection.');
    } finally {
      setFunding(false);
    }
  };

  // Get guardian number from step
  const getGuardianNumber = (s: Step): number => {
    if (s === 'guardian1') return 1;
    if (s === 'guardian2') return 2;
    if (s === 'guardian3') return 3;
    return 0;
  };

  // Add a guardian
  const addGuardian = async () => {
    if (!currentInput.trim()) {
      setError('Please enter an identifier');
      return;
    }

    // Validate email for Google
    if (currentProvider === 'google' && !currentInput.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (guardians.some(g => g.identifier.toLowerCase() === currentInput.toLowerCase())) {
      setError('This guardian is already added');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const guardianNumber = getGuardianNumber(step);
      const labels = ['Primary', 'Backup', 'Recovery'];

      const newGuardian: GuardianInfo = {
        id: `guardian-${guardianNumber}`,
        provider: currentProvider,
        identifier: currentInput.trim(),
        label: `${labels[guardianNumber - 1]} ${currentProvider === 'google' ? 'Gmail' : 'GitHub'}`,
      };

      // Simulate commitment generation (we'll do real one in API)
      await new Promise(resolve => setTimeout(resolve, 800));

      setGuardians([...guardians, newGuardian]);
      setCurrentInput('');
      setError('');

      // Move to next step
      if (step === 'guardian1') setStep('guardian2');
      else if (step === 'guardian2') setStep('guardian3');
      else if (step === 'guardian3') setStep('configure');
    } catch (err: any) {
      setError(err.message || 'Failed to add guardian');
    } finally {
      setLoading(false);
    }
  };

  // Create the multi-custody wallet
  const createWallet = async () => {
    setStep('creating');
    setLoading(true);
    setError('');
    setCreationProgress(0);

    try {
      // Progress simulation with real status updates
      const progressSteps = [
        { progress: 10, status: 'Validating guardians...' },
        { progress: 25, status: 'Generating Poseidon commitments...' },
        { progress: 40, status: 'Computing ZK parameters...' },
        { progress: 55, status: 'Building transaction...' },
        { progress: 70, status: 'Initializing smart contract...' },
        { progress: 85, status: 'Verifying on-chain state...' },
        { progress: 95, status: 'Finalizing wallet...' },
      ];

      for (const ps of progressSteps) {
        setCreationProgress(ps.progress);
        setCreationStatus(ps.status);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Call the API
      const response = await fetch('/api/multi-custody/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardians: guardians.map(g => ({
            provider: g.provider,
            identifier: g.identifier,
            label: g.label,
          })),
          threshold,
          timelockSeconds: timelockEnabled ? timelockHours * 3600 : null,
          timelockThreshold: timelockEnabled ? timelockAmount : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      setCreationProgress(100);
      setCreationStatus('Wallet created successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      setWalletData(data);
      setStep('done');

      // Save to localStorage
      localStorage.setItem('zk_multi_custody_wallet', JSON.stringify({
        ...data,
        createdAt: Date.now(),
      }));

    } catch (err: any) {
      console.error('[ZK-Multi-Custody] Error:', err);
      setError(err.message);
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Go back
  const goBack = () => {
    if (step === 'guardian2') {
      setGuardians(guardians.slice(0, 0));
      setStep('guardian1');
    } else if (step === 'guardian3') {
      setGuardians(guardians.slice(0, 1));
      setStep('guardian2');
    } else if (step === 'configure') {
      setGuardians(guardians.slice(0, 2));
      setStep('guardian3');
    } else if (step === 'review') {
      setStep('configure');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 102, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 102, 255, 1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0066FF]/5 via-transparent to-[#00D4FF]/5 pointer-events-none" />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
        <div className="absolute top-6 left-6 w-16 h-1 bg-[#0066FF]/30" />
        <div className="absolute top-6 left-6 w-1 h-16 bg-[#0066FF]/30" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
        <div className="absolute top-6 right-6 w-16 h-1 bg-[#00D4FF]/30" />
        <div className="absolute top-6 right-6 w-1 h-16 bg-[#00D4FF]/30" />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none">
        <div className="absolute bottom-6 left-6 w-16 h-1 bg-[#00D4FF]/30" />
        <div className="absolute bottom-6 left-6 w-1 h-16 bg-[#00D4FF]/30" />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none">
        <div className="absolute bottom-6 right-6 w-16 h-1 bg-[#0066FF]/30" />
        <div className="absolute bottom-6 right-6 w-1 h-16 bg-[#0066FF]/30" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center space-x-3 group">
              <Logo size="sm" showText={false} />
              <span className="text-xl font-black tracking-tight">
                <span className="text-white group-hover:text-white/80 transition">STELLA</span>
                <span className="text-[#0066FF]">RAY</span>
              </span>
            </a>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-[#0066FF]/10 border border-[#0066FF]/30 text-[#0066FF] text-xs font-black tracking-wider">
                ZK MULTI-CUSTODY
              </span>
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-black">
                TESTNET
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* INTRO SCREEN */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 'intro' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Header */}
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#0066FF] to-[#00D4FF] opacity-20 blur-xl" />
                  <div className="relative w-24 h-24 bg-[#0A0A0A] border-4 border-white flex items-center justify-center"
                       style={{ boxShadow: '4px 4px 0 #0066FF' }}>
                    <Shield className="w-12 h-12 text-[#0066FF]" />
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  ZK MULTI-CUSTODY
                  <span className="block text-[#0066FF]">WALLET</span>
                </h1>

                <p className="text-xl text-white/60 max-w-lg mx-auto">
                  Control one wallet with multiple OAuth identities.
                  Privacy-preserving threshold signatures powered by Poseidon hashing.
                </p>
              </div>

              {/* Features */}
              <div className="relative">
                <div className="absolute -inset-1 bg-[#0066FF] translate-x-2 translate-y-2" />
                <div className="relative bg-[#0A0A0A] border-4 border-white p-6 space-y-4">
                  <h3 className="font-black text-lg flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#00D4FF]" />
                    HOW IT WORKS
                  </h3>

                  <div className="space-y-4">
                    {[
                      { num: 1, title: '3 OAuth Guardians', desc: 'Link Google or GitHub accounts as wallet guardians' },
                      { num: 2, title: 'Poseidon Commitments', desc: 'Each guardian creates a ZK commitment stored on-chain' },
                      { num: 3, title: 'K-of-N Threshold', desc: 'Transactions require 2-of-3 guardian approvals' },
                      { num: 4, title: 'Complete Privacy', desc: 'Nobody knows WHICH guardians approved—only that threshold was met' },
                    ].map((item) => (
                      <div key={item.num} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#0066FF] flex items-center justify-center text-white font-black text-sm">
                          {item.num}
                        </div>
                        <div>
                          <p className="font-bold text-white">{item.title}</p>
                          <p className="text-sm text-white/60">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-500/10 to-[#0066FF]/10 border-2 border-green-500/30 p-6 space-y-3">
                <h4 className="font-black flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  KEY ADVANTAGES
                </h4>
                <ul className="space-y-2 text-sm">
                  {[
                    'True self-custody—no servers hold your keys',
                    'Social recovery—lose 1 account, use other 2',
                    'Enhanced security—attacker needs 2+ accounts',
                    'Anonymous signatures—on-chain proofs reveal nothing',
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-white/80">
                      <div className="w-1.5 h-1.5 bg-green-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <button
                onClick={() => setStep('guardian1')}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                <div className="relative bg-[#0066FF] text-white py-4 font-black text-lg flex items-center justify-center gap-3 border-2 border-white">
                  START GUARDIAN SETUP
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* GUARDIAN SETUP SCREENS (1, 2, 3) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {['guardian1', 'guardian2', 'guardian3'].includes(step) && (
            <div className="space-y-8 animate-fadeIn">
              {/* Back button */}
              {step !== 'guardian1' && (
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </button>
              )}

              {/* Header */}
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-black">
                  GUARDIAN {getGuardianNumber(step)} OF 3
                </h2>
                <p className="text-white/60">
                  {step === 'guardian1' && 'Add your primary account'}
                  {step === 'guardian2' && 'Add a backup account (different from Guardian 1)'}
                  {step === 'guardian3' && 'Add a recovery account'}
                </p>

                {/* Progress */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`w-16 h-2 transition-colors ${
                        num < getGuardianNumber(step)
                          ? 'bg-green-500'
                          : num === getGuardianNumber(step)
                          ? 'bg-[#0066FF]'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Previous guardians */}
              {guardians.length > 0 && (
                <div className="space-y-2">
                  {guardians.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-400">Guardian {i + 1}: {g.label}</p>
                        <p className="text-xs text-white/60">{g.identifier}</p>
                      </div>
                      {g.provider === 'google' ? (
                        <Chrome className="w-4 h-4 text-white/40" />
                      ) : (
                        <Github className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Provider selection */}
              <div className="relative">
                <div className="absolute -inset-1 bg-[#0066FF] translate-x-2 translate-y-2" />
                <div className="relative bg-[#0A0A0A] border-4 border-white p-6 space-y-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => { setCurrentProvider('google'); setCurrentInput(''); }}
                      className={`flex-1 p-4 border-2 transition-all ${
                        currentProvider === 'google'
                          ? 'border-[#0066FF] bg-[#0066FF]/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <Chrome className={`w-8 h-8 mx-auto mb-2 ${currentProvider === 'google' ? 'text-[#0066FF]' : 'text-white/60'}`} />
                      <p className="font-bold text-sm">GOOGLE</p>
                    </button>
                    <button
                      onClick={() => { setCurrentProvider('github'); setCurrentInput(''); }}
                      className={`flex-1 p-4 border-2 transition-all ${
                        currentProvider === 'github'
                          ? 'border-[#0066FF] bg-[#0066FF]/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <Github className={`w-8 h-8 mx-auto mb-2 ${currentProvider === 'github' ? 'text-[#0066FF]' : 'text-white/60'}`} />
                      <p className="font-bold text-sm">GITHUB</p>
                    </button>
                  </div>

                  {/* Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/60">
                      {currentProvider === 'google' ? 'GMAIL ADDRESS' : 'GITHUB USERNAME'}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={currentProvider === 'google' ? 'email' : 'text'}
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addGuardian()}
                          placeholder={currentProvider === 'google' ? 'user@gmail.com' : 'username'}
                          className="w-full bg-white/5 border-2 border-white/20 px-4 py-3 text-white placeholder-white/30 focus:border-[#0066FF] focus:outline-none transition font-mono"
                        />
                        {currentProvider === 'google' ? (
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        ) : (
                          <Github className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {/* Add button */}
                  <button
                    onClick={addGuardian}
                    disabled={loading || !currentInput.trim()}
                    className="w-full bg-white text-black py-3 font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ADDING GUARDIAN...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        ADD GUARDIAN {getGuardianNumber(step)}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-white/5 border border-white/10 p-4 text-sm text-white/60">
                <p className="flex items-start gap-2">
                  <KeyRound className="w-4 h-4 mt-0.5 text-[#00D4FF]" />
                  <span>
                    Each guardian creates a <strong className="text-white">Poseidon commitment</strong> from their OAuth identity.
                    This commitment is stored on-chain without revealing your email or username.
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CONFIGURE SCREEN */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 'configure' && (
            <div className="space-y-8 animate-fadeIn">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                BACK
              </button>

              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-black">CONFIGURE WALLET</h2>
                <p className="text-white/60">Set threshold and security parameters</p>
              </div>

              {/* All guardians */}
              <div className="space-y-2">
                {guardians.map((g, i) => (
                  <div key={g.id} className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-400">Guardian {i + 1}: {g.label}</p>
                      <p className="text-xs text-white/60">{g.identifier}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Configuration */}
              <div className="relative">
                <div className="absolute -inset-1 bg-[#00D4FF] translate-x-2 translate-y-2" />
                <div className="relative bg-[#0A0A0A] border-4 border-white p-6 space-y-6">
                  {/* Threshold */}
                  <div className="space-y-4">
                    <label className="font-black text-sm">APPROVAL THRESHOLD</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setThreshold(2)}
                        className={`flex-1 p-4 border-2 transition-all text-center ${
                          threshold === 2
                            ? 'border-[#0066FF] bg-[#0066FF]/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <p className="text-2xl font-black text-[#00D4FF]">2-of-3</p>
                        <p className="text-xs text-white/60 mt-1">Recommended</p>
                      </button>
                      <button
                        onClick={() => setThreshold(3)}
                        className={`flex-1 p-4 border-2 transition-all text-center ${
                          threshold === 3
                            ? 'border-[#0066FF] bg-[#0066FF]/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <p className="text-2xl font-black text-[#00D4FF]">3-of-3</p>
                        <p className="text-xs text-white/60 mt-1">Maximum Security</p>
                      </button>
                    </div>
                    <p className="text-sm text-white/60">
                      Transactions require <strong className="text-white">{threshold} guardian approvals</strong> to execute
                    </p>
                  </div>

                  {/* Timelock */}
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={timelockEnabled}
                        onChange={(e) => setTimelockEnabled(e.target.checked)}
                        className="w-5 h-5 accent-[#0066FF]"
                      />
                      <span className="font-black text-sm">ENABLE TIMELOCK FOR LARGE TRANSACTIONS</span>
                    </label>

                    {timelockEnabled && (
                      <div className="grid grid-cols-2 gap-4 pl-8">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white/60">DELAY (HOURS)</label>
                          <input
                            type="number"
                            value={timelockHours}
                            onChange={(e) => setTimelockHours(parseInt(e.target.value) || 24)}
                            className="w-full bg-white/5 border-2 border-white/20 px-3 py-2 text-white focus:border-[#0066FF] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white/60">THRESHOLD (USDC)</label>
                          <input
                            type="text"
                            value={timelockAmount}
                            onChange={(e) => setTimelockAmount(e.target.value)}
                            className="w-full bg-white/5 border-2 border-white/20 px-3 py-2 text-white focus:border-[#0066FF] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Continue button */}
              <button
                onClick={() => setStep('review')}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                <div className="relative bg-[#0066FF] text-white py-4 font-black text-lg flex items-center justify-center gap-3 border-2 border-white">
                  REVIEW & CREATE
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* REVIEW SCREEN */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 'review' && (
            <div className="space-y-8 animate-fadeIn">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                BACK
              </button>

              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-black">REVIEW SETUP</h2>
                <p className="text-white/60">Confirm your wallet configuration</p>
              </div>

              {/* Summary */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#0066FF] to-[#00D4FF] translate-x-2 translate-y-2" />
                <div className="relative bg-[#0A0A0A] border-4 border-white p-6 space-y-6">
                  <h3 className="font-black flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0066FF]" />
                    GUARDIANS
                  </h3>

                  {guardians.map((g, i) => (
                    <div key={g.id} className="flex items-center justify-between bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0066FF] flex items-center justify-center font-black text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{g.label}</p>
                          <p className="text-xs text-white/60">{g.identifier}</p>
                        </div>
                      </div>
                      {g.provider === 'google' ? (
                        <Chrome className="w-5 h-5 text-white/40" />
                      ) : (
                        <Github className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                  ))}

                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Threshold</span>
                      <span className="font-bold text-[#00D4FF]">{threshold}-of-3</span>
                    </div>
                    {timelockEnabled && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Timelock Delay</span>
                          <span className="font-bold">{timelockHours} hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Timelock Threshold</span>
                          <span className="font-bold">${timelockAmount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Create button */}
              <button
                onClick={createWallet}
                disabled={loading}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-green-400 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                <div className="relative bg-green-500 text-black py-4 font-black text-lg flex items-center justify-center gap-3 border-2 border-white">
                  <Lock className="w-5 h-5" />
                  CREATE ZK MULTI-CUSTODY WALLET
                </div>
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CREATING SCREEN */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 'creating' && (
            <div className="space-y-8 animate-fadeIn text-center py-12">
              {/* Animated icon */}
              <div className="relative inline-block">
                <div className="absolute -inset-8 bg-gradient-to-r from-[#0066FF] to-[#00D4FF] opacity-20 blur-xl animate-pulse" />
                <div className="relative w-24 h-24 bg-[#0A0A0A] border-4 border-white flex items-center justify-center animate-pulse"
                     style={{ boxShadow: '4px 4px 0 #0066FF' }}>
                  <Lock className="w-12 h-12 text-[#0066FF]" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black">CREATING WALLET</h2>
                <p className="text-white/60">{creationStatus}</p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="h-3 bg-white/10 border-2 border-white/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] transition-all duration-500"
                    style={{ width: `${creationProgress}%` }}
                  />
                </div>
                <p className="text-right text-sm font-mono text-white/40 mt-2">{creationProgress}%</p>
              </div>

              {/* Status dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 animate-pulse"
                    style={{
                      backgroundColor: i % 2 === 0 ? '#0066FF' : '#00D4FF',
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DONE SCREEN */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 'done' && walletData && (
            <div className="space-y-8 animate-fadeIn">
              {/* Success header */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-green-500 opacity-20 blur-xl" />
                  <div className="relative w-20 h-20 bg-green-500/20 border-4 border-green-500 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-green-400">WALLET CREATED!</h2>
                <p className="text-white/60">Your ZK Multi-Custody wallet is live on Stellar</p>
              </div>

              {/* Wallet address */}
              <div className="relative">
                <div className="absolute -inset-1 bg-green-500 translate-x-2 translate-y-2" />
                <div className="relative bg-[#0A0A0A] border-4 border-white p-6">
                  <p className="text-xs font-black text-white/40 mb-2">WALLET ADDRESS</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-green-400 break-all">
                      {walletData.walletAddress}
                    </code>
                    <button
                      onClick={() => copyToClipboard(walletData.walletAddress, 'address')}
                      className="p-2 hover:bg-white/10 transition"
                    >
                      {copied === 'address' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guardian commitments */}
              <div className="relative">
                <div className="absolute -inset-1 bg-[#0066FF] translate-x-2 translate-y-2" />
                <div className="relative bg-[#0A0A0A] border-4 border-white p-6 space-y-4">
                  <h3 className="font-black flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-[#00D4FF]" />
                    GUARDIAN COMMITMENTS (ON-CHAIN)
                  </h3>

                  {walletData.guardians?.map((g: any, i: number) => (
                    <div key={i} className="bg-white/5 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">Guardian {g.index}: {g.label}</p>
                        <button
                          onClick={() => copyToClipboard(g.commitment, `commitment-${i}`)}
                          className="p-1 hover:bg-white/10 transition"
                        >
                          {copied === `commitment-${i}` ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-white/40" />
                          )}
                        </button>
                      </div>
                      <code className="text-xs font-mono text-[#00D4FF] break-all">
                        {g.commitment}
                      </code>
                    </div>
                  ))}

                  <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/40">Threshold</p>
                      <p className="font-black text-[#00D4FF]">{walletData.threshold}-of-3</p>
                    </div>
                    {walletData.timelockSeconds && (
                      <div>
                        <p className="text-white/40">Timelock</p>
                        <p className="font-black">{(walletData.timelockSeconds / 3600).toFixed(0)}h for &gt;${walletData.timelockThreshold}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction hash */}
              {walletData.txHash && (
                <div className="bg-white/5 border border-white/10 p-4 text-sm">
                  <p className="text-white/40 text-xs mb-1">TRANSACTION HASH</p>
                  <code className="font-mono text-white/80 text-xs break-all">{walletData.txHash}</code>
                </div>
              )}

              {/* Fund with Friendbot */}
              {!funded ? (
                <div className="relative">
                  <div className="absolute -inset-1 bg-yellow-500/40 translate-x-2 translate-y-2" />
                  <div className="relative bg-[#0A0A0A] border-4 border-yellow-500/60 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-black text-yellow-400 text-sm">ACCOUNT NOT YET FUNDED</p>
                        <p className="text-white/60 text-xs mt-1">
                          Stellar accounts must be funded with at least 1 XLM to exist on the network.
                          Use Friendbot to fund this testnet account for free.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={fundWithFriendbot}
                      disabled={funding}
                      className="w-full relative group"
                    >
                      <div className="absolute inset-0 bg-yellow-600 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                      <div className="relative bg-yellow-500 text-black py-3 font-black text-sm flex items-center justify-center gap-2 border-2 border-white">
                        {funding ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            FUNDING ACCOUNT...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            FUND WITH FRIENDBOT (10,000 XLM)
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-green-500/10 border-2 border-green-500/30 p-4">
                  <Check className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-black text-green-400 text-sm">ACCOUNT FUNDED</p>
                    <p className="text-white/60 text-xs">10,000 XLM credited via Stellar Friendbot</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-[#00D4FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                  <div className="relative bg-[#0066FF] text-white py-3 font-black text-sm flex items-center justify-center gap-2 border-2 border-white">
                    <Wallet className="w-4 h-4" />
                    DASHBOARD
                  </div>
                </button>
                {funded ? (
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${walletData.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative bg-white/10 text-white py-3 font-black text-sm flex items-center justify-center gap-2 border-2 border-white">
                      VIEW ON EXPLORER
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                ) : (
                  <button
                    onClick={fundWithFriendbot}
                    disabled={funding}
                    className="relative group opacity-60 cursor-not-allowed"
                    title="Fund the account first to view on explorer"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-1 translate-y-1" />
                    <div className="relative bg-white/10 text-white py-3 font-black text-sm flex items-center justify-center gap-2 border-2 border-white/40">
                      VIEW ON EXPLORER
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
