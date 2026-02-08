import logoWhite from '../../../../public/aegis_logo_white.png';

export function WalletSetupScreen({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-stone-50 px-8 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-md">
          <img src={logoWhite} alt="logo" className="h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Wallet Setup</h2>
        <p className="text-sm text-stone-600 mb-8 text-center">Choose how to set up your wallet</p>
        
        <div className="space-y-4">
          <button
            onClick={onCreate}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Create New Wallet
          </button>
          <button
            onClick={onImport}
            className="w-full bg-white border border-stone-300 text-stone-800 py-4 rounded-2xl font-semibold hover:bg-stone-50 transition-colors shadow-sm"
          >
            Import Existing Wallet
          </button>
        </div>

        <p className="text-xs text-stone-500 mt-6 text-center">
          Your wallet will be secured with EIP-7702 protection
        </p>
      </div>
    </div>
  );
}
