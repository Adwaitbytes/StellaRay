"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, Shield, Globe, Lock, Check, Sun, Moon, Cpu, Hash, Code } from "lucide-react";
import LoadingScreen, { ButtonLoader } from "@/components/LoadingScreen";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(false);

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
    setIsLoading(true);
    await signIn("google");
  };

  const features = [
    {
      icon: Zap,
      title: "2 Second Setup",
      description: "No seed phrases. No extensions. Just your Google account.",
      accent: "#FF3366",
    },
    {
      icon: Shield,
      title: "Zero-Knowledge",
      description: "Your identity stays private. Cryptographic proof, not trust.",
      accent: "#00FF88",
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
      accent: "#FFD600",
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
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'} border-b-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center text-2xl font-black`}>
                S
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-black tracking-tighter">STELLAR</span>
                <span className="text-2xl font-black tracking-tighter text-[#FF3366]">GATEWAY</span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              {/* SDK Link */}
              <Link
                href="/sdk"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black' : 'border-[#00AA55] text-[#00AA55] hover:bg-[#00AA55] hover:text-white'} font-black text-sm transition-all`}
              >
                <Code className="w-4 h-4" />
                SDK
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-12 h-12 border-4 ${isDark ? 'border-white bg-transparent hover:bg-white hover:text-black' : 'border-black bg-transparent hover:bg-black hover:text-white'} flex items-center justify-center transition-all duration-200`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Testnet */}
              <div className={`hidden sm:block px-4 py-2 border-4 ${isDark ? 'border-[#00FF88] text-[#00FF88]' : 'border-[#00AA55] text-[#00AA55]'} font-black text-sm`}>
                TESTNET
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
                <div className={`inline-flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-[#00AA55] bg-[#00AA55]/10'}`}>
                  <Zap className={`w-4 h-4 ${isDark ? 'text-[#39FF14]' : 'text-[#00AA55]'}`} />
                  <span className={`font-black text-sm ${isDark ? 'text-[#39FF14]' : 'text-[#00AA55]'}`}>X-RAY PROTOCOL 25</span>
                  <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 border-4 ${isDark ? 'border-[#FF3366] text-[#FF3366]' : 'border-[#CC0033] text-[#CC0033]'}`}>
                  <span className="font-black text-sm">STELLAR + ZKLOGIN</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-8">
                CRYPTO
                <br />
                <span className="text-[#FF3366]">WITHOUT</span>
                <br />
                THE BULLSHIT
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
                <div className={`absolute inset-0 ${isDark ? 'bg-[#FF3366]' : 'bg-[#CC0033]'} translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3`} />
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
                    <div className="w-4 h-4 bg-[#FF3366]" />
                    <div className="w-4 h-4 bg-[#FFD600]" />
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
                  <p className={`font-bold mt-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>≈ $1,200 USD</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {stats.map((stat, i) => (
                    <div key={i} className={`p-4 border-4 ${isDark ? 'border-white/20' : 'border-black/20'} text-center`}>
                      <p className={`text-2xl font-black ${i === 0 ? 'text-[#FF3366]' : i === 1 ? 'text-[#00D4FF]' : 'text-[#00FF88]'}`}>
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
            WHY <span className="text-[#FF3366]">STELLAR</span>GATEWAY?
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 via-transparent to-[#00D4FF]/5" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#39FF14] flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">
                <span className="text-[#39FF14]">X-RAY</span> PROTOCOL
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
                  accent: "#39FF14",
                  stat: "94%",
                  statLabel: "Gas Savings"
                },
                {
                  icon: Hash,
                  title: "Poseidon Hash",
                  description: "ZK-optimized hash function built into the protocol.",
                  accent: "#00D4FF",
                  stat: "10x",
                  statLabel: "Faster"
                },
                {
                  icon: Shield,
                  title: "Groth16 Proofs",
                  description: "Succinct non-interactive zero-knowledge proofs.",
                  accent: "#FF10F0",
                  stat: "12ms",
                  statLabel: "Verify Time"
                },
                {
                  icon: Lock,
                  title: "Privacy First",
                  description: "Prove identity without revealing personal data.",
                  accent: "#FFD600",
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
                  <span className={`text-6xl font-black ${i === 0 ? 'text-[#FF3366]' : i === 1 ? 'text-[#00FF88]' : 'text-[#00D4FF]'}`}>
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

      {/* CTA */}
      <section className={`py-24 px-6 lg:px-8 relative overflow-hidden ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'}`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF3366]/10 via-transparent to-[#00FF88]/10" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-[#FF3366]/30" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-[#00FF88]/30" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-[#00D4FF]/30" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-[#FFD600]/30" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`inline-block px-4 py-2 mb-6 border-2 ${isDark ? 'border-[#00FF88]/50 text-[#00FF88]' : 'border-[#00AA55]/50 text-[#00AA55]'} font-bold text-sm`}>
            START FOR FREE
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6">
            READY TO <span className="text-[#FF3366]">START</span>?
          </h2>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Get 10,000 free testnet XLM and experience the future of crypto wallets.
          </p>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="group relative inline-block"
          >
            <div className="absolute inset-0 bg-[#FF3366] translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className={`relative flex items-center justify-center gap-4 px-12 py-6 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-black'} font-black text-xl border-4 border-[#FF3366] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1`}>
              {isLoading ? (
                <ButtonLoader color="#FF3366" text="CREATING" />
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
            <div className={`w-8 h-8 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center font-black`}>
              S
            </div>
            <span className={`font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Built on Stellar. Secured by zkLogin.
            </span>
          </div>
          <div className="flex gap-8">
            <Link href="/sdk" className={`font-bold text-sm hover:text-[#FF3366] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              DOCS
            </Link>
            <Link href="/sdk-demo" className={`font-bold text-sm hover:text-[#39FF14] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SDK DEMO
            </Link>
            <Link href="/sdk-live" className={`font-bold text-sm hover:text-[#CB3837] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              NPM LIVE
            </Link>
            <a href="https://github.com/stellar-zklogin/sdk" target="_blank" rel="noopener noreferrer" className={`font-bold text-sm hover:text-[#FF3366] transition-colors ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              GITHUB
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
