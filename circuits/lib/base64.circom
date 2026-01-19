pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";

/**
 * Base64URL Decoding Circuits for JWT Processing
 *
 * Handles Base64URL encoding (RFC 4648) used in JWTs:
 * - Uses '-' instead of '+' and '_' instead of '/'
 * - No padding ('=') characters
 *
 * Character mapping:
 * A-Z: 0-25  (ASCII 65-90)
 * a-z: 26-51 (ASCII 97-122)
 * 0-9: 52-61 (ASCII 48-57)
 * -: 62      (ASCII 45)
 * _: 63      (ASCII 95)
 */

/**
 * Decode a single Base64URL character to its 6-bit value
 */
template Base64URLCharDecode() {
    signal input char;  // ASCII value
    signal output value;  // 0-63
    signal output valid;  // 1 if valid base64url char

    // Check character ranges
    component isUpperCase = InRange(8);
    isUpperCase.in <== char;
    isUpperCase.lower <== 65;  // 'A'
    isUpperCase.upper <== 90;  // 'Z'

    component isLowerCase = InRange(8);
    isLowerCase.in <== char;
    isLowerCase.lower <== 97;  // 'a'
    isLowerCase.upper <== 122; // 'z'

    component isDigit = InRange(8);
    isDigit.in <== char;
    isDigit.lower <== 48;  // '0'
    isDigit.upper <== 57;  // '9'

    component isMinus = IsEqual();
    isMinus.in[0] <== char;
    isMinus.in[1] <== 45;  // '-'

    component isUnderscore = IsEqual();
    isUnderscore.in[0] <== char;
    isUnderscore.in[1] <== 95;  // '_'

    // Calculate value based on character type
    signal upperVal <== (char - 65) * isUpperCase.out;
    signal lowerVal <== (char - 97 + 26) * isLowerCase.out;
    signal digitVal <== (char - 48 + 52) * isDigit.out;
    signal minusVal <== 62 * isMinus.out;
    signal underscoreVal <== 63 * isUnderscore.out;

    value <== upperVal + lowerVal + digitVal + minusVal + underscoreVal;
    valid <== isUpperCase.out + isLowerCase.out + isDigit.out + isMinus.out + isUnderscore.out;
}

/**
 * Check if value is in range [lower, upper]
 */
template InRange(n) {
    signal input in;
    signal input lower;
    signal input upper;
    signal output out;

    component gte = GreaterEqThan(n);
    gte.in[0] <== in;
    gte.in[1] <== lower;

    component lte = LessEqThan(n);
    lte.in[0] <== in;
    lte.in[1] <== upper;

    out <== gte.out * lte.out;
}

/**
 * Decode 4 Base64URL characters into 3 bytes
 * Standard base64 decoding block
 */
template Base64URLDecodeBlock() {
    signal input chars[4];  // 4 base64url characters
    signal output bytes[3]; // 3 decoded bytes
    signal output valid;    // All chars valid

    // Decode each character
    component decode[4];
    signal values[4];
    signal valids[4];

    for (var i = 0; i < 4; i++) {
        decode[i] = Base64URLCharDecode();
        decode[i].char <== chars[i];
        values[i] <== decode[i].value;
        valids[i] <== decode[i].valid;
    }

    // Check all characters are valid
    valid <== valids[0] * valids[1] * valids[2] * valids[3];

    // Convert 4x 6-bit values to 3x 8-bit bytes
    // Combined: (v0 << 18) | (v1 << 12) | (v2 << 6) | v3
    // byte0: bits 23-16 = (v0 << 2) | (v1 >> 4)
    // byte1: bits 15-8  = ((v1 & 0xF) << 4) | (v2 >> 2)
    // byte2: bits 7-0   = ((v2 & 0x3) << 6) | v3

    // Get bits of each value
    component bits0 = Num2Bits(6);
    component bits1 = Num2Bits(6);
    component bits2 = Num2Bits(6);
    component bits3 = Num2Bits(6);

    bits0.in <== values[0];
    bits1.in <== values[1];
    bits2.in <== values[2];
    bits3.in <== values[3];

    // Reconstruct bytes
    // byte0 = v0 * 4 + (v1 >> 4) = v0 * 4 + floor(v1 / 16)
    signal v1_high <-- values[1] >> 4;
    signal v1_low <-- values[1] & 15;
    v1_high * 16 + v1_low === values[1];
    bytes[0] <== values[0] * 4 + v1_high;

    // byte1 = (v1 & 15) * 16 + (v2 >> 2)
    signal v2_high <-- values[2] >> 2;
    signal v2_low <-- values[2] & 3;
    v2_high * 4 + v2_low === values[2];
    bytes[1] <== v1_low * 16 + v2_high;

    // byte2 = (v2 & 3) * 64 + v3
    bytes[2] <== v2_low * 64 + values[3];

    // Range check bytes
    component byteBits[3];
    for (var i = 0; i < 3; i++) {
        byteBits[i] = Num2Bits(8);
        byteBits[i].in <== bytes[i];
    }
}

/**
 * Decode a Base64URL string of known length
 * Handles padding by decoding only full blocks plus remainder
 *
 * @param maxInputLen - Maximum input string length
 */
template Base64URLDecode(maxInputLen) {
    // Calculate max output length
    var maxOutputLen = (maxInputLen * 3) \ 4;

    signal input encoded[maxInputLen];
    signal input len;  // Actual length of encoded string
    signal output decoded[maxOutputLen];
    signal output decodedLen;

    // Number of complete 4-char blocks
    var maxBlocks = maxInputLen \ 4;

    // Decode each block
    component blocks[maxBlocks];
    signal blockValid[maxBlocks];

    for (var i = 0; i < maxBlocks; i++) {
        blocks[i] = Base64URLDecodeBlock();
        for (var j = 0; j < 4; j++) {
            blocks[i].chars[j] <== encoded[i * 4 + j];
        }
        blockValid[i] <== blocks[i].valid;
    }

    // Output decoded bytes
    for (var i = 0; i < maxBlocks; i++) {
        for (var j = 0; j < 3; j++) {
            var outIdx = i * 3 + j;
            if (outIdx < maxOutputLen) {
                decoded[outIdx] <== blocks[i].bytes[j];
            }
        }
    }

    // Calculate output length based on input length
    // len % 4 == 0: outputLen = len * 3 / 4
    // len % 4 == 2: outputLen = len * 3 / 4 (effectively, rounds down + 1 byte)
    // len % 4 == 3: outputLen = len * 3 / 4 (effectively, rounds down + 2 bytes)
    signal lenDiv4 <-- len \ 4;
    signal lenMod4 <-- len % 4;
    lenDiv4 * 4 + lenMod4 === len;

    // Output length calculation
    signal baseLen <== lenDiv4 * 3;
    signal extraBytes <-- (lenMod4 * 3) \ 4;
    decodedLen <== baseLen + extraBytes;
}

/**
 * Extract a substring from a byte array
 */
template ExtractSubstring(maxLen, subLen) {
    signal input input_bytes[maxLen];
    signal input start;  // Start index
    signal output output_bytes[subLen];

    // Use multiplexing to select bytes
    for (var i = 0; i < subLen; i++) {
        var sum = 0;
        for (var j = 0; j < maxLen; j++) {
            // Select input_bytes[j] if j == start + i
            component eq = IsEqual();
            eq.in[0] <== j;
            eq.in[1] <== start + i;
            sum += input_bytes[j] * eq.out;
        }
        output_bytes[i] <-- sum;
    }
}

/**
 * Find the index of a character in an array
 * Returns first occurrence or -1 if not found
 */
template FindChar(maxLen) {
    signal input arr[maxLen];
    signal input target;
    signal input len;  // Actual array length
    signal output index;
    signal output found;

    // Check each position
    component eq[maxLen];
    signal matchAt[maxLen];

    for (var i = 0; i < maxLen; i++) {
        eq[i] = IsEqual();
        eq[i].in[0] <== arr[i];
        eq[i].in[1] <== target;

        // Match only if within length
        component inBounds = LessThan(16);
        inBounds.in[0] <== i;
        inBounds.in[1] <== len;

        matchAt[i] <== eq[i].out * inBounds.out;
    }

    // Find first match
    signal cumMatch[maxLen + 1];
    signal firstMatch[maxLen];
    cumMatch[0] <== 0;

    for (var i = 0; i < maxLen; i++) {
        cumMatch[i + 1] <== cumMatch[i] + matchAt[i];

        // First match: matchAt[i] && cumMatch[i] == 0
        component isFirst = IsZero();
        isFirst.in <== cumMatch[i];
        firstMatch[i] <== matchAt[i] * isFirst.out;
    }

    // Sum up the index
    var indexSum = 0;
    var foundSum = 0;
    for (var i = 0; i < maxLen; i++) {
        indexSum += i * firstMatch[i];
        foundSum += firstMatch[i];
    }

    index <-- indexSum;
    found <-- (cumMatch[maxLen] > 0) ? 1 : 0;
}

/**
 * Split JWT by '.' delimiter
 * Returns the three parts: header, payload, signature
 */
template SplitJWT(maxJWTLen) {
    var maxPartLen = maxJWTLen \ 3 + 1;

    signal input jwt[maxJWTLen];
    signal input jwtLen;

    signal output header[maxPartLen];
    signal output headerLen;
    signal output payload[maxPartLen];
    signal output payloadLen;
    signal output signature[maxPartLen];
    signal output signatureLen;

    // Find first dot
    component findDot1 = FindChar(maxJWTLen);
    for (var i = 0; i < maxJWTLen; i++) {
        findDot1.arr[i] <== jwt[i];
    }
    findDot1.target <== 46;  // '.'
    findDot1.len <== jwtLen;

    headerLen <== findDot1.index;

    // Find second dot (search from after first dot)
    // For simplicity, we'll mark positions after first dot
    component findDot2 = FindChar(maxJWTLen);
    for (var i = 0; i < maxJWTLen; i++) {
        // Only consider positions after first dot
        component afterFirst = GreaterThan(16);
        afterFirst.in[0] <== i;
        afterFirst.in[1] <== findDot1.index;

        findDot2.arr[i] <== jwt[i] * afterFirst.out + 255 * (1 - afterFirst.out);
    }
    findDot2.target <== 46;
    findDot2.len <== jwtLen;

    payloadLen <== findDot2.index - findDot1.index - 1;
    signatureLen <== jwtLen - findDot2.index - 1;

    // Extract parts
    for (var i = 0; i < maxPartLen; i++) {
        // Header: bytes 0 to headerLen-1
        component headerInRange = LessThan(16);
        headerInRange.in[0] <== i;
        headerInRange.in[1] <== headerLen;
        header[i] <-- headerInRange.out * jwt[i];

        // Payload: bytes (headerLen+1) to (headerLen+payloadLen)
        var payloadStart = findDot1.index + 1;
        component payloadInRange = LessThan(16);
        payloadInRange.in[0] <== i;
        payloadInRange.in[1] <== payloadLen;

        var payloadIdx = payloadStart + i;
        payload[i] <-- (payloadIdx < maxJWTLen) ? (payloadInRange.out * jwt[payloadIdx]) : 0;

        // Signature: bytes after second dot
        var sigStart = findDot2.index + 1;
        component sigInRange = LessThan(16);
        sigInRange.in[0] <== i;
        sigInRange.in[1] <== signatureLen;

        var sigIdx = sigStart + i;
        signature[i] <-- (sigIdx < maxJWTLen) ? (sigInRange.out * jwt[sigIdx]) : 0;
    }
}
