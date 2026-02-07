import { useState } from 'react';
import { Shield } from 'lucide-react';
import { verifyPassword } from '../../../utils/walletSession';
import { setLoginPasswordInMemory } from '../../../utils/authMemory';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const ok = await verifyPassword(password);
    if (ok) {
      setLoginPasswordInMemory(password);
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 px-8 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-md">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">Welcome Back</h2>
        <p className="text-sm text-stone-600 mb-8 text-center">Enter your password to continue</p>
        
        {error && (
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        )}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="w-full bg-white rounded-lg px-4 py-3 text-sm text-stone-800 outline-none border border-stone-200"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={!password}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Login
        </button>
      </div>
    </div>
  );
}
