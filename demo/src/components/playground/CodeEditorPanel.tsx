"use client";

import { useState, useRef, useCallback } from "react";
import SyntaxHighlighter from "./SyntaxHighlighter";
import SnippetSelector from "./SnippetSelector";
import {
  Code,
  Play,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  isDark: boolean;
  onRun: () => void;
  isRunning: boolean;
  activeSnippet: string;
  onSnippetChange: (id: string) => void;
  snippetLanguage: string;
}

export default function CodeEditorPanel({
  code,
  onCodeChange,
  isDark,
  onRun,
  isRunning,
  activeSnippet,
  onSnippetChange,
  snippetLanguage,
}: CodeEditorPanelProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLPreElement>(null);

  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const highlighter = highlighterRef.current;
    if (textarea && highlighter) {
      highlighter.scrollTop = textarea.scrollTop;
      highlighter.scrollLeft = textarea.scrollLeft;
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied
    }
  }, [code]);

  const handleReset = useCallback(() => {
    onCodeChange("");
  }, [onCodeChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onRun();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newCode = code.substring(0, start) + "  " + code.substring(end);
        onCodeChange(newCode);
        requestAnimationFrame(() => {
          target.selectionStart = start + 2;
          target.selectionEnd = start + 2;
        });
      }
    },
    [code, onCodeChange, onRun]
  );

  return (
    <div
      className={`flex flex-col h-full border-4 ${
        isDark ? "border-white bg-[#0A0A0A]" : "border-black bg-white"
      }`}
    >
      {/* Title Bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b-4 ${
          isDark ? "border-white" : "border-black"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Window Dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#FF3366]" />
            <div className="w-3 h-3 bg-[#FFD600]" />
            <div className="w-3 h-3 bg-[#39FF14]" />
          </div>
          <Code
            className={`w-4 h-4 ${isDark ? "text-[#00D4FF]" : "text-[#0066FF]"}`}
          />
          <span
            className={`font-black text-xs uppercase tracking-wider ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            PLAYGROUND.TS
          </span>
        </div>
        <span
          className={`font-mono text-[10px] uppercase px-2 py-0.5 border-2 ${
            isDark
              ? "border-[#00D4FF] text-[#00D4FF]"
              : "border-[#0066FF] text-[#0066FF]"
          }`}
        >
          {snippetLanguage}
        </span>
      </div>

      {/* Snippet Selector */}
      <div
        className={`border-b-4 ${isDark ? "border-white" : "border-black"}`}
      >
        <SnippetSelector
          activeSnippet={activeSnippet}
          onSnippetChange={onSnippetChange}
          isDark={isDark}
        />
      </div>

      {/* Code Editor Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Syntax Highlighted Underlay */}
        <SyntaxHighlighter
          ref={highlighterRef}
          code={code}
          isDark={isDark}
          className="absolute inset-0 z-0 overflow-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all m-0"
        />

        {/* Transparent Textarea Overlay */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="absolute inset-0 z-10 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none overflow-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
        />
      </div>

      {/* Bottom Toolbar */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-t-4 ${
          isDark ? "border-white" : "border-black"
        }`}
      >
        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 border-4 font-black text-xs uppercase transition-all ${
            isRunning
              ? "bg-[#0066FF]/60 border-[#0066FF]/60 text-white/60 cursor-not-allowed"
              : "bg-[#0066FF] border-[#0066FF] text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1"
          }`}
          style={
            !isRunning
              ? {
                  boxShadow: isDark
                    ? "4px 4px 0px #fff"
                    : "4px 4px 0px #000",
                }
              : undefined
          }
        >
          <Play className="w-3.5 h-3.5" />
          {isRunning ? "RUNNING..." : "RUN"}
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className={`flex items-center gap-2 px-4 py-2 border-4 font-black text-xs uppercase transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1 ${
            isDark
              ? "border-white text-white hover:bg-white/10"
              : "border-black text-black hover:bg-black/10"
          }`}
          style={{
            boxShadow: isDark ? "4px 4px 0px #fff" : "4px 4px 0px #000",
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 border-4 font-black text-xs uppercase transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1 ${
            isDark
              ? "border-white text-white hover:bg-white/10"
              : "border-black text-black hover:bg-black/10"
          }`}
          style={{
            boxShadow: isDark ? "4px 4px 0px #fff" : "4px 4px 0px #000",
          }}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#39FF14]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "COPIED" : "COPY"}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share Button */}
        <button
          onClick={() => {}}
          className={`flex items-center gap-2 px-4 py-2 border-4 font-black text-xs uppercase transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1 ${
            isDark
              ? "border-white text-white hover:bg-white/10"
              : "border-black text-black hover:bg-black/10"
          }`}
          style={{
            boxShadow: isDark ? "4px 4px 0px #fff" : "4px 4px 0px #000",
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          SHARE
        </button>
      </div>
    </div>
  );
}
