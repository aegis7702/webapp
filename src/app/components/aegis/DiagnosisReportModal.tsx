import { UnifiedModal } from './UnifiedModal';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
  };
  advancedMode?: boolean;
}

export function DiagnosisReportModal({ 
  isOpen, 
  onClose, 
  onRegister,
  diagnosis,
  advancedMode = false
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
      title="Diagnosis Report"
      footer={
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRegister}
            className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Register
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Risk Tag */}
        <div>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${riskDisplay.className}`}>
            {riskDisplay.label}
          </span>
        </div>

        {/* Confidence */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-stone-900">Confidence</span>
            <span className="text-sm font-semibold text-stone-900">
              {(diagnosis.confidence * 100).toFixed(0)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${diagnosis.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Key Reasons */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <h4 className="font-semibold text-sm text-stone-900 mb-3">Key Reasons</h4>
          <ol className="space-y-2 list-decimal list-inside">
            {diagnosis.reasons.map((reason, index) => (
              <li key={index} className="text-sm text-stone-700 leading-relaxed">
                {reason}
              </li>
            ))}
          </ol>
        </div>

        {/* Matched Patterns (Advanced) */}
        <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
          <button
            onClick={() => setShowMatchedPatterns(!showMatchedPatterns)}
            className="w-full flex items-center justify-between p-4 hover:bg-stone-100 transition-colors"
          >
            <h4 className="font-semibold text-sm text-stone-900">Matched Patterns</h4>
            <ChevronDown 
              className={`w-4 h-4 text-stone-600 transition-transform ${
                showMatchedPatterns ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {showMatchedPatterns && (
            <div className="px-4 pb-4">
              <ul className="space-y-2">
                {diagnosis.matched_patterns.map((pattern, index) => (
                  <li key={index} className="text-sm text-stone-700 flex items-start gap-2">
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
          <div className="text-xs text-stone-500 text-center">
            Analysis Source: {diagnosis.analysis_source}
          </div>
        )}
      </div>
    </UnifiedModal>
  );
}
