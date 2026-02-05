"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Eye,
  Pencil,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart,
  AlertCircle,
  FileText,
  Building2,
  Power,
  PowerOff
} from "lucide-react";
import { fetchAdminPrograms, createAdminProgram, fetchAdminProgramDetail, updateAdminProgram, toggleProgramStatus } from "@/app/api/admin/programs";
import type { CourseRow, CreateProgramRequest } from "@/types/admin/programs";
import { getAllBranches } from "@/lib/api/branchService";
import { useBranchFilter } from "@/hooks/useBranchFilter";

/* -------------------------- helpers -------------------------- */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/* Tag nhỏ hiển thị trình độ (A1, A2, B1,...) */
function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    A1: "bg-blue-100 text-blue-700",
    A2: "bg-emerald-100 text-emerald-700",
    B1: "bg-amber-100 text-amber-700",
    B2: "bg-violet-100 text-violet-700",
    C1: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", map[level] || "bg-slate-100 text-slate-700")}>
      {level}
    </span>
  );
}

/* Trạng thái khoá học */
function StatusBadge({ value }: { value: "Đang hoạt động" | "Tạm dừng" }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-emerald-100 text-emerald-700",
    "Tạm dừng": "bg-amber-100 text-amber-700",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

type SortField = "id" | "name" | "level" | "duration" | "fee" | "status" | "branch";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 5;

/* --------------------------- API helpers --------------------------- */

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
  align = "left",
}: {
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentField === field;
  const icon = isActive ? (
    direction === "asc" ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-pink-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

/* ----------------------------- CREATE / EDIT COURSE MODAL ------------------------------ */
interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => void;
  mode?: "create" | "edit";
  initialData?: CourseFormData | null;
}

interface CourseFormData {
  name: string;
  description: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  status: "Đang hoạt động" | "Tạm dừng";
  branchId: string;
  totalSessions: string;
  defaultTuitionAmount: string;
  unitPriceSession: string;
}

const initialFormData: CourseFormData = {
  name: "",
  description: "",
  level: "A1",
  status: "Đang hoạt động",
  branchId: "",
  totalSessions: "",
  defaultTuitionAmount: "",
  unitPriceSession: "",
};

function CreateCourseModal({ isOpen, onClose, onSubmit, mode = "create", initialData }: CreateCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});
  const [branchOptions, setBranchOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      loadBranches();
    }
  }, [isOpen, mode, initialData]);

  // Tự động tính giá mỗi buổi khi số buổi học hoặc học phí mặc định thay đổi
  useEffect(() => {
    const sessions = Number(formData.totalSessions);
    const tuition = Number(formData.defaultTuitionAmount.replace(/,/g, ""));
    
    if (sessions > 0 && tuition > 0) {
      const pricePerSession = Math.round(tuition / sessions);
      setFormData(prev => ({
        ...prev,
        unitPriceSession: pricePerSession.toLocaleString("vi-VN")
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        unitPriceSession: ""
      }));
    }
  }, [formData.totalSessions, formData.defaultTuitionAmount]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await getAllBranches({ page: 1, limit: 100 });
      const items = res?.data?.branches ?? res?.data ?? [];
      setBranchOptions(
        items.map((b: any) => ({
          id: String(b?.id ?? ""),
          name: String(b?.name ?? b?.code ?? "Chi nhánh"),
        })).filter((b: { id: string }) => b.id)
      );
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {};
    
    if (!formData.name.trim()) newErrors.name = "Tên khóa học là bắt buộc";
    if (!formData.description.trim()) newErrors.description = "Mô tả là bắt buộc";
    if (!formData.branchId) newErrors.branchId = "Chi nhánh là bắt buộc";
    if (!formData.totalSessions.trim() || Number(formData.totalSessions) <= 0) {
      newErrors.totalSessions = "Số buổi học phải lớn hơn 0";
    }
    if (!formData.defaultTuitionAmount.trim() || Number(formData.defaultTuitionAmount.replace(/,/g, "")) <= 0) {
      newErrors.defaultTuitionAmount = "Học phí mặc định phải lớn hơn 0";
    }
    if (!formData.unitPriceSession.trim() || Number(formData.unitPriceSession.replace(/,/g, "")) <= 0) {
      newErrors.unitPriceSession = "Giá mỗi buổi phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật chương trình" : "Tạo khóa học mới"}
                </h2>
                <p className="text-sm text-pink-100">
                  {mode === "edit" ? "Chỉnh sửa thông tin chương trình học" : "Nhập thông tin chi tiết về khóa học mới"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 0: Chi nhánh */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2 size={16} className="text-pink-500" />
                Chi nhánh *
              </label>
              <div className="relative">
                <select
                  value={formData.branchId}
                  onChange={(e) => handleChange("branchId", e.target.value)}
                  disabled={loadingBranches}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                    errors.branchId ? "border-rose-500" : "border-pink-200",
                    loadingBranches ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  <option value="">Chọn chi nhánh</option>
                  {branchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-rose-500" />
                  </div>
                )}
              </div>
              {errors.branchId && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
            </div>

            {/* Row 1: Tên khóa */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-pink-500" />
                Tên khóa học *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                    errors.name ? "border-rose-500" : "border-pink-200"
                  )}
                  placeholder="VD: Tiếng Anh giao tiếp cơ bản"
                />
                {errors.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-rose-500" />
                  </div>
                )}
              </div>
              {errors.name && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>

            {/* Row 2: Mô tả */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={16} className="text-pink-500" />
                Mô tả khóa học *
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                    errors.description ? "border-rose-500" : "border-pink-200"
                  )}
                  placeholder="Mô tả chi tiết về khóa học..."
                />
                {errors.description && (
                  <div className="absolute right-3 top-3">
                    <AlertCircle size={18} className="text-rose-500" />
                  </div>
                )}
              </div>
              {errors.description && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.description}</p>}
            </div>

            {/* Row 3: Trình độ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BarChart size={16} className="text-pink-500" />
                Trình độ
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(["A1", "A2", "B1", "B2", "C1"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleChange("level", level)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                      formData.level === level
                        ? level === "A1"
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : level === "A2"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : level === "B1"
                          ? "bg-amber-100 border-amber-300 text-amber-700"
                          : level === "B2"
                          ? "bg-violet-100 border-violet-300 text-violet-700"
                          : "bg-rose-100 border-rose-300 text-rose-700"
                        : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3.5: Số buổi học, Học phí mặc định, Giá mỗi buổi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-pink-500" />
                  Số buổi học *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSessions}
                    onChange={(e) => handleChange("totalSessions", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.totalSessions ? "border-rose-500" : "border-pink-200"
                    )}
                    placeholder="VD: 24"
                  />
                  {errors.totalSessions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.totalSessions && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.totalSessions}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-pink-500" />
                  Học phí mặc định (VND) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.defaultTuitionAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,]/g, "");
                      handleChange("defaultTuitionAmount", val);
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.defaultTuitionAmount ? "border-rose-500" : "border-pink-200"
                    )}
                    placeholder="VD: 3000000"
                  />
                  {errors.defaultTuitionAmount && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.defaultTuitionAmount && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.defaultTuitionAmount}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-pink-500" />
                  Giá mỗi buổi (VND) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.unitPriceSession}
                    readOnly
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-700",
                      "cursor-not-allowed",
                      errors.unitPriceSession ? "border-rose-500" : "border-pink-200"
                    )}
                    placeholder="Tự động tính từ học phí mặc định / số buổi học"
                  />
                  {errors.unitPriceSession && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.unitPriceSession && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.unitPriceSession}</p>}
                <p className="text-xs text-gray-500">Tự động tính từ học phí mặc định chia cho số buổi học</p>
              </div>
            </div>

            {/* Row 4: Trạng thái */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-pink-500" />
                Trạng thái
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Đang hoạt động", "Tạm dừng"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleChange("status", status)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                      formData.status === status
                        ? status === "Đang hoạt động"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-amber-100 border-amber-300 text-amber-700"
                        : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (mode === "edit" && initialData) {
                    setFormData(initialData);
                  } else {
                    setFormData(initialFormData);
                  }
                  setErrors({});
                }}
                className="px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
              >
                {mode === "edit" ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer"
              >
                {mode === "edit" ? "Lưu thay đổi" : "Tạo khóa học"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ page ------------------------------- */
export default function Page() {
  // Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<"ALL" | "A1" | "A2" | "B1" | "B2" | "C1">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Đang hoạt động" | "Tạm dừng">("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<CourseFormData | null>(null);
  const [originalStatus, setOriginalStatus] = useState<"Đang hoạt động" | "Tạm dừng" | null>(null);

  // Fetch programs with branch filter
  useEffect(() => {
    // Wait for localStorage to be loaded
    if (!isLoaded) return;

    async function fetchPrograms() {
      try {
        setLoading(true);
        setError(null);

        const branchId = getBranchQueryParam();
        console.log("📚 Fetching programs for branch:", branchId || "All branches");

        const mapped = await fetchAdminPrograms({ branchId });
        setCourses(mapped);
        console.log("✅ Loaded", mapped.length, "programs");
      } catch (err) {
        console.error("Unexpected error when fetching admin programs:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách khóa học.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
    
    // Reset page về 1 khi branch thay đổi
    setPage(1);
  }, [selectedBranchId, isLoaded]); // Chỉ depend vào selectedBranchId và isLoaded

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === "Đang hoạt động").length;
    const students = 0;
    const revenue = "0";

    return {
      total,
      active,
      students,
      revenue,
    };
  }, [courses]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = !kw
      ? courses
      : courses.filter((c) =>
          [c.id, c.name, c.desc, c.level, c.fee, c.branch].some((x) => x?.toLowerCase().includes(kw))
        );

    if (levelFilter !== "ALL") {
      filtered = filtered.filter((c) => c.level === levelFilter);
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: CourseRow) => {
          switch (sortField) {
            case "id": return c.id;
            case "name": return c.name;
            case "level": return c.level;
            case "duration": return c.duration;
            case "fee": return c.fee;
            case "status": return c.status;
            case "branch": return c.branch ?? "";
          }
        };
        const av = getVal(a);
        const bv = getVal(b);
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }
    return filtered;
  }, [q, sortField, sortDirection, courses, levelFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleCreateCourse = async (data: CourseFormData) => {
    try {
      const totalSessions = Number(data.totalSessions);
      const defaultTuitionAmount = Number(data.defaultTuitionAmount.replace(/,/g, ""));
      const unitPriceSession = Number(data.unitPriceSession.replace(/,/g, ""));

      if (!data.branchId) {
        alert("Vui lòng chọn chi nhánh");
        return;
      }

      const payload: CreateProgramRequest = {
        branchId: data.branchId,
        name: data.name,
        level: data.level,
        totalSessions,
        defaultTuitionAmount,
        unitPriceSession,
        description: data.description,
      };

      const created = await createAdminProgram(payload);

      // Refresh lại toàn bộ danh sách để có branch name đầy đủ
      const branchId = getBranchQueryParam();
      const updatedCourses = await fetchAdminPrograms({ branchId });
      setCourses(updatedCourses);
      
      alert(`Đã tạo khóa học ${data.name} thành công!`);
    } catch (err: any) {
      console.error("Failed to create program:", err);
      alert(err?.message || "Không thể tạo khóa học. Vui lòng thử lại.");
    }
  };

  const handleOpenEditCourse = async (row: CourseRow) => {
    try {
      setIsEditModalOpen(true);
      setEditingProgramId(row.id);
      setEditingInitialData(null);

      const detail: any = await fetchAdminProgramDetail(row.id);

      const totalSessionsNum: number = detail?.totalSessions ?? 0;
      const defaultTuitionAmountNum: number = detail?.defaultTuitionAmount ?? 0;
      const unitPriceSessionNum: number = detail?.unitPriceSession ?? 0;

      const isActive: boolean | null = detail?.isActive ?? null;
      let status: CourseFormData["status"] = "Tạm dừng";
      if (isActive === true) status = "Đang hoạt động";

      const formData: CourseFormData = {
        name: String(detail?.name ?? row.name ?? ""),
        description: String(detail?.description ?? row.desc ?? ""),
        level: (String(detail?.level ?? row.level ?? "A1") as CourseFormData["level"]) || "A1",
        status,
        branchId: String(detail?.branchId ?? ""),
        totalSessions: totalSessionsNum ? String(totalSessionsNum) : "",
        defaultTuitionAmount: defaultTuitionAmountNum ? String(defaultTuitionAmountNum) : "",
        unitPriceSession: unitPriceSessionNum ? String(unitPriceSessionNum) : "",
      };

      setEditingInitialData(formData);
      setOriginalStatus(status);
    } catch (err: any) {
      console.error("Failed to load program detail for edit:", err);
      alert(err?.message || "Không thể tải thông tin chương trình để chỉnh sửa.");
      setIsEditModalOpen(false);
      setEditingProgramId(null);
      setEditingInitialData(null);
    }
  };

  const handleUpdateCourse = async (data: CourseFormData) => {
    if (!editingProgramId) return;
    try {
      const totalSessions = Number(data.totalSessions);
      const defaultTuitionAmount = Number(data.defaultTuitionAmount.replace(/,/g, ""));
      const unitPriceSession = Number(data.unitPriceSession.replace(/,/g, ""));

      if (!data.branchId) {
        alert("Vui lòng chọn chi nhánh");
        return;
      }

      const payload: CreateProgramRequest = {
        branchId: data.branchId,
        name: data.name,
        level: data.level,
        totalSessions,
        defaultTuitionAmount,
        unitPriceSession,
        description: data.description,
      };

      // Cập nhật thông tin khóa học
      await updateAdminProgram(editingProgramId, payload);

      // Nếu trạng thái thay đổi, gọi toggle-status API
      if (originalStatus && data.status !== originalStatus) {
        await toggleProgramStatus(editingProgramId);
      }

      // Refresh danh sách với branch filter hiện tại
      const branchId = getBranchQueryParam();
      const mapped = await fetchAdminPrograms({ branchId });
      setCourses(mapped);
      alert(`Đã cập nhật khóa học ${data.name} thành công!`);
    } catch (err: any) {
      console.error("Failed to update program:", err);
      alert(err?.message || "Không thể cập nhật khóa học. Vui lòng thử lại.");
    } finally {
      setEditingProgramId(null);
      setEditingInitialData(null);
      setOriginalStatus(null);
    }
  };

  const handleToggleStatus = async (row: CourseRow) => {
    try {
      const result = await toggleProgramStatus(row.id);
      
      // Cập nhật danh sách với branch filter hiện tại
      const branchId = getBranchQueryParam();
      const mapped = await fetchAdminPrograms({ branchId });
      setCourses(mapped);
      
      const newStatus = result?.data?.isActive ? "Đang hoạt động" : "Tạm dừng";
      alert(`Đã ${newStatus === "Đang hoạt động" ? "kích hoạt" : "tạm dừng"} khóa học ${row.name} thành công!`);
    } catch (err: any) {
      console.error("Failed to toggle program status:", err);
      alert(err?.message || "Không thể thay đổi trạng thái khóa học. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6 rounded-3xl">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg">
              <BookOpen className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Quản lý môn học
              </h1>
              <p className="text-sm text-gray-600">Quản lý chương trình học và khóa học</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Tạo khóa học mới
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-pink-100 grid place-items-center">
                <BookOpen className="text-pink-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng khóa học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
                <GraduationCap className="text-emerald-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đang hoạt động</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
                <Users className="text-amber-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng học viên</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-sky-100 grid place-items-center">
                <DollarSign className="text-sky-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Doanh thu/tháng</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.revenue}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Filter Indicator */}
        {selectedBranchId && (
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl">
            <Building2 size={16} className="text-pink-600" />
            <span className="text-sm text-pink-700 font-medium">
              Đang lọc theo chi nhánh đã chọn
            </span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-3xl min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" size={18} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Tìm kiếm khóa học..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={levelFilter}
                onChange={(e) => { setLevelFilter(e.target.value as typeof levelFilter); setPage(1); }}
                className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="ALL">Tất cả trình độ</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
                className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Tạm dừng">Tạm dừng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách khóa học</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{rows.length} khóa học</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
                <tr>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên khóa học</SortableHeader>
                  <SortableHeader field="level" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trình độ</SortableHeader>
                  <SortableHeader field="duration" currentField={sortField} direction={sortDirection} onSort={handleSort}>Thời lượng</SortableHeader>
                  <SortableHeader field="fee" currentField={sortField} direction={sortDirection} onSort={handleSort}>Học phí</SortableHeader>
                  <SortableHeader field="branch" currentField={sortField} direction={sortDirection} onSort={handleSort}>Chi nhánh</SortableHeader>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                  <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-pink-100">
                {pagedRows.length > 0 ? (
                  pagedRows.map((c) => (
                    <tr
                      key={c.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-3 px-6">
                        <div className="text-sm text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.desc}</div>
                      </td>

                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        <LevelBadge level={c.level} />
                      </td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="truncate">{c.duration}</span>
                        </div>
                      </td>

                      <td className="py-3 px-6 text-gray-900 text-sm whitespace-nowrap">{c.fee}</td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="truncate">{c.branch || "Chưa có"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        <StatusBadge value={c.status} />
                      </td>

                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Xem">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditCourse(c)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              c.status === "Đang hoạt động"
                                ? "hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                                : "hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
                            )}
                            title={c.status === "Đang hoạt động" ? "Tạm dừng" : "Kích hoạt"}
                          >
                            {c.status === "Đang hoạt động" ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                        <Search size={24} className="text-pink-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không tìm thấy khóa học</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo khóa học mới</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Pagination */}
          {rows.length > 0 && (
            <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                  {' '}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> khóa học
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    onClick={() => goPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <div className="text-sm font-semibold text-gray-900 px-3">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    onClick={() => goPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
        mode="create"
        initialData={null}
      />
      {/* Edit Course Modal */}
      <CreateCourseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProgramId(null);
          setEditingInitialData(null);
          setOriginalStatus(null);
        }}
        onSubmit={handleUpdateCourse}
        mode="edit"
        initialData={editingInitialData}
      />
    </>
  );
}