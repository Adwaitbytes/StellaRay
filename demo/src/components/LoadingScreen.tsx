"use client";

import { useEffect, useState } from "react";
import { Wallet, Zap, Shield, Lock } from "lucide-react";

interface LoadingScreenProps {
  variant?: "default" | "wallet" | "transaction" | "auth";
  message?: string;
  showProgress?: boolean;
}

export default function LoadingScreen({
  variant = "default",
  message = "LOADING",
  showProgress = false,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [glitchText, setGlitchText] = useState(message);

  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + Math.random() * 15));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showProgress]);

  // Glitch effect for text
  useEffect(() => {
    const glitchChars = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (frame % 10 < 2) {
        // Glitch frames
        const glitched = message
          .split("")
          .map((char, i) =>
            Math.random() > 0.7
              ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
              : char
          )
          .join("");
        setGlitchText(glitched);
      } else {
        setGlitchText(message);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(57, 255, 20, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(57, 255, 20, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />
      </div>

      {/* Corner frames - Brutalist style */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-4 left-4 w-20 h-1 bg-[#FF3366]" />
        <div className="absolute top-4 left-4 w-1 h-20 bg-[#FF3366]" />
        <div className="absolute top-8 left-8 w-12 h-0.5 bg-[#FF3366]/50" />
        <div className="absolute top-8 left-8 w-0.5 h-12 bg-[#FF3366]/50" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-4 right-4 w-20 h-1 bg-[#00D4FF]" />
        <div className="absolute top-4 right-4 w-1 h-20 bg-[#00D4FF]" />
        <div className="absolute top-8 right-8 w-12 h-0.5 bg-[#00D4FF]/50" />
        <div className="absolute top-8 right-8 w-0.5 h-12 bg-[#00D4FF]/50" />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32">
        <div className="absolute bottom-4 left-4 w-20 h-1 bg-[#FFD600]" />
        <div className="absolute bottom-4 left-4 w-1 h-20 bg-[#FFD600]" />
        <div className="absolute bottom-8 left-8 w-12 h-0.5 bg-[#FFD600]/50" />
        <div className="absolute bottom-8 left-8 w-0.5 h-12 bg-[#FFD600]/50" />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32">
        <div className="absolute bottom-4 right-4 w-20 h-1 bg-[#39FF14]" />
        <div className="absolute bottom-4 right-4 w-1 h-20 bg-[#39FF14]" />
        <div className="absolute bottom-8 right-8 w-12 h-0.5 bg-[#39FF14]/50" />
        <div className="absolute bottom-8 right-8 w-0.5 h-12 bg-[#39FF14]/50" />
      </div>

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container - Brutalist box */}
        <div className="relative mb-8">
          {/* Outer frame with glow */}
          <div
            className="absolute -inset-4 border-4 border-[#39FF14]"
            style={{
              boxShadow: "0 0 30px rgba(57, 255, 20, 0.3)",
              animation: "borderPulse 2s ease-in-out infinite",
            }}
          />

          {/* Middle rotating frame */}
          <div
            className="absolute -inset-2 border-2 border-[#FF3366]/50"
            style={{
              animation: "spin 8s linear infinite",
            }}
          />

          {/* Main icon box */}
          <div className="w-24 h-24 bg-[#0A0A0A] border-4 border-white flex items-center justify-center relative">
            <Wallet
              className="w-12 h-12 text-[#39FF14]"
              style={{
                filter: "drop-shadow(0 0 10px rgba(57, 255, 20, 0.5))",
                animation: "iconPulse 1.5s ease-in-out infinite",
              }}
            />

            {/* Corner accents inside */}
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-[#FF3366]" />
            <div className="absolute top-1 left-1 w-0.5 h-3 bg-[#FF3366]" />
            <div className="absolute top-1 right-1 w-3 h-0.5 bg-[#00D4FF]" />
            <div className="absolute top-1 right-1 w-0.5 h-3 bg-[#00D4FF]" />
            <div className="absolute bottom-1 left-1 w-3 h-0.5 bg-[#FFD600]" />
            <div className="absolute bottom-1 left-1 w-0.5 h-3 bg-[#FFD600]" />
            <div className="absolute bottom-1 right-1 w-3 h-0.5 bg-[#39FF14]" />
            <div className="absolute bottom-1 right-1 w-0.5 h-3 bg-[#39FF14]" />
          </div>

          {/* Floating corner squares */}
          <div
            className="absolute -top-3 -left-3 w-3 h-3 bg-[#FF3366]"
            style={{ animation: "bounce 1s ease-in-out infinite" }}
          />
          <div
            className="absolute -top-3 -right-3 w-3 h-3 bg-[#00D4FF]"
            style={{ animation: "bounce 1s ease-in-out infinite 0.15s" }}
          />
          <div
            className="absolute -bottom-3 -left-3 w-3 h-3 bg-[#FFD600]"
            style={{ animation: "bounce 1s ease-in-out infinite 0.3s" }}
          />
          <div
            className="absolute -bottom-3 -right-3 w-3 h-3 bg-[#39FF14]"
            style={{ animation: "bounce 1s ease-in-out infinite 0.45s" }}
          />
        </div>

        {/* Brand text - Stacked brutalist */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-tighter">
            <span className="text-white">STELLAR</span>
            <span className="text-[#FF3366]">GATEWAY</span>
          </h1>
        </div>

        {/* Loading bar - Brutalist style */}
        <div className="w-64 mb-4">
          <div className="h-2 bg-white/10 border-2 border-white/30 relative overflow-hidden">
            <div
              className="h-full bg-[#39FF14] absolute left-0 top-0"
              style={{
                width: showProgress ? `${Math.min(progress, 100)}%` : "100%",
                animation: showProgress ? "none" : "loadingBar 1.5s ease-in-out infinite",
              }}
            />
            {/* Scan effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ animation: "scan 1s linear infinite" }}
            />
          </div>
        </div>

        {/* Loading text with glitch */}
        <div className="flex items-center gap-3">
          <span
            className="text-white font-black text-sm tracking-[0.3em] font-mono"
            style={{
              textShadow: "2px 0 #FF3366, -2px 0 #00D4FF",
            }}
          >
            {glitchText}
          </span>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2"
              style={{
                backgroundColor: ["#39FF14", "#FF3366", "#00D4FF", "#FFD600", "#39FF14"][i],
                animation: `dotPulse 1s ease-in-out infinite ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Status badges */}
        <div className="flex gap-3 mt-8">
          <div className="flex items-center gap-2 px-3 py-1 border border-[#39FF14]/30 bg-[#39FF14]/5">
            <div className="w-1.5 h-1.5 bg-[#39FF14] animate-pulse" />
            <span className="text-[10px] font-black text-[#39FF14]/70">TESTNET</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border border-[#00D4FF]/30 bg-[#00D4FF]/5">
            <Shield className="w-3 h-3 text-[#00D4FF]/70" />
            <span className="text-[10px] font-black text-[#00D4FF]/70">ZKLOGIN</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border border-[#FF3366]/30 bg-[#FF3366]/5">
            <Zap className="w-3 h-3 text-[#FF3366]/70" />
            <span className="text-[10px] font-black text-[#FF3366]/70">X-RAY</span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        @keyframes borderPulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(57, 255, 20, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(57, 255, 20, 0.5);
          }
        }
        @keyframes iconPulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(57, 255, 20, 0.5));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 20px rgba(57, 255, 20, 0.8));
          }
        }
        @keyframes loadingBar {
          0% {
            width: 0%;
            left: 0;
          }
          50% {
            width: 100%;
            left: 0;
          }
          51% {
            width: 100%;
            left: 0;
          }
          100% {
            width: 0%;
            left: 100%;
          }
        }
        @keyframes scan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes dotPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}

// Inline button loader component - Brutalist style
export function ButtonLoader({
  color = "current",
  text = "LOADING",
}: {
  color?: string;
  text?: string;
}) {
  const colorStyle = color === "current" ? "currentColor" : color;

  return (
    <div className="flex items-center gap-3">
      {/* Spinning square */}
      <div className="relative w-5 h-5">
        <div
          className="absolute inset-0 border-2"
          style={{
            borderColor: colorStyle,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div
          className="absolute inset-1"
          style={{
            backgroundColor: colorStyle,
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
      </div>
      <span className="font-black tracking-wider">{text}</span>
      {/* Animated squares */}
      <div className="flex gap-1">
        {[0, 80, 160].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5"
            style={{
              backgroundColor: colorStyle,
              animation: `bounce 0.6s ease-in-out infinite ${delay}ms`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}

// Small inline spinner - Brutalist square
export function Spinner({
  size = 24,
  color = "#39FF14",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 border-2"
        style={{
          borderColor: `${color}33`,
          borderTopColor: color,
          animation: "spin 0.6s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
