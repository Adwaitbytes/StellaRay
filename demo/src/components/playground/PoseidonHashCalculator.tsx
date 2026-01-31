"use client";

import { useState, useEffect } from 'react';
import { Hash, ArrowRight, Zap, Shield, Clock } from 'lucide-react';

interface PoseidonHashCalculatorProps {
  isDark: boolean;
}

function simulatePoseidonHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const parts: string[] = [];
  for (let j = 0; j < 8; j++) {
    h ^= j;
    h = Math.imul(h, 0x01000193);
    parts.push((h >>> 0).toString(16).padStart(8, '0'));
  }
  return '0x' + parts.join('');
}

export default function PoseidonHashCalculator({ isDark }: PoseidonHashCalculatorProps) {
  const [input, setInput] = useState('');
  const [hash, setHash] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim().length > 0) {
        setHash(simulatePoseidonHash(input));
      } else {
        setHash('');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [input]);

  const properties = [
    {
      label: 'FIELD',
      value: 'BN254 (254-bit)',
      icon: Shield,
      color: '#0066FF',
    },
    {
      label: 'ROUNDS',
      value: '63 full rounds',
      icon: Zap,
      color: '#FFD600',
    },
    {
      label: 'COST',
      value: '50,000 gas',
      icon: Clock,
      color: '#00D4FF',
    },
  ];

  return (
    <div
      className={`border-4 ${isDark ? 'border-white bg-[#0A0A0A]' : 'border-black bg-white'}`}
    >
      {/* Title bar */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b-4 ${
          isDark ? 'border-white' : 'border-black'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF3366]" />
          <div className="w-3 h-3 rounded-full bg-[#FFD600]" />
          <div className="w-3 h-3 rounded-full bg-[#00D4FF]" />
        </div>
        <Hash className="w-5 h-5" style={{ color: '#00D4FF' }} />
        <span
          className={`font-black text-sm uppercase tracking-wider ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          POSEIDON HASH CALCULATOR
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Input + Arrow + Output */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {/* Input section */}
          <div className="flex-1">
            <label
              className={`block font-black text-xs uppercase tracking-wider mb-2 ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}
            >
              INPUT
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter any text to hash..."
              className={`w-full px-4 py-3 border-4 font-mono text-sm outline-none transition-colors ${
                isDark
                  ? 'border-white/40 bg-white/5 text-white placeholder:text-white/30 focus:border-[#00D4FF]'
                  : 'border-black/40 bg-black/5 text-black placeholder:text-black/30 focus:border-[#0066FF]'
              }`}
            />
          </div>

          {/* Arrow */}
          <div className="flex items-end justify-center pb-3 lg:pb-0 lg:items-end">
            <div
              className={`p-2 border-4 ${
                isDark ? 'border-white/20' : 'border-black/20'
              }`}
            >
              <ArrowRight
                className="w-5 h-5 lg:rotate-0 rotate-90"
                style={{ color: '#00D4FF' }}
              />
            </div>
          </div>

          {/* Output section */}
          <div className="flex-1">
            <label
              className={`block font-black text-xs uppercase tracking-wider mb-2 ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}
            >
              POSEIDON HASH
            </label>
            <div
              className={`w-full px-4 py-3 border-4 border-[#00D4FF] bg-[#00D4FF]/10 font-mono text-sm break-all min-h-[48px] ${
                isDark ? 'text-[#00D4FF]' : 'text-blue-700'
              }`}
            >
              {hash || (
                <span className={isDark ? 'text-white/20' : 'text-black/20'}>
                  Hash output will appear here...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {properties.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.label}
                className={`border-4 p-4 ${
                  isDark ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: prop.color }} />
                  <span
                    className={`font-black text-xs uppercase tracking-wider ${
                      isDark ? 'text-white/50' : 'text-black/50'
                    }`}
                  >
                    {prop.label}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {prop.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Comparison */}
        <div
          className={`border-4 px-4 py-3 flex items-center gap-3 ${
            isDark
              ? 'border-[#FFD600]/40 bg-[#FFD600]/5'
              : 'border-[#FFD600]/60 bg-[#FFD600]/10'
          }`}
        >
          <Zap className="w-5 h-5 flex-shrink-0" style={{ color: '#FFD600' }} />
          <span
            className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'}`}
          >
            vs SHA-256: 500,000 gas{' '}
            <span className="font-black text-[#00D4FF]">(90% savings)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
