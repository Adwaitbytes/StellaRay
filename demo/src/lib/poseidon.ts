/**
 * Poseidon Hash Implementation for ZK Multi-Custody
 * Uses circomlibjs for browser-compatible Poseidon hashing
 */

import { buildPoseidon } from 'circomlibjs';

let poseidonInstance: any = null;

/**
 * Initialize Poseidon hash function
 */
async function initPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Hash inputs using Poseidon
 * @param inputs Array of BigInt inputs
 * @returns Hex string of hash output
 */
export async function poseidonHash(inputs: bigint[]): Promise<string> {
  const poseidon = await initPoseidon();
  const hash = poseidon(inputs);
  const hashStr = poseidon.F.toString(hash);

  // Convert to hex with proper padding
  const hashBigInt = BigInt(hashStr);
  const hex = hashBigInt.toString(16).padStart(64, '0');

  return hex;
}

/**
 * Generate guardian commitment: Poseidon(iss || sub)
 * @param iss OAuth issuer (e.g., "https://accounts.google.com")
 * @param sub OAuth subject (user unique identifier)
 * @returns Hex string commitment
 */
export async function generateGuardianCommitment(
  iss: string,
  sub: string
): Promise<string> {
  // Convert strings to BigInt inputs
  const issBytes = new TextEncoder().encode(iss);
  const subBytes = new TextEncoder().encode(sub);

  // Convert bytes to BigInt (taking first 31 bytes to fit in field)
  const issBigInt = bytesToBigInt(issBytes);
  const subBigInt = bytesToBigInt(subBytes);

  // Hash with Poseidon
  return poseidonHash([issBigInt, subBigInt]);
}

/**
 * Generate nullifier: Poseidon(commitment || tx_id)
 * @param commitment Guardian commitment
 * @param txId Transaction ID
 * @returns Hex string nullifier
 */
export async function generateNullifier(
  commitment: string,
  txId: string
): Promise<string> {
  const commitmentBigInt = BigInt('0x' + commitment);
  const txIdBigInt = BigInt('0x' + txId);

  return poseidonHash([commitmentBigInt, txIdBigInt]);
}

/**
 * Convert bytes to BigInt (field element)
 * Takes only first 31 bytes to ensure it fits in BN254 scalar field
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
  const maxBytes = Math.min(bytes.length, 31); // Max 31 bytes for BN254 field
  let result = 0n;

  for (let i = 0; i < maxBytes; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }

  return result;
}

/**
 * Hash multiple field elements
 */
export async function poseidonHashN(inputs: string[]): Promise<string> {
  const bigInts = inputs.map((input) => {
    if (input.startsWith('0x')) {
      return BigInt(input);
    }
    return BigInt('0x' + input);
  });

  return poseidonHash(bigInts);
}
