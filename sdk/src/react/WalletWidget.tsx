/**
 * WalletWidget Component
 *
 * Full-featured wallet widget with balance, send, and session info.
 */

import React, { useState, useCallback } from 'react';
import { useZkLogin } from './useZkLogin';
import { useWallet } from './useWallet';

/**
 * WalletWidget props
 */
export interface WalletWidgetProps {
  /** Theme */
  theme?: 'light' | 'dark';
  /** Show balance */
  showBalance?: boolean;
  /** Show send form */
  showSend?: boolean;
  /** Show session info */
  showSession?: boolean;
  /** Show logout button */
  showLogout?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** On send success */
  onSendSuccess?: (txHash: string) => void;
  /** On send error */
  onSendError?: (error: Error) => void;
}

/**
 * Full-featured wallet widget
 *
 * @example
 * ```tsx
 * <WalletWidget
 *   theme="dark"
 *   showBalance
 *   showSend
 *   onSendSuccess={(hash) => console.log('Sent:', hash)}
 * />
 * ```
 */
export function WalletWidget({
  theme = 'light',
  showBalance = true,
  showSend = true,
  showSession = false,
  showLogout = true,
  className,
  style,
  onSendSuccess,
  onSendError,
}: WalletWidgetProps): React.ReactElement {
  const { wallet, logout, isLoggedIn } = useZkLogin();
  const { address, balance, balanceLoading, sendPayment, isPending } = useWallet();

  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAsset, setSendAsset] = useState('native');

  const isDark = theme === 'dark';

  const handleSend = useCallback(async () => {
    if (!sendTo || !sendAmount) return;

    try {
      const result = await sendPayment(sendTo, sendAsset, sendAmount);
      onSendSuccess?.(result.hash);
      setSendTo('');
      setSendAmount('');
    } catch (err) {
      onSendError?.(err as Error);
    }
  }, [sendTo, sendAmount, sendAsset, sendPayment, onSendSuccess, onSendError]);

  if (!isLoggedIn) {
    return (
      <div style={{ ...containerStyles(isDark), ...style }} className={className}>
        <p style={{ textAlign: 'center', color: isDark ? '#888' : '#666' }}>
          Not connected
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyles(isDark), ...style }} className={className}>
      {/* Header */}
      <div style={headerStyles(isDark)}>
        <div>
          <span style={{ fontSize: '12px', color: isDark ? '#888' : '#666' }}>
            Stellar zkLogin Wallet
          </span>
        </div>
        {showLogout && (
          <button
            onClick={logout}
            style={logoutButtonStyles(isDark)}
            type="button"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Address */}
      <div style={addressStyles(isDark)}>
        <span style={{ fontSize: '12px', color: isDark ? '#888' : '#666' }}>
          Address
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {address ? `${address.slice(0, 8)}...${address.slice(-8)}` : '---'}
          </span>
          <button
            onClick={() => address && navigator.clipboard.writeText(address)}
            style={copyButtonStyles(isDark)}
            type="button"
            title="Copy address"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balance */}
      {showBalance && (
        <div style={balanceStyles(isDark)}>
          <span style={{ fontSize: '12px', color: isDark ? '#888' : '#666' }}>
            Balance
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700 }}>
            {balanceLoading ? '...' : balance ?? '0'} XLM
          </span>
        </div>
      )}

      {/* Send Form */}
      {showSend && (
        <div style={sendFormStyles(isDark)}>
          <span style={{ fontSize: '12px', color: isDark ? '#888' : '#666', marginBottom: '8px' }}>
            Send Payment
          </span>
          <input
            type="text"
            placeholder="Recipient address (G...)"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            style={inputStyles(isDark)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="Amount"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              style={{ ...inputStyles(isDark), flex: 1 }}
            />
            <select
              value={sendAsset}
              onChange={(e) => setSendAsset(e.target.value)}
              style={{ ...inputStyles(isDark), width: '100px' }}
            >
              <option value="native">XLM</option>
            </select>
          </div>
          <button
            onClick={handleSend}
            disabled={isPending || !sendTo || !sendAmount}
            style={sendButtonStyles(isDark, isPending)}
            type="button"
          >
            {isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}

      {/* Session Info */}
      {showSession && wallet?.getSession && (
        <div style={sessionStyles(isDark)}>
          <span style={{ fontSize: '12px', color: isDark ? '#888' : '#666' }}>
            Session
          </span>
          <div style={{ fontSize: '11px', color: isDark ? '#666' : '#999' }}>
            <div>Status: Active</div>
            <div>Type: zkLogin (OAuth)</div>
          </div>
        </div>
      )}

      {/* X-Ray Badge */}
      <div style={xrayBadgeStyles(isDark)}>
        <span style={{ fontSize: '10px' }}>
          Powered by X-Ray Protocol 25
        </span>
      </div>
    </div>
  );
}

// Styles
const containerStyles = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#1a1a1a' : '#fff',
  color: isDark ? '#fff' : '#000',
  borderRadius: '12px',
  padding: '16px',
  width: '320px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  boxShadow: isDark
    ? '0 4px 20px rgba(0, 0, 0, 0.5)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDark ? '#333' : '#eee'}`,
});

const headerStyles = (isDark: boolean): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`,
});

const logoutButtonStyles = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: 'transparent',
  border: `1px solid ${isDark ? '#444' : '#ddd'}`,
  color: isDark ? '#888' : '#666',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer',
});

const addressStyles = (isDark: boolean): React.CSSProperties => ({
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const copyButtonStyles = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: 'transparent',
  border: 'none',
  color: isDark ? '#888' : '#666',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
});

const balanceStyles = (isDark: boolean): React.CSSProperties => ({
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const sendFormStyles = (isDark: boolean): React.CSSProperties => ({
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: isDark ? '#222' : '#f9f9f9',
  borderRadius: '8px',
});

const inputStyles = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#333' : '#fff',
  border: `1px solid ${isDark ? '#444' : '#ddd'}`,
  color: isDark ? '#fff' : '#000',
  padding: '10px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
});

const sendButtonStyles = (isDark: boolean, disabled: boolean): React.CSSProperties => ({
  backgroundColor: disabled ? (isDark ? '#333' : '#ddd') : '#39FF14',
  color: disabled ? (isDark ? '#666' : '#999') : '#000',
  border: 'none',
  padding: '12px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const sessionStyles = (isDark: boolean): React.CSSProperties => ({
  marginBottom: '12px',
  padding: '8px',
  backgroundColor: isDark ? '#222' : '#f5f5f5',
  borderRadius: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const xrayBadgeStyles = (isDark: boolean): React.CSSProperties => ({
  textAlign: 'center',
  color: '#39FF14',
  opacity: 0.7,
  paddingTop: '8px',
  borderTop: `1px solid ${isDark ? '#333' : '#eee'}`,
});

export default WalletWidget;
