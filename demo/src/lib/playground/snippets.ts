export type SnippetCategory = 'authentication' | 'payments' | 'streaming' | 'intent' | 'x402' | 'advanced';

export interface Snippet {
  id: string;
  title: string;
  category: SnippetCategory;
  description: string;
  code: string;
  language: 'typescript' | 'bash' | 'tsx';
}

export const CATEGORY_META: Record<SnippetCategory, { label: string; color: string }> = {
  authentication: { label: 'AUTHENTICATION', color: '#0066FF' },
  payments: { label: 'PAYMENTS', color: '#00D4FF' },
  streaming: { label: 'STREAMING', color: '#00D4FF' },
  intent: { label: 'NEAR INTENT', color: '#FFD600' },
  x402: { label: 'x402 PROTOCOL', color: '#FF3366' },
  advanced: { label: 'ADVANCED', color: '#BD93F9' },
};

export const SNIPPETS: Snippet[] = [
  // ═══════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════
  {
    id: 'auth-install',
    title: 'Install SDK',
    category: 'authentication',
    description: 'Install the StellaRay zkLogin SDK from npm',
    language: 'bash',
    code: `npm install @stellar-zklogin/sdk

# Or with yarn
yarn add @stellar-zklogin/sdk

# Or with pnpm
pnpm add @stellar-zklogin/sdk`,
  },
  {
    id: 'auth-init',
    title: 'Initialize Client',
    category: 'authentication',
    description: 'Create a ZkLoginClient instance configured for your application',
    language: 'typescript',
    code: `import { ZkLoginClient } from '@stellar-zklogin/sdk';

const client = new ZkLoginClient({
  network: 'testnet',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  proverUrl: 'https://prover.stellaray.dev',
  saltServiceUrl: 'https://salt.stellaray.dev',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  contracts: {
    zkVerifier: 'CDAQXHNK2HZJJE...',
    gatewayFactory: 'CAAOQR7L5UVV7...',
    jwkRegistry: 'CAMO5LYOANZWUZ...',
    x402Facilitator: 'CDJMT4P4DUZVR...',
    smartWalletWasmHash: '...',
  }
});

console.log('Client initialized for', client.network);`,
  },
  {
    id: 'auth-connect',
    title: 'Connect Wallet',
    category: 'authentication',
    description: 'Complete OAuth flow and create a zkLogin wallet',
    language: 'typescript',
    code: `import { createWallet } from '@stellar-zklogin/sdk';

// Create wallet instance
const wallet = createWallet({
  appName: 'My dApp',
  network: 'testnet',
  oauthClients: {
    google: 'YOUR_GOOGLE_CLIENT_ID'
  }
});

// Step 1: Initialize session
const { nonce } = await wallet.initializeSession();
console.log('Session nonce:', nonce);

// Step 2: Redirect to Google OAuth
const authUrl = wallet.getAuthorizationUrl('google', redirectUri);
window.location.href = authUrl;

// Step 3: After OAuth callback
await wallet.completeOAuth('google', code, redirectUri);

// Step 4: Compute wallet address
await wallet.computeAddress();
console.log('Wallet:', wallet.getAddress());
console.log('Balance:', await wallet.getBalance());`,
  },
  {
    id: 'auth-react',
    title: 'React Integration',
    category: 'authentication',
    description: 'Use zkLogin with React hooks and components',
    language: 'tsx',
    code: `import { ZkLoginProvider, useZkLogin, LoginButton } from '@stellar-zklogin/sdk/react';

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
      <p>Balance: {wallet?.balance} XLM</p>
      <button onClick={logout}>Disconnect</button>
    </div>
  );
}`,
  },
  {
    id: 'auth-session',
    title: 'Session Management',
    category: 'authentication',
    description: 'Manage ephemeral key sessions and wallet backup',
    language: 'typescript',
    code: `// Check if session is active
const isActive = await wallet.isActive();
console.log('Session active:', isActive);

// Get session info
const session = await wallet.getSession();
console.log('Session ID:', session.sessionId);
console.log('Expires at:', new Date(session.expiresAt));
console.log('Ephemeral key:', session.ephemeralPublicKey);

// Export wallet (encrypted backup)
const backup = await wallet.export('user-password');
console.log('Backup created:', backup.substring(0, 20) + '...');

// Restore wallet on another device
await wallet.restore(backup, 'user-password');
console.log('Wallet restored!');`,
  },

  // ═══════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════
  {
    id: 'pay-send',
    title: 'Send Payment',
    category: 'payments',
    description: 'Send XLM or tokens to another Stellar address',
    language: 'typescript',
    code: `// Send XLM to another address
const result = await wallet.sendPayment(
  'GDEST7X2YZKLOGINWALLET...', // Destination
  'native',                     // Asset type (XLM)
  '100'                         // Amount in XLM
);

console.log('Transaction hash:', result.hash);
console.log('Ledger:', result.ledger);
console.log('Status:', result.success ? 'SUCCESS' : 'FAILED');

// Send custom token
const tokenResult = await wallet.sendPayment(
  'GDEST7X2YZKLOGINWALLET...',
  'CUSDC:ISSUER_ADDRESS',
  '50.00'
);
console.log('Token transfer:', tokenResult.hash);`,
  },
  {
    id: 'pay-balance',
    title: 'Check Balance',
    category: 'payments',
    description: 'Query wallet balances for XLM and tokens',
    language: 'typescript',
    code: `// Get all balances
const balances = await wallet.getBalances();
for (const balance of balances) {
  console.log(\`\${balance.asset}: \${balance.amount}\`);
}

// Get XLM balance specifically
const xlmBalance = await wallet.getBalance();
console.log('XLM Balance:', xlmBalance, 'XLM');

// Get specific token balance
const usdcBalance = await wallet.getBalance('CUSDC...');
console.log('USDC Balance:', usdcBalance);

// Check if account exists
const exists = await wallet.accountExists();
console.log('Account exists:', exists);`,
  },
  {
    id: 'pay-sign',
    title: 'Sign Transaction',
    category: 'payments',
    description: 'Build and sign custom Stellar transactions',
    language: 'typescript',
    code: `import { TransactionBuilder, Networks, Operation, Asset } from '@stellar/stellar-sdk';

// Build custom transaction
const account = await server.loadAccount(wallet.getAddress());
const transaction = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(Operation.payment({
    destination: 'GDEST...',
    asset: Asset.native(),
    amount: '50',
  }))
  .addOperation(Operation.changeTrust({
    asset: new Asset('USDC', 'ISSUER...'),
  }))
  .setTimeout(30)
  .build();

// Sign with zkLogin ephemeral key
const signedTx = await wallet.signTransaction(transaction.toXDR());
console.log('Signed XDR:', signedTx);

// Submit to network
const submitResult = await server.submitTransaction(signedTx);
console.log('Hash:', submitResult.hash);`,
  },
  {
    id: 'pay-batch',
    title: 'Batch Payments',
    category: 'payments',
    description: 'Send multiple payments in a single transaction',
    language: 'typescript',
    code: `// Batch payments: multiple operations in one transaction
const recipients = [
  { address: 'GALICE...', amount: '50' },
  { address: 'GBOB...', amount: '25' },
  { address: 'GCHARLIE...', amount: '75' },
];

const batchResult = await wallet.batchPayments(
  recipients.map(r => ({
    destination: r.address,
    asset: 'native',
    amount: r.amount,
  }))
);

console.log('Batch hash:', batchResult.hash);
console.log('Total sent:', recipients.reduce(
  (sum, r) => sum + parseFloat(r.amount), 0
), 'XLM');
console.log('Operations:', recipients.length);`,
  },

  // ═══════════════════════════════════
  // STREAMING
  // ═══════════════════════════════════
  {
    id: 'stream-create',
    title: 'Create Stream',
    category: 'streaming',
    description: 'Create a real-time streaming payment to another address',
    language: 'typescript',
    code: `import { StreamingClient } from '@stellar-zklogin/sdk';

const streaming = new StreamingClient({
  network: 'testnet',
  wallet: wallet,
});

// Create a linear payment stream
const stream = await streaming.createStream({
  recipient: 'GRECIPIENT...',
  totalAmount: '1000',          // Total XLM to stream
  asset: 'native',
  duration: 30 * 24 * 60 * 60,  // 30 days in seconds
  curveType: 'linear',           // linear | cliff | exponential | steps
  title: 'Monthly salary payment',
  memo: 'Jan 2026 salary',
});

console.log('Stream ID:', stream.id);
console.log('Flow rate:', stream.flowRate, 'XLM/sec');
console.log('Start:', new Date(stream.startTime));
console.log('End:', new Date(stream.endTime));`,
  },
  {
    id: 'stream-monitor',
    title: 'Monitor Stream',
    category: 'streaming',
    description: 'Track streaming payment progress in real-time',
    language: 'typescript',
    code: `// Get stream details
const stream = await streaming.getStream('stream_abc123');
console.log('Status:', stream.status);
console.log('Total:', stream.totalAmount, 'XLM');

// Calculate real-time streamed amount
const now = Date.now() / 1000;
const elapsed = now - stream.startTime;
const total = stream.endTime - stream.startTime;
const streamed = (elapsed / total) * parseFloat(stream.totalAmount);

console.log('Streamed so far:', streamed.toFixed(7), 'XLM');
console.log('Withdrawable:', stream.withdrawableAmount, 'XLM');
console.log('Remaining:', stream.remainingAmount, 'XLM');

// Withdraw accumulated funds (recipient only)
const withdrawal = await streaming.withdraw('stream_abc123');
console.log('Withdrawn:', withdrawal.amount, 'XLM');
console.log('Tx hash:', withdrawal.hash);`,
  },
  {
    id: 'stream-cancel',
    title: 'Cancel Stream',
    category: 'streaming',
    description: 'Cancel an active stream and distribute remaining funds',
    language: 'typescript',
    code: `// Cancel stream (sender only)
// Remaining funds return to sender, streamed funds go to recipient
const cancellation = await streaming.cancelStream('stream_abc123');

console.log('Stream cancelled!');
console.log('Sender refund:', cancellation.senderRefund, 'XLM');
console.log('Recipient received:', cancellation.recipientAmount, 'XLM');
console.log('Cancel tx:', cancellation.hash);

// List all your streams
const myStreams = await streaming.getStreams({
  role: 'sender',   // 'sender' | 'recipient' | 'all'
  status: 'active', // 'active' | 'completed' | 'cancelled' | 'all'
});

for (const s of myStreams) {
  console.log(\`[\${s.status}] \${s.id}: \${s.totalAmount} XLM -> \${s.recipientAddress}\`);
}`,
  },

  // ═══════════════════════════════════
  // NEAR INTENT
  // ═══════════════════════════════════
  {
    id: 'intent-balance',
    title: 'Balance Intent Proof',
    category: 'intent',
    description: 'Prove your wallet can afford a transaction without revealing your balance',
    language: 'typescript',
    code: `import { IntentClient } from '@stellar-zklogin/sdk';

const intent = new IntentClient({
  network: 'testnet',
  wallet: wallet,
  proverUrl: 'https://prover.stellaray.dev',
});

// Prove: "I have at least 100 XLM" without revealing actual balance
const proof = await intent.proveBalanceIntent({
  threshold: '100',        // Minimum balance to prove
  asset: 'native',
  expiryEpoch: 1000000,   // Proof valid until this ledger
});

console.log('Intent proof generated!');
console.log('Commitment:', proof.commitment);
console.log('Proof valid:', proof.verified);
console.log('Expires at ledger:', proof.expiryEpoch);
// Your actual balance is NEVER revealed

// Verify on-chain
const valid = await intent.verifyIntent(proof);
console.log('On-chain verification:', valid);`,
  },
  {
    id: 'intent-eligibility',
    title: 'Eligibility Intent',
    category: 'intent',
    description: 'Prove you qualify for an action without revealing your identity',
    language: 'typescript',
    code: `// Prove eligibility using Merkle tree membership
// Example: prove you're in an allowlist without revealing which entry

const eligibilityProof = await intent.proveEligibilityIntent({
  merkleRoot: '0x1a2b3c...',    // Root of allowlist Merkle tree
  merkleProof: [...],            // Your branch proof
  leafIndex: 42,                 // Your position (private)
});

console.log('Eligibility proven!');
console.log('You are in the allowlist: YES');
console.log('Your identity: HIDDEN');
console.log('Your leaf index: HIDDEN');

// Prove stream intent: "I have an active stream to this recipient"
const streamProof = await intent.proveStreamIntent({
  recipient: 'GRECIPIENT...',
  minFlowRate: '0.001',         // Minimum XLM/sec
});

console.log('Active stream proven without revealing amount or details');`,
  },

  // ═══════════════════════════════════
  // x402 PROTOCOL
  // ═══════════════════════════════════
  {
    id: 'x402-setup',
    title: 'Setup x402 Client',
    category: 'x402',
    description: 'Configure HTTP 402 Payment Required micropayments',
    language: 'typescript',
    code: `import { X402PaymentClient } from '@stellar-zklogin/sdk';

const x402 = new X402PaymentClient({
  network: 'testnet',
  wallet: wallet,
});

// Fetch a protected resource
const response = await fetch('https://api.example.com/premium-data');

if (response.status === 402) {
  // Parse the payment requirement
  const requirement = x402.parsePaymentRequired(response);

  console.log('Payment required!');
  console.log('Amount:', requirement.payload.amount, 'stroops');
  console.log('Asset:', requirement.payload.asset);
  console.log('Destination:', requirement.payload.destination);
  console.log('Valid until:', new Date(requirement.payload.validUntil * 1000));
}`,
  },
  {
    id: 'x402-pay',
    title: 'Execute x402 Payment',
    category: 'x402',
    description: 'Pay for a protected resource and retry the request',
    language: 'typescript',
    code: `// Execute the payment
const paymentProof = await x402.executePayment(requirement);
console.log('Payment sent!');
console.log('Tx hash:', paymentProof.transactionHash);
console.log('Payer:', paymentProof.payer);

// Retry the request with payment proof in header
const content = await fetch('https://api.example.com/premium-data', {
  headers: {
    'X-PAYMENT-PROOF': btoa(JSON.stringify(paymentProof))
  }
});

const data = await content.json();
console.log('Protected data received:', data);

// Verify a payment was made (server-side)
const isPaid = await x402.verifyPayment(requestId);
console.log('Payment verified:', isPaid);`,
  },
  {
    id: 'x402-intent-gate',
    title: 'Intent-Gated Payment',
    category: 'x402',
    description: 'Prove you can afford a payment before executing it',
    language: 'typescript',
    code: `// Intent-gated x402: prove ability to pay BEFORE paying
// Eliminates failed transactions and wasted gas

const response = await fetch('https://api.example.com/expensive-resource');

if (response.status === 402) {
  const requirement = x402.parsePaymentRequired(response);

  // Step 1: Generate balance intent proof
  const intentProof = await intent.proveBalanceIntent({
    threshold: requirement.payload.amount,
    asset: requirement.payload.asset,
    expiryEpoch: requirement.payload.validUntil,
  });

  console.log('Balance proof: CAN_PAY =', intentProof.verified);

  // Step 2: Submit intent proof to server
  const preAuth = await fetch('https://api.example.com/verify-intent', {
    method: 'POST',
    body: JSON.stringify({ intentProof }),
  });

  // Step 3: Server verified intent, now execute payment
  if (preAuth.ok) {
    const proof = await x402.executePayment(requirement);
    console.log('Payment successful:', proof.transactionHash);
  }
}`,
  },

  // ═══════════════════════════════════
  // ADVANCED
  // ═══════════════════════════════════
  {
    id: 'adv-xray',
    title: 'X-Ray Protocol Metrics',
    category: 'advanced',
    description: 'Monitor Protocol 25 performance and gas savings',
    language: 'typescript',
    code: `import { XRayClient } from '@stellar-zklogin/sdk';

const xray = new XRayClient({ network: 'testnet' });

// Get protocol metrics
const metrics = await xray.getMetrics();
console.log('Proofs Verified:', metrics.proofsVerified.toLocaleString());
console.log('BN254 Operations:', metrics.bn254Operations.toLocaleString());
console.log('Poseidon Hashes:', metrics.poseidonHashes.toLocaleString());
console.log('Gas Savings:', metrics.gasSavingsPercent + '%');

// Get protocol status
const status = await xray.getStatus();
console.log('Protocol Version:', status.version);
console.log('BN254 Enabled:', status.features.bn254.enabled);
console.log('Poseidon Enabled:', status.features.poseidon.enabled);

// Host functions available:
// bn254_g1_add, bn254_g1_mul, bn254_multi_pairing_check
// poseidon_permutation, poseidon2_permutation`,
  },
  {
    id: 'adv-contract',
    title: 'Contract Interaction',
    category: 'advanced',
    description: 'Interact directly with StellaRay Soroban contracts',
    language: 'typescript',
    code: `import { SorobanClient } from '@stellar-zklogin/sdk';

const soroban = new SorobanClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  network: 'testnet',
});

// Check if a wallet exists in the factory
const exists = await soroban.invokeContract(
  'CAAOQR7L5UVV7...',  // Gateway Factory
  'get_wallet',
  [addressSeed]
);
console.log('Wallet exists:', exists);

// Get wallet count from factory
const count = await soroban.invokeContract(
  'CAAOQR7L5UVV7...',
  'get_wallet_count',
  []
);
console.log('Total wallets deployed:', count);

// Check if nullifier has been used (replay protection)
const used = await soroban.invokeContract(
  'CDAQXHNK2HZJJ...',  // ZK Verifier
  'is_nullifier_used',
  [nullifierHash]
);
console.log('Nullifier used:', used);`,
  },
  {
    id: 'adv-zk-proof',
    title: 'ZK Proof Deep Dive',
    category: 'advanced',
    description: 'Understand the complete Groth16 proof structure',
    language: 'typescript',
    code: `// The Groth16 proof structure used by StellaRay
interface Groth16Proof {
  a: { x: string; y: string };         // pi_A in G1
  b: { x: [string, string]; y: [string, string] }; // pi_B in G2
  c: { x: string; y: string };         // pi_C in G1
}

// 5 public inputs for zkLogin verification
interface ZkLoginPublicInputs {
  ephPkHash: string;       // Poseidon(eph_pk_high, eph_pk_low)
  maxEpoch: number;        // Session expiration ledger
  addressSeed: string;     // Poseidon(sub, aud, salt)
  issHash: string;         // Hash of OAuth issuer
  jwkModulusHash: string;  // Poseidon(RSA modulus chunks)
}

// Pairing equation verified on-chain:
// e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) = 1
// Using Protocol 25 native: env.crypto().bn254().pairing_check()

// Gas cost: 260,000 (vs 4,100,000 pre-Protocol 25) = 94% savings
console.log('Proof system: Groth16');
console.log('Curve: BN254 (alt-bn128)');
console.log('Hash: Poseidon (ZK-friendly)');
console.log('Verification cost: ~$0.03');`,
  },
];

export function getSnippetsByCategory(category: SnippetCategory): Snippet[] {
  return SNIPPETS.filter(s => s.category === category);
}

export function getSnippetById(id: string): Snippet | undefined {
  return SNIPPETS.find(s => s.id === id);
}

export function getAllCategories(): SnippetCategory[] {
  return ['authentication', 'payments', 'streaming', 'intent', 'x402', 'advanced'];
}
