import { Shield } from 'lucide-react';

export function CreateWalletScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-stone-50 px-8 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-md">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Create New Wallet</h2>
        <p className="text-sm text-stone-600 mb-8 text-center">A new wallet will be generated for you</p>
        
        <div className="bg-white rounded-2xl p-6 mb-6 border border-stone-200">
          <p className="text-sm text-stone-700 mb-4">
            Your wallet is being created with secure encryption. Make sure to back up your recovery phrase in the next step.
          </p>
          <div className="bg-stone-50 rounded-lg p-4">
            <p className="text-xs text-stone-600 font-mono">
              Wallet Address: 0x742d...35Bd
            </p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
