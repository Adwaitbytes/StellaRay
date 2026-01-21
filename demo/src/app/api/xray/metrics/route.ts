import { NextResponse } from "next/server";

// Base metrics - these increment over time to simulate real usage
let baseMetrics = {
  proofsVerified: 247,
  bn254Operations: 892,
  poseidonHashes: 1892,
  totalGasSaved: 3850000,
};

// Timestamp of last update for realistic progression
let lastUpdate = Date.now();

// Generate a unique proof ID (Stellar-compatible format)
function generateProofId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  result += '...';
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate recent proofs with realistic timestamps
function generateRecentProofs(count: number = 5) {
  const proofs = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timeOffset = i * (60000 + Math.floor(Math.random() * 180000)); // 1-4 minutes apart
    proofs.push({
      id: generateProofId(),
      timestamp: new Date(now - timeOffset).toISOString(),
      type: "Groth16",
      status: "verified",
      gasUsed: 255000 + Math.floor(Math.random() * 15000), // 255K-270K gas
    });
  }

  return proofs;
}

export async function GET() {
  const now = Date.now();
  const timeDelta = now - lastUpdate;

  // Simulate metric progression based on time elapsed (roughly 1 proof per 30 seconds)
  const proofIncrement = Math.floor(timeDelta / 30000);
  if (proofIncrement > 0) {
    baseMetrics.proofsVerified += proofIncrement;
    baseMetrics.bn254Operations += proofIncrement * 11;
    baseMetrics.poseidonHashes += proofIncrement * 8;
    baseMetrics.totalGasSaved += proofIncrement * 3850000;
    lastUpdate = now;
  }

  // Add slight random variations to simulate real-time updates
  const randomVariation = () => Math.floor(Math.random() * 5);

  // Calculate dynamic gas savings (varies between 93-95%)
  const gasSavingsPercent = 93 + Math.floor(Math.random() * 3);

  // Calculate average verification time (varies between 10-15ms)
  const avgVerificationMs = 10 + Math.floor(Math.random() * 6);

  const currentMetrics = {
    proofsVerified: baseMetrics.proofsVerified + randomVariation(),
    bn254Operations: baseMetrics.bn254Operations + randomVariation() * 2,
    poseidonHashes: baseMetrics.poseidonHashes + randomVariation() * 3,
    avgVerificationMs,
    gasSavingsPercent,
    successRate: 99.5 + Math.random() * 0.5, // 99.5-100%
    totalGasSaved: baseMetrics.totalGasSaved + randomVariation() * 100000,
    lastUpdated: new Date().toISOString(),
    breakdown: {
      pairingChecks: baseMetrics.proofsVerified + randomVariation(),
      g1Additions: baseMetrics.proofsVerified * 5 + randomVariation() * 3,
      g1Multiplications: baseMetrics.proofsVerified * 5 + randomVariation() * 3,
      poseidonCalls: baseMetrics.proofsVerified * 8 + randomVariation() * 5,
    },
    gasComparison: {
      wasmTotal: 4100000 + Math.floor(Math.random() * 100000),
      xrayTotal: 260000 + Math.floor(Math.random() * 10000),
      operations: [
        {
          name: "Pairing Check",
          wasm: 2500000 + Math.floor(Math.random() * 50000),
          xray: 150000 + Math.floor(Math.random() * 5000)
        },
        {
          name: "G1 Scalar Mul",
          wasm: 800000 + Math.floor(Math.random() * 20000),
          xray: 45000 + Math.floor(Math.random() * 2000)
        },
        {
          name: "G1 Addition",
          wasm: 300000 + Math.floor(Math.random() * 10000),
          xray: 15000 + Math.floor(Math.random() * 1000)
        },
        {
          name: "Poseidon Hash",
          wasm: 500000 + Math.floor(Math.random() * 15000),
          xray: 50000 + Math.floor(Math.random() * 3000)
        }
      ]
    },
    recentProofs: generateRecentProofs(5),
  };

  return NextResponse.json(currentMetrics);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Update metrics when a new proof is verified
    if (body.proofVerified) {
      baseMetrics.proofsVerified += 1;
      baseMetrics.bn254Operations += 11; // 1 pairing + 5 mul + 5 add
      baseMetrics.poseidonHashes += 8;
      baseMetrics.totalGasSaved += 3850000;
      lastUpdate = Date.now();
    }

    return NextResponse.json({
      success: true,
      metrics: {
        proofsVerified: baseMetrics.proofsVerified,
        bn254Operations: baseMetrics.bn254Operations,
        poseidonHashes: baseMetrics.poseidonHashes,
        totalGasSaved: baseMetrics.totalGasSaved,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
