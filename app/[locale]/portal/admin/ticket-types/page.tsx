"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Type,
  User,
  Users,
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
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === "edit" ? "Cập nhật loại vé học" : "Tạo loại vé học mới"}
              </h2>
              <p className="text-xs text-red-100">Phân loại vé học</p>
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
                <Tag size={14} />
              </div>
              <label className="text-sm font-semibold text-gray-700">
                Code <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              placeholder="VD: STANDARD, PREMIUM, WEEKEND"
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
                <User size={14} />
              </div>
              <label className="text-sm font-semibold text-gray-700">
                Tên <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="VD: Vé học thường"
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
              placeholder="Mô tả loại vé học (tuỳ chọn)"
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

export default function LearningTicketTypePage() {
  const { toast } = useToast();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "vi";
  
  const [items, setItems] = useState<LearningTicketType[]>([]);
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
      setIsPageLoaded(true);
    }
  };

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
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="text-red-600" />
    ) : (
      <ArrowDown size={14} className="text-red-600" />
    );
  };

  const sortedItems = useMemo(() => {
    let sorted = [...filtered];
    if (sortColumn) {
      sorted.sort((a, b) => {
        let aVal: any = "";
        let bVal: any = "";

        switch (sortColumn) {
          case "code":
            aVal = (a.code ?? "").toLowerCase();
            bVal = (b.code ?? "").toLowerCase();
            break;
          case "name":
            aVal = (a.name ?? "").toLowerCase();
            bVal = (b.name ?? "").toLowerCase();
            break;
          case "description":
            aVal = (a.description ?? "").toLowerCase();
            bVal = (b.description ?? "").toLowerCase();
            break;
          case "isActive":
            aVal = a.isActive ? 1 : 0;
            bVal = b.isActive ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filtered, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

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

  const inputCls = "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  const stats = [
    {
      title: "Tổng loại vé",
      value: `${items.length}`,
      icon: <Tag size={20} />,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Đang hoạt động",
      value: `${items.filter(x => x.isActive).length}`,
      icon: <CheckCircle size={20} />,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Tạm dừng",
      value: `${items.filter(x => !x.isActive).length}`,
      icon: <XCircle size={20} />,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-2">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
            <Tag size={25} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Loại vé học</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Quản lý loại vé học — dùng để phân loại gói học
            </p>
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
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
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
                  className={cn(inputCls, "pl-9 w-full")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="border-b border-red-200 bg-gradient-to-r from-red-500/10 to-red-700/10 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Danh sách loại vé học</h2>
            </div>

          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-red-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Tag size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Chưa có loại vé học nào</p>
            <p className="text-sm mt-1">Nhấn "Tạo mới" để thêm</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Không tìm thấy kết quả</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
          </div>
        ) : (
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
        )}
        {sortedItems.length > 0 && (
          <div className="border-t border-red-200 px-6 py-4 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium text-gray-700">{startIndex + 1}-{Math.min(endIndex, sortedItems.length)}</span> trong <span className="font-medium text-gray-700">{sortedItems.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                        currentPage === page
                          ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-red-50"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang tiếp"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}

      {/* Modals */}
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
        confirmText="Xóa"
        isLoading={deleting}
      />
    </div>
  );
}
