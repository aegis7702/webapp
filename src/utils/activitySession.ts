/**
 * Activity: aegis_getRecentTxs() + batch aegis_getTxNote(bytes32) for each tx.
 */

import { AbiCoder } from 'ethers';
import { rpcBatchCall } from './rpcBatch';
import addresses from '../config/address.json';

const SELECTOR_AEGIS_GET_RECENT_TXS = '0x136c4b96'; // aegis_getRecentTxs()
const SELECTOR_AEGIS_GET_TX_NOTE = '0xb748d134';   // aegis_getTxNote(bytes32 txHash)
const SELECTOR_AEGIS_IS_FROZEN = '0xdb86a401';     // aegis_isFrozen()
const SELECTOR_AEGIS_GET_FREEZE_REASON = '0xf98a0189'; // aegis_getFreezeReason()

/** Decoded aegis_getTxNote(txHash): name, summary, description, reasons, updatedAt */
export interface TxNoteDecoded {
  name: string;
  summary: string;
  description: string;
  reasons: string;
  updatedAt: bigint;
}

/** One recent tx: hash (bytes32 hex) + decoded note if available */
export interface RecentTxWithNote {
  txHash: string;
  note: TxNoteDecoded | null;
}

export interface FetchRecentTxsWithNotesResult {
  txs: RecentTxWithNote[];
  isFrozen: boolean;
  freezeReason: string | null;
}

const coder = AbiCoder.defaultAbiCoder();

/** bytes32 to 64-char hex for calldata (no 0x prefix in middle of calldata) */
function padBytes32(bytes32Hex: string): string {
  const raw = bytes32Hex.startsWith('0x') ? bytes32Hex.slice(2) : bytes32Hex;
  return raw.toLowerCase().padStart(64, '0').slice(-64);
}

/** Decode aegis_getRecentTxs() result: bytes32[] */
function decodeGetRecentTxs(hex: string): string[] | null {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return null;
  try {
    const decoded = coder.decode(['bytes32[]'], hex);
    const arr = decoded[0] as unknown[];
    return arr.map((h) => {
      const s = typeof h === 'string' ? h : String(h);
      return s.startsWith('0x') ? s : '0x' + s;
    });
  } catch {
    return null;
  }
}

/** Decode aegis_isFrozen() result: bool (32-byte 0/1) */
function decodeIsFrozen(hex: string | null): boolean {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return false;
  const raw = hex.slice(2).replace(/^0+/, '') || '0';
  return BigInt('0x' + raw) !== 0n;
}

/** Decode aegis_getFreezeReason() result: string */
function decodeFreezeReason(hex: string | null): string | null {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return null;
  try {
    const decoded = coder.decode(['string'], hex);
    return (decoded[0] as string) || null;
  } catch {
    return null;
  }
}

/** Decode aegis_getTxNote(bytes32) result: (string, string, string, string, uint64) */
function decodeGetTxNote(hex: string): TxNoteDecoded | null {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return null;
  try {
    const decoded = coder.decode(
      ['string', 'string', 'string', 'string', 'uint64'],
      hex
    );
    return {
      name: decoded[0] as string,
      summary: decoded[1] as string,
      description: decoded[2] as string,
      reasons: decoded[3] as string,
      updatedAt: decoded[4] as bigint,
    };
  } catch {
    return null;
  }
}

/**
 * Call aegis_getRecentTxs() on the target, then batch-call aegis_getTxNote(txHash) for each tx.
 * @param rpcUrl - RPC endpoint URL
 * @param walletAddress - Wallet address to query (falls back to AegisGuardDelegator if omitted)
 * @returns List of { txHash, note } for each recent tx
 */
export async function fetchRecentTxsWithNotes(
  rpcUrl: string,
  walletAddress?: string
): Promise<FetchRecentTxsWithNotesResult> {
  const url = rpcUrl.trim();
  const to = (walletAddress?.trim() || (addresses as Record<string, string>).AegisGuardDelegator)?.trim();
  if (!url || !to) {
    return { txs: [], isFrozen: false, freezeReason: null };
  }
  try {
    const firstBatch = await rpcBatchCall(url, [
      { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to, data: SELECTOR_AEGIS_GET_RECENT_TXS }, 'latest'] },
      { jsonrpc: '2.0', id: 2, method: 'eth_call', params: [{ to, data: SELECTOR_AEGIS_IS_FROZEN }, 'latest'] },
      { jsonrpc: '2.0', id: 3, method: 'eth_call', params: [{ to, data: SELECTOR_AEGIS_GET_FREEZE_REASON }, 'latest'] },
    ]);
    const recentHex =
      firstBatch[0]?.error == null && typeof firstBatch[0]?.result === 'string'
        ? (firstBatch[0].result as string)
        : null;
    const isFrozen = decodeIsFrozen(
      firstBatch[1]?.error == null && typeof firstBatch[1]?.result === 'string'
        ? (firstBatch[1].result as string)
        : null
    );
    const freezeReason = decodeFreezeReason(
      firstBatch[2]?.error == null && typeof firstBatch[2]?.result === 'string'
        ? (firstBatch[2].result as string)
        : null
    );
    const txHashes = recentHex ? decodeGetRecentTxs(recentHex) : null;
    if (!txHashes || txHashes.length === 0) {
      return { txs: [], isFrozen, freezeReason };
    }
    const batchItems = txHashes.map((txHash, i) => ({
      jsonrpc: '2.0' as const,
      id: i + 1,
      method: 'eth_call' as const,
      params: [
        {
          to,
          data: SELECTOR_AEGIS_GET_TX_NOTE + padBytes32(txHash),
        },
        'latest',
      ],
    }));
    const noteResponses = await rpcBatchCall(url, batchItems);
    const txs: RecentTxWithNote[] = txHashes.map((txHash, i) => {
      const item = noteResponses[i];
      const noteHex =
        item?.error == null && typeof item?.result === 'string'
          ? (item.result as string)
          : null;
      const note = noteHex ? decodeGetTxNote(noteHex) : null;
      return { txHash, note };
    });
    return { txs, isFrozen, freezeReason };
  } catch {
    return { txs: [], isFrozen: false, freezeReason: null };
  }
}