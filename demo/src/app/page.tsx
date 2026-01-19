"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, Shield, Globe, ExternalLink, Sparkles, ChevronDown, Check } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#39FF14] border-t-transparent animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-[#39FF14]/20" />
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "ZERO SEED PHRASES",
      desc: "Your wallet is derived from your Google account. Nothing to write down, nothing to lose.",
      color: "#39FF14",
      stat: "100%",
      statLabel: "SECURE"
    },
    {
      icon: Zap,
      title: "2 SECOND SETUP",
      desc: "Sign in with Google and your wallet is ready. No downloads, no extensions, no complexity.",
      color: "#00D4FF",
      stat: "2s",
      statLabel: "SETUP"
    },
    {
      icon: Globe,
      title: "STELLAR POWERED",
      desc: "Built on Stellar blockchain. 5-second finality, near-zero fees, real decentralization.",
      color: "#FF10F0",
      stat: "5s",
      statLabel: "FINALITY"
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#39FF14]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF10F0]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#39FF14] blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-[#39FF14] flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-black">S</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-black tracking-tight">STELLAR</span>
                <span className="text-lg font-black tracking-tight text-[#39FF14]">GATEWAY</span>
              </div>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-3 sm:gap-6">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 text-sm font-bold text-white/60 hover:text-[#39FF14] transition-colors"
              >
                DOCS
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="px-3 py-1.5 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-bold">
                TESTNET
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[calc(100vh-80px)] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8 max-w-xl">
              {/* Announcement Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-sm">
                <Sparkles className="w-4 h-4 text-[#FFFF00]" />
                <span className="font-medium">Built on Stellar Protocol 25</span>
                <ArrowRight className="w-3 h-3 text-white/40" />
              </div>

              {/* Headline */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.9] tracking-tight">
                  YOUR WEB3
                  <br />
                  <span className="relative inline-block mt-2">
                    <span className="relative z-10">WALLET</span>
                    <div className="absolute bottom-0 left-0 right-0 h-4 sm:h-5 bg-[#39FF14] -z-0 transform -skew-x-3" />
                  </span>
                  <br />
                  <span className="text-white/40">IN 2 SECONDS</span>
                </h1>
              </div>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-md">
                Sign in with Google. Get a real Stellar wallet. No seed phrases,
                no browser extensions, no complexity. Just blockchain.
              </p>

              {/* CTA Section */}
              <div className="space-y-4 pt-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="group relative w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                  <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-black text-base sm:text-lg border-2 border-black group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        CONTINUE WITH GOOGLE
                      </>
                    )}
                  </div>
                </button>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-white/40">
                    <Check className="w-4 h-4 text-[#39FF14]" />
                    Free forever
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Check className="w-4 h-4 text-[#39FF14]" />
                    No downloads
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Check className="w-4 h-4 text-[#39FF14]" />
                    Real blockchain
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Interactive Feature Display */}
            <div className="relative mt-8 lg:mt-0">
              {/* Floating Stats */}
              <div className="hidden lg:block absolute -top-8 -right-4 z-20">
                <div className="bg-[#39FF14] text-black px-4 py-2 font-black text-sm transform rotate-3">
                  10,000 XLM FREE
                </div>
              </div>

              {/* Main Feature Card */}
              <div className="relative">
                {/* Glow effect */}
                <div
                  className="absolute inset-0 blur-3xl opacity-30 transition-colors duration-500"
                  style={{ backgroundColor: features[activeFeature].color }}
                />

                {/* Card */}
                <div className="relative border border-white/10 bg-black/50 backdrop-blur-sm">
                  {/* Active Feature Display */}
                  <div className="p-6 sm:p-8 border-b border-white/10">
                    <div className="flex items-start gap-4 sm:gap-6">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-colors duration-500 flex-shrink-0"
                        style={{ backgroundColor: features[activeFeature].color }}
                      >
                        {(() => {
                          const Icon = features[activeFeature].icon;
                          return <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-black" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-black mb-2">{features[activeFeature].title}</h3>
                        <p className="text-sm sm:text-base text-white/60 leading-relaxed">{features[activeFeature].desc}</p>
                      </div>
                    </div>

                    {/* Stat */}
                    <div className="mt-6 flex items-end gap-2">
                      <span
                        className="text-5xl sm:text-6xl font-black transition-colors duration-500"
                        style={{ color: features[activeFeature].color }}
                      >
                        {features[activeFeature].stat}
                      </span>
                      <span className="text-white/40 font-bold mb-2">{features[activeFeature].statLabel}</span>
                    </div>
                  </div>

                  {/* Feature Tabs */}
                  <div className="grid grid-cols-3">
                    {features.map((feature, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveFeature(idx)}
                        className={`p-4 sm:p-6 text-center border-r last:border-r-0 border-white/10 transition-all ${
                          activeFeature === idx ? 'bg-white/5' : 'hover:bg-white/5'
                        }`}
                      >
                        <feature.icon
                          className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 transition-colors ${
                            activeFeature === idx ? '' : 'text-white/40'
                          }`}
                          style={{ color: activeFeature === idx ? feature.color : undefined }}
                        />
                        <div className="text-[10px] sm:text-xs font-bold text-white/60 hidden sm:block">
                          {feature.title.split(' ')[0]}
                        </div>
                        {/* Active indicator */}
                        <div
                          className={`h-0.5 mt-2 sm:mt-3 mx-auto transition-all ${activeFeature === idx ? 'w-full' : 'w-0'}`}
                          style={{ backgroundColor: feature.color }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-[#39FF14]/30 hidden lg:block" />
              <div className="absolute -top-4 -right-4 w-16 h-16 border border-[#FF10F0]/30 hidden lg:block" />
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="hidden lg:flex justify-center mt-16">
            <a href="#how-it-works" className="flex flex-col items-center gap-2 text-white/40 hover:text-[#39FF14] transition-colors">
              <span className="text-xs font-bold tracking-widest">SCROLL</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">HOW IT WORKS</h2>
            <p className="text-white/60 max-w-lg mx-auto">Three steps to your Web3 wallet. No seed phrases, no complexity.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-4">
            {[
              { num: "01", title: "SIGN IN", desc: "Click the button above and authenticate with your Google account", color: "#FFFF00" },
              { num: "02", title: "WALLET CREATED", desc: "Your unique Stellar wallet is generated and funded with test XLM", color: "#39FF14" },
              { num: "03", title: "TRANSACT", desc: "Send, receive, and manage your assets on the Stellar blockchain", color: "#00D4FF" },
            ].map((step, idx) => (
              <div key={idx} className="group relative">
                {/* Connection Line */}
                {idx < 2 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}

                <div className="relative p-6 sm:p-8 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors h-full">
                  {/* Number */}
                  <div
                    className="text-5xl sm:text-6xl font-black mb-4 opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-black mb-2">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.desc}</p>

                  {/* Corner accent */}
                  <div
                    className="absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, transparent 50%, ${step.color}20 50%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-t border-white/10 bg-[#39FF14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-black">
            {[
              { value: "2s", label: "WALLET SETUP" },
              { value: "5s", label: "TX FINALITY" },
              { value: "$0", label: "SETUP COST" },
              { value: "∞", label: "POSSIBILITIES" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black">{stat.value}</div>
                <div className="text-xs sm:text-sm font-bold opacity-60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            READY TO START?
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Join the future of Web3 wallets. Your blockchain journey starts with a single click.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative inline-block"
          >
            <div className="absolute inset-0 bg-[#39FF14] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
            <div className="relative flex items-center gap-3 px-8 py-4 bg-black text-[#39FF14] font-black border-2 border-[#39FF14] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#39FF14] border-t-transparent animate-spin" />
              ) : (
                <>
                  CREATE YOUR WALLET
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#39FF14] flex items-center justify-center">
                <span className="font-black text-black">S</span>
              </div>
              <span className="text-sm font-bold text-white/60">STELLAR GATEWAY</span>
            </div>

            <div className="flex items-center gap-6 text-xs sm:text-sm font-bold">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#39FF14] transition-colors flex items-center gap-1"
              >
                STELLAR.ORG
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://stellar.expert/explorer/testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#39FF14] transition-colors flex items-center gap-1"
              >
                EXPLORER
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-xs text-white/30">
              TESTNET • 2024
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
