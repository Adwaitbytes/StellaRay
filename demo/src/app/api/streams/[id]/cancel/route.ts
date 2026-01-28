/**
 * Stream Cancellation API
 *
 * POST /api/streams/[id]/cancel - Cancel a stream and refund remaining funds
 *
 * This endpoint:
 * 1. Validates the cancellation request
 * 2. Calculates refund amount (total - already withdrawn)
 * 3. Executes Stellar transaction from escrow back to sender
 * 4. Updates the stream status in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getStream,
  cancelStream,
  calculateStreamMetrics,
} from '@/lib/streamingPayments';
import { cancelAndRefund, closeEscrowAccount, getAccountBalance } from '@/lib/streamEscrow';
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
    const { senderAddress } = body;

    if (!senderAddress) {
      return NextResponse.json(
        { error: 'Sender address is required' },
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

    // Verify sender is authorized
    if (stream.senderAddress !== senderAddress) {
      return NextResponse.json(
        { error: 'Only the stream sender can cancel the stream' },
        { status: 403 }
      );
    }

    // Check stream status
    if (stream.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Stream is already cancelled' },
        { status: 400 }
      );
    }

    if (stream.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed stream' },
        { status: 400 }
      );
    }

    // Calculate current metrics to determine what's been streamed
    const metrics = calculateStreamMetrics(stream);
    const withdrawnAmount = parseFloat(stream.withdrawnAmount);
    const totalAmount = parseFloat(stream.totalAmount);

    // Calculate refund: remaining unstreamed amount
    // Note: The recipient can still withdraw what was already streamed before cancellation
    const streamedNotWithdrawn = metrics.streamedAmount - withdrawnAmount;
    const unstreamed = totalAmount - metrics.streamedAmount;

    // The refund goes back to sender (unstreamed portion only)
    // Streamed but not withdrawn stays in escrow for recipient to claim
    const refundAmount = unstreamed;

    let txHash = null;

    // Execute the refund transaction if there's anything to refund
    if (refundAmount > 0.0000001) {
      try {
        const txResult = await cancelAndRefund(
          streamId,
          senderAddress,
          refundAmount.toFixed(7),
          stream.network as NetworkType
        );
        txHash = txResult.hash;
      } catch (err: any) {
        console.error('Refund transaction failed:', err);
        // Continue with cancellation even if refund fails
        // The escrow might not have enough funds if recipient already withdrew
      }
    }

    // Update stream status in database
    const updatedStream = await cancelStream(streamId, txHash || undefined);

    if (!updatedStream) {
      // Stream may have already been cancelled by a concurrent request
      return NextResponse.json(
        { error: 'Stream is already cancelled or completed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash,
      refundedAmount: refundAmount.toFixed(7),
      streamedAmount: metrics.streamedAmount.toFixed(7),
      withdrawnAmount: withdrawnAmount.toFixed(7),
      message: refundAmount > 0
        ? `Stream cancelled. ${refundAmount.toFixed(2)} XLM refunded to sender.`
        : 'Stream cancelled. No refund available (all funds were already streamed).',
      stream: updatedStream,
    });
  } catch (error: any) {
    console.error('Error cancelling stream:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel stream' },
      { status: 500 }
    );
  }
}
