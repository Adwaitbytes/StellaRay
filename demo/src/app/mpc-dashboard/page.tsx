'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Send, Copy, Check, RefreshCw, ExternalLink, Wallet, Key, Lock } from 'lucide-react';

export default function MPCDashboard() {
  const router = useRouter();
  const [wallet, setWallet] = useState<{ publicKey: string; createdAt: number } | null>(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = () => {
    const saved = localStorage.getItem('mpc_wallet');
    if (saved) {
      const data = JSON.parse(saved);
      setWallet(data);
      loadBalance(data.publicKey);
    }
  };

  const loadBalance = async (publicKey: string) => {
    try {
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}`
      );

      if (response.ok) {
        const data = await response.json();
        const xlmBalance = data.balances.find((b: any) => b.asset_type === 'native');
        setBalance(xlmBalance?.balance || '0');
      } else {
        setBalance('0 (Unfunded)');
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
      setBalance('0 (Unfunded)');
    }
  };

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshBalance = () => {
    if (wallet) {
      setLoading(true);
      loadBalance(wallet.publicKey);
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const fundWithFriendbot = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(wallet.publicKey)}`
      );

      if (response.ok) {
        alert('Funded with 10,000 XLM from Friendbot!');
        await loadBalance(wallet.publicKey);
      } else {
        alert('Friendbot funding failed');
      }
    } catch (err) {
      alert('Error funding account');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b-2 border-white/10">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-lg" />
                <span className="text-xl font-bold tracking-tight">StellaRay</span>
                <span className="text-xs text-white/40 font-mono">MPC</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-32 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-4">
              <Wallet className="w-10 h-10 text-white/40" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">No MPC Wallet Found</h2>
              <p className="text-white/60 mb-8">
                Create an MPC wallet to get started with secure multi-party computation
              </p>
            </div>
            <button
              onClick={() => router.push('/mpc-wallet')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              <Shield className="w-5 h-5" />
              Create MPC Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-lg" />
              <span className="text-xl font-bold tracking-tight">StellaRay</span>
              <span className="text-xs text-white/40 font-mono">MPC</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-white/60 hover:text-white transition"
            >
              Main Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">MPC Dashboard</h1>
            <p className="text-white/60">Multi-Party Computation Wallet</p>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#00D4FF]/20 border-2 border-[#0066FF]/30 rounded-2xl p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-white/60 mb-2 font-mono">BALANCE</p>
                <p className="text-5xl font-bold">{balance} <span className="text-2xl text-white/60">XLM</span></p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshBalance}
                  disabled={loading}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-white/40 mb-2 font-mono">WALLET ADDRESS</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-mono text-white/90 flex-1 break-all">{wallet.publicKey}</p>
                <button
                  onClick={copyAddress}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {balance === '0 (Unfunded)' && (
              <button
                onClick={fundWithFriendbot}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Funding...' : 'Fund with Friendbot (10,000 XLM)'}
              </button>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* MPC Security */}
            <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">MPC Security</h3>
              </div>
              <p className="text-sm text-white/60 mb-3">
                Your private key is split into 3 encrypted shares using Shamir Secret Sharing
              </p>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check className="w-4 h-4" />
                <span>2-of-3 Threshold</span>
              </div>
            </div>

            {/* Key Shares */}
            <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Key Shares</h3>
              </div>
              <p className="text-sm text-white/60 mb-3">
                Shares can be stored across Google Drive, GitHub, and iCloud
              </p>
              <div className="text-sm text-white/40">
                OAuth setup required
              </div>
            </div>

            {/* Recovery */}
            <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0066FF] to-[#00D4FF] rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Recovery</h3>
              </div>
              <p className="text-sm text-white/60 mb-3">
                Lose access to 1 provider? No problem. 2 out of 3 shares can recover your wallet
              </p>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check className="w-4 h-4" />
                <span>Social Recovery</span>
              </div>
            </div>

          </div>

          {/* Info */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-2xl p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              MPC Wallet Overview
            </h3>
            <p className="text-sm text-white/70 mb-4">
              This is a simplified version of the MPC wallet. Full OAuth-based share storage
              is available in the complete implementation.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40 mb-1">Threshold:</p>
                <p className="font-semibold">2 of 3 shares</p>
              </div>
              <div>
                <p className="text-white/40 mb-1">Created:</p>
                <p className="font-semibold">{new Date(wallet.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
