/**
 * JSON-RPC 2.0 batch request helpers.
 * Send multiple eth_* calls in one HTTP request.
 */

export interface BatchItem {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown[];
}

export interface BatchResponseItem {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Call RPC with a batch of requests.
 * @param rpcUrl - RPC endpoint URL
 * @param requests - Array of { jsonrpc, id, method, params }
 * @returns Array of responses in same order as requests (result/error per item)
 */
export async function rpcBatchCall(
  rpcUrl: string,
  requests: BatchItem[]
): Promise<BatchResponseItem[]> {
  if (!rpcUrl.trim() || requests.length === 0) return [];
  const res = await fetch(rpcUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requests),
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Decode 32-byte uint from eth_call result (0x-prefixed hex). */
export function decodeUint256(hexResult: string): bigint | null {
  if (!hexResult || typeof hexResult !== 'string' || !hexResult.startsWith('0x')) return null;
  try {
    return BigInt(hexResult);
  } catch {
    return null;
  }
}

/** Decode ABI-encoded string from eth_call result (0x-prefixed hex). */
export function decodeAbiString(hexResult: string): string | null {
  if (!hexResult || typeof hexResult !== 'string' || !hexResult.startsWith('0x')) return null;
  const hex = hexResult.slice(2);
  if (hex.length < 128) return null;
  try {
    const offset = parseInt(hex.slice(0, 64), 16);
    const length = parseInt(hex.slice(offset * 2, offset * 2 + 64), 16);
    const dataHex = hex.slice(offset * 2 + 64, offset * 2 + 64 + length * 2);
    if (dataHex.length !== length * 2) return null;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(dataHex.slice(i * 2, i * 2 + 2), 16);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
