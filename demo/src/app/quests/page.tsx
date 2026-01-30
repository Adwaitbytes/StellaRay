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
  Flame,
  Crown,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Mail,
  LogIn,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───
interface QuestUser {
  email: string;
  name: string;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  completedTasks: string[];
  totalPoints: number;
  rank: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  referrals: number;
  tasksCompleted: number;
}

// ─── Constants ───
const POINTS_PER_REFERRAL = 5;
const REWARD_POOL = 1000;

const TASKS = [
  {
    id: "follow_twitter",
    icon: Twitter,
    title: "Follow @stellaraydotfun",
    description: "Follow us on Twitter for updates",
    points: 5,
    href: "https://twitter.com/intent/follow?screen_name=stellaraydotfun",
    featured: true,
  },
  {
    id: "retweet_launch",
    icon: Share2,
    title: "Retweet Launch Post",
    description: "Share our pinned announcement",
    points: 10,
    href: "https://twitter.com/intent/retweet?tweet_id=2015801792823726355",
  },
  {
    id: "quote_tweet",
    icon: Sparkles,
    title: "Quote Tweet about StellaRay",
    description: "Tell your followers about ZK wallets on Stellar",
    points: 15,
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      "Just discovered @stellaraydotfun\n\nA Stellar wallet powered by zero-knowledge proofs. Sign in with Google, no seed phrases.\n\nstellaray.fun"
    )}`,
    featured: true,
  },
  {
    id: "tag_friends",
    icon: Users,
    title: "Tag 3 Friends",
    description: "Invite your crypto friends",
    points: 10,
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      "Hey friends, check out @stellaraydotfun - ZK wallet on Stellar. No seed phrases!\n\nstellaray.fun"
    )}`,
  },
  {
    id: "join_telegram",
    icon: MessageCircle,
    title: "Join Telegram",
    description: "Join our community channel",
    points: 10,
    href: "https://t.me/+s-GNuIDbQuQyYjU1",
  },
];

const REFERRAL_TIERS = [
  { count: 3, reward: 15, label: "Bronze", color: "#CD7F32", emoji: "\u{1F949}" },
  { count: 10, reward: 50, label: "Silver", color: "#C0C0C0", emoji: "\u{1F948}" },
  { count: 25, reward: 125, label: "Gold", color: "#FFD700", emoji: "\u{1F947}" },
  { count: 50, reward: 250, label: "Diamond", color: "#00D4FF", emoji: "\u{1F48E}" },
];

// ─── XLM Logo ───
const XLMLogo = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="xlmG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#00D4FF" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#xlmG)" />
    <path d="M25 35 L75 35 M25 50 L75 50 M25 65 L75 65" stroke="white" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="50" r="12" fill="white" />
  </svg>
);

// ─── Countdown Timer ───
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [tl, setTl] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const dist = new Date(targetDate).getTime() - Date.now();
      if (dist <= 0) { setExpired(true); return; }
      setTl({
        d: Math.floor(dist / 86400000),
        h: Math.floor((dist % 86400000) / 3600000),
        m: Math.floor((dist % 3600000) / 60000),
        s: Math.floor((dist % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (expired) return <span className="text-red-400 font-bold text-xs">ENDED</span>;

  return (
    <div className="flex items-center gap-1">
      {[
        { v: tl.d, l: "D" }, { v: tl.h, l: "H" }, { v: tl.m, l: "M" }, { v: tl.s, l: "S" },
      ].map((u) => (
        <div key={u.l} className="text-center">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold tabular-nums">{u.v.toString().padStart(2, "0")}</span>
          </div>
          <span className="text-[7px] text-white/30 uppercase block mt-0.5">{u.l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Task Card ───
function TaskCard({
  icon: Icon, title, description, points, completed, onClick, href, featured, loading,
}: {
  icon: React.ElementType; title: string; description: string; points: number;
  completed: boolean; onClick?: () => void; href?: string; featured?: boolean; loading?: boolean;
}) {
  const inner = (
    <div
      className={`relative group p-3.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
        completed
          ? "bg-[#00FF88]/5 border-[#00FF88]/20"
          : featured
          ? "bg-gradient-to-r from-[#0066FF]/15 to-transparent border-[#0066FF]/30 hover:border-[#0066FF]/60"
          : "bg-white/[0.03] border-white/10 hover:border-white/20"
      }`}
      onClick={onClick}
    >
      {featured && !completed && (
        <div className="absolute -top-1.5 right-3 px-1.5 py-0.5 bg-[#0066FF] rounded text-[9px] font-bold flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5" /> HOT
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          completed ? "bg-[#00FF88]/15" : "bg-[#0066FF]/10"
        }`}>
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#0066FF] animate-spin" />
          ) : completed ? (
            <CheckCircle className="w-4 h-4 text-[#00FF88]" />
          ) : (
            <Icon className="w-4 h-4 text-[#0066FF]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-[13px] ${completed ? "text-[#00FF88]/80" : "text-white"}`}>{title}</h3>
          <p className="text-white/40 text-[11px] line-clamp-1">{description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            completed ? "bg-[#00FF88]/15 text-[#00FF88]/70" : "bg-[#FFD700]/15 text-[#FFD700]"
          }`}>
            +{points}
          </div>
          {!completed && <ChevronRight className="w-3.5 h-3.5 text-white/20 hidden sm:block" />}
        </div>
      </div>
    </div>
  );

  if (href && !completed) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return inner;
}

// ─── Leaderboard Row ───
function LeaderRow({ entry }: { entry: LeaderboardEntry }) {
  const medalColors: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const initials = entry.name.split(/[\s._]+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          entry.rank <= 3 ? "text-black" : "bg-white/[0.06] text-white/40"
        }`}
        style={entry.rank <= 3 ? { backgroundColor: medalColors[entry.rank] } : {}}
      >
        {entry.rank <= 3 ? <Crown className="w-3 h-3" /> : entry.rank}
      </div>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
        style={{
          backgroundColor: entry.rank <= 3 ? `${medalColors[entry.rank]}20` : "rgba(255,255,255,0.06)",
          color: entry.rank <= 3 ? medalColors[entry.rank] : "rgba(255,255,255,0.4)",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium truncate">{entry.name}</p>
        <p className="text-[9px] text-white/25">{entry.referrals} refs · {entry.tasksCompleted}/5</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[11px] font-bold text-[#FFD700] tabular-nums">{entry.points}</p>
        <p className="text-[8px] text-white/20">XLM</p>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function QuestsPage() {
  const [questEmail, setQuestEmail] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [user, setUser] = useState<QuestUser | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [rewardEndDate, setRewardEndDate] = useState("2026-02-05T23:59:59Z");

  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"quests" | "leaderboard">("quests");
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [referredByCode, setReferredByCode] = useState<string | null>(null);

  // Grab ?ref= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("r");
    if (ref) {
      setReferredByCode(ref);
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      url.searchParams.delete("r");
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  // Check localStorage for saved email on mount
  useEffect(() => {
    setIsVisible(true);
    const savedEmail = localStorage.getItem("stellaray_quest_email");
    if (savedEmail) {
      setQuestEmail(savedEmail);
      setIsRegistered(true);
      fetchQuestData(savedEmail);
    } else {
      fetchQuestData(null);
      setPageLoading(false);
    }
  }, []);

  const fetchQuestData = useCallback(async (email: string | null) => {
    try {
      const url = email ? `/api/quests?email=${encodeURIComponent(email)}` : "/api/quests";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setTotalParticipants(data.totalParticipants || 0);
        if (data.rewardEndDate) setRewardEndDate(data.rewardEndDate);
        if (data.user) { setUser(data.user); setIsRegistered(true); }
      }
    } catch { /* silent */ } finally { setPageLoading(false); }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questEmail || registering) return;
    setRegistering(true);
    setRegisterError("");
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: questEmail, name: questEmail.split("@")[0], referredBy: referredByCode }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("stellaray_quest_email", questEmail);
        setIsRegistered(true);
        await fetchQuestData(questEmail);
      } else {
        setRegisterError(data.error || "Registration failed");
      }
    } catch { setRegisterError("Network error"); } finally { setRegistering(false); }
  };

  const handleTaskComplete = useCallback(async (taskId: string) => {
    if (!user || user.completedTasks.includes(taskId) || completingTask) return;
    setCompletingTask(taskId);
    try {
      const res = await fetch("/api/quests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, taskId }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((p) => p ? { ...p, completedTasks: data.completedTasks || [...p.completedTasks, taskId], totalPoints: data.totalPoints } : p);
        fetchQuestData(user.email);
      }
    } catch { /* silent */ } finally { setCompletingTask(null); }
  }, [user, completingTask, fetchQuestData]);

  const handleCopy = () => {
    if (!user) return;
    navigator.clipboard.writeText(`https://stellaray.fun/quests?ref=${user.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShare = () => {
    if (!user) return;
    navigator.clipboard.writeText(`https://stellaray.fun/quests?ref=${user.referralCode}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const totalPossible = TASKS.reduce((s, t) => s + t.points, 0);
  const completedCount = user?.completedTasks.length || 0;
  const progressPct = Math.min((completedCount / TASKS.length) * 100, 100);
  const nextTier = REFERRAL_TIERS.find((t) => (user?.referralCount || 0) < t.count);
  const currentTier = REFERRAL_TIERS.filter((t) => (user?.referralCount || 0) >= t.count).pop();

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0066FF]/5 via-transparent to-[#00D4FF]/5" />
      </div>

      {/* Header */}
      <header className={`relative z-10 px-4 py-3 transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-bold">STELLA<span className="text-[#0066FF]">RAY</span></span>
          </Link>
          <div className="flex items-center gap-2">
            {totalParticipants > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#00FF88] rounded-full animate-pulse" />
                <span className="text-[#00FF88] text-[11px] font-medium">{totalParticipants} joined</span>
              </div>
            )}
            <Link href="/waitlist" className="px-3 py-1.5 bg-white/10 rounded-lg text-[11px] font-medium hover:bg-white/15 transition-colors">Waitlist</Link>
          </div>
        </div>
      </header>

      {/* Referred by */}
      {referredByCode && !isRegistered && (
        <div className="relative z-10 px-4 mb-2">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-lg px-3 py-1.5 flex items-center justify-center gap-2 text-[11px]">
              <Gift className="w-3 h-3 text-[#0066FF]" />
              <span className="text-white/40">Invited by</span>
              <span className="font-mono text-[#0066FF] font-medium">{referredByCode}</span>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <div className={`text-center py-5 transition-all duration-500 delay-100 ${isVisible ? "opacity-100" : "opacity-0 translate-y-4"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-full mb-4">
              <Clock className="w-3 h-3 text-[#FFD700]" />
              <span className="text-[#FFD700] font-medium text-[11px]">Rewards End In:</span>
              <CountdownTimer targetDate={rewardEndDate} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">
              Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00D4FF]">Free XLM</span>
            </h1>
            <p className="text-white/40 text-sm mb-5">Complete quests, invite friends, earn rewards.</p>
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#0066FF]/15 to-[#0066FF]/5 rounded-xl border border-[#0066FF]/20">
              <XLMLogo size={40} />
              <div className="text-left">
                <p className="text-white/40 text-[10px]">Reward Pool</p>
                <p className="text-xl font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">{REWARD_POOL.toLocaleString()}</span>
                  <span className="text-white/40 text-sm ml-1">XLM</span>
                </p>
              </div>
            </div>
          </div>

          {/* Registration Gate */}
          {!isRegistered ? (
            <div className={`transition-all duration-500 delay-200 ${isVisible ? "opacity-100" : "opacity-0 translate-y-4"}`}>
              <div className="p-5 bg-white/[0.03] rounded-xl border border-white/10 max-w-sm mx-auto">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-5 h-5 text-[#0066FF]" />
                  </div>
                  <h2 className="font-bold text-base">Enter your email to start</h2>
                  <p className="text-white/40 text-xs mt-1">Your progress is saved to the cloud</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <input
                    type="email"
                    value={questEmail}
                    onChange={(e) => setQuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/20 focus:outline-none focus:border-[#0066FF]/50 transition-colors"
                  />
                  {registerError && <p className="text-red-400 text-xs">{registerError}</p>}
                  <button type="submit" disabled={registering || !questEmail}
                    className="w-full py-2.5 bg-[#0066FF] rounded-xl font-semibold text-sm hover:bg-[#0066FF]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {registering ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : <><LogIn className="w-4 h-4" /> Start Earning</>}
                  </button>
                </form>
                <p className="text-white/20 text-[10px] text-center mt-3">Email is only used for quest tracking</p>
              </div>

              {leaderboard.length > 0 && (
                <div className="mt-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-[#FFD700]" /> Top Earners
                  </h3>
                  <div className="space-y-0.5">
                    {leaderboard.slice(0, 5).map((entry) => <LeaderRow key={entry.rank} entry={entry} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`transition-all duration-500 delay-200 ${isVisible ? "opacity-100" : "opacity-0 translate-y-4"}`}>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {[
                  { label: "Earned", value: user?.totalPoints || 0, icon: Gift, color: "#FFD700" },
                  { label: "Tasks", value: `${completedCount}/${TASKS.length}`, icon: Target, color: "#00FF88" },
                  { label: "Rank", value: user?.rank ? `#${user.rank}` : "#--", icon: Trophy, color: "#0066FF" },
                  { label: "Refs", value: user?.referralCount || 0, icon: Users, color: "#00D4FF" },
                ].map((s) => (
                  <div key={s.label} className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] text-center">
                    <s.icon className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: s.color }} />
                    <p className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] text-white/30">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="mb-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/40 text-[11px]">Quest Progress</span>
                  <span className="text-[#00FF88] font-medium text-[11px]">{Math.round(progressPct)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#00FF88] rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
                {completedCount === TASKS.length && (
                  <p className="text-[#00FF88] text-[10px] mt-1 font-medium flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> 1.5x multiplier active!</p>
                )}
              </div>

              {/* Mobile Tabs */}
              <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg border border-white/[0.06] mb-4 lg:hidden">
                {([{ id: "quests" as const, label: "Quests", icon: Zap }, { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy }]).map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-[11px] font-medium transition-all ${activeTab === tab.id ? "bg-[#0066FF] text-white" : "text-white/40"}`}>
                    <tab.icon className="w-3 h-3" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                {/* Quests + Referrals */}
                <div className={`lg:col-span-2 space-y-4 ${activeTab !== "quests" ? "hidden lg:block" : ""}`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-bold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#FFD700]" /> Quests</h2>
                      <span className="text-white/30 text-[11px]">{totalPossible} XLM available</span>
                    </div>
                    <div className="space-y-1.5">
                      {TASKS.map((task) => (
                        <TaskCard key={task.id} icon={task.icon} title={task.title} description={task.description} points={task.points}
                          completed={user?.completedTasks.includes(task.id) || false} href={task.href} featured={task.featured}
                          loading={completingTask === task.id} onClick={() => handleTaskComplete(task.id)} />
                      ))}
                    </div>
                  </div>

                  {/* Referrals */}
                  <div className="p-4 bg-gradient-to-br from-[#0066FF]/10 to-transparent rounded-xl border border-[#0066FF]/20">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-[#00D4FF]" />
                      <h2 className="text-sm font-bold">Invite Friends</h2>
                    </div>
                    <p className="text-white/40 text-[11px] mb-3">
                      Earn <span className="text-[#FFD700] font-bold">{POINTS_PER_REFERRAL} XLM</span> per friend who joins.
                    </p>
                    <div className="flex gap-1.5 mb-3">
                      <div className="flex-1 px-3 py-2 bg-black/30 rounded-lg border border-white/[0.06] font-mono text-[11px] text-white/50 truncate flex items-center">
                        stellaray.fun/quests?ref={user?.referralCode}
                      </div>
                      <button onClick={handleCopy}
                        className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${copied ? "bg-[#00FF88] text-black" : "bg-[#0066FF] hover:bg-[#0066FF]/80"}`}>
                        {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    {nextTier && (
                      <div className="mb-3 p-2.5 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/30 text-[9px]">{currentTier ? currentTier.label : "No tier"}</span>
                          <span className="text-white/30 text-[9px]">{user?.referralCount || 0}/{nextTier.count} to {nextTier.label}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(((user?.referralCount || 0) / nextTier.count) * 100, 100)}%`, backgroundColor: nextTier.color }} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-1">
                      {REFERRAL_TIERS.map((tier) => (
                        <div key={tier.label} className={`p-1.5 rounded-lg border text-center ${(user?.referralCount || 0) >= tier.count ? "bg-white/10 border-white/15" : "bg-black/20 border-white/5 opacity-50"}`}>
                          <span className="text-base">{tier.emoji}</span>
                          <p className="text-[9px] text-white/30">{tier.count}+</p>
                          <p className="text-[10px] font-bold text-[#FFD700]">+{tier.reward}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Earning free XLM on @stellaraydotfun!\n\nJoin:\nstellaray.fun/quests?ref=${user?.referralCode}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1DA1F2] rounded-lg text-xs font-medium hover:bg-[#1DA1F2]/80 transition-colors">
                        <Twitter className="w-3.5 h-3.5" /> Share on Twitter
                      </a>
                      <button onClick={handleCopyShare}
                        className={`px-3 py-2 rounded-lg transition-all ${copiedShare ? "bg-[#00FF88] text-black" : "bg-white/10 hover:bg-white/15"}`}>
                        {copiedShare ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className={`space-y-4 ${activeTab !== "leaderboard" ? "hidden lg:block" : ""}`}>
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-[#FFD700]" /> Leaderboard</h3>
                      <div className="flex items-center gap-1 text-white/20 text-[9px]"><TrendingUp className="w-2.5 h-2.5" /> Live</div>
                    </div>
                    {leaderboard.length > 0 ? (
                      <div className="space-y-0.5">{leaderboard.map((e) => <LeaderRow key={e.rank} entry={e} />)}</div>
                    ) : (
                      <div className="text-center py-6">
                        <Trophy className="w-6 h-6 text-white/10 mx-auto mb-2" />
                        <p className="text-white/20 text-xs">Be the first!</p>
                      </div>
                    )}
                    {user && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/15">
                          <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 flex items-center justify-center text-[9px] font-bold text-[#0066FF]">{user.rank || "--"}</div>
                          <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 flex items-center justify-center text-[8px] font-bold text-[#0066FF]">You</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#0066FF] truncate">{user.name}</p>
                            <p className="text-[9px] text-white/25">{user.referralCount} refs · {completedCount}/{TASKS.length}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-[#0066FF] tabular-nums">{user.totalPoints}</p>
                            <p className="text-[8px] text-white/20">XLM</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-[#FFD700]/10 to-transparent rounded-xl border border-[#FFD700]/20">
                    <div className="flex items-center gap-1.5 mb-1.5"><Star className="w-3.5 h-3.5 text-[#FFD700]" /><h3 className="font-bold text-xs">Early Bird Bonus</h3></div>
                    <p className="text-white/40 text-[11px] mb-2">Complete all quests for <span className="text-[#FFD700] font-bold">1.5x multiplier</span>.</p>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                      <span className="text-[11px] text-white/40 flex items-center gap-1"><Gift className="w-3 h-3 text-[#FFD700]" /> Potential</span>
                      <span className="text-sm font-bold text-[#FFD700]">{Math.floor((user?.totalPoints || 0) * 1.5)} XLM</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                    <h3 className="font-bold text-xs mb-2.5">How it works</h3>
                    <div className="space-y-2.5">
                      {["Complete quests to earn XLM", "Invite friends with your link", "Climb the leaderboard", "Rewards sent when timer ends"].map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#0066FF]/15 flex items-center justify-center text-[8px] font-bold text-[#0066FF] flex-shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-[11px] text-white/40">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom CTA */}
      {isRegistered && user && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="hidden sm:block flex-1">
              <p className="text-white/40 text-xs"><span className="text-[#00FF88] font-bold">{totalParticipants}</span> people earning XLM</p>
            </div>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Earning free XLM on @stellaraydotfun!\nstellaray.fun/quests?ref=${user.referralCode}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0066FF] rounded-xl font-semibold text-sm hover:bg-[#0066FF]/80 transition-colors w-full sm:w-auto">
              <Twitter className="w-4 h-4" /> Share & Earn <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
