/**
 * React Integration for Stellar zkLogin SDK
 *
 * Provides React hooks and components for the world's easiest wallet integration.
 *
 * @example Simple Usage
 * ```tsx
 * import { ZkLoginProvider, useWallet, LoginButton } from '@stellar-zklogin/sdk/react';
 *
 * function App() {
 *   return (
 *     <ZkLoginProvider
 *       config={{
 *         appName: 'My dApp',
 *         oauthClients: { google: 'YOUR_CLIENT_ID' }
 *       }}
 *     >
 *       <MyDApp />
 *     </ZkLoginProvider>
 *   );
 * }
 *
 * function MyDApp() {
 *   const { isConnected, address, connect, disconnect } = useWallet();
 *
 *   if (!isConnected) {
 *     return <LoginButton provider="google" />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome! Address: {address}</p>
 *       <button onClick={disconnect}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Provider (original)
export { ZkLoginProvider, ZkLoginContext, useZkLoginContext } from './Provider';
export type { ZkLoginProviderProps, ZkLoginContextValue } from './Provider';

// Hooks (original)
export { useZkLogin } from './useZkLogin';
export { useWallet } from './useWallet';
export { useXRay } from './useXRay';

// Types from hooks
export type { UseZkLoginReturn } from './useZkLogin';
export type { UseWalletReturn, Balance } from './useWallet';

// Components
export { LoginButton } from './LoginButton';
export { WalletWidget } from './WalletWidget';

// Re-export component props types
export type { LoginButtonProps } from './LoginButton';
export type { WalletWidgetProps } from './WalletWidget';
