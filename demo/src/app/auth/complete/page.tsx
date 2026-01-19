"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useZkLogin } from "../../providers";

/**
 * OAuth Completion Page
 *
 * This page handles the completion of the OAuth flow after redirect.
 * It displays progress as the zkLogin setup proceeds through:
 * 1. Token exchange
 * 2. Salt retrieval
 * 3. Address computation
 * 4. ZK proof generation
 * 5. Session registration
 */

type Step = {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
};

export default function AuthCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeAuth, wallet } = useZkLogin();

  const [steps, setSteps] = useState<Step[]>([
    { id: "token", label: "Exchanging authorization code", status: "pending" },
    { id: "salt", label: "Retrieving user salt", status: "pending" },
    { id: "address", label: "Computing wallet address", status: "pending" },
    { id: "proof", label: "Generating ZK proof", status: "pending" },
    { id: "session", label: "Registering session", status: "pending" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Missing authorization code");
      return;
    }

    // Simulate step progression (actual SDK does this internally)
    const runAuth = async () => {
      try {
        // Update step status as we progress
        const updateStep = (index: number, status: Step["status"]) => {
          setSteps((prev) =>
            prev.map((step, i) =>
              i === index ? { ...step, status } : step
            )
          );
          setCurrentStep(index);
        };

        // Step 1: Token exchange
        updateStep(0, "active");
        await new Promise((r) => setTimeout(r, 1000));
        updateStep(0, "complete");

        // Step 2: Salt retrieval
        updateStep(1, "active");
        await new Promise((r) => setTimeout(r, 500));
        updateStep(1, "complete");

        // Step 3: Address computation
        updateStep(2, "active");
        await new Promise((r) => setTimeout(r, 300));
        updateStep(2, "complete");

        // Step 4: ZK proof generation
        updateStep(3, "active");
        await new Promise((r) => setTimeout(r, 3000)); // Proof takes time
        updateStep(3, "complete");

        // Step 5: Session registration
        updateStep(4, "active");
        await new Promise((r) => setTimeout(r, 1000));
        updateStep(4, "complete");

        // Complete the actual auth
        await completeAuth(code);

        // Redirect to wallet after short delay
        setTimeout(() => {
          router.push("/wallet");
        }, 1000);
      } catch (err) {
        setError((err as Error).message);
        setSteps((prev) =>
          prev.map((step, i) =>
            i === currentStep ? { ...step, status: "error" } : step
          )
        );
      }
    };

    runAuth();
  }, [searchParams, completeAuth, router, currentStep]);

  // Redirect if already connected
  if (wallet.isConnected && !wallet.isLoading) {
    router.push("/wallet");
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-stellar-purple/20 flex items-center justify-center mx-auto mb-4">
            {error ? (
              <span className="text-3xl">❌</span>
            ) : steps.every((s) => s.status === "complete") ? (
              <span className="text-3xl">✅</span>
            ) : (
              <div className="w-8 h-8 border-3 border-stellar-purple/30 border-t-stellar-purple rounded-full spinner" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {error
              ? "Setup Failed"
              : steps.every((s) => s.status === "complete")
              ? "Wallet Ready!"
              : "Setting Up Your Wallet"}
          </h1>
          <p className="text-white/50">
            {error
              ? "Please try again"
              : steps.every((s) => s.status === "complete")
              ? "Redirecting to your wallet..."
              : "This may take a few moments"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="card">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 ${
                  step.status === "pending" ? "opacity-50" : ""
                }`}
              >
                {/* Status Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === "complete"
                      ? "bg-green-500/20 text-green-400"
                      : step.status === "active"
                      ? "bg-stellar-purple/20 text-stellar-purple"
                      : step.status === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {step.status === "complete" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.status === "active" ? (
                    <div className="w-4 h-4 border-2 border-stellar-purple/30 border-t-stellar-purple rounded-full spinner" />
                  ) : step.status === "error" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      step.status === "active"
                        ? "text-white"
                        : step.status === "complete"
                        ? "text-white/70"
                        : "text-white/50"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.status === "active" && step.id === "proof" && (
                    <p className="text-xs text-white/40 mt-1">
                      Generating Groth16 proof (~1.1M constraints)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="mt-3 text-sm text-stellar-purple hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        {!error && (
          <div className="mt-6 p-4 rounded-lg bg-white/5 text-center">
            <p className="text-xs text-white/40">
              Your identity is protected by zero-knowledge proofs.
              <br />
              We never see your Google/Apple credentials.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
