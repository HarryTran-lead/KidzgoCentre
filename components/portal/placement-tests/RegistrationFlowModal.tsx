"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Sparkles, ArrowRight, CheckCircle2, Loader2, School, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PlacementTest } from "@/types/placement-test";
import type { Program } from "@/types/admin/programs";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import {
  assignClassToRegistration,
  createRegistrationFromPlacementTest,
  suggestClassesForRegistration,
  upgradeRegistration,
} from "@/lib/api/registrationService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import { getActiveTuitionPlans } from "@/lib/api/tuitionPlanService";

interface RegistrationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
  branchId?: string;
  onSuccess?: () => void;
}

function toInputDateValue(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function RegistrationFlowModal({
  isOpen,
  onClose,
  test,
  branchId,
  onSuccess,
}: RegistrationFlowModalProps) {
  const { toast } = useToast();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const [programId, setProgramId] = useState("");
  const [tuitionPlanId, setTuitionPlanId] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [note, setNote] = useState("");

  const [registrationId, setRegistrationId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [suggestedClasses, setSuggestedClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [upgradeTuitionPlanId, setUpgradeTuitionPlanId] = useState("");

  const canCreate = Boolean(test?.studentProfileId) && Boolean(branchId) && Boolean(programId) && Boolean(tuitionPlanId);

  const filteredTuitionPlans = useMemo(() => {
    return tuitionPlans.filter((p) => {
      if (!p.isActive) return false;
      if (!programId) return true;
      return p.programId === programId;
    });
  }, [tuitionPlans, programId]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setIsBootstrapping(true);
        const [programItems, planItems] = await Promise.all([
          getAllProgramsForDropdown(),
          getActiveTuitionPlans(branchId),
        ]);

        const activePrograms = (programItems || []).filter((p) => p.isActive !== false);
        setPrograms(activePrograms);
        setTuitionPlans(planItems || []);

        const normalizedRecommendation = (test?.programRecommendation || "").trim().toLowerCase();
        const recommendedProgram = normalizedRecommendation
          ? activePrograms.find((p) => p.name.toLowerCase() === normalizedRecommendation)
          : undefined;

        const nextProgramId = recommendedProgram?.id || activePrograms[0]?.id || "";
        setProgramId(nextProgramId);

        const firstPlan = (planItems || []).find(
          (p) => p.isActive && p.programId === nextProgramId
        );
        setTuitionPlanId(firstPlan?.id || "");

        setExpectedStartDate(toInputDateValue(test?.scheduledAt));
        setPreferredSchedule("");
        setNote(`Đăng ký từ Placement Test #${test?.id || ""}`.trim());

        setRegistrationId("");
        setSuggestedClasses([]);
        setSelectedClassId("");
        setUpgradeTuitionPlanId("");
      } catch (error) {
        console.error("Error loading registration options:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu chương trình/gói học.",
          variant: "destructive",
        });
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadOptions();
  }, [isOpen, branchId, test?.id, test?.programRecommendation, test?.scheduledAt, toast]);

  useEffect(() => {
    if (!programId) {
      setTuitionPlanId("");
      return;
    }

    const match = tuitionPlans.find((p) => p.id === tuitionPlanId && p.programId === programId && p.isActive);
    if (!match) {
      const first = tuitionPlans.find((p) => p.programId === programId && p.isActive);
      setTuitionPlanId(first?.id || "");
    }
  }, [programId, tuitionPlanId, tuitionPlans]);

  const handleCreateRegistration = async () => {
    if (!test?.studentProfileId || !branchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Placement test chưa gắn Student Profile hoặc thiếu chi nhánh.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const { registrationId: createdId } = await createRegistrationFromPlacementTest({
        placementTestId: test.id,
        studentProfileId: test.studentProfileId,
        branchId,
        programId,
        tuitionPlanId,
        expectedStartDate: expectedStartDate || undefined,
        preferredSchedule: preferredSchedule || undefined,
        note: note || undefined,
      });

      setRegistrationId(createdId);
      toast({
        title: "Thành công",
        description: "Đã tạo đăng ký học viên. Tiếp tục gợi ý/xếp lớp.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tạo đăng ký.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestClasses = async () => {
    if (!registrationId) return;

    try {
      setIsSuggesting(true);
      const suggestions = await suggestClassesForRegistration(registrationId);
      setSuggestedClasses(suggestions || []);
      if (suggestions.length > 0) {
        setSelectedClassId(String(suggestions[0].id));
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lấy danh sách lớp gợi ý.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAssignClass = async () => {
    if (!registrationId || !selectedClassId) return;

    try {
      setIsAssigning(true);
      await assignClassToRegistration(registrationId, {
        classId: selectedClassId,
        entryType: "immediate",
      });
      toast({
        title: "Thành công",
        description: "Đã xếp lớp cho đăng ký.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể xếp lớp.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMoveToWaitingList = async () => {
    if (!registrationId) return;

    try {
      setIsWaiting(true);
      await assignClassToRegistration(registrationId, {
        entryType: "wait",
      });
      toast({
        title: "Thành công",
        description: "Đã chuyển đăng ký sang chờ xếp lớp.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể chuyển vào waiting list.",
        variant: "destructive",
      });
    } finally {
      setIsWaiting(false);
    }
  };

  const handleUpgrade = async () => {
    if (!registrationId || !upgradeTuitionPlanId) return;

    try {
      setIsUpgrading(true);
      await upgradeRegistration(registrationId, upgradeTuitionPlanId);
      toast({
        title: "Thành công",
        description: "Đã nâng cấp học vụ/gói học cho đăng ký.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể upgrade đăng ký.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-linear-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white">
          <div>
            <h2 className="text-xl font-bold">Luồng Đăng Ký Từ Placement Test</h2>
            <p className="text-sm text-white/85">
              Placement Test #{test?.id || "-"} • Học viên: {test?.studentName || test?.childName || "N/A"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/15" aria-label="Đóng">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {!test?.studentProfileId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Placement test này chưa có Student Profile. Vui lòng dùng chức năng "Tạo tài khoản & Profile" trước khi tạo đăng ký.
            </div>
          )}

          <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-white to-indigo-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <School size={18} className="text-indigo-600" />
              Bước 1: Tạo đăng ký học viên
            </div>

            {isBootstrapping ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải chương trình và gói học...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Student Profile ID</label>
                  <input
                    value={test?.studentProfileId || ""}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Chương trình</label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Chọn chương trình</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Gói học</label>
                  <select
                    value={tuitionPlanId}
                    onChange={(e) => setTuitionPlanId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Chọn gói học</option>
                    {filteredTuitionPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalSessions} buổi)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ngày dự kiến bắt đầu</label>
                  <input
                    type="date"
                    value={expectedStartDate}
                    onChange={(e) => setExpectedStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Lịch học mong muốn</label>
                  <input
                    value={preferredSchedule}
                    onChange={(e) => setPreferredSchedule(e.target.value)}
                    placeholder="VD: T3-T5-T7 18:00"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateRegistration}
                disabled={!canCreate || isCreating || isBootstrapping}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Tạo đăng ký
              </button>

              {registrationId && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /> registrationId: {registrationId}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-linear-to-br from-white to-sky-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <ArrowRight size={18} className="text-sky-600" />
              Bước 2: Gợi ý lớp phù hợp và xếp lớp
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSuggestClasses}
                disabled={!registrationId || isSuggesting}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <School size={14} />}
                Gợi ý lớp phù hợp
              </button>

              <button
                type="button"
                onClick={handleMoveToWaitingList}
                disabled={!registrationId || isWaiting}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWaiting ? "Đang xử lý..." : "Đưa vào waiting list"}
              </button>
            </div>

            {suggestedClasses.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {suggestedClasses.map((cls: any) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassId(String(cls.id))}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "border-sky-500 bg-sky-100"
                            : "border-sky-200 bg-white hover:bg-sky-50"
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">{cls.title || cls.code || cls.id}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          Còn chỗ: {cls.availableSlots ?? "-"} • Lịch: {cls.schedulePattern || "-"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAssignClass}
                  disabled={!selectedClassId || isAssigning}
                  className="rounded-xl bg-linear-to-r from-sky-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAssigning ? "Đang xếp lớp..." : "Xếp vào lớp đã chọn"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-violet-200 bg-linear-to-br from-white to-violet-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Rocket size={18} className="text-violet-600" />
              Bước 3: Học vụ phát sinh (Upgrade)
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Gói học mới</label>
                <select
                  value={upgradeTuitionPlanId}
                  onChange={(e) => setUpgradeTuitionPlanId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">Chọn gói để upgrade</option>
                  {filteredTuitionPlans
                    .filter((p) => p.id !== tuitionPlanId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalSessions} buổi)
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleUpgrade}
                disabled={!registrationId || !upgradeTuitionPlanId || isUpgrading}
                className="rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpgrading ? "Đang upgrade..." : "Upgrade"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
