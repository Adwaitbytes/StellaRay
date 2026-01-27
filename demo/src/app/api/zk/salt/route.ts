/**
 * Salt Service API
 *
 * This endpoint provides user-specific salts for ZK login address derivation.
 * Salt is derived deterministically from the user's JWT claims to ensure
 * consistent wallet addresses across sessions.
 *
 * In production, this should use a secure HSM/KMS-backed storage system.
 * For demo purposes, we derive salt cryptographically from the user's identity.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

// Salt derivation secret - in production, this should be stored in HSM/KMS
const SALT_DERIVATION_SECRET = process.env.SALT_DERIVATION_SECRET || 'stellaray-zk-salt-secret-v1';

// Salt storage (in-memory for demo, use database in production)
const saltCache = new Map<string, string>();

/**
 * Generate a deterministic salt for a user
 * This ensures the same user always gets the same wallet address
 */
function deriveSalt(issuer: string, subject: string): string {
  // Create a deterministic salt from issuer + subject + secret
  const saltInput = `${issuer}:${subject}:${SALT_DERIVATION_SECRET}`;

  // Use HMAC-SHA256 for secure derivation
  const hmac = crypto.createHmac('sha256', SALT_DERIVATION_SECRET);
  hmac.update(saltInput);
  const hash = hmac.digest('hex');

  // Return first 32 characters as the salt (128 bits)
  return hash.slice(0, 32);
}

/**
 * Parse and verify JWT token (basic verification)
 */
function parseJwt(token: string): {
  iss: string;
  sub: string;
  aud: string;
  email?: string;
  nonce?: string;
  exp: number;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    // Basic validation
    if (!payload.iss || !payload.sub) return null;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT parse error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jwt } = body;

    if (!jwt) {
      return NextResponse.json(
        { error: 'JWT token is required' },
        { status: 400 }
      );
    }

    // Parse the JWT
    const claims = parseJwt(jwt);
    if (!claims) {
      return NextResponse.json(
        { error: 'Invalid or expired JWT token' },
        { status: 401 }
      );
    }

    // Create a cache key from issuer and subject
    const cacheKey = `${claims.iss}:${claims.sub}`;

    // Check cache first
    let salt = saltCache.get(cacheKey);

    if (!salt) {
      // Generate new salt
      salt = deriveSalt(claims.iss, claims.sub);

      // Cache it
      saltCache.set(cacheKey, salt);

      // In production, store in database:
      // await db.salts.upsert({ issuer: claims.iss, subject: claims.sub, salt });
    }

    return NextResponse.json({
      salt,
      issuer: claims.iss,
      subject: claims.sub,
    });
  } catch (error) {
    console.error('Salt service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'salt-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
