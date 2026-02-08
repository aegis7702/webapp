import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ImplementationCard } from './ImplementationCard';
import { AegisSearchArea } from './SafeguardSearchBar';
import { UnifiedModal } from './UnifiedModal';
import { DiagnosisReportModal } from './DiagnosisReportModal';
import { Implementation } from '../../../types';
import { fetchGetRecordCurrent, setAegisImplementation, type GetRecordCurrentDecoded } from '../../../utils/aegisSession';
import { implScan, auditApply, type AuditLabel, type AuditApplyResponse } from '../../../utils/auditApi';
import config from '../../../config/address.json';
import { DEFAULT_NETWORKS } from '../../../config/netwotk';
import { getSelectedNetwork } from '../../../utils/tokenSession';
import { getWalletSession, decryptPrivateKey } from '../../../utils/walletSession';
import { getLoginPasswordInMemory } from '../../../utils/authMemory';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';

type ViewMode = 'normal' | 'selecting-replacement';

/** Map getRecentRecords row to Implementation. Verdict Unknown is displayed as Unsafe. */
function mapRecentRecordToImplementation(
  impl: string,
  name: string,
  summary: string,
  description: string,
  reasons: string,
  verdict: 'Unknown' | 'Safe' | 'Unsafe'
): Implementation {
  const displayUnsafe = verdict !== 'Safe'; // Unknown and Unsafe both show as Unsafe
  const shortAddr = impl.slice(0, 10) + '...' + impl.slice(-6);
  return {
    id: impl,
    address: impl,
    state: 'registered',
    verdict: displayUnsafe ? 'unsafe' : 'safe',
    title: name?.trim() || shortAddr,
    provider: 'Registry',
    description: description?.trim() || summary?.trim() || reasons?.trim() || 'No description.',
    riskLevel: verdict === 'Safe' ? 'safe' : 'high', // Unknown and Unsafe → high (red/Unsafe)
  };
}

/** Map getRecordCurrent + implementationAddress to Implementation for Active card. */
function mapGetRecordCurrentToImplementation(
  implementationAddress: string,
  record: GetRecordCurrentDecoded
): Implementation {
  const verdictUnsafe = record.verdict !== 'Safe';
  return {
    id: implementationAddress,
    address: implementationAddress,
    state: 'active',
    verdict: verdictUnsafe ? 'unsafe' : 'safe',
    title: record.name?.trim() || implementationAddress.slice(0, 10) + '...' + implementationAddress.slice(-6),
    provider: 'Registry',
    description: record.description?.trim() || record.summary?.trim() || record.reasons?.trim() || 'No description.',
    riskLevel: record.verdict === 'Safe' ? 'safe' : 'high',
  };
}

export function AegisContent() {
  const { aegis } = useAppData();
  const { activeImpl, setActiveImpl, registeredImpls, setRegisteredImpls, registeredLoading, refetchAegisData } = aegis;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Implementation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  type ActivateStep = 'idle' | 'confirm' | 'auditing' | 'audit-result' | 'executing' | 'success' | 'error';
  const [activateStep, setActivateStep] = useState<ActivateStep>('idle');
  const [activateTxHash, setActivateTxHash] = useState<string | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [auditApplyResult, setAuditApplyResult] = useState<AuditApplyResponse | null>(null);

  // Modals and modes
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showDiagnosisLoading, setShowDiagnosisLoading] = useState(false);
  const [showDiagnosisReport, setShowDiagnosisReport] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [selectedForReplacement, setSelectedForReplacement] = useState<string | null>(null);
  const [diagnosingImpl, setDiagnosingImpl] = useState<Implementation | null>(null);
  const [activatingImpl, setActivatingImpl] = useState<Implementation | null>(null);

  /** Diagnosis result from POST /v1/impl/scan; used for AI Audit Report modal. */
  const [diagnosisData, setDiagnosisData] = useState<{
    label: AuditLabel;
    confidence: number;
    reasons: string[];
    matched_patterns: string[];
    analysis_source?: string;
    implAddress?: string;
    summary?: string;
    reasonsText?: string;
    chainId?: number;
    description?: string;
  } | null>(null);

  const defaultDiagnosis = {
    label: 'UNKNOWN' as const,
    confidence: 0,
    reasons: [] as string[],
    matched_patterns: [] as string[],
  };

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = async (_network: string, address: string) => {
    setHasSearched(true);
    const trimmed = address.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const rpcUrl = network.rpcUrl;
    const record = await fetchGetRecordCurrent(rpcUrl, trimmed, config.ImplSafetyRegistry);
    if (!record) {
      setSearchResults([]);
      return;
    }
    // updatedAt === 0 means not yet registered → New Implementation Detected
    if (record.updatedAt === 0n) {
      const newImpl: Implementation = {
        id: trimmed,
        address: trimmed,
        state: 'registered',
        verdict: 'safe',
        title: 'New Implementation Detected',
        provider: 'Unknown',
        description: 'This implementation is not yet in the registry. Run diagnosis to register.',
        riskLevel: 'unknown',
      };
      setSearchResults([newImpl]);
      return;
    }
    // Apply registry data
    const impl = mapGetRecordCurrentToImplementation(trimmed, record);
    setSearchResults([impl]);
  };

  const handleRunDiagnosis = async (impl: Implementation) => {
    setDiagnosingImpl(impl);
    setShowDiagnosisLoading(true);
    setDiagnosisData(null);
    const net = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const chainId = net.chainId;
    if (!chainId) {
      setShowDiagnosisLoading(false);
      setDiagnosisData({
        label: 'UNKNOWN',
        confidence: 0,
        reasons: ['No network selected. Select a network and try again.'],
        matched_patterns: [],
      });
      setShowDiagnosisReport(true);
      return;
    }
    try {
      const res = await implScan({
        chainId: Number(chainId),
        implAddress: impl.address,
      });
      setDiagnosisData({
        label: res.audit.label,
        confidence: res.audit.confidence,
        reasons: res.audit.reasons ?? [],
        matched_patterns: res.audit.matched_patterns ?? [],
        ...(res.registryTxHash != null && { analysis_source: res.registryTxHash }),
        ...(res.implAddress != null && { implAddress: res.implAddress }),
        ...(res.audit.summary != null && res.audit.summary !== '' && { summary: res.audit.summary }),
        ...(res.reasonsText != null && res.reasonsText !== '' && { reasonsText: res.reasonsText }),
        ...(res.chainId != null && { chainId: res.chainId }),
        ...(res.audit.description != null && res.audit.description !== '' && { description: res.audit.description }),
      });
      setShowDiagnosisReport(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setDiagnosisData({
        label: 'UNKNOWN',
        confidence: 0,
        reasons: [message],
        matched_patterns: [],
      });
      setShowDiagnosisReport(true);
    } finally {
      setShowDiagnosisLoading(false);
    }
  };

  const handleDiagnosisRegister = () => {
    const diagnosis = diagnosisData ?? defaultDiagnosis;
    if (diagnosingImpl) {
      const updatedImpl = {
        ...diagnosingImpl,
        riskLevel: diagnosis.label === 'SAFE' ? 'safe' as const :
          diagnosis.label === 'LOW_RISK' ? 'low' as const :
            diagnosis.label === 'UNSAFE' ? 'high' as const : 'unknown' as const,
        verdict: diagnosis.label === 'SAFE' || diagnosis.label === 'LOW_RISK' ? 'safe' as const : 'unsafe' as const,
        title: diagnosingImpl.title === 'New Implementation Detected' ?
          `Implementation ${diagnosingImpl.id.substring(0, 8)}` :
          diagnosingImpl.title,
        description: diagnosingImpl.description === 'This is a previously unknown implementation.' ?
          'Verified EIP-7702 implementation with standard delegation patterns.' :
          diagnosingImpl.description
      };

      setRegisteredImpls([...registeredImpls, updatedImpl]);
      setSearchResults(searchResults.filter(i => i.id !== diagnosingImpl.id));
    }
    setShowDiagnosisReport(false);
    setDiagnosingImpl(null);
    setDiagnosisData(null);
    refetchAegisData();
  };

  const handleDeactivate = () => {
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = () => {
    if (activeImpl) {
      setRegisteredImpls([...registeredImpls, activeImpl]);
      setActiveImpl(null);
    }
    setShowDeactivateModal(false);
  };

  const handleChange = () => {
    setViewMode('selecting-replacement');
  };

  const handleSelectForReplacement = (id: string) => {
    setSelectedForReplacement(id);
  };

  const handleCancelSelection = () => {
    setViewMode('normal');
    setSelectedForReplacement(null);
  };

  const handleConfirmSelection = () => {
    setShowChangeModal(true);
  };

  const confirmChange = () => {
    setShowChangeModal(false);

    // Directly swap active and selected implementation
    if (selectedForReplacement) {
      const selectedImpl = registeredImpls.find(i => i.id === selectedForReplacement);
      if (selectedImpl && activeImpl) {
        // Swap active and selected
        setRegisteredImpls([...registeredImpls.filter(i => i.id !== selectedForReplacement), activeImpl]);
        setActiveImpl(selectedImpl);
      }
    }

    setViewMode('normal');
    setSelectedForReplacement(null);
  };

  const handleActivate = (impl: Implementation) => {
    setActivatingImpl(impl);
    setActivateStep('confirm');
    setActivateTxHash(null);
    setActivateError(null);
    setAuditApplyResult(null);
    setShowActivateModal(true);
  };

  /** Confirm → run auditApply only; result shown in audit-result step. */
  const confirmActivate = async () => {
    if (!activatingImpl) return;
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const walletAddress = getWalletSession()?.address;
    if (!network.rpcUrl || !walletAddress) {
      setActivateError('Network or wallet missing. Please log in and select a network.');
      setActivateStep('error');
      return;
    }
    setActivateStep('auditing');
    try {
      const res = await auditApply({
        chainId: Number(network.chainId),
        wallet: walletAddress,
        newImplAddress: activatingImpl.address,
        mode: 'swap',
      });
      setAuditApplyResult(res);
      setActivateStep('audit-result');
    } catch (e) {
      setActivateError(e instanceof Error ? e.message : String(e));
      setActivateStep('error');
    }
  };

  /** From audit-result (allow: true): run setAegisImplementation. */
  const executeSetImplementation = async () => {
    if (!activatingImpl) return;
    const session = getWalletSession();
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const password = getLoginPasswordInMemory();
    if (!session?.encryptedPk || !network.rpcUrl || !password) {
      setActivateError('Session or network missing. Please log in and select a network.');
      setActivateStep('error');
      return;
    }
    setActivateStep('executing');
    let privateKey: string;
    try {
      privateKey = await decryptPrivateKey(session.encryptedPk, password);
    } catch {
      setActivateError('Decryption failed. Please log out and log in again.');
      setActivateStep('error');
      return;
    }
    const result = await setAegisImplementation({
      privateKey,
      rpcUrl: network.rpcUrl,
      chainId: network.chainId,
      implementationAddress: activatingImpl.address,
    });
    if (result.success) {
      setActivateTxHash(result.txHash);
      setActivateStep('success');
    } else {
      setActivateError(result.error);
      setActivateStep('error');
    }
  };

  const closeActivateModal = () => {
    const wasSuccess = activateStep === 'success';
    setShowActivateModal(false);
    setActivatingImpl(null);
    setActivateStep('idle');
    setActivateTxHash(null);
    setActivateError(null);
    setAuditApplyResult(null);
    if (wasSuccess) refetchAegisData();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 relative">
      <div className="max-w-4xl mx-auto w-full pb-20">
        {/* Search Implementation Section */}
        <div className="px-4 sm:px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Search Implementation</h2>

          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            {/* Search Area */}
            <AegisSearchArea onSearch={handleSearch} />

            {/* Search Results - Inside Search Implementation Section */}
            {hasSearched && (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="text-xs font-semibold text-stone-700 mb-3">Results</h3>
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((impl) => {
                      // Check if this implementation is new (unknown risk level)
                      const isNewDetection = impl.riskLevel === 'unknown';

                      // Check if implementation is already registered or active
                      const isAlreadyRegistered = registeredImpls.some(r => r.id === impl.id);
                      const isAlreadyActive = activeImpl?.id === impl.id;
                      const shouldHideDiagnosis = isAlreadyRegistered || isAlreadyActive;

                      return (
                        <ImplementationCard
                          key={impl.id}
                          implementation={impl}
                          isExpanded={expandedId === impl.id}
                          onToggle={() => handleToggle(impl.id)}
                          cardType="search-result"
                          isNewDetection={isNewDetection}
                          onRunDiagnosis={shouldHideDiagnosis ? undefined : () => handleRunDiagnosis(impl)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 text-center">
                    <p className="text-sm text-stone-500">No implementation found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Implementation Section */}
        <div className="px-4 sm:px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Active Implementation</h2>
          {activeImpl ? (
            <ImplementationCard
              implementation={activeImpl}
              isExpanded={expandedId === activeImpl.id}
              onToggle={() => handleToggle(activeImpl.id)}
              cardType="active"
              onDeactivate={handleDeactivate}
              onChange={handleChange}
            />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
              <p className="text-sm text-stone-500">No active implementation</p>
            </div>
          )}
        </div>

        {/* Registered Implementations Section - from getRecentRecords */}
        <div className="px-4 sm:px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Registered Implementations</h2>
          {registeredLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
              <p className="text-sm text-stone-500">Loading registered implementations…</p>
            </div>
          ) : registeredImpls.length > 0 ? (
            <div className="space-y-4">
              {registeredImpls.map((impl, index) => (
                <ImplementationCard
                  key={`${impl.id}-${index}`}
                  implementation={impl}
                  isExpanded={expandedId === impl.id}
                  onToggle={() => handleToggle(impl.id)}
                  cardType="registered"
                  onActivate={() => handleActivate(impl)}
                  isSelectable={viewMode === 'selecting-replacement'}
                  isSelected={selectedForReplacement === impl.id}
                  onSelect={() => handleSelectForReplacement(impl.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
              <p className="text-sm text-stone-500">No registered implementations</p>
            </div>
          )}
        </div>
      </div>

      {/* Selection Mode Action Buttons */}
      {viewMode === 'selecting-replacement' && (
        <div className="fixed bottom-24 sm:bottom-28 left-0 right-0 bg-white border-t border-stone-200 p-4 flex gap-3 max-w-4xl mx-auto z-40 shadow-lg">
          <button
            onClick={handleCancelSelection}
            className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedForReplacement}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${selectedForReplacement
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
          >
            Select
          </button>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <UnifiedModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Implementation"
        fullScreen
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              No
            </button>
            <button
              onClick={confirmDeactivate}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Yes
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-700">
          Do you want to deactivate the current implementation?
        </p>
      </UnifiedModal>

      {/* Change Confirmation Modal */}
      <UnifiedModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        title="Change Implementation"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowChangeModal(false)}
              className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmChange}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-700">
          Do you want to change the active implementation to the selected one?
        </p>
      </UnifiedModal>

      {/* Activate Implementation Modal (confirm → auditing → audit-result → [optional] executing → success/error) */}
      <UnifiedModal
        isOpen={showActivateModal}
        onClose={activateStep === 'executing' || activateStep === 'auditing' ? undefined : closeActivateModal}
        title={
          activateStep === 'confirm'
            ? 'Activate Implementation'
            : activateStep === 'auditing'
              ? 'Running audit'
              : activateStep === 'audit-result'
                ? 'Audit result'
                : activateStep === 'executing'
                  ? 'Activating'
                  : activateStep === 'success'
                    ? 'Activation complete'
                    : 'Activation failed'
        }
        showCloseButton={activateStep !== 'executing' && activateStep !== 'auditing'}
        fullScreen
        footer={
          activateStep === 'confirm' ? (
            <div className="flex flex-row sm:flex-row gap-3">
              <button
                onClick={closeActivateModal}
                className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmActivate}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          ) : activateStep === 'audit-result' && auditApplyResult ? (
            <div className="flex flex-row sm:flex-row gap-3">
              <button
                onClick={closeActivateModal}
                className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                {auditApplyResult.allow ? 'Cancel' : 'Close'}
              </button>
              {auditApplyResult.allow && (
                <button
                  onClick={executeSetImplementation}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  Set implementation
                </button>
              )}
            </div>
          ) : activateStep === 'success' ? (
            <button
              onClick={closeActivateModal}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Confirm
            </button>
          ) : activateStep === 'error' ? (
            <button
              onClick={closeActivateModal}
              className="w-full bg-stone-800 text-white py-3 rounded-xl font-semibold hover:bg-stone-700 transition-colors"
            >
              Try again
            </button>
          ) : undefined
        }
      >
        {activateStep === 'confirm' && activatingImpl && (
          <div className="space-y-4">
            <p className="text-stone-700">
              Set this implementation as the active one for your Aegis Guard. All new transactions will use this implementation.
            </p>
            <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
              <p className="font-medium text-stone-900">{activatingImpl.title || 'Unnamed'}</p>
              <p className="text-xs text-stone-500 font-mono mt-1 break-all">{activatingImpl.address}</p>
              {(activatingImpl.description || activatingImpl.details) && (
                <p className="text-sm text-stone-600 mt-2">{activatingImpl.description || activatingImpl.details}</p>
              )}
            </div>
            <p className="text-sm text-stone-600">
              An audit will run first. Then you can confirm to send the transaction. Gas fees apply.
            </p>
          </div>
        )}
        {activateStep === 'auditing' && (
          <div className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-orange-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-900">
                  Running apply audit…
                </p>
                <p className="text-xs text-stone-600">
                  Please wait. Do not close this window.
                </p>
              </div>
            </div>
          </div>
        )}
        {activateStep === 'audit-result' && auditApplyResult && (
          <div className="space-y-5">
            {auditApplyResult.allow ? (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">Audit passed. You can proceed to set the implementation.</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Audit did not allow this change</p>
                  <p className="text-xs text-red-800 mt-1">Review the results below and close to exit.</p>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">New implementation audit</h4>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${auditApplyResult.newImplAudit.label === 'SAFE' ? 'bg-green-100 text-green-800' :
                  auditApplyResult.newImplAudit.label === 'LOW_RISK' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {auditApplyResult.newImplAudit.label}
                </span>
                <p className="text-xs text-stone-600 mt-2">Confidence: {(auditApplyResult.newImplAudit.confidence * 100).toFixed(0)}%</p>
                {auditApplyResult.newImplAudit.summary && (
                  <p className="text-sm text-stone-700 mt-2">{auditApplyResult.newImplAudit.summary}</p>
                )}
                {auditApplyResult.newImplReasonsText && (
                  <p className="text-xs text-stone-600 mt-2 whitespace-pre-wrap">{auditApplyResult.newImplReasonsText}</p>
                )}
              </div>
              <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Swap audit</h4>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${auditApplyResult.swapAudit.label === 'SAFE' ? 'bg-green-100 text-green-800' :
                  auditApplyResult.swapAudit.label === 'LOW_RISK' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {auditApplyResult.swapAudit.label}
                </span>
                <p className="text-xs text-stone-600 mt-2">Confidence: {(auditApplyResult.swapAudit.confidence * 100).toFixed(0)}%</p>
                {auditApplyResult.swapAudit.summary && (
                  <p className="text-sm text-stone-700 mt-2">{auditApplyResult.swapAudit.summary}</p>
                )}
                {auditApplyResult.swapReasonsText && (
                  <p className="text-xs text-stone-600 mt-2 whitespace-pre-wrap">{auditApplyResult.swapReasonsText}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {activateStep === 'executing' && (
          // <div className="flex flex-col items-center justify-center py-16 text-center">
          //   <Loader2 className="w-14 h-14 text-orange-500 animate-spin mb-6" />
          //   <p className="text-stone-800 font-medium">Setting active implementation…</p>
          //   <p className="text-sm text-stone-600 mt-2">Please wait. Do not close this window.</p>
          // </div>
          <div className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-orange-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-900">
                  Setting active implementation…
                </p>
                <p className="text-xs text-stone-600">
                  Please wait. Do not close this window.
                </p>
              </div>
            </div>
          </div>
        )}
        {activateStep === 'success' && activateTxHash && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">
              The implementation is now active. Delegated executions will use this implementation.
            </p>
            <p className="text-xs text-stone-500 font-mono break-all">
              Tx: {(getSelectedNetwork() ?? DEFAULT_NETWORKS[0])?.blockExplorer ? (
                <a
                  href={`${(getSelectedNetwork() ?? DEFAULT_NETWORKS[0])!.blockExplorer!.replace(/\/$/, '')}/tx/${activateTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  {activateTxHash}
                </a>
              ) : (
                activateTxHash
              )}
            </p>
          </div>
        )}
        {activateStep === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              Something went wrong.
            </p>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
              {activateError ?? 'Unknown error'}
            </p>
          </div>
        )}
      </UnifiedModal>

      {/* AI Audit Loading Modal */}
      <UnifiedModal
        isOpen={showDiagnosisLoading}
        title="Running AI Audit"
        showCloseButton={false}
        fullScreen
      >
        <div className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-orange-400 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-900">
                Analyzing implementation behavior and risks…
              </p>
              <p className="text-xs text-stone-600">
                This may take a few seconds
              </p>
            </div>
          </div>
        </div>
      </UnifiedModal>

      {/* AI Audit Report Modal */}
      <DiagnosisReportModal
        isOpen={showDiagnosisReport}
        onClose={() => {
          setShowDiagnosisReport(false);
          setDiagnosingImpl(null);
          setDiagnosisData(null);
        }}
        onRegister={handleDiagnosisRegister}
        diagnosis={diagnosisData ?? defaultDiagnosis}
        advancedMode={false}
      />
    </div>
  );
}