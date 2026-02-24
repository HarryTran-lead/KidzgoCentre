"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

type SessionNoteModalProps = {
  open: boolean;
  studentName: string;
  sessionLabel?: string;
  initialFeedback?: string;
  canEdit?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void> | void;
};

export default function SessionNoteModal({
  open,
  studentName,
  sessionLabel,
  initialFeedback = "",
  canEdit = false,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: SessionNoteModalProps) {
  const [feedback, setFeedback] = useState(initialFeedback);

  useEffect(() => {
    if (open) {
      setFeedback(initialFeedback ?? "");
    }
  }, [initialFeedback, open]);

  const actionLabel = useMemo(() => (canEdit ? "Lưu chỉnh sửa" : "Gửi nhận xét"), [canEdit]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Note theo buổi</h3>
            <p className="text-sm text-gray-500 mt-0.5">{studentName}</p>
            {sessionLabel && <p className="text-xs text-gray-400 mt-1">{sessionLabel}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          <label htmlFor="session-feedback" className="text-sm font-medium text-gray-700">
            Nhận xét buổi học
          </label>
          <textarea
            id="session-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={6}
            placeholder="Nhập nhận xét cho học sinh của buổi học này..."
            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSubmit(feedback.trim())}
            disabled={isSubmitting || !feedback.trim()}
            className="px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:opacity-95 disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}