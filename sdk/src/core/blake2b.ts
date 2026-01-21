/**
 * Blake2b Implementation for Stellar zkLogin
 *
 * This is a pure TypeScript implementation of Blake2b-256 hash function,
 * which is required for deriving zkLogin wallet addresses on Stellar.
 *
 * Based on RFC 7693: The BLAKE2 Cryptographic Hash and MAC
 * https://tools.ietf.org/html/rfc7693
 */

// Blake2b-256 initialization vector (first 8 prime fractional parts)
const IV = new BigUint64Array([
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
  0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
  0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
]);

// Sigma permutation schedule
const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3]
];

/**
 * 64-bit rotation right
 */
function rotr64(x: bigint, n: number): bigint {
  return ((x >> BigInt(n)) | (x << BigInt(64 - n))) & 0xffffffffffffffffn;
}

/**
 * Blake2b mixing function G
 */
function G(v: BigUint64Array, a: number, b: number, c: number, d: number, x: bigint, y: bigint): void {
  v[a] = (v[a] + v[b] + x) & 0xffffffffffffffffn;
  v[d] = rotr64(v[d] ^ v[a], 32);
  v[c] = (v[c] + v[d]) & 0xffffffffffffffffn;
  v[b] = rotr64(v[b] ^ v[c], 24);
  v[a] = (v[a] + v[b] + y) & 0xffffffffffffffffn;
  v[d] = rotr64(v[d] ^ v[a], 16);
  v[c] = (v[c] + v[d]) & 0xffffffffffffffffn;
  v[b] = rotr64(v[b] ^ v[c], 63);
}

/**
 * Blake2b compression function
 */
function compress(
  h: BigUint64Array,
  block: BigUint64Array,
  t: bigint,
  lastBlock: boolean
): void {
  const v = new BigUint64Array(16);

  // Initialize working vector
  for (let i = 0; i < 8; i++) {
    v[i] = h[i];
    v[i + 8] = IV[i];
  }

  // XOR in counter and finalization flag
  v[12] ^= t & 0xffffffffffffffffn;
  v[13] ^= (t >> 64n) & 0xffffffffffffffffn;

  if (lastBlock) {
    v[14] = ~v[14];
  }

  // 12 rounds of mixing
  for (let round = 0; round < 12; round++) {
    const s = SIGMA[round];
    G(v, 0, 4, 8, 12, block[s[0]], block[s[1]]);
    G(v, 1, 5, 9, 13, block[s[2]], block[s[3]]);
    G(v, 2, 6, 10, 14, block[s[4]], block[s[5]]);
    G(v, 3, 7, 11, 15, block[s[6]], block[s[7]]);
    G(v, 0, 5, 10, 15, block[s[8]], block[s[9]]);
    G(v, 1, 6, 11, 12, block[s[10]], block[s[11]]);
    G(v, 2, 7, 8, 13, block[s[12]], block[s[13]]);
    G(v, 3, 4, 9, 14, block[s[14]], block[s[15]]);
  }

  // Update state
  for (let i = 0; i < 8; i++) {
    h[i] ^= v[i] ^ v[i + 8];
  }
}

/**
 * Convert bytes to 64-bit words (little-endian)
 */
function bytesToWords(bytes: Uint8Array): BigUint64Array {
  const words = new BigUint64Array(16);
  for (let i = 0; i < 16; i++) {
    const offset = i * 8;
    words[i] =
      BigInt(bytes[offset] || 0) |
      (BigInt(bytes[offset + 1] || 0) << 8n) |
      (BigInt(bytes[offset + 2] || 0) << 16n) |
      (BigInt(bytes[offset + 3] || 0) << 24n) |
      (BigInt(bytes[offset + 4] || 0) << 32n) |
      (BigInt(bytes[offset + 5] || 0) << 40n) |
      (BigInt(bytes[offset + 6] || 0) << 48n) |
      (BigInt(bytes[offset + 7] || 0) << 56n);
  }
  return words;
}

/**
 * Convert 64-bit words to bytes (little-endian)
 */
function wordsToBytes(words: BigUint64Array, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < Math.ceil(length / 8); i++) {
    const word = words[i];
    for (let j = 0; j < 8 && i * 8 + j < length; j++) {
      bytes[i * 8 + j] = Number((word >> BigInt(j * 8)) & 0xffn);
    }
  }
  return bytes;
}

/**
 * Blake2b hash function
 *
 * @param data - Input data to hash
 * @param outlen - Output length in bytes (default: 32 for Blake2b-256)
 * @param key - Optional key for keyed hashing (MAC)
 * @returns Hash output
 */
export function blake2b(data: Uint8Array, outlen: number = 32, key?: Uint8Array): Uint8Array {
  if (outlen < 1 || outlen > 64) {
    throw new Error("Blake2b output length must be between 1 and 64 bytes");
  }

  const keylen = key?.length || 0;
  if (keylen > 64) {
    throw new Error("Blake2b key length must not exceed 64 bytes");
  }

  // Initialize state with parameter block
  const h = new BigUint64Array(IV);

  // Parameter block: digest length | key length | fanout | depth | ...
  h[0] ^= BigInt(0x01010000 ^ (keylen << 8) ^ outlen);

  // Process key block if present
  let t = 0n;
  const blockSize = 128;

  if (keylen > 0) {
    const keyBlock = new Uint8Array(blockSize);
    keyBlock.set(key!);
    compress(h, bytesToWords(keyBlock), BigInt(blockSize), false);
    t = BigInt(blockSize);
  }

  // Process data blocks
  let offset = 0;
  while (offset + blockSize < data.length) {
    const block = data.slice(offset, offset + blockSize);
    t += BigInt(blockSize);
    compress(h, bytesToWords(block), t, false);
    offset += blockSize;
  }

  // Process final block
  const remaining = data.length - offset;
  const finalBlock = new Uint8Array(blockSize);
  if (remaining > 0) {
    finalBlock.set(data.slice(offset));
  }
  t += BigInt(remaining);
  compress(h, bytesToWords(finalBlock), t, true);

  return wordsToBytes(h, outlen);
}

/**
 * Blake2b-256 convenience function
 *
 * This is the specific variant used by Stellar for address derivation.
 *
 * @param data - Input data to hash
 * @returns 32-byte hash
 */
export function blake2b256(data: Uint8Array): Uint8Array {
  return blake2b(data, 32);
}

/**
 * Blake2b-256 async wrapper for compatibility
 */
export async function blake2b256Async(data: Uint8Array): Promise<Uint8Array> {
  return blake2b256(data);
}

/**
 * Blake2b with personalization (used in some Stellar operations)
 */
export function blake2bPersonalized(
  data: Uint8Array,
  personalization: Uint8Array,
  outlen: number = 32
): Uint8Array {
  if (personalization.length > 16) {
    throw new Error("Personalization must not exceed 16 bytes");
  }

  // For personalized hashing, we modify the IV
  const h = new BigUint64Array(IV);

  // XOR personalization into h[4] and h[5]
  let p0 = 0n, p1 = 0n;
  for (let i = 0; i < Math.min(8, personalization.length); i++) {
    p0 |= BigInt(personalization[i]) << BigInt(i * 8);
  }
  for (let i = 8; i < Math.min(16, personalization.length); i++) {
    p1 |= BigInt(personalization[i]) << BigInt((i - 8) * 8);
  }

  h[0] ^= BigInt(0x01010000 ^ outlen);
  h[4] ^= p0;
  h[5] ^= p1;

  // Process data
  let t = 0n;
  const blockSize = 128;
  let offset = 0;

  while (offset + blockSize < data.length) {
    const block = data.slice(offset, offset + blockSize);
    t += BigInt(blockSize);
    compress(h, bytesToWords(block), t, false);
    offset += blockSize;
  }

  const remaining = data.length - offset;
  const finalBlock = new Uint8Array(blockSize);
  if (remaining > 0) {
    finalBlock.set(data.slice(offset));
  }
  t += BigInt(remaining);
  compress(h, bytesToWords(finalBlock), t, true);

  return wordsToBytes(h, outlen);
}
