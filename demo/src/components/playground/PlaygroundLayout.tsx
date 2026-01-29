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
      className={`min-h-screen flex ${
        isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-black"
      }`}
    >
      <PlaygroundSidebar
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        network={network}
        onNetworkChange={onNetworkChange}
        isConnected={isConnected}
      />
      <main className="flex-1 min-h-screen overflow-auto lg:ml-0">
        {children}
      </main>
    </div>
  );
}
