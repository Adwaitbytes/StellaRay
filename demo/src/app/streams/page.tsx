/**
 * Streaming Payments Dashboard
 *
 * View and manage payment streams - both sent and received.
 * Features real-time updates, creation, withdrawal, and cancellation.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Zap,
  ArrowDown,
  ArrowRight,
  Clock,
  Check,
  Loader,
  RefreshCw,
  Filter,
  TrendingUp,
  Wallet,
  AlertCircle,
  X,
} from 'lucide-react';
import { useZkWallet } from '@/hooks/useZkWallet';
import { StreamCard } from '@/components/StreamCard';
import { CreateStreamModal, StreamFormData } from '@/components/CreateStreamModal';
import { getCurrentNetwork } from '@/lib/stellar';
import {
  generateStreamId,
  getEscrowAddress,
  verifySufficientBalance,
} from '@/lib/streamClient';

interface StreamWithMetrics {
  id: string;
  senderAddress: string;
  senderEmail: string | null;
  recipientAddress: string;
  recipientEmail: string | null;
  totalAmount: string;
  asset: string;
  startTime: string;
  endTime: string;
  cliffTime: string | null;
  flowRate: string;
  curveType: 'linear' | 'cliff' | 'exponential' | 'steps';
  status: string;
  withdrawnAmount: string;
  title: string | null;
  description: string | null;
  network: string;
  direction: 'incoming' | 'outgoing';
  metrics: {
    streamedAmount: number;
    withdrawableAmount: number;
    remainingAmount: number;
    percentComplete: number;
    isActive: boolean;
  };
}

interface StreamStats {
  totalStreams: number;
  activeStreams: number;
  completedStreams: number;
  cancelledStreams: number;
  totalAmountStreamed: string;
  totalAmountWithdrawn: string;
  totalActiveFlowRate: number;
  totalWithdrawableNow: number;
}

export default function StreamsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const zkWallet = useZkWallet();

  const [streams, setStreams] = useState<StreamWithMetrics[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch streams
  const fetchStreams = useCallback(async () => {
    if (!zkWallet.address) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/streams/history?address=${zkWallet.address}&type=${filter}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch streams');
      }

      const data = await response.json();
      setStreams(data.streams || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [zkWallet.address, filter]);

  useEffect(() => {
    if (zkWallet.address) {
      fetchStreams();
    }
  }, [zkWallet.address, filter, fetchStreams]);

  // Auto-refresh every 10 seconds for active streams
  useEffect(() => {
    if (!zkWallet.address || streams.length === 0) return;

    const hasActiveStreams = streams.some(s => s.metrics?.isActive);
    if (!hasActiveStreams) return;

    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, [zkWallet.address, streams, fetchStreams]);

  // Create stream handler
  const handleCreateStream = async (formData: StreamFormData) => {
    if (!zkWallet.address || !zkWallet.send) return;

    setIsCreating(true);

    const durationMultipliers: Record<string, number> = {
      minutes: 60,
      hours: 3600,
      days: 86400,
      weeks: 604800,
      months: 2592000,
    };

    const durationSeconds = formData.durationValue * (durationMultipliers[formData.durationUnit] || 3600);
    const cliffSeconds = formData.cliffValue && formData.cliffUnit
      ? formData.cliffValue * (durationMultipliers[formData.cliffUnit] || 3600)
      : undefined;

    const network = getCurrentNetwork();

    try {
      // Step 1: Verify balance
      const xlmBalance = zkWallet.balances?.find(b => b.asset === 'XLM');
      const balance = parseFloat(xlmBalance?.balance || '0');
      const balanceCheck = verifySufficientBalance(balance, formData.totalAmount);

      if (!balanceCheck.sufficient) {
        throw new Error(
          `Insufficient balance. You need ${balanceCheck.required.toFixed(2)} XLM (${formData.totalAmount} XLM + fees). ` +
          `Current balance: ${balance.toFixed(2)} XLM. Shortage: ${balanceCheck.shortage.toFixed(2)} XLM`
        );
      }

      // Step 2: Generate stream ID and escrow address
      const streamId = generateStreamId();
      const escrowAddress = getEscrowAddress(streamId, network);

      // Step 3: Calculate escrow funding amount (total + reserves for account creation)
      const escrowFunding = (parseFloat(formData.totalAmount) + 1.5).toFixed(7);

      // Step 4: Send funds to escrow account
      const txResult = await zkWallet.send(
        escrowAddress,
        escrowFunding,
        `Stream: ${streamId.slice(0, 8)}`
      );

      // Step 5: Register stream in database with tx hash
      const response = await fetch('/api/streams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId, // Pre-generated ID
          senderAddress: zkWallet.address,
          recipientAddress: formData.recipientAddress,
          recipientEmail: formData.recipientEmail,
          totalAmount: formData.totalAmount,
          durationSeconds,
          cliffSeconds,
          curveType: formData.curveType,
          title: formData.title,
          description: formData.description,
          memo: formData.memo,
          network,
          depositTxHash: txResult.hash, // Proof of escrow funding
          escrowAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register stream');
      }

      // Refresh wallet balances and streams list
      await Promise.all([
        zkWallet.refreshData(),
        fetchStreams(),
      ]);
      setShowCreateModal(false);
    } catch (err: any) {
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  // Withdraw handler - calls API which handles escrow withdrawal
  const handleWithdraw = async (streamId: string, amount: number) => {
    if (!zkWallet.address) return;

    setIsWithdrawing(streamId);

    try {
      // Call API to withdraw from escrow (server signs the escrow transaction)
      const response = await fetch(`/api/streams/${streamId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress: zkWallet.address,
          amount: amount.toFixed(7),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to withdraw');
      }

      const data = await response.json();
      console.log('Withdrawal tx:', data.txHash);

      // Refresh wallet balances and streams
      await Promise.all([
        zkWallet.refreshData(),
        fetchStreams(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
    } finally {
      setIsWithdrawing(null);
    }
  };

  // Cancel handler - calls API which handles escrow refund
  const handleCancel = async (streamId: string) => {
    if (!zkWallet.address) return;

    if (!confirm('Are you sure you want to cancel this stream? The recipient will keep any already-streamed amount, and the remaining funds will be returned to you.')) {
      return;
    }

    try {
      // Call API to cancel and refund from escrow
      const response = await fetch(`/api/streams/${streamId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: zkWallet.address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel stream');
      }

      const data = await response.json();
      console.log('Cancel tx:', data.txHash);

      // Refresh wallet balances and streams
      await Promise.all([
        zkWallet.refreshData(),
        fetchStreams(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel stream');
    }
  };

  // Loading state
  if (sessionStatus === 'loading' || zkWallet.isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
      </div>
    );
  }

  const xlmBalance = zkWallet.balances?.find(b => b.asset === 'XLM')?.balance || '0';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3">
                <Zap className="w-8 h-8 text-[#00FF88]" />
                STREAMING PAYMENTS
              </h1>
              <p className="text-white/60">Real-time money flow on Stellar</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative"
          >
            <div className="absolute inset-0 bg-[#0066FF] translate-x-1 translate-y-1" />
            <div className="relative flex items-center gap-2 px-6 py-3 bg-black text-white font-black border-4 border-[#0066FF] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
              <Plus className="w-5 h-5" />
              NEW STREAM
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border-2 border-white/20 p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                TOTAL STREAMS
              </div>
              <p className="text-3xl font-black">{stats.totalStreams}</p>
            </div>

            <div className="border-2 border-[#00FF88]/30 bg-[#00FF88]/5 p-4">
              <div className="flex items-center gap-2 text-[#00FF88] text-sm mb-2">
                <Zap className="w-4 h-4" />
                ACTIVE NOW
              </div>
              <p className="text-3xl font-black text-[#00FF88]">{stats.activeStreams}</p>
            </div>

            <div className="border-2 border-white/20 p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
                <Wallet className="w-4 h-4" />
                WITHDRAWABLE
              </div>
              <p className="text-3xl font-black text-[#0066FF]">
                {stats.totalWithdrawableNow.toFixed(2)}
                <span className="text-lg text-white/40 ml-1">XLM</span>
              </p>
            </div>

            <div className="border-2 border-white/20 p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
                <Check className="w-4 h-4" />
                COMPLETED
              </div>
              <p className="text-3xl font-black">{stats.completedStreams}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'incoming', 'outgoing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 font-bold text-sm border-2 transition-colors ${
                  filter === f
                    ? 'border-white bg-white text-black'
                    : 'border-white/30 text-white/60 hover:border-white/60'
                }`}
              >
                {f === 'all' && 'ALL STREAMS'}
                {f === 'incoming' && (
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-4 h-4" /> INCOMING
                  </span>
                )}
                {f === 'outgoing' && (
                  <span className="flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" /> OUTGOING
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStreams}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-white/30 text-white/60 hover:border-white/60 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="border-2 border-red-500/50 bg-red-500/10 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Streams List */}
        {loading && streams.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20 border-2 border-white/10">
            <Zap className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white/60 mb-2">NO STREAMS YET</h3>
            <p className="text-white/40 mb-6">
              {filter === 'all'
                ? "You haven't created or received any payment streams."
                : filter === 'incoming'
                ? "You don't have any incoming streams."
                : "You haven't created any outgoing streams."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#0066FF] text-white font-black hover:bg-[#0055DD] transition-colors"
            >
              CREATE YOUR FIRST STREAM
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                userAddress={zkWallet.address!}
                onWithdraw={handleWithdraw}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 border-2 border-white/10 p-6">
          <h2 className="text-xl font-black mb-4">HOW STREAMING WORKS</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="w-10 h-10 bg-[#0066FF]/20 border-2 border-[#0066FF] flex items-center justify-center mb-3">
                <span className="font-black text-[#0066FF]">1</span>
              </div>
              <h3 className="font-bold mb-1">CREATE</h3>
              <p className="text-white/40 text-sm">
                Set recipient, amount, and duration. Choose a streaming curve.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-[#00FF88]/20 border-2 border-[#00FF88] flex items-center justify-center mb-3">
                <span className="font-black text-[#00FF88]">2</span>
              </div>
              <h3 className="font-bold mb-1">STREAM</h3>
              <p className="text-white/40 text-sm">
                Money flows continuously. Watch the real-time counter tick up.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-[#00D4FF]/20 border-2 border-[#00D4FF] flex items-center justify-center mb-3">
                <span className="font-black text-[#00D4FF]">3</span>
              </div>
              <h3 className="font-bold mb-1">WITHDRAW</h3>
              <p className="text-white/40 text-sm">
                Recipients can withdraw available funds at any time.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-white/10 border-2 border-white/30 flex items-center justify-center mb-3">
                <span className="font-black">4</span>
              </div>
              <h3 className="font-bold mb-1">COMPLETE</h3>
              <p className="text-white/40 text-sm">
                Stream ends when duration expires or sender cancels.
              </p>
            </div>
          </div>
        </div>

        {/* Network Badge */}
        <div className="mt-6 flex justify-center">
          <div
            className={`px-3 py-1 text-xs font-bold ${
              getCurrentNetwork() === 'mainnet'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {getCurrentNetwork().toUpperCase()} NETWORK
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateStreamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateStream}
        senderAddress={zkWallet.address || ''}
        senderBalance={parseFloat(xlmBalance)}
        network={getCurrentNetwork()}
      />
    </div>
  );
}
