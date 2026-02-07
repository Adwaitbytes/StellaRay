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
// IMPORTANT: Never use a hardcoded fallback - set SALT_DERIVATION_SECRET in your environment
const SALT_DERIVATION_SECRET = process.env.SALT_DERIVATION_SECRET;

if (!SALT_DERIVATION_SECRET) {
  console.error('FATAL: SALT_DERIVATION_SECRET environment variable is required. Generate one with: openssl rand -hex 32');
}

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
 * Parse JWT token (extract claims without strict expiration check)
 * For salt derivation, we need the sub claim even if token is expired
 * since the salt is deterministic based on identity, not session validity
 */
function parseJwt(token: string, checkExpiration: boolean = false): {
  iss: string;
  sub: string;
  aud: string;
  email?: string;
  nonce?: string;
  exp: number;
  expired?: boolean;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    // Basic validation - we need iss and sub for salt derivation
    if (!payload.iss || !payload.sub) return null;

    // Check expiration only if requested
    const isExpired = payload.exp && payload.exp < Math.floor(Date.now() / 1000);

    if (checkExpiration && isExpired) {
      return null;
    }

    return { ...payload, expired: isExpired };
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

    if (!SALT_DERIVATION_SECRET) {
      return NextResponse.json(
        { error: 'Server misconfiguration: SALT_DERIVATION_SECRET is not set' },
        { status: 500 }
      );
    }

    // Parse the JWT (don't check expiration - salt is based on identity, not session)
    // We need to derive the same salt even for expired tokens to maintain wallet consistency
    const claims = parseJwt(jwt, false);
    if (!claims) {
      return NextResponse.json(
        { error: 'Invalid JWT token - could not parse claims' },
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
      tokenExpired: claims.expired || false,
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
