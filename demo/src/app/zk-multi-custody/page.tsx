'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Shield, Users, Check, ArrowRight, AlertCircle, Lock, Zap } from 'lucide-react';

interface Guardian {
  provider: 'google' | 'github' | 'apple';
  email: string;
  sub: string;
  accessToken: string;
  label: string;
}

export default function ZkMultiCustodyPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<'intro' | 'setup' | 'guardian1' | 'guardian2' | 'guardian3' | 'configure' | 'creating' | 'done'>('intro');
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [threshold, setThreshold] = useState(2);
  const [timelockEnabled, setTimelockEnabled] = useState(true);
  const [timelockSeconds, setTimelockSeconds] = useState(86400); // 24 hours
  const [timelockThreshold, setTimelockThreshold] = useState('10000'); // $10,000
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authenticateGuardian = async (
    providerType: 'google' | 'github',
    guardianNumber: number,
    label: string
  ) => {
    setLoading(true);
    setError('');

    try {
      // Sign in with OAuth provider
      const result = await signIn(providerType, {
        redirect: false,
        callbackUrl: '/zk-multi-custody',
      });

      if (result?.error) {
        throw new Error('Authentication failed');
      }

      // Wait for session update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get session with access token
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData?.user || !sessionData?.accessToken) {
        throw new Error('Failed to get access token');
      }

      // Add guardian
      const newGuardian: Guardian = {
        provider: providerType,
        email: sessionData.user.email,
        sub: sessionData.user.sub || sessionData.user.id,
        accessToken: sessionData.accessToken,
        label,
      };

      setGuardians([...guardians, newGuardian]);

      // Move to next step
      if (guardianNumber === 1) setStep('guardian2');
      else if (guardianNumber === 2) setStep('guardian3');
      else if (guardianNumber === 3) setStep('configure');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createMultiCustodyWallet = async () => {
    setStep('creating');
    setLoading(true);
    setError('');

    try {
      if (guardians.length !== 3) {
        throw new Error('Need exactly 3 guardians');
      }

      console.log('[ZK-Multi-Custody] Creating wallet with guardians:', guardians.map((g) => g.email));

      // Call multi-custody creation API
      const response = await fetch('/api/multi-custody/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardians: guardians.map((g) => ({
            provider: g.provider,
            email: g.email,
            sub: g.sub,
            accessToken: g.accessToken,
          })),
          threshold,
          timelockSeconds: timelockEnabled ? timelockSeconds : null,
          timelockThreshold: timelockEnabled ? timelockThreshold : null,
          creatorProof: null, // TODO: Generate ZK proof
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }

      const data = await response.json();
      setWalletData(data);

      // Save wallet info to localStorage
      localStorage.setItem(
        'zk_multi_custody_wallet',
        JSON.stringify({
          walletAddress: data.walletAddress,
          threshold: data.threshold,
          guardianCount: guardians.length,
          createdAt: Date.now(),
          guardians: guardians.map((g) => ({
            provider: g.provider,
            email: g.email,
            label: g.label,
          })),
        })
      );

      setStep('done');
    } catch (err: any) {
      console.error('[ZK-Multi-Custody] Error:', err);
      setError(err.message);
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-lg" />
              <span className="text-xl font-bold tracking-tight">StellaRay</span>
              <span className="text-xs text-white/40 font-mono">ZK Multi-Custody</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* INTRO SCREEN */}
          {step === 'intro' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-2xl mb-6">
                  <Shield className="w-10 h-10" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  ZK Multi-Custody Wallet
                </h1>
                <p className="text-2xl text-white/60 max-w-2xl mx-auto">
                  Multiple OAuth identities control one wallet with zero-knowledge privacy
                </p>
              </div>

              <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-2xl font-semibold flex items-center gap-3">
                  <Users className="w-6 h-6 text-[#0066FF]" />
                  How It Works
                </h3>

                <div className="space-y-4 text-white/70">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0066FF]/20 rounded-lg flex items-center justify-center text-[#00D4FF] font-bold">
                      1
                    </div>
                    <div>
                      <strong className="text-white">3 OAuth Guardians</strong>
                      <p>Authenticate with 3 different Google/GitHub accounts</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0066FF]/20 rounded-lg flex items-center justify-center text-[#00D4FF] font-bold">
                      2
                    </div>
                    <div>
                      <strong className="text-white">ZK Commitments On-Chain</strong>
                      <p>Each identity creates a Poseidon commitment stored in smart contract</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0066FF]/20 rounded-lg flex items-center justify-center text-[#00D4FF] font-bold">
                      3
                    </div>
                    <div>
                      <strong className="text-white">K-of-N Threshold Signing</strong>
                      <p>Transactions require 2-of-3 ZK proofs to execute</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0066FF]/20 rounded-lg flex items-center justify-center text-[#00D4FF] font-bold">
                      4
                    </div>
                    <div>
                      <strong className="text-white">Privacy Preserved</strong>
                      <p>No one knows WHICH guardians approved - only that 2 valid ZK proofs were submitted</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/30 rounded-2xl p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Key Advantages
                </h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>True self-custody - no servers hold your keys</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Social recovery - lose 1 account, use other 2</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Enhanced security - attacker needs 2+ accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Complete privacy - on-chain signatures are anonymous</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStep('guardian1')}
                className="w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white py-5 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-lg group"
              >
                Start Guardian Setup
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* GUARDIAN 1 */}
          {step === 'guardian1' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Guardian 1 of 3</h2>
                <p className="text-xl text-white/60">Primary Account</p>
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-12 h-3 bg-[#0066FF] rounded-full"></div>
                  <div className="w-12 h-3 bg-white/20 rounded-full"></div>
                  <div className="w-12 h-3 bg-white/20 rounded-full"></div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => authenticateGuardian('google', 1, 'Primary Gmail')}
                  disabled={loading}
                  className="w-full bg-white text-gray-900 py-5 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-3 text-lg"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                  </svg>
                  {loading ? 'Authenticating...' : 'Sign in with Google'}
                </button>

                <button
                  onClick={() => authenticateGuardian('github', 1, 'Primary GitHub')}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white py-5 rounded-xl font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-3 text-lg"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  {loading ? 'Authenticating...' : 'Sign in with GitHub'}
                </button>
              </div>
            </div>
          )}

          {/* GUARDIAN 2 */}
          {step === 'guardian2' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Guardian 2 of 3</h2>
                <p className="text-xl text-white/60">Backup Account (different from Guardian 1)</p>
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-12 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-12 h-3 bg-[#0066FF] rounded-full"></div>
                  <div className="w-12 h-3 bg-white/20 rounded-full"></div>
                </div>
              </div>

              <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4">
                <p className="text-green-300 text-sm flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Guardian 1: {guardians[0]?.email}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => authenticateGuardian('google', 2, 'Backup Gmail')}
                  disabled={loading}
                  className="w-full bg-white text-gray-900 py-5 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with Google (different account)'}
                </button>

                <button
                  onClick={() => authenticateGuardian('github', 2, 'Backup GitHub')}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white py-5 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with GitHub'}
                </button>
              </div>
            </div>
          )}

          {/* GUARDIAN 3 */}
          {step === 'guardian3' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Guardian 3 of 3</h2>
                <p className="text-xl text-white/60">Recovery Account</p>
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-12 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-12 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-12 h-3 bg-[#0066FF] rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Guardian 1: {guardians[0]?.email}
                  </p>
                </div>
                <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Guardian 2: {guardians[1]?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => authenticateGuardian('google', 3, 'Recovery Gmail')}
                  disabled={loading}
                  className="w-full bg-white text-gray-900 py-5 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with Google (3rd account)'}
                </button>

                <button
                  onClick={() => authenticateGuardian('github', 3, 'Recovery GitHub')}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white py-5 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with GitHub'}
                </button>
              </div>
            </div>
          )}

          {/* CONFIGURE */}
          {step === 'configure' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">Configure Wallet</h2>
                <p className="text-xl text-white/60">Set threshold and security parameters</p>
              </div>

              <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Approval Threshold
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="2"
                      max="3"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-[#00D4FF]">
                      {threshold}-of-3
                    </span>
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    Transactions require {threshold} guardian approvals to execute
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={timelockEnabled}
                      onChange={(e) => setTimelockEnabled(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Enable Timelock for Large Transactions</span>
                  </label>

                  {timelockEnabled && (
                    <div className="mt-4 space-y-4 pl-8">
                      <div>
                        <label className="block text-sm mb-2">Timelock Delay (seconds)</label>
                        <input
                          type="number"
                          value={timelockSeconds}
                          onChange={(e) => setTimelockSeconds(parseInt(e.target.value))}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2"
                        />
                        <p className="text-xs text-white/60 mt-1">
                          {(timelockSeconds / 3600).toFixed(1)} hours
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm mb-2">Amount Threshold (USDC)</label>
                        <input
                          type="text"
                          value={timelockThreshold}
                          onChange={(e) => setTimelockThreshold(e.target.value)}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2"
                        />
                        <p className="text-xs text-white/60 mt-1">
                          Transactions above this amount require timelock
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={createMultiCustodyWallet}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white py-5 rounded-xl font-semibold hover:opacity-90 transition text-lg"
              >
                {loading ? 'Creating Wallet...' : 'Create Multi-Custody Wallet'}
              </button>
            </div>
          )}

          {/* CREATING */}
          {step === 'creating' && (
            <div className="text-center space-y-8 py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-full animate-pulse">
                <Lock className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Creating ZK Multi-Custody Wallet...</h2>
                <p className="text-xl text-white/60">
                  Generating commitments and deploying to Soroban
                </p>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && walletData && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-4xl font-bold">Wallet Created!</h2>
                <p className="text-xl text-white/60">ZK Multi-Custody wallet is live on Stellar</p>
              </div>

              <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/40 mb-2 font-mono">WALLET ADDRESS</p>
                <p className="text-white font-mono break-all">{walletData.walletAddress}</p>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Guardian Commitments (On-Chain)</h3>
                {walletData.guardians?.map((guardian: any, i: number) => (
                  <div key={i} className="bg-black/40 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Guardian {guardian.index} - {guardian.label}
                      </span>
                      <span className="text-xs text-green-400 font-mono">
                        {guardian.commitment.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/70">
                    <strong>Threshold:</strong> {walletData.threshold}-of-{walletData.guardians.length}
                  </p>
                  {walletData.timelockSeconds && (
                    <p className="text-sm text-white/70 mt-1">
                      <strong>Timelock:</strong> {(walletData.timelockSeconds / 3600).toFixed(1)}h for txs &gt; $
                      {walletData.timelockThreshold}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white py-5 rounded-xl font-semibold text-lg"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5 inline ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
