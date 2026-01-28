/**
 * Stream Details API
 *
 * GET /api/streams/[id] - Get stream details with real-time calculations
 * POST /api/streams/[id] - Withdraw from stream
 * DELETE /api/streams/[id] - Cancel stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getStream,
  calculateStreamMetrics,
  recordWithdrawal,
  cancelStream,
  getStreamUrl,
  formatFlowRate,
  formatDuration,
} from '@/lib/streamingPayments';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get stream details
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const stream = await getStream(id);
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Calculate real-time metrics
    const metrics = calculateStreamMetrics(stream);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    request.headers.get('origin') ||
                    'https://stellaray.fun';

    return NextResponse.json({
      stream: {
        ...stream,
        url: getStreamUrl(stream.id, baseUrl),
        flowRateDisplay: formatFlowRate(parseFloat(stream.flowRate), stream.asset),
        durationDisplay: formatDuration(
          (new Date(stream.endTime).getTime() - new Date(stream.startTime).getTime()) / 1000
        ),
      },
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stream:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream' },
      { status: 500 }
    );
  }
}

/**
 * POST - Withdraw from stream (recipient only)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const stream = await getStream(id);
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { txHash, withdrawAmount, recipientAddress } = body;

    // Verify the requester is the recipient
    if (stream.recipientAddress !== recipientAddress) {
      return NextResponse.json(
        { error: 'Only the recipient can withdraw from this stream' },
        { status: 403 }
      );
    }

    // Check stream status
    if (stream.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot withdraw from cancelled stream' },
        { status: 400 }
      );
    }

    // Calculate current metrics
    const metrics = calculateStreamMetrics(stream);

    // Validate withdrawal amount
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (amount > metrics.withdrawableAmount) {
      return NextResponse.json(
        { error: `Withdrawal amount exceeds available balance. Maximum: ${metrics.withdrawableAmount.toFixed(7)}` },
        { status: 400 }
      );
    }

    // Validate transaction hash
    if (!txHash || !/^[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash' },
        { status: 400 }
      );
    }

    // Record the withdrawal
    const updatedStream = await recordWithdrawal(id, withdrawAmount, txHash);
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
      stream: updatedStream,
      metrics: updatedMetrics,
      withdrawal: {
        amount: withdrawAmount,
        txHash,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel stream (sender only)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const stream = await getStream(id);
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Get sender address from request body or query
    const url = new URL(request.url);
    const senderAddress = url.searchParams.get('senderAddress');

    // Verify the requester is the sender
    if (stream.senderAddress !== senderAddress) {
      return NextResponse.json(
        { error: 'Only the sender can cancel this stream' },
        { status: 403 }
      );
    }

    // Check if stream can be cancelled
    if (stream.status !== 'active' && stream.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel stream with status: ${stream.status}` },
        { status: 400 }
      );
    }

    // Calculate what needs to be settled
    const metrics = calculateStreamMetrics(stream);

    // Cancel the stream
    const cancelledStream = await cancelStream(id);
    if (!cancelledStream) {
      return NextResponse.json(
        { error: 'Failed to cancel stream' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stream: cancelledStream,
      settlement: {
        streamedToRecipient: metrics.streamedAmount,
        alreadyWithdrawn: metrics.withdrawnAmount,
        pendingForRecipient: metrics.withdrawableAmount,
        refundToSender: metrics.remainingAmount,
      },
    });
  } catch (error) {
    console.error('Error cancelling stream:', error);
    return NextResponse.json(
      { error: 'Failed to cancel stream' },
      { status: 500 }
    );
  }
}
