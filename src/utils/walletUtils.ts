/**
 * Wallet helpers: private key validation, address derivation (ethers).
 */

import { Wallet } from 'ethers';

/** Ethereum private key: 32 bytes = 64 hex chars, optional 0x prefix */
const PK_HEX_LENGTH = 64;

export interface ValidatePkResult {
  valid: boolean;
  error?: string;
}

export function validatePrivateKey(pk: string): ValidatePkResult {
  const trimmed = pk.trim();
  if (!trimmed) return { valid: false, error: 'Enter a private key' };
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (hex.length !== PK_HEX_LENGTH) {
    return {
      valid: false,
      error: `Private key must be ${PK_HEX_LENGTH} hex characters (32 bytes)`,
    };
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return { valid: false, error: 'Private key must be hexadecimal' };
  }
  try {
    new Wallet(trimmed);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid private key' };
  }
}

/**
 * Derive Ethereum address from private key. Returns null if pk is invalid.
 */
export function getAddressFromPrivateKey(pk: string): string | null {
  const trimmed = pk.trim();
  if (!trimmed) return null;
  try {
    const wallet = new Wallet(trimmed);
    return wallet.address;
  } catch {
    return null;
  }
}

/** Format address as 0x1234...5678 (first 4 + last 4 hex chars). */
export function formatShortAddress(address: string): string {
  const hex = address.startsWith('0x') ? address.slice(2) : address;
  if (hex.length < 9) return address;
  return '0x' + hex.slice(0, 4) + '...' + hex.slice(-4);
}
