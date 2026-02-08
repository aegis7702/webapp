/**
 * Selected network persistence + per-chain saved tokens.
 * Fetch ERC20 symbol/name via rpcBatchCall.
 * Storage: sessionStorage (web) or chrome.storage.local (extension).
 */

import type { Network } from '../config/netwotk';
import { rpcBatchCall, decodeAbiString, decodeUint256 } from './rpcBatch';
import { getItem, setItem } from './storageBridge';

const SELECTED_NETWORK_KEY = 'aegis_selected_network';
const SAVED_TOKENS_KEY = 'aegis_saved_tokens';

const SELECTOR_SYMBOL = '0x95d89b41';
const SELECTOR_NAME = '0x06fdde03';
const SELECTOR_DECIMALS = '0x313ce567';
const SELECTOR_BALANCE_OF = '0x70a08231';
const ETH_DECIMALS = 18;

function padAddress32(addr: string): string {
  const hex = addr.startsWith('0x') ? addr.slice(2).toLowerCase() : addr.toLowerCase();
  return hex.padStart(64, '0');
}

function formatBalance(raw: bigint, decimals: number): string {
  const divisor = 10 ** decimals;
  const intPart = raw / BigInt(divisor);
  const rem = raw % BigInt(divisor);
  const frac = rem.toString().padStart(decimals, '0').slice(0, decimals).replace(/0+$/, '');
  const str = frac ? `${intPart}.${frac}` : `${intPart}`;
  const n = Number(str);
  if (n >= 1e9) return n.toExponential(2);
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return str;
}

export function getSelectedNetwork(): Network | null {
  const raw = getItem(SELECTED_NETWORK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Network;
    if (parsed?.chainId && parsed?.rpcUrl) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function setSelectedNetwork(network: Network): void {
  setItem(SELECTED_NETWORK_KEY, JSON.stringify(network));
}

export interface SavedToken {
  name?: string;
  symbol: string;
  address: string;
}

export function getSavedTokens(chainId: string): SavedToken[] {
  const raw = getItem(SAVED_TOKENS_KEY);
  if (!raw) return [];
  try {
    const all = JSON.parse(raw) as Record<string, SavedToken[]>;
    return Array.isArray(all[chainId]) ? all[chainId] : [];
  } catch {
    return [];
  }
}

export function addSavedToken(chainId: string, token: SavedToken): void {
  const raw = getItem(SAVED_TOKENS_KEY);
  const all: Record<string, SavedToken[]> = raw ? JSON.parse(raw) : {};
  if (!Array.isArray(all[chainId])) all[chainId] = [];
  const exists = all[chainId].some(
    (t) => t.address.toLowerCase() === token.address.trim().toLowerCase()
  );
  if (exists) return;
  all[chainId].push({
    name: token.name?.trim() || undefined,
    symbol: token.symbol.trim(),
    address: token.address.trim(),
  });
  setItem(SAVED_TOKENS_KEY, JSON.stringify(all));
}

/**
 * One batch: ERC20 symbol + name (eth_call x2) and account code (eth_getCode).
 * Use when you need token metadata and/or account code in a single RPC round-trip.
 */
export async function fetchTokenSymbolNameAndAccountCode(
  tokenAddress: string,
  accountAddress: string,
  rpcUrl: string
): Promise<{
  symbol: string | null;
  name: string | null;
  accountCode: string | null;
}> {
  const tokenAddr = tokenAddress.trim();
  const accountAddr = accountAddress.trim();
  const url = rpcUrl.trim();
  if (!url) return { symbol: null, name: null, accountCode: null };
  if (!tokenAddr && !accountAddr) return { symbol: null, name: null, accountCode: null };

  const requests: import('./rpcBatch').BatchItem[] = [];
  if (tokenAddr) {
    requests.push(
      { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: tokenAddr, data: SELECTOR_SYMBOL }, 'latest'] },
      { jsonrpc: '2.0', id: 2, method: 'eth_call', params: [{ to: tokenAddr, data: SELECTOR_NAME }, 'latest'] }
    );
  }
  if (accountAddr) {
    requests.push(
      { jsonrpc: '2.0', id: 3, method: 'eth_getCode', params: [accountAddr, 'latest'] }
    );
  }
  if (requests.length === 0) return { symbol: null, name: null, accountCode: null };

  try {
    const responses = await rpcBatchCall(url, requests);
    let symbol: string | null = null;
    let name: string | null = null;
    let accountCode: string | null = null;
    let idx = 0;
    if (tokenAddr) {
      const symbolHex = responses[idx]?.error == null && typeof responses[idx]?.result === 'string' ? (responses[idx].result as string) : null;
      const nameHex = responses[idx + 1]?.error == null && typeof responses[idx + 1]?.result === 'string' ? (responses[idx + 1].result as string) : null;
      symbol = symbolHex ? decodeAbiString(symbolHex) : null;
      name = nameHex ? decodeAbiString(nameHex) : null;
      idx += 2;
    }
    if (accountAddr) {
      accountCode = responses[idx]?.error == null && typeof responses[idx]?.result === 'string' ? (responses[idx].result as string) ?? null : null;
    }
    return { symbol, name, accountCode };
  } catch {
    return { symbol: null, name: null, accountCode: null };
  }
}

/**
 * Fetch ERC20 symbol and name via batch (uses fetchTokenSymbolNameAndAccountCode).
 */
export async function fetchTokenSymbolAndName(
  address: string,
  rpcUrl: string
): Promise<{ symbol: string | null; name: string | null }> {
  const { symbol, name } = await fetchTokenSymbolNameAndAccountCode(address, '', rpcUrl);
  return { symbol, name };
}

/** EIP-7702 delegation indicator prefix (banned opcode 0xef + version 0x0100). */
const EIP7702_DELEGATION_PREFIX = '0xef0100';

/**
 * Fetch account code at address via batch (uses fetchTokenSymbolNameAndAccountCode).
 * @returns 0x-prefixed hex string or null on error/empty
 */
export async function fetchAccountCode(
  address: string,
  rpcUrl: string
): Promise<string | null> {
  const { accountCode } = await fetchTokenSymbolNameAndAccountCode('', address, rpcUrl);
  return accountCode;
}

/**
 * Normalize address to 20-byte hex (0x + 40 chars lowercase).
 */
function normalizeAddress20(addr: string): string {
  const hex = addr.startsWith('0x') ? addr.slice(2).toLowerCase() : addr.toLowerCase();
  return '0x' + hex.padStart(40, '0').slice(-40);
}

/**
 * Check if account code is EIP-7702 delegation to the given implementation address.
 * Delegation indicator is 0xef0100 || address (20 bytes).
 */
export function isEip7702DelegationTo(code: string | null, implementationAddress: string): boolean {
  if (!code || typeof code !== 'string' || !code.startsWith('0x')) return false;
  const implHex = normalizeAddress20(implementationAddress).slice(2);
  const expected = EIP7702_DELEGATION_PREFIX + implHex;
  return code.toLowerCase() === expected.toLowerCase();
}

/**
 * Fetch user account code and return whether it is delegated to the given implementation (EIP-7702).
 */
export async function isDelegatedToImplementation(
  userAddress: string,
  rpcUrl: string,
  implementationAddress: string
): Promise<boolean> {
  const code = await fetchAccountCode(userAddress, rpcUrl);
  return isEip7702DelegationTo(code, implementationAddress);
}

/**
 * Fetch ERC20 symbol from contract at address via rpcUrl (uses rpcBatchCall).
 */
export async function fetchTokenSymbol(address: string, rpcUrl: string): Promise<string | null> {
  const { symbol } = await fetchTokenSymbolAndName(address, rpcUrl);
  return symbol;
}

/**
 * Fetch ERC20 name from contract at address via rpcUrl (uses rpcBatchCall).
 */
export async function fetchTokenName(address: string, rpcUrl: string): Promise<string | null> {
  const { name } = await fetchTokenSymbolAndName(address, rpcUrl);
  return name;
}

export interface TokenBalanceItem {
  address: string;
  symbol: string;
  decimals: number;
  balance: string;
}

/**
 * Fetch ETH balance (18 decimals) and all token decimals + balances in one batch call.
 */
export async function fetchBalances(
  rpcUrl: string,
  userAddress: string,
  tokens: { address: string; symbol: string }[]
): Promise<{ ethBalance: string; tokenBalances: TokenBalanceItem[] }> {
  const url = rpcUrl.trim();
  const user = userAddress.trim();
  if (!url || !user) {
    return { ethBalance: '0', tokenBalances: [] };
  }
  const requests: import('./rpcBatch').BatchItem[] = [
    { jsonrpc: '2.0', id: 0, method: 'eth_getBalance', params: [user, 'latest'] },
  ];
  tokens.forEach((t, i) => {
    const addr = t.address.trim();
    requests.push(
      { jsonrpc: '2.0', id: 1 + i * 2, method: 'eth_call', params: [{ to: addr, data: SELECTOR_DECIMALS }, 'latest'] },
      {
        jsonrpc: '2.0',
        id: 2 + i * 2,
        method: 'eth_call',
        params: [{ to: addr, data: SELECTOR_BALANCE_OF + padAddress32(user) }, 'latest'],
      }
    );
  });
  try {
    const responses = await rpcBatchCall(url, requests);
    const ethHex = responses[0]?.error == null && typeof responses[0]?.result === 'string' ? responses[0].result : '0x0';
    const ethRaw = decodeUint256(ethHex) ?? 0n;
    const ethBalance = formatBalance(ethRaw, ETH_DECIMALS);
    const tokenBalances: TokenBalanceItem[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const decRes = responses[1 + i * 2];
      const balRes = responses[2 + i * 2];
      const decHex = decRes?.error == null && typeof decRes?.result === 'string' ? decRes.result : '0x0';
      const balHex = balRes?.error == null && typeof balRes?.result === 'string' ? balRes.result : '0x0';
      const decimals = Number(decodeUint256(decHex) ?? 0n);
      const raw = decodeUint256(balHex) ?? 0n;
      tokenBalances.push({
        address: tokens[i].address,
        symbol: tokens[i].symbol,
        decimals: Number.isNaN(decimals) ? 0 : Math.min(decimals, 255),
        balance: formatBalance(raw, Number.isNaN(decimals) ? 0 : Math.min(decimals, 255)),
      });
    }
    return { ethBalance, tokenBalances };
  } catch {
    return { ethBalance: '0', tokenBalances: tokens.map((t) => ({ ...t, decimals: 0, balance: '0' })) };
  }
}
