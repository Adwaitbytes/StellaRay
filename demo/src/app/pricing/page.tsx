"use client";

import { useState } from "react";
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  Shield,
  Wallet,
  Lock,
  Code,
  ChevronRight,
  Sparkles,
  Twitter,
  Github,
} from "lucide-react";
import Link from "next/link";
import { PRICING, type TierKey } from "@/config/pricing";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const tierIcons: Record<string, React.ElementType> = {
    free: Zap,
    pro: Crown,
    business: Building2,
  };

  const tierColors: Record<string, string> = {
    free: "#00D4FF",
    pro: "#0066FF",
    business: "#00FF88",
  };

  const allFeatures = [
    { key: "wallets", label: "Wallets", free: "1", pro: "Unlimited", business: "Unlimited" },
    { key: "txPerDay", label: "Transactions / day", free: "10", pro: "Unlimited", business: "Unlimited" },
    { key: "zkProofs", label: "ZK Proofs / month", free: "20", pro: "500", business: "Unlimited" },
    { key: "mainnet", label: "Mainnet access", free: false, pro: true, business: true },
    { key: "streaming", label: "Streaming payments", free: false, pro: true, business: true },
    { key: "paymentLinks", label: "Payment links", free: "5", pro: "50", business: "Unlimited" },
    { key: "api", label: "SDK API access", free: false, pro: false, business: true },
    { key: "analytics", label: "Analytics dashboard", free: false, pro: true, business: true },
    { key: "branding", label: "Custom branding", free: false, pro: false, business: true },
    { key: "support", label: "Priority support", free: false, pro: true, business: true },
    { key: "sla", label: "SLA guarantee", free: false, pro: false, business: true },
    { key: "whitelabel", label: "White-label", free: false, pro: false, business: true },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="px-6 py-5 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              STELLA<span className="text-[#0066FF]">RAY</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/waitlist"
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Waitlist
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-[#0066FF] rounded-lg text-sm font-semibold hover:bg-[#0066FF]/90 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              <span className="text-[#0066FF] font-medium text-sm">Simple, transparent pricing</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Choose your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00D4FF]">
                plan
              </span>
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
              Start free. Scale as you grow. No hidden fees.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isYearly ? "bg-[#0066FF] text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isYearly ? "bg-[#0066FF] text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Yearly
                <span className="px-1.5 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] text-xs font-bold">
                  -17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {(Object.keys(PRICING.TIERS) as TierKey[]).map((key) => {
              const tier = PRICING.TIERS[key];
              const Icon = tierIcons[tier.id];
              const color = tierColors[tier.id];
              const isPro = tier.id === "pro";
              const price = isYearly ? tier.priceYearly : tier.price;
              const monthlyPrice = isYearly
                ? Math.round((tier.priceYearly / 12) * 100) / 100
                : tier.price;

              return (
                <div
                  key={key}
                  className={`relative rounded-2xl border p-8 transition-all hover:scale-[1.02] ${
                    isPro
                      ? "border-[#0066FF] bg-[#0066FF]/5"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {/* Badge */}
                  {"badge" in tier && tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-black"
                        style={{ backgroundColor: color }}
                      >
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{tier.name}</h3>
                      <p className="text-white/40 text-xs">{tier.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {price === 0 ? "Free" : `$${monthlyPrice}`}
                      </span>
                      {price > 0 && (
                        <span className="text-white/40 text-sm">/month</span>
                      )}
                    </div>
                    {isYearly && price > 0 && (
                      <p className="text-white/30 text-sm mt-1">
                        ${price} billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={tier.id === "free" ? "/waitlist" : "/waitlist"}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all mb-6 ${
                      isPro
                        ? "bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
                        : tier.id === "business"
                        ? "bg-[#00FF88] hover:bg-[#00FF88]/90 text-black"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {tier.id === "free" ? "Get Started" : "Join Waitlist"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature comparison table */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-8">
              Feature Comparison
            </h2>

            <div className="rounded-2xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 bg-white/5">
                <div className="p-4 text-sm font-medium text-white/40">Feature</div>
                <div className="p-4 text-sm font-bold text-center text-[#00D4FF]">Free</div>
                <div className="p-4 text-sm font-bold text-center text-[#0066FF]">Pro</div>
                <div className="p-4 text-sm font-bold text-center text-[#00FF88]">Business</div>
              </div>

              {/* Rows */}
              {allFeatures.map((feature, i) => (
                <div
                  key={feature.key}
                  className={`grid grid-cols-4 ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  } border-t border-white/5`}
                >
                  <div className="p-4 text-sm text-white/70">{feature.label}</div>
                  {(["free", "pro", "business"] as const).map((tier) => {
                    const val = feature[tier];
                    return (
                      <div key={tier} className="p-4 flex items-center justify-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-4 h-4 text-[#00FF88]" />
                          ) : (
                            <X className="w-4 h-4 text-white/20" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{val}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Revenue model breakdown */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-3">
              Transparent Fee Structure
            </h2>
            <p className="text-white/40 text-center mb-8">
              Low fees that keep the platform running
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Wallet,
                  title: "Payment Links",
                  fee: "0.3%",
                  desc: "Per transaction through payment links",
                  color: "#0066FF",
                },
                {
                  icon: Zap,
                  title: "Streaming Payments",
                  fee: "0.1%",
                  desc: "On total streamed amount",
                  color: "#00D4FF",
                },
                {
                  icon: Shield,
                  title: "ZK Proofs",
                  fee: "From $0.05",
                  desc: "Per proof beyond tier limits",
                  color: "#00FF88",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-xl border border-white/10 bg-white/[0.02]"
                >
                  <item.icon className="w-8 h-8 mb-4" style={{ color: item.color }} />
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-2xl font-bold mb-2" style={{ color: item.color }}>
                    {item.fee}
                  </p>
                  <p className="text-sm text-white/40">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-16 border-t border-white/5">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-white/50 mb-8">
              Join the waitlist and get early access with founding member perks
            </p>
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0066FF] rounded-xl font-semibold hover:bg-[#0066FF]/90 transition-all"
            >
              Join Waitlist
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Zap className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Stellaray - Prove Everything. Reveal Nothing.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/40 text-sm hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/waitlist" className="text-white/40 text-sm hover:text-white transition-colors">
              Waitlist
            </Link>
            <a
              href="https://twitter.com/stellaraydotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
