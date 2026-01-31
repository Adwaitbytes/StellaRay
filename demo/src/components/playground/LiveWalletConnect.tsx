"use client";

import { Wallet, Shield, Zap, Clock, ArrowRight } from "lucide-react";

interface LiveWalletConnectProps {
  onConnect: () => void;
  isConnecting: boolean;
  isDark: boolean;
}

const features = [
  { icon: Shield, label: "Zero Knowledge", color: "#00D4FF" },
  { icon: Zap, label: "Protocol 25", color: "#0066FF" },
  { icon: Clock, label: "3 Second Login", color: "#00D4FF" },
] as const;

export default function LiveWalletConnect({
  onConnect,
  isConnecting,
  isDark,
}: LiveWalletConnectProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-6">
      <div
        className={`w-full max-w-md p-8 border-4 ${
          isDark ? "border-white bg-[#0A0A0A]" : "border-black bg-white"
        }`}
      >
        {/* Window dots */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-3 h-3 bg-[#FF3366]" />
          <div className="w-3 h-3 bg-[#FFD600]" />
          <div className="w-3 h-3 bg-[#00D4FF]" />
        </div>

        {/* Wallet icon */}
        <div className="flex justify-center mb-6">
          <div className="border-4 border-[#0066FF] p-5">
            <Wallet
              className="w-16 h-16"
              style={{ color: "#0066FF" }}
            />
          </div>
        </div>

        {/* Heading */}
        <h2
          className={`font-black text-2xl uppercase text-center mb-3 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          CONNECT YOUR WALLET
        </h2>

        {/* Subtitle */}
        <p
          className={`text-center text-sm mb-8 ${
            isDark ? "text-white/60" : "text-black/60"
          }`}
        >
          Experience zkLogin authentication. No seed phrases. No extensions.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.label}
                className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-black uppercase ${
                  isDark
                    ? "border-white/30 text-white/80"
                    : "border-black/30 text-black/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: feat.color }} />
                <span>{feat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Connect button */}
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0066FF] text-white border-4 border-[#0066FF] font-black text-sm uppercase transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>CONNECTING...</span>
            </>
          ) : (
            <>
              <span>SIGN IN WITH GOOGLE</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Footer text */}
        <p
          className={`text-center text-xs font-mono mt-6 ${
            isDark ? "text-white/40" : "text-black/40"
          }`}
        >
          Powered by Groth16 on BN254
        </p>
      </div>
    </div>
  );
}
