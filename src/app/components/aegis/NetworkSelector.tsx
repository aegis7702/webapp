import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface NetworkSelectorProps {
  value: string;
  onChange: (network: string) => void;
  networks: string[];
}

export function NetworkSelector({ value, onChange, networks }: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (network: string) => {
    onChange(network);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full md:w-auto md:min-w-[160px]">
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 font-medium outline-none hover:border-stone-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all flex items-center justify-between gap-2"
      >
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Custom Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {networks.map((network) => (
            <button
              key={network}
              type="button"
              onClick={() => handleSelect(network)}
              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                value === network
                  ? 'bg-orange-50 text-orange-900 font-medium'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>{network}</span>
              {value === network && (
                <Check className="w-4 h-4 text-orange-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
