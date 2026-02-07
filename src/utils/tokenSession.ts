/**
 * Selected network persistence + per-chain saved tokens.
 * Fetch ERC20 symbol/name via rpcBatchCall.
 */

import type { Network } from '../config/netwotk';
import { rpcBatchCall, decodeAbiString, decodeUint256 } from './rpcBatch';

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
  const raw = sessionStorage.getItem(SELECTED_NETWORK_KEY);
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
  sessionStorage.setItem(SELECTED_NETWORK_KEY, JSON.stringify(network));
}

export interface SavedToken {
  name?: string;
  symbol: string;
  address: string;
}

export function getSavedTokens(chainId: string): SavedToken[] {
  const raw = sessionStorage.getItem(SAVED_TOKENS_KEY);
  if (!raw) return [];
  try {
    const all = JSON.parse(raw) as Record<string, SavedToken[]>;
    return Array.isArray(all[chainId]) ? all[chainId] : [];
  } catch {
    return [];
  }
}

export function addSavedToken(chainId: string, token: SavedToken): void {
  const raw = sessionStorage.getItem(SAVED_TOKENS_KEY);
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
  sessionStorage.setItem(SAVED_TOKENS_KEY, JSON.stringify(all));
}

/**
 * Fetch ERC20 symbol and name via rpcBatchCall (one batch, two eth_call).
 */
export async function fetchTokenSymbolAndName(
  address: string,
  rpcUrl: string
): Promise<{ symbol: string | null; name: string | null }> {
  const addr = address.trim();
  const url = rpcUrl.trim();
  if (!addr || !url) return { symbol: null, name: null };
  const requests = [
    { jsonrpc: '2.0' as const, id: 1, method: 'eth_call' as const, params: [{ to: addr, data: SELECTOR_SYMBOL }, 'latest'] },
    { jsonrpc: '2.0' as const, id: 2, method: 'eth_call' as const, params: [{ to: addr, data: SELECTOR_NAME }, 'latest'] },
  ];
  try {
    const responses = await rpcBatchCall(url, requests);
    const symbolHex = responses[0]?.error == null && typeof responses[0]?.result === 'string' ? responses[0].result : null;
    const nameHex = responses[1]?.error == null && typeof responses[1]?.result === 'string' ? responses[1].result : null;
    return {
      symbol: symbolHex ? decodeAbiString(symbolHex) : null,
      name: nameHex ? decodeAbiString(nameHex) : null,
    };
  } catch {
    return { symbol: null, name: null };
  }
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
