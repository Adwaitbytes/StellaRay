/**
 * Payment Link Utility Functions (Client-safe)
 *
 * These functions don't require database access and can be used on the client.
 */

// Format amount for display
export function formatAmount(amount: string | null, asset: string = 'XLM'): string {
  if (!amount) return `Any amount (${asset})`;
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${asset}`;
}

// Check if link is expired
export function isLinkExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// Get time until expiration
export function getTimeUntilExpiration(expiresAt: string | null): string | null {
  if (!expiresAt) return null;

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Validate Stellar address format
export function isValidStellarAddress(address: string): boolean {
  if (!address || address.length !== 56) return false;
  if (!address.startsWith('G')) return false;
  return /^G[A-Z2-7]{55}$/.test(address);
}

// Validate amount
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 100000000000;
}

// Generate payment link URL
export function getPaymentLinkUrl(id: string, baseUrl: string): string {
  return `${baseUrl}/pay/${id}`;
}

// Generate Stellar URI for wallet apps
export function getStellarPayUri(
  recipientAddress: string,
  amount?: string | null,
  memo?: string | null,
  asset?: string
): string {
  let uri = `web+stellar:pay?destination=${recipientAddress}`;

  if (amount) {
    uri += `&amount=${amount}`;
  }

  if (memo) {
    uri += `&memo=${encodeURIComponent(memo)}&memo_type=MEMO_TEXT`;
  }

  if (asset && asset !== 'XLM') {
    // For non-XLM assets, would need issuer
    // uri += `&asset_code=${asset}&asset_issuer=...`;
  }

  return uri;
}
