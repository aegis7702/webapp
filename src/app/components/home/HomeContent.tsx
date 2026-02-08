import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Plus, X } from 'lucide-react';
import { AegisSetup } from './AegisSetup';
import { Token } from '../../../types';
import { DEFAULT_NETWORKS, DEFAULT_TOKENS_BY_CHAIN } from '../../../config/netwotk';
import { getWalletSession } from '../../../utils/walletSession';
import {
  getSelectedNetwork,
  getSavedTokens,
  addSavedToken,
} from '../../../utils/tokenSession';
import { useAppData } from '../../contexts/AppDataContext';

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
  const { home } = useAppData();
  const { ethBalance, tokenBalances, refetchBalances, fetchTokenSymbolNameAndAccountCode } = home;

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [symbolFetched, setSymbolFetched] = useState(false);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [addError, setAddError] = useState('');

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

  const handleFetchSymbol = async () => {
    if (!tokenAddress.trim() || !network?.rpcUrl) return;
    setSymbolLoading(true);
    setAddError('');
    setSymbolFetched(false);
    try {
      const { symbol } = await fetchTokenSymbolNameAndAccountCode(tokenAddress.trim(), '', network.rpcUrl);
      if (symbol) {
        setTokenSymbol(symbol);
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
    refetchBalances();
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

        <AegisSetup />

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

      {/* Add Token Modal - full screen */}
      {showAddToken && (
        <div className="fixed inset-0 z-50 bg-stone-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-200 shrink-0">
            <h3 className="font-semibold text-xl text-stone-900">Add Token</h3>
            <button
              type="button"
              onClick={() => {
                setShowAddToken(false);
                setAddError('');
              }}
              className="px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
            <button
              type="button"
              onClick={handleAddToken}
              disabled={!symbolFetched || !tokenSymbol.trim()}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}