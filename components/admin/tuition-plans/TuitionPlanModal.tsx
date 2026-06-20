"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, BookOpen, Clock, DollarSign, Layers, Wallet, X } from "lucide-react";
import { getProgramsForBranch, type ProgramOption } from "@/lib/api/tuitionPlanService";
import { getLevels } from "@/lib/api/academicProgressionService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import type { LevelDto } from "@/types/academic-progression";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export type TuitionPlanFormData = {
  branchId: string;
  programId: string;
  levelId: string;
  name: string;
  sessionCount: string;
  tuitionAmount: string;
  unitPriceSession: string;
  currency: string;
  status: "active" | "inactive";
};

type TuitionPlanStringField = keyof TuitionPlanFormData;

const initialFormData: TuitionPlanFormData = {
  branchId: "",
  programId: "",
  levelId: "",
  name: "",
  sessionCount: "",
  tuitionAmount: "",
  unitPriceSession: "",
  currency: "VND",
  status: "active",
};

function normalizeMoney(value: string) {
  return value.replace(/[^\d]/g, "");
}

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
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
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

    setFormData(
      mode === "edit" && initialData
        ? initialData
        : {
            ...initialFormData,
            branchId: defaultBranchId || "",
          },
    );
    setErrors({});
  }, [isOpen, mode, initialData, defaultBranchId]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPrograms() {
      try {
        setLoadingPrograms(true);
        const branchId = formData.branchId || defaultBranchId || undefined;
        const items = await getProgramsForBranch(branchId);
        setPrograms(items.filter((item) => item.isActive !== false));
      } catch {
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    }

    void loadPrograms();
  }, [isOpen, formData.branchId, defaultBranchId]);

  useEffect(() => {
    if (!isOpen || !formData.programId) {
      setLevels([]);
      return;
    }

    async function loadLevels() {
      try {
        setLoadingLevels(true);
        const res = await getLevels({ programId: formData.programId, isActive: true });
        setLevels(res.isSuccess ? res.data.items : []);
      } catch {
        setLevels([]);
      } finally {
        setLoadingLevels(false);
      }
    }

    void loadLevels();
  }, [isOpen, formData.programId]);

  useEffect(() => {
    const sessions = Number(formData.sessionCount);
    const tuition = Number(normalizeMoney(formData.tuitionAmount));

    if (sessions > 0 && tuition > 0 && Number.isFinite(sessions) && Number.isFinite(tuition)) {
      const next = String(Math.round(tuition / sessions));
      setFormData((prev) => (prev.unitPriceSession === next ? prev : { ...prev, unitPriceSession: next }));
      return;
    }

    setFormData((prev) => (prev.unitPriceSession ? { ...prev, unitPriceSession: "" } : prev));
  }, [formData.sessionCount, formData.tuitionAmount]);

  const clearError = (field: keyof TuitionPlanFormData) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChange = (field: TuitionPlanStringField, value: string) => {
    setFormData((prev) => {
      const next: TuitionPlanFormData = {
        ...prev,
        [field]: field === "tuitionAmount" ? normalizeMoney(value) : value,
      };

      if (field === "programId") {
        next.levelId = "";
      }

      return next;
    });
    clearError(field);
  };

  const validate = () => {
    const next: Partial<Record<keyof TuitionPlanFormData, string>> = {};
    const totalSessions = Number(formData.sessionCount);
    const tuitionAmount = Number(normalizeMoney(formData.tuitionAmount));
    const currency = formData.currency.trim();
    const name = formData.name.trim();

    if (!formData.programId) next.programId = "Chương trình học là bắt buộc";
    if (!formData.levelId) next.levelId = "Level là bắt buộc";
    if (!name) next.name = "Tên gói học là bắt buộc";
    if (name.length > 255) next.name = "Tên gói học tối đa 255 ký tự";
    if (!Number.isFinite(totalSessions) || totalSessions <= 0) {
      next.sessionCount = "Số buổi học phải lớn hơn 0";
    }
    if (!Number.isFinite(tuitionAmount) || tuitionAmount <= 0) {
      next.tuitionAmount = "Học phí phải lớn hơn 0";
    }
    if (!currency) next.currency = "Tiền tệ là bắt buộc";
    if (currency.length > 10) next.currency = "Tiền tệ tối đa 10 ký tự";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      name: formData.name.trim(),
      currency: formData.currency.trim(),
      tuitionAmount: normalizeMoney(formData.tuitionAmount),
    });
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
                <p className="text-sm text-red-100">Gói học phí độc lập theo chương trình và level</p>
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

        <form onSubmit={submit}>
          <div className="p-6 max-h-[76vh] overflow-y-auto space-y-5">
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
                    loadingPrograms ? "opacity-50 cursor-not-allowed" : "",
                  )}>
                    <SelectValue placeholder={loadingPrograms ? "Đang tải..." : "Chọn chương trình học"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Layers size={16} className="text-red-600" />
                  Level <span className="text-red-600">*</span>
                </label>
                <Select
                  value={formData.levelId}
                  onValueChange={(value) => handleChange("levelId", value)}
                  disabled={!formData.programId || loadingLevels}
                >
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.levelId ? "border-red-500" : "border-gray-200",
                    (!formData.programId || loadingLevels) ? "opacity-50 cursor-not-allowed" : "",
                  )}>
                    <SelectValue placeholder={loadingLevels ? "Đang tải..." : "Chọn level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <span className="font-mono font-bold text-red-700 mr-2">{level.code}</span>{level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.levelId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.levelId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Wallet size={16} className="text-red-600" />
                  Tên gói học <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  maxLength={255}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.name ? "border-red-500" : "border-gray-200",
                  )}
                  placeholder="VD: Gói 24 buổi"
                />
                {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
                  Số buổi học <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sessionCount}
                  onChange={(e) => handleChange("sessionCount", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.sessionCount ? "border-red-500" : "border-gray-200",
                  )}
                  placeholder="VD: 24"
                />
                {errors.sessionCount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.sessionCount}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Học phí <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tuitionAmount}
                  onChange={(e) => handleChange("tuitionAmount", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.tuitionAmount ? "border-red-500" : "border-gray-200",
                  )}
                  placeholder="VD: 7200000"
                />
                {errors.tuitionAmount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.tuitionAmount}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Giá mỗi buổi
                </label>
                <input
                  type="text"
                  value={formData.unitPriceSession ? Number(formData.unitPriceSession).toLocaleString("vi-VN") : ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                  placeholder="Tự động tính"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Tiền tệ <span className="text-red-600">*</span>
                </label>
                <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.currency ? "border-red-500" : "border-gray-200",
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

              {mode === "edit" && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Trạng thái</label>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      formData.status === "active"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200",
                    )}>
                      {formData.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleChange("status", formData.status === "active" ? "inactive" : "active")}
                      className={cn(
                        "relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer",
                        formData.status === "active"
                          ? "bg-gradient-to-r from-red-600 to-red-700"
                          : "bg-gray-300",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform",
                          formData.status === "active" ? "translate-x-9" : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-sm text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                {mode === "edit" ? "Lưu thay đổi" : "Tạo gói học"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
