import { Home, Clock } from 'lucide-react';
import logoGray from '../../../../public/aegis_logo_gray.png';
import logoOrange from '../../../../public/aegis_logo_orange.png';

export function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  const tabs: { id: TabType; label: string; icon?: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'aegis', label: 'Aegis' },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  return (
    <div className="border-t border-stone-200 bg-white">
      <div className="grid grid-cols-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-4 border-r border-stone-200 last:border-r-0 transition-colors ${
                isActive ? 'bg-orange-50' : 'hover:bg-stone-50'
              }`}
            >
              {tab.id === 'aegis' ? (
                <img
                  src={isActive ? logoOrange : logoGray}
                  alt="Aegis"
                  className="h-5 mb-1"
                />
              ) : (
                (() => {
                  const Icon = tab.icon;
                  return (
                    <Icon
                      className={`w-5 h-5 mb-1 ${
                        isActive ? 'text-orange-500' : 'text-stone-500'
                      }`}
                    />
                  );
                })()
              )}

              <span
                className={`text-xs font-semibold ${
                  isActive ? 'text-orange-500' : 'text-stone-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
