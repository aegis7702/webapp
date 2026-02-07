/**
 * Persist user-added networks in sessionStorage.
 * Fetch chainId from RPC (eth_chainId).
 */

import type { Network } from '../config/netwotk';

const SESSION_KEY = 'aegis_networks';

/**
 * Fetch chainId from RPC via eth_chainId. Returns decimal string or null.
 */
export async function fetchChainIdFromRpc(rpcUrl: string): Promise<string | null> {
  const url = rpcUrl.trim();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    });
    const data = await res.json();
    const hex = data?.result;
    if (typeof hex !== 'string') return null;
    const chainId = parseInt(hex, 16);
    return Number.isNaN(chainId) ? null : String(chainId);
  } catch {
    return null;
  }
}

export function getSavedNetworks(): Network[] {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Network[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSavedNetwork(network: Network): void {
  const list = getSavedNetworks();
  const exists = list.some(
    (n) => n.chainId === network.chainId || (n.name === network.name && n.rpcUrl === network.rpcUrl)
  );
  if (exists) return;
  list.push(network);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
}

export function removeSavedNetwork(chainId: string): void {
  const list = getSavedNetworks().filter((n) => n.chainId !== chainId);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
}
