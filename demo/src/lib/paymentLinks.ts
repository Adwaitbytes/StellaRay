/**
 * Payment Links Utility Library
 *
 * Handles creation, retrieval, and management of payment links.
 */

import { sql } from './db';

// Payment Link Types
export interface PaymentLink {
  id: string;
  creatorAddress: string;
  creatorEmail: string | null;
  recipientAddress: string;
  amount: string | null;
  asset: string;
  memo: string | null;
  description: string | null;
  expiresAt: string | null;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  paymentTxHash: string | null;
  paidAt: string | null;
  paidAmount: string | null;
  paidBy: string | null;
  network: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface CreatePaymentLinkInput {
  creatorAddress: string;
  creatorEmail?: string;
  recipientAddress: string;
  amount?: string;
  asset?: string;
  memo?: string;
  description?: string;
  expiresAt?: string;
  network?: string;
}

export interface PaymentLinkStats {
  total: number;
  active: number;
  paid: number;
  expired: number;
  totalAmountReceived: string;
}

// Generate a short, URL-safe unique ID
export function generatePaymentLinkId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Create a new payment link
export async function createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLink> {
  const id = generatePaymentLinkId();
  const now = new Date().toISOString();

  const result = await sql`
    INSERT INTO payment_links (
      id,
      creator_address,
      creator_email,
      recipient_address,
      amount,
      asset,
      memo,
      description,
      expires_at,
      network,
      status,
      created_at,
      updated_at
    ) VALUES (
      ${id},
      ${input.creatorAddress},
      ${input.creatorEmail || null},
      ${input.recipientAddress},
      ${input.amount || null},
      ${input.asset || 'XLM'},
      ${input.memo || null},
      ${input.description || null},
      ${input.expiresAt ? new Date(input.expiresAt).toISOString() : null},
      ${input.network || 'testnet'},
      'active',
      ${now},
      ${now}
    )
    RETURNING *
  `;

  return mapDbToPaymentLink(result[0]);
}

// Get a payment link by ID
export async function getPaymentLink(id: string): Promise<PaymentLink | null> {
  const result = await sql`
    SELECT * FROM payment_links WHERE id = ${id}
  `;

  if (result.length === 0) {
    return null;
  }

  // Increment view count
  await sql`
    UPDATE payment_links
    SET view_count = view_count + 1, last_viewed_at = ${new Date().toISOString()}
    WHERE id = ${id}
  `;

  return mapDbToPaymentLink(result[0]);
}

// Get payment links by creator address
export async function getPaymentLinksByCreator(
  creatorAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaymentLink[]> {
  const result = await sql`
    SELECT * FROM payment_links
    WHERE creator_address = ${creatorAddress}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.map(mapDbToPaymentLink);
}

// Get payment link stats for a creator
export async function getPaymentLinkStats(creatorAddress: string): Promise<PaymentLinkStats> {
  const statsResult = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
      COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
      COALESCE(SUM(CASE WHEN status = 'paid' AND asset = 'XLM' THEN CAST(paid_amount AS DECIMAL) ELSE 0 END), 0) as total_xlm_received
    FROM payment_links
    WHERE creator_address = ${creatorAddress}
  `;

  const stats = statsResult[0];
  return {
    total: parseInt(stats.total) || 0,
    active: parseInt(stats.active) || 0,
    paid: parseInt(stats.paid) || 0,
    expired: parseInt(stats.expired) || 0,
    totalAmountReceived: stats.total_xlm_received?.toString() || '0',
  };
}

// Mark a payment link as paid
export async function markPaymentLinkAsPaid(
  id: string,
  txHash: string,
  paidAmount: string,
  paidBy: string
): Promise<PaymentLink | null> {
  const now = new Date().toISOString();

  const result = await sql`
    UPDATE payment_links
    SET
      status = 'paid',
      payment_tx_hash = ${txHash},
      paid_at = ${now},
      paid_amount = ${paidAmount},
      paid_by = ${paidBy},
      updated_at = ${now}
    WHERE id = ${id} AND status = 'active'
    RETURNING *
  `;

  if (result.length === 0) {
    return null;
  }

  return mapDbToPaymentLink(result[0]);
}

// Cancel a payment link
export async function cancelPaymentLink(id: string, creatorAddress: string): Promise<boolean> {
  const result = await sql`
    UPDATE payment_links
    SET status = 'cancelled', updated_at = ${new Date().toISOString()}
    WHERE id = ${id} AND creator_address = ${creatorAddress} AND status = 'active'
    RETURNING id
  `;

  return result.length > 0;
}

// Check and update expired payment links
export async function updateExpiredLinks(): Promise<number> {
  const result = await sql`
    UPDATE payment_links
    SET status = 'expired', updated_at = ${new Date().toISOString()}
    WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING id
  `;

  return result.length;
}

// Generate payment link URL
export function getPaymentLinkUrl(id: string, baseUrl: string): string {
  return `${baseUrl}/pay/${id}`;
}

// Generate Stellar URI for wallet apps
export function getStellarPayUri(link: PaymentLink): string {
  let uri = `web+stellar:pay?destination=${link.recipientAddress}`;

  if (link.amount) {
    uri += `&amount=${link.amount}`;
  }

  if (link.memo) {
    uri += `&memo=${encodeURIComponent(link.memo)}&memo_type=MEMO_TEXT`;
  }

  if (link.asset && link.asset !== 'XLM') {
    // For non-XLM assets, would need issuer
    // uri += `&asset_code=${link.asset}&asset_issuer=...`;
  }

  return uri;
}

// Map database row to PaymentLink object
function mapDbToPaymentLink(row: any): PaymentLink {
  return {
    id: row.id,
    creatorAddress: row.creator_address,
    creatorEmail: row.creator_email,
    recipientAddress: row.recipient_address,
    amount: row.amount,
    asset: row.asset,
    memo: row.memo,
    description: row.description,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    status: row.status,
    paymentTxHash: row.payment_tx_hash,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    paidAmount: row.paid_amount,
    paidBy: row.paid_by,
    network: row.network,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    viewCount: row.view_count || 0,
    lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at).toISOString() : null,
  };
}

// Validate Stellar address format
export function isValidStellarAddress(address: string): boolean {
  if (!address || address.length !== 56) return false;
  if (!address.startsWith('G')) return false;
  // Basic check - proper validation would use stellar-sdk
  return /^G[A-Z2-7]{55}$/.test(address);
}

// Validate amount
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 100000000000; // Max 100 billion
}

// Format amount for display
export function formatAmount(amount: string | null, asset: string = 'XLM'): string {
  if (!amount) return `Any amount (${asset})`;
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${asset}`;
}

// Check if link is expired
export function isLinkExpired(link: PaymentLink): boolean {
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt) < new Date();
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
