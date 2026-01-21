"use client";

import { Shield, Zap, CheckCircle } from "lucide-react";

interface TransactionXRayBadgeProps {
  isDark?: boolean;
  verified?: boolean;
  proofType?: "groth16" | "plonk";
  curve?: "bn254" | "bls12381";
  compact?: boolean;
}

export function TransactionXRayBadge({
  isDark = true,
  verified = true,
  proofType = "groth16",
  curve = "bn254",
  compact = false,
}: TransactionXRayBadgeProps) {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 ${verified ? 'bg-[#39FF14]/10 border border-[#39FF14]/30' : 'bg-gray-500/10 border border-gray-500/30'}`}>
        {verified ? (
          <CheckCircle className="w-3 h-3 text-[#39FF14]" />
        ) : (
          <Shield className="w-3 h-3 text-gray-500" />
        )}
        <span className={`text-[10px] font-black ${verified ? 'text-[#39FF14]' : 'text-gray-500'}`}>
          X-RAY
        </span>
      </div>
    );
  }

  return (
    <div className={`border-2 ${verified ? 'border-[#39FF14]/30' : 'border-gray-500/30'} ${isDark ? 'bg-black/30' : 'bg-white/30'}`}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {verified ? (
              <div className="w-6 h-6 bg-[#39FF14] flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-black" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-gray-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
            <span className={`text-xs font-black ${verified ? 'text-[#39FF14]' : 'text-gray-500'}`}>
              {verified ? 'VERIFIED VIA X-RAY' : 'UNVERIFIED'}
            </span>
          </div>
          <Zap className={`w-4 h-4 ${verified ? 'text-[#39FF14]' : 'text-gray-500'}`} />
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 text-[10px] font-black ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'}`}>
            {proofType.toUpperCase()}
          </div>
          <div className={`px-2 py-0.5 text-[10px] font-black ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'}`}>
            {curve.toUpperCase()}
          </div>
          <div className={`px-2 py-0.5 text-[10px] font-black bg-[#00D4FF]/20 text-[#00D4FF]`}>
            PROTOCOL 25
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionXRayBadge;
