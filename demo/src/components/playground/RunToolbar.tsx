"use client";

import { useState, useCallback } from "react";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface RunToolbarProps {
  onRun: () => void;
  onReset: () => void;
  onCopy: () => void;
  onShare: () => void;
  isRunning: boolean;
  isDark: boolean;
}

export default function RunToolbar({
  onRun,
  onReset,
  onCopy,
  onShare,
  isRunning,
  isDark,
}: RunToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  const borderColor = isDark ? "border-white" : "border-black";
  const textColor = isDark ? "text-white" : "text-black";
  const hoverBg = isDark ? "hover:bg-white/10" : "hover:bg-black/10";
  const shadowColor = isDark ? "#fff" : "#000";

  const baseBtnClasses =
    "flex items-center gap-2 px-4 py-2 border-4 font-black text-xs uppercase transition-all";
  const interactiveBtnClasses =
    "hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1";

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 border-t-4 ${borderColor} ${
        isDark ? "bg-[#0A0A0A]" : "bg-white"
      }`}
    >
      {/* Run Button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={`${baseBtnClasses} ${
          isRunning
            ? "bg-[#0066FF]/60 border-[#0066FF]/60 text-white/60 cursor-not-allowed"
            : `bg-[#0066FF] border-[#0066FF] text-white ${interactiveBtnClasses}`
        }`}
        style={
          !isRunning
            ? { boxShadow: `4px 4px 0px ${shadowColor}` }
            : undefined
        }
      >
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        {isRunning ? "RUNNING..." : "RUN"}
        {!isRunning && (
          <span
            className={`ml-1 text-[10px] font-mono opacity-50 ${
              isDark ? "text-white" : "text-white"
            }`}
          >
            CTRL+ENTER
          </span>
        )}
      </button>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className={`${baseBtnClasses} ${interactiveBtnClasses} ${borderColor} ${textColor} ${hoverBg}`}
        style={{ boxShadow: `4px 4px 0px ${shadowColor}` }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        RESET
      </button>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className={`${baseBtnClasses} ${interactiveBtnClasses} ${borderColor} ${textColor} ${hoverBg}`}
        style={{ boxShadow: `4px 4px 0px ${shadowColor}` }}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#00D4FF]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {copied ? "COPIED" : "COPY"}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Share Button */}
      <button
        onClick={onShare}
        className={`${baseBtnClasses} ${interactiveBtnClasses} ${borderColor} ${textColor} ${hoverBg}`}
        style={{ boxShadow: `4px 4px 0px ${shadowColor}` }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        SHARE
      </button>
    </div>
  );
}
