import { AlertTriangle, CheckCircle, Info, Trash2, X } from "lucide-react";

export type ConfirmModalVariant = "danger" | "warning" | "info" | "success";

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
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    confirmButton:
      "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmButton:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600",
  },
  info: {
    icon: Info,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmButton:
      "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-600",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    confirmButton:
      "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-green-700",
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-red-700" />

        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-xl border border-red-200 bg-white p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-7 text-center sm:p-8">
          <div className="mb-5 flex justify-center">
            <div className={`${style.iconBg} inline-flex rounded-2xl p-4 shadow-lg`}>
              <Icon className={`h-8 w-8 ${style.iconColor}`} />
            </div>
          </div>

          <h3 id="confirm-modal-title" className="mb-3 text-xl font-bold text-gray-900">
            {title}
          </h3>

          <p className="mb-7 text-sm leading-relaxed text-gray-600">{message}</p>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="min-w-[120px] cursor-pointer rounded-xl border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${style.confirmButton}`}
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
