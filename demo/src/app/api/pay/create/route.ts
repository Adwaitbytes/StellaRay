/**
 * Create Payment Link API
 *
 * POST /api/pay/create - Creates a new payment link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  createPaymentLink,
  isValidStellarAddress,
  isValidAmount,
  getPaymentLinkUrl,
} from '@/lib/paymentLinks';

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      recipientAddress,
      amount,
      asset = 'XLM',
      memo,
      description,
      expiresAt,
      network = 'testnet',
    } = body;

    // Validate required fields
    if (!recipientAddress) {
      return NextResponse.json(
        { error: 'Recipient address is required' },
        { status: 400 }
      );
    }

    // Validate Stellar address format
    if (!isValidStellarAddress(recipientAddress)) {
      return NextResponse.json(
        { error: 'Invalid Stellar address format' },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount && !isValidAmount(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Validate memo length (Stellar limit is 28 bytes)
    if (memo && memo.length > 28) {
      return NextResponse.json(
        { error: 'Memo must be 28 characters or less' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate expiration date
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiration date format' },
          { status: 400 }
        );
      }
      if (expiryDate <= new Date()) {
        return NextResponse.json(
          { error: 'Expiration date must be in the future' },
          { status: 400 }
        );
      }
    }

    // Validate network
    if (!['testnet', 'mainnet'].includes(network)) {
      return NextResponse.json(
        { error: 'Network must be testnet or mainnet' },
        { status: 400 }
      );
    }

    // Create the payment link
    const paymentLink = await createPaymentLink({
      creatorAddress: recipientAddress, // Creator is also the recipient
      creatorEmail: session.user.email,
      recipientAddress,
      amount: amount || undefined,
      asset,
      memo: memo || undefined,
      description: description || undefined,
      expiresAt: expiresAt || undefined,
      network,
    });

    // Get the base URL for the link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    request.headers.get('origin') ||
                    'https://stellaray.fun';
    const linkUrl = getPaymentLinkUrl(paymentLink.id, baseUrl);

    return NextResponse.json({
      success: true,
      paymentLink: {
        ...paymentLink,
        url: linkUrl,
      },
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
