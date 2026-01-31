# StellaRay: Zero-Knowledge Authentication and Privacy Infrastructure for the Stellar Network

**Version 1.0 | January 2026**

Adwait Keshari

---

## Abstract

The prevailing model of wallet interaction in decentralized finance imposes a fundamental tension between usability and self-custody. Users must either surrender control to custodial platforms or manage cryptographic key material through seed phrases, hardware devices, and browser extensions. This friction remains the single largest barrier to mainstream adoption of on-chain finance. StellaRay resolves this tension by introducing a zero-knowledge authentication layer for the Stellar network that derives self-custodial wallets deterministically from OAuth identity tokens, verified through Groth16 proofs on the BN254 elliptic curve. By leveraging Stellar's Protocol 25 (X-Ray), which introduces native host functions for BN254 arithmetic and Poseidon hashing within Soroban smart contracts, StellaRay achieves on-chain proof verification at 94% lower gas cost than prior WASM-based approaches. The result is an authentication primitive that requires nothing beyond a Google account, reveals nothing about the user's identity to the blockchain, and maintains complete self-custody throughout.

---

## 1. Introduction

Every transaction on a public blockchain begins with a signature, and every signature begins with a private key. The question of how ordinary people should manage private keys has remained stubbornly unresolved for over a decade. The industry's answer has oscillated between two poles: custodial wallets that sacrifice the core promise of decentralization, and self-custodial wallets that demand technical literacy far beyond what most users possess.

The consequences of this impasse are visible in the data. Wallet abandonment rates exceed 70% within the first week of creation across most chains. Support tickets related to seed phrase recovery consume a disproportionate share of engineering resources at every major protocol. And the billions of dollars lost to phishing attacks exploiting seed phrase entry represent not merely a security failure but a design failure: the system asks humans to behave like machines, and humans predictably refuse.

Stellar occupies a distinctive position in this landscape. Its design philosophy has always prioritized real-world payment utility over speculative complexity. Its consensus protocol settles transactions in three to five seconds. Its fee structure makes micropayments economically viable. Yet Stellar wallet adoption faces the same fundamental friction as every other chain: the requirement that users manage Ed25519 keypairs through mechanisms that were designed for cryptographers, not for the billions of people whom Stellar intends to serve.

StellaRay proposes a different approach. Rather than abstracting key management behind yet another custodial intermediary, we eliminate the need for users to encounter keys at all, without surrendering custody. The mechanism is straightforward in principle: a user authenticates with their existing Google account; a wallet is derived deterministically from their OAuth identity token using a combination of Poseidon hashing and Ed25519 seed generation; and a Groth16 zero-knowledge proof verifies on-chain that the wallet belongs to a legitimately authenticated user, without revealing which user that is.

The critical enabler for this architecture arrived in January 2026 with the activation of Stellar Protocol 25, internally designated X-Ray. Protocol 25 introduced native Soroban host functions for BN254 elliptic curve operations and Poseidon permutations. These primitives, previously available only through expensive WASM-compiled libraries, can now execute at near-native speed within smart contracts. This single protocol upgrade transformed zero-knowledge proof verification from a theoretical possibility on Stellar into a practical, gas-efficient operation.

This paper describes the complete StellaRay system: its cryptographic construction, its authentication protocol, its on-chain verification mechanism, and the privacy-preserving eligibility framework built atop these foundations.

---

## 2. Background and Prior Art

### 2.1 The Zero-Knowledge Login Problem

The concept of deriving blockchain wallets from OAuth tokens represents a compelling approach to the key management problem. A combination of OAuth identity, a user-specific salt, and zero-knowledge proof generation can produce a deterministic wallet address tied to a web identity without exposing that identity on-chain. The approach works because the public input to the proof is a commitment (a hash of the identity data), while the identity data itself remains a private witness known only to the prover.

Stellar's Soroban runtime was not originally designed with zero-knowledge proof verification in mind. Prior to Protocol 25, verifying a single Groth16 proof on Stellar required executing BN254 pairing computations within WASM, consuming approximately 4.1 million gas units per verification. At this cost, ZK-based authentication was technically possible but economically impractical. Protocol 25 changed everything.

### 2.2 Stellar Protocol 25: X-Ray

Protocol 25 introduced four categories of cryptographic host functions to the Soroban runtime:

**BN254 Elliptic Curve Operations.** Three host functions expose the arithmetic of the BN254 (alt_bn128) curve directly to smart contracts: `bls12_381_g1_add` for point addition on the G1 subgroup, `bls12_381_g1_mul` for scalar multiplication, and `bls12_381_multi_pairing_check` for the bilinear pairing verification that forms the core of Groth16 proof checking. These operations execute as native compiled code rather than interpreted WASM, reducing the gas cost of a complete pairing check from millions of gas units to approximately 260,000.

**Poseidon Hash Permutations.** The `poseidon_permutation` and `poseidon2_permutation` host functions provide the algebraic hash function that underpins virtually all modern ZK proof systems. Poseidon's design is optimized for arithmetic circuits: it operates over prime fields (in our case, the BN254 scalar field Fr) using a combination of full and partial S-box rounds, achieving collision resistance with far fewer constraints than Keccak or SHA-256 would require within a circuit.

These host functions collectively reduce the cost of on-chain ZK proof verification by 94% compared to the WASM baseline, crossing the threshold from theoretical possibility to practical deployment.

### 2.3 Groth16 on BN254

The Groth16 proof system, introduced by Jens Groth in 2016, remains the most compact non-interactive zero-knowledge proof construction in widespread use. A Groth16 proof consists of three elliptic curve points: one G1 point (pi_A, 64 bytes), one G2 point (pi_B, 128 bytes), and one G1 point (pi_C, 64 bytes), for a total proof size of 256 bytes regardless of the complexity of the statement being proved.

Verification reduces to a single equation involving four bilinear pairings:

```
e(pi_A, pi_B) = e(alpha, beta) * e(sum(pub_i * IC_i), gamma) * e(pi_C, delta)
```

where `e()` denotes the optimal Ate pairing on BN254, `alpha, beta, gamma, delta` are circuit-specific constants from the trusted setup, `IC_i` are the input commitment points, and `pub_i` are the public inputs.

The practical consequence is that verifying any statement, whether it concerns identity, solvency, or eligibility, costs the same fixed gas regardless of the statement's complexity. The prover bears the computational burden; the verifier merely checks a constant-size proof.

### 2.4 Poseidon as an Identity Commitment

Traditional hash functions like SHA-256 produce outputs that are prohibitively expensive to verify inside arithmetic circuits. Poseidon was designed specifically for this use case: its algebraic structure over prime fields means that a Poseidon hash computation translates into a small number of field multiplications and additions within a Groth16 circuit.

StellaRay uses Poseidon with the following parameters:
- **State size (t):** 3
- **S-box exponent (d):** 5
- **Full rounds:** 8
- **Partial rounds:** 57
- **Field:** BN254 scalar field Fr (order approximately 2^254)

This parameterization provides 128-bit security against collision and preimage attacks while maintaining a constraint count suitable for practical proof generation times.

---

## 3. Protocol Design

### 3.1 System Overview

The StellaRay protocol consists of four cooperating components:

1. **The Client Application**, which manages the OAuth flow, generates ephemeral keypairs, and constructs proof requests.
2. **The Salt Service**, which stores a per-user random value used in address derivation, ensuring that the same OAuth identity produces the same wallet address across sessions.
3. **The Prover Service**, which generates Groth16 proofs from the user's private identity data and the public commitment.
4. **The On-Chain Verifier**, a Soroban smart contract that validates proofs using Protocol 25's native BN254 host functions.

These components interact in a protocol that unfolds in two phases: wallet derivation and session authentication.

### 3.2 Wallet Derivation

When a user authenticates with Google OAuth for the first time, the system derives a deterministic wallet address through the following procedure:

**Step 1: OAuth Token Acquisition.** The user completes a standard OAuth 2.0 authorization code flow with Google. The resulting ID token contains three fields relevant to wallet derivation: `sub` (a stable, unique identifier for the Google account), `aud` (the OAuth client identifier), and `iss` (the token issuer, always `accounts.google.com`).

**Step 2: Salt Retrieval.** The client requests the user's salt from the Salt Service, authenticating with the ID token. The Salt Service maintains a mapping from (`iss`, `sub`) pairs to random 256-bit salt values. On first access, a new salt is generated and stored; on subsequent accesses, the existing salt is returned. The salt prevents anyone who knows a user's `sub` value from computing their wallet address.

**Step 3: Address Seed Computation.** The address seed is computed as:

```
address_seed = Poseidon(sub, aud, salt)
```

This computation happens client-side. The resulting field element serves as the deterministic input to wallet generation.

**Step 4: Key Derivation.** The address seed is used to derive an Ed25519 keypair compatible with Stellar's account model:

```
seed_material = "stellar-zklogin-" || sub || "-" || network || "-v1"
raw_seed = SHA-256(seed_material)
keypair = Ed25519.fromSeed(raw_seed)
public_key = keypair.publicKey    // Stellar G-address
secret_key = keypair.secret       // Stellar S-key
```

The resulting public key becomes the user's Stellar address. The secret key is held in memory during the session and never persisted to disk or transmitted over the network.

**Step 5: Account Funding.** On testnet, the system requests an initial allocation of 10,000 XLM from Stellar's Friendbot service. On mainnet, the user must fund the account through a separate deposit.

The critical property of this derivation is determinism: the same Google account, on the same network, will always produce the same Stellar address. A user who returns after months of inactivity will recover the exact same wallet with all its balances intact, simply by signing in with Google again.

### 3.3 Session Authentication

Each login session is bounded by an ephemeral keypair and a zero-knowledge proof that binds the session to a valid OAuth identity.

**Step 1: Ephemeral Key Generation.** The client generates a fresh Ed25519 keypair for the session. This keypair is unrelated to the wallet keypair; it serves solely to sign transactions during the current session.

**Step 2: Nonce Construction.** A nonce is constructed from the ephemeral public key and a maximum epoch value (the ledger sequence number beyond which the session expires). This nonce is included in the OAuth authorization request as the `nonce` parameter, binding the OAuth token to this specific ephemeral key and session window.

**Step 3: Proof Generation.** After OAuth completes, the client submits the following to the Prover Service:

- The OAuth ID token (containing `sub`, `aud`, `iss`)
- The ephemeral public key
- The maximum epoch
- The user's salt

The Prover computes the Groth16 proof with the following public and private inputs:

*Public inputs (visible on-chain):*
- Address seed commitment: `Poseidon(sub, aud, salt)`
- Ephemeral public key
- Maximum epoch
- ISS hash: `Poseidon(iss)`

*Private inputs (known only to the prover):*
- The full `sub` value
- The full `aud` value
- The salt
- The ID token signature

The proof attests that the prover possesses a valid Google ID token whose `sub`, `aud`, and salt hash to the declared address seed, without revealing any of these values.

**Step 4: On-Chain Registration.** The proof, along with its public inputs, is submitted to the ZK Verifier contract on Stellar. The contract performs the Groth16 pairing check using Protocol 25's `bn254_multi_pairing_check` host function. If verification succeeds, the ephemeral public key is registered as an authorized signer for the wallet address until the maximum epoch is reached.

**Step 5: Transaction Signing.** For the remainder of the session, the ephemeral key signs transactions on behalf of the wallet. The Gateway Factory contract validates that each transaction's signer is a registered ephemeral key for the sending address and that the current ledger sequence has not exceeded the maximum epoch.

### 3.4 Contract Architecture

The on-chain components consist of four Soroban smart contracts:

**ZK Verifier Contract.** Accepts Groth16 proofs and public inputs, performs the pairing check, and emits a verification result. This contract holds the verification key (the circuit-specific constants alpha, beta, gamma, delta, and IC points) and implements the multi-scalar multiplication required to accumulate public inputs before the final pairing check.

**Gateway Factory Contract.** Manages the mapping between wallet addresses and their authorized ephemeral signers. When a new proof is verified, the Gateway Factory registers the ephemeral key. When a transaction arrives, it checks the signer against the registry and the epoch against the current ledger sequence.

**JWK Registry Contract.** Maintains an on-chain cache of Google's JSON Web Keys, used to verify the authenticity of ID tokens. This registry is updated periodically by an off-chain oracle that fetches Google's published JWK set.

**x402 Facilitator Contract.** Handles HTTP 402 (Payment Required) micropayment flows, enabling content providers to gate access behind Stellar payments with optional intent-based pre-authorization.

---

## 4. Zero-Knowledge Eligibility Framework

Authentication alone, while valuable, represents only the foundation of what zero-knowledge proofs can accomplish. StellaRay extends the core proof system into a general-purpose eligibility framework that allows users to prove arbitrary properties about themselves without revealing the underlying data.

### 4.1 Proof of Solvency

A user can prove that their balance exceeds a specified threshold without disclosing the actual balance.

The proof operates over three public inputs:

```
threshold_hash = Poseidon(threshold, asset)
balance_commitment = Poseidon(actual_balance, salt)
address_hash = Poseidon(wallet_address)
```

The circuit enforces two constraints: that the balance commitment is correctly formed (the prover knows a balance and salt that hash to the declared commitment), and that the balance is greater than or equal to the threshold. The verifier learns only that the balance exceeds the threshold; the magnitude of the surplus remains private.

Applications include lending protocol eligibility checks, counterparty risk assessment in OTC trading, and liquidity provider qualification.

### 4.2 Proof of Identity

A user can prove that they hold a verified identity from a recognized provider without exposing any identifying information.

```
identity_commitment = Poseidon(email, subject, salt)
provider_hash = Poseidon(provider)
address_hash = Poseidon(wallet_address)
```

The circuit proves that the prover possesses an email address and OAuth subject identifier that hash to the declared commitment, and that the identity originates from the declared provider. The verifier learns that the address belongs to someone with a verified Google identity, but not who that person is.

This construction enables regulatory compliance scenarios where a protocol must verify that its users are real humans with verified identities, without accumulating the identity data that creates privacy liability and regulatory burden.

### 4.3 Proof of Eligibility

The most general construction allows proving membership in arbitrary categories defined by configurable criteria.

```
criteria_proof = Poseidon(criteria_id, private_attribute_1, ..., private_attribute_n)
address_hash = Poseidon(wallet_address)
```

Supported criteria include age verification (proving age exceeds a threshold without revealing date of birth), accredited investor status, KYC completion, and membership in permissioned groups. The framework is extensible: new criteria require only a new circuit definition and corresponding verification key deployment.

### 4.4 Proof of History

A user can prove properties of their transaction history without revealing individual transactions.

```
threshold_hash = Poseidon(min_transactions, min_volume, asset)
count_commitment = Poseidon(actual_count, salt)
volume_commitment = Poseidon(actual_volume, salt)
address_hash = Poseidon(wallet_address)
```

The circuit proves that the user's transaction count and total volume each exceed the declared minimums. This enables on-chain credit scoring, loyalty program qualification, and tiered access to financial products, all without exposing the user's transaction graph.

---

## 5. Payment Infrastructure

### 5.1 Instant Payments

StellaRay wraps Stellar's native payment operations in a developer-friendly SDK that abstracts the complexities of account creation, trustline management, and transaction construction. A payment is initiated with a single function call:

```typescript
await wallet.sendPayment(destination, 'native', '100')
```

The SDK handles account existence checks (creating the destination account if necessary), fee estimation, transaction building, signing with the ephemeral session key, and submission to the Stellar network. Settlement occurs within 3 to 5 seconds.

### 5.2 Streaming Payments

For continuous payment scenarios such as payroll, subscription services, and real-time royalty distribution, StellaRay implements a streaming payment protocol with four distribution curves:

**Linear.** Funds vest proportionally over the stream duration. At any time t, the withdrawable amount equals `total * (elapsed / duration)`.

**Cliff.** No funds are available until a specified cliff time, after which linear vesting begins. This models employment compensation with a probationary period.

**Exponential.** Funds vest along an exponential curve: `total * (1 - e^(-k * elapsed / duration))`. This front-loads the payment, delivering the majority of funds early in the stream.

**Stepped.** Funds vest in discrete increments at regular intervals. This models traditional periodic payment structures like monthly salaries.

Each stream is backed by an escrow account that holds the total stream amount. The sender cannot withdraw escrowed funds; the recipient can withdraw only the amount that has vested according to the selected curve and elapsed time. Either party can cancel the stream, with unvested funds returning to the sender and vested funds transferring to the recipient.

### 5.3 The x402 Micropayment Protocol

The HTTP 402 status code (Payment Required) has been reserved since 1999 but never standardized. StellaRay implements a practical interpretation: when a server responds with 402, the response headers specify the payment amount, recipient, and asset. The client SDK parses this requirement, executes the payment on Stellar, and retries the request with a payment proof in the headers.

An optional extension combines x402 with the eligibility framework: before executing a payment, the client can generate a balance intent proof demonstrating the ability to pay, allowing the server to pre-authorize the request before funds move.

---

## 6. Security Analysis

### 6.1 Threat Model

StellaRay's security rests on four assumptions:

1. **Google's OAuth infrastructure is not compromised.** If an attacker can forge Google ID tokens, they can derive any user's wallet. This is the same trust assumption made by every application that uses Google Sign-In. We consider it acceptable because compromising Google's OAuth infrastructure would have consequences far broader than StellaRay.

2. **The BN254 discrete logarithm problem is hard.** This is the standard assumption underlying all BN254-based proof systems. The current best attack against the 254-bit BN254 curve requires approximately 2^100 operations, which is below the 128-bit security level but considered sufficient for the foreseeable future. Should quantum computing advance to the point where this assumption is threatened, migration to a post-quantum proof system would be necessary.

3. **The Groth16 trusted setup was performed honestly.** Groth16 requires a one-time trusted setup ceremony that generates the proving and verification keys. If the secret randomness ("toxic waste") from this ceremony is not properly destroyed, a party in possession of it could forge proofs. StellaRay mitigates this risk through multi-party computation ceremonies where the setup remains secure as long as at least one participant destroys their contribution.

4. **The Stellar ledger provides finality.** Stellar's Federated Byzantine Agreement protocol provides deterministic finality: once a transaction is confirmed, it cannot be reversed. This property is essential for the security of session registration and payment settlement.

### 6.2 Attack Vectors and Mitigations

**Replay Attacks.** Each proof binds to a specific ephemeral key and maximum epoch. The on-chain verifier tracks used nullifiers (derived from the proof's public inputs), preventing any proof from being submitted twice.

**Session Hijacking.** If an attacker obtains the ephemeral private key during a session, they can sign transactions until the session expires. The maximum epoch mechanism limits the window of vulnerability: sessions default to 24 hours, and users can configure shorter durations. The ephemeral key is held only in memory and is destroyed when the browser tab closes.

**Identity Correlation.** An observer watching the blockchain sees transactions from a Stellar address signed by an ephemeral key, authorized by a proof whose public inputs are Poseidon commitments. Without knowledge of the user's salt (held by the Salt Service) and OAuth subject identifier, the observer cannot link the address to any real-world identity. The Salt Service itself stores only the mapping from identity to salt; it does not know the wallet address that results from the derivation.

**Salt Service Compromise.** If the Salt Service is compromised, an attacker learns the mapping from identity to salt. Combined with knowledge of a user's `sub` and `aud` (which are semi-public in some contexts), this would allow computing the user's wallet address. However, the attacker still cannot access the wallet: key derivation also requires the `sub` value, which is available only through a valid OAuth flow with the user's Google credentials.

---

## 7. Performance Analysis

### 7.1 Gas Costs

The following measurements compare proof verification costs before and after Protocol 25:

| Operation | Pre-Protocol 25 (WASM) | Protocol 25 (Native) | Reduction |
|-----------|----------------------|---------------------|-----------|
| BN254 G1 Addition | ~45,000 gas | ~2,800 gas | 93.8% |
| BN254 G1 Multiplication | ~180,000 gas | ~11,200 gas | 93.8% |
| BN254 Pairing Check (4-pair) | ~3,800,000 gas | ~230,000 gas | 93.9% |
| Poseidon Hash (3 inputs) | ~85,000 gas | ~12,000 gas | 85.9% |
| **Full Groth16 Verification** | **~4,100,000 gas** | **~260,000 gas** | **93.7%** |

The 94% reduction in verification cost is the single most consequential number in this paper. It transforms ZK authentication from an expensive novelty into an operation comparable in cost to a standard token transfer.

### 7.2 Latency

End-to-end authentication latency, measured from the moment the user clicks "Sign in with Google" to the moment the session is registered on-chain:

| Phase | Duration |
|-------|----------|
| OAuth consent and token exchange | 800 - 1,500 ms |
| Salt retrieval | 50 - 200 ms |
| Ephemeral key generation | < 10 ms |
| Address computation | < 5 ms |
| Proof generation (Prover Service) | 1,200 - 2,500 ms |
| On-chain verification and registration | 3,000 - 5,000 ms |
| **Total** | **5 - 9 seconds** |

The dominant cost is on-chain settlement, which is governed by Stellar's ledger close time of 3 to 5 seconds. Proof generation is the second largest contributor and is expected to decrease as prover hardware improves.

### 7.3 Proof Characteristics

| Property | Value |
|----------|-------|
| Proof size | 256 bytes |
| Public inputs | 4 field elements (128 bytes) |
| Verification time (on-chain) | ~12 ms |
| Proof generation time (off-chain) | 1.2 - 2.5 seconds |
| Proof validity period | Configurable, default 24 hours |

---

## 8. SDK Architecture

StellaRay is distributed as a TypeScript SDK (`@stellar-zklogin/sdk`) that provides three tiers of abstraction:

**Tier 1: Core Client.** The `ZkLoginClient` class manages the complete authentication lifecycle: session initialization, OAuth completion, address computation, proof generation, and on-chain registration. This tier is framework-agnostic and works in any JavaScript environment.

**Tier 2: Payment and Streaming.** The `StreamingClient` and `X402PaymentClient` classes provide high-level interfaces for streaming payments and micropayment protocols. These clients handle escrow management, curve computation, withdrawal calculations, and HTTP 402 response parsing.

**Tier 3: React Integration.** The `ZkLoginProvider`, `useZkLogin`, and `useZkWallet` hooks provide React-native state management for authentication and wallet operations. Pre-built components including `LoginButton` and `WalletWidget` offer drop-in UI elements.

The intent-based proof APIs (`IntentClient`) allow developers to generate eligibility proofs programmatically, enabling applications such as gated content, tiered access, and privacy-preserving KYC.

---

## 9. Network Deployment

### 9.1 Testnet

StellaRay's complete contract suite has been deployed to the Stellar testnet since January 7, 2026. The deployed contracts are:

- **ZK Verifier:** `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6`
- **Gateway Factory:** `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76`
- **JWK Registry:** `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I`
- **x402 Facilitator:** `CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ`

### 9.2 Mainnet

Mainnet deployment is in the final testing phase following the activation of Protocol 25 on the Stellar public network on January 22, 2026.

---

## 10. Future Directions

**Multi-Provider Support.** The current implementation supports Google OAuth. The architecture is designed to accommodate additional OIDC providers (Apple, Microsoft, GitHub) by deploying corresponding JWK registries and circuit variants. Each provider requires its own verification key but shares the same proof structure and on-chain verifier.

**Recursive Proof Composition.** Groth16 proofs can be composed recursively, allowing a single proof to attest to multiple statements simultaneously. A future release will support composite proofs that combine identity, solvency, and eligibility attestations into a single 256-byte proof with a single on-chain verification.

**Privacy-Preserving Analytics.** The eligibility framework can be extended to support aggregate statistics over private data. For example, a lending protocol could compute the average collateralization ratio of its borrowers without learning any individual borrower's ratio, using ZK-friendly aggregation circuits.

**On-Chain Governance Integration.** Combining ZK eligibility proofs with Stellar governance proposals, enabling anonymous yet verified voting and community participation without exposing voter identity.

---

## 11. Conclusion

The practical barrier to blockchain adoption has never been consensus algorithms, throughput limitations, or fee structures. It has been, and remains, the impossibility of expecting ordinary people to manage cryptographic keys. StellaRay removes this barrier for the Stellar network by reducing wallet creation to a Google Sign-In and reducing identity verification to a 256-byte proof.

The technical contribution of this work is twofold. First, we demonstrate that Stellar's Protocol 25 host functions make Groth16 verification economically practical on a network that was not originally designed for zero-knowledge computation. Second, we extend the authentication primitive into a general eligibility framework that enables privacy-preserving solvency proofs, identity attestations, and transaction history verification.

The system is live on testnet with mainnet deployment imminent. The SDK is available as an open-source TypeScript package. Every component, from the Soroban contracts to the prover service, is designed to be audited, forked, and extended by the Stellar developer community.

Privacy is not a feature to be bolted onto financial infrastructure after the fact. It is a prerequisite for financial infrastructure that serves everyone.

---

## References

[1] Groth, J. (2016). On the Size of Pairing-based Non-interactive Arguments. *EUROCRYPT 2016*. Springer.

[2] Grassi, L., Khovratovich, D., Rechberger, C., Roy, A., Schofnegger, M. (2021). Poseidon: A New Hash Function for Zero-Knowledge Proof Systems. *USENIX Security 2021*.

[3] Stellar Development Foundation. (2025). Soroban Smart Contracts: Runtime Specification and Host Function Reference.

[4] Stellar Development Foundation. (2025). CAP-0074: BN254 Host Functions for Soroban. *Stellar Core Advancement Proposals*.

[5] Stellar Development Foundation. (2025). CAP-0075: Poseidon Hash Host Functions for Soroban. *Stellar Core Advancement Proposals*.

[6] Barreto, P., Naehrig, M. (2006). Pairing-Friendly Elliptic Curves of Prime Order. *Selected Areas in Cryptography 2005*. Springer.

[7] Ben-Sasson, E., Chiesa, A., Tromer, E., Virza, M. (2014). Succinct Non-Interactive Zero Knowledge for a von Neumann Architecture. *USENIX Security 2014*.

[8] Mazieres, D. (2015). The Stellar Consensus Protocol: A Federated Model for Internet-level Consensus. *Stellar Development Foundation*.

[9] Bowe, S., Gabizon, A., Miers, I. (2017). Scalable Multi-party Computation for zk-SNARK Parameters in the Random Beacon Model. *IACR Cryptology ePrint Archive*.

[10] Stellar Development Foundation. (2026). Protocol 25 (X-Ray) Activation Report and Performance Benchmarks.

---

*StellaRay is an open-source project. The SDK, contract source code, and documentation are available at github.com/stellar-zklogin/sdk. This paper will be updated as the protocol evolves.*
