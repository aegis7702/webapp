import logoOrange from '../../../../public/aegis_logo_orange.png';

export function LaunchScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 px-8">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
        <img src={logoOrange} alt="logo" className="h-12" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Aegis Safeguard</h1>
      <p className="text-white/90 mb-12 text-center">EIP-7702 Security for Web3</p>
      <button
        onClick={onContinue}
        className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold hover:bg-stone-50 transition-colors shadow-lg"
      >
        Get Started
      </button>
    </div>
  );
}
