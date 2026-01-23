/**
 * @fileoverview Comprehensive tests for ZkLoginClient
 * @description Tests for the main client orchestrating the zkLogin flow
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

// Mock dependencies before imports
vi.mock('../keys', () => ({
  EphemeralKeyManager: vi.fn().mockImplementation(() => ({
    generateKeyPair: vi.fn().mockReturnValue({
      publicKey: 'bW9ja1B1YmxpY0tleUFBQUFBQUFBQUFBQUFBQUFBQUE=',
      secretKey: 'bW9ja1NlY3JldEtleUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB',
    }),
    generateRandomness: vi.fn().mockReturnValue('bW9ja1JhbmRvbW5lc3NBQUFBQUFBQUFBQUFBQUFBQUE='),
    splitPublicKey: vi.fn().mockReturnValue({
      high: '00000000000000000000000000000000',
      low: '00000000000000000000000000000001',
    }),
    sign: vi.fn().mockReturnValue(new Uint8Array(64)),
    clearStoredKey: vi.fn(),
  })),
}));

vi.mock('../oauth', () => ({
  GoogleOAuthProvider: vi.fn().mockImplementation(() => ({
    getAuthorizationUrl: vi.fn().mockReturnValue('https://accounts.google.com/oauth?...'),
    exchangeCode: vi.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiYXVkIjoidGVzdC1jbGllbnQtaWQiLCJub25jZSI6InRlc3Qtbm9uY2UiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMH0.signature',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    }),
    getIssuer: vi.fn().mockReturnValue('https://accounts.google.com'),
  })),
  AppleOAuthProvider: vi.fn(),
}));

vi.mock('../prover', () => ({
  ProverClient: vi.fn().mockImplementation(() => ({
    generateProof: vi.fn().mockResolvedValue({
      proof: {
        a: ['0x1', '0x2'],
        b: [['0x3', '0x4'], ['0x5', '0x6']],
        c: ['0x7', '0x8'],
      },
      publicInputs: ['0x9', '0xa'],
    }),
  })),
}));

vi.mock('../x402', () => ({
  X402PaymentClient: vi.fn().mockImplementation(() => ({
    setPayerWallet: vi.fn(),
    fetchWithPayment: vi.fn(),
  })),
}));

vi.mock('../transaction', () => ({
  TransactionBuilder: vi.fn().mockImplementation(() => ({
    getCurrentLedger: vi.fn().mockResolvedValue(100000),
    buildSessionRegistration: vi.fn().mockResolvedValue('mock-tx-xdr'),
    buildTransaction: vi.fn().mockResolvedValue('mock-tx-xdr'),
    submitTransaction: vi.fn().mockResolvedValue({
      success: true,
      hash: 'mock-tx-hash',
    }),
    getBalance: vi.fn().mockResolvedValue('1000000000'),
  })),
}));

vi.mock('../utils/Address', () => ({
  computeAddressSeed: vi.fn().mockResolvedValue('mock-address-seed'),
  computeNonce: vi.fn().mockResolvedValue('mock-nonce'),
  deriveZkLoginAddress: vi.fn().mockResolvedValue('GABCD1234567890'),
}));

import { ZkLoginClient, type ZkLoginClientConfig } from '../client';
import { ErrorCode, ZkLoginError } from '../types';

describe('ZkLoginClient', () => {
  let client: ZkLoginClient;
  let config: ZkLoginClientConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      network: 'testnet',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      proverUrl: 'http://localhost:8080',
      saltServiceUrl: 'http://localhost:8081',
      contracts: {
        zkVerifier: 'CDAQXHNK2HZJJE6EDJAO3AWM6XQSM4C3IRB5R3AJSKFDRK4BZ77PACP6',
        gatewayFactory: 'CAAOQR7L5UVV7CZVYDS5IU72JKAUIEUBLTVLYGTBGBENULLNM3ZJIF76',
        jwkRegistry: 'CAMO5LYOANZWUZGJYNEBOAQ6SAQKQO3WBLTDBJ6VAGYNMBOIUOVXGS2I',
        smartWalletWasm: '2a7e72543da92134de77821c920b82e6c5fb7cd02b5283cfeb87deb894e14d5d',
        x402Facilitator: 'CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ',
      },
      googleClientId: 'test-client-id',
    };

    client = new ZkLoginClient(config);
  });

  describe('Initialization', () => {
    it('should create client with valid config', () => {
      expect(client).toBeDefined();
    });

    it('should not throw without optional OAuth providers', () => {
      const minimalConfig: ZkLoginClientConfig = {
        ...config,
        googleClientId: undefined,
        appleClientId: undefined,
      };

      expect(() => new ZkLoginClient(minimalConfig)).not.toThrow();
    });
  });

  describe('Session Initialization', () => {
    it('should initialize session with default epoch offset', async () => {
      const session = await client.initializeSession();

      expect(session).toBeDefined();
      expect(session.nonce).toBeDefined();
      expect(session.ephemeralPublicKey).toBeDefined();
      expect(session.maxEpoch).toBeDefined();
      expect(session.ephemeralKeyPair).toBeDefined();
    });

    it('should initialize session with custom epoch offset', async () => {
      const customOffset = 5000;
      const session = await client.initializeSession(customOffset);

      // maxEpoch should be currentLedger (100000) + customOffset
      expect(session.maxEpoch).toBe(100000 + customOffset);
    });

    it('should generate nonce for session', async () => {
      const session = await client.initializeSession();

      expect(session.nonce).toBe('mock-nonce');
    });
  });

  describe('OAuth Authorization URL', () => {
    it('should throw if session not initialized', () => {
      expect(() => client.getAuthorizationUrl('google', 'http://localhost/callback'))
        .toThrow(ZkLoginError);
    });

    it('should return authorization URL after session init', async () => {
      await client.initializeSession();
      const url = client.getAuthorizationUrl('google', 'http://localhost/callback');

      expect(url).toContain('https://accounts.google.com');
    });

    it('should throw for unconfigured provider', async () => {
      const clientWithoutApple = new ZkLoginClient({
        ...config,
        appleClientId: undefined,
      });

      await clientWithoutApple.initializeSession();

      expect(() => clientWithoutApple.getAuthorizationUrl('apple', 'http://localhost/callback'))
        .toThrow(ZkLoginError);
    });
  });

  describe('OAuth Completion', () => {
    it('should throw if session not initialized', async () => {
      await expect(client.completeOAuth('google', 'code', 'http://localhost/callback'))
        .rejects.toThrow(ZkLoginError);
    });

    it('should exchange code for token', async () => {
      await client.initializeSession();
      const token = await client.completeOAuth('google', 'test-code', 'http://localhost/callback');

      expect(token).toBeDefined();
      expect(token.accessToken).toBe('mock-access-token');
      expect(token.idToken).toBeDefined();
    });
  });

  describe('Salt Retrieval', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if no JWT available', async () => {
      await expect(client.getSalt()).rejects.toThrow(ZkLoginError);
    });

    it('should fetch salt after OAuth', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');

      const salt = await client.getSalt();

      expect(salt).toBe('mock-salt');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8081/get-salt',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle salt service errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');

      await expect(client.getSalt()).rejects.toThrow(ZkLoginError);
    });
  });

  describe('Address Computation', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if prerequisites not met', async () => {
      await expect(client.computeAddress()).rejects.toThrow(ZkLoginError);
    });

    it('should compute address after OAuth and salt', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();

      const result = await client.computeAddress();

      expect(result).toBeDefined();
      expect(result.address).toBe('GABCD1234567890');
      expect(result.addressSeed).toBe('mock-address-seed');
      expect(result.issuer).toBe('https://accounts.google.com');
    });
  });

  describe('Proof Generation', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if prerequisites not met', async () => {
      await expect(client.generateProof()).rejects.toThrow(ZkLoginError);
    });

    it('should generate proof', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();

      const proof = await client.generateProof();

      expect(proof).toBeDefined();
      expect(proof.proof).toBeDefined();
      expect(proof.publicInputs).toBeDefined();
    });
  });

  describe('Session Registration', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if proof not generated', async () => {
      await expect(client.registerSession()).rejects.toThrow(ZkLoginError);
    });

    it('should register session on-chain', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();
      await client.computeAddress();
      await client.generateProof();

      const sessionId = await client.registerSession();

      expect(sessionId).toBeDefined();
      expect(sessionId).toBe('mock-tx-hash');
    });
  });

  describe('Transaction Signing', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if no active session', async () => {
      await expect(client.signAndSubmitTransaction([])).rejects.toThrow(ZkLoginError);
    });
  });

  describe('Wallet Operations', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should get wallet address', async () => {
      expect(client.getAddress()).toBeNull();

      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();
      await client.computeAddress();

      expect(client.getAddress()).toBe('GABCD1234567890');
    });

    it('should check session activity', async () => {
      const isActive = await client.isSessionActive();
      expect(isActive).toBe(false);
    });

    it('should clear session', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();
      await client.computeAddress();

      client.clearSession();

      expect(client.getAddress()).toBeNull();
      expect(client.getSessionInfo()).toBeNull();
    });
  });

  describe('Balance Retrieval', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if no address', async () => {
      await expect(client.getBalance()).rejects.toThrow(ZkLoginError);
    });

    it('should get balance', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();
      await client.computeAddress();

      const balance = await client.getBalance();

      expect(balance).toBe('1000000000');
    });
  });

  describe('Transfer Operations', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if no session', async () => {
      await expect(client.transfer('token', 'dest', '100')).rejects.toThrow(ZkLoginError);
    });

    it('should validate transfer inputs', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();
      await client.computeAddress();

      await expect(client.transfer('', 'dest', '100')).rejects.toThrow(ZkLoginError);
      await expect(client.transfer('token', '', '100')).rejects.toThrow(ZkLoginError);
      await expect(client.transfer('token', 'dest', '')).rejects.toThrow(ZkLoginError);
    });
  });

  describe('x402 Payment Client', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ salt: 'mock-salt' }),
      }) as Mock;
    });

    it('should throw if no address for payment client', () => {
      expect(() => client.getPaymentClient()).toThrow(ZkLoginError);
    });

    it('should return payment client', async () => {
      await client.initializeSession();
      await client.completeOAuth('google', 'code', 'http://localhost/callback');
      await client.getSalt();
      await client.computeAddress();

      const paymentClient = client.getPaymentClient();

      expect(paymentClient).toBeDefined();
    });
  });
});
