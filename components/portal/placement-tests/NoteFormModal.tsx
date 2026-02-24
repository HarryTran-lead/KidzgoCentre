"use client";

import { useState } from "react";
import { X, FileText } from "lucide-react";

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
  testId: string;
}

export default function NoteFormModal({
  isOpen,
  onClose,
  onSubmit,
  testId,
}: NoteFormModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(note.trim());
      setNote("");
      onClose();
    } catch (error) {
      console.error("Error submitting note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-cyan-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={22} />
            Thêm ghi chú
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
              Nội dung ghi chú
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho placement test..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu ghi chú"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
