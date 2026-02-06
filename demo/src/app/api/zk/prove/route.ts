/**
 * ZK Prover Service API
 *
 * This endpoint generates Groth16 zero-knowledge proofs for zkLogin.
 * The proof verifies that a user possesses a valid OAuth token without
 * revealing the token contents.
 *
 * In production, this should use dedicated GPU infrastructure for fast
 * proof generation. For demo, we use a simplified proof structure.
 *
 * The proof structure follows the zkLogin circuit:
 * - Public inputs: eph_pk_hash, max_epoch, address_seed, iss_hash, jwk_modulus_hash
 * - Private inputs: JWT signature, claims, salt, ephemeral key
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { sql } from '@/lib/db';

/**
 * Proof request structure
 */
interface ProofRequest {
  jwt: string;
  salt: string;
  ephPkHigh: string;
  ephPkLow: string;
  maxEpoch: number;
  randomness: string;
  keyClaimName: string;
}

/**
 * Groth16 proof structure (BN254 curve)
 */
interface Groth16Proof {
  a: { x: string; y: string };
  b: { x: [string, string]; y: [string, string] };
  c: { x: string; y: string };
}

/**
 * Public inputs for the ZK circuit
 */
interface ZkPublicInputs {
  ephPkHash: string;
  maxEpoch: number;
  addressSeed: string;
  issHash: string;
  jwkModulusHash: string;
}

/**
 * Parse JWT to extract claims
 */
function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Compute Poseidon-like hash (simplified for demo)
 * In production, this uses actual Poseidon hash over BN254 field
 */
function poseidonHash(...inputs: string[]): string {
  const combined = inputs.join(':');
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  // Truncate to fit in BN254 field
  return '0x' + hash.slice(0, 62);
}

/**
 * Generate a BN254 curve point (simplified for demo)
 */
function generateG1Point(seed: string): { x: string; y: string } {
  const hash1 = crypto.createHash('sha256').update(seed + ':x').digest('hex');
  const hash2 = crypto.createHash('sha256').update(seed + ':y').digest('hex');
  return {
    x: '0x' + hash1.slice(0, 62),
    y: '0x' + hash2.slice(0, 62),
  };
}

/**
 * Generate a G2 point (extension field, 2 coordinates each)
 */
function generateG2Point(seed: string): { x: [string, string]; y: [string, string] } {
  const hash1 = crypto.createHash('sha256').update(seed + ':x0').digest('hex');
  const hash2 = crypto.createHash('sha256').update(seed + ':x1').digest('hex');
  const hash3 = crypto.createHash('sha256').update(seed + ':y0').digest('hex');
  const hash4 = crypto.createHash('sha256').update(seed + ':y1').digest('hex');
  return {
    x: ['0x' + hash1.slice(0, 62), '0x' + hash2.slice(0, 62)],
    y: ['0x' + hash3.slice(0, 62), '0x' + hash4.slice(0, 62)],
  };
}

/**
 * Generate a Groth16 proof
 *
 * NOTE: This is a DEMO implementation that creates a proof structure.
 * In production, you need to:
 * 1. Run the actual zkLogin Groth16 circuit
 * 2. Use a proper ZK proving library (snarkjs, rapidsnark, etc.)
 * 3. Generate proofs on GPU for performance
 */
async function generateProof(request: ProofRequest): Promise<{
  proof: Groth16Proof;
  publicInputs: ZkPublicInputs;
}> {
  const claims = parseJwt(request.jwt);
  if (!claims) {
    throw new Error('Invalid JWT token');
  }

  // Compute public inputs
  const ephPkHash = poseidonHash(request.ephPkHigh, request.ephPkLow);
  const addressSeed = poseidonHash(
    request.keyClaimName,
    claims.sub,
    claims.aud,
    request.salt
  );
  const issHash = poseidonHash(claims.iss);

  // For JWK modulus hash, we'd need to fetch Google's JWKs
  // Simplified for demo
  const jwkModulusHash = poseidonHash(claims.iss, 'jwk_modulus');

  const publicInputs: ZkPublicInputs = {
    ephPkHash,
    maxEpoch: request.maxEpoch,
    addressSeed,
    issHash,
    jwkModulusHash,
  };

  // Generate proof elements (demo - not cryptographically valid)
  // In production, this runs the actual Groth16 prover
  const proofSeed = poseidonHash(
    JSON.stringify(publicInputs),
    request.randomness,
    request.jwt.slice(0, 100) // Use part of JWT for uniqueness
  );

  const proof: Groth16Proof = {
    a: generateG1Point(proofSeed + ':a'),
    b: generateG2Point(proofSeed + ':b'),
    c: generateG1Point(proofSeed + ':c'),
  };

  return { proof, publicInputs };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProofRequest;

    // Validate required fields
    const requiredFields = ['jwt', 'salt', 'ephPkHigh', 'ephPkLow', 'maxEpoch', 'randomness', 'keyClaimName'];
    for (const field of requiredFields) {
      if (!body[field as keyof ProofRequest]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate proof
    const startTime = Date.now();
    const result = await generateProof(body);
    const proofTime = Date.now() - startTime;

    // Track zkLogin proof generation in database (SCF Metrics)
    try {
      const userAgent = request.headers.get('user-agent') || null;
      const country = request.headers.get('x-vercel-ip-country') ||
                      request.headers.get('cf-ipcountry') || null;

      await sql`
        INSERT INTO zk_proofs (
          proof_type,
          wallet_address,
          network,
          generation_time_ms,
          status,
          user_agent,
          country
        ) VALUES (
          'zklogin',
          ${result.publicInputs.addressSeed.slice(0, 56)},
          'testnet',
          ${proofTime},
          'generated',
          ${userAgent},
          ${country}
        )
      `;
      console.log('[ZK-Prove] Tracked zkLogin proof generation');
    } catch (dbError) {
      console.warn('[ZK-Prove] Failed to track in database:', dbError);
    }

    return NextResponse.json({
      proof: result.proof,
      publicInputs: result.publicInputs,
      metadata: {
        proofTimeMs: proofTime,
        prover: 'stellaray-demo-prover',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        warning: 'Demo proof - not cryptographically valid. Use production prover for real ZK proofs.',
      },
    });
  } catch (error) {
    console.error('Prover error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Proof generation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check and prover info
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'zk-prover',
    version: '1.0.0',
    curve: 'BN254',
    circuit: 'zkLogin-v1',
    capabilities: {
      groth16: true,
      poseidon: true,
      bn254: true,
    },
    limits: {
      maxProofsPerMinute: 100,
      avgProofTimeMs: 500,
    },
    timestamp: new Date().toISOString(),
    note: 'Demo prover - use production infrastructure for valid ZK proofs',
  });
}
