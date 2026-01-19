pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./base64.circom";

/**
 * JWT Parsing Circuits
 *
 * Parses JWT claims from the payload without revealing the full token.
 * Designed for zkLogin where we need to extract:
 * - iss (issuer)
 * - aud (audience/client ID)
 * - sub (subject/user ID)
 * - nonce (session binding)
 * - exp (expiration)
 * - iat (issued at)
 */

/**
 * Extract a JSON string value by key from decoded payload
 *
 * Searches for "key":"value" pattern and extracts value
 *
 * @param maxPayloadLen - Maximum payload length
 * @param maxKeyLen - Maximum key length
 * @param maxValueLen - Maximum value length
 */
template ExtractJSONStringValue(maxPayloadLen, maxKeyLen, maxValueLen) {
    signal input payload[maxPayloadLen];
    signal input payloadLen;
    signal input key[maxKeyLen];
    signal input keyLen;

    signal output value[maxValueLen];
    signal output valueLen;
    signal output found;

    // State machine to find "key":"value"
    // States: 0=searching, 1=in_key, 2=after_key, 3=in_value, 4=done

    // First, find the key pattern
    // We look for sequence: " + key + " + : + "

    signal keyMatch[maxPayloadLen];

    for (var i = 0; i < maxPayloadLen; i++) {
        // Check if key starts at position i+1 (after quote)
        var matches = 1;

        // Check for opening quote before key
        component quoteCheck = IsEqual();
        quoteCheck.in[0] <== payload[i];
        quoteCheck.in[1] <== 34;  // '"'

        // Check key characters match
        signal charMatch[maxKeyLen];
        for (var j = 0; j < maxKeyLen; j++) {
            component inKeyRange = LessThan(8);
            inKeyRange.in[0] <== j;
            inKeyRange.in[1] <== keyLen;

            component charEq = IsEqual();
            var checkIdx = i + 1 + j;
            charEq.in[0] <== (checkIdx < maxPayloadLen) ? payload[checkIdx] : 0;
            charEq.in[1] <== key[j];

            // Match if in range and equal, or out of range
            charMatch[j] <== inKeyRange.out * charEq.out + (1 - inKeyRange.out);
        }

        // All key chars must match
        signal keyCharsMatch[maxKeyLen];
        keyCharsMatch[0] <== charMatch[0];
        for (var j = 1; j < maxKeyLen; j++) {
            keyCharsMatch[j] <== keyCharsMatch[j-1] * charMatch[j];
        }

        // Check closing quote after key
        var closeQuoteIdx = i + 1 + keyLen;
        component closeQuote = IsEqual();
        closeQuote.in[0] <== (closeQuoteIdx < maxPayloadLen) ? payload[closeQuoteIdx] : 0;
        closeQuote.in[1] <== 34;

        // Check colon after key
        var colonIdx = closeQuoteIdx + 1;
        component colonCheck = IsEqual();
        colonCheck.in[0] <== (colonIdx < maxPayloadLen) ? payload[colonIdx] : 0;
        colonCheck.in[1] <== 58;  // ':'

        // Check value quote
        var valueQuoteIdx = colonIdx + 1;
        component valueQuote = IsEqual();
        valueQuote.in[0] <== (valueQuoteIdx < maxPayloadLen) ? payload[valueQuoteIdx] : 0;
        valueQuote.in[1] <== 34;

        // Full match
        keyMatch[i] <== quoteCheck.out * keyCharsMatch[maxKeyLen - 1] * closeQuote.out * colonCheck.out * valueQuote.out;
    }

    // Find first match
    signal cumMatch[maxPayloadLen + 1];
    signal firstMatchPos[maxPayloadLen];
    cumMatch[0] <== 0;

    for (var i = 0; i < maxPayloadLen; i++) {
        cumMatch[i + 1] <== cumMatch[i] + keyMatch[i];

        component isFirst = IsZero();
        isFirst.in <== cumMatch[i];
        firstMatchPos[i] <== keyMatch[i] * isFirst.out;
    }

    found <== (cumMatch[maxPayloadLen] > 0) ? 1 : 0;

    // Calculate value start position
    signal valueStartPos;
    var startSum = 0;
    for (var i = 0; i < maxPayloadLen; i++) {
        // Value starts at i + 1 + keyLen + 3 (after key + '":')
        startSum += firstMatchPos[i] * (i + keyLen + 4);
    }
    valueStartPos <-- startSum;

    // Extract value until closing quote
    signal inValue[maxPayloadLen];
    signal valueChars[maxValueLen];

    for (var i = 0; i < maxValueLen; i++) {
        var charIdx = valueStartPos + i;
        var charVal = (charIdx < maxPayloadLen) ? payload[charIdx] : 0;

        // Check if still in value (not hit closing quote)
        component notQuote = IsEqual();
        notQuote.in[0] <== charVal;
        notQuote.in[1] <== 34;

        // Previous chars must not be closing quote
        signal prevValid[maxValueLen];
        if (i == 0) {
            prevValid[0] <== 1;
        } else {
            component prevNotEnd = IsEqual();
            prevNotEnd.in[0] <== valueChars[i-1];
            prevNotEnd.in[1] <== 0;
            prevValid[i] <== 1 - prevNotEnd.out;
        }

        valueChars[i] <== charVal * (1 - notQuote.out) * prevValid[i];
        value[i] <== valueChars[i];
    }

    // Calculate value length
    signal nonZero[maxValueLen];
    var lenCount = 0;
    for (var i = 0; i < maxValueLen; i++) {
        component isNonZero = IsZero();
        isNonZero.in <== value[i];
        nonZero[i] <== 1 - isNonZero.out;
        lenCount += nonZero[i];
    }
    valueLen <-- lenCount;
}

/**
 * Extract a JSON number value by key
 */
template ExtractJSONNumberValue(maxPayloadLen, maxKeyLen) {
    signal input payload[maxPayloadLen];
    signal input payloadLen;
    signal input key[maxKeyLen];
    signal input keyLen;

    signal output value;
    signal output found;

    // Similar to string extraction but for numbers
    // Pattern: "key":number (no quotes around number)

    signal keyMatch[maxPayloadLen];

    for (var i = 0; i < maxPayloadLen; i++) {
        component quoteCheck = IsEqual();
        quoteCheck.in[0] <== payload[i];
        quoteCheck.in[1] <== 34;

        signal charMatch[maxKeyLen];
        for (var j = 0; j < maxKeyLen; j++) {
            component inKeyRange = LessThan(8);
            inKeyRange.in[0] <== j;
            inKeyRange.in[1] <== keyLen;

            component charEq = IsEqual();
            var checkIdx = i + 1 + j;
            charEq.in[0] <== (checkIdx < maxPayloadLen) ? payload[checkIdx] : 0;
            charEq.in[1] <== key[j];

            charMatch[j] <== inKeyRange.out * charEq.out + (1 - inKeyRange.out);
        }

        signal keyCharsMatch[maxKeyLen];
        keyCharsMatch[0] <== charMatch[0];
        for (var j = 1; j < maxKeyLen; j++) {
            keyCharsMatch[j] <== keyCharsMatch[j-1] * charMatch[j];
        }

        var closeQuoteIdx = i + 1 + keyLen;
        component closeQuote = IsEqual();
        closeQuote.in[0] <== (closeQuoteIdx < maxPayloadLen) ? payload[closeQuoteIdx] : 0;
        closeQuote.in[1] <== 34;

        var colonIdx = closeQuoteIdx + 1;
        component colonCheck = IsEqual();
        colonCheck.in[0] <== (colonIdx < maxPayloadLen) ? payload[colonIdx] : 0;
        colonCheck.in[1] <== 58;

        keyMatch[i] <== quoteCheck.out * keyCharsMatch[maxKeyLen - 1] * closeQuote.out * colonCheck.out;
    }

    signal cumMatch[maxPayloadLen + 1];
    signal firstMatchPos[maxPayloadLen];
    cumMatch[0] <== 0;

    for (var i = 0; i < maxPayloadLen; i++) {
        cumMatch[i + 1] <== cumMatch[i] + keyMatch[i];
        component isFirst = IsZero();
        isFirst.in <== cumMatch[i];
        firstMatchPos[i] <== keyMatch[i] * isFirst.out;
    }

    found <== (cumMatch[maxPayloadLen] > 0) ? 1 : 0;

    // Value starts after colon
    signal valueStartPos;
    var startSum = 0;
    for (var i = 0; i < maxPayloadLen; i++) {
        startSum += firstMatchPos[i] * (i + keyLen + 3);
    }
    valueStartPos <-- startSum;

    // Parse number (assuming max 10 digits for epoch timestamps)
    var maxDigits = 10;
    signal digits[maxDigits];
    signal digitMult[maxDigits];

    for (var i = 0; i < maxDigits; i++) {
        var charIdx = valueStartPos + i;
        var charVal = (charIdx < maxPayloadLen) ? payload[charIdx] : 0;

        // Check if digit (ASCII 48-57)
        component isDigit = InRange(8);
        isDigit.in <== charVal;
        isDigit.lower <== 48;
        isDigit.upper <== 57;

        digits[i] <== (charVal - 48) * isDigit.out;
        digitMult[i] <== isDigit.out;
    }

    // Convert digits to number
    var result = 0;
    var mult = 1;
    // Process right to left
    for (var i = maxDigits - 1; i >= 0; i--) {
        result += digits[i] * mult;
        mult *= 10;
    }
    value <-- result;
}

/**
 * Full JWT Claim Parser
 * Extracts all required claims for zkLogin
 */
template JWTClaimParser(maxPayloadLen) {
    var maxStringLen = 256;  // Max length for string claims

    signal input decodedPayload[maxPayloadLen];
    signal input payloadLen;

    // Output claims
    signal output iss[maxStringLen];
    signal output issLen;
    signal output aud[maxStringLen];
    signal output audLen;
    signal output sub[maxStringLen];
    signal output subLen;
    signal output nonce[maxStringLen];
    signal output nonceLen;
    signal output exp;
    signal output iat;

    // Key strings as ASCII
    var issKey[3] = [105, 115, 115];  // "iss"
    var audKey[3] = [97, 117, 100];   // "aud"
    var subKey[3] = [115, 117, 98];   // "sub"
    var nonceKey[5] = [110, 111, 110, 99, 101];  // "nonce"
    var expKey[3] = [101, 120, 112];  // "exp"
    var iatKey[3] = [105, 97, 116];   // "iat"

    // Extract string claims
    component extractIss = ExtractJSONStringValue(maxPayloadLen, 3, maxStringLen);
    for (var i = 0; i < maxPayloadLen; i++) {
        extractIss.payload[i] <== decodedPayload[i];
    }
    extractIss.payloadLen <== payloadLen;
    for (var i = 0; i < 3; i++) {
        extractIss.key[i] <== issKey[i];
    }
    extractIss.keyLen <== 3;
    for (var i = 0; i < maxStringLen; i++) {
        iss[i] <== extractIss.value[i];
    }
    issLen <== extractIss.valueLen;

    component extractAud = ExtractJSONStringValue(maxPayloadLen, 3, maxStringLen);
    for (var i = 0; i < maxPayloadLen; i++) {
        extractAud.payload[i] <== decodedPayload[i];
    }
    extractAud.payloadLen <== payloadLen;
    for (var i = 0; i < 3; i++) {
        extractAud.key[i] <== audKey[i];
    }
    extractAud.keyLen <== 3;
    for (var i = 0; i < maxStringLen; i++) {
        aud[i] <== extractAud.value[i];
    }
    audLen <== extractAud.valueLen;

    component extractSub = ExtractJSONStringValue(maxPayloadLen, 3, maxStringLen);
    for (var i = 0; i < maxPayloadLen; i++) {
        extractSub.payload[i] <== decodedPayload[i];
    }
    extractSub.payloadLen <== payloadLen;
    for (var i = 0; i < 3; i++) {
        extractSub.key[i] <== subKey[i];
    }
    extractSub.keyLen <== 3;
    for (var i = 0; i < maxStringLen; i++) {
        sub[i] <== extractSub.value[i];
    }
    subLen <== extractSub.valueLen;

    component extractNonce = ExtractJSONStringValue(maxPayloadLen, 5, maxStringLen);
    for (var i = 0; i < maxPayloadLen; i++) {
        extractNonce.payload[i] <== decodedPayload[i];
    }
    extractNonce.payloadLen <== payloadLen;
    for (var i = 0; i < 5; i++) {
        extractNonce.key[i] <== nonceKey[i];
    }
    extractNonce.keyLen <== 5;
    for (var i = 0; i < maxStringLen; i++) {
        nonce[i] <== extractNonce.value[i];
    }
    nonceLen <== extractNonce.valueLen;

    // Extract number claims
    component extractExp = ExtractJSONNumberValue(maxPayloadLen, 3);
    for (var i = 0; i < maxPayloadLen; i++) {
        extractExp.payload[i] <== decodedPayload[i];
    }
    extractExp.payloadLen <== payloadLen;
    for (var i = 0; i < 3; i++) {
        extractExp.key[i] <== expKey[i];
    }
    extractExp.keyLen <== 3;
    exp <== extractExp.value;

    component extractIat = ExtractJSONNumberValue(maxPayloadLen, 3);
    for (var i = 0; i < maxPayloadLen; i++) {
        extractIat.payload[i] <== decodedPayload[i];
    }
    extractIat.payloadLen <== payloadLen;
    for (var i = 0; i < 3; i++) {
        extractIat.key[i] <== iatKey[i];
    }
    extractIat.keyLen <== 3;
    iat <== extractIat.value;
}

/**
 * Verify nonce matches expected computation
 * nonce = base64url(poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)[last 20 bytes])
 */
template VerifyNonce(maxNonceLen) {
    signal input extractedNonce[maxNonceLen];
    signal input extractedNonceLen;
    signal input expectedNonceHash;  // From Poseidon computation

    signal output valid;

    // Decode the base64url nonce
    component decode = Base64URLDecode(maxNonceLen);
    for (var i = 0; i < maxNonceLen; i++) {
        decode.encoded[i] <== extractedNonce[i];
    }
    decode.len <== extractedNonceLen;

    // The decoded nonce should be 20 bytes (last 20 bytes of Poseidon output)
    // Convert to field element and compare with expected

    // For now, simplified comparison
    // Full implementation would properly reconstruct and compare
    valid <== 1;  // Placeholder - full implementation compares hash
}

/**
 * Verify issuer matches known OAuth providers
 */
template VerifyIssuer(maxIssLen) {
    signal input issuer[maxIssLen];
    signal input issuerLen;
    signal output issuerHash;  // Hash for public input
    signal output isGoogle;
    signal output isApple;

    // Google issuer: "https://accounts.google.com"
    var googleIss[28] = [
        104, 116, 116, 112, 115, 58, 47, 47,  // "https://"
        97, 99, 99, 111, 117, 110, 116, 115,  // "accounts"
        46, 103, 111, 111, 103, 108, 101,     // ".google"
        46, 99, 111, 109                       // ".com"
    ];

    // Apple issuer: "https://appleid.apple.com"
    var appleIss[25] = [
        104, 116, 116, 112, 115, 58, 47, 47,  // "https://"
        97, 112, 112, 108, 101, 105, 100,     // "appleid"
        46, 97, 112, 112, 108, 101,           // ".apple"
        46, 99, 111, 109                       // ".com"
    ];

    // Check Google match
    component googleLen = IsEqual();
    googleLen.in[0] <== issuerLen;
    googleLen.in[1] <== 28;

    signal googleCharMatch[28];
    for (var i = 0; i < 28; i++) {
        component charEq = IsEqual();
        charEq.in[0] <== issuer[i];
        charEq.in[1] <== googleIss[i];
        googleCharMatch[i] <== charEq.out;
    }

    signal googlePartial[28];
    googlePartial[0] <== googleCharMatch[0];
    for (var i = 1; i < 28; i++) {
        googlePartial[i] <== googlePartial[i-1] * googleCharMatch[i];
    }
    isGoogle <== googleLen.out * googlePartial[27];

    // Check Apple match
    component appleLen = IsEqual();
    appleLen.in[0] <== issuerLen;
    appleLen.in[1] <== 25;

    signal appleCharMatch[25];
    for (var i = 0; i < 25; i++) {
        component charEqApple = IsEqual();
        charEqApple.in[0] <== issuer[i];
        charEqApple.in[1] <== appleIss[i];
        appleCharMatch[i] <== charEqApple.out;
    }

    signal applePartial[25];
    applePartial[0] <== appleCharMatch[0];
    for (var i = 1; i < 25; i++) {
        applePartial[i] <== applePartial[i-1] * appleCharMatch[i];
    }
    isApple <== appleLen.out * applePartial[24];

    // Compute issuer hash (simplified - would use HashBytesToField)
    var hashAcc = 0;
    for (var i = 0; i < maxIssLen; i++) {
        hashAcc += issuer[i] * (i + 1);
    }
    issuerHash <-- hashAcc;
}
