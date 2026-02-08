import React, { useState } from 'react';
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
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import type { Notification } from '../types/notification';

import { encryptAndSaveWalletSession, getWalletSession } from '../utils/walletSession';

const FROZEN_NOTIFICATION_ID = 'aegis-wallet-frozen';

function buildFrozenNotification(
  freezeReason: string | null,
  recentTx: { txHash: string; note: { name?: string; summary?: string } | null } | undefined
): Notification {
  const txHashShort = recentTx?.txHash
    ? `${recentTx.txHash.slice(0, 10)}...${recentTx.txHash.slice(-8)}`
    : '—';
  const title = recentTx?.note?.name?.trim() || 'Wallet frozen';
  const preview = freezeReason?.trim() || 'Your wallet was frozen due to the most recent transaction.';
  const fullMessage = [
    preview,
    '',
    'Most recent transaction:',
    `• Tx: ${txHashShort}`,
    recentTx?.note?.summary?.trim() ? `• ${recentTx.note.summary}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    id: FROZEN_NOTIFICATION_ID,
    severity: 'critical',
    title,
    preview,
    fullMessage,
    timestamp: new Date(),
    isRead: false,
  };
}

function MainAppLayout({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
}) {
  const { activity, initialLoadDone } = useAppData();
  const { isFrozen, freezeReason, txs } = activity;
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [freezeNotificationRead, setFreezeNotificationRead] = useState(false);

  const notifications: Notification[] = isFrozen
    ? [
        {
          ...buildFrozenNotification(freezeReason, txs[0]),
          isRead: freezeNotificationRead,
        },
      ]
    : [];
  const hasUnreadNotifications = isFrozen && !freezeNotificationRead;

  const handleMarkAsRead = (id: string) => {
    if (id === FROZEN_NOTIFICATION_ID) setFreezeNotificationRead(true);
  };

  if (!initialLoadDone) {
    return (
      <div className="flex flex-col h-screen max-w-6xl mx-auto bg-stone-50 shadow-xl items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm animate-logo-float">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      </div>
    );
  }

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
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
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

function getInitialAppScreen(): AppScreen {
  return getWalletSession()?.encryptedPk ? 'login' : 'launch';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [appScreen, setAppScreen] = useState<AppScreen>(getInitialAppScreen);

  /** Pending pk to encrypt on password confirm (from create or import). */
  const [pendingPrivateKey, setPendingPrivateKey] = useState<string | null>(null);
  const [pendingFromImport, setPendingFromImport] = useState(false);

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

  // Main app - layout and freeze notification live inside AppDataProvider
  return (
    <AppDataProvider>
      <MainAppLayout activeTab={activeTab} setActiveTab={setActiveTab} />
    </AppDataProvider>
  );
}
