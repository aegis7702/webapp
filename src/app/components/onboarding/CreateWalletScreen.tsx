import { useMemo, useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Copy } from 'lucide-react';
import { generatePrivateKey } from '../../../utils/walletSession';
import { getAddressFromPrivateKey } from '../../../utils/walletUtils';
import logoWhite from '../../../../public/aegis_logo_white.png';

function maskPrivateKey(pk: string): string {
  const hex = pk.startsWith('0x') ? pk.slice(2) : pk;
  if (hex.length <= 8) return '0x****';
  return '0x' + hex.slice(0, 4) + '****...****' + hex.slice(-4);
}

export function CreateWalletScreen({
  onComplete,
  onBack,
}: {
  onComplete: (privateKey: string) => void;
  onBack: () => void;
}) {
  const privateKey = useMemo(() => generatePrivateKey(), []);
  const [pkRevealed, setPkRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const address = getAddressFromPrivateKey(privateKey);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
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
          <img src={logoWhite} alt="logo" className="h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Create New Wallet</h2>
        <p className="text-sm text-stone-600 mb-8 text-center">A new wallet will be generated for you</p>
        
        <div className="bg-white rounded-2xl p-6 mb-6 border border-stone-200">
          <p className="text-sm text-stone-700 mb-4">
            Your wallet is being created with secure encryption. Set a password in the next step to protect it.
          </p>
          {address && (
            <div className="bg-stone-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-medium text-stone-500 mb-1">Wallet Address</p>
              <p className="text-xs text-stone-700 font-mono break-all">{address}</p>
            </div>
          )}
          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-medium text-stone-500">Private Key</p>
              {pkRevealed && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPkRevealed((v) => !v)}
              className="w-full flex items-start justify-between gap-2 text-left font-mono text-xs text-stone-700 hover:bg-stone-100 rounded p-2 -m-2 transition-colors"
            >
              <span
                className={`min-w-0 ${pkRevealed ? 'break-all whitespace-pre-wrap' : 'truncate'}`}
              >
                {pkRevealed ? privateKey : maskPrivateKey(privateKey)}
              </span>
              <span className="flex-shrink-0 text-stone-500 mt-0.5" aria-hidden>
                {pkRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </span>
            </button>
            <p className="text-xs text-stone-500 mt-2">
              {pkRevealed ? 'Click to hide' : 'Click to reveal'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onComplete(privateKey)}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
