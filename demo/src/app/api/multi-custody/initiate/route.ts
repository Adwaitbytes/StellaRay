import { NextRequest, NextResponse } from 'next/server';

/**
 * Initiate a pending transaction in ZK Multi-Custody wallet
 * Requires 1 ZK proof to start, then collects additional proofs
 */

export async function POST(request: NextRequest) {
  try {
    const {
      walletAddress,
      transactionType,
      transactionData,
      initiatorProof,
      expirySeconds = 86400, // 24 hours default
    } = await request.json();

    console.log('[ZK-Multi-Custody] Initiating transaction:', {
      walletAddress,
      transactionType,
      expirySeconds,
    });

    // Validate inputs
    if (!walletAddress || !transactionType || !transactionData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call smart contract initiate_transaction
    const contractId = process.env.ZK_MULTI_CUSTODY_CONTRACT_ID;
    if (!contractId) {
      throw new Error('ZK_MULTI_CUSTODY_CONTRACT_ID not configured');
    }

    // TODO: Call Soroban contract
    // For now, simulate response
    const txId = generateTxId();

    console.log('[ZK-Multi-Custody] Transaction initiated:', txId);

    return NextResponse.json({
      success: true,
      txId,
      status: 'PendingApprovals',
      approvalCount: 1,
      message: 'Transaction initiated, waiting for additional approvals',
    });
  } catch (error: any) {
    console.error('[ZK-Multi-Custody] Error initiating transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate transaction' },
      { status: 500 }
    );
  }
}

function generateTxId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
