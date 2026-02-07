import { useState } from 'react';
import { Search } from 'lucide-react';

export function AegisSearchArea({ onSearch }: { onSearch: (network: string, address: string) => void }) {
  const [selectedNetwork, setSelectedNetwork] = useState('Ethereum');
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'];

  const handleSearch = () => {
    setIsSearching(true);
    onSearch(selectedNetwork, searchAddress);
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 1000);
  };

  return (
    <div>
      <div className="flex gap-3 mb-3">
        {/* Network Selector */}
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 outline-none min-w-[140px]"
        >
          {networks.map((network) => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
        </select>

        {/* Search Input */}
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="Contract address"
          className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none"
        />

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Search Status */}
      {isSearching && (
        <p className="text-xs text-stone-500">Searching...</p>
      )}
    </div>
  );
}