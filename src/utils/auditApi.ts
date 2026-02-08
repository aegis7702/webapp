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

// --- POST /v1/tx/precheck ---

export interface TxPrecheckRequest {
  chainId: number;
  from: string;
  to: string;
  value: string;
  data: string;
  types?: unknown;
  txType?: number;
  authorizationList?: unknown[];
}

export interface TxPrecheckAudit {
  label: string;
  confidence: number;
  name?: string;
  summary?: string;
  description?: string;
  reasons: string[];
  matched_patterns: string[];
}

export interface TxPrecheckResponse {
  chainId: number;
  allow: boolean;
  audit: TxPrecheckAudit;
  reasonsText?: string;
  walletCurrentImpl?: string;
  walletCurrentImplRecord?: Record<string, unknown>;
}

/**
 * POST /v1/tx/precheck - run precheck before sending a transaction.
 */
export async function txPrecheck(params: TxPrecheckRequest): Promise<TxPrecheckResponse> {
  const url = `${AUDIT_API_BASE.replace(/\/$/, '')}/v1/tx/precheck`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: params.chainId,
      from: params.from,
      to: params.to,
      value: params.value ?? '0',
      data: params.data ?? '0x',
      ...(params.types != null && { types: params.types }),
      txType: params.txType ?? 0,
      authorizationList: params.authorizationList ?? [],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `tx/precheck failed: ${res.status}`);
  }
  return await res.json();
}