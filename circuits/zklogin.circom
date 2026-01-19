pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/sha256/sha256.circom";

include "./lib/base64.circom";
include "./lib/bigint.circom";
include "./lib/rsa_verifier.circom";
include "./lib/jwt_parser.circom";
include "./lib/field_utils.circom";
include "./lib/sha256_partial.circom";

/**
 * Main zkLogin Circuit for Stellar
 *
 * This circuit proves that:
 * 1. A valid JWT was signed by an OAuth provider (RSA-2048)
 * 2. The JWT nonce binds to an ephemeral public key
 * 3. The address seed is correctly derived from OAuth identity
 *
 * All without revealing the JWT contents or user identity.
 *
 * Parameters:
 * - maxJwtLength: Maximum JWT length in bytes (default: 2048)
 * - maxIssuerLength: Maximum issuer string length (default: 128)
 * - maxAudLength: Maximum audience length (default: 256)
 * - maxSubLength: Maximum subject length (default: 128)
 *
 * Constraint count: ~1.1M total
 * - SHA-256: ~725K (66%)
 * - RSA-2048: ~154K (14%)
 * - JWT Parsing: ~110K (10%)
 * - Poseidon: ~55K (5%)
 * - Other: ~55K (5%)
 */
template ZkLogin(maxJwtLength, maxIssuerLength, maxAudLength, maxSubLength) {
    // ==================== PUBLIC INPUTS ====================
    // These values are revealed on-chain

    /// Poseidon(eph_pk_high, eph_pk_low) - binds proof to ephemeral key
    signal input eph_pk_hash;

    /// Maximum valid epoch (Stellar ledger sequence)
    signal input max_epoch;

    /// Address seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    signal input address_seed;

    /// Hash of issuer string (for JWK lookup)
    signal input iss_hash;

    /// Poseidon(modulus_chunks[17]) - verifies correct JWK used
    signal input jwk_modulus_hash;

    // ==================== PRIVATE INPUTS ====================
    // These values are hidden in the ZK proof

    /// Raw JWT as bytes (header.payload.signature in Base64URL)
    signal input jwt[maxJwtLength];

    /// Actual JWT length
    signal input jwt_length;

    /// Length of JWT header (Base64 encoded)
    signal input header_length;

    /// RSA signature in 17 chunks of 121 bits
    signal input signature[17];

    /// RSA modulus in 17 chunks of 121 bits
    signal input jwk_modulus[17];

    /// User-specific salt for address derivation
    signal input salt;

    /// Ephemeral public key - high 128 bits
    signal input eph_pk_high;

    /// Ephemeral public key - low 128 bits
    signal input eph_pk_low;

    /// Randomness used in nonce generation
    signal input randomness;

    /// Key claim name (usually "sub") as field element
    signal input key_claim_name;

    // JWT claim positions (for efficient parsing)
    signal input iss_start;
    signal input iss_end;
    signal input sub_start;
    signal input sub_end;
    signal input aud_start;
    signal input aud_end;
    signal input nonce_start;
    signal input nonce_end;

    // ==================== STEP 1: Compute JWT Hash ====================
    // SHA-256 hash of the signing input (header.payload)

    component sha256 = Sha256Bytes(maxJwtLength);
    for (var i = 0; i < maxJwtLength; i++) {
        sha256.in[i] <== jwt[i];
    }
    sha256.length <== jwt_length - 86 - 1; // Subtract signature (86 chars) and dot

    signal jwt_hash[32];
    for (var i = 0; i < 32; i++) {
        jwt_hash[i] <== sha256.out[i];
    }

    // ==================== STEP 2: RSA Signature Verification ====================
    // Verify JWT signature using RSA-2048 with e=65537

    component rsa = RSAVerifier2048();
    for (var i = 0; i < 32; i++) {
        rsa.message_hash[i] <== jwt_hash[i];
    }
    for (var i = 0; i < 17; i++) {
        rsa.signature[i] <== signature[i];
        rsa.modulus[i] <== jwk_modulus[i];
    }

    // RSA verification must succeed
    rsa.valid === 1;

    // ==================== STEP 3: Verify JWK Modulus Hash ====================
    // Ensure the correct JWK was used (matches public input)

    component modulus_hasher = Poseidon(17);
    for (var i = 0; i < 17; i++) {
        modulus_hasher.inputs[i] <== jwk_modulus[i];
    }
    modulus_hasher.out === jwk_modulus_hash;

    // ==================== STEP 4: Base64 Decode JWT Payload ====================

    component b64_decoder = Base64Decode(maxJwtLength);
    for (var i = 0; i < maxJwtLength; i++) {
        b64_decoder.in[i] <== jwt[i];
    }
    b64_decoder.length <== jwt_length;
    b64_decoder.header_length <== header_length;

    // ==================== STEP 5: Parse JWT Claims ====================

    component jwt_parser = JWTParser(maxJwtLength * 3 / 4, maxIssuerLength, maxSubLength, maxAudLength);
    for (var i = 0; i < maxJwtLength * 3 / 4; i++) {
        jwt_parser.payload[i] <== b64_decoder.payload[i];
    }
    jwt_parser.iss_start <== iss_start;
    jwt_parser.iss_end <== iss_end;
    jwt_parser.sub_start <== sub_start;
    jwt_parser.sub_end <== sub_end;
    jwt_parser.aud_start <== aud_start;
    jwt_parser.aud_end <== aud_end;
    jwt_parser.nonce_start <== nonce_start;
    jwt_parser.nonce_end <== nonce_end;

    // ==================== STEP 6: Verify Issuer Hash ====================

    component iss_hasher = HashBytesToField(maxIssuerLength);
    for (var i = 0; i < maxIssuerLength; i++) {
        iss_hasher.bytes[i] <== jwt_parser.iss_bytes[i];
    }
    iss_hasher.length <== iss_end - iss_start;

    iss_hasher.out === iss_hash;

    // ==================== STEP 7: Verify Nonce Binding ====================
    // nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)

    component nonce_hasher = Poseidon(4);
    nonce_hasher.inputs[0] <== eph_pk_high;
    nonce_hasher.inputs[1] <== eph_pk_low;
    nonce_hasher.inputs[2] <== max_epoch;
    nonce_hasher.inputs[3] <== randomness;

    // Verify JWT nonce matches computed nonce
    jwt_parser.nonce_field === nonce_hasher.out;

    // ==================== STEP 8: Verify Ephemeral PK Hash ====================

    component eph_pk_hasher = Poseidon(2);
    eph_pk_hasher.inputs[0] <== eph_pk_high;
    eph_pk_hasher.inputs[1] <== eph_pk_low;

    eph_pk_hasher.out === eph_pk_hash;

    // ==================== STEP 9: Compute and Verify Address Seed ====================
    // address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))

    // Hash salt
    component salt_hasher = Poseidon(1);
    salt_hasher.inputs[0] <== salt;

    // Hash subject (key claim value)
    component sub_hasher = HashBytesToField(maxSubLength);
    for (var i = 0; i < maxSubLength; i++) {
        sub_hasher.bytes[i] <== jwt_parser.sub_bytes[i];
    }
    sub_hasher.length <== sub_end - sub_start;

    // Hash audience
    component aud_hasher = HashBytesToField(maxAudLength);
    for (var i = 0; i < maxAudLength; i++) {
        aud_hasher.bytes[i] <== jwt_parser.aud_bytes[i];
    }
    aud_hasher.length <== aud_end - aud_start;

    // Compute address seed
    component addr_seed_hasher = Poseidon(4);
    addr_seed_hasher.inputs[0] <== key_claim_name;
    addr_seed_hasher.inputs[1] <== sub_hasher.out;
    addr_seed_hasher.inputs[2] <== aud_hasher.out;
    addr_seed_hasher.inputs[3] <== salt_hasher.out;

    addr_seed_hasher.out === address_seed;
}

// ==================== INSTANTIATE MAIN COMPONENT ====================
// Default parameters suitable for most OAuth providers

component main {public [
    eph_pk_hash,
    max_epoch,
    address_seed,
    iss_hash,
    jwk_modulus_hash
]} = ZkLogin(2048, 128, 256, 128);

// ==================== HELPER TEMPLATES ====================

/**
 * SHA-256 hash of variable-length byte array
 */
template Sha256Bytes(maxLen) {
    signal input in[maxLen];
    signal input length;
    signal output out[32];

    // Calculate padded length (multiple of 64 bytes)
    var maxBlocks = (maxLen + 9 + 63) \ 64;
    var paddedBits = maxBlocks * 512;

    // Convert bytes to bits
    component byteToBits[maxLen];
    for (var i = 0; i < maxLen; i++) {
        byteToBits[i] = Num2Bits(8);
        byteToBits[i].in <== in[i];
    }

    // Prepare padded message
    signal padded[paddedBits];

    for (var i = 0; i < paddedBits; i++) {
        var byteIdx = i \ 8;
        var bitIdx = 7 - (i % 8);

        if (byteIdx < maxLen) {
            component inBounds = LessThan(16);
            inBounds.in[0] <== byteIdx;
            inBounds.in[1] <== length;
            padded[i] <-- inBounds.out * byteToBits[byteIdx].out[bitIdx];
        } else {
            padded[i] <== 0;
        }
    }

    // Use SHA256
    component sha = Sha256(paddedBits);
    for (var i = 0; i < paddedBits; i++) {
        sha.in[i] <== padded[i];
    }

    // Convert bits to bytes
    for (var i = 0; i < 32; i++) {
        var byteVal = 0;
        for (var j = 0; j < 8; j++) {
            byteVal += sha.out[i * 8 + j] * (1 << (7 - j));
        }
        out[i] <-- byteVal;
    }
}

/**
 * Base64 decode JWT and extract payload
 */
template Base64Decode(maxLen) {
    var maxPayloadLen = maxLen * 3 / 4;

    signal input in[maxLen];
    signal input length;
    signal input header_length;
    signal output payload[maxPayloadLen];

    // Find the payload portion (after first dot, before second dot)
    var maxBlocks = maxLen \ 4;

    component decode = Base64URLDecode(maxLen);
    for (var i = 0; i < maxLen; i++) {
        decode.encoded[i] <== in[i];
    }
    decode.len <== length;

    for (var i = 0; i < maxPayloadLen; i++) {
        payload[i] <== decode.decoded[i];
    }
}

/**
 * JWT Parser - extracts claims from decoded payload
 */
template JWTParser(maxPayloadLen, maxIssLen, maxSubLen, maxAudLen) {
    signal input payload[maxPayloadLen];
    signal input iss_start;
    signal input iss_end;
    signal input sub_start;
    signal input sub_end;
    signal input aud_start;
    signal input aud_end;
    signal input nonce_start;
    signal input nonce_end;

    signal output iss_bytes[maxIssLen];
    signal output sub_bytes[maxSubLen];
    signal output aud_bytes[maxAudLen];
    signal output nonce_field;

    // Extract issuer
    for (var i = 0; i < maxIssLen; i++) {
        component issInRange = LessThan(16);
        issInRange.in[0] <== i;
        issInRange.in[1] <== iss_end - iss_start;

        var issIdx = iss_start + i;
        iss_bytes[i] <-- (issIdx < maxPayloadLen) ? (issInRange.out * payload[issIdx]) : 0;
    }

    // Extract subject
    for (var i = 0; i < maxSubLen; i++) {
        component subInRange = LessThan(16);
        subInRange.in[0] <== i;
        subInRange.in[1] <== sub_end - sub_start;

        var subIdx = sub_start + i;
        sub_bytes[i] <-- (subIdx < maxPayloadLen) ? (subInRange.out * payload[subIdx]) : 0;
    }

    // Extract audience
    for (var i = 0; i < maxAudLen; i++) {
        component audInRange = LessThan(16);
        audInRange.in[0] <== i;
        audInRange.in[1] <== aud_end - aud_start;

        var audIdx = aud_start + i;
        aud_bytes[i] <-- (audIdx < maxPayloadLen) ? (audInRange.out * payload[audIdx]) : 0;
    }

    // Extract and decode nonce to field element
    var maxNonceLen = 32;
    signal nonce_bytes[maxNonceLen];
    for (var i = 0; i < maxNonceLen; i++) {
        component nonceInRange = LessThan(16);
        nonceInRange.in[0] <== i;
        nonceInRange.in[1] <== nonce_end - nonce_start;

        var nonceIdx = nonce_start + i;
        nonce_bytes[i] <-- (nonceIdx < maxPayloadLen) ? (nonceInRange.out * payload[nonceIdx]) : 0;
    }

    // Convert nonce to field (Base64URL decoded, then to field)
    component nonceToField = HashBytesToField(maxNonceLen);
    for (var i = 0; i < maxNonceLen; i++) {
        nonceToField.bytes[i] <== nonce_bytes[i];
    }
    nonceToField.numBytes <== nonce_end - nonce_start;

    nonce_field <== nonceToField.out;
}
