import { NextResponse } from "next/server";

// Stellar network URLs
const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";

// Contract IDs
const ZK_VERIFIER_CONTRACT = process.env.NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID || "";
const GATEWAY_FACTORY_CONTRACT = process.env.NEXT_PUBLIC_GATEWAY_FACTORY_CONTRACT_ID || "";

// Check if Soroban RPC is healthy
async function checkSorobanHealth(): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();
  try {
    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      }),
    });

    const latency = Date.now() - start;
    if (!response.ok) return { healthy: false, latency };

    const data = await response.json();
    return { healthy: data.result?.status === "healthy", latency };
  } catch (error) {
    return { healthy: false, latency: Date.now() - start };
  }
}

// Check Horizon health
async function checkHorizonHealth(): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();
  try {
    const response = await fetch(`${HORIZON_URL}/`);
    const latency = Date.now() - start;
    return { healthy: response.ok, latency };
  } catch (error) {
    return { healthy: false, latency: Date.now() - start };
  }
}

// Get network info from Horizon
async function getNetworkInfo() {
  try {
    const response = await fetch(`${HORIZON_URL}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

// Get latest ledger info
async function getLatestLedger() {
  try {
    const response = await fetch(`${HORIZON_URL}/ledgers?order=desc&limit=1`);
    if (!response.ok) return null;
    const data = await response.json();
    return data._embedded?.records?.[0] || null;
  } catch (error) {
    return null;
  }
}

// Check if a contract exists
async function checkContractExists(contractId: string): Promise<boolean> {
  if (!contractId) return false;

  try {
    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLedgerEntries",
        params: {
          keys: [
            {
              type: "contractData",
              contract: contractId,
              durability: "persistent",
              key: { type: "ledgerKeyContractInstance" },
            },
          ],
        },
      }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.result?.entries?.length > 0;
  } catch (error) {
    return false;
  }
}

export async function GET() {
  try {
    // Perform health checks in parallel
    const [sorobanHealth, horizonHealth, networkInfo, latestLedger] = await Promise.all([
      checkSorobanHealth(),
      checkHorizonHealth(),
      getNetworkInfo(),
      getLatestLedger(),
    ]);

    // Check contract deployments
    const [zkVerifierExists, factoryExists] = await Promise.all([
      checkContractExists(ZK_VERIFIER_CONTRACT),
      checkContractExists(GATEWAY_FACTORY_CONTRACT),
    ]);

    // Determine overall health
    const isHealthy = sorobanHealth.healthy && horizonHealth.healthy;
    const network = networkInfo?.network_passphrase?.includes("Test") ? "testnet" :
                    networkInfo?.network_passphrase?.includes("Public") ? "mainnet" : "unknown";

    const status = {
      // Protocol info
      protocolVersion: 25,
      protocolName: "X-Ray",
      network,

      // X-Ray Protocol features (based on Protocol 25 CAPs)
      features: {
        bn254: {
          enabled: true,
          functions: ["bn254_g1_add", "bn254_g1_mul", "bn254_multi_pairing_check"],
          cap: "CAP-0074",
          description: "BN254 elliptic curve operations for Groth16 verification",
        },
        poseidon: {
          enabled: true,
          functions: ["poseidon_permutation"],
          cap: "CAP-0075",
          supportedStateSizes: [2, 3, 4, 5],
          description: "ZK-friendly hash function for circuit inputs",
        },
        poseidon2: {
          enabled: true,
          functions: ["poseidon2_permutation"],
          cap: "CAP-0075",
          description: "Alternative ZK-friendly hash with different round constants",
        },
      },

      // Timeline
      timeline: {
        testnetLaunch: "2026-01-07",
        mainnetLaunch: "2026-01-22",
      },

      // Live status from health checks
      status: isHealthy ? "live" : "degraded",
      health: isHealthy ? "healthy" : "unhealthy",

      // Network details
      networkDetails: {
        passphrase: networkInfo?.network_passphrase || "Unknown",
        currentLedger: latestLedger?.sequence || 0,
        ledgerCloseTime: latestLedger?.closed_at,
        baseFee: latestLedger?.base_fee_in_stroops || 100,
        baseReserve: latestLedger?.base_reserve_in_stroops || 5000000,
        protocolVersion: latestLedger?.protocol_version || 0,
      },

      // Services health
      services: {
        sorobanRpc: {
          url: SOROBAN_RPC_URL,
          healthy: sorobanHealth.healthy,
          latencyMs: sorobanHealth.latency,
        },
        horizon: {
          url: HORIZON_URL,
          healthy: horizonHealth.healthy,
          latencyMs: horizonHealth.latency,
        },
      },

      // Contract deployments
      contracts: {
        zkVerifier: {
          id: ZK_VERIFIER_CONTRACT || "not configured",
          deployed: zkVerifierExists,
        },
        gatewayFactory: {
          id: GATEWAY_FACTORY_CONTRACT || "not configured",
          deployed: factoryExists,
        },
      },

      // Gas cost comparison (protocol constants)
      gasCosts: {
        groth16Verify: {
          wasm: 4100000,
          xray: 260000,
          savings: "94%",
        },
        pairingCheck: {
          wasm: 2500000,
          xray: 150000,
          savings: "94%",
        },
        poseidonHash: {
          wasm: 500000,
          xray: 50000,
          savings: "90%",
        },
      },

      // Timestamp
      checkedAt: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error in status API:", error);

    // Return basic status even on error
    return NextResponse.json({
      protocolVersion: 25,
      protocolName: "X-Ray",
      network: process.env.STELLAR_NETWORK || "testnet",
      features: {
        bn254: {
          enabled: true,
          functions: ["bn254_g1_add", "bn254_g1_mul", "bn254_multi_pairing_check"],
          cap: "CAP-0074",
        },
        poseidon: {
          enabled: true,
          functions: ["poseidon_permutation"],
          cap: "CAP-0075",
          supportedStateSizes: [2, 3, 4, 5],
        },
        poseidon2: {
          enabled: true,
          functions: ["poseidon2_permutation"],
          cap: "CAP-0075",
        },
      },
      timeline: {
        testnetLaunch: "2026-01-07",
        mainnetLaunch: "2026-01-22",
      },
      status: "unknown",
      health: "unknown",
      error: "Failed to check health",
      checkedAt: new Date().toISOString(),
    });
  }
}
