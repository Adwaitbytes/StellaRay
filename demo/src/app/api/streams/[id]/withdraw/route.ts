/**
 * Stream Withdrawal API
 *
 * POST /api/streams/[id]/withdraw - Withdraw available funds from a stream
 *
 * This endpoint:
 * 1. Validates the withdrawal request
 * 2. Calculates withdrawable amount
 * 3. Executes Stellar transaction from escrow to recipient
 * 4. Records the withdrawal in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getStream,
  recordWithdrawal,
  calculateStreamMetrics,
} from '@/lib/streamingPayments';
import { withdrawFromEscrow } from '@/lib/streamEscrow';
import { type NetworkType } from '@/lib/stellar';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: streamId } = await params;
    const body = await request.json();
    const { recipientAddress, amount } = body;

    if (!recipientAddress) {
      return NextResponse.json(
        { error: 'Recipient address is required' },
        { status: 400 }
      );
    }

    // Get the stream
    const stream = await getStream(streamId);
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Verify recipient is authorized
    if (stream.recipientAddress !== recipientAddress) {
      return NextResponse.json(
        { error: 'Only the stream recipient can withdraw funds' },
        { status: 403 }
      );
    }

    // Check stream status
    if (stream.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot withdraw from a cancelled stream' },
        { status: 400 }
      );
    }

    // Calculate current metrics
    const metrics = calculateStreamMetrics(stream);

    // Determine withdrawal amount
    let withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      // If no amount specified, withdraw all available
      withdrawAmount = metrics.withdrawableAmount;
    }

    // Validate withdrawal amount
    if (withdrawAmount > metrics.withdrawableAmount) {
      return NextResponse.json(
        {
          error: `Requested amount (${withdrawAmount.toFixed(7)}) exceeds withdrawable amount (${metrics.withdrawableAmount.toFixed(7)})`,
        },
        { status: 400 }
      );
    }

    if (withdrawAmount <= 0) {
      return NextResponse.json(
        { error: 'No funds available to withdraw' },
        { status: 400 }
      );
    }

    // Execute the blockchain transaction from escrow to recipient
    const txResult = await withdrawFromEscrow(
      streamId,
      recipientAddress,
      withdrawAmount.toFixed(7),
      stream.network as NetworkType
    );

    // Record the withdrawal in the database
    const updatedStream = await recordWithdrawal(
      streamId,
      withdrawAmount.toFixed(7),
      txResult.hash
    );

    if (!updatedStream) {
      return NextResponse.json(
        { error: 'Failed to record withdrawal' },
        { status: 500 }
      );
    }

    // Calculate updated metrics
    const updatedMetrics = calculateStreamMetrics(updatedStream);

    return NextResponse.json({
      success: true,
      txHash: txResult.hash,
      withdrawnAmount: withdrawAmount.toFixed(7),
      stream: {
        ...updatedStream,
        metrics: updatedMetrics,
      },
    });
  } catch (error: any) {
    console.error('Error withdrawing from stream:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to withdraw from stream' },
      { status: 500 }
    );
  }
}
