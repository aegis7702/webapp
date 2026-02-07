import { User, Bell, Settings } from 'lucide-react';

export function TopBar() {
  return (
    <div className="border-b border-stone-200">
      <div className="flex items-center justify-between px-6 py-6">
        {/* Left side: Account info */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-sm">
            <User className="w-4 h-4 text-white" />
          </button>
          <div className="font-semibold text-sm text-stone-800">Account 1</div>
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

export function TopBarWithSettings({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="border-b border-stone-200">
      <div className="flex items-center justify-between px-6 py-6">
        {/* Left side: Account info */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-sm">
            <User className="w-4 h-4 text-white" />
          </button>
          <div className="font-semibold text-sm text-stone-800">Account 1</div>
        </div>
        
        {/* Right side: Notification and Settings */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
            <Bell className="w-4 h-4 text-stone-600" />
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
