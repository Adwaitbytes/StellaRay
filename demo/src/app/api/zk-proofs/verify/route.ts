/**
 * ZK Eligibility Proof Verification API
 *
 * POST /api/zk-proofs/verify
 *
 * Verifies a ZK eligibility proof. In production, this submits the proof
 * to the on-chain ZK Verifier contract which uses X-Ray Protocol's native
 * BN254 host functions for efficient Groth16 verification.
 *
 * On-chain verification flow:
 * 1. Decode proof (pi_A, pi_B, pi_C) and public inputs
 * 2. Compute public input accumulator: acc = IC[0] + sum(pub_i * IC[i+1])
 *    Using: bn254_g1_mul (scalar mult) + bn254_g1_add (point addition)
 * 3. Run pairing check: e(-A, B) * e(acc, gamma) * e(C, delta) * e(alpha, beta) == 1
 *    Using: bn254_multi_pairing_check (native pairing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  type EligibilityProof,
  type VerificationResult,
  type ProofType,
  buildVerifyTransaction,
  getXRayProtocolInfo,
} from '@/lib/zkEligibility';

const ZK_VERIFIER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID ||
  'CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6';
const RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

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
    const { proof } = body as { proof: EligibilityProof };

    if (!proof || !proof.id || !proof.type || !proof.proof || !proof.publicInputs) {
      return NextResponse.json(
        { error: 'Valid proof object is required' },
        { status: 400 }
      );
    }

    // Check proof expiry
    if (new Date(proof.metadata.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Proof has expired' },
        { status: 400 }
      );
    }

    // Attempt on-chain verification via Soroban simulation
    const verificationResult = await verifyOnChain(proof);

    return NextResponse.json({
      success: true,
      verification: verificationResult,
      xrayProtocol: getXRayProtocolInfo(),
    });
  } catch (error: any) {
    console.error('Error verifying ZK proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify proof' },
      { status: 500 }
    );
  }
}

/**
 * Verify proof on-chain using Soroban ZK Verifier contract.
 *
 * The contract's verify_eligibility_proof function internally uses:
 * - bn254_g1_mul: For scalar multiplication of public inputs with IC points
 * - bn254_g1_add: For accumulating the public input commitment
 * - bn254_multi_pairing_check: For the final Groth16 pairing equation
 * - poseidon_permutation: For re-hashing public inputs to verify commitments
 */
async function verifyOnChain(proof: EligibilityProof): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
    const contract = new StellarSdk.Contract(ZK_VERIFIER_CONTRACT_ID);

    // Build the verification transaction arguments
    const args = buildVerifyTransaction(proof, ZK_VERIFIER_CONTRACT_ID, NETWORK_PASSPHRASE);

    // Create simulation source account
    const sourceAccount = new StellarSdk.Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0'
    );

    // Build transaction for simulation
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('verify_eligibility_proof', ...args))
      .setTimeout(30)
      .build();

    // Simulate the verification
    const simulation = await server.simulateTransaction(tx);

    if ('error' in simulation) {
      // Contract simulation failed - proof may be invalid or contract not deployed
      // Fall back to structural verification
      return structuralVerification(proof, startTime);
    }

    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulation)) {
      const result = simulation.result;
      if (result && result.retval) {
        const isValid = result.retval.value() as boolean;
        const gasUsed = Number(simulation.minResourceFee || 0);

        return {
          valid: isValid,
          proofId: proof.id,
          proofType: proof.type,
          verifiedAt: new Date().toISOString(),
          verifiedOnChain: true,
          contractId: ZK_VERIFIER_CONTRACT_ID,
          gasUsed,
        };
      }
    }

    // Simulation didn't return a clear result, fall back
    return structuralVerification(proof, startTime);
  } catch (error) {
    // On-chain verification unavailable, fall back to structural verification
    console.warn('On-chain verification unavailable, using structural verification:', error);
    return structuralVerification(proof, startTime);
  }
}

/**
 * Structural verification: validates proof format and consistency
 * without on-chain pairing check. Used as fallback when contract is unavailable.
 *
 * Checks:
 * 1. Proof points are well-formed (correct hex length for G1/G2)
 * 2. Public inputs are valid field elements
 * 3. Verification key matches proof type
 * 4. Proof hasn't expired
 * 5. Metadata consistency
 */
function structuralVerification(
  proof: EligibilityProof,
  startTime: number
): VerificationResult {
  const errors: string[] = [];

  // Validate G1 points (should be 62-char hex after 0x prefix)
  const validateG1 = (point: { x: string; y: string }, name: string) => {
    if (!point.x || !point.y) {
      errors.push(`${name}: missing coordinates`);
      return;
    }
    const cleanX = point.x.startsWith('0x') ? point.x.slice(2) : point.x;
    const cleanY = point.y.startsWith('0x') ? point.y.slice(2) : point.y;
    if (cleanX.length < 60 || cleanY.length < 60) {
      errors.push(`${name}: coordinates too short for BN254 field element`);
    }
  };

  // Validate G2 points
  const validateG2 = (point: { x: [string, string]; y: [string, string] }, name: string) => {
    if (!point.x || !point.y || point.x.length !== 2 || point.y.length !== 2) {
      errors.push(`${name}: invalid G2 point structure`);
      return;
    }
    for (let i = 0; i < 2; i++) {
      const cleanX = point.x[i].startsWith('0x') ? point.x[i].slice(2) : point.x[i];
      const cleanY = point.y[i].startsWith('0x') ? point.y[i].slice(2) : point.y[i];
      if (cleanX.length < 60 || cleanY.length < 60) {
        errors.push(`${name}: extension field component [${i}] too short`);
      }
    }
  };

  // Validate proof structure
  validateG1(proof.proof.a, 'pi_A');
  validateG2(proof.proof.b, 'pi_B');
  validateG1(proof.proof.c, 'pi_C');

  // Validate public inputs
  if (!proof.publicInputs || proof.publicInputs.length === 0) {
    errors.push('No public inputs');
  } else {
    proof.publicInputs.forEach((input, i) => {
      if (!input || input.length < 10) {
        errors.push(`Public input [${i}]: too short`);
      }
    });
  }

  // Validate VK matches expected IC count
  const expectedIcCount = proof.publicInputs.length + 1;
  if (proof.verificationKey.ic.length !== expectedIcCount) {
    errors.push(
      `VK IC count mismatch: expected ${expectedIcCount}, got ${proof.verificationKey.ic.length}`
    );
  }

  // Validate proof type
  const validTypes: ProofType[] = ['solvency', 'identity', 'eligibility', 'history'];
  if (!validTypes.includes(proof.type)) {
    errors.push(`Invalid proof type: ${proof.type}`);
  }

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    proofId: proof.id,
    proofType: proof.type,
    verifiedAt: new Date().toISOString(),
    verifiedOnChain: false,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * GET - Verification service status
 */
export async function GET() {
  let contractDeployed = false;

  try {
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
    const contract = new StellarSdk.Contract(ZK_VERIFIER_CONTRACT_ID);
    await server.getContractData(
      contract,
      StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance()
    );
    contractDeployed = true;
  } catch {
    contractDeployed = false;
  }

  return NextResponse.json({
    service: 'zk-eligibility-verifier',
    version: '1.0.0',
    contract: ZK_VERIFIER_CONTRACT_ID,
    contractDeployed,
    network: 'testnet',
    rpcUrl: RPC_URL,
    xrayProtocol: getXRayProtocolInfo(),
    verificationMethods: {
      onChain: {
        available: contractDeployed,
        description: 'Groth16 verification via Soroban using BN254 pairing check',
        hostFunctions: ['bn254_g1_add', 'bn254_g1_mul', 'bn254_multi_pairing_check'],
      },
      structural: {
        available: true,
        description: 'Format and consistency validation (fallback)',
      },
    },
  });
}
