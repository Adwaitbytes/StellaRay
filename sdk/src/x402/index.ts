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
    const { txXdr: signedTxXdr } = await this.signTransaction(txXdr);

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
    const {
      TransactionBuilder,
      Networks,
      Operation,
      Asset,
      Memo,
      Account,
      Horizon,
    } = await import("@stellar/stellar-sdk");

    // Determine network passphrase
    const networkPassphrase = this.config.network === "mainnet"
      ? Networks.PUBLIC
      : Networks.TESTNET;

    // Get Horizon URL
    const horizonUrl = this.config.network === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";

    // Get account info
    const server = new Horizon.Server(horizonUrl);
    let account: InstanceType<typeof Account>;

    try {
      const accountData = await server.loadAccount(this.payerAddress!);
      account = accountData;
    } catch {
      throw new ZkLoginError(
        ErrorCode.INVALID_INPUT,
        "Payer account not found on network"
      );
    }

    // Check if it's native XLM or a token contract
    const isNative = payload.asset === "native" || payload.asset === "XLM";

    let builder = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase,
    });

    if (isNative) {
      // Native XLM payment
      builder = builder.addOperation(
        Operation.payment({
          destination: payload.destination,
          asset: Asset.native(),
          amount: payload.amount,
        })
      );
    } else {
      // Soroban token transfer
      builder = builder.addOperation(
        Operation.invokeHostFunction({
          func: {
            type: "invokeContract",
            contractAddress: payload.asset,
            functionName: "transfer",
            args: [
              { type: "address", value: this.payerAddress },
              { type: "address", value: payload.destination },
              { type: "i128", value: payload.amount },
            ],
          } as any,
          auth: [],
        })
      );
    }

    // Add memo
    const memoText = payload.memo || `x402:${payload.resourceId || "payment"}`;
    builder = builder.addMemo(Memo.text(memoText.slice(0, 28)));

    // Set timeout
    builder = builder.setTimeout(300);

    // Build and return XDR
    const tx = builder.build();
    return tx.toXDR();
  }

  private async submitPaymentTransaction(txXdr: string): Promise<TransactionResult> {
    const { Horizon } = await import("@stellar/stellar-sdk");

    // Get Horizon URL
    const horizonUrl = this.config.network === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";

    const server = new Horizon.Server(horizonUrl);

    try {
      // Submit signed transaction
      const result = await server.submitTransaction(txXdr as any);

      return {
        hash: result.hash,
        ledger: result.ledger,
        success: true,
      };
    } catch (error: any) {
      // Check for specific error types
      if (error?.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        throw new ZkLoginError(
          ErrorCode.TRANSACTION_FAILED,
          `Transaction failed: ${JSON.stringify(codes)}`
        );
      }

      throw new ZkLoginError(
        ErrorCode.TRANSACTION_FAILED,
        error?.message || "Transaction submission failed"
      );
    }
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
