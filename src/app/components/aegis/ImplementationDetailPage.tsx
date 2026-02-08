import { ChevronLeft, Copy, Check, Shield, AlertTriangle } from 'lucide-react';
import { Implementation } from '../../../types';
import { AgentChat } from './AgentChat';
import { useState } from 'react';
import logoWhite from '../../../../public/aegis_logo_white.png';

interface ImplementationDetailPageProps {
  implementation: Implementation;
  onBack: () => void;
}

export function ImplementationDetailPage({ implementation, onBack }: ImplementationDetailPageProps) {
  const [copied, setCopied] = useState(false);
  
  // Check if this is a new detection (unknown risk level)
  const isNewDetection = implementation.riskLevel === 'unknown';

  const handleCopyAddress = () => {
    // Generate a mock contract address based on implementation id
    const mockAddress = `0x${implementation.id.substring(0, 40)}`;
    navigator.clipboard.writeText(mockAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = () => {
    switch (implementation.riskLevel) {
      case 'safe':
        return 'text-green-600';
      case 'low':
        return 'text-amber-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-stone-500';
    }
  };

  const getRiskLabel = () => {
    switch (implementation.riskLevel) {
      case 'safe':
        return 'Safe';
      case 'low':
        return 'Low Risk';
      case 'high':
        return 'Unsafe';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 relative">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-3"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Aegis</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Implementation Details</h1>
          <p className="text-sm text-stone-600 mt-1">
            {isNewDetection ? 'New Implementation' : implementation.title}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Overview Section */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-base text-stone-900 mb-4">Overview</h2>
          
          <div className="space-y-3">
            {/* Implementation Name */}
            {!isNewDetection && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                <span className="text-sm text-stone-600">Implementation</span>
                <span className="text-sm font-medium text-stone-900">{implementation.title}</span>
              </div>
            )}

            {/* Contract Address */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
              <span className="text-sm text-stone-600">Contract Address</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-stone-900 break-all">
                  0x{implementation.id.substring(0, 4)}...{implementation.id.substring(implementation.id.length - 4)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-stone-100 rounded transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-stone-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Risk Status */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
              <span className="text-sm text-stone-600">Risk Status</span>
              <span className={`text-sm font-semibold ${getRiskColor()}`}>
                {getRiskLabel()}
              </span>
            </div>

            {/* State */}
            {!isNewDetection && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                <span className="text-sm text-stone-600">State</span>
                <span className="text-sm font-medium text-stone-900">
                  {implementation.state === 'active' ? 'Active' : 'Registered'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-base text-stone-900 mb-4">Description</h2>
          
          {isNewDetection ? (
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <p className="text-sm text-stone-700 leading-relaxed">
                This is a previously unknown implementation. An Agent diagnosis must be run first 
                to verify its security and compatibility before it can be registered or activated.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-300">
                <p className="text-xs text-stone-600">
                  <span className="font-semibold">Next Step:</span> Return to the Aegis tab and run an Agent diagnosis 
                  to analyze this implementation's security properties, storage structure, and EIP-7702 compliance.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <p className="text-sm text-stone-700 leading-relaxed">
                {implementation.description}
              </p>
            </div>
          )}
        </div>

        {/* Security & AI Audit Section */}
        {!isNewDetection && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <img src={logoWhite} alt="logo" className="h-4" />
              </div>
              <h2 className="font-semibold text-base text-stone-900">Security & AI Audit</h2>
            </div>

            <div className="space-y-4">
              {/* Security Review */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Security Review</h3>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {implementation.details || 'This implementation has been thoroughly reviewed and is compliant with EIP-7702 standards. Security analysis confirms proper implementation of delegation patterns and safe execution paths.'}
                  </p>
                </div>
              </div>

              {/* Agent AI Audit Results */}
              {implementation.verdict && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">Agent AI Audit</h3>
                  <div className={`rounded-lg p-4 border-2 ${
                    implementation.verdict === 'safe' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {implementation.verdict === 'safe' ? (
                        <div className="w-5 h-5 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold text-sm mb-1 ${
                          implementation.verdict === 'safe' ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {implementation.verdict === 'safe' ? 'Safe for Use' : 'Security Concerns Detected'}
                        </p>
                        <p className={`text-xs ${
                          implementation.verdict === 'safe' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          This implementation has been analyzed by Aegis Agent and 
                          {implementation.verdict === 'safe' 
                            ? ' verified for security according to EIP-7702 standards.' 
                            : ' flagged for potential security risks.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compatibility Section */}
        {!isNewDetection && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h2 className="font-semibold text-base text-stone-900 mb-4">Compatibility</h2>
            
            <div className="space-y-3">
              {/* Storage Structure */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Storage Structure</h3>
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <p className="text-xs text-stone-700">
                    Compatible storage layout detected. Uses standardized EIP-7702 delegation slots without conflicts.
                  </p>
                </div>
              </div>

              {/* Upgrade Safety */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Upgrade Safety</h3>
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <ul className="space-y-1">
                    <li className="text-xs text-stone-700 flex items-start gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <span>Safe to switch between compatible implementations</span>
                    </li>
                    <li className="text-xs text-stone-700 flex items-start gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <span>State preservation verified</span>
                    </li>
                    <li className="text-xs text-stone-700 flex items-start gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <span>No storage collision risk detected</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Execution Assumptions */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Execution Assumptions</h3>
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <p className="text-xs text-stone-700">
                    Implementation follows standard execution patterns. Compatible with existing wallet state 
                    and requires no special initialization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Context - New Detection */}
        {isNewDetection && (
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 mb-3">Understanding Implementation AI Audit</h3>
            <div className="space-y-2 text-xs text-blue-800">
              <p>
                <span className="font-semibold">• Agent Analysis:</span> Aegis Agent performs deep analysis 
                of smart contract code to identify risks and verify EIP-7702 compliance.
              </p>
              <p>
                <span className="font-semibold">• Storage Safety:</span> The diagnosis checks for storage 
                structure compatibility and potential collision risks with your wallet state.
              </p>
              <p>
                <span className="font-semibold">• Security Verification:</span> All implementations must pass 
                security checks before they can be registered or activated in your wallet.
              </p>
            </div>
          </div>
        )}

        {/* Additional Context - Known Implementation */}
        {!isNewDetection && (
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 mb-3">Understanding EIP-7702 Implementations</h3>
            <div className="space-y-2 text-xs text-blue-800">
              <p>
                <span className="font-semibold">• Delegated Execution:</span> EIP-7702 allows your EOA to 
                delegate execution to smart contract implementations while maintaining control.
              </p>
              <p>
                <span className="font-semibold">• Continuous Monitoring:</span> Aegis monitors all transactions 
                executed through delegated implementations for anomalous behavior.
              </p>
              <p>
                <span className="font-semibold">• Safe Switching:</span> You can safely switch between compatible 
                implementations without losing wallet state or assets.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Agent Chat Component */}
      <AgentChat />
    </div>
  );
}
