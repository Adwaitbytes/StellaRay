/**
 * Ephemeral Key Management
 *
 * Manages Ed25519 ephemeral key pairs for zkLogin sessions.
 * Keys are stored in session storage and auto-cleared on browser close.
 */

import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

const SESSION_KEY_STORAGE_KEY = "zklogin_ephemeral_key";

/**
 * Ephemeral key pair
 */
export interface EphemeralKeyPair {
  publicKey: string;
  secretKey: string;
}

/**
 * Session key with metadata
 */
export interface SessionKey {
  keyPair: EphemeralKeyPair;
  maxEpoch: number;
  createdAt: number;
  nonce: string;
}

/**
 * Manages ephemeral Ed25519 keys for zkLogin
 */
export class EphemeralKeyManager {
  /**
   * Generate a new ephemeral key pair
   */
  generateKeyPair(): EphemeralKeyPair {
    const keyPair = nacl.sign.keyPair();

    return {
      publicKey: encodeBase64(keyPair.publicKey),
      secretKey: encodeBase64(keyPair.secretKey),
    };
  }

  /**
   * Sign a message with an ephemeral key
   */
  sign(message: Uint8Array, keyPair: EphemeralKeyPair): Uint8Array {
    const secretKey = decodeBase64(keyPair.secretKey);
    return nacl.sign.detached(message, secretKey);
  }

  /**
   * Verify a signature
   */
  verify(message: Uint8Array, signature: Uint8Array, publicKey: string): boolean {
    const pubKeyBytes = decodeBase64(publicKey);
    return nacl.sign.detached.verify(message, signature, pubKeyBytes);
  }

  /**
   * Split public key into high and low 128-bit halves
   * Required for Poseidon nonce computation
   */
  splitPublicKey(publicKey: string): { high: string; low: string } {
    const bytes = decodeBase64(publicKey);

    if (bytes.length !== 32) {
      throw new Error("Invalid public key length");
    }

    // Split into two 16-byte (128-bit) parts
    const highBytes = bytes.slice(0, 16);
    const lowBytes = bytes.slice(16, 32);

    // Convert to big integers (as hex strings for field arithmetic)
    const high = Buffer.from(highBytes).toString("hex");
    const low = Buffer.from(lowBytes).toString("hex");

    return { high, low };
  }

  /**
   * Generate cryptographically secure randomness
   */
  generateRandomness(): string {
    const randomBytes = nacl.randomBytes(32);
    return encodeBase64(randomBytes);
  }

  /**
   * Store key in session storage (browser only)
   */
  storeKey(sessionKey: SessionKey): void {
    if (typeof sessionStorage === "undefined") {
      return;
    }

    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, JSON.stringify(sessionKey));
  }

  /**
   * Retrieve stored key from session storage
   */
  getStoredKey(): SessionKey | null {
    if (typeof sessionStorage === "undefined") {
      return null;
    }

    const stored = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as SessionKey;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored key
   */
  clearStoredKey(): void {
    if (typeof sessionStorage === "undefined") {
      return;
    }

    sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
  }

  /**
   * Check if a stored key is still valid
   */
  isKeyValid(key: SessionKey, currentEpoch: number): boolean {
    return currentEpoch <= key.maxEpoch;
  }

  /**
   * Convert public key bytes to Stellar address format
   */
  publicKeyToStellarAddress(publicKey: string): string {
    // This would use the Stellar SDK to convert
    // Ed25519 public key to Stellar G... address format
    const bytes = decodeBase64(publicKey);
    // Simplified - actual implementation uses StrKey
    return Buffer.from(bytes).toString("hex");
  }

  /**
   * Convert hex string to field element
   */
  hexToField(hex: string): bigint {
    return BigInt("0x" + hex);
  }
}
