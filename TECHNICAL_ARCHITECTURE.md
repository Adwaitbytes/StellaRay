# StellaRay Technical Architecture
## ZK Authentication for Stellar with Distributed Salt MPC

**Live demo:** https://stellaray.fun
**SDK:** https://www.npmjs.com/package/@stellar-zklogin/sdk
**GitHub:** https://github.com/Adwaitbytes/StellaRay

---

## 1. What StellaRay Is

StellaRay lets a user sign in with Google and walk away with a self-custodial Stellar wallet they actually control. The browser produces a zero-knowledge proof that the user holds a valid Google JWT. A Soroban smart contract verifies that proof on chain. A fresh ephemeral key is registered as the wallet's signer for the session. About ten seconds, end to end. No seed phrase, no browser extension, no Google identity ever lands on chain.

The wallet address is a one-way hash of the user's Google identity plus a private salt. It cannot be reversed to an email or any recognizable handle. Same Google account today, same Stellar address tomorrow, same address a year from now.

This document covers what runs on Stellar testnet today and what gets built next. The biggest piece of "next" is replacing the single-operator salt service with a 3-of-5 threshold MPC cluster across independent operators. We disclose the current trust model honestly because the redesign is the whole point of the next development phase.

What's live on Stellar testnet, verifiable on stellar.expert right now:

* ZK Verifier contract: `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6`
* JWK Registry contract: `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I`
* Gateway Factory contract: `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76`
* x402 Facilitator contract: `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ`
* Smart Wallet WASM hash: `2a7e72543da92134de77821c920b82e6c5fb7cd02b5283cfeb87deb894e14d5d`
* ZK Multi-Custody Recovery: deployed on testnet, full Shamir 2-of-3 flow live at stellaray.fun/zk-multi-custody

The TypeScript SDK is published on npm. Any Stellar dApp can integrate ZK login in three lines today.

---

## 2. Why Protocol 25 Made This Worth Building

Before Protocol 25, verifying a Groth16 proof on Stellar meant running BN254 elliptic curve operations inside WASM. That cost roughly 4.1 million instructions per verification. Way too expensive to be the auth flow that runs every login.

Protocol 25 added native host functions for the operations that dominate Groth16:

* `bn254_g1_add`: point addition on the BN254 G1 subgroup
* `bn254_g1_mul`: scalar multiplication on G1
* `bn254_multi_pairing_check`: the bilinear pairing check that closes Groth16 verification
* `poseidon_permutation`: ZK-friendly hash, used for the address commitment and other identity bindings

Same Groth16 verification, executed against native compiled host functions instead of interpreted WASM, drops to roughly 260,000 instructions. That's about a 94% reduction. A login pays a few cents in network fees instead of close to fifty.

That gap is what made StellaRay possible at all. ZK auth on Stellar went from "interesting in theory" to "the cheapest auth flow on the network."

---

## 3. The Login Flow

```
1.  Browser generates an ephemeral Ed25519 keypair.
2.  Browser computes nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch).
3.  User is redirected to Google OAuth carrying that nonce.
4.  Google returns an ID token (JWT). The nonce, sub, and aud are inside.
5.  Browser asks the salt cluster for the user's salt, authenticated with the JWT.
6.  Browser computes address_seed = Poseidon(sub_F, aud_F, Poseidon(salt)).
7.  Browser derives the Stellar address from address_seed via Blake2b + Ed25519.
8.  Browser ships JWT + ephemeral_pk + max_epoch to the prover.
9.  Prover returns a Groth16 proof: three BN254 points (A, B, C), 256 bytes total.
10. Browser submits proof + public_inputs to the ZK Verifier contract.
11. Verifier runs the multi-pairing check using Protocol 25 host functions.
12. Gateway Factory registers the ephemeral key as a session signer for this address.
13. Done. Ephemeral key signs Stellar transactions for the rest of the session.
```

End to end this is 8 to 10 seconds. The dominant costs are Stellar's ledger close time (3 to 5 seconds) and browser proof generation (2 to 4 seconds on a recent laptop). With a Rust proving service the proof step drops to 1 to 2 seconds.

---

## 4. What the Circuit Proves

The Circom circuit takes private inputs that never leave the browser and emits a 256-byte Groth16 proof. The public inputs that hit the chain (five field elements):

```
eph_pk_hash       Poseidon(ephemeral public key)
max_epoch         Stellar ledger sequence at which the session expires
address_seed      Poseidon(sub_F, aud_F, Poseidon(salt))
iss_hash          Poseidon(issuer string)
jwk_modulus_hash  Poseidon(Google signing key modulus chunks)
```

Private inputs (stay in the browser, never transmitted to anyone, never on chain):

```
JWT bytes (header + payload + signature)
Google user ID (sub)
User salt
Ephemeral private key
RSA signature from Google
```

The circuit jointly proves four things:

1. The JWT was actually signed by a Google key whose modulus hashes to `jwk_modulus_hash`. The RSA-2048 signature is verified inside the circuit.
2. The JWT's nonce field equals Poseidon(eph_pk, max_epoch). This is what binds the proof to this exact session and prevents replay across sessions.
3. The `address_seed` is correctly derived from the JWT's sub, aud, and the user's salt. Whoever has the proof has access to a Google identity that derives to this exact wallet.
4. The issuer matches `iss_hash`. Stops proofs minted from one OAuth provider being used to log into another.

Total constraint count is around 1.1 million. SHA-256 dominates at about 66%, RSA-2048 at 14%, JWT parsing at 10%, Poseidon and the rest at the remaining 10%.

---

## 5. Address Derivation

The wallet address is fully deterministic. This is what makes "sign in with Google a year from now" actually recover the same Stellar wallet.

```
address_seed     = Poseidon(sub_F, aud_F, Poseidon(salt))
key_seed         = Blake2b256(issuer || address_seed)
keypair          = Ed25519.fromSeed(key_seed)
stellar_address  = keypair.public_key  (G-address)
```

The whole derivation runs in the browser. The salt cluster never sees the resulting Stellar address. The prover never sees the salt. The only place that holds the link from Google identity to Stellar address is the user's own browser, during a single session, in volatile memory.

---

## 6. Salt Service: Today and Target

This is the part of the architecture that the SCF #42 reviewers correctly identified as the centralization risk in the system. It's also the centerpiece of the next development phase. Both states are described directly.

### 6.1 Today (testnet)

The salt service is a single Rust process running on a server we operate. It does:

```
salt = HMAC_SHA256(master_secret, sub || aud)
```

`master_secret` is a 256-bit key held in the service's environment. The service verifies the user's JWT against Google's published JWK set before issuing a salt, which prevents anonymous enumeration. So far, so good.

The honest part: this is a single-party trust assumption. If `master_secret` leaks, anyone who also has a user's sub can compute that user's Stellar address. If we choose to log salts, we can deanonymize users. If we are compelled by legal process, we cannot refuse. The system is custody-equivalent in that one specific sense, even though we never hold a user's signing keys.

We disclose this directly because (a) it's true, (b) hiding it would be worse than naming it, and (c) the next section is the plan to remove it.

### 6.2 Target (after SCF #43 Tranche 2)

The single-operator HMAC service gets replaced with a 3-of-5 threshold cluster using FROST (Flexible Round-Optimized Schnorr Threshold) on Ed25519. Five independent operators each hold one secret share of the underlying salt-derivation key. Any three operators can cooperate to produce a salt for a given (sub, aud); no two can produce anything on their own.

Operator slate at launch (target, four external candidates being confirmed during the spec phase):

1. StellaRay (1)
2. A Stellar-ecosystem validator team
3. A university cryptography research group
4. An established Stellar tooling team
5. A community node operator

The protocol picks FROST specifically because we are signing in a Schnorr-style scheme over Ed25519. FROST is the right primitive there. GG20 and DKLs are ECDSA-shaped and don't apply. FROST has mature open-source implementations in Rust (zcash/frost, ZF's FROST library) we can build on directly. It supports periodic resharing to handle operator churn, and it has been formally analyzed in the academic literature.

What changes for users when we cut over: nothing. Same Google account derives to the same Stellar address as before. The salt request just talks to multiple operator endpoints instead of one.

What changes in the threat model:

* One operator compromised: no impact. They have one share. One share reveals nothing about the key.
* Two operators compromised: still no impact. Below threshold.
* Three operators compromised: an attacker can derive salts for users who request salts during the compromise window. Quarterly resharing ensures historical salts cannot be retroactively reconstructed once shares rotate.
* One operator compelled by legal process in one jurisdiction: produces nothing useful.
* Three operators compelled: requires coordinated action across three independent legal jurisdictions.

This is meaningful decentralization. It is not perfect. It is the trust model that current threshold cryptography actually delivers, with all the limitations stated up front.

### 6.3 DKG ceremony and resharing

At launch we run a distributed key generation ceremony where the five operators each contribute entropy and end up holding their shares. No party (including us) ever sees the full key. The ceremony transcript is public. The resulting key shares' commitments get hashed onto the Stellar chain so any community member can verify the key was produced from the published transcript.

Resharing happens quarterly. Operators run a re-randomization protocol that produces new shares of the same key. Old shares are useless after resharing completes. This contains the impact of any operator compromise to one quarter's worth of salt requests.

If an operator drops permanently, the cluster degrades to 3-of-4 (still threshold-secure) and the team onboards a replacement, after which the cluster reshares back to 3-of-5.

---

## 7. Soroban Smart Contracts

Six contracts, all live on Stellar testnet today. Audited copies will be deployed to mainnet in SCF #43 Tranche 3.

### 7.1 ZK Verifier

Verifies Groth16 proofs against a circuit-specific verification key, using Protocol 25 host functions. Tracks nullifiers to prevent replay. This is the contract that every other piece of the system depends on.

```rust
pub fn verify_zklogin(
    env: Env,
    proof: Groth16Proof,
    public_inputs: Vec<U256>,
    max_epoch: u64,
) -> bool {
    // session expiry
    if env.ledger().sequence() > max_epoch { return false; }

    // replay protection
    let nullifier = env.crypto().poseidon_hash(&public_inputs[2..3]);
    if is_nullifier_used(&env, &nullifier) { return false; }

    // accumulate public inputs into vk_x via MSM
    let mut vk_x = vk.ic[0].clone();
    for (i, pub_input) in public_inputs.iter().enumerate() {
        let term = env.crypto().bn254_g1_mul(&vk.ic[i + 1], pub_input);
        vk_x = env.crypto().bn254_g1_add(&vk_x, &term);
    }

    // final pairing: e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
    let valid = env.crypto().bn254_multi_pairing_check(&[
        (-proof.a, proof.b),
        (vk.alpha,  vk.beta),
        (vk_x,      vk.gamma),
        (proof.c,   vk.delta),
    ]);

    if valid { mark_nullifier_used(&env, &nullifier); }
    valid
}
```

The verification key currently in the deployed testnet contract comes from a development setup. Mainnet deployment uses a verification key produced by a multi-party Powers-of-Tau plus circuit-specific phase-2 ceremony. Section 13 covers that.

### 7.2 JWK Registry

Google rotates its JWT signing keys periodically. The JWK Registry stores the Poseidon hash of each authorized key modulus. The circuit proves the JWT was signed by a key whose modulus hash is currently in the registry. Rotating Google keys means updating the registry, not redeploying the verifier.

```rust
pub fn add_jwk(env: Env, modulus_hash: BytesN<32>);
pub fn revoke_jwk(env: Env, modulus_hash: BytesN<32>);
pub fn is_authorized(env: Env, modulus_hash: BytesN<32>) -> bool;
```

The registry is governance-controlled; updates are gated by an admin role held by the StellaRay team. This matches the trust model Sui's zkLogin uses for its corresponding registry.

### 7.3 Gateway Factory

Manages the mapping between wallet addresses and their currently-authorized ephemeral signers. When the verifier accepts a proof, the Gateway Factory registers the ephemeral key. When a Stellar transaction arrives, it checks the signer against the registry and the current ledger against `max_epoch`.

### 7.4 Smart Wallet

The Smart Wallet contract is what users actually own. It executes Stellar operations when presented with a valid ZK proof, using `verify_zklogin` from the ZK Verifier as the auth check.

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

    for op in operations {
        env.invoke_contract(&stellar_asset_contract, &op);
    }
    Ok(())
}
```

The user's Google account is effectively the "key" to this wallet, but Google never has custody. The proof is what authorizes any state transition.

### 7.5 x402 Facilitator

Implements HTTP 402 Payment Required micropayments natively on Stellar. Servers reply with a 402 response specifying amount, asset, and recipient. The client SDK parses, pays via the facilitator (which holds funds in escrow until the request completes), and retries with a payment receipt.

The x402 contract has a per-proof gateway-fee mechanism baked in for the eligibility-proof framework. Currently dormant. SCF #43 Tranche 3 activates it as the protocol's first revenue mechanism.

### 7.6 ZK Multi-Custody Recovery

Splits the wallet's recovery secret using Shamir 2-of-3 over GF(2^8). Each share is encrypted to a guardian Stellar address and stored on chain. Recovery requires 2 of 3 guardians to decrypt and submit their shares within a recovery window.

Guardian approvals are on-chain state transitions, so the recovery process is auditable and cannot be unilaterally faked.

---

## 8. Eligibility Proof Framework

Authentication is the foundation. The eligibility-proof framework is what makes StellaRay genuinely different from passkey wallets and from generic wallet-as-a-service products.

Any Soroban contract can call `verify_eligibility_proof()` on the ZK Verifier and get a yes/no answer about a user's private state. Four proof types ship today, all sharing the same on-chain verifier and pairing check. They differ only in circuit and public inputs.

### 8.1 Proof of Solvency

Prove balance is above a threshold without revealing the actual balance.

```
public:  threshold_hash, balance_commitment, address_hash
private: actual_balance, salt, attestor_signature
```

The circuit enforces `actual_balance >= threshold` plus that the commitment is correctly formed.

Use cases: lending protocol eligibility, OTC counterparty checks, LP qualification.

### 8.2 Proof of Identity

Prove a verified identity exists without revealing the email, phone, or any other personal data.

```
public:  identity_commitment = Poseidon(email, sub, salt), provider_hash, address_hash
private: actual email, sub, salt
```

Use case: KYC-lite verification where a protocol needs to know its users are real humans, but doesn't want the regulatory liability of holding their identity data.

### 8.3 Proof of Eligibility

Generic predicate proofs over private attributes: age, country of residence, accredited investor status, membership in a permissioned group.

```
public:  criteria_id, address_hash, attribute_commitment
private: actual attribute values, salt
```

Each new criterion is a new circuit and a new verification key. The on-chain verification call is identical.

### 8.4 Proof of History

Prove transaction count or volume above a minimum without revealing individual transactions.

Use cases: on-chain credit scoring, loyalty program tiers, social-trust signals.

---

## 9. Multi-Custody Recovery

Shamir 2-of-3 secret sharing over GF(2^8). At setup the wallet's recovery secret gets split into three shares. Each share is encrypted to one of three guardian Stellar addresses and stored in the multi-custody contract.

To recover: contact two guardians, each decrypts their share, the two shares are combined using Lagrange interpolation in GF(2^8) to reconstruct the secret. A new ZK login session is created using the reconstructed secret as the salt input.

Guardian approvals are on-chain state transitions in the multi-custody contract. The recovery process is auditable, cannot be unilaterally faked, and includes a configurable recovery window during which the user can cancel a recovery in progress.

---

## 10. Payment Infrastructure

### 10.1 Streaming Payments

Funds flow by the second through Soroban escrow contracts. The sender locks XLM or any Stellar asset; the contract calculates how much the recipient has earned at any given moment based on elapsed time and the chosen vesting curve.

Curves supported:

* Linear: `amount(t) = total * (t / duration)`. Salaries, subscriptions.
* Cliff: zero until `cliff_time`, then linear from there. Vesting schedules.
* Exponential: `total * (1 - e^(-k * t / duration))`. Front-loaded incentives.
* Stepped: discrete vesting at fixed intervals. Monthly payroll.

Every withdrawal is a real Stellar transaction submitted through Horizon. Soroban contract storage tracks stream state and enforces the vesting math on each withdrawal call.

### 10.2 Payment Links

Shareable URLs encode a Stellar address, amount, asset, and an optional memo. The payer opens the link and either pays from an existing wallet or creates a fresh ZK wallet inline. The underlying transaction is a standard `Operation.payment` built with `TransactionBuilder` and submitted to Horizon.

### 10.3 x402 Micropayments

Already covered above as a Soroban contract. From the SDK side, the client wraps a fetch call: when the server returns 402, the SDK parses the payment requirements, pays via the x402 Facilitator, and retries with a payment receipt header. Sub-cent payments per request are economically viable thanks to Stellar's fee structure.

---

## 11. Prover Service

A Rust service hosted at `prover.zklogin.stellaray.fun`. It accepts a JWT and an ephemeral public key and returns a Groth16 proof.

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

Important security property: the prover sees the salt only long enough to compute witness values for the circuit; it never persists salts or wallet addresses. The prover sees the JWT and the ephemeral public key, neither of which is a long-term secret.

A compromised prover can fail to produce proofs, refuse service, or DoS the user. It cannot link past wallet addresses to Google identities. It cannot move user funds.

Latency: 1 to 2 seconds per proof on a single CPU core. Easily horizontally scalable. Mainnet deployment runs three regions active-active.

---

## 12. TypeScript SDK

`@stellar-zklogin/sdk` on npm. Three lines to integrate into any Stellar dApp:

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

const zkLogin = new StellarZkLogin({ network: 'testnet' });
const wallet = await zkLogin.login('google');

// wallet.address  ->  "GDKQ...XMVB"
// wallet.signTransaction(tx) signs with the ZK proof.
```

React hooks (`useZkLogin`, `useWallet`) and drop-in components (`LoginButton`, `WalletWidget`) are exported for fast UI integration. Deployed contract addresses for both networks ship as `TESTNET_CONTRACTS` and `MAINNET_CONTRACTS` constants.

A React Native package (`@stellar-zklogin/sdk-react-native`) is on the SCF #43 Tranche 3 deliverable list. It will support iOS and Android with the same API surface as the web package.

---

## 13. Mainnet Deployment Plan

Mainnet launch requires four pieces in sequence. The plan below maps directly to SCF #43 deliverables.

1. **Audited contracts.** External cryptography audit covering the Circom circuit, the FROST salt MPC protocol, and all six Soroban contracts. Audit credits provided by SCF as part of Tranche 3 closure. Findings remediated and re-verified before mainnet.

2. **Trusted setup ceremony.** Powers-of-Tau ceremony with at least ten named participants, followed by circuit-specific phase-2 ceremony with at least five participants. Entropy contributions recorded with reproducible verification instructions. Production verification key derived from the ceremony; key hash committed on chain so anyone can verify the key was produced from the published transcript.

3. **Distributed salt cluster live.** The 3-of-5 FROST cluster from section 6.2 promoted to mainnet with the same five operators that ran the testnet cluster from Tranche 2. DKG ceremony performed live; transcript published.

4. **Mainnet contract deployment.** All six contracts deployed to Stellar mainnet using the audited verification key. Admin and governance procedures (key rotation runbooks, JWK update playbook, emergency response plan) published.

5. **Three named partner integrations live.** SCF #43 application includes signed letters of intent from three Stellar dApps. Each integration uses SDK v3.0 and goes live within 30 days of mainnet contract deployment.

6. **On-chain protocol revenue activated.** Per-proof gateway fee on the x402 facilitator contract gets switched on at 0.005 XLM per verified eligibility proof. The mechanism already exists in the deployed contract; activation is a single governance transaction.

---

## 14. Security Properties

What StellaRay guarantees, stated plainly:

* **No identity on chain.** The Google sub and email never appear in any transaction or any contract storage. The wallet address is a one-way Poseidon hash that cannot be reversed.
* **Replay protection.** Every proof produces a unique nullifier from its public inputs. The verifier tracks used nullifiers and rejects any proof submitted twice.
* **Session expiry.** Every proof is bound to a `max_epoch` ledger sequence. After expiry, the proof and the registered ephemeral key are both invalid.
* **Key rotation.** Google rotates its JWK signing keys; the JWK Registry handles this transparently, no verifier redeploy needed.
* **Prover blindness.** The prover never persists the salt or the wallet address, and never sees anything that lets it deanonymize a user post-hoc.

What StellaRay does not guarantee:

* **Privacy from the salt cluster (today).** The single-operator salt service can deanonymize users if compromised or compelled. After Tranche 2 of SCF #43, this becomes a 3-of-5 threshold; from then on, deanonymization requires three of five operators to collude.
* **Privacy from Google.** Google still sees the user logging in. StellaRay's privacy is privacy from blockchain observers and from third-party dApps, not privacy from the OAuth provider.
* **Quantum resistance.** BN254 is not post-quantum secure. A practical quantum attack against discrete log on BN254 would break the system; migration to a post-quantum proof system would be required at that point.
* **Trusted setup integrity.** Groth16 requires a trusted setup. The multi-party ceremony keeps the system secure as long as at least one participant destroys their toxic waste, but that assumption cannot be reduced to zero.

---

## 15. Performance

| Step                                     | Time              |
|------------------------------------------|-------------------|
| Ephemeral keypair generation             | < 10 ms           |
| Google OAuth redirect + auth (user)      | ~3 s              |
| Salt request (single operator, today)    | ~200 ms           |
| Salt request (3-of-5 cluster, target)    | ~400 ms           |
| Groth16 proof generation (browser)       | 2 to 4 s          |
| Groth16 proof generation (Rust prover)   | 1 to 2 s          |
| Soroban transaction build + submit       | ~600 ms           |
| Stellar ledger close                     | 3 to 5 s          |
| **Login total**                          | **8 to 10 s**     |

Cost per login: about $0.03 in network fees on mainnet at current XLM prices.

| Metric                                    | Value                  |
|-------------------------------------------|------------------------|
| On-chain verification (Protocol 25)       | 260,000 instructions   |
| On-chain verification (WASM baseline)     | 4,100,000 instructions |
| Reduction from native host functions      | 94%                    |
| Proof size                                | 256 bytes              |
| Public inputs                             | 5 field elements (160 B)|
| Verification time on chain                | ~12 ms                 |
| Default session validity                  | 24 hours, configurable |

---

## 16. What This Document Does Not Cover

For brevity and focus, a few things live in adjacent files in the GitHub repository:

* The full Circom circuit source: `circuits/zklogin.circom`.
* The Soroban contract source for all six contracts: `contracts/*`.
* The complete SDK API reference: `docs.stellaray.fun` (live as part of SCF #43 Tranche 1).
* The detailed FROST protocol specification for the salt MPC: drafted, will be published at the start of SCF #43 Tranche 2.

---

*Contact: adwaitkeshari288@gmail.com*
*GitHub: https://github.com/Adwaitbytes/StellaRay*
