"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check, Zap, Shield, Wallet, Lock, ChevronRight, Twitter, Github, Mail } from "lucide-react";
import { FEATURES } from "@/config/features";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number>(FEATURES.INITIAL_WAITLIST_COUNT);

  // Simulate growing waitlist (for social proof)
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitlistCount(prev => prev + Math.floor(Math.random() * 3));
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call (replace with actual endpoint later)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Store in localStorage for now (replace with actual backend)
    const waitlist = JSON.parse(localStorage.getItem("stellaray_waitlist") || "[]");
    if (!waitlist.includes(email)) {
      waitlist.push(email);
      localStorage.setItem("stellaray_waitlist", JSON.stringify(waitlist));
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 102, 255, 1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 102, 255, 1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="fixed top-0 left-0 w-32 h-32 pointer-events-none">
        <div className="absolute top-6 left-6 w-16 h-1 bg-[#0066FF]" />
        <div className="absolute top-6 left-6 w-1 h-16 bg-[#0066FF]" />
      </div>
      <div className="fixed top-0 right-0 w-32 h-32 pointer-events-none">
        <div className="absolute top-6 right-6 w-16 h-1 bg-[#00D4FF]" />
        <div className="absolute top-6 right-6 w-1 h-16 bg-[#00D4FF]" />
      </div>
      <div className="fixed bottom-0 left-0 w-32 h-32 pointer-events-none">
        <div className="absolute bottom-6 left-6 w-16 h-1 bg-[#00D4FF]" />
        <div className="absolute bottom-6 left-6 w-1 h-16 bg-[#00D4FF]" />
      </div>
      <div className="fixed bottom-0 right-0 w-32 h-32 pointer-events-none">
        <div className="absolute bottom-6 right-6 w-16 h-1 bg-[#0066FF]" />
        <div className="absolute bottom-6 right-6 w-1 h-16 bg-[#0066FF]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0066FF] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="3" />
                  <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="3" />
                  <circle cx="12" cy="12" r="2" fill="white" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tighter">
                STELLA<span className="text-[#0066FF]">RAY</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/stellaray"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-white/20 flex items-center justify-center hover:border-[#0066FF] hover:text-[#0066FF] transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/AdiWaghray"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-white/20 flex items-center justify-center hover:border-[#0066FF] hover:text-[#0066FF] transition-all"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#0066FF]/30 bg-[#0066FF]/5 mb-8">
              <div className="w-2 h-2 bg-[#0066FF] animate-pulse" />
              <span className="text-[#0066FF] font-bold text-sm tracking-wider">LAUNCHING SOON</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
              THE FUTURE OF
              <br />
              <span className="text-[#0066FF]">STELLAR</span> WALLETS
            </h1>

            {/* Tagline */}
            <p className="text-xl sm:text-2xl text-white/60 mb-4 max-w-2xl mx-auto">
              Prove Everything. Reveal Nothing.
            </p>

            <p className="text-white/40 mb-12 max-w-xl mx-auto">
              Zero-knowledge authentication on Stellar. Sign in with Google.
              No seed phrases. No browser extensions. Just you.
            </p>

            {/* Signup form or success state */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-5 py-4 bg-black border-4 border-white/30 text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[#0066FF] transition-colors"
                    />
                    {error && (
                      <p className="absolute -bottom-6 left-0 text-red-500 text-xs font-bold">{error}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-[#0066FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                    <div className="relative flex items-center justify-center gap-2 px-8 py-4 bg-black border-4 border-[#0066FF] font-black transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          JOIN
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            ) : (
              <div className="max-w-md mx-auto mb-12 p-6 border-4 border-[#00FF88] bg-[#00FF88]/10">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#00FF88] flex items-center justify-center">
                    <Check className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-[#00FF88] font-black text-xl">YOU'RE IN</span>
                </div>
                <p className="text-white/60">
                  We'll notify you when Stellaray launches. Get ready to experience crypto without the bullshit.
                </p>
              </div>
            )}

            {/* Social proof */}
            {FEATURES.SHOW_WAITLIST_COUNT && (
              <div className="flex items-center justify-center gap-6 mb-16">
                <div className="flex -space-x-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[#0A0A0A] bg-gradient-to-br from-[#0066FF] to-[#00D4FF]"
                      style={{ opacity: 1 - i * 0.15 }}
                    />
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-black text-2xl">{waitlistCount.toLocaleString()}+</p>
                  <p className="text-white/40 text-sm">already waiting</p>
                </div>
              </div>
            )}

            {/* Features preview */}
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "ZKLOGIN",
                  desc: "Sign in with Google, secured by zero-knowledge proofs",
                  color: "#0066FF",
                },
                {
                  icon: Wallet,
                  title: "NO SEED PHRASE",
                  desc: "Your keys are derived from your Google account",
                  color: "#00D4FF",
                },
                {
                  icon: Lock,
                  title: "SELF-CUSTODY",
                  desc: "Only you control your assets. Always.",
                  color: "#00FF88",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 border-2 border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors"
                >
                  <feature.icon
                    className="w-8 h-8 mb-4"
                    style={{ color: feature.color }}
                  />
                  <h3 className="font-black text-sm mb-2">{feature.title}</h3>
                  <p className="text-white/40 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Zap className="w-4 h-4 text-[#0066FF]" />
              <span>Powered by Stellar X-Ray Protocol</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <a href="mailto:hello@stellaray.fun" className="text-white/40 hover:text-white transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@stellaray.fun
              </a>
              <a href="https://stellaray.fun" className="text-[#0066FF] font-bold hover:underline flex items-center gap-1">
                stellaray.fun
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
