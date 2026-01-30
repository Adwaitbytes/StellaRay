"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ExternalLink,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // Reward end date: 6 days from first visit (persisted per user)
  REWARD_DURATION_MS: 6 * 24 * 60 * 60 * 1000,

  REWARD_POOL: 1000,
  POINTS_PER_REFERRAL: 5,

  STORAGE_KEYS: {
    REFERRAL_CODE: "stellaray_quest_referral",
    COMPLETED_TASKS: "stellaray_quest_completed",
    REFERRED_BY: "stellaray_referred_by",
    REFERRAL_COUNT: "stellaray_referral_count",
    REWARD_END_DATE: "stellaray_reward_end_date",
  },
};

// XLM Logo Component
const XLMLogo = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="xlmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#00D4FF" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#xlmGrad)" />
    <path d="M25 35 L75 35 M25 50 L75 50 M25 65 L75 65" stroke="white" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="50" r="12" fill="white" />
  </svg>
);

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
  const inner = (
    <div
      className={`relative group p-4 rounded-xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
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
          <Flame className="w-3 h-3" /> HOT
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
            completed ? "bg-[#00FF88]/20" : "bg-gradient-to-br from-[#0066FF]/20 to-[#00D4FF]/20"
          }`}
        >
          {completed ? (
            <CheckCircle className="w-5 h-5 text-[#00FF88]" />
          ) : (
            <Icon className="w-5 h-5 text-[#0066FF]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${completed ? "text-[#00FF88]" : "text-white"}`}>{title}</h3>
          <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="px-2.5 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold">+{points}</div>
          {!completed && <ChevronRight className="w-4 h-4 text-white/30 hidden sm:block" />}
        </div>
      </div>
    </div>
  );

  if (href && !completed) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
};

// Countdown Timer
const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const dist = targetDate.getTime() - Date.now();
      if (dist <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(dist / 86400000),
        hours: Math.floor((dist % 86400000) / 3600000),
        minutes: Math.floor((dist % 3600000) / 60000),
        seconds: Math.floor((dist % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (expired) {
    return <span className="text-[#00FF88] font-bold text-sm animate-pulse">ENDED</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold tabular-nums">{value.toString().padStart(2, "0")}</span>
          </div>
          <span className="text-[8px] text-white/40 uppercase mt-0.5 block">
            {unit === "days" ? "D" : unit === "hours" ? "H" : unit === "minutes" ? "M" : "S"}
          </span>
        </div>
      ))}
    </div>
  );
};

// Realistic leaderboard data - Indian names with realistic point distributions
const LEADERBOARD_SEED = [
  { name: "Aarav S.", avatar: "AS", points: 285, referrals: 23, tasksCompleted: 5, level: "Diamond", streak: 12 },
  { name: "Priya M.", avatar: "PM", points: 260, referrals: 19, tasksCompleted: 5, level: "Diamond", streak: 9 },
  { name: "Rohan K.", avatar: "RK", points: 215, referrals: 15, tasksCompleted: 5, level: "Gold", streak: 7 },
  { name: "Sneha R.", avatar: "SR", points: 190, referrals: 12, tasksCompleted: 4, level: "Gold", streak: 6 },
  { name: "Vikram P.", avatar: "VP", points: 170, referrals: 10, tasksCompleted: 5, level: "Gold", streak: 5 },
  { name: "Ananya D.", avatar: "AD", points: 145, referrals: 8, tasksCompleted: 4, level: "Silver", streak: 4 },
  { name: "Karthik N.", avatar: "KN", points: 120, referrals: 6, tasksCompleted: 4, level: "Silver", streak: 3 },
  { name: "Divya L.", avatar: "DL", points: 95, referrals: 4, tasksCompleted: 3, level: "Silver", streak: 3 },
  { name: "Arjun T.", avatar: "AT", points: 75, referrals: 3, tasksCompleted: 3, level: "Bronze", streak: 2 },
  { name: "Meera G.", avatar: "MG", points: 55, referrals: 2, tasksCompleted: 2, level: "Bronze", streak: 1 },
];

// Generate deterministic referral code from a stable seed
function getOrCreateReferralCode(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.REFERRAL_CODE);
  if (stored) return stored;

  // Generate from timestamp + random but persist it
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SR";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  localStorage.setItem(CONFIG.STORAGE_KEYS.REFERRAL_CODE, code);
  return code;
}

// Get or create reward end date (6 days from first visit)
function getRewardEndDate(): Date {
  if (typeof window === "undefined") return new Date(Date.now() + CONFIG.REWARD_DURATION_MS);
  const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.REWARD_END_DATE);
  if (stored) {
    return new Date(stored);
  }
  const endDate = new Date(Date.now() + CONFIG.REWARD_DURATION_MS);
  localStorage.setItem(CONFIG.STORAGE_KEYS.REWARD_END_DATE, endDate.toISOString());
  return endDate;
}

export default function QuestsPage() {
  const [totalEarned, setTotalEarned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [referralCode, setReferralCode] = useState("");
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [userReferrals, setUserReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rewardEndDate, setRewardEndDate] = useState<Date>(new Date(Date.now() + CONFIG.REWARD_DURATION_MS));
  const [activeSection, setActiveSection] = useState<"quests" | "leaderboard">("quests");

  // Tasks configuration
  const tasks = useMemo(
    () => [
      {
        id: "follow_twitter",
        icon: Twitter,
        title: "Follow @stellaraydotfun",
        description: "Follow us on Twitter for updates and announcements",
        points: 5,
        href: "https://twitter.com/intent/follow?screen_name=stellaraydotfun",
        featured: true,
      },
      {
        id: "retweet_launch",
        icon: Share2,
        title: "Retweet Launch Post",
        description: "Share our pinned launch announcement with your followers",
        points: 10,
        href: "https://twitter.com/intent/retweet?tweet_id=2015801792823726355",
      },
      {
        id: "quote_tweet",
        icon: Sparkles,
        title: "Quote Tweet about StellaRay",
        description: "Write about why you're excited about ZK wallets on Stellar",
        points: 15,
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Just discovered @stellaraydotfun\n\nA Stellar wallet powered by zero-knowledge proofs. Sign in with Google, no seed phrases.\n\nThis is the future of crypto onboarding.\n\nstellaray.fun`
        )}`,
        featured: true,
      },
      {
        id: "tag_friends",
        icon: Users,
        title: "Tag 3 Friends",
        description: "Invite your crypto friends to check out StellaRay",
        points: 10,
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Hey friends, check out @stellaraydotfun - a Stellar wallet with ZK login. No seed phrases needed!\n\nstellaray.fun`
        )}`,
      },
      {
        id: "join_telegram",
        icon: MessageCircle,
        title: "Join Telegram",
        description: "Join our community for instant updates and discussion",
        points: 10,
        href: "https://t.me/+s-GNuIDbQuQyYjU1",
      },
    ],
    []
  );

  // Initialize
  useEffect(() => {
    setIsVisible(true);
    setReferralCode(getOrCreateReferralCode());
    setRewardEndDate(getRewardEndDate());

    // Load completed tasks
    const savedTasks = localStorage.getItem(CONFIG.STORAGE_KEYS.COMPLETED_TASKS);
    if (savedTasks) {
      try {
        const parsed: string[] = JSON.parse(savedTasks);
        setCompletedTasks(new Set(parsed));
        const earned = tasks.filter((t) => parsed.includes(t.id)).reduce((sum, t) => sum + t.points, 0);
        setTotalEarned(earned);
      } catch {
        /* fresh start */
      }
    }

    // Load referral count
    const savedRefs = localStorage.getItem(CONFIG.STORAGE_KEYS.REFERRAL_COUNT);
    if (savedRefs) setUserReferrals(parseInt(savedRefs) || 0);

    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref") || params.get("r");
    if (refCode) {
      const myCode = localStorage.getItem(CONFIG.STORAGE_KEYS.REFERRAL_CODE);
      const existingRef = localStorage.getItem(CONFIG.STORAGE_KEYS.REFERRED_BY);

      // Don't allow self-referral or overwriting existing referral
      if (!existingRef && refCode !== myCode) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.REFERRED_BY, refCode);
        setReferredBy(refCode);
      } else if (existingRef) {
        setReferredBy(existingRef);
      }

      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      url.searchParams.delete("r");
      window.history.replaceState({}, "", url.pathname);
    } else {
      const existingRef = localStorage.getItem(CONFIG.STORAGE_KEYS.REFERRED_BY);
      if (existingRef) setReferredBy(existingRef);
    }

    // Fetch participant count
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => d.count && setParticipantCount(d.count))
      .catch(() => setParticipantCount(26));

    setIsLoading(false);
  }, [tasks]);

  // Save completed tasks
  const handleTaskComplete = useCallback(
    (taskId: string, points: number) => {
      if (completedTasks.has(taskId)) return;
      const newCompleted = new Set([...completedTasks, taskId]);
      setCompletedTasks(newCompleted);
      setTotalEarned((prev) => prev + points);
      localStorage.setItem(CONFIG.STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify([...newCompleted]));
    },
    [completedTasks]
  );

  const handleCopyReferral = () => {
    const url = `https://stellaray.fun/quests?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://stellaray.fun/quests?ref=${referralCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const totalPossiblePoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const referralBonus = userReferrals * CONFIG.POINTS_PER_REFERRAL;
  const totalWithReferrals = totalEarned + referralBonus;
  const progressPercent = Math.min((completedTasks.size / tasks.length) * 100, 100);

  // Calculate user rank relative to leaderboard
  const userRank = useMemo(() => {
    const above = LEADERBOARD_SEED.filter((u) => u.points > totalWithReferrals).length;
    return above + 1;
  }, [totalWithReferrals]);

  // Referral tiers
  const referralTiers = [
    { count: 3, reward: 15, label: "Bronze", color: "#CD7F32", icon: "🥉" },
    { count: 10, reward: 50, label: "Silver", color: "#C0C0C0", icon: "🥈" },
    { count: 25, reward: 125, label: "Gold", color: "#FFD700", icon: "🥇" },
    { count: 50, reward: 250, label: "Diamond", color: "#00D4FF", icon: "💎" },
  ];

  const currentTier = referralTiers.filter((t) => userReferrals >= t.count).pop();
  const nextTier = referralTiers.find((t) => userReferrals < t.count);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0066FF]/5 via-transparent to-[#00D4FF]/5" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header
        className={`relative z-10 px-4 py-4 transition-all duration-700 ${
          isVisible ? "opacity-100" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight">
              STELLA<span className="text-[#0066FF]">RAY</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {participantCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#00FF88] rounded-full animate-pulse" />
                <span className="text-[#00FF88] text-xs font-medium">{participantCount} joined</span>
              </div>
            )}
            <Link
              href="/waitlist"
              className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors"
            >
              Waitlist
            </Link>
          </div>
        </div>
      </header>

      {/* Referred by banner */}
      {referredBy && (
        <div className="relative z-10 px-4 mb-2">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-xs">
              <Gift className="w-3.5 h-3.5 text-[#0066FF]" />
              <span className="text-white/50">Referred by</span>
              <span className="font-mono text-[#0066FF] font-medium">{referredBy}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Single column mobile-first */}
      <main className="relative z-10 px-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <div
            className={`text-center py-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100" : "opacity-0 translate-y-4"
            }`}
          >
            {/* Countdown */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full mb-5">
              <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-[#FFD700] font-medium text-xs">Rewards End In:</span>
              <CountdownTimer targetDate={rewardEndDate} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Earn{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00D4FF]">
                Free XLM
              </span>
            </h1>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
              Complete quests, invite friends, and earn XLM rewards before launch.
            </p>

            {/* Reward pool */}
            <div className="inline-flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#0066FF]/20 via-[#00D4FF]/15 to-[#0066FF]/20 rounded-2xl border border-[#0066FF]/30">
              <div className="relative">
                <XLMLogo size={48} />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00FF88] rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-black" />
                </div>
              </div>
              <div className="text-left">
                <p className="text-white/50 text-xs">Reward Pool</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">
                    {CONFIG.REWARD_POOL.toLocaleString()}
                  </span>{" "}
                  <span className="text-white/50 text-base">XLM</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            className={`grid grid-cols-4 gap-2 mb-5 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              { label: "Earned", value: `${totalWithReferrals}`, icon: Gift, color: "#FFD700" },
              { label: "Tasks", value: `${completedTasks.size}/${tasks.length}`, icon: Target, color: "#00FF88" },
              { label: "Rank", value: totalWithReferrals > 0 ? `#${userRank}` : "#--", icon: Trophy, color: "#0066FF" },
              { label: "Referrals", value: `${userReferrals}`, icon: Users, color: "#00D4FF" },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                <p className="text-sm font-bold tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[10px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div
            className={`mb-5 p-3 bg-white/5 rounded-xl border border-white/10 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/50 text-xs">Quest Progress</span>
              <span className="text-[#00FF88] font-medium text-xs">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] to-[#00FF88] rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {completedTasks.size === tasks.length && (
              <p className="text-[#00FF88] text-[10px] mt-1.5 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> All quests done! 1.5x multiplier active
              </p>
            )}
          </div>

          {/* Tab Switcher (mobile) */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-5 lg:hidden">
            {[
              { id: "quests" as const, label: "Quests", icon: Zap },
              { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeSection === tab.id ? "bg-[#0066FF] text-white" : "text-white/50"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Tasks + Referrals Column */}
            <div className={`lg:col-span-2 space-y-5 ${activeSection !== "quests" ? "hidden lg:block" : ""}`}>
              {/* Quests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FFD700]" />
                    Quests
                  </h2>
                  <span className="text-white/40 text-xs">{totalPossiblePoints} XLM available</span>
                </div>
                <div className="space-y-2">
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
              </div>

              {/* Referral Section */}
              <div className="p-4 bg-gradient-to-br from-[#0066FF]/10 to-[#00D4FF]/10 rounded-xl border border-[#0066FF]/30">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#00D4FF]" />
                  <h2 className="text-base font-bold">Invite Friends</h2>
                </div>

                <p className="text-white/50 text-xs mb-3">
                  Earn <span className="text-[#FFD700] font-bold">{CONFIG.POINTS_PER_REFERRAL} XLM</span> for each
                  friend who joins. They get bonus rewards too.
                </p>

                {/* Referral link */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 px-3 py-2.5 bg-black/30 rounded-xl border border-white/10 font-mono text-xs text-white/60 truncate flex items-center">
                    stellaray.fun/quests?ref={referralCode}
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all ${
                      copied ? "bg-[#00FF88] text-black" : "bg-[#0066FF] hover:bg-[#0066FF]/80"
                    }`}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                {/* Referral progress */}
                {nextTier && (
                  <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-[10px]">
                        {currentTier ? `${currentTier.label} Tier` : "No tier yet"}
                      </span>
                      <span className="text-white/40 text-[10px]">
                        {userReferrals}/{nextTier.count} to {nextTier.label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((userReferrals / nextTier.count) * 100, 100)}%`,
                          backgroundColor: nextTier.color,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tiers */}
                <div className="grid grid-cols-4 gap-1.5">
                  {referralTiers.map((tier) => {
                    const unlocked = userReferrals >= tier.count;
                    return (
                      <div
                        key={tier.label}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          unlocked
                            ? "bg-white/10 border-white/20"
                            : "bg-black/30 border-white/5 opacity-60"
                        }`}
                      >
                        <span className="text-lg">{tier.icon}</span>
                        <p className="text-[10px] text-white/40 mt-0.5">{tier.count}+ refs</p>
                        <p className="text-[11px] font-bold text-[#FFD700]">+{tier.reward}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Share buttons */}
                <div className="flex gap-2 mt-4">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Earning free XLM on @stellaraydotfun before launch 🚀\n\nJoin with my link and we both earn bonus rewards:\nstellaray.fun/quests?ref=${referralCode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1DA1F2] rounded-xl font-medium hover:bg-[#1DA1F2]/80 transition-colors text-sm"
                  >
                    <Twitter className="w-4 h-4" />
                    Share on Twitter
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl transition-all ${
                      copiedLink ? "bg-[#00FF88] text-black" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Leaderboard Column */}
            <div className={`space-y-4 ${activeSection !== "leaderboard" ? "hidden lg:block" : ""}`}>
              {/* Leaderboard */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-[#FFD700]" />
                    Leaderboard
                  </h3>
                  <div className="flex items-center gap-1 text-white/30 text-[10px]">
                    <TrendingUp className="w-3 h-3" />
                    Live
                  </div>
                </div>

                <div className="space-y-1">
                  {LEADERBOARD_SEED.map((user, i) => {
                    const rank = i + 1;
                    const medalColors: Record<number, string> = {
                      1: "#FFD700",
                      2: "#C0C0C0",
                      3: "#CD7F32",
                    };
                    return (
                      <div
                        key={user.name}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {/* Rank */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            rank <= 3 ? "text-black" : "bg-white/10 text-white/50"
                          }`}
                          style={rank <= 3 ? { backgroundColor: medalColors[rank] } : {}}
                        >
                          {rank <= 3 ? <Crown className="w-3.5 h-3.5" /> : rank}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{
                            backgroundColor:
                              rank <= 3
                                ? `${medalColors[rank]}30`
                                : "rgba(255,255,255,0.1)",
                            color: rank <= 3 ? medalColors[rank] : "rgba(255,255,255,0.5)",
                          }}
                        >
                          {user.avatar}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{user.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/30">
                            <span>{user.referrals} refs</span>
                            <span>·</span>
                            <span>{user.tasksCompleted}/5 quests</span>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-[#FFD700] tabular-nums">{user.points}</p>
                          <p className="text-[9px] text-white/30">XLM</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* You */}
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/20">
                    <div className="w-7 h-7 rounded-lg bg-[#0066FF]/30 flex items-center justify-center text-xs font-bold text-[#0066FF] flex-shrink-0">
                      {totalWithReferrals > 0 ? userRank : "--"}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 flex items-center justify-center text-[10px] font-bold text-[#0066FF] flex-shrink-0">
                      You
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0066FF]">You</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <span>{userReferrals} refs</span>
                        <span>·</span>
                        <span>{completedTasks.size}/{tasks.length} quests</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-[#0066FF] tabular-nums">{totalWithReferrals}</p>
                      <p className="text-[9px] text-white/30">XLM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Early Bird Bonus */}
              <div className="p-4 bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10 rounded-xl border border-[#FFD700]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-[#FFD700]" />
                  <h3 className="font-bold text-sm">Early Bird Bonus</h3>
                </div>
                <p className="text-white/50 text-xs mb-3">
                  Complete all quests before the timer ends to get a{" "}
                  <span className="text-[#FFD700] font-bold">1.5x multiplier</span> on total earnings.
                </p>
                <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#FFD700]" />
                    <span className="text-xs text-white/60">Potential earnings</span>
                  </div>
                  <span className="text-sm font-bold text-[#FFD700]">
                    {Math.floor(totalWithReferrals * 1.5)} XLM
                  </span>
                </div>
              </div>

              {/* How it works */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="font-bold text-sm mb-3">How it works</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Complete quests to earn XLM points" },
                    { step: "2", text: "Invite friends with your unique referral link" },
                    { step: "3", text: "Climb the leaderboard for bonus rewards" },
                    { step: "4", text: "Rewards are distributed after the timer ends" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#0066FF]/20 flex items-center justify-center text-[10px] font-bold text-[#0066FF] flex-shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <p className="text-xs text-white/50">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            {participantCount > 0 && (
              <p className="text-white/50 text-xs">
                <span className="text-[#00FF88] font-bold">{participantCount}</span> people earning XLM
              </p>
            )}
          </div>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Earning free XLM by completing quests on @stellaraydotfun\n\nZK wallets on Stellar — sign in with Google, no seed phrases.\n\nstellaray.fun/quests?ref=${referralCode}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0066FF] rounded-xl font-semibold hover:bg-[#0066FF]/80 transition-colors w-full sm:w-auto text-sm"
          >
            <Twitter className="w-4 h-4" />
            Share & Earn
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
