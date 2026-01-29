"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';
import { type ApiMethod } from '@/lib/playground/apiReference';

interface ApiMethodCardProps {
  method: ApiMethod;
  isDark: boolean;
  moduleColor: string;
}

export default function ApiMethodCard({ method, isDark, moduleColor }: ApiMethodCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(method.example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`
        border-4 transition-all duration-200 cursor-pointer
        ${isExpanded
          ? ''
          : isDark
            ? 'border-white/10 hover:border-white/30'
            : 'border-black/10 hover:border-black/30'
        }
        ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}
      `}
      style={isExpanded ? { borderColor: moduleColor } : undefined}
    >
      {/* Header - always visible */}
      <div
        className="flex items-center gap-3 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand icon */}
        <div className={isDark ? 'text-white/40' : 'text-black/40'}>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>

        {/* Method name */}
        <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
          {method.name}
        </span>

        {/* Module badge */}
        <span
          className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black"
          style={{ backgroundColor: moduleColor }}
        >
          {method.module}
        </span>

        {/* Description (truncated) */}
        <span
          className={`flex-1 text-sm truncate ${
            isDark ? 'text-white/50' : 'text-black/50'
          }`}
        >
          {method.description}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className={`px-4 pb-4 space-y-5 ${isDark ? 'border-t border-white/10' : 'border-t border-black/10'}`}>
          {/* Full signature */}
          <div className="pt-4">
            <div
              className={`font-mono text-sm p-3 ${
                isDark ? 'bg-white/5 text-[#00D4FF]' : 'bg-black/5 text-[#0066FF]'
              }`}
            >
              {method.signature}
            </div>
          </div>

          {/* Description */}
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            {method.description}
          </p>

          {/* Parameters table */}
          {method.parameters.length > 0 && (
            <div>
              <h4
                className={`font-black text-xs uppercase tracking-wider mb-2 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}
              >
                PARAMETERS
              </h4>
              <div className={`border-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                {/* Table header */}
                <div
                  className={`grid grid-cols-[160px_140px_80px_1fr] text-[10px] font-black uppercase tracking-wider ${
                    isDark
                      ? 'bg-white/5 text-white/40 border-b border-white/10'
                      : 'bg-black/5 text-black/40 border-b border-black/10'
                  }`}
                >
                  <div className="px-3 py-2">NAME</div>
                  <div className="px-3 py-2">TYPE</div>
                  <div className="px-3 py-2">REQUIRED</div>
                  <div className="px-3 py-2">DESCRIPTION</div>
                </div>
                {/* Table rows */}
                {method.parameters.map((param, i) => (
                  <div
                    key={param.name}
                    className={`grid grid-cols-[160px_140px_80px_1fr] text-sm ${
                      i < method.parameters.length - 1
                        ? isDark
                          ? 'border-b border-white/5'
                          : 'border-b border-black/5'
                        : ''
                    }`}
                  >
                    <div className={`px-3 py-2 font-mono text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                      {param.name}
                    </div>
                    <div className="px-3 py-2 font-mono text-xs text-[#FFD600]">
                      {param.type}
                    </div>
                    <div className="px-3 py-2 flex items-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          param.required ? 'bg-[#39FF14]' : isDark ? 'bg-white/20' : 'bg-black/20'
                        }`}
                      />
                    </div>
                    <div className={`px-3 py-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {param.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return type */}
          <div>
            <h4
              className={`font-black text-xs uppercase tracking-wider mb-2 ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}
            >
              RETURNS
            </h4>
            <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <span className="font-mono text-sm text-[#FF3366]">{method.returnType}</span>
              <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {method.returnDescription}
              </p>
            </div>
          </div>

          {/* Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4
                className={`font-black text-xs uppercase tracking-wider ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}
              >
                EXAMPLE
              </h4>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs font-black uppercase tracking-wider
                  border-2 transition-all duration-200
                  ${copied
                    ? 'border-[#39FF14] text-[#39FF14]'
                    : isDark
                      ? 'border-white/20 text-white/40 hover:border-white/40 hover:text-white/60'
                      : 'border-black/20 text-black/40 hover:border-black/40 hover:text-black/60'
                  }
                `}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className={`p-3 ${isDark ? 'bg-black/40 border-2 border-white/10' : 'bg-white border-2 border-black/10'}`}>
              <SyntaxHighlighter code={method.example} isDark={isDark} />
            </div>
          </div>

          {/* Tags */}
          {method.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {method.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                    isDark
                      ? 'bg-white/5 text-white/30 border border-white/10'
                      : 'bg-black/5 text-black/30 border border-black/10'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
