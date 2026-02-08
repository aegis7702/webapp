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

// --- POST /v1/impl/audit-apply ---

export type AuditApplyMode = 'swap' | string;

export interface AuditApplyRequest {
  chainId: number;
  wallet: string;
  newImplAddress: string;
  mode: AuditApplyMode;
}

export interface AuditApplyTxTemplate {
  to: string;
  data: string;
  value: string;
}

export interface AuditApplyResponse {
  chainId: number;
  wallet: string;
  mode: string;
  currentImpl: string;
  newImpl: string;
  newImplAudit: ImplScanAudit;
  newImplReasonsText?: string;
  newImplRegistryTxHash?: string;
  swapAudit: ImplScanAudit;
  swapReasonsText?: string;
  swapRegistryTxHash?: string;
  allow: boolean;
  txTemplate: AuditApplyTxTemplate;
}

/**
 * POST /v1/impl/audit-apply - get audit for applying (swap) a new implementation and optional tx template.
 */
export async function auditApply(params: AuditApplyRequest): Promise<AuditApplyResponse> {
  const url = `${AUDIT_API_BASE.replace(/\/$/, '')}/v1/impl/audit-apply`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: params.chainId,
      wallet: params.wallet,
      newImplAddress: params.newImplAddress,
      mode: params.mode,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `audit-apply failed: ${res.status}`);
  }
  return await res.json();
}