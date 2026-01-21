# @stellar-zklogin/sdk

> **The World's Best zkLogin SDK for Stellar** - Replace wallets with social login in 3 lines of code.

[![npm version](https://badge.fury.io/js/%40stellar-zklogin%2Fsdk.svg)](https://www.npmjs.com/package/@stellar-zklogin/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## Why zkLogin?

Traditional blockchain wallets kill mainstream adoption:
- ❌ Users must install browser extensions
- ❌ Managing seed phrases is error-prone
- ❌ Poor mobile experience
- ❌ Complex onboarding

**zkLogin solves this** - users authenticate with Google/Apple while maintaining true self-custody through zero-knowledge cryptography.

## Features

- 🚀 **3-Line Integration** - Get started in minutes, not days
- 🔐 **Zero Wallet Extensions** - No Freighter, Ledger, or any external wallet
- 🌐 **Social Login** - Google, Apple, and more OAuth providers
- 💾 **Auto Persistence** - Encrypted IndexedDB sessions
- 🔗 **Full Soroban Support** - Call any smart contract
- 📱 **Mobile-First** - Works on all devices
- 🎨 **React Components** - Pre-built UI included
- 🛡️ **X-Ray Protocol** - BN254 + Poseidon (CAP-0074/75)
- ⚡ **True Self-Custody** - Users control their keys via ZK proofs

## Installation

```bash
npm install @stellar-zklogin/sdk
# or
pnpm add @stellar-zklogin/sdk
# or
yarn add @stellar-zklogin/sdk
```

## Quick Start (3 Lines!)

```typescript
import { createWallet } from '@stellar-zklogin/sdk';

const wallet = createWallet({ appName: 'My dApp', oauthClients: { google: 'YOUR_ID' } });
const account = await wallet.connect('google');
console.log('Logged in:', account.address);
```

**That's it!** Users can now login with Google and have a fully functional Stellar wallet.

### Legacy API (Still Supported)

```typescript
import { StellarZkLogin } from '@stellar-zklogin/sdk';

const zkLogin = new StellarZkLogin({
  network: 'testnet',
  oauth: { google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' } }
});

const wallet = await zkLogin.login('google');
console.log('Address:', wallet.getAddress());
await wallet.sendPayment('GDEST...', 'native', '10');
```

### React Integration

```tsx
import { ZkLoginProvider, useZkLogin, LoginButton } from '@stellar-zklogin/sdk/react';

// Wrap your app with the provider
function App() {
  return (
    <ZkLoginProvider
      config={{
        network: 'testnet',
        oauth: { google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' } }
      }}
    >
      <MyDApp />
    </ZkLoginProvider>
  );
}

// Use hooks in your components
function MyDApp() {
  const { wallet, isLoggedIn, login, logout } = useZkLogin();

  if (!isLoggedIn) {
    return <LoginButton provider="google" />;
  }

  return (
    <div>
      <p>Address: {wallet.getAddress()}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Configuration

### Full Configuration Options

```typescript
const zkLogin = new StellarZkLogin({
  // Network (default: 'testnet')
  network: 'testnet' | 'mainnet',

  // OAuth providers
  oauth: {
    google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' },
    apple: { clientId: 'YOUR_APPLE_CLIENT_ID' }
  },

  // Custom contract addresses (optional - uses defaults)
  contracts: {
    zkVerifier: 'CAQISC6...',
    gatewayFactory: 'CD62OWX...',
    smartWalletWasmHash: '3747d3d...',
    jwkRegistry: 'CC3AVC4...',
    x402Facilitator: 'CDJMT4P...'
  },

  // Custom endpoints (optional)
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  proverUrl: 'https://prover.zklogin.stellar.org',
  saltServiceUrl: 'https://salt.zklogin.stellar.org'
});
```

### Default Testnet Contracts

The SDK comes pre-configured with deployed testnet contracts:

```typescript
import { TESTNET_CONTRACTS } from '@stellar-zklogin/sdk';

console.log(TESTNET_CONTRACTS);
// {
//   zkVerifier: 'CAQISC6MBAMGSAVRPRO2GZ3WPDREZW72XDPCHTF2DFUDE45YFIHEIH56',
//   smartWalletWasmHash: '3747d3dfab113f7c16ae435556e267de66cec574523c6c8629989bc5a7d37cd8',
//   gatewayFactory: 'CD62OWXRDPTQ3YHYSSFV7WCAJQU7F4RCEW7XMSMP46POCJ6DBA7D7EZR',
//   jwkRegistry: 'CC3AVC4YGWMDYRJLQBXNUXQF3BF6TXDDDJ4SNSDMHVUCRAJIJGNWCHKN',
//   x402Facilitator: 'CDJMT4P4DUZVRRLTF7Z3WCXK6YJ57PVB6K7FUCGW7ZOI5LDFAWBWTTZZ'
// }
```

## API Reference

### StellarZkLogin

Main SDK class for simplified zkLogin integration.

```typescript
class StellarZkLogin {
  // Login with OAuth provider
  login(provider: 'google' | 'apple'): Promise<EmbeddedWallet>;

  // Complete OAuth flow after redirect
  completeLogin(provider, code, redirectUri): Promise<EmbeddedWallet>;

  // Logout and clear session
  logout(): void;

  // Check if logged in
  isLoggedIn(): boolean;

  // Get current wallet
  getWallet(): EmbeddedWallet | null;

  // Get wallet address
  getAddress(): string | null;

  // Subscribe to events
  on(event: 'login' | 'logout' | 'error', handler): void;
  off(event, handler): void;

  // Get underlying client for advanced usage
  getClient(): ZkLoginClient;
}
```

### EmbeddedWallet

Wallet interface returned after login.

```typescript
interface EmbeddedWallet {
  // Get wallet address
  getAddress(): string;

  // Get balance (native XLM or token)
  getBalance(tokenAddress?: string): Promise<string>;

  // Send payment
  sendPayment(to: string, asset: string, amount: string): Promise<TransactionResult>;

  // Sign a custom transaction
  signTransaction(txXdr: string): Promise<string>;

  // Get session info
  getSession(): Session | null;

  // Check if session is still active
  isActive(): Promise<boolean>;
}
```

### X-Ray Protocol

Access X-Ray Protocol features (native BN254 + Poseidon).

```typescript
import { XRayClient } from '@stellar-zklogin/sdk';

const xray = new XRayClient({ network: 'testnet' });

// Get protocol metrics
const metrics = await xray.getMetrics();
console.log('Proofs verified:', metrics.proofsVerified);

// Estimate gas savings
const estimate = xray.estimateGas('bn254_pairing');
console.log('Gas savings:', estimate.savingsPercent + '%');

// Calculate Groth16 verification savings
const savings = xray.calculateGroth16Savings();
console.log('Total savings:', savings.savingsPercent + '%');
```

## React Hooks

### useZkLogin

Main authentication hook.

```tsx
const {
  login,       // (provider) => Promise<EmbeddedWallet>
  logout,      // () => void
  isLoggedIn,  // boolean
  isLoading,   // boolean
  wallet,      // EmbeddedWallet | null
  address,     // string | null
  error,       // Error | null
  clearError   // () => void
} = useZkLogin();
```

### useWallet

Wallet operations hook.

```tsx
const {
  address,        // string | null
  balance,        // string | null
  balanceLoading, // boolean
  refreshBalance, // () => Promise<void>
  sendPayment,    // (to, asset, amount) => Promise<TransactionResult>
  isPending,      // boolean
  error           // Error | null
} = useWallet();
```

### useXRay

X-Ray Protocol hook.

```tsx
const {
  metrics,              // XRayMetrics | null
  status,               // XRayStatus | null
  tps,                  // number
  loading,              // boolean
  refresh,              // () => Promise<void>
  estimateGas,          // (operation) => GasEstimate
  calculateGroth16Savings,
  isSupported,          // boolean
  protocolVersion       // number
} = useXRay();
```

## React Components

### LoginButton

Pre-built OAuth login button.

```tsx
<LoginButton
  provider="google"           // 'google' | 'apple'
  text="Sign in with Google"  // Custom text
  variant="default"           // 'default' | 'minimal' | 'branded'
  size="md"                   // 'sm' | 'md' | 'lg'
  onSuccess={(wallet) => {}}
  onError={(error) => {}}
/>
```

### WalletWidget

Full-featured wallet widget.

```tsx
<WalletWidget
  theme="dark"        // 'light' | 'dark'
  showBalance={true}
  showSend={true}
  showLogout={true}
  onSendSuccess={(hash) => {}}
/>
```

## How It Works

The SDK eliminates the need for external wallets through:

1. **Ephemeral Keys** - Generated in browser, stored in session storage
2. **ZK Authorization** - OAuth JWT converted to ZK proof
3. **Smart Contract Wallet** - On-chain wallet validates ZK proofs
4. **X-Ray Protocol** - Native BN254/Poseidon for efficient verification

```
┌─────────────────────────────────────┐
│          USER'S BROWSER             │
│  OAuth JWT → ZK Proof → Ephemeral   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       STELLAR BLOCKCHAIN            │
│   Smart Wallet verifies ZK proof    │
│   and executes transactions         │
└─────────────────────────────────────┘
```

## Security

- Private keys never leave the browser
- OAuth tokens are used only for proof generation
- Session expires after configurable epoch
- ZK proofs reveal nothing about OAuth identity
- Smart contract validates all operations

## License

MIT

## Links

- [Documentation](https://zklogin.stellar.org/docs)
- [GitHub](https://github.com/stellar-zklogin/sdk)
- [X-Ray Protocol (CAP-0062/63)](https://stellar.org/protocol)
