"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  variant?: "default" | "glitch" | "pulse" | "matrix" | "blockchain";
  message?: string;
  showProgress?: boolean;
}

export default function LoadingScreen({
  variant = "default",
  message = "LOADING",
  showProgress = false,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + Math.random() * 15));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showProgress]);

  const renderLoader = () => {
    switch (variant) {
      case "glitch":
        return (
          <div className="relative">
            <div className="loader-glitch" />
          </div>
        );

      case "pulse":
        return (
          <div className="loader-pulse">
            <div />
            <div />
            <div />
          </div>
        );

      case "matrix":
        return (
          <div className="loader-matrix">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} />
            ))}
          </div>
        );

      case "blockchain":
        return (
          <div className="loader-blockchain">
            <div />
            <div />
            <div />
          </div>
        );

      default:
        return (
          <div className="relative">
            {/* Outer rotating square */}
            <div
              className="absolute inset-0 w-24 h-24 border-4 border-[#39FF14]"
              style={{
                animation: "spin 3s linear infinite",
              }}
            />

            {/* Middle pulsing square */}
            <div
              className="absolute inset-2 w-20 h-20 border-4 border-[#FF3366]"
              style={{
                animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                opacity: 0.3,
              }}
            />

            {/* Inner logo */}
            <div className="w-24 h-24 flex items-center justify-center">
              <div
                className="w-16 h-16 bg-white flex items-center justify-center"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              >
                <span className="text-3xl font-black text-black">S</span>
              </div>
            </div>

            {/* Corner accents */}
            {[
              { pos: "-top-2 -left-2", color: "#00D4FF", delay: "0ms" },
              { pos: "-top-2 -right-2", color: "#FF3366", delay: "150ms" },
              { pos: "-bottom-2 -left-2", color: "#FFD600", delay: "300ms" },
              { pos: "-bottom-2 -right-2", color: "#39FF14", delay: "450ms" },
            ].map((corner, i) => (
              <div
                key={i}
                className={`absolute ${corner.pos} w-4 h-4`}
                style={{
                  backgroundColor: corner.color,
                  animation: `bounce 1s ease-in-out infinite`,
                  animationDelay: corner.delay,
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-8">
        {renderLoader()}

        {/* Loading text with dots */}
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl tracking-wider">
            {message}
          </span>
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-[#39FF14]"
              style={{ animation: "bounce 1s ease-in-out infinite" }}
            />
            <div
              className="w-2 h-2 bg-[#FF3366]"
              style={{
                animation: "bounce 1s ease-in-out infinite",
                animationDelay: "150ms",
              }}
            />
            <div
              className="w-2 h-2 bg-[#00D4FF]"
              style={{
                animation: "bounce 1s ease-in-out infinite",
                animationDelay: "300ms",
              }}
            />
          </div>
        </div>

        {/* Optional progress bar */}
        {showProgress && (
          <div className="w-64 h-2 bg-white/10 border-2 border-white/20">
            <div
              className="h-full bg-[#39FF14] transition-all duration-200"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
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
      <div className="relative w-6 h-6">
        <div
          className="absolute inset-0 border-2 animate-spin"
          style={{ borderColor: colorStyle }}
        />
        <div
          className="absolute inset-1 animate-pulse"
          style={{ backgroundColor: colorStyle }}
        />
      </div>
      <span>{text}</span>
      <div className="flex gap-0.5">
        {[0, 100, 200].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5"
            style={{
              backgroundColor: colorStyle,
              animation: "bounce 1s ease-in-out infinite",
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
  color = "#39FF14",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 border-2 animate-spin"
        style={{ borderColor: `${color}33`, borderTopColor: color }}
      />
    </div>
  );
}
