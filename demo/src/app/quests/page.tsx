"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Twitter,
  Users,
  Share2,
  Trophy,
  Zap,
  CheckCircle,
  Copy,
  Sparkles,
  Gift,
  Star,
  ChevronRight,
  Clock,
  Target,
  Award,
  Flame,
  Crown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// XLM Logo Component
const XLMLogo = ({ size = 40, className = "" }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
  >
    <defs>
      <linearGradient id="xlmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#00D4FF" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#xlmGradient)" />
    <path
      d="M25 35 L75 35 M25 50 L75 50 M25 65 L75 65"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle cx="50" cy="50" r="12" fill="white" />
  </svg>
);

// Animated particles background
const ParticleField = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#0066FF]/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
};

// Task Card Component
const TaskCard = ({
  icon: Icon,
  title,
  description,
  points,
  completed,
  onClick,
  href,
  featured,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  onClick?: () => void;
  href?: string;
  featured?: boolean;
}) => {
  const content = (
    <div
      className={`relative group p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${
        completed
          ? "bg-[#00FF88]/10 border-[#00FF88]/30"
          : featured
          ? "bg-gradient-to-br from-[#0066FF]/20 to-[#00D4FF]/10 border-[#0066FF]/40 hover:border-[#0066FF]"
          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
      }`}
      onClick={onClick}
    >
      {featured && !completed && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#0066FF] rounded-full text-[10px] font-bold flex items-center gap-1">
          <Flame className="w-3 h-3" />
          HOT
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
            completed
              ? "bg-[#00FF88]/20"
              : "bg-gradient-to-br from-[#0066FF]/20 to-[#00D4FF]/20"
          }`}
        >
          {completed ? (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#00FF88]" />
          ) : (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0066FF]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-sm sm:text-base ${completed ? "text-[#00FF88]" : "text-white"}`}>
              {title}
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold whitespace-nowrap flex-shrink-0">
              +{points} XLM
            </div>
          </div>
          <p className="text-white/50 text-xs sm:text-sm">{description}</p>
        </div>

        {!completed && (
          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors hidden sm:block flex-shrink-0" />
        )}
      </div>
    </div>
  );

  if (href && !completed) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
};

// Leaderboard Row
const LeaderboardRow = ({
  rank,
  name,
  points,
  referrals,
  isCurrentUser,
}: {
  rank: number;
  name: string;
  points: number;
  referrals: number;
  isCurrentUser?: boolean;
}) => (
  <div
    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${
      isCurrentUser
        ? "bg-[#0066FF]/20 border border-[#0066FF]/30"
        : "hover:bg-white/5"
    }`}
  >
    <div
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
        rank === 1
          ? "bg-[#FFD700] text-black"
          : rank === 2
          ? "bg-[#C0C0C0] text-black"
          : rank === 3
          ? "bg-[#CD7F32] text-black"
          : "bg-white/10 text-white/60"
      }`}
    >
      {rank <= 3 ? <Crown className="w-3 h-3 sm:w-4 sm:h-4" /> : rank}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-medium text-sm sm:text-base truncate ${isCurrentUser ? "text-[#0066FF]" : "text-white"}`}>
        {name} {isCurrentUser && <span className="text-xs text-[#0066FF]">(You)</span>}
      </p>
      <p className="text-white/40 text-[10px] sm:text-xs">{referrals} referrals</p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="font-bold text-[#FFD700] text-sm sm:text-base">{points.toLocaleString()}</p>
      <p className="text-white/40 text-[10px]">XLM</p>
    </div>
  </div>
);

// Countdown Timer
const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-sm sm:text-lg font-bold text-white">{value.toString().padStart(2, "0")}</span>
          </div>
          <span className="text-[8px] sm:text-[10px] text-white/40 uppercase mt-0.5 block">{unit.slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
};

export default function QuestsPage() {
  const [totalEarned, setTotalEarned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [referralCode, setReferralCode] = useState("SR-QUEST-XXXX");
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [liveCount, setLiveCount] = useState(14);

  // Launch date (7 days from now for demo)
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 7);

  // Tasks configuration
  const tasks = [
    {
      id: "follow_twitter",
      icon: Twitter,
      title: "Follow @stellaraydotfun",
      description: "Follow us on Twitter for the latest updates",
      points: 5,
      href: "https://twitter.com/intent/follow?screen_name=stellaraydotfun",
      featured: true,
    },
    {
      id: "retweet_launch",
      icon: Share2,
      title: "Retweet Launch Post",
      description: "Share our pinned launch announcement",
      points: 10,
      href: "https://twitter.com/intent/retweet?tweet_id=2015801792823726355",
    },
    {
      id: "quote_tweet",
      icon: Sparkles,
      title: "Quote Tweet about Stellaray",
      description: "Tell your followers why you're excited",
      points: 15,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just discovered @stellaraydotfun

A Stellar wallet that uses zero-knowledge proofs and Google login. No seed phrases to remember, no browser extensions needed.

This is what crypto onboarding should look like.

stellaray.fun`)}`,
      featured: true,
    },
    {
      id: "tag_friends",
      icon: Users,
      title: "Tag 3 Friends",
      description: "Invite your crypto friends to join",
      points: 10,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Hey @friend1 @friend2 @friend3

You need to check out @stellaraydotfun - finally a Stellar wallet that doesn't require seed phrases.

Just sign in with Google and you're ready to go.

stellaray.fun`)}`,
    },
    {
      id: "join_telegram",
      icon: Zap,
      title: "Join Telegram Channel",
      description: "Get instant notifications and updates",
      points: 10,
      href: "https://t.me/+s-GNuIDbQuQyYjU1",
    },
  ];

  // Referral tiers (adjusted for smaller pool)
  const referralTiers = [
    { count: 3, reward: 10, label: "Bronze Referrer" },
    { count: 10, reward: 30, label: "Silver Referrer" },
    { count: 25, reward: 75, label: "Gold Referrer" },
    { count: 50, reward: 150, label: "Diamond Referrer" },
  ];

  // Leaderboard data with Indian names
  const leaderboard = [
    { rank: 1, name: "Arjun.xlm", points: 185, referrals: 12 },
    { rank: 2, name: "Priya_crypto", points: 140, referrals: 9 },
    { rank: 3, name: "Rahul.stellar", points: 125, referrals: 7 },
    { rank: 4, name: "Ananya_web3", points: 95, referrals: 5 },
    { rank: 5, name: "Vikram.defi", points: 80, referrals: 4 },
  ];

  useEffect(() => {
    setIsVisible(true);
    // Generate referral code
    const code = "SR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferralCode(code);
  }, []);

  // Simulate slow live counter (increment by 1 every 15-30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => prev + 1);
    }, 15000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskComplete = useCallback((taskId: string, points: number) => {
    if (completedTasks.has(taskId)) return;

    setCompletedTasks((prev) => new Set([...prev, taskId]));
    setTotalEarned((prev) => prev + points);
  }, [completedTasks]);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://stellaray.fun/quests?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPossiblePoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const progressPercent = (totalEarned / totalPossiblePoints) * 100;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0">
        <ParticleField />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0066FF]/5 via-transparent to-[#00D4FF]/5" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header
        className={`relative z-10 px-4 sm:px-6 py-4 sm:py-5 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5">
                <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight">
              STELLA<span className="text-[#0066FF]">RAY</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00FF88] rounded-full animate-pulse" />
              <span className="text-[#00FF88] text-xs sm:text-sm font-medium">
                {liveCount} joined
              </span>
            </div>
            <Link
              href="/waitlist"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Waitlist
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-28">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div
            className={`text-center mb-8 sm:mb-12 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {/* Launch countdown */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full mb-4 sm:mb-6">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD700]" />
              <span className="text-[#FFD700] font-medium text-xs sm:text-sm">Rewards End In:</span>
              <CountdownTimer targetDate={launchDate} />
            </div>

            {/* Main headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Earn{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00D4FF]">
                Free XLM
              </span>
            </h1>
            <p className="text-white/50 text-sm sm:text-base lg:text-lg max-w-xl mx-auto mb-6 sm:mb-8 px-4">
              Complete quests, invite friends, and earn XLM rewards before launch.
            </p>

            {/* Reward pool display */}
            <div className="inline-flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-[#0066FF]/20 via-[#00D4FF]/20 to-[#0066FF]/20 rounded-xl sm:rounded-2xl border border-[#0066FF]/30">
              <div className="relative">
                <XLMLogo size={48} className="sm:hidden" />
                <XLMLogo size={64} className="hidden sm:block animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-[#00FF88] rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                </div>
              </div>
              <div className="text-left">
                <p className="text-white/50 text-xs sm:text-sm">Reward Pool</p>
                <p className="text-2xl sm:text-4xl font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">
                    1,000
                  </span>{" "}
                  <span className="text-white/60 text-base sm:text-xl">XLM</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              { label: "Your Earnings", value: `${totalEarned} XLM`, icon: Gift, color: "#FFD700" },
              { label: "Tasks Done", value: `${completedTasks.size}/${tasks.length}`, icon: Target, color: "#00FF88" },
              { label: "Your Rank", value: "#--", icon: Trophy, color: "#0066FF" },
              { label: "Referrals", value: "0", icon: Users, color: "#00D4FF" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <stat.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: stat.color }} />
                  <span className="text-white/40 text-[10px] sm:text-xs">{stat.label}</span>
                </div>
                <p className="text-base sm:text-xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div
            className={`mb-6 sm:mb-8 p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs sm:text-sm">Quest Progress</span>
              <span className="text-[#00FF88] font-medium text-xs sm:text-sm">
                {Math.round(progressPercent)}% Complete
              </span>
            </div>
            <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] to-[#00FF88] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-white/40 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
              Complete all tasks to maximize your allocation
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Tasks Column */}
            <div
              className={`lg:col-span-2 transition-all duration-700 delay-400 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
                  Quests
                </h2>
                <span className="text-white/40 text-xs sm:text-sm">
                  {totalPossiblePoints} XLM available
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    icon={task.icon}
                    title={task.title}
                    description={task.description}
                    points={task.points}
                    completed={completedTasks.has(task.id)}
                    href={task.href}
                    featured={task.featured}
                    onClick={() => handleTaskComplete(task.id, task.points)}
                  />
                ))}
              </div>

              {/* Referral Section */}
              <div className="mt-6 sm:mt-8">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-3 sm:mb-4">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                  Invite Friends
                </h2>

                <div className="p-4 sm:p-6 bg-gradient-to-br from-[#0066FF]/10 to-[#00D4FF]/10 rounded-xl sm:rounded-2xl border border-[#0066FF]/30">
                  <p className="text-white/60 text-sm sm:text-base mb-3 sm:mb-4">
                    Share your link. Earn <span className="text-[#FFD700] font-bold">5 XLM</span> for each friend!
                  </p>

                  {/* Referral link */}
                  <div className="flex gap-2 mb-4 sm:mb-6">
                    <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black/30 rounded-lg sm:rounded-xl border border-white/10 font-mono text-xs sm:text-sm text-white/60 truncate">
                      stellaray.fun/q?r={referralCode}
                    </div>
                    <button
                      onClick={handleCopyReferral}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-[#0066FF] rounded-lg sm:rounded-xl font-medium hover:bg-[#0066FF]/80 transition-colors flex items-center gap-1.5 sm:gap-2 text-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Referral tiers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {referralTiers.map((tier, i) => (
                      <div
                        key={tier.label}
                        className="p-2 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl border border-white/10 text-center"
                      >
                        <Award
                          className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-0.5 sm:mb-1"
                          style={{
                            color: i === 0 ? "#CD7F32" : i === 1 ? "#C0C0C0" : i === 2 ? "#FFD700" : "#00D4FF",
                          }}
                        />
                        <p className="text-[10px] sm:text-xs text-white/40">{tier.count}+ refs</p>
                        <p className="text-xs sm:text-sm font-bold text-[#FFD700]">+{tier.reward} XLM</p>
                      </div>
                    ))}
                  </div>

                  {/* Share buttons */}
                  <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Earning free XLM on @stellaraydotfun before launch.

Join with my referral link and we both get bonus rewards.

stellaray.fun/quests?ref=${referralCode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[#1DA1F2] rounded-lg sm:rounded-xl font-medium hover:bg-[#1DA1F2]/80 transition-colors text-sm"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="hidden sm:inline">Share on</span> Twitter
                    </a>
                    <button
                      onClick={handleCopyReferral}
                      className="px-4 py-2.5 sm:py-3 bg-white/10 rounded-lg sm:rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div
              className={`space-y-4 sm:space-y-6 transition-all duration-700 delay-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Leaderboard */}
              <div className="p-4 sm:p-5 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
                    Leaderboard
                  </h3>
                  <span className="text-white/40 text-[10px] sm:text-xs">Top 10 get bonuses</span>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  {leaderboard.map((user) => (
                    <LeaderboardRow key={user.rank} {...user} />
                  ))}
                </div>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                  <LeaderboardRow
                    rank={0}
                    name="You"
                    points={totalEarned}
                    referrals={0}
                    isCurrentUser
                  />
                </div>
              </div>

              {/* Bonus Info */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10 rounded-xl sm:rounded-2xl border border-[#FFD700]/30">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
                  <h3 className="font-bold text-sm sm:text-base">Early Bird Bonus</h3>
                </div>
                <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4">
                  Complete all quests before launch to get a <span className="text-[#FFD700] font-bold">1.5x multiplier</span> on your earnings!
                </p>
                <div className="flex items-center gap-2 text-[#FFD700] text-xs sm:text-sm font-medium">
                  <Gift className="w-4 h-4" />
                  <span>Potential: {Math.floor(totalEarned * 1.5)} XLM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent transition-all duration-700 delay-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="hidden sm:block">
            <p className="text-white/60 text-sm">
              <span className="text-[#00FF88] font-bold">{liveCount}</span> people earning XLM
            </p>
          </div>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Earning free XLM by completing quests on @stellaraydotfun

Zero-knowledge wallets on Stellar. Sign in with Google, no seed phrases.

Join the waitlist and earn rewards before launch.

stellaray.fun/quests`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0066FF] rounded-lg sm:rounded-xl font-semibold hover:bg-[#0066FF]/80 transition-colors w-full sm:w-auto text-sm sm:text-base"
          >
            <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
            Share & Earn
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
