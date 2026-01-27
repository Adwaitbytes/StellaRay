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
import { generateWalletFromSub } from '@/lib/stellar';

// Helper to parse JWT and get sub
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf-8')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as any;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's wallet address from session
    // We need to derive it the same way as in useZkWallet
    let creatorAddress = '';

    // Try to get from session if available
    if (session.idToken) {
      const claims = parseJwt(session.idToken);
      if (claims?.sub) {
        const network = request.nextUrl.searchParams.get('network') || 'testnet';
        const wallet = generateWalletFromSub(claims.sub, network as any);
        creatorAddress = wallet.publicKey;
      }
    }

    // If we couldn't get the address, try the email-based lookup
    if (!creatorAddress && session.user.email) {
      // For now, we'll search by email instead
      // This is a fallback - in production, store the address in the session
    }

    if (!creatorAddress) {
      return NextResponse.json(
        { error: 'Could not determine wallet address' },
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
