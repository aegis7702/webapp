import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { DEFAULT_NETWORKS } from '../../../config/netwotk';
import { getSavedNetworks } from '../../../utils/networkSession';
import { getSelectedNetwork, setSelectedNetwork as persistSelectedNetwork } from '../../../utils/tokenSession';
import { NetworkSelector } from './NetworkSelector';

export function AegisSearchArea({
  onSearch,
}: {
  onSearch: (network: string, address: string) => void | Promise<void>;
}) {
  const networkList = [...DEFAULT_NETWORKS, ...getSavedNetworks()];
  const networkNames = networkList.map((n) => n.name);
  const sessionNetwork = getSelectedNetwork();
  const [selectedNetwork, setSelectedNetwork] = useState(
    () => sessionNetwork?.name ?? networkNames[0] ?? ''
  );
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleNetworkChange = (name: string) => {
    setSelectedNetwork(name);
    const net = networkList.find((n) => n.name === name);
    if (net) persistSelectedNetwork(net);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await onSearch(selectedNetwork, searchAddress);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      {/* Search Controls - Responsive Layout */}
      <div className="flex flex-col md:flex-row gap-3 mb-3">
        {/* Network Selector - Custom UI */}
        <NetworkSelector
          value={selectedNetwork}
          onChange={handleNetworkChange}
          networks={networkNames}
        />

        {/* Search Input */}
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Contract address (0x...)"
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none hover:border-stone-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
        />

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Context Indicator */}
      {searchAddress && (
        <p className="text-xs text-stone-500 mb-2">
          Searching for implementation on <span className="font-semibold text-stone-700">{selectedNetwork}</span>
        </p>
      )}
    </div>
  );
}