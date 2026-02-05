import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    confirmButton: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/25',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmButton: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25',
  },
  info: {
    icon: Info,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    confirmButton: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    confirmButton: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25',
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const style = variantStyles[variant];
  const Icon = style.icon;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={handleCancel}
    >
      <div 
        className="relative bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500"></div>

        {/* Close Button */}
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-pink-600 transition-colors disabled:opacity-50 p-1.5 rounded-lg hover:bg-pink-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={`${style.iconBg} rounded-full p-4 inline-flex shadow-lg`}>
              <Icon className={`w-8 h-8 ${style.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 leading-relaxed mb-7">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="min-w-[120px] px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-pink-200 rounded-xl hover:bg-pink-50 hover:border-pink-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`min-w-[120px] px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg ${style.confirmButton}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
