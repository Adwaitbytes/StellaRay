"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, Shield, Globe, Lock, Check, Sun, Moon, Cpu, Hash, Code, FileText, BookOpen } from "lucide-react";
import LoadingScreen, { ButtonLoader } from "@/components/LoadingScreen";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import Link from "next/link";
import { getCurrentNetwork, type NetworkType } from "@/lib/stellar";
import { FEATURES } from "@/config/features";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [network, setNetwork] = useState<NetworkType>("testnet");

  // Get current network on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNetwork(getCurrentNetwork());
    }
  }, []);

  // Show content after a brief delay to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000); // Show content after 2 seconds max
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
    if (status !== "loading") {
      setShowContent(true);
    }
  }, [status, router]);

  const handleSignIn = async () => {
    // If waitlist mode is enabled, redirect to waitlist page
    if (FEATURES.WAITLIST_MODE) {
      router.push("/waitlist");
      return;
    }

    setIsLoading(true);
    await signIn("google");
  };

  const features = [
    {
      icon: Zap,
      title: "2 Second Setup",
      description: "No seed phrases. No extensions. Just your Google account.",
      accent: "#0066FF",
    },
    {
      icon: Shield,
      title: "Zero-Knowledge",
      description: "Your identity stays private. Cryptographic proof, not trust.",
      accent: "#00D4FF",
    },
    {
      icon: Globe,
      title: "Global & Instant",
      description: "Send anywhere in 3-5 seconds. Minimal fees on Stellar.",
      accent: "#00D4FF",
    },
    {
      icon: Lock,
      title: "Self-Custodial",
      description: "You control your keys. We never have access to your funds.",
      accent: "#0066FF",
    },
  ];

  const stats = [
    { value: "10K", label: "XLM FREE" },
    { value: "3-5s", label: "TX SPEED" },
    { value: "100%", label: "PRIVATE" },
  ];

  if (status === "loading" && !showContent) {
    return <LoadingScreen message="INITIALIZING" />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0A0A0A]/95 backdrop-blur-sm' : 'bg-[#F5F5F5]/95 backdrop-blur-sm'} border-b-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0066FF] flex items-center justify-center rounded-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5"/>
                  <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5"/>
                  <circle cx="12" cy="12" r="1.5" fill="white"/>
                </svg>
              </div>
              <div className="hidden sm:flex items-baseline gap-0.5">
                <span className="text-lg font-black tracking-tight">STELLA</span>
                <span className="text-lg font-black tracking-tight text-[#0066FF]">RAY</span>
              </div>
            </Link>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Whitepaper Link */}
              <Link
                href="/whitepaper"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isDark ? 'bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20' : 'bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF]/20'} font-bold text-sm transition-all`}
              >
                <FileText className="w-3.5 h-3.5" />
                PAPER
              </Link>

              {/* SDK Link */}
              <Link
                href="/sdk"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isDark ? 'bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF]/20' : 'bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF]/20'} font-bold text-sm transition-all`}
              >
                <Code className="w-3.5 h-3.5" />
                SDK
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-9 h-9 rounded-lg ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} flex items-center justify-center transition-all`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Divider */}
              <div className={`hidden sm:block w-px h-6 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

              {/* Network Switcher */}
              <div className="hidden sm:block">
                <NetworkSwitcher compact isDark={isDark} onNetworkChange={setNetwork} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Text */}
            <div>
              {/* X-Ray Protocol Badge */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-[#00D4FF] bg-[#00D4FF]/10' : 'border-[#0066FF] bg-[#0066FF]/10'}`}>
                  <Zap className={`w-4 h-4 ${isDark ? 'text-[#00D4FF]' : 'text-[#0066FF]'}`} />
                  <span className={`font-black text-sm ${isDark ? 'text-[#00D4FF]' : 'text-[#0066FF]'}`}>X-RAY PROTOCOL 25</span>
                  <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-pulse" />
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-[#0066FF] text-[#0066FF]' : 'border-[#0066FF] text-[#0066FF]'}`}>
                  <span className="font-black text-sm">STELLAR + ZKLOGIN</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-8">
                PROVE
                <br />
                <span className="text-[#0066FF]">EVERYTHING</span>
                <br />
                REVEAL NOTHING
              </h1>

              {/* Description */}
              <p className={`text-xl lg:text-2xl font-medium leading-relaxed mb-10 max-w-lg ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Sign in with Google. Get a real blockchain wallet. No seed phrases. No browser extensions. No complexity.
              </p>

              {/* CTA */}
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="group relative w-full sm:w-auto"
              >
                <div className={`absolute inset-0 bg-[#0066FF] translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3`} />
                <div className={`relative flex items-center justify-center gap-4 px-10 py-5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} font-black text-lg border-4 ${isDark ? 'border-white' : 'border-black'} transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1`}>
                  {isLoading ? (
                    <ButtonLoader text="CONNECTING" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      CONNECT WITH GOOGLE
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 mt-10">
                {["NO SEED PHRASES", "FREE TOKENS", "SELF-CUSTODY"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className={`w-5 h-5 ${isDark ? 'text-[#00FF88]' : 'text-[#00AA55]'}`} />
                    <span className={`font-bold text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Stats Card */}
            <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-[#0066FF]" />
                    <div className="w-4 h-4 bg-[#00D4FF]" />
                    <div className="w-4 h-4 bg-[#00FF88]" />
                  </div>
                  <span className="font-black text-sm">WALLET_PREVIEW.EXE</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Balance Display */}
                <div className="mb-8">
                  <p className={`font-bold text-sm mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>YOUR BALANCE</p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-6xl font-black text-[#00FF88]">10,000</span>
                    <span className={`text-2xl font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>XLM</span>
                  </div>
                  <p className={`font-bold mt-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>≈ $1,945.05 USD</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {stats.map((stat, i) => (
                    <div key={i} className={`p-4 border-4 ${isDark ? 'border-white/20' : 'border-black/20'} text-center`}>
                      <p className={`text-2xl font-black ${i === 0 ? 'text-[#0066FF]' : i === 1 ? 'text-[#00D4FF]' : 'text-[#00FF88]'}`}>
                        {stat.value}
                      </p>
                      <p className={`text-xs font-bold mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Action Buttons Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 border-4 ${isDark ? 'border-[#00D4FF] text-[#00D4FF]' : 'border-[#0099CC] text-[#0099CC]'} text-center font-black`}>
                    SEND
                  </div>
                  <div className={`p-4 border-4 ${isDark ? 'border-[#00FF88] text-[#00FF88]' : 'border-[#00AA55] text-[#00AA55]'} text-center font-black`}>
                    RECEIVE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`py-20 px-6 lg:px-8 border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-16">
            WHY <span className="text-[#0066FF]">STELLA</span>RAY?
          </h2>

          <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`p-8 transition-all duration-200 cursor-pointer ${
                    // Right border for all except last in row
                    i < features.length - 1 ? `border-r-4 ${isDark ? 'border-white' : 'border-black'} lg:border-r-4` : ''
                  } ${
                    // Bottom border for first row on sm screens (first 2 items)
                    i < 2 ? `sm:border-b-4 lg:border-b-0 ${isDark ? 'sm:border-white' : 'sm:border-black'}` : ''
                  } ${
                    // Remove right border for 2nd item on sm screens (it's end of row)
                    i === 1 ? 'sm:border-r-0 lg:border-r-4' : ''
                  } ${
                    // Add right border back for 3rd item on sm screens
                    i === 2 ? `sm:border-r-4 lg:border-r-4 ${isDark ? 'sm:border-white' : 'sm:border-black'}` : ''
                  } ${hoveredFeature === i ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : ''}`}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <feature.icon
                    className="w-10 h-10 mb-6"
                    style={{ color: hoveredFeature === i ? (isDark ? '#000' : '#fff') : feature.accent }}
                  />
                  <h3 className="text-xl font-black mb-3">{feature.title}</h3>
                  <p className={`font-medium ${hoveredFeature === i ? (isDark ? 'text-black/70' : 'text-white/70') : (isDark ? 'text-white/60' : 'text-black/60')}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* X-Ray Protocol Section */}
      <section className={`py-20 px-6 lg:px-8 border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'} relative overflow-hidden`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/5 via-transparent to-[#00D4FF]/5" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#0066FF] flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">
                <span className="text-[#00D4FF]">X-RAY</span> PROTOCOL
              </h2>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Stellar Protocol 25 - Native ZK Cryptography</p>
            </div>
          </div>

          <p className={`text-xl max-w-3xl mb-12 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Powered by native BN254 elliptic curve operations and Poseidon hash functions.
            The most efficient zero-knowledge proof verification on any blockchain.
          </p>

          <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Cpu,
                  title: "BN254 Native",
                  description: "Hardware-accelerated elliptic curve operations for Groth16 proofs.",
                  accent: "#00D4FF",
                  stat: "94%",
                  statLabel: "Gas Savings"
                },
                {
                  icon: Hash,
                  title: "Poseidon Hash",
                  description: "ZK-optimized hash function built into the protocol.",
                  accent: "#0066FF",
                  stat: "10x",
                  statLabel: "Faster"
                },
                {
                  icon: Shield,
                  title: "Groth16 Proofs",
                  description: "Succinct non-interactive zero-knowledge proofs.",
                  accent: "#00D4FF",
                  stat: "12ms",
                  statLabel: "Verify Time"
                },
                {
                  icon: Lock,
                  title: "Privacy First",
                  description: "Prove identity without revealing personal data.",
                  accent: "#0066FF",
                  stat: "100%",
                  statLabel: "Private"
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`p-6 ${
                    i < 3 ? `border-r-4 ${isDark ? 'border-white' : 'border-black'}` : ''
                  } ${
                    i < 2 ? `sm:border-b-4 lg:border-b-0 ${isDark ? 'sm:border-white' : 'sm:border-black'}` : ''
                  } ${
                    i === 1 ? 'sm:border-r-0 lg:border-r-4' : ''
                  } ${
                    i === 2 ? `sm:border-r-4 ${isDark ? 'sm:border-white' : 'sm:border-black'}` : ''
                  }`}
                >
                  <feature.icon className="w-8 h-8 mb-4" style={{ color: feature.accent }} />
                  <h3 className="text-lg font-black mb-2">{feature.title}</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{feature.description}</p>
                  <div className={`pt-4 border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <span className="text-2xl font-black" style={{ color: feature.accent }}>{feature.stat}</span>
                    <span className={`text-xs ml-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{feature.statLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`py-20 px-6 lg:px-8 border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-16">
            HOW IT <span className="text-[#00D4FF]">WORKS</span>
          </h2>

          <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
            <div className="grid sm:grid-cols-3">
              {[
                { step: "01", title: "SIGN IN", desc: "Use your existing Google account. No new passwords to remember." },
                { step: "02", title: "GET WALLET", desc: "We generate a secure blockchain wallet tied to your identity." },
                { step: "03", title: "START USING", desc: "Send, receive, and manage crypto instantly. It's that simple." },
              ].map((item, i) => (
                <div key={i} className={`p-8 ${i < 2 ? `border-r-4 ${isDark ? 'border-white' : 'border-black'}` : ''} ${i < 2 ? `border-b-4 sm:border-b-0 ${isDark ? 'border-white' : 'border-black'}` : ''}`}>
                  <span className={`text-6xl font-black ${i === 0 ? 'text-[#0066FF]' : i === 1 ? 'text-[#00D4FF]' : 'text-[#00FF88]'}`}>
                    {item.step}
                  </span>
                  <h3 className="text-2xl font-black mt-4 mb-3">{item.title}</h3>
                  <p className={`font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Whitepaper Section */}
      <section className={`py-20 px-6 lg:px-8 border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/5 via-transparent to-[#00D4FF]/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
            <div className="grid lg:grid-cols-2">
              {/* Left: Info */}
              <div className={`p-8 sm:p-12 lg:border-r-4 ${isDark ? 'lg:border-white' : 'lg:border-black'} border-b-4 lg:border-b-0 ${isDark ? 'border-white' : 'border-black'}`}>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 mb-6 ${isDark ? 'border-[#0066FF]/40 bg-[#0066FF]/10' : 'border-[#0066FF]/40 bg-[#0066FF]/10'}`}>
                  <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span className="text-[10px] sm:text-xs font-black text-[#0066FF]">WHITEPAPER v1.0</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 leading-[0.95]">
                  READ THE <span className="text-[#0066FF]">RESEARCH</span>
                </h2>
                <p className={`text-base sm:text-lg mb-8 max-w-md ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Dive into the cryptographic foundations, protocol architecture, and zero-knowledge proof system that powers StellaRay.
                </p>
                <Link
                  href="/whitepaper"
                  className="group relative inline-block"
                >
                  <div className="absolute inset-0 bg-[#0066FF] translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
                  <div className={`relative flex items-center gap-3 px-8 py-4 font-black text-base border-4 border-[#0066FF] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'}`}>
                    <BookOpen className="w-5 h-5" />
                    READ WHITEPAPER
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* Right: Key highlights */}
              <div className="p-8 sm:p-12">
                <p className={`text-[10px] font-black tracking-widest mb-6 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  KEY HIGHLIGHTS
                </p>
                <div className="space-y-5">
                  {[
                    { stat: "94%", label: "Gas Cost Reduction", desc: "Protocol 25 native BN254 host functions vs WASM baseline" },
                    { stat: "256B", label: "Proof Size", desc: "Constant-size Groth16 proofs regardless of statement complexity" },
                    { stat: "12ms", label: "Verification Time", desc: "On-chain proof verification via native Soroban host functions" },
                    { stat: "5-9s", label: "Total Auth Latency", desc: "From Google Sign-In to on-chain session registration" },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className={`text-2xl sm:text-3xl font-black flex-shrink-0 w-16 sm:w-20 ${i % 2 === 0 ? 'text-[#0066FF]' : 'text-[#00D4FF]'}`}>
                        {h.stat}
                      </span>
                      <div>
                        <p className="font-black text-sm">{h.label}</p>
                        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-24 px-6 lg:px-8 relative overflow-hidden ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'}`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/10 via-transparent to-[#00D4FF]/10" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-[#0066FF]/30" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-[#00D4FF]/30" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-[#00D4FF]/30" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-[#0066FF]/30" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`inline-block px-4 py-2 mb-6 border-2 ${isDark ? 'border-[#00FF88]/50 text-[#00FF88]' : 'border-[#00AA55]/50 text-[#00AA55]'} font-bold text-sm`}>
            START FOR FREE
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6">
            READY TO <span className="text-[#0066FF]">START</span>?
          </h2>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Get 10,000 free testnet XLM and experience the future of crypto wallets.
          </p>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="group relative inline-block"
          >
            <div className="absolute inset-0 bg-[#0066FF] translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className={`relative flex items-center justify-center gap-4 px-12 py-6 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'} font-black text-xl border-4 border-[#0066FF] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1`}>
              {isLoading ? (
                <ButtonLoader color="#0066FF" text="CREATING" />
              ) : (
                <>
                  CREATE FREE WALLET
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-6 lg:px-8 border-t-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0066FF] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2"/>
                <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className={`font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              STELLARAY — Prove Everything. Reveal Nothing.
            </span>
          </div>
          <div className="flex gap-8">
            <Link href="/whitepaper" className={`font-bold text-sm hover:text-[#00D4FF] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              PAPER
            </Link>
            <Link href="/sdk" className={`font-bold text-sm hover:text-[#0066FF] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              DOCS
            </Link>
            <Link href="/sdk-demo" className={`font-bold text-sm hover:text-[#00D4FF] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SDK DEMO
            </Link>
            <Link href="/sdk-live" className={`font-bold text-sm hover:text-[#0066FF] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              NPM LIVE
            </Link>
            <a href="https://github.com/stellar-zklogin/sdk" target="_blank" rel="noopener noreferrer" className={`font-bold text-sm hover:text-[#00D4FF] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              GITHUB
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
