/**
 * Stream Escrow Service
 *
 * Handles Stellar transactions for streaming payments.
 * Each stream has a dedicated escrow account that holds the funds.
 *
 * Flow:
 * 1. Create Stream: Sender → Escrow (full amount)
 * 2. Withdraw: Escrow → Recipient (withdrawable amount)
 * 3. Cancel: Escrow → Sender (remaining amount)
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import { getNetworkConfig, type NetworkType } from "./stellar";

// Escrow master seed - used to derive escrow accounts deterministically
// In production, this should be in secure env vars / HSM
const ESCROW_MASTER_SEED = process.env.STREAM_ESCROW_MASTER_SEED ||
  "STREAMING_PAYMENTS_ESCROW_MASTER_v1_stellaray";

/**
 * Derive an escrow keypair for a specific stream
 * Each stream gets its own escrow account for fund isolation
 */
export function deriveEscrowKeypair(streamId: string, network: NetworkType): StellarSdk.Keypair {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ESCROW_MASTER_SEED}:${streamId}:${network}`);
  const hash = StellarSdk.hash(Buffer.from(data));
  return StellarSdk.Keypair.fromRawEd25519Seed(hash);
}

/**
 * Get escrow account address for a stream
 */
export function getEscrowAddress(streamId: string, network: NetworkType): string {
  return deriveEscrowKeypair(streamId, network).publicKey();
}

/**
 * Create a Horizon server for the network
 */
function createServer(network: NetworkType): StellarSdk.Horizon.Server {
  const config = getNetworkConfig(network);
  return new StellarSdk.Horizon.Server(config.horizonUrl);
}

/**
 * Check if an account exists and is funded
 */
export async function accountExists(publicKey: string, network: NetworkType): Promise<boolean> {
  try {
    const server = createServer(network);
    await server.loadAccount(publicKey);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(publicKey: string, network: NetworkType): Promise<number> {
  try {
    const server = createServer(network);
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return 0;
    }
    throw error;
  }
}

/**
 * Fund escrow account and deposit streaming amount
 * Called when creating a new stream
 *
 * @param streamId - Unique stream ID
 * @param senderSecretKey - Sender's secret key
 * @param totalAmount - Total amount to stream
 * @param network - Stellar network
 * @returns Transaction hash
 */
export async function fundStreamEscrow(
  streamId: string,
  senderSecretKey: string,
  totalAmount: string,
  memo: string | undefined,
  network: NetworkType
): Promise<{ hash: string; escrowAddress: string }> {
  const config = getNetworkConfig(network);
  const server = createServer(network);

  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
  const escrowKeypair = deriveEscrowKeypair(streamId, network);

  // Load sender's account
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  // Check if escrow account exists
  const escrowExists = await accountExists(escrowKeypair.publicKey(), network);

  const txBuilder = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.passphrase,
  });

  if (!escrowExists) {
    // Create escrow account with minimum balance + stream amount
    // Minimum balance on Stellar is 1 XLM (base reserve)
    const createAmount = (parseFloat(totalAmount) + 1.5).toFixed(7); // Extra for fees and base reserve

    txBuilder.addOperation(
      StellarSdk.Operation.createAccount({
        destination: escrowKeypair.publicKey(),
        startingBalance: createAmount,
      })
    );
  } else {
    // Escrow exists, just send the amount
    txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: escrowKeypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: totalAmount,
      })
    );
  }

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));
  }

  const transaction = txBuilder.setTimeout(180).build();
  transaction.sign(senderKeypair);

  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    escrowAddress: escrowKeypair.publicKey(),
  };
}

/**
 * Withdraw funds from escrow to recipient
 * Called when recipient claims their streamed tokens
 *
 * @param streamId - Stream ID
 * @param recipientAddress - Recipient's public key
 * @param amount - Amount to withdraw
 * @param network - Stellar network
 * @returns Transaction hash
 */
export async function withdrawFromEscrow(
  streamId: string,
  recipientAddress: string,
  amount: string,
  network: NetworkType
): Promise<{ hash: string }> {
  const config = getNetworkConfig(network);
  const server = createServer(network);

  const escrowKeypair = deriveEscrowKeypair(streamId, network);

  // Load escrow account
  const escrowAccount = await server.loadAccount(escrowKeypair.publicKey());

  // Check escrow has enough balance (keeping 1 XLM for base reserve)
  const xlmBalance = escrowAccount.balances.find((b: any) => b.asset_type === 'native');
  const available = xlmBalance ? parseFloat(xlmBalance.balance) - 1 : 0; // Keep 1 XLM reserve

  if (available < parseFloat(amount)) {
    throw new Error(`Insufficient escrow balance. Available: ${available.toFixed(7)}, Requested: ${amount}`);
  }

  const txBuilder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.passphrase,
  });

  txBuilder.addOperation(
    StellarSdk.Operation.payment({
      destination: recipientAddress,
      asset: StellarSdk.Asset.native(),
      amount: parseFloat(amount).toFixed(7),
    })
  );

  txBuilder.addMemo(StellarSdk.Memo.text(`Stream withdraw`));

  const transaction = txBuilder.setTimeout(180).build();
  transaction.sign(escrowKeypair);

  const result = await server.submitTransaction(transaction);

  return { hash: result.hash };
}

/**
 * Cancel stream and return remaining funds to sender
 *
 * @param streamId - Stream ID
 * @param senderAddress - Sender's public key (to receive refund)
 * @param refundAmount - Amount to refund (total - already withdrawn)
 * @param network - Stellar network
 * @returns Transaction hash
 */
export async function cancelAndRefund(
  streamId: string,
  senderAddress: string,
  refundAmount: string,
  network: NetworkType
): Promise<{ hash: string }> {
  const config = getNetworkConfig(network);
  const server = createServer(network);

  const escrowKeypair = deriveEscrowKeypair(streamId, network);

  // Load escrow account
  const escrowAccount = await server.loadAccount(escrowKeypair.publicKey());

  const txBuilder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.passphrase,
  });

  // Only refund if there's an amount to refund
  if (parseFloat(refundAmount) > 0) {
    txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: senderAddress,
        asset: StellarSdk.Asset.native(),
        amount: parseFloat(refundAmount).toFixed(7),
      })
    );
  }

  txBuilder.addMemo(StellarSdk.Memo.text(`Stream cancelled`));

  const transaction = txBuilder.setTimeout(180).build();
  transaction.sign(escrowKeypair);

  const result = await server.submitTransaction(transaction);

  return { hash: result.hash };
}

/**
 * Close escrow account and merge remaining balance to sender
 * Called after stream is fully completed/cancelled
 */
export async function closeEscrowAccount(
  streamId: string,
  destinationAddress: string,
  network: NetworkType
): Promise<{ hash: string }> {
  const config = getNetworkConfig(network);
  const server = createServer(network);

  const escrowKeypair = deriveEscrowKeypair(streamId, network);

  // Check if escrow exists
  const exists = await accountExists(escrowKeypair.publicKey(), network);
  if (!exists) {
    throw new Error('Escrow account does not exist');
  }

  // Load escrow account
  const escrowAccount = await server.loadAccount(escrowKeypair.publicKey());

  const txBuilder = new StellarSdk.TransactionBuilder(escrowAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.passphrase,
  });

  // Merge account - sends all remaining XLM to destination and closes account
  txBuilder.addOperation(
    StellarSdk.Operation.accountMerge({
      destination: destinationAddress,
    })
  );

  const transaction = txBuilder.setTimeout(180).build();
  transaction.sign(escrowKeypair);

  const result = await server.submitTransaction(transaction);

  return { hash: result.hash };
}

/**
 * Verify sender has sufficient balance to create a stream
 */
export async function verifySenderBalance(
  senderAddress: string,
  totalAmount: string,
  network: NetworkType
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  const balance = await getAccountBalance(senderAddress, network);
  // Need amount + 2 XLM for escrow account creation + fees
  const required = parseFloat(totalAmount) + 2;

  return {
    sufficient: balance >= required,
    balance,
    required,
  };
}
