"use client";

import { useState, useEffect } from "react";
import { Globe, ChevronDown, AlertTriangle, Check } from "lucide-react";
import {
  NetworkType,
  getCurrentNetwork,
  setCurrentNetwork,
  getNetworkConfig,
  NETWORKS,
} from "@/lib/stellar";

interface NetworkSwitcherProps {
  onNetworkChange?: (network: NetworkType) => void;
  compact?: boolean;
  isDark?: boolean;
}

export function NetworkSwitcher({ onNetworkChange, compact = false, isDark = true }: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNet, setCurrentNet] = useState<NetworkType>("testnet");

  useEffect(() => {
    setCurrentNet(getCurrentNetwork());
  }, []);

  const handleNetworkChange = (network: NetworkType) => {
    if (network === "mainnet") {
      // Show confirmation for mainnet
      const confirmed = window.confirm(
        "⚠️ MAINNET WARNING ⚠️\n\nYou are switching to MAINNET.\n\n• Transactions use REAL XLM\n• Transactions CANNOT be reversed\n• Make sure you understand the risks\n\nAre you sure you want to continue?"
      );
      if (!confirmed) return;
    }

    setCurrentNetwork(network);
    setCurrentNet(network);
    setIsOpen(false);
    onNetworkChange?.(network);

    // Reload the page to apply network changes
    window.location.reload();
  };

  const config = getNetworkConfig(currentNet);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${
            currentNet === "mainnet"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          }`}
        >
          <Globe className="w-3 h-3" />
          {config.name.toUpperCase()}
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className={`absolute right-0 top-full mt-2 z-50 min-w-[180px] border-2 ${isDark ? "bg-[#0A0A0A] border-white/20" : "bg-white border-black/20"}`}>
              {(Object.keys(NETWORKS) as NetworkType[]).map((net) => {
                const netConfig = NETWORKS[net];
                const isSelected = net === currentNet;

                return (
                  <button
                    key={net}
                    onClick={() => handleNetworkChange(net)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                    } ${isSelected ? (isDark ? "bg-white/10" : "bg-black/10") : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          net === "mainnet" ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      />
                      <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>
                        {netConfig.name}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#00FF88]" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

      </div>
    );
  }

  return (
    <div className={`border-2 ${isDark ? "border-white/20 bg-black/30" : "border-black/20 bg-white/50"} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>NETWORK</h3>
        <Globe className={`w-4 h-4 ${isDark ? "text-white/40" : "text-black/40"}`} />
      </div>

      <div className="space-y-2">
        {(Object.keys(NETWORKS) as NetworkType[]).map((net) => {
          const netConfig = NETWORKS[net];
          const isSelected = net === currentNet;

          return (
            <button
              key={net}
              onClick={() => handleNetworkChange(net)}
              className={`w-full flex items-center justify-between p-3 border-2 transition-all cursor-pointer ${
                isSelected
                  ? net === "mainnet"
                    ? "border-green-500 bg-green-500/10"
                    : "border-yellow-500 bg-yellow-500/10"
                  : isDark
                  ? "border-white/20 hover:border-white/40"
                  : "border-black/20 hover:border-black/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    net === "mainnet" ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <div className="text-left">
                  <p className={`font-bold ${isDark ? "text-white" : "text-black"}`}>
                    {netConfig.name}
                  </p>
                  <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                    {net === "mainnet" ? "Real assets" : "Test assets"}
                  </p>
                </div>
              </div>
              {isSelected && <Check className="w-5 h-5 text-[#00FF88]" />}
            </button>
          );
        })}
      </div>

      {currentNet === "mainnet" && (
        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>You are on mainnet. Transactions use real XLM.</span>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple badge component for inline use
export function NetworkBadge({ isDark = true }: { isDark?: boolean }) {
  const [network, setNetwork] = useState<NetworkType>("testnet");

  useEffect(() => {
    setNetwork(getCurrentNetwork());
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold ${
        network === "mainnet"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          network === "mainnet" ? "bg-green-500" : "bg-yellow-500"
        }`}
      />
      {network.toUpperCase()}
    </span>
  );
}
