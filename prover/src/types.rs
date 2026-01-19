//! Type definitions for ZK proof structures

use serde::{Deserialize, Serialize};

/// BN254 G1 point (affine coordinates)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct G1Point {
    pub x: String,
    pub y: String,
}

/// BN254 G2 point (affine coordinates in extension field)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct G2Point {
    pub x: (String, String),
    pub y: (String, String),
}

/// Groth16 proof structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Groth16Proof {
    pub a: G1Point,
    pub b: G2Point,
    pub c: G1Point,
}

/// zkLogin public inputs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicInputs {
    /// Poseidon(eph_pk_high, eph_pk_low)
    pub eph_pk_hash: String,
    /// Maximum valid epoch
    pub max_epoch: u64,
    /// Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
    pub address_seed: String,
    /// hashBytesToField(issuer)
    pub iss_hash: String,
    /// Poseidon(modulus_chunks[17])
    pub jwk_modulus_hash: String,
}

/// Witness data for proof generation
#[derive(Debug, Clone)]
pub struct Witness {
    // Public inputs
    pub public_inputs: PublicInputs,

    // Private inputs
    pub jwt_bytes: Vec<u8>,
    pub jwt_length: usize,
    pub header_length: usize,
    pub signature_chunks: Vec<String>,
    pub modulus_chunks: Vec<String>,
    pub salt: String,
    pub eph_pk_high: String,
    pub eph_pk_low: String,
    pub randomness: String,
    pub key_claim_name: String,

    // Claim positions
    pub iss_start: usize,
    pub iss_end: usize,
    pub sub_start: usize,
    pub sub_end: usize,
    pub aud_start: usize,
    pub aud_end: usize,
    pub nonce_start: usize,
    pub nonce_end: usize,
}

/// JWT claims structure
#[derive(Debug, Clone, Deserialize)]
pub struct JWTClaims {
    pub iss: String,
    pub sub: String,
    pub aud: StringOrVec,
    pub nonce: String,
    pub exp: u64,
    pub iat: u64,
}

/// Helper for aud which can be string or array
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum StringOrVec {
    String(String),
    Vec(Vec<String>),
}

impl StringOrVec {
    pub fn first(&self) -> &str {
        match self {
            StringOrVec::String(s) => s,
            StringOrVec::Vec(v) => v.first().map(|s| s.as_str()).unwrap_or_default(),
        }
    }
}

/// RSA-2048 configuration
pub const RSA_CHUNK_SIZE: usize = 121; // bits per chunk
pub const RSA_NUM_CHUNKS: usize = 17;  // number of chunks

/// Maximum JWT length
pub const MAX_JWT_LENGTH: usize = 2048;
