# StellaRay Community Engagement Templates

Use these templates for SCF campaign community engagement. Active participation helps with Neural Quorum Governance voting.

---

## Twitter/X Posts

### Announcement Thread (Post when submitting)

**Tweet 1:**
```
We just submitted StellaRay for the @StellarCF Build Award!

zkLogin for Stellar: Sign in with Google, get a self-custody wallet in 8 seconds.

No seed phrases. No browser extensions. Just ZK proofs.

Thread on what we built and why it matters for Stellar...
```

**Tweet 2:**
```
The Problem:

68% of crypto users quit before they even start.

Why? Seed phrases. Browser extensions. Complexity.

StellaRay eliminates all of it with zero-knowledge authentication.
```

**Tweet 3:**
```
How zkLogin Works:

1. Click "Sign in with Google"
2. Groth16 ZK proof verifies your OAuth token
3. Deterministic wallet derived via Poseidon hash
4. Same Google = same wallet, every time

Your identity? Never on-chain. Full self-custody.
```

**Tweet 4:**
```
Why Stellar specifically?

Protocol 25 added native BN254 + Poseidon host functions.

Before: Groth16 verification = 4.1M gas
After: 260K gas (94% cheaper)

We're the FIRST project using these Protocol 25 primitives in production.
```

**Tweet 5:**
```
What we've built (self-funded, $0 external):

- 5 Soroban smart contracts
- TypeScript SDK (57+ exports)
- Live demo app (17 pages, 26 APIs)
- ZK proof pipeline
- Block explorer
- Admin dashboard

15,000+ lines of code. MIT licensed. Try it: stellaray.fun
```

**Tweet 6:**
```
What the grant enables:

1. Security audit (Trail of Bits/Halborn)
2. Mainnet deployment
3. Near Intent - prove you CAN pay without revealing your balance
4. Apple Sign-In support

Public infrastructure for the entire Stellar ecosystem.
```

**Tweet 7:**
```
Support StellaRay in the @StellarCF Build Award!

Live demo: stellaray.fun
GitHub: github.com/Adwaitbytes/StellaRay
Grant submission: [link]

Let's bring zkLogin to Stellar mainnet.

#Stellar #ZeroKnowledge #Web3
```

---

### Quick Posts (Use throughout campaign)

**Technical Achievement:**
```
Just ran the numbers on Protocol 25 gas savings:

WASM Groth16: 4,100,000 gas
Native BN254: 260,000 gas

94% reduction.

This is why zkLogin is viable as a product. Thank you @StellarOrg for building this.
```

**Demo Highlight:**
```
8 seconds.

That's how long it takes to get a Stellar wallet with StellaRay.

Google Sign-In -> ZK proof -> Wallet address

No seed phrase. No extension. No friction.

Try it: stellaray.fun
```

**Privacy Feature:**
```
"But what about privacy?"

With zkLogin:
- Your email: never exposed
- Your Google ID: never on-chain
- Your wallet: fully anonymous

ZK proofs let you authenticate without revealing who you are.
```

**Near Intent Teaser:**
```
Coming with our SCF grant: Near Intent

Prove you CAN afford 100 USDC without revealing your balance.

Private lending. Anonymous donations. Confidential payroll.

No other blockchain has this.
```

**Support Ask:**
```
If you believe Stellar needs better onboarding, support StellaRay in the @StellarCF Build Award.

zkLogin removes the #1 barrier to adoption: wallet complexity.

Vote link: [link]
```

---

## Discord Posts

### Stellar Discord - Announcement

**Channel: #grants or #developers**

```
Hey everyone!

We just submitted StellaRay for the SCF Build Award and wanted to share what we've been building.

**What is StellaRay?**
zkLogin for Stellar - sign in with Google, get a self-custody wallet. No seed phrases, no extensions.

**Why does it matter?**
68% of wallet users quit before setup. zkLogin removes that friction entirely.

**What's unique about it?**
We're the first project using Protocol 25's native BN254 and Poseidon host functions in production. 94% gas savings vs WASM.

**What we've built (self-funded):**
- 5 Soroban contracts deployed
- TypeScript SDK with 57+ exports
- Live demo: stellaray.fun
- 15,000+ lines of code, MIT licensed

**What the grant enables:**
- Security audit
- Mainnet deployment
- Near Intent (prove you can pay without revealing balance)
- Apple Sign-In

Would love your feedback! Try the demo and let us know what you think.

Grant submission: [link]
Demo: https://stellaray.fun
GitHub: https://github.com/Adwaitbytes/StellaRay
```

### Follow-up Discussion Posts

**Technical Question Response:**
```
Great question! The ZK proof verification uses Protocol 25's native BN254 pairing check (CAP-0074) and Poseidon hashing (CAP-0075).

Here's the flow:
1. User signs in with Google OAuth
2. Browser generates Groth16 proof (~1.1M constraints)
3. Proof sent to our ZK Verifier contract
4. Native `bls12_381_multi_pairing_check` verifies proof
5. Wallet address derived from Poseidon hash of addressSeed

Gas cost: 260,000 (vs 4.1M in WASM)
Proof time: 8-10 seconds first login, 3-5 return

Happy to dive deeper into any part of the architecture!
```

**SDK Integration Question:**
```
Integration is designed to be dead simple:

```typescript
import { ZkLoginClient } from '@stellaray/sdk';

const client = new ZkLoginClient({ network: 'testnet' });
await client.connect('google');
console.log(client.getAddress()); // Your Stellar address
```

That's it - 3 lines.

The SDK handles:
- OAuth flow
- ZK proof generation
- Ephemeral key management
- Session handling

Docs: stellaray.fun/sdk
Playground: stellaray.fun/playground
```

---

## Medium/Blog Article Outline

### Title: "How We Built zkLogin for Stellar Using Protocol 25"

**Sections:**

1. **Introduction**
   - The wallet onboarding problem
   - Why 68% of users quit before setup

2. **What is zkLogin?**
   - OAuth to self-custody wallet conversion
   - Zero identity on-chain
   - Deterministic address derivation

3. **Why Stellar Protocol 25?**
   - Native BN254 and Poseidon support
   - Gas savings: 94% reduction
   - Why this wasn't possible before January 2026

4. **Technical Deep Dive**
   - Groth16 circuit overview (~1.1M constraints)
   - On-chain verification flow
   - Ephemeral key architecture

5. **What We Built**
   - 5 contracts, SDK, demo app
   - Self-funded journey
   - Open source philosophy

6. **What's Next: Near Intent**
   - Privacy-preserving intent verification
   - Balance, eligibility, stream intents
   - Why this is unique to Stellar

7. **Try It Yourself**
   - Demo link
   - SDK integration guide
   - SCF grant support request

---

## Engagement Tips

### Do's:
- Respond to every comment on your posts
- Thank people who share your content
- Answer technical questions in detail
- Share updates on development progress
- Cross-post between Twitter and Discord
- Engage with other SCF submissions positively

### Don'ts:
- Don't spam the same message repeatedly
- Don't criticize competing projects
- Don't make promises you can't keep
- Don't ignore critical feedback
- Don't automate engagement (be genuine)

### Weekly Cadence:
- **Monday:** Technical insight post (Protocol 25, ZK proofs)
- **Wednesday:** Feature highlight (demo, SDK, etc.)
- **Friday:** Community engagement (Q&A, thanks, progress update)

---

## Engagement Tracking

| Date | Platform | Post Type | Engagement | Notes |
|------|----------|-----------|------------|-------|
| | Twitter | Announcement | | |
| | Discord | Introduction | | |
| | Twitter | Technical | | |
| | Discord | Q&A | | |

---

## Key Hashtags

- #Stellar
- #StellarCF
- #ZeroKnowledge
- #zkLogin
- #Web3
- #DeFi
- #Protocol25
- #Blockchain

---

## Helpful Links to Share

| Resource | URL |
|----------|-----|
| Live Demo | https://stellaray.fun |
| GitHub | https://github.com/Adwaitbytes/StellaRay |
| SDK Docs | https://stellaray.fun/sdk |
| Playground | https://stellaray.fun/playground |
| Explorer | https://stellaray.fun/explorer |
| Twitter | https://x.com/stellaraydotfun |
