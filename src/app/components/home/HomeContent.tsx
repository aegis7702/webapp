import { useState, useEffect } from 'react';
import { MessageCircle, Send, Plus, X } from 'lucide-react';
import { DEFAULT_NETWORKS, DEFAULT_TOKENS_BY_CHAIN } from '../../../config/netwotk';
import { getWalletSession } from '../../../utils/walletSession';
import {
  getSelectedNetwork,
  getSavedTokens,
  addSavedToken,
  fetchTokenSymbol,
  fetchBalances,
} from '../../../utils/tokenSession';

const MOBILE_BREAKPOINT = 640;

/** On mobile: show balance with 0~4 decimal places. */
function formatBalanceForDisplay(raw: string, isMobile: boolean): string {
  if (!isMobile) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return '0';
  const dot = trimmed.indexOf('.');
  if (dot === -1) return trimmed;
  const intPart = trimmed.slice(0, dot) || '0';
  const decPart = trimmed.slice(dot + 1).slice(0, 4).replace(/0+$/, '');
  return decPart ? `${intPart}.${decPart}` : intPart;
}

export function HomeContent() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [symbolFetched, setSymbolFetched] = useState(false);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalances, setTokenBalances] = useState<{ address: string; symbol: string; balance: string }[]>([]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
  const chainId = network?.chainId ?? '';
  const defaultTokens = DEFAULT_TOKENS_BY_CHAIN[chainId] ?? [];
  const savedTokens = getSavedTokens(chainId);
  const allTokens = [
    ...defaultTokens.map((t) => ({ symbol: t.symbol, name: t.name, address: t.address })),
    ...savedTokens.map((t) => ({ symbol: t.symbol, name: t.name, address: t.address })),
  ];

  const walletAddress = getWalletSession()?.address ?? '';

  useEffect(() => {
    if (!network?.rpcUrl || !walletAddress) {
      setEthBalance('0');
      setTokenBalances([]);
      return;
    }
    let cancelled = false;
    fetchBalances(
      network.rpcUrl,
      walletAddress,
      allTokens.map((t) => ({ address: t.address, symbol: t.symbol }))
    ).then(({ ethBalance: eth, tokenBalances: tb }) => {
      if (!cancelled) {
        setEthBalance(eth);
        setTokenBalances(tb.map((b) => ({ address: b.address, symbol: b.symbol, balance: b.balance })));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [network?.rpcUrl, walletAddress, allTokens.length, allTokens.map((t) => t.address).join(',')]);

  const handleFetchSymbol = async () => {
    if (!tokenAddress.trim() || !network?.rpcUrl) return;
    setSymbolLoading(true);
    setAddError('');
    setSymbolFetched(false);
    try {
      const sym = await fetchTokenSymbol(tokenAddress.trim(), network.rpcUrl);
      if (sym) {
        setTokenSymbol(sym);
        setSymbolFetched(true);
      } else {
        setAddError('Could not fetch symbol');
      }
    } finally {
      setSymbolLoading(false);
    }
  };

  const handleAddToken = () => {
    if (!symbolFetched || !tokenSymbol.trim()) return;
    setAddError('');
    const addr = tokenAddress.trim();
    const alreadyExists = allTokens.some(
      (t) => t.address.toLowerCase() === addr.toLowerCase()
    );
    if (alreadyExists) {
      setAddError('Already registered');
      return;
    }
    addSavedToken(chainId, { symbol: tokenSymbol.trim(), address: addr });
    setTokenAddress('');
    setTokenSymbol('');
    setSymbolFetched(false);
    setShowAddToken(false);
  };

  const getBalance = (address: string) =>
    tokenBalances.find((b) => b.address.toLowerCase() === address.toLowerCase())?.balance ?? '0';

  const displayEthBalance = formatBalanceForDisplay(ethBalance, isMobile);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 flex flex-col relative">
      <div className="flex-1 px-6 md:px-12 py-8 md:py-12 max-w-4xl mx-auto w-full">
        {/* Wallet Balance - ETH (decimal 18) */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 md:p-8 text-white mb-6 shadow-md min-w-0 overflow-hidden">
          <p className="text-sm opacity-90 mb-1 truncate">{network?.name ?? 'Network'}</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold break-all min-w-0">
            {displayEthBalance} <span className="font-semibold opacity-95">ETH</span>
          </h2>
        </div>

        {/* Token List - decimals + balance from batch */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-stone-200 mb-6">
          <h3 className="font-semibold text-sm md:text-base text-stone-900 mb-3">
            Tokens
          </h3>
          <div className="space-y-2">
            {allTokens.length === 0 ? (
              <p className="text-sm text-stone-500 py-4">No tokens. Add a token below.</p>
            ) : (
              allTokens.map((t) => (
                <div
                  key={t.address}
                  className="flex items-center justify-between py-2 border-b border-stone-100 last:border-b-0"
                >
                  <span className="text-sm md:text-base font-medium text-stone-900">
                    {t.symbol}
                  </span>
                  <span className="text-sm md:text-base text-stone-600">
                    {formatBalanceForDisplay(getBalance(t.address), isMobile)}
                  </span>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAddToken(true)}
            className="w-full mt-3 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Token
          </button>
        </div>
      </div>

      {/* AI Assistant Floating Button */}
      {!showAiAssistant && (
        <button
          onClick={() => setShowAiAssistant(true)}
          className="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* AI Chat Interface - Expanded */}
      {showAiAssistant && (
        <div className="fixed bottom-24 right-8 left-8 md:left-auto md:w-96 bg-white border border-stone-200 rounded-2xl p-4 shadow-lg z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-stone-900">Aegis Assistant</h3>
            </div>
            <button onClick={() => setShowAiAssistant(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-stone-50 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-stone-600">
              Ask Aegis about your wallet safety, risks, or recent actions…
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-1 bg-stone-100 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none border border-stone-200"
            />
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Token Modal */}
      {showAddToken && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-start justify-center z-50 px-4 sm:px-8 pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg min-w-0 my-4">
            <h3 className="font-semibold text-2xl text-stone-900 mb-6">Add Token</h3>
            {addError && <p className="text-sm text-red-600 mb-4">{addError}</p>}
            <div className="space-y-4 mb-6">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-stone-700 mb-2">Token Address</label>
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => {
                      setTokenAddress(e.target.value);
                      setTokenSymbol('');
                      setSymbolFetched(false);
                      setAddError('');
                    }}
                    placeholder="0x..."
                    className="min-w-0 flex-1 bg-stone-100 rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSymbol}
                    disabled={!tokenAddress.trim() || !network?.rpcUrl || symbolLoading}
                    className="shrink-0 px-4 py-3 rounded-lg bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {symbolLoading ? '...' : 'Get Symbol'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Token Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  readOnly
                  placeholder="Click Get Symbol to fetch"
                  className="w-full bg-stone-100 rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddToken(false);
                  setAddError('');
                }}
                className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToken}
                disabled={!symbolFetched || !tokenSymbol.trim()}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}