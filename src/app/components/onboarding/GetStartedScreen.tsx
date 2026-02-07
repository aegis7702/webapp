import { Shield } from 'lucide-react';

export function GetStartedScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 px-8">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
        <Shield className="w-12 h-12 text-orange-500" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">Aegis Safeguard</h1>
      <p className="text-white/90 mb-12 text-center max-w-md">
        EIP-7702 Security for Web3. Protect your wallet with advanced security monitoring.
      </p>
      <button
        onClick={onContinue}
        className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold hover:bg-stone-50 transition-colors shadow-lg"
      >
        Get Started
      </button>
    </div>
  );
}
