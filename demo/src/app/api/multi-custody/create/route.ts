import { NextRequest, NextResponse } from 'next/server';
import { Contract, Keypair, Networks, SorobanRpc, TransactionBuilder, Operation, BASE_FEE, xdr } from '@stellar/stellar-sdk';
import { generateGuardianCommitment } from '@/lib/poseidon';

/**
 * ZK Multi-Custody Wallet Creation
 * Creates a wallet controlled by multiple OAuth identities with K-of-N threshold
 */

interface Guardian {
  provider: 'google' | 'github' | 'apple';
  email: string;
  sub: string;           // OAuth sub claim
  accessToken: string;
  commitment?: string;    // Poseidon(iss || sub)
}

export async function POST(request: NextRequest) {
  try {
    const {
      guardians,
      threshold,
      timelockSeconds,
      timelockThreshold,
      creatorProof,
    } = await request.json();

    console.log('[ZK-Multi-Custody] Creating wallet with:', {
      guardianCount: guardians.length,
      threshold,
      timelockSeconds,
      timelockThreshold,
    });

    // Validate inputs
    if (!guardians || guardians.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 guardians' },
        { status: 400 }
      );
    }

    if (threshold < 1 || threshold > guardians.length) {
      return NextResponse.json(
        { error: 'Invalid threshold' },
        { status: 400 }
      );
    }

    // Generate commitment for each guardian
    const guardiansWithCommitments = await Promise.all(
      guardians.map(async (guardian: Guardian, index: number) => {
        // Generate Poseidon commitment
        // In production, this would call a proper Poseidon hash function
        const commitment = await generateCommitment(guardian.provider, guardian.sub);

        return {
          commitment,
          label: guardian.email,
          added_at: Math.floor(Date.now() / 1000),
          active: true,
        };
      })
    );

    console.log('[ZK-Multi-Custody] Generated commitments:', guardiansWithCommitments.length);

    // Initialize multi-custody contract
    const contractId = process.env.ZK_MULTI_CUSTODY_CONTRACT_ID;
    if (!contractId) {
      throw new Error('ZK_MULTI_CUSTODY_CONTRACT_ID not configured');
    }

    const server = new SorobanRpc.Server(
      process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
    );

    // Create transaction to initialize wallet
    const sourceKeypair = Keypair.fromSecret(process.env.DEPLOYER_SECRET!);
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());

    const contract = new Contract(contractId);

    // Build initialize transaction
    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'initialize',
          // guardians array
          xdr.ScVal.scvVec(
            guardiansWithCommitments.map((g) =>
              xdr.ScVal.scvMap([
                new xdr.ScMapEntry({
                  key: xdr.ScVal.scvSymbol('commitment'),
                  val: xdr.ScVal.scvBytes(Buffer.from(g.commitment, 'hex')),
                }),
                new xdr.ScMapEntry({
                  key: xdr.ScVal.scvSymbol('label'),
                  val: xdr.ScVal.scvString(g.label),
                }),
                new xdr.ScMapEntry({
                  key: xdr.ScVal.scvSymbol('added_at'),
                  val: xdr.ScVal.scvU64(new xdr.Uint64(g.added_at)),
                }),
                new xdr.ScMapEntry({
                  key: xdr.ScVal.scvSymbol('active'),
                  val: xdr.ScVal.scvBool(g.active),
                }),
              ])
            )
          ),
          // threshold
          xdr.ScVal.scvU32(threshold),
          // timelock_seconds (optional)
          timelockSeconds
            ? xdr.ScVal.scvU64(new xdr.Uint64(timelockSeconds))
            : xdr.ScVal.scvVoid(),
          // timelock_threshold (optional)
          timelockThreshold
            ? xdr.ScVal.scvI128(
                new xdr.Int128Parts({
                  lo: xdr.Uint64.fromString(timelockThreshold),
                  hi: new xdr.Int64(0),
                })
              )
            : xdr.ScVal.scvVoid(),
          // creator_proof
          encodeZkProof(creatorProof)
        )
      )
      .setTimeout(30)
      .build();

    // Simulate transaction
    const simulated = await server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simulated)) {
      console.error('[ZK-Multi-Custody] Simulation error:', simulated.error);
      return NextResponse.json(
        { error: 'Transaction simulation failed', details: simulated.error },
        { status: 500 }
      );
    }

    // Prepare and sign transaction
    const prepared = SorobanRpc.assembleTransaction(tx, simulated);
    prepared.sign(sourceKeypair);

    // Submit transaction
    const result = await server.sendTransaction(prepared);

    console.log('[ZK-Multi-Custody] Transaction submitted:', result.hash);

    // Wait for confirmation
    let status = await server.getTransaction(result.hash);
    let attempts = 0;

    while (status.status === 'NOT_FOUND' && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await server.getTransaction(result.hash);
      attempts++;
    }

    if (status.status === 'SUCCESS') {
      // Extract wallet address from transaction result
      const walletAddress = extractWalletAddress(status);

      console.log('[ZK-Multi-Custody] Wallet created successfully:', walletAddress);

      return NextResponse.json({
        success: true,
        walletAddress,
        txHash: result.hash,
        guardians: guardiansWithCommitments.map((g, i) => ({
          index: i + 1,
          commitment: g.commitment,
          label: g.label,
        })),
        threshold,
        timelockSeconds,
        timelockThreshold,
      });
    } else {
      console.error('[ZK-Multi-Custody] Transaction failed:', status);
      return NextResponse.json(
        { error: 'Transaction failed', details: status },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[ZK-Multi-Custody] Error creating wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create multi-custody wallet' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function generateCommitment(
  provider: string,
  sub: string
): Promise<string> {
  // Generate Poseidon(iss || sub) commitment using circomlibjs
  const iss = getIssuer(provider);

  // Call actual Poseidon hash implementation
  return generateGuardianCommitment(iss, sub);
}

function getIssuer(provider: string): string {
  switch (provider) {
    case 'google':
      return 'https://accounts.google.com';
    case 'apple':
      return 'https://appleid.apple.com';
    case 'github':
      return 'https://github.com';
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function encodeZkProof(proof: any): xdr.ScVal {
  // Encode Groth16 proof as ScVal
  // Structure: { proof_a, proof_b, proof_c, public_inputs }

  if (!proof) {
    // Return empty proof for now
    return xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('proof_a'),
        val: xdr.ScVal.scvVec([
          xdr.ScVal.scvBytes(Buffer.alloc(32)),
          xdr.ScVal.scvBytes(Buffer.alloc(32)),
        ]),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('proof_b'),
        val: xdr.ScVal.scvVec([
          xdr.ScVal.scvVec([
            xdr.ScVal.scvBytes(Buffer.alloc(32)),
            xdr.ScVal.scvBytes(Buffer.alloc(32)),
          ]),
          xdr.ScVal.scvVec([
            xdr.ScVal.scvBytes(Buffer.alloc(32)),
            xdr.ScVal.scvBytes(Buffer.alloc(32)),
          ]),
        ]),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('proof_c'),
        val: xdr.ScVal.scvVec([
          xdr.ScVal.scvBytes(Buffer.alloc(32)),
          xdr.ScVal.scvBytes(Buffer.alloc(32)),
        ]),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('public_inputs'),
        val: xdr.ScVal.scvVec([]),
      }),
    ]);
  }

  // TODO: Encode actual proof structure
  return xdr.ScVal.scvVoid();
}

function extractWalletAddress(txResult: any): string {
  // Extract wallet address from transaction result
  // For deterministic wallets, the address is derived from guardians + threshold

  // Placeholder: return contract address for now
  return process.env.ZK_MULTI_CUSTODY_CONTRACT_ID || '';
}
