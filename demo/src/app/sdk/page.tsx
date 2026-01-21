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
  Globe,
  Package,
  Play,
  ChevronRight,
  Sparkles,
  Github,
  ExternalLink,
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
    icon: <Package className="w-6 h-6" />,
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
    icon: <Code className="w-6 h-6" />,
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
    icon: <Shield className="w-6 h-6" />,
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
    icon: <Wallet className="w-6 h-6" />,
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
    icon: <Sparkles className="w-6 h-6" />,
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
    icon: <Zap className="w-6 h-6" />,
  },
];

export default function SDKPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyCode = (code: string, stepId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#39FF14] flex items-center justify-center">
                <span className="font-black text-black text-xl">Z</span>
              </div>
              <span className="font-black text-xl">ZKLOGIN_SDK</span>
            </Link>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Adwaitbytes/Stellar-new/tree/main/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="font-bold text-sm">VIEW ON GITHUB</span>
              </a>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-[#39FF14] text-black font-bold hover:bg-[#32E612] transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">TRY DEMO</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b-4 border-white bg-gradient-to-br from-black via-black to-[#0a1a0a]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 mb-6">
              <Zap className="w-4 h-4 text-[#39FF14]" />
              <span className="text-[#39FF14] font-bold text-sm">POWERED BY X-RAY PROTOCOL 25</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              SDK <span className="text-[#39FF14]">JOURNEY</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
              Integrate zkLogin into your Stellar dApp in 6 simple steps.
              No external wallets required.
            </p>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-12 h-12 flex items-center justify-center border-2 transition-all ${
                    idx === currentStep
                      ? "bg-[#39FF14] border-[#39FF14] text-black"
                      : idx < currentStep
                      ? "bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]"
                      : "border-white/20 text-white/40 hover:border-white/40"
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-black">{s.id}</span>
                  )}
                </button>
              ))}
            </div>

            <p className="text-white/40 text-sm">
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
            <div className="p-8 lg:p-12 border-r-0 lg:border-r-4 border-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#39FF14] flex items-center justify-center text-black">
                  {step.icon}
                </div>
                <div>
                  <p className="text-[#39FF14] font-bold text-sm">STEP {step.id}</p>
                  <h2 className="text-3xl font-black">{step.title}</h2>
                </div>
              </div>

              <p className="text-xl text-white/70 mb-8">{step.description}</p>

              <div className="space-y-4 mb-8">
                {step.explanation.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#39FF14]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="w-4 h-4 text-[#39FF14]" />
                    </div>
                    <p className="text-white/80">{point}</p>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-6 py-3 border-2 border-white font-bold transition-all ${
                    currentStep === 0
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-white hover:text-black"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  PREVIOUS
                </button>
                <button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                    currentStep === steps.length - 1
                      ? "bg-white/30 text-white/50 cursor-not-allowed"
                      : "bg-[#39FF14] text-black hover:bg-[#32E612]"
                  }`}
                >
                  NEXT STEP
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Code */}
            <div className="bg-[#0a0a0a]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-[#39FF14]" />
                  <span className="font-mono text-sm text-white/60">{step.language}</span>
                </div>
                <button
                  onClick={() => copyCode(step.code, step.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/20 hover:border-white/40 transition-colors"
                >
                  {copiedStep === step.id ? (
                    <>
                      <Check className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-[#39FF14]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-6 overflow-x-auto">
                <code className="text-sm font-mono leading-relaxed">
                  {step.code.split("\n").map((line, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-8 text-white/20 select-none">{idx + 1}</span>
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
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-black mb-8 text-center">QUICK REFERENCE</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Install */}
            <div className="border-4 border-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-[#39FF14]" />
                <h3 className="font-black">INSTALL</h3>
              </div>
              <code className="text-sm text-[#39FF14] font-mono">
                npm i @stellar-zklogin/sdk
              </code>
            </div>

            {/* Initialize */}
            <div className="border-4 border-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-5 h-5 text-[#39FF14]" />
                <h3 className="font-black">INITIALIZE</h3>
              </div>
              <code className="text-sm text-[#39FF14] font-mono">
                new StellarZkLogin(config)
              </code>
            </div>

            {/* Login */}
            <div className="border-4 border-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-[#39FF14]" />
                <h3 className="font-black">LOGIN</h3>
              </div>
              <code className="text-sm text-[#39FF14] font-mono">
                zkLogin.login('google')
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Full Example */}
      <section className="border-b-4 border-white bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-black mb-2 text-center">COMPLETE EXAMPLE</h2>
          <p className="text-white/60 text-center mb-8">Copy this to get started immediately</p>

          <div className="border-4 border-white">
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-white bg-[#39FF14]">
              <span className="font-black text-black">app.tsx</span>
              <button
                onClick={() => copyCode(fullExample, 999)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black text-white hover:bg-black/80"
              >
                {copiedStep === 999 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="p-6 overflow-x-auto max-h-[500px]">
              <code className="text-sm font-mono leading-relaxed text-white/90">
                {fullExample}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#39FF14]">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-4xl font-black text-black mb-4">
            READY TO BUILD?
          </h2>
          <p className="text-black/70 mb-8 max-w-xl mx-auto">
            Start integrating zkLogin into your Stellar dApp today.
            No external wallets. No complexity. Just code.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/Adwaitbytes/Stellar-new/tree/main/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-black text-white font-bold hover:bg-black/80 transition-colors"
            >
              <Github className="w-5 h-5" />
              VIEW SOURCE
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 border-4 border-black text-black font-bold hover:bg-black/10 transition-colors"
            >
              <Play className="w-5 h-5" />
              TRY LIVE DEMO
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
          <p>Stellar zkLogin Gateway SDK • Powered by X-Ray Protocol 25</p>
        </div>
      </footer>
    </div>
  );
}

// Helper function for syntax highlighting (simplified)
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

    console.log('✓ Logged in!');
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
  console.log('✓ Payment sent!');
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
