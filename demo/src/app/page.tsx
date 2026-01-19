"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Zap, Globe, ArrowRight, Wallet, Lock, Sparkles } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Stellar Gateway</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
          <a href="https://stellar.org" target="_blank" rel="noopener" className="hover:text-white transition">Stellar Network</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 lg:pt-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-zinc-300">Powered by Stellar Testnet</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Your Gateway to
            <br />
            <span className="gradient-text">Web3 Finance</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Create a Stellar blockchain wallet instantly with your Google account.
            No seed phrases to remember, no complex setup - just sign in and start transacting.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="btn-google max-w-sm"
            >
              {isLoading ? (
                <div className="spinner !border-gray-400 !border-t-gray-800" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            <p className="text-sm text-zinc-500">
              Free to use on Stellar Testnet
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text">2s</div>
            <div className="text-sm text-zinc-500 mt-1">Wallet Creation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text">5s</div>
            <div className="text-sm text-zinc-500 mt-1">Transaction Speed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text">$0</div>
            <div className="text-sm text-zinc-500 mt-1">Setup Cost</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Stellar Gateway?</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Experience the simplest way to access decentralized finance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-8 hover:border-purple-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Seed Phrases</h3>
            <p className="text-zinc-400 leading-relaxed">
              Your wallet is securely derived from your Google account. No 12-word phrases to lose or protect.
            </p>
          </div>

          <div className="glass-card p-8 hover:border-purple-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Setup</h3>
            <p className="text-zinc-400 leading-relaxed">
              Sign in with Google and your wallet is ready in seconds. No downloads, no browser extensions.
            </p>
          </div>

          <div className="glass-card p-8 hover:border-purple-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
              <Globe className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Stellar Network</h3>
            <p className="text-zinc-400 leading-relaxed">
              Built on Stellar - fast, low-cost transactions with real blockchain security.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Three simple steps to your Web3 wallet
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                1
              </div>
              <ArrowRight className="w-6 h-6 text-zinc-600 hidden md:block" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign In</h3>
            <p className="text-zinc-400">
              Click "Continue with Google" and authenticate with your Google account.
            </p>
          </div>

          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                2
              </div>
              <ArrowRight className="w-6 h-6 text-zinc-600 hidden md:block" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Wallet Created</h3>
            <p className="text-zinc-400">
              A unique Stellar wallet is automatically generated and funded with test XLM.
            </p>
          </div>

          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                3
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Transacting</h3>
            <p className="text-zinc-400">
              Send and receive XLM, view your balance, and explore the Stellar network.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
          <div className="relative z-10">
            <Lock className="w-12 h-12 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Join thousands of users who have simplified their Web3 experience with Stellar Gateway.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isLoading ? (
                <div className="spinner" />
              ) : (
                <>
                  Create Your Wallet
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Stellar Gateway</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="https://stellar.org" target="_blank" rel="noopener" className="hover:text-white transition">
                Stellar Network
              </a>
              <a href="https://horizon-testnet.stellar.org" target="_blank" rel="noopener" className="hover:text-white transition">
                Testnet Explorer
              </a>
            </div>
            <p className="text-sm text-zinc-600">
              Built for Stellar Testnet
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
