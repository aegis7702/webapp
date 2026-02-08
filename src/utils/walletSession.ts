/**
 * Wallet session utilities: encrypt/decrypt private key with login password,
 * persist encrypted payload + password hash (sessionStorage or chrome.storage in extension).
 */

import { getAddressFromPrivateKey } from './walletUtils';
import { getItem, setItem, removeItem } from './storageBridge';

const SESSION_KEY = 'aegis_wallet_session';
const PBKDF2_ITERATIONS = 250_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Generate a new 32-byte private key (hex string, 0x-prefixed).
 */
export function generatePrivateKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return '0x' + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Derive an AES key from password using PBKDF2.
 */
async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const saltBuf =
    salt instanceof ArrayBuffer
      ? salt
      : salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt private key with login password.
 * Returns base64 string: salt (16) + iv (12) + ciphertext.
 */
export async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    key,
    enc.encode(privateKey)
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return bufferToBase64(combined);
}

/**
 * Decrypt private key with login password.
 * @throws if password is wrong or payload is invalid
 */
export async function decryptPrivateKey(encryptedPayload: string, password: string): Promise<string> {
  const raw: ArrayBuffer = base64ToBuffer(encryptedPayload);
  const salt = raw.slice(0, SALT_LENGTH);
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv), tagLength: 128 },
    key,
    new Uint8Array(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}

export interface WalletSession {
  encryptedPk: string;
  passwordHash: string;
  /** Ethereum address (0x...) for display; set when saving session. */
  address?: string;
}

/**
 * Hash password (SHA-256) for session verification. Does not store plain password.
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return bufferToBase64(digest);
}

/**
 * Save combined wallet session (encrypted pk + password hash).
 */
export function saveWalletSession(session: WalletSession): void {
  setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Load combined wallet session from storage.
 */
export function getWalletSession(): WalletSession | null {
  const raw = getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WalletSession;
    if (parsed?.encryptedPk) return parsed;
  } catch {
    // legacy: single encrypted pk
    if (raw && !raw.startsWith('{')) {
      return { encryptedPk: raw, passwordHash: '' };
    }
  }
  return null;
}

/**
 * Load encrypted private key only (backward compat).
 */
export function getEncryptedPrivateKey(): string | null {
  return getWalletSession()?.encryptedPk ?? null;
}

/**
 * Remove wallet session (e.g. on logout).
 */
export function clearWalletSession(): void {
  removeItem(SESSION_KEY);
}

/**
 * Verify login password against stored hash.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const session = getWalletSession();
  if (!session?.passwordHash) return false;
  const hash = await hashPassword(password);
  return hash === session.passwordHash;
}

/**
 * Encrypt private key with password, hash password, and save combined session.
 * Use when password confirmation is complete (import or create flow).
 */
export async function encryptAndSaveWalletSession(
  privateKey: string,
  password: string
): Promise<void> {
  const encryptedPk = await encryptPrivateKey(privateKey, password);
  const passwordHash = await hashPassword(password);
  const address = getAddressFromPrivateKey(privateKey) ?? undefined;
  saveWalletSession({ encryptedPk, passwordHash, address });
}

/** @deprecated Use encryptAndSaveWalletSession */
export async function encryptAndSavePrivateKey(privateKey: string, password: string): Promise<void> {
  await encryptAndSaveWalletSession(privateKey, password);
}
