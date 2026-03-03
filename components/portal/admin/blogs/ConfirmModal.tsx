"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-600",
      bg: "from-red-50 to-pink-50",
      button: "from-red-600 to-red-700",
    },
    warning: {
      icon: "text-amber-600",
      bg: "from-amber-50 to-orange-50",
      button: "from-amber-600 to-orange-700",
    },
    info: {
      icon: "text-blue-600",
      bg: "from-blue-50 to-cyan-50",
      button: "from-blue-600 to-cyan-700",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r ${styles.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/50`}>
              <AlertTriangle size={24} className={styles.icon} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${styles.button} text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
