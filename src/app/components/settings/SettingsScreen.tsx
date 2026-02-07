import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { DEFAULT_NETWORKS } from '../../../config/netwotk';
import { getSavedNetworks } from '../../../utils/networkSession';
import {
  getSelectedNetwork,
  setSelectedNetwork as persistSelectedNetwork,
} from '../../../utils/tokenSession';
import { getWalletSession } from '../../../utils/walletSession';
import { formatShortAddress } from '../../../utils/walletUtils';
import { ApiKeyManagementScreen } from './ApiKeyManagementScreen';
import { AddNetworkScreen } from './AddNetworkScreen';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const session = getWalletSession();
  const displayAddress = session?.address ? formatShortAddress(session.address) : '—';
  const [freezeUsage, setFreezeUsage] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showApiKeyManagement, setShowApiKeyManagement] = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const savedNetworks = getSavedNetworks();
  const networks = [...DEFAULT_NETWORKS, ...savedNetworks];
  const [selectedNetwork, setSelectedNetwork] = useState(
    () => getSelectedNetwork()?.name ?? DEFAULT_NETWORKS[0]?.name ?? ''
  );

  if (showApiKeyManagement) {
    return <ApiKeyManagementScreen onBack={() => setShowApiKeyManagement(false)} />;
  }

  if (showAddNetwork) {
    return <AddNetworkScreen onBack={() => setShowAddNetwork(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Settings</h1>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
        >
          <X className="w-5 h-5 text-stone-600" />
        </button>
      </div>

      {/* Advanced Mode Indicator */}
      {/* {advancedMode && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
          <p className="text-xs font-semibold text-orange-800">Advanced Mode Active</p>
        </div>
      )} */}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Account Section */}
          <div className="mt-6">
            <h2 className="px-6 text-xs font-semibold text-stone-500 uppercase mb-2">Account</h2>
            <div className="bg-white border-y border-stone-200">
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-stone-900 mb-1">My Wallet</p>
                <p className="text-xs text-stone-500 font-mono">{displayAddress}</p>
              </div>
            </div>
          </div>

          {/* Agent Section */}
          <div className="mt-8">
            <h2 className="px-6 text-xs font-semibold text-stone-500 uppercase mb-2">Agent</h2>
            <div className="bg-white border-y border-stone-200 divide-y divide-stone-200">
              {/* GPT Usage Toggle */}
              {/* Advanced Mode Toggle */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-stone-900">Freeze Usage</p>
                  <button
                    onClick={() => setFreezeUsage(!freezeUsage)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${freezeUsage ? 'bg-orange-500' : 'bg-stone-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${freezeUsage ? 'right-0.5' : 'left-0.5'
                        }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-stone-500">
                Temporarily lock the account to stop all activity when a risk is detected.
                </p>
              </div>

              {/* Advanced Mode Toggle */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-stone-900">Advanced Mode</p>
                  <button
                    onClick={() => setAdvancedMode(!advancedMode)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${advancedMode ? 'bg-orange-500' : 'bg-stone-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${advancedMode ? 'right-0.5' : 'left-0.5'
                        }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-stone-500">
                  Enable advanced security analysis and deeper AI reasoning.
                </p>
              </div>

              {/* API Key Management */}
              {/* <button
                onClick={() => setShowApiKeyManagement(true)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <p className="text-sm font-medium text-stone-900">API Key Management</p>
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </button> */}
            </div>
          </div>

          {/* Network Section */}
          <div className="mt-8">
            <h2 className="px-6 text-xs font-semibold text-stone-500 uppercase mb-2">Network</h2>
            <div className="bg-white border-y border-stone-200 divide-y divide-stone-200">
              {networks.map((network) => (
                <button
                  key={`${network.chainId}-${network.name}`}
                  type="button"
                  onClick={() => {
                    persistSelectedNetwork(network);
                    setSelectedNetwork(network.name);
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <p className="text-sm font-medium text-stone-900">{network.name}</p>
                  {selectedNetwork === network.name && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowAddNetwork(true)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <p className="text-sm font-medium text-orange-600">Add Network</p>
                <ChevronRight className="w-5 h-5 text-orange-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
