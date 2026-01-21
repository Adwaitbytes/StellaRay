/**
 * Default configuration for Stellar zkLogin Gateway SDK
 *
 * Pre-configured contract addresses for testnet and mainnet deployments.
 */

import type { StellarNetwork, ContractAddresses } from "../types";

/**
 * Default testnet contract addresses (deployed January 2026)
 */
export const TESTNET_CONTRACTS: ContractAddresses = {
  zkVerifier: "CAQISC6MBAMGSAVRPRO2GZ3WPDREZW72XDPCHTF2DFUDE45YFIHEIH56",
  smartWalletWasmHash: "3747d3dfab113f7c16ae435556e267de66cec574523c6c8629989bc5a7d37cd8",
  gatewayFactory: "CD62OWXRDPTQ3YHYSSFV7WCAJQU7F4RCEW7XMSMP46POCJ6DBA7D7EZR",
  jwkRegistry: "CC3AVC4YGWMDYRJLQBXNUXQF3BF6TXDDDJ4SNSDMHVUCRAJIJGNWCHKN",
  x402Facilitator: "CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ",
};

/**
 * Default mainnet contract addresses (after Jan 22, 2026)
 */
export const MAINNET_CONTRACTS: ContractAddresses = {
  zkVerifier: "",  // To be deployed
  smartWalletWasmHash: "",
  gatewayFactory: "",
  jwkRegistry: "",
  x402Facilitator: "",
};

/**
 * Default RPC URLs by network
 */
export const DEFAULT_RPC_URLS: Record<StellarNetwork, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban.stellar.org",
  futurenet: "https://rpc-futurenet.stellar.org",
  standalone: "http://localhost:8000/soroban/rpc",
};

/**
 * Default Horizon URLs by network
 */
export const DEFAULT_HORIZON_URLS: Record<StellarNetwork, string> = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
  futurenet: "https://horizon-futurenet.stellar.org",
  standalone: "http://localhost:8000",
};

/**
 * Default prover service URL
 */
export const DEFAULT_PROVER_URL = "https://prover.zklogin.stellar.org";

/**
 * Default salt service URL
 */
export const DEFAULT_SALT_SERVICE_URL = "https://salt.zklogin.stellar.org";

/**
 * Get default contracts for a network
 */
export function getDefaultContracts(network: StellarNetwork): ContractAddresses {
  switch (network) {
    case "mainnet":
      return MAINNET_CONTRACTS;
    case "testnet":
    default:
      return TESTNET_CONTRACTS;
  }
}

/**
 * Get default configuration for a network
 */
export function getDefaultConfig(network: StellarNetwork = "testnet") {
  return {
    network,
    rpcUrl: DEFAULT_RPC_URLS[network],
    horizonUrl: DEFAULT_HORIZON_URLS[network],
    proverUrl: DEFAULT_PROVER_URL,
    saltServiceUrl: DEFAULT_SALT_SERVICE_URL,
    contracts: getDefaultContracts(network),
  };
}
