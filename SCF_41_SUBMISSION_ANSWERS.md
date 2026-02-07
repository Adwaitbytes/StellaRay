# SCF #41 — StellaRay Submission Answers
## Ready to Copy-Paste

---

## 1. Project Title

```
StellaRay: ZK Authentication & Privacy Layer for Stellar
```

---

## 2. Project Description

**FULL VERSION (for fields with no character limit):**
```
StellaRay eliminates the single biggest barrier to Stellar adoption — seed phrases — by replacing them with Google Sign-In powered by zero-knowledge proofs verified natively on Soroban.

THE PROBLEM
68% of first-time crypto users abandon the onboarding process before completing it (ConsenSys 2024). The root cause is the same across every chain: seed phrases, browser extensions, and exposed transaction histories. MPC wallets partially address this but introduce server dependency — if the key-share server goes down, users lose access. Stellar has the fastest, cheapest payment rails in crypto, but no production-grade ZK authentication layer exists to make those rails accessible to normal people.

THE SOLUTION
StellaRay converts a standard Google OAuth token into a Groth16 zero-knowledge proof. That proof verifies on-chain through Soroban smart contracts using the BN254 elliptic curve and Poseidon hash operations introduced natively in Stellar Protocol 25 (January 2026). The result: a fully self-custodial Stellar wallet created in under 10 seconds, with zero identity exposed on chain. Same Google account always produces the same deterministic wallet. Lose your phone? Sign in again. Done.

THREE PRODUCT LAYERS
1. ZK Wallet — Google OAuth → Groth16 proof → deterministic Stellar keypair. On-chain verification at $0.03 per login (down from $0.50 pre-Protocol 25). True self-custody with no server holding key shares.

2. Payments — Shareable payment links with QR codes, real-time streaming payments with Soroban escrow settlement, and x402 HTTP micropayments. All transactions route through the ZK wallet layer, carrying zero identity metadata.

3. Near Intent — A new cryptographic primitive: ZK proofs that verify user state (balance sufficiency, eligibility, stream completion) without revealing the underlying data. This enables private lending, anonymous donations, and confidential payroll as composable Soroban building blocks for any Stellar dApp.

FOR DEVELOPERS
StellaRay ships a published TypeScript SDK (@stellar-zklogin/sdk) with 101+ exports and React hooks. Any Stellar developer can add ZK-powered Google login to their dApp in three lines of code:

  import { ZkLoginClient } from '@stellar-zklogin/sdk'
  const client = new ZkLoginClient({ network: 'mainnet' })
  const wallet = await client.loginWithGoogle()

This transforms 2 billion Google accounts into potential Stellar wallets — not as a theoretical claim, but as working infrastructure that exists on testnet today.

WHY STELLAR, WHY NOW
Protocol 25 shipped native BN254 and Poseidon host functions in January 2026, reducing ZK verification gas costs by 94%. Before this, production-grade ZK proofs on Stellar were economically impractical. StellaRay is the first project to build on top of these capabilities. Our success directly validates SDF's investment in native ZK cryptography and creates a reusable authentication layer for the entire ecosystem.

WHAT ALREADY EXISTS
The entire platform is live on testnet at stellaray.fun — 5 deployed Soroban contracts, 26 API endpoints, 17 application routes, a published npm SDK, and a whitepaper. All built with $0 in external funding by a team of four. We are not asking for money to start building. We are asking for support to harden the infrastructure, deploy to mainnet, and scale developer adoption across the Stellar ecosystem.
```

---

**COMPACT VERSION (under 1,100 characters — use this for character-limited fields):**
```
StellaRay replaces seed phrases with Google Sign-In powered by zero-knowledge proofs verified natively on Soroban. A Google OAuth token becomes a Groth16 ZK proof, verified on-chain using Protocol 25's BN254 and Poseidon host functions — producing a self-custodial Stellar wallet in under 10 seconds. No seed phrase, no extension, zero identity on chain.

Three layers: ZK Wallet (Google → deterministic keypair, $0.03/proof), Payments (payment links, streaming escrow, x402 micropayments), and Near Intent — a new primitive where ZK proofs verify user state without revealing data, enabling private lending and confidential payroll as composable Soroban building blocks.

Published TypeScript SDK (@stellar-zklogin/sdk) lets any Stellar dApp add ZK Google login in 3 lines of code, turning 2B Google accounts into potential Stellar wallets.

Live on testnet: 5 Soroban contracts, 26 endpoints, npm SDK — built with $0 funding. First project using Protocol 25 ZK primitives. Not asking to start building. Asking to go mainnet.
```
*Character count: ~1,030 characters*

---

## 3. Project Category

```
Infrastructure & Tooling
```

**Why this category (not "End-User Application"):**
SCF reviewers prioritize ecosystem impact. StellaRay's SDK enables OTHER Stellar dApps to add ZK authentication — this is infrastructure that multiplies ecosystem value. Funded infrastructure projects (Soroban Explorer $100K, NebulaVRF $34K, Trustless Work $70K) consistently get selected because they serve multiple projects, not just end-users. The wallet is the proof-of-concept; the SDK is the product.

If "Infrastructure & Tooling" is not available as a category, choose **"Developer Tooling"**. If neither exists, then "End-User Application" works as fallback.

---

## 4. Current Traction

```
StellaRay is live on Stellar testnet with a fully functional product at stellaray.fun. All metrics below are organic — zero paid promotion, zero ad spend.

PRODUCT TRACTION (ALL LIVE ON TESTNET)
• 5 Soroban smart contracts deployed and operational: ZK Verifier, Smart Wallet Factory, Gateway Factory, JWK Registry, Payment Escrow
• 26 REST API endpoints serving the platform
• 17 application routes (dashboard, wallet, payments, streaming, explorer, SDK playground)
• Full ZK login flow functional: Google Sign-In → Groth16 proof generation → on-chain verification → wallet creation in <10 seconds
• Streaming payments with escrow settlement operational
• Payment links with QR code generation live
• Built-in transaction explorer functional

DEVELOPER TRACTION
• @stellar-zklogin/sdk published on npm with 101+ downloads (organic, no promotion)
• 101+ SDK exports available (ZkLoginClient, StreamingClient, React hooks, UI components)
• TypeScript strict mode, full type coverage
• Whitepaper published and available at stellaray.fun

CODEBASE
• 15,000+ lines of production code across smart contracts, SDK, API, and frontend
• Open source: github.com/Adwaitbytes/StellaRay
• All built with $0 in external funding

COMMUNITY & SOCIAL (1 WEEK SINCE PUBLIC LAUNCH)
• 123 Twitter/X followers (organic)
• Pinned launch tweet: 6,052 views, 119 likes, 45 retweets, 41 replies
• Ecosystem recognition tweet from Kaan Kacar: 2,565 views, 27 likes, 8 retweets
• 47 posts published
• Featured at Singularity event (Day 1, on the wall)

EVIDENCE LINKS
• Live testnet: https://stellaray.fun
• Pitch deck: https://stellaray.fun/pitch-deck.html
• GitHub: https://github.com/Adwaitbytes/StellaRay
• npm: https://www.npmjs.com/package/@stellar-zklogin/sdk
• Twitter/X: https://x.com/stellaraydotfun
```

---

## 5. Website

```
https://stellaray.fun
```

---

## 6. Planned Stellar Integration

```
StellaRay is built entirely on Stellar and Soroban. Every component interacts directly with the Stellar tech stack — there is no other chain involved.

SOROBAN SMART CONTRACTS (5 DEPLOYED ON TESTNET)

1. ZK Verifier Contract — Accepts Groth16 proofs and verifies them using Soroban's native BN254 elliptic curve pairing and Poseidon hash host functions (introduced in Protocol 25). This is the cryptographic core: it confirms a user controls a valid Google OAuth token without seeing the token itself. Uses env.crypto_bls12_381_* and Poseidon host functions directly.

2. Smart Wallet Factory — Deploys deterministic Soroban smart wallets for each verified user. The wallet address is derived from the ZK proof's public signals, ensuring the same Google account always maps to the same Stellar wallet. Implements Soroban auth framework for transaction signing.

3. Gateway Factory — Manages the lifecycle of ZK-authenticated sessions, handles proof caching, and routes authenticated calls to the appropriate wallet contracts. Acts as the entry point for all SDK interactions with the Soroban runtime.

4. JWK Registry Contract — Stores and rotates Google's JSON Web Key (JWK) public keys on-chain. This allows the ZK Verifier to validate that proofs were generated against current, legitimate Google signing keys without trusting any off-chain server.

5. Payment Escrow Contract — Handles streaming payment logic with time-locked escrow settlement on Soroban. Supports continuous XLM and token streams with configurable release schedules, cancellation policies, and ZK-authenticated withdrawal.

PROTOCOL 25 INTEGRATION (CRITICAL)
StellaRay is the first production application leveraging Stellar Protocol 25's native ZK cryptographic primitives:
• BN254 elliptic curve pairing operations for Groth16 proof verification
• Poseidon hash function for circuit-friendly hashing
• These native host functions reduce verification gas from ~4,100,000 to ~260,000 (94% reduction), making ZK authentication economically viable at $0.03 per verification

STELLAR CLASSIC INTEGRATION
• Payment links use Stellar Classic operations for XLM and asset transfers
• Transaction explorer reads from Stellar Horizon API
• Wallet balances and transaction history via Horizon REST endpoints

SDK INTEGRATION
• @stellar-zklogin/sdk wraps stellar-sdk and soroban-client internally
• React hooks (useZkLogin, useWallet, useStreaming) abstract contract interactions
• Compatible with Freighter wallet for users who prefer traditional signing
• All SDK methods interact directly with Soroban RPC endpoints

MAINNET DEPLOYMENT PLAN
• Deploy all 5 contracts to Stellar mainnet after security hardening
• Register verified contract hashes for Soroban Explorer compatibility
• Establish JWK Registry update cadence matching Google's key rotation schedule
• Integrate with existing Stellar wallets (Freighter, Lobstr) as an authentication provider
```

---

## 7. Build Track

```
Open Track
```

**Reasoning:** StellaRay creates a new primitive (ZK authentication + Near Intent proofs) rather than integrating existing Stellar ecosystem components. The Open Track is evaluated on ecosystem impact, originality, and technical soundness — all areas where StellaRay is strongest. If "Open Track" is not listed, select the general "Build" track.

---

## 8. Project Thumbnail

Use a 16:9 image with:
- StellaRay logo (the eye + lightning bolt SVG from pitch deck)
- Tagline: "Prove Everything. Reveal Nothing."
- Dark background (#0A0A0A) with blue (#0066FF) accent
- Tags: "ZK Wallet" / "Privacy" / "Protocol 25"
- Clean, minimal — no clutter

(You already have the design system from your pitch deck. Create a 1920x1080 export.)

---

## 9. Submitter Type

```
Team
```

---

## 10. Email

```
adwaitkeshari288@gmail.com
```

---

## 11. Team Description

```
StellaRay is built by a team of four, self-funded and based in India. We wrote 15,000+ lines of production code and deployed 5 Soroban smart contracts to testnet before seeking any external funding. We build first, then ask.

Adwait Keshari — Co-Founder & Product Lead
Designed and built the entire user-facing platform: dashboard, wallet interface, payment links, streaming payments, transaction explorer, SDK playground, and whitepaper. Responsible for product architecture, API design (26 endpoints), frontend engineering (17 routes), and developer experience. Leads the overall product vision and SCF submission.
LinkedIn: https://linkedin.com/in/adwaitkeshari

Yatharth Tripathi — Co-Founder & Technical Lead
Architected and implemented all zero-knowledge cryptography: Groth16 circuit design, BN254 pairing integration, Poseidon hash circuits, and all 5 Soroban smart contracts (ZK Verifier, Smart Wallet Factory, Gateway Factory, JWK Registry, Payment Escrow). Deep expertise in Protocol 25's native cryptographic host functions. Sole author of the ZK proof generation pipeline.
LinkedIn: https://linkedin.com/in/yatharthtripathi

Atharv Shrivastav — Operations Head
Drives operations strategy, ecosystem partnerships, community building, and brand positioning. Manages outreach to Stellar ecosystem projects for SDK integration partnerships and coordinates the project's go-to-market execution.
LinkedIn: https://linkedin.com/in/atharvshrivastav

Niharika — Chief Marketing Officer
Leads content strategy, developer education materials, visual storytelling, and social media presence. Built the project's organic social following (123 followers, 6,000+ tweet views) in one week with zero paid promotion.
LinkedIn: https://linkedin.com/in/niharika

TEAM STRENGTHS
• Full-stack technical capability across ZK cryptography, Soroban/Rust, TypeScript, React, and API design
• Demonstrated execution: shipped a complete product with zero funding
• Active in Stellar developer community and Discord
• All team members are available full-time for project development upon award
```

**Note:** Replace the LinkedIn URLs above with your actual LinkedIn profile URLs before submitting.

---

## 12. Referral

```
No
```

**Strategic note:** If you have ANY connection to Stellar ecosystem members — ambassadors, SCF alumni, SDF staff, accelerator mentors — reach out to them BEFORE submitting. SCF 7.0 introduced a referral system where endorsed teams receive "stronger trust signals and faster reviews." Even a single referral from a known ecosystem actor significantly improves your odds. Check the Stellar Discord, past SCF winners, or anyone from Singularity who recognized your project.

---

# STRATEGIC NOTES

## Budget Recommendation (for the full submission)
**Ask: $85,000–$95,000**

Breakdown (engineering hours only — DO NOT include audit costs, SCF has a separate Audit Bank):
- Mainnet contract hardening & deployment: 320 hrs × $30/hr = $9,600
- Near Intent circuit development (Balance, Eligibility, Stream proofs): 600 hrs × $30/hr = $18,000
- SDK v2 (stable API, expanded React hooks, documentation): 500 hrs × $30/hr = $15,000
- Wallet integration layer (Freighter, Lobstr compatibility): 300 hrs × $30/hr = $9,000
- Infrastructure & DevOps (Soroban RPC, monitoring, CI/CD): 250 hrs × $30/hr = $7,500
- JWK Registry mainnet key rotation system: 200 hrs × $30/hr = $6,000
- Developer documentation & integration guides: 200 hrs × $25/hr = $5,000
- Testing & QA (contract fuzzing, SDK test suite): 300 hrs × $30/hr = $9,000
**Total: ~$79,100 → Round to $80,000**

This positions you below the $120K average ask, demonstrating fiscal responsibility while covering real engineering costs. A team that built $0-funded testnet product asking for only $80K to go mainnet is the strongest value proposition in the round.

## Key Differentiators to Emphasize
1. **Already built** — 90% of applicants are asking for money to START. You already HAVE a product.
2. **Protocol 25 first mover** — You are the ONLY project using native BN254/Poseidon host functions in production.
3. **Ecosystem multiplier** — Your SDK enables every other Stellar dApp to add ZK login. This is infrastructure, not just an app.
4. **Near Intent is novel** — No other blockchain has this primitive. It is original to StellaRay.
5. **Self-funded execution** — Proves the team ships without capital. The grant accelerates, it does not enable.

## What NOT to Include in Budget
- Security audit costs (use SCF's Audit Bank — it's free and separate)
- Marketing or user acquisition costs (not allowed by SCF)
- Token creation or promotion (SCF explicitly rejects this)
- General business expenses unrelated to Stellar development
