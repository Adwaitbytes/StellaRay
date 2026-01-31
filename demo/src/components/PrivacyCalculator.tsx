"use client";

import { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock, Unlock, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface PrivacyCalculatorProps {
  isDark?: boolean;
}

interface PrivacyFactor {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  score: number;
}

export function PrivacyCalculator({ isDark = true }: PrivacyCalculatorProps) {
  const [factors, setFactors] = useState<PrivacyFactor[]>([
    {
      id: 'zk_auth',
      name: 'ZK Authentication',
      description: 'OAuth identity verified without revealing credentials',
      weight: 25,
      enabled: true,
      score: 100,
    },
    {
      id: 'poseidon_hash',
      name: 'Poseidon Hashing',
      description: 'ZK-friendly hash preserving input privacy',
      weight: 20,
      enabled: true,
      score: 100,
    },
    {
      id: 'ephemeral_keys',
      name: 'Ephemeral Keys',
      description: 'Session keys that expire and cannot be linked',
      weight: 20,
      enabled: true,
      score: 85,
    },
    {
      id: 'address_derivation',
      name: 'Deterministic Address',
      description: 'Address derived from identity proof',
      weight: 15,
      enabled: true,
      score: 70,
    },
    {
      id: 'tx_amount_hidden',
      name: 'Amount Privacy',
      description: 'Transaction amounts visible on-chain',
      weight: 10,
      enabled: false,
      score: 0,
    },
    {
      id: 'recipient_hidden',
      name: 'Recipient Privacy',
      description: 'Recipient address visible on-chain',
      weight: 10,
      enabled: false,
      score: 0,
    },
  ]);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate total privacy score
  const totalScore = factors.reduce((acc, f) => {
    if (f.enabled) {
      return acc + (f.score * f.weight / 100);
    }
    return acc;
  }, 0);

  const maxPossibleScore = factors.reduce((acc, f) => acc + f.weight, 0);
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);

  // Animate score
  useEffect(() => {
    const target = normalizedScore;
    const step = (target - animatedScore) / 10;

    if (Math.abs(target - animatedScore) > 1) {
      const timer = setTimeout(() => {
        setAnimatedScore(prev => prev + step);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScore(target);
    }
  }, [normalizedScore, animatedScore]);

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00D4FF';
    if (score >= 60) return '#FFD600';
    if (score >= 40) return '#FF9500';
    return '#FF3366';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'MODERATE';
    return 'LOW';
  };

  const scoreColor = getScoreColor(animatedScore);

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#FF10F0]' : 'border-black bg-[#CC0088]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-white" />
            <span className="font-black text-white">PRIVACY_SCORE.CALC</span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`w-8 h-8 flex items-center justify-center ${showDetails ? 'bg-white text-[#FF10F0]' : 'bg-white/20 text-white'}`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Score Display */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Circular progress background */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={scoreColor}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(animatedScore / 100) * 440} 440`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color: scoreColor }}>
                {Math.round(animatedScore)}
              </span>
              <span className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                / 100
              </span>
              <span className="text-xs font-black mt-1" style={{ color: scoreColor }}>
                {getScoreLabel(animatedScore)}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Factors */}
        <div className="space-y-3">
          <p className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            PRIVACY FACTORS
          </p>

          {factors.map((factor) => (
            <div
              key={factor.id}
              className={`p-3 border-2 transition-all cursor-pointer ${
                factor.enabled
                  ? `${isDark ? 'border-[#00D4FF]/50 bg-[#00D4FF]/10' : 'border-[#00AA55]/50 bg-[#00AA55]/10'}`
                  : `${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`
              }`}
              onClick={() => toggleFactor(factor.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center ${
                    factor.enabled ? 'bg-[#00D4FF]' : isDark ? 'bg-white/20' : 'bg-black/20'
                  }`}>
                    {factor.enabled ? (
                      <Lock className="w-4 h-4 text-black" />
                    ) : (
                      <Unlock className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${
                      factor.enabled
                        ? (isDark ? 'text-white' : 'text-black')
                        : (isDark ? 'text-white/50' : 'text-black/50')
                    }`}>
                      {factor.name}
                    </p>
                    {showDetails && (
                      <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        {factor.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-xs font-mono ${factor.enabled ? 'text-[#00D4FF]' : isDark ? 'text-white/30' : 'text-black/30'}`}>
                      +{factor.weight}pts
                    </p>
                    {factor.enabled && (
                      <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                        {factor.score}% effective
                      </p>
                    )}
                  </div>
                  {factor.enabled ? (
                    <CheckCircle className="w-5 h-5 text-[#00D4FF]" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {animatedScore < 80 && (
          <div className={`mt-4 p-3 border-2 border-[#FFD600]/50 bg-[#FFD600]/10`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFD600] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-[#FFD600]">IMPROVEMENT SUGGESTIONS</p>
                <ul className={`text-[10px] mt-1 space-y-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {!factors.find(f => f.id === 'tx_amount_hidden')?.enabled && (
                    <li>• Enable confidential transactions for amount privacy</li>
                  )}
                  {!factors.find(f => f.id === 'recipient_hidden')?.enabled && (
                    <li>• Use stealth addresses for recipient privacy</li>
                  )}
                  {animatedScore < 60 && (
                    <li>• Consider using privacy pools for enhanced anonymity</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Summary */}
        <div className={`mt-4 p-3 border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Eye className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>Visible</p>
              <p className="text-sm font-black text-[#FF3366]">
                {factors.filter(f => !f.enabled).length}
              </p>
            </div>
            <div>
              <EyeOff className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>Private</p>
              <p className="text-sm font-black text-[#00D4FF]">
                {factors.filter(f => f.enabled).length}
              </p>
            </div>
            <div>
              <Shield className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>ZK Protected</p>
              <p className="text-sm font-black text-[#00D4FF]">
                {factors.filter(f => f.enabled && f.id.includes('zk') || f.id.includes('poseidon')).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyCalculator;
