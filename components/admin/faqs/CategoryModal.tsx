"use client";

import { useState } from "react";
import { FolderOpen, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFaqCategory, updateFaqCategory } from "@/lib/api/faqService";
import type { FaqCategory } from "@/types/faq";
import { extractApiError } from "./errors";
import { CategoryIcon, FAQ_ICON_OPTIONS } from "./icon-map";

type CategoryModalProps = {
  mode: "create" | "edit";
  initial?: FaqCategory | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CategoryModal({ mode, initial, onClose, onSaved }: CategoryModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Lỗi", description: "Tên danh mục không được để trống.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      if (mode === "create") {
        await createFaqCategory({ name: name.trim(), icon: icon || null, sortOrder, isActive });
        toast({ title: "Thành công", description: "Đã tạo danh mục FAQ.", variant: "success" });
      } else {
        await updateFaqCategory(initial!.id, { name: name.trim(), icon: icon || null, sortOrder, isActive });
        toast({ title: "Thành công", description: "Đã cập nhật danh mục FAQ.", variant: "success" });
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
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-linear-to-r from-red-600 to-red-700 p-1.5">
              <FolderOpen size={16} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {mode === "create" ? "Thêm danh mục FAQ" : "Chỉnh sửa danh mục FAQ"}
            </h3>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="Ví dụ: Học phí và thanh toán"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Icon danh mục
              {icon && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-red-600">
                  <CategoryIcon name={icon} size={12} /> {icon}
                </span>
              )}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {FAQ_ICON_OPTIONS.map((opt) => {
                const isSelected = icon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIcon(isSelected ? "" : opt.name)}
                    title={opt.label}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs transition-all ${
                      isSelected
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-red-200 hover:bg-red-50/50 hover:text-red-600"
                    }`}
                  >
                    <opt.component size={18} />
                    <span className="w-full truncate text-center leading-none">{opt.label}</span>
                  </button>
                );
              })}
            </div>
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
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-red-300 text-red-600 focus:ring-red-200"
                />
                <span className="cursor-pointer text-sm text-gray-700">Kích hoạt</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
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
              {mode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
