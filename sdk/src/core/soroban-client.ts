/**
 * Soroban Smart Contract Client
 *
 * Provides a high-level interface for interacting with Soroban smart contracts.
 * Handles contract invocation, simulation, and transaction submission.
 */

import {
  XdrWriter,
  XdrReader,
  decodeStrKey,
  encodeSorobanValue,
  SorobanValue,
  NETWORK_PASSPHRASE,
  NetworkType,
  fromStroops,
} from "./stellar-xdr";

/**
 * Soroban RPC endpoints
 */
export const SOROBAN_RPC_URLS: Record<NetworkType, string> = {
  mainnet: "https://soroban-rpc.mainnet.stellar.gateway.fm",
  testnet: "https://soroban-testnet.stellar.org",
  futurenet: "https://rpc-futurenet.stellar.org",
  standalone: "http://localhost:8000/soroban/rpc",
};

/**
 * Horizon API endpoints
 */
export const HORIZON_URLS: Record<NetworkType, string> = {
  mainnet: "https://horizon.stellar.org",
  testnet: "https://horizon-testnet.stellar.org",
  futurenet: "https://horizon-futurenet.stellar.org",
  standalone: "http://localhost:8000",
};

/**
 * Contract invocation options
 */
export interface InvokeOptions {
  /** Source account address */
  source: string;
  /** Contract address */
  contract: string;
  /** Function name to call */
  function: string;
  /** Function arguments */
  args: SorobanValue[];
  /** Whether this is a read-only simulation */
  simulate?: boolean;
  /** Custom fee (in stroops) */
  fee?: number;
  /** Transaction memo */
  memo?: string;
}

/**
 * Simulation result
 */
export interface SimulationResult {
  /** Whether simulation succeeded */
  success: boolean;
  /** Return value from contract */
  result?: SorobanValue;
  /** Estimated resource usage */
  resources?: {
    cpuInstructions: number;
    memoryBytes: number;
    ledgerReadBytes: number;
    ledgerWriteBytes: number;
  };
  /** Estimated fee (in stroops) */
  minResourceFee?: number;
  /** Error message if failed */
  error?: string;
  /** Transaction data for submission */
  transactionData?: string;
  /** Required authorizations */
  auth?: SorobanAuth[];
}

/**
 * Soroban authorization entry
 */
export interface SorobanAuth {
  addressCredentials: {
    address: string;
    nonce: bigint;
    signatureExpirationLedger: number;
  };
  rootInvocation: {
    contractAddress: string;
    functionName: string;
    args: SorobanValue[];
    subInvocations: unknown[];
  };
}

/**
 * Transaction submission result
 */
export interface SubmissionResult {
  /** Transaction hash */
  hash: string;
  /** Whether transaction succeeded */
  success: boolean;
  /** Ledger sequence where included */
  ledger?: number;
  /** Return value from contract */
  result?: SorobanValue;
  /** Error message if failed */
  error?: string;
}

/**
 * Account info
 */
export interface AccountInfo {
  /** Account address */
  address: string;
  /** Sequence number */
  sequence: bigint;
  /** Native balance (XLM) */
  balance: string;
  /** Number of subentries */
  subentryCount: number;
}

/**
 * Ledger entry (contract data, account, etc.)
 */
export interface LedgerEntry {
  key: string;
  value: SorobanValue;
  expirationLedger?: number;
}

/**
 * Soroban Client for smart contract interactions
 */
export class SorobanClient {
  private network: NetworkType;
  private rpcUrl: string;
  private horizonUrl: string;

  constructor(
    network: NetworkType = "testnet",
    options?: { rpcUrl?: string; horizonUrl?: string }
  ) {
    this.network = network;
    this.rpcUrl = options?.rpcUrl || SOROBAN_RPC_URLS[network];
    this.horizonUrl = options?.horizonUrl || HORIZON_URLS[network];
  }

  /**
   * Get network passphrase
   */
  getNetworkPassphrase(): string {
    return NETWORK_PASSPHRASE[this.network];
  }

  /**
   * Make a JSON-RPC request to Soroban RPC
   */
  private async rpcRequest<T>(method: string, params?: unknown): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "RPC request failed");
    }

    return data.result;
  }

  /**
   * Get account info from Horizon
   */
  async getAccount(address: string): Promise<AccountInfo> {
    const response = await fetch(`${this.horizonUrl}/accounts/${address}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Account not found");
      }
      throw new Error(`Horizon error: ${response.statusText}`);
    }

    const data = await response.json();
    const nativeBalance = data.balances.find(
      (b: { asset_type: string }) => b.asset_type === "native"
    );

    return {
      address: data.account_id,
      sequence: BigInt(data.sequence),
      balance: nativeBalance?.balance || "0",
      subentryCount: data.subentry_count,
    };
  }

  /**
   * Get current ledger sequence
   */
  async getLatestLedger(): Promise<{ sequence: number; closeTime: number }> {
    const result = await this.rpcRequest<{
      id: string;
      protocolVersion: number;
      sequence: number;
    }>("getLatestLedger");

    return {
      sequence: result.sequence,
      closeTime: Date.now(), // Approximate
    };
  }

  /**
   * Get health status of RPC server
   */
  async getHealth(): Promise<{ status: string }> {
    return this.rpcRequest("getHealth");
  }

  /**
   * Simulate a contract invocation
   */
  async simulateTransaction(options: InvokeOptions): Promise<SimulationResult> {
    try {
      // Build the transaction XDR for simulation
      const txXdr = await this.buildInvokeTransaction(options);

      const result = await this.rpcRequest<{
        transactionData?: string;
        minResourceFee?: string;
        results?: Array<{
          auth?: unknown[];
          xdr: string;
        }>;
        cost?: {
          cpuInsns: string;
          memBytes: string;
        };
        error?: string;
      }>("simulateTransaction", {
        transaction: txXdr,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        result: result.results?.[0]
          ? this.parseXdrResult(result.results[0].xdr)
          : undefined,
        resources: result.cost
          ? {
              cpuInstructions: parseInt(result.cost.cpuInsns, 10),
              memoryBytes: parseInt(result.cost.memBytes, 10),
              ledgerReadBytes: 0,
              ledgerWriteBytes: 0,
            }
          : undefined,
        minResourceFee: result.minResourceFee
          ? parseInt(result.minResourceFee, 10)
          : undefined,
        transactionData: result.transactionData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Simulation failed",
      };
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(txXdr: string): Promise<SubmissionResult> {
    try {
      const result = await this.rpcRequest<{
        hash: string;
        status: string;
        errorResultXdr?: string;
      }>("sendTransaction", {
        transaction: txXdr,
      });

      if (result.status === "ERROR") {
        return {
          hash: result.hash,
          success: false,
          error: result.errorResultXdr || "Transaction failed",
        };
      }

      // Poll for transaction result
      return this.waitForTransaction(result.hash);
    } catch (error) {
      return {
        hash: "",
        success: false,
        error: error instanceof Error ? error.message : "Submission failed",
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransaction(
    hash: string,
    maxAttempts: number = 30
  ): Promise<SubmissionResult> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.rpcRequest<{
          status: string;
          ledger?: number;
          resultXdr?: string;
          resultMetaXdr?: string;
        }>("getTransaction", { hash });

        if (result.status === "SUCCESS") {
          return {
            hash,
            success: true,
            ledger: result.ledger,
            result: result.resultXdr
              ? this.parseXdrResult(result.resultXdr)
              : undefined,
          };
        }

        if (result.status === "FAILED") {
          return {
            hash,
            success: false,
            ledger: result.ledger,
            error: "Transaction failed",
          };
        }

        // Still pending, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      hash,
      success: false,
      error: "Transaction confirmation timeout",
    };
  }

  /**
   * Build a contract transaction with simulation data
   * This is used after simulation to build a fully prepared transaction
   */
  async buildContractTransaction(options: {
    source: string;
    contract: string;
    function: string;
    args: SorobanValue[];
    simulationResult: SimulationResult;
  }): Promise<string> {
    // Build the base transaction
    const baseTx = await this.buildInvokeTransaction({
      source: options.source,
      contract: options.contract,
      function: options.function,
      args: options.args,
      fee: options.simulationResult.minResourceFee || 100000,
    });

    // In a full implementation, we would merge the simulation's
    // transactionData (footprint, auth) into the transaction.
    // For now, we return the prepared transaction with updated fee.
    return baseTx;
  }

  /**
   * Read contract data
   */
  async getContractData(
    contractId: string,
    key: SorobanValue,
    durability: "persistent" | "temporary" = "persistent"
  ): Promise<LedgerEntry | null> {
    try {
      const result = await this.rpcRequest<{
        entries?: Array<{
          key: string;
          xdr: string;
          liveUntilLedgerSeq?: number;
        }>;
      }>("getLedgerEntries", {
        keys: [this.buildLedgerKey(contractId, key, durability)],
      });

      if (!result.entries || result.entries.length === 0) {
        return null;
      }

      const entry = result.entries[0];
      return {
        key: entry.key,
        value: this.parseXdrResult(entry.xdr),
        expirationLedger: entry.liveUntilLedgerSeq,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get contract WASM code
   */
  async getContractCode(contractId: string): Promise<Uint8Array | null> {
    try {
      // First get the contract instance to find the WASM hash
      const instance = await this.getContractData(contractId, {
        type: "symbol",
        value: "INSTANCE",
      });

      if (!instance) {
        return null;
      }

      // Then fetch the WASM code by hash
      // This is simplified - actual implementation would parse the instance data
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Call a view function (read-only, no transaction)
   */
  async callView(
    contract: string,
    functionName: string,
    args: SorobanValue[] = []
  ): Promise<SorobanValue | null> {
    const simulation = await this.simulateTransaction({
      source: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", // Dummy source
      contract,
      function: functionName,
      args,
      simulate: true,
    });

    if (!simulation.success) {
      throw new Error(simulation.error || "View call failed");
    }

    return simulation.result || null;
  }

  /**
   * Build a contract invocation transaction
   */
  private async buildInvokeTransaction(options: InvokeOptions): Promise<string> {
    // Get account info for sequence number
    let sequence: bigint;
    try {
      const account = await this.getAccount(options.source);
      sequence = account.sequence + 1n;
    } catch {
      sequence = 1n; // New account
    }

    // Build transaction envelope
    const writer = new XdrWriter();

    // Transaction envelope type
    writer.writeInt32(2); // ENVELOPE_TYPE_TX

    // Source account
    const sourceData = decodeStrKey(options.source).data;
    writer.writeInt32(0); // MuxedAccount type = KEY_TYPE_ED25519
    writer.writeRaw(sourceData);

    // Fee
    writer.writeUint32(options.fee || 100000);

    // Sequence number
    writer.writeInt64(sequence);

    // Preconditions (none)
    writer.writeInt32(0); // PRECOND_NONE

    // Memo
    if (options.memo) {
      writer.writeInt32(1); // MEMO_TEXT
      writer.writeString(options.memo);
    } else {
      writer.writeInt32(0); // MEMO_NONE
    }

    // Operations (single invoke host function)
    writer.writeInt32(1); // Number of operations

    // Operation source (none, use tx source)
    writer.writeBool(false);

    // Operation type: INVOKE_HOST_FUNCTION
    writer.writeInt32(24);

    // Host function type: INVOKE_CONTRACT
    writer.writeInt32(0);

    // Contract address
    const contractData = decodeStrKey(options.contract).data;
    writer.writeInt32(1); // SC_ADDRESS_TYPE_CONTRACT
    writer.writeRaw(contractData);

    // Function name
    writer.writeString(options.function);

    // Arguments
    writer.writeInt32(options.args.length);
    for (const arg of options.args) {
      encodeSorobanValue(writer, arg);
    }

    // Auth (empty for simulation)
    writer.writeInt32(0);

    // Ext
    writer.writeInt32(0);

    // Signatures (empty for simulation)
    writer.writeInt32(0);

    return writer.toBase64();
  }

  /**
   * Build a ledger key for contract data lookup
   */
  private buildLedgerKey(
    contractId: string,
    key: SorobanValue,
    durability: "persistent" | "temporary"
  ): string {
    const writer = new XdrWriter();

    // LedgerKey type: CONTRACT_DATA
    writer.writeInt32(6);

    // Contract address
    const contractData = decodeStrKey(contractId).data;
    writer.writeInt32(1); // SC_ADDRESS_TYPE_CONTRACT
    writer.writeRaw(contractData);

    // Key
    encodeSorobanValue(writer, key);

    // Durability
    writer.writeInt32(durability === "persistent" ? 1 : 0);

    return writer.toBase64();
  }

  /**
   * Parse XDR-encoded result
   */
  private parseXdrResult(xdr: string): SorobanValue {
    // Simplified parsing - actual implementation would fully decode XDR
    try {
      const reader = new XdrReader(xdr);
      return this.readSorobanValue(reader);
    } catch {
      return { type: "bytes", value: new Uint8Array(0) };
    }
  }

  /**
   * Read a Soroban value from XDR
   */
  private readSorobanValue(reader: XdrReader): SorobanValue {
    const type = reader.readInt32();

    switch (type) {
      case 0: // SCV_BOOL false
        return { type: "bool", value: false };
      case 1: // SCV_BOOL true
        return { type: "bool", value: true };
      case 5: // SCV_U64
        return { type: "u64", value: reader.readUint64() };
      case 6: // SCV_I64
        return { type: "i64", value: reader.readUint64() };
      case 9: // SCV_U128
        return {
          type: "u128",
          value: (reader.readUint64() << 64n) | reader.readUint64(),
        };
      case 10: // SCV_I128
        return {
          type: "i128",
          value: (reader.readUint64() << 64n) | reader.readUint64(),
        };
      case 13: // SCV_STRING
        return { type: "string", value: reader.readString() };
      case 14: // SCV_BYTES
        return { type: "bytes", value: reader.readVarOpaque() };
      case 15: // SCV_SYMBOL
        return { type: "symbol", value: reader.readString() };
      default:
        // Return as bytes for unknown types
        return { type: "bytes", value: new Uint8Array(0) };
    }
  }

  /**
   * Estimate resources for a contract call
   */
  async estimateResources(options: InvokeOptions): Promise<{
    fee: string;
    cpuInstructions: number;
    memoryBytes: number;
  }> {
    const simulation = await this.simulateTransaction(options);

    if (!simulation.success) {
      throw new Error(simulation.error || "Resource estimation failed");
    }

    return {
      fee: fromStroops(BigInt(simulation.minResourceFee || 100000)),
      cpuInstructions: simulation.resources?.cpuInstructions || 0,
      memoryBytes: simulation.resources?.memoryBytes || 0,
    };
  }
}

/**
 * Create a typed contract client
 */
export function createContractClient<T extends Record<string, (...args: unknown[]) => Promise<unknown>>>(
  contractId: string,
  abi: {
    [K in keyof T]: {
      args: Array<{ name: string; type: string }>;
      returns: string;
    };
  },
  sorobanClient: SorobanClient
): T {
  const client = {} as T;

  for (const [methodName, methodAbi] of Object.entries(abi)) {
    (client as Record<string, unknown>)[methodName] = async (...args: unknown[]) => {
      // Convert args to SorobanValues based on ABI
      const sorobanArgs = args.map((arg, i) => {
        const argType = methodAbi.args[i]?.type || "bytes";
        return convertToSorobanValue(arg, argType);
      });

      const result = await sorobanClient.callView(
        contractId,
        methodName,
        sorobanArgs
      );

      return result;
    };
  }

  return client;
}

/**
 * Convert JavaScript value to SorobanValue
 */
function convertToSorobanValue(value: unknown, type: string): SorobanValue {
  switch (type) {
    case "bool":
      return { type: "bool", value: Boolean(value) };
    case "i64":
      return { type: "i64", value: BigInt(value as number | string | bigint) };
    case "u64":
      return { type: "u64", value: BigInt(value as number | string | bigint) };
    case "i128":
      return { type: "i128", value: BigInt(value as number | string | bigint) };
    case "u128":
      return { type: "u128", value: BigInt(value as number | string | bigint) };
    case "address":
      return { type: "address", value: String(value) };
    case "string":
      return { type: "string", value: String(value) };
    case "symbol":
      return { type: "symbol", value: String(value) };
    case "bytes":
      return {
        type: "bytes",
        value: value instanceof Uint8Array ? value : new TextEncoder().encode(String(value)),
      };
    default:
      return { type: "bytes", value: new Uint8Array(0) };
  }
}
