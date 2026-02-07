import { useState } from 'react';
import { Shield } from 'lucide-react';

export function ImportKeyScreen({ onComplete }: { onComplete: () => void }) {
  const [privateKey, setPrivateKey] = useState('');

  return (
    <div className="flex flex-col h-screen bg-stone-50 px-8 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-md">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Import Existing Wallet</h2>
        <p className="text-sm text-stone-600 mb-8 text-center">Enter your private key to import your wallet</p>
        
        {/* Security Warning */}
        <div className="mb-6 pb-6 border-b border-stone-200">
          <p className="text-sm text-stone-700 text-center leading-relaxed">
            Never share your private key.<br />
            Anyone with access to it can fully control your assets.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Private Key</label>
          <textarea
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            rows={4}
            className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200 resize-none font-mono"
          />
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          Import Wallet
        </button>

        <p className="text-xs text-stone-500 mt-6 text-center">
          Your private key is stored securely and never shared
        </p>
      </div>
    </div>
  );
}
