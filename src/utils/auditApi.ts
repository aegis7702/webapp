/**
 * Audit scan API: POST /v1/impl/scan
 * Request: { chainId, implAddress }
 * Response: audit result with label, confidence, reasons, etc.
 */

const AUDIT_API_BASE = 'http://54.206.43.201:8000';

export type AuditLabel = 'SAFE' | 'UNSAFE' | 'LOW_RISK' | 'UNKNOWN';

export interface ImplScanAudit {
  label: AuditLabel;
  confidence: number;
  name?: string;
  summary?: string;
  description?: string;
  reasons: string[];
  matched_patterns: string[];
}

export interface ImplScanResponse {
  chainId: number;
  implAddress: string;
  audit: ImplScanAudit;
  reasonsText?: string;
  registryTxHash?: string;
}

export interface ImplScanRequest {
  chainId: number;
  implAddress: string;
}

/**
 * POST /v1/impl/scan - run audit for an implementation address.
 */
export async function implScan(params: ImplScanRequest): Promise<ImplScanResponse> {
  const url = `${AUDIT_API_BASE.replace(/\/$/, '')}/v1/impl/scan`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: params.chainId,
      implAddress: params.implAddress,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `impl/scan failed: ${res.status}`);
  }
  return await res.json();
}
