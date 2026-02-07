import { ChevronRight } from 'lucide-react';
import { Implementation } from '../../../types';
import { RiskBadge } from './RiskBadge';

export function ImplementationDetailPage({ 
  implementation, 
  onBack 
}: { 
  implementation: Implementation; 
  onBack: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 px-6 py-4 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-stone-600 rotate-180" />
        </button>
        <h1 className="text-lg font-semibold text-stone-900">Implementation Detail</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Basic Info */}
          <div className="mb-6">
            <RiskBadge risk={implementation.riskLevel} />
            <h2 className="text-2xl font-bold text-stone-900 mt-4 mb-2">{implementation.title}</h2>
            <p className="text-sm text-stone-500 mb-4">by {implementation.provider}</p>
            <p className="text-sm text-stone-700">{implementation.description}</p>
          </div>

          {/* Security Analysis */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 mb-4">
            <h3 className="font-semibold text-base text-stone-900 mb-3">Security Analysis</h3>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-sm text-stone-700 leading-relaxed">
                {implementation.details || 'This implementation has been thoroughly reviewed and is compliant with EIP-7702 standards. It enables efficient batch transaction.'}
              </p>
            </div>
          </div>

          {/* Contract Information */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 mb-4">
            <h3 className="font-semibold text-base text-stone-900 mb-3">Contract Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-stone-500 mb-1">Contract Address</p>
                <p className="text-sm text-stone-800 font-mono">0x742d35Cc6634C0532925a3b844Bc9e7595f35Bd</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Network</p>
                <p className="text-sm text-stone-800">Ethereum Mainnet</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Verified</p>
                <p className="text-sm text-stone-800">Yes</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="font-semibold text-base text-stone-900 mb-3">Permissions</h3>
            <ul className="space-y-2">
              <li className="text-sm text-stone-700">• Execute batch transactions</li>
              <li className="text-sm text-stone-700">• Manage gas sponsorship</li>
              <li className="text-sm text-stone-700">• Read account balance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
