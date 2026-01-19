/**
 * Apple OAuth Provider
 *
 * Implements Sign in with Apple using OAuth 2.0 / OpenID Connect.
 */

import * as jose from "jose";
import type { OAuthProvider, OAuthConfig, OAuthToken, JWK } from "./types";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_AUTH_ENDPOINT = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token";
const APPLE_JWKS_URI = "https://appleid.apple.com/auth/keys";

/**
 * Extended config for Apple OAuth
 */
export interface AppleOAuthConfig extends OAuthConfig {
  teamId?: string;
  keyId?: string;
  privateKey?: string;
}

export class AppleOAuthProvider implements OAuthProvider {
  private config: AppleOAuthConfig;
  private jwksCache?: { keys: JWK[]; fetchedAt: number };
  private readonly JWKS_CACHE_TTL = 3600000; // 1 hour

  constructor(config: AppleOAuthConfig) {
    this.config = {
      ...config,
      scopes: config.scopes ?? ["openid", "email", "name"],
    };
  }

  getIssuer(): string {
    return APPLE_ISSUER;
  }

  getAuthorizationUrl(redirectUri: string, nonce: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code id_token",
      response_mode: "form_post",
      scope: this.config.scopes!.join(" "),
      nonce,
    });

    if (state) {
      params.set("state", state);
    }

    return `${APPLE_AUTH_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthToken> {
    const clientSecret = await this.generateClientSecret();

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const response = await fetch(APPLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple token exchange failed: ${error}`);
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
    const JWKS = jose.createRemoteJWKSet(new URL(APPLE_JWKS_URI));

    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: APPLE_ISSUER,
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

    const response = await fetch(APPLE_JWKS_URI);
    if (!response.ok) {
      throw new Error(`Failed to fetch Apple JWKS: ${response.statusText}`);
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
   * Generate client secret JWT for Apple
   *
   * Apple requires a JWT signed with your private key as the client_secret.
   */
  private async generateClientSecret(): Promise<string> {
    if (!this.config.teamId || !this.config.keyId || !this.config.privateKey) {
      throw new Error(
        "Apple OAuth requires teamId, keyId, and privateKey for server-side token exchange"
      );
    }

    const privateKey = await jose.importPKCS8(this.config.privateKey, "ES256");

    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({
        alg: "ES256",
        kid: this.config.keyId,
      })
      .setIssuer(this.config.teamId)
      .setSubject(this.config.clientId)
      .setAudience(APPLE_ISSUER)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    return jwt;
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
