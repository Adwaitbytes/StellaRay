# Stellar zkLogin Gateway

OAuth-based wallet creation for Stellar using zero-knowledge proofs. Sign in with Google or Apple - no seed phrases required.

## Quick Start (Windows)

### Prerequisites

1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **Rust** - [Download](https://rustup.rs/)
3. **pnpm** (recommended) - `npm install -g pnpm`

### 1. Install Dependencies

```powershell
# Navigate to project
cd C:\Users\adwai\stellar-gateway

# Install SDK dependencies
cd sdk
pnpm install

# Install Demo dependencies
cd ..\demo
pnpm install

# Install Circuit dependencies (optional - for ZK setup)
cd ..\circuits
npm install
```

### 2. Set Up Environment

```powershell
# Copy example env file
copy .env.example .env

# Edit .env with your Google OAuth credentials
notepad .env
```

**Required for demo:**
- `GOOGLE_CLIENT_ID` - Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Set redirect URI to `http://localhost:3000/api/auth/callback` in Google Console

### 3. Start Services

**Option A: Development Mode (Mocked Services)**

```powershell
# Start demo app only (services are mocked)
cd demo
pnpm dev
```

Open http://localhost:3000

**Option B: Full Stack (All Services)**

Terminal 1 - Prover Service:
```powershell
cd prover
cargo run
```

Terminal 2 - Salt Service:
```powershell
cd salt-service
cargo run
```

Terminal 3 - Demo App:
```powershell
cd demo
pnpm dev
```

## Project Structure

```
stellar-gateway/
├── contracts/          # Soroban smart contracts (Rust)
│   ├── zk-verifier/    # Groth16 verification
│   ├── smart-wallet/   # Custom account with __check_auth
│   ├── jwk-registry/   # OAuth provider JWKs
│   ├── gateway-factory/# Deterministic wallet deployment
│   └── x402-facilitator/# Payment protocol
├── circuits/           # Circom ZK circuits
├── sdk/               # TypeScript SDK
├── demo/              # Next.js demo application
├── prover/            # ZK proof generation service
└── salt-service/      # Salt derivation service
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Demo App   │────▶│   Google    │
│             │◀────│  (Next.js)  │◀────│   OAuth     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │  Prover  │  │   Salt   │
              │ Service  │  │ Service  │
              └──────────┘  └──────────┘
                    │             │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │   Stellar   │
                    │   Testnet   │
                    └─────────────┘
```

## zkLogin Flow

1. **Sign In** - User clicks "Sign in with Google"
2. **Nonce Generation** - Ephemeral key created, nonce computed
3. **OAuth** - User authenticates with Google
4. **Salt Retrieval** - Service derives deterministic salt
5. **Address Computation** - Wallet address derived from identity
6. **ZK Proof** - Groth16 proof generated (proves JWT validity without revealing identity)
7. **Session Registration** - Session registered on-chain
8. **Transact** - User can send/receive with ephemeral key signatures

## x402 Payment Protocol

The demo includes an x402 payment example:

```typescript
// Automatic payment handling
const response = await zkClient.fetchWithPayment('/api/x402/article/1');

// Manual payment
const paymentClient = zkClient.getPaymentClient();
const requirement = paymentClient.parsePaymentRequired(response);
const proof = await paymentClient.executePayment(requirement);
```

## Development

### Building Contracts

```powershell
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

### Running Tests

```powershell
# Contract tests
cd contracts
cargo test

# SDK tests
cd sdk
pnpm test

# Demo tests
cd demo
pnpm test
```

### Deploying to Testnet

```powershell
# Set deployer secret in .env
# DEPLOYER_SECRET=S...

# Run deployment script (requires bash/WSL)
bash scripts/deploy-contracts.sh
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `STELLAR_NETWORK` | Network to use | `testnet` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required |
| `PROVER_URL` | Prover service URL | `http://localhost:8080` |
| `SALT_SERVICE_URL` | Salt service URL | `http://localhost:8081` |

## Security Notes

- **Development Only**: The master key and proofs are simplified for development
- **Production Requires**: HSM for salt master key, proper trusted setup ceremony
- **Session Expiration**: Ephemeral keys expire after `max_epoch`

## License

MIT
