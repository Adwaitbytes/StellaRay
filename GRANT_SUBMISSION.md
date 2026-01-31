# StellaRay

## Introduction

| Field | Details |
|-------|---------|
| Legal Entity Name | StellaRay |
| Project Name (if different) | StellaRay |
| Country of Formation | India |
| Applicant Name | Yatharth Tripathi |
| Applicant Role | Co-Founder & Technical Lead |
| Applicant Email | tripathiyatharth257@gmail.com |
| Primary Category/Vertical | DeFi / Privacy Infrastructure / Developer Tools |
| Development Stage | Testnet. Fully functional product with Google OAuth ZK login, payment links, streaming payments, ZK proof generation, interactive SDK playground, block explorer, and admin dashboard. Live at stellaray.fun |
| Integration Type | Native Stellar (5 Soroban smart contracts using Protocol 25 X Ray BN254 and Poseidon host functions, Horizon API, Stellar SDK) |
| Website | https://stellaray.fun |
| Twitter | https://x.com/stellaraydotfun |
| Mainnet Address (if any) | Currently on Testnet. Mainnet deployment is a milestone deliverable. All 5 contract addresses listed in Contract Overview below. |
| Onchain Analytics (if any) | Testnet phase. Built in admin analytics dashboard at stellaray.fun/admin with user tracking, transaction monitoring, and proof generation metrics. Stellar Expert explorer links for all deployed contracts provided in Contract Overview. |


## Definitions, Acronyms, and Abbreviations

| Term | Meaning |
|------|---------|
| zkLogin | Zero knowledge login system that converts Google/Apple OAuth credentials into self custody Stellar wallets without exposing identity on chain |
| Near Intent | A new class of ZK proof that verifies a user is ready to perform an on chain action (can afford a payment, meets eligibility criteria, has an active stream) without revealing identity, balance, or history. This is StellaRay's unique contribution and exists on no other blockchain. |
| BN254 | The elliptic curve (also called alt_bn128) used for Groth16 proof verification. Natively supported by Protocol 25 via CAP 0074, reducing verification gas by 94%. |
| Poseidon | ZK friendly algebraic hash function operating over the BN254 scalar field. Natively supported by Protocol 25 via CAP 0075, reducing hashing gas by 90%. |
| Groth16 | The zero knowledge proof system producing 256 byte constant size proofs regardless of statement complexity. Used for both zkLogin authentication and near intent proofs. |
| Protocol 25 (X Ray) | Stellar's January 2026 protocol upgrade that added native Soroban host functions for BN254 elliptic curve arithmetic and Poseidon hash permutations. This is the technical foundation that makes StellaRay possible. |
| x402 | Implementation of HTTP 402 (Payment Required) for micropayments on Stellar. Servers respond with 402, client pays via Stellar, server delivers resource. |
| Soroban | Stellar's WebAssembly based smart contract platform. |
| Ephemeral Key | A short lived Ed25519 key pair generated per session for transaction signing. Destroyed when the session ends. |
| Address Seed | Poseidon(sub, aud, salt), a deterministic value derived from OAuth identity that maps to a unique Stellar wallet address. Same Google account always produces the same wallet. |
| Nullifier | A hash derived from proof public inputs, stored on chain to prevent replay attacks. |
| JWK | JSON Web Key. The public key format used by Google and Apple to sign OAuth tokens. Stored on chain in the JWK Registry contract. |


## Proposal Summary

### Company Description

StellaRay is a two person team building the zero knowledge infrastructure layer for Stellar. We are the first and currently only project using Stellar Protocol 25's native BN254 and Poseidon host functions for production grade ZK proof verification on chain.

We have already built and deployed: 5 Soroban smart contracts on testnet, a TypeScript SDK with 57+ exports and React hooks, a complete demo application with 17 pages and 26 API endpoints, a ZK proof generation pipeline, a privacy preserving salt service, an interactive SDK playground for developers, a built in block explorer, and an admin analytics dashboard.

All of this was built by two people with zero external funding.

Our system lets users sign in with Google and get a fully functional Stellar wallet in under 10 seconds. No seed phrases. No browser extensions. No identity exposed on chain. Full self custody.

Now we are building something that does not exist on any blockchain: Near Intent proofs. These are ZK proofs that verify whether a user is ready to act on chain (has enough balance, meets eligibility, has an active payment stream) without revealing any private information. This transforms StellaRay from an authentication tool into the complete privacy infrastructure layer for every Stellar dApp.

### Product Description

StellaRay is a full stack privacy and payments platform on Stellar. It has three layers, two of which are already built and deployed.

**Layer 1: ZK Wallet via zkLogin (Built and Deployed)**

Users sign in with Google OAuth. A Groth16 zero knowledge proof verifies the OAuth token on chain without exposing who the user is. A deterministic wallet address is derived from the OAuth identity using Poseidon hashing. The same Google account always produces the same Stellar wallet. Session based ephemeral keys handle transaction signing and are destroyed when the session ends.

The entire flow takes 8 to 10 seconds on first login and 3 to 5 seconds on return visits. The user never sees a seed phrase, never installs an extension, and never loses custody.

**Layer 2: Payment Infrastructure (Built and Deployed)**

Payment Links: Shareable URLs that let anyone pay a Stellar address. Created via authenticated API, tracked in database with view counts, expiration, status, and QR codes. Platform fee of 0.3% per transaction.

Streaming Payments: Real time continuous payment streams between Stellar addresses. Supports four distribution curves: linear (proportional over time), cliff (nothing until a date, then linear), exponential (front loaded), and stepped (periodic disbursements). Configurable flow rates, cancellation with automatic settlement of vested vs unvested funds. Platform fee of 0.1%.

x402 Micropayments: Implementation of HTTP 402 (Payment Required) protocol. Servers respond with 402 and payment requirements. Client SDK automatically parses the requirement, executes Stellar payment, and retries with proof of payment. Enables pay per API call, pay per article, pay per download.

Block Explorer: Built in Stellar transaction explorer with real time search across accounts, transactions, and ledgers.

**Layer 3: ZK Near Intent SDK (New, Proposed for This Grant)**

This is the feature that makes StellaRay unique across all blockchains. Not just Stellar. All of them.

Today, when a dApp needs to know "Can this user afford 100 USDC?", it has two options. Option one: trust the user's claim (insecure). Option two: read their balance on chain (destroys privacy).

Near Intent introduces option three: a ZK proof that says "YES, this user can afford 100 USDC" verified cryptographically on chain, with zero information leaked about who they are or what their actual balance is.

Three intent types are planned:

Balance Intent: Proves a user's wallet balance exceeds a threshold without revealing the actual balance. Uses a Circom circuit with Poseidon commitments binding the proof to the user's zkLogin identity.

Eligibility Intent: Proves a user meets specific criteria (minimum account age, KYC status, accredited investor, geographic restriction) without revealing any personal data.

Stream Intent: Proves an active payment stream exists with a minimum flow rate without revealing the stream amount, sender, or recipient.

All three types reuse the existing Groth16 verification infrastructure. Same BN254 pairing check. Same Protocol 25 host functions. Same Poseidon hashing. Different circuit, different verification key, zero changes to the on chain verification layer.

The practical impact: any Stellar dApp can call verifyIntent(proof) and get a boolean answer backed by cryptographic proof. Private lending qualification. Anonymous donation verification. Confidential payroll confirmation. Compliant yet private institutional transactions.


## Team & Experience

### Founding Team (& Board Members)

**Yatharth Tripathi: Co-Founder & Technical Lead**

Full stack blockchain developer specializing in ZK cryptography, Stellar/Soroban smart contract development, and protocol level engineering. Designed and implemented StellaRay's entire ZK proof system: the Groth16 verifier contract using Protocol 25 native BN254 pairing operations, the Poseidon based identity commitment scheme, the deterministic wallet derivation from OAuth tokens, and the session based ephemeral key architecture. Wrote all 5 Soroban smart contracts (ZK Verifier, Smart Wallet, Gateway Factory, JWK Registry, x402 Facilitator). Built the SDK playground, interactive developer tools, and API reference system.

GitHub: https://github.com/YatharthTripathi
LinkedIn: https://www.linkedin.com/in/yatharth-tripathi/

**Adwait Keshari: Co-Founder & Product Lead**

Full stack developer specializing in frontend architecture, product design, developer experience, and system integration. Built StellaRay's complete user facing product: the dashboard with real time balance and transaction tracking, the payment link creation and management system, the streaming payments interface with curve visualization, the ZK proof generation UI, the admin analytics dashboard, the waitlist and onboarding system, and the block explorer. Authored the StellaRay whitepaper. Responsible for SDK developer experience, documentation, and the integration testing pipeline.

GitHub: https://github.com/Adwaitbytes
LinkedIn: https://www.linkedin.com/in/adwait-keshari-b5793b294/

### What We Have Already Built (Self Funded)

This is not a pitch deck. This is a working product. Here is what exists today, deployed and functional on Stellar testnet:

| Component | Status | Details |
|-----------|--------|---------|
| ZK Verifier Contract | Deployed | Groth16 verification with Protocol 25 native BN254 pairing. 260,000 gas per verification. |
| Smart Wallet Contract | Deployed | Custom Soroban account with zkLogin auth, session management, ephemeral key signing. |
| Gateway Factory Contract | Deployed | Deterministic wallet deployment with CREATE2 style address prediction. |
| JWK Registry Contract | Deployed | On chain Google JWK storage. RSA modulus chunked into 17x121 bit pieces for BN254 compatibility. |
| x402 Facilitator Contract | Deployed | HTTP 402 micropayment protocol with nonce management and fee collection. |
| TypeScript SDK | Published | 57+ exports. ZkLoginClient, StreamingClient, X402PaymentClient, React hooks, crypto utilities. |
| Demo Application | Live | 17 routes, 26 API endpoints. Dashboard, payments, streams, explorer, ZK proofs, SDK playground, admin. |
| zkLogin Circuit | Compiled | ~1.1M constraint Circom circuit. SHA-256 (66%), RSA-2048 (14%), JWT parsing (10%), Poseidon (5%). |
| Whitepaper | Published | 12 section technical paper with security analysis, performance benchmarks, and 10 academic references. |

Total lines of code: ~15,000+ across Rust contracts, TypeScript SDK, React frontend, and Circom circuits.
Total external funding received: $0.

### Previous Funding

None. StellaRay has been entirely self funded and bootstrapped from day one. Every line of code, every deployed contract, every page of the demo application was built without grants, VC investment, or foundation support.

We are seeking grant funding specifically because StellaRay is public infrastructure for the Stellar ecosystem. The ZK Verifier contract is open source and usable by any Stellar project. The SDK is a public npm package. The intent circuits will be published under MIT license. We want ecosystem alignment, not equity optimization.

| Detail | Value |
|--------|-------|
| Team Size | 2 (less than 5) |
| Years in Business | Less than 2 years |
| Soroban Language Experience | Intermediate to Advanced (5 deployed contracts using Protocol 25 native host functions) |


## Core Thesis & Team Conviction

### Why This Problem Matters

Crypto has a UX crisis that has persisted for over a decade. The data tells the story:

68% of users who download a wallet app abandon it before completing setup (ConsenSys, 2024). The reason is not apathy. It is that the setup process asks normal people to write down 24 random words, store them in a "safe place" that is somehow both accessible and secure, and understand that losing those words means losing their money forever. This is a hostile user experience.

And the users who do make it through wallet setup face a second problem: every transaction they make is visible to everyone. Public blockchains expose your entire financial life. Your salary, your purchases, your savings, your debts. All public. This is not a feature. It is a fundamental design failure that makes serious financial use cases impossible.

StellaRay solves both problems at the protocol level:

No seed phrases. Users sign in with Google. Their wallet address is deterministically derived from their OAuth identity using zero knowledge proofs. If they lose their device, they sign in from any browser and get the same wallet with all balances intact.

No extensions. The entire authentication flow uses standard OAuth redirects. No MetaMask. No Freighter. No downloads. Three lines of SDK code to integrate.

No exposure. ZK proofs ensure that the Google identity (email, name, user ID) never appears on chain. The proof says "I have a valid JWT from Google" without revealing which user. Near intent proofs extend this to "I can afford this payment" without revealing the balance.

### Why Stellar

This is not a generic "Stellar has low fees" argument. StellaRay exists on Stellar for one specific technical reason.

In January 2026, Stellar activated Protocol 25 (X Ray). This upgrade added native Soroban host functions for BN254 elliptic curve arithmetic (CAP 0074) and Poseidon hash permutations (CAP 0075). These two primitives are the mathematical foundation of every modern ZK proof system.

Before Protocol 25, verifying a single Groth16 proof on Stellar required executing BN254 pairing computations in WASM. That cost approximately 4,100,000 gas per verification. At that price, ZK authentication was a research curiosity.

After Protocol 25, the same verification costs 260,000 gas. That is a 94% reduction. That single number is why StellaRay works as a real product and not just a whitepaper.

No other blockchain upgrade has created this specific opportunity for a ZK authentication layer. Sui has zkLogin but it was designed into the chain from the start. Ethereum L2s have ZK verification but require bridging and unpredictable gas. Stellar is the only chain where native ZK host functions were recently added to an already mature, low cost, real world payments network.

We are building on the exact capability that the Stellar Development Foundation invested in creating. StellaRay is the proof that Protocol 25 works, is efficient, and enables entirely new categories of applications.

### Why Near Intent is the Killer Feature

Authentication is table stakes. Every project eventually figures out how to make login easier. What nobody has figured out is intent verification.

When a dApp asks "Can this user pay 100 USDC?" today, the answer requires either trust (insecure) or a public balance check (privacy destroying). There is no third option on any blockchain.

StellaRay creates that third option. A ZK proof that says "YES" with cryptographic certainty, while revealing absolutely nothing about who the user is or how much they actually have.

This is not a theoretical concept we are proposing. It is a direct extension of the Groth16 verifier contract that is already deployed on testnet. Same pairing check function. Same BN254 curve. Same Poseidon hash. Different circuit, different verification key, same infrastructure. The hard part is already done.

### Why Our Team

We built the entire platform as two people. Five smart contracts. A full SDK. A 17 page application with 26 API endpoints. A ZK proof generation pipeline. All self funded.

We are not pitching an idea. We are pitching a product that works today on Stellar testnet with real Google OAuth, real Stellar transactions, and real ZK proof generation. Anyone can go to stellaray.fun right now, sign in with Google, and have a Stellar wallet in seconds.

Our conviction comes from being builders who felt the pain firsthand. We tried to onboard non technical users to Stellar. The seed phrase killed it every time. We tried to build privacy preserving applications on Stellar. There was no infrastructure. So we built it ourselves.


## Funding Justification & Benefits

StellaRay creates measurable value for the Stellar ecosystem in four ways.

**1. User Onboarding at Scale**

Every Stellar dApp that integrates StellaRay's SDK gains Google and Apple sign in for their users. This removes the number one barrier to Stellar adoption: wallet creation. Our SDK requires 3 lines of code to integrate. Any developer can add ZK authenticated wallets in an afternoon. This directly grows Stellar's user base by making every Google account holder (2B+ people) a potential Stellar wallet owner.

**2. Protocol 25 Showcase and Validation**

StellaRay is the first production use case for Protocol 25 native BN254 and Poseidon. Our implementation proves that these primitives work, are efficient (94% gas savings on Groth16 verification, 90% on Poseidon hashing), and enable application categories that were impossible before. This validates the Stellar Development Foundation's investment in Protocol 25 and creates a reference implementation that other projects can learn from.

**3. New Privacy Primitive for the Ecosystem**

Stellar currently has no privacy layer. StellaRay's ZK proof system (and specifically Near Intent proofs) creates composable privacy infrastructure that any Stellar dApp can use. Instead of building custom privacy solutions, developers call verifyIntent() and get a cryptographically backed boolean. Private lending. Anonymous donations. Confidential payroll. Compliant yet private institutional transactions. All become possible for the first time on Stellar.

**4. Competitive Differentiation for Stellar**

Sui has zkLogin. No other major blockchain has ZK intent verification. StellaRay gives Stellar a capability that is unique across the entire industry: the only blockchain where you can prove readiness to act without revealing anything about yourself. This is a real differentiator when Stellar competes for developer mindshare and institutional adoption.

### Revenue Model and Sustainability

StellaRay is designed to be self sustaining after the grant period. We have three revenue streams:

**Transaction Fees**
0.3% on payment links. 0.1% on streaming payments. 0.5% on cross border transfers. These fees are built into the smart contracts and collected automatically.

**Subscription Tiers**
Free tier: 1 wallet, 10 transactions/day, 20 ZK proofs/month, testnet only.
Pro tier ($9/month): Unlimited wallets and transactions, 500 ZK proofs/month, mainnet access, streaming payments.
Business tier ($49/month): Everything in Pro plus SDK API access, white label option, unlimited ZK proofs, custom branding, SLA guarantee.

**Pay Per Proof**
Beyond tier limits, proofs are priced individually: $0.05 for solvency, $0.10 for identity, $0.15 for eligibility, $0.10 for history, $0.50 for custom proofs.

This model means that as Stellar grows and more dApps integrate StellaRay, revenue scales with usage. We do not need ongoing grants to survive.

### Measurable KPIs We Commit To

| Metric | 3 Months Post Mainnet | 6 Months Post Mainnet | 12 Months Post Mainnet |
|--------|----------------------|----------------------|----------------------|
| Unique zkLogin Wallets | 500 | 2,000 | 10,000 |
| Monthly Active Users | 200 | 1,000 | 5,000 |
| Monthly Transactions | 1,000 | 10,000 | 100,000 |
| SDK npm Downloads | 500 | 2,000 | 10,000 |
| Third Party dApp Integrations | 5 | 15 | 50 |
| Intent Proofs Verified On Chain | 0 (building) | 5,000 | 50,000 |
| Transaction Volume (USD equivalent) | $10,000 | $100,000 | $1,000,000 |
| Developer Community Members | 100 | 500 | 2,000 |


## Funding Structure: Disbursement Milestones

| # | Milestone Type | Trigger and Quantitative Metrics | Amount (USD) | Expected Completion |
|---|---------------|----------------------------------|-------------|-------------------|
| 0 | Upfront Payment (at Effective Date) | Contract signed. Team engages security audit firm (Trail of Bits, Halborn, or equivalent). Near Intent circuit research and design begins. Audit scope document delivered. Intent circuit architecture document published. | $20,000 | Month 0 |
| 1 | Security Audit Complete | Audit report delivered by recognized security firm. Zero critical or high severity findings remaining. All medium findings addressed or accepted with documented rationale. 100% test coverage on critical contract paths. Bug bounty program launched and published. At least 50 testnet wallets created during audit testing period. | $35,000 | Month 2 |
| 2 | Mainnet Deployment + Near Intent MVP | All 5 existing contracts deployed to Stellar mainnet with verified source code. Live Google OAuth login creating real mainnet wallets. Token transfers and x402 payments functional on mainnet. Near Intent Verifier contract deployed to testnet. Balance Intent Circom circuit compiled with proving and verification keys generated. SDK v3.0 published to npm with intent module. 500+ unique wallet creations across testnet and mainnet. Apple Sign In integration live. | $40,000 | Month 4 |
| 3 | Intent SDK Production + Ecosystem Growth | Near Intent contracts deployed to mainnet. All 3 intent types operational (balance, eligibility, stream). Intent gated x402 payments live in production. SDK includes React hooks for intent UI (useIntent, useBalanceProof). 10+ third party dApp integrations using StellaRay SDK. 1,000+ monthly active users. $50,000+ in cumulative transaction volume. Decentralized prover network MVP operational. Developer documentation complete with video tutorials. At least one developer workshop conducted. | $55,000 | Month 6 |
| | **Total** | | **$150,000** | |


## Deliverables High Level Overview

StellaRay delivers the complete ZK infrastructure layer for Stellar in three phases.

**Phase 1 (Months 1 to 2): Security and Foundation**

Professional security audit of all 5 existing smart contracts (~2,550 lines of Rust) and the TypeScript SDK (~3,200 lines). Formal verification of core cryptographic functions (Groth16 pairing check, Poseidon commitment, nullifier derivation). All audit findings addressed. Bug bounty program launched. Near Intent circuit research and architecture design completed.

**Phase 2 (Months 3 to 4): Mainnet and Intent MVP**

Production deployment of the complete zkLogin system to Stellar mainnet. Near Intent Verifier contract deployed to testnet. Balance Intent Circom circuit compiled with proving/verification key generation. SDK v3.0 released with IntentClient module. Apple Sign In integration. Intent gated x402 payment flow prototyped and tested.

**Phase 3 (Months 5 to 6): Intent Production and Ecosystem Scale**

All Near Intent contracts deployed to mainnet. Three intent types live: Balance Intent, Eligibility Intent, Stream Intent. Intent gated x402 payments in production. SDK includes React hooks for intent UI. Decentralized prover network MVP. 10+ dApp integrations achieved. Developer documentation, video tutorials, and at least one workshop completed.


## Deliverables (Detailed)

### Deliverable 1: Security Audit and Hardening

**Description:** Professional third party security audit of all Soroban smart contracts and the TypeScript SDK.

**Scope:**
The ZK Verifier contract: Groth16 pairing check implementation, nullifier tracking, Poseidon commitment verification. This is the cryptographic core and the highest priority audit target.
The Smart Wallet contract: Custom __check_auth implementation, session management, ephemeral key registration, Ed25519 signature verification.
The Gateway Factory contract: Deterministic address prediction using Blake2b_256, wallet deployment, CREATE2 style address derivation.
The JWK Registry contract: OAuth provider key management, RSA modulus chunking into 17x121 bit pieces, Poseidon based modulus hashing for ZK circuit compatibility.
The x402 Facilitator contract: Payment request lifecycle, nonce management, fee calculation, settlement logic.
The TypeScript SDK: Key derivation, proof generation client, transaction building, ephemeral key management, storage encryption.

**Acceptance Criteria:**
Audit report delivered by a recognized security firm (Trail of Bits, Halborn, OtterSec, or equivalent).
Zero critical or high severity findings remaining.
All medium findings addressed or accepted with documented rationale.
100% test coverage on all critical contract paths (proof verification, auth checks, payment flows).
Bug bounty program published and active on a recognized platform.

### Deliverable 2: Mainnet Deployment

**Description:** Production deployment of the complete zkLogin system and payment infrastructure to Stellar mainnet.

**Acceptance Criteria:**
All 5 contracts deployed to mainnet with verified source code on Stellar Expert.
Live Google OAuth login creating real mainnet wallets with deterministic address derivation.
XLM and Soroban token transfers functional on mainnet.
Payment links with QR codes functional on mainnet with 0.3% fee collection.
Streaming payments functional on mainnet with 0.1% fee collection.
x402 micropayments functional on mainnet.
SDK v2.2 published to npm with mainnet contract addresses and network configuration.
Monitoring, alerting, and error tracking operational.
Documentation updated with mainnet specific guides.

### Deliverable 3: Near Intent Verifier Contract

**Description:** New Soroban smart contract that verifies Near Intent ZK proofs. Uses the same Groth16 verification algorithm as the existing ZK Verifier but configured for intent circuits with different public input structures (3 to 4 inputs instead of 5).

**User Story:** As a dApp developer, I want to call verify_intent(proof) and get a boolean answer that tells me whether a user meets certain conditions (has enough balance, qualifies for a service, has an active stream) without the user revealing any private information.

**Key Methods:**
initialize(admin, intent_vk): Set up the contract with an intent specific verification key. The IC array size matches the intent circuit's public input count.
verify_intent(proof, public_inputs): Verify a Groth16 intent proof using Protocol 25 native BN254 multi pairing check. Returns true if the proof is valid.
register_intent(commitment, expiry): Store an intent commitment (Poseidon hash of intent parameters) with an expiration ledger sequence number.
is_intent_valid(commitment): Check if an intent commitment exists and the current ledger sequence is before the expiry. Returns boolean.
revoke_intent(commitment): Allow the original prover to revoke their own intent commitment before expiry.

**Acceptance Criteria:**
Contract deployed to testnet with verified source.
Groth16 verification passing for all three intent proof types.
Intent commitments stored and queryable on chain.
Expiration enforcement working correctly against ledger sequence.
Revocation functional and limited to original prover.
Gas cost within 10% of existing ZK Verifier (target: ~280,000 gas per verification).

### Deliverable 4: Balance Intent Circuit (Circom)

**Description:** Circom circuit that proves a user's wallet balance exceeds a specified threshold without revealing the actual balance. Uses Poseidon commitments to cryptographically bind the proof to the user's zkLogin identity.

**Circuit Public Inputs (3 field elements, visible on chain):**
intentHash: Poseidon("balance", threshold, expiryEpoch). Commits to what is being proved and when it expires.
addressCommitment: Poseidon(addressSeed). Ties the proof to the user's zkLogin identity without revealing it.
expiryEpoch: Ledger sequence number when this intent expires.

**Circuit Private Inputs (known only to the prover):**
balance: The actual wallet balance. Never revealed to anyone.
threshold: The minimum required amount.
addressSeed: The user's zkLogin address seed (Poseidon(sub, aud, salt)).
salt: Privacy salt for additional protection.

**Constraints enforced inside the circuit:**
balance >= threshold (range check proving sufficient funds).
addressCommitment == Poseidon(addressSeed) (identity binding).
intentHash == Poseidon("balance", threshold, expiryEpoch) (commitment correctness).

**Acceptance Criteria:**
Circuit compiles successfully with Circom 2.1.6.
Proving and verification keys generated via Groth16 trusted setup.
Proof generation completes in under 3 seconds in a modern browser.
Proof verification passes on chain via the Intent Verifier contract using Protocol 25 native BN254 pairing.
False proofs (balance below threshold) are deterministically rejected.
Circuit constraint count is lower than the zkLogin circuit for faster browser proving.

### Deliverable 5: Intent SDK Module

**Description:** New module added to the @stellar-zklogin/sdk package providing a clean, type safe API for generating, verifying, and managing Near Intent proofs.

**API Surface:**
IntentClient class with methods: proveBalanceIntent(wallet, threshold, expiry), proveEligibilityIntent(wallet, merkleProof, root), proveStreamIntent(wallet, recipient, minFlowRate), verifyIntent(proof), revokeIntent(commitment).
React hook useIntent() for frontend integration with loading states, error handling, and proof status.
Full TypeScript type definitions for all intent types, proofs, public inputs, and verification results.

**Acceptance Criteria:**
Published as part of @stellar-zklogin/sdk v3.0 on npm.
Full TypeScript strict mode type safety.
React hook functional in Next.js 15 with App Router.
Complete documentation with code examples for each intent type.
Unit tests with 90%+ coverage on public API methods.
Bundle size increase under 50KB gzipped.

### Deliverable 6: Intent Gated x402 Payments

**Description:** Extension of the existing x402 Facilitator contract to optionally require a Near Intent proof before accepting payment. This eliminates failed transactions due to insufficient balance: the server verifies the user can pay before the payment is attempted.

**Flow:**
1. Client requests a protected resource from a server.
2. Server responds with HTTP 402 including payment requirements and a require_intent flag.
3. Client SDK automatically generates a Balance Intent proof (client side, under 3 seconds).
4. Client sends the intent proof to the server.
5. Server calls verify_intent() on chain to confirm the proof.
6. Client executes the actual payment via the x402 Facilitator.
7. Server confirms payment and delivers the resource.

**Acceptance Criteria:**
x402 Facilitator contract updated with optional verify_intent pre check.
SDK handles the entire intent gated payment flow automatically with a single function call.
Demo application includes a working example of intent gated content access.
Zero failed transactions due to insufficient balance when intent gating is enabled.
Backwards compatible: existing x402 flows without intent gating continue to work unchanged.

### Deliverable 7: Documentation and Developer Relations

**Description:** Complete developer documentation, integration guides, and community building to drive SDK adoption.

**Acceptance Criteria:**
Full API documentation for all SDK methods including intent module.
Step by step integration guide: "Add ZK wallets to your Stellar dApp in 15 minutes."
Video tutorial series (at least 3 videos) covering zkLogin setup, payment integration, and intent proofs.
At least one live developer workshop conducted (virtual or in person).
Interactive SDK playground updated with intent proof examples.
All documentation published publicly on stellaray.fun/sdk.


## Architecture Overview

### C4 L1 Diagram: High Level Architecture

```
                    +---------------------+
                    |                     |
                    |    End Users        |
                    |  (Google/Apple      |
                    |   account holders)  |
                    |                     |
                    +----------+----------+
                               |
                               | Sign in with OAuth
                               | Generate intent proofs
                               | Execute payments
                               |
                               v
                    +---------------------+
                    |                     |
                    |   StellaRay         |
                    |   ZK Layer          |
                    |                     |
                    |   zkLogin Auth      |
                    |   Near Intent SDK   |
                    |   Payment Infra     |
                    |                     |
                    +----------+----------+
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
    +---------------+ +--------------+ +--------------+
    |               | |              | |              |
    |  Google/Apple | |   Stellar    | |  dApp        |
    |  OAuth        | |   Network    | |  Ecosystem   |
    |  Providers    | |   (Soroban)  | |              |
    |               | |              | |              |
    +---------------+ +--------------+ +--------------+
```

**External Entities:**

End Users authenticate using existing Google or Apple accounts. They never manage seed phrases or install browser extensions. They can generate intent proofs to privately prove readiness for on chain actions.

Google and Apple OAuth Providers issue JSON Web Tokens containing user identity claims. StellaRay verifies these tokens via ZK proofs so the identity never touches the blockchain.

Stellar Network (Soroban) hosts all 6 smart contracts (5 existing + 1 new intent verifier). Protocol 25 provides native BN254 and Poseidon host functions for efficient ZK proof verification at 94% lower gas cost than WASM alternatives.

dApp Ecosystem consists of third party Stellar applications that integrate StellaRay via the TypeScript SDK. They use createZkWallet() for authentication and verifyIntent() for privacy preserving eligibility checks.

### C4 L2 Diagram: Zoom into the StellaRay System

```
+----------------------------------------------------------------------+
|                           StellaRay ZK Layer                         |
|                                                                      |
|  +-------------+  +--------------+  +--------------+  +------------+ |
|  |             |  |              |  |              |  |            | |
|  |  Demo App   |  |  TypeScript  |  |   Prover     |  |   Salt     | |
|  |  (Next.js)  |  |  SDK         |  |   Service    |  |  Service   | |
|  |             |  |              |  |   (Rust)     |  |  (Rust)    | |
|  |  Dashboard  |  |  ZkLogin     |  |              |  |            | |
|  |  Payments   |  |  Client      |  |  Groth16     |  |  HKDF Salt | |
|  |  Streams    |  |  IntentClient|  |  Proof Gen   |  | Derivation | |
|  |  Explorer   |  |  x402Client  |  |  Intent Gen  |  |            | |
|  |  Intent UI  |  |  React Hooks |  |              |  |            | |
|  +------+------+  +------+-------+  +------+-------+  +------+----+ |
|         |                |                 |                 |       |
|         |   Uses SDK     |  Requests proof |  Requests salt  |       |
|         +----------------+                 |                 |       |
|                          |                 |                 |       |
|                          v                 v                 v       |
|  +------------------------------------------------------------------+|
|  |                    Stellar Soroban (Protocol 25)                  ||
|  |                                                                  ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |  | ZK Verifier  |  | Intent       |  | Smart Wallet |            ||
|  |  |              |  | Verifier     |  |              |            ||
|  |  | Groth16      |  |              |  | Session Auth |            ||
|  |  | BN254 Pairing|  | Groth16      |  | Ephemeral    |            ||
|  |  | Poseidon     |  | Intent VK    |  | Keys         |            ||
|  |  | Nullifiers   |  | Commitments  |  | Ed25519      |            ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |                                                                  ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |  | JWK Registry |  | Gateway      |  | x402         |            ||
|  |  |              |  | Factory      |  | Facilitator  |            ||
|  |  | Google Keys  |  |              |  |              |            ||
|  |  | Apple Keys   |  | Deterministic|  | HTTP 402     |            ||
|  |  | Modulus Hash |  | Wallet Deploy|  | Intent Gate  |            ||
|  |  +--------------+  +--------------+  +--------------+            ||
|  |                                                                  ||
|  +------------------------------------------------------------------+|
|                                                                      |
+----------------------------------------------------------------------+
```

**Internal Components:**

Demo Application (Next.js 15): The reference implementation. 17 routes including dashboard, payment links, streaming payments, ZK proofs visualization, block explorer, SDK playground, admin analytics, and waitlist. 26 API routes handling auth, payments, streams, ZK proofs, admin operations, and price feeds. Live at stellaray.fun.

TypeScript SDK (@stellar-zklogin/sdk v2.1.0): The primary developer interface. Contains ZkLoginClient for authentication, IntentClient (new, proposed) for Near Intent proofs, X402PaymentClient for micropayments, StreamingClient for payment streams, React hooks (useZkWallet, useZkLogin, useIntent) for frontend integration, and all cryptographic utilities (Poseidon, BN254 field arithmetic, Ed25519 key management, Blake2b hashing).

Prover Service (Rust/Axum): Generates Groth16 proofs from OAuth tokens and intent witnesses. Accepts proof requests over HTTP, computes Circom circuit witnesses, generates proofs using SnarkJS, and returns proofs with public inputs. Will be extended to generate intent proofs using the new Balance/Eligibility/Stream circuits.

Salt Service (Rust/Axum): Derives deterministic salts from OAuth tokens using HKDF SHA256. Ensures the same Google account always maps to the same wallet address. The server stores only the (issuer, subject) to salt mapping and never knows the resulting wallet address.

Soroban Smart Contracts: 6 contracts (5 existing + 1 new Intent Verifier) running on Stellar with Protocol 25 native cryptographic operations.

### Architecture Constraints

**Regulatory:** StellaRay is designed for selective disclosure, not for hiding illegal activity. ZK proofs enable users to prove specific attributes (solvency, identity, eligibility) to regulators and counterparties without revealing all financial data. No mixing or tumbling functionality exists or is planned.

**Protocol 25 Dependency:** All ZK verification requires Protocol 25 host functions (BN254 pairing via bn254_multi_pairing_check and Poseidon hashing via poseidon_permutation). The system cannot operate on Stellar protocol versions prior to 25. Protocol 25 is active on testnet and mainnet as of January 2026.

**Circuit Immutability:** Groth16 circuits require a one time trusted setup ceremony. Changing the circuit requires generating new proving and verification keys. The system is designed with separate verification keys for zkLogin and each intent type, allowing independent updates without affecting other proof types.

**Browser Constraints:** Proof generation happens client side for privacy. Circuit size must remain small enough for browser based proving (target: under 3 seconds). The Balance Intent circuit is designed to be significantly lighter than the ~1.1M constraint zkLogin circuit.

**Self Custody:** Wallet keys are derived client side from the OAuth token. The server never sees or stores private keys. Key recovery depends entirely on Google/Apple account access. This is a deliberate security choice: no backend can be compromised to steal user funds.


## Contract Overview (Soroban Modules)

### Existing Contracts (5, Deployed on Stellar Testnet)

**ZK Verifier Contract**
Address: CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6
Explorer: https://stellar.expert/explorer/testnet/contract/CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6

Purpose: On chain Groth16 proof verification using Protocol 25 native BN254 pairing operations. This is the cryptographic heart of the entire system.

Key Methods:
initialize(admin, vk): Sets up with administrator address and Groth16 verification key. The VK must have exactly 6 input commitment points (5 zkLogin public inputs + 1 constant IC[0]).
verify_zklogin_proof(proof, public_inputs): Verifies a Groth16 proof. Computes vk_x = IC[0] + sum(input[i] * IC[i+1]) via scalar multiplication, then performs multi pairing check: e(neg_A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1. Uses Protocol 25 bn254_multi_pairing_check. Gas cost: ~260,000 (94% savings vs WASM).
compute_nonce(eph_pk_high, eph_pk_low, max_epoch, randomness): Computes session nonce as Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness) using Protocol 25 native Poseidon.
compute_address_seed(kc_name_hash, kc_value_hash, aud_hash, salt): Computes address seed as Poseidon(kc_name, kc_value, aud, Poseidon(salt)).
is_nullifier_used(nullifier): Checks nullifier registry for replay protection. Each proof can only be submitted once.

**Smart Wallet Contract**
Purpose: Custom Soroban account contract implementing zkLogin authentication with session based ephemeral key signing. Each deployed instance is a user's wallet.

Key Methods:
initialize(address_seed, iss_hash, zk_verifier, jwk_registry): Binds wallet to a specific OAuth identity via the address seed and issuer hash.
add_session(proof, public_inputs, eph_pk): Registers a new authenticated session. Calls the ZK Verifier to validate the proof, then stores the ephemeral public key as an authorized signer until max_epoch.
transfer(token, to, amount, auth): Sends tokens using session authorization.
execute(contract, function, args, auth): Calls arbitrary Soroban contract functions.
__check_auth(signature_payload, signature, auth_contexts): Custom auth interface implementing Soroban's account abstraction. Verifies Ed25519 signatures from registered ephemeral keys and checks that the current ledger sequence is within the session's max_epoch.

**Gateway Factory Contract**
Address: CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76
Explorer: https://stellar.expert/explorer/testnet/contract/CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76

Purpose: Deterministic wallet deployment using CREATE2 style address prediction. Given an issuer hash and address seed, the factory always produces the same wallet address.

Key Methods:
predict_address(iss_hash, address_seed): Predicts wallet address before deployment using Blake2b_256(0x05 || iss_hash || address_seed). Used client side so users know their address before any on chain interaction.
deploy_wallet(address_seed, iss_hash): Deploys a new smart wallet contract or returns the existing address if already deployed. Uses Protocol 25 native Poseidon for address seed verification.

**JWK Registry Contract**
Address: CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I
Explorer: https://stellar.expert/explorer/testnet/contract/CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I

Purpose: Stores OAuth provider public keys (JWKs) on chain for trustless JWT verification inside ZK circuits.

Key Methods:
register_provider(name, issuer, jwks_uri, oracle): Adds an OAuth provider (Google, Apple) with its issuer URL and a trusted oracle address.
register_jwk(provider_name, kid, modulus_chunks, exponent, alg): Stores a JWK. The RSA 2048 modulus is split into 17 chunks of 121 bits each for compatibility with the BN254 scalar field used in ZK circuits.
compute_modulus_hash(chunks): Tree structure Poseidon hash of the 17 RSA modulus chunks. This hash is used as a public input in the zkLogin circuit.
get_jwk(provider_name, kid): Retrieves a JWK by provider and key ID for proof verification.

**x402 Facilitator Contract**
Address: CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ
Explorer: https://stellar.expert/explorer/testnet/contract/CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ

Purpose: Implements HTTP 402 (Payment Required) protocol for micropayments on Stellar. Enables pay per API call, pay per content, pay per download patterns.

Key Methods:
create_request(asset, amount, destination, resource_id, valid_for_secs): Server creates a payment request specifying asset, amount, and resource.
pay(request_id, payer): Client executes payment through their zkLogin wallet. Handles USDC and XLM.
is_paid(request_id): Server verifies payment completion before delivering the resource.
set_fee(admin, fee_bps): Configure platform fee in basis points.

### New Contract (Proposed for This Grant)

**Intent Verifier Contract**
Purpose: Verifies Near Intent ZK proofs. Architecturally identical to the ZK Verifier but configured for intent circuits with 3 to 4 public inputs instead of 5.

Key Methods:
initialize(admin, intent_vk): Sets up with an intent specific verification key. The IC array size matches the intent circuit's public input count (4 for balance intent: intentHash + addressCommitment + expiryEpoch + constant).
verify_intent(proof, public_inputs): Verifies a Groth16 intent proof. Same BN254 multi pairing check algorithm. Same Protocol 25 host functions. Different verification key.
register_intent(commitment, expiry): Stores an intent commitment (Poseidon hash of intent parameters) with an expiration ledger sequence.
is_intent_valid(commitment): Returns true if the commitment exists and the current ledger sequence is before the expiry.
revoke_intent(commitment): Allows the original prover to revoke their intent commitment.


## Technology Stack

### Backend

| Technology | Purpose | Details |
|-----------|---------|---------|
| Rust | Smart contracts and backend services | Soroban SDK for all 6 contracts, Axum framework for Prover and Salt HTTP services |
| Soroban SDK | Contract development | Version compatible with Protocol 25 host functions (bn254_multi_pairing_check, poseidon_permutation) |
| Circom 2.1.6 | Circuit compiler | zkLogin circuit (~1.1M constraints) and intent circuits (lighter, targeting under 100K constraints) |
| SnarkJS | Proof generation | Groth16 proving with BN254 curve. Powers both server side prover and browser side intent proving. |
| Node.js 20+ | API runtime | Next.js 15 API routes for demo application backend |
| NextAuth.js | Authentication | Google OAuth 2.0 and Apple Sign In providers |
| PostgreSQL (Neon) | Database | Serverless PostgreSQL. Tables: authenticated_users, payment_links, payment_streams, waitlist, waitlist_analytics, waitlist_daily_stats |

### Frontend

| Technology | Purpose | Details |
|-----------|---------|---------|
| Next.js 15 | Application framework | App Router, React Server Components, API routes, middleware |
| React 18 | UI library | Hooks, context, concurrent features |
| TypeScript | Type safety | Strict mode across entire codebase. Zero type errors at build. |
| Tailwind CSS | Styling | Utility first with custom dark theme and design system |
| Lucide React | Icons | Consistent icon set across all pages |
| poseidon-lite | Client side hashing | Browser compatible Poseidon implementation for client side proof generation |
| Framer Motion | Animations | Page transitions and interactive UI elements |

### Infrastructure

| Technology | Purpose | Details |
|-----------|---------|---------|
| Vercel | Application hosting | Serverless Next.js deployment with edge network and automatic CI/CD |
| Stellar Testnet | Current deployment | Soroban RPC at soroban-testnet.stellar.org, Horizon at horizon-testnet.stellar.org |
| Stellar Mainnet | Production (planned) | Soroban RPC at soroban.stellar.org. Deployment is Milestone 2. |
| Neon PostgreSQL | Serverless database | Auto scaling, connection pooling, branching for dev/staging/prod |
| GitHub Actions | CI/CD pipeline | Automated testing (cargo test, jest, TypeScript type checking) and deployment |


## Automated Testing

| Layer | Tool | Coverage Target | Current Status |
|-------|------|----------------|----------------|
| Smart Contracts | Soroban SDK test framework (cargo test) | 100% on critical paths, 80% overall | Core paths covered. Expanding to 100% as part of audit prep. |
| TypeScript SDK | Vitest with TypeScript | 90% on public API, 80% overall | Core modules covered. Intent module tests will be added with Deliverable 5. |
| Circom Circuits | Circom test framework with witness verification | 100% constraint satisfaction | zkLogin circuit fully tested. Intent circuits will be tested as part of Deliverable 4. |
| Integration | Custom end to end test suite | All critical user flows (login, payment, stream, proof) | Login and payment flows covered. |
| Security | Static analysis and custom fuzzing | All contract entry points | Planned for security audit phase (Deliverable 1). |
| Performance | Gas benchmarking suite | All on chain operations profiled and tracked | BN254 and Poseidon benchmarks complete. Published in whitepaper. |
| Type Safety | TypeScript strict mode (tsc --noEmit) | Zero errors across entire codebase | Achieved. Build passes with zero type errors. |


## Integrations

| Service | Purpose | Type |
|---------|---------|------|
| Google OAuth 2.0 | Primary user authentication. JWT contains sub claim used for wallet derivation. | External API |
| Apple Sign In | Secondary authentication (Milestone 2). Same ZK flow, different JWT issuer. | External API |
| Stellar Horizon API | Account queries, transaction history, payment submission, account creation | Blockchain API |
| Stellar Soroban RPC | Smart contract invocation, simulation, and state queries | Blockchain API |
| Stellar Friendbot | Testnet account funding for new wallets | Blockchain API |
| Neon PostgreSQL | Serverless database for user sessions, payment links, streams, analytics | Database |
| Vercel | Hosting, serverless functions, edge network, CI/CD | Infrastructure |
| CoinGecko API | XLM/USD price data for dashboard display | External API |


## Additional Documents

| Document | Location | Description |
|----------|----------|-------------|
| Project Repository | https://github.com/Adwaitbytes/StellaRay | Complete source code: 5 Rust contracts, TypeScript SDK, Next.js demo app, Circom circuits, documentation |
| Technical Whitepaper | Included in repository (WHITEPAPER.md) | 12 section, 420+ line technical paper covering protocol design, security analysis, performance benchmarks, and 10 academic references |
| Live Demo | https://stellaray.fun | Testnet demo with Google OAuth login, dashboard, payments, streaming, ZK proofs, explorer, SDK playground |
| Admin Dashboard | https://stellaray.fun/admin | Live analytics: user counts, transaction metrics, proof generation stats |
| SDK Playground | https://stellaray.fun/playground | Interactive developer environment with code editor, console, live wallet, API reference |
| SDK Documentation | https://stellaray.fun/sdk | API documentation and integration guides |
| Block Explorer | https://stellaray.fun/explorer | Built in Stellar transaction explorer |
| Pricing Page | https://stellaray.fun/pricing | Subscription tiers and fee structure |
| Grant Proposal (Detailed) | docs/STELLAR_GRANT_PROPOSAL.md | Extended proposal with ASCII architecture diagrams and competitive analysis |

### Testnet Contract Explorer Links

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| ZK Verifier | CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6 | https://stellar.expert/explorer/testnet/contract/CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6 |
| Gateway Factory | CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76 | https://stellar.expert/explorer/testnet/contract/CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76 |
| JWK Registry | CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I | https://stellar.expert/explorer/testnet/contract/CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I |
| x402 Facilitator | CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ | https://stellar.expert/explorer/testnet/contract/CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ |

### Performance Benchmarks

| Operation | Pre Protocol 25 (WASM) | Protocol 25 (Native) | Reduction |
|-----------|----------------------|---------------------|-----------|
| BN254 G1 Addition | ~45,000 gas | ~2,800 gas | 93.8% |
| BN254 G1 Multiplication | ~180,000 gas | ~11,200 gas | 93.8% |
| BN254 Pairing Check (4 pair) | ~3,800,000 gas | ~230,000 gas | 93.9% |
| Poseidon Hash (3 inputs) | ~85,000 gas | ~12,000 gas | 85.9% |
| Full Groth16 Verification | ~4,100,000 gas | ~260,000 gas | 93.7% |

| Metric | Value |
|--------|-------|
| Proof Size | 256 bytes (constant regardless of statement complexity) |
| Public Inputs | 4 to 5 field elements (128 to 160 bytes) |
| On Chain Verification Time | ~12 ms |
| Proof Generation (Server) | 1.2 to 2.5 seconds |
| Proof Generation (Browser, Intent) | Under 3 seconds (target) |
| Full Login (First Time) | 8 to 10 seconds |
| Return Login | 3 to 5 seconds |
| Transaction Confirmation | 3 to 5 seconds |

### Competitive Positioning

| Feature | StellaRay | Sui zkLogin | Web3Auth | Magic | Privy |
|---------|-----------|-------------|----------|-------|-------|
| True Zero Knowledge Auth | Yes | Yes | No (MPC) | No (Custodial) | No (MPC) |
| Protocol 25 Native Crypto | Yes | N/A (built in from start) | No | No | No |
| On Chain Proof Verification | Yes (Groth16) | Yes | No | No | No |
| Near Intent Proofs | Yes (unique, no other chain) | No | No | No | No |
| Gas Efficiency vs WASM | 94% savings | N/A | N/A | N/A | N/A |
| x402 Micropayments | Yes | No | No | No | No |
| Streaming Payments | Yes | No | No | No | No |
| Self Custody | Full (keys never leave browser) | Full | MPC based | Custodial | MPC based |
| Intent Gated Payments | Yes (unique) | No | No | No | No |
| Open Source | Full (MIT) | Full | Partial | No | Partial |
| SDK Integration | 3 lines of code | Framework specific | 5+ lines | 3 lines | 5+ lines |
