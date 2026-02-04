import { NextRequest, NextResponse } from 'next/server';

/**
 * Submit approval proof for a pending transaction
 */

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, txId, approvalProof } = await request.json();

    console.log('[ZK-Multi-Custody] Submitting approval:', {
      walletAddress,
      txId,
    });

    // Validate inputs
    if (!walletAddress || !txId || !approvalProof) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call smart contract submit_approval
    const contractId = process.env.ZK_MULTI_CUSTODY_CONTRACT_ID;
    if (!contractId) {
      throw new Error('ZK_MULTI_CUSTODY_CONTRACT_ID not configured');
    }

    // TODO: Call Soroban contract
    // For now, simulate response
    const approvalCount = 2;
    const threshold = 2;
    const status = approvalCount >= threshold ? 'ReadyToExecute' : 'PendingApprovals';

    console.log('[ZK-Multi-Custody] Approval submitted:', { approvalCount, status });

    return NextResponse.json({
      success: true,
      status,
      approvalCount,
      threshold,
      message:
        status === 'ReadyToExecute'
          ? 'Threshold met, transaction ready to execute'
          : `Approval recorded, need ${threshold - approvalCount} more`,
    });
  } catch (error: any) {
    console.error('[ZK-Multi-Custody] Error submitting approval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit approval' },
      { status: 500 }
    );
  }
}
