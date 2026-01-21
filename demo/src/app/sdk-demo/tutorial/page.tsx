"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Code,
  Terminal,
  Zap,
  Shield,
  Wallet,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Play,
  ExternalLink,
  Package,
  Settings,
  Key,
  Send,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "Install the SDK",
    description: "Add the Stellar zkLogin SDK to your project using npm or yarn.",
    icon: Package,
    code: `# Using npm
npm install @stellar-zklogin/sdk

# Using yarn
yarn add @stellar-zklogin/sdk

# Using pnpm
pnpm add @stellar-zklogin/sdk`,
    language: "bash",
    explanation: `The SDK is published on npm as \`@stellar-zklogin/sdk\`. It includes:

• Core wallet functionality
• React hooks and components (optional)
• TypeScript definitions
• Zero external wallet dependencies`,
  },
  {
    id: 2,
    title: "Get OAuth Client ID",
    description: "Create a Google OAuth client ID for your application.",
    icon: Key,
    code: `// 1. Go to Google Cloud Console
// https://console.cloud.google.com/apis/credentials

// 2. Create OAuth 2.0 Client ID
// - Application type: Web application
// - Authorized JavaScript origins: http://localhost:3000
// - Authorized redirect URIs: http://localhost:3000/auth/callback

// 3. Copy your Client ID
const GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";`,
    language: "javascript",
    explanation: `You'll need a Google OAuth 2.0 client ID to authenticate users. The SDK uses this to:

• Open the Google consent screen
• Receive the JWT ID token
• Generate deterministic wallet addresses

For production, add your production domain to authorized origins.`,
  },
  {
    id: 3,
    title: "Initialize the SDK",
    description: "Create and configure your wallet instance.",
    icon: Settings,
    code: `import { createWallet } from '@stellar-zklogin/sdk';

// Create wallet instance with your configuration
const wallet = createWallet({
  // Your app's name (shown in consent screens)
  appName: 'My Stellar dApp',

  // Network: 'testnet' or 'mainnet'
  network: 'testnet',

  // OAuth provider client IDs
  oauthClients: {
    google: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    // apple: 'YOUR_APPLE_CLIENT_ID' // Optional
  },

  // Optional: Custom RPC endpoint
  // rpcUrl: 'https://soroban-testnet.stellar.org',

  // Optional: Enable debug logging
  // debug: true,
});

// Export for use across your app
export { wallet };`,
    language: "typescript",
    explanation: `The \`createWallet\` function creates a configured wallet instance. Key options:

• **appName**: Displayed to users during authentication
• **network**: 'testnet' for development, 'mainnet' for production
• **oauthClients**: Your OAuth provider credentials
• **rpcUrl**: Custom Soroban RPC endpoint (optional)`,
  },
  {
    id: 4,
    title: "Connect Wallet",
    description: "Authenticate users with their Google account.",
    icon: Wallet,
    code: `import { wallet } from './wallet-config';

async function connectWallet() {
  try {
    // This will:
    // 1. Open Google OAuth consent screen
    // 2. Generate ephemeral keypair
    // 3. Compute deterministic address
    // 4. Generate ZK proof
    // 5. Register session on-chain
    const account = await wallet.connect('google');

    console.log('Connected!');
    console.log('Address:', account.address);
    console.log('Public Key:', account.publicKey);

    // User is now authenticated
    return account;
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
}

// Example: Connect button handler
document.getElementById('connect-btn').onclick = connectWallet;`,
    language: "typescript",
    explanation: `The \`connect()\` method handles the entire authentication flow:

1. **OAuth Flow**: Opens Google sign-in popup
2. **Key Generation**: Creates ephemeral Ed25519 keypair
3. **Address Derivation**: Computes deterministic Stellar address
4. **Proof Generation**: Creates Groth16 ZK proof
5. **Session Registration**: Registers session on Stellar

The returned account object contains the user's Stellar address.`,
  },
  {
    id: 5,
    title: "Check Balance",
    description: "Query the user's XLM and token balances.",
    icon: RefreshCw,
    code: `import { wallet } from './wallet-config';

async function getBalances() {
  // Check if wallet is connected
  if (!wallet.isConnected()) {
    console.log('Please connect wallet first');
    return;
  }

  // Get native XLM balance
  const xlmBalance = await wallet.getBalance();
  console.log('XLM Balance:', xlmBalance);

  // Get specific token balance (e.g., USDC)
  const usdcAddress = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';
  const usdcBalance = await wallet.getBalance(usdcAddress);
  console.log('USDC Balance:', usdcBalance);

  // Get all balances
  const allBalances = await wallet.getAllBalances();
  console.log('All balances:', allBalances);

  return { xlm: xlmBalance, usdc: usdcBalance };
}`,
    language: "typescript",
    explanation: `Balance queries work seamlessly with zkLogin wallets:

• **Native XLM**: Call \`getBalance()\` with no arguments
• **Tokens**: Pass the token contract address
• **All Balances**: Use \`getAllBalances()\` for complete list

Balances are returned as strings with 7 decimal precision.`,
  },
  {
    id: 6,
    title: "Send Payment",
    description: "Transfer XLM or tokens to another address.",
    icon: Send,
    code: `import { wallet } from './wallet-config';

async function sendPayment() {
  // Destination address
  const destination = 'GDEST...ABCDEF';

  // Amount to send
  const amount = '100'; // 100 XLM

  // Send native XLM
  const result = await wallet.sendPayment(
    destination,
    'native',  // Use 'native' for XLM
    amount
  );

  console.log('Transaction successful!');
  console.log('Hash:', result.hash);
  console.log('Ledger:', result.ledger);

  // Send tokens (e.g., USDC)
  const tokenAddress = 'CUSDC...TOKEN';
  const tokenResult = await wallet.sendPayment(
    destination,
    tokenAddress,
    '50'  // 50 USDC
  );

  return result;
}

// With memo (optional)
async function sendWithMemo() {
  const result = await wallet.sendPayment(
    'GDEST...ABCDEF',
    'native',
    '100',
    { memo: 'Payment for services' }
  );
  return result;
}`,
    language: "typescript",
    explanation: `Sending payments is straightforward:

• **destination**: Recipient's Stellar address
• **asset**: Use 'native' for XLM or token contract address
• **amount**: String amount (7 decimal precision)
• **options**: Optional memo, fee, timeout

The SDK handles transaction building, signing with the ZK proof, and submission.`,
  },
  {
    id: 7,
    title: "React Integration",
    description: "Use the SDK with React hooks and components.",
    icon: Code,
    code: `// App.tsx - Wrap your app with the provider
import { ZkLoginProvider } from '@stellar-zklogin/sdk/react';

function App() {
  return (
    <ZkLoginProvider config={{
      network: 'testnet',
      oauth: {
        google: { clientId: 'YOUR_CLIENT_ID' }
      }
    }}>
      <YourApp />
    </ZkLoginProvider>
  );
}

// Component using hooks
import { useZkLogin, useWallet, LoginButton } from '@stellar-zklogin/sdk/react';

function WalletComponent() {
  const { isLoggedIn, wallet, login, logout } = useZkLogin();
  const { balance, sendPayment, refreshBalance } = useWallet();

  if (!isLoggedIn) {
    return (
      <LoginButton
        provider="google"
        onSuccess={(wallet) => console.log('Connected:', wallet.address)}
        onError={(err) => console.error(err)}
      />
    );
  }

  return (
    <div>
      <p>Address: {wallet?.getAddress()}</p>
      <p>Balance: {balance} XLM</p>
      <button onClick={refreshBalance}>Refresh</button>
      <button onClick={logout}>Disconnect</button>
    </div>
  );
}`,
    language: "tsx",
    explanation: `The React package provides:

• **ZkLoginProvider**: Context provider for wallet state
• **useZkLogin**: Authentication state and methods
• **useWallet**: Balance and transaction operations
• **LoginButton**: Pre-built login button component
• **WalletWidget**: Complete wallet UI widget

Import from \`@stellar-zklogin/sdk/react\` for React components.`,
  },
  {
    id: 8,
    title: "Advanced: Custom Transactions",
    description: "Build and sign custom Stellar transactions.",
    icon: Terminal,
    code: `import { wallet } from './wallet-config';
import {
  TransactionBuilder,
  Networks,
  Operation,
  Asset
} from '@stellar/stellar-sdk';

async function buildCustomTransaction() {
  // Get the connected account
  const account = wallet.getAccount();

  // Build a custom transaction
  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    // Add payment operation
    .addOperation(Operation.payment({
      destination: 'GDEST...ABCDEF',
      asset: Asset.native(),
      amount: '50',
    }))
    // Add another operation (batch transactions)
    .addOperation(Operation.payment({
      destination: 'GOTHER...XYZ123',
      asset: Asset.native(),
      amount: '25',
    }))
    .setTimeout(30)
    .build();

  // Sign with zkLogin (uses ephemeral key + ZK proof)
  const signedXdr = await wallet.signTransaction(transaction.toXDR());

  // Submit manually if needed
  const result = await wallet.submitTransaction(signedXdr);

  console.log('Transaction result:', result);
  return result;
}`,
    language: "typescript",
    explanation: `For advanced use cases, you can build custom transactions:

1. **Build**: Use Stellar SDK's TransactionBuilder
2. **Sign**: Call \`wallet.signTransaction(xdr)\`
3. **Submit**: Use \`wallet.submitTransaction()\` or Horizon directly

This enables complex operations like:
• Batch payments
• Asset trustlines
• Smart contract calls
• Multi-operation transactions`,
  },
  {
    id: 9,
    title: "X-Ray Protocol Metrics",
    description: "Access native ZK primitives and gas savings data.",
    icon: Zap,
    code: `import { XRayClient } from '@stellar-zklogin/sdk';

// Initialize X-Ray client
const xray = new XRayClient({ network: 'testnet' });

async function getXRayMetrics() {
  // Get protocol metrics
  const metrics = await xray.getMetrics();

  console.log('=== X-Ray Protocol Metrics ===');
  console.log('Proofs Verified:', metrics.proofsVerified);
  console.log('BN254 Operations:', metrics.bn254Operations);
  console.log('Poseidon Hashes:', metrics.poseidonHashes);
  console.log('Gas Savings:', metrics.gasSavingsPercent + '%');
  console.log('Avg Verify Time:', metrics.avgVerificationMs + 'ms');

  // Get protocol status
  const status = await xray.getStatus();

  console.log('\\n=== Protocol Status ===');
  console.log('Version:', status.protocolVersion);
  console.log('BN254 Enabled:', status.features.bn254.enabled);
  console.log('Poseidon Enabled:', status.features.poseidon.enabled);

  // Estimate gas for operations
  const groth16Gas = xray.estimateGas('groth16_verify');
  console.log('\\nGroth16 Verify Gas:', groth16Gas);

  return { metrics, status };
}`,
    language: "typescript",
    explanation: `X-Ray Protocol (Stellar Protocol 25) provides native ZK primitives:

• **BN254 Curve**: Hardware-accelerated elliptic curve operations
• **Poseidon Hash**: ZK-optimized hash function
• **94% Gas Savings**: Compared to WASM implementations

The XRayClient helps you:
• Monitor protocol metrics
• Check feature availability
• Estimate gas costs`,
  },
  {
    id: 10,
    title: "Session Management",
    description: "Handle session persistence and recovery.",
    icon: Shield,
    code: `import { wallet } from './wallet-config';

// Check session status
async function checkSession() {
  // Is user logged in?
  const isConnected = wallet.isConnected();
  console.log('Connected:', isConnected);

  // Is session still valid?
  const isActive = await wallet.isActive();
  console.log('Session active:', isActive);

  if (isConnected && isActive) {
    // Get session details
    const session = await wallet.getSession();
    console.log('Expires at:', new Date(session.expiresAt));
    console.log('Provider:', session.issuer);
  }

  return { isConnected, isActive };
}

// Export wallet backup (encrypted)
async function exportWallet(password: string) {
  const backup = await wallet.export(password);

  // Save to file or cloud storage
  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stellar-wallet-backup.json';
  a.click();

  return backup;
}

// Restore wallet from backup
async function restoreWallet(backup: string, password: string) {
  await wallet.restore(backup, password);
  console.log('Wallet restored!');
}

// Disconnect and clear session
function disconnect() {
  wallet.disconnect();
  console.log('Disconnected');
}`,
    language: "typescript",
    explanation: `Session management features:

• **isConnected()**: Check if wallet instance is connected
• **isActive()**: Verify session hasn't expired on-chain
• **getSession()**: Get session details (expiry, provider, etc.)
• **export()**: Encrypted backup for recovery
• **restore()**: Recover wallet from backup
• **disconnect()**: Clear session and logout

Sessions are automatically persisted in IndexedDB with AES-GCM encryption.`,
  },
];

export default function Tutorial() {
  const [isDark, setIsDark] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const step = TUTORIAL_STEPS.find((s) => s.id === currentStep)!;
  const progress = (completedSteps.length / TUTORIAL_STEPS.length) * 100;

  const copyCode = (code: string, stepId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(stepId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const nextStep = () => {
    markComplete(currentStep);
    if (currentStep < TUTORIAL_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-black"}`}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 ${isDark ? "bg-[#0A0A0A]" : "bg-[#F5F5F5]"} border-b-4 ${isDark ? "border-white" : "border-black"}`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link href="/sdk-demo" className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${isDark ? "bg-white text-black" : "bg-black text-white"} flex items-center justify-center text-2xl font-black`}
                >
                  S
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-black tracking-tighter">SDK</span>
                  <span className="text-2xl font-black tracking-tighter text-[#FF3366]">TUTORIAL</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/sdk-demo"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 border-4 ${isDark ? "border-white/30 hover:border-white" : "border-black/30 hover:border-black"} font-black text-sm transition-all`}
              >
                <Play className="w-4 h-4" />
                PLAYGROUND
              </Link>

              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-12 h-12 border-4 ${isDark ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"} flex items-center justify-center transition-all`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-black">
                INTEGRATION <span className="text-[#39FF14]">GUIDE</span>
              </h1>
              <span className={`font-black ${isDark ? "text-white/50" : "text-black/50"}`}>
                {completedSteps.length}/{TUTORIAL_STEPS.length} COMPLETE
              </span>
            </div>
            <div className={`h-2 ${isDark ? "bg-white/10" : "bg-black/10"}`}>
              <div
                className="h-full bg-[#39FF14] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar - Steps */}
            <div className={`border-4 ${isDark ? "border-white" : "border-black"} h-fit`}>
              <div
                className={`px-4 py-3 border-b-4 ${isDark ? "border-white bg-white text-black" : "border-black bg-black text-white"}`}
              >
                <span className="font-black text-sm">STEPS</span>
              </div>
              <div className="p-2">
                {TUTORIAL_STEPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all ${
                      currentStep === s.id
                        ? isDark
                          ? "bg-[#39FF14]/10 text-[#39FF14]"
                          : "bg-[#00AA55]/10 text-[#00AA55]"
                        : isDark
                          ? "hover:bg-white/5"
                          : "hover:bg-black/5"
                    }`}
                  >
                    {completedSteps.includes(s.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-[#00FF88] flex-shrink-0" />
                    ) : currentStep === s.id ? (
                      <div className="w-5 h-5 border-2 border-[#39FF14] flex-shrink-0" />
                    ) : (
                      <Circle className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-white/30" : "text-black/30"}`} />
                    )}
                    <span className="font-bold text-sm truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className={`border-4 ${isDark ? "border-white" : "border-black"}`}>
                {/* Header */}
                <div
                  className={`flex items-center justify-between px-6 py-4 border-b-4 ${isDark ? "border-white bg-white text-black" : "border-black bg-black text-white"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="w-4 h-4 bg-[#FF3366]" />
                      <div className="w-4 h-4 bg-[#FFD600]" />
                      <div className="w-4 h-4 bg-[#00FF88]" />
                    </div>
                    <span className="font-black text-sm">
                      STEP_{step.id.toString().padStart(2, "0")}.MD
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <step.icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Step Title */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`text-sm font-black ${isDark ? "text-[#39FF14]" : "text-[#00AA55]"}`}
                      >
                        STEP {step.id}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black mb-3">{step.title}</h2>
                    <p className={`text-lg ${isDark ? "text-white/60" : "text-black/60"}`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Code Block */}
                  <div className={`border-4 ${isDark ? "border-white/20" : "border-black/20"} mb-6`}>
                    <div
                      className={`flex items-center justify-between px-4 py-3 border-b-4 ${isDark ? "border-white/20 bg-white/5" : "border-black/20 bg-black/5"}`}
                    >
                      <span className={`font-mono text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                        {step.language}
                      </span>
                      <button
                        onClick={() => copyCode(step.code, step.id)}
                        className={`flex items-center gap-2 px-3 py-1 text-xs font-black transition-all ${
                          copiedCode === step.id
                            ? "text-[#00FF88]"
                            : isDark
                              ? "text-white/50 hover:text-white"
                              : "text-black/50 hover:text-black"
                        }`}
                      >
                        {copiedCode === step.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedCode === step.id ? "COPIED" : "COPY"}
                      </button>
                    </div>
                    <pre
                      className={`p-4 overflow-x-auto text-sm ${isDark ? "bg-black/50 text-[#39FF14]" : "bg-white text-[#006600]"}`}
                    >
                      <code>{step.code}</code>
                    </pre>
                  </div>

                  {/* Explanation */}
                  <div className={`p-6 border-4 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                    <h3 className="font-black mb-4">EXPLANATION</h3>
                    <div className={`whitespace-pre-line ${isDark ? "text-white/70" : "text-black/70"}`}>
                      {step.explanation}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`flex items-center gap-2 px-6 py-3 border-4 font-black transition-all disabled:opacity-30 ${
                        isDark
                          ? "border-white/30 hover:border-white"
                          : "border-black/30 hover:border-black"
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      PREVIOUS
                    </button>

                    {currentStep < TUTORIAL_STEPS.length ? (
                      <button
                        onClick={nextStep}
                        className={`flex items-center gap-2 px-6 py-3 border-4 font-black transition-all ${
                          isDark
                            ? "border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black"
                            : "border-[#00AA55] text-[#00AA55] hover:bg-[#00AA55] hover:text-white"
                        }`}
                      >
                        {completedSteps.includes(currentStep) ? "NEXT STEP" : "MARK COMPLETE & NEXT"}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <Link
                        href="/sdk-demo"
                        onClick={() => markComplete(currentStep)}
                        className={`flex items-center gap-2 px-6 py-3 border-4 font-black transition-all ${
                          isDark
                            ? "border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black"
                            : "border-[#00AA55] text-[#00AA55] hover:bg-[#00AA55] hover:text-white"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        COMPLETE TUTORIAL
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <Link
                  href="/sdk-demo"
                  className={`flex items-center gap-3 p-4 border-4 ${isDark ? "border-white/20 hover:border-[#39FF14]" : "border-black/20 hover:border-[#00AA55]"} transition-all`}
                >
                  <Play className={`w-5 h-5 ${isDark ? "text-[#39FF14]" : "text-[#00AA55]"}`} />
                  <span className="font-black text-sm">PLAYGROUND</span>
                </Link>
                <Link
                  href="/sdk"
                  className={`flex items-center gap-3 p-4 border-4 ${isDark ? "border-white/20 hover:border-[#00D4FF]" : "border-black/20 hover:border-[#0099CC]"} transition-all`}
                >
                  <Code className={`w-5 h-5 ${isDark ? "text-[#00D4FF]" : "text-[#0099CC]"}`} />
                  <span className="font-black text-sm">FULL DOCS</span>
                </Link>
                <a
                  href="https://github.com/stellar-zklogin/sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-4 border-4 ${isDark ? "border-white/20 hover:border-[#FF3366]" : "border-black/20 hover:border-[#CC0033]"} transition-all`}
                >
                  <ExternalLink className={`w-5 h-5 ${isDark ? "text-[#FF3366]" : "text-[#CC0033]"}`} />
                  <span className="font-black text-sm">GITHUB</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
