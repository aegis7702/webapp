import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export function ApiKeyManagementScreen({ onBack }: { onBack: () => void }) {
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 px-6 py-4 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-stone-600 rotate-180" />
        </button>
        <h1 className="text-lg font-semibold text-stone-900">API Key Management</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
            <p className="text-xs text-stone-500 mt-2">
              Your API key is stored securely and only used for AI agent features.
            </p>
          </div>

          <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
            Save API Key
          </button>
        </div>
      </div>
    </div>
  );
}
