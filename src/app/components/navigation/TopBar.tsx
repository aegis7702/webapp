import { User, Bell, Settings } from 'lucide-react';
import { clearWalletSession, getWalletSession } from '../../../utils/walletSession';
import { clearLoginPasswordInMemory } from '../../../utils/authMemory'; // TODO: Remove clearWalletSession
import { clearSavedNetworks } from '../../../utils/networkSession';
import { formatShortAddress } from '../../../utils/walletUtils';

export function TopBar() {
  const session = getWalletSession();
  const displayAddress = session?.address ? formatShortAddress(session.address) : 'Account 1';
  return (
    <div className="border-b border-stone-200">
      <div className="flex items-center justify-between px-6 py-6">
        {/* Left side: Account info */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-sm">
            <User className="w-4 h-4 text-white" />
          </button>
          <div className="font-semibold text-sm text-stone-800 font-mono">{displayAddress}</div>
        </div>

        {/* Right side: Notification and Settings */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
            <Bell className="w-4 h-4 text-stone-600" />
          </button>
          <button className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
            <Settings className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TopBarWithSettings({ 
  onOpenSettings,
  onOpenNotifications,
  hasUnreadNotifications 
}: { 
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  hasUnreadNotifications: boolean;
}) {
  const session = getWalletSession();
  const displayAddress = session?.address ? formatShortAddress(session.address) : 'Account 1';
  return (
    <div className="border-b border-stone-200">
      <div className="flex items-center justify-between px-6 py-6">
        {/* Left side: Account info */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-sm">
            <User className="w-4 h-4 text-white" />
          </button>
          <div className="font-semibold text-sm text-stone-800 font-mono">{displayAddress}</div>
          {/* TODO: Remove these dev buttons */}
          {/* <button
            type="button"
            onClick={() => {
              clearLoginPasswordInMemory();
              clearWalletSession();
              window.location.reload();
            }}
            className="rounded px-2 py-1 text-[10px] font-medium bg-amber-200 text-amber-900 hover:bg-amber-300"
            title="Clear encrypted login & account pk (dev)"
          >
            PK R
          </button>
          <button
            type="button"
            onClick={() => {
              clearSavedNetworks();
              window.location.reload();
            }}
            className="rounded px-2 py-1 text-[10px] font-medium bg-amber-200 text-amber-900 hover:bg-amber-300"
            title="Clear saved networks (dev)"
          >
            NT R
          </button> */}
        </div>

        {/* Right side: Notification and Settings */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenNotifications}
            className="relative flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
          >
            <Bell className="w-4 h-4 text-stone-600" />
            {hasUnreadNotifications && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>
          <button 
            onClick={onOpenSettings}
            className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
          >
            <Settings className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
