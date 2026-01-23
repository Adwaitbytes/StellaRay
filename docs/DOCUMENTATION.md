# Stellar zkLogin Gateway

## Complete Technical Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [Backend Services](#backend-services)
5. [TypeScript SDK](#typescript-sdk)
6. [Demo Application](#demo-application)
7. [Authentication Flow](#authentication-flow)
8. [x402 Payment Protocol](#x402-payment-protocol)
9. [Deployment](#deployment)
10. [Security Considerations](#security-considerations)

---

## Overview

**Stellar zkLogin Gateway** is a revolutionary OAuth-based wallet creation system for the Stellar blockchain using zero-knowledge proofs. It enables users to create and manage **self-custodial wallets** by simply signing in with Google or Apple—no seed phrases, no browser extensions, no complexity.

### Key Features

| Feature | Description |
|---------|-------------|
| **2-Second Setup** | Sign in with Google, get a blockchain wallet instantly |
| **Zero-Knowledge Privacy** | Your identity stays private through cryptographic proofs |
| **Self-Custodial** | You control your keys—we never have access to your funds |
| **x402 Micropayments** | HTTP 402 Payment Required protocol for web monetization |
| **Testnet Ready** | Fully deployed on Stellar Testnet with 10,000 free XLM |

### Technology Stack

- **Blockchain**: Stellar (Soroban Smart Contracts)
- **ZK Proofs**: Groth16 on BN254 curve
- **Backend**: Rust (Axum framework)
- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **SDK**: TypeScript with full type safety
- **Authentication**: NextAuth with Google OAuth

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    Next.js Demo Application                     │
│                  + TypeScript SDK (ZkLoginClient)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │  Prover  │      │   Salt   │      │  Stellar │
     │ Service  │      │ Service  │      │  Testnet │
     │ (Rust)   │      │ (Rust)   │      │  (Horizon│
     └──────────┘      └──────────┘      │  + RPC)  │
           │                 │           └──────────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SOROBAN SMART CONTRACTS                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ ZK-Verifier │ │ JWK-Registry│ │   Gateway   │ │   x402    │ │
│  │   (Proofs)  │ │   (Keys)    │ │   Factory   │ │Facilitator│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Smart Wallet (Per User)                     │   │
│  │         - Session Management                             │   │
│  │         - __check_auth Implementation                    │   │
│  │         - Token Transfers & Contract Calls               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
stellar-gateway/
├── contracts/                 # Soroban smart contracts (Rust)
│   ├── zk-verifier/          # Groth16 proof verification
│   ├── smart-wallet/         # Custom account with __check_auth
│   ├── jwk-registry/         # OAuth provider JWK management
│   ├── gateway-factory/      # Deterministic wallet deployment
│   └── x402-facilitator/     # HTTP 402 payment protocol
├── sdk/                       # TypeScript client SDK
├── demo/                      # Next.js reference application
├── prover/                    # ZK proof generation service (Rust)
├── salt-service/             # Deterministic salt derivation (Rust)
├── circuits/                  # Circom ZK circuits
└── scripts/                   # Deployment utilities
```

---

## Smart Contracts

All contracts are written in Rust for Soroban (Stellar's smart contract platform), compiled to WebAssembly.

### 1. ZK-Verifier Contract

**Location**: `contracts/zk-verifier/src/lib.rs`

**Purpose**: Validates Groth16 zero-knowledge proofs for zkLogin authentication.

**Key Types**:
```rust
// BN254 curve points
struct G1Point { x: U256, y: U256 }
struct G2Point { x: [U256; 2], y: [U256; 2] }

// Groth16 proof structure
struct Groth16Proof {
    a: G1Point,
    b: G2Point,
    c: G1Point,
}

// Public inputs for zkLogin
struct ZkLoginPublicInputs {
    iss_hash: BytesN<32>,
    address_seed: BytesN<32>,
    eph_pk_hash: BytesN<32>,
    max_epoch: u64,
    jwt_randomness: BytesN<32>,
}
```

**Key Functions**:
| Function | Description |
|----------|-------------|
| `initialize(admin, vk)` | Initialize with admin and verification key |
| `verify_zklogin_proof(proof, inputs)` | Validate Groth16 proof |
| `compute_nonce(eph_pk, max_epoch)` | Generate session binding nonce |
| `compute_address_seed(salt, sub)` | Derive wallet address seed |
| `is_nullifier_used(nullifier)` | Check for replay attacks |

**Security**: Implements nullifier tracking for replay protection with 3,110,400 ledger TTL (~1 year).

---

### 2. Smart-Wallet Contract

**Location**: `contracts/smart-wallet/src/lib.rs`

**Purpose**: Custom Soroban account implementing zkLogin authentication via the `__check_auth` interface.

**Key Types**:
```rust
// Ephemeral key session
struct Session {
    eph_pk: BytesN<32>,
    max_epoch: u64,
    proof_hash: BytesN<32>,
    created_at: u64,
    revoked: bool,
}

// zkLogin authentication data
struct ZkLoginAuth {
    session_id: BytesN<32>,
    signature: BytesN<64>,  // ED25519 signature
}

// Wallet configuration
struct WalletConfig {
    address_seed: BytesN<32>,
    iss_hash: BytesN<32>,
    zk_verifier: Address,
    jwk_registry: Address,
}
```

**Key Functions**:
| Function | Description |
|----------|-------------|
| `initialize(seed, iss_hash, verifier, registry)` | Setup wallet |
| `add_session(eph_pk, max_epoch, proof)` | Register ephemeral key |
| `revoke_session(session_id)` | Disable a session |
| `transfer(token, to, amount)` | Execute token transfer |
| `execute(contract, fn_name, args)` | Call any contract |
| `__check_auth(hash, signature, contexts)` | Custom auth interface |

**Auth Flow**: Verifies ED25519 signatures over transaction hashes using registered ephemeral keys.

---

### 3. JWK-Registry Contract

**Location**: `contracts/jwk-registry/src/lib.rs`

**Purpose**: Manages OAuth provider public keys (JWKs) for JWT verification in ZK circuits.

**Key Types**:
```rust
// JSON Web Key storage
struct JWK {
    kid: String,
    modulus_chunks: [BytesN<32>; 17],  // RSA-2048 split for BN254
    exponent: u32,                      // Always 65537 (0x10001)
    algorithm: String,                  // "RS256"
    active: bool,
}

// OAuth provider configuration
struct OAuthProvider {
    name: String,
    issuer: String,           // e.g., "https://accounts.google.com"
    jwks_uri: String,
    oracle: Address,          // Who can update keys
}
```

**Key Functions**:
| Function | Description |
|----------|-------------|
| `register_provider(name, issuer, jwks_uri, oracle)` | Add OAuth provider |
| `register_jwk(provider_id, kid, modulus_chunks)` | Register RSA public key |
| `get_jwk(provider_id, kid)` | Retrieve key |
| `revoke_jwk(provider_id, kid)` | Mark key as inactive |
| `compute_issuer_hash(issuer)` | Hash issuer for ZK circuit |

**Design**: RSA-2048 modulus is split into 17 chunks of 121 bits each for BN254 field compatibility.

---

### 4. Gateway-Factory Contract

**Location**: `contracts/gateway-factory/src/lib.rs`

**Purpose**: Deterministic wallet deployment with CREATE2-style address prediction.

**Key Types**:
```rust
struct FactoryConfig {
    admin: Address,
    wallet_wasm_hash: BytesN<32>,
    zk_verifier: Address,
    jwk_registry: Address,
    wallet_count: u64,
}

struct WalletRecord {
    wallet_address: Address,
    address_seed: BytesN<32>,
    iss_hash: BytesN<32>,
    deployed_at: u64,
}
```

**Key Functions**:
| Function | Description |
|----------|-------------|
| `initialize(admin, wasm_hash, verifier, registry)` | Setup factory |
| `predict_address(iss_hash, address_seed)` | Get address before deployment |
| `deploy_wallet(iss_hash, address_seed)` | Deploy new wallet (idempotent) |
| `get_wallet(address_seed)` | Lookup existing wallet |
| `wallet_exists(address_seed)` | Check if deployed |

**Address Derivation**: `hash(0x05 || iss_hash || address_seed)` used as deterministic salt.

---

### 5. x402-Facilitator Contract

**Location**: `contracts/x402-facilitator/src/lib.rs`

**Purpose**: Implements HTTP 402 Payment Required protocol for Stellar micropayments.

**Key Types**:
```rust
struct PaymentRequest {
    request_id: BytesN<32>,
    requester: Address,
    asset: Address,           // USDC contract
    amount: i128,
    destination: Address,
    resource_id: String,
    valid_until: u64,
    paid: bool,
}

struct PaymentProof {
    request_id: BytesN<32>,
    payer: Address,
    tx_hash: BytesN<32>,
    amount_paid: i128,
    paid_at: u64,
}

struct FacilitatorConfig {
    admin: Address,
    fee_recipient: Address,
    fee_bps: u32,             // 0-1000 = 0-10%
}
```

**Key Functions**:
| Function | Description |
|----------|-------------|
| `initialize(admin, fee_recipient, fee_bps)` | Setup facilitator |
| `create_request(asset, amount, destination, resource_id)` | Create payment requirement |
| `pay(request_id, payer)` | Execute USDC payment |
| `is_paid(request_id)` | Verify payment status |
| `get_stats()` | Total payments and volume |

**Fee Calculation**: `fee = (amount * fee_bps) / 10000`, remainder goes to destination.

---

## Backend Services

### Prover Service

**Location**: `prover/src/`

**Purpose**: Generates Groth16 zero-knowledge proofs for zkLogin authentication.

**Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with status and version |
| `/prove` | POST | Generate Groth16 proof from JWT |
| `/verify` | POST | Verify proof locally |

**Proof Generation Input**:
```json
{
  "jwt": "eyJhbGciOiJSUzI1NiIs...",
  "salt": "base64url-encoded-32-bytes",
  "eph_pk_x": "base64url-encoded",
  "eph_pk_y": "base64url-encoded",
  "max_epoch": 1000000,
  "randomness": "base64url-encoded-32-bytes",
  "key_claim_name": "sub"
}
```

**Output**:
```json
{
  "proof": {
    "pi_a": ["x", "y", "1"],
    "pi_b": [["x0", "x1"], ["y0", "y1"], ["1", "0"]],
    "pi_c": ["x", "y", "1"]
  },
  "public_signals": [
    "iss_hash",
    "address_seed",
    "eph_pk_hash",
    "max_epoch",
    "jwt_randomness"
  ]
}
```

---

### Salt Service

**Location**: `salt-service/src/`

**Purpose**: Secure, deterministic salt derivation for wallet address generation.

**Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/get-salt` | POST | Derive salt from JWT |

**Salt Derivation**:
```
salt = HKDF-SHA256(
  key: master_key,
  input: issuer + ":" + subject,
  info: "stellar-zklogin-salt"
)
```

**Security**:
- Master key should be stored in HSM (currently environment variable)
- JWT verification via Google/Apple JWKS endpoints
- JWKS cache refreshed hourly
- Deterministic: same OAuth identity → same salt → same wallet address

---

## TypeScript SDK

**Location**: `sdk/src/`

Complete client-side library for zkLogin authentication and x402 payments.

### Core Modules

```typescript
// Main client
import { ZkLoginClient } from '@stellar-gateway/sdk';

const client = new ZkLoginClient({
  network: 'testnet',
  proverUrl: 'http://localhost:8080',
  saltServiceUrl: 'http://localhost:8081',
});

// Authenticate with Google
const session = await client.authenticate({
  provider: 'google',
  idToken: googleIdToken,
  maxEpoch: currentLedger + 100000,
});

// Send payment
const result = await client.sendPayment({
  destination: 'GDQP2...',
  amount: '100',
  asset: 'native',
  memo: 'Payment for services',
});
```

### Module Structure

| Module | Purpose |
|--------|---------|
| `client.ts` | Main orchestration client |
| `oauth/` | Google & Apple OAuth providers |
| `keys/` | Ephemeral ED25519 key management |
| `prover/` | HTTP client to prover service |
| `transaction/` | Stellar transaction building |
| `x402/` | Payment protocol client |
| `utils/` | Crypto utilities, address computation |

### Key Types

```typescript
interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
}

interface ZkLoginSession {
  sessionId: string;
  ephemeralPublicKey: string;
  maxEpoch: number;
  proofHash: string;
  createdAt: number;
}

interface X402PaymentRequest {
  requestId: string;
  asset: string;
  amount: string;
  destination: string;
  resourceId: string;
  validUntil: number;
}
```

---

## Demo Application

**Location**: `demo/`

A full-featured Next.js 15 reference implementation showcasing the zkLogin Gateway.

### Pages

#### Landing Page (`/`)

- **Hero Section**: Bold value proposition with "CRYPTO WITHOUT THE BULLSHIT" headline
- **Features**: 4 interactive cards (2-second setup, zero-knowledge, global payments, self-custodial)
- **How It Works**: 3-step visual guide (Sign In → Get Wallet → Start Using)
- **Stats**: 10K free XLM, 3-5s transactions, 100% private
- **CTA**: Google sign-in button with animated hover effects
- **Theme Toggle**: Dark/light mode support

#### Dashboard (`/dashboard`)

- **Balance Display**: XLM balance with live USD conversion (CoinGecko API)
- **Address Card**: Public key with copy button and Stellar Expert link
- **Actions**: Send, Receive, Export Transactions buttons
- **Transaction History**: Paginated list with send/receive indicators
- **Modals**:
  - **Send**: Destination, amount, memo fields with validation
  - **Receive**: QR code generation with address display
  - **Transaction Details**: Full transaction info with explorer links
- **Contract Info**: Display deployed Soroban contract addresses

### Design System

**Neon Brutalism** aesthetic with:

| Element | Specification |
|---------|--------------|
| **Borders** | 2-4px solid, high contrast |
| **Typography** | font-black, tracking-tighter |
| **Colors** | Pink #FF3366, Green #00FF88, Cyan #00D4FF, Yellow #FFD600 |
| **Shadows** | Offset shadow effects on buttons |
| **Background** | Dark #0A0A0A (default), Light #F5F5F5 |
| **Animations** | Bounce, pulse, hover transforms |

### Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page component |
| `src/app/dashboard/page.tsx` | Dashboard with wallet UI |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth configuration |
| `src/lib/stellar.ts` | Stellar SDK utilities |
| `src/lib/soroban.ts` | Contract address management |

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. USER INITIATES LOGIN                                         │
│     User clicks "Sign in with Google"                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. OAUTH AUTHORIZATION                                          │
│     Google OAuth flow → JWT token (id_token) obtained            │
│     Contains: iss, sub, aud, exp, nonce                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. SALT DERIVATION                                              │
│     Salt Service verifies JWT                                    │
│     Derives: salt = HKDF(master_key, iss:sub, info)              │
│     Returns: 32-byte deterministic salt                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. ADDRESS PREDICTION                                           │
│     address_seed = Poseidon(salt, sub)                           │
│     wallet_address = Factory.predict_address(iss_hash, seed)     │
│     Address is deterministic before wallet deployment            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. EPHEMERAL KEY GENERATION                                     │
│     SDK generates ED25519 keypair                                │
│     eph_pk stored locally, used for signing transactions         │
│     max_epoch set (session expiration ledger)                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. ZK PROOF GENERATION                                          │
│     Prover Service computes Groth16 proof                        │
│     Inputs: JWT, salt, eph_pk, max_epoch, randomness             │
│     Outputs: proof (a,b,c) + 5 public signals                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. WALLET DEPLOYMENT (if needed)                                │
│     Factory.deploy_wallet(iss_hash, address_seed)                │
│     Idempotent: returns existing wallet if already deployed      │
│     Wallet initialized with ZK verifier and JWK registry refs    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  8. SESSION REGISTRATION                                         │
│     SmartWallet.add_session(eph_pk, max_epoch, proof)            │
│     ZK-Verifier validates proof on-chain                         │
│     Session stored: eph_pk, max_epoch, proof_hash                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  9. TRANSACTION SIGNING                                          │
│     User initiates transaction (e.g., send XLM)                  │
│     SDK signs tx hash with ephemeral private key                 │
│     Submits via SmartWallet.transfer() or execute()              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  10. TRANSACTION VERIFICATION                                    │
│      SmartWallet.__check_auth() called by Soroban                │
│      Verifies: session exists, not expired, not revoked          │
│      Validates: ED25519 signature over transaction hash          │
│      Executes: actual token transfer or contract call            │
└──────────────────────────────────────────────────────────────────┘
```

---

## x402 Payment Protocol

HTTP 402 "Payment Required" implementation for web monetization.

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SERVER CREATES PAYMENT REQUIREMENT                          │
│     POST x402-facilitator/create_request(                       │
│       asset: USDC,                                              │
│       amount: 1000000,  // 0.1 USDC (7 decimals)                │
│       destination: merchant_address,                            │
│       resource_id: "article-123"                                │
│     )                                                           │
│     Returns: request_id, valid_until                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SERVER RESPONDS WITH HTTP 402                               │
│     Status: 402 Payment Required                                │
│     Headers:                                                    │
│       x402-version: 1                                           │
│       x402-scheme: stellar                                      │
│       x402-payload: base64(JSON{                                │
│         asset, amount, destination, request_id, valid_until     │
│       })                                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CLIENT DETECTS 402 & PARSES REQUIREMENTS                    │
│     X402PaymentClient.parseRequirements(response.headers)       │
│     Displays payment prompt to user                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CLIENT EXECUTES PAYMENT                                     │
│     x402-facilitator.pay(request_id, payer)                     │
│     Smart Wallet signs with ephemeral key                       │
│     Facilitator splits payment:                                 │
│       - net_amount → destination (merchant)                     │
│       - fee_amount → fee_recipient (platform)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. PAYMENT PROOF RETURNED                                      │
│     PaymentProof {                                              │
│       request_id, payer, tx_hash, amount_paid, paid_at          │
│     }                                                           │
│     Client includes proof in subsequent request                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. SERVER VERIFIES & DELIVERS CONTENT                          │
│     x402-facilitator.is_paid(request_id) → true                 │
│     Server delivers protected resource                          │
│     Status: 200 OK                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Fee Structure

| Fee BPS | Percentage | Example (100 USDC payment) |
|---------|------------|---------------------------|
| 0 | 0% | Merchant: 100, Platform: 0 |
| 100 | 1% | Merchant: 99, Platform: 1 |
| 250 | 2.5% | Merchant: 97.5, Platform: 2.5 |
| 1000 | 10% (max) | Merchant: 90, Platform: 10 |

---

## Deployment

### Deployed Contract Addresses (Stellar Testnet)

| Contract | Address |
|----------|---------|
| ZK-Verifier | `CAQISC6MBAMGSAVRPRO2GZ3WPDREZW72XDPCHTF2DFUDE45YFIHEIH56` |
| Smart-Wallet WASM | `3747d3dfab113f7c16ae435556e267de66cec574523c6c8629989bc5a7d37cd8` |
| Gateway-Factory | `CD62OWXRDPTQ3YHYSSFV7WCAJQU7F4RCEW7XMSMP46POCJ6DBA7D7EZR` |
| JWK-Registry | `CC3AVC4YGWMDYRJLQBXNUXQF3BF6TXDDDJ4SNSDMHVUCRAJIJGNWCHKN` |
| x402-Facilitator | `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ` |
| USDC Token | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

### Environment Configuration

```env
# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Services
PROVER_URL=http://localhost:8080
SALT_SERVICE_URL=http://localhost:8081
SALT_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Public Variables (exposed to browser)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Running Locally

```bash
# 1. Start backend services
cd prover && cargo run          # Port 8080
cd salt-service && cargo run    # Port 8081

# 2. Start demo app
cd demo
pnpm install
pnpm dev                        # Port 3000

# 3. Open browser
open http://localhost:3000
```

### Building Contracts

```bash
cd contracts

# Build all contracts
cargo build --release --target wasm32-unknown-unknown

# Optimize WASM (optional)
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/zk_verifier.wasm

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_verifier.wasm \
  --source ADMIN_SECRET_KEY \
  --network testnet
```

---

## Security Considerations

### Proof Verification

| Aspect | Current State | Production Recommendation |
|--------|--------------|--------------------------|
| Pairing checks | Simplified (dev mode) | Full BN254 verification |
| Verification key | Hardcoded | Multi-party ceremony generated |
| Proof format | snarkjs compatible | Audited circuit |

### Session Management

- **Expiration**: Sessions expire at `max_epoch` ledger sequence
- **Revocation**: Sessions can be revoked on-chain immediately
- **Replay Protection**: One-time nonce per proof
- **Key Rotation**: New ephemeral key per session

### Salt Service Security

- **Master Key**: Should be stored in HSM (currently env var)
- **Determinism**: Same OAuth identity always produces same salt
- **JWT Verification**: Full signature and expiration validation
- **Rate Limiting**: Should be implemented for production

### JWK Management

- **Oracle-Gated**: Only authorized oracles can update keys
- **Versioning**: Keys are versioned for rotation support
- **Revocation**: Compromised keys can be marked inactive
- **Modulus Hashing**: RSA modulus chunked and hashed for ZK compatibility

### x402 Payments

- **Request Expiration**: `valid_until` timestamp prevents stale payments
- **Nonce-Based IDs**: Prevents request ID collisions
- **Fee Caps**: Maximum 10% fee enforced in contract
- **Authorization**: Only requester can create requests for their destination

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Smart Contracts | 5 |
| Lines of Rust | 2,500+ |
| SDK Modules | 13+ |
| TypeScript Types | 50+ |
| Demo Pages | 2 |
| API Endpoints | 5 |
| Deployed Contracts | 6 (including USDC) |

---

## Future Roadmap

1. **Full BN254 Pairing Verification** - Complete cryptographic verification in Soroban
2. **Apple Sign-In Support** - Full integration with Apple OAuth
3. **Multi-sig Wallets** - Support for shared ownership
4. **Hardware Wallet Bridge** - Connect with Ledger/Trezor
5. **Mainnet Deployment** - Production-ready launch
6. **Mobile SDK** - React Native / Flutter bindings
7. **Additional OAuth Providers** - GitHub, Microsoft, Facebook

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details.

---

## Support

- **Documentation**: This file
- **Issues**: GitHub Issues
- **Community**: Discord (coming soon)

---

Built with Stellar. Secured by Zero-Knowledge Proofs.
