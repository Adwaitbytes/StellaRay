/**
 * Stream History API
 *
 * GET /api/streams/history - Get user's streams (sent and received)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getOutgoingStreams,
  getIncomingStreams,
  getAllUserStreams,
  getStreamStats,
  calculateStreamMetrics,
  formatFlowRate,
} from '@/lib/streamingPayments';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const type = url.searchParams.get('type') || 'all'; // 'all', 'outgoing', 'incoming'
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Fetch streams based on type
    let streams;
    switch (type) {
      case 'outgoing':
        streams = await getOutgoingStreams(address, limit, offset);
        break;
      case 'incoming':
        streams = await getIncomingStreams(address, limit, offset);
        break;
      default:
        streams = await getAllUserStreams(address, limit, offset);
    }

    // Get stats
    const stats = await getStreamStats(address);

    // Enrich streams with real-time metrics
    const enrichedStreams = streams.map(stream => {
      const metrics = calculateStreamMetrics(stream);
      return {
        ...stream,
        metrics,
        flowRateDisplay: formatFlowRate(parseFloat(stream.flowRate), stream.asset),
        direction: stream.senderAddress === address ? 'outgoing' : 'incoming',
      };
    });

    // Calculate aggregate real-time stats
    let totalStreaming = 0;
    let totalWithdrawable = 0;

    enrichedStreams.forEach(stream => {
      if (stream.metrics.isActive) {
        if (stream.direction === 'incoming') {
          totalWithdrawable += stream.metrics.withdrawableAmount;
        }
        totalStreaming += stream.metrics.flowRatePerSecond;
      }
    });

    return NextResponse.json({
      streams: enrichedStreams,
      stats: {
        ...stats,
        totalActiveFlowRate: totalStreaming,
        totalWithdrawableNow: totalWithdrawable,
      },
      pagination: {
        limit,
        offset,
        hasMore: streams.length === limit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stream history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream history' },
      { status: 500 }
    );
  }
}
