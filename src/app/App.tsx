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
import { SignTransactionModal } from './components/home/SignTransactionModal';
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

function weiHexToEth(hex: string): string {
  if (!hex || hex === '0x') return '0';
  const wei = BigInt(hex);
  if (wei === 0n) return '0';
  const WEI_PER_ETH = BigInt(1e18);
  const div = wei / WEI_PER_ETH;
  const rem = wei % WEI_PER_ETH;
  const remStr = rem.toString().padStart(18, '0').replace(/0+$/, '');
  return remStr ? `${div}.${remStr}` : String(div);
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
  const [pendingExternalRequest, setPendingExternalRequest] = useState<{
    id: string;
    method: string;
    params: unknown[];
  } | null>(null);

  React.useEffect(() => {
    const w = typeof window !== 'undefined' ? window : null;
    const crx = w && (w as Window & { chrome?: { runtime?: { id?: string; sendMessage: (msg: unknown, cb: (r: unknown) => void) => void } } }).chrome;
    if (!crx?.runtime?.id) return;

    function checkPending() {
      crx!.runtime!.sendMessage({ type: 'getPendingRequest' }, (res: unknown) => {
        const r = res as { request?: { id: string; method: string; params: unknown[] } | null };
        const req = r?.request;
        if (!req) return;
        if (req.method === 'eth_requestAccounts') {
          const addr = getWalletSession()?.address ?? '';
          crx!.runtime!.sendMessage({ type: 'resolveRequest', id: req.id, result: addr ? [addr] : [], error: null }, () => {});
          return;
        }
        if (req.method === 'eth_sendTransaction' && req.params?.[0]) {
          setPendingExternalRequest({ id: req.id, method: req.method, params: req.params });
        }
      });
    }

    checkPending();
    const interval = setInterval(checkPending, 1500);
    return () => clearInterval(interval);
  }, []);

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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm animate-logo-float p-2">
          <img src="/aegis_logo_white.png" alt="Aegis" className="w-full h-full object-contain" />
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
      {pendingExternalRequest?.method === 'eth_sendTransaction' && pendingExternalRequest.params[0] ? (() => {
        // EIP-1193: params = [tx] with tx = { to, value?, data?, gas?, gasPrice?, chainId?, types?, txType?, authorizationList?, ... }
        const tx = pendingExternalRequest.params[0] as {
          to?: string;
          value?: string;
          data?: string;
          types?: unknown;
          txType?: number;
          authorizationList?: unknown[];
        };
        const chrome = (window as Window & { chrome?: { runtime?: { sendMessage: (msg: unknown, cb?: (r: unknown) => void) => void } } }).chrome;
        return (
          <SignTransactionModal
            requestId={pendingExternalRequest.id}
            initialTo={tx.to ?? ''}
            initialValueEth={weiHexToEth(tx.value ?? '0x0')}
            initialData={tx.data ?? '0x'}
            initialTypes={tx.types}
            initialTxType={tx.txType}
            initialAuthorizationList={tx.authorizationList}
            onResolve={(id, result) => {
              chrome?.runtime?.sendMessage?.({ type: 'resolveRequest', id, result, error: null });
              setPendingExternalRequest(null);
            }}
            onReject={(id, error) => {
              chrome?.runtime?.sendMessage?.({ type: 'resolveRequest', id, result: null, error });
              setPendingExternalRequest(null);
            }}
            onClose={() => setPendingExternalRequest(null)}
          />
        );
      })() : null}
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
