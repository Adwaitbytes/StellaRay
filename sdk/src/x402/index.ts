/**
 * x402 Payment Client
 *
 * Handles HTTP 402 Payment Required flows for Stellar payments.
 * Implements the x402 protocol for micropayments over HTTP.
 *
 * Protocol flow:
 * 1. Client makes request to protected resource
 * 2. Server returns 402 with PAYMENT-REQUIRED header
 * 3. Client parses payment requirement and executes payment
 * 4. Client retries request with PAYMENT header containing proof
 * 5. Server verifies payment and returns resource
 */

import type {
  X402PaymentRequired,
  X402PaymentProof,
  X402Scheme,
  X402Payload,
  StellarNetwork,
  TransactionResult,
} from "../types";
import { ZkLoginError, ErrorCode } from "../types";

export type { X402PaymentRequired as PaymentRequest };
export type { X402PaymentProof as PaymentResponse };

/**
 * x402 client configuration
 */
export interface X402Config {
  network: StellarNetwork;
  facilitatorAddress: string;
  autoPayThreshold?: string; // Auto-pay if amount below threshold
}

type SignFunction = (tx: string) => Promise<{ txXdr: string; signature: string }>;

/**
 * x402 Payment Client
 */
export class X402PaymentClient {
  private config: X402Config;
  private payerAddress?: string;
  private signTransaction?: SignFunction;

  constructor(config: X402Config) {
    this.config = {
      autoPayThreshold: "1000000", // 0.1 USDC default
      ...config,
    };
  }

  /**
   * Set the payer wallet for automatic payments
   */
  setPayerWallet(address: string, signFn: SignFunction): void {
    this.payerAddress = address;
    this.signTransaction = signFn;
  }

  /**
   * Parse a 402 response to extract payment requirements
   */
  parsePaymentRequired(response: Response): X402PaymentRequired | null {
    if (response.status !== 402) {
      return null;
    }

    const paymentHeader = response.headers.get("PAYMENT-REQUIRED");
    if (!paymentHeader) {
      return null;
    }

    try {
      // Header is Base64 encoded JSON
      const decoded = atob(paymentHeader);
      return JSON.parse(decoded) as X402PaymentRequired;
    } catch {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        "Invalid PAYMENT-REQUIRED header format"
      );
    }
  }

  /**
   * Execute a payment to satisfy an x402 requirement
   */
  async executePayment(
    request: X402PaymentRequired
  ): Promise<X402PaymentProof> {
    if (!this.payerAddress || !this.signTransaction) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        "Payer wallet not configured. Call setPayerWallet() first."
      );
    }

    // Validate request
    this.validatePaymentRequest(request);

    // Build payment transaction
    const txXdr = await this.buildPaymentTransaction(request.payload);

    // Sign transaction
    const { txXdr: signedTxXdr, signature } = await this.signTransaction(txXdr);

    // Submit transaction
    const result = await this.submitPaymentTransaction(signedTxXdr);

    if (!result.success) {
      throw new ZkLoginError(
        ErrorCode.PAYMENT_FAILED,
        "Payment transaction failed"
      );
    }

    return {
      transactionHash: result.hash,
      payer: this.payerAddress,
      timestamp: Date.now(),
    };
  }

  /**
   * Create the X-PAYMENT header value for a paid request
   */
  createPaymentHeader(proof: X402PaymentProof): string {
    const json = JSON.stringify(proof);
    return btoa(json);
  }

  /**
   * Fetch a resource with automatic x402 payment handling
   */
  async fetchWithPayment(url: string, options?: RequestInit): Promise<Response> {
    // First attempt
    let response = await fetch(url, options);

    // Check if payment required
    if (response.status !== 402) {
      return response;
    }

    const paymentRequest = this.parsePaymentRequired(response);
    if (!paymentRequest) {
      return response;
    }

    // Check if we should auto-pay
    if (!this.shouldAutoPay(paymentRequest)) {
      throw new ZkLoginError(
        ErrorCode.PAYMENT_REQUIRED,
        "Payment required and auto-pay threshold exceeded"
      );
    }

    // Execute payment
    const paymentProof = await this.executePayment(paymentRequest);

    // Retry with payment header
    const retryOptions: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        "X-PAYMENT": this.createPaymentHeader(paymentProof),
      },
    };

    return fetch(url, retryOptions);
  }

  /**
   * Check if a request requires payment
   */
  async checkPaymentRequired(url: string): Promise<X402PaymentRequired | null> {
    const response = await fetch(url, { method: "HEAD" });
    return this.parsePaymentRequired(response);
  }

  /**
   * Estimate the cost of a payment request
   */
  estimateCost(request: X402PaymentRequired): {
    asset: string;
    amount: string;
    fee: string;
    total: string;
  } {
    const amount = BigInt(request.payload.amount);
    const fee = BigInt(100); // Estimated network fee in stroops

    return {
      asset: request.payload.asset,
      amount: amount.toString(),
      fee: fee.toString(),
      total: (amount + fee).toString(),
    };
  }

  // Private methods

  private validatePaymentRequest(request: X402PaymentRequired): void {
    // Check version
    if (request.x402Version !== 1) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        `Unsupported x402 version: ${request.x402Version}`
      );
    }

    // Check scheme
    if (!["stellar-exact", "stellar-range"].includes(request.scheme)) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        `Unsupported payment scheme: ${request.scheme}`
      );
    }

    // Check network
    const expectedNetwork = `stellar:${this.config.network}`;
    if (request.network !== expectedNetwork) {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        `Network mismatch: expected ${expectedNetwork}, got ${request.network}`
      );
    }

    // Check expiration
    if (request.payload.validUntil < Date.now()) {
      throw new ZkLoginError(
        ErrorCode.PAYMENT_EXPIRED,
        "Payment request has expired"
      );
    }
  }

  private shouldAutoPay(request: X402PaymentRequired): boolean {
    if (!this.config.autoPayThreshold) {
      return false;
    }

    const amount = BigInt(request.payload.amount);
    const threshold = BigInt(this.config.autoPayThreshold);

    return amount <= threshold;
  }

  private async buildPaymentTransaction(payload: X402Payload): Promise<string> {
    // Build Soroban contract invocation for token transfer
    // This would use the Stellar SDK to construct the transaction

    const txData = {
      source: this.payerAddress,
      operations: [
        {
          type: "invokeHostFunction",
          contract: payload.asset,
          function: "transfer",
          args: [
            this.payerAddress,
            payload.destination,
            payload.amount,
          ],
        },
      ],
      memo: payload.memo || `x402:${payload.resourceId || "payment"}`,
    };

    // Serialize to XDR (simplified - actual implementation uses Stellar SDK)
    return btoa(JSON.stringify(txData));
  }

  private async submitPaymentTransaction(txXdr: string): Promise<TransactionResult> {
    // Submit to Stellar network
    // This would use the Stellar SDK to submit

    // Placeholder implementation
    return {
      hash: `tx_${Date.now().toString(16)}`,
      ledger: 0,
      success: true,
    };
  }
}

/**
 * Create a payment-required response (for server use)
 */
export function createPaymentRequiredResponse(
  asset: string,
  amount: string,
  destination: string,
  network: StellarNetwork,
  options?: {
    validUntil?: number;
    resourceId?: string;
    memo?: string;
  }
): Response {
  const payload: X402PaymentRequired = {
    x402Version: 1,
    scheme: "stellar-exact",
    network: `stellar:${network}`,
    payload: {
      asset,
      amount,
      destination,
      validUntil: options?.validUntil ?? Date.now() + 300000, // 5 minutes default
      resourceId: options?.resourceId,
      memo: options?.memo,
    },
  };

  const headers = new Headers();
  headers.set("PAYMENT-REQUIRED", btoa(JSON.stringify(payload)));
  headers.set("Content-Type", "application/json");

  return new Response(
    JSON.stringify({ error: "Payment Required", ...payload }),
    {
      status: 402,
      headers,
    }
  );
}
