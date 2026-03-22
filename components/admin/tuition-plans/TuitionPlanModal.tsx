"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, BookOpen, Building2, Clock, DollarSign, Wallet, X } from "lucide-react";
import { getAllBranches } from "@/lib/api/branchService";
import { getProgramsForBranch, type ProgramOption } from "@/lib/api/tuitionPlanService";

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
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TuitionPlanFormData) => void;
  mode?: "create" | "edit";
  initialData?: TuitionPlanFormData | null;
}) {
  const [formData, setFormData] = useState<TuitionPlanFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TuitionPlanFormData, string>>>({});
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
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
      setFormData(initialFormData);
    }
    setErrors({});
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadBranches() {
      try {
        setLoadingBranches(true);
        const res = await getAllBranches({ page: 1, limit: 100 });
        const items = res?.data?.branches ?? res?.data ?? [];
        setBranches(
          items
            .map((b: any) => ({
              id: String(b?.id ?? ""),
              name: String(b?.name ?? b?.code ?? "Chi nhánh"),
            }))
            .filter((b: { id: string }) => b.id)
        );
      } catch {
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    }

    loadBranches();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPrograms() {
      try {
        setLoadingPrograms(true);
        const items = await getProgramsForBranch(formData.branchId || undefined);
        setPrograms(items.filter((x) => x.isActive !== false));
      } catch {
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    }

    loadPrograms();
  }, [isOpen, formData.branchId]);

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

    if (!formData.branchId) next.branchId = "Chi nhánh là bắt buộc";
    if (!formData.programId) next.programId = "Khóa học là bắt buộc";
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
      <div ref={modalRef} className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
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
                <Building2 size={16} className="text-red-600" />
                Chi nhánh *
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => {
                  const value = e.target.value;
                    setFormData((prev: TuitionPlanFormData) => ({ ...prev, branchId: value, programId: "" }));
                  if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: undefined }));
                }}
                disabled={loadingBranches}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                  errors.branchId ? "border-red-500" : "border-gray-200",
                  loadingBranches ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <option value="">Chọn chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
                {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
              </div>

              <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-red-600" />
                Khóa học *
              </label>
              <select
                value={formData.programId}
                onChange={(e) => handleChange("programId", e.target.value)}
                disabled={loadingPrograms || !formData.branchId}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                  errors.programId ? "border-red-500" : "border-gray-200",
                  loadingPrograms || !formData.branchId ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <option value="">Chọn khóa học</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Wallet size={16} className="text-red-600" />
                Tên gói học *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                  errors.name ? "border-red-500" : "border-gray-200"
                )}
                placeholder="VD: Gói học 24 buổi"
              />
              {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
                  Số buổi học *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => handleChange("totalSessions", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.totalSessions ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: 24"
                />
                {errors.totalSessions && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.totalSessions}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Học phí *
                </label>
                <input
                  type="text"
                  value={formData.tuitionAmount}
                  onChange={(e) => handleChange("tuitionAmount", e.target.value.replace(/[^\d]/g, ""))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
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
                  Giá mỗi buổi *
                </label>
                <input
                  type="text"
                  value={formData.unitPriceSession ? Number(formData.unitPriceSession).toLocaleString("vi-VN") : ""}
                  readOnly
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-700 cursor-not-allowed",
                    errors.unitPriceSession ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Tự động tính"
                />
                {errors.unitPriceSession && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.unitPriceSession}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Tiền tệ *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.currency ? "border-red-500" : "border-gray-200"
                  )}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
                {errors.currency && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.currency}</p>}
              </div>
            </div>

            {mode === "edit" && (
              <div className="space-y-2 md:max-w-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value as TuitionPlanFormData["status"])}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Tạm dừng">Tạm dừng</option>
                </select>
              </div>
            )}
          </form>
        </div>

        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              {mode === "edit" ? "Lưu thay đổi" : "Tạo gói học"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
