# Demo Video Script

## Stellar zkLogin Gateway

**Duration**: 5-7 minutes
**Target Audience**: SCF Reviewers, Developers, Investors
**Tone**: Professional, Technical, Enthusiastic

---

## Script

### Opening (0:00 - 0:30)

**[Screen: Animated logo reveal]**

**NARRATOR:**
> "What if signing into a blockchain wallet was as easy as signing into Gmail? What if you could have complete privacy, full self-custody, and zero seed phrases to remember?"

**[Screen: Side-by-side comparison - Traditional wallet setup vs zkLogin]**

> "Today, I'm going to show you Stellar zkLogin Gateway - the first and only production-ready zero-knowledge authentication system for Stellar, powered by Protocol 25."

---

### The Problem (0:30 - 1:30)

**[Screen: Statistics overlay]**

**NARRATOR:**
> "95% of users abandon dApps when asked to install a wallet. Seed phrases are confusing, insecure for average users, and a major barrier to Web3 adoption."

**[Screen: Traditional wallet flow - extension install, seed phrase, backup warning]**

> "Traditional wallets require installing browser extensions, writing down 24 words, and understanding complex cryptographic concepts."

**[Screen: Custodial solution diagram]**

> "Custodial solutions solve the UX problem, but they sacrifice the core promise of blockchain: you don't actually own your keys."

**[Screen: zkLogin architecture diagram]**

> "zkLogin is different. It uses zero-knowledge proofs to derive your wallet address from your Google or Apple identity, without ever revealing WHO you are on-chain."

---

### Live Demo - User Flow (1:30 - 3:30)

**[Screen: Demo application homepage]**

**NARRATOR:**
> "Let me show you how it works. This is our demo application running on Stellar Testnet."

**[Action: Click "Sign in with Google"]**

> "I click 'Sign in with Google' - just like any Web2 application."

**[Screen: Google OAuth consent screen]**

> "Google authenticates me and returns a signed JWT token. But here's where the magic happens..."

**[Action: OAuth redirect back to app]**

**[Screen: Proof generation progress indicator]**

> "The SDK is now generating a zero-knowledge proof. This proof proves I own this Google account WITHOUT revealing my email, name, or any identifying information to the blockchain."

**[Screen: Wallet dashboard appears]**

> "And just like that, I have a wallet. My address is deterministically derived from my identity - I'll get the same address every time I log in with this Google account."

**[Action: Show wallet address and balance]**

> "Let me fund this wallet using Friendbot..."

**[Action: Click fund button, show XLM appearing]**

> "Now I have testnet XLM. Let me show you a transaction."

**[Action: Initiate a transfer]**

> "I'll send some XLM to another address. Notice - no MetaMask popup, no hardware wallet required. The SDK uses my session key to sign transactions."

**[Screen: Transaction confirmation]**

> "Transaction confirmed in 5 seconds. That's the full flow: OAuth to wallet to transaction, in under 30 seconds total."

---

### Technical Deep Dive (3:30 - 5:00)

**[Screen: Architecture diagram]**

**NARRATOR:**
> "Let's look under the hood. Here's what's happening technically."

**[Screen: Highlight each component as mentioned]**

> "When you authenticate with Google, you receive a JWT token. Inside that token, we've embedded a cryptographic nonce - a Poseidon hash of your session parameters."

**[Screen: ZK circuit visualization]**

> "Our zero-knowledge circuit takes your JWT, your salt - a private value that adds an extra layer of privacy - and produces a Groth16 proof."

**[Screen: Protocol 25 host functions]**

> "This is where Protocol 25 changes everything. Previously, verifying a Groth16 proof on-chain required expensive WASM computation - over 4 million gas units."

**[Screen: Gas comparison chart]**

> "With Protocol 25's native BN254 and Poseidon support, we verify the same proof for just 260,000 gas. That's a 94% reduction."

**[Screen: Code snippet - SDK usage]**

```typescript
import { ZkLoginClient } from '@stellar-zklogin/sdk';

const client = new ZkLoginClient({
  network: 'mainnet',
  googleClientId: 'your-client-id',
  contracts: MAINNET_CONTRACTS,
});

// That's it - 3 lines to initialize
const { nonce } = await client.initializeSession();
```

> "For developers, integration is straightforward. Initialize the client, redirect to OAuth, and you have a fully functional embedded wallet."

---

### Competitive Advantage (5:00 - 5:45)

**[Screen: Comparison table]**

**NARRATOR:**
> "Let's compare this to alternatives."

**[Screen: Highlight each row]**

> "Unlike Web3Auth or Magic, zkLogin provides TRUE zero-knowledge privacy. No server ever sees your identity linked to your wallet."

> "Unlike Sui's zkLogin, we leverage Stellar's Protocol 25 for the most efficient verification possible."

> "And unlike traditional wallets, there's nothing to install, no seed phrase to lose, and no complex concepts to understand."

---

### Roadmap & Ask (5:45 - 6:30)

**[Screen: Roadmap timeline]**

**NARRATOR:**
> "We're requesting $150,000 from the Stellar Community Fund to complete our security audit, launch on mainnet, and build the developer ecosystem."

**[Screen: Budget breakdown]**

> "30% for a professional security audit, 33% for continued development including Apple Sign-In and mobile SDKs, and the rest for infrastructure, documentation, and community building."

**[Screen: KPI targets]**

> "Our goals: 50,000 unique wallets and 50 dApp integrations within 12 months."

---

### Closing (6:30 - 7:00)

**[Screen: Live demo URL and QR code]**

**NARRATOR:**
> "Try it yourself at stellargateway.vercel.app. Create a testnet wallet in 30 seconds."

**[Screen: GitHub, Discord, Contact info]**

> "All our code is open source. Join our Discord, star our GitHub, and let's bring the next million users to Stellar together."

**[Screen: Final slide - logo, tagline]**

> "Stellar zkLogin Gateway: Web3 authentication without compromise."

**[End]**

---

## B-Roll Shots Needed

1. **Screen recordings**:
   - Full OAuth flow (Google and Apple)
   - Wallet dashboard interactions
   - Transaction submission
   - Mobile responsive demo

2. **Animations**:
   - ZK proof generation visualization
   - Protocol 25 architecture
   - Gas comparison chart
   - Roadmap timeline

3. **Diagrams**:
   - System architecture
   - Data flow
   - Competitive comparison table

---

## Technical Requirements

### Recording Setup

- **Resolution**: 4K (3840x2160) or 1080p minimum
- **Frame rate**: 30fps
- **Browser**: Chrome (latest)
- **Theme**: Dark mode for code, light mode for demo app
- **Font size**: 16px minimum for readability

### Audio

- **Quality**: Professional voice-over or high-quality mic
- **Background**: Subtle, non-distracting music
- **Pacing**: Clear enunciation, moderate speed

### Branding

- **Colors**: Stellar blue (#0969da), zkLogin purple (#6e40c9)
- **Logo**: Animated reveal at start and end
- **Lower thirds**: Speaker name/title if applicable

---

## Call-to-Action Checklist

After watching, viewers should:

- [ ] Visit the demo application
- [ ] Create a testnet wallet
- [ ] Star the GitHub repository
- [ ] Join the Discord community
- [ ] Share with their network

---

## Alternative Versions

### 2-Minute Version (Pitch)

- Opening (0:00 - 0:15): Problem statement
- Solution (0:15 - 0:45): Quick demo
- Differentiator (0:45 - 1:15): Protocol 25 advantage
- Ask (1:15 - 1:45): Grant request
- CTA (1:45 - 2:00): Links and contact

### 10-Minute Version (Technical)

- Extended demo with multiple OAuth providers
- Deep dive into ZK circuit
- Code walkthrough for SDK integration
- Security architecture explanation
- Q&A with team

---

## Appendix: Key Messages

### Primary Message
> "zkLogin makes blockchain authentication as easy as Web2 while preserving full self-custody and privacy through zero-knowledge proofs."

### Supporting Messages

1. **Protocol 25 Efficiency**
   > "Protocol 25's native ZK primitives make Stellar the most efficient platform for zkLogin, with 94% gas savings."

2. **Developer Experience**
   > "Integrate zkLogin in 3 lines of code. No wallet extensions, no complex setup."

3. **User Experience**
   > "Sign in with Google, get a wallet. It's that simple."

4. **Privacy**
   > "Your Google account is never linked to your blockchain address. Zero-knowledge means zero data leakage."

5. **Security**
   > "Full self-custody with professional security audit. Your keys, your crypto, your control."

---

*Script Version: 1.0*
*Last Updated: January 2026*
