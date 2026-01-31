"use client";

import { Terminal, Wallet, Cpu, Code } from "lucide-react";

type TabId = "playground" | "wallet" | "explorer" | "reference";

interface PlaygroundTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDark: boolean;
}

const tabs: { id: TabId; label: string; shortLabel: string; icon: typeof Terminal; color: string }[] = [
  { id: "playground", label: "PLAYGROUND", shortLabel: "CODE", icon: Terminal, color: "#0066FF" },
  { id: "wallet", label: "LIVE WALLET", shortLabel: "WALLET", icon: Wallet, color: "#00D4FF" },
  { id: "explorer", label: "EXPLORER", shortLabel: "EXPLORE", icon: Cpu, color: "#0066FF" },
  { id: "reference", label: "API REFERENCE", shortLabel: "API", icon: Code, color: "#00D4FF" },
];

export default function PlaygroundTabs({
  activeTab,
  onTabChange,
  isDark,
}: PlaygroundTabsProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <div key={tab.id} className="relative flex-shrink-0">
            {/* Offset shadow - only on active tab */}
            {isActive && (
              <div
                className="absolute inset-0 translate-x-1 translate-y-1"
                style={{ backgroundColor: tab.color }}
              />
            )}
            <button
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 border-2 sm:border-4 font-black text-[10px] sm:text-xs uppercase transition-all ${
                isActive
                  ? isDark
                    ? "bg-white text-black border-white"
                    : "bg-black text-white border-black"
                  : `bg-transparent ${
                      isDark
                        ? "text-white/60 border-white/20 hover:border-white/60 hover:text-white"
                        : "text-black/60 border-black/20 hover:border-black/60 hover:text-black"
                    }`
              }`}
              style={
                isActive
                  ? { boxShadow: `0 0 20px ${tab.color}40` }
                  : undefined
              }
            >
              <Icon
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                style={{ color: tab.color }}
              />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
