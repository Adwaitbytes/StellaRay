/**
 * Cryptographic Utilities
 *
 * Provides Poseidon hashing and field arithmetic for zkLogin.
 *
 * ## Protocol 25 (X-Ray) Compatibility
 *
 * This module uses poseidon-lite which implements the same Poseidon hash
 * function as Stellar's soroban-poseidon (Protocol 25):
 * - BN254 scalar field (Fr)
 * - Circom-compatible parameters
 * - State sizes T=2,3,4,5,6 supported
 *
 * All hashes computed here will match those computed on-chain by Soroban contracts.
 */

// BN254 scalar field prime (matches soroban-poseidon Bn254Fr)
const BN254_FIELD_PRIME = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

/**
 * Poseidon hash function for BN254 field
 *
 * Uses the Poseidon permutation with the BN254 scalar field.
 *
 * @param inputs - Array of field elements to hash
 * @returns Hash output as bigint
 */
export async function poseidonHash(inputs: bigint[]): Promise<bigint> {
  // Import poseidon-lite for actual implementation
  const poseidonLib = await import("poseidon-lite");

  // Ensure inputs are in field
  const normalizedInputs = inputs.map((x) => mod(x, BN254_FIELD_PRIME));

  // Call poseidon with appropriate width based on input length
  // poseidon-lite supports 1-16 inputs
  if (normalizedInputs.length === 0) {
    throw new Error("Poseidon hash requires at least 1 input");
  }
  if (normalizedInputs.length > 16) {
    throw new Error("Poseidon hash supports maximum 16 inputs");
  }

  // Select the appropriate poseidon function based on input count
  const poseidonFn = (poseidonLib as unknown as Record<string, (inputs: bigint[]) => bigint>)[
    `poseidon${normalizedInputs.length}`
  ];

  if (!poseidonFn) {
    throw new Error(`Poseidon hash for ${normalizedInputs.length} inputs not available`);
  }

  const result = poseidonFn(normalizedInputs);
  return BigInt(result.toString());
}

/**
 * Hash arbitrary bytes to a BN254 field element
 *
 * Uses Poseidon in sponge mode for arbitrary-length inputs.
 *
 * @param bytes - Input bytes
 * @returns Field element
 */
export async function hashBytesToField(bytes: Uint8Array): Promise<bigint> {
  // Pack bytes into field elements (31 bytes per element)
  const elements: bigint[] = [];
  const bytesPerElement = 31;

  for (let i = 0; i < bytes.length; i += bytesPerElement) {
    const chunk = bytes.slice(i, Math.min(i + bytesPerElement, bytes.length));
    let value = BigInt(0);
    for (let j = 0; j < chunk.length; j++) {
      value |= BigInt(chunk[j]) << BigInt(8 * j);
    }
    elements.push(value);
  }

  // Hash with Poseidon sponge
  let state = BigInt(0);
  for (const element of elements) {
    state = await poseidonHash([state, element]);
  }

  // Include length for domain separation
  state = await poseidonHash([state, BigInt(bytes.length)]);

  return state;
}

/**
 * Hash JWK RSA modulus to field element
 *
 * Uses a tree structure matching the Soroban contract implementation:
 * - First layer: hash groups of 4 elements (4 groups of 4 + 1 remaining)
 * - Second layer: hash the 5 intermediate results
 *
 * @param modulusChunks - RSA modulus as 17 chunks of 121 bits
 * @returns Field element
 */
export async function hashModulusToField(modulusChunks: bigint[]): Promise<bigint> {
  if (modulusChunks.length !== 17) {
    throw new Error("Expected 17 modulus chunks");
  }

  // Hash in a tree structure to handle 17 inputs
  // First layer: hash groups of 4 elements (4 groups of 4 + 1 remaining)
  const intermediate: bigint[] = [];

  // Groups of 4: indices 0-3, 4-7, 8-11, 12-15
  for (let group = 0; group < 4; group++) {
    const start = group * 4;
    const hash = await poseidonHash([
      modulusChunks[start],
      modulusChunks[start + 1],
      modulusChunks[start + 2],
      modulusChunks[start + 3],
    ]);
    intermediate.push(hash);
  }

  // Last element (index 16)
  const lastHash = await poseidonHash([modulusChunks[16]]);
  intermediate.push(lastHash);

  // Second layer: hash the 5 intermediate results
  const finalHash = await poseidonHash(intermediate);

  return finalHash;
}

/**
 * Compute ephemeral public key hash using Poseidon
 *
 * eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
 *
 * This matches the Soroban contract implementation for session binding.
 *
 * @param ephPkHigh - High 128 bits of ephemeral public key
 * @param ephPkLow - Low 128 bits of ephemeral public key
 * @returns Poseidon hash as bigint
 */
export async function computeEphPkHash(ephPkHigh: bigint, ephPkLow: bigint): Promise<bigint> {
  return poseidonHash([ephPkHigh, ephPkLow]);
}

/**
 * Compute address seed from OAuth identity using Poseidon
 *
 * Formula: address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
 *
 * This matches the Soroban contract implementation for address derivation.
 *
 * @param kcNameHash - Hash of key claim name (e.g., "sub")
 * @param kcValueHash - Hash of key claim value (e.g., user ID)
 * @param audHash - Hash of audience (client ID)
 * @param salt - User-specific salt
 * @returns Address seed as bigint
 */
export async function computeAddressSeed(
  kcNameHash: bigint,
  kcValueHash: bigint,
  audHash: bigint,
  salt: bigint
): Promise<bigint> {
  // Step 1: Poseidon(salt)
  const saltHash = await poseidonHash([salt]);

  // Step 2: Poseidon(kc_name_F, kc_value_F, aud_F, salt_hash)
  const addressSeed = await poseidonHash([kcNameHash, kcValueHash, audHash, saltHash]);

  return addressSeed;
}

/**
 * Compute nonce for session binding using Poseidon
 *
 * nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
 *
 * This matches the Soroban contract implementation for OAuth nonce.
 *
 * @param ephPkHigh - High 128 bits of ephemeral public key
 * @param ephPkLow - Low 128 bits of ephemeral public key
 * @param maxEpoch - Maximum ledger sequence for session validity
 * @param randomness - Random value for additional entropy
 * @returns Nonce as bigint
 */
export async function computeNonce(
  ephPkHigh: bigint,
  ephPkLow: bigint,
  maxEpoch: bigint,
  randomness: bigint
): Promise<bigint> {
  return poseidonHash([ephPkHigh, ephPkLow, maxEpoch, randomness]);
}

/**
 * Convert RSA modulus from Base64URL to chunks
 *
 * @param modulusB64 - Base64URL encoded modulus
 * @returns Array of 17 chunks (121 bits each)
 */
export function modulusToChunks(modulusB64: string): bigint[] {
  // Decode Base64URL
  const modulus = base64UrlDecode(modulusB64);

  // Convert to bigint
  let value = BigInt(0);
  for (const byte of modulus) {
    value = (value << BigInt(8)) | BigInt(byte);
  }

  // Split into 17 chunks of 121 bits
  const chunks: bigint[] = [];
  const chunkSize = BigInt(121);
  const mask = (BigInt(1) << chunkSize) - BigInt(1);

  for (let i = 0; i < 17; i++) {
    chunks.push(value & mask);
    value >>= chunkSize;
  }

  return chunks;
}

/**
 * Modular arithmetic: a mod p
 */
export function mod(a: bigint, p: bigint): bigint {
  const result = a % p;
  return result >= BigInt(0) ? result : result + p;
}

/**
 * Modular exponentiation: base^exp mod p
 */
export function modPow(base: bigint, exp: bigint, p: bigint): bigint {
  let result = BigInt(1);
  base = mod(base, p);

  while (exp > BigInt(0)) {
    if (exp & BigInt(1)) {
      result = mod(result * base, p);
    }
    exp >>= BigInt(1);
    base = mod(base * base, p);
  }

  return result;
}

/**
 * Modular inverse using extended Euclidean algorithm
 */
export function modInverse(a: bigint, p: bigint): bigint {
  let [old_r, r] = [a, p];
  let [old_s, s] = [BigInt(1), BigInt(0)];

  while (r !== BigInt(0)) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }

  if (old_r !== BigInt(1)) {
    throw new Error("Modular inverse does not exist");
  }

  return mod(old_s, p);
}

/**
 * Convert bigint to fixed-size byte array
 */
export function bigintToBytes(n: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let remaining = n;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(remaining & BigInt(0xff));
    remaining >>= BigInt(8);
  }
  return bytes;
}

/**
 * Convert byte array to bigint
 */
export function bytesToBigint(bytes: Uint8Array): bigint {
  let result = BigInt(0);
  for (const byte of bytes) {
    result = (result << BigInt(8)) | BigInt(byte);
  }
  return result;
}

// Helper functions

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
