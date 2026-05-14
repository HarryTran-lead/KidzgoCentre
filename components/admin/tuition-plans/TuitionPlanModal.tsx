"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, BookOpen, Clock, DollarSign, Wallet, X } from "lucide-react";
import { getProgramsForBranch, type ProgramOption } from "@/lib/api/tuitionPlanService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export type TuitionPlanFormData = {
  branchId: string;
  programId: string;
  name: string;
  totalSessions: string;
  tuitionAmount: string;
  unitPriceSession: string;
  currency: string;
  status: "Đang hoạt động" | "Tạm dừng";
};

const initialFormData: TuitionPlanFormData = {
  branchId: "",
  programId: "",
  name: "",
  totalSessions: "",
  tuitionAmount: "",
  unitPriceSession: "",
  currency: "VND",
  status: "Đang hoạt động",
};

export default function TuitionPlanModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  initialData,
  defaultBranchId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TuitionPlanFormData) => void;
  mode?: "create" | "edit";
  initialData?: TuitionPlanFormData | null;
  defaultBranchId?: string | null;
}) {
  const [formData, setFormData] = useState<TuitionPlanFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TuitionPlanFormData, string>>>({});
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
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
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        ...initialFormData,
        branchId: defaultBranchId || "",
      });
    }
    setErrors({});
  }, [isOpen, mode, initialData, defaultBranchId]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPrograms() {
      try {
        setLoadingPrograms(true);
        const branchId = formData.branchId || defaultBranchId || undefined;
        const items = await getProgramsForBranch(branchId);
        setPrograms(items.filter((x) => x.isActive !== false));
      } catch {
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    }

    loadPrograms();
  }, [isOpen, formData.branchId, defaultBranchId]);

  useEffect(() => {
    const sessions = Number(formData.totalSessions);
    const tuition = Number(formData.tuitionAmount.replace(/[^\d]/g, ""));

    if (sessions > 0 && tuition > 0 && !isNaN(sessions) && !isNaN(tuition)) {
      const pricePerSession = Math.round(tuition / sessions);
      const next = String(pricePerSession);
      setFormData((prev: TuitionPlanFormData) => (prev.unitPriceSession === next ? prev : { ...prev, unitPriceSession: next }));
    } else if (!formData.totalSessions || !formData.tuitionAmount) {
      setFormData((prev: TuitionPlanFormData) => (prev.unitPriceSession ? { ...prev, unitPriceSession: "" } : prev));
    }
  }, [formData.totalSessions, formData.tuitionAmount]);

  const handleChange = (field: keyof TuitionPlanFormData, value: string) => {
    setFormData((prev: TuitionPlanFormData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const next: Partial<Record<keyof TuitionPlanFormData, string>> = {};

    if (!formData.programId) next.programId = "Chương trình học là bắt buộc";
    if (!formData.name.trim()) next.name = "Tên gói học là bắt buộc";
    if (!formData.totalSessions || Number(formData.totalSessions) <= 0) next.totalSessions = "Số buổi học phải lớn hơn 0";
    if (!formData.tuitionAmount || Number(formData.tuitionAmount.replace(/[^\d]/g, "")) <= 0) next.tuitionAmount = "Học phí phải lớn hơn 0";
    if (!formData.unitPriceSession || Number(formData.unitPriceSession) <= 0) next.unitPriceSession = "Giá mỗi buổi không hợp lệ";
    if (!formData.currency.trim()) next.currency = "Loại tiền tệ là bắt buộc";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-red-600 to-red-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật gói học" : "Tạo gói học mới"}
                </h2>
                <p className="text-sm text-red-100">Nhập thông tin chi tiết gói học</p>
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

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-red-600" />
                  Chương trình học <span className="text-red-600">*</span>
                </label>
                <Select value={formData.programId} onValueChange={(value) => handleChange("programId", value)}>
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.programId ? "border-red-500" : "border-gray-200",
                    loadingPrograms ? "opacity-50 cursor-not-allowed" : ""
                  )}>
                    <SelectValue placeholder="Chọn chương trình học" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Wallet size={16} className="text-red-600" />
                  Tên gói học <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.name ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: Gói học 24 buổi"
                />
                {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
                  Số buổi học <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => handleChange("totalSessions", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.totalSessions ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: 24"
                />
                {errors.totalSessions && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.totalSessions}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Học phí <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tuitionAmount}
                  onChange={(e) => handleChange("tuitionAmount", e.target.value.replace(/[^\d]/g, ""))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.tuitionAmount ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: 3200000"
                />
                {errors.tuitionAmount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.tuitionAmount}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Giá mỗi buổi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unitPriceSession ? Number(formData.unitPriceSession).toLocaleString("vi-VN") : ""}
                  readOnly
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm text-gray-700 cursor-not-allowed",
                    errors.unitPriceSession ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Tự động tính"
                />
                {errors.unitPriceSession && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.unitPriceSession}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Tiền tệ <span className="text-red-600">*</span>
                </label>
                <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.currency ? "border-red-500" : "border-gray-200"
                  )}>
                    <SelectValue placeholder="Chọn tiền tệ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.currency}</p>}
              </div>
            </div>

            {mode === "edit" && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Trạng thái</label>
                <div className="flex items-center gap-3">
                  
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    formData.status === "Đang hoạt động"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  )}>
                    {formData.status === "Đang hoạt động" ? "Đang hoạt động" : "Tạm dừng"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChange("status", formData.status === "Đang hoạt động" ? "Tạm dừng" : "Đang hoạt động")}
                    className={cn(
                      "relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer",
                      formData.status === "Đang hoạt động"
                        ? "bg-gradient-to-r from-red-600 to-red-700"
                        : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform",
                        formData.status === "Đang hoạt động" ? "translate-x-9" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={submit}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-sm text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                {mode === "edit" ? "Lưu thay đổi" : "Tạo gói học"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
