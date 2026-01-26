"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  Wallet,
  Lock,
  ChevronRight,
  Twitter,
  Github,
  Mail,
  Sparkles,
  Rocket,
  X,
  Users,
  Globe,
  Clock,
  Copy,
  CheckCircle,
} from "lucide-react";
import { FEATURES } from "@/config/features";
import Image from "next/image";

// Human avatar URLs from randomuser.me (placeholder faces)
const AVATAR_URLS = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/90.jpg",
];

// Confetti particle component
const Confetti = ({ count = 100 }: { count?: number }) => {
  const colors = ["#0066FF", "#00D4FF", "#00FF88", "#FFD600", "#FF3366"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(count)].map((_, i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 6;
        const rotation = Math.random() * 360;

        return (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${left}%`,
              top: "-20px",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              transform: `rotate(${rotation}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};

// Animated counter hook
const useAnimatedCounter = (target: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = countRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(startValue + (target - startValue) * eased);

      setCount(current);
      countRef.current = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
};

// Clean Success Modal Component (no glow effects)
const SuccessModal = ({
  isOpen,
  onClose,
  referralCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://stellaray.fun");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Tweet text - clean, professional, no emojis, proper spacing
  const tweetText = `Just joined the @stellaraydotfun waitlist.

Zero-knowledge wallets on Stellar. No seed phrases, no extensions - just sign in with Google.

Join the future of self-custody: https://stellaray.fun`;

  const encodedTweet = encodeURIComponent(tweetText);

  return (
    <>
      {FEATURES.WAITLIST_CONFETTI && <Confetti count={100} />}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md animate-modalPop">
          {/* Content */}
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-8">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#00FF88] rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-2">
              You're on the list!
            </h2>

            {/* Exciting message instead of position */}
            <p className="text-center text-white/60 mb-6">
              Welcome to the future of Stellar wallets
            </p>

            {/* Referral code if available */}
            {referralCode && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <p className="text-xs text-white/40 mb-1">Your referral code</p>
                <p className="font-mono text-lg text-[#00D4FF]">{referralCode}</p>
              </div>
            )}

            {/* What you get */}
            <div className="space-y-3 mb-6">
              {[
                { icon: Rocket, text: "Early access when we launch", color: "#0066FF" },
                { icon: Sparkles, text: "Exclusive founding member perks", color: "#00D4FF" },
                { icon: Users, text: "Priority support", color: "#00FF88" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-white/70 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Share section */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-center text-white/40 text-sm mb-4">
                Share with friends and move up the list
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedTweet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] rounded-lg text-white text-sm font-medium hover:bg-[#1DA1F2]/80 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Tweet
                </a>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-[#00FF88]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Typewriter effect hook
const useTypewriter = (text: string, speed: number = 50, delay: number = 0) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!FEATURES.WAITLIST_TYPEWRITER) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const startTyping = () => {
      const type = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
          timeout = setTimeout(type, speed);
        } else {
          setIsComplete(true);
        }
      };
      type();
    };

    const delayTimeout = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(timeout);
      clearTimeout(delayTimeout);
    };
  }, [text, speed, delay]);

  return { displayText, isComplete };
};

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number>(
    FEATURES.INITIAL_WAITLIST_COUNT
  );
  const [showModal, setShowModal] = useState(false);
  const [referralCode, setReferralCode] = useState<string | undefined>();
  const [isVisible, setIsVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const animatedCount = useAnimatedCounter(waitlistCount);
  const { displayText: headline, isComplete: headlineComplete } = useTypewriter(
    "THE FUTURE OF",
    40,
    300
  );

  // Entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch real waitlist count on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/waitlist");
        const data = await res.json();
        if (data.success && data.count) {
          setWaitlistCount(data.count);
        }
      } catch {
        // Keep default count on error
      }
    };
    fetchCount();
  }, []);

  // Auto-increment waitlist count (2 every 2 minutes)
  useEffect(() => {
    if (!FEATURES.WAITLIST_AUTO_INCREMENT) return;

    const interval = setInterval(() => {
      setWaitlistCount((prev) => prev + FEATURES.WAITLIST_INCREMENT_AMOUNT);
    }, FEATURES.WAITLIST_INCREMENT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get UTM params from URL
      const urlParams = new URLSearchParams(window.location.search);

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "waitlist_page",
          utm_source: urlParams.get("utm_source"),
          utm_medium: urlParams.get("utm_medium"),
          utm_campaign: urlParams.get("utm_campaign"),
          utm_content: urlParams.get("utm_content"),
          utm_term: urlParams.get("utm_term"),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setWaitlistCount(data.totalCount || waitlistCount + 1);
        setReferralCode(data.referralCode);
        setIsSubmitted(true);
        setShowModal(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* Success Modal */}
      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        referralCode={referralCode}
      />

      {/* Subtle background */}
      <div className="fixed inset-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0066FF]/5 via-transparent to-[#00D4FF]/5" />
      </div>

      {/* Corner accents */}
      <div
        className={`fixed top-0 left-0 w-24 h-24 pointer-events-none transition-all duration-700 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-4 left-4 w-12 h-[2px] bg-[#0066FF]" />
        <div className="absolute top-4 left-4 w-[2px] h-12 bg-[#0066FF]" />
      </div>
      <div
        className={`fixed top-0 right-0 w-24 h-24 pointer-events-none transition-all duration-700 delay-100 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-4 right-4 w-12 h-[2px] bg-[#00D4FF]" />
        <div className="absolute top-4 right-4 w-[2px] h-12 bg-[#00D4FF]" />
      </div>
      <div
        className={`fixed bottom-0 left-0 w-24 h-24 pointer-events-none transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute bottom-4 left-4 w-12 h-[2px] bg-[#00D4FF]" />
        <div className="absolute bottom-4 left-4 w-[2px] h-12 bg-[#00D4FF]" />
      </div>
      <div
        className={`fixed bottom-0 right-0 w-24 h-24 pointer-events-none transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute bottom-4 right-4 w-12 h-[2px] bg-[#0066FF]" />
        <div className="absolute bottom-4 right-4 w-[2px] h-12 bg-[#0066FF]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header
          className={`px-6 py-5 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/stellaraydotfun"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <Twitter className="w-4 h-4 text-white/60" />
              </a>
              <a
                href="https://github.com/AdwaitBytes"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <Github className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Status badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 mb-8 transition-all duration-500 ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
              <span className="text-[#0066FF] font-medium text-sm">Launching Soon</span>
            </div>

            {/* Main headline */}
            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] transition-all duration-700 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="inline-block">
                {headline}
                {!headlineComplete && (
                  <span className="inline-block w-[3px] h-[0.9em] bg-[#0066FF] ml-1 animate-blink" />
                )}
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00D4FF]">
                STELLAR
              </span>{" "}
              WALLETS
            </h1>

            {/* Tagline */}
            <p
              className={`text-lg sm:text-xl text-white/50 mb-4 transition-all duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Prove Everything. Reveal Nothing.
            </p>

            <p
              className={`text-white/40 mb-10 max-w-lg mx-auto transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Zero-knowledge authentication on Stellar. Sign in with Google.
              No seed phrases. No extensions. Just you.
            </p>

            {/* Signup form */}
            <div
              className={`transition-all duration-700 delay-400 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-10">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        placeholder="Enter your email"
                        className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-all duration-200 ${
                          inputFocused
                            ? "border-[#0066FF] bg-white/10"
                            : "border-white/10"
                        }`}
                      />
                      {error && (
                        <p className="absolute -bottom-6 left-0 text-red-400 text-xs font-medium">
                          {error}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0066FF] rounded-xl font-semibold hover:bg-[#0066FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <span>Join Waitlist</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="max-w-md mx-auto mb-10 p-5 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#00FF88] flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-[#00FF88] font-semibold">You're on the list!</span>
                  </div>
                  <p className="text-white/50 text-sm">
                    We'll email you when Stellaray launches.
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-3 text-[#0066FF] font-medium text-sm hover:underline"
                  >
                    View details →
                  </button>
                </div>
              )}
            </div>

            {/* Social proof with human avatars */}
            {FEATURES.SHOW_WAITLIST_COUNT && (
              <div
                className={`flex items-center justify-center gap-4 mb-12 transition-all duration-700 delay-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <div className="flex -space-x-2">
                  {AVATAR_URLS.map((url, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] overflow-hidden"
                      style={{ zIndex: AVATAR_URLS.length - i }}
                    >
                      <Image
                        src={url}
                        alt={`User ${i + 1}`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-semibold tabular-nums">
                    {animatedCount.toLocaleString()}+ joined
                  </p>
                  <p className="text-white/40 text-xs">Join the waitlist</p>
                </div>
              </div>
            )}

            {/* Stats row */}
            {FEATURES.WAITLIST_SHOW_STATS && (
              <div
                className={`flex flex-wrap justify-center gap-8 mb-12 transition-all duration-700 delay-600 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {[
                  { icon: Globe, value: "50+", label: "Countries", color: "#0066FF" },
                  { icon: Clock, value: "2s", label: "Setup", color: "#00D4FF" },
                  { icon: Users, value: "100%", label: "Self-Custody", color: "#00FF88" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                      <span className="text-lg font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Features preview */}
            <div
              className={`grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto transition-all duration-700 delay-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {[
                {
                  icon: Shield,
                  title: "zkLogin",
                  desc: "Zero-knowledge proofs secure your identity",
                  color: "#0066FF",
                },
                {
                  icon: Wallet,
                  title: "No Seed Phrase",
                  desc: "Keys derived from your Google account",
                  color: "#00D4FF",
                },
                {
                  icon: Lock,
                  title: "Self-Custody",
                  desc: "Only you control your assets",
                  color: "#00FF88",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <feature.icon
                    className="w-6 h-6 mb-3"
                    style={{ color: feature.color }}
                  />
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className={`px-6 py-6 border-t border-white/5 transition-all duration-700 delay-800 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <Zap className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Powered by Stellar X-Ray Protocol</span>
            </div>

            <div className="flex items-center gap-5 text-sm">
              <a
                href="mailto:hello@stellaray.fun"
                className="text-white/40 hover:text-white/60 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                hello@stellaray.fun
              </a>
              <a
                href="https://stellaray.fun"
                className="text-[#0066FF] font-medium hover:underline flex items-center gap-1"
              >
                stellaray.fun
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
