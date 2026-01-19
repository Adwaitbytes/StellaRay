/**
 * Address Utilities
 *
 * Functions for computing zkLogin addresses, nonces, and seeds.
 */

import { poseidonHash, hashBytesToField } from "./crypto";

/**
 * Compute the nonce for OAuth authentication
 *
 * nonce = Poseidon(eph_pk_high, eph_pk_low, max_epoch, randomness)
 *
 * The result is encoded as Base64URL for use in the JWT nonce claim.
 *
 * @param ephPkHigh - High 128 bits of ephemeral public key
 * @param ephPkLow - Low 128 bits of ephemeral public key
 * @param maxEpoch - Maximum valid epoch (ledger sequence)
 * @param randomness - Random entropy for nonce uniqueness
 */
export async function computeNonce(
  ephPkHigh: string,
  ephPkLow: string,
  maxEpoch: number,
  randomness: string
): Promise<string> {
  // Convert inputs to field elements
  const highField = BigInt("0x" + ephPkHigh);
  const lowField = BigInt("0x" + ephPkLow);
  const epochField = BigInt(maxEpoch);
  const randField = BigInt("0x" + Buffer.from(randomness, "base64").toString("hex"));

  // Compute Poseidon hash
  const hash = await poseidonHash([highField, lowField, epochField, randField]);

  // Take last 20 bytes for nonce
  const hashBytes = bigintToBytes(hash, 32);
  const nonceBytes = hashBytes.slice(-20);

  // Encode as Base64URL
  return base64UrlEncode(nonceBytes);
}

/**
 * Compute the address seed for deterministic wallet derivation
 *
 * address_seed = Poseidon(kc_name_F, kc_value_F, aud_F, Poseidon(salt))
 *
 * @param keyClaimName - Name of the key claim (usually "sub")
 * @param keyClaimValue - Value of the key claim (user ID)
 * @param audience - OAuth audience (client ID)
 * @param salt - User-specific salt
 */
export async function computeAddressSeed(
  keyClaimName: string,
  keyClaimValue: string,
  audience: string,
  salt: string
): Promise<string> {
  // Hash each component to a field element
  const kcNameField = await hashBytesToField(stringToBytes(keyClaimName));
  const kcValueField = await hashBytesToField(stringToBytes(keyClaimValue));
  const audField = await hashBytesToField(stringToBytes(audience));

  // Hash the salt
  const saltBytes = Buffer.from(salt, "base64");
  const saltField = BigInt("0x" + saltBytes.toString("hex"));
  const saltHash = await poseidonHash([saltField]);

  // Compute final address seed
  const addressSeed = await poseidonHash([kcNameField, kcValueField, audField, saltHash]);

  // Return as hex string
  return addressSeed.toString(16).padStart(64, "0");
}

/**
 * Compute ephemeral public key hash
 *
 * eph_pk_hash = Poseidon(eph_pk_high, eph_pk_low)
 *
 * @param ephPkHigh - High 128 bits of ephemeral public key
 * @param ephPkLow - Low 128 bits of ephemeral public key
 */
export async function computeEphPkHash(
  ephPkHigh: string,
  ephPkLow: string
): Promise<string> {
  const highField = BigInt("0x" + ephPkHigh);
  const lowField = BigInt("0x" + ephPkLow);

  const hash = await poseidonHash([highField, lowField]);

  return hash.toString(16).padStart(64, "0");
}

/**
 * Derive the zkLogin wallet address from issuer and address seed
 *
 * address = Blake2b_256(0x05 || len(issuer) || issuer || address_seed)
 *
 * @param issuer - OAuth issuer URL
 * @param addressSeed - Computed address seed (hex string)
 */
export async function deriveZkLoginAddress(
  issuer: string,
  addressSeed: string
): Promise<string> {
  // Build the address preimage
  const issuerBytes = stringToBytes(issuer);
  const seedBytes = hexToBytes(addressSeed);

  // Construct: 0x05 || issuer_len (1 byte) || issuer || address_seed
  const preimage = new Uint8Array(1 + 1 + issuerBytes.length + seedBytes.length);
  preimage[0] = 0x05; // zkLogin flag
  preimage[1] = issuerBytes.length;
  preimage.set(issuerBytes, 2);
  preimage.set(seedBytes, 2 + issuerBytes.length);

  // Compute Blake2b-256 hash
  const hash = await blake2b256(preimage);

  // Convert to Stellar address format (G...)
  return toStellarAddress(hash);
}

/**
 * Compute issuer hash for JWK lookup
 *
 * @param issuer - OAuth issuer URL
 */
export async function computeIssuerHash(issuer: string): Promise<string> {
  const field = await hashBytesToField(stringToBytes(issuer));
  return field.toString(16).padStart(64, "0");
}

// Helper functions

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bigintToBytes(n: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let remaining = n;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(remaining & BigInt(0xff));
    remaining >>= BigInt(8);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function blake2b256(data: Uint8Array): Promise<Uint8Array> {
  // Use SubtleCrypto for hashing
  // Note: Blake2b is not natively supported, would use a library
  // Using SHA-256 as placeholder
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

function toStellarAddress(hash: Uint8Array): string {
  // Convert hash to Stellar G... address format
  // This uses base32 encoding with ED25519 public key version byte

  // Version byte for ED25519 public keys
  const versionByte = 6 << 3; // G prefix

  // Compute checksum (CRC16-XModem of version + payload)
  const payload = new Uint8Array(1 + hash.length);
  payload[0] = versionByte;
  payload.set(hash, 1);
  const checksum = crc16xmodem(payload);

  // Combine: version + hash + checksum
  const addressBytes = new Uint8Array(1 + hash.length + 2);
  addressBytes[0] = versionByte;
  addressBytes.set(hash, 1);
  addressBytes[addressBytes.length - 2] = checksum & 0xff;
  addressBytes[addressBytes.length - 1] = (checksum >> 8) & 0xff;

  // Base32 encode
  return base32Encode(addressBytes);
}

function crc16xmodem(data: Uint8Array): number {
  let crc = 0x0000;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

function base32Encode(data: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += alphabet[(value >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 0x1f];
  }

  return result;
}
