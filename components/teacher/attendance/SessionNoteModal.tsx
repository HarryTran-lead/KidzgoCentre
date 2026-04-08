"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

type SessionNoteModalProps = {
  open: boolean;
  studentName: string;
  sessionLabel?: string;
  initialFeedback?: string;
  canEdit?: boolean;
  isSubmitting?: boolean;
  isEnhancing?: boolean;
  canSubmitForReview?: boolean;
  isSubmittingForReview?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void> | void;
  onEnhance?: (draft: string) => Promise<string | null> | string | null;
  onSubmitForReview?: () => Promise<void> | void;
};

export default function SessionNoteModal({
  open,
  studentName,
  sessionLabel,
  initialFeedback = "",
  canEdit = false,
  isSubmitting = false,
  isEnhancing = false,
  canSubmitForReview = false,
  isSubmittingForReview = false,
  error,
  onClose,
  onSubmit,
  onEnhance,
  onSubmitForReview,
}: SessionNoteModalProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const savedFeedbackRef = useRef(initialFeedback);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setFeedback(initialFeedback ?? "");
      savedFeedbackRef.current = initialFeedback ?? "";
      setEnhanceError(null);
      setShowConfirmClose(false);
    }
  }, [initialFeedback, open]);

  const hasUnsavedChanges = feedback.trim() !== (savedFeedbackRef.current ?? "").trim() && feedback.trim() !== "";

  const handleSafeClose = () => {
    if (isSubmitting || isSubmittingForReview) return;
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
      return;
    }
    onClose();
  };

  const handleForceClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting && !isSubmittingForReview) {
        handleSafeClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, isSubmittingForReview, open, hasUnsavedChanges]);

  const actionLabel = useMemo(() => (canEdit ? "Lưu chỉnh sửa" : "Lưu nhận xét"), [canEdit]);

  const handleEnhance = async () => {
    if (!onEnhance) return;
    const draft = feedback.trim();
    if (!draft) return;
    try {
      setEnhanceError(null);
      const enhanced = await onEnhance(draft);
      if (enhanced && enhanced.trim()) {
        setFeedback(enhanced.trim());
      }
    } catch (err: any) {
      setEnhanceError(err?.message || "Không thể cải thiện nhận xét bằng AI.");
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="presentation"
      onClick={() => {
        if (!isSubmitting && !isSubmittingForReview) {
          handleSafeClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-note-modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="session-note-modal-title" className="text-lg font-semibold text-gray-900">
              Nhận xét theo buổi
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">{studentName}</p>
            {sessionLabel ? <p className="mt-1 text-xs text-gray-400">{sessionLabel}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleSafeClose}
            disabled={isSubmitting || isSubmittingForReview}
            className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 px-5 py-4">
          <label htmlFor="session-feedback" className="text-sm font-medium text-gray-700">
            Nhận xét buổi học
          </label>
          <textarea
            id="session-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={6}
            placeholder="Nhập nhận xét cho học sinh của buổi học này..."
            disabled={isSubmitting || isSubmittingForReview}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
          {onEnhance ? (
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || isSubmitting || isSubmittingForReview || !feedback.trim()}
              className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEnhancing ? "AI đang hỗ trợ viết lại..." : "Cải thiện nhận xét bằng AI"}
            </button>
          ) : null}
          {enhanceError ? <p className="text-sm text-red-600">{enhanceError}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={handleSafeClose}
            disabled={isSubmitting || isSubmittingForReview}
            className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSubmit(feedback.trim())}
            disabled={isSubmitting || isSubmittingForReview || !feedback.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {actionLabel}
          </button>
          {onSubmitForReview ? (
            <button
              type="button"
              onClick={() => onSubmitForReview()}
              disabled={!canSubmitForReview || isSubmitting || isSubmittingForReview}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingForReview ? <Loader2 size={14} className="animate-spin" /> : null}
              Gửi duyệt
            </button>
          ) : null}
        </div>

        {/* Confirm close dialog */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/30">
            <div className="mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-sm font-semibold text-gray-900">Bạn chưa lưu nhận xét</h4>
              <p className="mt-1 text-sm text-gray-600">Dữ liệu đang nhập sẽ bị mất nếu bạn đóng. Bạn muốn tiếp tục?</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmClose(false)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Tiếp tục viết
                </button>
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                >
                  Đóng không lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
