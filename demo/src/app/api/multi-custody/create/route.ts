import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@stellar/stellar-sdk';
import { sql } from '@/lib/db';

/**
 * ZK Multi-Custody Wallet Creation API
 *
 * Creates a multi-custody wallet controlled by multiple OAuth identities.
 * Uses Poseidon commitments for privacy-preserving guardian identification.
 *
 * In demo mode (no contract deployed), this generates:
 * - Deterministic wallet address from guardian commitments
 * - Simulated Poseidon commitments (SHA256-based for demo)
 * - All data stored locally for demo purposes
 */

interface Guardian {
  provider: 'google' | 'github';
  identifier: string;  // email or username
  label: string;
}

interface CreateWalletRequest {
  guardians: Guardian[];
  threshold: number;
  timelockSeconds: number | null;
  timelockThreshold: string | null;
}

// Demo mode flag - set to true when contract is not deployed
const DEMO_MODE = !process.env.ZK_MULTI_CUSTODY_CONTRACT_ID;

export async function POST(request: NextRequest) {
  try {
    const body: CreateWalletRequest = await request.json();
    const { guardians, threshold, timelockSeconds, timelockThreshold } = body;

    console.log('[ZK-Multi-Custody] Creating wallet:', {
      guardianCount: guardians.length,
      threshold,
      timelockSeconds,
      timelockThreshold,
      demoMode: DEMO_MODE,
    });

    // ═══════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════

    if (!guardians || guardians.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 guardians' },
        { status: 400 }
      );
    }

    if (guardians.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 guardians allowed' },
        { status: 400 }
      );
    }

    if (threshold < 1 || threshold > guardians.length) {
      return NextResponse.json(
        { error: `Invalid threshold: must be between 1 and ${guardians.length}` },
        { status: 400 }
      );
    }

    // Check for duplicate guardians
    const identifiers = guardians.map(g => `${g.provider}:${g.identifier.toLowerCase()}`);
    const uniqueIdentifiers = new Set(identifiers);
    if (uniqueIdentifiers.size !== guardians.length) {
      return NextResponse.json(
        { error: 'Duplicate guardian identifiers detected' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERATE COMMITMENTS
    // ═══════════════════════════════════════════════════════════════

    const guardiansWithCommitments = await Promise.all(
      guardians.map(async (guardian, index) => {
        // Generate commitment using Poseidon hash simulation
        const commitment = await generatePoseidonCommitment(
          getIssuer(guardian.provider),
          guardian.identifier
        );

        return {
          index: index + 1,
          provider: guardian.provider,
          identifier: guardian.identifier,
          label: guardian.label,
          commitment,
          addedAt: Math.floor(Date.now() / 1000),
        };
      })
    );

    console.log('[ZK-Multi-Custody] Generated commitments for', guardiansWithCommitments.length, 'guardians');

    // ═══════════════════════════════════════════════════════════════
    // CREATE WALLET
    // ═══════════════════════════════════════════════════════════════

    let walletAddress: string;
    let txHash: string;

    if (DEMO_MODE) {
      // DEMO MODE: Generate deterministic wallet address from commitments
      const combinedCommitments = guardiansWithCommitments
        .map(g => g.commitment)
        .sort()
        .join('');

      // Create deterministic keypair from commitment hash
      const seedHash = await sha256(combinedCommitments + threshold.toString());
      const seed = Buffer.from(seedHash.slice(0, 64), 'hex');
      const keypair = Keypair.fromRawEd25519Seed(seed);
      walletAddress = keypair.publicKey();

      // Simulated transaction hash
      txHash = await sha256(`tx:${walletAddress}:${Date.now()}`);

      console.log('[ZK-Multi-Custody] DEMO MODE: Generated wallet', walletAddress);
    } else {
      // PRODUCTION MODE: Deploy to actual Soroban contract
      const result = await deployToSoroban(
        guardiansWithCommitments,
        threshold,
        timelockSeconds,
        timelockThreshold
      );
      walletAddress = result.walletAddress;
      txHash = result.txHash;

      console.log('[ZK-Multi-Custody] PRODUCTION: Deployed wallet', walletAddress);
    }

    // ═══════════════════════════════════════════════════════════════
    // TRACK IN DATABASE (SCF Metrics)
    // ═══════════════════════════════════════════════════════════════

    try {
      await sql`
        INSERT INTO multi_custody_wallets (
          wallet_address,
          guardian_count,
          threshold,
          timelock_seconds,
          timelock_threshold,
          network,
          funded,
          tx_hash
        ) VALUES (
          ${walletAddress},
          ${guardians.length},
          ${threshold},
          ${timelockSeconds},
          ${timelockThreshold},
          'testnet',
          false,
          ${txHash}
        )
        ON CONFLICT (wallet_address) DO NOTHING
      `;
      console.log('[ZK-Multi-Custody] Tracked wallet creation in database');
    } catch (dbError) {
      console.warn('[ZK-Multi-Custody] Failed to track in database:', dbError);
      // Don't fail the request if tracking fails
    }

    // ═══════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════

    const response = {
      success: true,
      walletAddress,
      txHash,
      guardians: guardiansWithCommitments.map(g => ({
        index: g.index,
        label: g.label,
        commitment: g.commitment,
        provider: g.provider,
      })),
      threshold,
      guardianCount: guardians.length,
      timelockSeconds,
      timelockThreshold,
      demoMode: DEMO_MODE,
      createdAt: Date.now(),
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[ZK-Multi-Custody] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create multi-custody wallet' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get OAuth issuer URL from provider name
 */
function getIssuer(provider: string): string {
  switch (provider) {
    case 'google':
      return 'https://accounts.google.com';
    case 'github':
      return 'https://github.com';
    case 'apple':
      return 'https://appleid.apple.com';
    default:
      return `https://${provider}.com`;
  }
}

/**
 * Generate Poseidon-like commitment
 *
 * In production, this would use circomlibjs's Poseidon hash.
 * For demo purposes, we use a deterministic SHA256-based approach
 * that mimics the commitment structure.
 */
async function generatePoseidonCommitment(iss: string, sub: string): Promise<string> {
  // Try to use real Poseidon if available
  try {
    const { generateGuardianCommitment } = await import('@/lib/poseidon');
    return await generateGuardianCommitment(iss, sub);
  } catch (e) {
    // Fallback to SHA256-based commitment for demo
    console.log('[ZK-Multi-Custody] Using SHA256 fallback for commitment');
    const input = `poseidon:${iss}:${sub}`;
    return sha256(input);
  }
}

/**
 * SHA256 hash function using Web Crypto API
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Deploy to Soroban smart contract (production mode)
 */
async function deployToSoroban(
  guardians: any[],
  threshold: number,
  timelockSeconds: number | null,
  timelockThreshold: string | null
): Promise<{ walletAddress: string; txHash: string }> {
  // This would contain the actual Soroban deployment logic
  // For now, we throw an error as it requires:
  // 1. ZK_MULTI_CUSTODY_CONTRACT_ID environment variable
  // 2. DEPLOYER_SECRET for transaction signing
  // 3. Actual Soroban RPC connection

  const contractId = process.env.ZK_MULTI_CUSTODY_CONTRACT_ID;
  if (!contractId) {
    throw new Error('ZK_MULTI_CUSTODY_CONTRACT_ID not configured');
  }

  const deployerSecret = process.env.DEPLOYER_SECRET;
  if (!deployerSecret) {
    throw new Error('DEPLOYER_SECRET not configured');
  }

  // Import the heavy dependencies only when needed
  const { Contract, Keypair, Networks, SorobanRpc, TransactionBuilder, BASE_FEE, xdr } =
    await import('@stellar/stellar-sdk');

  const server = new SorobanRpc.Server(
    process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
  );

  const sourceKeypair = Keypair.fromSecret(deployerSecret);
  const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
  const contract = new Contract(contractId);

  // Build the initialization transaction
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'initialize',
        // Convert guardians to Soroban format
        xdr.ScVal.scvVec(
          guardians.map((g) =>
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
                val: xdr.ScVal.scvU64(xdr.Uint64.fromString(g.addedAt.toString())),
              }),
              new xdr.ScMapEntry({
                key: xdr.ScVal.scvSymbol('active'),
                val: xdr.ScVal.scvBool(true),
              }),
            ])
          )
        ),
        xdr.ScVal.scvU32(threshold),
        timelockSeconds
          ? xdr.ScVal.scvU64(xdr.Uint64.fromString(timelockSeconds.toString()))
          : xdr.ScVal.scvVoid(),
        timelockThreshold
          ? xdr.ScVal.scvI128(
              new xdr.Int128Parts({
                lo: xdr.Uint64.fromString(timelockThreshold),
                hi: new xdr.Int64(0),
              })
            )
          : xdr.ScVal.scvVoid()
      )
    )
    .setTimeout(30)
    .build();

  // Simulate, prepare, sign, and submit
  const simulated = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Transaction simulation failed: ${simulated.error}`);
  }

  const prepared = SorobanRpc.assembleTransaction(tx, simulated).build();
  prepared.sign(sourceKeypair);

  const result = await server.sendTransaction(prepared);

  // Wait for confirmation
  let status = await server.getTransaction(result.hash);
  let attempts = 0;

  while (status.status === 'NOT_FOUND' && attempts < 15) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await server.getTransaction(result.hash);
    attempts++;
  }

  if (status.status !== 'SUCCESS') {
    throw new Error(`Transaction failed with status: ${status.status}`);
  }

  return {
    walletAddress: contractId, // The wallet IS the contract for multi-custody
    txHash: result.hash,
  };
}
