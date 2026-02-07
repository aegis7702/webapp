import { Home, Shield, Bot, Clock } from 'lucide-react';
import { TabType } from '../../../types';

export function BottomNav({ activeTab, setActiveTab }: { activeTab: TabType; setActiveTab: (tab: TabType) => void }) {
  const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'aegis', label: 'Aegis', icon: Shield },
    { id: 'agent', label: 'Agent', icon: Bot },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  return (
    <div className="border-t border-stone-200 bg-white">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-4 border-r border-stone-200 last:border-r-0 transition-colors ${
                isActive ? 'bg-orange-50' : 'hover:bg-stone-50'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-orange-500' : 'text-stone-500'}`} />
              <span className={`text-xs font-semibold ${isActive ? 'text-orange-500' : 'text-stone-600'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
