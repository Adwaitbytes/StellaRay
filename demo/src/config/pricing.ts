/**
 * Stellaray Pricing & Revenue Configuration
 *
 * Three tiers: Free, Pro, Business
 * Revenue sources: Transaction fees, subscriptions, ZK proof usage
 */

export const PRICING = {
  // ========================================
  // TIER DEFINITIONS
  // ========================================
  TIERS: {
    FREE: {
      id: "free",
      name: "Free",
      price: 0,
      priceYearly: 0,
      description: "Get started with zero-knowledge wallets",
      features: [
        "1 wallet",
        "10 transactions/day",
        "Basic ZK proofs",
        "Testnet access",
        "Community support",
      ],
      limits: {
        wallets: 1,
        txPerDay: 10,
        zkProofsPerMonth: 20,
        streamingPayments: false,
        paymentLinks: 5,
        apiAccess: false,
        mainnet: false,
        prioritySupport: false,
        analytics: false,
        customBranding: false,
      },
    },
    PRO: {
      id: "pro",
      name: "Pro",
      price: 9,
      priceYearly: 89,
      description: "For power users and builders",
      badge: "POPULAR",
      features: [
        "Unlimited wallets",
        "Unlimited transactions",
        "All ZK proof types",
        "Mainnet access",
        "Streaming payments",
        "50 payment links",
        "Priority support",
        "Basic analytics",
      ],
      limits: {
        wallets: -1, // unlimited
        txPerDay: -1,
        zkProofsPerMonth: 500,
        streamingPayments: true,
        paymentLinks: 50,
        apiAccess: false,
        mainnet: true,
        prioritySupport: true,
        analytics: true,
        customBranding: false,
      },
    },
    BUSINESS: {
      id: "business",
      name: "Business",
      price: 49,
      priceYearly: 469,
      description: "For teams and enterprises",
      badge: "BEST VALUE",
      features: [
        "Everything in Pro",
        "SDK API access",
        "White-label option",
        "Custom branding",
        "Unlimited ZK proofs",
        "Unlimited payment links",
        "Advanced analytics",
        "Dedicated support",
        "SLA guarantee",
      ],
      limits: {
        wallets: -1,
        txPerDay: -1,
        zkProofsPerMonth: -1,
        streamingPayments: true,
        paymentLinks: -1,
        apiAccess: true,
        mainnet: true,
        prioritySupport: true,
        analytics: true,
        customBranding: true,
      },
    },
  },

  // ========================================
  // TRANSACTION FEES
  // ========================================
  FEES: {
    /** Fee on payment links (percentage) */
    PAYMENT_LINK_FEE: 0.003, // 0.3%

    /** Fee on streaming payments (percentage) */
    STREAMING_FEE: 0.001, // 0.1%

    /** Fee on cross-border transfers (percentage) */
    TRANSFER_FEE: 0.005, // 0.5%

    /** Minimum fee in XLM */
    MIN_FEE_XLM: 0.01,

    /** Maximum fee in XLM */
    MAX_FEE_XLM: 100,

    /** Fee collection wallet address */
    FEE_COLLECTOR: "STELLARAY_FEE_COLLECTOR_ADDRESS",
  },

  // ========================================
  // ZK PROOF PRICING (Pay-per-use beyond tier limits)
  // ========================================
  ZK_PROOF_PRICING: {
    SOLVENCY: 0.05, // $0.05 per proof
    IDENTITY: 0.10,
    ELIGIBILITY: 0.15,
    HISTORY: 0.10,
    CUSTOM: 0.50,
  },
} as const;

export type TierKey = keyof typeof PRICING.TIERS;
export type Tier = (typeof PRICING.TIERS)[TierKey];

/** Calculate transaction fee */
export function calculateFee(
  amount: number,
  type: "payment_link" | "streaming" | "transfer"
): number {
  const feeRate =
    type === "payment_link"
      ? PRICING.FEES.PAYMENT_LINK_FEE
      : type === "streaming"
      ? PRICING.FEES.STREAMING_FEE
      : PRICING.FEES.TRANSFER_FEE;

  const fee = amount * feeRate;
  return Math.max(PRICING.FEES.MIN_FEE_XLM, Math.min(fee, PRICING.FEES.MAX_FEE_XLM));
}
