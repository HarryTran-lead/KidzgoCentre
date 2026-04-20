"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
  testId: string;
  initialNote?: string;
}

export default function NoteFormModal({
  isOpen,
  onClose,
  onSubmit,
  testId,
  initialNote = "",
}: NoteFormModalProps) {
  const [note, setNote] = useState(initialNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(initialNote.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const maxLength = 500;

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
      setCharCount(initialNote.length);
      setError(null);
      // Auto-focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialNote]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (!isSubmitting) {
          handleClose();
        }
      }
    };

    // Handle ESC key to close
    const handleEscKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape") {
        if (!isSubmitting) {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSubmitting]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setNote(value);
      setCharCount(value.length);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note.trim()) {
      setError("Vui lòng nhập nội dung ghi chú.");
      return;
    }

    if (note.length > maxLength) {
      setError(`Ghi chú không được vượt quá ${maxLength} ký tự.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(note.trim());
      setNote("");
      setCharCount(0);
      onClose();
    } catch (error) {
      console.error("Error submitting note:", error);
      setError("Không thể lưu ghi chú. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNote(initialNote);
      setCharCount(initialNote.length);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!initialNote;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Red gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEditMode ? "Chỉnh sửa ghi chú" : "Thêm ghi chú"}
                </h2>
                <p className="mt-0.5 text-sm text-red-100">
                  {isEditMode 
                    ? "Cập nhật nội dung ghi chú cho kiểm tra xếp lớp" 
                    : "Nhập nội dung ghi chú cho kiểm tra xếp lớp"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-white transition-all hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Note Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="note" className="text-sm font-semibold text-gray-700">
                  Nội dung ghi chú
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <span className={`text-xs ${charCount > maxLength * 0.8 ? "text-amber-600" : "text-gray-400"}`}>
                  {charCount}/{maxLength}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                id="note"
                value={note}
                onChange={handleNoteChange}
                placeholder="Nhập ghi chú cho kiểm tra xếp lớp..."
                rows={5}
                maxLength={maxLength}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-200 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Ghi chú này sẽ được lưu cùng với bài kiểm tra xếp lớp để tham khảo sau này.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !note.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {isEditMode ? "Cập nhật" : "Lưu ghi chú"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}