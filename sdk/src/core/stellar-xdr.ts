/**
 * Stellar XDR Serialization
 *
 * Proper XDR (External Data Representation) encoding for Stellar transactions.
 * This implements the minimum required XDR types for zkLogin transactions.
 *
 * Based on Stellar's XDR specification:
 * https://github.com/stellar/stellar-xdr
 */

import { blake2b256 } from "./blake2b";

// Network passphrases
export const NETWORK_PASSPHRASE = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
  standalone: "Standalone Network ; February 2017",
} as const;

export type NetworkType = keyof typeof NETWORK_PASSPHRASE;

/**
 * XDR Writer - encodes data to XDR format
 */
export class XdrWriter {
  private buffer: number[] = [];

  /**
   * Write unsigned 32-bit integer
   */
  writeUint32(value: number): void {
    this.buffer.push(
      (value >> 24) & 0xff,
      (value >> 16) & 0xff,
      (value >> 8) & 0xff,
      value & 0xff
    );
  }

  /**
   * Write signed 32-bit integer
   */
  writeInt32(value: number): void {
    this.writeUint32(value >>> 0);
  }

  /**
   * Write unsigned 64-bit integer
   */
  writeUint64(value: bigint): void {
    const high = Number((value >> 32n) & 0xffffffffn);
    const low = Number(value & 0xffffffffn);
    this.writeUint32(high);
    this.writeUint32(low);
  }

  /**
   * Write signed 64-bit integer
   */
  writeInt64(value: bigint): void {
    this.writeUint64(value);
  }

  /**
   * Write boolean
   */
  writeBool(value: boolean): void {
    this.writeInt32(value ? 1 : 0);
  }

  /**
   * Write opaque fixed-length data
   */
  writeOpaque(data: Uint8Array): void {
    for (const byte of data) {
      this.buffer.push(byte);
    }
    // Pad to 4-byte boundary
    const padding = (4 - (data.length % 4)) % 4;
    for (let i = 0; i < padding; i++) {
      this.buffer.push(0);
    }
  }

  /**
   * Write variable-length opaque data
   */
  writeVarOpaque(data: Uint8Array): void {
    this.writeUint32(data.length);
    this.writeOpaque(data);
  }

  /**
   * Write string (variable length)
   */
  writeString(str: string): void {
    const bytes = new TextEncoder().encode(str);
    this.writeVarOpaque(bytes);
  }

  /**
   * Write raw bytes without length prefix
   */
  writeRaw(data: Uint8Array): void {
    for (const byte of data) {
      this.buffer.push(byte);
    }
  }

  /**
   * Get the encoded buffer
   */
  toBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Get Base64-encoded result
   */
  toBase64(): string {
    return bufferToBase64(this.toBuffer());
  }
}

/**
 * XDR Reader - decodes XDR format
 */
export class XdrReader {
  private buffer: Uint8Array;
  private offset: number = 0;

  constructor(data: Uint8Array | string) {
    if (typeof data === "string") {
      this.buffer = base64ToBuffer(data);
    } else {
      this.buffer = data;
    }
  }

  /**
   * Read unsigned 32-bit integer
   */
  readUint32(): number {
    const value =
      (this.buffer[this.offset] << 24) |
      (this.buffer[this.offset + 1] << 16) |
      (this.buffer[this.offset + 2] << 8) |
      this.buffer[this.offset + 3];
    this.offset += 4;
    return value >>> 0;
  }

  /**
   * Read signed 32-bit integer
   */
  readInt32(): number {
    const value = this.readUint32();
    return value | 0;
  }

  /**
   * Read unsigned 64-bit integer
   */
  readUint64(): bigint {
    const high = BigInt(this.readUint32());
    const low = BigInt(this.readUint32());
    return (high << 32n) | low;
  }

  /**
   * Read boolean
   */
  readBool(): boolean {
    return this.readInt32() !== 0;
  }

  /**
   * Read fixed-length opaque data
   */
  readOpaque(length: number): Uint8Array {
    const data = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    // Skip padding
    const padding = (4 - (length % 4)) % 4;
    this.offset += padding;
    return data;
  }

  /**
   * Read variable-length opaque data
   */
  readVarOpaque(): Uint8Array {
    const length = this.readUint32();
    return this.readOpaque(length);
  }

  /**
   * Read string
   */
  readString(): string {
    const bytes = this.readVarOpaque();
    return new TextDecoder().decode(bytes);
  }

  /**
   * Check if at end of buffer
   */
  eof(): boolean {
    return this.offset >= this.buffer.length;
  }
}

// ===== Stellar Key Encoding (StrKey) =====

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Version bytes for different key types
export const VERSION_BYTES = {
  accountId: 6 << 3,      // G (48)
  seed: 18 << 3,          // S (144)
  preAuthTx: 19 << 3,     // T
  sha256Hash: 23 << 3,    // X
  muxedAccount: 12 << 3,  // M
  signedPayload: 15 << 3, // P
  contract: 2 << 3,       // C
} as const;

/**
 * CRC16-XModem checksum (used by Stellar)
 */
function crc16xmodem(data: Uint8Array): number {
  let crc = 0x0000;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

/**
 * Base32 encode
 */
function base32Encode(data: Uint8Array): string {
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(value >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

/**
 * Base32 decode
 */
function base32Decode(str: string): Uint8Array {
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of str.toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    while (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Encode raw key bytes to Stellar StrKey format
 */
export function encodeStrKey(type: keyof typeof VERSION_BYTES, data: Uint8Array): string {
  const versionByte = VERSION_BYTES[type];
  const payload = new Uint8Array(1 + data.length);
  payload[0] = versionByte;
  payload.set(data, 1);

  const checksum = crc16xmodem(payload);
  const checksumBytes = new Uint8Array([checksum & 0xff, (checksum >> 8) & 0xff]);

  const full = new Uint8Array(payload.length + 2);
  full.set(payload);
  full.set(checksumBytes, payload.length);

  return base32Encode(full);
}

/**
 * Decode Stellar StrKey to raw bytes
 */
export function decodeStrKey(strKey: string): { type: keyof typeof VERSION_BYTES; data: Uint8Array } {
  const decoded = base32Decode(strKey);

  if (decoded.length < 3) {
    throw new Error("Invalid StrKey: too short");
  }

  const versionByte = decoded[0];
  const data = decoded.slice(1, -2);
  const checksum = decoded[decoded.length - 2] | (decoded[decoded.length - 1] << 8);

  // Verify checksum
  const payload = decoded.slice(0, -2);
  const expectedChecksum = crc16xmodem(payload);

  if (checksum !== expectedChecksum) {
    throw new Error("Invalid StrKey: checksum mismatch");
  }

  // Determine type
  let type: keyof typeof VERSION_BYTES | undefined;
  for (const [key, value] of Object.entries(VERSION_BYTES)) {
    if (value === versionByte) {
      type = key as keyof typeof VERSION_BYTES;
      break;
    }
  }

  if (!type) {
    throw new Error(`Invalid StrKey: unknown version byte ${versionByte}`);
  }

  return { type, data };
}

/**
 * Check if a string is a valid Stellar address
 */
export function isValidAddress(address: string): boolean {
  try {
    const { type, data } = decodeStrKey(address);
    return type === "accountId" && data.length === 32;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid Stellar contract address
 */
export function isValidContractAddress(address: string): boolean {
  try {
    const { type, data } = decodeStrKey(address);
    return type === "contract" && data.length === 32;
  } catch {
    return false;
  }
}

// ===== Transaction Building =====

/**
 * Operation types
 */
export enum OperationType {
  CreateAccount = 0,
  Payment = 1,
  PathPaymentStrictReceive = 2,
  ManageSellOffer = 3,
  CreatePassiveSellOffer = 4,
  SetOptions = 5,
  ChangeTrust = 6,
  AllowTrust = 7,
  AccountMerge = 8,
  Inflation = 9,
  ManageData = 10,
  BumpSequence = 11,
  ManageBuyOffer = 12,
  PathPaymentStrictSend = 13,
  CreateClaimableBalance = 14,
  ClaimClaimableBalance = 15,
  BeginSponsoringFutureReserves = 16,
  EndSponsoringFutureReserves = 17,
  RevokeSponsorship = 18,
  Clawback = 19,
  ClawbackClaimableBalance = 20,
  SetTrustLineFlags = 21,
  LiquidityPoolDeposit = 22,
  LiquidityPoolWithdraw = 23,
  InvokeHostFunction = 24,
  ExtendFootprintTtl = 25,
  RestoreFootprint = 26,
}

/**
 * Asset type for XDR encoding
 */
export interface Asset {
  type: "native" | "credit_alphanum4" | "credit_alphanum12";
  code?: string;
  issuer?: string;
}

/**
 * Encode asset to XDR
 */
export function encodeAsset(writer: XdrWriter, asset: Asset): void {
  switch (asset.type) {
    case "native":
      writer.writeInt32(0); // ASSET_TYPE_NATIVE
      break;
    case "credit_alphanum4":
      writer.writeInt32(1); // ASSET_TYPE_CREDIT_ALPHANUM4
      {
        const code = new Uint8Array(4);
        const codeBytes = new TextEncoder().encode(asset.code || "");
        code.set(codeBytes.slice(0, 4));
        writer.writeOpaque(code);
        const issuerData = decodeStrKey(asset.issuer!).data;
        writer.writeInt32(0); // KEY_TYPE_ED25519
        writer.writeOpaque(issuerData);
      }
      break;
    case "credit_alphanum12":
      writer.writeInt32(2); // ASSET_TYPE_CREDIT_ALPHANUM12
      {
        const code = new Uint8Array(12);
        const codeBytes = new TextEncoder().encode(asset.code || "");
        code.set(codeBytes.slice(0, 12));
        writer.writeOpaque(code);
        const issuerData = decodeStrKey(asset.issuer!).data;
        writer.writeInt32(0); // KEY_TYPE_ED25519
        writer.writeOpaque(issuerData);
      }
      break;
  }
}

/**
 * Payment operation parameters
 */
export interface PaymentOp {
  destination: string;
  asset: Asset;
  amount: bigint; // in stroops (1 XLM = 10^7 stroops)
}

/**
 * Encode payment operation
 */
export function encodePaymentOp(writer: XdrWriter, op: PaymentOp): void {
  writer.writeInt32(OperationType.Payment);

  // Destination
  const destData = decodeStrKey(op.destination).data;
  writer.writeInt32(0); // KEY_TYPE_ED25519
  writer.writeOpaque(destData);

  // Asset
  encodeAsset(writer, op.asset);

  // Amount
  writer.writeInt64(op.amount);
}

/**
 * Invoke host function parameters (for Soroban)
 */
export interface InvokeHostFunctionOp {
  contractId: string;
  functionName: string;
  args: SorobanValue[];
  auth?: SorobanAuth[];
}

/**
 * Soroban value types
 */
export type SorobanValue =
  | { type: "bool"; value: boolean }
  | { type: "i64"; value: bigint }
  | { type: "u64"; value: bigint }
  | { type: "i128"; value: bigint }
  | { type: "u128"; value: bigint }
  | { type: "i256"; value: bigint }
  | { type: "u256"; value: bigint }
  | { type: "address"; value: string }
  | { type: "bytes"; value: Uint8Array }
  | { type: "string"; value: string }
  | { type: "symbol"; value: string }
  | { type: "vec"; value: SorobanValue[] }
  | { type: "map"; value: [SorobanValue, SorobanValue][] };

/**
 * Soroban authorization
 */
export interface SorobanAuth {
  address: string;
  nonce: bigint;
  signatureExpirationLedger: number;
  signature: Uint8Array;
}

/**
 * Encode Soroban value
 */
export function encodeSorobanValue(writer: XdrWriter, value: SorobanValue): void {
  switch (value.type) {
    case "bool":
      writer.writeInt32(value.value ? 1 : 0); // SCV_BOOL
      break;
    case "i64":
      writer.writeInt32(6); // SCV_I64
      writer.writeInt64(value.value);
      break;
    case "u64":
      writer.writeInt32(5); // SCV_U64
      writer.writeUint64(value.value);
      break;
    case "i128":
      writer.writeInt32(10); // SCV_I128
      // Write as two i64s (high, low)
      writer.writeInt64(value.value >> 64n);
      writer.writeInt64(value.value & ((1n << 64n) - 1n));
      break;
    case "u128":
      writer.writeInt32(9); // SCV_U128
      writer.writeUint64(value.value >> 64n);
      writer.writeUint64(value.value & ((1n << 64n) - 1n));
      break;
    case "address":
      writer.writeInt32(18); // SCV_ADDRESS
      if (value.value.startsWith("G")) {
        writer.writeInt32(0); // SC_ADDRESS_TYPE_ACCOUNT
        const data = decodeStrKey(value.value).data;
        writer.writeOpaque(data);
      } else {
        writer.writeInt32(1); // SC_ADDRESS_TYPE_CONTRACT
        const data = decodeStrKey(value.value).data;
        writer.writeOpaque(data);
      }
      break;
    case "bytes":
      writer.writeInt32(14); // SCV_BYTES
      writer.writeVarOpaque(value.value);
      break;
    case "string":
      writer.writeInt32(13); // SCV_STRING
      writer.writeString(value.value);
      break;
    case "symbol":
      writer.writeInt32(15); // SCV_SYMBOL
      writer.writeString(value.value);
      break;
    case "vec":
      writer.writeInt32(16); // SCV_VEC
      writer.writeBool(true); // Some (present)
      writer.writeInt32(value.value.length);
      for (const item of value.value) {
        encodeSorobanValue(writer, item);
      }
      break;
    case "map":
      writer.writeInt32(17); // SCV_MAP
      writer.writeBool(true); // Some (present)
      writer.writeInt32(value.value.length);
      for (const [k, v] of value.value) {
        encodeSorobanValue(writer, k);
        encodeSorobanValue(writer, v);
      }
      break;
  }
}

/**
 * Transaction envelope structure
 */
export interface TransactionEnvelope {
  sourceAccount: string;
  fee: number;
  seqNum: bigint;
  timeBounds?: { minTime: number; maxTime: number };
  memo?: { type: "none" | "text" | "id" | "hash" | "return"; value?: string | bigint | Uint8Array };
  operations: Operation[];
  networkPassphrase: string;
}

/**
 * Operation structure
 */
export interface Operation {
  sourceAccount?: string;
  body: PaymentOp | InvokeHostFunctionOp | { type: string; [key: string]: unknown };
}

/**
 * Encode a complete transaction to XDR
 */
export function encodeTransaction(tx: TransactionEnvelope): Uint8Array {
  const writer = new XdrWriter();

  // Envelope type (ENVELOPE_TYPE_TX = 2)
  writer.writeInt32(2);

  // Source account
  const sourceData = decodeStrKey(tx.sourceAccount).data;
  writer.writeInt32(0); // KEY_TYPE_ED25519
  writer.writeOpaque(sourceData);

  // Fee
  writer.writeUint32(tx.fee);

  // Sequence number
  writer.writeInt64(tx.seqNum);

  // Time bounds (optional)
  if (tx.timeBounds) {
    writer.writeBool(true);
    writer.writeUint64(BigInt(tx.timeBounds.minTime));
    writer.writeUint64(BigInt(tx.timeBounds.maxTime));
  } else {
    writer.writeBool(false);
  }

  // Memo
  if (!tx.memo || tx.memo.type === "none") {
    writer.writeInt32(0); // MEMO_NONE
  } else if (tx.memo.type === "text") {
    writer.writeInt32(1); // MEMO_TEXT
    writer.writeString(tx.memo.value as string);
  } else if (tx.memo.type === "id") {
    writer.writeInt32(2); // MEMO_ID
    writer.writeUint64(tx.memo.value as bigint);
  } else if (tx.memo.type === "hash") {
    writer.writeInt32(3); // MEMO_HASH
    writer.writeOpaque(tx.memo.value as Uint8Array);
  } else if (tx.memo.type === "return") {
    writer.writeInt32(4); // MEMO_RETURN
    writer.writeOpaque(tx.memo.value as Uint8Array);
  }

  // Operations
  writer.writeInt32(tx.operations.length);
  for (const op of tx.operations) {
    // Source account (optional)
    if (op.sourceAccount) {
      writer.writeBool(true);
      const opSourceData = decodeStrKey(op.sourceAccount).data;
      writer.writeInt32(0);
      writer.writeOpaque(opSourceData);
    } else {
      writer.writeBool(false);
    }

    // Operation body
    if ("destination" in op.body && "asset" in op.body) {
      encodePaymentOp(writer, op.body as PaymentOp);
    }
    // Add more operation types as needed
  }

  // Ext (reserved for future use)
  writer.writeInt32(0);

  return writer.toBuffer();
}

/**
 * Compute transaction hash
 */
export function computeTransactionHash(tx: TransactionEnvelope): Uint8Array {
  const networkHash = blake2b256(new TextEncoder().encode(tx.networkPassphrase));
  const txXdr = encodeTransaction(tx);

  // Hash: SHA256(networkId || ENVELOPE_TYPE_TX || tx)
  const preimage = new Uint8Array(networkHash.length + 4 + txXdr.length);
  preimage.set(networkHash, 0);
  // ENVELOPE_TYPE_TX = 2
  preimage[32] = 0;
  preimage[33] = 0;
  preimage[34] = 0;
  preimage[35] = 2;
  preimage.set(txXdr, 36);

  return blake2b256(preimage);
}

/**
 * Sign a transaction
 */
export function signTransaction(
  txHash: Uint8Array,
  secretKey: Uint8Array
): Uint8Array {
  // Use Ed25519 signing (imported separately)
  // This is a placeholder - actual implementation uses tweetnacl
  throw new Error("Use EphemeralKeyManager.sign() for transaction signing");
}

// ===== Utility Functions =====

function bufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert amount string to stroops
 */
export function toStroops(amount: string): bigint {
  const [whole, decimal = ""] = amount.split(".");
  const paddedDecimal = decimal.padEnd(7, "0").slice(0, 7);
  return BigInt(whole + paddedDecimal);
}

/**
 * Convert stroops to amount string
 */
export function fromStroops(stroops: bigint): string {
  const str = stroops.toString().padStart(8, "0");
  const whole = str.slice(0, -7) || "0";
  const decimal = str.slice(-7).replace(/0+$/, "");
  return decimal ? `${whole}.${decimal}` : whole;
}
