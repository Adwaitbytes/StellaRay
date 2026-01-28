/**
 * Streaming Payments Library
 *
 * Implements real-time money streaming on Stellar network.
 * Inspired by Sablier (escrow model) and Superfluid (real-time balance).
 *
 * Features:
 * - Linear, cliff, exponential, and step streaming curves
 * - Real-time balance calculation
 * - Withdrawal at any time
 * - Cancellation with fair distribution
 * - Multi-stream support per user
 */

import { sql } from './db';

// ============================================
// TYPES
// ============================================

export type StreamStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type CurveType = 'linear' | 'cliff' | 'exponential' | 'steps';

export interface PaymentStream {
  id: string;
  senderAddress: string;
  senderEmail: string | null;
  recipientAddress: string;
  recipientEmail: string | null;
  totalAmount: string;
  asset: string;
  startTime: string;
  endTime: string;
  cliffTime: string | null;
  flowRate: string;
  curveType: CurveType;
  status: StreamStatus;
  withdrawnAmount: string;
  lastWithdrawalAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  depositTxHash: string | null;
  lastWithdrawalTxHash: string | null;
  cancelTxHash: string | null;
  title: string | null;
  description: string | null;
  memo: string | null;
  network: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStreamInput {
  senderAddress: string;
  senderEmail?: string;
  recipientAddress: string;
  recipientEmail?: string;
  totalAmount: string;
  asset?: string;
  startTime?: string; // ISO string, defaults to now
  durationSeconds: number;
  cliffSeconds?: number; // Cliff period from start
  curveType?: CurveType;
  title?: string;
  description?: string;
  memo?: string;
  network?: string;
}

export interface StreamCalculation {
  totalAmount: number;
  streamedAmount: number;
  withdrawnAmount: number;
  withdrawableAmount: number;
  remainingAmount: number;
  percentComplete: number;
  flowRatePerSecond: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isCliffPassed: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
}

export interface StreamStats {
  totalStreams: number;
  activeStreams: number;
  completedStreams: number;
  cancelledStreams: number;
  totalAmountStreamed: string;
  totalAmountWithdrawn: string;
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a URL-safe unique ID for streams
 * 16 chars = ~95 bits of entropy (very collision resistant)
 */
export function generateStreamId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ============================================
// STREAMING CURVES
// ============================================

/**
 * Calculate streamed amount based on curve type
 *
 * @param totalAmount - Total amount to stream
 * @param elapsed - Seconds elapsed since start
 * @param duration - Total duration in seconds
 * @param cliffDuration - Cliff duration in seconds (0 if no cliff)
 * @param curveType - Type of streaming curve
 */
export function calculateStreamedAmount(
  totalAmount: number,
  elapsed: number,
  duration: number,
  cliffDuration: number = 0,
  curveType: CurveType = 'linear'
): number {
  // Not started yet
  if (elapsed <= 0) return 0;

  // Completed
  if (elapsed >= duration) return totalAmount;

  // Check cliff
  if (cliffDuration > 0 && elapsed < cliffDuration) {
    return 0; // Nothing before cliff
  }

  // Adjust elapsed time after cliff
  const effectiveElapsed = cliffDuration > 0 ? elapsed - cliffDuration : elapsed;
  const effectiveDuration = cliffDuration > 0 ? duration - cliffDuration : duration;

  // Calculate progress (0 to 1)
  let progress = effectiveElapsed / effectiveDuration;

  // Apply curve transformation
  switch (curveType) {
    case 'linear':
      // Linear: progress stays as is
      break;

    case 'cliff':
      // Cliff is handled above, after cliff it's linear
      break;

    case 'exponential':
      // Exponential: slow start, fast finish (quadratic ease-in)
      progress = progress * progress;
      break;

    case 'steps':
      // Steps: 10 discrete unlock steps
      const steps = 10;
      progress = Math.floor(progress * steps) / steps;
      break;

    default:
      // Default to linear
      break;
  }

  // Calculate cliff amount if applicable
  const cliffAmount = cliffDuration > 0 ? (totalAmount * cliffDuration) / duration : 0;
  const postCliffAmount = totalAmount - cliffAmount;

  // For cliff streams, add cliff amount when cliff passes
  if (cliffDuration > 0 && elapsed >= cliffDuration) {
    return cliffAmount + postCliffAmount * progress;
  }

  return totalAmount * progress;
}

/**
 * Calculate all stream metrics at a given point in time
 */
export function calculateStreamMetrics(stream: PaymentStream, atTime?: Date): StreamCalculation {
  const now = atTime || new Date();
  const startTime = new Date(stream.startTime);
  const endTime = new Date(stream.endTime);
  const cliffTime = stream.cliffTime ? new Date(stream.cliffTime) : null;

  const totalAmount = parseFloat(stream.totalAmount);
  const withdrawnAmount = parseFloat(stream.withdrawnAmount);
  const flowRate = parseFloat(stream.flowRate);

  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
  const elapsedSeconds = Math.max(0, (now.getTime() - startTime.getTime()) / 1000);
  const remainingSeconds = Math.max(0, (endTime.getTime() - now.getTime()) / 1000);

  const cliffDuration = cliffTime
    ? (cliffTime.getTime() - startTime.getTime()) / 1000
    : 0;

  const isCliffPassed = !cliffTime || now >= cliffTime;
  const isActive = stream.status === 'active' && now >= startTime && now < endTime;
  const isCompleted = stream.status === 'completed' || (stream.status === 'active' && now >= endTime);
  const isCancelled = stream.status === 'cancelled';

  // Calculate streamed amount using the curve
  let streamedAmount = 0;
  if (isCancelled && stream.cancelledAt) {
    // For cancelled streams, calculate up to cancellation time
    const cancelTime = new Date(stream.cancelledAt);
    const elapsedAtCancel = (cancelTime.getTime() - startTime.getTime()) / 1000;
    streamedAmount = calculateStreamedAmount(
      totalAmount,
      elapsedAtCancel,
      durationSeconds,
      cliffDuration,
      stream.curveType
    );
  } else {
    streamedAmount = calculateStreamedAmount(
      totalAmount,
      elapsedSeconds,
      durationSeconds,
      cliffDuration,
      stream.curveType
    );
  }

  const withdrawableAmount = Math.max(0, streamedAmount - withdrawnAmount);
  const remainingAmount = totalAmount - streamedAmount;
  const percentComplete = (streamedAmount / totalAmount) * 100;

  return {
    totalAmount,
    streamedAmount,
    withdrawnAmount,
    withdrawableAmount,
    remainingAmount,
    percentComplete,
    flowRatePerSecond: flowRate,
    elapsedSeconds,
    remainingSeconds,
    isCliffPassed,
    isActive,
    isCompleted,
    isCancelled,
  };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Map database row to PaymentStream object
 */
function mapDbToStream(row: any): PaymentStream {
  return {
    id: row.id,
    senderAddress: row.sender_address,
    senderEmail: row.sender_email,
    recipientAddress: row.recipient_address,
    recipientEmail: row.recipient_email,
    totalAmount: row.total_amount?.toString() || '0',
    asset: row.asset,
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
    cliffTime: row.cliff_time ? new Date(row.cliff_time).toISOString() : null,
    flowRate: row.flow_rate?.toString() || '0',
    curveType: row.curve_type || 'linear',
    status: row.status,
    withdrawnAmount: row.withdrawn_amount?.toString() || '0',
    lastWithdrawalAt: row.last_withdrawal_at ? new Date(row.last_withdrawal_at).toISOString() : null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    depositTxHash: row.deposit_tx_hash,
    lastWithdrawalTxHash: row.last_withdrawal_tx_hash,
    cancelTxHash: row.cancel_tx_hash,
    title: row.title,
    description: row.description,
    memo: row.memo,
    network: row.network,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/**
 * Create a new payment stream
 */
export async function createStream(input: CreateStreamInput): Promise<PaymentStream> {
  const id = generateStreamId();
  const now = new Date();

  // Calculate times
  const startTime = input.startTime ? new Date(input.startTime) : now;
  const endTime = new Date(startTime.getTime() + input.durationSeconds * 1000);
  const cliffTime = input.cliffSeconds
    ? new Date(startTime.getTime() + input.cliffSeconds * 1000)
    : null;

  // Calculate flow rate (amount per second)
  const totalAmount = parseFloat(input.totalAmount);
  const flowRate = totalAmount / input.durationSeconds;

  // Determine initial status
  const status: StreamStatus = startTime <= now ? 'active' : 'pending';

  const result = await sql`
    INSERT INTO payment_streams (
      id,
      sender_address,
      sender_email,
      recipient_address,
      recipient_email,
      total_amount,
      asset,
      start_time,
      end_time,
      cliff_time,
      flow_rate,
      curve_type,
      status,
      title,
      description,
      memo,
      network,
      created_at,
      updated_at
    ) VALUES (
      ${id},
      ${input.senderAddress},
      ${input.senderEmail || null},
      ${input.recipientAddress},
      ${input.recipientEmail || null},
      ${totalAmount},
      ${input.asset || 'XLM'},
      ${startTime.toISOString()},
      ${endTime.toISOString()},
      ${cliffTime?.toISOString() || null},
      ${flowRate},
      ${input.curveType || 'linear'},
      ${status},
      ${input.title || null},
      ${input.description || null},
      ${input.memo || null},
      ${input.network || 'testnet'},
      ${now.toISOString()},
      ${now.toISOString()}
    )
    RETURNING *
  `;

  return mapDbToStream(result[0]);
}

/**
 * Create a new payment stream with a pre-generated ID
 * Used when the client has already funded the escrow
 */
export interface CreateStreamWithIdInput extends CreateStreamInput {
  id: string;
  depositTxHash?: string;
}

export async function createStreamWithId(input: CreateStreamWithIdInput): Promise<PaymentStream> {
  const now = new Date();

  // Calculate times
  const startTime = input.startTime ? new Date(input.startTime) : now;
  const endTime = new Date(startTime.getTime() + input.durationSeconds * 1000);
  const cliffTime = input.cliffSeconds
    ? new Date(startTime.getTime() + input.cliffSeconds * 1000)
    : null;

  // Calculate flow rate (amount per second)
  const totalAmount = parseFloat(input.totalAmount);
  const flowRate = totalAmount / input.durationSeconds;

  // Determine initial status - active since escrow is already funded
  const status: StreamStatus = startTime <= now ? 'active' : 'pending';

  const result = await sql`
    INSERT INTO payment_streams (
      id,
      sender_address,
      sender_email,
      recipient_address,
      recipient_email,
      total_amount,
      asset,
      start_time,
      end_time,
      cliff_time,
      flow_rate,
      curve_type,
      status,
      deposit_tx_hash,
      title,
      description,
      memo,
      network,
      created_at,
      updated_at
    ) VALUES (
      ${input.id},
      ${input.senderAddress},
      ${input.senderEmail || null},
      ${input.recipientAddress},
      ${input.recipientEmail || null},
      ${totalAmount},
      ${input.asset || 'XLM'},
      ${startTime.toISOString()},
      ${endTime.toISOString()},
      ${cliffTime?.toISOString() || null},
      ${flowRate},
      ${input.curveType || 'linear'},
      ${status},
      ${input.depositTxHash || null},
      ${input.title || null},
      ${input.description || null},
      ${input.memo || null},
      ${input.network || 'testnet'},
      ${now.toISOString()},
      ${now.toISOString()}
    )
    RETURNING *
  `;

  return mapDbToStream(result[0]);
}

/**
 * Get a stream by ID
 */
export async function getStream(id: string): Promise<PaymentStream | null> {
  const result = await sql`
    SELECT * FROM payment_streams WHERE id = ${id}
  `;

  if (result.length === 0) return null;

  // Auto-update status if needed
  const stream = mapDbToStream(result[0]);
  const now = new Date();
  const endTime = new Date(stream.endTime);

  // Mark as completed if past end time
  if (stream.status === 'active' && now >= endTime) {
    await sql`
      UPDATE payment_streams
      SET status = 'completed', completed_at = ${endTime.toISOString()}, updated_at = ${now.toISOString()}
      WHERE id = ${id} AND status = 'active'
    `;
    stream.status = 'completed';
    stream.completedAt = endTime.toISOString();
  }

  // Activate pending streams
  const startTime = new Date(stream.startTime);
  if (stream.status === 'pending' && now >= startTime) {
    await sql`
      UPDATE payment_streams
      SET status = 'active', updated_at = ${now.toISOString()}
      WHERE id = ${id} AND status = 'pending'
    `;
    stream.status = 'active';
  }

  return stream;
}

/**
 * Get streams where user is sender
 */
export async function getOutgoingStreams(
  senderAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaymentStream[]> {
  const result = await sql`
    SELECT * FROM payment_streams
    WHERE sender_address = ${senderAddress}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.map(mapDbToStream);
}

/**
 * Get streams where user is recipient
 */
export async function getIncomingStreams(
  recipientAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaymentStream[]> {
  const result = await sql`
    SELECT * FROM payment_streams
    WHERE recipient_address = ${recipientAddress}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.map(mapDbToStream);
}

/**
 * Get all streams for a user (both sent and received)
 */
export async function getAllUserStreams(
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaymentStream[]> {
  const result = await sql`
    SELECT * FROM payment_streams
    WHERE sender_address = ${address} OR recipient_address = ${address}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.map(mapDbToStream);
}

/**
 * Get stream statistics for a user
 */
export async function getStreamStats(address: string): Promise<StreamStats> {
  const statsResult = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COALESCE(SUM(CASE WHEN recipient_address = ${address} THEN CAST(withdrawn_amount AS DECIMAL) ELSE 0 END), 0) as total_received,
      COALESCE(SUM(CASE WHEN sender_address = ${address} THEN CAST(withdrawn_amount AS DECIMAL) ELSE 0 END), 0) as total_sent
    FROM payment_streams
    WHERE sender_address = ${address} OR recipient_address = ${address}
  `;

  const stats = statsResult[0];
  return {
    totalStreams: parseInt(stats.total) || 0,
    activeStreams: parseInt(stats.active) || 0,
    completedStreams: parseInt(stats.completed) || 0,
    cancelledStreams: parseInt(stats.cancelled) || 0,
    totalAmountStreamed: stats.total_sent?.toString() || '0',
    totalAmountWithdrawn: stats.total_received?.toString() || '0',
  };
}

/**
 * Record a withdrawal from a stream
 */
export async function recordWithdrawal(
  id: string,
  withdrawAmount: string,
  txHash: string
): Promise<PaymentStream | null> {
  const now = new Date().toISOString();
  const amount = parseFloat(withdrawAmount);

  const result = await sql`
    UPDATE payment_streams
    SET
      withdrawn_amount = withdrawn_amount + ${amount},
      last_withdrawal_at = ${now},
      last_withdrawal_tx_hash = ${txHash},
      updated_at = ${now}
    WHERE id = ${id} AND status IN ('active', 'completed')
    RETURNING *
  `;

  if (result.length === 0) return null;
  return mapDbToStream(result[0]);
}

/**
 * Cancel a stream
 */
export async function cancelStream(
  id: string,
  cancelTxHash?: string
): Promise<PaymentStream | null> {
  const now = new Date().toISOString();

  const result = await sql`
    UPDATE payment_streams
    SET
      status = 'cancelled',
      cancelled_at = ${now},
      cancel_tx_hash = ${cancelTxHash || null},
      updated_at = ${now}
    WHERE id = ${id} AND status IN ('pending', 'active')
    RETURNING *
  `;

  if (result.length === 0) return null;
  return mapDbToStream(result[0]);
}

/**
 * Record deposit transaction hash
 */
export async function recordDeposit(
  id: string,
  txHash: string
): Promise<PaymentStream | null> {
  const now = new Date().toISOString();

  const result = await sql`
    UPDATE payment_streams
    SET deposit_tx_hash = ${txHash}, updated_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) return null;
  return mapDbToStream(result[0]);
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate stream input
 */
export function validateStreamInput(input: CreateStreamInput): { valid: boolean; error?: string } {
  // Check addresses
  if (!input.senderAddress || input.senderAddress.length !== 56 || !input.senderAddress.startsWith('G')) {
    return { valid: false, error: 'Invalid sender address' };
  }

  if (!input.recipientAddress || input.recipientAddress.length !== 56 || !input.recipientAddress.startsWith('G')) {
    return { valid: false, error: 'Invalid recipient address' };
  }

  if (input.senderAddress === input.recipientAddress) {
    return { valid: false, error: 'Sender and recipient cannot be the same' };
  }

  // Check amount
  const amount = parseFloat(input.totalAmount);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }

  if (amount > 100000000000) {
    return { valid: false, error: 'Amount exceeds maximum (100 billion)' };
  }

  // Check duration
  if (!input.durationSeconds || input.durationSeconds < 60) {
    return { valid: false, error: 'Duration must be at least 60 seconds' };
  }

  if (input.durationSeconds > 365 * 24 * 60 * 60) {
    return { valid: false, error: 'Duration cannot exceed 1 year' };
  }

  // Check cliff
  if (input.cliffSeconds && input.cliffSeconds >= input.durationSeconds) {
    return { valid: false, error: 'Cliff must be less than total duration' };
  }

  // Check memo
  if (input.memo && input.memo.length > 28) {
    return { valid: false, error: 'Memo must be 28 characters or less' };
  }

  return { valid: true };
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format duration to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

/**
 * Format flow rate for display
 */
export function formatFlowRate(flowRate: number, asset: string = 'XLM'): string {
  if (flowRate < 0.000001) {
    return `${(flowRate * 86400).toFixed(7)} ${asset}/day`;
  }
  if (flowRate < 0.001) {
    return `${(flowRate * 3600).toFixed(7)} ${asset}/hour`;
  }
  if (flowRate < 1) {
    return `${(flowRate * 60).toFixed(7)} ${asset}/min`;
  }
  return `${flowRate.toFixed(7)} ${asset}/sec`;
}

/**
 * Format amount with proper decimals
 */
export function formatStreamAmount(amount: number, asset: string = 'XLM'): string {
  if (amount === 0) return `0 ${asset}`;
  if (amount < 0.0001) return `${amount.toFixed(7)} ${asset}`;
  if (amount < 1) return `${amount.toFixed(4)} ${asset}`;
  if (amount < 1000) return `${amount.toFixed(2)} ${asset}`;
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${asset}`;
}

/**
 * Get stream URL
 */
export function getStreamUrl(id: string, baseUrl: string): string {
  return `${baseUrl}/streams/${id}`;
}
