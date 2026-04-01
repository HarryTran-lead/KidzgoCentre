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
  AlertCircle,
  FileText,
  Building2,
  Power,
  PowerOff
} from "lucide-react";
import {
  fetchAdminPrograms,
  createAdminProgram,
  fetchAdminProgramDetail,
  updateAdminProgram,
  toggleProgramStatus,
  normalizeIsActive,
  updateAdminProgramMonthlyLeaveLimit,
  extractProgramMonthlyLeaveLimit,
} from "@/app/api/admin/programs";
import type { CourseRow, CreateProgramRequest, ProgramDetail } from "@/types/admin/programs";
import { getAllBranches } from "@/lib/api/branchService";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";

/* -------------------------- helpers -------------------------- */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function parseDigitsToNumber(value: string) {
  return Number(value.replace(/[^\d]/g, ""));
}

function parseMonthlyLeaveLimitValue(value: string): number | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function formatNumberForInput(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value.toLocaleString("vi-VN")
    : "";
}

function getProgramTypeLabel(value: { isMakeup?: boolean | null; isSupplementary?: boolean | null }) {
  if (value.isMakeup) return "Bù";
  if (value.isSupplementary) return "Phụ trợ";
  return "Chính";
}

function getProgramTypeDetailLabel(value: { isMakeup?: boolean | null; isSupplementary?: boolean | null }) {
  if (value.isMakeup) return "Chương trình bù";
  if (value.isSupplementary) return "Chương trình phụ trợ";
  return "Chương trình chính";
}

function getProgramTypeBadgeClass(value: { isMakeup?: boolean | null; isSupplementary?: boolean | null }) {
  if (value.isMakeup) return "bg-blue-100 text-blue-700 border border-blue-200";
  if (value.isSupplementary) return "bg-violet-100 text-violet-700 border border-violet-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-green-100 text-green-700 border border-green-200",
    "Tạm dừng": "bg-gray-100 text-gray-700 border border-gray-200",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

type SortField = "id" | "name" | "duration" | "fee" | "status" | "branch";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 10;

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
    direction === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

/* ----------------------------- CREATE / EDIT COURSE MODAL ------------------------------ */
interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => Promise<boolean> | boolean;
  mode?: "create" | "edit";
  initialData?: CourseFormData | null;
}

interface CourseFormData {
  code?: string;
  name: string;
  description: string;
  status: string;
  isMakeup: boolean;
  isSupplementary: boolean;
  branchId: string;
  totalSessions: string;
  defaultTuitionAmount: string;
  unitPriceSession: string;
  monthlyLeaveLimit: string;
}

const initialFormData: CourseFormData = {
  code: "",
  name: "",
  description: "",
  status: "Đang hoạt động",
  isMakeup: false,
  isSupplementary: false,
  branchId: "",
  totalSessions: "",
  defaultTuitionAmount: "",
  unitPriceSession: "",
  monthlyLeaveLimit: "",
};

function CreateCourseModal({ isOpen, onClose, onSubmit, mode = "create", initialData }: CreateCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});
  const [branchOptions, setBranchOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submitting) return;

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
  }, [isOpen, onClose, submitting]);

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
    // Nếu đang ở chế độ edit và unitPriceSession đã có giá trị, chỉ tính toán khi người dùng thay đổi
    if (mode === "edit" && initialData) {
      const sessionsChanged = formData.totalSessions !== initialData.totalSessions;
      const tuitionChanged = formData.defaultTuitionAmount !== initialData.defaultTuitionAmount;

      // Nếu không có thay đổi và unitPriceSession đã có giá trị, giữ nguyên
      if (!sessionsChanged && !tuitionChanged && formData.unitPriceSession && formData.unitPriceSession.trim() !== "") {
        return;
      }
    }

    // Chỉ tính toán nếu có giá trị hợp lệ
    const sessions = Number(formData.totalSessions);
    // vi-VN thường dùng "." để phân tách hàng nghìn (vd: 200.000).
    // Vì vậy chỉ giữ lại chữ số để parse (hỗ trợ cả "." và "," hoặc khoảng trắng).
    const tuition = Number(formData.defaultTuitionAmount.replace(/[^\d]/g, ""));

    // Nếu cả hai giá trị đều hợp lệ, tính toán giá mỗi buổi
    if (sessions > 0 && tuition > 0 && !isNaN(sessions) && !isNaN(tuition)) {
      const pricePerSession = Math.round(tuition / sessions);
      const newValue = pricePerSession.toLocaleString("vi-VN");
      setFormData(prev => {
        // Chỉ cập nhật nếu giá trị thay đổi
        if (prev.unitPriceSession !== newValue) {
          return {
            ...prev,
            unitPriceSession: newValue
          };
        }
        return prev;
      });
    } else if (!formData.unitPriceSession || formData.unitPriceSession.trim() === "") {
      // Chỉ xóa nếu unitPriceSession đang trống và không thể tính toán
      if (formData.totalSessions === "" || formData.defaultTuitionAmount === "") {
        setFormData(prev => ({
          ...prev,
          unitPriceSession: ""
        }));
      }
    }
  }, [formData.totalSessions, formData.defaultTuitionAmount, mode, initialData]);

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
    if (formData.isMakeup && formData.isSupplementary) {
      newErrors.isSupplementary = "Chương trình không thể vừa là bù vừa là phụ trợ";
    }
    if (!formData.totalSessions.trim() || Number(formData.totalSessions) <= 0) {
      newErrors.totalSessions = "Số buổi học phải lớn hơn 0";
    }
    if (!formData.defaultTuitionAmount.trim() || Number(formData.defaultTuitionAmount.replace(/[^\d]/g, "")) <= 0) {
      newErrors.defaultTuitionAmount = "Học phí mặc định phải lớn hơn 0";
    }
    if (!formData.unitPriceSession.trim() || Number(formData.unitPriceSession.replace(/[^\d]/g, "")) <= 0) {
      newErrors.unitPriceSession = "Giá mỗi buổi phải lớn hơn 0";
    }

    if (
      formData.monthlyLeaveLimit.trim() &&
      (!Number.isInteger(Number(formData.monthlyLeaveLimit)) || Number(formData.monthlyLeaveLimit) <= 0)
    ) {
      newErrors.monthlyLeaveLimit = "Số buổi nghỉ tối đa / tháng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const isSuccess = await onSubmit(formData);
      if (isSuccess !== false) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if ((field === "isMakeup" || field === "isSupplementary") && errors.isSupplementary) {
      setErrors(prev => ({ ...prev, isSupplementary: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật chương trình" : "Tạo khóa học mới"}
                </h2>
                <p className="text-sm text-red-100">
                  {mode === "edit" ? "Chỉnh sửa thông tin chương trình học" : "Nhập thông tin chi tiết về khóa học mới"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
                <Building2 size={16} className="text-red-600" />
                Chi nhánh *
              </label>
              <div className="relative">
                <select
                  value={formData.branchId}
                  onChange={(e) => handleChange("branchId", e.target.value)}
                  disabled={loadingBranches}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.branchId ? "border-red-500" : "border-gray-200",
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
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
            </div>

            {/* Row 1: Tên khóa */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-red-600" />
                Tên khóa học *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.name ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: Tiếng Anh giao tiếp cơ bản"
                />
                {errors.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>

            {/* Row 2: Mô tả */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={16} className="text-red-600" />
                Mô tả khóa học *
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.description ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Mô tả chi tiết về khóa học..."
                />
                {errors.description && (
                  <div className="absolute right-3 top-3">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.description && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.description}</p>}
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-gray-800">Loại chương trình</div>
                  <p className="text-sm text-gray-600">
                    Chương trình chính là mặc định. Có thể đánh dấu phụ trợ hoặc bù, nhưng không được bật đồng thời cả hai.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                <label className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isSupplementary}
                    onChange={(e) => handleChange("isSupplementary", e.target.checked)}
                    className="h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-300"
                  />
                  <span>{formData.isSupplementary ? "Chương trình phụ trợ" : "Đánh dấu phụ trợ"}</span>
                </label>

                <label className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isMakeup}
                    onChange={(e) => handleChange("isMakeup", e.target.checked)}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-300"
                  />
                  <span>{formData.isMakeup ? "Chương trình bù" : "Chương trình thường"}</span>
                </label>
                </div>

                {errors.isSupplementary && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.isSupplementary}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Số buổi học, Học phí mặc định, Giá mỗi buổi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
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
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.totalSessions ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="VD: 24"
                  />
                  {errors.totalSessions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.totalSessions && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.totalSessions}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
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
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.defaultTuitionAmount ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="VD: 3000000"
                  />
                  {errors.defaultTuitionAmount && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.defaultTuitionAmount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.defaultTuitionAmount}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
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
                      errors.unitPriceSession ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="Tự động tính từ học phí mặc định / số buổi học"
                  />
                  {errors.unitPriceSession && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.unitPriceSession && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.unitPriceSession}</p>}
                <p className="text-xs text-gray-500">Tự động tính từ học phí mặc định chia cho số buổi học</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <AlertCircle size={16} className="text-amber-600" />
                    Số buổi nghỉ tối đa / tháng
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.monthlyLeaveLimit}
                      onChange={(e) => handleChange("monthlyLeaveLimit", e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                        "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                        errors.monthlyLeaveLimit ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="VD: 2"
                    />
                    {errors.monthlyLeaveLimit && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <AlertCircle size={18} className="text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.monthlyLeaveLimit && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.monthlyLeaveLimit}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-900">
                  <div className="font-semibold">Cấu hình leave request theo chương trình</div>
                  <p className="mt-1">
                    Khi tạo mới, để trống để dùng mặc định của hệ thống. Khi chỉnh sửa, để trống sẽ giữ nguyên
                    cấu hình hiện tại. Nếu bạn nhập giá trị, hệ thống sẽ lưu giới hạn này để áp dụng cho các lớp
                    được tạo mới từ chương trình đó.
                  </p>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "edit" ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo khóa học"}
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
  const { toast } = useToast();
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Đang hoạt động" | "Tạm dừng">("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<CourseFormData | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<ProgramDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [leaveLimitDraft, setLeaveLimitDraft] = useState("");
  const [isSavingLeaveLimit, setIsSavingLeaveLimit] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCourseDetail(null);
    setLeaveLimitDraft("");
    setIsSavingLeaveLimit(false);
  };

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

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
        [c.id, c.name, c.desc, c.fee, c.branch].some((x) => x?.toLowerCase().includes(kw))
      );

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: CourseRow) => {
          switch (sortField) {
            case "id": return c.id;
            case "name": return c.name;
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
  }, [q, sortField, sortDirection, courses, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const currentLeaveLimit = extractProgramMonthlyLeaveLimit(selectedCourseDetail);
  const leaveLimitValue = Number(leaveLimitDraft);
  const canSaveLeaveLimit =
    leaveLimitDraft.trim() !== "" &&
    Number.isInteger(leaveLimitValue) &&
    leaveLimitValue > 0 &&
    leaveLimitValue !== currentLeaveLimit &&
    !isSavingLeaveLimit;

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

  // Handle checkbox selection
  const handleSelectAll = () => {
    if (selectedCourses.length === pagedRows.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(pagedRows.map(c => c.id));
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleCreateCourse = async (data: CourseFormData): Promise<boolean> => {
    try {
      if (!data.branchId) {
        toast({
          title: "Thiếu thông tin",
          description: "Vui lòng chọn chi nhánh",
          type: "warning",
        });
        return false;
      }

      const totalSessions = Number(data.totalSessions);
      const defaultTuitionAmount = parseDigitsToNumber(data.defaultTuitionAmount);
      const unitPriceSession = parseDigitsToNumber(data.unitPriceSession);
      const hasMonthlyLeaveLimit = data.monthlyLeaveLimit.trim() !== "";
      const monthlyLeaveLimit = parseMonthlyLeaveLimitValue(data.monthlyLeaveLimit);

      if (Number.isNaN(totalSessions) || totalSessions <= 0) {
        toast({
          title: "Lỗi",
          description: "Số buổi học không hợp lệ",
          type: "warning",
        });
        return false;
      }

      if (Number.isNaN(defaultTuitionAmount) || defaultTuitionAmount <= 0) {
        toast({
          title: "Lỗi",
          description: "Học phí không hợp lệ",
          type: "warning",
        });
        return false;
      }

      if (Number.isNaN(unitPriceSession) || unitPriceSession <= 0) {
        toast({
          title: "Lỗi",
          description: "Học phí mỗi buổi không hợp lệ",
          type: "warning",
        });
        return false;
      }

      if (hasMonthlyLeaveLimit && monthlyLeaveLimit === null) {
        toast({
          title: "Giá trị chưa hợp lệ",
          description: "Số buổi nghỉ tối đa / tháng phải lớn hơn 0",
          type: "warning",
        });
        return false;
      }

      const code = data.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .substring(0, 20);

      if (data.isMakeup && data.isSupplementary) {
        toast({
          title: "Lỗi",
          description: "Chương trình không thể vừa là bù vừa là phụ trợ",
          type: "warning",
        });
        return false;
      }

      const payload: CreateProgramRequest = {
        branchId: data.branchId,
        name: data.name,
        code: code,
        totalSessions,
        defaultTuitionAmount,
        unitPriceSession,
        description: data.description,
        isMakeup: data.isMakeup,
        isSupplementary: data.isSupplementary,
      };

      const created = await createAdminProgram(payload);
      const warnings: string[] = [];

      if (hasMonthlyLeaveLimit) {
        if (!created.id) {
          warnings.push("chưa nhận được mã chương trình để lưu giới hạn nghỉ");
        } else {
          try {
            await updateAdminProgramMonthlyLeaveLimit(created.id, monthlyLeaveLimit!);
          } catch (leaveLimitError: any) {
            console.error("Failed to save monthly leave limit after create:", leaveLimitError);
            warnings.push(
              leaveLimitError?.message || "chưa lưu được số buổi nghỉ tối đa / tháng"
            );
          }
        }
      }

      try {
        const branchId = getBranchQueryParam();
        const mapped = await fetchAdminPrograms({ branchId });
        setCourses(mapped);
      } catch (refreshError) {
        console.warn("Failed to refresh programs after create:", refreshError);
        warnings.push("danh sách chương trình chưa được làm mới tự động");
      }

      toast({
        title: warnings.length > 0 ? "Đã tạo chương trình" : "Thành công",
        description:
          warnings.length > 0
            ? `Đã tạo khóa học ${data.name}, nhưng ${warnings.join("; ")}.`
            : `Đã tạo khóa học ${data.name} thành công!`,
        type: warnings.length > 0 ? "warning" : "success",
      });

      return true;
    } catch (err: any) {
      console.error("Failed to create program:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tạo khóa học. Vui lòng thử lại.",
        type: "destructive",
      });
      return false;
    }
  };

  const handleUpdateCourse = async (data: CourseFormData): Promise<boolean> => {
    if (!editingProgramId) return false;

    try {
      if (!data.branchId) {
        toast({
          title: "Thiếu thông tin",
          description: "Vui lòng chọn chi nhánh",
          type: "warning",
        });
        return false;
      }

      const totalSessions = Number(data.totalSessions);
      const defaultTuitionAmount = parseDigitsToNumber(data.defaultTuitionAmount);
      const unitPriceSession = parseDigitsToNumber(data.unitPriceSession);
      const hasMonthlyLeaveLimit = data.monthlyLeaveLimit.trim() !== "";
      const monthlyLeaveLimit = parseMonthlyLeaveLimitValue(data.monthlyLeaveLimit);
      const initialMonthlyLeaveLimit = parseMonthlyLeaveLimitValue(
        editingInitialData?.monthlyLeaveLimit ?? ""
      );

      if (Number.isNaN(totalSessions) || totalSessions <= 0) {
        toast({
          title: "Lỗi",
          description: "Số buổi học không hợp lệ",
          type: "warning",
        });
        return false;
      }

      if (Number.isNaN(defaultTuitionAmount) || defaultTuitionAmount <= 0) {
        toast({
          title: "Lỗi",
          description: "Học phí không hợp lệ",
          type: "warning",
        });
        return false;
      }

      if (Number.isNaN(unitPriceSession) || unitPriceSession <= 0) {
        toast({
          title: "Lỗi",
          description: "Học phí mỗi buổi không hợp lệ",
          type: "warning",
        });
        return false;
      }

      if (hasMonthlyLeaveLimit && monthlyLeaveLimit === null) {
        toast({
          title: "Giá trị chưa hợp lệ",
          description: "Số buổi nghỉ tối đa / tháng phải lớn hơn 0",
          type: "warning",
        });
        return false;
      }

      if (data.isMakeup && data.isSupplementary) {
        toast({
          title: "Lỗi",
          description: "Chương trình không thể vừa là bù vừa là phụ trợ",
          type: "warning",
        });
        return false;
      }

      const payload: CreateProgramRequest = {
        branchId: data.branchId,
        name: data.name,
        totalSessions,
        defaultTuitionAmount,
        unitPriceSession,
        description: data.description,
        isMakeup: data.isMakeup,
        isSupplementary: data.isSupplementary,
      };

      await updateAdminProgram(editingProgramId, payload);

      const warnings: string[] = [];

      if (originalStatus && data.status !== originalStatus) {
        try {
          await toggleProgramStatus(editingProgramId);
        } catch (toggleError: any) {
          console.error("Failed to toggle program status after update:", toggleError);
          warnings.push(toggleError?.message || "chưa cập nhật được trạng thái chương trình");
        }
      }

      if (
        hasMonthlyLeaveLimit &&
        monthlyLeaveLimit !== null &&
        monthlyLeaveLimit !== initialMonthlyLeaveLimit
      ) {
        try {
          await updateAdminProgramMonthlyLeaveLimit(editingProgramId, monthlyLeaveLimit);
        } catch (leaveLimitError: any) {
          console.error("Failed to save monthly leave limit after update:", leaveLimitError);
          warnings.push(
            leaveLimitError?.message || "chưa lưu được số buổi nghỉ tối đa / tháng"
          );
        }
      }

      try {
        const branchId = getBranchQueryParam();
        const mapped = await fetchAdminPrograms({ branchId });
        setCourses(mapped);
      } catch (refreshError) {
        console.warn("Failed to refresh programs after update:", refreshError);
        warnings.push("danh sách chương trình chưa được làm mới tự động");
      }

      toast({
        title: warnings.length > 0 ? "Đã cập nhật chương trình" : "Thành công",
        description:
          warnings.length > 0
            ? `Đã cập nhật khóa học ${data.name}, nhưng ${warnings.join("; ")}.`
            : `Đã cập nhật khóa học ${data.name} thành công!`,
        type: warnings.length > 0 ? "warning" : "success",
      });

      return true;
    } catch (err: any) {
      console.error("Failed to update program:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể cập nhật khóa học. Vui lòng thử lại.",
        type: "destructive",
      });
      return false;
    }
  };

  const handleToggleStatus = (row: CourseRow) => {
    setSelectedCourse(row);
    setShowToggleStatusModal(true);
  };

  const handleOpenEditCourse = async (row: CourseRow) => {
    try {
      const detail = await fetchAdminProgramDetail(row.id);
      const currentLeaveLimit = extractProgramMonthlyLeaveLimit(detail);
      const normalizedStatus = normalizeIsActive(detail.isActive ?? detail.status);
      const nextStatus =
        normalizedStatus === true
          ? "Đang hoạt động"
          : normalizedStatus === false
            ? "Tạm dừng"
            : row.status;

      const nextInitialData: CourseFormData = {
        name: String(detail.name ?? row.name),
        description: detail.description ?? row.desc ?? "",
        status: nextStatus,
        branchId: String(detail.branchId ?? detail.branch?.id ?? ""),
        isMakeup: typeof detail.isMakeup === "boolean" ? detail.isMakeup : !!row.isMakeup,
        isSupplementary:
          typeof detail.isSupplementary === "boolean"
            ? detail.isSupplementary
            : !!row.isSupplementary,
        totalSessions:
          typeof detail.totalSessions === "number" && detail.totalSessions > 0
            ? String(detail.totalSessions)
            : row.duration.replace(/[^0-9]/g, ""),
        defaultTuitionAmount:
          formatNumberForInput(detail.defaultTuitionAmount) ||
          row.fee.replace(/[^0-9]/g, ""),
        unitPriceSession: formatNumberForInput(detail.unitPriceSession),
        monthlyLeaveLimit:
          currentLeaveLimit !== null ? String(currentLeaveLimit) : "",
      };

      setEditingProgramId(row.id);
      setEditingInitialData(nextInitialData);
      setOriginalStatus(nextInitialData.status);
      setIsEditModalOpen(true);
    } catch (err: any) {
      console.error("Failed to load program detail for edit:", err);
      toast({
        title: "Không thể mở form chỉnh sửa",
        description:
          err?.message || "Không thể tải đủ thông tin chương trình để chỉnh sửa.",
        type: "destructive",
      });
    }
  };

  const handleViewDetail = async (row: CourseRow) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      setSelectedCourseDetail(null);
      setLeaveLimitDraft("");

      const detail = await fetchAdminProgramDetail(row.id);
      setSelectedCourseDetail(detail);
      const limit = extractProgramMonthlyLeaveLimit(detail);
      setLeaveLimitDraft(limit !== null ? String(limit) : "");
    } catch (err: any) {
      console.error("Failed to load program detail:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tải thông tin chi tiết khóa học.",
        type: "destructive",
      });
      closeDetailModal();
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveMonthlyLeaveLimit = async () => {
    if (!selectedCourseDetail?.id) return;

    const maxLeavesPerMonth = Number(leaveLimitDraft);
    if (!Number.isInteger(maxLeavesPerMonth) || maxLeavesPerMonth <= 0) {
      toast({
        title: "Giá trị chưa hợp lệ",
        description: "Số buổi nghỉ tối đa trong tháng phải lớn hơn 0.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSavingLeaveLimit(true);

      const updated = await updateAdminProgramMonthlyLeaveLimit(
        selectedCourseDetail.id,
        maxLeavesPerMonth
      );

      let refreshedDetail: ProgramDetail | null = null;
      try {
        refreshedDetail = await fetchAdminProgramDetail(selectedCourseDetail.id);
      } catch (refreshError) {
        console.warn("Failed to refresh program detail after leave limit update:", refreshError);
      }

      const nextLimit =
        extractProgramMonthlyLeaveLimit(refreshedDetail) ??
        updated.maxLeavesPerMonth ??
        maxLeavesPerMonth;

      const baseDetail = refreshedDetail ?? selectedCourseDetail;
      setSelectedCourseDetail({
        ...baseDetail,
        maxLeavesPerMonth: nextLimit,
        monthlyLeaveLimit: nextLimit,
        programLeavePolicy: {
          ...(baseDetail.programLeavePolicy ?? {}),
          maxLeavesPerMonth: nextLimit,
        },
      });
      setLeaveLimitDraft(String(nextLimit));

      toast({
        title: "Đã cập nhật giới hạn nghỉ",
        description:
          "Chỉ các lớp được tạo mới sau thay đổi này mới nhận giới hạn nghỉ mới.",
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to update monthly leave limit:", err);
      toast({
        title: "Không thể cập nhật",
        description:
          err?.message ||
          "Không thể lưu số buổi nghỉ tối đa theo tháng cho chương trình này.",
        type: "destructive",
      });
    } finally {
      setIsSavingLeaveLimit(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!selectedCourse) return;

    // Xác định trạng thái mới dựa trên trạng thái hiện tại
    const currentStatus = selectedCourse.status;
    const newStatus = currentStatus === "Đang hoạt động" ? "Tạm dừng" : "Đang hoạt động";
    const actionText = newStatus === "Đang hoạt động" ? "kích hoạt" : "tạm dừng";

    try {
      setIsTogglingStatus(true);
      await toggleProgramStatus(selectedCourse.id);

      // Cập nhật danh sách với branch filter hiện tại
      const branchId = getBranchQueryParam();
      const mapped = await fetchAdminPrograms({ branchId });
      setCourses(mapped);

      toast({
        title: "Thành công",
        description: `Đã ${actionText} khóa học "${selectedCourse.name}" thành công!`,
        type: "success",
      });

      setShowToggleStatusModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      console.error("Failed to toggle program status:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể thay đổi trạng thái khóa học. Vui lòng thử lại.",
        type: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        {/* Title */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <BookOpen className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Quản lý chương trình học
              </h1>
              <p className="text-sm text-gray-600">Quản lý chương trình học và khóa học</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Tạo khóa học mới
          </button>
        </div>

        {/* Stats cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <BookOpen className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng khóa học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <GraduationCap className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đang hoạt động</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gray-100 grid place-items-center">
                <Users className="text-gray-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng học viên</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-black/10 grid place-items-center">
                <DollarSign className="text-gray-800" size={18} />
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
          <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl transition-all duration-700 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Building2 size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Đang lọc theo chi nhánh đã chọn
            </span>
          </div>
        )}

        {/* Search & Filters */}
        <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-3xl min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Tìm kiếm khóa học..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Tạm dừng">Tạm dừng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách khóa học</h2>
                {selectedCourses.length > 0 && (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {selectedCourses.length} đã chọn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{rows.length} khóa học</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={pagedRows.length > 0 && selectedCourses.length === pagedRows.length}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                    />
                  </th>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên khóa học</SortableHeader>
                  <SortableHeader field="duration" currentField={sortField} direction={sortDirection} onSort={handleSort}>Thời lượng</SortableHeader>
                  <SortableHeader field="fee" currentField={sortField} direction={sortDirection} onSort={handleSort}>Học phí</SortableHeader>
                  <SortableHeader field="branch" currentField={sortField} direction={sortDirection} onSort={handleSort}>Chi nhánh</SortableHeader>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                  <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pagedRows.length > 0 ? (
                  pagedRows.map((c) => (
                    <tr
                      key={c.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(c.id)}
                          onChange={() => handleSelectCourse(c.id)}
                          className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm text-gray-900 truncate">{c.name}</div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              getProgramTypeBadgeClass(c)
                            )}
                          >
                            {getProgramTypeLabel(c)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{c.desc}</div>
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
                          <button
                            onClick={() => handleViewDetail(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditCourse(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              c.status === "Đang hoạt động"
                                ? "hover:bg-gray-100 text-gray-400 hover:text-gray-800"
                                : "hover:bg-red-50 text-gray-400 hover:text-red-600"
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
                    <td colSpan={9} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <Search size={24} className="text-gray-400" />
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
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                  {' '}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> khóa học
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = [];
                      const maxVisible = 7;

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        if (currentPage <= 3) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push("...");
                          for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push("...");
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof p === "number" && goPage(p)}
                          disabled={p === "..."}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${p === currentPage
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                              : p === "..."
                                ? "cursor-default text-gray-400"
                                : "border border-red-200 hover:bg-red-50 text-gray-700"
                            }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => goPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
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

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={showToggleStatusModal}
        onClose={() => {
          setShowToggleStatusModal(false);
          setSelectedCourse(null);
        }}
        onConfirm={confirmToggleStatus}
        title={selectedCourse?.status === "Đang hoạt động" ? "Xác nhận tạm dừng khóa học" : "Xác nhận kích hoạt khóa học"}
        message={
          selectedCourse?.status === "Đang hoạt động"
            ? `Bạn có chắc chắn muốn tạm dừng khóa học "${selectedCourse?.name}"? Khóa học sẽ không còn hoạt động sau khi tạm dừng.`
            : `Bạn có chắc chắn muốn kích hoạt khóa học "${selectedCourse?.name}"? Khóa học sẽ được kích hoạt và có thể sử dụng ngay.`
        }
        confirmText={selectedCourse?.status === "Đang hoạt động" ? "Tạm dừng" : "Kích hoạt"}
        cancelText="Hủy"
        variant={selectedCourse?.status === "Đang hoạt động" ? "warning" : "success"}
        isLoading={isTogglingStatus}
      />

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết khóa học</h2>
                    <p className="text-sm text-red-100">Thông tin chi tiết về khóa học</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeDetailModal();
                  }}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : selectedCourseDetail ? (
                <div className="space-y-6">
                  {/* Tên khóa học */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BookOpen size={16} className="text-red-600" />
                      Tên khóa học
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      {selectedCourseDetail.name || "Chưa có thông tin"}
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText size={16} className="text-red-600" />
                      Mô tả khóa học
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 min-h-[80px]">
                      {selectedCourseDetail.description || "Chưa có mô tả"}
                    </div>
                  </div>

                  {/* Grid: Số buổi, Học phí, Giá mỗi buổi */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-amber-900">
                          Giới hạn nghỉ ngắn ngày theo tháng
                        </h3>
                        <p className="text-sm text-amber-800">
                          Cấu hình này dùng cho leave request theo chương trình. Khi bạn đổi số buổi nghỉ, chỉ các lớp tạo mới từ chương trình này mới áp dụng, còn các lớp đã tạo trước đó sẽ giữ giới hạn cũ.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Giới hạn hiện tại
                        </label>
                        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-white text-gray-900">
                          {currentLeaveLimit !== null ? `${currentLeaveLimit} buổi / tháng` : "Chưa cấu hình"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Số buổi nghỉ tối đa / tháng
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={leaveLimitDraft}
                          onChange={(e) => setLeaveLimitDraft(e.target.value)}
                          placeholder="VD: 3"
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleSaveMonthlyLeaveLimit}
                          disabled={!canSaveLeaveLimit}
                          className={cn(
                            "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all md:w-auto",
                            canSaveLeaveLimit
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/25 cursor-pointer"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          {isSavingLeaveLimit ? "Đang lưu..." : "Lưu giới hạn"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={16} className="text-red-600" />
                        Số buổi học
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.totalSessions ? `${selectedCourseDetail.totalSessions} buổi` : "Chưa có thông tin"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DollarSign size={16} className="text-red-600" />
                        Học phí mặc định
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.defaultTuitionAmount
                          ? `${selectedCourseDetail.defaultTuitionAmount.toLocaleString("vi-VN")} VND`
                          : "Chưa có thông tin"}
                      </div>
                    </div>
                  </div>

                  {/* Grid: Giá mỗi buổi, Chi nhánh, Loại chương trình, Trạng thái */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DollarSign size={16} className="text-red-600" />
                        Giá mỗi buổi
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.unitPriceSession
                          ? `${selectedCourseDetail.unitPriceSession.toLocaleString("vi-VN")} VND`
                          : "Chưa có thông tin"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 size={16} className="text-red-600" />
                        Chi nhánh
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.branchName || selectedCourseDetail.branch?.name || "Chưa có chi nhánh"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <GraduationCap size={16} className="text-red-600" />
                        Loại chương trình
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {getProgramTypeDetailLabel(selectedCourseDetail)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <BookOpen size={16} className="text-red-600" />
                        Trạng thái
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                        <StatusBadge value={normalizeIsActive(selectedCourseDetail?.isActive ?? selectedCourseDetail?.status) === true ? "Đang hoạt động" : "Tạm dừng"} />
                      </div>
                    </div>
                  </div>

                  {selectedCourseDetail.defaultMakeupClassId ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                      <div className="font-semibold">Default makeup class</div>
                      <p className="mt-1 break-all">
                        {selectedCourseDetail.defaultMakeupClassId}
                      </p>
                    </div>
                  ) : null}


                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Không có dữ liệu để hiển thị
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    closeDetailModal();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
