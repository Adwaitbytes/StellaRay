//! JWT parsing and verification utilities

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use serde::{Deserialize, Serialize};

/// JWT header
#[derive(Debug, Deserialize)]
pub struct JWTHeader {
    pub alg: String,
    pub typ: Option<String>,
    pub kid: String,
}

/// JWT claims relevant for zkLogin
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct JWTClaims {
    pub iss: String,
    pub sub: String,
    pub aud: StringOrVec,
    pub nonce: Option<String>,
    pub exp: u64,
    pub iat: u64,
}

/// Helper for aud which can be string or array
#[derive(Debug, Clone, Deserialize, Serialize)]
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

/// JWK (JSON Web Key)
#[derive(Debug, Clone, Deserialize)]
pub struct JWK {
    pub kty: String,
    pub n: Option<String>,
    pub e: Option<String>,
    pub kid: String,
    #[serde(rename = "use")]
    pub use_: Option<String>,
    pub alg: Option<String>,
}

/// JWKS (JSON Web Key Set)
#[derive(Debug, Clone, Deserialize)]
pub struct JWKSet {
    pub keys: Vec<JWK>,
}

/// Parse JWT header without verification
pub fn parse_jwt_header(jwt: &str) -> anyhow::Result<JWTHeader> {
    let parts: Vec<&str> = jwt.split('.').collect();
    if parts.len() != 3 {
        anyhow::bail!("Invalid JWT format");
    }

    let header_bytes = URL_SAFE_NO_PAD.decode(parts[0])?;
    let header: JWTHeader = serde_json::from_slice(&header_bytes)?;

    Ok(header)
}

/// Parse JWT claims without verification
pub fn parse_jwt_claims(jwt: &str) -> anyhow::Result<JWTClaims> {
    let parts: Vec<&str> = jwt.split('.').collect();
    if parts.len() != 3 {
        anyhow::bail!("Invalid JWT format");
    }

    let payload_bytes = URL_SAFE_NO_PAD.decode(parts[1])?;
    let claims: JWTClaims = serde_json::from_slice(&payload_bytes)?;

    Ok(claims)
}

/// Get the key ID from a JWT
pub fn get_jwt_kid(jwt: &str) -> anyhow::Result<String> {
    let header = parse_jwt_header(jwt)?;
    Ok(header.kid)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_jwt_header() {
        // eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2lkIn0
        // = {"alg":"RS256","typ":"JWT","kid":"test-kid"}
        let jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2lkIn0.eyJpc3MiOiJ0ZXN0In0.sig";

        let header = parse_jwt_header(jwt).unwrap();
        assert_eq!(header.alg, "RS256");
        assert_eq!(header.kid, "test-kid");
    }
}
