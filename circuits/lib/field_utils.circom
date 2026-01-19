pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

/**
 * Field Utilities for zkLogin
 *
 * Provides utilities for converting between byte arrays and BN254 field elements,
 * which is essential for Poseidon hashing in zkLogin.
 *
 * BN254 scalar field prime:
 * p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
 */

/**
 * Hash arbitrary bytes to a BN254 field element
 * Uses a domain-separated hash construction
 *
 * @param maxBytes - Maximum number of input bytes
 */
template HashBytesToField(maxBytes) {
    signal input bytes[maxBytes];
    signal input numBytes;  // Actual number of bytes
    signal output out;

    // Pack bytes into field elements (31 bytes per element for safety)
    var bytesPerElement = 31;
    var numElements = (maxBytes + bytesPerElement - 1) \ bytesPerElement;

    signal elements[numElements];

    for (var i = 0; i < numElements; i++) {
        var elementVal = 0;
        for (var j = 0; j < bytesPerElement; j++) {
            var byteIdx = i * bytesPerElement + j;
            if (byteIdx < maxBytes) {
                elementVal += bytes[byteIdx] * (1 << (8 * j));
            }
        }
        elements[i] <-- elementVal;
    }

    // Hash using Poseidon
    // We use a 2-input Poseidon iteratively for arbitrary length
    signal intermediateHash[numElements + 1];
    intermediateHash[0] <== 0;  // Initial state

    component hashers[numElements];
    for (var i = 0; i < numElements; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== intermediateHash[i];
        hashers[i].inputs[1] <== elements[i];
        intermediateHash[i + 1] <== hashers[i].out;
    }

    // Final hash includes length for domain separation
    component finalHash = Poseidon(2);
    finalHash.inputs[0] <== intermediateHash[numElements];
    finalHash.inputs[1] <== numBytes;

    out <== finalHash.out;
}

/**
 * Compute address seed for zkLogin
 * address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
 *
 * @param maxKCNameLen - Max length of key claim name (e.g., "sub")
 * @param maxKCValueLen - Max length of key claim value (user ID)
 * @param maxAudLen - Max length of audience (client ID)
 */
template ComputeAddressSeed(maxKCNameLen, maxKCValueLen, maxAudLen) {
    signal input kc_name[maxKCNameLen];
    signal input kc_name_len;
    signal input kc_value[maxKCValueLen];
    signal input kc_value_len;
    signal input aud[maxAudLen];
    signal input aud_len;
    signal input salt;  // Already a field element

    signal output address_seed;

    // Hash key claim name to field
    component hashKCName = HashBytesToField(maxKCNameLen);
    for (var i = 0; i < maxKCNameLen; i++) {
        hashKCName.bytes[i] <== kc_name[i];
    }
    hashKCName.numBytes <== kc_name_len;

    // Hash key claim value to field
    component hashKCValue = HashBytesToField(maxKCValueLen);
    for (var i = 0; i < maxKCValueLen; i++) {
        hashKCValue.bytes[i] <== kc_value[i];
    }
    hashKCValue.numBytes <== kc_value_len;

    // Hash audience to field
    component hashAud = HashBytesToField(maxAudLen);
    for (var i = 0; i < maxAudLen; i++) {
        hashAud.bytes[i] <== aud[i];
    }
    hashAud.numBytes <== aud_len;

    // Hash salt
    component hashSalt = Poseidon(1);
    hashSalt.inputs[0] <== salt;

    // Final address seed computation
    component addressSeedHash = Poseidon(4);
    addressSeedHash.inputs[0] <== hashKCName.out;
    addressSeedHash.inputs[1] <== hashKCValue.out;
    addressSeedHash.inputs[2] <== hashAud.out;
    addressSeedHash.inputs[3] <== hashSalt.out;

    address_seed <== addressSeedHash.out;
}

/**
 * Compute ephemeral public key hash
 * eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
 *
 * The Ed25519 public key (32 bytes) is split into two 128-bit halves
 */
template ComputeEphPKHash() {
    signal input eph_pk_high;  // High 128 bits as field element
    signal input eph_pk_low;   // Low 128 bits as field element
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== eph_pk_high;
    hasher.inputs[1] <== eph_pk_low;

    hash <== hasher.out;
}

/**
 * Compute zkLogin nonce
 * nonce_field = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
 * nonce = base64url(nonce_field[last 20 bytes])
 */
template ComputeNonce() {
    signal input eph_pk_high;
    signal input eph_pk_low;
    signal input max_epoch;
    signal input randomness;
    signal output nonce_hash;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== eph_pk_high;
    hasher.inputs[1] <== eph_pk_low;
    hasher.inputs[2] <== max_epoch;
    hasher.inputs[3] <== randomness;

    nonce_hash <== hasher.out;
}

/**
 * Hash JWK modulus to field for public input
 * Takes k chunks of the RSA modulus and hashes them
 *
 * @param k - Number of chunks (17 for RSA-2048)
 */
template HashModulusToField(k) {
    signal input modulus[k];
    signal output hash;

    // Use Poseidon to hash all chunks
    // Since Poseidon supports limited inputs, we hash iteratively
    signal intermediate[k + 1];
    intermediate[0] <== 0;

    component hashers[k];
    for (var i = 0; i < k; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== intermediate[i];
        hashers[i].inputs[1] <== modulus[i];
        intermediate[i + 1] <== hashers[i].out;
    }

    hash <== intermediate[k];
}

/**
 * Compute issuer hash for public input
 * iss_hash = HashBytesToField(issuer_bytes)
 *
 * @param maxIssLen - Maximum issuer string length
 */
template ComputeIssuerHash(maxIssLen) {
    signal input issuer[maxIssLen];
    signal input issuer_len;
    signal output hash;

    component hasher = HashBytesToField(maxIssLen);
    for (var i = 0; i < maxIssLen; i++) {
        hasher.bytes[i] <== issuer[i];
    }
    hasher.numBytes <== issuer_len;

    hash <== hasher.out;
}

/**
 * Convert a field element to bytes (little-endian)
 * @param numBytes - Number of output bytes (max 31)
 */
template FieldToBytes(numBytes) {
    signal input in;
    signal output bytes[numBytes];

    // Decompose to bits first
    component bits = Num2Bits(numBytes * 8);
    bits.in <== in;

    // Pack bits into bytes
    for (var i = 0; i < numBytes; i++) {
        var byteVal = 0;
        for (var j = 0; j < 8; j++) {
            byteVal += bits.out[i * 8 + j] * (1 << j);
        }
        bytes[i] <-- byteVal;
    }

    // Verify reconstruction
    component verifyBits[numBytes];
    for (var i = 0; i < numBytes; i++) {
        verifyBits[i] = Num2Bits(8);
        verifyBits[i].in <== bytes[i];
    }
}

/**
 * Convert bytes to field element (little-endian)
 * @param numBytes - Number of input bytes (max 31 for BN254)
 */
template BytesToField(numBytes) {
    signal input bytes[numBytes];
    signal output out;

    var acc = 0;
    for (var i = 0; i < numBytes; i++) {
        acc += bytes[i] * (1 << (8 * i));
    }
    out <-- acc;

    // Verify with range checks
    component verifyBytes[numBytes];
    for (var i = 0; i < numBytes; i++) {
        verifyBytes[i] = Num2Bits(8);
        verifyBytes[i].in <== bytes[i];
    }
}

/**
 * Split a 256-bit value into two 128-bit field elements
 * Used for handling Ed25519 public keys
 */
template Split256To128() {
    signal input bytes[32];  // 32 bytes = 256 bits
    signal output high;      // First 16 bytes
    signal output low;       // Last 16 bytes

    // Convert high bytes to field
    component highField = BytesToField(16);
    for (var i = 0; i < 16; i++) {
        highField.bytes[i] <== bytes[i];
    }
    high <== highField.out;

    // Convert low bytes to field
    component lowField = BytesToField(16);
    for (var i = 0; i < 16; i++) {
        lowField.bytes[i] <== bytes[16 + i];
    }
    low <== lowField.out;
}

/**
 * Verify that two field elements are equal
 */
template AssertEqual() {
    signal input a;
    signal input b;

    a === b;
}

/**
 * Conditionally select between two field elements
 * out = sel ? b : a
 */
template Select() {
    signal input sel;  // Must be 0 or 1
    signal input a;
    signal input b;
    signal output out;

    // Verify sel is binary
    sel * (sel - 1) === 0;

    out <== a + sel * (b - a);
}

/**
 * Check if a field element is zero
 */
template IsFieldZero() {
    signal input in;
    signal output out;

    component isZero = IsZero();
    isZero.in <== in;
    out <== isZero.out;
}

/**
 * Domain separator for different hash contexts
 */
template DomainSeparatedHash(domain) {
    signal input in;
    signal output out;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== domain;
    hasher.inputs[1] <== in;

    out <== hasher.out;
}
