export interface ConsoleEntry {
  type: 'info' | 'success' | 'error' | 'comment' | 'json' | 'step' | 'warn';
  content: string;
}

export interface SimulationStep {
  entry: ConsoleEntry;
  delayMs: number;
}

function addr(): string {
  return 'G' + Array.from({ length: 55 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join('');
}

function txHash(): string {
  return Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
}

function proofField(): string {
  return '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
}

const SIMULATIONS: Record<string, SimulationStep[]> = {
  'auth-install': [
    { entry: { type: 'step', content: '$ npm install @stellar-zklogin/sdk' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Resolving packages...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Downloading @stellar-zklogin/sdk@2.1.0' }, delayMs: 600 },
    { entry: { type: 'info', content: 'Downloading poseidon-lite@0.2.0' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Downloading @stellar/stellar-sdk@12.0.0' }, delayMs: 400 },
    { entry: { type: 'success', content: 'Added 3 packages in 1.7s' }, delayMs: 300 },
    { entry: { type: 'success', content: '@stellar-zklogin/sdk installed successfully!' }, delayMs: 200 },
  ],

  'auth-init': [
    { entry: { type: 'step', content: 'Initializing ZkLoginClient...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Network: testnet' }, delayMs: 200 },
    { entry: { type: 'info', content: 'RPC: https://soroban-testnet.stellar.org' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Loading contract addresses...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'ZK Verifier: CDAQXHNK2HZJJE...' }, delayMs: 150 },
    { entry: { type: 'info', content: 'Gateway Factory: CAAOQR7L5UVV7...' }, delayMs: 150 },
    { entry: { type: 'info', content: 'JWK Registry: CAMO5LYOANZWUZ...' }, delayMs: 150 },
    { entry: { type: 'success', content: 'Client initialized for testnet' }, delayMs: 300 },
  ],

  'auth-connect': [
    { entry: { type: 'step', content: 'Step 1: Initializing session...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Generating ephemeral Ed25519 keypair...' }, delayMs: 500 },
    { entry: { type: 'info', content: `Session nonce: ${proofField().slice(0, 34)}` }, delayMs: 300 },
    { entry: { type: 'step', content: 'Step 2: Opening Google OAuth...' }, delayMs: 600 },
    { entry: { type: 'info', content: 'Redirecting to accounts.google.com...' }, delayMs: 800 },
    { entry: { type: 'success', content: 'OAuth token received' }, delayMs: 400 },
    { entry: { type: 'step', content: 'Step 3: Computing wallet address...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Fetching salt from salt service...' }, delayMs: 600 },
    { entry: { type: 'info', content: 'address_seed = Poseidon(sub, aud, salt)' }, delayMs: 300 },
    { entry: { type: 'info', content: `Address: ${addr()}` }, delayMs: 200 },
    { entry: { type: 'step', content: 'Step 4: Generating ZK proof (Groth16 on BN254)...' }, delayMs: 800 },
    { entry: { type: 'info', content: 'Circuit: zkLogin (15,000 constraints)' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Proving system: Groth16' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Curve: BN254 (alt-bn128)' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Proof generated in 2.3s' }, delayMs: 600 },
    { entry: { type: 'step', content: 'Step 5: Registering session on-chain...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Submitting proof to Smart Wallet contract...' }, delayMs: 800 },
    { entry: { type: 'info', content: 'Verification: BN254 multi-pairing check (Protocol 25)' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Gas used: 260,000 (94% savings vs WASM)' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Session registered! Wallet ready.' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Balance: 10,000.0000000 XLM' }, delayMs: 200 },
  ],

  'auth-react': [
    { entry: { type: 'step', content: 'Rendering ZkLoginProvider...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Config: { network: "testnet", provider: "google" }' }, delayMs: 200 },
    { entry: { type: 'info', content: 'useZkLogin hook initialized' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Rendering LoginButton component...' }, delayMs: 200 },
    { entry: { type: 'success', content: 'React app mounted successfully' }, delayMs: 300 },
    { entry: { type: 'comment', content: '// Click LoginButton to trigger OAuth flow' }, delayMs: 200 },
  ],

  'auth-session': [
    { entry: { type: 'step', content: 'Checking session status...' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Session active: true' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Session ID: sess_7x2k9m...' }, delayMs: 200 },
    { entry: { type: 'info', content: `Expires at: ${new Date(Date.now() + 86400000).toISOString()}` }, delayMs: 200 },
    { entry: { type: 'info', content: 'Ephemeral key: ed25519:7a8b9c...' }, delayMs: 200 },
    { entry: { type: 'step', content: 'Exporting encrypted backup...' }, delayMs: 500 },
    { entry: { type: 'success', content: 'Backup created: v1:aGVsbG8gd29ybGQ...' }, delayMs: 400 },
    { entry: { type: 'success', content: 'Wallet can be restored on any device!' }, delayMs: 300 },
  ],

  'pay-send': [
    { entry: { type: 'step', content: 'Building payment transaction...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Destination: GDEST7X2YZKLOGIN...' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Amount: 100 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Signing with ephemeral key...' }, delayMs: 600 },
    { entry: { type: 'info', content: 'Submitting to Stellar testnet...' }, delayMs: 800 },
    { entry: { type: 'success', content: `Transaction hash: ${txHash()}` }, delayMs: 300 },
    { entry: { type: 'success', content: 'Ledger: 4,847,293' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Status: SUCCESS' }, delayMs: 200 },
  ],

  'pay-balance': [
    { entry: { type: 'step', content: 'Fetching balances...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Querying Horizon API...' }, delayMs: 500 },
    { entry: { type: 'success', content: 'XLM: 10,000.0000000' }, delayMs: 200 },
    { entry: { type: 'success', content: 'USDC: 250.0000000' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Account exists: true' }, delayMs: 200 },
  ],

  'pay-sign': [
    { entry: { type: 'step', content: 'Loading account from Horizon...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Building TransactionBuilder...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Adding payment operation: 50 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Adding changeTrust operation: USDC' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Setting timeout: 30s' }, delayMs: 200 },
    { entry: { type: 'step', content: 'Signing with zkLogin ephemeral key...' }, delayMs: 600 },
    { entry: { type: 'success', content: 'Transaction signed!' }, delayMs: 300 },
    { entry: { type: 'info', content: `Signed XDR: AAAA...${txHash().slice(0, 20)}...` }, delayMs: 200 },
    { entry: { type: 'success', content: `Submitted! Hash: ${txHash()}` }, delayMs: 500 },
  ],

  'pay-batch': [
    { entry: { type: 'step', content: 'Building batch payment...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Recipient 1: GALICE... -> 50 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Recipient 2: GBOB... -> 25 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Recipient 3: GCHARLIE... -> 75 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Signing batch (3 operations)...' }, delayMs: 600 },
    { entry: { type: 'info', content: 'Submitting to network...' }, delayMs: 800 },
    { entry: { type: 'success', content: `Batch hash: ${txHash()}` }, delayMs: 300 },
    { entry: { type: 'success', content: 'Total sent: 150 XLM' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Operations: 3' }, delayMs: 200 },
  ],

  'stream-create': [
    { entry: { type: 'step', content: 'Creating payment stream...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Recipient: GRECIPIENT...' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Total: 1,000 XLM over 30 days' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Curve: linear' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Computing escrow address...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Funding escrow account...' }, delayMs: 800 },
    { entry: { type: 'success', content: 'Stream ID: strm_7x2k9m4b' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Flow rate: 0.000386 XLM/sec' }, delayMs: 200 },
    { entry: { type: 'success', content: `Start: ${new Date().toISOString()}` }, delayMs: 200 },
    { entry: { type: 'success', content: `End: ${new Date(Date.now() + 30 * 86400000).toISOString()}` }, delayMs: 200 },
  ],

  'stream-monitor': [
    { entry: { type: 'step', content: 'Fetching stream details...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Status: active' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Total: 1,000 XLM' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Streamed so far: 127.3456789 XLM' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Withdrawable: 127.3456789 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Remaining: 872.6543211 XLM' }, delayMs: 200 },
    { entry: { type: 'step', content: 'Withdrawing accumulated funds...' }, delayMs: 600 },
    { entry: { type: 'success', content: 'Withdrawn: 127.3456789 XLM' }, delayMs: 400 },
    { entry: { type: 'success', content: `Tx hash: ${txHash()}` }, delayMs: 200 },
  ],

  'stream-cancel': [
    { entry: { type: 'step', content: 'Cancelling stream strm_7x2k9m4b...' }, delayMs: 400 },
    { entry: { type: 'warn', content: 'Calculating fair distribution...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Elapsed: 12.7% of duration' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Stream cancelled!' }, delayMs: 400 },
    { entry: { type: 'success', content: 'Sender refund: 872.6543211 XLM' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Recipient received: 127.3456789 XLM' }, delayMs: 200 },
    { entry: { type: 'success', content: `Cancel tx: ${txHash()}` }, delayMs: 200 },
  ],

  'intent-balance': [
    { entry: { type: 'step', content: 'Generating balance intent proof...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Threshold: 100 XLM' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Asset: native (XLM)' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Computing Poseidon commitment...' }, delayMs: 500 },
    { entry: { type: 'info', content: `intentHash = Poseidon("balance", 100, expiry)` }, delayMs: 300 },
    { entry: { type: 'info', content: `addressCommitment = Poseidon(addressSeed)` }, delayMs: 300 },
    { entry: { type: 'step', content: 'Generating Groth16 proof...' }, delayMs: 800 },
    { entry: { type: 'info', content: 'Circuit: BalanceIntent (3 public inputs)' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Private input: balance (HIDDEN)' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Intent proof generated!' }, delayMs: 400 },
    { entry: { type: 'json', content: `{ commitment: "${proofField().slice(0, 34)}", verified: true }` }, delayMs: 200 },
    { entry: { type: 'success', content: 'Actual balance: NEVER REVEALED' }, delayMs: 300 },
    { entry: { type: 'step', content: 'Verifying on-chain...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'BN254 pairing check (Protocol 25)...' }, delayMs: 400 },
    { entry: { type: 'success', content: 'On-chain verification: VALID' }, delayMs: 300 },
  ],

  'intent-eligibility': [
    { entry: { type: 'step', content: 'Generating eligibility proof...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Merkle root: 0x1a2b3c...' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Proving membership without revealing leaf...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Computing Merkle branch hashes...' }, delayMs: 400 },
    { entry: { type: 'step', content: 'Generating Groth16 proof...' }, delayMs: 800 },
    { entry: { type: 'success', content: 'Eligibility proven!' }, delayMs: 400 },
    { entry: { type: 'success', content: 'You are in the allowlist: YES' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Your identity: HIDDEN' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Your leaf index: HIDDEN' }, delayMs: 200 },
    { entry: { type: 'step', content: 'Generating stream intent proof...' }, delayMs: 600 },
    { entry: { type: 'success', content: 'Active stream proven without revealing details' }, delayMs: 400 },
  ],

  'x402-setup': [
    { entry: { type: 'step', content: 'Initializing x402 client...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Network: testnet' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Wallet connected: true' }, delayMs: 200 },
    { entry: { type: 'step', content: 'Fetching protected resource...' }, delayMs: 500 },
    { entry: { type: 'warn', content: 'HTTP 402 Payment Required!' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Amount: 1,000,000 stroops (0.1 XLM)' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Asset: native' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Destination: GFACILITATOR...' }, delayMs: 200 },
    { entry: { type: 'info', content: `Valid until: ${new Date(Date.now() + 3600000).toISOString()}` }, delayMs: 200 },
  ],

  'x402-pay': [
    { entry: { type: 'step', content: 'Executing x402 payment...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Building payment transaction...' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Signing with ephemeral key...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Submitting to facilitator contract...' }, delayMs: 800 },
    { entry: { type: 'success', content: 'Payment sent!' }, delayMs: 300 },
    { entry: { type: 'success', content: `Tx hash: ${txHash()}` }, delayMs: 200 },
    { entry: { type: 'step', content: 'Retrying with payment proof...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Adding X-PAYMENT-PROOF header...' }, delayMs: 300 },
    { entry: { type: 'success', content: 'HTTP 200 OK: Protected data received!' }, delayMs: 400 },
    { entry: { type: 'json', content: '{ "data": "premium content unlocked", "paid": true }' }, delayMs: 200 },
  ],

  'x402-intent-gate': [
    { entry: { type: 'step', content: 'Fetching expensive resource...' }, delayMs: 300 },
    { entry: { type: 'warn', content: 'HTTP 402: Payment Required + Intent Required' }, delayMs: 400 },
    { entry: { type: 'step', content: 'Step 1: Generating balance intent proof...' }, delayMs: 500 },
    { entry: { type: 'info', content: 'Proving: balance >= 1,000,000 stroops' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Groth16 proof on BN254...' }, delayMs: 800 },
    { entry: { type: 'success', content: 'Balance proof: CAN_PAY = true' }, delayMs: 300 },
    { entry: { type: 'step', content: 'Step 2: Submitting intent to server...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Server verifying intent on-chain...' }, delayMs: 600 },
    { entry: { type: 'success', content: 'Intent verified! Proceeding to payment.' }, delayMs: 300 },
    { entry: { type: 'step', content: 'Step 3: Executing payment...' }, delayMs: 500 },
    { entry: { type: 'success', content: `Payment successful: ${txHash().slice(0, 20)}...` }, delayMs: 300 },
    { entry: { type: 'success', content: 'Zero failed transactions. Zero wasted gas.' }, delayMs: 200 },
  ],

  'adv-xray': [
    { entry: { type: 'step', content: 'Connecting to X-Ray Protocol...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Fetching metrics from testnet...' }, delayMs: 500 },
    { entry: { type: 'success', content: 'Proofs Verified: 15,847' }, delayMs: 200 },
    { entry: { type: 'success', content: 'BN254 Operations: 47,541' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Poseidon Hashes: 31,694' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Gas Savings: 94%' }, delayMs: 200 },
    { entry: { type: 'step', content: 'Fetching protocol status...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Protocol Version: 25 (X-Ray)' }, delayMs: 200 },
    { entry: { type: 'info', content: 'BN254 Enabled: true' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Poseidon Enabled: true' }, delayMs: 200 },
    { entry: { type: 'json', content: '{ "hostFunctions": ["bn254_g1_add", "bn254_g1_mul", "bn254_multi_pairing_check", "poseidon_permutation"] }' }, delayMs: 300 },
  ],

  'adv-contract': [
    { entry: { type: 'step', content: 'Connecting to Soroban RPC...' }, delayMs: 400 },
    { entry: { type: 'info', content: 'Invoking Gateway Factory: get_wallet...' }, delayMs: 500 },
    { entry: { type: 'success', content: 'Wallet exists: true' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Invoking Gateway Factory: get_wallet_count...' }, delayMs: 500 },
    { entry: { type: 'success', content: 'Total wallets deployed: 2,847' }, delayMs: 300 },
    { entry: { type: 'info', content: 'Invoking ZK Verifier: is_nullifier_used...' }, delayMs: 500 },
    { entry: { type: 'success', content: 'Nullifier used: false (fresh proof)' }, delayMs: 300 },
  ],

  'adv-zk-proof': [
    { entry: { type: 'step', content: 'Inspecting Groth16 proof structure...' }, delayMs: 300 },
    { entry: { type: 'json', content: `{
  "proof": {
    "pi_a": ["${proofField().slice(0, 20)}...", "${proofField().slice(0, 20)}..."],
    "pi_b": [["${proofField().slice(0, 16)}...", "${proofField().slice(0, 16)}..."], ["${proofField().slice(0, 16)}...", "${proofField().slice(0, 16)}..."]],
    "pi_c": ["${proofField().slice(0, 20)}...", "${proofField().slice(0, 20)}..."]
  }
}` }, delayMs: 500 },
    { entry: { type: 'step', content: 'Public inputs (5 field elements):' }, delayMs: 300 },
    { entry: { type: 'info', content: `1. ephPkHash: ${proofField().slice(0, 30)}...` }, delayMs: 200 },
    { entry: { type: 'info', content: '2. maxEpoch: 5000000' }, delayMs: 200 },
    { entry: { type: 'info', content: `3. addressSeed: ${proofField().slice(0, 30)}...` }, delayMs: 200 },
    { entry: { type: 'info', content: `4. issHash: ${proofField().slice(0, 30)}...` }, delayMs: 200 },
    { entry: { type: 'info', content: `5. jwkModulusHash: ${proofField().slice(0, 30)}...` }, delayMs: 200 },
    { entry: { type: 'step', content: 'Verification equation:' }, delayMs: 300 },
    { entry: { type: 'comment', content: '// e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) = 1' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Proof system: Groth16' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Curve: BN254 (alt-bn128)' }, delayMs: 200 },
    { entry: { type: 'info', content: 'Hash: Poseidon (ZK-friendly)' }, delayMs: 200 },
    { entry: { type: 'success', content: 'Verification cost: ~$0.03 (260,000 gas)' }, delayMs: 300 },
  ],
};

export function getSimulation(snippetId: string): SimulationStep[] {
  return SIMULATIONS[snippetId] || [
    { entry: { type: 'step', content: 'Executing code...' }, delayMs: 300 },
    { entry: { type: 'success', content: 'Code executed successfully!' }, delayMs: 500 },
  ];
}
