import { ChevronRight, Copy, Check } from 'lucide-react';
import { Implementation } from '../../../types';
import { useState } from 'react';

export function ImplementationCard({ 
  implementation, 
  isExpanded, 
  onToggle,
  cardType = 'default',
  isNewDetection = false,
  onRunDiagnosis,
  onDeactivate,
  onChange,
  onActivate,
  isSelectable = false,
  isSelected = false,
  onSelect
}: { 
  implementation: Implementation; 
  isExpanded: boolean; 
  onToggle: () => void;
  cardType?: 'search-result' | 'registered' | 'active' | 'default';
  isNewDetection?: boolean; // True if this is a newly detected unknown implementation
  onRunDiagnosis?: () => void;
  onDeactivate?: () => void;
  onChange?: () => void;
  onActivate?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  // Get risk status text and color
  const getRiskStatus = () => {
    switch (implementation.riskLevel) {
      case 'safe':
        return { label: 'Safe', color: 'text-green-600' };
      case 'low':
        return { label: 'Low Risk', color: 'text-amber-600' };
      case 'high':
        return { label: 'Unsafe', color: 'text-red-600' };
      default:
        return { label: 'Unknown', color: 'text-stone-500' };
    }
  };

  const riskStatus = getRiskStatus();

  // State for copy feedback
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Generate a mock contract address based on implementation id
    const mockAddress = `0x${implementation.id.substring(0, 8)}...${implementation.id.substring(implementation.id.length - 4)}`;
    navigator.clipboard.writeText(mockAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // New detections cannot be expanded
  const canExpand = !isNewDetection;

  return (
    <div
      onClick={canExpand ? onToggle : undefined}
      className={`w-full bg-white border border-stone-100 rounded-xl p-4 shadow-sm ${
        canExpand ? 'hover:shadow-md cursor-pointer' : ''
      } transition-shadow text-left relative`}
    >
      {/* Selection Control (if in selection mode) */}
      {isSelectable && (
        <div className="absolute left-4 top-4">
          <input
            type="radio"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 accent-orange-500 cursor-pointer"
          />
        </div>
      )}

      <div className={`${isSelectable ? 'ml-8' : ''}`}>
        {/* Card Header - Always Visible */}
        {/* Implementation Name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="font-medium text-sm text-stone-900">
              {isNewDetection ? 'New Implementation Detected' : implementation.title}
            </p>
          </div>

          {/* Drill Icon - Only for expandable cards */}
          {canExpand && (
            <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ml-4 ${
              isExpanded ? 'rotate-90' : ''
            }`} />
          )}
        </div>

        {/* Contract Address */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600">Contract Address:</span>
            <span className="text-xs font-mono text-stone-700">
              0x{implementation.id.substring(0, 4)}...{implementation.id.substring(implementation.id.length - 4)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-1 hover:bg-stone-100 rounded transition-colors"
              title="Copy address"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-stone-500" />
              )}
            </button>
          </div>
        </div>

        {/* Summary - Only for known implementations (collapsed state) */}
        {!isNewDetection && (
          <div className="mb-3">
            <div className="flex items-start gap-2">
              <span className="text-xs text-stone-600 flex-shrink-0">Summary:</span>
              <span className="text-xs text-stone-700 line-clamp-1">
                {implementation.description}
              </span>
            </div>
          </div>
        )}

        {/* New Detection: Risk Status + Run AI Audit (Non-expandable) */}
        {isNewDetection && (
          <>
            <div className="mb-3"></div>
            <div className="flex items-center justify-between">
              {/* Risk Status */}
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-stone-50 border border-stone-200 text-stone-700`}>
                Unknown
              </span>

              {/* Run AI Audit Button */}
              {onRunDiagnosis && (
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunDiagnosis();
                    }}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Run AI Audit
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Known Implementation: Expandable Description + Persistent Bottom Section */}
        {!isNewDetection && (
          <>
            {/* Description Block - Only visible when expanded */}
            {isExpanded && (
              <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                <h4 className="font-semibold text-sm text-stone-900 mb-3">Description</h4>
                
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {implementation.description}
                  </p>
                  
                  {/* Agent AI Audit Info (if available) */}
                  {implementation.verdict && (
                    <div className="mt-3 pt-3 border-t border-stone-300">
                      <p className={`text-xs font-semibold mb-1 ${
                        implementation.verdict === 'safe' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        Agent AI Audit: {implementation.verdict === 'safe' ? 'Safe' : 'Unsafe'}
                      </p>
                      <p className={`text-xs ${
                        implementation.verdict === 'safe' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        This implementation has been analyzed by Aegis Agent and verified for security.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Persistent Bottom Section - ALWAYS VISIBLE */}
            <div onClick={(e) => e.stopPropagation()}>
              {/* Divider - Same style as Activity cards */}
              <div className="border-t border-stone-200 mb-4"></div>

              {/* Risk Status Tag + Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                {/* Risk Status Tag - Same style as Activity cards */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                  implementation.riskLevel === 'safe' 
                    ? 'bg-green-50 border border-green-200 text-green-900'
                    : implementation.riskLevel === 'low'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : implementation.riskLevel === 'high'
                    ? 'bg-red-50 border border-red-200 text-red-900'
                    : 'bg-stone-50 border border-stone-200 text-stone-700'
                }`}>
                  {riskStatus.label}
                </span>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Search Result Actions */}
                  {cardType === 'search-result' && onRunDiagnosis && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunDiagnosis();
                      }}
                      className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Run AI Audit
                    </button>
                  )}

                  {/* Registered Actions */}
                  {cardType === 'registered' && !isSelectable && onActivate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivate();
                      }}
                      className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Activate
                    </button>
                  )}

                  {/* Active Actions */}
                  {cardType === 'active' && (
                    <>
                      {onDeactivate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeactivate();
                          }}
                          className="bg-stone-100 text-stone-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                      {onChange && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange();
                          }}
                          className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                        >
                          Change
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}