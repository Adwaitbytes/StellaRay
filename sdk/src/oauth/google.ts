/**
 * Google OAuth Provider
 *
 * Implements OAuth 2.0 with OpenID Connect for Google Sign-In.
 */

import * as jose from "jose";
import type { OAuthProvider, OAuthConfig, OAuthToken, JWK } from "./types";

const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";

export class GoogleOAuthProvider implements OAuthProvider {
  private config: OAuthConfig;
  private jwksCache?: { keys: JWK[]; fetchedAt: number };
  private readonly JWKS_CACHE_TTL = 3600000; // 1 hour

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      scopes: config.scopes ?? ["openid", "email"],
    };
  }

  getIssuer(): string {
    return GOOGLE_ISSUER;
  }

  getAuthorizationUrl(redirectUri: string, nonce: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: this.config.scopes!.join(" "),
      nonce,
      access_type: "offline",
      prompt: "consent",
    });

    if (state) {
      params.set("state", state);
    }

    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthToken> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    if (this.config.clientSecret) {
      body.set("client_secret", this.config.clientSecret);
    }

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async verifyIdToken(idToken: string): Promise<Record<string, unknown>> {
    const JWKS = jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URI));

    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: GOOGLE_ISSUER,
      audience: this.config.clientId,
    });

    return payload as Record<string, unknown>;
  }

  async getJwks(): Promise<JWK[]> {
    // Return cached JWKS if still valid
    if (
      this.jwksCache &&
      Date.now() - this.jwksCache.fetchedAt < this.JWKS_CACHE_TTL
    ) {
      return this.jwksCache.keys;
    }

    const response = await fetch(GOOGLE_JWKS_URI);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google JWKS: ${response.statusText}`);
    }

    const data = await response.json();
    const keys: JWK[] = data.keys.map((key: Record<string, unknown>) => ({
      kty: key.kty as string,
      n: key.n as string,
      e: key.e as string,
      kid: key.kid as string,
      use: key.use as string | undefined,
      alg: key.alg as string | undefined,
    }));

    this.jwksCache = {
      keys,
      fetchedAt: Date.now(),
    };

    return keys;
  }

  /**
   * Get the RSA modulus for a specific key ID
   */
  async getModulus(kid: string): Promise<string> {
    const jwks = await this.getJwks();
    const key = jwks.find((k) => k.kid === kid);

    if (!key || !key.n) {
      throw new Error(`JWK with kid "${kid}" not found`);
    }

    return key.n;
  }

  /**
   * Parse JWT header to get key ID
   */
  static getKeyIdFromToken(idToken: string): string {
    const [headerB64] = idToken.split(".");
    const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")));
    return header.kid;
  }
}
