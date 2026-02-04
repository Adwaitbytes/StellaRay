/**
 * Shamir Secret Sharing Implementation
 * Splits private keys into shares for MPC wallet recovery
 */

import secrets from 'secrets.js-grempe';

export class ShamirSharing {
  /**
   * Split a private key into N shares with K threshold
   * @param privateKey - Hex string of private key
   * @param threshold - Minimum shares needed to reconstruct (e.g., 2)
   * @param totalShares - Total number of shares to create (e.g., 3)
   * @returns Array of share strings
   */
  static split(privateKey: string, threshold: number, totalShares: number): string[] {
    if (threshold > totalShares) {
      throw new Error('Threshold cannot exceed total shares');
    }
    if (threshold < 2) {
      throw new Error('Threshold must be at least 2');
    }

    return secrets.share(privateKey, totalShares, threshold);
  }

  /**
   * Reconstruct private key from shares
   * @param shares - Array of share strings (minimum = threshold)
   * @returns Reconstructed private key hex string
   */
  static combine(shares: string[]): string {
    if (shares.length < 2) {
      throw new Error('Need at least 2 shares to reconstruct');
    }

    return secrets.combine(shares);
  }

  /**
   * Validate that shares can be combined
   * @param shares - Array of shares to validate
   * @returns true if valid, false otherwise
   */
  static validate(shares: string[]): boolean {
    try {
      secrets.combine(shares);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get share metadata
   * @param share - Share string
   * @returns Metadata about the share
   */
  static getShareInfo(share: string): {
    id: number;
    bits: number;
    threshold: number;
  } {
    // Shamir shares encode metadata in first 3 chars
    const id = parseInt(share.substring(0, 1), 16);
    const bits = parseInt(share.substring(1, 3), 16) * 4;

    return {
      id,
      bits,
      threshold: 0 // Not encoded in share format
    };
  }
}
