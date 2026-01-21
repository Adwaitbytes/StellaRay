"use client";

import { useState, useEffect, useRef } from "react";
import {
  Award, Shield, Clock, User, CheckCircle, Lock,
  Sparkles, Star, Zap, Globe, BadgeCheck, Fingerprint,
  Trophy, Crown, Flame, Diamond, Heart, Target
} from "lucide-react";

interface IdentityBadgeSystemProps {
  isDark?: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: 'verified' | 'early' | 'whale' | 'developer' | 'og' | 'diamond' | 'community' | 'security';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earnedAt: Date;
  proofHash: string;
  zkVerified: boolean;
  rarity: number; // percentage of users who have this
  requirements: string[];
  xp: number;
}

interface BadgeCategory {
  name: string;
  badges: Badge[];
}

const TIER_COLORS = {
  bronze: { bg: '#CD7F32', text: '#000', glow: 'rgba(205, 127, 50, 0.5)' },
  silver: { bg: '#C0C0C0', text: '#000', glow: 'rgba(192, 192, 192, 0.5)' },
  gold: { bg: '#FFD700', text: '#000', glow: 'rgba(255, 215, 0, 0.5)' },
  platinum: { bg: '#E5E4E2', text: '#000', glow: 'rgba(229, 228, 226, 0.7)' },
  diamond: { bg: '#B9F2FF', text: '#000', glow: 'rgba(185, 242, 255, 0.7)' },
};

const BADGE_ICONS = {
  verified: BadgeCheck,
  early: Star,
  whale: Crown,
  developer: Zap,
  og: Flame,
  diamond: Diamond,
  community: Heart,
  security: Shield,
};

function generateProofHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function IdentityBadgeSystem({ isDark = true }: IdentityBadgeSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const animationRef = useRef<number>();
  const frameRef = useRef(0);

  const [badges] = useState<Badge[]>([
    {
      id: 'verified-human',
      name: 'Verified Human',
      description: 'Identity verified via zkLogin without revealing personal data',
      icon: 'verified',
      tier: 'gold',
      earnedAt: new Date(Date.now() - 86400000 * 30),
      proofHash: generateProofHash(),
      zkVerified: true,
      rarity: 45.2,
      requirements: ['Complete OAuth verification', 'Generate ZK proof of identity', 'Submit on-chain attestation'],
      xp: 500,
    },
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      description: 'Joined during the X-Ray Protocol testnet phase',
      icon: 'early',
      tier: 'platinum',
      earnedAt: new Date(Date.now() - 86400000 * 60),
      proofHash: generateProofHash(),
      zkVerified: true,
      rarity: 12.8,
      requirements: ['Account created before mainnet', 'Completed at least 1 transaction', 'Verified identity'],
      xp: 1000,
    },
    {
      id: 'zkp-master',
      name: 'ZKP Master',
      description: 'Generated 100+ zero-knowledge proofs',
      icon: 'developer',
      tier: 'diamond',
      earnedAt: new Date(Date.now() - 86400000 * 15),
      proofHash: generateProofHash(),
      zkVerified: true,
      rarity: 3.2,
      requirements: ['Generate 100 ZK proofs', 'Use at least 3 proof types', 'No failed verifications'],
      xp: 2500,
    },
    {
      id: 'og-stellar',
      name: 'OG Stellar',
      description: 'Stellar account age > 2 years (proven without revealing address)',
      icon: 'og',
      tier: 'gold',
      earnedAt: new Date(Date.now() - 86400000 * 45),
      proofHash: generateProofHash(),
      zkVerified: true,
      rarity: 8.5,
      requirements: ['Stellar account > 2 years old', 'ZK proof of account age', 'Active in last 30 days'],
      xp: 750,
    },
    {
      id: 'privacy-guardian',
      name: 'Privacy Guardian',
      description: 'Maintained 100% privacy score for 30 days',
      icon: 'security',
      tier: 'platinum',
      earnedAt: new Date(Date.now() - 86400000 * 10),
      proofHash: generateProofHash(),
      zkVerified: true,
      rarity: 5.1,
      requirements: ['Privacy score > 95%', 'No data leaks', '30 days continuous'],
      xp: 1500,
    },
    {
      id: 'community-hero',
      name: 'Community Hero',
      description: 'Helped 50+ users with ZK integration',
      icon: 'community',
      tier: 'silver',
      earnedAt: new Date(Date.now() - 86400000 * 20),
      proofHash: generateProofHash(),
      zkVerified: true,
      rarity: 15.3,
      requirements: ['Answer 50 community questions', 'Positive feedback rating', 'Active contributor'],
      xp: 400,
    },
  ]);

  // Calculate total XP and level
  useEffect(() => {
    const total = badges.reduce((sum, b) => sum + b.xp, 0);
    setTotalXP(total);
    setUserLevel(Math.floor(total / 1000) + 1);
  }, [badges]);

  // Badge glow animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedBadge) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const tierColor = TIER_COLORS[selectedBadge.tier];

    const animate = () => {
      ctx.fillStyle = isDark ? '#0A0A0A' : '#F5F5F5';
      ctx.fillRect(0, 0, width, height);

      // Animated rings
      for (let i = 0; i < 5; i++) {
        const radius = 30 + i * 20 + Math.sin(frameRef.current * 0.03 + i) * 5;
        const alpha = 0.3 - i * 0.05;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${hexToRgb(tierColor.bg)}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Particle effects
      for (let i = 0; i < 20; i++) {
        const angle = (frameRef.current * 0.02 + i * 0.314) % (Math.PI * 2);
        const distance = 60 + Math.sin(frameRef.current * 0.05 + i) * 20;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const size = 2 + Math.sin(frameRef.current * 0.1 + i) * 1;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = tierColor.bg;
        ctx.fill();
      }

      // Center glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
      gradient.addColorStop(0, tierColor.bg);
      gradient.addColorStop(0.5, tierColor.glow);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Badge icon placeholder
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
      ctx.fillStyle = tierColor.bg;
      ctx.fill();

      // ZK verified checkmark
      if (selectedBadge.zkVerified) {
        ctx.fillStyle = '#39FF14';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', centerX, centerY + 5);
      }

      frameRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark, selectedBadge]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  const verifyBadge = async (badge: Badge) => {
    setIsVerifying(true);
    setVerificationStep(0);

    const steps = ['Loading proof...', 'Verifying signature...', 'Checking ZK circuit...', 'Validating on-chain...', 'Complete!'];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setVerificationStep(i + 1);
    }

    setIsVerifying(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const xpToNextLevel = (userLevel * 1000) - totalXP;
  const xpProgress = ((totalXP % 1000) / 1000) * 100;

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#FF10F0]' : 'border-black bg-[#CC0088]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-white" />
            <span className="font-black text-white">IDENTITY_BADGES.ZK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-black text-[#39FF14] text-xs font-black">
              LVL {userLevel}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* User Stats */}
        <div className={`mb-6 p-4 border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF10F0] to-[#00D4FF] flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>Anonymous User</p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  ZK-Verified Identity
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#FFD600]">{totalXP.toLocaleString()}</p>
              <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>TOTAL XP</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>Level {userLevel}</span>
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>{xpToNextLevel} XP to Level {userLevel + 1}</span>
            </div>
            <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              <div
                className="h-full bg-gradient-to-r from-[#FF10F0] to-[#00D4FF] transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="mb-6">
          <p className={`text-xs font-black mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            EARNED BADGES ({badges.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {badges.map((badge) => {
              const Icon = BADGE_ICONS[badge.icon];
              const tierColor = TIER_COLORS[badge.tier];
              const isSelected = selectedBadge?.id === badge.id;

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative p-3 border-2 transition-all ${
                    isSelected
                      ? 'border-[#39FF14] scale-105'
                      : isDark ? 'border-white/20 hover:border-white/40' : 'border-black/20 hover:border-black/40'
                  }`}
                  style={isSelected ? { boxShadow: `0 0 20px ${tierColor.glow}` } : {}}
                >
                  <div
                    className="w-10 h-10 mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: tierColor.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: tierColor.text }} />
                  </div>
                  <p className={`text-[10px] font-bold text-center truncate ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {badge.name.split(' ')[0]}
                  </p>
                  {badge.zkVerified && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#39FF14] flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Badge Detail */}
        {selectedBadge && (
          <div className={`border-2 ${isDark ? 'border-white/30' : 'border-black/30'}`}>
            <div className="grid md:grid-cols-2 gap-0">
              {/* Badge Animation */}
              <div className={`p-4 border-b-2 md:border-b-0 md:border-r-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                <canvas
                  ref={canvasRef}
                  width={200}
                  height={200}
                  className="w-full max-w-[200px] mx-auto"
                />
              </div>

              {/* Badge Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                      {selectedBadge.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="px-2 py-0.5 text-[10px] font-black uppercase"
                        style={{
                          backgroundColor: TIER_COLORS[selectedBadge.tier].bg,
                          color: TIER_COLORS[selectedBadge.tier].text
                        }}
                      >
                        {selectedBadge.tier}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        {selectedBadge.rarity}% have this
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#FFD600]">+{selectedBadge.xp}</p>
                    <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>XP</p>
                  </div>
                </div>

                <p className={`text-xs mb-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {selectedBadge.description}
                </p>

                {/* Requirements */}
                <div className="mb-4">
                  <p className={`text-[10px] font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    REQUIREMENTS
                  </p>
                  <ul className="space-y-1">
                    {selectedBadge.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-[#39FF14] flex-shrink-0" />
                        <span className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Proof Hash */}
                <div className={`p-2 mb-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <p className={`text-[10px] font-black mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    ZK PROOF HASH
                  </p>
                  <p className={`text-[10px] font-mono break-all ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {selectedBadge.proofHash}
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => verifyBadge(selectedBadge)}
                  disabled={isVerifying}
                  className={`w-full py-3 border-2 font-black text-sm transition-all ${
                    isVerifying
                      ? 'border-[#FFD600]/50 bg-[#FFD600]/10 text-[#FFD600]'
                      : 'border-[#39FF14] bg-[#39FF14] text-black hover:bg-[#39FF14]/80'
                  }`}
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Step {verificationStep}/5
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4" />
                      VERIFY ON-CHAIN
                    </span>
                  )}
                </button>

                <p className={`text-[10px] mt-2 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  Earned {formatDate(selectedBadge.earnedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Badge Stats */}
        <div className={`mt-4 p-3 border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <Trophy className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className="text-lg font-black text-[#FFD600]">{badges.length}</p>
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>Earned</p>
            </div>
            <div>
              <Diamond className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className="text-lg font-black text-[#B9F2FF]">
                {badges.filter(b => b.tier === 'diamond').length}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>Diamond</p>
            </div>
            <div>
              <Lock className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className="text-lg font-black text-[#39FF14]">
                {badges.filter(b => b.zkVerified).length}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>ZK Verified</p>
            </div>
            <div>
              <Target className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <p className="text-lg font-black text-[#FF10F0]">12</p>
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IdentityBadgeSystem;
