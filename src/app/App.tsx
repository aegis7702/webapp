import { useState } from 'react';
import { TabType, AppScreen } from '../types';
import { TopBarWithSettings } from './components/navigation/TopBar';
import { BottomNav } from './components/navigation/BottomNav';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { NotificationPanel } from './components/notifications/NotificationPanel';
import { LaunchScreen } from './components/onboarding/LaunchScreen';
import { GetStartedScreen } from './components/onboarding/GetStartedScreen';
import { WalletSetupScreen } from './components/onboarding/WalletSetupScreen';
import { CreateWalletScreen } from './components/onboarding/CreateWalletScreen';
import { ImportKeyScreen } from './components/onboarding/ImportKeyScreen';
import { PasswordSetupScreen } from './components/onboarding/PasswordSetupScreen';
import { ProtectionConfirmationScreen } from './components/onboarding/ProtectionConfirmationScreen';
import { LoginScreen } from './components/onboarding/LoginScreen';
import { HomeContent } from './components/home/HomeContent';
import { AegisContent } from './components/aegis/AegisContent';
import { AgentChat } from './components/aegis/AgentChat';
import { ActivityContent } from './components/activity/ActivityContent';
import { mockNotifications } from '../data/mockNotifications';

import { encryptAndSaveWalletSession, getWalletSession } from '../utils/walletSession';

function getInitialAppScreen(): AppScreen {
  return getWalletSession()?.encryptedPk ? 'login' : 'launch';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [appScreen, setAppScreen] = useState<AppScreen>(getInitialAppScreen);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const hasUnreadNotifications = notifications.some(n => !n.isRead);
  
  /** Pending pk to encrypt on password confirm (from create or import). */
  const [pendingPrivateKey, setPendingPrivateKey] = useState<string | null>(null);
  const [pendingFromImport, setPendingFromImport] = useState(false);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

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
    return (
      <CreateWalletScreen
        onBack={() => setAppScreen('wallet-setup')}
        onComplete={(privateKey) => {
          setPendingPrivateKey(privateKey);
          setPendingFromImport(false);
          setAppScreen('password-setup');
        }}
      />
    );
  }

  if (appScreen === 'import-key') {
    return (
      <ImportKeyScreen
        onBack={() => setAppScreen('wallet-setup')}
        onComplete={(privateKey) => {
          setPendingPrivateKey(privateKey);
          setPendingFromImport(true);
          setAppScreen('password-setup');
        }}
      />
    );
  }

  if (appScreen === 'password-setup') {
    return (
      <PasswordSetupScreen
        isImportFlow={pendingFromImport}
        onBack={() =>
          setAppScreen(pendingFromImport ? 'import-key' : 'create-wallet')
        }
        onComplete={async (password) => {
          if (pendingPrivateKey) {
            await encryptAndSaveWalletSession(pendingPrivateKey, password);
            setPendingPrivateKey(null);
            setPendingFromImport(false);
          }
          setAppScreen('protection-confirmation');
        }}
      />
    );
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
      <TopBarWithSettings 
        onOpenSettings={() => setShowSettings(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        hasUnreadNotifications={hasUnreadNotifications}
      />
      
      {activeTab === 'home' && <HomeContent />}
      {activeTab === 'aegis' && <AegisContent />}
      {activeTab === 'activity' && <ActivityContent />}

      <AgentChat />
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Settings Overlay */}
      {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}

        {/* Notifications Overlay */}
      {showNotifications && (
        <NotificationPanel 
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
}
