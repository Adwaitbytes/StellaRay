//! zkLogin Prover Service
//!
//! HTTP service that generates Groth16 proofs for zkLogin authentication.
//! Takes JWT and user inputs, computes witness, and generates proof.

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, error};

mod witness;
mod prove;
mod types;

use types::{Groth16Proof, PublicInputs};

/// Application state
#[derive(Clone)]
struct AppState {
    /// Proving key (loaded at startup)
    proving_key: Arc<Vec<u8>>,
    /// Verification key (for local verification)
    verification_key: Arc<Vec<u8>>,
}

/// Proof request from client
#[derive(Debug, Deserialize)]
struct ProofRequest {
    jwt: String,
    salt: String,
    eph_pk_high: String,
    eph_pk_low: String,
    max_epoch: u64,
    randomness: String,
    key_claim_name: String,
}

/// Proof response to client
#[derive(Debug, Serialize)]
struct ProofResponse {
    proof: ProverProof,
    public_signals: Vec<String>,
}

/// Proof in snarkjs format
#[derive(Debug, Serialize)]
struct ProverProof {
    pi_a: Vec<String>,
    pi_b: Vec<Vec<String>>,
    pi_c: Vec<String>,
    protocol: String,
    curve: String,
}

/// Verification request
#[derive(Debug, Deserialize)]
struct VerifyRequest {
    proof: ProverProof,
    public_inputs: Vec<String>,
}

/// Verification response
#[derive(Debug, Serialize)]
struct VerifyResponse {
    valid: bool,
}

/// Health check response
#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    info!("Starting zkLogin Prover Service");

    // Load proving and verification keys
    let proving_key = load_proving_key().await?;
    let verification_key = load_verification_key().await?;

    let state = AppState {
        proving_key: Arc::new(proving_key),
        verification_key: Arc::new(verification_key),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/prove", post(generate_proof))
        .route("/verify", post(verify_proof))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    // Start server
    let addr = std::env::var("PROVER_HOST").unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("Prover service listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

/// Health check endpoint
async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

/// Generate ZK proof
async fn generate_proof(
    State(state): State<AppState>,
    Json(request): Json<ProofRequest>,
) -> Result<Json<ProofResponse>, (StatusCode, String)> {
    info!("Generating proof for max_epoch: {}", request.max_epoch);

    // Step 1: Parse JWT and extract claims
    let jwt_claims = witness::parse_jwt(&request.jwt)
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid JWT: {}", e)))?;

    // Step 2: Compute witness
    let witness = witness::compute_witness(
        &request.jwt,
        &request.salt,
        &request.eph_pk_high,
        &request.eph_pk_low,
        request.max_epoch,
        &request.randomness,
        &request.key_claim_name,
    )
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Witness error: {}", e)))?;

    // Step 3: Generate Groth16 proof
    let (proof, public_inputs) = prove::generate_groth16_proof(
        &witness,
        &state.proving_key,
    )
    .map_err(|e| {
        error!("Proof generation failed: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, format!("Proof generation failed: {}", e))
    })?;

    // Step 4: Format response
    let response = ProofResponse {
        proof: ProverProof {
            pi_a: vec![
                proof.a.x.clone(),
                proof.a.y.clone(),
                "1".to_string(),
            ],
            pi_b: vec![
                vec![proof.b.x.0.clone(), proof.b.x.1.clone()],
                vec![proof.b.y.0.clone(), proof.b.y.1.clone()],
                vec!["1".to_string(), "0".to_string()],
            ],
            pi_c: vec![
                proof.c.x.clone(),
                proof.c.y.clone(),
                "1".to_string(),
            ],
            protocol: "groth16".to_string(),
            curve: "bn254".to_string(),
        },
        public_signals: vec![
            public_inputs.eph_pk_hash.clone(),
            public_inputs.max_epoch.to_string(),
            public_inputs.address_seed.clone(),
            public_inputs.iss_hash.clone(),
            public_inputs.jwk_modulus_hash.clone(),
        ],
    };

    info!("Proof generated successfully");
    Ok(Json(response))
}

/// Verify a proof
async fn verify_proof(
    State(state): State<AppState>,
    Json(request): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, (StatusCode, String)> {
    info!("Verifying proof");

    // Convert proof format
    let proof = Groth16Proof {
        a: types::G1Point {
            x: request.proof.pi_a[0].clone(),
            y: request.proof.pi_a[1].clone(),
        },
        b: types::G2Point {
            x: (request.proof.pi_b[0][0].clone(), request.proof.pi_b[0][1].clone()),
            y: (request.proof.pi_b[1][0].clone(), request.proof.pi_b[1][1].clone()),
        },
        c: types::G1Point {
            x: request.proof.pi_c[0].clone(),
            y: request.proof.pi_c[1].clone(),
        },
    };

    // Verify
    let valid = prove::verify_groth16_proof(
        &proof,
        &request.public_inputs,
        &state.verification_key,
    )
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Verification error: {}", e)))?;

    Ok(Json(VerifyResponse { valid }))
}

/// Load proving key from file or generate placeholder
async fn load_proving_key() -> anyhow::Result<Vec<u8>> {
    let path = std::env::var("PROVING_KEY_PATH")
        .unwrap_or_else(|_| "keys/zklogin.zkey".to_string());

    match tokio::fs::read(&path).await {
        Ok(data) => {
            info!("Loaded proving key from {}", path);
            Ok(data)
        }
        Err(_) => {
            info!("Proving key not found, using placeholder");
            // In production, this should fail or generate keys
            Ok(vec![0u8; 32])
        }
    }
}

/// Load verification key from file or generate placeholder
async fn load_verification_key() -> anyhow::Result<Vec<u8>> {
    let path = std::env::var("VERIFICATION_KEY_PATH")
        .unwrap_or_else(|_| "keys/zklogin.vkey".to_string());

    match tokio::fs::read(&path).await {
        Ok(data) => {
            info!("Loaded verification key from {}", path);
            Ok(data)
        }
        Err(_) => {
            info!("Verification key not found, using placeholder");
            Ok(vec![0u8; 32])
        }
    }
}
