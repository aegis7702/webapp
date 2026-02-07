import { useState, useMemo } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { getAddressFromPrivateKey, validatePrivateKey } from '../../../utils/walletUtils';

export function ImportKeyScreen({
  onComplete,
  onBack,
}: {
  onComplete: (privateKey: string) => void;
  onBack: () => void;
}) {
  const [privateKey, setPrivateKey] = useState('');

  const validation = useMemo(() => validatePrivateKey(privateKey), [privateKey]);
  const address = useMemo(
    () => (validation.valid ? getAddressFromPrivateKey(privateKey.trim()) : null),
    [privateKey, validation.valid]
  );

  const handleComplete = () => {
    const trimmed = privateKey.trim();
    if (trimmed && validation.valid) onComplete(trimmed);
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 px-8 py-12">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-4 -mt-2 self-start"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>
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

        {address && (
          <div className="mb-4 p-3 bg-stone-100 rounded-lg">
            <p className="text-xs font-medium text-stone-500 mb-1">Wallet Address</p>
            <p className="text-sm font-mono text-stone-800 break-all">{address}</p>
          </div>
        )}
        {privateKey.trim() && !validation.valid && validation.error && (
          <p className="text-sm text-red-600 mb-4">{validation.error}</p>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Private Key</label>
          <textarea
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            rows={4}
            className={`w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border resize-none font-mono ${
              privateKey.trim() && !validation.valid
                ? 'border-red-400 focus:border-red-500'
                : 'border-stone-200'
            }`}
          />
        </div>

        <button
          onClick={handleComplete}
          disabled={!privateKey.trim() || !validation.valid}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
