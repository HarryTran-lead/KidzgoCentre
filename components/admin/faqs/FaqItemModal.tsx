"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFaqItem, updateFaqItem } from "@/lib/api/faqService";
import type { FaqCategory, FaqItem } from "@/types/faq";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { extractApiError } from "./errors";
import { CategoryIcon } from "./icon-map";

type FaqItemModalProps = {
  mode: "create" | "edit";
  initial?: FaqItem | null;
  categories: FaqCategory[];
  onClose: () => void;
  onSaved: () => void;
};

export function FaqItemModal({ mode, initial, categories, onClose, onSaved }: FaqItemModalProps) {
  const { toast } = useToast();
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [saving, setSaving] = useState(false);

  const activeCategories = useMemo(() => categories.filter((c) => !c.isDeleted), [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      toast({ title: "Lỗi", description: "Vui lòng chọn danh mục.", variant: "destructive" });
      return;
    }
    if (!question.trim()) {
      toast({ title: "Lỗi", description: "Câu hỏi không được để trống.", variant: "destructive" });
      return;
    }
    if (!answer.trim()) {
      toast({ title: "Lỗi", description: "Câu trả lời không được để trống.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const payload = { categoryId, question: question.trim(), answer: answer.trim(), sortOrder, isPublished };

      if (mode === "create") {
        await createFaqItem(payload);
        toast({ title: "Thành công", description: "Đã tạo câu hỏi FAQ.", variant: "success" });
      } else {
        await updateFaqItem(initial!.id, payload);
        toast({ title: "Thành công", description: "Đã cập nhật câu hỏi FAQ.", variant: "success" });
      }

      onSaved();
      onClose();
    } catch (err) {
      toast({ title: "Thất bại", description: extractApiError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-linear-to-r from-red-600 to-red-700 p-1.5">
                <HelpCircle size={16} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {mode === "create" ? "Thêm câu hỏi FAQ" : "Chỉnh sửa câu hỏi FAQ"}
              </h3>
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-red-300 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200">
                <SelectValue placeholder="-- Chọn danh mục --" />
              </SelectTrigger>
              <SelectContent>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <CategoryIcon name={c.icon} size={14} className="text-red-500" />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              placeholder="Nhập câu hỏi..."
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">{question.length}/500</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Câu trả lời <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
              rows={6}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={10000}
              placeholder="Nhập câu trả lời..."
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">{answer.length}/10000</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Thứ tự hiển thị</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-red-300 text-red-600 focus:ring-red-200"
                />
                <span className="text-sm font-medium text-gray-700">Xuất bản ngay</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {mode === "create" ? "Tạo câu hỏi" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
