"use client";

import { useState, useRef, useEffect } from 'react';
import { Book, Shield, Zap, CreditCard, Activity, Code, Wrench } from 'lucide-react';
import ApiSearchBar from './ApiSearchBar';
import ApiMethodCard from './ApiMethodCard';
import { API_MODULES, API_METHODS, searchMethods, getMethodsByModule } from '@/lib/playground/apiReference';

interface ApiReferenceTabProps {
  isDark: boolean;
  searchRef?: React.RefObject<HTMLInputElement>;
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  ZkLoginClient: Shield,
  IntentClient: Zap,
  X402PaymentClient: CreditCard,
  XRayClient: Activity,
  Hooks: Code,
  Utils: Wrench,
};

export default function ApiReferenceTab({ isDark, searchRef }: ApiReferenceTabProps) {
  const [query, setQuery] = useState('');
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef || internalRef;

  const filteredMethods = query.trim() ? searchMethods(query.trim()) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Book size={20} className="text-[#0066FF]" />
          <h2 className={`font-black text-lg uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
            API REFERENCE
          </h2>
        </div>
        <span
          className={`px-3 py-1 text-xs font-black uppercase tracking-wider ${
            isDark
              ? 'bg-white/5 text-white/50 border-2 border-white/10'
              : 'bg-black/5 text-black/50 border-2 border-black/10'
          }`}
        >
          {API_METHODS.length} METHODS
        </span>
      </div>

      {/* Search bar */}
      <ApiSearchBar
        query={query}
        onQueryChange={setQuery}
        isDark={isDark}
        inputRef={inputRef}
      />

      {/* Content */}
      {filteredMethods !== null ? (
        /* Search results - flat list */
        filteredMethods.length > 0 ? (
          <div className="space-y-2">
            <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {filteredMethods.length} RESULT{filteredMethods.length !== 1 ? 'S' : ''} FOR &quot;{query.trim()}&quot;
            </p>
            <div className="space-y-2">
              {filteredMethods.map((method) => {
                const mod = API_MODULES.find((m) => m.id === method.module);
                return (
                  <ApiMethodCard
                    key={`${method.module}-${method.name}`}
                    method={method}
                    isDark={isDark}
                    moduleColor={mod?.color || '#0066FF'}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty search state */
          <div className={`text-center py-16 border-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <p className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              NO METHODS FOUND
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/20' : 'text-black/20'}`}>
              Try a different search term
            </p>
          </div>
        )
      ) : (
        /* Grouped by module */
        <div className="space-y-8">
          {API_MODULES.map((mod) => {
            const methods = getMethodsByModule(mod.id);
            if (methods.length === 0) return null;

            const IconComponent = MODULE_ICONS[mod.id] || Code;

            return (
              <div key={mod.id} className="space-y-3">
                {/* Module header */}
                <div className="flex items-center gap-3">
                  <IconComponent
                    size={16}
                    style={{ color: mod.color }}
                  />
                  <h3
                    className="font-black text-sm uppercase tracking-wider"
                    style={{ color: mod.color }}
                  >
                    {mod.label}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isDark
                        ? 'bg-white/5 text-white/30'
                        : 'bg-black/5 text-black/30'
                    }`}
                  >
                    {methods.length}
                  </span>
                  <div
                    className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`}
                  />
                </div>

                {/* Method cards */}
                <div className="space-y-2">
                  {methods.map((method) => (
                    <ApiMethodCard
                      key={`${method.module}-${method.name}`}
                      method={method}
                      isDark={isDark}
                      moduleColor={mod.color}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
