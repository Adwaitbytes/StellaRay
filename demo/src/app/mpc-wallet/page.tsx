'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Shield, Key, Check, ArrowRight, AlertCircle, Eye, EyeOff, LogOut } from 'lucide-react';

interface ProviderSession {
  provider: 'google' | 'github';
  email: string;
  sub: string;
  accessToken: string;
}

export default function MPCWalletPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<'intro' | 'provider1' | 'provider2' | 'provider3' | 'creating' | 'done'>('intro');
  const [providers, setProviders] = useState<ProviderSession[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShares, setShowShares] = useState(false);

  const authenticateProvider = async (providerType: 'google' | 'github', index: number) => {
    setLoading(true);
    setError('');

    try {
      // Sign in with OAuth provider
      const result = await signIn(providerType, {
        redirect: false,
        callbackUrl: '/mpc-wallet'
      });

      if (result?.error) {
        throw new Error('Authentication failed');
      }

      // Wait a bit for session to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the session with access token
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData?.user || !sessionData?.accessToken) {
        throw new Error('Failed to get access token');
      }

      // Add to providers list
      const newProvider: ProviderSession = {
        provider: providerType,
        email: sessionData.user.email,
        sub: sessionData.user.sub || sessionData.user.id,
        accessToken: sessionData.accessToken
      };

      setProviders([...providers, newProvider]);

      // Move to next step
      if (index === 1) setStep('provider2');
      else if (index === 2) setStep('provider3');
      else if (index === 3) {
        // All 3 providers collected - create wallet
        createWallet([...providers, newProvider]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (allProviders: ProviderSession[]) => {
    setStep('creating');
    setLoading(true);
    setError('');

    try {
      if (allProviders.length !== 3) {
        throw new Error('Need 3 OAuth providers');
      }

      console.log('[MPC] Creating wallet with OAuth providers:', allProviders.map(p => p.email));

      // Call the REAL MPC create API with OAuth tokens
      const response = await fetch('/api/mpc/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: allProviders.map(p => ({
            type: p.provider,
            userSub: p.sub,
            token: p.accessToken,
            email: p.email
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }

      const data = await response.json();
      setWalletData(data);

      // Save wallet info to localStorage (without shares - those are in cloud)
      localStorage.setItem('mpc_wallet', JSON.stringify({
        publicKey: data.publicKey,
        threshold: data.threshold,
        total: data.total,
        createdAt: Date.now(),
        providers: allProviders.map(p => ({ provider: p.provider, email: p.email }))
      }));

      setStep('done');

    } catch (err: any) {
      console.error('[MPC] Error:', err);
      setError(err.message);
      setStep('provider1');
    } finally {
      setLoading(false);
    }
  };

  const signOutProvider = async (index: number) => {
    await signIn('credentials', { redirect: false }); // Sign out
    const newProviders = providers.filter((_, i) => i !== index);
    setProviders(newProviders);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-lg" />
              <span className="text-xl font-bold tracking-tight">StellaRay</span>
              <span className="text-xs text-white/40 font-mono">MPC + OAuth</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          {step === 'intro' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-2xl mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  MPC Wallet with OAuth
                </h1>
                <p className="text-xl text-white/60 max-w-lg mx-auto">
                  Sign in with 3 Google/GitHub accounts - shares stored in cloud
                </p>
              </div>

              <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#0066FF]" />
                  How it works
                </h3>
                <ul className="space-y-3 text-white/70 text-sm">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00D4FF] mt-0.5 flex-shrink-0" />
                    <span><strong>Sign in with 3 accounts</strong> (your Google, work Google, friend's GitHub)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00D4FF] mt-0.5 flex-shrink-0" />
                    <span><strong>Private key split into 3 shares</strong> using Shamir Secret Sharing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00D4FF] mt-0.5 flex-shrink-0" />
                    <span><strong>Shares stored in cloud:</strong> Google Drive + GitHub Gists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00D4FF] mt-0.5 flex-shrink-0" />
                    <span><strong>Any 2 accounts</strong> can sign transactions</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStep('provider1')}
                className="w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white py-4 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 group"
              >
                Start OAuth Setup
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Provider 1 */}
          {step === 'provider1' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Provider 1 of 3</h2>
                <p className="text-white/60">Primary Account</p>
                <div className="flex justify-center gap-2">
                  <div className="w-8 h-2 bg-[#0066FF] rounded-full"></div>
                  <div className="w-8 h-2 bg-white/20 rounded-full"></div>
                  <div className="w-8 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => authenticateProvider('google', 1)}
                  disabled={loading}
                  className="w-full bg-white text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  </svg>
                  {loading ? 'Authenticating...' : 'Sign in with Google'}
                </button>

                <button
                  onClick={() => authenticateProvider('github', 1)}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white py-4 rounded-xl font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {loading ? 'Authenticating...' : 'Sign in with GitHub'}
                </button>
              </div>
            </div>
          )}

          {/* Similar for provider2 and provider3 */}
          {step === 'provider2' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Provider 2 of 3</h2>
                <p className="text-white/60">Backup Account (different from Provider 1)</p>
                <div className="flex justify-center gap-2">
                  <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                  <div className="w-8 h-2 bg-[#0066FF] rounded-full"></div>
                  <div className="w-8 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>

              <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4">
                <p className="text-green-300 text-sm">✓ Provider 1: {providers[0]?.email}</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => authenticateProvider('google', 2)}
                  disabled={loading}
                  className="w-full bg-white text-gray-900 py-4 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with Google (different account)'}
                </button>

                <button
                  onClick={() => authenticateProvider('github', 2)}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white py-4 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with GitHub'}
                </button>
              </div>
            </div>
          )}

          {step === 'provider3' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Provider 3 of 3</h2>
                <p className="text-white/60">Recovery Account</p>
                <div className="flex justify-center gap-2">
                  <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                  <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                  <div className="w-8 h-2 bg-[#0066FF] rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3">
                  <p className="text-green-300 text-sm">✓ Provider 1: {providers[0]?.email}</p>
                </div>
                <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3">
                  <p className="text-green-300 text-sm">✓ Provider 2: {providers[1]?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => authenticateProvider('google', 3)}
                  disabled={loading}
                  className="w-full bg-white text-gray-900 py-4 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with Google (3rd account)'}
                </button>

                <button
                  onClick={() => authenticateProvider('github', 3)}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white py-4 rounded-xl font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Sign in with GitHub'}
                </button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center space-y-8 py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-full animate-pulse">
                <Key className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Creating MPC Wallet...</h2>
                <p className="text-white/60">Splitting key and storing shares in OAuth cloud storage</p>
              </div>
            </div>
          )}

          {step === 'done' && walletData && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold">MPC Wallet Created!</h2>
                <p className="text-white/60">Shares stored across OAuth providers</p>
              </div>

              <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/40 mb-2 font-mono">WALLET ADDRESS</p>
                <p className="text-white font-mono break-all text-sm">{walletData.publicKey}</p>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/30 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Shares Stored in Cloud:</h3>
                {walletData.shareIds?.map((share: any, i: number) => (
                  <div key={i} className="bg-black/40 rounded-lg p-3 mb-2 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Share {share.index} - {share.provider.toUpperCase()}</span>
                      <span className="text-xs text-green-400">✓ Stored: {share.storageId.substring(0, 12)}...</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-white/5 border-2 border-white/10 text-white py-4 rounded-xl font-semibold"
                >
                  Main Dashboard
                </button>
                <button
                  onClick={() => router.push('/mpc-dashboard')}
                  className="flex-1 bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white py-4 rounded-xl font-semibold"
                >
                  MPC Dashboard <ArrowRight className="w-5 h-5 inline" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
