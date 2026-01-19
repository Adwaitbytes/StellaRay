"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZkLogin } from "./providers";

export default function Home() {
  const router = useRouter();
  const { wallet, initSession } = useZkLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already connected
  if (wallet.isConnected) {
    router.push("/wallet");
    return null;
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { authUrl } = await initSession();
      window.location.href = authUrl;
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="mb-6">
          <span className="text-6xl">🔐</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Stellar zkLogin</span>
          <br />
          Gateway
        </h1>
        <p className="text-lg text-white/60 mb-8">
          Create a Stellar wallet with just your Google or Apple account.
          No seed phrases, no complexity - just sign in and start transacting.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="card">
            <div className="text-2xl mb-2">🛡️</div>
            <h3 className="font-semibold mb-1">Zero Knowledge</h3>
            <p className="text-sm text-white/50">
              Your identity stays private with ZK proofs
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Instant Setup</h3>
            <p className="text-sm text-white/50">
              No seed phrases to remember or secure
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2">💳</div>
            <h3 className="font-semibold mb-1">x402 Payments</h3>
            <p className="text-sm text-white/50">
              Pay for content with HTTP micropayments
            </p>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md gradient-border p-8">
        <h2 className="text-xl font-semibold text-center mb-6">
          Get Started
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 btn-secondary mb-4"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full spinner" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Apple Sign In */}
        <button
          disabled={true}
          className="w-full flex items-center justify-center gap-3 btn-secondary opacity-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
            />
          </svg>
          <span>Continue with Apple</span>
          <span className="text-xs text-white/40">(Coming Soon)</span>
        </button>

        <p className="text-xs text-center text-white/40 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Your wallet is created using zero-knowledge proofs - we never see your identity.
        </p>
      </div>

      {/* How it Works */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-stellar-purple/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-stellar-purple">1</span>
            </div>
            <h3 className="font-semibold mb-1">Sign In</h3>
            <p className="text-sm text-white/50">
              Use your Google or Apple account
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-stellar-purple/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-stellar-purple">2</span>
            </div>
            <h3 className="font-semibold mb-1">Generate Proof</h3>
            <p className="text-sm text-white/50">
              ZK proof links your identity privately
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-stellar-purple/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-stellar-purple">3</span>
            </div>
            <h3 className="font-semibold mb-1">Create Wallet</h3>
            <p className="text-sm text-white/50">
              Deterministic address derived from your ID
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-stellar-purple/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-stellar-purple">4</span>
            </div>
            <h3 className="font-semibold mb-1">Transact</h3>
            <p className="text-sm text-white/50">
              Send, receive, and pay with Stellar
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-white/40 text-sm">
        <p>
          Built on Stellar Protocol X-Ray with BN254 and Poseidon primitives
        </p>
        <p className="mt-2">
          Powered by zkLogin and x402 Payment Protocol
        </p>
      </footer>
    </main>
  );
}
