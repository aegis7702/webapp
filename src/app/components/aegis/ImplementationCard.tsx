import { ChevronDown } from 'lucide-react';
import { Implementation } from '../../../types';
import { RiskBadge } from './RiskBadge';

export function ImplementationCard({ 
  implementation, 
  isExpanded, 
  onToggle,
  cardType = 'default',
  onRunDiagnosis,
  onDeactivate,
  onChange,
  onActivate,
  onViewDetail,
  isSelectable = false,
  isSelected = false,
  onSelect
}: { 
  implementation: Implementation; 
  isExpanded: boolean; 
  onToggle: () => void;
  cardType?: 'search-result' | 'registered' | 'active' | 'default';
  onRunDiagnosis?: () => void;
  onDeactivate?: () => void;
  onChange?: () => void;
  onActivate?: () => void;
  onViewDetail?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 relative">
      {/* Selection Control (if in selection mode) */}
      {isSelectable && (
        <div className="absolute left-4 top-4">
          <input
            type="radio"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 accent-orange-500 cursor-pointer"
          />
        </div>
      )}

      <div className={`${isSelectable ? 'ml-8' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <RiskBadge risk={implementation.riskLevel} />
          <button 
            onClick={onToggle}
            className="text-stone-500 hover:text-orange-500 transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <h3 className="font-medium text-base text-stone-900 mb-1">{implementation.title}</h3>
        <p className="text-xs text-stone-500 mb-2">by {implementation.provider}</p>
        <p className="text-xs text-stone-600 mb-3">{implementation.description}</p>

        {/* View Detail Button - Always visible */}
        {isExpanded && (
          <button
            onClick={onViewDetail}
            className="text-xs text-orange-600 font-semibold hover:text-orange-700 transition-colors mb-3"
          >
            View Details →
          </button>
        )}
        
        {/* Card Type Specific Actions - Only visible when expanded */}
        {isExpanded && (
          <>
            {cardType === 'search-result' && (
              <button
                onClick={onRunDiagnosis}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Run Diagnosis
              </button>
            )}

            {cardType === 'registered' && !isSelectable && (
              <button
                onClick={onActivate}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Activate
              </button>
            )}

            {cardType === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={onDeactivate}
                  className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={onChange}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  Change
                </button>
              </div>
            )}
          </>
        )}
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            <h4 className="font-semibold text-sm text-stone-900 mb-3">Details</h4>
            <div className="bg-stone-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-stone-600">
                {implementation.details || 'Security review details would appear here. This implementation has been analyzed and verified according to EIP-7702 standards.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}