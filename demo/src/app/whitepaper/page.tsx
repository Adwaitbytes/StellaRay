"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun,
  Moon,
  ArrowLeft,
  ChevronUp,
  BookOpen,
  Clock,
  FileText,
  ExternalLink,
  Download,
  Share2,
  Menu,
  X,
  Zap,
  Shield,
  Code,
  Lock,
  Cpu,
  Hash,
  Activity,
  Globe,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

// ─── Section Data ──────────────────────────────────────────────────────────────

interface Section {
  id: string;
  number: string;
  title: string;
  icon: typeof Zap;
  accent: string;
}

const SECTIONS: Section[] = [
  { id: "abstract", number: "0", title: "Abstract", icon: FileText, accent: "#0066FF" },
  { id: "introduction", number: "1", title: "Introduction", icon: BookOpen, accent: "#00D4FF" },
  { id: "background", number: "2", title: "Background & Prior Art", icon: Layers, accent: "#0066FF" },
  { id: "protocol", number: "3", title: "Protocol Design", icon: Cpu, accent: "#00D4FF" },
  { id: "eligibility", number: "4", title: "ZK Eligibility Framework", icon: Shield, accent: "#0066FF" },
  { id: "payments", number: "5", title: "Payment Infrastructure", icon: Zap, accent: "#00D4FF" },
  { id: "security", number: "6", title: "Security Analysis", icon: Lock, accent: "#0066FF" },
  { id: "performance", number: "7", title: "Performance Analysis", icon: Activity, accent: "#00D4FF" },
  { id: "sdk", number: "8", title: "SDK Architecture", icon: Code, accent: "#0066FF" },
  { id: "deployment", number: "9", title: "Network Deployment", icon: Globe, accent: "#00D4FF" },
  { id: "future", number: "10", title: "Future Directions", icon: ArrowRight, accent: "#00D4FF" },
  { id: "conclusion", number: "11", title: "Conclusion", icon: FileText, accent: "#0066FF" },
];

// ─── Reading Progress Hook ─────────────────────────────────────────────────────

function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
}

// ─── Active Section Hook ───────────────────────────────────────────────────────

function useActiveSection() {
  const [activeSection, setActiveSection] = useState("abstract");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return activeSection;
}

// ─── Reveal on Scroll ──────────────────────────────────────────────────────────

function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealBlock({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useRevealOnScroll();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Code Block Component ──────────────────────────────────────────────────────

function CodeBlock({ children, isDark }: { children: string; isDark: boolean }) {
  return (
    <div className={`my-6 border-2 ${isDark ? "border-white/20 bg-[#111]" : "border-black/20 bg-[#1a1a2e]"} overflow-x-auto`}>
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${isDark ? "border-white/10" : "border-white/10"}`}>
        <span className="w-2.5 h-2.5 bg-[#FF3366] rounded-full" />
        <span className="w-2.5 h-2.5 bg-[#FFD600] rounded-full" />
        <span className="w-2.5 h-2.5 bg-[#00FF88] rounded-full" />
      </div>
      <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-[#00D4FF] leading-relaxed overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ─── Table Component ───────────────────────────────────────────────────────────

function DataTable({
  headers,
  rows,
  isDark,
  highlightLast,
}: {
  headers: string[];
  rows: string[][];
  isDark: boolean;
  highlightLast?: boolean;
}) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className={`w-full border-2 ${isDark ? "border-white/20" : "border-black/20"}`}>
        <thead>
          <tr className={isDark ? "bg-[#0066FF]/20" : "bg-[#0066FF]/10"}>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-3 sm:px-5 py-3 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                  isDark ? "text-[#00D4FF] border-b-2 border-white/20" : "text-[#0066FF] border-b-2 border-black/20"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const isLast = ri === rows.length - 1 && highlightLast;
            return (
              <tr
                key={ri}
                className={`${
                  isLast
                    ? isDark
                      ? "bg-[#0066FF]/10 font-black"
                      : "bg-[#0066FF]/5 font-black"
                    : ri % 2 === 0
                    ? isDark
                      ? "bg-white/[0.02]"
                      : "bg-black/[0.02]"
                    : ""
                }`}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-mono ${
                      isDark ? "border-b border-white/5" : "border-b border-black/5"
                    } ${isLast && ci === row.length - 1 ? "text-[#0066FF] font-black" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Callout / Pull Quote ──────────────────────────────────────────────────────

function PullQuote({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <div
      className={`my-8 sm:my-10 pl-5 sm:pl-8 border-l-4 ${
        isDark ? "border-[#0066FF]" : "border-[#0066FF]"
      }`}
    >
      <p
        className={`text-lg sm:text-xl lg:text-2xl font-black leading-snug ${
          isDark ? "text-white/90" : "text-black/90"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  section,
  isDark,
}: {
  section: Section;
  isDark: boolean;
}) {
  const Icon = section.icon;
  return (
    <RevealBlock>
      <div id={section.id} className="scroll-mt-24 sm:scroll-mt-28 pt-12 sm:pt-16 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 sm:border-4"
            style={{ borderColor: section.accent, background: `${section.accent}15` }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: section.accent }} />
          </div>
          <div>
            <span
              className="text-[10px] sm:text-xs font-black tracking-widest block"
              style={{ color: section.accent }}
            >
              SECTION {section.number}
            </span>
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {section.title}
            </h2>
          </div>
        </div>
        <div className={`h-1 w-20 sm:w-32`} style={{ background: section.accent }} />
      </div>
    </RevealBlock>
  );
}

// ─── Paragraph ─────────────────────────────────────────────────────────────────

function P({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <RevealBlock>
      <p
        className={`text-base sm:text-lg leading-[1.85] mb-5 sm:mb-6 ${
          isDark ? "text-white/75" : "text-black/75"
        }`}
      >
        {children}
      </p>
    </RevealBlock>
  );
}

function SubHead({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <RevealBlock>
      <h3
        className={`text-lg sm:text-xl lg:text-2xl font-black mt-8 sm:mt-10 mb-3 sm:mb-4 ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        {children}
      </h3>
    </RevealBlock>
  );
}

function StepBlock({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <RevealBlock>
      <div className={`my-4 sm:my-5 pl-4 sm:pl-6 border-l-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
        <p className={`text-sm sm:text-base font-black mb-1 ${isDark ? "text-[#00D4FF]" : "text-[#0066FF]"}`}>
          {title}
        </p>
        <div className={`text-sm sm:text-base leading-[1.8] ${isDark ? "text-white/70" : "text-black/70"}`}>
          {children}
        </div>
      </div>
    </RevealBlock>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WhitepaperPage() {
  const [isDark, setIsDark] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const progress = useReadingProgress();
  const activeSection = useActiveSection();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setTocOpen(false);
  }, []);

  // Reading time calc (~428 words => whitepaper is ~4200 words => ~18 min)
  const readingTime = 18;

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDark ? "bg-[#0A0A0A] text-white" : "bg-[#FAFAFA] text-black"
      }`}
    >
      {/* ─── Progress Bar ─────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1">
        <div
          className="h-full bg-gradient-to-r from-[#0066FF] via-[#00D4FF] to-[#0066FF] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── Top Nav ──────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-1 left-0 right-0 z-50 ${
          isDark ? "bg-[#0A0A0A]/95 backdrop-blur-md" : "bg-[#FAFAFA]/95 backdrop-blur-md"
        } border-b ${isDark ? "border-white/10" : "border-black/10"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/"
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 border-2 ${
                  isDark ? "border-white/20 hover:border-white/40" : "border-black/20 hover:border-black/40"
                } transition-all text-xs sm:text-sm font-black`}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">HOME</span>
              </Link>

              <div className="hidden md:flex items-center gap-2">
                <Logo size="sm" />
              </div>
            </div>

            {/* Center: current section (desktop) */}
            <div className={`hidden lg:flex items-center gap-3 text-xs font-mono ${isDark ? "text-white/40" : "text-black/40"}`}>
              <FileText className="w-3.5 h-3.5" />
              <span>WHITEPAPER v1.0</span>
              <span className="mx-1">/</span>
              <span className={isDark ? "text-[#00D4FF]" : "text-[#0066FF]"}>
                {SECTIONS.find((s) => s.id === activeSection)?.title.toUpperCase() || ""}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 border-2 text-xs font-black ${
                  isDark ? "border-white/20 hover:border-white/40" : "border-black/20 hover:border-black/40"
                } transition-all`}
              >
                {tocOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-9 h-9 flex items-center justify-center border-2 ${
                  isDark ? "border-white/20 hover:border-white/40" : "border-black/20 hover:border-black/40"
                } transition-all`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Mobile TOC Overlay ───────────────────────────────────────────── */}
      {tocOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setTocOpen(false)} />
          <div
            className={`fixed top-16 right-0 bottom-0 w-72 z-40 lg:hidden overflow-y-auto ${
              isDark ? "bg-[#0A0A0A] border-l border-white/10" : "bg-white border-l border-black/10"
            }`}
          >
            <div className="p-4 space-y-1">
              <p className={`text-[10px] font-black tracking-widest mb-3 ${isDark ? "text-white/40" : "text-black/40"}`}>
                TABLE OF CONTENTS
              </p>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-all ${
                    activeSection === s.id
                      ? "text-[#0066FF] bg-[#0066FF]/10"
                      : isDark
                      ? "text-white/50 hover:text-white hover:bg-white/5"
                      : "text-black/50 hover:text-black hover:bg-black/5"
                  }`}
                >
                  <span className="font-mono text-[10px] w-5 text-right" style={{ color: s.accent }}>
                    {s.number}
                  </span>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── Main Layout ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
          {/* ─── Desktop TOC Sidebar ────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className={`border-2 ${isDark ? "border-white/10" : "border-black/10"} p-4`}>
                <p className={`text-[10px] font-black tracking-widest mb-4 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  TABLE OF CONTENTS
                </p>
                <div className="space-y-0.5">
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const isActive = activeSection === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-[#0066FF]/10 text-[#0066FF] border-l-2 border-[#0066FF]"
                            : isDark
                            ? "text-white/40 hover:text-white/70 hover:bg-white/5 border-l-2 border-transparent"
                            : "text-black/40 hover:text-black/70 hover:bg-black/5 border-l-2 border-transparent"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? s.accent : undefined }} />
                        <span className="truncate">{s.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress ring */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                        strokeWidth="4"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="#0066FF"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-[#0066FF]">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ─── Content ────────────────────────────────────────────────── */}
          <main className="max-w-3xl pb-32">
            {/* ─── Hero / Title Block ─────────────────────────────────── */}
            <div className="mb-12 sm:mb-16">
              {/* Version badge */}
              <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 ${
                    isDark ? "border-[#0066FF]/40 bg-[#0066FF]/10" : "border-[#0066FF]/40 bg-[#0066FF]/10"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span className="text-[10px] sm:text-xs font-black text-[#0066FF]">WHITEPAPER v1.0</span>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 ${
                    isDark ? "border-white/10" : "border-black/10"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className={`text-[10px] sm:text-xs font-black ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {readingTime} MIN READ
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tighter mb-6">
                Zero-Knowledge Authentication
                <br />
                <span className="text-[#0066FF]">& Privacy Infrastructure</span>
                <br />
                for the Stellar Network
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
                <div>
                  <p className={`text-xs font-black ${isDark ? "text-white/40" : "text-black/40"}`}>AUTHOR</p>
                  <p className="font-bold text-sm sm:text-base">Adwait Keshari</p>
                </div>
                <div className={`w-px h-8 ${isDark ? "bg-white/10" : "bg-black/10"} hidden sm:block`} />
                <div>
                  <p className={`text-xs font-black ${isDark ? "text-white/40" : "text-black/40"}`}>DATE</p>
                  <p className="font-bold text-sm sm:text-base">January 2026</p>
                </div>
                <div className={`w-px h-8 ${isDark ? "bg-white/10" : "bg-black/10"} hidden sm:block`} />
                <div>
                  <p className={`text-xs font-black ${isDark ? "text-white/40" : "text-black/40"}`}>VERSION</p>
                  <p className="font-bold text-sm sm:text-base">1.0</p>
                </div>
              </div>

              {/* Divider */}
              <div className={`h-1 w-full bg-gradient-to-r from-[#0066FF] via-[#00D4FF] to-transparent`} />
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ABSTRACT */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[0]} isDark={isDark} />

            <P isDark={isDark}>
              The prevailing model of wallet interaction in decentralized finance imposes a fundamental tension between usability and self-custody. Users must either surrender control to custodial platforms or manage cryptographic key material through seed phrases, hardware devices, and browser extensions. This friction remains the single largest barrier to mainstream adoption of on-chain finance.
            </P>

            <PullQuote isDark={isDark}>
              StellaRay achieves on-chain proof verification at 94% lower gas cost than prior WASM-based approaches.
            </PullQuote>

            <P isDark={isDark}>
              StellaRay resolves this tension by introducing a zero-knowledge authentication layer for the Stellar network that derives self-custodial wallets deterministically from OAuth identity tokens, verified through Groth16 proofs on the BN254 elliptic curve. By leveraging Stellar&apos;s Protocol 25 (X-Ray), which introduces native host functions for BN254 arithmetic and Poseidon hashing within Soroban smart contracts, StellaRay achieves on-chain proof verification at 94% lower gas cost than prior WASM-based approaches. The result is an authentication primitive that requires nothing beyond a Google account, reveals nothing about the user&apos;s identity to the blockchain, and maintains complete self-custody throughout.
            </P>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 1. INTRODUCTION */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[1]} isDark={isDark} />

            <P isDark={isDark}>
              Every transaction on a public blockchain begins with a signature, and every signature begins with a private key. The question of how ordinary people should manage private keys has remained stubbornly unresolved for over a decade. The industry&apos;s answer has oscillated between two poles: custodial wallets that sacrifice the core promise of decentralization, and self-custodial wallets that demand technical literacy far beyond what most users possess.
            </P>

            <P isDark={isDark}>
              The consequences of this impasse are visible in the data. Wallet abandonment rates exceed 70% within the first week of creation across most chains. Support tickets related to seed phrase recovery consume a disproportionate share of engineering resources at every major protocol. And the billions of dollars lost to phishing attacks exploiting seed phrase entry represent not merely a security failure but a design failure: the system asks humans to behave like machines, and humans predictably refuse.
            </P>

            <PullQuote isDark={isDark}>
              Stellar&apos;s design philosophy has always prioritized real-world payment utility over speculative complexity.
            </PullQuote>

            <P isDark={isDark}>
              Stellar occupies a distinctive position in this landscape. Its design philosophy has always prioritized real-world payment utility over speculative complexity. Its consensus protocol settles transactions in three to five seconds. Its fee structure makes micropayments economically viable. Yet Stellar wallet adoption faces the same fundamental friction as every other chain: the requirement that users manage Ed25519 keypairs through mechanisms that were designed for cryptographers, not for the billions of people whom Stellar intends to serve.
            </P>

            <P isDark={isDark}>
              StellaRay proposes a different approach. Rather than abstracting key management behind yet another custodial intermediary, we eliminate the need for users to encounter keys at all, without surrendering custody. The mechanism is straightforward in principle: a user authenticates with their existing Google account; a wallet is derived deterministically from their OAuth identity token using a combination of Poseidon hashing and Ed25519 seed generation; and a Groth16 zero-knowledge proof verifies on-chain that the wallet belongs to a legitimately authenticated user, without revealing which user that is.
            </P>

            <P isDark={isDark}>
              The critical enabler for this architecture arrived in January 2026 with the activation of Stellar Protocol 25, internally designated X-Ray. Protocol 25 introduced native Soroban host functions for BN254 elliptic curve operations and Poseidon permutations. These primitives, previously available only through expensive WASM-compiled libraries, can now execute at near-native speed within smart contracts. This single protocol upgrade transformed zero-knowledge proof verification from a theoretical possibility on Stellar into a practical, gas-efficient operation.
            </P>

            <P isDark={isDark}>
              This paper describes the complete StellaRay system: its cryptographic construction, its authentication protocol, its on-chain verification mechanism, and the privacy-preserving eligibility framework built atop these foundations.
            </P>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 2. BACKGROUND AND PRIOR ART */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[2]} isDark={isDark} />

            <SubHead isDark={isDark}>2.1 The Zero-Knowledge Login Problem</SubHead>

            <P isDark={isDark}>
              The concept of deriving blockchain wallets from OAuth tokens represents a compelling approach to the key management problem. A combination of OAuth identity, a user-specific salt, and zero-knowledge proof generation can produce a deterministic wallet address tied to a web identity without exposing that identity on-chain. The approach works because the public input to the proof is a commitment (a hash of the identity data), while the identity data itself remains a private witness known only to the prover.
            </P>

            <P isDark={isDark}>
              Stellar&apos;s Soroban runtime was not originally designed with zero-knowledge proof verification in mind. Prior to Protocol 25, verifying a single Groth16 proof on Stellar required executing BN254 pairing computations within WASM, consuming approximately 4.1 million gas units per verification. At this cost, ZK-based authentication was technically possible but economically impractical. Protocol 25 changed everything.
            </P>

            <SubHead isDark={isDark}>2.2 Stellar Protocol 25: X-Ray</SubHead>

            <P isDark={isDark}>
              Protocol 25 introduced four categories of cryptographic host functions to the Soroban runtime:
            </P>

            <RevealBlock>
              <div className={`my-6 p-4 sm:p-6 border-2 ${isDark ? "border-[#00D4FF]/30 bg-[#00D4FF]/5" : "border-[#0066FF]/30 bg-[#0066FF]/5"}`}>
                <p className={`font-black text-sm sm:text-base mb-3 ${isDark ? "text-[#00D4FF]" : "text-[#0066FF]"}`}>BN254 Elliptic Curve Operations</p>
                <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-black/70"}`}>
                  Three host functions expose the arithmetic of the BN254 (alt_bn128) curve directly to smart contracts: <code className="font-mono text-[#00D4FF]">bls12_381_g1_add</code> for point addition on the G1 subgroup, <code className="font-mono text-[#00D4FF]">bls12_381_g1_mul</code> for scalar multiplication, and <code className="font-mono text-[#00D4FF]">bls12_381_multi_pairing_check</code> for the bilinear pairing verification that forms the core of Groth16 proof checking. These operations execute as native compiled code rather than interpreted WASM, reducing the gas cost of a complete pairing check from millions of gas units to approximately 260,000.
                </p>
              </div>
            </RevealBlock>

            <RevealBlock>
              <div className={`my-6 p-4 sm:p-6 border-2 ${isDark ? "border-[#0066FF]/30 bg-[#0066FF]/5" : "border-[#0066FF]/30 bg-[#0066FF]/5"}`}>
                <p className={`font-black text-sm sm:text-base mb-3 ${isDark ? "text-[#0066FF]" : "text-[#0066FF]"}`}>Poseidon Hash Permutations</p>
                <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-black/70"}`}>
                  The <code className="font-mono text-[#0066FF]">poseidon_permutation</code> and <code className="font-mono text-[#0066FF]">poseidon2_permutation</code> host functions provide the algebraic hash function that underpins virtually all modern ZK proof systems. Poseidon&apos;s design is optimized for arithmetic circuits: it operates over prime fields (in our case, the BN254 scalar field Fr) using a combination of full and partial S-box rounds, achieving collision resistance with far fewer constraints than Keccak or SHA-256 would require within a circuit.
                </p>
              </div>
            </RevealBlock>

            <PullQuote isDark={isDark}>
              These host functions collectively reduce the cost of on-chain ZK proof verification by 94% compared to the WASM baseline.
            </PullQuote>

            <SubHead isDark={isDark}>2.3 Groth16 on BN254</SubHead>

            <P isDark={isDark}>
              The Groth16 proof system, introduced by Jens Groth in 2016, remains the most compact non-interactive zero-knowledge proof construction in widespread use. A Groth16 proof consists of three elliptic curve points: one G1 point (pi_A, 64 bytes), one G2 point (pi_B, 128 bytes), and one G1 point (pi_C, 64 bytes), for a total proof size of 256 bytes regardless of the complexity of the statement being proved.
            </P>

            <P isDark={isDark}>
              Verification reduces to a single equation involving four bilinear pairings:
            </P>

            <CodeBlock isDark={isDark}>{`e(pi_A, pi_B) = e(alpha, beta) * e(sum(pub_i * IC_i), gamma) * e(pi_C, delta)`}</CodeBlock>

            <P isDark={isDark}>
              where <code className="font-mono text-[#00D4FF]">e()</code> denotes the optimal Ate pairing on BN254, <code className="font-mono text-[#00D4FF]">alpha, beta, gamma, delta</code> are circuit-specific constants from the trusted setup, <code className="font-mono text-[#00D4FF]">IC_i</code> are the input commitment points, and <code className="font-mono text-[#00D4FF]">pub_i</code> are the public inputs. The practical consequence is that verifying any statement costs the same fixed gas regardless of the statement&apos;s complexity. The prover bears the computational burden; the verifier merely checks a constant-size proof.
            </P>

            <SubHead isDark={isDark}>2.4 Poseidon as an Identity Commitment</SubHead>

            <P isDark={isDark}>
              Traditional hash functions like SHA-256 produce outputs that are prohibitively expensive to verify inside arithmetic circuits. Poseidon was designed specifically for this use case: its algebraic structure over prime fields means that a Poseidon hash computation translates into a small number of field multiplications and additions within a Groth16 circuit.
            </P>

            <P isDark={isDark}>StellaRay uses Poseidon with the following parameters:</P>

            <RevealBlock>
              <div className={`my-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4`}>
                {[
                  ["State size (t)", "3"],
                  ["S-box exponent (d)", "5"],
                  ["Full rounds", "8"],
                  ["Partial rounds", "57"],
                  ["Field", "BN254 Fr"],
                  ["Security", "128-bit"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={`p-3 sm:p-4 border-2 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}
                  >
                    <p className={`text-[10px] font-black tracking-wider mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
                      {label}
                    </p>
                    <p className="text-lg sm:text-xl font-black text-[#0066FF]">{value}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 3. PROTOCOL DESIGN */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[3]} isDark={isDark} />

            <SubHead isDark={isDark}>3.1 System Overview</SubHead>

            <P isDark={isDark}>
              The StellaRay protocol consists of four cooperating components:
            </P>

            <RevealBlock>
              <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { n: "01", title: "Client Application", desc: "Manages OAuth flow, generates ephemeral keypairs, constructs proof requests." },
                  { n: "02", title: "Salt Service", desc: "Stores per-user random value used in address derivation for deterministic wallets." },
                  { n: "03", title: "Prover Service", desc: "Generates Groth16 proofs from private identity data and public commitment." },
                  { n: "04", title: "On-Chain Verifier", desc: "Soroban smart contract validating proofs via Protocol 25 BN254 host functions." },
                ].map((c) => (
                  <div
                    key={c.n}
                    className={`p-4 sm:p-5 border-2 ${isDark ? "border-white/10 hover:border-[#0066FF]/40" : "border-black/10 hover:border-[#0066FF]/40"} transition-colors`}
                  >
                    <span className="text-3xl font-black text-[#0066FF]">{c.n}</span>
                    <h4 className="font-black text-sm sm:text-base mt-2 mb-1">{c.title}</h4>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            <SubHead isDark={isDark}>3.2 Wallet Derivation</SubHead>

            <P isDark={isDark}>
              When a user authenticates with Google OAuth for the first time, the system derives a deterministic wallet address through the following procedure:
            </P>

            <StepBlock title="Step 1: OAuth Token Acquisition" isDark={isDark}>
              The user completes a standard OAuth 2.0 authorization code flow with Google. The resulting ID token contains three fields relevant to wallet derivation: <code className="font-mono text-[#00D4FF]">sub</code> (a stable, unique identifier for the Google account), <code className="font-mono text-[#00D4FF]">aud</code> (the OAuth client identifier), and <code className="font-mono text-[#00D4FF]">iss</code> (the token issuer, always accounts.google.com).
            </StepBlock>

            <StepBlock title="Step 2: Salt Retrieval" isDark={isDark}>
              The client requests the user&apos;s salt from the Salt Service, authenticating with the ID token. The Salt Service maintains a mapping from (iss, sub) pairs to random 256-bit salt values. On first access, a new salt is generated and stored; on subsequent accesses, the existing salt is returned.
            </StepBlock>

            <StepBlock title="Step 3: Address Seed Computation" isDark={isDark}>
              The address seed is computed client-side:
            </StepBlock>

            <CodeBlock isDark={isDark}>{`address_seed = Poseidon(sub, aud, salt)`}</CodeBlock>

            <StepBlock title="Step 4: Key Derivation" isDark={isDark}>
              The address seed is used to derive an Ed25519 keypair compatible with Stellar&apos;s account model:
            </StepBlock>

            <CodeBlock isDark={isDark}>{`seed_material = "stellar-zklogin-" || sub || "-" || network || "-v1"
raw_seed = SHA-256(seed_material)
keypair = Ed25519.fromSeed(raw_seed)
public_key = keypair.publicKey    // Stellar G-address
secret_key = keypair.secret       // Stellar S-key`}</CodeBlock>

            <P isDark={isDark}>
              The critical property of this derivation is determinism: the same Google account, on the same network, will always produce the same Stellar address. A user who returns after months of inactivity will recover the exact same wallet with all its balances intact, simply by signing in with Google again.
            </P>

            <StepBlock title="Step 5: Account Funding" isDark={isDark}>
              On testnet, the system requests an initial allocation of 10,000 XLM from Stellar&apos;s Friendbot service. On mainnet, the user must fund the account through a separate deposit.
            </StepBlock>

            <SubHead isDark={isDark}>3.3 Session Authentication</SubHead>

            <P isDark={isDark}>
              Each login session is bounded by an ephemeral keypair and a zero-knowledge proof that binds the session to a valid OAuth identity.
            </P>

            <StepBlock title="Step 1: Ephemeral Key Generation" isDark={isDark}>
              The client generates a fresh Ed25519 keypair for the session. This keypair is unrelated to the wallet keypair; it serves solely to sign transactions during the current session.
            </StepBlock>

            <StepBlock title="Step 2: Nonce Construction" isDark={isDark}>
              A nonce is constructed from the ephemeral public key and a maximum epoch value (the ledger sequence number beyond which the session expires). This nonce is included in the OAuth authorization request as the nonce parameter, binding the OAuth token to this specific ephemeral key and session window.
            </StepBlock>

            <StepBlock title="Step 3: Proof Generation" isDark={isDark}>
              After OAuth completes, the client submits the OAuth ID token, ephemeral public key, maximum epoch, and salt to the Prover Service.
            </StepBlock>

            <RevealBlock>
              <div className={`my-6 grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                <div className={`p-4 sm:p-5 border-2 ${isDark ? "border-[#00D4FF]/30 bg-[#00D4FF]/5" : "border-[#0066FF]/30 bg-[#0066FF]/5"}`}>
                  <p className={`text-xs font-black mb-3 ${isDark ? "text-[#00D4FF]" : "text-[#0066FF]"}`}>PUBLIC INPUTS (ON-CHAIN)</p>
                  <ul className={`text-xs sm:text-sm space-y-1.5 font-mono ${isDark ? "text-white/70" : "text-black/70"}`}>
                    <li>Poseidon(sub, aud, salt)</li>
                    <li>Ephemeral public key</li>
                    <li>Maximum epoch</li>
                    <li>Poseidon(iss)</li>
                  </ul>
                </div>
                <div className={`p-4 sm:p-5 border-2 ${isDark ? "border-[#FF3366]/30 bg-[#FF3366]/5" : "border-[#FF3366]/30 bg-[#FF3366]/5"}`}>
                  <p className="text-xs font-black mb-3 text-[#FF3366]">PRIVATE INPUTS (PROVER ONLY)</p>
                  <ul className={`text-xs sm:text-sm space-y-1.5 font-mono ${isDark ? "text-white/70" : "text-black/70"}`}>
                    <li>Full sub value</li>
                    <li>Full aud value</li>
                    <li>Salt</li>
                    <li>ID token signature</li>
                  </ul>
                </div>
              </div>
            </RevealBlock>

            <StepBlock title="Step 4: On-Chain Registration" isDark={isDark}>
              The proof is submitted to the ZK Verifier contract on Stellar. The contract performs the Groth16 pairing check using Protocol 25&apos;s bn254_multi_pairing_check host function. If verification succeeds, the ephemeral public key is registered as an authorized signer for the wallet address until the maximum epoch is reached.
            </StepBlock>

            <StepBlock title="Step 5: Transaction Signing" isDark={isDark}>
              For the remainder of the session, the ephemeral key signs transactions on behalf of the wallet. The Gateway Factory contract validates that each transaction&apos;s signer is a registered ephemeral key and that the current ledger sequence has not exceeded the maximum epoch.
            </StepBlock>

            <SubHead isDark={isDark}>3.4 Contract Architecture</SubHead>

            <RevealBlock>
              <div className="my-6 space-y-3">
                {[
                  { name: "ZK Verifier Contract", desc: "Accepts Groth16 proofs, performs the pairing check, emits verification results. Holds the verification key (circuit-specific constants alpha, beta, gamma, delta, and IC points)." },
                  { name: "Gateway Factory Contract", desc: "Manages mapping between wallet addresses and authorized ephemeral signers. Registers new ephemeral keys upon proof verification, validates signers per transaction." },
                  { name: "JWK Registry Contract", desc: "Maintains on-chain cache of Google's JSON Web Keys for ID token authenticity verification. Updated periodically by an off-chain oracle." },
                  { name: "x402 Facilitator Contract", desc: "Handles HTTP 402 (Payment Required) micropayment flows, enabling content gating behind Stellar payments with intent-based pre-authorization." },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={`p-4 border-l-4 border-[#0066FF] ${isDark ? "bg-white/[0.02]" : "bg-black/[0.02]"}`}
                  >
                    <p className="font-black text-sm mb-1">{c.name}</p>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 4. ZK ELIGIBILITY FRAMEWORK */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[4]} isDark={isDark} />

            <P isDark={isDark}>
              Authentication alone, while valuable, represents only the foundation of what zero-knowledge proofs can accomplish. StellaRay extends the core proof system into a general-purpose eligibility framework that allows users to prove arbitrary properties about themselves without revealing the underlying data.
            </P>

            {[
              {
                title: "4.1 Proof of Solvency",
                desc: "A user can prove that their balance exceeds a specified threshold without disclosing the actual balance.",
                code: `threshold_hash = Poseidon(threshold, asset)
balance_commitment = Poseidon(actual_balance, salt)
address_hash = Poseidon(wallet_address)`,
                detail: "The circuit enforces two constraints: that the balance commitment is correctly formed, and that the balance is greater than or equal to the threshold. The verifier learns only that the balance exceeds the threshold; the magnitude of the surplus remains private.",
              },
              {
                title: "4.2 Proof of Identity",
                desc: "A user can prove that they hold a verified identity from a recognized provider without exposing any identifying information.",
                code: `identity_commitment = Poseidon(email, subject, salt)
provider_hash = Poseidon(provider)
address_hash = Poseidon(wallet_address)`,
                detail: "This construction enables regulatory compliance scenarios where a protocol must verify that its users are real humans with verified identities, without accumulating the identity data that creates privacy liability and regulatory burden.",
              },
              {
                title: "4.3 Proof of Eligibility",
                desc: "The most general construction allows proving membership in arbitrary categories defined by configurable criteria.",
                code: `criteria_proof = Poseidon(criteria_id, private_attr_1, ..., private_attr_n)
address_hash = Poseidon(wallet_address)`,
                detail: "Supported criteria include age verification, accredited investor status, KYC completion, and membership in permissioned groups. The framework is extensible: new criteria require only a new circuit definition and corresponding verification key deployment.",
              },
              {
                title: "4.4 Proof of History",
                desc: "A user can prove properties of their transaction history without revealing individual transactions.",
                code: `threshold_hash = Poseidon(min_transactions, min_volume, asset)
count_commitment = Poseidon(actual_count, salt)
volume_commitment = Poseidon(actual_volume, salt)
address_hash = Poseidon(wallet_address)`,
                detail: "This enables on-chain credit scoring, loyalty program qualification, and tiered access to financial products, all without exposing the user's transaction graph.",
              },
            ].map((proof) => (
              <RevealBlock key={proof.title}>
                <SubHead isDark={isDark}>{proof.title}</SubHead>
                <P isDark={isDark}>{proof.desc}</P>
                <CodeBlock isDark={isDark}>{proof.code}</CodeBlock>
                <P isDark={isDark}>{proof.detail}</P>
              </RevealBlock>
            ))}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 5. PAYMENT INFRASTRUCTURE */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[5]} isDark={isDark} />

            <SubHead isDark={isDark}>5.1 Instant Payments</SubHead>

            <P isDark={isDark}>
              StellaRay wraps Stellar&apos;s native payment operations in a developer-friendly SDK that abstracts the complexities of account creation, trustline management, and transaction construction. A payment is initiated with a single function call:
            </P>

            <CodeBlock isDark={isDark}>{`await wallet.sendPayment(destination, 'native', '100')`}</CodeBlock>

            <P isDark={isDark}>
              The SDK handles account existence checks (creating the destination account if necessary), fee estimation, transaction building, signing with the ephemeral session key, and submission to the Stellar network. Settlement occurs within 3 to 5 seconds.
            </P>

            <SubHead isDark={isDark}>5.2 Streaming Payments</SubHead>

            <P isDark={isDark}>
              For continuous payment scenarios such as payroll, subscription services, and real-time royalty distribution, StellaRay implements a streaming payment protocol with four distribution curves:
            </P>

            <RevealBlock>
              <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { curve: "Linear", formula: "total * (elapsed / duration)", desc: "Proportional vesting over the stream duration." },
                  { curve: "Cliff", formula: "0 until cliff, then linear", desc: "No funds until a specified cliff time, then linear vesting begins." },
                  { curve: "Exponential", formula: "total * (1 - e^(-k * t/d))", desc: "Front-loads payment, delivering majority of funds early." },
                  { curve: "Stepped", formula: "Discrete increments at intervals", desc: "Models traditional periodic payments like monthly salaries." },
                ].map((c) => (
                  <div key={c.curve} className={`p-4 border-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                    <p className="font-black text-sm text-[#0066FF] mb-1">{c.curve}</p>
                    <p className={`text-[10px] font-mono mb-2 ${isDark ? "text-[#00D4FF]" : "text-[#0066FF]"}`}>{c.formula}</p>
                    <p className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            <SubHead isDark={isDark}>5.3 The x402 Micropayment Protocol</SubHead>

            <P isDark={isDark}>
              The HTTP 402 status code (Payment Required) has been reserved since 1999 but never standardized. StellaRay implements a practical interpretation: when a server responds with 402, the response headers specify the payment amount, recipient, and asset. The client SDK parses this requirement, executes the payment on Stellar, and retries the request with a payment proof in the headers.
            </P>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 6. SECURITY ANALYSIS */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[6]} isDark={isDark} />

            <SubHead isDark={isDark}>6.1 Threat Model</SubHead>

            <P isDark={isDark}>StellaRay&apos;s security rests on four assumptions:</P>

            <RevealBlock>
              <div className="my-6 space-y-3">
                {[
                  { n: "1", title: "Google OAuth Integrity", desc: "If an attacker can forge Google ID tokens, they can derive any user's wallet. This is the same trust assumption made by every application that uses Google Sign-In." },
                  { n: "2", title: "BN254 Discrete Logarithm Hardness", desc: "The current best attack against the 254-bit BN254 curve requires approximately 2^100 operations, considered sufficient for the foreseeable future." },
                  { n: "3", title: "Honest Trusted Setup", desc: "Groth16 requires a one-time setup ceremony. StellaRay mitigates risk through multi-party computation ceremonies." },
                  { n: "4", title: "Stellar Ledger Finality", desc: "Stellar's Federated Byzantine Agreement provides deterministic finality: once confirmed, transactions cannot be reversed." },
                ].map((a) => (
                  <div key={a.n} className={`flex gap-4 p-4 border-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                    <span className="text-2xl font-black text-[#0066FF] flex-shrink-0">{a.n}</span>
                    <div>
                      <p className="font-black text-sm mb-1">{a.title}</p>
                      <p className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealBlock>

            <SubHead isDark={isDark}>6.2 Attack Vectors and Mitigations</SubHead>

            <RevealBlock>
              <div className="my-6 space-y-3">
                {[
                  { title: "Replay Attacks", desc: "Each proof binds to a specific ephemeral key and maximum epoch. The on-chain verifier tracks used nullifiers, preventing any proof from being submitted twice." },
                  { title: "Session Hijacking", desc: "If an attacker obtains the ephemeral private key, they can sign transactions until expiry. Sessions default to 24 hours. The ephemeral key is held only in memory and destroyed when the browser tab closes." },
                  { title: "Identity Correlation", desc: "Without knowledge of the user's salt and OAuth subject identifier, observers cannot link wallet addresses to any real-world identity." },
                  { title: "Salt Service Compromise", desc: "A compromised Salt Service reveals identity-to-salt mapping but cannot access wallets: key derivation also requires the sub value, available only through a valid OAuth flow." },
                ].map((v) => (
                  <div key={v.title} className={`p-4 border-l-4 border-[#FF3366] ${isDark ? "bg-[#FF3366]/5" : "bg-[#FF3366]/5"}`}>
                    <p className="font-black text-sm mb-1">{v.title}</p>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 7. PERFORMANCE ANALYSIS */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[7]} isDark={isDark} />

            <SubHead isDark={isDark}>7.1 Gas Costs</SubHead>

            <DataTable
              isDark={isDark}
              highlightLast
              headers={["Operation", "Pre-P25 (WASM)", "Protocol 25", "Reduction"]}
              rows={[
                ["BN254 G1 Add", "~45,000", "~2,800", "93.8%"],
                ["BN254 G1 Mul", "~180,000", "~11,200", "93.8%"],
                ["BN254 Pairing (4)", "~3,800,000", "~230,000", "93.9%"],
                ["Poseidon Hash (3)", "~85,000", "~12,000", "85.9%"],
                ["Full Groth16", "~4,100,000", "~260,000", "93.7%"],
              ]}
            />

            <PullQuote isDark={isDark}>
              The 94% reduction in verification cost is the single most consequential number in this paper. It transforms ZK authentication from an expensive novelty into an operation comparable in cost to a standard token transfer.
            </PullQuote>

            <SubHead isDark={isDark}>7.2 Latency</SubHead>

            <DataTable
              isDark={isDark}
              highlightLast
              headers={["Phase", "Duration"]}
              rows={[
                ["OAuth consent & token exchange", "800 - 1,500 ms"],
                ["Salt retrieval", "50 - 200 ms"],
                ["Ephemeral key generation", "< 10 ms"],
                ["Address computation", "< 5 ms"],
                ["Proof generation (Prover Service)", "1,200 - 2,500 ms"],
                ["On-chain verification & registration", "3,000 - 5,000 ms"],
                ["Total", "5 - 9 seconds"],
              ]}
            />

            <SubHead isDark={isDark}>7.3 Proof Characteristics</SubHead>

            <RevealBlock>
              <div className="my-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Proof Size", value: "256 B" },
                  { label: "Public Inputs", value: "128 B" },
                  { label: "Verify Time", value: "~12 ms" },
                  { label: "Prove Time", value: "1.2-2.5s" },
                  { label: "Validity", value: "24 hrs" },
                ].map((p) => (
                  <div key={p.label} className={`p-3 sm:p-4 border-2 text-center ${isDark ? "border-white/10" : "border-black/10"}`}>
                    <p className={`text-[10px] font-black tracking-wider mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>{p.label}</p>
                    <p className="text-lg sm:text-xl font-black text-[#00D4FF]">{p.value}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 8. SDK ARCHITECTURE */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[8]} isDark={isDark} />

            <P isDark={isDark}>
              StellaRay is distributed as a TypeScript SDK (<code className="font-mono text-[#00D4FF]">@stellar-zklogin/sdk</code>) that provides three tiers of abstraction:
            </P>

            <RevealBlock>
              <div className="my-6 space-y-3">
                {[
                  { tier: "TIER 1", title: "Core Client", desc: "The ZkLoginClient class manages the complete authentication lifecycle: session initialization, OAuth completion, address computation, proof generation, and on-chain registration. Framework-agnostic, works in any JavaScript environment.", color: "#0066FF" },
                  { tier: "TIER 2", title: "Payment & Streaming", desc: "StreamingClient and X402PaymentClient provide high-level interfaces for streaming payments and micropayment protocols. Handle escrow management, curve computation, withdrawal calculations, and HTTP 402 response parsing.", color: "#00D4FF" },
                  { tier: "TIER 3", title: "React Integration", desc: "ZkLoginProvider, useZkLogin, and useZkWallet hooks provide React-native state management. Pre-built LoginButton and WalletWidget components offer drop-in UI elements.", color: "#0066FF" },
                ].map((t) => (
                  <div key={t.tier} className={`p-4 sm:p-5 border-2`} style={{ borderColor: `${t.color}40` }}>
                    <span className="text-[10px] font-black tracking-widest" style={{ color: t.color }}>{t.tier}</span>
                    <p className="font-black text-sm sm:text-base mt-1 mb-2">{t.title}</p>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 9. NETWORK DEPLOYMENT */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[9]} isDark={isDark} />

            <SubHead isDark={isDark}>9.1 Testnet</SubHead>

            <P isDark={isDark}>
              StellaRay&apos;s complete contract suite has been deployed to the Stellar testnet since January 7, 2026:
            </P>

            <RevealBlock>
              <div className="my-6 space-y-2">
                {[
                  { name: "ZK Verifier", id: "CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6" },
                  { name: "Gateway Factory", id: "CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76" },
                  { name: "JWK Registry", id: "CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I" },
                  { name: "x402 Facilitator", id: "CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ" },
                ].map((c) => (
                  <div key={c.name} className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 border ${isDark ? "border-white/10" : "border-black/10"}`}>
                    <span className="text-xs font-black text-[#0066FF] w-32 flex-shrink-0">{c.name}</span>
                    <code className={`text-[10px] sm:text-xs font-mono break-all ${isDark ? "text-white/50" : "text-black/50"}`}>{c.id}</code>
                  </div>
                ))}
              </div>
            </RevealBlock>

            <SubHead isDark={isDark}>9.2 Mainnet</SubHead>

            <P isDark={isDark}>
              Mainnet deployment is in the final testing phase following the activation of Protocol 25 on the Stellar public network on January 22, 2026.
            </P>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 10. FUTURE DIRECTIONS */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[10]} isDark={isDark} />

            <RevealBlock>
              <div className="my-6 space-y-4">
                {[
                  { title: "Multi-Provider Support", desc: "Architecture designed to accommodate Apple, Microsoft, GitHub OIDC providers. Each provider requires its own verification key but shares the same proof structure and on-chain verifier." },
                  { title: "Recursive Proof Composition", desc: "Future release will support composite proofs combining identity, solvency, and eligibility attestations into a single 256-byte proof with a single on-chain verification." },
                  { title: "Privacy-Preserving Analytics", desc: "Extending the eligibility framework to support aggregate statistics over private data using ZK-friendly aggregation circuits." },
                  { title: "On-Chain Governance Integration", desc: "Combining ZK eligibility proofs with Stellar governance proposals, enabling anonymous yet verified voting and community participation without exposing voter identity." },
                ].map((f) => (
                  <div key={f.title} className={`p-4 sm:p-5 border-l-4 border-[#00D4FF] ${isDark ? "bg-[#00D4FF]/5" : "bg-[#00D4FF]/5"}`}>
                    <p className="font-black text-sm sm:text-base mb-1">{f.title}</p>
                    <p className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 11. CONCLUSION */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <SectionHeader section={SECTIONS[11]} isDark={isDark} />

            <P isDark={isDark}>
              The practical barrier to blockchain adoption has never been consensus algorithms, throughput limitations, or fee structures. It has been, and remains, the impossibility of expecting ordinary people to manage cryptographic keys. StellaRay removes this barrier for the Stellar network by reducing wallet creation to a Google Sign-In and reducing identity verification to a 256-byte proof.
            </P>

            <P isDark={isDark}>
              The technical contribution of this work is twofold. First, we demonstrate that Stellar&apos;s Protocol 25 host functions make Groth16 verification economically practical on a network that was not originally designed for zero-knowledge computation. Second, we extend the authentication primitive into a general eligibility framework that enables privacy-preserving solvency proofs, identity attestations, and transaction history verification.
            </P>

            <PullQuote isDark={isDark}>
              Privacy is not a feature to be bolted onto financial infrastructure after the fact. It is a prerequisite for financial infrastructure that serves everyone.
            </PullQuote>

            <P isDark={isDark}>
              The system is live on testnet with mainnet deployment imminent. The SDK is available as an open-source TypeScript package. Every component, from the Soroban contracts to the prover service, is designed to be audited, forked, and extended by the Stellar developer community.
            </P>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* REFERENCES */}
            {/* ═══════════════════════════════════════════════════════════ */}

            <RevealBlock>
              <div className="pt-12 sm:pt-16 mt-12 sm:mt-16 border-t-2 border-[#0066FF]/30">
                <h2 className={`text-2xl sm:text-3xl font-black mb-6 ${isDark ? "text-white" : "text-black"}`}>References</h2>
                <div className="space-y-3">
                  {[
                    "[1] Groth, J. (2016). On the Size of Pairing-based Non-interactive Arguments. EUROCRYPT 2016. Springer.",
                    "[2] Grassi, L., Khovratovich, D., et al. (2021). Poseidon: A New Hash Function for Zero-Knowledge Proof Systems. USENIX Security 2021.",
                    "[3] Stellar Development Foundation. (2025). Soroban Smart Contracts: Runtime Specification and Host Function Reference.",
                    "[4] Stellar Development Foundation. (2025). CAP-0074: BN254 Host Functions for Soroban.",
                    "[5] Stellar Development Foundation. (2025). CAP-0075: Poseidon Hash Host Functions for Soroban.",
                    "[6] Barreto, P., Naehrig, M. (2006). Pairing-Friendly Elliptic Curves of Prime Order. SAC 2005. Springer.",
                    "[7] Ben-Sasson, E., et al. (2014). Succinct Non-Interactive Zero Knowledge for a von Neumann Architecture. USENIX Security 2014.",
                    "[8] Mazieres, D. (2015). The Stellar Consensus Protocol. Stellar Development Foundation.",
                    "[9] Bowe, S., Gabizon, A., Miers, I. (2017). Scalable Multi-party Computation for zk-SNARK Parameters. IACR ePrint Archive.",
                    "[10] Stellar Development Foundation. (2026). Protocol 25 (X-Ray) Activation Report and Performance Benchmarks.",
                  ].map((ref, i) => (
                    <p key={i} className={`text-xs sm:text-sm font-mono leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
                      {ref}
                    </p>
                  ))}
                </div>
              </div>
            </RevealBlock>

            {/* ─── Footer Note ──────────────────────────────────────── */}
            <RevealBlock>
              <div className={`mt-12 sm:mt-16 p-6 sm:p-8 border-2 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"} text-center`}>
                <p className={`text-xs sm:text-sm italic ${isDark ? "text-white/40" : "text-black/40"}`}>
                  StellaRay is an open-source project. The SDK, contract source code, and documentation are available at github.com/stellar-zklogin/sdk. This paper will be updated as the protocol evolves.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <Link
                    href="/sdk"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF] text-white font-black text-xs border-2 border-[#0066FF] hover:bg-[#0066FF]/90 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                    EXPLORE SDK
                  </Link>
                  <Link
                    href="/"
                    className={`inline-flex items-center gap-2 px-4 py-2 font-black text-xs border-2 ${isDark ? "border-white/20 hover:border-white/40" : "border-black/20 hover:border-black/40"} transition-colors`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    BACK HOME
                  </Link>
                </div>
              </div>
            </RevealBlock>
          </main>
        </div>
      </div>

      {/* ─── Scroll to Top Button ─────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-[#0066FF] flex items-center justify-center border-2 border-[#0066FF] shadow-lg hover:bg-[#0066FF]/90 transition-all"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
