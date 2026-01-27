/**
 * ZK Proof Verification API
 *
 * This endpoint verifies ZK proofs on-chain using the ZK Verifier contract.
 * It submits the proof to Stellar's Soroban smart contract for verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Contract configuration
const ZK_VERIFIER_CONTRACT_ID = process.env.NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID || 'CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6';
const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

/**
 * Groth16 proof structure
 */
interface Groth16Proof {
  a: { x: string; y: string };
  b: { x: [string, string]; y: [string, string] };
  c: { x: string; y: string };
}

/**
 * Public inputs structure
 */
interface ZkPublicInputs {
  ephPkHash: string;
  maxEpoch: number;
  addressSeed: string;
  issHash: string;
  jwkModulusHash: string;
}

/**
 * Convert hex string to Buffer for Soroban
 */
function hexToBytes(hex: string): Buffer {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return Buffer.from(cleanHex, 'hex');
}

/**
 * Build the verify_proof contract call
 */
function buildVerifyProofCall(
  proof: Groth16Proof,
  publicInputs: ZkPublicInputs
): StellarSdk.xdr.ScVal[] {
  // Convert proof components to contract format
  const proofVal = StellarSdk.xdr.ScVal.scvMap([
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('a'),
      val: StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('x'),
          val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.a.x)),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('y'),
          val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.a.y)),
        }),
      ]),
    }),
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('b'),
      val: StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('x'),
          val: StellarSdk.xdr.ScVal.scvVec([
            StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.b.x[0])),
            StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.b.x[1])),
          ]),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('y'),
          val: StellarSdk.xdr.ScVal.scvVec([
            StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.b.y[0])),
            StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.b.y[1])),
          ]),
        }),
      ]),
    }),
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('c'),
      val: StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('x'),
          val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.c.x)),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('y'),
          val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proof.c.y)),
        }),
      ]),
    }),
  ]);

  // Convert public inputs to contract format
  const inputsVal = StellarSdk.xdr.ScVal.scvMap([
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('eph_pk_hash'),
      val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(publicInputs.ephPkHash)),
    }),
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('max_epoch'),
      val: StellarSdk.xdr.ScVal.scvU64(StellarSdk.xdr.Uint64.fromString(publicInputs.maxEpoch.toString())),
    }),
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('address_seed'),
      val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(publicInputs.addressSeed)),
    }),
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('iss_hash'),
      val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(publicInputs.issHash)),
    }),
    new StellarSdk.xdr.ScMapEntry({
      key: StellarSdk.xdr.ScVal.scvSymbol('jwk_modulus_hash'),
      val: StellarSdk.xdr.ScVal.scvBytes(hexToBytes(publicInputs.jwkModulusHash)),
    }),
  ]);

  return [proofVal, inputsVal];
}

/**
 * Simulate proof verification on-chain
 */
async function simulateVerification(
  proof: Groth16Proof,
  publicInputs: ZkPublicInputs
): Promise<{ valid: boolean; error?: string }> {
  try {
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
    const contract = new StellarSdk.Contract(ZK_VERIFIER_CONTRACT_ID);

    // Build the verify_proof call
    const args = buildVerifyProofCall(proof, publicInputs);

    // Create a simulation source account
    const sourceAccount = new StellarSdk.Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0'
    );

    // Build transaction for simulation
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('verify_proof', ...args))
      .setTimeout(30)
      .build();

    // Simulate the transaction
    const simulation = await server.simulateTransaction(tx);

    if ('error' in simulation) {
      return { valid: false, error: simulation.error };
    }

    // Check if simulation succeeded
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulation)) {
      // Parse the result
      const result = simulation.result;
      if (result && result.retval) {
        const isValid = result.retval.value() as boolean;
        return { valid: isValid };
      }
    }

    return { valid: false, error: 'Simulation failed' };
  } catch (error) {
    console.error('Verification simulation error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proof, publicInputs } = body;

    if (!proof || !publicInputs) {
      return NextResponse.json(
        { error: 'Proof and publicInputs are required' },
        { status: 400 }
      );
    }

    // Validate proof structure
    if (!proof.a || !proof.b || !proof.c) {
      return NextResponse.json(
        { error: 'Invalid proof structure' },
        { status: 400 }
      );
    }

    // Simulate verification on-chain
    const result = await simulateVerification(proof, publicInputs);

    return NextResponse.json({
      verified: result.valid,
      error: result.error,
      contract: ZK_VERIFIER_CONTRACT_ID,
      network: 'testnet',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Verification failed',
        verified: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check verifier contract status
 */
export async function GET() {
  try {
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL);

    // Check if contract exists
    let contractExists = false;
    try {
      const contract = new StellarSdk.Contract(ZK_VERIFIER_CONTRACT_ID);
      await server.getContractData(
        contract,
        StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance()
      );
      contractExists = true;
    } catch {
      contractExists = false;
    }

    return NextResponse.json({
      status: 'ok',
      service: 'zk-verifier',
      contract: ZK_VERIFIER_CONTRACT_ID,
      contractDeployed: contractExists,
      network: 'testnet',
      rpcUrl: RPC_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      service: 'zk-verifier',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
