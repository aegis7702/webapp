import { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

export function PasswordSetupScreen({
  onComplete,
  onBack,
  isImportFlow,
}: {
  onComplete: (password: string) => void;
  onBack: () => void;
  isImportFlow?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    onComplete(password);
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
        <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Set Your Password</h2>
        
        {/* Purpose Explanation */}
        <div className="mb-8">
          <p className="text-sm text-stone-600 text-center leading-relaxed">
            {isImportFlow
              ? 'Set a password to protect your imported wallet on this device. You will use this to log in to Aegis.'
              : 'This password protects access to your wallet on this device. It is required every time you log in to Aegis.'}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        )}
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
            />
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          Confirm Password
        </button>
      </div>
    </div>
  );
}
