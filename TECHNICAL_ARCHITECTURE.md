# StellaRay Technical Architecture
## ZK Authentication for Stellar with Distributed Salt MPC

**Live demo:** https://stellaray.fun
**SDK:** https://www.npmjs.com/package/@stellar-zklogin/sdk
**GitHub:** https://github.com/Adwaitbytes/StellaRay

---

## 1. What StellaRay Is

StellaRay is a zkLogin layer for Stellar. A user signs in with Google and gets a self-custodial Stellar wallet in under ten seconds. No seed phrase, no browser extension, no Google identity ever lands on chain. Any Stellar dApp integrates the SDK in three lines.

Live on Stellar testnet today, verifiable on stellar.expert:

* ZK Verifier: `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6`
* JWK Registry: `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I`
* Gateway Factory: `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76`
* x402 Facilitator: `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ`
* Smart Wallet WASM hash: `2a7e72543da92134de77821c920b82e6c5fb7cd02b5283cfeb87deb894e14d5d`
* ZK Multi-Custody Recovery: deployed on testnet, full Shamir 2-of-3 flow at stellaray.fun/zk-multi-custody

The next phase replaces the single-operator salt service with a 3-of-5 FROST threshold cluster operated by StellaRay across five independent cloud providers and five jurisdictions. We disclose the current trust model honestly because the redesign is the whole point of the next development phase.

---

## 2. Why Protocol 25 Made This Practical

Before Protocol 25, verifying a Groth16 proof on Stellar meant running BN254 elliptic curve operations inside WASM at roughly 4.1 million instructions per verification. Too expensive to run every login.

Protocol 25 added native host functions for the operations that dominate Groth16:

* `bn254_g1_add`, `bn254_g1_mul`: BN254 G1 arithmetic
* `bn254_multi_pairing_check`: the bilinear pairing check for Groth16 verification
* `poseidon_permutation`: ZK-friendly hash for the address commitment

The same verification drops to roughly 260,000 instructions, a 94% reduction. A login pays a few cents in network fees instead of close to fifty.

---

## 3. The Login Flow

```
1.  Browser generates an ephemeral Ed25519 keypair.
2.  Browser computes nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch).
3.  User redirected to Google OAuth carrying that nonce.
4.  Google returns an ID token (JWT). Nonce, sub, aud are inside.
5.  Browser asks the salt cluster for the user's salt, authenticated with the JWT.
6.  Browser computes address_seed = Poseidon(sub_F, aud_F, Poseidon(salt)).
7.  Browser derives the Stellar address from address_seed via Blake2b + Ed25519.
8.  Browser ships JWT + ephemeral_pk + max_epoch to the prover.
9.  Prover returns a Groth16 proof: 3 BN254 points (A, B, C), 256 bytes total.
10. Browser submits proof + public_inputs to the ZK Verifier contract.
11. Verifier runs the multi-pairing check using Protocol 25 host functions.
12. Gateway Factory registers the ephemeral key as a session signer.
13. Done. Ephemeral key signs Stellar transactions for the rest of the session.
```

End-to-end: 8 to 10 seconds. Dominated by Stellar's ledger close (3 to 5s) and browser proof generation (2 to 4s, dropping to 1 to 2s with the Rust prover).

---

## 4. What the Circuit Proves

The Circom circuit takes private inputs that never leave the browser and emits a 256-byte Groth16 proof.

**Public inputs (5 field elements, hit the chain):**

* `eph_pk_hash`: Poseidon hash of the ephemeral public key
* `max_epoch`: Stellar ledger sequence at session expiry
* `address_seed`: Poseidon(sub_F, aud_F, Poseidon(salt))
* `iss_hash`: Poseidon hash of the OAuth issuer string
* `jwk_modulus_hash`: Poseidon hash of Google's signing key modulus

**Private inputs (stay in the browser):**

* JWT bytes (header + payload + signature)
* Google sub, aud, salt
* Ephemeral private key
* RSA signature from Google

The circuit jointly proves four things: the JWT was actually signed by a Google key whose modulus matches `jwk_modulus_hash`; the JWT's nonce equals Poseidon(eph_pk, max_epoch); the `address_seed` derives correctly from sub, aud, and salt; the issuer matches `iss_hash`.

Constraint count is roughly 1.1M. SHA-256 dominates at 66%, RSA-2048 at 14%, JWT parsing at 10%, Poseidon and the rest at 10%.

---

## 5. Address Derivation

```
address_seed     = Poseidon(sub_F, aud_F, Poseidon(salt))
key_seed         = Blake2b256(issuer || address_seed)
keypair          = Ed25519.fromSeed(key_seed)
stellar_address  = keypair.public_key  (G-address)
```

The whole derivation runs in the browser. The salt cluster never sees the resulting Stellar address. The prover never sees the salt. The only place that holds the link from Google identity to Stellar address is the user's own browser, during a single session, in volatile memory.

---

## 6. Salt Service: Today and Target

This is the part of the architecture that SCF #42 reviewers correctly flagged as a centralization risk, and it's the centerpiece of the next development phase.

### 6.1 Today (testnet)

The salt service is one Rust process on one server:

```
salt = HMAC_SHA256(master_secret, sub || aud)
```

The service verifies the user's JWT against Google's published JWK set before issuing a salt, which prevents anonymous enumeration. But this is a single-party trust assumption: if `master_secret` leaks, anyone with a user's sub can compute that user's Stellar address. We name it directly because the next section is the plan to remove it.

### 6.2 Target (after SCF #43 Tranche 1)

The single-process HMAC service gets replaced with a 3-of-5 threshold cluster using FROST (Flexible Round-Optimized Schnorr Threshold) on Ed25519. Five operator nodes, each running open-source operator software at a verifiable git commit. Any 3 of 5 cooperating nodes can produce a salt for a given (sub, aud); no 2 can.

**Cluster topology (StellaRay-operated):**

| Node | Cloud provider | Jurisdiction |
|---|---|---|
| 1 | AWS | US East |
| 2 | GCP | EU (Frankfurt) |
| 3 | Azure | India (Mumbai) |
| 4 | DigitalOcean | Singapore |
| 5 | Hetzner | Brazil (São Paulo) |

Each node has independent SSH keys, separate billing accounts, separate monitoring. The 3-of-5 threshold means compromising one cloud provider, or one country compelling its locally-hosted operator, does not break the system.

We picked FROST because we sign in a Schnorr-style scheme over Ed25519. FROST is the right primitive there. GG20 and DKLs are ECDSA-shaped and don't apply. FROST has mature open-source implementations in Rust (zcash/frost, ZF FROST library) we build on directly. It supports periodic resharing for operator churn, and it's been formally analyzed.

What changes for users when we cut over: nothing. Same Google account derives to the same Stellar address. The salt request just talks to multiple operator endpoints instead of one.

What changes in the threat model:

* One operator node compromised: no impact (one share reveals nothing).
* Two nodes compromised: still no impact (below threshold).
* Three nodes compromised in the same compromise window: an attacker can derive salts for users who request them during that window. Quarterly resharing contains the impact to one quarter.
* One jurisdiction compels access to its locally-hosted node: produces nothing useful (one share).
* Three jurisdictions compelling simultaneously: requires coordinated action across three independent legal systems.

This is meaningful decentralization. It is not perfect. It is honest about what threshold cryptography across multi-cloud, multi-jurisdiction infrastructure actually delivers.

### 6.3 Open-source operator software, organic external participation

The Rust operator binary ships open-source from day one with reproducible Docker builds. Any external party (Stellar validator team, university crypto research group, ecosystem participant) can run their own node alongside the StellaRay cluster post-launch. Onboarding documentation and a working test harness are part of the SCF #43 Tranche 1 deliverable. The longer-term goal is organic external operator participation; we are not making the grant deliverables depend on recruitment.

### 6.4 DKG ceremony and resharing

At launch we run a distributed key generation ceremony with all five cluster nodes. No party (including the team operating the nodes) ever sees the full key. The ceremony transcript is public. Resulting key share commitments hash to a Stellar transaction so any community member can verify the cluster keys came from the public ceremony.

Resharing happens quarterly. Operator nodes run a re-randomization protocol that produces new shares of the same key. Old shares become useless after resharing. Compromise of any subset of nodes during any quarter is contained to that quarter's salt requests.

---

## 7. Soroban Smart Contracts

Six contracts, all live on Stellar testnet today. Audited copies will be deployed to mainnet in SCF #43 Tranche 3.

### 7.1 ZK Verifier

Verifies Groth16 proofs against a circuit-specific verification key, using Protocol 25 host functions. Tracks nullifiers to prevent replay.

```rust
pub fn verify_zklogin(
    env: Env,
    proof: Groth16Proof,
    public_inputs: Vec<U256>,
    max_epoch: u64,
) -> bool {
    if env.ledger().sequence() > max_epoch { return false; }

    let nullifier = env.crypto().poseidon_hash(&public_inputs[2..3]);
    if is_nullifier_used(&env, &nullifier) { return false; }

    let mut vk_x = vk.ic[0].clone();
    for (i, pub_input) in public_inputs.iter().enumerate() {
        let term = env.crypto().bn254_g1_mul(&vk.ic[i + 1], pub_input);
        vk_x = env.crypto().bn254_g1_add(&vk_x, &term);
    }

    let valid = env.crypto().bn254_multi_pairing_check(&[
        (-proof.a, proof.b),
        (vk.alpha, vk.beta),
        (vk_x, vk.gamma),
        (proof.c, vk.delta),
    ]);

    if valid { mark_nullifier_used(&env, &nullifier); }
    valid
}
```

The deployed testnet verification key comes from a development setup. Mainnet uses a verification key produced by reusing the public Hermez Powers-of-Tau (100+ contributors, used by zkSync and Polygon zkEVM) for phase-1, with circuit-specific phase-2 run by the StellaRay team. Section 13 covers this.

### 7.2 JWK Registry

Stores Poseidon hashes of authorized Google signing key moduli. The circuit proves the JWT was signed by a key whose modulus hash is in the registry. Rotating Google keys means updating the registry, not redeploying the verifier.

```rust
pub fn add_jwk(env: Env, modulus_hash: BytesN<32>);
pub fn revoke_jwk(env: Env, modulus_hash: BytesN<32>);
pub fn is_authorized(env: Env, modulus_hash: BytesN<32>) -> bool;
```

Updates are admin-gated by the StellaRay team. Same trust model Sui's zkLogin uses for its registry.

### 7.3 Gateway Factory

Maps wallet addresses to currently-authorized ephemeral signers. Verifier accepts a proof, Gateway Factory registers the ephemeral key. Stellar transaction arrives, Gateway Factory checks the signer against the registry and the current ledger against `max_epoch`.

### 7.4 Smart Wallet

Executes Stellar operations when presented with a valid ZK proof. Uses `verify_zklogin` from the ZK Verifier as the auth check.

```rust
pub fn execute(
    env: Env,
    proof: Groth16Proof,
    public_inputs: Vec<U256>,
    operations: Vec<Operation>,
    max_epoch: u64,
) -> Result<(), WalletError> {
    let valid = zk_verifier::verify_zklogin(&env, proof, public_inputs, max_epoch);
    require(valid, WalletError::InvalidProof);
    for op in operations { env.invoke_contract(&stellar_asset_contract, &op); }
    Ok(())
}
```

The Smart Wallet contract also supports a passkey-backed authorization path via Stellar Protocol 21's native secp256r1 verification. This is the authentication path used by the Apple Sign-In flow being shipped in SCF #43 Tranche 2. Same contract, two cryptographic auth paths (ZK proof for Google, WebAuthn signature for Apple).

### 7.5 x402 Facilitator

Implements HTTP 402 Payment Required micropayments natively on Stellar. The contract has a per-proof gateway-fee mechanism baked in for the eligibility-proof framework. Currently dormant. SCF #43 Tranche 3 activates it as the protocol's first revenue mechanism.

### 7.6 ZK Multi-Custody Recovery

Splits the wallet's recovery secret using Shamir 2-of-3 over GF(2^8). Each share is encrypted to a guardian Stellar address and stored on chain. Recovery requires 2 of 3 guardians to decrypt and submit shares within a recovery window.

---

## 8. Eligibility Proof Framework

Authentication is the foundation. Eligibility proofs are what makes StellaRay genuinely different from passkey wallets and from Dfns/Privy/Web3Auth.

Any Soroban contract can call `verify_eligibility_proof()` on the ZK Verifier and get a yes/no answer about a user's private state. Four proof types ship today, all sharing the same on-chain verifier and pairing check.

### 8.1 Solvency

Prove balance is above a threshold without revealing the actual balance. Public: hash of (threshold, asset), commitment to (balance, salt), hash of wallet address. Private: actual balance, salt, attestor signature. Use cases: lending eligibility, OTC counterparty checks, LP qualification.

### 8.2 Identity

Prove a verified identity exists without revealing email, phone, or any other personal data. Public: `Poseidon(email, sub, salt)`, provider hash, address hash. Use case: KYC-lite for protocols that need to know users are real humans without holding identity data.

### 8.3 Eligibility

Generic predicate proofs over private attributes: age, country, accredited investor status, permissioned-group membership.

### 8.4 History

Prove transaction count or volume above a minimum without revealing individual transactions.

---

## 9. Multi-Custody Recovery

Shamir 2-of-3 secret sharing over GF(2^8). Wallet recovery secret splits into 3 shares, each encrypted to a guardian Stellar address. Recovery: 2 of 3 guardians decrypt their shares, the 2 shares combine via Lagrange interpolation to reconstruct the secret, a new ZK login session is created using the reconstructed secret as the salt input.

Guardian approvals are on-chain state transitions, so recovery is auditable. Configurable recovery window during which the user can cancel a recovery in progress.

---

## 10. Payment Infrastructure

### 10.1 Streaming Payments

Funds flow by the second through Soroban escrow contracts. Curves: linear (salaries), cliff (vesting), exponential (front-loaded incentives), stepped (monthly payroll). Every withdrawal is a real Stellar transaction submitted through Horizon.

### 10.2 Payment Links

Shareable URLs encoding a Stellar address, amount, asset, optional memo. The payer opens the link and either pays from an existing wallet or creates a fresh ZK wallet inline. Underlying transaction: standard `Operation.payment` via `TransactionBuilder` to Horizon.

### 10.3 x402 Micropayments

HTTP 402 Payment Required, natively on Stellar. Server returns 402 with payment requirements; SDK pays via the x402 Facilitator and retries with a payment receipt. Sub-cent payments per request are economically viable thanks to Stellar's fee structure.

---

## 11. Prover Service

Rust service. Accepts a JWT and an ephemeral public key, returns a Groth16 proof.

```
POST /prove
{
  "jwt": "<id_token>",
  "ephemeralPublicKey": "<hex>",
  "maxEpoch": 12345,
  "salt": "<hex>",
  "network": "testnet"
}
```

Security property: the prover sees the salt only long enough to compute witness values and never persists salts or wallet addresses. A compromised prover can fail to produce proofs, refuse service, or DoS the user. It cannot link past wallet addresses to Google identities or move user funds.

Latency: 1 to 2 seconds per proof on a single CPU core. Mainnet runs three regions active-active.

---

## 12. TypeScript SDK

`@stellar-zklogin/sdk` on npm. Three lines:

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

const zkLogin = new StellarZkLogin({ network: 'testnet' });
const wallet = await zkLogin.login('google');

// wallet.address  ->  "GDKQ...XMVB"
// wallet.signTransaction(tx) signs with the ZK proof.
```

After SCF #43 Tranche 2 ships, the SDK exposes `connect('apple')` alongside `connect('google')`. Different cryptographic auth paths (passkey-backed for Apple, ZK-proof-backed for Google), same wallet API.

React hooks (`useZkLogin`, `useWallet`) and drop-in components (`LoginButton`, `WalletWidget`) are exported. Deployed contract addresses ship as `TESTNET_CONTRACTS` and `MAINNET_CONTRACTS` constants.

---

## 13. Mainnet Deployment Plan

The plan below maps directly to SCF #43 Tranche 3 deliverables.

1. **Audited contracts.** External cryptography audit covering the Circom circuit, the FROST salt MPC protocol, and all six Soroban contracts. Audit credits provided by SCF as part of Tranche 3 closure. Findings remediated and re-verified before mainnet.

2. **Trusted setup via Hermez PoT reuse.** Phase-1 reuses the public Hermez Powers-of-Tau ceremony (100+ existing contributors, used by zkSync, Polygon zkEVM, and other production ZK projects). Circuit-specific phase-2 run by the StellaRay team plus any community contributor who wishes to join (open invitation, not a precondition). Acceptable under Groth16's at-least-one-honest-participant property. Production verification key derived from the resulting transcript, key hash committed on chain.

3. **Distributed salt cluster live on mainnet.** The same 3-of-5 cluster from Tranche 1 promoted to mainnet. Five operator nodes across AWS, GCP, Azure, DigitalOcean, Hetzner in five jurisdictions. StellaRay-operated. Quarterly resharing schedule.

4. **Mainnet contract deployment.** All six audited contracts deployed using the production verification key. Admin and governance procedures published: key rotation runbook, JWK update playbook, emergency response plan.

5. **SDK v3.0 (web).** Mainnet by default. Mainnet contract addresses as the default constant set. React Native production release intentionally cut from this round to keep mainnet launch focused.

6. **On-chain protocol revenue activated.** Per-proof gateway fee on the x402 facilitator contract switched on at 0.005 XLM per verified eligibility proof. Mechanism already exists in the deployed contract; activation is a single governance transaction.

---

## 14. Security Properties

What StellaRay guarantees:

* **No identity on chain.** Google sub and email never appear in any transaction or contract storage. Wallet address is a one-way Poseidon hash that cannot be reversed.
* **Replay protection.** Every proof produces a unique nullifier from public inputs. The verifier tracks used nullifiers and rejects duplicates.
* **Session expiry.** Every proof is bound to a `max_epoch` ledger sequence. After expiry, the proof and the registered ephemeral key are both invalid.
* **Key rotation.** Google rotates JWK signing keys; the JWK Registry handles this transparently, no verifier redeploy needed.
* **Prover blindness.** The prover never persists the salt or wallet address.

What StellaRay does not guarantee:

* **Privacy from the salt cluster operator.** Today the salt service is single-process; a compromised or compelled StellaRay can deanonymize users. After Tranche 1 of SCF #43, this becomes a 3-of-5 threshold across multi-cloud and multi-jurisdiction infrastructure; deanonymization requires three of five nodes to be compromised or compelled in the same window.
* **Privacy from Google.** Google still sees the user logging in. StellaRay's privacy is privacy from blockchain observers and from third-party dApps, not privacy from the OAuth provider.
* **Quantum resistance.** BN254 is not post-quantum secure. A practical quantum attack against discrete log on BN254 would break the system; migration to a post-quantum proof system would be required.
* **Trusted setup integrity.** Groth16 requires a trusted setup. The Hermez phase-1 ceremony has 100+ contributors so the at-least-one-honest assumption is strong; phase-2 by the StellaRay team plus any community contributors keeps the assumption at one honest participant.

---

## 15. Performance

| Step | Time |
|---|---|
| Ephemeral keypair generation | < 10 ms |
| Google OAuth redirect + auth (user) | ~3 s |
| Salt request (single operator, today) | ~200 ms |
| Salt request (3-of-5 cluster, target) | ~400 ms |
| Groth16 proof generation (browser) | 2 to 4 s |
| Groth16 proof generation (Rust prover) | 1 to 2 s |
| Soroban transaction build + submit | ~600 ms |
| Stellar ledger close | 3 to 5 s |
| **Login total** | **8 to 10 s** |

Cost per login: about $0.03 in network fees on mainnet at current XLM prices.

| Metric | Value |
|---|---|
| On-chain verification (Protocol 25) | 260,000 instructions |
| On-chain verification (WASM baseline) | 4,100,000 instructions |
| Reduction from native host functions | 94% |
| Proof size | 256 bytes |
| Public inputs | 5 field elements (160 B) |
| Verification time on chain | ~12 ms |
| Default session validity | 24 hours, configurable |

---

## 16. What This Document Does Not Cover

For brevity:

* Full Circom circuit source: `circuits/zklogin.circom`.
* Soroban contract source for all six: `contracts/*`.
* Complete SDK API reference: `docs.stellaray.fun` (live as part of SCF #43 Tranche 2).
* Detailed FROST protocol specification for the salt MPC: drafted, will be published at the start of SCF #43 Tranche 1.
* SCF #43 tranche-by-tranche deliverable schedule: see the SCF dashboard project page.

---

*Contact: adwaitkeshari288@gmail.com*
*GitHub: https://github.com/Adwaitbytes/StellaRay*
