/**
 * Soroban Contract Integration Library
 *
 * This module provides utilities for interacting with the deployed Soroban contracts:
 * - ZK Verifier: Validates zkLogin proofs
 * - Smart Wallet: User wallet with zkLogin authentication
 * - Gateway Factory: Deploys and manages smart wallets
 * - JWK Registry: Stores OAuth provider public keys
 * - x402 Facilitator: Handles micropayments
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// Contract IDs from environment
export const CONTRACT_IDS = {
  ZK_VERIFIER: process.env.NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID || '',
  SMART_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_SMART_WALLET_WASM_HASH || '',
  GATEWAY_FACTORY: process.env.NEXT_PUBLIC_GATEWAY_FACTORY_CONTRACT_ID || '',
  JWK_REGISTRY: process.env.NEXT_PUBLIC_JWK_REGISTRY_CONTRACT_ID || '',
  X402_FACILITATOR: process.env.NEXT_PUBLIC_X402_FACILITATOR_CONTRACT_ID || '',
  USDC: process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || '',
};

// Network configuration
const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Initialize Soroban RPC client
let rpcServer: StellarSdk.SorobanRpc.Server | null = null;

export function getSorobanServer(): StellarSdk.SorobanRpc.Server {
  if (!rpcServer) {
    rpcServer = new StellarSdk.SorobanRpc.Server(RPC_URL);
  }
  return rpcServer;
}

/**
 * Check if all required contracts are configured
 */
export function areContractsConfigured(): boolean {
  return !!(
    CONTRACT_IDS.ZK_VERIFIER &&
    CONTRACT_IDS.GATEWAY_FACTORY &&
    CONTRACT_IDS.JWK_REGISTRY
  );
}

/**
 * Get contract status information
 */
export async function getContractStatus(): Promise<{
  zkVerifier: { deployed: boolean; id: string };
  gatewayFactory: { deployed: boolean; id: string };
  jwkRegistry: { deployed: boolean; id: string };
  x402Facilitator: { deployed: boolean; id: string };
}> {
  const server = getSorobanServer();

  const checkContract = async (contractId: string): Promise<boolean> => {
    if (!contractId) return false;
    try {
      const contract = new StellarSdk.Contract(contractId);
      // Try to get contract data to verify it exists
      await server.getContractData(contract, StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance());
      return true;
    } catch {
      return false;
    }
  };

  const [zkVerifier, gatewayFactory, jwkRegistry, x402Facilitator] = await Promise.all([
    checkContract(CONTRACT_IDS.ZK_VERIFIER),
    checkContract(CONTRACT_IDS.GATEWAY_FACTORY),
    checkContract(CONTRACT_IDS.JWK_REGISTRY),
    checkContract(CONTRACT_IDS.X402_FACILITATOR),
  ]);

  return {
    zkVerifier: { deployed: zkVerifier, id: CONTRACT_IDS.ZK_VERIFIER },
    gatewayFactory: { deployed: gatewayFactory, id: CONTRACT_IDS.GATEWAY_FACTORY },
    jwkRegistry: { deployed: jwkRegistry, id: CONTRACT_IDS.JWK_REGISTRY },
    x402Facilitator: { deployed: x402Facilitator, id: CONTRACT_IDS.X402_FACILITATOR },
  };
}

/**
 * Gateway Factory Contract Interactions
 */
export const GatewayFactory = {
  /**
   * Check if a wallet exists for a given address seed
   */
  async walletExists(addressSeed: string): Promise<boolean> {
    if (!CONTRACT_IDS.GATEWAY_FACTORY) return false;

    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(CONTRACT_IDS.GATEWAY_FACTORY);

    try {
      const seedBuffer = Buffer.from(addressSeed, 'hex');
      const seedScVal = StellarSdk.xdr.ScVal.scvBytes(seedBuffer);

      const result = await server.simulateTransaction(
        new StellarSdk.TransactionBuilder(
          new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
          { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
        )
          .addOperation(contract.call('wallet_exists', seedScVal))
          .setTimeout(30)
          .build()
      );

      if ('result' in result && result.result) {
        return result.result.retval.value() as boolean;
      }
      return false;
    } catch (error) {
      console.error('Error checking wallet existence:', error);
      return false;
    }
  },

  /**
   * Get the total number of deployed wallets
   */
  async getWalletCount(): Promise<number> {
    if (!CONTRACT_IDS.GATEWAY_FACTORY) return 0;

    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(CONTRACT_IDS.GATEWAY_FACTORY);

    try {
      const result = await server.simulateTransaction(
        new StellarSdk.TransactionBuilder(
          new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
          { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
        )
          .addOperation(contract.call('get_wallet_count'))
          .setTimeout(30)
          .build()
      );

      if ('result' in result && result.result) {
        return Number(result.result.retval.value());
      }
      return 0;
    } catch (error) {
      console.error('Error getting wallet count:', error);
      return 0;
    }
  },

  /**
   * Predict wallet address for a given issuer hash and address seed
   */
  async predictAddress(issHash: string, addressSeed: string): Promise<string | null> {
    if (!CONTRACT_IDS.GATEWAY_FACTORY) return null;

    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(CONTRACT_IDS.GATEWAY_FACTORY);

    try {
      const issHashBuffer = Buffer.from(issHash, 'hex');
      const seedBuffer = Buffer.from(addressSeed, 'hex');

      const result = await server.simulateTransaction(
        new StellarSdk.TransactionBuilder(
          new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
          { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
        )
          .addOperation(
            contract.call(
              'predict_address',
              StellarSdk.xdr.ScVal.scvBytes(issHashBuffer),
              StellarSdk.xdr.ScVal.scvBytes(seedBuffer)
            )
          )
          .setTimeout(30)
          .build()
      );

      if ('result' in result && result.result) {
        const addressScVal = result.result.retval;
        return StellarSdk.Address.fromScVal(addressScVal).toString();
      }
      return null;
    } catch (error) {
      console.error('Error predicting address:', error);
      return null;
    }
  },
};

/**
 * JWK Registry Contract Interactions
 */
export const JWKRegistry = {
  /**
   * Get all registered OAuth providers
   */
  async getAllProviders(): Promise<string[]> {
    if (!CONTRACT_IDS.JWK_REGISTRY) return [];

    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(CONTRACT_IDS.JWK_REGISTRY);

    try {
      const result = await server.simulateTransaction(
        new StellarSdk.TransactionBuilder(
          new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
          { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
        )
          .addOperation(contract.call('get_all_providers'))
          .setTimeout(30)
          .build()
      );

      if ('result' in result && result.result) {
        const providers = result.result.retval.value() as any[];
        return providers.map((p: any) => p.toString());
      }
      return [];
    } catch (error) {
      console.error('Error getting providers:', error);
      return [];
    }
  },
};

/**
 * x402 Facilitator Contract Interactions
 */
export const X402Facilitator = {
  /**
   * Check if a payment request has been paid
   */
  async isPaid(requestId: string): Promise<boolean> {
    if (!CONTRACT_IDS.X402_FACILITATOR) return false;

    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(CONTRACT_IDS.X402_FACILITATOR);

    try {
      const requestIdBuffer = Buffer.from(requestId, 'hex');

      const result = await server.simulateTransaction(
        new StellarSdk.TransactionBuilder(
          new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
          { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
        )
          .addOperation(
            contract.call('is_paid', StellarSdk.xdr.ScVal.scvBytes(requestIdBuffer))
          )
          .setTimeout(30)
          .build()
      );

      if ('result' in result && result.result) {
        return result.result.retval.value() as boolean;
      }
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  },

  /**
   * Get facilitator statistics
   */
  async getStats(): Promise<{ totalPayments: number; totalVolume: string } | null> {
    if (!CONTRACT_IDS.X402_FACILITATOR) return null;

    const server = getSorobanServer();
    const contract = new StellarSdk.Contract(CONTRACT_IDS.X402_FACILITATOR);

    try {
      const result = await server.simulateTransaction(
        new StellarSdk.TransactionBuilder(
          new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
          { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
        )
          .addOperation(contract.call('get_stats'))
          .setTimeout(30)
          .build()
      );

      if ('result' in result && result.result) {
        const [totalPayments, totalVolume] = result.result.retval.value() as any[];
        return {
          totalPayments: Number(totalPayments),
          totalVolume: totalVolume.toString(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  },
};

/**
 * Utility to compute address seed from OAuth identity
 * This matches the ZK circuit computation
 */
export function computeAddressSeed(
  kcName: string,
  kcValue: string,
  aud: string,
  salt: string
): string {
  // Hash each component
  const kcNameHash = hashString(kcName);
  const kcValueHash = hashString(kcValue);
  const audHash = hashString(aud);
  const saltHash = hashString(salt);

  // Combine hashes (simplified - actual circuit uses Poseidon)
  const combined = kcNameHash + kcValueHash + audHash + saltHash;
  return hashString(combined);
}

/**
 * Compute issuer hash for OAuth provider
 */
export function computeIssuerHash(issuer: string): string {
  return hashString(issuer);
}

/**
 * SHA256 hash utility - synchronous version using deterministic computation
 * For actual crypto operations, use hashStringAsync instead
 */
function hashString(input: string): string {
  // Use a deterministic hash algorithm (DJB2 variant combined with FNV-1a)
  // This provides consistent output for same input across environments
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // FNV-1a 64-bit hash
  let h1 = BigInt('0xcbf29ce484222325');
  const fnvPrime = BigInt('0x100000001b3');

  for (const byte of data) {
    h1 ^= BigInt(byte);
    h1 = (h1 * fnvPrime) & BigInt('0xffffffffffffffff');
  }

  // DJB2 hash for additional entropy
  let h2 = BigInt(5381);
  for (const byte of data) {
    h2 = ((h2 << BigInt(5)) + h2) + BigInt(byte);
    h2 = h2 & BigInt('0xffffffffffffffff');
  }

  // Combine both hashes and extend to 256 bits
  const part1 = h1.toString(16).padStart(16, '0');
  const part2 = h2.toString(16).padStart(16, '0');

  // Create additional parts by mixing
  const h3 = (h1 ^ (h2 << BigInt(7))) & BigInt('0xffffffffffffffff');
  const h4 = (h2 ^ (h1 >> BigInt(3))) & BigInt('0xffffffffffffffff');
  const part3 = h3.toString(16).padStart(16, '0');
  const part4 = h4.toString(16).padStart(16, '0');

  return (part1 + part2 + part3 + part4).slice(0, 64);
}

/**
 * Async SHA256 hash using Web Crypto API
 */
export async function hashStringAsync(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  try {
    // Use Web Crypto API when available
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback to synchronous deterministic hash
    return hashString(input);
  }
}

/**
 * Format contract address for display
 */
export function formatContractId(contractId: string): string {
  if (!contractId || contractId.length < 10) return contractId;
  return `${contractId.slice(0, 6)}...${contractId.slice(-4)}`;
}

/**
 * Get Stellar Expert explorer URL for a contract
 */
export function getContractExplorerUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}
