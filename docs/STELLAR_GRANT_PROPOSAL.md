
# StellaRay: The ZK Layer for Stellar

## Grant Proposal

**"We don't just onboard users. We prove when they're ready to act, privately."**



## Table of Contents

1. Introduction
2. Definitions, Acronyms, and Abbreviations
3. Proposal Summary
4. Company Description
5. Product Description
6. Team and Experience
7. Previous Funding
8. Deliverables High Level Overview
9. Core Thesis and Team Conviction
10. Funding Justification and Benefits
11. Funding Structure: Disbursement Milestones
12. Deliverables (Detailed)
13. Architecture Overview
14. Contract Overview
15. Technology Stack
16. Automated Testing
17. Integrations
18. Additional Documents



## 1. Introduction

| Field | Details |
|-------|---------|
| Legal Entity Name | StellaRay |
| Project Name | StellaRay: ZK Near Intent SDK |
| Country of Formation | India |
| Applicant Name | [Your Name] |
| Applicant Role | Founder and Lead Developer |
| Applicant Email | [Your Email] |
| Primary Category/Vertical | DeFi and Payments / Developer Tools / Privacy Infrastructure |
| Development Stage | Testnet (5 smart contracts deployed, SDK published, live demo operational) |
| Integration Type | Native Stellar (Soroban smart contracts using Protocol 25 X Ray primitives) |
| Website | https://stellargateway.vercel.app |
| Twitter | @StellarZkLogin |
| Mainnet Address | Pending (testnet addresses listed below) |
| Onchain Analytics | Stellar Expert testnet explorer links provided in contract overview |



## 2. Definitions, Acronyms, and Abbreviations

| Term | Meaning |
|------|---------|
| zkLogin | Zero knowledge login system that converts OAuth credentials into Stellar wallets without exposing identity on chain |
| Near Intent | A ZK proof that verifies a user is ready to perform an on chain action without revealing identity, balance, or history |
| BN254 | The elliptic curve used for Groth16 proof verification, natively supported by Protocol 25 (CAP 0074) |
| Poseidon | ZK friendly hash function natively supported by Protocol 25 (CAP 0075), 90% cheaper than WASM alternatives |
| Groth16 | The zero knowledge proof system used for both zkLogin authentication and near intent proofs |
| Protocol 25 (X Ray) | Stellar's protocol upgrade adding native BN254 elliptic curve and Poseidon hash host functions |
| x402 | HTTP 402 Payment Required protocol for micropayments on Stellar |
| Soroban | Stellar's smart contract platform using WebAssembly |
| Ephemeral Key | A short lived Ed25519 key pair used for session based transaction signing |
| Address Seed | A Poseidon hash derived from OAuth identity that deterministically maps to a Stellar wallet address |
| Nullifier | A hash of the ZK proof used for replay protection |
| JWK | JSON Web Key, the public key format used by OAuth providers like Google and Apple |



## 3. Proposal Summary

### Company Description

StellaRay is a privacy infrastructure team building the zero knowledge authentication and intent layer for Stellar. We are the first project to leverage Stellar's Protocol 25 (X Ray) native cryptographic primitives for production grade ZK proof verification on chain. Our mission is to make every Stellar dApp accessible to mainstream users while preserving complete privacy and self custody.

We have built and deployed a complete system: 5 Soroban smart contracts, a TypeScript SDK with 57+ exports, a ZK proof generation service, a privacy preserving salt service, and a live demo application. Our system enables users to sign in with Google or Apple and receive a fully functional Stellar wallet without seed phrases, browser extensions, or identity exposure.

Now we are extending this foundation with Near Intent: a new class of ZK proofs that verify whether a user is ready to act on chain (has sufficient balance, meets eligibility criteria, has active payment streams) without revealing any private information. This transforms StellaRay from an authentication layer into the complete ZK infrastructure layer for Stellar.

### Product Description

StellaRay consists of three integrated layers:

**Layer 1: zkLogin Authentication (Built and Deployed)**
Users sign in with Google or Apple OAuth. A Groth16 ZK proof verifies the OAuth token on chain without exposing the user's identity. A deterministic wallet address is derived from the OAuth identity using Poseidon hashing. Session based ephemeral keys enable seamless transaction signing.

**Layer 2: Payment Infrastructure (Built and Deployed)**
x402 HTTP micropayments allow servers to request payment before granting access to protected resources. Streaming payments enable real time continuous payment flows with escrow, supporting linear, cliff, exponential, and step curves. QR code scan to pay enables physical world payments.

**Layer 3: ZK Near Intent SDK (New, Proposed)**
Near intent proofs allow dApps to verify whether a user is ready to perform on chain actions. A balance intent proves the user can afford a transaction without revealing their actual balance. An eligibility intent proves the user qualifies for an action without revealing their identity or history. A stream intent proves an active payment stream exists without revealing amounts or participants. All proofs reuse the existing Groth16 and BN254 and Poseidon infrastructure with zero code changes to the verification layer.



## 4. Core Thesis and Team Conviction

### Why This Problem Matters

Blockchain adoption is stuck. The fundamental barrier is not technology but usability and privacy. Users will not write down seed phrases. Users will not install browser extensions. Users will not expose their financial activity to the world.

StellaRay solves all three problems simultaneously:

**No seed phrases.** Users sign in with Google. Their wallet address is derived deterministically from their OAuth identity using zero knowledge proofs. If they lose their device, they sign in again from any browser and get the same wallet.

**No extensions.** The entire authentication flow happens through standard OAuth redirects. No MetaMask, no Freighter, no downloads. Three lines of SDK code to integrate.

**No exposure.** Zero knowledge proofs ensure that the OAuth identity (email, name, user ID) never appears on chain. The ZK proof proves "I have a valid JWT from Google" without revealing which user. Near intent proofs extend this to "I can afford this payment" without revealing the balance.

### Why We Are Positioned to Win

We have already built the hard part. Five Soroban smart contracts are deployed on testnet. The Groth16 verifier uses Protocol 25 native BN254 pairing operations for 94% gas savings. The Poseidon hashing uses Protocol 25 native host functions for 90% gas savings. The TypeScript SDK has 57+ exports covering the entire flow from OAuth to transaction signing.

No one else on Stellar has this. We are the only team with production grade Groth16 verification on Soroban. We are the only team using Protocol 25 native BN254 and Poseidon. The near intent extension builds on all of this existing infrastructure, requiring zero changes to the verification layer and only new circuits and SDK methods.

### Why Near Intent Is the Killer Feature

Every blockchain project does authentication. What no one does is intent verification. When a dApp asks "Can this user pay 100 USDC?" today, it has to either trust the user's claim or read their balance on chain (destroying privacy).

With near intent, the answer is a ZK proof: YES this user can pay 100 USDC, verified cryptographically, with zero information leaked about who they are or how much they actually have.

This is not a theoretical concept. It is a direct extension of our existing Groth16 verifier. The same pairing check function, the same BN254 curve, the same Poseidon hash. Different circuit, different verification key, same infrastructure.



## 5. Team and Experience

### Founding Team

| Member | Role | Background |
|--------|------|------------|
| [Founder Name] | Founder and Lead Developer | Full stack blockchain engineer with 5+ years experience. Expertise in ZK circuits, Rust, Soroban, and cryptography. Previously contributed to ZK protocol implementations. |
| [Member 2] | Smart Contract Developer | Soroban specialist with deep experience in Protocol 25 optimization. Built DEX protocols on Stellar. Rust, testing, and gas optimization expert. |
| [Member 3] | SDK and Frontend Developer | TypeScript/React specialist who has built wallet SDKs for multiple chains. Focus on developer experience and API design. |

### Advisory

Security advisor from a major ZK protocol and a Stellar ecosystem veteran supporting architectural decisions and security review.

### Previous Funding

This is our first external funding application. All development to date has been self funded. We have invested significant personal time and resources to reach the current stage: 5 deployed contracts, a published SDK, and a live demo application. We are seeking grant funding rather than VC funding because StellaRay is public goods infrastructure for the Stellar ecosystem. Our goal is adoption across the ecosystem, not proprietary lock in.

| Detail | Value |
|--------|-------|
| Team Size | Less than 5 |
| Years in Business | Less than 2 years |
| Soroban Language Experience | Intermediate to Advanced |



## 6. Funding Justification and Benefits

### Why the Requested Funding Is Justified

StellaRay creates measurable value for Stellar in four ways:

**1. User Onboarding at Scale**
Every Stellar dApp that integrates StellaRay gains Google and Apple sign in for their users. This removes the single largest barrier to Stellar adoption. Our SDK requires 3 lines of code to integrate, meaning any developer can add it in minutes.

**2. Protocol 25 Showcase**
StellaRay is the first production use case for Protocol 25 native BN254 and Poseidon. Our implementation demonstrates that these primitives work, are efficient (94% gas savings), and enable entirely new application categories. This validates the Stellar Foundation's investment in Protocol 25.

**3. Privacy Infrastructure**
Near intent proofs create a new primitive that any Stellar dApp can use. Instead of building custom privacy solutions, developers call verifyIntent() and get a boolean result backed by cryptographic proof. This is composable infrastructure, not a siloed product.

**4. Competitive Positioning**
Sui has zkLogin. No other major blockchain has ZK intent verification. StellaRay gives Stellar a unique differentiator: the only blockchain where you can prove readiness to act without revealing anything about yourself.

### Measurable Value Created

| Metric | 3 Months | 6 Months | 12 Months |
|--------|----------|----------|-----------|
| Unique zkLogin Wallets | 500 | 2,000 | 10,000 |
| Monthly Transactions | 1,000 | 10,000 | 100,000 |
| SDK Downloads | 500 | 2,000 | 10,000 |
| dApp Integrations | 5 | 15 | 50 |
| Intent Proofs Verified | 0 | 5,000 | 50,000 |
| Developer Community | 100 | 500 | 2,000 |



## 7. Funding Structure: Disbursement Milestones

| # | Milestone Type | Trigger and Metrics | Amount (USD) | Expected Completion |
|---|---------------|--------------------:|-------------:|-------------------:|
| 0 | Upfront Payment (at Effective Date) | Contract signed. Team begins security audit engagement and near intent circuit design. | 20,000 | Month 0 |
| 1 | Security Audit Complete | Trail of Bits (or equivalent) audit delivered. All critical and high findings resolved. 100% test coverage on critical contract paths. Bug bounty program launched. | 35,000 | Month 2 |
| 2 | Mainnet Deployment and Near Intent MVP | All 5 existing contracts deployed to mainnet. Near intent verifier contract deployed to testnet. Balance intent circuit compiled and proving key generated. SDK v3.0 released with intent module. 500+ unique wallet creations. | 40,000 | Month 4 |
| 3 | Intent SDK Production and Ecosystem Growth | Near intent contracts deployed to mainnet. 3 intent types operational (balance, eligibility, stream). Intent gated x402 payments live. 10+ dApp integrations. 1,000+ monthly active users. Decentralized prover MVP. | 55,000 | Month 6 |
| **Total** | | | **150,000** | |



## 8. Deliverables High Level Overview

StellaRay delivers the complete ZK infrastructure layer for Stellar in three phases:

**Phase 1 (Months 1 to 2): Security and Foundation**
Professional security audit of all 5 existing smart contracts. Formal verification of core cryptographic functions. All audit findings addressed. Bug bounty program launched. Near intent circuit research and design completed.

**Phase 2 (Months 3 to 4): Mainnet and Intent MVP**
Production deployment of zkLogin system to Stellar mainnet. Near intent verifier contract deployed to testnet. Balance intent Circom circuit compiled. SDK v3.0 with IntentClient module released. Apple Sign In integration. Intent gated x402 payment flow prototyped.

**Phase 3 (Months 5 to 6): Intent Production and Scale**
All near intent contracts deployed to mainnet. Three intent types live: balance intent, eligibility intent, stream intent. Intent gated x402 payments in production. SDK includes React hooks for intent UI. Decentralized prover network MVP. 10+ dApp integrations achieved.



## 9. Deliverables (Detailed)

### Deliverable 1: Security Audit and Hardening

**Description:** Professional third party security audit of all Soroban smart contracts and the TypeScript SDK. This covers 5 contracts totaling approximately 2,550 lines of Rust and the SDK totaling approximately 3,200 lines of TypeScript.

**Scope:**
The ZK Verifier contract (Groth16 pairing check, nullifier tracking, Poseidon computations).
The Smart Wallet contract (session management, custom auth interface, Ed25519 verification).
The Gateway Factory contract (deterministic address prediction, wallet deployment).
The JWK Registry contract (OAuth provider key management, modulus hashing).
The x402 Facilitator contract (payment request lifecycle, fee calculations).
The TypeScript SDK (key management, proof generation client, transaction building).

**Acceptance Criteria:**
Audit report delivered by a recognized security firm.
Zero critical or high severity findings remaining.
All medium findings addressed or accepted with documented rationale.
100% test coverage on all critical contract paths.
Bug bounty program published and active.

### Deliverable 2: Mainnet Deployment

**Description:** Production deployment of the complete zkLogin system to Stellar mainnet, including all 5 smart contracts, the prover service, the salt service, and the demo application.

**Acceptance Criteria:**
All contracts deployed to mainnet with verified source code.
Live Google OAuth login creating real mainnet wallets.
Token transfers functional on mainnet.
x402 payments functional on mainnet.
SDK v2.2 published to npm with mainnet contract addresses.
Monitoring and alerting operational.

### Deliverable 3: Near Intent Verifier Contract

**Description:** New Soroban smart contract that verifies near intent ZK proofs. Architecturally identical to the existing ZK Verifier but configured for intent circuits with different public input counts.

**User Story:** As a dApp developer, I want to verify that a user meets certain conditions (balance threshold, eligibility, active stream) without the user revealing any private information, so that I can gate actions on cryptographic proof rather than trust.

**Key Methods:**
initialize(admin, intent_vk): Set up the contract with an intent specific verification key.
verify_intent(proof, public_inputs): Verify a Groth16 intent proof using Protocol 25 BN254 pairing.
register_intent(commitment, expiry): Store an intent commitment with expiration.
is_intent_valid(commitment): Check if an intent commitment exists and has not expired.
revoke_intent(commitment): Allow the prover to revoke their own intent.

**Acceptance Criteria:**
Contract deployed to testnet.
Groth16 verification passing for intent proofs.
Intent commitments stored and queryable.
Expiration and revocation functional.
Gas cost within 10% of existing ZK Verifier.

### Deliverable 4: Balance Intent Circuit

**Description:** Circom circuit that proves a user's wallet balance exceeds a threshold without revealing the actual balance. Uses Poseidon commitments to bind the proof to the user's zkLogin identity.

**Circuit Public Inputs (3 elements):**
intentHash: Poseidon hash of intent type, threshold, and expiry epoch.
addressCommitment: Poseidon hash of the user's address seed (ties to zkLogin identity).
expiryEpoch: Ledger sequence number when this intent expires.

**Circuit Private Inputs:**
balance: The actual wallet balance (never revealed).
threshold: The minimum required amount.
addressSeed: The user's zkLogin address seed.
salt: Privacy salt.

**Constraints:**
balance >= threshold (range check).
addressCommitment == Poseidon(addressSeed).
intentHash == Poseidon("balance", threshold, expiryEpoch).

**Acceptance Criteria:**
Circuit compiles with Circom.
Proving and verification keys generated.
Proof generation under 3 seconds in browser.
Proof verification passes on chain via intent verifier contract.
False proofs (balance below threshold) are rejected.

### Deliverable 5: Intent SDK Module

**Description:** New module in the TypeScript SDK providing a clean API for generating, verifying, and managing near intent proofs.

**API Surface:**
IntentClient class with proveBalanceIntent(wallet, threshold, expiry), proveEligibilityIntent(wallet, merkleProof, root), proveStreamIntent(wallet, recipient, minFlowRate), verifyIntent(proof), revokeIntent(commitment).
React hook useIntent() for frontend integration.
Type definitions for all intent types, proofs, and public inputs.

**Acceptance Criteria:**
SDK module published as part of @stellar-zklogin/sdk v3.0.
Full TypeScript type safety.
React hook functional in Next.js 15.
Documentation with code examples.
Unit tests with 90%+ coverage.

### Deliverable 6: Intent Gated x402 Payments

**Description:** Extension of the existing x402 Facilitator to optionally require an intent proof before accepting payment. Servers can require users to prove they can afford a payment before initiating the transaction, eliminating failed transactions and wasted gas.

**Flow:**
Server responds with HTTP 402 including a require_intent flag.
Client generates a balance intent proof.
Client sends intent proof to server.
Server verifies intent on chain.
Client executes payment.
Server confirms payment and delivers resource.

**Acceptance Criteria:**
x402 Facilitator contract updated with verify_intent check.
SDK handles intent gated payment flow automatically.
Demo application shows intent gated payment in action.
Zero failed transactions due to insufficient balance.



## 10. Architecture Overview

### C4 Level 1 Diagram: System Context

```
                    ┌─────────────────────┐
                    │                     │
                    │    End Users        │
                    │  (Google/Apple      │
                    │   account holders)  │
                    │                     │
                    └──────────┬──────────┘
                               │
                               │ Sign in with OAuth
                               │ Generate intent proofs
                               │ Execute payments
                               │
                               ▼
                    ┌─────────────────────┐
                    │                     │
                    │   StellaRay         │
                    │   ZK Layer          │
                    │                     │
                    │   zkLogin Auth      │
                    │   Near Intent SDK   │
                    │   Payment Infra     │
                    │                     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │               │ │              │ │              │
    │  Google/Apple │ │   Stellar    │ │  dApp        │
    │  OAuth        │ │   Network    │ │  Ecosystem   │
    │  Providers    │ │   (Soroban)  │ │              │
    │               │ │              │ │              │
    └───────────────┘ └──────────────┘ └──────────────┘
```

**External Entities:**

End Users authenticate using existing Google or Apple accounts. They never manage seed phrases or install extensions. They generate intent proofs to privately prove readiness for on chain actions.

Google and Apple OAuth Providers issue JWTs that contain the user's identity claims. StellaRay verifies these tokens using ZK proofs so the identity never reaches the blockchain.

Stellar Network (Soroban) hosts all smart contracts. Protocol 25 provides native BN254 and Poseidon host functions for efficient ZK verification.

dApp Ecosystem consists of third party applications that integrate StellaRay via the TypeScript SDK. They call verifyIntent() to gate actions on ZK proofs.


### C4 Level 2 Diagram: StellaRay System Internals

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           StellaRay ZK Layer                            │
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │             │  │              │  │              │  │              │  │
│  │  Demo App   │  │  TypeScript  │  │   Prover     │  │    Salt      │  │
│  │  (Next.js)  │  │  SDK         │  │   Service    │  │   Service    │  │
│  │             │  │              │  │   (Rust)     │  │   (Rust)     │  │
│  │  Dashboard  │  │  ZkLogin     │  │              │  │              │  │
│  │  Payments   │  │  Client      │  │  Groth16     │  │  HKDF Salt   │  │
│  │  Streams    │  │  IntentClient│  │  Proof Gen   │  │  Derivation  │  │
│  │  Intent UI  │  │  x402Client  │  │  Intent Gen  │  │              │  │
│  │             │  │  React Hooks │  │              │  │              │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                │                 │                 │          │
│         │   Uses SDK     │  Requests proof │  Requests salt  │          │
│         └────────────────┤                 │                 │          │
│                          │                 │                 │          │
│                          ▼                 ▼                 ▼          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Stellar Soroban (Protocol 25)                 │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ ZK Verifier  │  │ Intent       │  │ Smart Wallet │           │   │
│  │  │              │  │ Verifier     │  │              │           │   │
│  │  │ Groth16      │  │              │  │ Session Auth │           │   │
│  │  │ BN254 Pairing│  │ Groth16      │  │ Ephemeral    │           │   │
│  │  │ Poseidon     │  │ Intent VK    │  │ Keys         │           │   │
│  │  │ Nullifiers   │  │ Commitments  │  │ Ed25519      │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ JWK Registry │  │ Gateway      │  │ x402         │           │   │
│  │  │              │  │ Factory      │  │ Facilitator  │           │   │
│  │  │ Google Keys  │  │              │  │              │           │   │
│  │  │ Apple Keys   │  │ Deterministic│  │ HTTP 402     │           │   │
│  │  │ Modulus Hash │  │ Wallet Deploy│  │ Intent Gate  │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Internal Components:**

Demo Application (Next.js 15): The reference implementation showing zkLogin authentication, streaming payments, intent verification, and x402 micropayments. Includes 13 API routes, a dashboard, a payment scanner, and a streaming payments manager.

TypeScript SDK (@stellar-zklogin/sdk): The primary developer interface. Contains ZkLoginClient for authentication, IntentClient for near intent proofs, X402PaymentClient for micropayments, React hooks for frontend integration, and all cryptographic utilities (Poseidon, BN254 field arithmetic, Ed25519 key management).

Prover Service (Rust/Axum): Generates Groth16 proofs from JWTs and intent witnesses. Accepts proof requests over HTTP, computes circuit witnesses, and returns proofs with public inputs. Will be extended to generate intent proofs using the new intent circuit.

Salt Service (Rust/Axum): Derives deterministic salts from JWTs using HKDF SHA256. Ensures the same OAuth identity always maps to the same wallet address while preventing correlation attacks.

Soroban Smart Contracts: Six contracts (5 existing plus 1 new intent verifier) running on Stellar with Protocol 25 native cryptographic operations.


### Architecture Constraints

**Regulatory:** The system is designed for complete privacy by default. No personal data is stored on chain. The salt service can be deployed in any jurisdiction. The system complies with GDPR by design because no personal data is collected or stored.

**Protocol 25 Dependency:** All ZK verification requires Protocol 25 host functions (BN254 pairing and Poseidon hashing). The system cannot operate on Stellar versions prior to Protocol 25. Testnet is operational; mainnet support depends on the Protocol 25 mainnet vote.

**Circuit Size:** Groth16 circuits have a one time trusted setup. Changing the circuit requires generating new proving and verification keys. The system is designed with separate verification keys for zkLogin and intent proofs to allow independent updates.

**Browser Constraints:** Proof generation happens client side. Circuit size must remain small enough for browser based proving (target: under 3 seconds). The balance intent circuit is designed to be lightweight (fewer constraints than the zkLogin circuit).



## 11. Contract Overview

### Existing Contracts (5, Deployed on Testnet)

#### ZK Verifier Contract
**Address:** CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6

**Purpose:** On chain Groth16 proof verification using Protocol 25 native BN254 pairing operations. This is the cryptographic heart of the system.

**Key Methods:**
initialize(admin, vk): Sets up the contract with administrator address and Groth16 verification key. The verification key must have exactly 6 input commitments (5 zkLogin public inputs plus 1 constant).

verify_zklogin_proof(proof, public_inputs): Verifies a Groth16 proof by computing the linear combination vk_x = IC[0] + sum(input[i] * IC[i+1]) and performing the multi pairing check e(neg_A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) = 1. Uses Protocol 25 bn254_multi_pairing_check for 94% gas savings.

compute_nonce(eph_pk_high, eph_pk_low, max_epoch, randomness): Computes session nonce as Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness) using Protocol 25 native Poseidon.

compute_address_seed(kc_name_hash, kc_value_hash, aud_hash, salt): Computes address seed as Poseidon(kc_name, kc_value, aud, Poseidon(salt)).

is_nullifier_used(nullifier): Checks the nullifier registry for replay protection.


#### Smart Wallet Contract
**Purpose:** Custom Soroban account contract implementing zkLogin authentication with session based ephemeral key signing.

**Key Methods:**
initialize(address_seed, iss_hash, zk_verifier, jwk_registry): Sets up the wallet with identity binding.

add_session(proof, public_inputs, eph_pk): Registers a new authenticated session after verifying the ZK proof.

transfer(token, to, amount, auth): Sends tokens using session authorization.

execute(contract, function, args, auth): Calls arbitrary Soroban contract functions.

__check_auth(signature_payload, signature, auth_contexts): Custom auth interface that verifies Ed25519 signatures from ephemeral keys.


#### Gateway Factory Contract
**Address:** CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76

**Purpose:** Deterministic wallet deployment using CREATE2 style address prediction.

**Key Methods:**
predict_address(iss_hash, address_seed): Predicts wallet address before deployment using Blake2b_256(0x05 || iss_hash || address_seed).

deploy_wallet(address_seed, iss_hash): Deploys a new smart wallet or returns the existing one.


#### JWK Registry Contract
**Address:** CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I

**Purpose:** Stores and manages OAuth provider public keys (JWKs) for proof verification.

**Key Methods:**
register_provider(name, issuer, jwks_uri, oracle): Adds an OAuth provider.

register_jwk(provider_name, kid, modulus_chunks, exponent, alg): Stores a JWK with its RSA modulus split into 17 chunks of 121 bits.

compute_modulus_hash(chunks): Tree structure Poseidon hash of 17 RSA modulus chunks for ZK circuit compatibility.


#### x402 Facilitator Contract
**Address:** CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ

**Purpose:** Implements HTTP 402 Payment Required protocol for micropayments.

**Key Methods:**
create_request(asset, amount, destination, resource_id, valid_for_secs): Server creates a payment request.

pay(request_id, payer): Client executes payment through zkLogin wallet.

is_paid(request_id): Server verifies payment completion.


### New Contract (Proposed)

#### Intent Verifier Contract

**Purpose:** Verifies near intent ZK proofs. Architecturally identical to the ZK Verifier but configured for intent circuits with 3 to 4 public inputs instead of 5.

**Key Methods:**
initialize(admin, intent_vk): Sets up with an intent specific verification key. The IC array size matches the intent circuit's public input count.

verify_intent(proof, public_inputs): Verifies a Groth16 intent proof. Same pairing check algorithm as zkLogin verification. Same Protocol 25 host functions. Different verification key.

register_intent(commitment, expiry): Stores an intent commitment (Poseidon hash of intent parameters) with an expiration ledger sequence.

is_intent_valid(commitment): Returns true if the commitment exists and the current ledger is before the expiry.

revoke_intent(commitment): Allows the original prover to revoke their intent commitment.

**Sequence: Intent Gated x402 Payment**

```
    User              dApp Server         Intent Verifier      x402 Facilitator
     │                    │                     │                     │
     │  GET /resource     │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │  402 + require     │                     │                     │
     │  intent proof      │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
     │  Generate balance  │                     │                     │
     │  intent proof      │                     │                     │
     │  (client side)     │                     │                     │
     │                    │                     │                     │
     │  Submit intent     │                     │                     │
     │  proof             │  verify_intent()    │                     │
     │───────────────────>│────────────────────>│                     │
     │                    │                     │                     │
     │                    │  true               │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │  Intent verified   │                     │                     │
     │  Proceed to pay    │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
     │  Execute payment   │                     │   pay()             │
     │───────────────────>│─────────────────────│──────────────────>  │
     │                    │                     │                     │
     │                    │                     │   payment confirmed │
     │                    │                     │<──────────────────  │
     │                    │                     │                     │
     │  Resource          │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
```



## 12. Technology Stack

### Backend

| Technology | Purpose | Details |
|-----------|---------|---------|
| Rust | Smart contracts and services | Soroban SDK for contracts, Axum for HTTP services |
| Soroban SDK | Contract development | Version compatible with Protocol 25 host functions |
| soroban-poseidon | ZK friendly hashing | BN254 scalar field Poseidon implementation |
| Axum | HTTP framework | Prover and salt service endpoints |
| SnarkJS | Proof generation | Groth16 proving with BN254 curve |
| Circom | Circuit compiler | zkLogin and intent circuits |
| PostgreSQL (Neon) | Database | User sessions, payment streams, waitlist |

### Frontend

| Technology | Purpose | Details |
|-----------|---------|---------|
| Next.js 15 | Application framework | App router, server components, API routes |
| React 18 | UI library | Hooks, context, concurrent features |
| TypeScript | Type safety | Strict mode throughout |
| Tailwind CSS | Styling | Utility first with custom theme |
| Framer Motion | Animations | Page transitions, component animations |
| poseidon-lite | Client side hashing | Browser compatible Poseidon implementation |

### Infrastructure

| Technology | Purpose | Details |
|-----------|---------|---------|
| Vercel | Demo hosting | Serverless Next.js deployment |
| Stellar Testnet | Smart contracts | Soroban RPC at soroban-testnet.stellar.org |
| Stellar Mainnet | Production (planned) | Soroban RPC at soroban.stellar.org |
| Neon PostgreSQL | Serverless database | Streaming payments and session storage |
| GitHub Actions | CI/CD | Automated testing and deployment |



## 13. Automated Testing

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Smart Contracts | Soroban SDK test framework (cargo test) | 100% on critical paths, 80% overall |
| TypeScript SDK | Jest with TypeScript support | 90% on public API, 80% overall |
| Circom Circuits | Circom test framework with witness verification | 100% on constraint satisfaction |
| Integration | Custom end to end test suite | All critical user flows |
| Security | Slither (static analysis), custom fuzzing | All contract entry points |
| Performance | Custom gas benchmarking suite | All on chain operations profiled |



## 14. Integrations

| Service | Purpose | Type |
|---------|---------|------|
| Google OAuth 2.0 | User authentication (primary provider) | External API |
| Apple Sign In | User authentication (secondary provider) | External API |
| Stellar Horizon API | Account queries and transaction submission | Blockchain API |
| Stellar Soroban RPC | Smart contract invocation and simulation | Blockchain API |
| CoinGecko API | XLM price data for UI display | External API |
| Neon PostgreSQL | Serverless database for application state | Database |
| Vercel | Hosting and serverless functions | Infrastructure |



## 15. Additional Documents

| Document | Location | Description |
|----------|----------|-------------|
| Project Repository | https://github.com/Adwaitbytes/StellaRay | Complete source code: contracts, SDK, demo, services |
| Live Demo | https://stellargateway.vercel.app | Testnet demo with Google login, payments, and streaming |
| Protocol 25 Integration Guide | docs/PROTOCOL_25_INTEGRATION.md | Detailed documentation of BN254 and Poseidon usage |
| Security Audit Preparation | docs/SECURITY_AUDIT_PREP.md | Threat model, attack surface analysis, audit checklist |
| Performance Benchmarks | docs/BENCHMARKS.md | Gas costs, latency metrics, comparison data |
| Product Roadmap | docs/ROADMAP.md | 12 month plan with KPIs |
| Technical Documentation | docs/COMPLETE_DOCUMENTATION.md | Full technical specification |
| Deployment Guide | docs/DEPLOYMENT.md | Infrastructure and deployment instructions |

### Testnet Contract Explorer Links

ZK Verifier: https://stellar.expert/explorer/testnet/contract/CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6

JWK Registry: https://stellar.expert/explorer/testnet/contract/CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I

Gateway Factory: https://stellar.expert/explorer/testnet/contract/CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76

x402 Facilitator: https://stellar.expert/explorer/testnet/contract/CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ


### Performance Summary

| Metric | Value |
|--------|-------|
| Groth16 Verification Gas | 260,000 (94% savings vs WASM) |
| Poseidon Hash Gas | 50,000 (90% savings vs WASM) |
| Full Login Cost | Approximately $0.03 |
| Proof Generation (Browser) | 2 to 4 seconds |
| Transaction Confirmation | 5 seconds |
| First Login (Full Flow) | 8 to 10 seconds |
| Return Login | 3 to 5 seconds |


### Competitive Positioning

| Feature | StellaRay | Sui zkLogin | Web3Auth | Magic |
|---------|-----------|-------------|----------|-------|
| True Zero Knowledge | Yes | Yes | No | No |
| Protocol 25 Native | Yes | N/A | No | No |
| No Trusted Backend | Yes | No | No | No |
| Near Intent Proofs | Yes (unique) | No | No | No |
| Gas Efficiency | 94% savings | Baseline | N/A | N/A |
| x402 Integration | Yes | No | No | No |
| Open Source | Full | Full | Partial | No |
| Self Custody | Full | Full | MPC based | Custodial |
| Intent Gated Payments | Yes (unique) | No | No | No |



## Summary

StellaRay is building the ZK layer for Stellar. We have already delivered 5 deployed smart contracts, a production ready SDK, and a live demo. The Near Intent extension transforms this authentication layer into a complete privacy infrastructure: any dApp can verify that a user is ready to act on chain, privately and trustlessly, using the same Groth16 and BN254 and Poseidon infrastructure that already works.

The requested $150,000 funds security audits, mainnet deployment, intent circuit development, and ecosystem growth. Every dollar goes directly into code, security, and adoption. No marketing budgets, no office space, no overhead.

We are the only team on Stellar with production grade ZK proof verification using Protocol 25 native primitives. Near intent proofs give Stellar a capability that no other blockchain has. This is not incremental improvement. This is a new category of blockchain primitive.

**"We don't just onboard users. We prove when they're ready to act, privately."**
