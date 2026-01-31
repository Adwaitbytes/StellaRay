export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiMethod {
  name: string;
  module: string;
  signature: string;
  description: string;
  parameters: ApiParam[];
  returnType: string;
  returnDescription: string;
  example: string;
  tags: string[];
}

export const API_MODULES = [
  { id: 'ZkLoginClient', label: 'ZKLOGIN CLIENT', color: '#0066FF', icon: 'Shield' },
  { id: 'IntentClient', label: 'INTENT CLIENT', color: '#FFD600', icon: 'Zap' },
  { id: 'X402PaymentClient', label: 'X402 CLIENT', color: '#FF3366', icon: 'CreditCard' },
  { id: 'XRayClient', label: 'X-RAY CLIENT', color: '#00D4FF', icon: 'Activity' },
  { id: 'Hooks', label: 'REACT HOOKS', color: '#00D4FF', icon: 'Code' },
  { id: 'Utils', label: 'UTILITIES', color: '#BD93F9', icon: 'Wrench' },
] as const;

export const API_METHODS: ApiMethod[] = [
  // ═══ ZkLoginClient ═══
  {
    name: 'constructor',
    module: 'ZkLoginClient',
    signature: 'new ZkLoginClient(config: ZkLoginClientConfig)',
    description: 'Creates a new ZkLoginClient instance. This is the main entry point for all zkLogin operations.',
    parameters: [
      { name: 'config.network', type: 'StellarNetwork', required: true, description: 'Network to connect to: "testnet" | "mainnet"' },
      { name: 'config.rpcUrl', type: 'string', required: false, description: 'Custom Soroban RPC endpoint URL' },
      { name: 'config.horizonUrl', type: 'string', required: false, description: 'Custom Horizon API endpoint URL' },
      { name: 'config.proverUrl', type: 'string', required: true, description: 'ZK proof generation service URL' },
      { name: 'config.saltServiceUrl', type: 'string', required: true, description: 'Salt derivation service URL' },
      { name: 'config.googleClientId', type: 'string', required: false, description: 'Google OAuth 2.0 client ID' },
      { name: 'config.contracts', type: 'ContractAddresses', required: true, description: 'Deployed contract addresses' },
    ],
    returnType: 'ZkLoginClient',
    returnDescription: 'A configured client instance ready for authentication',
    example: `const client = new ZkLoginClient({
  network: 'testnet',
  proverUrl: 'https://prover.stellaray.dev',
  saltServiceUrl: 'https://salt.stellaray.dev',
  googleClientId: 'YOUR_ID',
  contracts: TESTNET_CONTRACTS,
});`,
    tags: ['init', 'setup', 'client', 'config'],
  },
  {
    name: 'initializeSession',
    module: 'ZkLoginClient',
    signature: 'client.initializeSession(maxEpochOffset?: number): Promise<SessionInit>',
    description: 'Generates an ephemeral Ed25519 keypair and computes a Poseidon nonce for the OAuth flow.',
    parameters: [
      { name: 'maxEpochOffset', type: 'number', required: false, description: 'Ledger offset for session expiry (default: ~24 hours)' },
    ],
    returnType: '{ nonce: string, ephemeralPublicKey: string, maxEpoch: number }',
    returnDescription: 'Session initialization data including the nonce to embed in OAuth request',
    example: `const { nonce, ephemeralPublicKey, maxEpoch } = await client.initializeSession();
console.log('Nonce:', nonce);`,
    tags: ['session', 'nonce', 'ephemeral', 'keypair'],
  },
  {
    name: 'getAuthorizationUrl',
    module: 'ZkLoginClient',
    signature: 'client.getAuthorizationUrl(provider: string, redirectUri: string): string',
    description: 'Generates the OAuth authorization URL with the session nonce embedded.',
    parameters: [
      { name: 'provider', type: '"google" | "apple"', required: true, description: 'OAuth provider to authenticate with' },
      { name: 'redirectUri', type: 'string', required: true, description: 'URL to redirect after OAuth completion' },
    ],
    returnType: 'string',
    returnDescription: 'Full OAuth authorization URL to redirect the user to',
    example: `const url = client.getAuthorizationUrl('google', 'https://myapp.com/callback');
window.location.href = url;`,
    tags: ['oauth', 'google', 'apple', 'redirect', 'login'],
  },
  {
    name: 'completeOAuth',
    module: 'ZkLoginClient',
    signature: 'client.completeOAuth(provider: string, code: string, redirectUri: string): Promise<void>',
    description: 'Exchanges the OAuth authorization code for a JWT and verifies it.',
    parameters: [
      { name: 'provider', type: '"google" | "apple"', required: true, description: 'OAuth provider used' },
      { name: 'code', type: 'string', required: true, description: 'Authorization code from OAuth callback' },
      { name: 'redirectUri', type: 'string', required: true, description: 'Same redirect URI used in authorization' },
    ],
    returnType: 'void',
    returnDescription: 'JWT stored internally for subsequent operations',
    example: `const code = new URLSearchParams(window.location.search).get('code');
await client.completeOAuth('google', code, redirectUri);`,
    tags: ['oauth', 'callback', 'jwt', 'token'],
  },
  {
    name: 'computeAddress',
    module: 'ZkLoginClient',
    signature: 'client.computeAddress(): Promise<string>',
    description: 'Derives the deterministic Stellar wallet address from the OAuth identity using Poseidon hashing.',
    parameters: [],
    returnType: 'string',
    returnDescription: 'Stellar wallet address (G...)',
    example: `const address = await client.computeAddress();
console.log('Wallet:', address); // GABCD...`,
    tags: ['address', 'wallet', 'derive', 'poseidon'],
  },
  {
    name: 'generateProof',
    module: 'ZkLoginClient',
    signature: 'client.generateProof(): Promise<ZkProofWithInputs>',
    description: 'Generates a Groth16 ZK proof binding the OAuth JWT to the ephemeral key session.',
    parameters: [],
    returnType: 'ZkProofWithInputs',
    returnDescription: 'Groth16 proof (A, B, C points) and 5 public inputs',
    example: `const { proof, publicInputs } = await client.generateProof();
console.log('Proof generated!');`,
    tags: ['proof', 'groth16', 'zk', 'generate', 'bn254'],
  },
  {
    name: 'registerSession',
    module: 'ZkLoginClient',
    signature: 'client.registerSession(): Promise<string>',
    description: 'Submits the ZK proof to the Smart Wallet contract to register the ephemeral key session.',
    parameters: [],
    returnType: 'string',
    returnDescription: 'Session ID (BytesN<32> as hex string)',
    example: `const sessionId = await client.registerSession();
console.log('Session:', sessionId);`,
    tags: ['session', 'register', 'contract', 'on-chain'],
  },
  {
    name: 'signTransaction',
    module: 'ZkLoginClient',
    signature: 'client.signTransaction(txXdr: string): Promise<string>',
    description: 'Signs a Stellar transaction XDR using the ephemeral Ed25519 key.',
    parameters: [
      { name: 'txXdr', type: 'string', required: true, description: 'Base64-encoded transaction XDR to sign' },
    ],
    returnType: 'string',
    returnDescription: 'Signed transaction XDR ready for submission',
    example: `const signedXdr = await client.signTransaction(tx.toXDR());
await server.submitTransaction(signedXdr);`,
    tags: ['sign', 'transaction', 'ephemeral', 'ed25519'],
  },

  // ═══ IntentClient ═══
  {
    name: 'proveBalanceIntent',
    module: 'IntentClient',
    signature: 'intent.proveBalanceIntent(params: BalanceIntentParams): Promise<IntentProof>',
    description: 'Generates a ZK proof that the wallet balance exceeds a threshold without revealing the actual balance.',
    parameters: [
      { name: 'params.threshold', type: 'string', required: true, description: 'Minimum balance to prove (in stroops or XLM)' },
      { name: 'params.asset', type: 'string', required: false, description: 'Asset to check (default: "native")' },
      { name: 'params.expiryEpoch', type: 'number', required: true, description: 'Ledger sequence when proof expires' },
    ],
    returnType: 'IntentProof',
    returnDescription: 'ZK proof with commitment hash and verification status',
    example: `const proof = await intent.proveBalanceIntent({
  threshold: '100',
  asset: 'native',
  expiryEpoch: 1000000,
});`,
    tags: ['intent', 'balance', 'privacy', 'proof', 'threshold'],
  },
  {
    name: 'proveEligibilityIntent',
    module: 'IntentClient',
    signature: 'intent.proveEligibilityIntent(params: EligibilityParams): Promise<IntentProof>',
    description: 'Proves membership in a Merkle tree (allowlist) without revealing which leaf.',
    parameters: [
      { name: 'params.merkleRoot', type: 'string', required: true, description: 'Root hash of the Merkle tree' },
      { name: 'params.merkleProof', type: 'string[]', required: true, description: 'Branch proof hashes' },
      { name: 'params.leafIndex', type: 'number', required: true, description: 'Your position in the tree (kept private)' },
    ],
    returnType: 'IntentProof',
    returnDescription: 'ZK proof of Merkle membership',
    example: `const proof = await intent.proveEligibilityIntent({
  merkleRoot: '0x1a2b3c...',
  merkleProof: ['0x...', '0x...'],
  leafIndex: 42,
});`,
    tags: ['intent', 'eligibility', 'merkle', 'allowlist', 'membership'],
  },
  {
    name: 'verifyIntent',
    module: 'IntentClient',
    signature: 'intent.verifyIntent(proof: IntentProof): Promise<boolean>',
    description: 'Verifies an intent proof on-chain using the Intent Verifier contract.',
    parameters: [
      { name: 'proof', type: 'IntentProof', required: true, description: 'The intent proof to verify' },
    ],
    returnType: 'boolean',
    returnDescription: 'true if proof is valid and not expired',
    example: `const valid = await intent.verifyIntent(proof);
console.log('Intent valid:', valid);`,
    tags: ['intent', 'verify', 'on-chain', 'contract'],
  },

  // ═══ X402PaymentClient ═══
  {
    name: 'parsePaymentRequired',
    module: 'X402PaymentClient',
    signature: 'x402.parsePaymentRequired(response: Response): X402PaymentRequired | null',
    description: 'Parses an HTTP 402 response to extract payment requirements.',
    parameters: [
      { name: 'response', type: 'Response', required: true, description: 'Fetch API response with status 402' },
    ],
    returnType: 'X402PaymentRequired | null',
    returnDescription: 'Payment requirement details or null if not a valid 402',
    example: `const response = await fetch('/api/resource');
if (response.status === 402) {
  const req = x402.parsePaymentRequired(response);
  console.log('Amount:', req.payload.amount);
}`,
    tags: ['x402', 'payment', '402', 'parse', 'micropayment'],
  },
  {
    name: 'executePayment',
    module: 'X402PaymentClient',
    signature: 'x402.executePayment(requirement: X402PaymentRequired): Promise<X402PaymentProof>',
    description: 'Executes a payment through the x402 Facilitator contract using the zkLogin wallet.',
    parameters: [
      { name: 'requirement', type: 'X402PaymentRequired', required: true, description: 'Payment requirement from parsePaymentRequired()' },
    ],
    returnType: 'X402PaymentProof',
    returnDescription: 'Payment proof with transaction hash and payer address',
    example: `const proof = await x402.executePayment(requirement);
console.log('Paid! Hash:', proof.transactionHash);`,
    tags: ['x402', 'payment', 'execute', 'facilitator'],
  },

  // ═══ XRayClient ═══
  {
    name: 'getMetrics',
    module: 'XRayClient',
    signature: 'xray.getMetrics(): Promise<XRayMetrics>',
    description: 'Fetches Protocol 25 usage metrics including proof counts and gas savings.',
    parameters: [],
    returnType: 'XRayMetrics',
    returnDescription: 'Metrics object with proofs verified, operations, and gas savings',
    example: `const metrics = await xray.getMetrics();
console.log('Gas savings:', metrics.gasSavingsPercent + '%');`,
    tags: ['xray', 'metrics', 'protocol25', 'gas', 'performance'],
  },
  {
    name: 'getStatus',
    module: 'XRayClient',
    signature: 'xray.getStatus(): Promise<XRayStatus>',
    description: 'Gets the current Protocol 25 feature status and host function availability.',
    parameters: [],
    returnType: 'XRayStatus',
    returnDescription: 'Protocol status with feature flags and version info',
    example: `const status = await xray.getStatus();
console.log('BN254:', status.features.bn254.enabled);`,
    tags: ['xray', 'status', 'protocol25', 'features', 'bn254', 'poseidon'],
  },

  // ═══ React Hooks ═══
  {
    name: 'useZkLogin',
    module: 'Hooks',
    signature: 'useZkLogin(): ZkLoginHookResult',
    description: 'React hook providing complete zkLogin state and actions. Must be inside ZkLoginProvider.',
    parameters: [],
    returnType: '{ isLoggedIn, wallet, login, logout, loading, error }',
    returnDescription: 'Login state, wallet instance, and auth actions',
    example: `function App() {
  const { isLoggedIn, wallet, login, logout } = useZkLogin();
  if (!isLoggedIn) return <button onClick={() => login('google')}>Sign In</button>;
  return <p>{wallet.getAddress()}</p>;
}`,
    tags: ['react', 'hook', 'login', 'wallet', 'provider'],
  },
  {
    name: 'useZkWallet',
    module: 'Hooks',
    signature: 'useZkWallet(): ZkWalletResult',
    description: 'React hook for wallet operations: balance, send, transactions, ZK proof status.',
    parameters: [],
    returnType: '{ address, balances, transactions, send, refresh, proof, loading }',
    returnDescription: 'Wallet data, transaction methods, and proof generation state',
    example: `const { address, balances, send, proof } = useZkWallet();
await send('GDEST...', '100', 'native');`,
    tags: ['react', 'hook', 'wallet', 'balance', 'send', 'transactions'],
  },
  {
    name: 'useStreamingCounter',
    module: 'Hooks',
    signature: 'useStreamingCounter(stream: StreamConfig): StreamCounterResult',
    description: 'Real-time streaming amount calculator that updates at 100ms intervals.',
    parameters: [
      { name: 'stream.totalAmount', type: 'string', required: true, description: 'Total stream amount' },
      { name: 'stream.startTime', type: 'number', required: true, description: 'Stream start timestamp' },
      { name: 'stream.endTime', type: 'number', required: true, description: 'Stream end timestamp' },
      { name: 'stream.curveType', type: 'CurveType', required: false, description: 'Curve: linear | cliff | exponential | steps' },
    ],
    returnType: '{ streamed, withdrawable, remaining, percentComplete }',
    returnDescription: 'Real-time calculated amounts based on curve type',
    example: `const { streamed, withdrawable, percentComplete } = useStreamingCounter({
  totalAmount: '1000',
  startTime: startTs,
  endTime: endTs,
  curveType: 'linear',
});`,
    tags: ['react', 'hook', 'streaming', 'counter', 'realtime'],
  },

  // ═══ Utils ═══
  {
    name: 'poseidonHash',
    module: 'Utils',
    signature: 'poseidonHash(inputs: bigint[]): Promise<bigint>',
    description: 'Computes a Poseidon hash over BN254 field elements. Compatible with Protocol 25 on-chain Poseidon.',
    parameters: [
      { name: 'inputs', type: 'bigint[]', required: true, description: 'Array of 1-16 BN254 field elements' },
    ],
    returnType: 'bigint',
    returnDescription: 'Poseidon hash as a BN254 field element',
    example: `const hash = await poseidonHash([BigInt(1), BigInt(2)]);
console.log('Hash:', hash.toString(16));`,
    tags: ['crypto', 'poseidon', 'hash', 'bn254', 'field'],
  },
  {
    name: 'computeAddressSeed',
    module: 'Utils',
    signature: 'computeAddressSeed(kcName: string, kcValue: string, aud: string, salt: Uint8Array): Promise<Uint8Array>',
    description: 'Derives the address seed from OAuth claims using Poseidon: Poseidon(sub, aud, Poseidon(salt)).',
    parameters: [
      { name: 'kcName', type: 'string', required: true, description: 'Key claim name (e.g., "sub")' },
      { name: 'kcValue', type: 'string', required: true, description: 'Key claim value (user ID)' },
      { name: 'aud', type: 'string', required: true, description: 'OAuth audience (client ID)' },
      { name: 'salt', type: 'Uint8Array', required: true, description: 'Privacy salt (32 bytes)' },
    ],
    returnType: 'Uint8Array',
    returnDescription: 'Address seed as 32-byte array',
    example: `const seed = await computeAddressSeed('sub', userId, clientId, salt);`,
    tags: ['crypto', 'address', 'seed', 'poseidon', 'derive'],
  },
  {
    name: 'deriveZkLoginAddress',
    module: 'Utils',
    signature: 'deriveZkLoginAddress(issuer: string, addressSeed: Uint8Array, network: StellarNetwork): Promise<string>',
    description: 'Derives the final Stellar address: Blake2b_256(0x05 || issuer_hash || address_seed).',
    parameters: [
      { name: 'issuer', type: 'string', required: true, description: 'OAuth issuer URL (e.g., "https://accounts.google.com")' },
      { name: 'addressSeed', type: 'Uint8Array', required: true, description: 'Address seed from computeAddressSeed()' },
      { name: 'network', type: 'StellarNetwork', required: true, description: 'Target network' },
    ],
    returnType: 'string',
    returnDescription: 'Stellar wallet address (G...)',
    example: `const address = await deriveZkLoginAddress(issuer, seed, 'testnet');
console.log('Wallet:', address);`,
    tags: ['crypto', 'address', 'derive', 'blake2b', 'stellar'],
  },
];

export function getMethodsByModule(module: string): ApiMethod[] {
  return API_METHODS.filter(m => m.module === module);
}

export function searchMethods(query: string): ApiMethod[] {
  const q = query.toLowerCase();
  return API_METHODS.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q) ||
    m.module.toLowerCase().includes(q) ||
    m.tags.some(t => t.includes(q)) ||
    m.parameters.some(p => p.name.toLowerCase().includes(q))
  );
}
