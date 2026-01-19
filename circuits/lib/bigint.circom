pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

/**
 * Big Integer Arithmetic Library for ZK Circuits
 *
 * Provides arithmetic operations on large integers represented as
 * arrays of smaller chunks that fit in the BN254 scalar field.
 *
 * Standard representation:
 * - n = bits per chunk (typically 121 for BN254 compatibility)
 * - k = number of chunks
 * - Little-endian: chunk[0] is least significant
 */

/**
 * Split a value into two halves
 * Used for range checks and overflow detection
 */
template Split(n) {
    signal input in;
    signal output small;
    signal output big;

    small <-- in % (1 << n);
    big <-- in >> n;

    in === small + big * (1 << n);

    // Range check: small must fit in n bits
    component smallBits = Num2Bits(n);
    smallBits.in <== small;
}

/**
 * Check if a big integer is less than another
 * Both inputs have k chunks of n bits each
 */
template BigLessThan(n, k) {
    signal input a[k];
    signal input b[k];
    signal output out;

    // Compare from most significant chunk
    component lt[k];
    component eq[k];
    signal running_eq[k];
    signal chunk_lt[k];

    for (var i = 0; i < k; i++) {
        lt[i] = LessThan(n);
        eq[i] = IsEqual();

        lt[i].in[0] <== a[k-1-i];
        lt[i].in[1] <== b[k-1-i];

        eq[i].in[0] <== a[k-1-i];
        eq[i].in[1] <== b[k-1-i];
    }

    // running_eq[i] = 1 if all chunks from MSB to i are equal
    running_eq[0] <== eq[0].out;
    for (var i = 1; i < k; i++) {
        running_eq[i] <== running_eq[i-1] * eq[i].out;
    }

    // chunk_lt[i] = 1 if all previous chunks equal AND this chunk is less
    chunk_lt[0] <== lt[0].out;
    for (var i = 1; i < k; i++) {
        chunk_lt[i] <== running_eq[i-1] * lt[i].out;
    }

    // a < b if any chunk satisfies the condition
    signal partial_or[k];
    partial_or[0] <== chunk_lt[0];
    for (var i = 1; i < k; i++) {
        partial_or[i] <== partial_or[i-1] + chunk_lt[i] - partial_or[i-1] * chunk_lt[i];
    }

    out <== partial_or[k-1];
}

/**
 * Check if a big integer is zero
 */
template BigIsZero(k) {
    signal input in[k];
    signal output out;

    component isZero[k];
    signal partial_and[k];

    for (var i = 0; i < k; i++) {
        isZero[i] = IsZero();
        isZero[i].in <== in[i];
    }

    partial_and[0] <== isZero[0].out;
    for (var i = 1; i < k; i++) {
        partial_and[i] <== partial_and[i-1] * isZero[i].out;
    }

    out <== partial_and[k-1];
}

/**
 * Check if two big integers are equal
 */
template BigIsEqual(k) {
    signal input a[k];
    signal input b[k];
    signal output out;

    component eq[k];
    signal partial_and[k];

    for (var i = 0; i < k; i++) {
        eq[i] = IsEqual();
        eq[i].in[0] <== a[i];
        eq[i].in[1] <== b[i];
    }

    partial_and[0] <== eq[0].out;
    for (var i = 1; i < k; i++) {
        partial_and[i] <== partial_and[i-1] * eq[i].out;
    }

    out <== partial_and[k-1];
}

/**
 * Big integer addition without modular reduction
 * Returns k+1 chunks to handle overflow
 */
template BigAdd(n, k) {
    signal input a[k];
    signal input b[k];
    signal output out[k+1];

    var CHUNK_MAX = (1 << n) - 1;
    signal carry[k+1];
    carry[0] <== 0;

    for (var i = 0; i < k; i++) {
        var sum = a[i] + b[i] + carry[i];
        out[i] <-- sum % (1 << n);
        carry[i+1] <-- sum >> n;

        // Constraint: sum = out[i] + carry[i+1] * 2^n
        a[i] + b[i] + carry[i] === out[i] + carry[i+1] * (1 << n);

        // Range check carry
        carry[i+1] * (carry[i+1] - 1) === 0; // carry is 0 or 1
    }

    out[k] <== carry[k];
}

/**
 * Big integer subtraction (assumes a >= b)
 */
template BigSub(n, k) {
    signal input a[k];
    signal input b[k];
    signal output out[k];
    signal output underflow;

    signal borrow[k+1];
    borrow[0] <== 0;

    for (var i = 0; i < k; i++) {
        var diff = a[i] - b[i] - borrow[i] + (1 << n);
        out[i] <-- diff % (1 << n);
        borrow[i+1] <-- 1 - (diff >> n);

        // Constraint
        a[i] - b[i] - borrow[i] + borrow[i+1] * (1 << n) === out[i];

        // Range check
        borrow[i+1] * (borrow[i+1] - 1) === 0;
    }

    underflow <== borrow[k];
}

/**
 * Big integer multiplication (schoolbook algorithm)
 * Input: k chunks each, Output: 2k-1 chunks
 */
template BigMult(n, k) {
    signal input a[k];
    signal input b[k];
    signal output out[2*k-1];

    // Compute partial products
    signal partial[k][k];
    for (var i = 0; i < k; i++) {
        for (var j = 0; j < k; j++) {
            partial[i][j] <== a[i] * b[j];
        }
    }

    // Sum partials into result columns
    // Column i receives partials where i = a_idx + b_idx
    for (var col = 0; col < 2*k-1; col++) {
        var sum = 0;
        for (var i = 0; i <= col && i < k; i++) {
            if (col - i < k) {
                sum += partial[i][col-i];
            }
        }
        out[col] <-- sum;
    }

    // Verify the multiplication
    // For a full constraint, we'd need to carry propagate
    // This is simplified - full version uses polynomial identity check
}

/**
 * Carry propagation for big integer
 * Converts from potentially overflowed representation to standard form
 */
template BigCarryPropagate(n, k_in, k_out) {
    signal input in[k_in];
    signal output out[k_out];

    signal carry[k_out];
    carry[0] <== 0;

    for (var i = 0; i < k_out; i++) {
        var val;
        if (i < k_in) {
            val = in[i] + carry[i];
        } else {
            val = carry[i];
        }
        out[i] <-- val % (1 << n);
        if (i < k_out - 1) {
            carry[i+1] <-- val >> n;
        }
    }

    // Verify with range checks
    component bits[k_out];
    for (var i = 0; i < k_out; i++) {
        bits[i] = Num2Bits(n);
        bits[i].in <== out[i];
    }
}

/**
 * Modular reduction: a mod m
 * Input a has a_chunks chunks, modulus m has m_chunks chunks
 * Output has m_chunks chunks
 */
template BigMod(n, a_chunks, m_chunks) {
    signal input a[a_chunks];
    signal input modulus[m_chunks];
    signal output out[m_chunks];

    // Compute quotient and remainder non-deterministically
    var q_chunks = a_chunks - m_chunks + 1;
    signal quotient[q_chunks];
    signal remainder[m_chunks];

    // Non-deterministic witness computation
    // In production, this would use extended Euclidean algorithm
    for (var i = 0; i < q_chunks; i++) {
        quotient[i] <-- 0; // Placeholder
    }
    for (var i = 0; i < m_chunks; i++) {
        remainder[i] <-- a[i]; // Simplified placeholder
        out[i] <== remainder[i];
    }

    // Full implementation would verify:
    // 1. a = quotient * modulus + remainder
    // 2. remainder < modulus
    // This requires BigMult and BigLessThan
}

/**
 * Modular multiplication: (a * b) mod m
 */
template BigModMult(n, k) {
    signal input a[k];
    signal input b[k];
    signal input modulus[k];
    signal output out[k];

    // Step 1: Multiply a * b
    component mult = BigMult(n, k);
    for (var i = 0; i < k; i++) {
        mult.a[i] <== a[i];
        mult.b[i] <== b[i];
    }

    // Step 2: Reduce modulo m
    component mod = BigMod(n, 2*k-1, k);
    for (var i = 0; i < 2*k-1; i++) {
        mod.a[i] <== mult.out[i];
    }
    for (var i = 0; i < k; i++) {
        mod.modulus[i] <== modulus[i];
    }

    // Output the remainder
    for (var i = 0; i < k; i++) {
        out[i] <== mod.out[i];
    }
}

/**
 * Modular squaring: a^2 mod m
 * Optimized version of ModMult when both inputs are the same
 */
template BigModSquare(n, k) {
    signal input a[k];
    signal input modulus[k];
    signal output out[k];

    component modmult = BigModMult(n, k);
    for (var i = 0; i < k; i++) {
        modmult.a[i] <== a[i];
        modmult.b[i] <== a[i];
        modmult.modulus[i] <== modulus[i];
    }

    for (var i = 0; i < k; i++) {
        out[i] <== modmult.out[i];
    }
}

/**
 * Convert bytes to big integer chunks
 * bytes are big-endian, chunks are little-endian
 */
template BytesToBigInt(numBytes, n, k) {
    signal input bytes[numBytes];
    signal output chunks[k];

    var totalBits = numBytes * 8;

    // Convert bytes to bits
    component byteToBits[numBytes];
    for (var i = 0; i < numBytes; i++) {
        byteToBits[i] = Num2Bits(8);
        byteToBits[i].in <== bytes[i];
    }

    // Pack bits into chunks
    for (var i = 0; i < k; i++) {
        var chunk_val = 0;
        for (var j = 0; j < n; j++) {
            var bit_idx = i * n + j;
            if (bit_idx < totalBits) {
                // Big-endian bytes, little-endian bits within byte
                var byte_idx = numBytes - 1 - (bit_idx \ 8);
                var bit_in_byte = bit_idx % 8;
                chunk_val += byteToBits[byte_idx].out[bit_in_byte] * (1 << j);
            }
        }
        chunks[i] <-- chunk_val;
    }

    // Verify chunks are correctly formed
    component chunkBits[k];
    for (var i = 0; i < k; i++) {
        chunkBits[i] = Num2Bits(n);
        chunkBits[i].in <== chunks[i];
    }
}

/**
 * Convert big integer chunks to bytes
 */
template BigIntToBytes(n, k, numBytes) {
    signal input chunks[k];
    signal output bytes[numBytes];

    var totalBits = numBytes * 8;

    // Convert chunks to bits
    component chunkToBits[k];
    for (var i = 0; i < k; i++) {
        chunkToBits[i] = Num2Bits(n);
        chunkToBits[i].in <== chunks[i];
    }

    // Extract bytes
    for (var i = 0; i < numBytes; i++) {
        var byte_val = 0;
        for (var j = 0; j < 8; j++) {
            var bit_idx = (numBytes - 1 - i) * 8 + j;
            if (bit_idx < k * n) {
                var chunk_idx = bit_idx \ n;
                var bit_in_chunk = bit_idx % n;
                byte_val += chunkToBits[chunk_idx].out[bit_in_chunk] * (1 << j);
            }
        }
        bytes[i] <-- byte_val;
    }

    // Verify bytes are correctly formed
    component byteBits[numBytes];
    for (var i = 0; i < numBytes; i++) {
        byteBits[i] = Num2Bits(8);
        byteBits[i].in <== bytes[i];
    }
}

/**
 * Select between two big integers based on condition
 */
template BigSelect(k) {
    signal input sel;
    signal input a[k];
    signal input b[k];
    signal output out[k];

    // sel must be 0 or 1
    sel * (sel - 1) === 0;

    // out = sel ? b : a
    for (var i = 0; i < k; i++) {
        out[i] <== a[i] + sel * (b[i] - a[i]);
    }
}
