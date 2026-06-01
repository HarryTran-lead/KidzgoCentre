"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Type,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getSlotTypes,
  createSlotType,
  updateSlotType,
  deleteSlotType,
} from "@/lib/api/slotTypeService";
import ConfirmModal from "@/components/ConfirmModal";
import type { SlotType } from "@/types/slot-type";

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

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
      <CheckCircle size={12} /> Hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/20">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === "edit" ? "Cập nhật loại slot" : "Tạo loại slot mới"}
              </h2>
              <p className="text-xs text-red-100">Phân loại runtime buổi học</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
            <X size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
                <Layers size={14} />
              </div>
              <label className="text-sm font-semibold text-gray-700">
                Code <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              placeholder="VD: STANDARD, PREMIUM, NATIVE_SUPPORT"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300",
                errors.code ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
                <Type size={14} />
              </div>
              <label className="text-sm font-semibold text-gray-700">
                Tên <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="VD: Lớp thường, Lớp native support"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300",
                errors.name ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
                <FileText size={14} />
              </div>
              <label className="text-sm font-semibold text-gray-700">Mô tả</label>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              placeholder="Mô tả loại slot (tuỳ chọn)"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none",
                errors.description ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
                <Shield size={14} />
              </div>
              <label className="text-sm font-semibold text-gray-700">Hoạt động</label>
            </div>
            <button
              type="button"
              onClick={() => handleChange("isActive", !form.isActive)}
              className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer",
                form.isActive ? "bg-red-600" : "bg-gray-300"
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm text-white font-semibold hover:shadow-lg transition-all cursor-pointer"
            >
              {mode === "edit" ? "Lưu thay đổi" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SlotTypePage() {
  const { toast } = useToast();
  
  const [items, setItems] = useState<SlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<SlotType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SlotType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSlotTypes();
      setItems(data);
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách loại slot.", variant: "destructive" });
    } finally {
      setLoading(false);
      setIsPageLoaded(true);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterActive]);

  const filtered = items.filter(
    (x) =>
      (x.code.toLowerCase().includes(search.toLowerCase()) ||
        x.name.toLowerCase().includes(search.toLowerCase())) &&
      (filterActive === "all" ||
        (filterActive === "active" && x.isActive) ||
        (filterActive === "inactive" && !x.isActive))
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const sortedItems = useMemo(() => {
    const sorted = [...filtered];
    if (!sortColumn) return sorted;
    sorted.sort((a, b) => {
      let aVal: string | boolean = "";
      let bVal: string | boolean = "";
      if (sortColumn === "code") {
        aVal = a.code;
        bVal = b.code;
      } else if (sortColumn === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortColumn === "isActive") {
        aVal = a.isActive ? "z" : "a";
        bVal = b.isActive ? "z" : "a";
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filtered, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  const openCreate = () => {
    setModalMode("create");
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (item: SlotType) => {
    setModalMode("edit");
    setEditTarget(item);
    setModalOpen(true);
  };

  const handleSubmit = async (form: FormData) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        await createSlotType({
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          isActive: form.isActive,
        });
        toast({ title: "Thành công", description: "Đã tạo loại slot mới." });
      } else if (editTarget) {
        await updateSlotType(editTarget.id, {
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          isActive: form.isActive,
        });
        toast({ title: "Thành công", description: "Đã cập nhật loại slot." });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      const error = err instanceof Error ? err.message : "Có lỗi xảy ra.";
      toast({ title: "Lỗi", description: error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSlotType(deleteTarget.id);
      toast({ title: "Đã xóa", description: `Đã xóa loại slot "${deleteTarget.name}".` });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const error = err instanceof Error ? err.message : "Không thể xóa.";
      toast({ title: "Lỗi", description: error, variant: "destructive" });
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
      {/* Header */}
      <div className={`flex items-center justify-between flex-wrap gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
            <Layers size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loại slot buổi học</h1>
            <p className="text-sm text-gray-500 mt-1">Phân loại runtime buổi học — STANDARD, NATIVE_SUPPORT, WORKSHOP...</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus size={16} /> Tạo mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className={`grid gap-4 md:grid-cols-3 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <StatCard
          title="Tổng loại slot"
          value={items.length.toString()}
          icon={<Layers size={20} />}
          color="from-red-600 to-red-700"
        />
        <StatCard
          title="Đang hoạt động"
          value={items.filter((x) => x.isActive).length.toString()}
          icon={<CheckCircle size={20} />}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Tạm dừng"
          value={items.filter((x) => !x.isActive).length.toString()}
          icon={<XCircle size={20} />}
          color="from-amber-500 to-orange-500"
        />
      </div>

      {/* Filter Card */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-red-200">
            {(["all", "active", "inactive"] as const).map((status) => {
              const counts: Record<typeof status, number> = {
                all: items.length,
                active: items.filter((s) => s.isActive).length,
                inactive: items.filter((s) => !s.isActive).length,
              };

              const labels: Record<typeof status, string> = {
                all: "Tất cả",
                active: "Đang hoạt động",
                inactive: "Tạm dừng",
              };

              const isActive = filterActive === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterActive(status)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                      : "bg-white border-red-200 text-gray-700 hover:bg-red-50",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {labels[status]}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      {counts[status]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm code, tên..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className={`rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="border-b border-red-200 bg-gradient-to-r from-red-500/10 to-red-700/10 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Danh sách loại slot</h2>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-red-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Layers size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Chưa có loại slot nào</p>
            <p className="text-sm mt-1">Nhấn &quot;Tạo mới&quot; để thêm</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Không tìm thấy kết quả</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-200 bg-gradient-to-r from-red-50/80 to-red-100/30">
                  <th
                    className="text-left px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("code")}
                  >
                    <span className="inline-flex items-center gap-2">Code {getSortIcon("code")}</span>
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("name")}
                  >
                    <span className="inline-flex items-center gap-2">Tên {getSortIcon("name")}</span>
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("description")}
                  >
                    <span className="inline-flex items-center gap-2">Mô tả {getSortIcon("description")}</span>
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("isActive")}
                  >
                    <span className="inline-flex items-center gap-2">Trạng thái {getSortIcon("isActive")}</span>
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/40 transition-colors duration-200 group">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold font-mono group-hover:bg-red-200 transition-colors">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{item.description ?? "—"}</td>
                    <td className="px-6 py-4"><StatusBadge isActive={item.isActive} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all hover:scale-110 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all hover:scale-110 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-red-100 px-6 py-4 flex items-center justify-between bg-red-50/50">
                <div className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1} đến {Math.min(endIndex, sortedItems.length)} trong {sortedItems.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages)
                    .map((p, idx, arr) => (
                      <div key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 py-2">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={cn(
                            "px-3 py-2 rounded-lg font-medium text-sm transition-colors",
                            currentPage === p
                              ? "bg-red-600 text-white"
                              : "hover:bg-white text-gray-700"
                          )}
                        >
                          {p}
                        </button>
                      </div>
                    ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
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
        title="Xóa loại slot"
        message={`Bạn có chắc muốn xóa loại slot "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        isLoading={deleting}
      />
    </div>
  );
}
