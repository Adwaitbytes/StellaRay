# Stellar zkLogin Gateway - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [SDK Package](#sdk-package)
5. [Demo Application](#demo-application)
6. [X-Ray Protocol Integration](#x-ray-protocol-integration)
7. [API Endpoints](#api-endpoints)
8. [UI Components](#ui-components)
9. [Deployment](#deployment)
10. [Usage Examples](#usage-examples)

---

## Project Overview

### What is Stellar zkLogin Gateway?

Stellar zkLogin Gateway is a **zero-knowledge authentication system** for the Stellar blockchain that allows users to create and control wallets using their existing OAuth identities (Google, Apple) without exposing their identity on-chain.

### Key Features

| Feature | Description |
|---------|-------------|
| **OAuth Login** | Sign in with Google or Apple - no seed phrases |
| **Zero-Knowledge Proofs** | Identity stays private via Groth16 proofs |
| **Embedded Wallet** | No external wallets (Freighter) required |
| **X-Ray Protocol** | Native BN254 + Poseidon for 94% gas savings |
| **Smart Contract Wallet** | On-chain wallet validates ZK proofs |
| **x402 Payments** | HTTP payment protocol support |

### Technology Stack

- **Blockchain**: Stellar / Soroban
- **ZK Proofs**: Groth16 on BN254 curve
- **Hash Function**: Poseidon (ZK-friendly)
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS (Brutalist design)
- **Auth**: NextAuth.js with Google OAuth
- **SDK**: TypeScript with React hooks

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Google    │  │  ZK Proof   │  │    Embedded Wallet      │ │
│  │   OAuth     │──│  Generator  │──│  (Ephemeral Keys)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STELLAR BLOCKCHAIN                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ ZK Verifier │  │   Smart     │  │    Gateway Factory      │ │
│  │  Contract   │──│   Wallet    │──│      Contract           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ JWK Registry│  │    x402     │                              │
│  │  Contract   │  │ Facilitator │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User clicks "Sign in with Google"
2. OAuth flow completes, JWT received
3. Ephemeral keypair generated in browser
4. Nonce computed: Poseidon(eph_pk, max_epoch, randomness)
5. Salt retrieved from salt service
6. Address computed: derive(issuer, Poseidon(sub, aud, salt))
7. ZK proof generated (proves JWT ownership without revealing it)
8. Session registered on-chain with proof
9. User can now sign transactions with ephemeral key
```

---

## Smart Contracts

### Deployed Contracts (Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| ZK Verifier | `CAQISC6MBAMGSAVRPRO2GZ3WPDREZW72XDPCHTF2DFUDE45YFIHEIH56` | Verifies Groth16 proofs |
| Gateway Factory | `CD62OWXRDPTQ3YHYSSFV7WCAJQU7F4RCEW7XMSMP46POCJ6DBA7D7EZR` | Creates smart wallets |
| Smart Wallet WASM | `3747d3dfab113f7c16ae435556e267de66cec574523c6c8629989bc5a7d37cd8` | Wallet implementation |
| JWK Registry | `CC3AVC4YGWMDYRJLQBXNUXQF3BF6TXDDDJ4SNSDMHVUCRAJIJGNWCHKN` | Stores OAuth provider keys |
| x402 Facilitator | `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ` | HTTP payment protocol |
| USDC Token | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | Test USDC token |

### Contract Details

#### ZK Verifier (`contracts/zk-verifier/`)

Verifies Groth16 zero-knowledge proofs on BN254 curve.

**Key Functions:**
```rust
// Verify a Groth16 proof
fn verify_proof(
    env: Env,
    proof: Groth16Proof,
    public_inputs: Vec<U256>,
) -> bool;

// BN254 operations (X-Ray Protocol)
fn bn254_g1_add(env: Env, p1: G1Point, p2: G1Point) -> G1Point;
fn bn254_g1_mul(env: Env, p: G1Point, scalar: U256) -> G1Point;
fn bn254_multi_pairing_check(env: Env, pairs: Vec<PairingInput>) -> bool;

// Poseidon hash
fn poseidon_hash(env: Env, inputs: Vec<U256>) -> U256;
```

#### Smart Wallet (`contracts/smart-wallet/`)

User's on-chain wallet controlled by ZK proofs.

**Key Functions:**
```rust
// Add a new session (requires ZK proof)
fn add_session(
    env: Env,
    proof: Groth16Proof,
    public_inputs: PublicInputs,
    eph_pk: BytesN<32>,
    max_epoch: u64,
) -> bool;

// Execute transaction (requires valid session)
fn execute(
    env: Env,
    session_id: BytesN<32>,
    operations: Vec<Operation>,
    signature: BytesN<64>,
) -> bool;

// Revoke a session
fn revoke_session(env: Env, session_id: BytesN<32>) -> bool;
```

#### Gateway Factory (`contracts/gateway-factory/`)

Creates and manages smart wallets.

**Key Functions:**
```rust
// Create a new wallet for an address seed
fn create_wallet(
    env: Env,
    issuer_hash: U256,
    address_seed: U256,
) -> Address;

// Get wallet address for an identity
fn get_wallet(
    env: Env,
    issuer_hash: U256,
    address_seed: U256,
) -> Option<Address>;
```

---

## SDK Package

### Package Info

```
Name: @stellar-zklogin/sdk
Version: 1.0.0
Location: /sdk
```

### Installation

```bash
npm install @stellar-zklogin/sdk
```

### Directory Structure

```
sdk/
├── src/
│   ├── index.ts                 # Main exports
│   ├── StellarZkLogin.ts        # Simplified high-level API
│   ├── client.ts                # Core ZkLoginClient
│   ├── types.ts                 # TypeScript definitions
│   ├── config/
│   │   ├── index.ts
│   │   └── defaults.ts          # Default testnet contracts
│   ├── oauth/
│   │   ├── index.ts
│   │   ├── google.ts            # Google OAuth provider
│   │   ├── apple.ts             # Apple OAuth provider
│   │   └── types.ts
│   ├── keys/
│   │   └── index.ts             # Ephemeral key management
│   ├── prover/
│   │   └── index.ts             # ZK proof generation
│   ├── transaction/
│   │   └── index.ts             # Transaction building
│   ├── xray/
│   │   └── index.ts             # X-Ray Protocol client
│   ├── x402/
│   │   └── index.ts             # HTTP payment protocol
│   ├── utils/
│   │   ├── address.ts           # Address derivation
│   │   └── crypto.ts            # Poseidon hash
│   └── react/
│       ├── index.ts             # React exports
│       ├── Provider.tsx         # ZkLoginProvider
│       ├── useZkLogin.ts        # Auth hook
│       ├── useWallet.ts         # Wallet hook
│       ├── useXRay.ts           # X-Ray hook
│       ├── LoginButton.tsx      # OAuth button
│       └── WalletWidget.tsx     # Wallet UI
├── package.json
├── tsconfig.json
└── README.md
```

### Quick Start

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

// Initialize
const zkLogin = new StellarZkLogin({
  network: 'testnet',
  oauth: {
    google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' }
  }
});

// Login (no Freighter needed!)
const wallet = await zkLogin.login('google');

// Use wallet
console.log('Address:', wallet.getAddress());
console.log('Balance:', await wallet.getBalance());
await wallet.sendPayment('GDEST...', 'native', '10');
```

### React Integration

```tsx
import { ZkLoginProvider, useZkLogin, LoginButton } from '@stellar-zklogin/sdk/react';

function App() {
  return (
    <ZkLoginProvider config={config}>
      <MyDApp />
    </ZkLoginProvider>
  );
}

function MyDApp() {
  const { wallet, isLoggedIn, login, logout } = useZkLogin();

  if (!isLoggedIn) {
    return <LoginButton provider="google" />;
  }

  return (
    <div>
      <p>Address: {wallet.getAddress()}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Available Exports

#### Main API
| Export | Description |
|--------|-------------|
| `StellarZkLogin` | Simplified high-level SDK class |
| `ZkLoginClient` | Advanced low-level client |
| `XRayClient` | X-Ray Protocol metrics and gas estimation |

#### React
| Export | Description |
|--------|-------------|
| `ZkLoginProvider` | Context provider |
| `useZkLogin` | Authentication hook |
| `useWallet` | Wallet operations hook |
| `useXRay` | X-Ray metrics hook |
| `LoginButton` | Pre-built OAuth button |
| `WalletWidget` | Full wallet UI widget |

#### Configuration
| Export | Description |
|--------|-------------|
| `TESTNET_CONTRACTS` | Default testnet contract addresses |
| `MAINNET_CONTRACTS` | Mainnet contract addresses (TBD) |
| `getDefaultConfig` | Get default config for a network |

---

## Demo Application

### Location

```
/demo - Next.js 15 application
```

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page with sign-in |
| `/dashboard` | `app/dashboard/page.tsx` | Main wallet dashboard |
| `/explorer` | `app/explorer/page.tsx` | X-Ray Protocol explorer |
| `/sdk` | `app/sdk/page.tsx` | SDK integration guide |

### Features

#### Landing Page (`/`)
- Brutalist design with neon accents
- Google OAuth sign-in button
- Feature highlights
- X-Ray Protocol badge
- Light/dark theme toggle

#### Dashboard (`/dashboard`)
- Wallet balance display (XLM + tokens)
- Send/receive functionality
- Transaction history
- QR code for receiving
- X-Ray Protocol metrics
- Proof verification status
- Gas savings comparison

#### Explorer (`/explorer`)
- Network activity monitor (live)
- BN254 curve visualizer
- Proof benchmark tool
- Privacy calculator
- Identity badge system
- Advanced analytics dashboard

#### SDK Journey (`/sdk`)
- 6-step integration tutorial
- Interactive code examples
- Copy-to-clipboard functionality
- Complete working example
- Quick reference cards

### Running the Demo

```bash
cd demo
pnpm install
pnpm dev
# Visit http://localhost:3000
```

### Environment Variables

```env
# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Contracts
NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID=CAQISC6MBAMGSAVRPRO2GZ3WPDREZW72XDPCHTF2DFUDE45YFIHEIH56
NEXT_PUBLIC_GATEWAY_FACTORY_CONTRACT_ID=CD62OWXRDPTQ3YHYSSFV7WCAJQU7F4RCEW7XMSMP46POCJ6DBA7D7EZR
NEXT_PUBLIC_SMART_WALLET_WASM_HASH=3747d3dfab113f7c16ae435556e267de66cec574523c6c8629989bc5a7d37cd8
NEXT_PUBLIC_JWK_REGISTRY_CONTRACT_ID=CC3AVC4YGWMDYRJLQBXNUXQF3BF6TXDDDJ4SNSDMHVUCRAJIJGNWCHKN
NEXT_PUBLIC_X402_FACILITATOR_CONTRACT_ID=CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ
```

---

## X-Ray Protocol Integration

### What is X-Ray Protocol?

X-Ray Protocol (Protocol 25) adds **native cryptographic primitives** to Stellar:

| Feature | CAP | Functions |
|---------|-----|-----------|
| BN254 Curve | CAP-0062 | G1/G2 add, mul, pairing |
| Poseidon Hash | CAP-0063 | ZK-friendly hash function |

### Gas Savings

| Operation | WASM Gas | X-Ray Gas | Savings |
|-----------|----------|-----------|---------|
| Multi-Pairing | 2,500,000 | 150,000 | **94%** |
| G1 Scalar Mul | 200,000 | 45,000 | **78%** |
| G1 Addition | 50,000 | 15,000 | **70%** |
| Poseidon (t=2) | 500,000 | 50,000 | **90%** |

### Timeline

| Milestone | Date |
|-----------|------|
| Testnet Launch | January 7, 2026 |
| Mainnet Launch | January 22, 2026 |

### Using X-Ray in SDK

```typescript
import { XRayClient } from '@stellar-zklogin/sdk';

const xray = new XRayClient({ network: 'testnet' });

// Get metrics
const metrics = await xray.getMetrics();
console.log('Proofs verified:', metrics.proofsVerified);
console.log('Gas saved:', metrics.totalGasSaved);

// Estimate gas
const estimate = xray.estimateGas('bn254_pairing');
console.log('Savings:', estimate.savingsPercent + '%');

// Calculate Groth16 savings
const groth16 = xray.calculateGroth16Savings();
console.log('Total Groth16 savings:', groth16.savingsPercent + '%');
```

---

## API Endpoints

### Demo App API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth.js OAuth handlers |
| `/api/xray/status` | GET | X-Ray Protocol status |
| `/api/xray/metrics` | GET/POST | Protocol metrics |
| `/api/xray/events` | GET | Live event stream |

### X-Ray Status Response

```json
{
  "protocolVersion": 25,
  "protocolName": "X-Ray Protocol",
  "network": "testnet",
  "features": {
    "bn254": {
      "enabled": true,
      "functions": ["bn254_g1_add", "bn254_g1_mul", "bn254_multi_pairing_check"]
    },
    "poseidon": {
      "enabled": true,
      "functions": ["poseidon_permutation"],
      "supportedStateSizes": [2, 3, 4, 5]
    }
  },
  "status": "LIVE",
  "health": "HEALTHY"
}
```

### X-Ray Metrics Response

```json
{
  "proofsVerified": 12847,
  "bn254Operations": 38541,
  "poseidonHashes": 51234,
  "avgVerificationMs": 12,
  "gasSavingsPercent": 94,
  "successRate": 99.9,
  "totalGasSaved": 847293847,
  "breakdown": {
    "pairingChecks": 12847,
    "g1Additions": 15234,
    "g1Multiplications": 10460,
    "poseidonCalls": 51234
  }
}
```

### X-Ray Events Response

```json
{
  "events": [
    {
      "id": "evt_1234567890",
      "type": "proof_verified",
      "operation": "Groth16 Verify",
      "timestamp": "2026-01-21T15:30:00Z",
      "proofId": "abc123def456",
      "gasUsed": 260000,
      "duration": 12,
      "blockNumber": 12847500,
      "status": "confirmed"
    }
  ],
  "tps": 2.4,
  "totalEvents": 12847
}
```

---

## UI Components

### Location

```
/demo/src/components/
```

### Component List

| Component | File | Description |
|-----------|------|-------------|
| XRayStatusBadge | `XRayStatusBadge.tsx` | Protocol status indicator |
| ProofMetrics | `ProofMetrics.tsx` | Verification metrics display |
| ProofTimeline | `ProofTimeline.tsx` | Timeline of ZK operations |
| GasSavingsComparison | `GasSavingsComparison.tsx` | WASM vs X-Ray comparison |
| ZKProofVisualizer | `ZKProofVisualizer.tsx` | Animated proof visualization |
| TransactionXRayBadge | `TransactionXRayBadge.tsx` | Per-transaction X-Ray badge |
| NetworkActivityMonitor | `NetworkActivityMonitor.tsx` | Live network visualization |
| BN254CurveExplorer | `BN254CurveExplorer.tsx` | Interactive curve explorer |
| ProofBenchmark | `ProofBenchmark.tsx` | Benchmark tool |
| PrivacyCalculator | `PrivacyCalculator.tsx` | Privacy metrics calculator |
| IdentityBadgeSystem | `IdentityBadgeSystem.tsx` | Verifiable credentials |
| AdvancedAnalyticsDashboard | `AdvancedAnalyticsDashboard.tsx` | Analytics charts |

### Design System

**Colors:**
- Primary: `#39FF14` (Neon Green)
- Secondary: `#FF3366` (Hot Pink)
- Accent: `#00D4FF` (Cyan)
- Warning: `#FFD600` (Yellow)
- Background Dark: `#0A0A0A`
- Background Light: `#F5F5F5`

**Typography:**
- Font: System UI / Sans-serif
- Headings: Black weight (900)
- Body: Medium weight (500)

**Style:**
- Brutalist design
- Sharp corners (no border-radius on main elements)
- Heavy borders (4px)
- High contrast
- Monospace for code/addresses

---

## Deployment

### Testnet Deployment

**Network Configuration:**
```
Network: Stellar Testnet
RPC URL: https://soroban-testnet.stellar.org
Horizon URL: https://horizon-testnet.stellar.org
```

**Deployer Account:**
```
Address: GD3AUTU4UUCHAN463KKVIU3NFF36JHETH5REO742CDYJOABJU263P3XU
```

### Deploy Contracts

```bash
# Build contracts
cd contracts/zk-verifier
cargo build --release --target wasm32-unknown-unknown

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_verifier.wasm \
  --network testnet \
  --source DEPLOYER_SECRET
```

### Deploy Demo App

**Vercel Deployment:**
```bash
cd demo
vercel deploy --prod
```

**Environment Variables for Vercel:**
- All `NEXT_PUBLIC_*` variables
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET`

---

## Usage Examples

### Example 1: Basic Login & Balance Check

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

async function main() {
  const zkLogin = new StellarZkLogin({
    network: 'testnet',
    oauth: { google: { clientId: 'YOUR_CLIENT_ID' } }
  });

  // Login
  const wallet = await zkLogin.login('google');

  // Check balance
  const balance = await wallet.getBalance();
  console.log(`Balance: ${balance} XLM`);
}
```

### Example 2: Send Payment

```typescript
async function sendPayment(wallet, recipient, amount) {
  const result = await wallet.sendPayment(recipient, 'native', amount);
  console.log(`Transaction hash: ${result.hash}`);
  console.log(`Success: ${result.success}`);
}
```

### Example 3: React App with Hooks

```tsx
import { ZkLoginProvider, useZkLogin, useWallet } from '@stellar-zklogin/sdk/react';

function WalletDisplay() {
  const { isLoggedIn } = useZkLogin();
  const { address, balance, sendPayment, isPending } = useWallet();

  if (!isLoggedIn) return <p>Please login</p>;

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance} XLM</p>
      <button
        onClick={() => sendPayment('GDEST...', 'native', '10')}
        disabled={isPending}
      >
        Send 10 XLM
      </button>
    </div>
  );
}
```

### Example 4: X-Ray Protocol Metrics

```typescript
import { XRayClient } from '@stellar-zklogin/sdk';

async function showMetrics() {
  const xray = new XRayClient({ network: 'testnet' });

  const metrics = await xray.getMetrics();
  console.log(`Proofs verified: ${metrics.proofsVerified}`);
  console.log(`Gas saved: ${metrics.totalGasSaved}`);

  const savings = xray.calculateGroth16Savings();
  console.log(`Groth16 savings: ${savings.savingsPercent}%`);
}
```

### Example 5: Event Handling

```typescript
const zkLogin = new StellarZkLogin(config);

zkLogin.on('login', (data) => {
  console.log('User logged in:', data.address);
});

zkLogin.on('logout', () => {
  console.log('User logged out');
});

zkLogin.on('transaction', (data) => {
  console.log('Transaction:', data.result.hash);
});

zkLogin.on('error', (error) => {
  console.error('Error:', error.message);
});
```

---

## Project Structure

```
Stellar-new/
├── contracts/                    # Soroban smart contracts
│   ├── zk-verifier/             # ZK proof verifier
│   ├── smart-wallet/            # User wallet contract
│   ├── gateway-factory/         # Wallet factory
│   ├── jwk-registry/            # OAuth key registry
│   └── x402-facilitator/        # HTTP payments
├── sdk/                          # TypeScript SDK
│   ├── src/
│   │   ├── index.ts
│   │   ├── StellarZkLogin.ts
│   │   ├── client.ts
│   │   ├── config/
│   │   ├── oauth/
│   │   ├── keys/
│   │   ├── prover/
│   │   ├── transaction/
│   │   ├── xray/
│   │   ├── x402/
│   │   ├── utils/
│   │   └── react/
│   ├── package.json
│   └── README.md
├── demo/                         # Next.js demo app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing
│   │   │   ├── dashboard/       # Wallet dashboard
│   │   │   ├── explorer/        # X-Ray explorer
│   │   │   ├── sdk/            # SDK guide
│   │   │   └── api/            # API routes
│   │   ├── components/          # UI components
│   │   └── lib/                 # Utilities
│   └── package.json
├── circuits/                     # ZK circuits (Circom)
├── prover/                       # Prover service
├── salt-service/                 # Salt management
├── scripts/                      # Deployment scripts
├── .env.example
├── README.md
├── DOCUMENTATION.md
└── COMPLETE_DOCUMENTATION.md    # This file
```

---

## Summary

### What We Built

1. **Smart Contracts** (Soroban/Rust)
   - ZK Verifier with Groth16 support
   - Smart Wallet with session management
   - Gateway Factory for wallet creation
   - JWK Registry for OAuth keys
   - x402 Facilitator for HTTP payments

2. **SDK Package** (TypeScript)
   - `StellarZkLogin` - One-line integration
   - `EmbeddedWallet` - No external wallets needed
   - `XRayClient` - Protocol metrics
   - React hooks and components

3. **Demo Application** (Next.js)
   - Landing page with OAuth
   - Wallet dashboard
   - X-Ray Protocol explorer
   - SDK integration guide

4. **X-Ray Protocol Features**
   - Native BN254 elliptic curve
   - Poseidon hash function
   - 94% gas savings
   - Live metrics and visualization

### Key Achievements

- Users can create Stellar wallets with Google Sign-In
- Zero-knowledge proofs protect user identity
- No browser extensions required
- 94% gas savings with X-Ray Protocol
- Complete SDK for dApp integration
- Beautiful brutalist UI design

---

## Links

- **GitHub**: https://github.com/Adwaitbytes/Stellar-new
- **X-Ray Protocol**: https://stellar.org/protocol-25
- **Stellar Docs**: https://developers.stellar.org
- **Soroban Docs**: https://soroban.stellar.org

---

*Last Updated: January 21, 2026*
