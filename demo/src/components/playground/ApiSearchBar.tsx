"use client";

import { Search, X, Command } from 'lucide-react';
import { useState, useRef, useEffect, forwardRef } from 'react';

interface ApiSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  isDark: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export default function ApiSearchBar({ query, onQueryChange, isDark, inputRef }: ApiSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || internalRef;

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <Search
        size={18}
        className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${
          isFocused
            ? 'text-[#0066FF]'
            : isDark
              ? 'text-white/40'
              : 'text-black/40'
        }`}
      />

      {/* Input */}
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="SEARCH METHODS, TYPES, PARAMETERS..."
        className={`
          w-full pl-12 pr-28 py-3 font-mono text-sm
          border-4 transition-colors duration-200 outline-none
          ${isFocused
            ? 'border-[#0066FF]'
            : isDark
              ? 'border-white/20'
              : 'border-black/20'
          }
          ${isDark
            ? 'bg-white/5 text-white placeholder:text-white/30'
            : 'bg-black/5 text-black placeholder:text-black/30'
          }
        `}
      />

      {/* Right side: clear button or keyboard shortcut */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {query ? (
          <button
            onClick={() => {
              onQueryChange('');
              ref.current?.focus();
            }}
            className={`p-1 transition-colors ${
              isDark
                ? 'text-white/40 hover:text-white'
                : 'text-black/40 hover:text-black'
            }`}
          >
            <X size={16} />
          </button>
        ) : (
          <kbd
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 font-mono text-xs
              border-2 rounded-sm select-none
              ${isDark
                ? 'border-white/10 text-white/30 bg-white/5'
                : 'border-black/10 text-black/30 bg-black/5'
              }
            `}
          >
            <Command size={10} />
            <span>CTRL+K</span>
          </kbd>
        )}
      </div>
    </div>
  );
}
