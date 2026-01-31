"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Zap,
  Shield,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Lock,
  ArrowUpRight,
  ArrowRight,
  Mail,
  Clock,
  BarChart3,
  ChevronRight,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  Code,
  Link2,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { PRICING } from "@/config/pricing";

// Types
interface AdminStats {
  overview: {
    totalSignups: number;
    todaySignups: number;
    weekSignups: number;
    growthRate: number;
  };
  waitlist: {
    bySource: Array<{ source: string; count: number }>;
    byDevice: Array<{ device_type: string; count: number }>;
    byBrowser: Array<{ browser: string; count: number }>;
    byCountry: Array<{ country: string; count: number }>;
    daily: Array<{ date: string; signups: number }>;
  };
  payments: {
    links: { total: number; active: number; paid: number; volume: number };
    streams: { total: number; active: number; completed: number; volume: number };
  };
  revenue: {
    paymentFees: number;
    streamFees: number;
    total: number;
  };
  recentSignups: Array<{
    email: string;
    source: string;
    device_type: string;
    browser: string;
    country: string;
    created_at: string;
    referral_code: string;
  }>;
}

interface AuthenticatedUser {
  google_email: string;
  google_name: string | null;
  google_picture: string | null;
  wallet_address: string;
  network: string;
  first_login_at: string;
  last_login_at: string;
  login_count: number;
  country: string | null;
  device_type: string | null;
}

interface UsersData {
  overview: {
    totalUsers: number;
    todayNewUsers: number;
    weekNewUsers: number;
    activeUsers: number;
    repeatUsers: number;
  };
  users: AuthenticatedUser[];
  analytics: {
    byCountry: Array<{ country: string; count: number }>;
    byDevice: Array<{ device_type: string; count: number }>;
    dailyLogins: Array<{ date: string; users: number }>;
  };
}

// Stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              trend.value >= 0
                ? "bg-[#00FF88]/10 text-[#00FF88]"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5">{value}</p>
      <p className="text-white/40 text-sm">{title}</p>
      {subtitle && <p className="text-white/30 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

// Mini bar chart
function MiniBarChart({
  data,
  color,
  maxBars = 14,
}: {
  data: Array<{ date: string; signups: number }>;
  color: string;
  maxBars?: number;
}) {
  const chartData = data.slice(-maxBars);
  const maxVal = Math.max(...chartData.map((d) => Number(d.signups)), 1);

  return (
    <div className="flex items-end gap-1 h-24">
      {chartData.map((d, i) => {
        const height = (Number(d.signups) / maxVal) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-t transition-all hover:opacity-80 group relative"
            style={{
              height: `${Math.max(height, 4)}%`,
              backgroundColor: color,
              opacity: 0.4 + (i / chartData.length) * 0.6,
            }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-black/80 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {d.signups} signups
              <br />
              {new Date(d.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Horizontal bar item
function HBarItem({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-medium tabular-nums">
          {count}{" "}
          <span className="text-white/30">({Math.round(pct)}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEmails, setShowEmails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "waitlist" | "revenue" | "premium" | "users">("overview");
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [showWallets, setShowWallets] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const headers = { Authorization: `Bearer ${adminKey}` };
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);
      const statsData = await statsRes.json();
      const usersDataRes = await usersRes.json();

      if (!statsRes.ok) {
        setError(statsData.error || "Failed to fetch");
        setIsAuthenticated(false);
        return;
      }

      setStats(statsData);
      if (usersRes.ok) {
        setUsersData(usersDataRes);
      }
      setError("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setLoading(true);
    fetchStats();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      const interval = setInterval(fetchStats, 60000); // Auto-refresh every 60s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchStats]);

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#0066FF] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-white/40 text-sm">Enter your admin key to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin API key"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF] transition-colors"
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[#0066FF] rounded-xl font-semibold hover:bg-[#0066FF]/90 transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalSignups = stats.overview.totalSignups;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" />
                  <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="2" fill="white" />
                </svg>
              </div>
              <span className="font-bold text-sm">
                STELLA<span className="text-[#0066FF]">RAY</span>
              </span>
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-white/40 text-sm font-medium">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00FF88]/10 border border-[#00FF88]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[#00FF88] text-xs font-medium">Live</span>
            </div>
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-white/40 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit">
            {(
              [
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "waitlist", label: "Waitlist", icon: Users },
                { id: "users", label: "Users", icon: Wallet },
                { id: "revenue", label: "Revenue", icon: DollarSign },
                { id: "premium", label: "Premium", icon: Crown },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#0066FF] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Signups"
                  value={totalSignups.toLocaleString()}
                  icon={Users}
                  color="#0066FF"
                  trend={{ value: stats.overview.growthRate, label: "vs last week" }}
                />
                <StatCard
                  title="Today"
                  value={stats.overview.todaySignups}
                  subtitle="signups today"
                  icon={Activity}
                  color="#00D4FF"
                />
                <StatCard
                  title="This Week"
                  value={stats.overview.weekSignups}
                  subtitle="last 7 days"
                  icon={TrendingUp}
                  color="#00FF88"
                />
                <StatCard
                  title="Est. Revenue"
                  value={`$${stats.revenue.total.toFixed(2)}`}
                  subtitle="from platform fees"
                  icon={DollarSign}
                  color="#FFD600"
                />
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Daily signups chart */}
                <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold">Daily Signups</h3>
                      <p className="text-white/40 text-sm">Last 30 days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{totalSignups}</p>
                      <p className="text-white/40 text-xs">total</p>
                    </div>
                  </div>
                  {stats.waitlist.daily.length > 0 ? (
                    <MiniBarChart data={stats.waitlist.daily} color="#0066FF" maxBars={30} />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-white/20 text-sm">
                      No data yet
                    </div>
                  )}
                </div>

                {/* Top countries */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="font-bold text-sm">Top Countries</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.waitlist.byCountry.length > 0 ? (
                      stats.waitlist.byCountry.slice(0, 5).map((c) => (
                        <HBarItem
                          key={c.country}
                          label={c.country || "Unknown"}
                          count={Number(c.count)}
                          total={totalSignups}
                          color="#0066FF"
                        />
                      ))
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent signups */}
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Recent Signups</h3>
                  <button
                    onClick={() => setShowEmails(!showEmails)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/50"
                  >
                    {showEmails ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    {showEmails ? "Hide" : "Show"} emails
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Email</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Source</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium hidden sm:table-cell">Device</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium hidden md:table-cell">Country</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentSignups.map((s, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {showEmails
                              ? s.email
                              : s.email.replace(/(.{3}).*(@.*)/, "$1***$2")}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#0066FF]/10 text-[#0066FF] text-xs">
                              {s.source || "direct"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 hidden sm:table-cell">
                            <span className="text-white/50 text-xs">{s.device_type || "-"}</span>
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <span className="text-white/50 text-xs">{s.country || "-"}</span>
                          </td>
                          <td className="py-2.5 px-3 text-white/40 text-xs">
                            {new Date(s.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WAITLIST TAB */}
          {activeTab === "waitlist" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Signups"
                  value={totalSignups.toLocaleString()}
                  icon={Users}
                  color="#0066FF"
                />
                <StatCard
                  title="Today"
                  value={stats.overview.todaySignups}
                  icon={Clock}
                  color="#00D4FF"
                />
                <StatCard
                  title="This Week"
                  value={stats.overview.weekSignups}
                  icon={TrendingUp}
                  color="#00FF88"
                />
                <StatCard
                  title="Growth Rate"
                  value={`${stats.overview.growthRate > 0 ? "+" : ""}${stats.overview.growthRate}%`}
                  icon={Activity}
                  color="#FFD600"
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sources */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 className="w-4 h-4 text-[#00D4FF]" />
                    <h3 className="font-bold text-sm">Traffic Sources</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.waitlist.bySource.length > 0 ? (
                      stats.waitlist.bySource.map((s) => (
                        <HBarItem
                          key={s.source}
                          label={s.source || "direct"}
                          count={Number(s.count)}
                          total={totalSignups}
                          color="#00D4FF"
                        />
                      ))
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>

                {/* Devices */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="font-bold text-sm">Devices</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.waitlist.byDevice.length > 0 ? (
                      stats.waitlist.byDevice.map((d) => {
                        const DevIcon =
                          d.device_type === "mobile"
                            ? Smartphone
                            : d.device_type === "tablet"
                            ? Tablet
                            : Monitor;
                        return (
                          <div key={d.device_type} className="flex items-center gap-3">
                            <DevIcon className="w-4 h-4 text-white/40" />
                            <div className="flex-1">
                              <HBarItem
                                label={d.device_type || "Unknown"}
                                count={Number(d.count)}
                                total={totalSignups}
                                color="#0066FF"
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>

                {/* Browsers */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-[#00FF88]" />
                    <h3 className="font-bold text-sm">Browsers</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.waitlist.byBrowser.length > 0 ? (
                      stats.waitlist.byBrowser.map((b) => (
                        <HBarItem
                          key={b.browser}
                          label={b.browser || "Unknown"}
                          count={Number(b.count)}
                          total={totalSignups}
                          color="#00FF88"
                        />
                      ))
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>

                {/* Countries */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-[#FFD600]" />
                    <h3 className="font-bold text-sm">Countries</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.waitlist.byCountry.length > 0 ? (
                      stats.waitlist.byCountry.slice(0, 8).map((c) => (
                        <HBarItem
                          key={c.country}
                          label={c.country || "Unknown"}
                          count={Number(c.count)}
                          total={totalSignups}
                          color="#FFD600"
                        />
                      ))
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB (VC Analytics) */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* User metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Total Users"
                  value={usersData?.overview.totalUsers ?? 0}
                  icon={Users}
                  color="#0066FF"
                />
                <StatCard
                  title="New Today"
                  value={usersData?.overview.todayNewUsers ?? 0}
                  icon={Activity}
                  color="#00D4FF"
                />
                <StatCard
                  title="This Week"
                  value={usersData?.overview.weekNewUsers ?? 0}
                  icon={TrendingUp}
                  color="#00FF88"
                />
                <StatCard
                  title="Active (7d)"
                  value={usersData?.overview.activeUsers ?? 0}
                  subtitle="Logged in last 7 days"
                  icon={Zap}
                  color="#FFD600"
                />
                <StatCard
                  title="Returning"
                  value={usersData?.overview.repeatUsers ?? 0}
                  subtitle="Multiple logins"
                  icon={RefreshCw}
                  color="#FF6B6B"
                />
              </div>

              {/* VC Proof Banner */}
              <div className="p-5 rounded-xl border border-[#0066FF]/30 bg-[#0066FF]/5">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-[#0066FF]" />
                  <h3 className="font-bold">VC Proof: Authenticated Users with Wallet Addresses</h3>
                </div>
                <p className="text-white/50 text-sm">
                  Each user below has authenticated via Google OAuth and has a deterministically derived Stellar wallet address.
                  This proves real user adoption with on-chain wallet readiness
                </p>
              </div>

              {/* Users table */}
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="font-bold">Authenticated Users & Wallets</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-bold">
                      {usersData?.overview.totalUsers ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowWallets(!showWallets)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/50"
                    >
                      {showWallets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showWallets ? "Hide" : "Show"} full addresses
                    </button>
                    <button
                      onClick={() => setShowEmails(!showEmails)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/50"
                    >
                      {showEmails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showEmails ? "Hide" : "Show"} emails
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2 px-3 text-white/40 font-medium">#</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">User</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Wallet Address</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium hidden md:table-cell">Network</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium hidden lg:table-cell">Logins</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium hidden sm:table-cell">Country</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">First Login</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium hidden lg:table-cell">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData?.users && usersData.users.length > 0 ? (
                        usersData.users.map((user, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 text-white/30 text-xs">{i + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                {user.google_picture ? (
                                  <img
                                    src={user.google_picture}
                                    alt=""
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-[#0066FF]" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium">{user.google_name || "User"}</p>
                                  <p className="text-xs text-white/40 font-mono">
                                    {showEmails
                                      ? user.google_email
                                      : user.google_email.replace(/(.{3}).*(@.*)/, "$1***$2")}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <code className="text-xs text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded font-mono">
                                {showWallets
                                  ? user.wallet_address
                                  : `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-6)}`}
                              </code>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                user.network === "mainnet"
                                  ? "bg-[#00FF88]/10 text-[#00FF88]"
                                  : "bg-[#FFD600]/10 text-[#FFD600]"
                              }`}>
                                {user.network}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 hidden lg:table-cell">
                              <span className="text-white/60 text-xs tabular-nums">{user.login_count}x</span>
                            </td>
                            <td className="py-2.5 px-3 hidden sm:table-cell">
                              <span className="text-white/50 text-xs">{user.country || "-"}</span>
                            </td>
                            <td className="py-2.5 px-3 text-white/40 text-xs">
                              {new Date(user.first_login_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2.5 px-3 hidden lg:table-cell text-white/40 text-xs">
                              {new Date(user.last_login_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-white/30">
                            <Wallet className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No authenticated users yet</p>
                            <p className="text-xs mt-1">Users will appear here after logging in with Google</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily new users chart */}
              {usersData?.analytics.dailyLogins && usersData.analytics.dailyLogins.length > 0 && (
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold">Daily New Users</h3>
                      <p className="text-white/40 text-sm">Last 30 days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{usersData.overview.totalUsers}</p>
                      <p className="text-white/40 text-xs">total users</p>
                    </div>
                  </div>
                  <MiniBarChart
                    data={usersData.analytics.dailyLogins.map(d => ({ date: d.date, signups: Number(d.users) }))}
                    color="#0066FF"
                    maxBars={30}
                  />
                </div>
              )}

              {/* User geography & devices */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="font-bold text-sm">Users by Country</h3>
                  </div>
                  <div className="space-y-3">
                    {usersData?.analytics.byCountry && usersData.analytics.byCountry.length > 0 ? (
                      usersData.analytics.byCountry.map((c) => (
                        <HBarItem
                          key={c.country}
                          label={c.country || "Unknown"}
                          count={Number(c.count)}
                          total={usersData.overview.totalUsers}
                          color="#0066FF"
                        />
                      ))
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-4 h-4 text-[#00D4FF]" />
                    <h3 className="font-bold text-sm">Users by Device</h3>
                  </div>
                  <div className="space-y-3">
                    {usersData?.analytics.byDevice && usersData.analytics.byDevice.length > 0 ? (
                      usersData.analytics.byDevice.map((d) => {
                        const DevIcon =
                          d.device_type === "mobile"
                            ? Smartphone
                            : d.device_type === "tablet"
                            ? Tablet
                            : Monitor;
                        return (
                          <div key={d.device_type} className="flex items-center gap-3">
                            <DevIcon className="w-4 h-4 text-white/40" />
                            <div className="flex-1">
                              <HBarItem
                                label={d.device_type || "Unknown"}
                                count={Number(d.count)}
                                total={usersData.overview.totalUsers}
                                color="#00D4FF"
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-white/20 text-sm">No data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVENUE TAB */}
          {activeTab === "revenue" && (
            <div className="space-y-6">
              {/* Revenue metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Revenue"
                  value={`$${stats.revenue.total.toFixed(2)}`}
                  icon={DollarSign}
                  color="#00FF88"
                />
                <StatCard
                  title="Payment Link Fees"
                  value={`$${stats.revenue.paymentFees.toFixed(2)}`}
                  subtitle="0.3% per transaction"
                  icon={Link2}
                  color="#0066FF"
                />
                <StatCard
                  title="Stream Fees"
                  value={`$${stats.revenue.streamFees.toFixed(2)}`}
                  subtitle="0.1% per stream"
                  icon={Zap}
                  color="#00D4FF"
                />
                <StatCard
                  title="Payment Volume"
                  value={`${(stats.payments.links.volume + stats.payments.streams.volume).toFixed(0)} XLM`}
                  icon={Wallet}
                  color="#FFD600"
                />
              </div>

              {/* Payment & Stream details */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-6">
                    <Link2 className="w-5 h-5 text-[#0066FF]" />
                    <h3 className="font-bold">Payment Links</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold">{stats.payments.links.total}</p>
                      <p className="text-white/40 text-sm">Total created</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-[#00FF88]">{stats.payments.links.paid}</p>
                      <p className="text-white/40 text-sm">Paid</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-[#0066FF]">{stats.payments.links.active}</p>
                      <p className="text-white/40 text-sm">Active</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold">{stats.payments.links.volume.toFixed(1)}</p>
                      <p className="text-white/40 text-sm">Volume (XLM)</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-[#00D4FF]" />
                    <h3 className="font-bold">Streaming Payments</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold">{stats.payments.streams.total}</p>
                      <p className="text-white/40 text-sm">Total streams</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-[#00FF88]">{stats.payments.streams.completed}</p>
                      <p className="text-white/40 text-sm">Completed</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-[#00D4FF]">{stats.payments.streams.active}</p>
                      <p className="text-white/40 text-sm">Active</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold">{stats.payments.streams.volume.toFixed(1)}</p>
                      <p className="text-white/40 text-sm">Volume (XLM)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee structure */}
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="font-bold mb-4">Fee Structure</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Payment Links",
                      fee: `${PRICING.FEES.PAYMENT_LINK_FEE * 100}%`,
                      color: "#0066FF",
                    },
                    {
                      label: "Streaming",
                      fee: `${PRICING.FEES.STREAMING_FEE * 100}%`,
                      color: "#00D4FF",
                    },
                    {
                      label: "Transfers",
                      fee: `${PRICING.FEES.TRANSFER_FEE * 100}%`,
                      color: "#00FF88",
                    },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>
                        {item.fee}
                      </p>
                      <p className="text-white/40 text-sm">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue projections */}
              <div className="p-6 rounded-xl border border-[#0066FF]/20 bg-[#0066FF]/5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#0066FF]" />
                  <h3 className="font-bold">Revenue Projections</h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    {
                      period: "Month 1",
                      revenue: "$500 - $2K",
                      basis: "100 daily tx, 50 streams",
                    },
                    {
                      period: "Month 6",
                      revenue: "$5K - $15K",
                      basis: "1K daily tx, subscriptions",
                    },
                    {
                      period: "Year 1",
                      revenue: "$60K - $420K",
                      basis: "10K daily tx, B2B, ZK proofs",
                    },
                  ].map((proj) => (
                    <div key={proj.period}>
                      <p className="text-white/40 text-sm mb-1">{proj.period}</p>
                      <p className="text-xl font-bold text-[#00FF88] mb-0.5">{proj.revenue}</p>
                      <p className="text-white/30 text-xs">{proj.basis}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREMIUM TAB */}
          {activeTab === "premium" && (
            <div className="space-y-6">
              {/* Tier overview */}
              <div className="grid md:grid-cols-3 gap-4">
                {(Object.keys(PRICING.TIERS) as Array<keyof typeof PRICING.TIERS>).map((key) => {
                  const tier = PRICING.TIERS[key];
                  const colors: Record<string, string> = {
                    free: "#00D4FF",
                    pro: "#0066FF",
                    business: "#00FF88",
                  };
                  const icons: Record<string, React.ElementType> = {
                    free: Zap,
                    pro: Crown,
                    business: Building2,
                  };
                  const Icon = icons[tier.id] || Zap;
                  const color = colors[tier.id] || "#0066FF";

                  return (
                    <div
                      key={key}
                      className="p-6 rounded-xl border border-white/10 bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                          <h3 className="font-bold">{tier.name}</h3>
                          <p className="text-white/40 text-sm">
                            {tier.price === 0 ? "Free forever" : `$${tier.price}/mo`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {tier.features.slice(0, 5).map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-white/60">{f}</span>
                          </div>
                        ))}
                        {tier.features.length > 5 && (
                          <p className="text-xs text-white/30">
                            +{tier.features.length - 5} more features
                          </p>
                        )}
                      </div>

                      {/* Limits */}
                      <div className="p-3 rounded-lg bg-white/5 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Wallets</span>
                          <span className="font-medium">
                            {tier.limits.wallets === -1 ? "Unlimited" : tier.limits.wallets}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">TX/day</span>
                          <span className="font-medium">
                            {tier.limits.txPerDay === -1 ? "Unlimited" : tier.limits.txPerDay}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">ZK Proofs/mo</span>
                          <span className="font-medium">
                            {tier.limits.zkProofsPerMonth === -1
                              ? "Unlimited"
                              : tier.limits.zkProofsPerMonth}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Mainnet</span>
                          <span className={tier.limits.mainnet ? "text-[#00FF88]" : "text-white/20"}>
                            {tier.limits.mainnet ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ZK Proof pricing */}
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-[#0066FF]" />
                  <h3 className="font-bold">ZK Proof Pricing (Pay-per-use)</h3>
                </div>
                <div className="grid sm:grid-cols-5 gap-4">
                  {Object.entries(PRICING.ZK_PROOF_PRICING).map(([type, price]) => (
                    <div key={type} className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-xs text-white/40 mb-1 uppercase">{type}</p>
                      <p className="text-xl font-bold text-[#00D4FF]">${price}</p>
                      <p className="text-white/30 text-xs">per proof</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue streams summary */}
              <div className="p-6 rounded-xl border border-[#00FF88]/20 bg-[#00FF88]/5">
                <h3 className="font-bold mb-4">Revenue Streams</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      stream: "Subscriptions",
                      desc: "Pro & Business tiers",
                      icon: Crown,
                      color: "#0066FF",
                    },
                    {
                      stream: "Transaction Fees",
                      desc: "0.1-0.5% per tx",
                      icon: Wallet,
                      color: "#00D4FF",
                    },
                    {
                      stream: "ZK Proofs",
                      desc: "$0.05-$0.50 per proof",
                      icon: Shield,
                      color: "#00FF88",
                    },
                    {
                      stream: "SDK Licensing",
                      desc: "Commercial API access",
                      icon: Code,
                      color: "#FFD600",
                    },
                  ].map((s) => (
                    <div key={s.stream} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${s.color}15` }}
                      >
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.stream}</p>
                        <p className="text-white/40 text-xs">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Link to pricing page */}
              <Link
                href="/pricing"
                className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-5 h-5 text-[#0066FF]" />
                  <span className="font-medium">View Public Pricing Page</span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
