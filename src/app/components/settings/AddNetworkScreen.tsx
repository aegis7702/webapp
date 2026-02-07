import { useState } from 'react';
import { ChevronRight, Check, AlertCircle } from 'lucide-react';
import { addSavedNetwork, fetchChainIdFromRpc } from '../../../utils/networkSession';

export function AddNetworkScreen({ onBack }: { onBack: () => void }) {
  const [networkName, setNetworkName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [chainId, setChainId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [blockExplorer, setBlockExplorer] = useState('');
  const [error, setError] = useState('');
  const [fetchedChainId, setFetchedChainId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchChainId = async () => {
    const url = rpcUrl.trim();
    if (!url) return;
    setFetching(true);
    setFetchedChainId(null);
    try {
      const id = await fetchChainIdFromRpc(url);
      setFetchedChainId(id);
      if (id) setChainId(id);
    } finally {
      setFetching(false);
    }
  };

  const chainIdMatch =
    fetchedChainId != null && chainId.trim() !== '' && String(chainId.trim()) === String(fetchedChainId);
  const chainIdMismatch =
    fetchedChainId != null && chainId.trim() !== '' && String(chainId.trim()) !== String(fetchedChainId);

  const handleAdd = () => {
    setError('');
    const name = networkName.trim();
    const url = rpcUrl.trim();
    const id = chainId.trim();
    if (!name || !url || !id) {
      setError('Network name, RPC URL and Chain ID are required');
      return;
    }
    if (fetchedChainId != null && String(id) !== String(fetchedChainId)) {
      setError('Chain ID must match the value from RPC. Fetch again or fix the Chain ID.');
      return;
    }
    addSavedNetwork({
      name,
      rpcUrl: url,
      chainId: fetchedChainId ?? id,
      symbol: symbol.trim() || 'ETH',
      blockExplorer: blockExplorer.trim() || undefined,
    });
    onBack();
  };

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 px-6 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-stone-600 rotate-180" />
        </button>
        <h1 className="text-lg font-semibold text-stone-900">Add Network</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Network Name</label>
            <input
              type="text"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">RPC URL</label>
            <input
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Chain ID</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                placeholder="Fetched from RPC or enter manually"
                className="flex-1 bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
              />
              <button
                type="button"
                onClick={fetchChainId}
                disabled={!rpcUrl.trim() || fetching}
                className="shrink-0 px-4 py-3 rounded-lg bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300 disabled:opacity-50"
              >
                {fetching ? '...' : 'Fetch'}
              </button>
              {chainIdMatch && (
                <span className="shrink-0 text-green-600" title="Chain ID matches RPC">
                  <Check className="w-5 h-5" />
                </span>
              )}
              {chainIdMismatch && (
                <span className="shrink-0 text-amber-600" title="Chain ID differs from RPC">
                  <AlertCircle className="w-5 h-5" />
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Symbol <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="ETH"
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
            <p className="text-xs text-stone-500 mt-1">Leave empty to use ETH</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Block Explorer <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={blockExplorer}
              onChange={(e) => setBlockExplorer(e.target.value)}
              placeholder="https://sepolia.etherscan.io"
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!!(fetchedChainId != null && chainIdMismatch)}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Network
          </button>
        </div>
      </div>
    </div>
  );
}
