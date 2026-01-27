# STELLARAY ZK Login - Production Implementation Guide

**Complete Technical Specification & Cost Analysis**

---

## Table of Contents

1. [Current Implementation Status](#current-implementation-status)
2. [Architecture Overview](#architecture-overview)
3. [Production Requirements](#production-requirements)
4. [Prover Service Implementation](#prover-service-implementation)
5. [Salt Service Implementation](#salt-service-implementation)
6. [On-Chain Contracts](#on-chain-contracts)
7. [Infrastructure Costs](#infrastructure-costs)
8. [Security Considerations](#security-considerations)
9. [Implementation Timeline](#implementation-timeline)
10. [Appendix: Technical Specifications](#appendix-technical-specifications)

---

## Current Implementation Status

### What's Built ✅

| Component | File | Status | Production Ready |
|-----------|------|--------|------------------|
| ZK Integration Library | `lib/zklogin.ts` | Complete | ✅ Yes |
| ZK Wallet Hook | `hooks/useZkWallet.ts` | Complete | ✅ Yes |
| Salt Service API | `api/zk/salt/route.ts` | Complete | ⚠️ Needs HSM |
| Prover Service API | `api/zk/prove/route.ts` | Demo Only | ❌ Needs Real Prover |
| Verification API | `api/zk/verify/route.ts` | Complete | ✅ Yes |
| ZK Proof UI Component | `components/ZkProofCard.tsx` | Complete | ✅ Yes |
| Dashboard Integration | `app/dashboard/page.tsx` | Complete | ✅ Yes |

### What's Missing ❌

1. **Production Groth16 Prover** - The core cryptographic component
2. **HSM-Backed Salt Storage** - Secure key management
3. **JWK Registry Sync** - Auto-update Google/Apple public keys
4. **Rate Limiting & DDoS Protection** - API security
5. **Monitoring & Alerting** - Operational visibility

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STELLARAY ZK LOGIN                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Frontend   │───▶│  Next.js API │───▶│   External Services  │  │
│  │  (React/TS)  │    │   Routes     │    │                      │  │
│  └──────────────┘    └──────────────┘    │  ┌────────────────┐  │  │
│         │                   │            │  │ Prover Service │  │  │
│         │                   │            │  │   (GPU/WASM)   │  │  │
│         ▼                   ▼            │  └────────────────┘  │  │
│  ┌──────────────┐    ┌──────────────┐    │  ┌────────────────┐  │  │
│  │  useZkWallet │    │  /api/zk/*   │───▶│  │  Salt Service  │  │  │
│  │    Hook      │    │   Endpoints  │    │  │   (HSM/KMS)    │  │  │
│  └──────────────┘    └──────────────┘    │  └────────────────┘  │  │
│                             │            │  ┌────────────────┐  │  │
│                             ▼            │  │ JWK Registry   │  │  │
│                      ┌──────────────┐    │  │  (Google/Apple)│  │  │
│                      │   Stellar    │    │  └────────────────┘  │  │
│                      │  Blockchain  │    └──────────────────────┘  │
│                      │  (Soroban)   │                              │
│                      └──────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### ZK Login Flow (Detailed)

```
User                    Frontend              Backend              Blockchain
  │                        │                     │                     │
  │  1. Click "Login"      │                     │                     │
  │───────────────────────▶│                     │                     │
  │                        │  2. Generate        │                     │
  │                        │     Ephemeral Key   │                     │
  │                        │     + Compute Nonce │                     │
  │                        │                     │                     │
  │  3. Redirect to Google │                     │                     │
  │◀───────────────────────│                     │                     │
  │                        │                     │                     │
  │  4. OAuth Complete     │                     │                     │
  │───────────────────────▶│                     │                     │
  │                        │  5. Get Salt        │                     │
  │                        │────────────────────▶│                     │
  │                        │  6. Salt Response   │                     │
  │                        │◀────────────────────│                     │
  │                        │                     │                     │
  │                        │  7. Generate Proof  │                     │
  │                        │────────────────────▶│                     │
  │                        │     (JWT + Salt +   │                     │
  │                        │      Eph Key)       │                     │
  │                        │                     │  8. Run ZK Circuit  │
  │                        │                     │     (Groth16)       │
  │                        │  9. Proof Response  │                     │
  │                        │◀────────────────────│                     │
  │                        │                     │                     │
  │                        │  10. Register       │                     │
  │                        │      Session        │                     │
  │                        │─────────────────────────────────────────▶│
  │                        │                     │  11. Verify Proof   │
  │                        │                     │      On-Chain       │
  │                        │  12. Session Active │                     │
  │◀───────────────────────│◀────────────────────────────────────────│
  │                        │                     │                     │
```

---

## Production Requirements

### 1. Prover Service

The prover is the most critical and expensive component. It runs the zkLogin Groth16 circuit.

#### Option A: Self-Hosted GPU Prover

**Hardware Requirements:**
- NVIDIA A100 or H100 GPU (80GB VRAM recommended)
- 256GB+ RAM
- 2TB NVMe SSD
- 32+ CPU cores

**Software Stack:**
- rapidsnark (Rust/C++ prover)
- circom (circuit compiler)
- zkLogin circuit files (proving key, verification key)

**Performance:**
- Proof generation: ~2-5 seconds per proof
- Throughput: ~20-50 proofs/minute per GPU

#### Option B: Cloud Prover Service

Use existing ZK prover infrastructure:

| Provider | Cost/Proof | Latency | Notes |
|----------|-----------|---------|-------|
| Mysten Labs (Sui) | ~$0.01 | 2-3s | zkLogin compatible |
| Risczero Bonsai | ~$0.05 | 5-10s | General purpose |
| Succinct | ~$0.02 | 3-5s | SP1 proofs |
| Self-hosted | ~$0.005 | 2-5s | Requires GPU infra |

#### Option C: WASM-Based Prover (Slower, Cheaper)

For low-volume applications:
- snarkjs in WebAssembly
- Proof generation: 30-60 seconds
- No GPU required
- Can run on serverless (Vercel Edge, Cloudflare Workers)

### 2. Salt Service

The salt service provides deterministic, user-specific salts for address derivation.

**Requirements:**
- Secure random salt generation
- Deterministic retrieval (same user = same salt)
- HSM/KMS-backed key storage
- High availability (99.9%+ uptime)

**Options:**

| Provider | Cost/Month | Security Level |
|----------|-----------|----------------|
| AWS CloudHSM | $1,500 | FIPS 140-2 Level 3 |
| AWS KMS | $1/key + $0.03/10K requests | FIPS 140-2 Level 2 |
| Google Cloud KMS | $0.06/key version | FIPS 140-2 Level 3 |
| HashiCorp Vault | $0 (self-hosted) | Software-based |
| Azure Key Vault | $0.03/10K operations | FIPS 140-2 Level 2 |

### 3. JWK Registry

Syncs OAuth provider public keys to the blockchain for proof verification.

**Requirements:**
- Automatic key rotation sync
- Support for Google, Apple, Facebook, etc.
- On-chain JWK storage

**Implementation:**
```typescript
// Cron job to sync Google JWKs
async function syncGoogleJwks() {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const { keys } = await response.json();

  for (const key of keys) {
    await jwkRegistry.updateKey(key.kid, key.n, key.e);
  }
}
```

---

## Prover Service Implementation

### Production Prover Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PROVER SERVICE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   Load      │    │   Queue     │    │   GPU Workers   │ │
│  │  Balancer   │───▶│  (Redis)    │───▶│   (rapidsnark)  │ │
│  │  (nginx)    │    │             │    │                 │ │
│  └─────────────┘    └─────────────┘    │  ┌───────────┐  │ │
│                                        │  │  GPU 1    │  │ │
│  ┌─────────────┐                       │  │  A100     │  │ │
│  │   API       │                       │  └───────────┘  │ │
│  │  Gateway    │                       │  ┌───────────┐  │ │
│  │  (rate      │                       │  │  GPU 2    │  │ │
│  │   limit)    │                       │  │  A100     │  │ │
│  └─────────────┘                       │  └───────────┘  │ │
│                                        │  ┌───────────┐  │ │
│  ┌─────────────┐                       │  │  GPU N    │  │ │
│  │  Metrics    │                       │  │  A100     │  │ │
│  │  (Prometheus│                       │  └───────────┘  │ │
│  │  + Grafana) │                       └─────────────────┘ │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Prover Code (Production)

```rust
// prover/src/main.rs
use rapidsnark::Prover;
use tokio::sync::mpsc;

struct ZkLoginProver {
    proving_key: Vec<u8>,
    circuit_wasm: Vec<u8>,
}

impl ZkLoginProver {
    pub async fn generate_proof(&self, inputs: ProofInputs) -> Result<Groth16Proof> {
        // 1. Prepare witness
        let witness = self.compute_witness(&inputs)?;

        // 2. Generate proof using rapidsnark
        let proof = rapidsnark::prove(
            &self.proving_key,
            &witness,
        )?;

        // 3. Parse and return
        Ok(Groth16Proof {
            a: proof.pi_a,
            b: proof.pi_b,
            c: proof.pi_c,
            public_inputs: proof.public_signals,
        })
    }

    fn compute_witness(&self, inputs: &ProofInputs) -> Result<Vec<Fr>> {
        // Compute all witness values for zkLogin circuit
        let eph_pk_hash = poseidon_hash(&[
            inputs.eph_pk_high,
            inputs.eph_pk_low,
        ]);

        let address_seed = poseidon_hash(&[
            hash_to_field(inputs.key_claim_name),
            hash_to_field(inputs.key_claim_value),
            hash_to_field(inputs.aud),
            poseidon_hash(&[hash_to_field(inputs.salt)]),
        ]);

        // ... rest of witness computation
    }
}
```

### Prover API (Node.js Wrapper)

```typescript
// prover-service/src/index.ts
import express from 'express';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const app = express();
const redis = new Redis(process.env.REDIS_URL);
const proofQueue = new Queue('proofs', { connection: redis });

app.post('/prove', async (req, res) => {
  const { jwt, salt, ephPkHigh, ephPkLow, maxEpoch, randomness } = req.body;

  // Validate inputs
  if (!jwt || !salt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Add to queue
  const job = await proofQueue.add('generate', {
    jwt,
    salt,
    ephPkHigh,
    ephPkLow,
    maxEpoch,
    randomness,
  }, {
    priority: 1,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });

  // Wait for result (with timeout)
  const result = await job.waitUntilFinished(proofQueue, 30000);

  res.json(result);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    queueSize: await proofQueue.count(),
    workers: await getActiveWorkers(),
  });
});

app.listen(3001);
```

---

## Salt Service Implementation

### Production Salt Service

```typescript
// salt-service/src/index.ts
import express from 'express';
import { KMSClient, GenerateMacCommand, VerifyMacCommand } from '@aws-sdk/client-kms';

const app = express();
const kms = new KMSClient({ region: process.env.AWS_REGION });
const MASTER_KEY_ID = process.env.KMS_MASTER_KEY_ID;

// Salt derivation using KMS HMAC
async function deriveSalt(issuer: string, subject: string): Promise<string> {
  const message = Buffer.from(`${issuer}:${subject}`);

  const command = new GenerateMacCommand({
    KeyId: MASTER_KEY_ID,
    MacAlgorithm: 'HMAC_SHA_256',
    Message: message,
  });

  const response = await kms.send(command);
  return Buffer.from(response.Mac!).toString('hex').slice(0, 32);
}

app.post('/get-salt', async (req, res) => {
  try {
    const { jwt } = req.body;

    // Verify and parse JWT
    const claims = await verifyGoogleJwt(jwt);
    if (!claims) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Derive salt using KMS
    const salt = await deriveSalt(claims.iss, claims.sub);

    // Log for audit (without sensitive data)
    console.log({
      action: 'salt_derived',
      issuer: claims.iss,
      subject_hash: sha256(claims.sub).slice(0, 8),
      timestamp: new Date().toISOString(),
    });

    res.json({ salt });
  } catch (error) {
    console.error('Salt derivation error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(3002);
```

### Database Schema (Salt Cache)

```sql
-- PostgreSQL schema for salt service
CREATE TABLE user_salts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_hash VARCHAR(64) NOT NULL,  -- SHA256 of issuer
  subject_hash VARCHAR(64) NOT NULL, -- SHA256 of subject
  salt_encrypted BYTEA NOT NULL,     -- KMS-encrypted salt
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(issuer_hash, subject_hash)
);

CREATE INDEX idx_user_salts_lookup
  ON user_salts(issuer_hash, subject_hash);

-- Audit log
CREATE TABLE salt_audit_log (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  issuer_hash VARCHAR(64),
  subject_hash_prefix VARCHAR(8),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## On-Chain Contracts

### Deployed Contracts (Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| ZK Verifier | `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6` | Verifies Groth16 proofs |
| Gateway Factory | `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76` | Deploys smart wallets |
| JWK Registry | `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I` | Stores OAuth JWKs |
| x402 Facilitator | `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ` | Micropayments |

### Contract Interactions

```typescript
// Verify proof on-chain
async function verifyProofOnChain(proof: Groth16Proof, publicInputs: PublicInputs) {
  const contract = new Contract(ZK_VERIFIER_CONTRACT_ID);

  const tx = new TransactionBuilder(sourceAccount, { fee: '100' })
    .addOperation(contract.call('verify_proof',
      proofToScVal(proof),
      inputsToScVal(publicInputs)
    ))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  return result.result?.retval?.value() as boolean;
}

// Register session on-chain
async function registerSession(
  walletAddress: string,
  proof: Groth16Proof,
  publicInputs: PublicInputs,
  ephemeralPubKey: string
) {
  const factory = new Contract(GATEWAY_FACTORY_CONTRACT_ID);

  const tx = new TransactionBuilder(sourceAccount, { fee: '10000' })
    .addOperation(factory.call('register_session',
      Address.fromString(walletAddress).toScVal(),
      proofToScVal(proof),
      inputsToScVal(publicInputs),
      xdr.ScVal.scvBytes(Buffer.from(ephemeralPubKey, 'hex'))
    ))
    .setTimeout(30)
    .build();

  // Sign and submit
  tx.sign(Keypair.fromSecret(OPERATOR_SECRET));
  return await server.submitTransaction(tx);
}
```

---

## Infrastructure Costs

### Monthly Cost Breakdown

#### Option 1: Minimum Viable (Low Volume)
*For < 1,000 users/month*

| Component | Provider | Specification | Monthly Cost |
|-----------|----------|---------------|--------------|
| Prover | WASM (Serverless) | Vercel Edge Functions | $20 |
| Salt Service | AWS KMS | 10K requests | $5 |
| Database | Neon (Free) | 0.5GB | $0 |
| Hosting | Vercel | Pro | $20 |
| Domain + SSL | Cloudflare | Pro | $20 |
| Monitoring | Grafana Cloud | Free tier | $0 |
| **Total** | | | **$65/month** |

#### Option 2: Growth (Medium Volume)
*For 1,000 - 50,000 users/month*

| Component | Provider | Specification | Monthly Cost |
|-----------|----------|---------------|--------------|
| Prover | Cloud GPU | 1x A10G (AWS g5.xlarge) | $800 |
| Salt Service | AWS KMS + Lambda | 500K requests | $50 |
| Database | AWS RDS | db.t3.medium | $100 |
| Redis | AWS ElastiCache | cache.t3.micro | $15 |
| Load Balancer | AWS ALB | 100GB/month | $25 |
| Hosting | AWS ECS | 2x t3.medium | $80 |
| CloudWatch | AWS | Logs + Metrics | $30 |
| **Total** | | | **$1,100/month** |

#### Option 3: Production (High Volume)
*For 50,000+ users/month*

| Component | Provider | Specification | Monthly Cost |
|-----------|----------|---------------|--------------|
| Prover Cluster | GPU Cloud | 4x A100 (Reserved) | $8,000 |
| Salt Service | AWS CloudHSM | FIPS 140-2 L3 | $1,500 |
| Database | AWS Aurora | db.r5.large | $500 |
| Redis Cluster | AWS ElastiCache | 3-node cluster | $300 |
| Kubernetes | AWS EKS | 5-node cluster | $400 |
| CDN | CloudFront | 1TB/month | $100 |
| WAF | AWS WAF | 10M requests | $50 |
| Monitoring | Datadog | APM + Infra | $300 |
| On-call | PagerDuty | Standard | $20 |
| **Total** | | | **$11,170/month** |

### One-Time Costs

| Item | Cost | Notes |
|------|------|-------|
| ZK Circuit Development | $20,000 - $50,000 | If building custom circuit |
| Security Audit | $30,000 - $100,000 | Smart contract + backend |
| Trusted Setup Ceremony | $5,000 - $20,000 | For Groth16 (if new circuit) |
| Legal/Compliance | $10,000 - $30,000 | Varies by jurisdiction |

### Cost Per User

| Volume | Option | Cost/User/Month |
|--------|--------|-----------------|
| 100 users | Minimum | $0.65 |
| 1,000 users | Minimum | $0.065 |
| 10,000 users | Growth | $0.11 |
| 100,000 users | Production | $0.11 |
| 1,000,000 users | Production (scaled) | $0.05 |

---

## Security Considerations

### Critical Security Requirements

1. **Salt Confidentiality**
   - Salts MUST be stored in HSM/KMS
   - Never log salts or derived values
   - Implement key rotation procedures

2. **Prover Integrity**
   - Verify proving key checksums
   - Use reproducible builds
   - Implement proof validity checks

3. **Rate Limiting**
   - Max 10 proof requests/minute per IP
   - Max 100 salt requests/minute per IP
   - Implement CAPTCHA for suspicious activity

4. **Input Validation**
   - Verify JWT signatures before processing
   - Validate all input formats
   - Sanitize all data before storage

### Security Checklist

- [ ] HSM/KMS for salt derivation
- [ ] TLS 1.3 for all connections
- [ ] JWT signature verification
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] Audit logging for all operations
- [ ] Penetration testing
- [ ] Smart contract audit
- [ ] Bug bounty program
- [ ] Incident response plan

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up cloud infrastructure (AWS/GCP)
- [ ] Deploy KMS-backed salt service
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting

### Phase 2: Prover (Weeks 3-4)
- [ ] Obtain zkLogin circuit files
- [ ] Set up GPU infrastructure
- [ ] Deploy rapidsnark prover
- [ ] Implement proof queue system

### Phase 3: Integration (Weeks 5-6)
- [ ] Connect frontend to production services
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Load testing

### Phase 4: Security (Weeks 7-8)
- [ ] Security audit
- [ ] Penetration testing
- [ ] Fix identified issues
- [ ] Documentation

### Phase 5: Launch (Weeks 9-10)
- [ ] Soft launch (limited users)
- [ ] Monitor and fix issues
- [ ] Public launch
- [ ] Post-launch support

---

## Appendix: Technical Specifications

### zkLogin Circuit Specification

The zkLogin circuit proves the following statement:

> "I know a valid JWT token signed by a registered OAuth provider,
> and my wallet address is derived from this JWT's claims using
> a secret salt, without revealing the JWT or salt."

**Public Inputs (5 field elements):**
```
1. eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
2. max_epoch = ledger sequence number
3. address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
4. iss_hash = Poseidon(iss_chunks...)
5. jwk_modulus_hash = Poseidon(modulus_chunks...)
```

**Private Inputs:**
```
- JWT signature (RS256)
- JWT header and payload
- Salt (user-specific)
- Ephemeral private key
- RSA modulus chunks (from JWK)
```

### Poseidon Hash Parameters

```
Curve: BN254
State size: t = 3 (for 2 inputs)
Full rounds: 8
Partial rounds: 57
S-box: x^5
```

### Groth16 Proof Format

```typescript
interface Groth16Proof {
  // Point on G1 (affine coordinates)
  a: {
    x: string; // 32-byte hex (field element)
    y: string; // 32-byte hex (field element)
  };
  // Point on G2 (extension field, affine)
  b: {
    x: [string, string]; // 2x 32-byte hex
    y: [string, string]; // 2x 32-byte hex
  };
  // Point on G1 (affine coordinates)
  c: {
    x: string; // 32-byte hex
    y: string; // 32-byte hex
  };
}
```

### Address Derivation Formula

```
address = Blake2b_256(
  0x05 ||                    // zkLogin prefix
  len(issuer) as u8 ||       // issuer length
  issuer as bytes ||         // issuer URL bytes
  address_seed as bytes32    // derived seed
)
```

### Environment Variables (Production)

```bash
# Prover Service
PROVER_URL=https://prover.stellaray.fun
PROVER_API_KEY=<secret>
PROVING_KEY_PATH=/keys/zklogin.zkey
CIRCUIT_WASM_PATH=/keys/zklogin.wasm

# Salt Service
SALT_SERVICE_URL=https://salt.stellaray.fun
AWS_KMS_KEY_ID=alias/stellaray-salt-key
AWS_REGION=us-east-1

# Blockchain
STELLAR_RPC_URL=https://soroban.stellar.org
STELLAR_HORIZON_URL=https://horizon.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015

# Contracts (Mainnet)
ZK_VERIFIER_CONTRACT_ID=<mainnet_address>
GATEWAY_FACTORY_CONTRACT_ID=<mainnet_address>
JWK_REGISTRY_CONTRACT_ID=<mainnet_address>

# OAuth
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<secret>

# Security
RATE_LIMIT_REQUESTS_PER_MINUTE=100
JWT_VERIFICATION_ENABLED=true
AUDIT_LOG_ENABLED=true
```

---

## Summary

### Total Investment Required

| Category | Minimum | Recommended | Enterprise |
|----------|---------|-------------|------------|
| Development | $20,000 | $50,000 | $150,000 |
| Infrastructure (Year 1) | $780 | $13,200 | $134,040 |
| Security Audit | $10,000 | $50,000 | $100,000 |
| Legal/Compliance | $5,000 | $20,000 | $50,000 |
| **Total Year 1** | **$35,780** | **$133,200** | **$434,040** |

### Key Decisions

1. **Prover Strategy**: Self-hosted GPU vs Cloud prover service
2. **Salt Security**: KMS vs CloudHSM
3. **Scale Target**: Define expected user volume
4. **Compliance**: Which jurisdictions to support

### Next Steps

1. Review this document with the team
2. Choose infrastructure tier based on budget
3. Begin Phase 1 implementation
4. Schedule security audit

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Author: Stellaray Engineering*
