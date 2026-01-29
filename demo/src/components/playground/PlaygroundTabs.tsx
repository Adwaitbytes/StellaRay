"use client";

import { Terminal, Wallet, Cpu, Code } from "lucide-react";

type TabId = "playground" | "wallet" | "explorer" | "reference";

interface PlaygroundTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDark: boolean;
}

const tabs: { id: TabId; label: string; icon: typeof Terminal; color: string }[] = [
  { id: "playground", label: "PLAYGROUND", icon: Terminal, color: "#0066FF" },
  { id: "wallet", label: "LIVE WALLET", icon: Wallet, color: "#39FF14" },
  { id: "explorer", label: "EXPLORER", icon: Cpu, color: "#FF3366" },
  { id: "reference", label: "API REFERENCE", icon: Code, color: "#00D4FF" },
];

export default function PlaygroundTabs({
  activeTab,
  onTabChange,
  isDark,
}: PlaygroundTabsProps) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-4 font-black text-xs uppercase transition-all ${
              isActive
                ? "text-black"
                : `bg-transparent text-white/60 ${
                    isDark
                      ? "border-white/20 hover:border-white/40"
                      : "border-black/20 hover:border-black/40"
                  }`
            }`}
            style={
              isActive
                ? {
                    backgroundColor: tab.color,
                    borderColor: tab.color,
                  }
                : undefined
            }
          >
            <Icon
              className="w-4 h-4"
              style={isActive ? undefined : { color: tab.color }}
            />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
