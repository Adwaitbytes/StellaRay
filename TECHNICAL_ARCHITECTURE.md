# StellaRay Technical Architecture
## ZK Authentication & Privacy Layer for Stellar
### SCF Build Award — Open Track — SCF #42

> **Live Demo:** https://stellaray.fun
> **SDK:** https://www.npmjs.com/package/@stellar-zklogin/sdk
> **GitHub:** https://github.com/Adwaitbytes/StellaRay
> **Status:** Live on Stellar Testnet. Requesting funding to launch on Mainnet.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Protocol 25 Integration (CAP-0074 + CAP-0075)](#2-protocol-25-integration)
3. [Layer 1 — ZK Authentication](#3-layer-1--zk-authentication)
4. [Layer 2 — Payment Primitives](#4-layer-2--payment-primitives)
5. [Layer 3 — Near Intent / ZK Proof Gates](#5-layer-3--near-intent--zk-proof-gates)
6. [Soroban Smart Contracts](#6-soroban-smart-contracts)
7. [Supporting Infrastructure](#7-supporting-infrastructure)
8. [TypeScript SDK](#8-typescript-sdk)
9. [Security Architecture](#9-security-architecture)
10. [Performance Benchmarks](#10-performance-benchmarks)
11. [Mainnet Migration Plan](#11-mainnet-migration-plan)
12. [API Reference](#12-api-reference)

---

## 1. System Overview

StellaRay is a three-layer zero-knowledge infrastructure for the Stellar network, built entirely on Protocol 25's native BN254 and Poseidon cryptographic host functions.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│   stellaray.fun (Next.js)  ·  @stellar-zklogin/sdk (npm)        │
│   useZkLogin() · useWallet() · <LoginButton> · <WalletWidget>   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                      SERVICE LAYER                              │
│   Prover Service (Rust)       Salt Service (Rust)               │
│   prover.zklogin.stellaray.fun  salt.zklogin.stellaray.fun      │
│   Groth16 proof generation    Deterministic salt derivation     │
└──────────┬─────────────────────────────────┬────────────────────┘
           │ ZK Proof                         │ Salt
┌──────────▼─────────────────────────────────▼────────────────────┐
│                     SOROBAN CONTRACT LAYER                      │
│   ZK Verifier  ·  JWK Registry  ·  Gateway Factory              │
│   Smart Wallet  ·  x402 Facilitator  ·  ZK Multi-Custody        │
│                                                                  │
│   Protocol 25: bn254_g1_add · bn254_g1_mul                      │
│                bn254_multi_pairing_check · poseidon_permutation  │
└─────────────────────────┬────────────────────────────────────────┘
                          │  Stellar XDR
┌─────────────────────────▼────────────────────────────────────────┐
│                    STELLAR NETWORK                               │
│   Horizon API  ·  Soroban RPC  ·  Ledger (5s finality)          │
└──────────────────────────────────────────────────────────────────┘
```

### Deployed Contracts (Stellar Testnet)

| Contract | Address | Purpose |
|---|---|---|
| ZK Verifier | `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6` | Groth16 proof verification on-chain |
| JWK Registry | `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I` | Google OAuth JWK key management |
| Gateway Factory | `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76` | Wallet creation & session management |
| x402 Facilitator | `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ` | HTTP micropayment facilitation |
| Smart Wallet | WASM hash: `2a7e72543da92134de77821c920b82e6c5fb7cd02b5283cfeb87deb894e14d5d` | ZK-authenticated Stellar wallet |

---

## 2. Protocol 25 Integration

Protocol 25 (Stellar's "X-Ray" upgrade) introduced native cryptographic host functions into Soroban. StellaRay is the **first project on Stellar** to use these in production.

### CAP-0074: BN254 Elliptic Curve Operations

Three host functions, called directly from Soroban Rust contracts:

```rust
use soroban_sdk::crypto::bn254::{Bn254G1Affine, Bn254G2Affine, Fr};

// G1 scalar multiplication — used for public input accumulation (MSM)
let pub_input_acc: Bn254G1Affine = env.crypto().bn254_g1_mul(&ic_point, &scalar);

// G1 point addition — used in multi-scalar multiplication
let accumulated: Bn254G1Affine = env.crypto().bn254_g1_add(&acc, &next_point);

// Multi-pairing check — the core Groth16 verification equation
// e(-A, B) · e(α, β) · e(pubInputAcc, γ) · e(C, δ) == 1
let valid: bool = env.crypto().bn254_multi_pairing_check(&pairs);
```

**Gas comparison:**

| Operation | WASM (pre-Protocol 25) | Native Host Function | Savings |
|---|---|---|---|
| Full Groth16 verify | ~4,100,000 gas | ~260,000 gas | **94%** |
| BN254 pairing check | ~3,200,000 gas | ~180,000 gas | **94%** |
| Poseidon hash (2 inputs) | ~45,000 gas | ~12,000 gas | **73%** |

**Cost per ZK login:** ~$0.03 in XLM fees (at current rates, mainnet projection)

### CAP-0075: Poseidon Hash Function

```rust
use soroban_poseidon::poseidon_hash;

// Parameters: BN254 Fr field, t=3, d=5, 8 full rounds, 57 partial rounds
// Address derivation: identity commitment → deterministic wallet address
let address_seed = poseidon_hash(&env, &[eph_pk_hash, kc_value, aud_hash, salt_hash]);
```

Poseidon is the standard ZK-friendly hash function. Its algebraic structure over BN254 Fr means the constraints fit naturally into Groth16 R1CS circuits — using SHA-256 for the same purpose would require ~20,000 constraints vs ~220 for Poseidon.

---

## 3. Layer 1 — ZK Authentication

### How It Works: End-to-End Flow

```
User                Browser SDK              Prover Service     Stellar Network
 │                      │                         │                   │
 │  "Sign in with        │                         │                   │
 │   Google"             │                         │                   │
 │──────────────────────►│                         │                   │
 │                       │ 1. Generate ephemeral   │                   │
 │                       │    keypair (eph_sk,      │                   │
 │                       │    eph_pk)               │                   │
 │                       │                         │                   │
 │                       │ 2. Compute nonce:        │                   │
 │                       │    Poseidon(eph_pk,       │                   │
 │                       │    max_epoch, random)     │                   │
 │                       │                         │                   │
 │◄──────────────────────│                         │                   │
 │  Redirect to Google   │                         │                   │
 │  OAuth with nonce     │                         │                   │
 │                       │                         │                   │
 │  [User authenticates with Google]               │                   │
 │                       │                         │                   │
 │──────────────────────►│                         │                   │
 │  id_token (JWT)       │                         │                   │
 │                       │ 3. JWT contains          │                   │
 │                       │    sub, aud, iss,        │                   │
 │                       │    nonce fields          │                   │
 │                       │                         │                   │
 │                       │ 4. Fetch salt:           │                   │
 │                       │    salt = f(sub, aud)    │                   │
 │                       │    from Salt Service     │                   │
 │                       │                         │                   │
 │                       │ 5. Derive address:       │                   │
 │                       │    seed = Poseidon(      │                   │
 │                       │      "sub", sub,         │                   │
 │                       │      aud, Pos(salt))      │                   │
 │                       │    addr = Blake2b(       │                   │
 │                       │      issuer, seed)       │                   │
 │                       │                         │                   │
 │                       │ 6. Send JWT + eph_pk ──►│                   │
 │                       │    to Prover Service    │                   │
 │                       │                         │ Generate Groth16  │
 │                       │                         │ proof over circuit│
 │                       │                         │ with BN254/Circom │
 │                       │◄────────────────────────│                   │
 │                       │    (π_A, π_B, π_C)      │                   │
 │                       │    + public inputs       │                   │
 │                       │                         │                   │
 │                       │ 7. Build Soroban tx:     │                   │
 │                       │    ZKVerifier::verify(   │                   │
 │                       │      proof, pub_inputs)  │                   │
 │                       │                         │                   │
 │                       │──────────────────────────────────────────►│
 │                       │                         │  On-chain verify: │
 │                       │                         │  bn254_multi_     │
 │                       │                         │  pairing_check    │
 │                       │◄──────────────────────────────────────────│
 │                       │    tx confirmed          │                   │
 │◄──────────────────────│                         │                   │
 │  Stellar wallet ready │                         │                   │
 │  (8-10 seconds total) │                         │                   │
```

### ZK Circuit Design

The Groth16 circuit (`circuits/zklogin.circom`) proves the following in zero-knowledge:

**Public inputs (5 elements):**
1. `eph_pk_hash` — `Poseidon(eph_pk_high, eph_pk_low)` — binds proof to ephemeral key
2. `max_epoch` — session expiration (Stellar ledger number)
3. `address_seed` — `Poseidon("sub", sub, aud, Poseidon(salt))` — wallet address commitment
4. `iss_hash` — hash of the OAuth issuer string
5. `jwk_modulus_hash` — Poseidon hash of Google's JWK modulus chunks

**Private inputs (witnesses — never leave the browser):**
- Raw JWT payload
- `sub` (Google user ID)
- `salt` (user-specific randomness)
- `eph_sk` (ephemeral private key)
- RSA signature from Google

**What the circuit proves:**
1. The JWT was signed by Google (verifies RSA-PKCS1v15 SHA-256 inside ZK)
2. The nonce in the JWT matches `Poseidon(eph_pk, max_epoch, random)`
3. The address seed is correctly derived from `sub`, `aud`, and `salt`
4. The proof is bound to the specific ephemeral key

**Privacy guarantee:** The Google identity (`sub`, email) never appears on-chain. The on-chain address is derived from a one-way Poseidon hash of identity + salt. Two different dApps with different `aud` values produce different wallet addresses.

### Address Derivation

```typescript
// Step 1: Compute address seed (BN254 Fr field)
addressSeed = Poseidon("sub", googleSub, googleAud, Poseidon(salt))

// Step 2: Derive Stellar address (G* prefix, 56 chars)
address = Blake2b(concat(issuer, addressSeed))
// → e.g., GDKQZYZ3T7...XMVB (deterministic, reproducible)
```

The same Google account always produces the same wallet address. Losing Google access → recovery via ZK Multi-Custody (Layer 3).

### On-Chain Verification (ZK Verifier Contract)

```rust
// contracts/zk-verifier/src/lib.rs
pub fn verify_zklogin(
    env: Env,
    proof: Groth16Proof,
    public_inputs: Vec<U256>,
    max_epoch: u64,
) -> bool {
    // 1. Check session not expired
    assert!(env.ledger().sequence() <= max_epoch);

    // 2. Check nullifier not used (replay protection)
    let nullifier = env.crypto().poseidon_hash(&public_inputs[2..3]);
    assert!(!is_nullifier_used(&env, &nullifier));

    // 3. Verify JWK is registered (Google key rotation)
    let jwk_hash = public_inputs[4];
    assert!(jwk_registry::is_registered(&env, &jwk_hash));

    // 4. Multi-scalar multiplication for public input accumulation
    // vk_x = IC[0] + sum(pub_i * IC[i+1])
    let mut vk_x = verification_key.ic[0].clone();
    for (i, pub_input) in public_inputs.iter().enumerate() {
        let term = env.crypto().bn254_g1_mul(&vk.ic[i+1], &pub_input);
        vk_x = env.crypto().bn254_g1_add(&vk_x, &term);
    }

    // 5. Final Groth16 pairing check:
    // e(-A, B) · e(α, β) · e(vk_x, γ) · e(C, δ) == 1
    let pairs = vec![
        (-proof.a, proof.b),
        (vk.alpha, vk.beta),
        (vk_x, vk.gamma),
        (proof.c, vk.delta),
    ];
    let valid = env.crypto().bn254_multi_pairing_check(&pairs);

    // 6. Mark nullifier as used
    if valid { mark_nullifier_used(&env, &nullifier); }
    valid
}
```

---

## 4. Layer 2 — Payment Primitives

All payment primitives use ZK-authenticated Stellar wallets as the sender/recipient. No seed phrase required.

### 4a. Streaming Payments

Real-time escrow-based payment streaming on Stellar. Inspired by Sablier/Superfluid, native to Stellar.

**Architecture:**

```
Sender                Stream Escrow (Soroban)         Recipient
  │                          │                            │
  │  create_stream(          │                            │
  │    recipient,            │                            │
  │    total=100 XLM,        │                            │
  │    duration=30days,      │                            │
  │    curve=linear)         │                            │
  │─────────────────────────►│                            │
  │  Soroban escrow          │                            │
  │  locks 100 XLM           │                            │
  │                          │                            │
  │   [Time passes...]       │                            │
  │                          │                            │
  │                          │◄──────────────────────────│
  │                          │  withdraw()               │
  │                          │  (at day 15)              │
  │                          │                            │
  │                          │  Releases 50 XLM          │
  │                          │  to recipient             │
  │                          │─────────────────────────► │
  │                          │                            │
  │  cancel()                │                            │
  │─────────────────────────►│                            │
  │                          │  Remaining 50 XLM → sender│
  │                          │  Earned 0 XLM → recipient │
```

**Streaming Curves:**

| Curve | Formula | Use Case |
|---|---|---|
| Linear | `amount = total × (elapsed / duration)` | Salary, subscriptions |
| Cliff | `amount = 0 until cliff, then linear` | Employee vesting |
| Exponential | `amount = total × progress²` | Incentive programs |
| Steps | `amount = floor(progress × 10) / 10 × total` | Milestone payments |

**Stellar Integration:**
- Escrow contract holds XLM/USDC during stream lifetime
- `withdraw()` calls `Operation.payment` to release earned amount to recipient
- `cancel()` calls two `Operation.payment` ops: earned to recipient, remainder to sender
- All txns built with `TransactionBuilder` and submitted via Horizon API
- 5-second Stellar finality ensures real-time withdrawals settle quickly

**Database:** PostgreSQL stores stream state (`payment_streams` table) with columns: `id`, `sender_address`, `recipient_address`, `total_amount`, `asset`, `start_time`, `end_time`, `cliff_time`, `flow_rate`, `curve_type`, `status`, `withdrawn_amount`, `deposit_tx_hash`.

### 4b. Payment Links

Shareable payment URLs with QR codes. Anyone can pay a Stellar address without installing any wallet.

**Flow:**
```
Creator                   API                      Payer
  │                        │                         │
  │  POST /api/pay/create  │                         │
  │  { recipient, amount,  │                         │
  │    memo, expires }     │                         │
  │───────────────────────►│                         │
  │◄───────────────────────│                         │
  │  { id, url, qr_code }  │                         │
  │                        │                         │
  │  Shares URL/QR         │                         │
  │────────────────────────────────────────────────►│
  │                        │                         │
  │                        │◄────────────────────────│
  │                        │  GET /api/pay/[id]      │
  │                        │─────────────────────────►│
  │                        │  { recipient, amount }  │
  │                        │                         │
  │                        │  Payer ZK-logs in       │
  │                        │  → builds & signs tx    │
  │                        │  → submits to Horizon   │
```

**Stellar Integration:**
- Payment links encode Stellar address + amount + memo + expiry
- QR code (`PaymentLinkQR` component) is scannable by any Stellar wallet
- When payer has a ZK wallet: uses `ZkLoginClient.signAndSubmit()`
- Payment link supports XLM and any Stellar asset (USDC, custom tokens)
- One-time-use enforcement: database tracks `used: boolean`

### 4c. x402 Micropayments

HTTP-native micropayment protocol enabling pay-per-API-call on Stellar.

**Protocol:**
```
HTTP Client              x402 Server              Stellar
  │                         │                        │
  │  GET /premium-data      │                        │
  │───────────────────────►│                        │
  │◄───────────────────────│                        │
  │  402 Payment Required  │                        │
  │  { amount: 0.001 XLM,  │                        │
  │    recipient: G...,     │                        │
  │    invoice_id: ... }   │                        │
  │                         │                        │
  │  Build Stellar tx       │                        │
  │  Sign with eph_sk       │                        │
  │  Submit to Horizon      │                        │
  │──────────────────────────────────────────────►│
  │◄──────────────────────────────────────────────│
  │  tx_hash                │                        │
  │                         │                        │
  │  GET /premium-data      │                        │
  │  X-Payment: tx_hash     │                        │
  │───────────────────────►│                        │
  │                         │  Verify payment        │
  │                         │  (Horizon lookup)      │
  │◄───────────────────────│                        │
  │  200 OK + data          │                        │
```

**x402 Facilitator Contract** (`CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ`): Soroban contract that acts as escrow and settlement layer for x402 payments, enabling atomic payment+service delivery.

---

## 5. Layer 3 — Near Intent / ZK Proof Gates

The most novel primitive: **ZK proofs that verify user state on Stellar without revealing user data**. These are composable Soroban building blocks.

### 5a. Proof Types

```
┌─────────────────────────────────────────────────────────┐
│              NEAR INTENT PROOF SYSTEM                   │
│                                                         │
│  SOLVENCY           IDENTITY         ELIGIBILITY        │
│  ┌──────────┐       ┌──────────┐     ┌──────────┐       │
│  │ Prove    │       │ Prove    │     │ Prove    │       │
│  │ balance  │       │ verified │     │ arbitrary│       │
│  │ ≥ 1000   │       │ identity │     │ criteria │       │
│  │ XLM      │       │ (KYC)    │     │ (age,    │       │
│  │          │       │          │     │ country) │       │
│  │ Without  │       │ Without  │     │ Without  │       │
│  │ revealing│       │ revealing│     │ revealing│       │
│  │ balance  │       │ identity │     │ data     │       │
│  └──────────┘       └──────────┘     └──────────┘       │
│                                                         │
│  HISTORY                                                │
│  ┌──────────┐                                           │
│  │ Prove    │                                           │
│  │ >100 txns│                                           │
│  │ in 90d   │                                           │
│  │ Without  │                                           │
│  │ revealing│                                           │
│  │ txn data │                                           │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘
```

### 5b. Solvency Proof (Private Lending)

```
Borrower wants loan. Lender requires 2000 XLM collateral.

Public inputs on-chain:
  - threshold_hash = Poseidon(2000, "XLM")  ← threshold is public
  - balance_commitment = Poseidon(actualBalance, salt)  ← balance is hidden
  - address_hash = Poseidon(walletAddress)

Private witness (never revealed):
  - actualBalance = 8500 XLM  ← stays in browser
  - salt = random()

Groth16 circuit constraint:
  actualBalance >= 2000  (proven without revealing 8500)

ZK Verifier on-chain calls:
  bn254_multi_pairing_check → verifies the Groth16 proof
  poseidon_permutation → recomputes balance_commitment for check
```

**Use case:** Private DeFi lending on Stellar. Borrower proves solvency without showing their full balance to the lender contract or any observer.

### 5c. Identity Badge System

```
ZK Identity Badge: "Google Verified Human"

Minting:
  identityCommitment = Poseidon(email, sub, salt)
  badge_tx = ZKVerifier::issue_badge(
    identityCommitment,
    "google_verified",
    proof  // proves: I know (email, sub, salt) that hash to this commitment
  )
  → Badge NFT on Stellar (with address_hash as owner, not email)

Verification:
  verifier checks: badge exists for address_hash
  verifier does NOT learn: email, sub, or any PII
```

### 5d. ZK Multi-Custody Recovery

Social wallet recovery using Shamir Secret Sharing over GF(256).

```
Setup (2-of-3 threshold):
  private_key → split into 3 shares [S1, S2, S3]

  S1 → encrypted to Guardian 1's Stellar address
  S2 → encrypted to Guardian 2's Stellar address
  S3 → encrypted to Guardian 3's Stellar address

  Multi-custody contract stores encrypted shares on Stellar

Recovery:
  User loses Google account.
  2 of 3 guardians approve recovery request.
  Guardian 1 decrypts S1, Guardian 2 decrypts S2.
  Shamir.combine([S1, S2]) → private_key
  New ZK wallet created with Google re-auth.
```

**Contracts involved:** Multi-custody contract (`/api/multi-custody/*`) handles the on-chain lifecycle: `create`, `initiate`, `approve`, `execute`, `pending` states stored in Soroban contract storage.

---

## 6. Soroban Smart Contracts

### Contract Architecture

```
contracts/
├── zk-verifier/      Groth16 verification, nullifier tracking, session mgmt
├── jwk-registry/     Google JWK key registry (key rotation support)
├── gateway-factory/  Wallet creation, session initiation
├── smart-wallet/     ZK-authenticated Stellar wallet (WASM)
├── x402-facilitator/ HTTP micropayment escrow & settlement
└── zk-multi-custody/ Shamir-based social recovery
```

### ZK Verifier — Core Contract

**Key functions:**
```rust
pub fn verify_zklogin(env, proof: Groth16Proof, public_inputs: Vec<U256>, max_epoch: u64) -> bool
pub fn register_vk(env, proof_type: Symbol, vk: VerificationKey)
pub fn is_nullifier_used(env, nullifier: BytesN<32>) -> bool
pub fn verify_eligibility_proof(env, proof: Groth16Proof, proof_type: Symbol, public_inputs: Vec<U256>) -> bool
```

**Verification Key management:** VKs are generated during trusted setup ceremony, stored on-chain in contract storage. Supports multiple proof types (zklogin, solvency, identity, eligibility, history).

### JWK Registry — Key Rotation

Google rotates JWK signing keys periodically. The JWK Registry contract stores authorized key modulus hashes. The ZK circuit proves the JWT was signed by a key in the registry, and the registry is updatable by the admin multisig.

```rust
pub fn register_jwk(env, modulus_hash: BytesN<32>, key_id: String)
pub fn revoke_jwk(env, modulus_hash: BytesN<32>)
pub fn is_valid_jwk(env, modulus_hash: BytesN<32>) -> bool
```

### Smart Wallet — ZK-Authenticated

```rust
// Execute any Stellar operation, authenticated by ZK proof (not seed phrase)
pub fn execute(
    env: Env,
    proof: Groth16Proof,
    public_inputs: Vec<U256>,
    operations: Vec<Operation>,
    max_epoch: u64,
) -> Result<(), WalletError> {
    // Verify ZK proof first — this is the "key"
    let valid = zk_verifier::verify_zklogin(
        &env, proof, public_inputs, max_epoch
    );
    require(valid, WalletError::InvalidProof);

    // Execute requested operations
    for op in operations {
        env.invoke_contract(&stellar_asset_contract, &op);
    }
    Ok(())
}
```

---

## 7. Supporting Infrastructure

### Prover Service (Rust)

**Location:** `prover/src/`
**URL:** `https://prover.zklogin.stellaray.fun`

The prover is a standalone Rust service that runs the Groth16 proving algorithm (snarkjs/rapidsnark). Proof generation happens here because ZK circuits require heavy computation (~1-4s) that would block the browser.

```
POST /prove
{
  "jwt": "<id_token>",
  "ephemeralPublicKey": "<hex>",
  "maxEpoch": 12345,
  "salt": "<hex>",
  "network": "testnet"
}
→ {
  "proof": { "a": {...}, "b": {...}, "c": {...} },
  "publicInputs": ["0x...", "0x...", "0x...", "0x...", "0x..."],
  "generationTimeMs": 2340
}

GET /health
→ { "status": "ok", "version": "1.2.0" }
```

**Security:** The prover never sees the user's salt or private key. It only receives the JWT and ephemeral public key — neither of which is a secret. The zero-knowledge property ensures the prover learns nothing about the user's identity.

### Salt Service (Rust)

**Location:** `salt-service/src/`
**URL:** `https://salt.zklogin.stellaray.fun`

Derives a deterministic, per-user salt: `salt = HMAC-SHA256(master_secret, sub + aud)`. The master secret never leaves the salt service. The salt is the same every time the user logs in with the same Google account, ensuring the same wallet address is always recovered.

```
POST /get-salt
{
  "jwt": "<id_token>"  // salt service verifies JWT signature, extracts sub+aud
}
→ { "salt": "<32 bytes hex>" }
```

The salt service uses Google's public JWK to verify the JWT before deriving the salt — preventing salt enumeration attacks.

---

## 8. TypeScript SDK

**Package:** `@stellar-zklogin/sdk` on npm

### 3-Line Integration

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

const zkLogin = new StellarZkLogin({ network: 'mainnet' });
const wallet = await zkLogin.login('google');
// → wallet.address: "GDKQZYZ3T7...XMVB"
// → wallet.signTransaction(): signs with ZK proof (no seed phrase)
```

### Full SDK API

```typescript
// Core client
const client = new ZkLoginClient({
  network: 'mainnet' | 'testnet',
  proverUrl: 'https://prover.zklogin.stellaray.fun',
  saltServiceUrl: 'https://salt.zklogin.stellaray.fun',
  googleClientId: 'YOUR_CLIENT_ID',
  contracts: MAINNET_CONTRACTS,
});

// Login flow
const session = await client.initializeSession();       // Generate ephemeral keypair + nonce
const authUrl = client.getAuthorizationUrl('google', redirectUri);
// ... redirect user to authUrl ...
const wallet = await client.completeOAuth('google', code, redirectUri); // Generate ZK proof

// Wallet operations
const address = wallet.getAddress();
const signedTx = await wallet.signTransaction(tx);
await wallet.sendPayment({ to: 'G...', amount: '10', asset: 'XLM' });

// Address derivation (deterministic)
const addressSeed = await computeAddressSeed("sub", googleSub, googleAud, salt);
const address = await deriveZkLoginAddress(issuer, addressSeed);

// React hooks
const { wallet, login, logout, isLoading } = useZkLogin();
const { balance, transactions } = useWallet();

// React components
<LoginButton onSuccess={(wallet) => console.log(wallet.address)} />
<WalletWidget showBalance showTransactions />
```

### Network Configuration

```typescript
// Testnet (live)
const TESTNET_CONTRACTS = {
  zkVerifier: 'CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6',
  jwkRegistry: 'CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I',
  gatewayFactory: 'CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76',
  x402Facilitator: 'CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ',
};

// Mainnet (SCF funding → deployment)
const MAINNET_CONTRACTS = {
  zkVerifier: '[pending mainnet deployment]',
  // ...
};
```

---

## 9. Security Architecture

### Threat Model

| Threat | Mitigation |
|---|---|
| Prover learns user identity | Prover only sees JWT + eph_pk. ZK property: identity in private witness, never transmitted |
| Replay attack (reuse proof) | Nullifier registry in ZK Verifier contract. Each proof contains unique `eph_pk_hash` |
| Session hijacking | Ephemeral keypair expires at `max_epoch` (Stellar ledger). Short-lived by design |
| Salt service compromise | Salt is HMAC of master secret + sub+aud. Compromise reveals salt only; wallet keys require proof generation too |
| JWK key compromise (Google) | JWK Registry allows revocation within one Stellar ledger period |
| Multi-custody share compromise | 2-of-3 Shamir: attacker needs 2 shares. Shares encrypted to guardians' Stellar keys |
| On-chain identity linkage | Poseidon(sub, aud, salt) is one-way. Different aud → different address. Sub never on-chain |

### Cryptographic Primitives

| Primitive | Usage | Standard |
|---|---|---|
| Groth16 | ZK proof system | PLONK paper, BN254 curve |
| BN254 | Elliptic curve for pairings | alt_bn128, EIP-196/197 compatible |
| Poseidon | ZK-friendly hash (address derivation) | Poseidon paper (Grassi et al.) |
| Blake2b | Stellar address derivation | RFC 7693 |
| HMAC-SHA256 | Salt derivation | RFC 2104 |
| Shamir GF(256) | Multi-custody secret sharing | secrets.js-grempe |
| RSA-PKCS1v15 | Google JWT signature (verified in ZK) | RFC 8017 |

---

## 10. Performance Benchmarks

### ZK Login Flow

| Step | Time | Location |
|---|---|---|
| Ephemeral keypair generation | <10ms | Browser |
| Google OAuth redirect + auth | ~3s | Google (user action) |
| Salt derivation | ~200ms | Salt Service (network) |
| Proof generation (Groth16) | 2,000–4,000ms | Prover Service (Rust) |
| Soroban transaction build | ~50ms | Browser |
| Stellar network submission | ~500ms | Horizon API |
| Block confirmation | ~5,000ms | Stellar ledger |
| **Total (login + wallet ready)** | **8–10 seconds** | |

### On-Chain Verification

| Metric | Value |
|---|---|
| Gas (with Protocol 25) | ~260,000 instructions |
| Gas (pre-Protocol 25 / WASM) | ~4,100,000 instructions |
| Improvement | **94% reduction** |
| Fee (XLM) | ~0.001 XLM (~$0.03 at $0.30/XLM) |
| Verification time | <100ms Soroban execution |

### Streaming Payments

| Metric | Value |
|---|---|
| Stream creation | 1 Stellar tx (~5s finality) |
| Withdrawal | 1 Stellar tx (~5s finality) |
| Balance calculation | Instant (off-chain formula) |
| Minimum stream duration | 60 seconds |
| Maximum stream duration | 365 days |

---

## 11. Mainnet Migration Plan

### Phase 1: Payment Layer (April 2026)
- Harden streaming escrow contract edge cases (expiry, failed withdrawal, partial cancel)
- Complete integration testing for payment links with one-time-use enforcement
- Publish SDK v2.1 with streaming payment hooks and payment link utilities
- Launch developer playground at stellaray.fun/playground

### Phase 2: Privacy Layer (June 2026)
- Complete integration testing for Near Intent ZK proof gates
- End-to-end testing of multi-custody recovery flow (split, initiate, approve, execute)
- MPC dashboard hardening and testing
- Full documentation portal covering all 3 layers and 26 API endpoints

### Phase 3: Mainnet Deployment (July 2026)
- Trusted setup ceremony for all circuits (Powers of Tau + circuit-specific phase 2)
- Deploy ZK Verifier to Stellar mainnet with production verification key
- Deploy JWK Registry with current Google JWK modulus hashes
- Deploy Gateway Factory, Smart Wallet, x402 Facilitator, and ZK Multi-Custody contracts
- Update SDK MAINNET_CONTRACTS with all deployed addresses
- Security audit (all contracts reviewed before mainnet launch)
- Professional UX testing with 10+ real users
- Public launch targeting 100 unique mainnet wallets in first 30 days

---

## 12. API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/zk/salt` | POST | Get deterministic salt for wallet address derivation |
| `/api/zk/prove` | POST | Generate Groth16 ZK proof (wraps prover service) |
| `/api/zk/verify` | POST | Verify a ZK proof (calls Soroban) |
| `/api/auth/[...nextauth]` | GET/POST | OAuth callback handling (NextAuth) |
| `/api/auth/track` | POST | Track wallet creation events |

### Payment Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/pay/create` | POST | Create shareable payment link |
| `/api/pay/[id]` | GET | Fetch payment link details |
| `/api/pay/history` | GET | User payment link history |
| `/api/streams/create` | POST | Create streaming payment |
| `/api/streams/[id]` | GET | Get stream state + metrics |
| `/api/streams/[id]/withdraw` | POST | Withdraw earned amount |
| `/api/streams/[id]/cancel` | POST | Cancel stream |
| `/api/streams/history` | GET | User stream history |

### ZK Proof Gate Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/zk-proofs/generate` | POST | Generate eligibility/solvency/identity proof |
| `/api/zk-proofs/verify` | POST | Verify proof on-chain via Soroban |

### Multi-Custody Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/multi-custody/create` | POST | Create multi-custody wallet (split shares) |
| `/api/multi-custody/initiate` | POST | Initiate recovery request |
| `/api/multi-custody/approve` | POST | Guardian approves recovery |
| `/api/multi-custody/execute` | POST | Execute recovery (2-of-3 threshold met) |
| `/api/multi-custody/pending` | GET | List pending recovery requests |

### Analytics & Monitoring

| Endpoint | Method | Description |
|---|---|---|
| `/api/xray/status` | GET | Protocol 25 host function availability |
| `/api/xray/metrics` | GET | ZK proof performance metrics |
| `/api/xray/events` | GET | Recent ZK events on Stellar |
| `/api/admin/stats` | GET | Platform-wide statistics |

---

## Appendix: Stellar-Specific Technical Choices

### Why Stellar for ZK Infrastructure?

1. **Protocol 25 native BN254**: No other L1 with a similarly active developer community provides native BN254 pairing operations inside its smart contract VM. This enables 94% gas savings vs WASM-based verification.

2. **5-second finality**: Critical for UX. A ZK login that waits 12-60 seconds for confirmation (Ethereum/Solana) is unusable. Stellar's 5-second finality makes the 8-10 second total login time feel like a standard web OAuth flow.

3. **Stellar's multi-sig + account model**: The Smart Wallet contract leverages Stellar's native signer framework, where ZK proof verification replaces the traditional seed phrase signer. This integrates cleanly with Stellar's existing account abstraction.

4. **XDR encoding**: Groth16 proof elements (G1/G2 points as `BytesN<32>` and `BytesN<64>`) map cleanly to Stellar's XDR binary format. This keeps transaction sizes minimal (~480 bytes for a full proof).

5. **Soroban storage**: The nullifier registry and JWK registry benefit from Soroban's persistent storage with explicit TTL, enabling efficient replay protection without unbounded state growth.

---

*Document version: 1.0 — March 2026*
*For questions: adwaitkeshari288@gmail.com*
*GitHub: https://github.com/Adwaitbytes/StellaRay*
