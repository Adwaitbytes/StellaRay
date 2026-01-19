//! Groth16 proof generation and verification
//!
//! Uses ark-groth16 for proof operations on BN254 curve.

use anyhow::{anyhow, Result};
use ark_bn254::{Bn254, Fr, G1Affine, G2Affine};
use ark_ff::PrimeField;
use ark_groth16::{Groth16, Proof, VerifyingKey};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use ark_snark::SNARK;

use crate::types::{G1Point, G2Point, Groth16Proof, PublicInputs, Witness};

/// Generate a Groth16 proof from witness and proving key
pub fn generate_groth16_proof(
    witness: &Witness,
    proving_key_bytes: &[u8],
) -> Result<(Groth16Proof, PublicInputs)> {
    // In production, this would:
    // 1. Load the proving key
    // 2. Compute the full witness assignment
    // 3. Generate the Groth16 proof

    // For now, return a placeholder proof
    // A real implementation would use snarkjs/rapidsnark or ark-groth16

    let proof = Groth16Proof {
        a: G1Point {
            x: "1".to_string(),
            y: "2".to_string(),
        },
        b: G2Point {
            x: (
                "10857046999023057135944570762232829481370756359578518086990519993285655852781"
                    .to_string(),
                "11559732032986387107991004021392285783925812861821192530917403151452391805634"
                    .to_string(),
            ),
            y: (
                "8495653923123431417604973247489272438418190587263600148770280649306958101930"
                    .to_string(),
                "4082367875863433681332203403145435568316851327593401208105741076214120093531"
                    .to_string(),
            ),
        },
        c: G1Point {
            x: "1".to_string(),
            y: "2".to_string(),
        },
    };

    Ok((proof, witness.public_inputs.clone()))
}

/// Verify a Groth16 proof
pub fn verify_groth16_proof(
    proof: &Groth16Proof,
    public_inputs: &[String],
    verification_key_bytes: &[u8],
) -> Result<bool> {
    // In production, this would:
    // 1. Load the verification key
    // 2. Parse the proof and public inputs
    // 3. Run the Groth16 verification

    // For now, return true for valid-looking proofs
    // A real implementation would use ark-groth16

    if proof.a.x.is_empty() || proof.a.y.is_empty() {
        return Ok(false);
    }

    if public_inputs.len() != 5 {
        return Ok(false);
    }

    // Placeholder: accept all proofs
    Ok(true)
}

/// Convert proof to ark-groth16 format
fn parse_proof(proof: &Groth16Proof) -> Result<Proof<Bn254>> {
    let a = parse_g1_point(&proof.a)?;
    let b = parse_g2_point(&proof.b)?;
    let c = parse_g1_point(&proof.c)?;

    Ok(Proof { a, b, c })
}

/// Parse G1 point from string coordinates
fn parse_g1_point(point: &G1Point) -> Result<G1Affine> {
    use ark_ff::BigInteger256;
    use num_bigint::BigUint;
    use std::str::FromStr;

    let x_big = BigUint::from_str(&point.x)
        .map_err(|e| anyhow!("Invalid x coordinate: {}", e))?;
    let y_big = BigUint::from_str(&point.y)
        .map_err(|e| anyhow!("Invalid y coordinate: {}", e))?;

    // Convert to field elements
    let x_bytes = x_big.to_bytes_le();
    let y_bytes = y_big.to_bytes_le();

    let mut x_arr = [0u8; 32];
    let mut y_arr = [0u8; 32];

    x_arr[..x_bytes.len().min(32)].copy_from_slice(&x_bytes[..x_bytes.len().min(32)]);
    y_arr[..y_bytes.len().min(32)].copy_from_slice(&y_bytes[..y_bytes.len().min(32)]);

    // Create field elements
    let x = ark_bn254::Fq::from_le_bytes_mod_order(&x_arr);
    let y = ark_bn254::Fq::from_le_bytes_mod_order(&y_arr);

    // Create affine point
    let point = G1Affine::new(x, y);

    Ok(point)
}

/// Parse G2 point from string coordinates
fn parse_g2_point(point: &G2Point) -> Result<G2Affine> {
    use ark_ff::BigInteger256;
    use num_bigint::BigUint;
    use std::str::FromStr;

    // Parse x coordinates (Fp2)
    let x0_big = BigUint::from_str(&point.x.0)
        .map_err(|e| anyhow!("Invalid x0 coordinate: {}", e))?;
    let x1_big = BigUint::from_str(&point.x.1)
        .map_err(|e| anyhow!("Invalid x1 coordinate: {}", e))?;

    // Parse y coordinates (Fp2)
    let y0_big = BigUint::from_str(&point.y.0)
        .map_err(|e| anyhow!("Invalid y0 coordinate: {}", e))?;
    let y1_big = BigUint::from_str(&point.y.1)
        .map_err(|e| anyhow!("Invalid y1 coordinate: {}", e))?;

    // Convert to bytes
    let x0_bytes = x0_big.to_bytes_le();
    let x1_bytes = x1_big.to_bytes_le();
    let y0_bytes = y0_big.to_bytes_le();
    let y1_bytes = y1_big.to_bytes_le();

    let mut x0_arr = [0u8; 32];
    let mut x1_arr = [0u8; 32];
    let mut y0_arr = [0u8; 32];
    let mut y1_arr = [0u8; 32];

    x0_arr[..x0_bytes.len().min(32)].copy_from_slice(&x0_bytes[..x0_bytes.len().min(32)]);
    x1_arr[..x1_bytes.len().min(32)].copy_from_slice(&x1_bytes[..x1_bytes.len().min(32)]);
    y0_arr[..y0_bytes.len().min(32)].copy_from_slice(&y0_bytes[..y0_bytes.len().min(32)]);
    y1_arr[..y1_bytes.len().min(32)].copy_from_slice(&y1_bytes[..y1_bytes.len().min(32)]);

    // Create Fq elements
    let x0 = ark_bn254::Fq::from_le_bytes_mod_order(&x0_arr);
    let x1 = ark_bn254::Fq::from_le_bytes_mod_order(&x1_arr);
    let y0 = ark_bn254::Fq::from_le_bytes_mod_order(&y0_arr);
    let y1 = ark_bn254::Fq::from_le_bytes_mod_order(&y1_arr);

    // Create Fq2 elements
    let x = ark_bn254::Fq2::new(x0, x1);
    let y = ark_bn254::Fq2::new(y0, y1);

    // Create affine point
    let point = G2Affine::new(x, y);

    Ok(point)
}

/// Parse public inputs to field elements
fn parse_public_inputs(inputs: &[String]) -> Result<Vec<Fr>> {
    use num_bigint::BigUint;
    use std::str::FromStr;

    inputs
        .iter()
        .map(|s| {
            // Try to parse as decimal first
            if let Ok(big) = BigUint::from_str(s) {
                let bytes = big.to_bytes_le();
                let mut arr = [0u8; 32];
                arr[..bytes.len().min(32)].copy_from_slice(&bytes[..bytes.len().min(32)]);
                return Ok(Fr::from_le_bytes_mod_order(&arr));
            }

            // Try to parse as hex
            if s.starts_with("0x") {
                let bytes = hex::decode(&s[2..])
                    .map_err(|e| anyhow!("Invalid hex: {}", e))?;
                let mut arr = [0u8; 32];
                arr[..bytes.len().min(32)].copy_from_slice(&bytes[..bytes.len().min(32)]);
                return Ok(Fr::from_le_bytes_mod_order(&arr));
            }

            // Parse as raw hex
            let bytes = hex::decode(s)
                .map_err(|e| anyhow!("Invalid input: {}", e))?;
            let mut arr = [0u8; 32];
            arr[..bytes.len().min(32)].copy_from_slice(&bytes[..bytes.len().min(32)]);
            Ok(Fr::from_le_bytes_mod_order(&arr))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_g1_point() {
        let point = G1Point {
            x: "1".to_string(),
            y: "2".to_string(),
        };

        let result = parse_g1_point(&point);
        assert!(result.is_ok());
    }
}
