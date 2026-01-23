/**
 * @fileoverview Comprehensive tests for Ephemeral Key Management
 * @description Tests for Ed25519 key generation, signing, and session management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EphemeralKeyManager, type EphemeralKeyPair, type SessionKey } from '../keys';

describe('EphemeralKeyManager', () => {
  let keyManager: EphemeralKeyManager;

  beforeEach(() => {
    keyManager = new EphemeralKeyManager();
    // Mock sessionStorage for browser tests
    vi.stubGlobal('sessionStorage', {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] || null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
    });
  });

  describe('Key Generation', () => {
    it('should generate a valid ephemeral key pair', () => {
      const keyPair = keyManager.generateKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.secretKey).toBeDefined();
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.secretKey).toBe('string');
    });

    it('should generate unique key pairs each time', () => {
      const keyPair1 = keyManager.generateKeyPair();
      const keyPair2 = keyManager.generateKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.secretKey).not.toBe(keyPair2.secretKey);
    });

    it('should generate keys with correct lengths (base64 encoded)', () => {
      const keyPair = keyManager.generateKeyPair();

      // Ed25519 public key is 32 bytes, base64 encoded = 44 chars
      expect(keyPair.publicKey.length).toBe(44);
      // Ed25519 secret key is 64 bytes, base64 encoded = 88 chars
      expect(keyPair.secretKey.length).toBe(88);
    });
  });

  describe('Signing and Verification', () => {
    let keyPair: EphemeralKeyPair;

    beforeEach(() => {
      keyPair = keyManager.generateKeyPair();
    });

    it('should sign a message correctly', () => {
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = keyManager.sign(message, keyPair);

      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBe(64); // Ed25519 signature is 64 bytes
    });

    it('should verify a valid signature', () => {
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = keyManager.sign(message, keyPair);
      const isValid = keyManager.verify(message, signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = keyManager.sign(message, keyPair);

      // Corrupt the signature
      signature[0] = signature[0] ^ 0xff;

      const isValid = keyManager.verify(message, signature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should reject signature for different message', () => {
      const message1 = new Uint8Array([1, 2, 3, 4, 5]);
      const message2 = new Uint8Array([5, 4, 3, 2, 1]);

      const signature = keyManager.sign(message1, keyPair);
      const isValid = keyManager.verify(message2, signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', () => {
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = keyManager.sign(message, keyPair);

      const otherKeyPair = keyManager.generateKeyPair();
      const isValid = keyManager.verify(message, signature, otherKeyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should sign empty message', () => {
      const message = new Uint8Array([]);
      const signature = keyManager.sign(message, keyPair);

      expect(signature.length).toBe(64);
      expect(keyManager.verify(message, signature, keyPair.publicKey)).toBe(true);
    });

    it('should sign large message', () => {
      const message = new Uint8Array(10000).fill(0xab);
      const signature = keyManager.sign(message, keyPair);

      expect(keyManager.verify(message, signature, keyPair.publicKey)).toBe(true);
    });
  });

  describe('Public Key Splitting', () => {
    it('should split public key into high and low parts', () => {
      const keyPair = keyManager.generateKeyPair();
      const { high, low } = keyManager.splitPublicKey(keyPair.publicKey);

      expect(high).toBeDefined();
      expect(low).toBeDefined();
      expect(typeof high).toBe('string');
      expect(typeof low).toBe('string');
    });

    it('should produce 16-byte (32 hex char) parts', () => {
      const keyPair = keyManager.generateKeyPair();
      const { high, low } = keyManager.splitPublicKey(keyPair.publicKey);

      expect(high.length).toBe(32); // 16 bytes = 32 hex chars
      expect(low.length).toBe(32);
    });

    it('should throw error for invalid public key length', () => {
      const invalidKey = 'invalid-key';

      expect(() => keyManager.splitPublicKey(invalidKey)).toThrow();
    });

    it('should produce deterministic splits', () => {
      const keyPair = keyManager.generateKeyPair();
      const split1 = keyManager.splitPublicKey(keyPair.publicKey);
      const split2 = keyManager.splitPublicKey(keyPair.publicKey);

      expect(split1.high).toBe(split2.high);
      expect(split1.low).toBe(split2.low);
    });
  });

  describe('Randomness Generation', () => {
    it('should generate randomness', () => {
      const randomness = keyManager.generateRandomness();

      expect(randomness).toBeDefined();
      expect(typeof randomness).toBe('string');
    });

    it('should generate unique randomness each time', () => {
      const r1 = keyManager.generateRandomness();
      const r2 = keyManager.generateRandomness();
      const r3 = keyManager.generateRandomness();

      expect(r1).not.toBe(r2);
      expect(r2).not.toBe(r3);
      expect(r1).not.toBe(r3);
    });

    it('should generate 32-byte randomness (base64 encoded)', () => {
      const randomness = keyManager.generateRandomness();
      // 32 bytes base64 encoded = 44 chars
      expect(randomness.length).toBe(44);
    });
  });

  describe('Session Storage', () => {
    it('should store and retrieve session key', () => {
      const keyPair = keyManager.generateKeyPair();
      const sessionKey: SessionKey = {
        keyPair,
        maxEpoch: 1000,
        createdAt: Date.now(),
        nonce: 'test-nonce',
      };

      keyManager.storeKey(sessionKey);
      const retrieved = keyManager.getStoredKey();

      expect(retrieved).toEqual(sessionKey);
    });

    it('should return null when no key is stored', () => {
      const retrieved = keyManager.getStoredKey();
      expect(retrieved).toBeNull();
    });

    it('should clear stored key', () => {
      const keyPair = keyManager.generateKeyPair();
      const sessionKey: SessionKey = {
        keyPair,
        maxEpoch: 1000,
        createdAt: Date.now(),
        nonce: 'test-nonce',
      };

      keyManager.storeKey(sessionKey);
      keyManager.clearStoredKey();
      const retrieved = keyManager.getStoredKey();

      expect(retrieved).toBeNull();
    });
  });

  describe('Key Validity Check', () => {
    it('should validate key within epoch', () => {
      const sessionKey: SessionKey = {
        keyPair: keyManager.generateKeyPair(),
        maxEpoch: 1000,
        createdAt: Date.now(),
        nonce: 'test-nonce',
      };

      expect(keyManager.isKeyValid(sessionKey, 500)).toBe(true);
      expect(keyManager.isKeyValid(sessionKey, 1000)).toBe(true);
    });

    it('should invalidate key past epoch', () => {
      const sessionKey: SessionKey = {
        keyPair: keyManager.generateKeyPair(),
        maxEpoch: 1000,
        createdAt: Date.now(),
        nonce: 'test-nonce',
      };

      expect(keyManager.isKeyValid(sessionKey, 1001)).toBe(false);
      expect(keyManager.isKeyValid(sessionKey, 2000)).toBe(false);
    });
  });

  describe('Field Element Conversion', () => {
    it('should convert hex to field element', () => {
      const hex = '0123456789abcdef';
      const fe = keyManager.hexToField(hex);

      expect(fe).toBe(BigInt('0x0123456789abcdef'));
    });

    it('should handle zero', () => {
      const fe = keyManager.hexToField('00');
      expect(fe).toBe(BigInt(0));
    });

    it('should handle large values', () => {
      const hex = 'ffffffffffffffffffffffffffffffff';
      const fe = keyManager.hexToField(hex);

      expect(fe).toBe(BigInt('0xffffffffffffffffffffffffffffffff'));
    });
  });
});
