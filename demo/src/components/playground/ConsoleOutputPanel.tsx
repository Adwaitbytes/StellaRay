'use client';

import { useRef, useEffect } from 'react';
import { type ConsoleEntry } from '@/lib/playground/simulationEngine';
import { Terminal, Trash2 } from 'lucide-react';

interface ConsoleOutputPanelProps {
  output: ConsoleEntry[];
  onClear: () => void;
  isDark: boolean;
  isRunning: boolean;
}

const ENTRY_STYLES: Record<ConsoleEntry['type'], string> = {
  comment: 'text-white/40 italic',
  error: 'text-[#FF3366]',
  success: 'text-[#39FF14]',
  info: 'text-[#0066FF]',
  json: 'text-[#FFD600] font-mono',
  step: 'text-[#00D4FF] font-bold',
  warn: 'text-[#FFD600]',
};

export default function ConsoleOutputPanel({
  output,
  onClear,
  isDark,
  isRunning,
}: ConsoleOutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div
      className={`flex flex-col min-h-[300px] sm:min-h-[400px] lg:h-full border-2 sm:border-4 ${
        isDark ? 'bg-[#0A0A0A] border-white' : 'bg-[#F5F5F5] border-black'
      }`}
    >
      {/* Title bar */}
      <div
        className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b ${
          isDark ? 'border-white/20' : 'border-black/20'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#FF3366]" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#FFD600]" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#39FF14]" />
          </div>

          <Terminal
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isDark ? 'text-white/60' : 'text-black/60'}`}
          />
          <span
            className={`font-black text-[10px] sm:text-xs uppercase tracking-wider truncate ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            CONSOLE.LOG
          </span>
        </div>

        <button
          onClick={onClear}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black uppercase border sm:border-2 transition-all flex-shrink-0 ${
            isDark
              ? 'border-white/40 text-white/60 hover:text-white hover:border-white'
              : 'border-black/40 text-black/60 hover:text-black hover:border-black'
          }`}
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">CLEAR</span>
        </button>
      </div>

      {/* Output area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 font-mono text-xs sm:text-sm"
      >
        {output.length === 0 ? (
          /* Empty state */
          <div className="text-white/40 italic">
            {'// Ready to execute code...'}
          </div>
        ) : (
          /* Console entries */
          <div className="space-y-1">
            {output.map((entry, index) => (
              <div
                key={index}
                className={`whitespace-pre-wrap break-all ${ENTRY_STYLES[entry.type]}`}
              >
                {entry.type === 'comment' ? (
                  entry.content
                ) : (
                  <>
                    <span className="text-white/30 mr-2">{'>'}</span>
                    {entry.content}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Blinking cursor when running */}
        {isRunning && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-white/30">{'>'}</span>
            <span className="inline-block w-2 h-4 bg-[#0066FF] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
