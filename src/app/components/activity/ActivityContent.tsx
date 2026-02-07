import { useState } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { AgentChat } from '../aegis/AgentChat';
import { TransactionDetailPage } from './TransactionDetailPage';
import { Transaction } from '../../../types';

// Utility function to format time with relative time if within 10 minutes
const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  
  // Format: YYYY-MM-DD HH:MM:SS
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
  // If within 10 minutes, append relative time
  if (diffInMinutes < 10) {
    if (diffInMinutes === 0) {
      return `${formattedTime} (just now)`;
    } else if (diffInMinutes === 1) {
      return `${formattedTime} (1 minute ago)`;
    } else {
      return `${formattedTime} (${diffInMinutes} minutes ago)`;
    }
  }
  
  return formattedTime;
};

export function ActivityContent() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showMonitoringBanner, setShowMonitoringBanner] = useState(true);

  // Mock transaction data with EIP-7702 scenarios
  const now = new Date();
  const transactions: Transaction[] = [
    {
      id: '1',
      action: 'Batch Execute',
      time: formatTime(new Date(now.getTime() - 3 * 60 * 1000)), // 3 minutes ago
      amount: '0.05',
      tokenSymbol: 'ETH',
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      type: 'eip7702',
      status: 'success',
      is7702: true,
      implementationName: 'ModuleC7702',
      delegatedExecution: true,
      monitoringStatus: 'anomaly-detected',
      hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      executionPath: 'batchExecute() → maliciousPath()',
      postExecutionData: {
        eventsMonitored: [
          'ExecutionStarted(0x742d35...)',
          'MaliciousPathCalled(0x742d35...)',
          'WalletLockInitiated(0x742d35...)'
        ],
        stateChanges: [
          'Wallet state changed to LOCKED',
          'Emergency mode activated',
          'All outgoing transactions blocked'
        ],
        anomalyDetected: true,
        riskLevel: 'critical',
        riskDescription: 'Potential DoS risk detected'
      },
      freezeAction: {
        isFrozen: true,
        freezeReason: 'Malicious execution path detected',
        frozenBy: 'Sentinel (0x8f3Cf...)',
        frozenAt: '3 minutes ago'
      }
    },
    {
      id: '2',
      action: 'Delegated Transfer',
      time: formatTime(new Date(now.getTime() - 15 * 60 * 1000)), // 15 minutes ago
      amount: '120',
      tokenSymbol: 'USDC',
      to: '0x1234567890abcdef1234567890abcdef12345678',
      type: 'eip7702',
      status: 'success',
      is7702: true,
      implementationName: 'ModuleC7702',
      delegatedExecution: true,
      monitoringStatus: 'monitored',
      hash: '0x9a3f85Dc7734B1623826e4b844Bc9e7595f1cFd2',
      executionPath: 'transfer() → normalPath()',
      postExecutionData: {
        eventsMonitored: [
          'ExecutionStarted(0x9a3f85...)',
          'Transfer(from: 0x9a3f85..., to: 0x1234..., value: 120)',
          'ExecutionCompleted(0x9a3f85...)'
        ],
        stateChanges: [
          'Balance updated: -120 USDC',
          'Nonce incremented: 45 → 46'
        ],
        anomalyDetected: false,
        riskLevel: 'none'
      }
    },
    {
      id: '3',
      action: 'Send',
      time: formatTime(new Date(now.getTime() - 60 * 60 * 1000)), // 1 hour ago
      amount: '0.5',
      tokenSymbol: 'ETH',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      type: 'send',
      status: 'failed'
    },
    {
      id: '4',
      action: 'Receive',
      time: formatTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)), // 3 hours ago
      amount: '500',
      tokenSymbol: 'USDC',
      to: '0x0000000000000000000000000000000000000000', // Self
      type: 'receive',
      status: 'success'
    },
    {
      id: '5',
      action: 'Swap',
      time: formatTime(new Date(now.getTime() - 24 * 60 * 60 * 1000)), // 1 day ago
      amount: '0.4 ETH → 1,000 USDC',
      tokenSymbol: 'ETH',
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router
      type: 'swap',
      status: 'pending'
    },
  ];

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  if (selectedTransaction) {
    return (
      <TransactionDetailPage 
        transaction={selectedTransaction} 
        onBack={() => setSelectedTransaction(null)} 
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 relative">
      <div className="px-6 md:px-12 py-8 md:py-12 max-w-4xl mx-auto w-full">
        <h2 className="text-xl font-bold mb-6 text-stone-900">Transaction History</h2>

        {/* Dismissible Monitoring Banner */}
        {showMonitoringBanner && (
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 relative">
            <button
              onClick={() => setShowMonitoringBanner(false)}
              className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pr-8">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">
                EIP-7702 Transaction Monitoring
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Aegis continuously monitors delegated implementations even after execution. 
                Some risks can only be detected through post-execution event and state analysis. 
                Tap any transaction to view detailed monitoring results.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {transactions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTransactionClick(item)}
              className="w-full bg-white border border-stone-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left relative"
            >
              {/* Top Row: Type Tag + Action (Left) | Status (Right) */}
              <div className="flex items-start justify-between mb-3">
                {/* Left: Type Tag + Action */}
                <div className="flex items-center gap-2">
                  {/* Transaction Type Tag */}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    item.is7702 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    {item.is7702 ? '7702' : 'EOA'}
                  </span>
                  
                  {/* Action Summary */}
                  <p className="font-medium text-sm text-stone-900">{item.action}</p>
                </div>

                {/* Right: Status (Text Only) */}
                <span className={`text-xs font-semibold ${
                  item.status === 'success' ? 'text-green-600' :
                  item.status === 'failed' ? 'text-red-600' :
                  'text-stone-500'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex items-start justify-between mb-3">
                {/* Left: Address + Timestamp */}
                <div className="flex-1">
                  {/* Target Address */}
                  {item.to && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-stone-500">To:</span>
                      <span className="text-xs font-mono text-stone-700">
                        {item.to.slice(0, 6)}...{item.to.slice(-4)}
                      </span>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="text-xs text-stone-500">
                    {item.time}
                  </div>
                </div>

                {/* Right: Token Amount */}
                <div className="text-right ml-4">
                  <span className="text-sm font-semibold text-stone-800">
                    {item.type === 'swap' ? item.amount : `${item.amount} ${item.tokenSymbol}`}
                  </span>
                </div>
              </div>

              {/* 7702 Monitoring Status - Bottom Row */}
              {item.is7702 && item.monitoringStatus && (
                <div className="pt-3 border-t border-stone-200">
                  {item.monitoringStatus === 'monitored' && (
                    <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-1">
                      <span className="text-xs font-medium text-green-900">
                        Monitored
                      </span>
                    </div>
                  )}
                  
                  {item.monitoringStatus === 'anomaly-detected' && (
                    <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span className="text-xs font-semibold text-red-900">
                        Anomaly Detected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Chat Component */}
      {/* <AgentChat /> */}
    </div>
  );
}