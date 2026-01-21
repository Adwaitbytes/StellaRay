import { NextResponse } from "next/server";

// Store for live events - simulates real blockchain events
let eventCounter = 0;
let events: any[] = [];

// Event types with realistic distribution
const EVENT_TYPES = [
  { type: 'proof_verified', weight: 30, operation: 'Groth16 Verify', baseGas: 260000, baseTime: 12 },
  { type: 'pairing_check', weight: 25, operation: 'Multi-Pairing Check', baseGas: 150000, baseTime: 8 },
  { type: 'poseidon_hash', weight: 25, operation: 'Poseidon Permutation', baseGas: 50000, baseTime: 3 },
  { type: 'g1_operation', weight: 10, operation: 'G1 Scalar Mul', baseGas: 45000, baseTime: 2 },
  { type: 'g1_operation', weight: 10, operation: 'G1 Addition', baseGas: 15000, baseTime: 1 },
];

function generateProofId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function selectEventType() {
  const totalWeight = EVENT_TYPES.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const eventType of EVENT_TYPES) {
    random -= eventType.weight;
    if (random <= 0) return eventType;
  }
  return EVENT_TYPES[0];
}

// Generate new events periodically
function generateEvent() {
  const eventType = selectEventType();
  const variation = 0.8 + Math.random() * 0.4;

  const event = {
    id: `evt_${Date.now()}_${eventCounter++}`,
    type: eventType.type,
    operation: eventType.operation,
    timestamp: new Date().toISOString(),
    proofId: generateProofId(),
    gasUsed: Math.round(eventType.baseGas * variation),
    duration: Math.round(eventType.baseTime * variation),
    blockNumber: 12847500 + Math.floor(Math.random() * 1000),
    status: 'confirmed',
  };

  // Keep only last 50 events
  events = [event, ...events.slice(0, 49)];
  return event;
}

// Initialize with some events
for (let i = 0; i < 10; i++) {
  generateEvent();
}

// Auto-generate events every 2-4 seconds
setInterval(() => {
  generateEvent();
}, 2000 + Math.random() * 2000);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const since = searchParams.get('since');

  let filteredEvents = events;

  if (since) {
    filteredEvents = events.filter(e => new Date(e.timestamp) > new Date(since));
  }

  // Calculate TPS based on recent events
  const recentEvents = events.filter(e =>
    Date.now() - new Date(e.timestamp).getTime() < 10000
  );
  const tps = recentEvents.length / 10;

  return NextResponse.json({
    events: filteredEvents.slice(0, limit),
    tps: Math.round(tps * 10) / 10,
    totalEvents: eventCounter,
    lastUpdated: new Date().toISOString(),
  });
}
