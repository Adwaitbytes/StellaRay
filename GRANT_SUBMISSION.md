# StellaRay

## Introduction

| Field | Details |
|-------|---------|
| Legal Entity Name | StellaRay |
| Project Name | StellaRay |
| Country of Formation | India |
| Applicant Name | Yatharth Tripathi |
| Applicant Role | Co-Founder & Technical Lead |
| Applicant Email | tripathiyatharth257@gmail.com |
| Primary Category/Vertical | DeFi / Privacy Infrastructure / Developer Tools |
| Development Stage | Testnet. Fully functional: zkLogin, payments, streaming, ZK proofs, SDK playground, explorer, admin dashboard. Live at stellaray.fun |
| Integration Type | Native Stellar (5 Soroban smart contracts on Protocol 25, Horizon API, Stellar SDK) |
| Website | https://stellaray.fun |
| Twitter | https://x.com/stellaraydotfun |
| Mainnet Address | Testnet. Mainnet deployment is Milestone 2. Contract addresses listed in Contract Overview. |
| Onchain Analytics | Admin dashboard at stellaray.fun/admin. Stellar Expert links for all contracts below. |


## Definitions, Acronyms, and Abbreviations

| Term | Meaning |
|------|---------|
| zkLogin | ZK login converting Google/Apple OAuth into self custody Stellar wallets without exposing identity on chain |
| Near Intent | ZK proof verifying a user is ready to act on chain (can pay, meets criteria, has active stream) without revealing private data. Unique to StellaRay. |
| BN254 | Elliptic curve for Groth16 verification. Native on Protocol 25 (CAP 0074), 94% gas savings. |
| Poseidon | ZK friendly hash over BN254 scalar field. Native on Protocol 25 (CAP 0075), 90% gas savings. |
| Groth16 | ZK proof system producing constant 256 byte proofs. Used for zkLogin and intent proofs. |
| Protocol 25 (X Ray) | Stellar's Jan 2026 upgrade adding native BN254 and Poseidon host functions to Soroban. |
| x402 | HTTP 402 Payment Required protocol for Stellar micropayments. |


## Proposal Summary

### Company Description

StellaRay is a two person team building the zero knowledge infrastructure layer for Stellar. We are the first and only project using Protocol 25's native BN254 and Poseidon for production grade ZK proof verification on chain.

What exists today, built with zero external funding: 5 deployed Soroban contracts, a TypeScript SDK (57+ exports), a live demo app (17 pages, 26 API endpoints), a ZK proof pipeline, a salt service, an SDK playground, a block explorer, and an admin dashboard.

Users sign in with Google and get a Stellar wallet in under 10 seconds. No seed phrases. No extensions. No identity on chain. Full self custody.

Now we are building Near Intent: ZK proofs that verify whether a user is ready to act on chain (has balance, meets eligibility, has active stream) without revealing anything. This exists on no other blockchain.

### Product Description

**Layer 1: ZK Wallet via zkLogin (Built and Deployed)**

Google OAuth login. Groth16 proof verifies the token on chain without exposing identity. Deterministic wallet derived via Poseidon hashing. Same Google account = same wallet every time. Ephemeral session keys for signing, destroyed on logout. First login: 8 to 10 seconds. Return login: 3 to 5 seconds.

**Layer 2: Payment Infrastructure (Built and Deployed)**

Payment Links: Shareable URLs with QR codes, tracking, expiration. 0.3% fee.
Streaming Payments: Continuous streams with linear, cliff, exponential, stepped curves. Escrow based. 0.1% fee.
x402 Micropayments: HTTP 402 protocol. Server requests payment, SDK pays automatically, retries with proof.
Block Explorer: Built in Stellar explorer with real time search.

**Layer 3: ZK Near Intent SDK (New, This Grant)**

The feature that makes StellaRay unique across ALL blockchains.

Today when a dApp asks "Can this user afford 100 USDC?" there are two options: trust the user (insecure) or read their balance publicly (destroys privacy). Near Intent creates option three: a ZK proof that says "YES" with cryptographic certainty, leaking zero information.

Three types planned:
Balance Intent: Proves balance exceeds threshold without revealing the amount.
Eligibility Intent: Proves user meets criteria (KYC, accreditation, age) without revealing data.
Stream Intent: Proves active stream exists without revealing amounts or participants.

All reuse existing Groth16 infrastructure. Same BN254 pairing. Same Poseidon. Different circuit, zero changes to verification layer.


## Team & Experience

### Founding Team

**Yatharth Tripathi: Co-Founder & Technical Lead**
ZK cryptography, Stellar/Soroban contracts, protocol engineering. Designed the entire ZK proof system: Groth16 verifier (Protocol 25 BN254 pairing), Poseidon identity commitments, deterministic wallet derivation, ephemeral key architecture. Wrote all 5 Soroban contracts. Built SDK playground and developer tools.
GitHub: https://github.com/YatharthTripathi
LinkedIn: https://www.linkedin.com/in/yatharth-urmaliya-509014234/

**Adwait Keshari: Co-Founder & Product Lead**
Frontend architecture, product design, developer experience. Built the complete user product: dashboard, payment links, streaming UI, ZK proof generation UI, admin analytics, waitlist system, block explorer. Authored the whitepaper. Owns SDK developer experience and documentation.
GitHub: https://github.com/Adwaitbytes
LinkedIn: https://www.linkedin.com/in/adwait-keshari-b5793b294/

### What We Have Already Built (Self Funded, $0 External)

| Component | Status | Details |
|-----------|--------|---------|
| ZK Verifier Contract | Deployed | Groth16 + Protocol 25 BN254 pairing. 260,000 gas. |
| Smart Wallet Contract | Deployed | zkLogin auth, session management, ephemeral keys. |
| Gateway Factory Contract | Deployed | CREATE2 style deterministic wallet deployment. |
| JWK Registry Contract | Deployed | On chain Google JWKs. RSA modulus in 17x121 bit chunks. |
| x402 Facilitator Contract | Deployed | HTTP 402 micropayments with nonce + fee management. |
| TypeScript SDK | Published | 57+ exports. ZkLoginClient, StreamingClient, React hooks. |
| Demo Application | Live | 17 routes, 26 API endpoints. stellaray.fun |
| zkLogin Circuit | Compiled | ~1.1M constraints (SHA-256 66%, RSA 14%, JWT 10%, Poseidon 5%). |
| Whitepaper | Published | 12 sections, security analysis, benchmarks, 10 references. |

15,000+ lines of code. Rust, TypeScript, React, Circom. Zero dollars of outside money.

### Previous Funding

None. Entirely self funded. We want grant funding because StellaRay is public infrastructure: open source contracts, public npm SDK, MIT licensed circuits. Ecosystem alignment over equity optimization.

| Detail | Value |
|--------|-------|
| Team Size | 2 |
| Years in Business | < 2 years |
| Soroban Experience | Intermediate to Advanced (5 contracts using Protocol 25 native host functions) |


## Core Thesis & Team Conviction

**Why this problem matters:** 68% of wallet app users abandon before setup (ConsenSys, 2024). Seed phrases are hostile UX. Public blockchains expose every transaction. StellaRay eliminates both: Google sign in for onboarding, ZK proofs for privacy.

**Why Stellar specifically:** Protocol 25 added native BN254 and Poseidon host functions (CAP 0074, CAP 0075). Before: Groth16 verification cost 4,100,000 gas in WASM. After: 260,000 gas natively. That 94% reduction is why StellaRay works as a product. Stellar is the only mature payments chain where native ZK host functions were recently added. We are building on the exact capability SDF invested in creating.

**Why Near Intent matters:** Authentication is table stakes. Intent verification is the new primitive. "Can this user pay 100 USDC?" Currently requires trust or public balance check. StellaRay creates a third option: a ZK proof that says YES with cryptographic certainty, revealing nothing. No other blockchain has this.

**Why our team:** We built the entire platform as two people, self funded. 5 contracts, full SDK, 17 page app, 26 endpoints, ZK pipeline. This is not a pitch. It is a live product at stellaray.fun.


## Funding Justification & Benefits

**1. User Onboarding:** SDK gives any Stellar dApp Google/Apple sign in. 3 lines of code. 2B+ Google accounts become potential Stellar wallets.

**2. Protocol 25 Validation:** First production use of native BN254/Poseidon. Proves the upgrade works and enables new application categories.

**3. Privacy Primitive:** Near Intent gives every Stellar dApp composable privacy. Call verifyIntent(), get a cryptographic boolean. Private lending, anonymous donations, confidential payroll.

**4. Competitive Edge:** Existing auth solutions use MPC or custodial key management. StellaRay brings true ZK authentication plus intent verification, making Stellar the only chain where you prove readiness without revealing anything.

### Revenue Model (Self Sustaining Post Grant)

Transaction fees: 0.3% payment links, 0.1% streams, 0.5% transfers (in smart contracts).
Subscriptions: Free / $9 Pro / $49 Business tiers with usage limits.
Pay per proof: $0.05 to $0.50 per ZK proof beyond tier limits.

### KPIs

| Metric | 3 Mo | 6 Mo | 12 Mo |
|--------|------|------|-------|
| zkLogin Wallets | 500 | 2,000 | 10,000 |
| Monthly Active Users | 200 | 1,000 | 5,000 |
| Monthly Transactions | 1,000 | 10,000 | 100,000 |
| SDK Downloads | 500 | 2,000 | 10,000 |
| dApp Integrations | 5 | 15 | 50 |
| Intent Proofs Verified | 0 | 5,000 | 50,000 |
| Transaction Volume | $10K | $100K | $1M |


## Funding Structure: Disbursement Milestones

| # | Milestone | Triggers | Amount | Month |
|---|-----------|----------|--------|-------|
| 0 | Upfront Payment | Contract signed. Security audit firm engaged. Intent circuit design started. Audit scope and intent architecture documents delivered. | $20,000 | 0 |
| 1 | Security Audit Complete | Audit report delivered. Zero critical/high findings. All medium addressed. 100% test coverage on critical paths. Bug bounty launched. 50+ testnet wallets. | $35,000 | 2 |
| 2 | Mainnet + Intent MVP | 5 contracts on mainnet (verified source). Live mainnet zkLogin. x402 payments on mainnet. Intent Verifier on testnet. Balance circuit compiled. SDK v3.0 with intent module. 500+ wallets. Apple Sign In live. | $40,000 | 4 |
| 3 | Intent Production + Growth | Intent contracts on mainnet. 3 intent types live. Intent gated x402 payments. React hooks (useIntent). 10+ dApp integrations. 1,000+ MAU. $50K+ volume. Decentralized prover MVP. Docs + workshop done. | $55,000 | 6 |
| | **Total** | | **$150,000** | |


## Deliverables High Level Overview

**Phase 1 (Months 1 to 2): Security.** Audit all 5 contracts (~2,550 lines Rust) + SDK (~3,200 lines TS). Fix all findings. Bug bounty. Intent circuit design.

**Phase 2 (Months 3 to 4): Mainnet + Intent MVP.** Deploy zkLogin to mainnet. Intent Verifier on testnet. Balance circuit compiled. SDK v3.0. Apple Sign In.

**Phase 3 (Months 5 to 6): Intent Production.** 3 intent types on mainnet. Intent gated x402. React hooks. 10+ integrations. Docs, tutorials, workshop.


## Deliverables

### Deliverable 1: Security Audit
Third party audit (Trail of Bits, Halborn, OtterSec) of all 5 contracts and SDK. Scope: Groth16 pairing check, __check_auth, address prediction, JWK management, x402 lifecycle, key derivation. Acceptance: Zero critical/high findings, 100% critical path coverage, bug bounty active.

### Deliverable 2: Mainnet Deployment
All 5 contracts on mainnet with verified source. Live Google OAuth creating mainnet wallets. Payments, streams, x402 functional. SDK published with mainnet addresses. Monitoring operational.

### Deliverable 3: Near Intent Verifier Contract
New Soroban contract for intent proofs. Methods: verify_intent(proof, public_inputs), register_intent(commitment, expiry), is_intent_valid(commitment), revoke_intent(commitment). Same Groth16 algorithm, different VK. Target: ~280,000 gas.

### Deliverable 4: Balance Intent Circuit
Circom circuit proving balance >= threshold without revealing balance. Public inputs: intentHash (Poseidon of type + threshold + expiry), addressCommitment (Poseidon of addressSeed), expiryEpoch. Private: balance, threshold, addressSeed, salt. Constraints: range check, identity binding, commitment correctness. Target: under 3 seconds in browser.

### Deliverable 5: Intent SDK Module
IntentClient with proveBalanceIntent(), proveEligibilityIntent(), proveStreamIntent(), verifyIntent(), revokeIntent(). React hook useIntent(). TypeScript strict mode. Published in @stellar-zklogin/sdk v3.0. 90%+ test coverage.

### Deliverable 6: Intent Gated x402 Payments
x402 Facilitator extended with optional intent pre check. Flow: 402 response with require_intent flag, SDK auto generates balance proof, server verifies on chain, payment executes. Zero failed transactions from insufficient balance. Backwards compatible.

### Deliverable 7: Documentation
Full API docs, integration guide, 3+ video tutorials, 1+ developer workshop, playground updated with intent examples.


## Architecture Overview

### C4 L1 Diagram: High Level

```
                    +---------------------+
                    |    End Users        |
                    |  (Google/Apple      |
                    |   account holders)  |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    |   StellaRay         |
                    |   ZK Layer          |
                    |                     |
                    |   zkLogin Auth      |
                    |   Near Intent SDK   |
                    |   Payment Infra     |
                    +----------+----------+
                               |
              +----------------+----------------+
              v                v                v
    +---------------+ +--------------+ +--------------+
    |  Google/Apple | |   Stellar    | |  dApp        |
    |  OAuth        | |   Network    | |  Ecosystem   |
    +---------------+ +--------------+ +--------------+
```

### C4 L2 Diagram: System Internals

```
+----------------------------------------------------------------------+
|                           StellaRay ZK Layer                         |
|                                                                      |
|  +-------------+  +--------------+  +--------------+  +------------+ |
|  |  Demo App   |  |  TypeScript  |  |   Prover     |  |   Salt     | |
|  |  (Next.js)  |  |  SDK         |  |   Service    |  |  Service   | |
|  |  17 routes  |  |  57+ exports |  |  Groth16 Gen |  |  HKDF Salt | |
|  +------+------+  +------+-------+  +------+-------+  +------+----+ |
|         |                |                 |                 |       |
|         v                v                 v                 v       |
|  +------------------------------------------------------------------+|
|  |                    Stellar Soroban (Protocol 25)                  ||
|  |                                                                  ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |  | ZK Verifier  |  | Intent       |  | Smart Wallet |            ||
|  |  | (Groth16)    |  | Verifier     |  | (zkLogin)    |            ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |  | JWK Registry |  | Gateway      |  | x402         |            ||
|  |  | (OAuth Keys) |  | Factory      |  | Facilitator  |            ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  +------------------------------------------------------------------+|
+----------------------------------------------------------------------+
```

### Architecture Constraints

**Regulatory:** Selective disclosure, not evasion. Users prove attributes to regulators without revealing all data. No mixing/tumbling.
**Protocol 25:** All ZK verification requires native host functions. Cannot run on pre Protocol 25 Stellar.
**Circuit Immutability:** Groth16 trusted setup is one time. Separate VKs for zkLogin and each intent type for independent updates.
**Browser Proving:** Intent circuits must stay under 3 seconds for client side generation.
**Self Custody:** Keys derived client side. Server never touches private keys. Recovery via Google/Apple account.


## Contract Overview

### Deployed Contracts (5, Stellar Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| ZK Verifier | CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6 | Groth16 verification via Protocol 25 BN254 pairing. 260K gas. |
| Smart Wallet | (deployed per user) | Custom Soroban account with zkLogin auth + ephemeral session keys. |
| Gateway Factory | CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76 | Deterministic CREATE2 style wallet deployment. |
| JWK Registry | CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I | On chain OAuth provider keys. RSA modulus in 17x121 bit chunks. |
| x402 Facilitator | CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ | HTTP 402 micropayments with nonce management. |

Explorer links: All contracts viewable at stellar.expert/explorer/testnet/contract/{ADDRESS}

### Proposed Contract (This Grant)

**Intent Verifier:** Same Groth16 algorithm as ZK Verifier, configured for intent circuits (3 to 4 public inputs). Methods: verify_intent(), register_intent(), is_intent_valid(), revoke_intent().


## Technology Stack

### Backend

| Tech | Purpose |
|------|---------|
| Rust + Soroban SDK | 6 smart contracts with Protocol 25 host functions |
| Circom 2.1.6 | zkLogin (~1.1M constraints) + intent circuits (<100K target) |
| SnarkJS | Groth16 proving (server + browser) |
| Node.js 20 + Next.js 15 | API routes (26 endpoints) |
| NextAuth.js | Google OAuth 2.0, Apple Sign In |
| Neon PostgreSQL | Serverless DB (users, payments, streams, analytics) |

### Frontend

| Tech | Purpose |
|------|---------|
| Next.js 15 + React 18 | App Router, server components |
| TypeScript (strict) | Zero type errors at build |
| Tailwind CSS | Dark theme design system |
| poseidon-lite | Browser side Poseidon for client proofs |

### Infrastructure

| Tech | Purpose |
|------|---------|
| Vercel | Serverless hosting + CI/CD |
| Stellar Testnet/Mainnet | Soroban RPC + Horizon |
| Neon PostgreSQL | Auto scaling serverless database |
| GitHub Actions | Automated testing pipeline |


## Automated Testing

| Layer | Tool | Target |
|-------|------|--------|
| Contracts | cargo test | 100% critical paths |
| SDK | Vitest | 90% public API |
| Circuits | Circom test framework | 100% constraint satisfaction |
| Integration | E2E test suite | All critical flows |
| Type Safety | tsc --noEmit (strict) | Zero errors (achieved) |


## Integrations

| Service | Type |
|---------|------|
| Google OAuth 2.0 | Primary auth (JWT sub for wallet derivation) |
| Apple Sign In | Secondary auth (Milestone 2) |
| Stellar Horizon + Soroban RPC | Account queries, contract invocation |
| Neon PostgreSQL | Application state |
| Vercel | Hosting + serverless |
| CoinGecko | XLM/USD price feed |


## Additional Documents

| Document | Location |
|----------|----------|
| Source Code | https://github.com/Adwaitbytes/StellaRay |
| Whitepaper | WHITEPAPER.md in repo (12 sections, security analysis, 10 references) |
| Live Demo | https://stellaray.fun |
| Admin Dashboard | stellaray.fun/admin |
| SDK Playground | stellaray.fun/playground |
| SDK Docs | stellaray.fun/sdk |
| Explorer | stellaray.fun/explorer |
| Pricing | stellaray.fun/pricing |

### Performance

| Metric | Before Protocol 25 | After Protocol 25 |
|--------|--------------------|--------------------|
| Groth16 Verification | 4,100,000 gas | 260,000 gas (94% reduction) |
| Poseidon Hash | 85,000 gas | 12,000 gas (86% reduction) |

| Metric | Value |
|--------|-------|
| Proof Size | 256 bytes (constant) |
| First Login | 8 to 10 seconds |
| Return Login | 3 to 5 seconds |
| On Chain Verification | ~12 ms |

### What Makes StellaRay Different

Existing wallet auth solutions fall into two categories: MPC based (keys split across servers, not true self custody) and browser extension based (seed phrases, hostile UX). StellaRay is neither. It uses ZK proofs to convert OAuth tokens into self custody wallets with zero identity on chain.

Beyond authentication, StellaRay introduces a completely new primitive: Near Intent verification. No blockchain ecosystem has ZK proofs that verify user readiness (balance, eligibility, active stream) without revealing private data. This is not an improvement on an existing pattern. It is a new category of on chain capability, built natively on Stellar Protocol 25.


## Traction & Validation

### Current Testnet Metrics

*Real-time metrics available at stellaray.fun/admin (API: /api/admin/stats)*

| Metric | Count | Description |
|--------|-------|-------------|
| zkLogin Wallets Created | Live | Unique Stellar wallets via Google OAuth |
| Total Authentications | Live | Total zkLogin sessions (includes return visits) |
| ZK Proofs Generated | Live | All proof types: zkLogin, balance intent, eligibility |
| Multi-Custody Wallets | Live | ZK multi-sig wallets with anonymous guardians |
| Payment Links Created | Live | Shareable payment URLs with tracking |
| Streaming Payments | Live | Active and completed payment streams |

### Technical Validation

| Validation Point | Evidence |
|-----------------|----------|
| Protocol 25 Native Usage | First project using CAP-0074 BN254 + CAP-0075 Poseidon in production |
| Gas Efficiency | 94% reduction verified: 4.1M gas (WASM) to 260K gas (native) |
| Proof Performance | 8-10 second first login, 3-5 second return login in browser |
| Code Quality | 15,000+ LOC, TypeScript strict mode, zero build errors |
| Self-Funded Commitment | $0 external funding, 2-person team, 6+ months development |

### Community Interest

| Channel | Status |
|---------|--------|
| Stellar Discord | Active contributor, zkLogin discussions |
| Twitter/X | @stellaraydotfun - Protocol 25 technical content |
| GitHub | Public repo with full source, MIT licensed |

### Integration Interest

*Partner commitments for post-grant integrations:*

| Partner Type | Interest |
|--------------|----------|
| Stellar dApps | zkLogin SDK for passwordless auth |
| DeFi Protocols | Near Intent for private balance verification |
| Payment Platforms | x402 micropayments with intent gating |

### Why Traction Matters

StellaRay is not vaporware. The demo at stellaray.fun is live, functional code. Every metric above is tracked in real-time via our admin dashboard. We are asking for funding to take proven testnet infrastructure to mainnet with a security audit, not to build something speculative.

### Demo Video

A 60-second demonstration of zkLogin is available showing:
1. Google Sign-In to Stellar wallet creation (8 seconds)
2. Zero seed phrases, zero extensions
3. Protocol 25 ZK proof generation
4. Real Stellar address on explorer

*Video link: [To be added upon SCF submission]*
