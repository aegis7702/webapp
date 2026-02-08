import { ChevronLeft, AlertTriangle, Shield, Lock } from 'lucide-react';
import { Transaction } from '../../../types';
import { AgentChat } from '../aegis/AgentChat';
import logoWhite from '../../../../public/aegis_logo_white.png';

interface TransactionDetailPageProps {
  transaction: Transaction;
  onBack: () => void;
}

export function TransactionDetailPage({ transaction, onBack }: TransactionDetailPageProps) {
  const { is7702, postExecutionData, freezeAction } = transaction;

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 relative">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-3"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Activity</span>
        </button>
        <h1 className="text-xl font-bold text-stone-900">Transaction Details</h1>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Transaction Summary */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-base text-stone-900 mb-4">Transaction Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-stone-600">Action</span>
              <span className="text-sm font-medium text-stone-900">{transaction.action}</span>
            </div>

            {transaction.to && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-600">To</span>
                <span className="text-xs font-mono text-stone-900">{transaction.to}</span>
              </div>
            )}

            <div className="flex justify-between items-start">
              <span className="text-sm text-stone-600">Amount</span>
              <span className="text-sm font-medium text-stone-900">
                {transaction.type === 'swap'
                  ? transaction.amount
                  : `${transaction.amount} ${transaction.tokenSymbol}`}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-stone-600">Time</span>
              <span className="text-sm font-medium text-stone-900">{transaction.time}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-stone-600">Status</span>
              <span className={`text-sm font-semibold ${transaction.status === 'success' ? 'text-green-600' :
                  transaction.status === 'failed' ? 'text-red-600' :
                    'text-amber-600'
                }`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>

            {transaction.hash && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-600">Hash</span>
                <span className="text-xs font-mono text-stone-900 break-all max-w-[200px]">
                  {transaction.hash}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* EIP-7702 Execution Summary */}
        {is7702 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <img src={logoWhite} alt="logo" className="h-4" />
              </div>
              <h2 className="font-semibold text-base text-stone-900">EIP-7702 Execution Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-700">Implementation</span>
                <span className="text-sm font-semibold text-orange-900">{transaction.implementationName || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-700">Delegation</span>
                <span className="text-sm font-medium text-stone-900">
                  {transaction.delegatedExecution ? '7702 Execution' : 'Direct'}
                </span>
              </div>

              {transaction.executionPath && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-stone-700">Execution Path</span>
                  <span className="text-xs font-mono text-stone-900">{transaction.executionPath}</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-700">Monitoring</span>
                <div className="flex items-center gap-2">
                  {transaction.monitoringStatus === 'monitored' && (
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                      Monitored
                    </span>
                  )}
                  {transaction.monitoringStatus === 'anomaly-detected' && (
                    <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Anomaly Detected
                    </span>
                  )}
                  {transaction.monitoringStatus === 'no-anomaly' && (
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                      No Anomaly
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-Execution Monitoring */}
        {is7702 && postExecutionData && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h2 className="font-semibold text-base text-stone-900 mb-4">Post-Execution Monitoring</h2>

            {/* Event Monitoring */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-2">Event Monitoring</h3>
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                {postExecutionData.eventsMonitored.length > 0 ? (
                  <ul className="space-y-1">
                    {postExecutionData.eventsMonitored.map((event, idx) => (
                      <li key={idx} className="text-xs text-stone-700 flex items-start gap-2">
                        <span className="text-stone-400">•</span>
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-500">No events monitored</p>
                )}
              </div>
            </div>

            {/* State Changes */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-2">State Change Observations</h3>
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                {postExecutionData.stateChanges.length > 0 ? (
                  <ul className="space-y-1">
                    {postExecutionData.stateChanges.map((change, idx) => (
                      <li key={idx} className="text-xs text-stone-700 flex items-start gap-2">
                        <span className="text-stone-400">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-500">No state changes detected</p>
                )}
              </div>
            </div>

            {/* Risk Detection Outcome */}
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-2">Risk Detection Outcome</h3>

              {postExecutionData.anomalyDetected ? (
                <div className={`rounded-lg p-4 border-2 ${postExecutionData.riskLevel === 'critical' ? 'bg-red-50 border-red-300' :
                    postExecutionData.riskLevel === 'high' ? 'bg-orange-50 border-orange-300' :
                      postExecutionData.riskLevel === 'low' ? 'bg-amber-50 border-amber-300' :
                        'bg-stone-50 border-stone-300'
                  }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${postExecutionData.riskLevel === 'critical' ? 'text-red-600' :
                        postExecutionData.riskLevel === 'high' ? 'text-orange-600' :
                          postExecutionData.riskLevel === 'low' ? 'text-amber-600' :
                            'text-stone-600'
                      }`} />
                    <div className="flex-1">
                      <p className={`font-semibold text-sm mb-1 ${postExecutionData.riskLevel === 'critical' ? 'text-red-900' :
                          postExecutionData.riskLevel === 'high' ? 'text-orange-900' :
                            postExecutionData.riskLevel === 'low' ? 'text-amber-900' :
                              'text-stone-900'
                        }`}>
                        {postExecutionData.riskDescription || 'Suspicious execution path detected'}
                      </p>
                      <p className="text-xs text-stone-700">
                        This risk was identified after execution based on monitored events and state changes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-green-900 mb-1">
                        No abnormal behavior detected
                      </p>
                      <p className="text-xs text-green-700">
                        All execution paths and state changes appear normal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Freeze Action */}
        {freezeAction?.isFrozen && (
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-red-900">Wallet Frozen</h2>
                <p className="text-xs text-red-700">Protective action executed</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-stone-700">Freeze Status</span>
                  <span className="text-sm font-bold text-red-700">Active</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-stone-600">Triggered By</span>
                  <span className="text-sm font-medium text-stone-900">{freezeAction.frozenBy}</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-stone-600">Trigger Time</span>
                  <span className="text-sm font-medium text-stone-900">{freezeAction.frozenAt}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-200">
                  <p className="text-sm font-semibold text-stone-900 mb-1">Reason</p>
                  <p className="text-sm text-stone-700">{freezeAction.freezeReason}</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-900">
                  <span className="font-semibold">Note:</span> This freeze was executed by a registered sentinel address
                  as a protective measure. This is informational only and does not require user action at this time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Context for 7702 */}
        {is7702 && (
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 mb-3">Understanding EIP-7702 Monitoring</h3>
            <div className="space-y-2 text-xs text-blue-800">
              <p>
                <span className="font-semibold">• Post-Execution Analysis:</span> Some risks can only be detected
                after transaction execution through event and state monitoring.
              </p>
              <p>
                <span className="font-semibold">• Continuous Monitoring:</span> Aegis continues to monitor
                delegated implementations even after successful execution.
              </p>
              <p>
                <span className="font-semibold">• Automated Protection:</span> Sentinel addresses can freeze
                wallets automatically when critical anomalies are detected.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Agent Chat Component */}
      {/* <AgentChat /> */}
    </div>
  );
}