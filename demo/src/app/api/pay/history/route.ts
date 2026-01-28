/**
 * Payment Link History API
 *
 * GET /api/pay/history - Get user's payment links
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getPaymentLinksByCreator,
  getPaymentLinkStats,
  getPaymentLinkUrl,
} from '@/lib/paymentLinks';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as any;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get wallet address from query parameter (passed from client)
    const creatorAddress = request.nextUrl.searchParams.get('address');

    if (!creatorAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Validate Stellar address format
    if (!creatorAddress.startsWith('G') || creatorAddress.length !== 56) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    // Get payment links
    const paymentLinks = await getPaymentLinksByCreator(creatorAddress, limit, offset);

    // Get stats
    const stats = await getPaymentLinkStats(creatorAddress);

    // Add URLs to each link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    request.headers.get('origin') ||
                    'https://stellaray.fun';

    const linksWithUrls = paymentLinks.map(link => ({
      ...link,
      url: getPaymentLinkUrl(link.id, baseUrl),
    }));

    return NextResponse.json({
      success: true,
      paymentLinks: linksWithUrls,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: paymentLinks.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
