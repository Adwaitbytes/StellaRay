/**
 * OAuth Types
 */

/**
 * Configuration for OAuth provider
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
}

/**
 * OAuth token response
 */
export interface OAuthToken {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * OAuth provider interface
 */
export interface OAuthProvider {
  /**
   * Get the OAuth issuer URL
   */
  getIssuer(): string;

  /**
   * Get the authorization URL
   */
  getAuthorizationUrl(redirectUri: string, nonce: string, state?: string): string;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string, redirectUri: string): Promise<OAuthToken>;

  /**
   * Verify and decode ID token
   */
  verifyIdToken(idToken: string): Promise<Record<string, unknown>>;

  /**
   * Get JWKS (JSON Web Key Set)
   */
  getJwks(): Promise<JWK[]>;
}

/**
 * JSON Web Key
 */
export interface JWK {
  kty: string;
  n?: string;
  e?: string;
  kid: string;
  use?: string;
  alg?: string;
}
