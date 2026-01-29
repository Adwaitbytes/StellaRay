'use client';

import { forwardRef } from 'react';
import { tokenizeLine, TOKEN_COLORS } from '@/lib/playground/syntaxRules';

interface SyntaxHighlighterProps {
  code: string;
  isDark: boolean;
  className?: string;
}

const SyntaxHighlighter = forwardRef<HTMLPreElement, SyntaxHighlighterProps>(
  function SyntaxHighlighter({ code, isDark, className }, ref) {
    const lines = code.split('\n');

    return (
      <pre ref={ref} className={className || "font-mono text-sm overflow-x-auto"}>
        {lines.map((line, lineIndex) => {
          const tokens = tokenizeLine(line);

          return (
            <div key={lineIndex} className="flex min-h-[1.5rem]">
              {/* Line number */}
              <span
                className={`w-12 text-right pr-4 select-none flex-shrink-0 ${
                  isDark
                    ? 'text-white/20 border-r border-white/10'
                    : 'text-black/20 border-r border-black/10'
                }`}
              >
                {lineIndex + 1}
              </span>

              {/* Code content */}
              <span className="pl-4 whitespace-pre">
                {tokens.length === 0 ? (
                  '\u00A0'
                ) : (
                  tokens.map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      className={
                        isDark
                          ? TOKEN_COLORS[token.type]
                          : token.type === 'comment'
                            ? 'text-black/40 italic'
                            : token.type === 'default'
                              ? 'text-black/90'
                              : TOKEN_COLORS[token.type]
                      }
                    >
                      {token.text}
                    </span>
                  ))
                )}
              </span>
            </div>
          );
        })}
      </pre>
    );
  }
);

export default SyntaxHighlighter;
