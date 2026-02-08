import React, { useState } from 'react';
import { ChevronDown, FileCode2, Link2 } from 'lucide-react';
import { UnifiedModal } from './UnifiedModal';

interface DiagnosisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  diagnosis: {
    label: 'SAFE' | 'UNSAFE' | 'LOW_RISK' | 'UNKNOWN';
    confidence: number;
    reasons: string[];
    matched_patterns: string[];
    analysis_source?: string;
    implAddress?: string;
    summary?: string;
    reasonsText?: string;
    chainId?: number;
    description?: string;
  };
  advancedMode?: boolean;
}

export function DiagnosisReportModal({
  isOpen,
  onClose,
  onRegister,
  diagnosis,
  advancedMode = true
}: DiagnosisReportModalProps) {
  const [showMatchedPatterns, setShowMatchedPatterns] = useState(advancedMode);

  // Map backend label to UI display
  const getRiskDisplay = () => {
    switch (diagnosis.label) {
      case 'SAFE':
        return {
          label: 'Safe',
          className: 'bg-green-50 border border-green-200 text-green-900'
        };
      case 'UNSAFE':
        return {
          label: 'Unsafe',
          className: 'bg-red-50 border border-red-200 text-red-900'
        };
      case 'LOW_RISK':
        return {
          label: 'Low Risk',
          className: 'bg-amber-50 border border-amber-200 text-amber-900'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-stone-50 border border-stone-200 text-stone-700'
        };
    }
  };
  const riskDisplay = getRiskDisplay();

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Audit Report"
      fullScreen
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 min-h-[44px] sm:min-h-0 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 active:bg-stone-300 transition-colors touch-manipulation"
          >
            Close
          </button>
          <button
            onClick={onRegister}
            className="flex-1 min-h-[44px] sm:min-h-0 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
          >
            Confirm
          </button>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5 pb-6">

        {/* Risk Tag */}
        <div>
          <span className={`inline-flex items-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold ${riskDisplay.className}`}>
            {riskDisplay.label}
          </span>
        </div>

        {/* Meta: implAddress, chainId */}
        {(diagnosis.implAddress != null || diagnosis.chainId != null) && (
          <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/80 p-3 sm:p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-stone-200 shadow-sm flex-shrink-0">
                <FileCode2 className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-stone-800">Contract info</span>
              {diagnosis.chainId != null && (
                <span className="w-full sm:w-auto sm:ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-stone-200 text-xs font-medium text-stone-600">
                  <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Chain {diagnosis.chainId}
                </span>
              )}
            </div>
            {diagnosis.implAddress != null && (
              <div className="rounded-lg bg-white border border-stone-200 px-3 py-2.5 min-w-0 overflow-hidden">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Implementation address</p>
                <p className="font-mono text-xs sm:text-sm text-stone-800 break-all leading-relaxed select-all">
                  {diagnosis.implAddress}
                </p>
              </div>
            )}
          </div>
        )}



        {/* Confidence */}
        <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs sm:text-sm font-semibold text-stone-900">Confidence</span>
            <span className="text-xs sm:text-sm font-semibold text-stone-900 flex-shrink-0">
              {(diagnosis.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all"
              style={{ width: `${diagnosis.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Summary */}
        {diagnosis.summary != null && diagnosis.summary !== '' && (
          <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200 min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-stone-900 mb-2">Summary</h4>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words">{diagnosis.summary}</p>
          </div>
        )}

        {/* Description */}
        {diagnosis.description != null && diagnosis.description !== '' && (
          <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200 min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-stone-900 mb-2">Description</h4>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-words">{diagnosis.description}</p>
          </div>
        )}

        {/* Key Reasons */}
        {(diagnosis.reasons.length > 0 || (diagnosis.reasonsText != null && diagnosis.reasonsText !== '')) && (
          <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200 min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-stone-900 mb-3">Key Reasons</h4>
            {diagnosis.reasons.length > 0 ? (
              <ol className="space-y-2 list-decimal list-outside pl-4 sm:list-inside sm:pl-0">
                {diagnosis.reasons.map((reason, index) => (
                  <li key={index} className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words">
                    {reason}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-words">{diagnosis.reasonsText}</p>
            )}
          </div>
        )}

        {/* Matched Patterns (Advanced) */}
        <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden min-w-0">
          <button
            type="button"
            onClick={() => setShowMatchedPatterns(!showMatchedPatterns)}
            className="w-full flex items-center justify-between p-4 min-h-[48px] hover:bg-stone-100 active:bg-stone-200 transition-colors touch-manipulation text-left"
          >
            <h4 className="font-semibold text-xs sm:text-sm text-stone-900">Matched Patterns</h4>
            <ChevronDown
              className={`w-5 h-5 sm:w-4 sm:h-4 text-stone-600 flex-shrink-0 transition-transform ${showMatchedPatterns ? 'rotate-180' : ''
                }`}
            />
          </button>
          {showMatchedPatterns && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <ul className="space-y-2">
                {diagnosis.matched_patterns.map((pattern, index) => (
                  <li key={index} className="text-xs sm:text-sm text-stone-700 flex items-start gap-2 break-words">
                    <span className="text-stone-400 flex-shrink-0">•</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Analysis Source */}
        {diagnosis.analysis_source && (
          <div className="text-xs text-stone-500 text-center break-all px-1">
            Analysis Source: {diagnosis.analysis_source}
          </div>
        )}
      </div>
    </UnifiedModal>
  );
}
