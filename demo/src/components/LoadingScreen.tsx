"use client";

import { Shield } from "lucide-react";
import { Logo } from "@/components/Logo";

interface LoadingScreenProps {
  message?: string;
  network?: "testnet" | "mainnet";
}

export default function LoadingScreen({
  message = "LOADING",
  network = "testnet",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Static grid background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 102, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 102, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Corner frames - Simple style */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-4 left-4 w-20 h-1 bg-[#0066FF]" />
        <div className="absolute top-4 left-4 w-1 h-20 bg-[#0066FF]" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-4 right-4 w-20 h-1 bg-[#00D4FF]" />
        <div className="absolute top-4 right-4 w-1 h-20 bg-[#00D4FF]" />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32">
        <div className="absolute bottom-4 left-4 w-20 h-1 bg-[#00D4FF]" />
        <div className="absolute bottom-4 left-4 w-1 h-20 bg-[#00D4FF]" />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32">
        <div className="absolute bottom-4 right-4 w-20 h-1 bg-[#0066FF]" />
        <div className="absolute bottom-4 right-4 w-1 h-20 bg-[#0066FF]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container */}
        <div className="relative mb-8">
          {/* Outer glowing frame */}
          <div
            className="absolute -inset-4 border-4 border-[#0066FF]"
            style={{ boxShadow: "0 0 30px rgba(0, 102, 255, 0.3)" }}
          />

          {/* Main icon box */}
          <div className="w-24 h-24 bg-[#0A0A0A] border-4 border-white flex items-center justify-center relative animate-pulse">
            <Logo size="xl" showText={false} />

            {/* Corner accents inside */}
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-[#0066FF]" />
            <div className="absolute top-1 left-1 w-0.5 h-3 bg-[#0066FF]" />
            <div className="absolute top-1 right-1 w-3 h-0.5 bg-[#00D4FF]" />
            <div className="absolute top-1 right-1 w-0.5 h-3 bg-[#00D4FF]" />
            <div className="absolute bottom-1 left-1 w-3 h-0.5 bg-[#00D4FF]" />
            <div className="absolute bottom-1 left-1 w-0.5 h-3 bg-[#00D4FF]" />
            <div className="absolute bottom-1 right-1 w-3 h-0.5 bg-[#0066FF]" />
            <div className="absolute bottom-1 right-1 w-0.5 h-3 bg-[#0066FF]" />
          </div>

          {/* Floating corner squares */}
          <div
            className="absolute -top-3 -left-3 w-3 h-3 bg-[#0066FF] animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="absolute -top-3 -right-3 w-3 h-3 bg-[#00D4FF] animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="absolute -bottom-3 -left-3 w-3 h-3 bg-[#00D4FF] animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
          <div
            className="absolute -bottom-3 -right-3 w-3 h-3 bg-[#0066FF] animate-bounce"
            style={{ animationDelay: "450ms" }}
          />
        </div>

        {/* Brand */}
        <h1 className="text-3xl font-black tracking-tighter mb-6">
          <span className="text-white">STELLA</span>
          <span className="text-[#0066FF]">RAY</span>
        </h1>

        {/* Loading bar */}
        <div className="w-64 mb-4">
          <div className="h-2 bg-white/10 border-2 border-white/30 relative overflow-hidden">
            <div className="h-full bg-[#0066FF] absolute animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-2 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 animate-pulse"
              style={{
                backgroundColor: ["#0066FF", "#00D4FF", "#0066FF", "#00D4FF", "#0066FF"][i],
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <p className="mt-4 font-black text-white/40 text-xs tracking-[0.3em] uppercase">
          {message}
        </p>

        {/* Status badges */}
        <div className="flex gap-3 mt-6">
          <div
            className={`flex items-center gap-2 px-3 py-1 border ${
              network === "mainnet"
                ? "border-green-500/30 bg-green-500/5"
                : "border-[#0066FF]/30 bg-[#0066FF]/5"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 animate-pulse ${
                network === "mainnet" ? "bg-green-500" : "bg-[#0066FF]"
              }`}
            />
            <span
              className={`text-[10px] font-black ${
                network === "mainnet" ? "text-green-500/70" : "text-[#0066FF]/70"
              }`}
            >
              {network.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border border-[#00D4FF]/30 bg-[#00D4FF]/5">
            <Shield className="w-3 h-3 text-[#00D4FF]/70" />
            <span className="text-[10px] font-black text-[#00D4FF]/70">ZKLOGIN</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline button loader component
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
          className="absolute inset-0 border-2 animate-spin"
          style={{ borderColor: colorStyle }}
        />
        <div
          className="absolute inset-1 animate-pulse"
          style={{ backgroundColor: colorStyle }}
        />
      </div>
      <span className="font-black tracking-wider">{text}</span>
      {/* Animated squares */}
      <div className="flex gap-1">
        {[0, 80, 160].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5 animate-bounce"
            style={{
              backgroundColor: colorStyle,
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Small inline spinner
export function Spinner({
  size = 24,
  color = "#0066FF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 border-2 animate-spin"
        style={{
          borderColor: `${color}33`,
          borderTopColor: color,
        }}
      />
    </div>
  );
}
