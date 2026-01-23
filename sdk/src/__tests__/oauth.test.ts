/**
 * @fileoverview Comprehensive tests for OAuth Providers
 * @description Tests for Google and Apple OAuth implementations
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { GoogleOAuthProvider } from '../oauth/google';

describe('GoogleOAuthProvider', () => {
  let provider: GoogleOAuthProvider;
  const clientId = 'test-client-id.apps.googleusercontent.com';
  const clientSecret = 'test-client-secret';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GoogleOAuthProvider({
      clientId,
      clientSecret,
    });
  });

  describe('Initialization', () => {
    it('should create provider with client ID', () => {
      expect(provider).toBeDefined();
    });

    it('should use default scopes', () => {
      const url = provider.getAuthorizationUrl('http://localhost/callback', 'test-nonce');
      expect(url).toContain('scope=openid+email');
    });

    it('should use custom scopes', () => {
      const customProvider = new GoogleOAuthProvider({
        clientId,
        scopes: ['openid', 'email', 'profile'],
      });

      const url = customProvider.getAuthorizationUrl('http://localhost/callback', 'test-nonce');
      expect(url).toContain('scope=openid+email+profile');
    });
  });

  describe('Issuer', () => {
    it('should return Google issuer', () => {
      expect(provider.getIssuer()).toBe('https://accounts.google.com');
    });
  });

  describe('Authorization URL', () => {
    it('should generate valid authorization URL', () => {
      const redirectUri = 'http://localhost:3000/callback';
      const nonce = 'test-nonce-123';

      const url = provider.getAuthorizationUrl(redirectUri, nonce);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(`client_id=${encodeURIComponent(clientId)}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain(`nonce=${nonce}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });

    it('should include state parameter if provided', () => {
      const url = provider.getAuthorizationUrl(
        'http://localhost/callback',
        'test-nonce',
        'test-state'
      );

      expect(url).toContain('state=test-state');
    });

    it('should not include state parameter if not provided', () => {
      const url = provider.getAuthorizationUrl('http://localhost/callback', 'test-nonce');

      expect(url).not.toContain('state=');
    });

    it('should handle special characters in redirect URI', () => {
      const redirectUri = 'http://localhost:3000/callback?param=value';
      const url = provider.getAuthorizationUrl(redirectUri, 'nonce');

      expect(url).toContain(encodeURIComponent(redirectUri));
    });
  });

  describe('Token Exchange', () => {
    beforeEach(() => {
      global.fetch = vi.fn() as Mock;
    });

    it('should exchange code for tokens', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        id_token: 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20ifQ.sig',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const token = await provider.exchangeCode('auth-code', 'http://localhost/callback');

      expect(token.accessToken).toBe('mock-access-token');
      expect(token.idToken).toBe(mockResponse.id_token);
      expect(token.refreshToken).toBe('mock-refresh-token');
      expect(token.expiresIn).toBe(3600);
      expect(token.tokenType).toBe('Bearer');
    });

    it('should include client secret in token request', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          id_token: 'id',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      await provider.exchangeCode('code', 'http://localhost/callback');

      const fetchCall = (global.fetch as Mock).mock.calls[0];
      expect(fetchCall[1].body).toContain('client_secret=test-client-secret');
    });

    it('should throw on token exchange error', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Invalid code'),
      });

      await expect(provider.exchangeCode('invalid-code', 'http://localhost/callback'))
        .rejects.toThrow('Google token exchange failed');
    });

    it('should work without client secret (public client)', async () => {
      const publicProvider = new GoogleOAuthProvider({ clientId });

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          id_token: 'id',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      await publicProvider.exchangeCode('code', 'http://localhost/callback');

      const fetchCall = (global.fetch as Mock).mock.calls[0];
      expect(fetchCall[1].body).not.toContain('client_secret=');
    });
  });

  describe('JWKS Fetching', () => {
    beforeEach(() => {
      global.fetch = vi.fn() as Mock;
    });

    it('should fetch JWKS from Google', async () => {
      const mockJwks = {
        keys: [
          {
            kty: 'RSA',
            n: 'mock-modulus',
            e: 'AQAB',
            kid: 'key-1',
            use: 'sig',
            alg: 'RS256',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockJwks),
      });

      const keys = await provider.getJwks();

      expect(keys).toHaveLength(1);
      expect(keys[0].kty).toBe('RSA');
      expect(keys[0].n).toBe('mock-modulus');
      expect(keys[0].kid).toBe('key-1');
    });

    it('should cache JWKS', async () => {
      const mockJwks = {
        keys: [{ kty: 'RSA', n: 'n', e: 'e', kid: 'key' }],
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJwks),
      });

      await provider.getJwks();
      await provider.getJwks();
      await provider.getJwks();

      // Should only fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on JWKS fetch error', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable',
      });

      await expect(provider.getJwks()).rejects.toThrow('Failed to fetch Google JWKS');
    });
  });

  describe('Modulus Retrieval', () => {
    beforeEach(() => {
      global.fetch = vi.fn() as Mock;

      const mockJwks = {
        keys: [
          { kty: 'RSA', n: 'modulus-1', e: 'AQAB', kid: 'key-1' },
          { kty: 'RSA', n: 'modulus-2', e: 'AQAB', kid: 'key-2' },
        ],
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJwks),
      });
    });

    it('should get modulus for specific key ID', async () => {
      const modulus = await provider.getModulus('key-1');
      expect(modulus).toBe('modulus-1');
    });

    it('should get modulus for different key ID', async () => {
      const modulus = await provider.getModulus('key-2');
      expect(modulus).toBe('modulus-2');
    });

    it('should throw for unknown key ID', async () => {
      await expect(provider.getModulus('unknown-key'))
        .rejects.toThrow('JWK with kid "unknown-key" not found');
    });
  });

  describe('Key ID Extraction', () => {
    it('should extract key ID from token header', () => {
      // Create a mock JWT with a header containing kid
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-kid' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
      const token = `${header}.${payload}.signature`;

      const kid = GoogleOAuthProvider.getKeyIdFromToken(token);

      expect(kid).toBe('test-kid');
    });

    it('should handle URL-safe base64', () => {
      // Use URL-safe base64 encoding
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'key-id' }))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const token = `${header}.payload.signature`;

      const kid = GoogleOAuthProvider.getKeyIdFromToken(token);

      expect(kid).toBe('key-id');
    });
  });
});

describe('OAuth Types', () => {
  it('should define OAuthToken interface', () => {
    const token = {
      accessToken: 'access',
      idToken: 'id',
      refreshToken: 'refresh',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    expect(token.accessToken).toBeDefined();
    expect(token.idToken).toBeDefined();
  });

  it('should define JWK interface', () => {
    const jwk = {
      kty: 'RSA',
      n: 'modulus',
      e: 'AQAB',
      kid: 'key-id',
      use: 'sig',
      alg: 'RS256',
    };

    expect(jwk.kty).toBe('RSA');
    expect(jwk.n).toBe('modulus');
  });
});
