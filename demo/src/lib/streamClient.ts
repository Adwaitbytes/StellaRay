/**
 * Stream Client Utilities
 *
 * Client-side helpers for streaming payments.
 * Handles stream ID generation and escrow address derivation.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { getNetworkConfig, type NetworkType } from "./stellar";

// Must match the server-side ESCROW_MASTER_SEED
const ESCROW_MASTER_SEED = "STREAMING_PAYMENTS_ESCROW_MASTER_v1_stellaray";

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

/**
 * Derive escrow address for a stream
 * Must match server-side derivation
 */
export function getEscrowAddress(streamId: string, network: NetworkType): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ESCROW_MASTER_SEED}:${streamId}:${network}`);
  const hash = StellarSdk.hash(Buffer.from(data));
  const keypair = StellarSdk.Keypair.fromRawEd25519Seed(hash);
  return keypair.publicKey();
}

/**
 * Build a transaction to fund a stream escrow
 *
 * @param senderSecretKey - Sender's secret key
 * @param streamId - Pre-generated stream ID
 * @param totalAmount - Amount to stream (will add extra for escrow account creation)
 * @param memo - Optional memo
 * @param network - Network type
 * @returns Signed transaction XDR
 */
export async function buildFundEscrowTransaction(
  senderSecretKey: string,
  streamId: string,
  totalAmount: string,
  memo: string | undefined,
  network: NetworkType
): Promise<{ xdr: string; escrowAddress: string; hash: string }> {
  const config = getNetworkConfig(network);
  const server = new StellarSdk.Horizon.Server(config.horizonUrl);

  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
  const escrowAddress = getEscrowAddress(streamId, network);

  // Load sender's account
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  // Check if escrow account exists
  let escrowExists = false;
  try {
    await server.loadAccount(escrowAddress);
    escrowExists = true;
  } catch (e: any) {
    if (e.response?.status !== 404) throw e;
  }

  const txBuilder = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.passphrase,
  });

  if (!escrowExists) {
    // Create escrow account with minimum balance + stream amount
    // Minimum balance on Stellar is 1 XLM (base reserve) + extra for fees
    const createAmount = (parseFloat(totalAmount) + 1.5).toFixed(7);

    txBuilder.addOperation(
      StellarSdk.Operation.createAccount({
        destination: escrowAddress,
        startingBalance: createAmount,
      })
    );
  } else {
    // Escrow exists, just send the amount
    txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: escrowAddress,
        asset: StellarSdk.Asset.native(),
        amount: parseFloat(totalAmount).toFixed(7),
      })
    );
  }

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));
  }

  const transaction = txBuilder.setTimeout(180).build();
  transaction.sign(senderKeypair);

  return {
    xdr: transaction.toXDR(),
    escrowAddress,
    hash: transaction.hash().toString('hex'),
  };
}

/**
 * Submit a signed transaction
 */
export async function submitTransaction(
  xdr: string,
  network: NetworkType
): Promise<{ hash: string; success: boolean }> {
  const config = getNetworkConfig(network);
  const server = new StellarSdk.Horizon.Server(config.horizonUrl);

  const transaction = StellarSdk.TransactionBuilder.fromXDR(
    xdr,
    config.passphrase
  );

  const result = await server.submitTransaction(transaction as StellarSdk.Transaction);

  return {
    hash: result.hash,
    success: true,
  };
}

/**
 * Calculate escrow funding amount (total + reserves)
 */
export function calculateEscrowFunding(totalAmount: string): string {
  // Total amount + 1.5 XLM for account creation and fees
  return (parseFloat(totalAmount) + 1.5).toFixed(7);
}

/**
 * Verify sender has sufficient balance
 */
export function verifySufficientBalance(
  balance: number,
  totalAmount: string
): { sufficient: boolean; required: number; shortage: number } {
  const required = parseFloat(totalAmount) + 2; // Extra buffer for account creation + fees
  const shortage = Math.max(0, required - balance);

  return {
    sufficient: balance >= required,
    required,
    shortage,
  };
}
