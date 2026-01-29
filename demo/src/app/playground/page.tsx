"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PlaygroundLayout from "@/components/playground/PlaygroundLayout";
import PlaygroundTabs from "@/components/playground/PlaygroundTabs";
import CodeEditorPanel from "@/components/playground/CodeEditorPanel";
import ConsoleOutputPanel from "@/components/playground/ConsoleOutputPanel";
import LiveWalletTab from "@/components/playground/LiveWalletTab";
import ExplorerTab from "@/components/playground/ExplorerTab";
import ApiReferenceTab from "@/components/playground/ApiReferenceTab";
import { SNIPPETS } from "@/lib/playground/snippets";
import {
  getSimulation,
  type ConsoleEntry,
} from "@/lib/playground/simulationEngine";

type TabId = "playground" | "wallet" | "explorer" | "reference";

export default function PlaygroundPage() {
  // Global state
  const [activeTab, setActiveTab] = useState<TabId>("playground");
  const [isDark, setIsDark] = useState(true);
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [isConnected] = useState(false);

  // Playground state
  const [activeSnippet, setActiveSnippet] = useState("auth-connect");
  const [editorCode, setEditorCode] = useState(
    SNIPPETS.find((s) => s.id === "auth-connect")?.code || ""
  );
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([
    { type: "comment", content: "// StellaRay SDK Playground" },
    { type: "comment", content: "// Select a snippet and click RUN to execute" },
    { type: "comment", content: "// Or press Ctrl+Enter" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // API Reference search
  const searchRef = useRef<HTMLInputElement>(null);

  // Handle snippet change
  const handleSnippetChange = useCallback((id: string) => {
    setActiveSnippet(id);
    const snippet = SNIPPETS.find((s) => s.id === id);
    if (snippet) {
      setEditorCode(snippet.code);
    }
  }, []);

  // Run simulation
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setConsoleOutput([{ type: "comment", content: "// Running code..." }]);

    const steps = getSimulation(activeSnippet);

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delayMs));
      setConsoleOutput((prev) => [...prev, step.entry]);
    }

    setIsRunning(false);
  }, [isRunning, activeSnippet]);

  // Reset
  const handleReset = useCallback(() => {
    const snippet = SNIPPETS.find((s) => s.id === activeSnippet);
    if (snippet) setEditorCode(snippet.code);
    setConsoleOutput([
      { type: "comment", content: "// Console cleared" },
      { type: "comment", content: "// Ready to execute code..." },
    ]);
  }, [activeSnippet]);

  // Copy code
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editorCode);
  }, [editorCode]);

  // Share
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/playground?snippet=${activeSnippet}`;
    navigator.clipboard.writeText(url);
  }, [activeSnippet]);

  // Clear console
  const handleClearConsole = useCallback(() => {
    setConsoleOutput([
      { type: "comment", content: "// Console cleared" },
    ]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter: Run
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (activeTab === "playground") handleRun();
      }

      // Ctrl+K: Focus search
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setActiveTab("reference");
        setTimeout(() => searchRef.current?.focus(), 100);
      }

      // Ctrl+1-4: Switch tabs
      if (e.ctrlKey && e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        const tabs: TabId[] = ["playground", "wallet", "explorer", "reference"];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, handleRun]);

  // Load snippet from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const snippet = params.get("snippet");
    if (snippet) {
      const found = SNIPPETS.find((s) => s.id === snippet);
      if (found) {
        setActiveSnippet(snippet);
        setEditorCode(found.code);
      }
    }
  }, []);

  // Get current snippet language
  const currentSnippet = SNIPPETS.find((s) => s.id === activeSnippet);
  const snippetLanguage = currentSnippet?.language || "typescript";

  return (
    <PlaygroundLayout
      isDark={isDark}
      onToggleTheme={() => setIsDark(!isDark)}
      network={network}
      onNetworkChange={setNetwork}
      isConnected={isConnected}
    >
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 pt-6 pb-0 lg:pl-6 pl-16">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                SDK PLAYGROUND
              </h1>
              <p className="text-xs text-white/40 font-mono mt-1">
                INTERACTIVE DEVELOPMENT ENVIRONMENT FOR @stellar-zklogin/sdk
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <div className="px-3 py-1 border-2 border-[#39FF14]/40 text-[10px] font-mono text-[#39FF14]">
                PROTOCOL 25
              </div>
              <div className="px-3 py-1 border-2 border-[#0066FF]/40 text-[10px] font-mono text-[#0066FF]">
                X-RAY
              </div>
            </div>
          </div>

          {/* Tabs */}
          <PlaygroundTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDark={isDark}
          />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {/* TAB 1: PLAYGROUND */}
          {activeTab === "playground" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[600px]">
              <CodeEditorPanel
                code={editorCode}
                onCodeChange={setEditorCode}
                isDark={isDark}
                onRun={handleRun}
                isRunning={isRunning}
                activeSnippet={activeSnippet}
                onSnippetChange={handleSnippetChange}
                snippetLanguage={snippetLanguage}
              />
              <ConsoleOutputPanel
                output={consoleOutput}
                onClear={handleClearConsole}
                isDark={isDark}
                isRunning={isRunning}
              />
            </div>
          )}

          {/* TAB 2: LIVE WALLET */}
          {activeTab === "wallet" && (
            <LiveWalletTab isDark={isDark} />
          )}

          {/* TAB 3: EXPLORER */}
          {activeTab === "explorer" && <ExplorerTab isDark={isDark} />}

          {/* TAB 4: API REFERENCE */}
          {activeTab === "reference" && (
            <ApiReferenceTab isDark={isDark} searchRef={searchRef} />
          )}
        </div>
      </div>
    </PlaygroundLayout>
  );
}
