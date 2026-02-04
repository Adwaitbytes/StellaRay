import { NextRequest, NextResponse } from 'next/server';

/**
 * Get all pending transactions for a multi-custody wallet
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress parameter required' },
        { status: 400 }
      );
    }

    console.log('[ZK-Multi-Custody] Fetching pending transactions for:', walletAddress);

    // Call smart contract get_all_pending
    const contractId = process.env.ZK_MULTI_CUSTODY_CONTRACT_ID;
    if (!contractId) {
      throw new Error('ZK_MULTI_CUSTODY_CONTRACT_ID not configured');
    }

    // TODO: Call Soroban contract
    // For now, return mock data (demo mode)
    const pendingTransactions: any[] = [];

    return NextResponse.json({
      success: true,
      transactions: pendingTransactions,
      count: pendingTransactions.length,
    });
  } catch (error: any) {
    console.error('[ZK-Multi-Custody] Error fetching pending transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending transactions' },
      { status: 500 }
    );
  }
}
