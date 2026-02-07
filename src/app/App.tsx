import { useState } from 'react';
import { TabType, AppScreen } from '../types';
import { TopBarWithSettings } from './components/navigation/TopBar';
import { BottomNav } from './components/navigation/BottomNav';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { LaunchScreen } from './components/onboarding/LaunchScreen';
import { WalletSetupScreen } from './components/onboarding/WalletSetupScreen';
import { CreateWalletScreen } from './components/onboarding/CreateWalletScreen';
import { ImportKeyScreen } from './components/onboarding/ImportKeyScreen';
import { PasswordSetupScreen } from './components/onboarding/PasswordSetupScreen';
import { ProtectionConfirmationScreen } from './components/onboarding/ProtectionConfirmationScreen';
import { LoginScreen } from './components/onboarding/LoginScreen';
import { HomeContent } from './components/home/HomeContent';
import { AegisContent } from './components/aegis/AegisContent';
import { AgentContent } from './components/agent/AgentContent';
import { ActivityContent } from './components/activity/ActivityContent';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [appScreen, setAppScreen] = useState<AppScreen>('launch');
  const [showSettings, setShowSettings] = useState(false);

  // Entry flow screens
  if (appScreen === 'launch') {
    return <LaunchScreen onContinue={() => setAppScreen('wallet-setup')} />;
  }

  if (appScreen === 'wallet-setup') {
    return (
      <WalletSetupScreen
        onCreate={() => setAppScreen('create-wallet')}
        onImport={() => setAppScreen('import-key')}
      />
    );
  }

  if (appScreen === 'create-wallet') {
    return <CreateWalletScreen onComplete={() => setAppScreen('password-setup')} />;
  }

  if (appScreen === 'import-key') {
    return <ImportKeyScreen onComplete={() => setAppScreen('password-setup')} />;
  }

  if (appScreen === 'password-setup') {
    return <PasswordSetupScreen onComplete={() => setAppScreen('protection-confirmation')} />;
  }

  if (appScreen === 'protection-confirmation') {
    return <ProtectionConfirmationScreen onContinue={() => setAppScreen('login')} />;
  }

  if (appScreen === 'login') {
    return <LoginScreen onLogin={() => setAppScreen('main')} />;
  }

  // Main app - Responsive layout
  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-stone-50 shadow-xl relative">
      <TopBarWithSettings onOpenSettings={() => setShowSettings(true)} />

      {activeTab === 'home' && <HomeContent />}
      {activeTab === 'aegis' && <AegisContent />}
      {activeTab === 'agent' && <AgentContent />}
      {activeTab === 'activity' && <ActivityContent />}

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Settings Overlay */}
      {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
    </div>
  );
}
