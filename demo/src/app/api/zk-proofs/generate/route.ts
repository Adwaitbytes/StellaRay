/**
 * ZK Eligibility Proof Generation API
 *
 * POST /api/zk-proofs/generate
 *
 * Generates zero-knowledge eligibility proofs using Stellar X-Ray Protocol primitives.
 * Supports: solvency, identity, eligibility, and history proof types.
 *
 * The generated Groth16 proof can be verified on-chain via the ZK Verifier contract
 * using BN254 pairing checks (CAP-0074) and Poseidon hashes (CAP-0075).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sql } from '@/lib/db';
import {
  generateEligibilityProof,
  getXRayProtocolInfo,
  type ProofInput,
  type ProofType,
} from '@/lib/zkEligibility';

const VALID_PROOF_TYPES: ProofType[] = ['solvency', 'identity', 'eligibility', 'history'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, walletAddress, ...params } = body;

    // Validate proof type
    if (!type || !VALID_PROOF_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid proof type. Must be one of: ${VALID_PROOF_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    // Build proof input based on type
    let proofInput: ProofInput;

    switch (type as ProofType) {
      case 'solvency': {
        const { threshold, actualBalance, asset, network } = params;
        if (!threshold || !actualBalance) {
          return NextResponse.json(
            { error: 'threshold and actualBalance are required for solvency proofs' },
            { status: 400 }
          );
        }
        // Validate: actual balance must be >= threshold
        if (parseFloat(actualBalance) < parseFloat(threshold)) {
          return NextResponse.json(
            { error: 'Cannot generate solvency proof: balance is below threshold' },
            { status: 400 }
          );
        }
        proofInput = {
          type: 'solvency',
          walletAddress,
          threshold,
          actualBalance,
          asset: asset || 'XLM',
          network: network || 'testnet',
        };
        break;
      }
      case 'identity': {
        const { email, provider, subject, salt } = params;
        if (!email || !provider || !subject) {
          return NextResponse.json(
            { error: 'email, provider, and subject are required for identity proofs' },
            { status: 400 }
          );
        }
        proofInput = {
          type: 'identity',
          walletAddress,
          identityCommitment: '', // computed inside
          email,
          provider,
          subject,
          salt: salt || crypto.randomUUID(),
        };
        break;
      }
      case 'eligibility': {
        const { criteria, criteriaHash, privateData } = params;
        if (!criteria || !privateData) {
          return NextResponse.json(
            { error: 'criteria and privateData are required for eligibility proofs' },
            { status: 400 }
          );
        }
        proofInput = {
          type: 'eligibility',
          walletAddress,
          criteria,
          criteriaHash: criteriaHash || criteria,
          privateData: privateData || {},
        };
        break;
      }
      case 'history': {
        const { minTransactions, actualCount, minVolume, actualVolume, asset, network } = params;
        if (minTransactions === undefined || actualCount === undefined) {
          return NextResponse.json(
            { error: 'minTransactions and actualCount are required for history proofs' },
            { status: 400 }
          );
        }
        if (actualCount < minTransactions) {
          return NextResponse.json(
            { error: 'Cannot generate history proof: actual count is below minimum' },
            { status: 400 }
          );
        }
        proofInput = {
          type: 'history',
          walletAddress,
          minTransactions,
          actualCount,
          minVolume: minVolume || '0',
          actualVolume: actualVolume || '0',
          asset: asset || 'XLM',
          network: network || 'testnet',
        };
        break;
      }
    }

    // Generate the proof
    const startTime = Date.now();
    const proof = await generateEligibilityProof(proofInput);
    const generationTimeMs = Date.now() - startTime;

    // Track proof generation in database (SCF Metrics)
    try {
      const userAgent = request.headers.get('user-agent') || null;
      const country = request.headers.get('x-vercel-ip-country') ||
                      request.headers.get('cf-ipcountry') || null;

      // Map proof type to database format
      const dbProofType = type === 'solvency' ? 'balance_intent' :
                          type === 'eligibility' ? 'eligibility_intent' : type;

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
          ${dbProofType},
          ${walletAddress},
          'testnet',
          ${generationTimeMs},
          'generated',
          ${userAgent},
          ${country}
        )
      `;
      console.log('[ZK-Proofs] Tracked proof generation:', dbProofType);
    } catch (dbError) {
      console.warn('[ZK-Proofs] Failed to track in database:', dbError);
    }

    return NextResponse.json({
      success: true,
      proof,
      generationTimeMs,
      xrayProtocol: getXRayProtocolInfo(),
    });
  } catch (error: any) {
    console.error('Error generating ZK proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate proof' },
      { status: 500 }
    );
  }
}

/**
 * GET - Proof generation service info
 */
export async function GET() {
  return NextResponse.json({
    service: 'zk-eligibility-prover',
    version: '1.0.0',
    supportedProofTypes: VALID_PROOF_TYPES,
    protocol: getXRayProtocolInfo(),
    capabilities: {
      bn254: {
        g1Add: true,
        g1Mul: true,
        pairingCheck: true,
      },
      poseidon: {
        permutation: true,
        poseidon2: true,
        supportedFields: ['BN254_Fr', 'BLS12_381_Fr'],
      },
      groth16: true,
    },
    proofTypes: {
      solvency: {
        description: 'Prove balance >= threshold without revealing exact balance',
        publicInputs: ['threshold_hash', 'balance_commitment', 'address_hash'],
        privateInputs: ['actual_balance'],
      },
      identity: {
        description: 'Prove verified identity without revealing personal data',
        publicInputs: ['identity_commitment', 'provider_hash', 'address_hash'],
        privateInputs: ['email', 'subject', 'salt'],
      },
      eligibility: {
        description: 'Prove you meet arbitrary criteria without revealing details',
        publicInputs: ['criteria_id', 'criteria_proof', 'address_hash'],
        privateInputs: ['private_data'],
      },
      history: {
        description: 'Prove transaction history properties without revealing transactions',
        publicInputs: ['threshold_hash', 'count_commitment', 'volume_commitment', 'address_hash'],
        privateInputs: ['actual_count', 'actual_volume'],
      },
    },
  });
}
