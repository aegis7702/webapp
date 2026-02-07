/**
 * Aegis contracts: getRecentRecords (ImplSafetyRegistry) + aegis_getImplementation (AegisGuardDelegator).
 * Batch RPC to fetch both in one round-trip. Results are ABI-decoded.
 */

import { AbiCoder, Interface, JsonRpcProvider, Wallet } from 'ethers';
import { rpcBatchCall } from './rpcBatch';
import addresses from '../config/address.json';

const SELECTOR_GET_RECENT_RECORDS = '0x4ddfd4e4';
const SELECTOR_AEGIS_GET_IMPLEMENTATION = '0x3ebd0a47';
const SELECTOR_GET_RECORD_CURRENT = '0x887443eb'; // getRecordCurrent(address impl)

/** Verdict enum: 0 Unknown, 1 Safe, 2 Unsafe */
export type Verdict = 'Unknown' | 'Safe' | 'Unsafe';

function verdictFromU8(n: bigint): Verdict {
  if (n === 1n) return 'Safe';
  if (n === 2n) return 'Unsafe';
  return 'Unknown';
}

/** Decoded getRecentRecords(): impls, codehashes, verdicts, updatedAts, names, summaries, descriptions, reasonsList */
export interface GetRecentRecordsDecoded {
  impls: string[];
  codehashes: string[];
  verdicts: Verdict[];
  updatedAts: bigint[];
  names: string[];
  summaries: string[];
  descriptions: string[];
  reasonsList: string[];
}

/** Decoded getRecordCurrent(impl): verdict, name, summary, description, reasons, updatedAt, codehash */
export interface GetRecordCurrentDecoded {
  verdict: Verdict;
  name: string;
  summary: string;
  description: string;
  reasons: string;
  updatedAt: bigint;
  codehash: string;
}

export interface AegisBatchResult {
  /** Decoded getRecentRecords() result, or null. */
  getRecentRecords: GetRecentRecordsDecoded | null;
  /** Current implementation address from aegis_getImplementation(), or null. */
  implementationAddress: string | null;
  /** Decoded getRecordCurrent(implementationAddress) result, or null. */
  getRecordCurrent: GetRecordCurrentDecoded | null;
}

/**
 * Fetch getRecentRecords (ImplSafetyRegistry) and aegis_getImplementation (AegisGuardDelegator)
 * in a single batch eth_call. Decodes the implementation address; getRecentRecords returned as raw hex.
 */
export async function fetchAegisBatch(
  rpcUrl: string,
  registryAddress?: string,
  delegatorAddress?: string,
  walletAddress?: string
): Promise<AegisBatchResult> {
  const url = rpcUrl.trim();
  const registry = (registryAddress ?? (addresses as Record<string, string>).ImplSafetyRegistry)?.trim();
  const delegator = (delegatorAddress ?? (addresses as Record<string, string>).AegisGuardDelegator)?.trim();
  const toForImplementation = (walletAddress?.trim() || delegator);
  if (!url || !registry || !delegator) {
    return { getRecentRecords: null, implementationAddress: null, getRecordCurrent: null };
  }
  const requests: import('./rpcBatch').BatchItem[] = [
    { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: registry, data: SELECTOR_GET_RECENT_RECORDS }, 'latest'] },
    { jsonrpc: '2.0', id: 2, method: 'eth_call', params: [{ to: toForImplementation, data: SELECTOR_AEGIS_GET_IMPLEMENTATION }, 'latest'] },
  ];
  try {
    const responses = await rpcBatchCall(url, requests);
    const getRecentRecordsHex =
      responses[0]?.error == null && typeof responses[0]?.result === 'string'
        ? (responses[0].result as string)
        : null;
    const implHex =
      responses[1]?.error == null && typeof responses[1]?.result === 'string'
        ? (responses[1].result as string)
        : null;
    const implementationAddress = implHex ? decodeAddressFromHex(implHex) : null;
    const getRecentRecords = getRecentRecordsHex ? decodeGetRecentRecords(getRecentRecordsHex) : null;

    let getRecordCurrent: GetRecordCurrentDecoded | null = null;
    if (implementationAddress) {
      const data = SELECTOR_GET_RECORD_CURRENT + padAddressTo32(implementationAddress);
      const recordResponses = await rpcBatchCall(url, [
        { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: registry, data }, 'latest'] },
      ]);
      const recordHex = recordResponses[0]?.error == null && typeof recordResponses[0]?.result === 'string' ? (recordResponses[0].result as string) : null;
      if (recordHex) getRecordCurrent = decodeGetRecordCurrent(recordHex);
    }
    return { getRecentRecords, implementationAddress, getRecordCurrent };
  } catch {
    return { getRecentRecords: null, implementationAddress: null, getRecordCurrent: null };
  }
}

const coder = AbiCoder.defaultAbiCoder();

/** Decode getRecentRecords() ABI result. */
function decodeGetRecentRecords(hex: string): GetRecentRecordsDecoded | null {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return null;
  try {
    const decoded = coder.decode(
      ['address[]', 'bytes32[]', 'uint8[]', 'uint64[]', 'string[]', 'string[]', 'string[]', 'string[]'],
      hex
    );
    const verdicts = (decoded[2] as bigint[]).map(verdictFromU8);
    return {
      impls: decoded[0] as string[],
      codehashes: (decoded[1] as unknown[]).map((h) => (typeof h === 'string' ? h : String(h))),
      verdicts,
      updatedAts: decoded[3] as bigint[],
      names: decoded[4] as string[],
      summaries: decoded[5] as string[],
      descriptions: decoded[6] as string[],
      reasonsList: decoded[7] as string[],
    };
  } catch {
    return null;
  }
}

/** Decode getRecordCurrent(address) ABI result. */
function decodeGetRecordCurrent(hex: string): GetRecordCurrentDecoded | null {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return null;
  try {
    const decoded = coder.decode(
      ['uint8', 'string', 'string', 'string', 'string', 'uint64', 'bytes32'],
      hex
    );
    const codehash = decoded[6];
    return {
      verdict: verdictFromU8(decoded[0] as bigint),
      name: decoded[1] as string,
      summary: decoded[2] as string,
      description: decoded[3] as string,
      reasons: decoded[4] as string,
      updatedAt: decoded[5] as bigint,
      codehash: typeof codehash === 'string' ? codehash : String(codehash),
    };
  } catch {
    return null;
  }
}

/** ABI-encode address as 32-byte left-padded hex for calldata. */
function padAddressTo32(addr: string): string {
  const hex = addr.startsWith('0x') ? addr.slice(2).toLowerCase() : addr.toLowerCase();
  return hex.padStart(64, '0');
}

/** Decode 32-byte left-padded address from eth_call result to 0x + 40 hex chars. */
function decodeAddressFromHex(hex: string): string | null {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('0x')) return null;
  const raw = hex.slice(2).toLowerCase();
  if (raw.length < 40) return null;
  const addr = raw.slice(-40);
  return '0x' + addr;
}

/**
 * Fetch getRecordCurrent(implementationAddress) from ImplSafetyRegistry for an arbitrary impl address.
 * @param rpcUrl - RPC endpoint URL
 * @param implementationAddress - Implementation contract address (0x...)
 * @param registryAddress - ImplSafetyRegistry address; defaults to config
 * @returns Decoded record or null on failure
 */
export async function fetchGetRecordCurrent(
  rpcUrl: string,
  implementationAddress: string,
  registryAddress?: string
): Promise<GetRecordCurrentDecoded | null> {
  const url = rpcUrl.trim();
  const registry = (registryAddress ?? (addresses as Record<string, string>).ImplSafetyRegistry)?.trim();
  const impl = implementationAddress?.trim();
  if (!url || !registry || !impl) return null;
  const data = SELECTOR_GET_RECORD_CURRENT + padAddressTo32(impl);
  try {
    const responses = await rpcBatchCall(url, [
      { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: registry, data }, 'latest'] },
    ]);
    const recordHex =
      responses[0]?.error == null && typeof responses[0]?.result === 'string'
        ? (responses[0].result as string)
        : null;
    return recordHex ? decodeGetRecordCurrent(recordHex) : null;
  } catch {
    return null;
  }
}

// --- aegis_setImplementation(address) ---
const AEGIS_DELEGATOR_ABI = [
  'function aegis_setImplementation(address impl) external',
];

export type SetImplementationResult =
  | { success: true; txHash: string }
  | { success: false; error: string };

export interface SetAegisImplementationParams {
  privateKey: string;
  rpcUrl: string;
  chainId: string | number;
  /** Implementation address to set as active */
  implementationAddress: string;
}

/**
 * Calls aegis_setImplementation(impl) on AegisGuardDelegator, waits for receipt, returns txHash or error.
 */
export async function setAegisImplementation(
  params: SetAegisImplementationParams
): Promise<SetImplementationResult> {
  const { privateKey, rpcUrl, implementationAddress } = params;
  try {
    const iface = new Interface(AEGIS_DELEGATOR_ABI);
    const data = iface.encodeFunctionData('aegis_setImplementation', [implementationAddress as `0x${string}`]);
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: wallet.address as `0x${string}`,
      data,
      value: 0n,
    });
    const receipt = await tx.wait();
    if (receipt == null) return { success: false, error: 'No receipt' };
    if (receipt.status === 0) return { success: false, error: 'Transaction reverted' };
    return { success: true, txHash: receipt.hash };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

