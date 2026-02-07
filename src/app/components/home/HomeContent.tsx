import { useState } from 'react';
import { MessageCircle, Send, Plus, X } from 'lucide-react';
import { Token } from '../../../types';

export function HomeContent() {
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');

  const tokens: Token[] = [
    { symbol: 'TEST', amount: '1,250' },
    { symbol: 'AGI', amount: '320' },
    { symbol: 'USDC', amount: '500' }
  ];

  const handleAddToken = () => {
    // Token add logic would go here
    setTokenAddress('');
    setShowAddToken(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 flex flex-col relative">
      <div className="flex-1 px-6 md:px-12 py-8 md:py-12 max-w-4xl mx-auto w-full">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 md:p-8 text-white mb-6 shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">TEST 1,250</h2>
          <p className="text-sm opacity-90">Primary Balance</p>
        </div>

        {/* Token List */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-stone-200 mb-6">
          <h3 className="font-semibold text-sm md:text-base text-stone-900 mb-3">Tokens</h3>
          <div className="space-y-2">
            {tokens.map((token, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-b-0">
                <span className="text-sm md:text-base font-medium text-stone-900">{token.symbol}</span>
                <span className="text-sm md:text-base text-stone-600">{token.amount}</span>
              </div>
            ))}
          </div>
          <button 
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
        <div className="fixed inset-0 bg-stone-900/50 flex items-start justify-center z-50 px-8 pt-20">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg">
            <h3 className="font-semibold text-2xl text-stone-900 mb-8">Add Token</h3>
            <div className="mb-8">
              <label className="block text-sm font-medium text-stone-700 mb-2">Token Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full bg-stone-100 rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddToken(false)}
                className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToken}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
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