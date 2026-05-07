# StellaRay SDK Quickstart

Three-line integration of ZK Google Sign-In into any Stellar dApp.

---

## 1. Install

```bash
npm install @stellar-zklogin/sdk
# or
pnpm add @stellar-zklogin/sdk
# or
yarn add @stellar-zklogin/sdk
```

Requires Node.js 20+, a modern browser, and a Google OAuth client ID.

---

## 2. Get a Google OAuth Client ID

1. Open https://console.cloud.google.com/apis/credentials
2. Create credentials, OAuth client ID, Web application
3. Add your dApp's origin to "Authorized JavaScript origins" (e.g. `http://localhost:3000`, `https://your-dapp.com`)
4. Add your callback URL to "Authorized redirect URIs" (e.g. `http://localhost:3000/api/auth/callback/google`)
5. Copy the Client ID

---

## 3. Three-line integration

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

const zkLogin = new StellarZkLogin({
  network: 'testnet',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
});

const wallet = await zkLogin.login('google');
console.log(wallet.address); // GDKQ...
```

The user signs in with Google, the SDK generates an ephemeral keypair, requests a salt from the salt service, generates a Groth16 proof in 1 to 2 seconds, submits the proof to the ZK Verifier contract, and registers the ephemeral key as the wallet's signer for the session.

---

## 4. Sign a transaction

```typescript
import { Operation, TransactionBuilder } from '@stellar/stellar-sdk';

const tx = new TransactionBuilder(account, { fee, networkPassphrase })
  .addOperation(Operation.payment({
    destination: 'GABCD...',
    asset: Asset.native(),
    amount: '10',
  }))
  .setTimeout(180)
  .build();

const signed = await wallet.signTransaction(tx);
await server.submitTransaction(signed);
```

Same Stellar SDK transaction-building flow you already know. The signing happens through the smart wallet contract, gated by the ZK proof.

---

## 5. React integration

For React apps the SDK ships hooks and drop-in components:

```tsx
import { ZkLoginProvider, useZkLogin, LoginButton } from '@stellar-zklogin/sdk/react';

function App() {
  return (
    <ZkLoginProvider config={{ network: 'testnet', googleClientId: '...' }}>
      <LoginButton provider="google" />
      <WalletInfo />
    </ZkLoginProvider>
  );
}

function WalletInfo() {
  const { wallet, isConnected } = useZkLogin();
  if (!isConnected) return null;
  return <div>Address: {wallet.address}</div>;
}
```

---

## 6. Eligibility proofs

Beyond authentication, the SDK exposes the eligibility-proof framework. Solvency, identity, age, transaction-history attestations, all without revealing the underlying values.

```typescript
const proof = await wallet.proveEligibility({
  type: 'solvency',
  threshold: '1000',
  asset: 'native',
});

// Submit to a Soroban contract that requires solvency proof
await contract.gatedFunction({ proof });
```

The contract calls `verify_eligibility_proof` on the ZK Verifier contract; if the proof checks out, the gated function runs.

---

## 7. Mainnet

Switch the network parameter:

```typescript
const zkLogin = new StellarZkLogin({ network: 'mainnet', googleClientId: '...' });
```

Mainnet contract addresses are bundled with the SDK; no separate configuration needed.

---

## Troubleshooting

**`redirect_uri_mismatch` from Google**
Add your callback URL to "Authorized redirect URIs" in Google Cloud Console.

**Proof generation hangs on first call**
Browser proof generation takes 2 to 4 seconds the first time (WASM compilation). Subsequent proofs are faster. For lower latency, run a Rust prover service.

**`InvalidProof` error from the contract**
Check that the JWT issuer matches `iss_hash` in the verification key. Most often this is a Google client ID mismatch between the JWT and the salt request.

---

## Next Steps

- Full SDK reference at [docs.stellaray.fun](https://docs.stellaray.fun)
- Architecture details in [`TECHNICAL_ARCHITECTURE.md`](../TECHNICAL_ARCHITECTURE.md)
- Migration guides for moving from Albedo, Freighter, or the raw Stellar SDK ship in the cookbook (Tranche 2 of SCF #43)
- Self-hosted prover and salt service deployment in [`DEPLOYMENT.md`](DEPLOYMENT.md)
