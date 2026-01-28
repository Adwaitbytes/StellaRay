/**
 * StreamCard Component
 *
 * Displays a payment stream with real-time animated counter.
 * Shows streaming progress, amounts, and actions.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowDown,
  Clock,
  Zap,
  Pause,
  Play,
  X,
  Check,
  Copy,
  ExternalLink,
  TrendingUp,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useStreamingCounter } from '@/hooks/useStreamingCounter';
import { getExplorerUrl, shortenAddress } from '@/lib/stellar';

interface StreamCardProps {
  stream: {
    id: string;
    senderAddress: string;
    recipientAddress: string;
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
  };
  userAddress: string;
  onWithdraw?: (streamId: string, amount: number) => void;
  onCancel?: (streamId: string) => void;
  compact?: boolean;
}

export function StreamCard({
  stream,
  userAddress,
  onWithdraw,
  onCancel,
  compact = false,
}: StreamCardProps) {
  const [copied, setCopied] = useState(false);

  const isOutgoing = stream.senderAddress === userAddress;
  const isIncoming = stream.recipientAddress === userAddress;
  const isPending = stream.status === 'pending';
  const isCancelled = stream.status === 'cancelled';
  const isCompleted = stream.status === 'completed';

  // Real-time streaming counter
  const counter = useStreamingCounter({
    totalAmount: parseFloat(stream.totalAmount),
    flowRatePerSecond: parseFloat(stream.flowRate),
    startTime: new Date(stream.startTime),
    endTime: new Date(stream.endTime),
    cliffTime: stream.cliffTime ? new Date(stream.cliffTime) : undefined,
    withdrawnAmount: parseFloat(stream.withdrawnAmount),
    curveType: stream.curveType,
    isPaused: isCancelled || isCompleted,
  });

  // Format flow rate for display
  const flowRateDisplay = useMemo(() => {
    const rate = parseFloat(stream.flowRate);
    if (rate < 0.000001) return `${(rate * 86400).toFixed(4)}/day`;
    if (rate < 0.001) return `${(rate * 3600).toFixed(4)}/hr`;
    if (rate < 1) return `${(rate * 60).toFixed(4)}/min`;
    return `${rate.toFixed(4)}/sec`;
  }, [stream.flowRate]);

  // Time display
  const timeDisplay = useMemo(() => {
    if (counter.isCompleted) return 'Completed';
    if (isCancelled) return 'Cancelled';
    if (!counter.isActive && !isPending) return 'Ended';

    const remaining = counter.remainingSeconds;
    if (remaining < 60) return `${Math.floor(remaining)}s left`;
    if (remaining < 3600) return `${Math.floor(remaining / 60)}m left`;
    if (remaining < 86400) return `${Math.floor(remaining / 3600)}h left`;
    return `${Math.floor(remaining / 86400)}d left`;
  }, [counter.isCompleted, counter.isActive, counter.remainingSeconds, isCancelled, isPending]);

  const copyId = () => {
    navigator.clipboard.writeText(stream.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status badge color
  const statusColor = useMemo(() => {
    if (counter.isActive) return 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/30';
    if (isCompleted) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (isCancelled) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (isPending) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-white/10 text-white/60 border-white/20';
  }, [counter.isActive, isCompleted, isCancelled, isPending]);

  // Curve badge
  const curveDisplay = useMemo(() => {
    switch (stream.curveType) {
      case 'exponential': return 'EXPONENTIAL';
      case 'cliff': return 'CLIFF';
      case 'steps': return 'STEPS';
      default: return 'LINEAR';
    }
  }, [stream.curveType]);

  if (compact) {
    return (
      <div className="border-2 border-white/20 p-4 hover:border-white/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOutgoing ? (
              <ArrowRight className="w-4 h-4 text-red-400" />
            ) : (
              <ArrowDown className="w-4 h-4 text-[#00FF88]" />
            )}
            <span className="font-mono text-sm text-white/60">
              {shortenAddress(isOutgoing ? stream.recipientAddress : stream.senderAddress)}
            </span>
          </div>
          <span className={`px-2 py-1 text-xs font-bold border ${statusColor}`}>
            {counter.isActive ? 'LIVE' : stream.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black text-[#00FF88] tabular-nums">
              {counter.formattedStreamed}
            </span>
            <span className="text-white/40 ml-1">/ {parseFloat(stream.totalAmount).toFixed(2)}</span>
            <span className="text-white/60 ml-1">{stream.asset}</span>
          </div>
          <span className="text-white/40 text-sm">{timeDisplay}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#00FF88] transition-all duration-100"
            style={{ width: `${Math.min(100, counter.percentComplete)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-white bg-black">
      {/* Header */}
      <div className="p-4 border-b-4 border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center ${
            isOutgoing ? 'bg-red-500/20' : 'bg-[#00FF88]/20'
          }`}>
            {isOutgoing ? (
              <ArrowRight className="w-5 h-5 text-red-400" />
            ) : (
              <ArrowDown className="w-5 h-5 text-[#00FF88]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white">
                {stream.title || (isOutgoing ? 'OUTGOING STREAM' : 'INCOMING STREAM')}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-bold border ${statusColor}`}>
                {counter.isActive ? 'STREAMING' : stream.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <span className="font-mono">{stream.id}</span>
              <button onClick={copyId} className="hover:text-white transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-bold bg-white/5 border border-white/20">
            {curveDisplay}
          </span>
          <span className={`px-2 py-1 text-xs font-bold ${
            stream.network === 'mainnet'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {stream.network.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Parties */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <p className="text-white/40 text-xs font-bold mb-1">FROM</p>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-white/60" />
              <span className="font-mono text-sm">
                {shortenAddress(stream.senderAddress)}
              </span>
              {isOutgoing && (
                <span className="text-xs text-[#0066FF] font-bold">(YOU)</span>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${counter.isActive ? 'text-[#00FF88] animate-pulse' : 'text-white/30'}`} />
              <span className="text-white/60 text-sm font-mono">{flowRateDisplay} {stream.asset}</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/40 text-xs font-bold mb-1">TO</p>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-white/60" />
              <span className="font-mono text-sm">
                {shortenAddress(stream.recipientAddress)}
              </span>
              {isIncoming && (
                <span className="text-xs text-[#00FF88] font-bold">(YOU)</span>
              )}
            </div>
          </div>
        </div>

        {/* Live Counter */}
        <div className="bg-white/5 border-2 border-white/10 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-white/40 text-xs font-bold mb-2">STREAMED</p>
              <p className="text-3xl font-black text-[#00FF88] tabular-nums">
                {counter.formattedStreamed}
              </p>
              <p className="text-white/40 text-sm">{stream.asset}</p>
            </div>

            <div>
              <p className="text-white/40 text-xs font-bold mb-2">WITHDRAWN</p>
              <p className="text-3xl font-black text-[#0066FF] tabular-nums">
                {parseFloat(stream.withdrawnAmount).toFixed(2)}
              </p>
              <p className="text-white/40 text-sm">{stream.asset}</p>
            </div>

            <div>
              <p className="text-white/40 text-xs font-bold mb-2">AVAILABLE</p>
              <p className="text-3xl font-black text-white tabular-nums">
                {counter.formattedWithdrawable}
              </p>
              <p className="text-white/40 text-sm">{stream.asset}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>{counter.formattedPercent}% complete</span>
              <span>{timeDisplay}</span>
            </div>
            <div className="h-3 bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] to-[#00FF88] transition-all duration-100"
                style={{ width: `${Math.min(100, counter.percentComplete)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cliff indicator */}
        {stream.cliffTime && !counter.isCliffPassed && (
          <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">CLIFF PERIOD</span>
            </div>
            <p className="text-white/60 text-sm mt-1">
              No tokens will be released until {new Date(stream.cliffTime).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isIncoming && counter.withdrawableAmount > 0 && onWithdraw && (
            <button
              onClick={() => onWithdraw(stream.id, counter.withdrawableAmount)}
              className="group relative flex-1"
            >
              <div className="absolute inset-0 bg-[#00FF88] translate-x-1 translate-y-1" />
              <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-black border-4 border-[#00FF88] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
                <ArrowDown className="w-5 h-5" />
                WITHDRAW {counter.formattedWithdrawable} {stream.asset}
              </div>
            </button>
          )}

          {isOutgoing && counter.isActive && onCancel && (
            <button
              onClick={() => onCancel(stream.id)}
              className="px-6 py-4 border-2 border-red-500/50 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              CANCEL
            </button>
          )}

          <a
            href={getExplorerUrl(stream.senderAddress, 'account', stream.network as any)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-4 border-2 border-white/30 text-white/60 hover:border-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Description */}
        {stream.description && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm">{stream.description}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t-2 border-white/10 flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Started {new Date(stream.startTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Ends {new Date(stream.endTime).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>Total: {parseFloat(stream.totalAmount).toFixed(2)} {stream.asset}</span>
        </div>
      </div>
    </div>
  );
}

export default StreamCard;
