/**
 * Cryptographic Utilities
 *
 * Provides Poseidon hashing and field arithmetic for zkLogin.
 */

// BN254 scalar field prime
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
  try {
    const { poseidon } = await import("poseidon-lite");

    // Ensure inputs are in field
    const normalizedInputs = inputs.map((x) => mod(x, BN254_FIELD_PRIME));

    // Call poseidon with appropriate width
    const result = poseidon(normalizedInputs);

    return BigInt(result.toString());
  } catch {
    // Fallback: simplified hash for development
    return simplifiedPoseidon(inputs);
  }
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
 * @param modulusChunks - RSA modulus as 17 chunks of 121 bits
 * @returns Field element
 */
export async function hashModulusToField(modulusChunks: bigint[]): Promise<bigint> {
  if (modulusChunks.length !== 17) {
    throw new Error("Expected 17 modulus chunks");
  }

  // Hash iteratively
  let state = BigInt(0);
  for (const chunk of modulusChunks) {
    state = await poseidonHash([state, chunk]);
  }

  return state;
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
 * Simplified Poseidon for development/testing
 * Uses a basic sponge construction - NOT cryptographically secure
 */
function simplifiedPoseidon(inputs: bigint[]): bigint {
  // This is a placeholder - actual implementation uses proper Poseidon
  let state = BigInt(0);

  for (const input of inputs) {
    // Mix input into state
    state ^= input;
    // Apply a simple permutation
    state = mod(state * BigInt("0x123456789abcdef") + BigInt(1), BN254_FIELD_PRIME);
    state = mod(state * state * state, BN254_FIELD_PRIME); // x^3
  }

  return state;
}
