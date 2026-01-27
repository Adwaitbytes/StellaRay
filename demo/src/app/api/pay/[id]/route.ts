/**
 * Payment Link API
 *
 * GET /api/pay/[id] - Get payment link details
 * POST /api/pay/[id] - Mark payment link as paid (verify payment)
 * DELETE /api/pay/[id] - Cancel payment link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getPaymentLink,
  markPaymentLinkAsPaid,
  cancelPaymentLink,
  isLinkExpired,
  getPaymentLinkUrl,
  getStellarPayUri,
} from '@/lib/paymentLinks';

// GET - Fetch payment link details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 6) {
      return NextResponse.json(
        { error: 'Invalid payment link ID' },
        { status: 400 }
      );
    }

    const paymentLink = await getPaymentLink(id);

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (paymentLink.status === 'active' && isLinkExpired(paymentLink)) {
      paymentLink.status = 'expired';
    }

    // Get URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    request.headers.get('origin') ||
                    'https://stellaray.fun';

    return NextResponse.json({
      success: true,
      paymentLink: {
        ...paymentLink,
        url: getPaymentLinkUrl(paymentLink.id, baseUrl),
        stellarUri: getStellarPayUri(paymentLink),
      },
    });
  } catch (error) {
    console.error('Error fetching payment link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 }
    );
  }
}

// POST - Mark payment as complete (verify payment)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { txHash, paidAmount, paidBy } = body;

    if (!txHash || !paidAmount || !paidBy) {
      return NextResponse.json(
        { error: 'Transaction hash, paid amount, and payer address are required' },
        { status: 400 }
      );
    }

    // Validate transaction hash format (64 hex characters)
    if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    const paymentLink = await markPaymentLinkAsPaid(id, txHash, paidAmount, paidBy);

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found or already paid' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentLink,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel payment link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the payment link first to verify ownership
    const paymentLink = await getPaymentLink(id);

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Cancel the payment link
    const cancelled = await cancelPaymentLink(id, paymentLink.creatorAddress);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Could not cancel payment link. It may already be paid or cancelled.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment link cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling payment link:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payment link' },
      { status: 500 }
    );
  }
}
