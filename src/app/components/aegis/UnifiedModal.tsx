import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface UnifiedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
}

export function UnifiedModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  showCloseButton = true 
}: UnifiedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 flex-shrink-0">
          <h3 className="font-semibold text-xl text-stone-900">{title}</h3>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>
          )}
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer - Sticky */}
        {footer && (
          <div className="border-t border-stone-200 p-6 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
