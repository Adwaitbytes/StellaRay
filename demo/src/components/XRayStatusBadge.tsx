"use client";

import { Zap, Radio, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchXRayStatus, type XRayStatus } from "@/lib/xray";

interface XRayStatusBadgeProps {
  isDark?: boolean;
  compact?: boolean;
}

export function XRayStatusBadge({ isDark = true, compact = false }: XRayStatusBadgeProps) {
  const [status, setStatus] = useState<XRayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchXRayStatus();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching X-Ray status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Pulse animation refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseKey(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isLive = status?.health === 'healthy' || status?.status === 'operational';
  const protocolVersion = status?.protocolVersion || 25;
  const bn254Enabled = status?.features?.bn254?.enabled ?? true;
  const poseidonEnabled = status?.features?.poseidon?.enabled ?? true;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 ${isDark ? 'border-[#39FF14]/50 bg-[#39FF14]/10' : 'border-[#00AA55]/50 bg-[#00AA55]/10'}`}>
        <Zap className="w-3 h-3 text-[#39FF14]" />
        <span className={`text-xs font-black ${isDark ? 'text-[#39FF14]' : 'text-[#00AA55]'}`}>X-RAY</span>
        {loading ? (
          <RefreshCw className="w-3 h-3 text-[#39FF14] animate-spin" />
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#39FF14] animate-pulse' : 'bg-red-500'}`} />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden border-4 ${isDark ? 'border-[#39FF14]/30 bg-black/50' : 'border-[#00AA55]/30 bg-white/50'}`}>
      {/* Animated glow effect */}
      <div
        key={pulseKey}
        className="absolute inset-0 bg-gradient-to-r from-[#39FF14]/0 via-[#39FF14]/20 to-[#39FF14]/0 animate-pulse"
        style={{ animationDuration: '2s' }}
      />

      <div className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#39FF14] flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-black'}`}>X-RAY PROTOCOL</h3>
              <p className={`text-xs font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {status?.protocolName || `Stellar Protocol ${protocolVersion}`}
              </p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            {loading ? (
              <RefreshCw className="w-4 h-4 text-[#39FF14] animate-spin" />
            ) : (
              <>
                <Radio className={`w-4 h-4 ${isLive ? 'text-[#39FF14]' : 'text-red-500'}`} />
                <span className={`text-xs font-black ${isLive ? 'text-[#39FF14]' : 'text-red-500'}`}>
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`px-3 py-2 border-2 ${bn254Enabled ? (isDark ? 'border-[#39FF14]/30' : 'border-[#00AA55]/30') : 'border-gray-500/30'}`}>
            <p className={`text-xs font-black ${bn254Enabled ? (isDark ? 'text-[#39FF14]' : 'text-[#00AA55]') : 'text-gray-500'}`}>BN254</p>
            <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {bn254Enabled ? 'Native Curve' : 'Disabled'}
            </p>
          </div>
          <div className={`px-3 py-2 border-2 ${poseidonEnabled ? (isDark ? 'border-[#00D4FF]/30' : 'border-[#0099CC]/30') : 'border-gray-500/30'}`}>
            <p className={`text-xs font-black ${poseidonEnabled ? (isDark ? 'text-[#00D4FF]' : 'text-[#0099CC]') : 'text-gray-500'}`}>POSEIDON</p>
            <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {poseidonEnabled ? 'ZK Hash' : 'Disabled'}
            </p>
          </div>
        </div>

        {/* Network info */}
        {status?.network && (
          <div className={`mt-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>Network</span>
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {status.network.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default XRayStatusBadge;
