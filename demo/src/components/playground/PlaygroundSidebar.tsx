"use client";

import { useState } from "react";
import {
  Sun,
  Moon,
  Globe,
  Github,
  ExternalLink,
  Package,
  Home,
  LayoutDashboard,
  Keyboard,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface PlaygroundSidebarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  network: "testnet" | "mainnet";
  onNetworkChange: (n: "testnet" | "mainnet") => void;
  isConnected: boolean;
}

export default function PlaygroundSidebar({
  isDark,
  onToggleTheme,
  network,
  onNetworkChange,
  isConnected,
}: PlaygroundSidebarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b-4 border-[#0066FF]/30">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo size="md" showText={false} />
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-black text-sm tracking-wider">STELLA</span>
              <span className="font-black text-sm tracking-wider text-[#0066FF]">RAY</span>
            </div>
            <div className="text-[10px] text-white/40 font-mono tracking-widest">
              ZK WALLET · PLAYGROUND
            </div>
          </div>
        </Link>
      </div>

      {/* Network Selector */}
      <div className="px-5 py-4 border-b-4 border-white/15">
        <div className="text-[10px] font-black text-white/40 tracking-widest mb-2">
          NETWORK
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNetworkChange("testnet")}
            className={`flex-1 px-3 py-2 border-4 text-xs font-black transition-all ${
              network === "testnet"
                ? "border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]"
                : "border-white/20 text-white/40 hover:border-white/40"
            }`}
            style={network === "testnet" ? { boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)" } : undefined}
          >
            TESTNET
          </button>
          <button
            onClick={() => onNetworkChange("mainnet")}
            className={`flex-1 px-3 py-2 border-4 text-xs font-black transition-all ${
              network === "mainnet"
                ? "border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF]"
                : "border-white/20 text-white/40 hover:border-white/40"
            }`}
            style={network === "mainnet" ? { boxShadow: "0 0 15px rgba(0, 102, 255, 0.3)" } : undefined}
          >
            MAINNET
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="px-5 py-4 border-b-4 border-white/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              {isConnected && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00D4FF] animate-ping opacity-30" />
              )}
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-[#00D4FF]" : "bg-[#FF3366]/50"
                }`}
              />
            </div>
            <span className="text-[10px] font-black tracking-widest text-white/60">
              {isConnected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 border-2 border-[#0066FF]/40">
            <Package className="w-3 h-3 text-[#0066FF]" />
            <span className="text-[10px] font-mono text-[#0066FF]">v2.1.0</span>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="px-5 py-4 border-b-4 border-white/15">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 border-4 border-white/20 hover:border-white/40 transition-all"
        >
          <span className="text-xs font-black text-white/60">
            {isDark ? "DARK MODE" : "LIGHT MODE"}
          </span>
          {isDark ? (
            <Moon className="w-4 h-4 text-[#00D4FF]" />
          ) : (
            <Sun className="w-4 h-4 text-[#FFD600]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-b-4 border-white/15 flex-1">
        <div className="text-[10px] font-black text-white/40 tracking-widest mb-3">
          NAVIGATION
        </div>
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 hover:border-l-4 hover:border-[#0066FF] hover:pl-4 transition-all"
          >
            <Home className="w-4 h-4" />
            HOME
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 hover:border-l-4 hover:border-[#0066FF] hover:pl-4 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            DASHBOARD
          </Link>
          <a
            href="https://github.com/Adwaitbytes/StellaRay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 hover:border-l-4 hover:border-[#0066FF] hover:pl-4 transition-all"
          >
            <Github className="w-4 h-4" />
            GITHUB
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
          <a
            href="https://www.npmjs.com/package/@stellar-zklogin/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 hover:border-l-4 hover:border-[#0066FF] hover:pl-4 transition-all"
          >
            <Package className="w-4 h-4" />
            NPM
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="px-5 py-4">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="flex items-center gap-2 text-[10px] font-black text-white/30 hover:text-white/50 transition-colors"
        >
          <Keyboard className="w-3 h-3" />
          KEYBOARD SHORTCUTS
        </button>
        {showShortcuts && (
          <div className="mt-3 space-y-2">
            {[
              ["Ctrl+Enter", "Run code"],
              ["Ctrl+K", "Search API"],
              ["Ctrl+1-4", "Switch tabs"],
              ["Escape", "Close search"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/30">{desc}</span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono border border-white/20 text-white/40">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 sm:top-4 left-3 sm:left-4 z-50 p-1.5 sm:p-2 border-2 sm:border-4 border-white/30 bg-[#0A0A0A]"
      >
        {mobileOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-[260px] sm:w-[280px] bg-[#0A0A0A] border-r-2 sm:border-r-4 border-white/20 z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
