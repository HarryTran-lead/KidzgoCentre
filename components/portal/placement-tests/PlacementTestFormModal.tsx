"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, User, Clock, Building, BookOpen, CreditCard, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { getPlacementTestErrorMessage } from "@/lib/api/placementTestService";
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
  invigilators?: Array<{ id: string; fullName: string; role: string }>;
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

  const handleReset = () => {
    if (test) {
      // Reset về dữ liệu ban đầu của test
      setFormData({
        leadId: test.leadId || "",
        leadChildId: test.leadChildId || "",
        scheduledAt: test.scheduledAt ? (() => {
          const d = new Date(test.scheduledAt);
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        })() : "",
        room: test.room || "",
        invigilatorUserId: test.invigilatorUserId || "",
        originalPlacementTestId: retakeSourceTestId || "",
        retakeStudentProfileId: inferredRetakeStudentProfileId,
        retakeBranchId: defaultBranchId,
        retakeProgramId: "",
        retakeTuitionPlanId: "",
        retakeNote: "",
        notes: test.notes || "",
      });
      setSelectedLead(test.leadId || "");
      if (test.leadId) {
        const lead = leads.find(l => l.id === test.leadId);
        setChildren(lead?.children || []);
      }
    } else {
      // Reset form về trống
      setFormData({
        leadId: "",
        leadChildId: "",
        scheduledAt: "",
        room: "",
        invigilatorUserId: "",
        originalPlacementTestId: retakeSourceTestId || "",
        retakeStudentProfileId: inferredRetakeStudentProfileId,
        retakeBranchId: defaultBranchId,
        retakeProgramId: "",
        retakeTuitionPlanId: "",
        retakeNote: "",
        notes: "",
      });
      setSelectedLead("");
      setChildren([]);
    }
    setFormError("");
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
        setFormError("Vui lòng chọn khách tiềm năng và tên bé");
        return;
      }

      if (!formData.invigilatorUserId) {
        setFormError("Vui lòng chọn người giám sát");
        return;
      }
    }

    if (!isEditMode && mode === "retake") {
      if (!formData.originalPlacementTestId) {
        setFormError("Vui lòng chọn Kiểm tra lại từ thao tác của bài kiểm tra xếp lớp đã hoàn thành");
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
      setFormError(getPlacementTestErrorMessage(error, "Không thể lưu bài kiểm tra xếp lớp"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {test ? "Chỉnh sửa kiểm tra xếp lớp" : mode === "create" ? "Tạo kiểm tra xếp lớp mới" : "Tạo kiểm tra lại xếp lớp"}
                </h2>
                <p className="text-sm text-red-100">
                  {test ? "Chỉnh sửa thông tin kiểm tra xếp lớp" : mode === "create" ? "Nhập thông tin chi tiết về bài kiểm tra xếp lớp mới" : "Tạo kiểm tra lại từ bài kiểm tra xếp lớp đã hoàn thành"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Switch Buttons */}
            {!test && allowModeSwitch && (
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("create");
                      setFormError("");
                    }}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      mode === "create"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-red-100"
                    }`}
                  >
                    Tạo mới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!retakeSourceTestId) {
                        setFormError("Vui lòng chọn Kiểm tra lại từ thao tác của bài kiểm tra xếp lớp đã hoàn thành");
                        return;
                      }
                      setMode("retake");
                      setFormData((prev) => ({
                        ...prev,
                        retakeBranchId: defaultBranchId || prev.retakeBranchId,
                      }));
                      setFormError("");
                    }}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      mode === "retake"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-red-100"
                    }`}
                  >
                    Retake
                  </button>
                </div>
              </div>
            )}

            {/* Lead Selection (only for create) - Vertical Layout */}
            {!test && mode === "create" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <User size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Thông tin khách tiềm năng</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User size={16} className="text-gray-400" />
                      Khách tiềm năng
                    </label>
                    <Select value={formData.leadId} onValueChange={handleLeadChange}>
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                        <SelectValue placeholder="Chọn khách tiềm năng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Chọn khách tiềm năng</SelectItem>
                        {leads.length === 0 ? (
                          <SelectItem value="__no_lead__" disabled>
                            Không có khách tiềm năng nào
                          </SelectItem>
                        ) : (
                          leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.contactName} ({lead.children?.length || 0} bé)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User size={16} className="text-gray-400" />
                      Tên bé <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.leadChildId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, leadChildId: value }))}
                      disabled={!selectedLead || children.length === 0}
                    >
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all disabled:opacity-50 disabled:bg-gray-50">
                        <SelectValue
                          placeholder={
                            !selectedLead
                              ? "Vui lòng chọn khách tiềm năng trước"
                              : children.length === 0
                                ? "Khách tiềm năng này chưa có thông tin bé"
                                : "Chọn bé"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          {!selectedLead ? "Vui lòng chọn khách tiềm năng trước" : children.length === 0 ? "Khách tiềm năng này chưa có thông tin bé" : "Chọn bé"}
                        </SelectItem>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Retake Section - Vertical Layout */}
            {!test && mode === "retake" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <Building size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Thông tin Retake</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User size={16} className="text-gray-400" />
                      Hồ sơ học viên <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.retakeStudentProfileId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, retakeStudentProfileId: value }))
                      }
                    >
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                        <SelectValue placeholder="Chọn hồ sơ học viên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Chọn hồ sơ học viên</SelectItem>
                        {filteredStudentProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BookOpen size={16} className="text-gray-400" />
                      Chương trình mới <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.retakeProgramId}
                      onValueChange={(nextProgramId) =>
                        setFormData((prev) => {
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
                    >
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                        <SelectValue placeholder="Chọn chương trình mới" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Chọn chương trình mới</SelectItem>
                        {filteredPrograms.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CreditCard size={16} className="text-gray-400" />
                      Gói học mới <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.retakeTuitionPlanId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, retakeTuitionPlanId: value }))
                      }
                    >
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                        <SelectValue placeholder="Chọn gói học mới" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Chọn gói học mới</SelectItem>
                        {filteredTuitionPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Test Schedule - Vertical Layout */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Clock size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Lịch thi</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar size={16} className="text-gray-400" />
                    Thời gian test {mode === "create" || test ? <span className="text-red-500">*</span> : "(optional)"}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required={mode === "create" || Boolean(test)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin size={16} className="text-gray-400" />
                    Phòng test
                  </label>
                  <Select
                    value={formData.room}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, room: value }))}
                  >
                    <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                      <SelectValue placeholder="Chọn phòng test" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Chọn phòng test</SelectItem>
                      {classes.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.className}>
                          {classroom.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User size={16} className="text-gray-400" />
                    Người giám sát {mode === "create" || test ? <span className="text-red-500">*</span> : "(optional)"}
                  </label>
                  <Select
                    value={formData.invigilatorUserId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, invigilatorUserId: value }))}
                  >
                    <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                      <SelectValue placeholder="Chọn người giám sát" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Chọn người giám sát</SelectItem>
                      {invigilators.map((invigilator) => (
                        <SelectItem key={invigilator.id} value={invigilator.id}>
                          {invigilator.fullName} ({invigilator.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên quản lý'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes - Vertical Layout */}
            {(!test && mode === "retake") || test ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <FileText size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Ghi chú</h3>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={!test && mode === "retake" ? formData.retakeNote : formData.notes}
                    onChange={(e) => {
                      if (!test && mode === "retake") {
                        setFormData((prev) => ({ ...prev, retakeNote: e.target.value }));
                      } else {
                        setFormData((prev) => ({ ...prev, notes: e.target.value }));
                      }
                    }}
                    placeholder="Nhập ghi chú (nếu có)"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                  />
                </div>
              </div>
            ) : null}

            {/* Error Message */}
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="text-red-500">⚠️</span>
                {formError}
              </div>
            )}
          </form>
        </div>

        {/* Footer - Giống modal mẫu */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {test ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
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
          </div>
        </div>
      </div>
    </div>
  );
}