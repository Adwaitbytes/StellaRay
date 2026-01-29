'use client';

import { useState, useRef, useEffect } from 'react';
import { SNIPPETS, CATEGORY_META, type SnippetCategory } from '@/lib/playground/snippets';
import { ChevronDown } from 'lucide-react';

interface SnippetSelectorProps {
  activeSnippet: string;
  onSnippetChange: (id: string) => void;
  isDark: boolean;
}

const CATEGORY_ORDER: SnippetCategory[] = [
  'authentication',
  'payments',
  'streaming',
  'intent',
  'x402',
  'advanced',
];

export default function SnippetSelector({
  activeSnippet,
  onSnippetChange,
  isDark,
}: SnippetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSnippet = SNIPPETS.find((s) => s.id === activeSnippet);
  const currentCategory = currentSnippet
    ? CATEGORY_META[currentSnippet.category]
    : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group snippets by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    snippets: SNIPPETS.filter((s) => s.category === cat),
  }));

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 font-black uppercase text-sm border-4 transition-all ${
          isDark
            ? 'bg-[#0A0A0A] border-white text-white hover:bg-white/5'
            : 'bg-[#F5F5F5] border-black text-black hover:bg-black/5'
        } ${isOpen ? '' : 'translate-x-0 translate-y-0 hover:translate-x-1 hover:translate-y-1'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {currentCategory && (
            <span
              className="px-2 py-0.5 text-xs font-black text-black flex-shrink-0"
              style={{ backgroundColor: currentCategory.color }}
            >
              {currentCategory.label}
            </span>
          )}
          <span className="truncate">
            {currentSnippet?.title || 'SELECT SNIPPET'}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`absolute z-50 top-full left-0 right-0 mt-1 border-4 max-h-[420px] overflow-y-auto ${
            isDark
              ? 'bg-[#0A0A0A] border-white'
              : 'bg-[#F5F5F5] border-black'
          }`}
        >
          {grouped.map((group) => (
            <div key={group.category}>
              {/* Category header */}
              <div
                className={`sticky top-0 px-4 py-2 text-xs font-black uppercase tracking-wider border-b ${
                  isDark
                    ? 'bg-[#0A0A0A] border-white/10'
                    : 'bg-[#F5F5F5] border-black/10'
                }`}
              >
                <span style={{ color: group.meta.color }}>
                  {group.meta.label}
                </span>
              </div>

              {/* Snippets in this category */}
              {group.snippets.map((snippet) => {
                const isActive = snippet.id === activeSnippet;

                return (
                  <button
                    key={snippet.id}
                    onClick={() => {
                      onSnippetChange(snippet.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors border-b ${
                      isDark
                        ? `border-white/5 ${
                            isActive
                              ? 'bg-white/10'
                              : 'hover:bg-white/5'
                          }`
                        : `border-black/5 ${
                            isActive
                              ? 'bg-black/10'
                              : 'hover:bg-black/5'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span
                          className="w-2 h-2 flex-shrink-0"
                          style={{ backgroundColor: group.meta.color }}
                        />
                      )}
                      <span
                        className={`font-black text-sm uppercase ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        {snippet.title}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 font-mono ${
                        isDark ? 'text-white/50' : 'text-black/50'
                      } ${isActive ? 'pl-4' : ''}`}
                    >
                      {snippet.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
