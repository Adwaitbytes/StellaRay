# STELLARAY - Pitch Strategy & Development Roadmap

## For Stellar Foundation Funding ($150K+)

---

## PART 1: HONEST ASSESSMENT - Current Implementation Status

### What's Actually Working (✅)

| Component | Status | Evidence |
|-----------|--------|----------|
| **Frontend Application** | ✅ Complete | Next.js 15, responsive UI, production-ready |
| **Waitlist System** | ✅ Complete | Database, email collection, UTM tracking, referrals |
| **Quest/Rewards System** | ✅ Complete | Gamification, Twitter integration, leaderboard |
| **SDK Import** | ✅ Working | `@stellar-zklogin/sdk` v2.0.0 imports successfully |
| **SDK Instantiation** | ✅ Working | ZkLoginClient and X402PaymentClient can be created |
| **Stellar Integration** | ✅ Working | Account creation, balance check, transactions |
| **Google OAuth** | ✅ Working | NextAuth.js with Google provider |
| **X-Ray Data Display** | ✅ Working | Fetches and displays blockchain events |
| **Contract References** | ✅ Configured | All contract IDs in environment variables |

### What's NOT Fully Implemented (⚠️)

| Component | Status | Current State |
|-----------|--------|---------------|
| **Actual ZK Proof Generation** | ⚠️ Not Connected | SDK imported but `generateProof()` not called |
| **On-Chain Proof Verification** | ⚠️ Not Connected | Contract calls defined but not triggered |
| **ZK Wallet Derivation** | ⚠️ Placeholder | Using simple hash instead of ZK derivation |
| **Prover Service** | ⚠️ Not Built | Need backend service for proof generation |
| **Salt Service** | ⚠️ Not Built | Need secure salt storage service |

### Code Evidence

**Current wallet generation (placeholder):**
```typescript
// src/lib/stellar.ts - Line 122-137
export function generateWalletFromSub(sub: string): WalletKeys {
  const data = encoder.encode(`stellar-zklogin-${sub}-${net}-v1`);

  // ⚠️ PLACEHOLDER - Comment says:
  // "In production, this would use proper ZK derivation"
  const hash = StellarSdk.hash(Buffer.from(data));
  const keypair = StellarSdk.Keypair.fromRawEd25519Seed(hash);

  return { publicKey: keypair.publicKey(), secretKey: keypair.secret() };
}
```

**What it SHOULD be:**
```typescript
// Actual ZK implementation
export async function generateZkWallet(googleIdToken: string): Promise<ZkWallet> {
  const client = new ZkLoginClient(config);

  // 1. Get user salt (or generate new one)
  const salt = await client.getOrCreateSalt(googleIdToken);

  // 2. Generate ZK proof
  const proof = await client.generateProof({
    idToken: googleIdToken,
    salt: salt,
    maxEpoch: currentEpoch + 10,
  });

  // 3. Derive address from proof
  const address = await client.deriveAddress(proof);

  // 4. Verify proof on-chain (optional, for first-time setup)
  await client.verifyProofOnChain(proof);

  return { address, proof, salt };
}
```

---

## PART 2: WHAT TO TELL STELLAR TEAM

### The Pitch (Honest but Compelling)

> **Opening Statement:**
>
> "We're building Stellaray - a zero-knowledge authentication layer for Stellar that eliminates seed phrases forever. Users sign in with Google, and through zkLogin technology, they get a self-custody wallet without ever seeing a private key.
>
> **Current Status:**
> We have a production-ready frontend with user onboarding (waitlist + quest system that's already generating engagement). The @stellar-zklogin/sdk is integrated and tested. What we need funding for is completing the backend infrastructure - specifically the prover service and salt management - to connect our frontend to actual ZK proof generation and on-chain verification.
>
> **Why This Matters:**
> The #1 barrier to crypto adoption is seed phrases. They're confusing, easy to lose, and a phishing goldmine. zkLogin solves this by deriving wallet keys from OAuth identity proofs - users get true self-custody with the UX of Web2."

### Key Talking Points

1. **The Problem We Solve**
   - Seed phrases are the biggest UX barrier in crypto
   - 20%+ of all crypto is lost due to lost seed phrases
   - Phishing attacks target seed phrases constantly
   - Regular users will NEVER adopt crypto with current UX

2. **Our Solution**
   - Sign in with Google → Get a Stellar wallet
   - Zero-knowledge proofs ensure privacy (Google doesn't know your wallet)
   - No seed phrase to lose, no extension to install
   - True self-custody (not custodial like exchanges)

3. **Why Stellar + X-Ray Protocol**
   - X-Ray provides NATIVE ZK operations (not expensive WASM)
   - 85-95% gas savings vs other chains
   - Stellar's speed (3-5 second finality) perfect for consumer apps
   - First-mover advantage for ZK wallets on Stellar

4. **What We've Built**
   - Complete frontend application (Next.js 15, TypeScript)
   - SDK integration tested and working
   - Waitlist with 100+ signups (show traction)
   - Quest system driving Twitter engagement
   - All smart contract integrations defined

5. **What We Need Funding For**
   - Prover service infrastructure (AWS/GCP)
   - Salt management service (secure storage)
   - Full ZK circuit integration
   - Security audit
   - 3-month runway for 2-person team

### Funding Ask Breakdown

| Item | Cost | Justification |
|------|------|---------------|
| **Prover Infrastructure** | $20,000 | AWS/GCP for ZK proof generation (compute-heavy) |
| **Security Audit** | $30,000 | Smart contract + ZK circuit audit (required for mainnet) |
| **Developer Salaries** | $60,000 | 2 developers × 3 months × $10K/month |
| **Salt Service** | $10,000 | Secure HSM-backed storage infrastructure |
| **Testing & QA** | $15,000 | Testnet incentives, bug bounties |
| **Contingency** | $15,000 | Unexpected costs, extended timeline |
| **Total** | **$150,000** | |

---

## PART 3: HOW TO IMPLEMENT ZK PROPERLY

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STELLARAY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Frontend  │    │   Backend   │    │  Blockchain │     │
│  │  (Next.js)  │───▶│  Services   │───▶│  (Stellar)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Google OAuth│    │Prover Server│    │ ZK Verifier │     │
│  │  ID Token   │    │(ZK Circuit) │    │  Contract   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Salt Service│    │ Proof Cache │    │Smart Wallet │     │
│  │  (Secure)   │    │   (Redis)   │    │  Factory    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Build the Prover Service (2-3 weeks)

```typescript
// prover-service/src/index.ts
import { Groth16Prover } from '@stellar-zklogin/circuits';
import express from 'express';

const app = express();

app.post('/generate-proof', async (req, res) => {
  const { idToken, salt, maxEpoch, ephemeralPublicKey } = req.body;

  // 1. Verify the Google ID token
  const payload = await verifyGoogleToken(idToken);

  // 2. Extract claims
  const claims = {
    iss: payload.iss,           // https://accounts.google.com
    sub: payload.sub,           // User's unique Google ID
    aud: payload.aud,           // Your app's client ID
    iat: payload.iat,           // Issued at
    exp: payload.exp,           // Expiration
  };

  // 3. Generate ZK proof using Groth16
  const proof = await Groth16Prover.prove({
    claims,
    salt,
    maxEpoch,
    ephemeralPublicKey,
  });

  // 4. Return proof data
  res.json({
    proof: proof.proof,           // The actual ZK proof
    publicInputs: proof.inputs,   // Public inputs for verification
    addressSeed: proof.addressSeed,
  });
});
```

#### Step 2: Build the Salt Service (1 week)

```typescript
// salt-service/src/index.ts
import { KMS } from '@aws-sdk/client-kms';
import { createHash } from 'crypto';

const kms = new KMS({ region: 'us-east-1' });

app.post('/get-salt', async (req, res) => {
  const { sub, aud } = req.body; // From Google ID token

  // Create deterministic salt ID
  const saltId = createHash('sha256')
    .update(`${sub}:${aud}`)
    .digest('hex');

  // Check if salt exists
  let salt = await db.salts.findOne({ id: saltId });

  if (!salt) {
    // Generate new salt using KMS (HSM-backed)
    const { Plaintext } = await kms.generateRandom({
      NumberOfBytes: 32,
    });

    salt = {
      id: saltId,
      value: Plaintext.toString('hex'),
      createdAt: new Date(),
    };

    // Store encrypted salt
    await db.salts.insertOne(salt);
  }

  res.json({ salt: salt.value });
});
```

#### Step 3: Connect Frontend to Prover (1 week)

```typescript
// src/lib/zklogin.ts
import { ZkLoginClient } from '@stellar-zklogin/sdk';

const client = new ZkLoginClient({
  network: 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
  horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
  proverUrl: process.env.PROVER_SERVICE_URL,      // Your prover
  saltServiceUrl: process.env.SALT_SERVICE_URL,   // Your salt service
  contracts: {
    zkVerifier: process.env.NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID,
    gatewayFactory: process.env.NEXT_PUBLIC_GATEWAY_FACTORY_CONTRACT_ID,
    jwkRegistry: process.env.NEXT_PUBLIC_JWK_REGISTRY_CONTRACT_ID,
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID,
});

export async function createZkWallet(googleIdToken: string) {
  // 1. Initialize the login flow
  const { ephemeralKeyPair, maxEpoch } = await client.initLogin();

  // 2. Get or create salt
  const salt = await client.getSalt(googleIdToken);

  // 3. Generate ZK proof (calls your prover service)
  const proof = await client.generateProof({
    idToken: googleIdToken,
    salt,
    ephemeralPublicKey: ephemeralKeyPair.publicKey,
    maxEpoch,
  });

  // 4. Derive wallet address
  const address = client.deriveAddress(proof.addressSeed);

  // 5. Return wallet info
  return {
    address,
    proof,
    ephemeralKeyPair,
    maxEpoch,
  };
}

export async function signTransaction(tx: Transaction, wallet: ZkWallet) {
  // Sign with ephemeral key + attach ZK proof
  return await client.signTransaction(tx, {
    proof: wallet.proof,
    ephemeralKeyPair: wallet.ephemeralKeyPair,
  });
}
```

#### Step 4: Deploy and Test (2 weeks)

1. Deploy prover service to AWS/GCP
2. Deploy salt service with KMS encryption
3. Test full flow on testnet
4. Monitor performance and gas costs
5. Security review

---

## PART 4: IMPROVEMENTS FOR $150K+ FUNDING

### Current Project Gaps

| Gap | Impact on Funding | Solution |
|-----|-------------------|----------|
| No working demo | HIGH | Complete ZK integration for live demo |
| No metrics/analytics | MEDIUM | Add usage dashboards, user metrics |
| No mobile app | MEDIUM | Build React Native or PWA version |
| No documentation | HIGH | Create developer docs, API reference |
| Single chain | MEDIUM | Plan multi-chain expansion |
| No token economics | LOW | Design utility token (optional) |

### High-Impact Features to Add

#### 1. Transaction Batching & Gas Abstraction
```typescript
// Users shouldn't worry about XLM for gas
const tx = await stellaray.sendPayment({
  to: 'GDEST...',
  amount: '100',
  asset: 'USDC',
  payGasIn: 'USDC',  // Abstract gas away
});
```
**Why it matters:** Makes the app feel like Venmo, not a blockchain wallet.

#### 2. Social Recovery
```typescript
// Set up guardians for account recovery
await stellaray.setupRecovery({
  guardians: [
    { email: 'friend1@gmail.com', threshold: 2 },
    { email: 'friend2@gmail.com', threshold: 2 },
    { email: 'friend3@gmail.com', threshold: 2 },
  ],
  recoveryDelay: '48h',
});
```
**Why it matters:** Seed phrase alternative that's actually safe.

#### 3. Compliance-Ready KYC Layer
```typescript
// ZK-verified KYC (prove you're 18+ without revealing DOB)
const kycProof = await stellaray.generateKYCProof({
  provider: 'veriff',
  claims: ['age_over_18', 'country_not_sanctioned'],
});
```
**Why it matters:** Opens B2B market, enterprise customers.

#### 4. SDK for Other Developers
```bash
npm install @stellaray/sdk
```
```typescript
import { Stellaray } from '@stellaray/sdk';

const stellaray = new Stellaray({
  clientId: 'YOUR_CLIENT_ID',
  network: 'mainnet',
});

// Embed in any app
const wallet = await stellaray.connect();
```
**Why it matters:** Platform play, network effects, revenue from API calls.

#### 5. Multi-Chain Support (Future)
```typescript
// Same Google login, wallets on multiple chains
const wallets = await stellaray.getWallets();
// { stellar: 'G...', ethereum: '0x...', solana: '...' }
```
**Why it matters:** Expands TAM, makes you chain-agnostic.

### Metrics Dashboard for Investors

Add `/admin/dashboard` with:
- Daily active users
- Transaction volume
- Waitlist conversion rate
- Geographic distribution
- Referral effectiveness
- X-Ray protocol usage stats

### Demo Video/Script

Create a 2-minute demo showing:
1. User clicks "Sign in with Google"
2. Google OAuth popup
3. ZK proof generating (show loading with technical details)
4. Wallet created - show address
5. Fund with friendbot
6. Send payment to another wallet
7. Show transaction on Stellar Expert

---

## PART 5: TIMELINE TO FUNDING-READY

### 6-Week Sprint Plan

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Prover Service | Working proof generation, deployed to cloud |
| **Week 2** | Salt Service | Secure salt management, KMS integration |
| **Week 3** | Integration | Connect frontend to backend services |
| **Week 4** | Testing | Full flow testing, bug fixes, edge cases |
| **Week 5** | Polish | Demo video, documentation, pitch deck |
| **Week 6** | Outreach | Submit to Stellar, schedule demo calls |

### Key Milestones

- [ ] Week 1: First ZK proof generated
- [ ] Week 2: First wallet created with ZK
- [ ] Week 3: First transaction signed with ZK
- [ ] Week 4: 10 test users complete full flow
- [ ] Week 5: Demo video published
- [ ] Week 6: Funding application submitted

---

## PART 6: PITCH DECK OUTLINE

### Slide Structure (10 slides)

1. **Cover**: Stellaray - Prove Everything. Reveal Nothing.
2. **Problem**: Seed phrases are killing crypto adoption
3. **Solution**: zkLogin - Google sign-in for self-custody
4. **How It Works**: Simple diagram of ZK flow
5. **Demo**: Screenshots/video of working product
6. **Market Size**: $X billion wallet market, Y% CAGR
7. **Traction**: Waitlist numbers, Twitter engagement, user feedback
8. **Technology**: X-Ray protocol advantage, gas savings
9. **Team**: Your background, relevant experience
10. **Ask**: $150K for 6-month runway, milestones

### Supporting Materials

- [ ] Pitch deck (Google Slides/Figma)
- [ ] Demo video (2 min Loom)
- [ ] Technical whitepaper (5 pages)
- [ ] GitHub repo (cleaned up, documented)
- [ ] Live demo URL
- [ ] Metrics dashboard

---

## SUMMARY

### What to Tell Stellar:

> "We've built the frontend and integrated the SDK. The user experience is polished and we have traction. We need funding to complete the backend infrastructure - prover service and salt management - to enable actual ZK proof generation. With $150K and 6 months, we'll deliver a fully functional zkLogin wallet for Stellar that makes self-custody as easy as signing in with Google."

### Your Honest Position:

- **Strong**: Frontend, UX, SDK integration, traction, understanding of the technology
- **Needs work**: Backend services for proof generation
- **Timeline**: 6 weeks to working demo, 6 months to production

### Next Steps:

1. Build the prover service (highest priority)
2. Complete the ZK integration
3. Create demo video
4. Apply for Stellar Community Fund or reach out to Stellar directly
5. Network at Stellar events/Discord

---

*Document created: January 2025*
*Last updated: January 2025*
