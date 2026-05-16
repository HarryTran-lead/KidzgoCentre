"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getLearningTicketTypes,
  createLearningTicketType,
  updateLearningTicketType,
  deleteLearningTicketType,
} from "@/lib/api/learningTicketTypeService";
import ConfirmModal from "@/components/ConfirmModal";
import type { LearningTicketType } from "@/types/learning-ticket-type";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

type FormData = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormData = { code: "", name: "", description: "", isActive: true };

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
      <CheckCircle size={12} /> Hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200">
      <XCircle size={12} /> Tạm dừng
    </span>
  );
}

function FormModal({
  open,
  onClose,
  onSubmit,
  mode,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  mode: "create" | "edit";
  initial?: FormData;
}) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyForm);
      setErrors({});
    }
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.code.trim()) next.code = "Code là bắt buộc";
    if (form.code.length > 100) next.code = "Code tối đa 100 ký tự";
    if (!form.name.trim()) next.name = "Tên là bắt buộc";
    if (form.name.length > 255) next.name = "Tên tối đa 255 ký tự";
    if (form.description.length > 500) next.description = "Mô tả tối đa 500 ký tự";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === "edit" ? "Cập nhật loại vé học" : "Tạo loại vé học mới"}
              </h2>
              <p className="text-xs text-purple-100">Phân loại vé học</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
            <X size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              placeholder="VD: STANDARD, PREMIUM, WEEKEND"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
                errors.code ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="VD: Vé học thường"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
                errors.name ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              placeholder="Mô tả loại vé học (tuỳ chọn)"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none",
                errors.description ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Hoạt động</label>
            <button
              type="button"
              onClick={() => handleChange("isActive", !form.isActive)}
              className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer",
                form.isActive ? "bg-purple-600" : "bg-gray-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                  form.isActive ? "translate-x-8" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-sm text-white font-semibold hover:shadow-lg transition-all cursor-pointer"
            >
              {mode === "edit" ? "Lưu thay đổi" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LearningTicketTypePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<LearningTicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<LearningTicketType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LearningTicketType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLearningTicketTypes();
      setItems(data);
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách loại vé học.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(
    (x) =>
      x.code.toLowerCase().includes(search.toLowerCase()) ||
      x.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setModalMode("create");
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (item: LearningTicketType) => {
    setModalMode("edit");
    setEditTarget(item);
    setModalOpen(true);
  };

  const handleSubmit = async (form: FormData) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        await createLearningTicketType({
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          isActive: form.isActive,
        });
        toast({ title: "Thành công", description: "Đã tạo loại vé học mới." });
      } else if (editTarget) {
        await updateLearningTicketType(editTarget.id, {
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          isActive: form.isActive,
        });
        toast({ title: "Thành công", description: "Đã cập nhật loại vé học." });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message ?? "Có lỗi xảy ra.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLearningTicketType(deleteTarget.id);
      toast({ title: "Đã xóa", description: `Đã xóa loại vé học "${deleteTarget.name}".` });
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message ?? "Không thể xóa.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const editInitial = editTarget
    ? {
        code: editTarget.code,
        name: editTarget.name,
        description: editTarget.description ?? "",
        isActive: editTarget.isActive,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag size={24} className="text-purple-600" />
            Loại vé học
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý loại vé học — dùng để phân loại gói học</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-sm text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer"
        >
          <Plus size={16} /> Tạo mới
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm code, tên..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Tag size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Chưa có loại vé học nào</p>
            <p className="text-sm mt-1">Nhấn "Tạo mới" để thêm</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Tên</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Mô tả</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold font-mono">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{item.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{item.description ?? "—"}</td>
                  <td className="px-5 py-3.5"><StatusBadge isActive={item.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-gray-500 hover:text-purple-600 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FormModal
        open={modalOpen && !saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        mode={modalMode}
        initial={editInitial}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa loại vé học"
        message={`Bạn có chắc muốn xóa loại vé học "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isLoading={deleting}
      />
    </div>
  );
}
