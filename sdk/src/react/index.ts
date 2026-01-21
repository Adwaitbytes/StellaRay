/**
 * React Integration for Stellar zkLogin SDK
 *
 * Provides React hooks and components for easy integration.
 *
 * @example
 * ```tsx
 * import { ZkLoginProvider, useZkLogin, LoginButton } from '@stellar-zklogin/sdk/react';
 *
 * function App() {
 *   return (
 *     <ZkLoginProvider config={{ oauth: { google: { clientId: 'YOUR_ID' } } }}>
 *       <MyDApp />
 *     </ZkLoginProvider>
 *   );
 * }
 *
 * function MyDApp() {
 *   const { login, wallet, isLoggedIn } = useZkLogin();
 *
 *   if (!isLoggedIn) {
 *     return <LoginButton provider="google" />;
 *   }
 *
 *   return <div>Welcome! Balance: {wallet?.balance}</div>;
 * }
 * ```
 */

export { ZkLoginProvider, ZkLoginContext, useZkLoginContext } from './Provider';
export { useZkLogin } from './useZkLogin';
export { useWallet } from './useWallet';
export { useXRay } from './useXRay';
export { LoginButton } from './LoginButton';
export { WalletWidget } from './WalletWidget';
export type { ZkLoginProviderProps, ZkLoginContextValue } from './Provider';
