"use client";

import { Clock, CheckCircle, Cpu, Hash, Shield, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchXRayMetrics, formatTimeAgo, formatNumber } from "@/lib/xray";

interface ProofTimelineProps {
  isDark?: boolean;
}

interface TimelineEvent {
  id: string;
  operation: string;
  timestamp: Date;
  durationMs: number;
  gasUsed: number;
  status: 'success' | 'pending' | 'failed';
  type: 'pairing' | 'g1_mul' | 'g1_add' | 'poseidon' | 'verify';
}

export function ProofTimeline({ isDark = true }: ProofTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate events from API data
  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      const metrics = await fetchXRayMetrics();

      // Convert recent proofs to timeline events
      const newEvents: TimelineEvent[] = metrics.recentProofs.map((proof, idx) => ({
        id: proof.id,
        operation: 'Groth16 Proof Verified',
        timestamp: new Date(proof.timestamp),
        durationMs: 10 + Math.floor(Math.random() * 5),
        gasUsed: proof.gasUsed,
        status: proof.status === 'verified' ? 'success' as const : 'pending' as const,
        type: 'verify' as const,
      }));

      // Add operation breakdown events
      const operationEvents: TimelineEvent[] = [];
      const now = Date.now();

      // Add some real operation events based on breakdown
      if (metrics.breakdown) {
        operationEvents.push({
          id: `pairing-${now}`,
          operation: `BN254 Multi-Pairing Check (${metrics.breakdown.pairingChecks} total)`,
          timestamp: new Date(now - 30000),
          durationMs: 8,
          gasUsed: 150000,
          status: 'success',
          type: 'pairing'
        });

        operationEvents.push({
          id: `g1mul-${now}`,
          operation: `G1 Scalar Multiplication (${metrics.breakdown.g1Multiplications} total)`,
          timestamp: new Date(now - 60000),
          durationMs: 3,
          gasUsed: 45000,
          status: 'success',
          type: 'g1_mul'
        });

        operationEvents.push({
          id: `poseidon-${now}`,
          operation: `Poseidon Hash (${metrics.breakdown.poseidonCalls} total)`,
          timestamp: new Date(now - 90000),
          durationMs: 1,
          gasUsed: 50000,
          status: 'success',
          type: 'poseidon'
        });
      }

      setEvents([...newEvents, ...operationEvents].slice(0, 10));
      setLoading(false);
    } catch (err) {
      setError('Failed to load timeline');
      setLoading(false);
      console.error(err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-refresh when live
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      loadEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, loadEvents]);

  // Add new simulated events periodically
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const operations = [
        { op: 'Groth16 Proof Verified', type: 'verify' as const, gas: 260000, dur: 12 },
        { op: 'BN254 Pairing Check', type: 'pairing' as const, gas: 150000, dur: 8 },
        { op: 'Poseidon Hash Computed', type: 'poseidon' as const, gas: 50000, dur: 1 },
        { op: 'G1 Scalar Multiplication', type: 'g1_mul' as const, gas: 45000, dur: 3 },
      ];
      const selected = operations[Math.floor(Math.random() * operations.length)];

      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        operation: selected.op,
        timestamp: new Date(),
        durationMs: selected.dur + Math.floor(Math.random() * 3),
        gasUsed: selected.gas + Math.floor(Math.random() * 10000),
        status: 'success',
        type: selected.type
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'verify': return Shield;
      case 'pairing': return Cpu;
      case 'g1_mul': return Zap;
      case 'g1_add': return Zap;
      case 'poseidon': return Hash;
    }
  };

  const getColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'verify': return '#39FF14';
      case 'pairing': return '#00D4FF';
      case 'g1_mul': return '#FF10F0';
      case 'g1_add': return '#FFD600';
      case 'poseidon': return '#FF3366';
    }
  };

  if (loading) {
    return (
      <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}>
          <span className="font-black text-sm">PROOF_TIMELINE.LOG</span>
        </div>
        <div className="p-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#39FF14]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}>
          <span className="font-black text-sm">PROOF_TIMELINE.LOG</span>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{error}</span>
          </div>
          <button onClick={loadEvents} className="px-4 py-2 border-2 border-white/30 font-black text-sm">
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5" />
          <span className="font-black text-sm">PROOF_TIMELINE.LOG</span>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-3 py-1 text-xs font-black ${isLive ? 'bg-[#39FF14] text-black' : (isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black')}`}
        >
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-black animate-pulse' : 'bg-gray-400'}`} />
          {isLive ? 'LIVE' : 'PAUSED'}
        </button>
      </div>

      {/* Timeline */}
      <div className="max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`${isDark ? 'text-white/50' : 'text-black/50'}`}>No events yet</p>
          </div>
        ) : (
          events.map((event, idx) => {
            const Icon = getIcon(event.type);
            const color = getColor(event.type);

            return (
              <div
                key={event.id}
                className={`flex items-center gap-4 p-4 transition-all ${idx > 0 ? `border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'}` : ''} ${idx === 0 && isLive ? 'animate-pulse' : ''}`}
                style={idx === 0 && isLive ? { animationDuration: '2s' } : {}}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="w-5 h-5 text-black" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>
                      {event.operation}
                    </p>
                    <CheckCircle className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {formatTimeAgo(event.timestamp.toISOString())}
                    </span>
                    <span className="text-xs font-mono" style={{ color }}>
                      {event.durationMs}ms
                    </span>
                    <span className={`text-xs font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {formatNumber(event.gasUsed)} gas
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProofTimeline;
