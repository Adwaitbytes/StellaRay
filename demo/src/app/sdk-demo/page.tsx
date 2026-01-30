"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Code,
  Copy,
  Check,
  Zap,
  Shield,
  Wallet,
  Send,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sun,
  Moon,
  Hash,
  Cpu,
  Lock,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

interface DemoWallet {
  address: string;
  balance: string;
  isConnected: boolean;
  provider: string;
  sessionExpiry: number;
}

interface DemoTransaction {
  hash: string;
  status: "pending" | "success" | "failed";
  amount: string;
  to: string;
  timestamp: number;
}

const CODE_EXAMPLES = {
  install: `npm install @stellar-zklogin/sdk`,

  basicSetup: `import { createWallet } from '@stellar-zklogin/sdk';

// Create wallet instance
const wallet = createWallet({
  appName: 'My dApp',
  network: 'testnet',
  oauthClients: {
    google: 'YOUR_GOOGLE_CLIENT_ID'
  }
});

// Connect with Google
const account = await wallet.connect('google');
console.log('Connected:', account.address);`,

  reactSetup: `import { ZkLoginProvider, useZkLogin, LoginButton } from '@stellar-zklogin/sdk/react';

function App() {
  return (
    <ZkLoginProvider config={{
      network: 'testnet',
      oauth: { google: { clientId: 'YOUR_ID' } }
    }}>
      <WalletApp />
    </ZkLoginProvider>
  );
}

function WalletApp() {
  const { isLoggedIn, wallet, login, logout } = useZkLogin();

  if (!isLoggedIn) {
    return <LoginButton provider="google" />;
  }

  return (
    <div>
      <p>Address: {wallet?.getAddress()}</p>
      <button onClick={logout}>Disconnect</button>
    </div>
  );
}`,

  sendPayment: `// Send XLM to another address
const result = await wallet.sendPayment(
  'GDEST...ABC', // Destination address
  'native',      // Asset type (XLM)
  '100'          // Amount
);

console.log('Transaction hash:', result.hash);
console.log('Status:', result.status);`,

  getBalance: `// Get XLM balance
const balance = await wallet.getBalance();
console.log('XLM Balance:', balance);

// Get token balance
const tokenBalance = await wallet.getBalance('CUSDC...');
console.log('USDC Balance:', tokenBalance);`,

  signTransaction: `import { TransactionBuilder, Networks, Operation } from '@stellar/stellar-sdk';

// Build custom transaction
const transaction = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(Operation.payment({
    destination: 'GDEST...',
    asset: Asset.native(),
    amount: '50',
  }))
  .setTimeout(30)
  .build();

// Sign with zkLogin wallet
const signedTx = await wallet.signTransaction(transaction.toXDR());`,

  xrayMetrics: `import { XRayClient } from '@stellar-zklogin/sdk';

const xray = new XRayClient({ network: 'testnet' });

// Get protocol metrics
const metrics = await xray.getMetrics();
console.log('Gas Savings:', metrics.gasSavingsPercent + '%');
console.log('Proofs Verified:', metrics.proofsVerified);

// Get protocol status
const status = await xray.getStatus();
console.log('BN254 Enabled:', status.features.bn254.enabled);`,

  x402Payment: `import { X402PaymentClient } from '@stellar-zklogin/sdk';

const x402 = new X402PaymentClient({
  network: 'testnet',
  wallet: wallet
});

// Handle 402 Payment Required response
const response = await fetch('/api/premium-content');
if (response.status === 402) {
  const requirement = x402.parsePaymentRequired(response);
  const proof = await x402.executePayment(requirement);

  // Retry with payment proof
  const content = await fetch('/api/premium-content', {
    headers: { 'PAYMENT': btoa(JSON.stringify(proof)) }
  });
}`,

  sessionManagement: `// Check if session is active
const isActive = await wallet.isActive();

// Get session info
const session = await wallet.getSession();
console.log('Expires at:', new Date(session.expiresAt));

// Export wallet (encrypted backup)
const backup = await wallet.export('user-password');

// Restore wallet
await wallet.restore(backup, 'user-password');`,
};

export default function SDKDemo() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"playground" | "examples" | "live">("playground");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [demoWallet, setDemoWallet] = useState<DemoWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    "// Stellar zkLogin SDK Demo Console",
    "// Ready to execute code...",
  ]);

  const [playgroundCode, setPlaygroundCode] = useState(CODE_EXAMPLES.basicSetup);
  const [isRunning, setIsRunning] = useState(false);

  const [sendAmount, setSendAmount] = useState("10");
  const [sendTo, setSendTo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const [xrayMetrics, setXrayMetrics] = useState({
    proofsVerified: 0,
    bn254Operations: 0,
    poseidonHashes: 0,
    gasSavingsPercent: 94,
    avgVerificationMs: 12,
  });

  useEffect(() => {
    const targetMetrics = {
      proofsVerified: 15847,
      bn254Operations: 47541,
      poseidonHashes: 31694,
      gasSavingsPercent: 94,
      avgVerificationMs: 12,
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);

      setXrayMetrics({
        proofsVerified: Math.floor(targetMetrics.proofsVerified * eased),
        bn254Operations: Math.floor(targetMetrics.bn254Operations * eased),
        poseidonHashes: Math.floor(targetMetrics.poseidonHashes * eased),
        gasSavingsPercent: Math.floor(targetMetrics.gasSavingsPercent * eased),
        avgVerificationMs: Math.floor(targetMetrics.avgVerificationMs * eased),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const addConsoleLog = (message: string) => {
    setConsoleOutput((prev) => [...prev, `> ${message}`]);
  };

  const simulateConnect = async () => {
    setIsConnecting(true);
    addConsoleLog("Initializing wallet...");

    await new Promise((r) => setTimeout(r, 500));
    addConsoleLog("Opening OAuth consent screen...");

    await new Promise((r) => setTimeout(r, 1000));
    addConsoleLog("Authenticating with Google...");

    await new Promise((r) => setTimeout(r, 800));
    addConsoleLog("Generating ephemeral keypair...");

    await new Promise((r) => setTimeout(r, 600));
    addConsoleLog("Computing deterministic address...");

    await new Promise((r) => setTimeout(r, 1200));
    addConsoleLog("Generating ZK proof (Groth16 on BN254)...");

    await new Promise((r) => setTimeout(r, 500));
    addConsoleLog("Registering session on-chain...");

    await new Promise((r) => setTimeout(r, 400));

    const mockWallet: DemoWallet = {
      address: "GDEMO" + Math.random().toString(36).substring(2, 8).toUpperCase() + "ZKLOGINWALLET7X2Y",
      balance: "10000.0000000",
      isConnected: true,
      provider: "google",
      sessionExpiry: Date.now() + 24 * 60 * 60 * 1000,
    };

    setDemoWallet(mockWallet);
    addConsoleLog(`Connected! Address: ${mockWallet.address}`);
    addConsoleLog(`Balance: ${mockWallet.balance} XLM`);
    setIsConnecting(false);
  };

  const simulateDisconnect = () => {
    setDemoWallet(null);
    setTransactions([]);
    addConsoleLog("Wallet disconnected.");
  };

  const simulateSend = async () => {
    if (!demoWallet || !sendTo || !sendAmount) return;

    setIsSending(true);
    addConsoleLog(`Sending ${sendAmount} XLM to ${sendTo.slice(0, 8)}...`);

    await new Promise((r) => setTimeout(r, 800));
    addConsoleLog("Building transaction...");

    await new Promise((r) => setTimeout(r, 600));
    addConsoleLog("Signing with ephemeral key...");

    await new Promise((r) => setTimeout(r, 1000));
    addConsoleLog("Submitting to Stellar network...");

    await new Promise((r) => setTimeout(r, 500));

    const hash = "tx" + Math.random().toString(36).substring(2, 14).toUpperCase();
    const newTx: DemoTransaction = {
      hash,
      status: "success",
      amount: sendAmount,
      to: sendTo,
      timestamp: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    addConsoleLog(`Transaction successful! Hash: ${hash}`);

    setDemoWallet((prev) =>
      prev
        ? {
            ...prev,
            balance: (parseFloat(prev.balance) - parseFloat(sendAmount)).toFixed(7),
          }
        : null
    );

    setSendAmount("10");
    setSendTo("");
    setIsSending(false);
  };

  const runPlayground = async () => {
    setIsRunning(true);
    setConsoleOutput(["// Running code..."]);

    await new Promise((r) => setTimeout(r, 500));

    if (playgroundCode.includes("createWallet")) {
      addConsoleLog("Creating wallet instance...");
      await new Promise((r) => setTimeout(r, 300));
      addConsoleLog("Wallet configured for testnet");
      await new Promise((r) => setTimeout(r, 200));
      addConsoleLog("OAuth client: google");
      await simulateConnect();
    } else if (playgroundCode.includes("sendPayment")) {
      addConsoleLog("Executing payment...");
      await new Promise((r) => setTimeout(r, 800));
      addConsoleLog("Transaction hash: txDEMO123ABC");
      addConsoleLog("Status: success");
    } else if (playgroundCode.includes("getBalance")) {
      addConsoleLog("Fetching balance...");
      await new Promise((r) => setTimeout(r, 500));
      addConsoleLog("XLM Balance: 10000.0000000");
    } else if (playgroundCode.includes("XRayClient")) {
      addConsoleLog("Connecting to X-Ray Protocol...");
      await new Promise((r) => setTimeout(r, 600));
      addConsoleLog("Gas Savings: 94%");
      addConsoleLog("Proofs Verified: 15847");
      addConsoleLog("BN254 Enabled: true");
    } else {
      addConsoleLog("Code executed successfully!");
    }

    setIsRunning(false);
  };

  const CodeBlock = ({
    code,
    title,
    codeKey,
  }: {
    code: string;
    title: string;
    codeKey: string;
  }) => (
    <div className={`border-2 sm:border-4 ${isDark ? "border-white/20" : "border-black/20"} mb-4 sm:mb-6`}>
      <div
        className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b-2 sm:border-b-4 ${isDark ? "border-white/20 bg-white/5" : "border-black/20 bg-black/5"}`}
      >
        <span className="font-black text-xs sm:text-sm">{title}</span>
        <button
          onClick={() => copyCode(code, codeKey)}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-black transition-all ${
            copiedCode === codeKey
              ? "text-[#00FF88]"
              : isDark
                ? "text-white/50 hover:text-white"
                : "text-black/50 hover:text-black"
          }`}
        >
          {copiedCode === codeKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedCode === codeKey ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre
        className={`p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm ${isDark ? "bg-black/30 text-[#0066FF]" : "bg-white/50 text-[#006600]"}`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-black"}`}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 ${isDark ? "bg-[#0A0A0A]" : "bg-[#F5F5F5]"} border-b-2 sm:border-b-4 ${isDark ? "border-white" : "border-black"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/" className="flex items-center gap-2 sm:gap-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#0066FF] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-7 sm:h-7">
                    <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="3"/>
                    <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="3"/>
                    <circle cx="12" cy="12" r="2" fill="white"/>
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl sm:text-2xl font-black tracking-tighter">SDK</span>
                  <span className="text-xl sm:text-2xl font-black tracking-tighter text-[#0066FF]">DEMO</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/sdk"
                className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-2 sm:border-4 ${isDark ? "border-white/30 text-white/70 hover:border-white hover:text-white" : "border-black/30 text-black/70 hover:border-black hover:text-black"} font-black text-xs sm:text-sm transition-all`}
              >
                <Code className="w-4 h-4" />
                DOCS
              </Link>

              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-9 h-9 sm:w-12 sm:h-12 border-2 sm:border-4 ${isDark ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"} flex items-center justify-center transition-all`}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <div
                className={`hidden sm:block px-3 sm:px-4 py-1.5 sm:py-2 border-2 sm:border-4 border-[#0066FF] text-[#0066FF] font-black text-xs sm:text-sm`}
              >
                LIVE DEMO
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0066FF] animate-pulse" />
            <span className="font-black text-xs sm:text-sm text-[#0066FF]">
              INTERACTIVE DEMO
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4 sm:mb-6">
            STELLA<span className="text-[#0066FF]">RAY</span> SDK
            <br />
            <span className={isDark ? "text-white/40" : "text-black/40"}>IN ACTION</span>
          </h1>

          <p className={`text-base sm:text-xl max-w-2xl mb-6 sm:mb-8 ${isDark ? "text-white/60" : "text-black/60"}`}>
            Experience the power of zero-knowledge authentication on Stellar. Connect, transact, and explore
            the SDK capabilities in real-time.
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-0 mb-6 sm:mb-8 overflow-x-auto pb-1">
            {[
              { id: "playground", label: "PLAYGROUND", shortLabel: "CODE", icon: Terminal },
              { id: "examples", label: "CODE EXAMPLES", shortLabel: "EXAMPLES", icon: Code },
              { id: "live", label: "LIVE WALLET", shortLabel: "WALLET", icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "playground" | "examples" | "live")}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-4 border-2 sm:border-4 font-black text-[10px] sm:text-sm transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? isDark
                      ? "border-[#0066FF] bg-[#0066FF] text-black"
                      : "border-[#0066FF] bg-[#0066FF] text-white"
                    : isDark
                      ? "border-white/30 hover:border-white"
                      : "border-black/30 hover:border-black"
                } ${tab.id !== "playground" ? "-ml-0.5" : ""}`}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Playground Tab */}
          {activeTab === "playground" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Code Editor */}
              <div className={`border-2 sm:border-4 ${isDark ? "border-white" : "border-black"}`}>
                <div
                  className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b-2 sm:border-b-4 ${isDark ? "border-white bg-white text-black" : "border-black bg-black text-white"}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#0066FF]" />
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#00D4FF]" />
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#00FF88]" />
                    </div>
                    <span className="font-black text-[10px] sm:text-sm">CODE_EDITOR.JS</span>
                  </div>
                  <button
                    onClick={runPlayground}
                    disabled={isRunning}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-black text-[10px] sm:text-sm transition-all ${
                      isDark
                        ? "bg-[#0066FF] text-black hover:bg-[#0055DD]"
                        : "bg-[#0066FF] text-white hover:bg-[#0055DD]"
                    } disabled:opacity-50`}
                  >
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    {isRunning ? "RUNNING" : "RUN"}
                  </button>
                </div>
                <div className="p-2 sm:p-4">
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className={`w-full h-[250px] sm:h-[400px] p-3 sm:p-4 font-mono text-xs sm:text-sm resize-none focus:outline-none ${
                      isDark ? "bg-black/50 text-[#0066FF]" : "bg-white text-[#006600]"
                    }`}
                    spellCheck={false}
                  />
                </div>

                {/* Quick Examples */}
                <div className={`px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 sm:border-t-4 ${isDark ? "border-white/20" : "border-black/20"} pt-3 sm:pt-4`}>
                  <p className={`text-[10px] sm:text-xs font-black mb-2 sm:mb-3 ${isDark ? "text-white/50" : "text-black/50"}`}>
                    QUICK EXAMPLES:
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {[
                      { label: "Connect", code: CODE_EXAMPLES.basicSetup },
                      { label: "Send", code: CODE_EXAMPLES.sendPayment },
                      { label: "Balance", code: CODE_EXAMPLES.getBalance },
                      { label: "X-Ray", code: CODE_EXAMPLES.xrayMetrics },
                    ].map((example) => (
                      <button
                        key={example.label}
                        onClick={() => setPlaygroundCode(example.code)}
                        className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black border sm:border-2 transition-all ${
                          isDark
                            ? "border-white/30 hover:border-[#0066FF] hover:text-[#0066FF]"
                            : "border-black/30 hover:border-[#0066FF] hover:text-[#0066FF]"
                        }`}
                      >
                        {example.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Console Output */}
              <div className={`border-2 sm:border-4 ${isDark ? "border-white" : "border-black"}`}>
                <div
                  className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b-2 sm:border-b-4 ${isDark ? "border-white bg-white text-black" : "border-black bg-black text-white"}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-black text-[10px] sm:text-sm">CONSOLE.LOG</span>
                  </div>
                  <button
                    onClick={() =>
                      setConsoleOutput(["// Stellar zkLogin SDK Demo Console", "// Ready to execute code..."])
                    }
                    className="text-[10px] sm:text-xs font-black opacity-50 hover:opacity-100"
                  >
                    CLEAR
                  </button>
                </div>
                <div className={`p-3 sm:p-4 h-[300px] sm:h-[500px] overflow-y-auto font-mono text-xs sm:text-sm ${isDark ? "bg-black" : "bg-gray-900"}`}>
                  {consoleOutput.map((line, i) => (
                    <div
                      key={i}
                      className={`mb-1 ${
                        line.startsWith("//")
                          ? "text-gray-500"
                          : line.includes("Error") || line.includes("failed")
                            ? "text-[#FF3366]"
                            : line.includes("success") || line.includes("Connected")
                              ? "text-[#00FF88]"
                              : "text-[#0066FF]"
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                  <div className="h-4 w-2 bg-[#0066FF] animate-pulse inline-block" />
                </div>

                {/* Wallet Status */}
                {demoWallet && (
                  <div className={`p-3 sm:p-4 border-t-2 sm:border-t-4 ${isDark ? "border-white/20" : "border-black/20"}`}>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#00FF88] animate-pulse" />
                        <span className="font-black text-xs sm:text-sm text-[#00FF88]">CONNECTED</span>
                      </div>
                      <button
                        onClick={simulateDisconnect}
                        className={`text-[10px] sm:text-xs font-black ${isDark ? "text-[#FF3366]" : "text-[#CC0033]"}`}
                      >
                        DISCONNECT
                      </button>
                    </div>
                    <div className={`text-[10px] sm:text-xs font-mono ${isDark ? "text-white/50" : "text-black/50"}`}>
                      <p className="truncate">Address: {demoWallet.address}</p>
                      <p>Balance: {demoWallet.balance} XLM</p>
                      <p>Provider: {demoWallet.provider}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Examples Tab */}
          {activeTab === "examples" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6">INSTALLATION</h2>
                <CodeBlock code={CODE_EXAMPLES.install} title="npm / yarn" codeKey="install" />

                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 mt-8 sm:mt-10">BASIC SETUP</h2>
                <CodeBlock code={CODE_EXAMPLES.basicSetup} title="Vanilla JavaScript" codeKey="basic" />

                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 mt-8 sm:mt-10">REACT INTEGRATION</h2>
                <CodeBlock code={CODE_EXAMPLES.reactSetup} title="React + Hooks" codeKey="react" />

                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 mt-8 sm:mt-10">X-RAY PROTOCOL</h2>
                <CodeBlock code={CODE_EXAMPLES.xrayMetrics} title="Native ZK Primitives" codeKey="xray" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6">SEND PAYMENTS</h2>
                <CodeBlock code={CODE_EXAMPLES.sendPayment} title="Transfer XLM" codeKey="send" />

                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 mt-8 sm:mt-10">GET BALANCE</h2>
                <CodeBlock code={CODE_EXAMPLES.getBalance} title="Query Balances" codeKey="balance" />

                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 mt-8 sm:mt-10">SIGN TRANSACTIONS</h2>
                <CodeBlock code={CODE_EXAMPLES.signTransaction} title="Custom Transactions" codeKey="sign" />

                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 mt-8 sm:mt-10">x402 MICROPAYMENTS</h2>
                <CodeBlock code={CODE_EXAMPLES.x402Payment} title="HTTP 402 Protocol" codeKey="x402" />
              </div>
            </div>
          )}

          {/* Live Wallet Tab */}
          {activeTab === "live" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Wallet Card */}
              <div className="lg:col-span-2">
                <div className={`border-2 sm:border-4 ${isDark ? "border-white" : "border-black"}`}>
                  <div
                    className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b-2 sm:border-b-4 ${isDark ? "border-white bg-white text-black" : "border-black bg-black text-white"}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#FF3366]" />
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#FFD600]" />
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#00FF88]" />
                      </div>
                      <span className="font-black text-[10px] sm:text-sm">ZKLOGIN_WALLET.EXE</span>
                    </div>
                    {demoWallet && (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2 h-2 bg-[#00FF88]" />
                        <span className="font-black text-[10px] sm:text-xs text-[#00FF88]">CONNECTED</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-6 md:p-8">
                    {!demoWallet ? (
                      <div className="text-center py-8 sm:py-12">
                        <div
                          className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 border-4 border-dashed ${isDark ? "border-white/30" : "border-black/30"} flex items-center justify-center`}
                        >
                          <Wallet className={`w-8 h-8 sm:w-12 sm:h-12 ${isDark ? "text-white/30" : "text-black/30"}`} />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4">CONNECT YOUR WALLET</h3>
                        <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${isDark ? "text-white/60" : "text-black/60"}`}>
                          Experience zkLogin authentication with zero seed phrases
                        </p>
                        <button
                          onClick={simulateConnect}
                          disabled={isConnecting}
                          className="group relative inline-block"
                        >
                          <div className="absolute inset-0 bg-[#0066FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                          <div
                            className={`relative flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 ${isDark ? "bg-[#0A0A0A] border-[#0066FF]" : "bg-[#F5F5F5] border-[#0066FF]"} border-2 sm:border-4 font-black text-sm sm:text-base transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1`}
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                CONNECTING...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                CONNECT WITH GOOGLE
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Balance */}
                        <div className="mb-6 sm:mb-8">
                          <div className="flex items-center justify-between mb-2">
                            <p className={`font-bold text-xs sm:text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                              TOTAL BALANCE
                            </p>
                            <button onClick={() => setShowBalance(!showBalance)}>
                              {showBalance ? (
                                <Eye className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
                              ) : (
                                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-baseline gap-2 sm:gap-4">
                            <span className="text-3xl sm:text-5xl md:text-6xl font-black text-[#00FF88]">
                              {showBalance ? parseFloat(demoWallet.balance).toLocaleString() : "------"}
                            </span>
                            <span className={`text-lg sm:text-2xl font-black ${isDark ? "text-white/40" : "text-black/40"}`}>
                              XLM
                            </span>
                          </div>
                        </div>

                        {/* Address */}
                        <div className={`p-3 sm:p-4 border-2 sm:border-4 ${isDark ? "border-white/20" : "border-black/20"} mb-4 sm:mb-6`}>
                          <p className={`font-bold text-[10px] sm:text-xs mb-1.5 sm:mb-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                            WALLET ADDRESS
                          </p>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <code className="flex-1 font-mono text-xs sm:text-sm text-[#0066FF] break-all">
                              {demoWallet.address}
                            </code>
                            <button
                              onClick={() => copyCode(demoWallet.address, "address")}
                              className={`w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-4 ${isDark ? "border-white/30 hover:border-[#00FF88]" : "border-black/30 hover:border-[#0066FF]"} flex items-center justify-center transition-all flex-shrink-0`}
                            >
                              {copiedCode === "address" ? (
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00FF88]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Send Form */}
                        <div className={`p-3 sm:p-4 border-2 sm:border-4 ${isDark ? "border-white/20" : "border-black/20"} mb-4 sm:mb-6`}>
                          <p className={`font-bold text-[10px] sm:text-xs mb-3 sm:mb-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
                            SEND XLM
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div>
                              <label className={`block text-[10px] sm:text-xs font-black mb-1.5 sm:mb-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                RECIPIENT
                              </label>
                              <input
                                type="text"
                                value={sendTo}
                                onChange={(e) => setSendTo(e.target.value)}
                                placeholder="GDEST..."
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 sm:border-4 ${isDark ? "border-white/30 bg-transparent" : "border-black/30 bg-transparent"} font-mono text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] sm:text-xs font-black mb-1.5 sm:mb-2 ${isDark ? "text-white/50" : "text-black/50"}`}>
                                AMOUNT
                              </label>
                              <input
                                type="number"
                                value={sendAmount}
                                onChange={(e) => setSendAmount(e.target.value)}
                                placeholder="0.00"
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 sm:border-4 ${isDark ? "border-white/30 bg-transparent" : "border-black/30 bg-transparent"} font-mono text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]`}
                              />
                            </div>
                          </div>
                          <button
                            onClick={simulateSend}
                            disabled={isSending || !sendTo || !sendAmount}
                            className={`w-full py-2.5 sm:py-3 font-black text-sm border-2 sm:border-4 ${
                              isDark
                                ? "border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black"
                                : "border-[#0099CC] text-[#0099CC] hover:bg-[#0099CC] hover:text-white"
                            } transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                          >
                            {isSending ? (
                              <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                SENDING...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                SEND PAYMENT
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={simulateDisconnect}
                          className={`w-full py-2.5 sm:py-3 font-black text-sm border-2 sm:border-4 ${isDark ? "border-[#FF3366] text-[#FF3366] hover:bg-[#FF3366] hover:text-white" : "border-[#CC0033] text-[#CC0033] hover:bg-[#CC0033] hover:text-white"} transition-all`}
                        >
                          DISCONNECT
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Transactions */}
                {transactions.length > 0 && (
                  <div className={`mt-4 sm:mt-6 border-2 sm:border-4 ${isDark ? "border-white" : "border-black"}`}>
                    <div
                      className={`px-3 sm:px-6 py-2.5 sm:py-4 border-b-2 sm:border-b-4 ${isDark ? "border-white bg-white text-black" : "border-black bg-black text-white"}`}
                    >
                      <span className="font-black text-[10px] sm:text-sm">TRANSACTION_LOG</span>
                    </div>
                    <div className="divide-y divide-white/10">
                      {transactions.map((tx) => (
                        <div key={tx.hash} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00FF88] flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-xs sm:text-sm">SENT {tx.amount} XLM</p>
                              <p className={`text-[10px] sm:text-xs truncate ${isDark ? "text-white/50" : "text-black/50"}`}>
                                To: {tx.to.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono text-[10px] sm:text-xs text-[#0066FF] truncate max-w-[80px] sm:max-w-none">{tx.hash}</p>
                            <p className={`text-[10px] sm:text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* X-Ray Metrics */}
              <div>
                <div className={`border-2 sm:border-4 border-[#0066FF]/30`}>
                  <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-b-2 sm:border-b-4 border-[#0066FF]/30 bg-[#0066FF]/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#0066FF]" />
                      <span className="font-black text-xs sm:text-sm text-[#0066FF]">X-RAY PROTOCOL</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                    {[
                      { label: "PROOFS VERIFIED", value: xrayMetrics.proofsVerified, color: "#0066FF", icon: Shield },
                      { label: "BN254 OPS", value: xrayMetrics.bn254Operations, color: "#00D4FF", icon: Cpu },
                      { label: "POSEIDON HASHES", value: xrayMetrics.poseidonHashes, color: "#FF10F0", icon: Hash },
                      { label: "GAS SAVINGS", value: xrayMetrics.gasSavingsPercent + "%", color: "#FFD600", icon: TrendingUp },
                      { label: "AVG VERIFY TIME", value: xrayMetrics.avgVerificationMs + "ms", color: "#00FF88", icon: Clock },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className={`flex items-center justify-between py-2 sm:py-3 border-b ${isDark ? "border-white/10" : "border-black/10"}`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <metric.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: metric.color }} />
                          <span className={`text-[10px] sm:text-xs font-black ${isDark ? "text-white/50" : "text-black/50"}`}>
                            {metric.label}
                          </span>
                        </div>
                        <span className="font-black text-sm sm:text-base" style={{ color: metric.color }}>
                          {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Info */}
                {demoWallet && (
                  <div className={`mt-4 sm:mt-6 border-2 sm:border-4 ${isDark ? "border-white/20" : "border-black/20"}`}>
                    <div className={`px-3 sm:px-6 py-2.5 sm:py-4 border-b-2 sm:border-b-4 ${isDark ? "border-white/20" : "border-black/20"}`}>
                      <span className="font-black text-xs sm:text-sm">SESSION_INFO</span>
                    </div>
                    <div className="p-3 sm:p-6 space-y-2 sm:space-y-3">
                      {[
                        { label: "Provider", value: "Google" },
                        { label: "Network", value: "Testnet", color: "#00FF88" },
                        { label: "Proof Type", value: "Groth16" },
                        { label: "Expires", value: new Date(demoWallet.sessionExpiry).toLocaleString() },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between">
                          <span className={`text-[10px] sm:text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>{item.label}</span>
                          <span className="font-black text-xs sm:text-sm" style={item.color ? { color: item.color } : undefined}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className={`mt-4 sm:mt-6 p-3 sm:p-6 border-2 sm:border-4 ${isDark ? "border-white/20" : "border-black/20"}`}>
                  <p className={`font-black text-[10px] sm:text-xs mb-3 sm:mb-4 ${isDark ? "text-white/50" : "text-black/50"}`}>
                    SDK FEATURES
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      "Zero seed phrases",
                      "Google OAuth login",
                      "Self-custodial wallet",
                      "Groth16 ZK proofs",
                      "X-Ray Protocol support",
                      "94% gas savings",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 sm:gap-3">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00FF88] flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CTA */}
      <section className={`py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-t-2 sm:border-t-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-4 sm:mb-6">
            READY TO <span className="text-[#0066FF]">BUILD</span>?
          </h2>
          <p className={`text-sm sm:text-lg mb-6 sm:mb-8 ${isDark ? "text-white/60" : "text-black/60"}`}>
            Integrate zkLogin into your dApp. Full documentation and examples available.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
            <Link href="/sdk" className="group relative inline-block w-full sm:w-auto">
              <div className="absolute inset-0 bg-[#0066FF] translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
              <div
                className={`relative flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 ${isDark ? "bg-[#0A0A0A] border-[#0066FF]" : "bg-[#F5F5F5] border-[#0066FF]"} border-2 sm:border-4 font-black text-sm sm:text-base transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1`}
              >
                <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                VIEW DOCUMENTATION
              </div>
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 border-2 sm:border-4 ${isDark ? "border-white/30 hover:border-white" : "border-black/30 hover:border-black"} font-black text-sm sm:text-base transition-all w-full sm:w-auto`}
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              TRY REAL WALLET
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border-t-2 sm:border-t-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#0066FF] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5">
                <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2"/>
                <line x1="20" y1="4" x2="4" y2="20" stroke="#00D4FF" strokeWidth="2"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className={`font-bold text-xs sm:text-base ${isDark ? "text-white/50" : "text-black/50"}`}>
              STELLARAY SDK Demo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#0066FF] animate-pulse" />
            <span className="text-xs sm:text-sm font-black text-[#0066FF]">
              TESTNET SIMULATION
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
