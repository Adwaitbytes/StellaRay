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
  ChevronDown,
  Sparkles,
  Twitter,
  Github,
  Globe,
  Rocket,
  Lock,
  BarChart3,
  Code2,
  Paintbrush,
  Headphones,
  FileCheck,
  Infinity,
  CreditCard,
  Radio,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PRICING, type TierKey } from "@/config/pricing";

// ─── FAQ Data ───────────────────────────────────────────────────

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade or downgrade whenever you want. When upgrading, you only pay the prorated difference. When downgrading, the remaining balance is credited to your account.",
  },
  {
    q: "What happens when I exceed my tier limits?",
    a: "You won't be cut off. We'll notify you and charge the pay-per-use rate for any overages. For example, ZK proofs beyond your monthly limit are billed at $0.05–$0.50 per proof depending on the type.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Every new user starts on the Free tier with full access to testnet. When you're ready for mainnet and production use, upgrade to Pro — no trial needed because you can test everything for free first.",
  },
  {
    q: "How does ZK proof pricing work?",
    a: "Each tier includes a monthly ZK proof allowance (Free: 20, Pro: 500, Business: unlimited). Beyond that, proofs are billed per use — Solvency: $0.05, Identity: $0.10, Eligibility: $0.15, History: $0.10, Custom: $0.50.",
  },
  {
    q: "Do you offer discounts for startups?",
    a: "Yes. If you're an early-stage startup building on Stellar, reach out to us on Twitter @stellaraydotfun. We offer extended trials and custom pricing for promising projects in the ecosystem.",
  },
];

// ─── Why Upgrade Data ───────────────────────────────────────────

const proBenefits = [
  {
    icon: Globe,
    title: "Mainnet Access",
    desc: "Move from testnet to real transactions. Your users pay with real XLM and you earn real revenue.",
  },
  {
    icon: Radio,
    title: "Streaming Payments",
    desc: "Enable per-second payment flows. Subscriptions, salaries, royalties — all programmable and real-time.",
  },
  {
    icon: Shield,
    title: "500 ZK Proofs/mo",
    desc: "Production-grade privacy for your users. Prove identity, solvency, or eligibility — without revealing anything.",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    desc: "Skip the queue. Get direct help from the team that built the protocol within hours, not days.",
  },
  {
    icon: CreditCard,
    title: "50 Payment Links",
    desc: "Create shareable links that let anyone pay you in crypto. No wallet setup needed — just click and pay.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track transactions, proof generation, wallet activity, and payment flows with real-time charts and exports.",
  },
];

const businessBenefits = [
  {
    icon: Code2,
    title: "SDK API Access",
    desc: "Full programmatic access to every StellaRay feature. Build custom integrations, automate workflows, or create your own products on top.",
  },
  {
    icon: Paintbrush,
    title: "White-Label & Custom Branding",
    desc: "Remove StellaRay branding entirely. Use your own logo, colors, and domain. Your customers never see us.",
  },
  {
    icon: Infinity,
    title: "Unlimited Everything",
    desc: "No caps on wallets, transactions, ZK proofs, or payment links. Scale as big as you need without hitting limits.",
  },
  {
    icon: FileCheck,
    title: "SLA Guarantee",
    desc: "99.9% uptime commitment with dedicated infrastructure. If we fall short, you get credits automatically.",
  },
  {
    icon: Users,
    title: "Dedicated Support",
    desc: "Named account manager, private Slack channel, and 1-hour response time for critical issues.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    desc: "Deep insights with custom reports, cohort analysis, funnel tracking, and exportable data for your board or investors.",
  },
];

// ─── Feature Comparison Data ────────────────────────────────────

const allFeatures = [
  { label: "Wallets", free: "1", pro: "Unlimited", business: "Unlimited" },
  { label: "Transactions / day", free: "10", pro: "Unlimited", business: "Unlimited" },
  { label: "ZK Proofs / month", free: "20", pro: "500", business: "Unlimited" },
  { label: "Mainnet access", free: false, pro: true, business: true },
  { label: "Streaming payments", free: false, pro: true, business: true },
  { label: "Payment links", free: "5", pro: "50", business: "Unlimited" },
  { label: "SDK API access", free: false, pro: false, business: true },
  { label: "Analytics dashboard", free: false, pro: "Basic", business: "Advanced" },
  { label: "Custom branding", free: false, pro: false, business: true },
  { label: "Priority support", free: false, pro: true, business: true },
  { label: "SLA guarantee", free: false, pro: false, business: true },
  { label: "White-label", free: false, pro: false, business: true },
];

// ─── FAQ Component ──────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden transition-all"
      style={open ? { borderColor: "rgba(0,102,255,0.3)" } : {}}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-semibold text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-5 pb-5 text-sm text-white/50 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const tierConfig: Record<
    string,
    { icon: React.ElementType; color: string; glow: string }
  > = {
    free: { icon: Zap, color: "#00D4FF", glow: "rgba(0,212,255,0.15)" },
    pro: { icon: Crown, color: "#0066FF", glow: "rgba(0,102,255,0.25)" },
    business: { icon: Building2, color: "#00FF88", glow: "rgba(0,255,136,0.15)" },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="px-6 py-5 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Home
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
          {/* ── Hero ─────────────────────────────────────── */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              <span className="text-[#0066FF] font-medium text-sm">
                Simple, transparent pricing
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Start free.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00D4FF]">
                Scale infinitely
              </span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10">
              Every plan includes zero-knowledge wallets, Stellar integration, and our core privacy layer. Upgrade when you need mainnet, more proofs, or enterprise features.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isYearly
                    ? "bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  isYearly
                    ? "bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 rounded-md bg-[#00FF88]/20 text-[#00FF88] text-xs font-bold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* ── Pricing Cards ────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-5 mb-24 items-start">
            {(Object.keys(PRICING.TIERS) as TierKey[]).map((key) => {
              const tier = PRICING.TIERS[key];
              const cfg = tierConfig[tier.id];
              const Icon = cfg.icon;
              const isPro = tier.id === "pro";
              const isBusiness = tier.id === "business";
              const price = isYearly ? tier.priceYearly : tier.price;
              const monthlyPrice = isYearly
                ? Math.round((tier.priceYearly / 12) * 100) / 100
                : tier.price;

              return (
                <div
                  key={key}
                  className={`relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                    isPro
                      ? "border-[#0066FF]/60 bg-gradient-to-b from-[#0066FF]/10 to-[#0066FF]/[0.02] md:scale-105 md:-my-4 z-10"
                      : isBusiness
                      ? "border-[#00FF88]/30 bg-[#00FF88]/[0.02]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                  style={
                    isPro
                      ? { boxShadow: `0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glow}` }
                      : {}
                  }
                >
                  {/* Badge */}
                  {"badge" in tier && tier.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className="px-4 py-1 rounded-full text-xs font-black tracking-wider text-black"
                        style={{ backgroundColor: cfg.color }}
                      >
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cfg.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{tier.name}</h3>
                      <p className="text-white/40 text-xs">{tier.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight">
                        {price === 0 ? "Free" : `$${monthlyPrice}`}
                      </span>
                      {price > 0 && (
                        <span className="text-white/40 text-sm font-medium">
                          /month
                        </span>
                      )}
                    </div>
                    {isYearly && price > 0 && (
                      <p className="text-white/30 text-sm mt-1.5">
                        ${price} billed annually
                      </p>
                    )}
                    {price === 0 && (
                      <p className="text-white/30 text-sm mt-1.5">
                        No credit card required
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href="/waitlist"
                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all mb-7 ${
                      isPro
                        ? "bg-[#0066FF] hover:bg-[#0055DD] text-white shadow-lg shadow-[#0066FF]/30"
                        : isBusiness
                        ? "bg-[#00FF88] hover:bg-[#00DD77] text-black"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {tier.id === "free"
                      ? "Get Started Free"
                      : tier.id === "pro"
                      ? "Upgrade to Pro"
                      : "Contact Sales"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5">
                        <Check
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: cfg.color }}
                        />
                        <span className="text-sm text-white/60">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Why Upgrade: Pro ─────────────────────────── */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 mb-4">
                <Crown className="w-3.5 h-3.5 text-[#0066FF]" />
                <span className="text-[#0066FF] font-medium text-sm">
                  Why upgrade to Pro
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Unlock the full power
              </h2>
              <p className="text-white/40 max-w-xl mx-auto">
                Move from testing to production. Pro gives you mainnet access,
                streaming payments, and the privacy tools your users expect.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proBenefits.map((b) => (
                <div
                  key={b.title}
                  className="p-6 rounded-xl border border-white/8 bg-white/[0.02] hover:border-[#0066FF]/30 hover:bg-[#0066FF]/[0.03] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0066FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#0066FF]/20 transition-colors">
                    <b.icon className="w-5 h-5 text-[#0066FF]" />
                  </div>
                  <h3 className="font-bold mb-2">{b.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] rounded-xl font-semibold text-sm hover:bg-[#0055DD] transition-all shadow-lg shadow-[#0066FF]/20"
              >
                Upgrade to Pro — $9/mo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── Why Upgrade: Business ────────────────────── */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 mb-4">
                <Building2 className="w-3.5 h-3.5 text-[#00FF88]" />
                <span className="text-[#00FF88] font-medium text-sm">
                  Why choose Business
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Scale without limits
              </h2>
              <p className="text-white/40 max-w-xl mx-auto">
                For teams building products on top of StellaRay. Get API access,
                white-label everything, and enterprise-grade reliability.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessBenefits.map((b) => (
                <div
                  key={b.title}
                  className="p-6 rounded-xl border border-white/8 bg-white/[0.02] hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.03] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center mb-4 group-hover:bg-[#00FF88]/20 transition-colors">
                    <b.icon className="w-5 h-5 text-[#00FF88]" />
                  </div>
                  <h3 className="font-bold mb-2">{b.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FF88] text-black rounded-xl font-semibold text-sm hover:bg-[#00DD77] transition-all"
              >
                Get Business — $49/mo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── Feature Comparison ────────────────────────── */}
          <div className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Compare every feature</h2>
              <p className="text-white/40">
                Side-by-side breakdown so you know exactly what you get
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-x-auto">
              {/* Table header */}
              <div className="grid grid-cols-4 min-w-[600px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="p-4 text-sm font-medium text-white/40 border-b border-white/5">
                  Feature
                </div>
                <div className="p-4 text-sm font-bold text-center border-b border-white/5">
                  <span style={{ color: "#00D4FF" }}>Free</span>
                </div>
                <div className="p-4 text-sm font-bold text-center border-b border-[#0066FF]/20 bg-[#0066FF]/[0.05]">
                  <span style={{ color: "#0066FF" }}>Pro</span>
                </div>
                <div className="p-4 text-sm font-bold text-center border-b border-white/5">
                  <span style={{ color: "#00FF88" }}>Business</span>
                </div>
              </div>

              {/* Table rows */}
              {allFeatures.map((feature, i) => (
                <div
                  key={feature.label}
                  className="grid grid-cols-4 min-w-[600px] border-t border-white/5"
                  style={i % 2 === 0 ? { background: "rgba(255,255,255,0.015)" } : {}}
                >
                  <div className="p-4 text-sm text-white/60">{feature.label}</div>
                  {(["free", "pro", "business"] as const).map((tier) => {
                    const val = feature[tier];
                    const isPro = tier === "pro";
                    return (
                      <div
                        key={tier}
                        className={`p-4 flex items-center justify-center ${
                          isPro ? "bg-[#0066FF]/[0.03]" : ""
                        }`}
                      >
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-4 h-4 text-[#00FF88]" />
                          ) : (
                            <X className="w-4 h-4 text-white/15" />
                          )
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              val === "Unlimited"
                                ? "text-[#00FF88]"
                                : val === "Advanced"
                                ? "text-[#00FF88]"
                                : val === "Basic"
                                ? "text-[#0066FF]"
                                : "text-white/60"
                            }`}
                          >
                            {val}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Fee Structure ─────────────────────────────── */}
          <div className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                Transparent fee structure
              </h2>
              <p className="text-white/40">
                Low, predictable fees on every transaction — no surprises
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Wallet,
                  title: "Payment Links",
                  fee: "0.3%",
                  desc: "Per transaction through payment links",
                  color: "#0066FF",
                  example: "Send $100 → $0.30 fee",
                },
                {
                  icon: Radio,
                  title: "Streaming Payments",
                  fee: "0.1%",
                  desc: "On total streamed amount",
                  color: "#00D4FF",
                  example: "Stream $1,000 → $1.00 fee",
                },
                {
                  icon: Shield,
                  title: "ZK Proofs",
                  fee: "$0.05+",
                  desc: "Per proof beyond tier limits",
                  color: "#00FF88",
                  example: "Identity proof → $0.10",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all"
                >
                  <item.icon
                    className="w-8 h-8 mb-4"
                    style={{ color: item.color }}
                  />
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p
                    className="text-3xl font-black mb-2"
                    style={{ color: item.color }}
                  >
                    {item.fee}
                  </p>
                  <p className="text-sm text-white/40 mb-3">{item.desc}</p>
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/30 font-mono inline-block">
                    {item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ───────────────────────────────────────── */}
          <div className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                Frequently asked questions
              </h2>
              <p className="text-white/40">
                Everything you need to know about pricing
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

          {/* ── CTA ──────────────────────────────────────── */}
          <div className="text-center py-16 border-t border-white/5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 mb-6">
              <Rocket className="w-3.5 h-3.5 text-[#0066FF]" />
              <span className="text-[#0066FF] font-medium text-sm">
                Start building today
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to prove everything?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Join the waitlist and get early access. Founding members get
              extended Pro features free during beta.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#0066FF] rounded-xl font-bold hover:bg-[#0055DD] transition-all shadow-lg shadow-[#0066FF]/25"
              >
                Join Waitlist
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Zap className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>StellaRay — Prove Everything. Reveal Nothing.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-white/40 text-sm hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/waitlist"
              className="text-white/40 text-sm hover:text-white transition-colors"
            >
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
            <a
              href="https://github.com/Adwaitbytes/StellaRay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
