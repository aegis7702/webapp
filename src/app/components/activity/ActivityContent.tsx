import React, { useState, useMemo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { TransactionDetailPage } from './TransactionDetailPage';
import { Transaction } from '../../../types';
import { type RecentTxWithNote } from '../../../utils/activitySession';
import { useAppData } from '../../contexts/AppDataContext';

/** Format time from Unix seconds (bigint or number). */
function formatTimeFromUnix(unixSeconds: bigint | number): string {
  const ms = Number(unixSeconds) * 1000;
  const timestamp = new Date(ms);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  if (diffInMinutes < 10) {
    if (diffInMinutes === 0) return `${formattedTime} (just now)`;
    if (diffInMinutes === 1) return `${formattedTime} (1 minute ago)`;
    return `${formattedTime} (${diffInMinutes} minutes ago)`;
  }
  return formattedTime;
}

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

/** Map API result to Transaction. When isFrozen, the most recent tx (index 0) gets freezeAction. */
function mapToTransaction(
  item: RecentTxWithNote,
  index: number,
  isFrozen: boolean,
  freezeReason: string | null
): Transaction {
  const txHash = item.txHash.startsWith('0x') ? item.txHash : '0x' + item.txHash;
  const note = item.note;
  const updatedAt = note?.updatedAt ?? 0n;
  const timeStr =
    updatedAt > 0n
      ? formatTimeFromUnix(updatedAt)
      : formatTime(new Date());
  const isMostRecent = index === 0;
  const showFrozen = isFrozen && isMostRecent && freezeReason != null && freezeReason !== '';
  return {
    id: txHash,
    action: note?.name?.trim() || 'Transaction',
    time: timeStr,
    amount: note?.summary?.trim() || '—',
    type: 'eip7702',
    status: 'success',
    is7702: true,
    implementationName: note?.name?.trim() || undefined,
    delegatedExecution: true,
    monitoringStatus: showFrozen ? 'anomaly-detected' : 'monitored',
    hash: txHash,
    executionPath: note?.reasons?.trim() || undefined,
    postExecutionData: note
      ? {
          eventsMonitored: [],
          stateChanges: note.description?.trim() ? [note.description.trim()] : [],
          anomalyDetected: showFrozen,
          riskLevel: showFrozen ? 'critical' : 'none',
          riskDescription: showFrozen ? freezeReason ?? undefined : undefined,
        }
      : undefined,
    ...(showFrozen &&
      freezeReason && {
        freezeAction: {
          isFrozen: true,
          freezeReason,
          frozenBy: 'Sentinel (this transaction)',
          frozenAt: 'Due to this transaction',
        },
      }),
  };
}

export function ActivityContent() {
  const { activity } = useAppData();
  const { txs, isFrozen, freezeReason, loading } = activity;

  const transactions = useMemo(
    () => txs.map((item, index) => mapToTransaction(item, index, isFrozen, freezeReason)),
    [txs, isFrozen, freezeReason]
  );

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showMonitoringBanner, setShowMonitoringBanner] = useState(true);

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

        {/* Frozen banner: most recent tx caused freeze */}
        {transactions.length > 0 && transactions[0]?.freezeAction?.isFrozen && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-red-900">Wallet frozen</h3>
                <p className="text-xs text-red-800 mt-1">
                  Frozen due to the most recent transaction. {transactions[0].freezeAction.freezeReason}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-stone-500">Loading transactions…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-stone-200">
            <p className="text-sm text-stone-500">No transactions yet</p>
            <p className="text-xs text-stone-400 mt-1">Activity will appear here when you use Aegis.</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Agent Chat Component */}
      {/* <AgentChat /> */}
    </div>
  );
}