"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, User } from "lucide-react";
import type {
  PlacementTest,
  CreatePlacementTestRequest,
  UpdatePlacementTestRequest,
  PlacementTestRetakeRequest,
} from "@/types/placement-test";

type PlacementTestModalMode = "create" | "retake";

export type PlacementTestFormSubmitPayload =
  | { action: "create"; data: CreatePlacementTestRequest }
  | { action: "update"; data: UpdatePlacementTestRequest }
  | {
      action: "retake";
      originalPlacementTestId: string;
      data: PlacementTestRetakeRequest;
    };

type BranchOption = {
  id: string;
  name: string;
  isActive?: boolean;
};

type ProgramOption = {
  id: string;
  name: string;
  branchId?: string;
  isActive?: boolean;
};

type TuitionPlanOption = {
  id: string;
  name: string;
  programId: string;
  branchId?: string;
  isActive?: boolean;
};

interface PlacementTestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  test?: PlacementTest | null;
  defaultMode?: PlacementTestModalMode;
  allowModeSwitch?: boolean;
  retakeSourceTestId?: string;
  onSubmit?: (payload: PlacementTestFormSubmitPayload) => Promise<void>;
  placementTests?: PlacementTest[];
  leads?: Array<{ id: string; contactName: string; children?: Array<{ id: string; name: string }> }>;
  studentProfiles?: Array<{ id: string; fullName: string; branchId?: string; profileType?: string }>;
  classes?: Array<{ id: string; className: string }>;
  invigilators?: Array<{ id: string; fullName: string; role: string }>; // Admin + ManagementStaff
  branches?: BranchOption[];
  programs?: ProgramOption[];
  tuitionPlans?: TuitionPlanOption[];
  defaultBranchId?: string;
}

export default function PlacementTestFormModal({
  isOpen,
  onClose,
  onSuccess,
  test,
  defaultMode = "create",
  allowModeSwitch = false,
  retakeSourceTestId = "",
  onSubmit,
  placementTests = [],
  leads = [],
  studentProfiles = [],
  classes = [],
  invigilators = [],
  branches = [],
  programs = [],
  tuitionPlans = [],
  defaultBranchId = "",
}: PlacementTestFormModalProps) {
  const [mode, setMode] = useState<PlacementTestModalMode>("create");
  const [formData, setFormData] = useState({
    leadId: test?.leadId || "",
    leadChildId: test?.leadChildId || "",
    scheduledAt: test?.scheduledAt ? (() => {
      const d = new Date(test.scheduledAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    })() : "",
    room: test?.room || "",
    invigilatorUserId: test?.invigilatorUserId || "",
    originalPlacementTestId: "",
    retakeStudentProfileId: "",
    retakeBranchId: defaultBranchId,
    retakeProgramId: "",
    retakeTuitionPlanId: "",
    retakeNote: "",
    notes: test?.notes || "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLead, setSelectedLead] = useState(test?.leadId || "");
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);

  const effectiveRetakeBranchId = defaultBranchId || formData.retakeBranchId;

  const filteredPrograms = programs.filter((program) => {
    if (program.isActive === false) return false;
    if (!effectiveRetakeBranchId) return true;
    return !program.branchId || program.branchId === effectiveRetakeBranchId;
  });

  const filteredTuitionPlans = tuitionPlans.filter((plan) => {
    if (plan.isActive === false) return false;
    if (formData.retakeProgramId && plan.programId !== formData.retakeProgramId) {
      return false;
    }
    if (effectiveRetakeBranchId && plan.branchId && plan.branchId !== effectiveRetakeBranchId) {
      return false;
    }
    return true;
  });

  const filteredStudentProfiles = studentProfiles.filter((profile) => {
    const profileType = String(profile.profileType || "").toLowerCase();
    const branchId = String(profile.branchId || "");
    const branchMatched = !effectiveRetakeBranchId || !branchId || branchId === effectiveRetakeBranchId;
    const typeMatched = !profileType || profileType === "student";
    return branchMatched && typeMatched;
  });

  const inferredRetakeStudentProfileId =
    placementTests.find((item) => item.id === retakeSourceTestId)?.studentProfileId || "";

  useEffect(() => {
    if (!isOpen) return;

    const selectedMode: PlacementTestModalMode = test ? "create" : defaultMode;
    setMode(selectedMode);
    setSelectedLead(test?.leadId || "");
    setChildren([]);
    setFormError("");

    setFormData({
      leadId: test?.leadId || "",
      leadChildId: test?.leadChildId || "",
      scheduledAt: test?.scheduledAt
        ? (() => {
            const d = new Date(test.scheduledAt);
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          })()
        : "",
      room: test?.room || "",
      invigilatorUserId: test?.invigilatorUserId || "",
      originalPlacementTestId: retakeSourceTestId || "",
      retakeStudentProfileId: inferredRetakeStudentProfileId,
      retakeBranchId: defaultBranchId,
      retakeProgramId: "",
      retakeTuitionPlanId: "",
      retakeNote: "",
      notes: test?.notes || "",
    });
  }, [isOpen, test, defaultBranchId, defaultMode, retakeSourceTestId, inferredRetakeStudentProfileId]);

  useEffect(() => {
    if (!formData.originalPlacementTestId) return;
    const original = placementTests.find((item) => item.id === formData.originalPlacementTestId);
    if (!original?.studentProfileId) return;

    setFormData((prev) => ({
      ...prev,
      retakeStudentProfileId: prev.retakeStudentProfileId || original.studentProfileId || "",
    }));
  }, [formData.originalPlacementTestId, placementTests]);

  useEffect(() => {
    if (!formData.retakeProgramId) return;
    const matched = filteredTuitionPlans.some((plan) => plan.id === formData.retakeTuitionPlanId);
    if (!matched) {
      const firstPlan = filteredTuitionPlans[0]?.id || "";
      setFormData((prev) => ({ ...prev, retakeTuitionPlanId: firstPlan }));
    }
  }, [filteredTuitionPlans, formData.retakeProgramId, formData.retakeTuitionPlanId]);

  useEffect(() => {
    if (!formData.retakeStudentProfileId) return;
    const exists = filteredStudentProfiles.some((p) => p.id === formData.retakeStudentProfileId);
    if (!exists) {
      setFormData((prev) => ({ ...prev, retakeStudentProfileId: "" }));
    }
  }, [filteredStudentProfiles, formData.retakeStudentProfileId]);

  const handleLeadChange = (leadId: string) => {
    setSelectedLead(leadId);
    const lead = leads.find(l => l.id === leadId);
    setChildren(lead?.children || []);
    setFormData(prev => ({ ...prev, leadId, leadChildId: "" }));
    setFormError("");
  };

  const toIsoWithTimezone = (value: string): string => {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const abs = Math.abs(offset);
    return `${value}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    const isEditMode = Boolean(test);
    const requiresScheduledAt = mode === "create" || isEditMode;

    if (requiresScheduledAt && !formData.scheduledAt) {
      setFormError("Vui lòng chọn thời gian test");
      return;
    }

    if (!isEditMode && mode === "create") {
      if (!formData.leadId || !formData.leadChildId) {
        setFormError("Vui lòng chọn lead và tên bé");
        return;
      }

      if (!formData.invigilatorUserId) {
        setFormError("Vui lòng chọn người giám sát");
        return;
      }
    }

    if (!isEditMode && mode === "retake") {
      if (!formData.originalPlacementTestId) {
        setFormError("Vui lòng chọn Retake từ thao tác của placement test đã hoàn thành");
        return;
      }
      if (!formData.retakeStudentProfileId) {
        setFormError("Vui lòng chọn hồ sơ học viên");
        return;
      }
      if (!formData.retakeProgramId) {
        setFormError("Vui lòng chọn chương trình mới");
        return;
      }
      if (!formData.retakeTuitionPlanId) {
        setFormError("Vui lòng chọn tuition plan mới");
        return;
      }
      if (!effectiveRetakeBranchId) {
        setFormError("Không xác định được chi nhánh của tài khoản");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        if (isEditMode) {
          const payload: UpdatePlacementTestRequest = {
            scheduledAt: formData.scheduledAt ? toIsoWithTimezone(formData.scheduledAt) : undefined,
            room: formData.room,
            invigilatorUserId: formData.invigilatorUserId || undefined,
            notes: formData.notes,
          };

          await onSubmit({ action: "update", data: payload });
        } else if (mode === "create") {
          const payload: CreatePlacementTestRequest = {
            leadId: formData.leadId,
            leadChildId: formData.leadChildId,
            scheduledAt: toIsoWithTimezone(formData.scheduledAt),
            room: formData.room || undefined,
            invigilatorUserId: formData.invigilatorUserId,
          };

          await onSubmit({ action: "create", data: payload });
        } else {
          const payload: PlacementTestRetakeRequest = {
            studentProfileId: formData.retakeStudentProfileId,
            newProgramId: formData.retakeProgramId,
            newTuitionPlanId: formData.retakeTuitionPlanId,
            branchId: effectiveRetakeBranchId,
            scheduledAt: formData.scheduledAt ? toIsoWithTimezone(formData.scheduledAt) : undefined,
            room: formData.room || undefined,
            invigilatorUserId: formData.invigilatorUserId || undefined,
            note: formData.retakeNote || undefined,
          };

          await onSubmit({
            action: "retake",
            originalPlacementTestId: formData.originalPlacementTestId,
            data: payload,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError(error instanceof Error ? error.message : "Không thể lưu placement test");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {test ? "Chỉnh sửa Placement Test" : mode === "create" ? "Tạo Placement Test mới" : "Tạo Placement Test Retake"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!test && allowModeSwitch && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-red-200 p-1 bg-red-50/50">
              <button
                type="button"
                onClick={() => {
                  setMode("create");
                  setFormError("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === "create"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 hover:bg-red-100"
                }`}
              >
                Tạo mới
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!retakeSourceTestId) {
                    setFormError("Vui lòng chọn Retake từ thao tác của placement test đã hoàn thành");
                    return;
                  }
                  setMode("retake");
                  setFormData((prev) => ({
                    ...prev,
                    retakeBranchId: defaultBranchId || prev.retakeBranchId,
                  }));
                  setFormError("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === "retake"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 hover:bg-red-100"
                }`}
              >
                Retake
              </button>
            </div>
          )}

          {/* Lead Selection (only for create) */}
          {!test && mode === "create" && (
            <>
              <div className="space-y-2">
                <label htmlFor="leadId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Lead id
                </label>
                <select
                  id="leadId"
                  value={formData.leadId}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn lead</option>
                  {leads.length === 0 ? (
                    <option disabled>Không có lead nào</option>
                  ) : (
                    leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.contactName} ({lead.children?.length || 0} bé)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="leadChildId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Tên bé *
                </label>
                <select
                  id="leadChildId"
                  value={formData.leadChildId}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadChildId: e.target.value }))}
                  disabled={!selectedLead || children.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="">
                    {!selectedLead ? "Vui lòng chọn lead trước" : children.length === 0 ? "Lead này chưa có thông tin bé" : "Chọn bé"}
                  </option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!test && mode === "retake" && (
            <>
              <div className="space-y-2">
                <label htmlFor="retakeStudentProfileId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Hồ sơ học viên *
                </label>
                <select
                  id="retakeStudentProfileId"
                  value={formData.retakeStudentProfileId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, retakeStudentProfileId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn hồ sơ học viên</option>
                  {filteredStudentProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="retakeProgramId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Chương trình mới *
                </label>
                <select
                  id="retakeProgramId"
                  value={formData.retakeProgramId}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const nextProgramId = e.target.value;
                      const nextPlans = tuitionPlans.filter((plan) => {
                        if (plan.isActive === false) return false;
                        if (plan.programId !== nextProgramId) return false;
                        if (effectiveRetakeBranchId && plan.branchId && plan.branchId !== effectiveRetakeBranchId) {
                          return false;
                        }
                        return true;
                      });

                      return {
                        ...prev,
                        retakeProgramId: nextProgramId,
                        retakeTuitionPlanId: nextPlans[0]?.id || "",
                      };
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn chương trình mới</option>
                  {filteredPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="retakeTuitionPlanId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Gói học mới *
                </label>
                <select
                  id="retakeTuitionPlanId"
                  value={formData.retakeTuitionPlanId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, retakeTuitionPlanId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn gói học mới</option>
                  {filteredTuitionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Scheduled Time */}
          <div className="space-y-2">
            <label htmlFor="scheduledAt" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar size={16} />
              {mode === "retake" && !test ? "Thời gian test (optional)" : "Thời gian test *"}
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              required={mode === "create" || Boolean(test)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            />
          </div>

          {/* Room */}
          <div className="space-y-2">
            <label htmlFor="room" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin size={16} />
              Phòng test
            </label>
            <select
              id="room"
              value={formData.room}
              onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            >
              <option value="">Chọn phòng test</option>
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.className}>
                  {classroom.className}
                </option>
              ))}
            </select>
          </div>

          {/* Invigilator */}
          <div className="space-y-2">
            <label htmlFor="invigilatorUserId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User size={16} />
              {mode === "retake" && !test ? "Người giám sát (optional)" : "Người giám sát *"}
            </label>
            <select
              id="invigilatorUserId"
              value={formData.invigilatorUserId}
              onChange={(e) => setFormData(prev => ({ ...prev, invigilatorUserId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            >
              <option value="">Chọn người giám sát</option>
              {invigilators.map((invigilator) => (
                <option key={invigilator.id} value={invigilator.id}>
                  {invigilator.fullName} ({invigilator.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên quản lý'})
                </option>
              ))}
            </select>
          </div>

          {!test && mode === "retake" && (
            <div className="space-y-2">
              <label htmlFor="retakeNote" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User size={16} />
                Ghi chú retake
              </label>
              <textarea
                id="retakeNote"
                value={formData.retakeNote}
                onChange={(e) => setFormData((prev) => ({ ...prev, retakeNote: e.target.value }))}
                placeholder="Nhập ghi chú (nếu có)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>
          )}

          {test && (
            <div className="space-y-2">
              <label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User size={16} />
                Ghi chú
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Nhập ghi chú"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              >
              </textarea>
            </div>
          )}

          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Đang xử lý..."
                : test
                ? "Cập nhật"
                : mode === "retake"
                ? "Tạo retake"
                : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
