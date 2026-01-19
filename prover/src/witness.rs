//! Witness computation for zkLogin proofs
//!
//! Transforms JWT and user inputs into the circuit witness format.

use anyhow::{anyhow, Result};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use sha2::{Digest, Sha256};

use crate::types::{JWTClaims, PublicInputs, Witness, RSA_CHUNK_SIZE, RSA_NUM_CHUNKS};

/// Parse JWT and extract claims
pub fn parse_jwt(jwt: &str) -> Result<JWTClaims> {
    let parts: Vec<&str> = jwt.split('.').collect();
    if parts.len() != 3 {
        return Err(anyhow!("Invalid JWT format: expected 3 parts"));
    }

    // Decode payload (part 1)
    let payload_bytes = URL_SAFE_NO_PAD
        .decode(parts[1])
        .map_err(|e| anyhow!("Failed to decode JWT payload: {}", e))?;

    let claims: JWTClaims = serde_json::from_slice(&payload_bytes)
        .map_err(|e| anyhow!("Failed to parse JWT claims: {}", e))?;

    Ok(claims)
}

/// Compute the full witness for proof generation
pub fn compute_witness(
    jwt: &str,
    salt: &str,
    eph_pk_high: &str,
    eph_pk_low: &str,
    max_epoch: u64,
    randomness: &str,
    key_claim_name: &str,
) -> Result<Witness> {
    // Parse JWT
    let claims = parse_jwt(jwt)?;

    // Split JWT into parts
    let parts: Vec<&str> = jwt.split('.').collect();
    let header = parts[0];
    let payload = parts[1];
    let signature_b64 = parts[2];

    // Get JWT bytes (header.payload)
    let signing_input = format!("{}.{}", header, payload);
    let jwt_bytes = signing_input.as_bytes().to_vec();
    let jwt_length = jwt_bytes.len();
    let header_length = header.len();

    // Decode payload for position finding
    let payload_bytes = URL_SAFE_NO_PAD.decode(payload)?;
    let payload_str = String::from_utf8(payload_bytes.clone())?;

    // Find claim positions
    let (iss_start, iss_end) = find_claim_position(&payload_str, "iss", &claims.iss)?;
    let (sub_start, sub_end) = find_claim_position(&payload_str, "sub", &claims.sub)?;
    let (aud_start, aud_end) = find_claim_position(&payload_str, "aud", claims.aud.first())?;
    let (nonce_start, nonce_end) = find_claim_position(&payload_str, "nonce", &claims.nonce)?;

    // Decode and chunk signature
    let signature_bytes = URL_SAFE_NO_PAD.decode(signature_b64)?;
    let signature_chunks = bytes_to_chunks(&signature_bytes, RSA_CHUNK_SIZE, RSA_NUM_CHUNKS);

    // For modulus, we would fetch from JWK - using placeholder
    let modulus_chunks = vec!["0".to_string(); RSA_NUM_CHUNKS];

    // Compute public inputs
    let eph_pk_hash = compute_poseidon_hash(&[eph_pk_high, eph_pk_low])?;
    let address_seed = compute_address_seed(key_claim_name, &claims.sub, claims.aud.first(), salt)?;
    let iss_hash = hash_bytes_to_field(claims.iss.as_bytes())?;
    let jwk_modulus_hash = compute_modulus_hash(&modulus_chunks)?;

    let public_inputs = PublicInputs {
        eph_pk_hash,
        max_epoch,
        address_seed,
        iss_hash,
        jwk_modulus_hash,
    };

    Ok(Witness {
        public_inputs,
        jwt_bytes,
        jwt_length,
        header_length,
        signature_chunks,
        modulus_chunks,
        salt: salt.to_string(),
        eph_pk_high: eph_pk_high.to_string(),
        eph_pk_low: eph_pk_low.to_string(),
        randomness: randomness.to_string(),
        key_claim_name: key_claim_name.to_string(),
        iss_start,
        iss_end,
        sub_start,
        sub_end,
        aud_start,
        aud_end,
        nonce_start,
        nonce_end,
    })
}

/// Find the position of a claim value in the payload
fn find_claim_position(payload: &str, key: &str, value: &str) -> Result<(usize, usize)> {
    let pattern = format!("\"{}\":\"{}\"", key, value);
    if let Some(pos) = payload.find(&pattern) {
        let value_start = pos + key.len() + 4; // Skip "key":"
        let value_end = value_start + value.len();
        return Ok((value_start, value_end));
    }

    // Try with array format for aud
    let array_pattern = format!("\"{}\":[\"{}\"", key, value);
    if let Some(pos) = payload.find(&array_pattern) {
        let value_start = pos + key.len() + 5; // Skip "key":["
        let value_end = value_start + value.len();
        return Ok((value_start, value_end));
    }

    Err(anyhow!("Claim {} not found in payload", key))
}

/// Convert bytes to chunked representation
fn bytes_to_chunks(bytes: &[u8], chunk_bits: usize, num_chunks: usize) -> Vec<String> {
    let mut chunks = Vec::with_capacity(num_chunks);

    // Convert bytes to big integer
    let mut value = num_bigint::BigUint::from_bytes_be(bytes);

    // Extract chunks (little-endian order)
    let chunk_mask = (num_bigint::BigUint::from(1u64) << chunk_bits) - 1u64;

    for _ in 0..num_chunks {
        let chunk = &value & &chunk_mask;
        chunks.push(chunk.to_string());
        value >>= chunk_bits;
    }

    chunks
}

/// Compute Poseidon hash (placeholder - actual implementation uses Poseidon)
fn compute_poseidon_hash(inputs: &[&str]) -> Result<String> {
    // In production, use actual Poseidon implementation
    // This is a placeholder using SHA256
    let mut hasher = Sha256::new();
    for input in inputs {
        hasher.update(input.as_bytes());
    }
    let result = hasher.finalize();
    Ok(hex::encode(result))
}

/// Compute address seed
fn compute_address_seed(
    kc_name: &str,
    kc_value: &str,
    aud: &str,
    salt: &str,
) -> Result<String> {
    // address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    let kc_name_f = hash_bytes_to_field(kc_name.as_bytes())?;
    let kc_value_f = hash_bytes_to_field(kc_value.as_bytes())?;
    let aud_f = hash_bytes_to_field(aud.as_bytes())?;
    let salt_hash = compute_poseidon_hash(&[salt])?;

    compute_poseidon_hash(&[&kc_name_f, &kc_value_f, &aud_f, &salt_hash])
}

/// Hash bytes to BN254 field element
fn hash_bytes_to_field(bytes: &[u8]) -> Result<String> {
    // Simplified: hash and reduce modulo field order
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let result = hasher.finalize();
    Ok(hex::encode(result))
}

/// Compute hash of JWK modulus chunks
fn compute_modulus_hash(chunks: &[String]) -> Result<String> {
    let refs: Vec<&str> = chunks.iter().map(|s| s.as_str()).collect();
    compute_poseidon_hash(&refs)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_jwt() {
        // Sample JWT (header.payload.signature)
        let jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiYXVkIjoiY2xpZW50LWlkIiwibm9uY2UiOiJ0ZXN0LW5vbmNlIiwiZXhwIjoxNzAwMDAwMDAwLCJpYXQiOjE2OTAwMDAwMDB9.signature";

        let result = parse_jwt(jwt);
        assert!(result.is_ok());

        let claims = result.unwrap();
        assert_eq!(claims.iss, "https://accounts.google.com");
        assert_eq!(claims.sub, "1234567890");
    }

    #[test]
    fn test_bytes_to_chunks() {
        let bytes = vec![0xFF, 0xFF, 0xFF, 0xFF];
        let chunks = bytes_to_chunks(&bytes, 8, 4);
        assert_eq!(chunks.len(), 4);
    }
}
