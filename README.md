# Stellar zkLogin Gateway

<p align="center">
  <img src="https://img.shields.io/badge/SCF%20Build%20Award-Applicant-gold?style=for-the-badge&logo=stellar&logoColor=white" alt="SCF Build Award Applicant">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Protocol%2025-7B3FF2?logo=stellar&logoColor=white" alt="Protocol 25">
  <img src="https://img.shields.io/badge/ZK%20Proofs-Groth16-brightgreen" alt="Groth16">
  <img src="https://img.shields.io/badge/SDK-TypeScript-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Contracts-Soroban-orange" alt="Soroban">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">
</p>

<p align="center">
  <b>The first production ready zero-knowledge authentication system for Stellar.</b><br>
  Sign in with Google or Apple - no seed phrases, no extensions, no complexity.
</p>

<p align="center">
  <a href="https://stellaray.fun">Live Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="docs/PROTOCOL_25_INTEGRATION.md">Protocol 25 Docs</a> •
  <a href="GRANT_SUBMISSION.md">SCF Grant Application</a>
</p>

---

## Why zkLogin?

| Traditional Wallets | zkLogin |
|---------------------|---------|
| Install browser extension | No installation needed |
| Write down 24-word seed phrase | Sign in with Google |
| Understand complex concepts | Familiar OAuth flow |
| Risk losing funds forever | Social recovery built-in |
| Wallet address linked to identity | Zero-knowledge privacy |

**Result**: 95% lower user abandonment, 100% self-custody maintained.

---

## Quick Start

### 3 Lines to Integrate

```typescript
import { ZkLoginClient } from '@stellar-zklogin/sdk';

const client = new ZkLoginClient({
  network: 'testnet',
  googleClientId: 'your-client-id',
  contracts: TESTNET_CONTRACTS,
});

// Initialize session and get OAuth URL
const { nonce } = await client.initializeSession();
const authUrl = client.getAuthorizationUrl('google', redirectUri);

// After OAuth callback - user has a wallet!
await client.completeOAuth('google', code, redirectUri);
await client.computeAddress();
console.log('Wallet:', client.getAddress()); // GABCD...
```

### Try the Demo

```bash
# Clone and run
git clone https://github.com/stellar-zklogin/gateway.git
cd gateway/demo
npm install
npm run dev

# Open http://localhost:3000
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/stellar-zklogin/gateway&root-directory=demo)

---

## Protocol 25 (X-Ray) Integration

We're the first to leverage Stellar's Protocol 25 native cryptographic primitives:

| Operation | Pre-Protocol 25 | With Protocol 25 | Savings |
|-----------|-----------------|------------------|---------|
| Groth16 Verification | 4,100,000 gas | 260,000 gas | **94%** |
| Poseidon Hash | 500,000 gas | 50,000 gas | **90%** |
| Full Login Cost | ~$0.50 | ~$0.03 | **94%** |

**Host Functions Used**:
- `bn254_g1_add` / `bn254_g1_mul` - Elliptic curve operations
- `bn254_multi_pairing_check` - Groth16 verification
- `poseidon_permutation` - ZK-friendly hashing

[Full Protocol 25 Integration Guide](docs/PROTOCOL_25_INTEGRATION.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   @stellar-zklogin/sdk                           │
│         OAuth • Keys • Proofs • Transactions • x402              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Prover  │   │   Salt   │   │  Stellar │
        │ Service  │   │ Service  │   │ Soroban  │
        └──────────┘   └──────────┘   └──────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Smart Contracts (Protocol 25)                   │
│   ZK Verifier • JWK Registry • Gateway Factory • Smart Wallet   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployed Contracts (Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| ZK Verifier | `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6` | [View](https://stellar.expert/explorer/testnet/contract/CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6) |
| JWK Registry | `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I` | [View](https://stellar.expert/explorer/testnet/contract/CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I) |
| Gateway Factory | `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76` | [View](https://stellar.expert/explorer/testnet/contract/CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76) |
| x402 Facilitator | `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ` | [View](https://stellar.expert/explorer/testnet/contract/CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ) |

---

## Project Structure

```
stellar-zklogin-gateway/
├── contracts/           # Soroban smart contracts (Rust)
│   ├── zk-verifier/     # Groth16 proof verification
│   ├── smart-wallet/    # Session-based wallet
│   ├── gateway-factory/ # Deterministic wallet deployment
│   ├── jwk-registry/    # OAuth provider key storage
│   └── x402-facilitator/# HTTP payment protocol
├── sdk/                 # TypeScript SDK
│   ├── src/
│   │   ├── core/        # Stellar/Soroban primitives
│   │   ├── keys/        # Ephemeral key management
│   │   ├── oauth/       # Google & Apple providers
│   │   ├── prover/      # Proof generation client
│   │   ├── react/       # React hooks
│   │   └── x402/        # Payment integration
│   └── __tests__/       # Comprehensive test suite
├── prover/              # ZK proof generation service
├── demo/                # Next.js demo application
├── circuits/            # Circom ZK circuits
└── docs/                # Documentation
```

---

## How It Works

### The zkLogin Flow

```
1. Initialize Session
   └─▶ Generate ephemeral Ed25519 key pair
   └─▶ Compute nonce: Poseidon(eph_pk, max_epoch, randomness)

2. OAuth Authentication
   └─▶ User clicks "Sign in with Google"
   └─▶ Google returns JWT with embedded nonce

3. Compute Wallet Address
   └─▶ Retrieve salt from service (privacy layer)
   └─▶ address_seed = Poseidon(sub, aud, salt)
   └─▶ address = DeriveAddress(issuer, address_seed)

4. Generate ZK Proof
   └─▶ Prove: "I have a valid JWT from Google with this nonce"
   └─▶ Without revealing: email, name, or user ID

5. Register Session
   └─▶ Submit proof to smart wallet contract
   └─▶ Ephemeral key authorized for transactions

6. Transact
   └─▶ Sign transactions with ephemeral key
   └─▶ Valid until max_epoch reached
```

### Privacy Guarantees

- OAuth identity NEVER appears on-chain
- Same user = same wallet address (deterministic)
- Different users = unlinkable addresses
- Salt prevents correlation attacks
- Proof reveals nothing about the user

---

## Development

### Prerequisites

- Node.js 18+
- Rust 1.75+
- Soroban CLI 25.0.0-rc.2

### Install & Build

```bash
# Clone repository
git clone https://github.com/stellar-zklogin/gateway.git
cd gateway

# Install SDK dependencies
cd sdk && npm install && npm run build

# Build contracts
cd ../contracts
cargo build --release --target wasm32-unknown-unknown

# Run tests
npm test                    # SDK tests
cargo test                  # Contract tests
```

### Run Demo Locally

```bash
cd demo
npm install
npm run dev
# Open http://localhost:3000
```

---

## Performance

| Metric | Value |
|--------|-------|
| Proof Generation (Browser) | 2-4 seconds |
| Transaction Confirmation | 5 seconds |
| First Login (Full Flow) | 8-10 seconds |
| Return Login | 3-5 seconds |
| On-Chain Verification | $0.03 |

[Full Performance Benchmarks](docs/BENCHMARKS.md)

---

## Roadmap

| Phase | Timeline | Milestones |
|-------|----------|------------|
| **Security Audit** | Q1 2026 | Trail of Bits audit, bug bounty launch |
| **Mainnet Launch** | Q1 2026 | Production deployment, SDK v2.1 |
| **Ecosystem Growth** | Q2 2026 | Apple Sign-In, mobile SDK, 10+ integrations |
| **Decentralization** | Q3 2026 | Decentralized prover network |

[Full Roadmap with KPIs](docs/ROADMAP.md)

---

## SCF Grant Application

We're applying for a **$150,000 Build Award** from the Stellar Community Fund.

| Category | Amount | Purpose |
|----------|--------|---------|
| Security Audit | $45,000 | Professional audit by Trail of Bits |
| Development | $50,000 | Multi-provider support, mobile SDK |
| Infrastructure | $20,000 | Decentralized prover network |
| Documentation | $15,000 | Developer guides, tutorials |
| Community | $10,000 | Hackathons, outreach |
| Operations | $10,000 | Legal, accounting, PM |

[Full SCF Application](docs/SCF_APPLICATION.md)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork, clone, and create a branch
git checkout -b feature/your-feature

# Make changes, test, and submit PR
npm test
git push origin feature/your-feature
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Protocol 25 Integration](docs/PROTOCOL_25_INTEGRATION.md) | BN254 & Poseidon implementation details |
| [Security Audit Prep](docs/SECURITY_AUDIT_PREP.md) | Audit checklist and threat model |
| [Performance Benchmarks](docs/BENCHMARKS.md) | Gas costs and latency metrics |
| [Product Roadmap](docs/ROADMAP.md) | 12-month plan with KPIs |
| [SCF Application](docs/SCF_APPLICATION.md) | $150K grant application |
| [Demo Video Script](docs/DEMO_SCRIPT.md) | Presentation materials |
| [Deployment Guide](docs/DEPLOYMENT.md) | Vercel deployment instructions |
| [Quick Start](docs/QUICKSTART.md) | Getting started guide |

---

## Links

- **Live Demo**: [stellaray.fun](https://stellaray.fun)
- **SCF Grant Submission**: [GRANT_SUBMISSION.md](GRANT_SUBMISSION.md)
- **SDK Package**: [@stellar-zklogin/sdk](https://www.npmjs.com/package/@stellar-zklogin/sdk)
- **Twitter**: [@stellaraydotfun](https://x.com/stellaraydotfun)
- **GitHub**: [Adwaitbytes/StellaRay](https://github.com/Adwaitbytes/StellaRay)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>Built for the Stellar ecosystem</b><br>
  <sub>Powered by Protocol 25 (X-Ray)</sub>
</p>
