"use client";

import PlaygroundSidebar from "./PlaygroundSidebar";

interface PlaygroundLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
  network: "testnet" | "mainnet";
  onNetworkChange: (n: "testnet" | "mainnet") => void;
  isConnected: boolean;
  children: React.ReactNode;
}

export default function PlaygroundLayout({
  isDark,
  onToggleTheme,
  network,
  onNetworkChange,
  isConnected,
  children,
}: PlaygroundLayoutProps) {
  return (
    <div
      className={`min-h-screen flex relative ${
        isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-black"
      }`}
      style={{
        backgroundImage: isDark
          ? "linear-gradient(rgba(0,102,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,255,0.03) 1px, transparent 1px)"
          : "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0066FF]/5 via-transparent to-[#00D4FF]/5 pointer-events-none z-0" />

      {/* Corner frame decorations */}
      <div className="fixed top-0 left-0 w-20 h-20 border-l-4 border-t-4 border-[#0066FF]/20 pointer-events-none z-0 hidden lg:block" />
      <div className="fixed top-0 right-0 w-20 h-20 border-r-4 border-t-4 border-[#00D4FF]/20 pointer-events-none z-0 hidden lg:block" />
      <div className="fixed bottom-0 left-0 w-20 h-20 border-l-4 border-b-4 border-[#00D4FF]/20 pointer-events-none z-0 hidden lg:block" />
      <div className="fixed bottom-0 right-0 w-20 h-20 border-r-4 border-b-4 border-[#0066FF]/20 pointer-events-none z-0 hidden lg:block" />

      <PlaygroundSidebar
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        network={network}
        onNetworkChange={onNetworkChange}
        isConnected={isConnected}
      />
      <main className="flex-1 min-h-screen overflow-auto lg:ml-0 relative z-10">
        {children}
      </main>
    </div>
  );
}
