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
  Zap,
} from "lucide-react";
import Link from "next/link";

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
      <div className="px-5 py-5 border-b-4 border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0066FF] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div>
            <div className="font-black text-sm tracking-wider">STELLARAY</div>
            <div className="text-[10px] text-white/40 font-mono tracking-widest">
              SDK PLAYGROUND
            </div>
          </div>
        </div>
      </div>

      {/* Network Selector */}
      <div className="px-5 py-4 border-b-4 border-white/10">
        <div className="text-[10px] font-black text-white/40 tracking-widest mb-2">
          NETWORK
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNetworkChange("testnet")}
            className={`flex-1 px-3 py-2 border-4 text-xs font-black transition-all ${
              network === "testnet"
                ? "border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]"
                : "border-white/20 text-white/40 hover:border-white/40"
            }`}
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
          >
            MAINNET
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="px-5 py-4 border-b-4 border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-[#39FF14] animate-pulse" : "bg-white/30"
              }`}
            />
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
      <div className="px-5 py-4 border-b-4 border-white/10">
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
      <div className="px-5 py-4 border-b-4 border-white/10 flex-1">
        <div className="text-[10px] font-black text-white/40 tracking-widest mb-3">
          NAVIGATION
        </div>
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home className="w-4 h-4" />
            HOME
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            DASHBOARD
          </Link>
          <a
            href="https://github.com/Adwaitbytes/StellaRay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <Github className="w-4 h-4" />
            GITHUB
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
          <a
            href="https://www.npmjs.com/package/@stellar-zklogin/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-xs font-black text-white/50 hover:text-white hover:bg-white/5 transition-all"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 border-4 border-white/30 bg-[#0A0A0A]"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
        className={`fixed lg:static top-0 left-0 h-full w-[280px] bg-[#0A0A0A] border-r-4 border-white/10 z-40 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
