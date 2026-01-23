//! Witness computation for zkLogin proofs
//!
//! Transforms JWT and user inputs into the circuit witness format.
//!
//! ## Protocol 25 (X-Ray) Integration
//! - Uses Poseidon hashing compatible with Stellar's soroban-poseidon
//! - BN254 scalar field compatible
//! - Matches Circom circuit implementation

use anyhow::{anyhow, Result};
use ark_bn254::Fr;
use ark_ff::{BigInteger, PrimeField};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use light_poseidon::{Poseidon, PoseidonHasher, PoseidonBytesHasher, parameters::bn254_x5};
use sha2::{Digest, Sha256};

use crate::types::{JWTClaims, PublicInputs, Witness, RSA_CHUNK_SIZE, RSA_NUM_CHUNKS};

/// BN254 scalar field modulus
/// p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
const BN254_MODULUS: &str = "21888242871839275222246405745257275088548364400416034343698204186575808495617";

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
///
/// This function prepares all inputs for the zkLogin circuit, including:
/// - JWT parsing and position extraction
/// - Poseidon hash computation for public inputs
/// - Signature and modulus chunking for BN254 compatibility
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

    // Compute public inputs using Poseidon (Protocol 25 compatible)
    let eph_pk_hash = compute_eph_pk_hash(eph_pk_high, eph_pk_low)?;
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

/// Convert bytes to chunked representation for BN254 compatibility
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

/// Compute Poseidon hash of inputs (BN254 compatible)
///
/// Uses light-poseidon which matches Circom's Poseidon implementation
fn compute_poseidon_hash(inputs: &[Fr]) -> Result<Fr> {
    let mut poseidon = Poseidon::<Fr>::new_circom(inputs.len())
        .map_err(|e| anyhow!("Failed to create Poseidon hasher: {:?}", e))?;
    let hash = poseidon.hash(inputs)
        .map_err(|e| anyhow!("Failed to compute Poseidon hash: {:?}", e))?;
    Ok(hash)
}

/// Compute Poseidon hash for a fixed number of inputs
fn poseidon_hash_fixed<const N: usize>(inputs: &[Fr; N]) -> Result<Fr> {
    let mut poseidon = Poseidon::<Fr>::new_circom(N)
        .map_err(|e| anyhow!("Failed to create Poseidon hasher: {:?}", e))?;
    let hash = poseidon.hash(inputs)
        .map_err(|e| anyhow!("Failed to compute Poseidon hash: {:?}", e))?;
    Ok(hash)
}

/// Compute ephemeral public key hash using Poseidon
///
/// eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
fn compute_eph_pk_hash(eph_pk_high: &str, eph_pk_low: &str) -> Result<String> {
    let high = string_to_field(eph_pk_high)?;
    let low = string_to_field(eph_pk_low)?;

    let hash = poseidon_hash_fixed(&[high, low])?;
    Ok(field_to_hex(&hash))
}

/// Compute address seed from OAuth identity using Poseidon
///
/// Formula: address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
///
/// This matches the Soroban contract implementation for address derivation.
fn compute_address_seed(
    kc_name: &str,
    kc_value: &str,
    aud: &str,
    salt: &str,
) -> Result<String> {
    // Step 1: Poseidon(salt)
    let salt_fe = string_to_field(salt)?;
    let salt_hash = poseidon_hash_fixed(&[salt_fe])?;

    // Step 2: Convert claim components to field elements
    let kc_name_f = hash_string_to_field(kc_name)?;
    let kc_value_f = hash_string_to_field(kc_value)?;
    let aud_f = hash_string_to_field(aud)?;

    // Step 3: Poseidon(kc_name_F, kc_value_F, aud_F, salt_hash)
    let address_seed = poseidon_hash_fixed(&[kc_name_f, kc_value_f, aud_f, salt_hash])?;

    Ok(field_to_hex(&address_seed))
}

/// Hash bytes to BN254 field element
///
/// Uses SHA256 followed by modular reduction to BN254 Fr
fn hash_bytes_to_field(bytes: &[u8]) -> Result<String> {
    let fe = bytes_to_field_element(bytes)?;
    Ok(field_to_hex(&fe))
}

/// Hash string to field element
fn hash_string_to_field(s: &str) -> Result<Fr> {
    bytes_to_field_element(s.as_bytes())
}

/// Convert bytes to BN254 field element using sponge-like absorption
fn bytes_to_field_element(bytes: &[u8]) -> Result<Fr> {
    // For short inputs, pad and convert directly
    if bytes.len() <= 31 {
        let mut padded = [0u8; 32];
        padded[32 - bytes.len()..].copy_from_slice(bytes);
        return Ok(Fr::from_be_bytes_mod_order(&padded));
    }

    // For longer inputs, use Poseidon sponge mode
    let mut field_elements = Vec::new();
    for chunk in bytes.chunks(31) {
        let mut padded = [0u8; 32];
        padded[32 - chunk.len()..].copy_from_slice(chunk);
        field_elements.push(Fr::from_be_bytes_mod_order(&padded));
    }

    compute_poseidon_hash(&field_elements)
}

/// Compute hash of JWK modulus chunks using Poseidon tree
///
/// The modulus is split into 17 chunks of 121 bits each.
/// We hash them using a tree structure matching the contract implementation.
fn compute_modulus_hash(chunks: &[String]) -> Result<String> {
    let mut field_elements: Vec<Fr> = Vec::new();
    for chunk in chunks {
        let fe = string_to_field(chunk)?;
        field_elements.push(fe);
    }

    // Hash in a tree structure to handle 17 inputs
    // First layer: hash groups of 4 elements (4 groups of 4 + 1 remaining)
    let mut intermediate = Vec::new();

    // Groups of 4: indices 0-3, 4-7, 8-11, 12-15
    for i in 0..4 {
        let start = i * 4;
        let hash = poseidon_hash_fixed(&[
            field_elements[start],
            field_elements[start + 1],
            field_elements[start + 2],
            field_elements[start + 3],
        ])?;
        intermediate.push(hash);
    }

    // Last element (index 16)
    if field_elements.len() > 16 {
        let last_hash = poseidon_hash_fixed(&[field_elements[16]])?;
        intermediate.push(last_hash);
    }

    // Second layer: hash the 5 intermediate results
    let final_hash = poseidon_hash_fixed(&[
        intermediate[0],
        intermediate[1],
        intermediate[2],
        intermediate[3],
        intermediate.get(4).copied().unwrap_or(Fr::from(0u64)),
    ])?;

    Ok(field_to_hex(&final_hash))
}

/// Parse string as field element (supports decimal and hex)
fn string_to_field(s: &str) -> Result<Fr> {
    if s.starts_with("0x") || s.starts_with("0X") {
        // Hex format
        let hex_str = &s[2..];
        let bytes = hex::decode(hex_str)
            .map_err(|e| anyhow!("Invalid hex string: {}", e))?;
        let mut padded = [0u8; 32];
        let start = 32.saturating_sub(bytes.len());
        padded[start..].copy_from_slice(&bytes[..bytes.len().min(32)]);
        Ok(Fr::from_be_bytes_mod_order(&padded))
    } else {
        // Decimal format
        let bi = num_bigint::BigUint::parse_bytes(s.as_bytes(), 10)
            .ok_or_else(|| anyhow!("Invalid decimal string: {}", s))?;
        let bytes = bi.to_bytes_be();
        let mut padded = [0u8; 32];
        let start = 32.saturating_sub(bytes.len());
        padded[start..].copy_from_slice(&bytes[..bytes.len().min(32)]);
        Ok(Fr::from_be_bytes_mod_order(&padded))
    }
}

/// Convert field element to hex string
fn field_to_hex(fe: &Fr) -> String {
    let bytes = fe.into_bigint().to_bytes_be();
    format!("0x{}", hex::encode(bytes))
}

/// Compute nonce for session binding using Poseidon
///
/// nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
pub fn compute_nonce(
    eph_pk_high: &str,
    eph_pk_low: &str,
    max_epoch: u64,
    randomness: &str,
) -> Result<String> {
    let high = string_to_field(eph_pk_high)?;
    let low = string_to_field(eph_pk_low)?;
    let epoch = Fr::from(max_epoch);
    let rand = string_to_field(randomness)?;

    let hash = poseidon_hash_fixed(&[high, low, epoch, rand])?;
    Ok(field_to_hex(&hash))
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

    #[test]
    fn test_poseidon_hash() {
        let input1 = Fr::from(1u64);
        let input2 = Fr::from(2u64);

        let hash = poseidon_hash_fixed(&[input1, input2]).unwrap();

        // Hash should be deterministic
        let hash2 = poseidon_hash_fixed(&[input1, input2]).unwrap();
        assert_eq!(hash, hash2);
    }

    #[test]
    fn test_compute_eph_pk_hash() {
        let high = "12345";
        let low = "67890";

        let result = compute_eph_pk_hash(high, low);
        assert!(result.is_ok());

        // Should be deterministic
        let result2 = compute_eph_pk_hash(high, low);
        assert_eq!(result.unwrap(), result2.unwrap());
    }

    #[test]
    fn test_compute_address_seed() {
        let result = compute_address_seed("sub", "user123", "client-id", "12345");
        assert!(result.is_ok());

        // Should be deterministic
        let result2 = compute_address_seed("sub", "user123", "client-id", "12345");
        assert_eq!(result.unwrap(), result2.unwrap());
    }

    #[test]
    fn test_compute_nonce() {
        let result = compute_nonce("123", "456", 1000, "789");
        assert!(result.is_ok());

        // Should be deterministic
        let result2 = compute_nonce("123", "456", 1000, "789");
        assert_eq!(result.unwrap(), result2.unwrap());
    }

    #[test]
    fn test_string_to_field() {
        // Decimal
        let decimal = string_to_field("12345").unwrap();
        assert_eq!(decimal, Fr::from(12345u64));

        // Hex
        let hex = string_to_field("0x3039").unwrap();
        assert_eq!(hex, Fr::from(12345u64));
    }
}
