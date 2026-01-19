import { NextRequest, NextResponse } from "next/server";

/**
 * x402 Protected Endpoint Example
 *
 * Demonstrates the x402 HTTP payment protocol for micropayments.
 * Returns 402 Payment Required if no valid payment proof is provided.
 */

// USDC contract on Stellar Testnet
const USDC_CONTRACT_ID = process.env.USDC_CONTRACT_ID || "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOUJ3DANUBER6AQA";

// Simulated content database
const PREMIUM_CONTENT: Record<string, { title: string; content: string; price: string }> = {
  "article/1": {
    title: "Understanding zkLogin on Stellar",
    content: `
# Understanding zkLogin on Stellar

zkLogin revolutionizes how users interact with blockchain by allowing OAuth-based
wallet creation without seed phrases. Here's how it works:

## 1. OAuth Authentication
Users sign in with familiar providers like Google or Apple. The JWT token
contains claims that uniquely identify the user.

## 2. Zero-Knowledge Proof
A Groth16 proof is generated that proves:
- The JWT is valid and signed by the OAuth provider
- The nonce in the JWT binds to an ephemeral key
- The address seed is correctly derived

All without revealing the user's identity!

## 3. On-Chain Verification
Stellar's Protocol X-Ray provides native BN254 pairing operations,
making proof verification efficient and cost-effective.

## 4. Session Management
Users can create time-limited sessions with ephemeral keys,
allowing seamless transactions without repeated OAuth flows.
    `.trim(),
    price: "100000", // 0.01 USDC (7 decimals)
  },
  "article/2": {
    title: "x402 Payment Protocol Deep Dive",
    content: `
# x402 Payment Protocol Deep Dive

x402 brings HTTP-native micropayments to the web, enabling:

## Payment Flow
1. Client requests protected resource
2. Server returns 402 with PAYMENT-REQUIRED header
3. Client executes on-chain payment
4. Client retries with X-PAYMENT proof header
5. Server verifies and returns content

## Benefits
- No subscriptions required
- Pay only for what you consume
- Works with any cryptocurrency
- Privacy-preserving transactions

## Stellar Integration
Stellar's fast finality (~5 seconds) and low fees make it ideal
for micropayments. Combined with zkLogin, users can pay seamlessly
without managing keys.
    `.trim(),
    price: "50000", // 0.005 USDC
  },
};

// In-memory payment verification (would use contract in production)
const verifiedPayments = new Map<string, { timestamp: number; payer: string }>();

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const content = PREMIUM_CONTENT[path];

  // Check if content exists
  if (!content) {
    return NextResponse.json(
      { error: "Content not found" },
      { status: 404 }
    );
  }

  // Check for payment proof
  const paymentHeader = request.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    // Return 402 Payment Required
    return createPaymentRequiredResponse(path, content.price);
  }

  // Verify payment
  try {
    const payment = JSON.parse(atob(paymentHeader));
    const isValid = await verifyPayment(payment, path, content.price);

    if (!isValid) {
      return createPaymentRequiredResponse(path, content.price);
    }

    // Return premium content
    return NextResponse.json({
      title: content.title,
      content: content.content,
      paidAt: payment.timestamp,
    });
  } catch {
    return createPaymentRequiredResponse(path, content.price);
  }
}

function createPaymentRequiredResponse(resourceId: string, amount: string): NextResponse {
  const payload = {
    x402Version: 1,
    scheme: "stellar-exact",
    network: "stellar:testnet",
    payload: {
      asset: USDC_CONTRACT_ID,
      amount,
      destination: MERCHANT_ADDRESS,
      validUntil: Date.now() + 300000, // 5 minutes
      resourceId,
      memo: `x402:${resourceId}`,
    },
  };

  const response = NextResponse.json(
    {
      error: "Payment Required",
      message: "This content requires payment to access",
      ...payload,
    },
    { status: 402 }
  );

  response.headers.set("PAYMENT-REQUIRED", btoa(JSON.stringify(payload)));

  return response;
}

async function verifyPayment(
  payment: { transactionHash: string; payer: string; timestamp: number },
  resourceId: string,
  expectedAmount: string
): Promise<boolean> {
  // Check if payment was already verified
  const cached = verifiedPayments.get(payment.transactionHash);
  if (cached) {
    return true;
  }

  // In production, verify against on-chain data:
  // 1. Check transaction exists on Stellar
  // 2. Verify correct amount was paid
  // 3. Verify correct destination
  // 4. Verify transaction is finalized

  // For demo, accept any payment proof
  if (payment.transactionHash && payment.payer && payment.timestamp) {
    verifiedPayments.set(payment.transactionHash, {
      timestamp: payment.timestamp,
      payer: payment.payer,
    });
    return true;
  }

  return false;
}

// Also support HEAD requests for checking payment requirements
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const content = PREMIUM_CONTENT[path];

  if (!content) {
    return new NextResponse(null, { status: 404 });
  }

  const paymentHeader = request.headers.get("X-PAYMENT");
  if (paymentHeader) {
    return new NextResponse(null, { status: 200 });
  }

  const response = new NextResponse(null, { status: 402 });

  const payload = {
    x402Version: 1,
    scheme: "stellar-exact",
    network: "stellar:testnet",
    payload: {
      asset: USDC_CONTRACT_ID,
      amount: content.price,
      destination: MERCHANT_ADDRESS,
      validUntil: Date.now() + 300000,
      resourceId: path,
    },
  };

  response.headers.set("PAYMENT-REQUIRED", btoa(JSON.stringify(payload)));

  return response;
}
