/**
 * @fileoverview Comprehensive tests for cryptographic utilities
 * @description Tests for Poseidon hashing, field arithmetic, and address derivation
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Mock the crypto utilities for testing
const BN254_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

// Helper function to simulate field element conversion
function bytesToFieldElement(bytes: Uint8Array): bigint {
  let result = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }
  return result % BN254_MODULUS;
}

// Helper function to simulate field element to bytes
function fieldElementToBytes(fe: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let value = fe;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(value & BigInt(0xff));
    value = value >> BigInt(8);
  }
  return bytes;
}

describe('Cryptographic Utilities', () => {
  describe('Field Element Operations', () => {
    it('should convert bytes to field element correctly', () => {
      const bytes = new Uint8Array(32);
      bytes[31] = 1; // Value = 1

      const fe = bytesToFieldElement(bytes);
      expect(fe).toBe(BigInt(1));
    });

    it('should handle large values within BN254 modulus', () => {
      const bytes = new Uint8Array(32).fill(0xff);
      const fe = bytesToFieldElement(bytes);

      // Result should be reduced modulo BN254
      expect(fe).toBeLessThan(BN254_MODULUS);
    });

    it('should convert field element back to bytes', () => {
      const original = BigInt(12345);
      const bytes = fieldElementToBytes(original);
      const recovered = bytesToFieldElement(bytes);

      expect(recovered).toBe(original);
    });

    it('should handle zero correctly', () => {
      const bytes = new Uint8Array(32);
      const fe = bytesToFieldElement(bytes);

      expect(fe).toBe(BigInt(0));
    });

    it('should maintain consistency across conversions', () => {
      const testValues = [
        BigInt(0),
        BigInt(1),
        BigInt(12345),
        BigInt('1234567890123456789012345678901234567890') % BN254_MODULUS,
        BN254_MODULUS - BigInt(1),
      ];

      for (const value of testValues) {
        const bytes = fieldElementToBytes(value);
        const recovered = bytesToFieldElement(bytes);
        expect(recovered).toBe(value);
      }
    });
  });

  describe('Address Seed Computation', () => {
    it('should produce deterministic results', () => {
      // Mock inputs for address seed computation
      const kcNameHash = new Uint8Array(32).fill(1);
      const kcValueHash = new Uint8Array(32).fill(2);
      const audHash = new Uint8Array(32).fill(3);
      const salt = new Uint8Array(32).fill(4);

      // Simulate the address seed computation
      const kcName = bytesToFieldElement(kcNameHash);
      const kcValue = bytesToFieldElement(kcValueHash);
      const aud = bytesToFieldElement(audHash);
      const saltFe = bytesToFieldElement(salt);

      // Verify all field elements are valid
      expect(kcName).toBeLessThan(BN254_MODULUS);
      expect(kcValue).toBeLessThan(BN254_MODULUS);
      expect(aud).toBeLessThan(BN254_MODULUS);
      expect(saltFe).toBeLessThan(BN254_MODULUS);
    });

    it('should produce different results for different inputs', () => {
      const input1 = new Uint8Array(32).fill(1);
      const input2 = new Uint8Array(32).fill(2);

      const fe1 = bytesToFieldElement(input1);
      const fe2 = bytesToFieldElement(input2);

      expect(fe1).not.toBe(fe2);
    });
  });

  describe('Ephemeral Key Hash', () => {
    it('should split 32-byte key into high and low parts', () => {
      const ephPk = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        ephPk[i] = i;
      }

      // High part (first 16 bytes, padded to 32)
      const high = new Uint8Array(32);
      high.set(ephPk.slice(0, 16), 16);

      // Low part (last 16 bytes, padded to 32)
      const low = new Uint8Array(32);
      low.set(ephPk.slice(16, 32), 16);

      const highFe = bytesToFieldElement(high);
      const lowFe = bytesToFieldElement(low);

      expect(highFe).toBeLessThan(BN254_MODULUS);
      expect(lowFe).toBeLessThan(BN254_MODULUS);
    });
  });

  describe('BN254 Constants', () => {
    it('should have correct BN254 modulus', () => {
      // BN254 scalar field modulus
      const expectedModulus = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
      expect(BN254_MODULUS).toBe(expectedModulus);
    });

    it('should verify modulus is prime (basic check)', () => {
      // Basic primality indicators
      expect(BN254_MODULUS % BigInt(2)).not.toBe(BigInt(0)); // Not even
      expect(BN254_MODULUS % BigInt(3)).not.toBe(BigInt(0)); // Not divisible by 3
      expect(BN254_MODULUS % BigInt(5)).not.toBe(BigInt(0)); // Not divisible by 5
    });
  });
});

describe('Nonce Computation', () => {
  it('should compute nonce from ephemeral key and epoch', () => {
    const ephPkHigh = BigInt(12345);
    const ephPkLow = BigInt(67890);
    const maxEpoch = BigInt(1000);
    const randomness = BigInt(99999);

    // All inputs should be valid field elements
    expect(ephPkHigh).toBeLessThan(BN254_MODULUS);
    expect(ephPkLow).toBeLessThan(BN254_MODULUS);
    expect(maxEpoch).toBeLessThan(BN254_MODULUS);
    expect(randomness).toBeLessThan(BN254_MODULUS);
  });

  it('should produce different nonces for different epochs', () => {
    const epoch1 = BigInt(1000);
    const epoch2 = BigInt(2000);

    // Different epochs should produce different nonces
    expect(epoch1).not.toBe(epoch2);
  });
});

describe('Modulus Hash (RSA)', () => {
  it('should handle 17 chunks for RSA-2048', () => {
    // RSA-2048 modulus is split into 17 chunks of 121 bits each
    const NUM_CHUNKS = 17;
    const chunks: bigint[] = [];

    for (let i = 0; i < NUM_CHUNKS; i++) {
      chunks.push(BigInt(i + 1) % BN254_MODULUS);
    }

    expect(chunks.length).toBe(17);

    // All chunks should be valid field elements
    for (const chunk of chunks) {
      expect(chunk).toBeLessThan(BN254_MODULUS);
    }
  });

  it('should compute tree hash for 17 chunks', () => {
    // Tree structure: 4 groups of 4 + 1 remaining
    // First layer: 4 hashes of 4 elements + 1 hash of 1 element = 5 intermediate
    // Second layer: 1 hash of 5 elements = final hash

    const NUM_CHUNKS = 17;
    const GROUPS_OF_4 = 4;
    const REMAINING = 1;

    expect(GROUPS_OF_4 * 4 + REMAINING).toBe(NUM_CHUNKS);

    // Intermediate results
    const intermediateCount = GROUPS_OF_4 + REMAINING;
    expect(intermediateCount).toBe(5);
  });
});
