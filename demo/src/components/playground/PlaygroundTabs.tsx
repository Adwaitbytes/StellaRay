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
  { id: "wallet", label: "LIVE WALLET", shortLabel: "WALLET", icon: Wallet, color: "#39FF14" },
  { id: "explorer", label: "EXPLORER", shortLabel: "EXPLORE", icon: Cpu, color: "#FF3366" },
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
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 border-2 sm:border-4 font-black text-[10px] sm:text-xs uppercase transition-all flex-shrink-0 ${
              isActive
                ? "text-black"
                : `bg-transparent ${
                    isDark
                      ? "text-white/60 border-white/20 hover:border-white/40"
                      : "text-black/60 border-black/20 hover:border-black/40"
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
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              style={isActive ? undefined : { color: tab.color }}
            />
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
