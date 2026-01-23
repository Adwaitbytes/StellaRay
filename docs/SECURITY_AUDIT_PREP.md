# Security Audit Preparation Document

## Project: Stellar zkLogin Gateway

This document outlines the security considerations, known risks, and audit preparation for the Stellar zkLogin Gateway project.

---

## 1. Audit Scope

### Smart Contracts (Soroban/Rust)

| Contract | Priority | LOC | Risk Level |
|----------|----------|-----|------------|
| zk-verifier | Critical | 850 | High |
| smart-wallet | Critical | 620 | High |
| gateway-factory | High | 480 | Medium |
| jwk-registry | High | 320 | Medium |
| x402-facilitator | Medium | 280 | Medium |

### Prover Service (Rust)

| Component | Priority | LOC | Risk Level |
|-----------|----------|-----|------------|
| witness.rs | Critical | 400 | High |
| proof generation | Critical | 300 | High |
| JWT parsing | High | 200 | Medium |

### TypeScript SDK

| Module | Priority | LOC | Risk Level |
|--------|----------|-----|------------|
| crypto utilities | High | 300 | Medium |
| key management | High | 200 | Medium |
| OAuth flow | Medium | 400 | Low |

---

## 2. Cryptographic Primitives

### BN254 Elliptic Curve Operations

**Implementation**: Soroban SDK `crypto::bn254` module (Protocol 25)

**Operations Used**:
- `g1_add`: Point addition on G1
- `g1_mul`: Scalar multiplication on G1
- `pairing_check`: Multi-pairing verification

**Security Considerations**:
- Relies on Protocol 25 host functions (audited by SDF)
- Input validation for curve points
- Scalar range validation

### Poseidon Hash Function

**Implementation**: `soroban-poseidon` crate (Protocol 25)

**Configurations Used**:
- T=2: Salt hashing, simple commitments
- T=3: Ephemeral key hashing
- T=5: Address seed computation
- T=6: Modulus tree hashing

**Security Considerations**:
- Parameters match Circom reference implementation
- Round constants correctly initialized
- Input domain separation

### Groth16 Proof System

**Circuit**: Custom zkLogin circuit (~15,000 constraints)

**Trusted Setup**: Uses existing BN254 powers of tau

**Verification**:
```
e(A, B) = e(αG1, βG2) · e(∑viγi, γG2) · e(C, δG2)
```

**Security Considerations**:
- Verification key integrity
- Public input binding
- Proof malleability prevention

---

## 3. Known Security Considerations

### 3.1 JWT Nonce Binding

**Risk**: Replay attacks if nonce not properly bound

**Mitigation**:
```rust
// Nonce computation includes all session parameters
nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
```

**Verification**: On-chain verification that JWT nonce matches computed value

### 3.2 Ephemeral Key Security

**Risk**: Key compromise allows session hijacking

**Mitigation**:
- Keys stored only in sessionStorage (cleared on browser close)
- Short-lived sessions (default: 1 day / 17,280 ledgers)
- No private key export functionality

### 3.3 Salt Privacy

**Risk**: Salt leakage enables address correlation

**Mitigation**:
- Salt derived from master key + user identifier (HKDF)
- Salt never exposed to client
- Master key stored in HSM (production)

### 3.4 Address Derivation

**Risk**: Non-deterministic addresses break wallet recovery

**Mitigation**:
```
address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
address = DeriveAddress(issuer, address_seed)
```

All inputs deterministically derived from OAuth identity.

### 3.5 Session Expiration

**Risk**: Expired sessions used for transactions

**Mitigation**:
- `max_epoch` check on every transaction
- Contract rejects transactions past expiration
- Client-side expiration warnings

---

## 4. Attack Surface Analysis

### 4.1 On-Chain Attacks

| Attack Vector | Likelihood | Impact | Status |
|---------------|------------|--------|--------|
| Invalid proof acceptance | Low | Critical | Mitigated |
| Replay attack | Medium | High | Mitigated |
| Front-running | Low | Medium | Accepted |
| Denial of service | Medium | Low | Accepted |

### 4.2 Off-Chain Attacks

| Attack Vector | Likelihood | Impact | Status |
|---------------|------------|--------|--------|
| JWT forgery | Very Low | Critical | Mitigated |
| OAuth phishing | Medium | High | User education |
| Prover manipulation | Low | High | Mitigated |
| Salt service compromise | Low | High | HSM + monitoring |

### 4.3 Client-Side Attacks

| Attack Vector | Likelihood | Impact | Status |
|---------------|------------|--------|--------|
| XSS key extraction | Medium | High | CSP + sanitization |
| Malicious dApp | Medium | Medium | Clear warnings |
| Browser extension | Low | Medium | Accepted risk |

---

## 5. Test Coverage Requirements

### Contract Tests

```
zk-verifier/
├── test_valid_proof_verification
├── test_invalid_proof_rejection
├── test_malformed_input_handling
├── test_pairing_check_edge_cases
├── test_public_input_validation
└── test_gas_consumption_bounds

smart-wallet/
├── test_session_registration
├── test_session_expiration
├── test_unauthorized_transaction_rejection
├── test_multi_session_management
├── test_session_revocation
└── test_signature_verification

gateway-factory/
├── test_deterministic_address_derivation
├── test_wallet_deployment
├── test_duplicate_wallet_handling
├── test_address_seed_computation
└── test_issuer_validation

jwk-registry/
├── test_key_registration
├── test_key_rotation
├── test_modulus_hash_computation
├── test_unauthorized_update_rejection
└── test_expired_key_handling
```

### SDK Tests

```
sdk/
├── __tests__/
│   ├── crypto.test.ts          ✅ Created
│   ├── keys.test.ts            ✅ Created
│   ├── client.test.ts          ✅ Created
│   ├── oauth.test.ts           ✅ Created
│   ├── integration.test.ts     TODO
│   └── e2e.test.ts             TODO
```

### Coverage Targets

| Component | Current | Target |
|-----------|---------|--------|
| zk-verifier | 0% | 95% |
| smart-wallet | 0% | 95% |
| gateway-factory | 0% | 90% |
| jwk-registry | 0% | 90% |
| SDK | ~60% | 90% |
| Prover | 0% | 85% |

---

## 6. Audit Checklist

### Pre-Audit Requirements

- [ ] All tests passing
- [ ] 90%+ code coverage
- [ ] Static analysis clean (clippy, eslint)
- [ ] Documentation complete
- [ ] Architecture diagram updated
- [ ] Known issues documented
- [ ] Gas benchmarks recorded

### Audit Focus Areas

1. **Cryptographic Correctness**
   - Groth16 verification implementation
   - Poseidon hash parameters
   - BN254 point validation
   - Scalar field arithmetic

2. **Access Control**
   - Session management
   - Admin functions
   - Contract upgrades

3. **Economic Security**
   - Gas exhaustion
   - Reentrancy
   - Integer overflow/underflow

4. **Privacy Guarantees**
   - Information leakage
   - Correlation attacks
   - Timing side channels

5. **Integration Security**
   - OAuth flow integrity
   - JWT parsing
   - External service dependencies

---

## 7. Formal Verification Targets

### High Priority

1. **Groth16 Pairing Equation**
   ```
   ∀ proof, inputs: verify(proof, inputs) = true ⟺
     e(A, B) = e(αG1, βG2) · e(∑viγi, γG2) · e(C, δG2)
   ```

2. **Address Derivation Determinism**
   ```
   ∀ iss, sub, aud, salt:
     derive_address(iss, sub, aud, salt) = derive_address(iss, sub, aud, salt)
   ```

3. **Session Expiration**
   ```
   ∀ session, ledger:
     ledger > session.max_epoch ⟹ ¬valid(session, ledger)
   ```

### Medium Priority

4. **Nonce Uniqueness**
   ```
   ∀ eph_pk, epoch, rand1, rand2:
     rand1 ≠ rand2 ⟹ nonce(eph_pk, epoch, rand1) ≠ nonce(eph_pk, epoch, rand2)
   ```

5. **Poseidon Collision Resistance**
   ```
   ∀ x, y: x ≠ y ⟹ Poseidon(x) ≠ Poseidon(y) (probabilistic)
   ```

---

## 8. Bug Bounty Program

### Reward Tiers

| Severity | Reward | Examples |
|----------|--------|----------|
| Critical | $25,000 | Proof forgery, fund theft |
| High | $10,000 | Session hijacking, key extraction |
| Medium | $5,000 | DoS, information disclosure |
| Low | $1,000 | Minor issues, documentation |

### Scope

**In Scope:**
- Smart contracts (all)
- Prover service
- SDK cryptographic functions
- Salt service

**Out of Scope:**
- Demo application UI
- Third-party dependencies
- Social engineering
- Physical attacks

### Rules

1. No public disclosure before fix
2. First reporter gets reward
3. Must provide PoC
4. No automated scanning without approval

---

## 9. Incident Response Plan

### Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| P0 | 1 hour | Active exploit, fund loss |
| P1 | 4 hours | Vulnerability discovered |
| P2 | 24 hours | Minor security issue |
| P3 | 1 week | Enhancement request |

### Response Procedure

1. **Detection**: Automated monitoring, bug bounty, user reports
2. **Triage**: Assess severity, scope, and impact
3. **Containment**: Pause contracts if necessary
4. **Fix**: Develop and test patch
5. **Deploy**: Coordinated deployment with dApps
6. **Post-mortem**: Root cause analysis, process improvement

### Contact

- Security Email: security@stellarzklogin.dev
- PGP Key: [Published on keyserver]
- Discord: #security-reports (private channel)

---

## 10. Recommended Auditors

### Tier 1 (Preferred)

1. **Trail of Bits**
   - ZK expertise: ✅ Excellent
   - Stellar/Soroban: ⚠️ Limited
   - Timeline: 6-8 weeks
   - Estimated cost: $150,000+

2. **Zellic**
   - ZK expertise: ✅ Excellent
   - Stellar/Soroban: ⚠️ Limited
   - Timeline: 4-6 weeks
   - Estimated cost: $100,000+

### Tier 2 (Alternative)

3. **OtterSec**
   - ZK expertise: ✅ Good
   - Stellar/Soroban: ✅ Good
   - Timeline: 3-4 weeks
   - Estimated cost: $60,000+

4. **Halborn**
   - ZK expertise: ✅ Good
   - Stellar/Soroban: ⚠️ Limited
   - Timeline: 4-5 weeks
   - Estimated cost: $80,000+

---

## 11. Timeline

| Week | Activity |
|------|----------|
| 1-2 | Complete test coverage, documentation |
| 3 | Internal security review |
| 4 | Auditor selection and engagement |
| 5-10 | Audit in progress |
| 11-12 | Fix implementation and verification |
| 13 | Final report and public disclosure |
| 14 | Bug bounty launch |

---

*Document Version: 1.0*
*Last Updated: January 2026*
