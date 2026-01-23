# Protocol 25 (X-Ray) Integration Guide

## Overview

This document describes the integration of Stellar's Protocol 25 (X-Ray) into the zkLogin Gateway project. Protocol 25 introduces native cryptographic primitives for zero-knowledge proofs, enabling efficient on-chain verification of zkLogin proofs.

## What's New in Protocol 25

Protocol 25 introduces two major CAPs (Core Advancement Proposals):

### CAP-0074: BN254 Elliptic Curve Support

Native support for BN254 (alt-bn128) elliptic curve operations:

| Host Function | Description |
|--------------|-------------|
| `bn254_g1_add` | G1 point addition |
| `bn254_g1_mul` | G1 scalar multiplication |
| `bn254_multi_pairing_check` | Multi-pairing verification |

**Gas Savings**: ~94% compared to WASM implementation

### CAP-0075: Poseidon Hash Functions

Native support for ZK-friendly Poseidon hash functions:

| Host Function | Description |
|--------------|-------------|
| `poseidon_permutation` | Standard Poseidon (Circom compatible) |
| `poseidon2_permutation` | Poseidon2 variant (Noir compatible) |

**Supported State Sizes**: T = 2, 3, 4, 5, 6

**Gas Savings**: ~90% compared to WASM implementation

## Dependencies Updated

### Root Cargo.toml

```toml
[workspace.dependencies]
# Protocol 25 (X-Ray) - Latest Soroban SDK with BN254 and Poseidon support
soroban-sdk = "25.0.0-rc.2"
soroban-token-sdk = "25.0.0-rc.2"
# Official Stellar Poseidon SDK for ZK-friendly hashing
soroban-poseidon = "25.0.0-rc.1"
```

### Prover Cargo.toml

```toml
[dependencies]
# Poseidon hashing for ZK-friendly witness computation
light-poseidon = "0.4"
```

## Contract Updates

### 1. ZK Verifier Contract (`contracts/zk-verifier/src/lib.rs`)

**Key Changes:**

- Full Groth16 proof verification using BN254 pairing
- Native Poseidon hashing for public input computation
- Proper nullifier computation using Poseidon

**New Functions:**

```rust
use soroban_sdk::crypto::bn254::{Bn254G1Affine, Bn254G2Affine, Fr};

// BN254 G1 point addition using Protocol 25 host function
fn g1_add(env: &Env, p1: &Bn254G1Affine, p2: &Bn254G1Affine) -> Bn254G1Affine {
    env.crypto().bn254().g1_add(p1, p2)
}

// BN254 G1 scalar multiplication using Protocol 25 host function
fn g1_scalar_mul(env: &Env, point: &Bn254G1Affine, scalar: &Fr) -> Bn254G1Affine {
    env.crypto().bn254().g1_mul(point, scalar)
}

// Verify Groth16 pairing equation
fn verify_pairing(env: &Env, g1_points: Vec<Bn254G1Affine>, g2_points: Vec<Bn254G2Affine>) -> bool {
    env.crypto().bn254().pairing_check(g1_points, g2_points)
}
```

**Poseidon Usage:**

```rust
use soroban_poseidon::poseidon_hash;
use soroban_sdk::crypto::BnScalar;

// Compute address seed using Poseidon
pub fn compute_address_seed(...) -> BytesN<32> {
    let salt_hash = poseidon_hash::<2, BnScalar>(&env, &salt_inputs);
    let address_seed = poseidon_hash::<5, BnScalar>(&env, &inputs);
    // ...
}
```

### 2. JWK Registry Contract (`contracts/jwk-registry/src/lib.rs`)

**Key Changes:**

- Poseidon hash of RSA modulus chunks for ZK circuit compatibility
- Tree structure hashing to handle 17 chunks efficiently

**Implementation:**

```rust
/// Compute Poseidon hash of modulus chunks using Protocol 25 native support
fn compute_modulus_hash(env: &Env, chunks: &Vec<BytesN<32>>) -> BytesN<32> {
    // Hash in a tree structure to handle 17 inputs
    // First layer: hash groups of 4 elements
    // Second layer: hash the 5 intermediate results
    let final_hash = poseidon_hash::<6, BnScalar>(env, &intermediate);
    // ...
}
```

### 3. Gateway Factory Contract (`contracts/gateway-factory/src/lib.rs`)

**Key Changes:**

- Poseidon-based address seed computation
- Deterministic wallet address prediction using Poseidon

**Implementation:**

```rust
/// Compute address seed from OAuth identity components using Poseidon
pub fn compute_address_seed(
    env: Env,
    kc_name_hash: BytesN<32>,
    kc_value_hash: BytesN<32>,
    aud_hash: BytesN<32>,
    user_salt: BytesN<32>,
) -> BytesN<32> {
    // Step 1: Poseidon(salt)
    let salt_hash = poseidon_hash::<2, BnScalar>(&env, &salt_inputs);

    // Step 2: Poseidon(kc_name_F, kc_value_F, aud_F, salt_hash)
    let address_seed_fe = poseidon_hash::<5, BnScalar>(&env, &inputs);
    // ...
}
```

### 4. Smart Wallet Contract (`contracts/smart-wallet/src/lib.rs`)

**Key Changes:**

- Poseidon-based session ID computation
- Poseidon-based ephemeral public key hash

**Implementation:**

```rust
/// Compute session ID using Poseidon hash of ephemeral public key
fn compute_session_id(env: &Env, eph_pk: &BytesN<32>) -> BytesN<32> {
    let eph_pk_fe = Self::bytes_to_field_element(env, eph_pk);
    let inputs = soroban_sdk::vec![env, eph_pk_fe];
    let hash = poseidon_hash::<2, BnScalar>(env, &inputs);
    // ...
}

/// Compute ephemeral public key hash using Poseidon
fn compute_eph_pk_hash(env: &Env, eph_pk: &BytesN<32>) -> BytesN<32> {
    // Split into high and low parts
    let inputs = soroban_sdk::vec![env, high_fe, low_fe];
    let hash = poseidon_hash::<3, BnScalar>(env, &inputs);
    // ...
}
```

## Prover Updates

### Witness Computation (`prover/src/witness.rs`)

**Key Changes:**

- Uses `light-poseidon` for Circom-compatible Poseidon hashing
- Proper field element conversion for BN254
- Tree structure for modulus hash matching contract implementation

**Implementation:**

```rust
use light_poseidon::{Poseidon, PoseidonHasher};
use ark_bn254::Fr;

/// Compute Poseidon hash for a fixed number of inputs
fn poseidon_hash_fixed<const N: usize>(inputs: &[Fr; N]) -> Result<Fr> {
    let mut poseidon = Poseidon::<Fr>::new_circom(N)?;
    poseidon.hash(inputs)
}

/// Compute ephemeral public key hash using Poseidon
fn compute_eph_pk_hash(eph_pk_high: &str, eph_pk_low: &str) -> Result<String> {
    let high = string_to_field(eph_pk_high)?;
    let low = string_to_field(eph_pk_low)?;
    let hash = poseidon_hash_fixed(&[high, low])?;
    Ok(field_to_hex(&hash))
}

/// Compute address seed from OAuth identity using Poseidon
fn compute_address_seed(...) -> Result<String> {
    let salt_hash = poseidon_hash_fixed(&[salt_fe])?;
    let address_seed = poseidon_hash_fixed(&[kc_name_f, kc_value_f, aud_f, salt_hash])?;
    // ...
}
```

## TypeScript SDK Updates

### Version Bump

SDK version updated to `2.1.0` for Protocol 25 compatibility.

### New Exports (`sdk/src/index.ts`)

```typescript
// Protocol 25 information constant
export const PROTOCOL_25 = {
  version: 25,
  name: "X-Ray",
  caps: ["CAP-0074", "CAP-0075"],
  features: {
    bn254: {
      hostFunctions: {
        g1Add: "bn254_g1_add",
        g1Mul: "bn254_g1_mul",
        pairingCheck: "bn254_multi_pairing_check",
      },
      gasSavings: "94%",
    },
    poseidon: {
      hostFunctions: {
        permutation: "poseidon_permutation",
        permutation2: "poseidon2_permutation",
      },
      supportedStateSizes: [2, 3, 4, 5, 6],
      sdkPackage: "soroban-poseidon",
      gasSavings: "90%",
    },
  },
  // ...
};
```

### Crypto Utilities (`sdk/src/utils/crypto.ts`)

**New Functions:**

```typescript
// Compute ephemeral public key hash using Poseidon
export async function computeEphPkHash(
  ephPkHigh: bigint,
  ephPkLow: bigint
): Promise<bigint>

// Compute address seed from OAuth identity using Poseidon
export async function computeAddressSeed(
  kcNameHash: bigint,
  kcValueHash: bigint,
  audHash: bigint,
  salt: bigint
): Promise<bigint>

// Compute nonce for session binding using Poseidon
export async function computeNonce(
  ephPkHigh: bigint,
  ephPkLow: bigint,
  maxEpoch: bigint,
  randomness: bigint
): Promise<bigint>
```

**Updated `hashModulusToField`:**

Now uses tree structure matching the Soroban contract implementation for 17-chunk RSA modulus.

## Gas Cost Comparison

| Operation | WASM (Pre-P25) | Protocol 25 | Savings |
|-----------|----------------|-------------|---------|
| Groth16 Verify | 4,100,000 | 260,000 | 94% |
| Pairing Check | 2,500,000 | 150,000 | 94% |
| Poseidon Hash | 500,000 | 50,000 | 90% |

## Migration Guide

### For Contract Developers

1. Update `Cargo.toml` to use `soroban-sdk = "25.0.0-rc.2"` and `soroban-poseidon = "25.0.0-rc.1"`

2. Replace SHA256 hashes with Poseidon where ZK circuit compatibility is needed:

```rust
// Before (SHA256)
env.crypto().sha256(&data).into()

// After (Poseidon)
use soroban_poseidon::poseidon_hash;
use soroban_sdk::crypto::BnScalar;
let hash = poseidon_hash::<3, BnScalar>(&env, &inputs);
```

3. For Groth16 verification, use native BN254 pairing:

```rust
use soroban_sdk::crypto::bn254::{Bn254G1Affine, Bn254G2Affine};

let result = env.crypto().bn254().pairing_check(g1_points, g2_points);
```

### For SDK Users

1. Update SDK to version `2.1.0`

2. Use new crypto functions for Poseidon hashing:

```typescript
import { computeAddressSeed, computeNonce } from '@stellar-zklogin/sdk';

const addressSeed = await computeAddressSeed(kcNameHash, kcValueHash, audHash, salt);
const nonce = await computeNonce(ephPkHigh, ephPkLow, maxEpoch, randomness);
```

## Deployed Contracts (Testnet)

| Contract | Contract ID |
|----------|-------------|
| ZK Verifier | `CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6` |
| JWK Registry | `CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I` |
| Gateway Factory | `CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76` |
| Smart Wallet (WASM) | `2a7e72543da92134de77821c920b82e6c5fb7cd02b5283cfeb87deb894e14d5d` |

**Explorer Links:**
- [ZK Verifier on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6)
- [JWK Registry on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I)
- [Gateway Factory on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76)

## Timeline

| Milestone | Date |
|-----------|------|
| Testnet Vote | January 7, 2026 |
| Mainnet Vote | January 22, 2026 |

## References

- [Stellar X-Ray Protocol 25 Announcement](https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25)
- [CAP-0074: BN254 Support](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md)
- [CAP-0075: Poseidon Hash Functions](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md)
- [soroban-poseidon GitHub](https://github.com/stellar/rs-soroban-poseidon)
- [soroban-poseidon crates.io](https://crates.io/crates/soroban-poseidon)

## Summary

Protocol 25 (X-Ray) brings native cryptographic primitives to Stellar that enable:

1. **Efficient On-Chain ZK Verification**: Groth16 proofs can now be verified on-chain with ~94% gas savings

2. **ZK-Compatible Hashing**: Poseidon hashes computed off-chain (in circuits and SDK) match on-chain computation

3. **Deterministic Addresses**: zkLogin wallet addresses are now derived using cryptographically secure Poseidon hashes

4. **Ecosystem Compatibility**: BN254 and Poseidon implementations are compatible with Circom, Noir, and other ZK frameworks

This integration positions Stellar zkLogin as a production-ready solution for social login on blockchain, with the security and efficiency guarantees of Protocol 25.
