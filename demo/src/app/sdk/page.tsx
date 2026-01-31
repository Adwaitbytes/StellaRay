"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Terminal,
  Code,
  Zap,
  Shield,
  Wallet,
  Package,
  Play,
  ChevronRight,
  Sparkles,
  Github,
  Menu,
  X,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  code: string;
  language: string;
  explanation: string[];
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Install the SDK",
    description: "Add the zkLogin SDK to your Stellar dApp",
    code: `# Using npm
npm install @stellar-zklogin/sdk

# Using pnpm
pnpm add @stellar-zklogin/sdk

# Using yarn
yarn add @stellar-zklogin/sdk`,
    language: "bash",
    explanation: [
      "The SDK is a single package with zero external wallet dependencies",
      "Works with any JavaScript/TypeScript project",
      "React components included (optional)",
    ],
    icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: 2,
    title: "Initialize the SDK",
    description: "Create a StellarZkLogin instance with your config",
    code: `import { StellarZkLogin } from '@stellar-zklogin/sdk';

const zkLogin = new StellarZkLogin({
  network: 'testnet',
  oauth: {
    google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' }
  }
});

// That's it! Default contracts are pre-configured`,
    language: "typescript",
    explanation: [
      "Testnet contracts are pre-configured (no setup needed)",
      "Just add your Google OAuth client ID",
      "Supports Google and Apple Sign-In",
    ],
    icon: <Code className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: 3,
    title: "Login Users",
    description: "One-line OAuth login - no Freighter needed!",
    code: `// Login with Google (opens popup)
const wallet = await zkLogin.login('google');

// User now has a wallet!
console.log('Address:', wallet.getAddress());
// → G7X2PKVQR...

console.log('Balance:', await wallet.getBalance());
// → "100.0000000"`,
    language: "typescript",
    explanation: [
      "Users sign in with their Google account",
      "A ZK proof is generated automatically",
      "Smart contract wallet is created on-chain",
      "No browser extension required!",
    ],
    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: 4,
    title: "Send Payments",
    description: "Transfer tokens with the embedded wallet",
    code: `// Send XLM
const result = await wallet.sendPayment(
  'GDESTINATION...', // recipient
  'native',          // XLM
  '10'              // amount
);

console.log('TX Hash:', result.hash);
// → "abc123..."

// Send tokens (USDC, etc)
await wallet.sendPayment(
  'GDESTINATION...',
  'CBIELTK6YBZ...', // token contract
  '50'
);`,
    language: "typescript",
    explanation: [
      "Sign transactions with ephemeral keys",
      "ZK proof authorizes the transaction",
      "Works with XLM and any Soroban token",
    ],
    icon: <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: 5,
    title: "React Integration",
    description: "Use hooks and pre-built components",
    code: `import {
  ZkLoginProvider,
  useZkLogin,
  LoginButton,
  WalletWidget
} from '@stellar-zklogin/sdk/react';

function App() {
  return (
    <ZkLoginProvider config={config}>
      <MyDApp />
    </ZkLoginProvider>
  );
}

function MyDApp() {
  const { wallet, isLoggedIn } = useZkLogin();

  if (!isLoggedIn) {
    return <LoginButton provider="google" />;
  }

  return <WalletWidget theme="dark" />;
}`,
    language: "tsx",
    explanation: [
      "ZkLoginProvider wraps your app",
      "useZkLogin hook for auth state",
      "useWallet hook for balance/transfers",
      "Pre-built LoginButton and WalletWidget",
    ],
    icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: 6,
    title: "X-Ray Protocol",
    description: "Access native BN254 & Poseidon for gas savings",
    code: `import { XRayClient } from '@stellar-zklogin/sdk';

const xray = new XRayClient({ network: 'testnet' });

// Get protocol metrics
const metrics = await xray.getMetrics();
console.log('Proofs verified:', metrics.proofsVerified);

// Estimate gas savings
const savings = xray.calculateGroth16Savings();
console.log('Gas savings:', savings.savingsPercent + '%');
// → "94%"`,
    language: "typescript",
    explanation: [
      "X-Ray Protocol 25 enables native crypto",
      "94% gas savings vs WASM implementation",
      "BN254 elliptic curve operations",
      "Poseidon hash function support",
    ],
    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

export default function SDKPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const copyCode = (code: string, stepId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b-4 border-white sticky top-0 z-50 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#0066FF] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
                  <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5"/>
                  <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2.5"/>
                  <circle cx="12" cy="12" r="1.5" fill="white"/>
                </svg>
              </div>
              <span className="font-black text-base sm:text-xl">STELLARAY_SDK</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-3">
              <a
                href="https://github.com/Adwaitbytes/Stellar-new/tree/main/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">GITHUB</span>
              </a>
              <Link
                href="/sdk-demo"
                className="flex items-center gap-2 px-3 py-2 bg-[#0066FF] text-black font-bold hover:bg-[#0055DD] transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-xs sm:text-sm">LIVE DEMO</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="sm:hidden w-10 h-10 flex items-center justify-center border-2 border-white"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenu && (
            <div className="sm:hidden flex flex-col gap-2 pt-3 pb-1 border-t border-white/20 mt-3">
              <a
                href="https://github.com/Adwaitbytes/Stellar-new/tree/main/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="font-bold text-sm">VIEW ON GITHUB</span>
              </a>
              <Link
                href="/sdk-demo"
                className="flex items-center gap-2 px-3 py-2 bg-[#0066FF] text-black font-bold"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">LIVE DEMO</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b-4 border-white bg-gradient-to-br from-black via-black to-[#0a1a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0066FF]/10 border border-[#0066FF]/30 mb-4 sm:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#0066FF]" />
              <span className="text-[#0066FF] font-bold text-xs sm:text-sm">POWERED BY X-RAY PROTOCOL 25</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6">
              SDK <span className="text-[#0066FF]">JOURNEY</span>
            </h1>
            <p className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Integrate zkLogin into your Stellar dApp in 6 simple steps.
              No external wallets required
            </p>

            {/* Step Indicators - scrollable on mobile */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-8 overflow-x-auto px-2">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                    idx === currentStep
                      ? "bg-[#0066FF] border-[#0066FF] text-black"
                      : idx < currentStep
                      ? "bg-[#0066FF]/20 border-[#0066FF] text-[#0066FF]"
                      : "border-white/20 text-white/40 hover:border-white/40"
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="font-black text-sm sm:text-base">{s.id}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Progress bar for mobile */}
            <div className="sm:hidden w-full max-w-xs mx-auto mb-3">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0066FF] transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-white/40 text-xs sm:text-sm">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>
      </section>

      {/* Current Step */}
      <section className="border-b-4 border-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2">
            {/* Left: Info */}
            <div className="p-5 sm:p-8 lg:p-12 border-b-4 lg:border-b-0 lg:border-r-4 border-white">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#0066FF] flex items-center justify-center text-black flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <p className="text-[#0066FF] font-bold text-xs sm:text-sm">STEP {step.id}</p>
                  <h2 className="text-xl sm:text-3xl font-black">{step.title}</h2>
                </div>
              </div>

              <p className="text-base sm:text-xl text-white/70 mb-5 sm:mb-8">{step.description}</p>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {step.explanation.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#0066FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#0066FF]" />
                    </div>
                    <p className="text-sm sm:text-base text-white/80">{point}</p>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-white font-bold text-sm sm:text-base transition-all ${
                    currentStep === 0
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-white hover:text-black"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">PREVIOUS</span>
                  <span className="sm:hidden">PREV</span>
                </button>
                <button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-base transition-all ${
                    currentStep === steps.length - 1
                      ? "bg-white/30 text-white/50 cursor-not-allowed"
                      : "bg-[#0066FF] text-black hover:bg-[#0055DD]"
                  }`}
                >
                  NEXT
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Code */}
            <div className="bg-[#0a0a0a]">
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Terminal className="w-4 h-4 text-[#0066FF]" />
                  <span className="font-mono text-xs sm:text-sm text-white/60">{step.language}</span>
                </div>
                <button
                  onClick={() => copyCode(step.code, step.id)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-white/20 hover:border-white/40 transition-colors"
                >
                  {copiedStep === step.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066FF]" />
                      <span className="text-[#0066FF]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm">
                <code className="font-mono leading-relaxed">
                  {step.code.split("\n").map((line, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-6 sm:w-8 text-white/20 select-none text-right pr-2 sm:pr-3 flex-shrink-0">{idx + 1}</span>
                      <span className={getLineColor(line)}>{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-center">QUICK REFERENCE</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="border-4 border-white p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <Package className="w-5 h-5 text-[#0066FF]" />
                <h3 className="font-black text-sm sm:text-base">INSTALL</h3>
              </div>
              <code className="text-xs sm:text-sm text-[#0066FF] font-mono break-all">
                npm i @stellar-zklogin/sdk
              </code>
            </div>

            <div className="border-4 border-white p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <Code className="w-5 h-5 text-[#0066FF]" />
                <h3 className="font-black text-sm sm:text-base">INITIALIZE</h3>
              </div>
              <code className="text-xs sm:text-sm text-[#0066FF] font-mono break-all">
                new StellarZkLogin(config)
              </code>
            </div>

            <div className="border-4 border-white p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <Shield className="w-5 h-5 text-[#0066FF]" />
                <h3 className="font-black text-sm sm:text-base">LOGIN</h3>
              </div>
              <code className="text-xs sm:text-sm text-[#0066FF] font-mono break-all">
                zkLogin.login(&apos;google&apos;)
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Full Example */}
      <section className="border-b-4 border-white bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center">COMPLETE EXAMPLE</h2>
          <p className="text-white/60 text-center mb-6 sm:mb-8 text-sm sm:text-base">Copy this to get started immediately</p>

          <div className="border-4 border-white">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-white bg-[#0066FF]">
              <span className="font-black text-black text-sm sm:text-base">app.tsx</span>
              <button
                onClick={() => copyCode(fullExample, 999)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-black text-white hover:bg-black/80"
              >
                {copiedStep === 999 ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 sm:p-6 overflow-x-auto max-h-[400px] sm:max-h-[500px] text-xs sm:text-sm">
              <code className="font-mono leading-relaxed text-white/90">
                {fullExample}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0066FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-black mb-3 sm:mb-4">
            READY TO BUILD?
          </h2>
          <p className="text-black/70 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base">
            Start integrating zkLogin into your Stellar dApp today.
            No external wallets. No complexity. Just code
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="https://github.com/Adwaitbytes/Stellar-new/tree/main/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-black text-white font-bold hover:bg-black/80 transition-colors"
            >
              <Github className="w-5 h-5" />
              VIEW SOURCE
            </a>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border-4 border-black text-black font-bold hover:bg-black/10 transition-colors"
            >
              <Play className="w-5 h-5" />
              TRY LIVE DEMO
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-white/40 text-xs sm:text-sm">
          <p>STELLARAY SDK - Powered by X-Ray Protocol 25</p>
        </div>
      </footer>
    </div>
  );
}

function getLineColor(line: string): string {
  if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
    return "text-white/40";
  }
  if (line.includes("import") || line.includes("from") || line.includes("export")) {
    return "text-[#FF79C6]";
  }
  if (line.includes("const") || line.includes("let") || line.includes("function")) {
    return "text-[#8BE9FD]";
  }
  if (line.includes("await") || line.includes("async") || line.includes("return")) {
    return "text-[#FF79C6]";
  }
  if (line.includes("'") || line.includes('"') || line.includes("`")) {
    return "text-[#F1FA8C]";
  }
  return "text-white/90";
}

const fullExample = `import { StellarZkLogin } from '@stellar-zklogin/sdk';

// 1. Initialize SDK
const zkLogin = new StellarZkLogin({
  network: 'testnet',
  oauth: {
    google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' }
  }
});

// 2. Login user with Google
async function handleLogin() {
  try {
    const wallet = await zkLogin.login('google');

    console.log('Logged in!');
    console.log('Address:', wallet.getAddress());
    console.log('Balance:', await wallet.getBalance(), 'XLM');

    return wallet;
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// 3. Send payment
async function sendPayment(wallet, to, amount) {
  const result = await wallet.sendPayment(to, 'native', amount);
  console.log('Payment sent!');
  console.log('TX Hash:', result.hash);
  return result;
}

// 4. Listen for events
zkLogin.on('login', (data) => {
  console.log('User logged in:', data.address);
});

zkLogin.on('logout', () => {
  console.log('User logged out');
});

// 5. Logout
function handleLogout() {
  zkLogin.logout();
}

// Usage
const wallet = await handleLogin();
await sendPayment(wallet, 'GDESTINATION...', '10');`;
