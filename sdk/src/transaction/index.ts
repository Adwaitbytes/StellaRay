/**
 * Transaction Builder
 *
 * Builds and submits Stellar/Soroban transactions for zkLogin wallets.
 */

import type {
  StellarNetwork,
  TransactionResult,
  Groth16Proof,
  ZkLoginPublicInputs,
} from "../types";
import { ZkLoginError, ErrorCode } from "../types";

/**
 * Transaction builder configuration
 */
export interface TransactionBuilderConfig {
  network: StellarNetwork;
  rpcUrl: string;
  horizonUrl: string;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  sourceAddress: string;
  operations: Operation[];
  memo?: string;
  fee?: number;
  timeout?: number;
}

/**
 * Session registration parameters
 */
export interface SessionRegistrationParams {
  walletAddress: string;
  proof: Groth16Proof;
  publicInputs: ZkLoginPublicInputs;
  ephemeralPublicKey: string;
  maxEpoch: number;
}

/**
 * Signed transaction
 */
export interface SignedTransaction {
  txXdr: string;
  signature: string;
  sessionId: string;
}

/**
 * Generic operation type (simplified)
 */
export interface Operation {
  type: string;
  [key: string]: unknown;
}

/**
 * Network passphrase mapping
 */
const NETWORK_PASSPHRASES: Record<StellarNetwork, string> = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
  standalone: "Standalone Network ; February 2017",
};

/**
 * Transaction builder for zkLogin wallets
 */
export class TransactionBuilder {
  private config: TransactionBuilderConfig;

  constructor(config: TransactionBuilderConfig) {
    this.config = config;
  }

  /**
   * Get current ledger sequence
   */
  async getCurrentLedger(): Promise<number> {
    try {
      const response = await fetch(`${this.config.horizonUrl}/ledgers?order=desc&limit=1`);

      if (!response.ok) {
        throw new Error(`Horizon error: ${response.statusText}`);
      }

      const data = await response.json();
      return data._embedded.records[0].sequence;
    } catch (error) {
      throw new ZkLoginError(
        ErrorCode.NETWORK_ERROR,
        "Failed to get current ledger",
        error as Error
      );
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      return this.getTokenBalance(address, tokenAddress);
    }

    try {
      const response = await fetch(`${this.config.horizonUrl}/accounts/${address}`);

      if (!response.ok) {
        if (response.status === 404) {
          return "0";
        }
        throw new Error(`Horizon error: ${response.statusText}`);
      }

      const data = await response.json();
      const nativeBalance = data.balances.find(
        (b: { asset_type: string }) => b.asset_type === "native"
      );

      return nativeBalance?.balance ?? "0";
    } catch (error) {
      throw new ZkLoginError(
        ErrorCode.NETWORK_ERROR,
        "Failed to get balance",
        error as Error
      );
    }
  }

  /**
   * Get token balance from Soroban contract
   */
  private async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      const response = await fetch(this.config.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "simulateTransaction",
          params: {
            transaction: this.buildBalanceQuery(address, tokenAddress),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        return "0";
      }

      // Parse balance from simulation result
      const result = data.result?.results?.[0]?.xdr;
      if (!result) {
        return "0";
      }

      // Decode XDR and extract balance (simplified)
      return this.parseBalanceResult(result);
    } catch (error) {
      throw new ZkLoginError(
        ErrorCode.RPC_ERROR,
        "Failed to get token balance",
        error as Error
      );
    }
  }

  /**
   * Build a transaction using Stellar SDK
   */
  async buildTransaction(options: TransactionOptions): Promise<string> {
    const {
      TransactionBuilder: StellarTxBuilder,
      Operation,
      Asset,
      Memo,
      Account,
    } = await import("@stellar/stellar-sdk");

    // Get account info
    const response = await fetch(`${this.config.horizonUrl}/accounts/${options.sourceAddress}`);
    let account: InstanceType<typeof Account>;

    if (response.ok) {
      const accountData = await response.json();
      account = new Account(options.sourceAddress, accountData.sequence);
    } else {
      // New account, use sequence 0
      account = new Account(options.sourceAddress, "0");
    }

    // Get network passphrase
    const networkPassphrase = NETWORK_PASSPHRASES[this.config.network];

    // Build transaction
    let builder = new StellarTxBuilder(account, {
      fee: String(options.fee ?? 100),
      networkPassphrase,
    });

    // Add operations
    for (const op of options.operations) {
      if (op.type === "payment") {
        builder = builder.addOperation(
          Operation.payment({
            destination: op.destination as string,
            asset: op.asset === "native" ? Asset.native() : new Asset(op.assetCode as string, op.assetIssuer as string),
            amount: op.amount as string,
          })
        );
      } else if (op.type === "invokeHostFunction") {
        // For Soroban operations, we need to use invokeContractFunction
        // This is a simplified version - full implementation would use Soroban SDK
        builder = builder.addOperation(
          Operation.invokeHostFunction({
            func: {
              type: "invokeContract",
              contractAddress: op.contract as string,
              functionName: op.function as string,
              args: op.args as unknown[],
            } as any,
            auth: [],
          })
        );
      }
    }

    // Add memo if provided
    if (options.memo) {
      builder = builder.addMemo(Memo.text(options.memo));
    }

    // Set timeout
    builder = builder.setTimeout(options.timeout ?? 300);

    // Build and return XDR
    const tx = builder.build();
    return tx.toXDR();
  }

  /**
   * Build session registration transaction
   */
  async buildSessionRegistration(
    params: SessionRegistrationParams
  ): Promise<string> {
    const operation: Operation = {
      type: "invokeHostFunction",
      contract: params.walletAddress,
      function: "add_session",
      args: [
        // Proof argument
        {
          a: params.proof.a,
          b: params.proof.b,
          c: params.proof.c,
        },
        // Public inputs
        {
          eph_pk_hash: params.publicInputs.ephPkHash,
          max_epoch: params.publicInputs.maxEpoch,
          address_seed: params.publicInputs.addressSeed,
          iss_hash: params.publicInputs.issHash,
          jwk_modulus_hash: params.publicInputs.jwkModulusHash,
        },
        // Ephemeral public key
        params.ephemeralPublicKey,
        // Max epoch
        params.maxEpoch,
      ],
    };

    return this.buildTransaction({
      sourceAddress: params.walletAddress,
      operations: [operation],
      memo: "zkLogin session registration",
    });
  }

  /**
   * Build token transfer transaction
   */
  async buildTransfer(
    sourceAddress: string,
    tokenAddress: string,
    destination: string,
    amount: string
  ): Promise<string> {
    const operation: Operation = {
      type: "invokeHostFunction",
      contract: tokenAddress,
      function: "transfer",
      args: [sourceAddress, destination, amount],
    };

    return this.buildTransaction({
      sourceAddress,
      operations: [operation],
      memo: "zkLogin transfer",
    });
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(signedTx: string | SignedTransaction): Promise<TransactionResult> {
    const txXdr = typeof signedTx === "string" ? signedTx : signedTx.txXdr;

    try {
      const response = await fetch(this.config.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "sendTransaction",
          params: {
            transaction: txXdr,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Transaction failed");
      }

      // Poll for transaction completion
      return this.waitForTransaction(data.result.hash);
    } catch (error) {
      throw new ZkLoginError(
        ErrorCode.TRANSACTION_FAILED,
        "Transaction submission failed",
        error as Error
      );
    }
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransaction(
    hash: string,
    maxAttempts: number = 30
  ): Promise<TransactionResult> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(this.config.rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: { hash },
          }),
        });

        const data = await response.json();

        if (data.result?.status === "SUCCESS") {
          return {
            hash,
            ledger: data.result.ledger,
            success: true,
            resultXdr: data.result.resultXdr,
          };
        }

        if (data.result?.status === "FAILED") {
          return {
            hash,
            ledger: data.result.ledger,
            success: false,
            resultXdr: data.result.resultXdr,
          };
        }

        // Not found yet, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new ZkLoginError(
      ErrorCode.TRANSACTION_FAILED,
      "Transaction confirmation timeout"
    );
  }

  /**
   * Build balance query transaction for simulation
   */
  private buildBalanceQuery(address: string, tokenAddress: string): string {
    const tx = {
      source: address,
      operations: [
        {
          type: "invokeHostFunction",
          contract: tokenAddress,
          function: "balance",
          args: [address],
        },
      ],
    };

    return btoa(JSON.stringify(tx));
  }

  /**
   * Parse balance from simulation result
   */
  private parseBalanceResult(xdr: string): string {
    // Simplified - actual implementation would decode XDR
    try {
      const decoded = atob(xdr);
      const parsed = JSON.parse(decoded);
      return parsed.value?.toString() ?? "0";
    } catch {
      return "0";
    }
  }
}
