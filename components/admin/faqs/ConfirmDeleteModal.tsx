import { AlertCircle, Loader2 } from "lucide-react";

type ConfirmDeleteProps = {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmDeleteModal({ message, onConfirm, onClose, loading }: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900">Xác nhận xóa</h3>
        </div>

        <p className="mb-6 text-sm text-gray-600">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
