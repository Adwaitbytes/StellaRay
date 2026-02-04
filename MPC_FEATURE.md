# MPC Wallet Feature

**COMPLETELY SEPARATE from zkLogin** - This is a standalone feature using Shamir Secret Sharing + OAuth provider storage.

## What is MPC Wallet?

Multi-Party Computation wallet that splits your private key into 3 encrypted shares:
- Share 1 → Google Drive (encrypted)
- Share 2 → GitHub Gist (encrypted)
- Share 3 → iCloud/Another provider (encrypted)

**Any 2 shares** can sign transactions. If you lose 1 account, you can still recover.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         MPC WALLET CREATION                         │
├─────────────────────────────────────────────────────┤
│  1. Generate Stellar keypair                        │
│  2. Split private key into 3 shares (Shamir)        │
│  3. Encrypt each share with OAuth-derived key       │
│  4. Store shares:                                   │
│     - Share 1 → Google Drive appDataFolder          │
│     - Share 2 → GitHub Gist (private)               │
│     - Share 3 → iCloud/Apple CloudKit               │
│  5. Wipe private key from memory                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         MPC TRANSACTION SIGNING                     │
├─────────────────────────────────────────────────────┤
│  1. Authenticate with 2 OAuth providers             │
│  2. Retrieve encrypted shares from storage          │
│  3. Decrypt shares using OAuth-derived keys         │
│  4. Reconstruct private key (Shamir combine)        │
│  5. Sign transaction with Stellar SDK               │
│  6. WIPE private key from memory immediately        │
│  7. Submit signed transaction                       │
└─────────────────────────────────────────────────────┘
```

---

## Files Created (All NEW - Zero Overlap)

### Core Libraries
- `demo/src/lib/mpc/shamir.ts` - Shamir Secret Sharing
- `demo/src/lib/mpc/encryption.ts` - Share encryption/decryption
- `demo/src/lib/mpc/storage.ts` - OAuth provider storage (Google Drive, GitHub)
- `demo/src/lib/mpc/wallet.ts` - Main MPC orchestrator

### Frontend Pages
- `demo/src/app/mpc-wallet/page.tsx` - Create MPC wallet
- `demo/src/app/mpc-dashboard/page.tsx` - Manage MPC wallet

### API Routes
- `demo/src/app/api/mpc/create/route.ts` - Create MPC wallet
- `demo/src/app/api/mpc/sign/route.ts` - Sign transaction with MPC
- `demo/src/app/api/mpc/verify/route.ts` - Verify recovery status

---

## How to Use

### 1. Create MPC Wallet

Navigate to: `/mpc-wallet`

1. Click "Get Started"
2. Sign in with Provider 1 (e.g., your personal Gmail)
3. Sign in with Provider 2 (e.g., your work Gmail)
4. Sign in with Provider 3 (e.g., a friend's Gmail or GitHub)
5. Wallet created! Private key split into 3 shares

### 2. Use MPC Wallet

Navigate to: `/mpc-dashboard`

- View balance
- Send payments (requires 2 provider approvals)
- Verify recovery status

---

## Technical Details

### Shamir Secret Sharing

Uses `secrets.js-grempe` library:
```typescript
// Split into 3 shares, 2 needed to reconstruct
const shares = secrets.share(privateKey, 3, 2);
// shares = ['801abc...', '802def...', '803ghi...']

// Reconstruct from any 2 shares
const reconstructed = secrets.combine([shares[0], shares[1]]);
```

### Share Encryption

Each share is encrypted with AES-256-GCM using OAuth-derived key:
```typescript
// Derive key from OAuth identity
const key = PBKDF2(userSub, salt, 100000 iterations);

// Encrypt share
const encrypted = AES-GCM(share, key, iv);
```

### Share Storage

#### Google Drive
- Stored in `appDataFolder` (hidden from user)
- File name: `stellaray-mpc-share-1-{walletAddress}.json`
- Requires `drive.appdata` scope

#### GitHub Gist
- Stored as private gist
- Gist name: `stellaray-mpc-share-2.json`
- Requires `gist` scope

---

## Security Considerations

### ✅ Secure
- Private key NEVER stored in full
- Shares encrypted with strong AES-256-GCM
- OAuth-derived keys (unique per user)
- Private key wiped from memory after signing
- No single point of failure (need 2/3 providers)

### ⚠️ Risks
- Private key exists briefly in memory during signing
- If attacker gets 2/3 OAuth accounts, they can sign
- Share storage depends on OAuth provider security

---

## Differences from zkLogin

| Feature | zkLogin | MPC Wallet |
|---------|---------|------------|
| Private key | Derived deterministically from OAuth | Split into shares |
| Recovery | Re-login with same OAuth account | Need 2/3 OAuth accounts |
| Signing | Single OAuth provider | Requires 2 OAuth providers |
| Storage | No storage (key derived) | Shares stored in cloud |
| ZK Proofs | Yes (privacy-preserving) | No ZK proofs |
| Complexity | Lower | Higher |

---

## API Usage

### Create Wallet
```typescript
POST /api/mpc/create

Body: {
  providers: [
    { type: 'google', userSub: '12345', token: 'ya29...' },
    { type: 'github', userSub: '67890', token: 'ghp_...' },
    { type: 'google', userSub: '54321', token: 'ya29...' }
  ]
}

Response: {
  publicKey: 'GXXX...',
  shareIds: [
    { provider: 'google', storageId: 'file-id-1', index: 1 },
    { provider: 'github', storageId: 'gist-id', index: 2 },
    { provider: 'google', storageId: 'file-id-3', index: 3 }
  ]
}
```

### Sign Transaction
```typescript
POST /api/mpc/sign

Body: {
  transaction: 'AAAA...', // XDR
  providers: [
    { type: 'google', userSub: '12345', token: 'ya29...' },
    { type: 'github', userSub: '67890', token: 'ghp_...' }
  ],
  walletAddress: 'GXXX...',
  network: 'testnet'
}

Response: {
  signedTransaction: 'AAAA...',
  signatures: 1
}
```

---

## Testing

### Manual Test Flow
1. Create MPC wallet with 3 Google accounts
2. Note the wallet address
3. Fund wallet with Friendbot
4. Attempt to send payment (should require 2 providers)
5. Simulate losing 1 account (sign out)
6. Verify can still transact with other 2 accounts

### Recovery Test
1. Delete share from 1 provider
2. Verify recovery status shows 2/3 shares available
3. Confirm can still sign with remaining 2 shares

---

## Future Enhancements

- **Apple iCloud support** (CloudKit integration)
- **Hardware wallet as 3rd share** (Ledger/Trezor)
- **Share rotation** (change encryption keys without recreating wallet)
- **Biometric unlock** (FaceID/TouchID for local share decryption)
- **Social recovery flow UI** (guided recovery if account lost)
- **Multi-device sync** (shares accessible across devices)

---

## Production Checklist

- [ ] Test with 3 real OAuth accounts
- [ ] Verify share encryption/decryption
- [ ] Test Google Drive storage and retrieval
- [ ] Test GitHub Gist storage and retrieval
- [ ] Verify private key is wiped after signing
- [ ] Test recovery with 2/3 providers
- [ ] Load test share storage APIs
- [ ] Security audit of encryption implementation
- [ ] Add rate limiting to MPC endpoints
- [ ] Monitor for suspicious share access patterns

---

**Status:** ✅ Implemented and ready for testing

**Next Steps:**
1. Test wallet creation flow
2. Test transaction signing
3. Test recovery scenario
4. Add Apple iCloud support
5. Production deployment
