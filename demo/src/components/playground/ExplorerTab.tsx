"use client";

import { useState, lazy, Suspense } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Activity,
  Shield,
  Zap,
  Calculator,
  Box,
  BarChart3,
} from 'lucide-react';
import PoseidonHashCalculator from './PoseidonHashCalculator';
import ContractInteractionSimulator from './ContractInteractionSimulator';

const ZKProofVisualizer = lazy(() => import('@/components/ZKProofVisualizer'));
const BN254CurveExplorer = lazy(() => import('@/components/BN254CurveExplorer'));
const ProofBenchmark = lazy(() => import('@/components/ProofBenchmark'));
const GasSavingsComparison = lazy(() => import('@/components/GasSavingsComparison'));
const PrivacyCalculator = lazy(() => import('@/components/PrivacyCalculator'));

interface ExplorerTabProps {
  isDark: boolean;
}

interface Section {
  id: string;
  title: string;
  icon: typeof Calculator;
  color: string;
  defaultOpen: boolean;
}

const SECTIONS: Section[] = [
  {
    id: 'poseidon',
    title: 'POSEIDON HASH CALCULATOR',
    icon: Calculator,
    color: '#39FF14',
    defaultOpen: true,
  },
  {
    id: 'contract',
    title: 'CONTRACT SIMULATOR',
    icon: Box,
    color: '#0066FF',
    defaultOpen: true,
  },
  {
    id: 'zkproof',
    title: 'ZK PROOF VISUALIZER',
    icon: Shield,
    color: '#FF3366',
    defaultOpen: false,
  },
  {
    id: 'bn254',
    title: 'BN254 CURVE EXPLORER',
    icon: Activity,
    color: '#00D4FF',
    defaultOpen: false,
  },
  {
    id: 'benchmark',
    title: 'PERFORMANCE BENCHMARK',
    icon: BarChart3,
    color: '#FFD600',
    defaultOpen: false,
  },
  {
    id: 'gas',
    title: 'GAS SAVINGS',
    icon: Zap,
    color: '#39FF14',
    defaultOpen: false,
  },
  {
    id: 'privacy',
    title: 'PRIVACY CALCULATOR',
    icon: Shield,
    color: '#BD93F9',
    defaultOpen: false,
  },
];

function LoadingFallback({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`border-4 p-8 flex items-center justify-center animate-pulse ${
        isDark ? 'border-white/20' : 'border-black/20'
      }`}
    >
      <span
        className={`font-black text-sm uppercase tracking-wider ${
          isDark ? 'text-white/30' : 'text-black/30'
        }`}
      >
        LOADING...
      </span>
    </div>
  );
}

export default function ExplorerTab({ isDark }: ExplorerTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    SECTIONS.forEach((s) => {
      defaults[s.id] = s.defaultOpen;
    });
    return defaults;
  });

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderContent = (sectionId: string) => {
    switch (sectionId) {
      case 'poseidon':
        return <PoseidonHashCalculator isDark={isDark} />;
      case 'contract':
        return <ContractInteractionSimulator isDark={isDark} />;
      case 'zkproof':
        return (
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <ZKProofVisualizer isDark={isDark} />
          </Suspense>
        );
      case 'bn254':
        return (
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <BN254CurveExplorer isDark={isDark} />
          </Suspense>
        );
      case 'benchmark':
        return (
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <ProofBenchmark isDark={isDark} />
          </Suspense>
        );
      case 'gas':
        return (
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <GasSavingsComparison isDark={isDark} />
          </Suspense>
        );
      case 'privacy':
        return (
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <PrivacyCalculator isDark={isDark} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isOpen = expanded[section.id];

        return (
          <div key={section.id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between px-4 py-3 border-4 font-black text-sm uppercase tracking-wider transition-all ${
                isOpen
                  ? 'text-black'
                  : isDark
                    ? 'border-white/20 text-white/70 hover:border-white/40 bg-transparent'
                    : 'border-black/20 text-black/70 hover:border-black/40 bg-transparent'
              }`}
              style={
                isOpen
                  ? {
                      backgroundColor: section.color,
                      borderColor: section.color,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <Icon
                  className="w-5 h-5"
                  style={isOpen ? undefined : { color: section.color }}
                />
                <span>{section.title}</span>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {/* Section content */}
            {isOpen && <div className="mt-4">{renderContent(section.id)}</div>}
          </div>
        );
      })}
    </div>
  );
}
