"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  Activity,
  Clock,
  Building,
  FileText,
  Users,
  MessageSquare,
  PhoneCall,
  StickyNote,
  Loader2,
} from "lucide-react";
import type { AddLeadNoteRequest, ActivityItem, Lead } from "@/types/lead";
import { ActivityType, getLeadSourceLabel, LeadStatus } from "@/types/lead";
import { formatDateTimeVN } from "@/lib/datetime";
import { useToast } from "@/hooks/use-toast";
import { addLeadNote, getLeadActivities, getLeadById, getLeadChildren } from "@/lib/api/leadService";
import LeadChildrenManager from "./LeadChildrenManager";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';
type FollowUpMode = "callback" | "placement_test";

const STATUS_MAPPING: Record<StatusType, string> = {
  New: "Mới",
  Contacted: "Đang tư vấn",
  BookedTest: "Đã đặt lịch test",
  TestDone: "Đã test",
  Enrolled: "Đã ghi danh",
  Lost: "Đã hủy",
};

interface LeadDetailModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  readOnly?: boolean;
  onLeadUpdated?: (lead: Lead) => void;
}

function normalizeApiData<T>(response: unknown): T | null {
  const result = response as { data?: unknown } | null;
  const firstLevel = result?.data;
  if (firstLevel && typeof firstLevel === "object" && "data" in (firstLevel as Record<string, unknown>)) {
    return ((firstLevel as { data?: T }).data ?? null) as T | null;
  }
  return (firstLevel as T) ?? null;
}

function toDatetimeLocalVN(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  }).format(date);
  return formatted.replace(" ", "T");
}

function toISODateTimeVN(value?: string) {
  if (!value) return undefined;
  return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  [ActivityType.Call]: "Gọi điện",
  [ActivityType.Zalo]: "Zalo",
  [ActivityType.Sms]: "SMS",
  [ActivityType.Email]: "Email",
  [ActivityType.Note]: "Ghi chú",
};

function translateStatusFromBackend(status?: string) {
  if (!status) return "";
  if (status === "New") return "Mới";
  if (status === "Contacted") return "Đang tư vấn";
  if (status === "BookedTest") return "Đã đặt lịch test";
  if (status === "TestDone") return "Đã test";
  if (status === "Enrolled" || status === "ENROLLED") return "Đã ghi danh";
  if (status === "Lost") return "Đã hủy";
  return status;
}

function translateBackendActivityContent(content?: string) {
  const text = String(content || "").trim();
  if (!text) return "";

  const statusChanged = text.match(/^Status changed from\s+([A-Za-z]+)\s+to\s+([A-Za-z]+)$/i);
  if (statusChanged) {
    return `Trạng thái đã chuyển từ ${translateStatusFromBackend(statusChanged[1])} sang ${translateStatusFromBackend(statusChanged[2])}`;
  }

  const leadCreated = text.match(/^Lead created from\s+(.+)$/i);
  if (leadCreated) {
    return `Khách tiềm năng được tạo từ ${leadCreated[1]}`;
  }

  const selfAssigned = text.match(/^Lead self-assigned by\s+(.+)$/i);
  if (selfAssigned) {
    return `Khách tiềm năng được tự nhận bởi ${selfAssigned[1]}`;
  }

  const childAdded = text.match(/^Child\s+'(.+)'\s+added to lead$/i);
  if (childAdded) {
    return `Đã thêm bé '${childAdded[1]}' vào khách tiềm năng`;
  }

  const childConverted = text.match(/^Child\s+'(.+)'\s+converted to\s+ENROLLED\s+\(via enrollment API\)$/i);
  if (childConverted) {
    return `Bé '${childConverted[1]}' đã được chuyển sang trạng thái Đã ghi danh`;
  }

  const testCompleted = text.match(/^Child\s+'(.+)'\s+placement test completed\s+->\s+status:\s*([A-Za-z]+)$/i);
  if (testCompleted) {
    return `Bé '${testCompleted[1]}' đã hoàn thành bài kiểm tra đầu vào → trạng thái: ${translateStatusFromBackend(testCompleted[2])}`;
  }

  return text.replace(/\b(New|Contacted|BookedTest|TestDone|Enrolled|ENROLLED|Lost)\b/g, (s) =>
    translateStatusFromBackend(s)
  );
}

export default function LeadDetailModal({
  isOpen,
  lead,
  onClose,
  onEdit,
  readOnly = false,
  onLeadUpdated,
}: LeadDetailModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'interactions' | 'children'>('info');
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead);
  const [childProgramInterests, setChildProgramInterests] = useState<string[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.Call);
  const [content, setContent] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [followUpMode, setFollowUpMode] = useState<FollowUpMode>("placement_test");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentLead(lead);
    setNextActionAt(toDatetimeLocalVN(lead?.nextActionAt));
    setFollowUpMode(lead?.nextActionAt ? "callback" : "placement_test");
  }, [lead]);

  const refreshChildProgramInterests = useCallback(async () => {
    if (!currentLead?.id) {
      setChildProgramInterests([]);
      return;
    }

    try {
      const response = await getLeadChildren(currentLead.id);
      const interests = Array.from(
        new Set(
          (response.data?.children || [])
            .map((child) => child.programInterest?.trim())
            .filter((interest): interest is string => Boolean(interest))
        )
      );

      setChildProgramInterests(interests);
    } catch {
      setChildProgramInterests([]);
    }
  }, [currentLead?.id]);

  const refreshLead = useCallback(async () => {
    if (!currentLead?.id) return null;
    const response = await getLeadById(currentLead.id);
    const data = normalizeApiData<Lead>(response);
    if (data) {
      setCurrentLead(data);
      onLeadUpdated?.(data);
      return data;
    }
    return null;
  }, [currentLead?.id, onLeadUpdated]);

  const refreshActivities = useCallback(async () => {
    if (!currentLead?.id) return;
    const response = await getLeadActivities(currentLead.id);
    const payload = normalizeApiData<{ activities?: ActivityItem[] }>(response);
    const sorted = [...(payload?.activities || [])].sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return bt - at;
    });
    setActivities(sorted);
  }, [currentLead?.id]);

  const refreshInteractionData = useCallback(async () => {
    if (!currentLead?.id) return;
    setIsLoadingInteractions(true);
    try {
      await refreshActivities();
    } finally {
      setIsLoadingInteractions(false);
    }
  }, [currentLead?.id, refreshActivities]);

  useEffect(() => {
    if (!isOpen) {
      setChildProgramInterests([]);
      return;
    }

    refreshChildProgramInterests();
    refreshInteractionData();
    setFormError(null);
  }, [isOpen, refreshChildProgramInterests, refreshInteractionData]);
  
  if (!isOpen || !currentLead) return null;

  const handleSubmitInteraction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setFormError("Vui lòng nhập nội dung tương tác.");
      return;
    }

    const isoNextActionAt = toISODateTimeVN(nextActionAt);
    if (followUpMode === "callback") {
      if (!isoNextActionAt) {
        setFormError("Vui lòng chọn thời gian hẹn liên hệ lại.");
        return;
      }
      const selectedTime = new Date(isoNextActionAt).getTime();
      if (!Number.isNaN(selectedTime) && selectedTime <= Date.now()) {
        setFormError("Thời gian hẹn gọi lại phải lớn hơn hiện tại.");
        return;
      }
    }

    if (!currentLead.id) return;

    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload: AddLeadNoteRequest = {
        content: trimmedContent,
        activityType,
      };

      if (followUpMode === "placement_test") {
        payload.clearNextAction = true;
      } else if (isoNextActionAt) {
        payload.nextActionAt = isoNextActionAt;
      }

      await addLeadNote(currentLead.id, payload);
      setContent("");
      setActivityType(ActivityType.Call);
      setNextActionAt("");
      setFollowUpMode("placement_test");

      const updatedLead = await refreshLead();
      await refreshActivities();

      if (!updatedLead) {
        onLeadUpdated?.({ ...currentLead, status: LeadStatus.Contacted });
      }

      toast({
        title: "Thành công",
        description: "Đã ghi nhận tương tác và cập nhật khách tiềm năng.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to submit interaction:", error);
      setFormError("Không thể ghi nhận tương tác. Vui lòng thử lại.");
      toast({
        title: "Lỗi",
        description: "Không thể ghi nhận tương tác.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayProgramInterest =
    childProgramInterests.length > 0
      ? childProgramInterests.join(", ")
      : currentLead.programInterest || "Không có";

  const getActivityIcon = (type: ActivityType) => {
    if (type === ActivityType.Call) return <PhoneCall size={14} className="text-red-600" />;
    if (type === ActivityType.Zalo) return <MessageSquare size={14} className="text-sky-600" />;
    if (type === ActivityType.Sms) return <MessageSquare size={14} className="text-emerald-600" />;
    if (type === ActivityType.Email) return <Mail size={14} className="text-orange-600" />;
    return <StickyNote size={14} className="text-amber-600" />;
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-linear-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Chi tiết khách tiềm năng</h2>
                <p className="text-sm text-red-100">Thông tin chi tiết về khách hàng tiềm năng</p>
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
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'info'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <User size={16} />
              Thông tin khách tiềm năng
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'interactions'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <PhoneCall size={16} />
              Tương tác
            </button>
            <button
              onClick={() => setActiveTab('children')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'children'
                  ? 'bg-white text-red-600 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users size={16} />
              Thông tin bé
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Tab: Lead Info */}
            {activeTab === 'info' && (
              <>
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <User size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Họ và tên</label>
                      <p className="text-sm font-medium text-gray-900">{currentLead.contactName || "Không có"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Phone size={12} /> Số điện thoại
                      </label>
                      <p className="text-sm font-medium text-gray-900">{currentLead.phone || "Không có"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> Email
                      </label>
                      <p className="text-sm font-medium text-gray-900">{currentLead.email || "Không có"}</p>
                    </div>
                  </div>
                </div>

                {/* Lead Status & Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <Activity size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Trạng thái & Phân công</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Trạng thái</label>
                      <p className="text-sm font-medium text-gray-900">
                        {currentLead.status ? STATUS_MAPPING[currentLead.status as StatusType] : "Không có"}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Phụ trách</label>
                      <p className="text-sm font-medium text-gray-900">{currentLead.ownerStaffName || "Chưa phân công"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> Phản hồi lần đầu
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {currentLead.firstResponseAt ? new Date(currentLead.firstResponseAt).toLocaleString('vi-VN') : "Chưa phản hồi"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Số lần tiếp xúc</label>
                      <p className="text-sm font-medium text-gray-900">{currentLead.touchCount || 0} lần</p>
                    </div>
                  </div>
                </div>

                {/* Source & Campaign */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <Tag size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Nguồn khách tiềm năng</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Nguồn</label>
                      <p className="text-sm font-medium text-gray-900">{getLeadSourceLabel(currentLead.source)}</p>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <Building size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Sở thích</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Chi nhánh mong muốn</label>
                      <p className="text-sm font-medium text-gray-900">
                        {currentLead.branchPreferenceName || currentLead.branchPreference || "Không có"}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Chương trình quan tâm</label>
                      <p className="text-sm font-medium text-gray-900">{displayProgramInterest}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {currentLead.notes && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-100">
                        <FileText size={16} className="text-red-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700">Ghi chú</h3>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-200">
                      {currentLead.notes}
                    </p>
                  </div>
                )}

                {/* Conversion Info */}
                {currentLead.convertedStudentProfileId && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100">
                        <Users size={16} className="text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-emerald-700">Đã chuyển đổi</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-xl border border-emerald-200">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">ID học viên</label>
                        <p className="text-sm font-medium text-gray-900">{currentLead.convertedStudentProfileId}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Ngày chuyển đổi</label>
                        <p className="text-sm font-medium text-gray-900">
                          {currentLead.convertedAt ? new Date(currentLead.convertedAt).toLocaleDateString('vi-VN') : "Không có"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-100">
                      <Clock size={16} className="text-gray-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Thông tin hệ thống</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="font-medium">Ngày tạo:</span>{" "}
                      {currentLead.createdAt ? new Date(currentLead.createdAt).toLocaleString('vi-VN') : "Không có"}
                    </div>
                  </div>
                </div>

              </>
            )}

            {/* Tab: Interactions */}
            {activeTab === 'interactions' && (
              <>
                {!readOnly && (
                  <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-lg bg-red-100 p-1.5">
                        <PhoneCall size={16} className="text-red-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700">Ghi nhận tương tác</h3>
                    </div>

                    <form onSubmit={handleSubmitInteraction} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-gray-500">Loại tương tác</span>
                          <select
                            value={activityType}
                            onChange={(event) => setActivityType(event.target.value as ActivityType)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                            disabled={isSubmitting}
                          >
                            <option value={ActivityType.Call}>{ACTIVITY_LABELS[ActivityType.Call]}</option>
                            <option value={ActivityType.Zalo}>{ACTIVITY_LABELS[ActivityType.Zalo]}</option>
                            <option value={ActivityType.Sms}>{ACTIVITY_LABELS[ActivityType.Sms]}</option>
                            <option value={ActivityType.Email}>{ACTIVITY_LABELS[ActivityType.Email]}</option>
                            <option value={ActivityType.Note}>{ACTIVITY_LABELS[ActivityType.Note]}</option>
                          </select>
                        </label>

                        <div className="space-y-2">
                          <span className="text-xs font-medium text-gray-500">Follow-up (lịch hẹn)</span>
                          <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
                            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name="follow-up-mode"
                                checked={followUpMode === "callback"}
                                onChange={() => setFollowUpMode("callback")}
                                className="mt-0.5 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-200"
                                disabled={isSubmitting}
                              />
                              <span>Phụ huynh đang bận, hẹn liên hệ lại</span>
                            </label>
                            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name="follow-up-mode"
                                checked={followUpMode === "placement_test"}
                                onChange={() => setFollowUpMode("placement_test")}
                                className="mt-0.5 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-200"
                                disabled={isSubmitting}
                              />
                              <span>Liên hệ hoàn tất, chuyển sang bước kiểm tra đầu vào</span>
                            </label>
                          </div>
                          {followUpMode === "callback" && (
                            <input
                              type="datetime-local"
                              value={nextActionAt}
                              onChange={(event) => {
                                setNextActionAt(event.target.value);
                              }}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                              disabled={isSubmitting}
                            />
                          )}
                        </div>
                      </div>

                      <label className="space-y-1 block">
                        <span className="text-xs font-medium text-gray-500">Nội dung tương tác</span>
                        <textarea
                          value={content}
                          onChange={(event) => setContent(event.target.value)}
                          rows={4}
                          placeholder="Ví dụ: Phụ huynh đang bận, hẹn chiều mai gọi lại"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200 resize-none"
                          disabled={isSubmitting}
                        />
                      </label>

                      {formError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {formError}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-60"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                          {isSubmitting ? "Đang lưu..." : "Lưu tương tác"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="rounded-2xl border border-red-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-red-100 p-1.5">
                        <Activity size={16} className="text-red-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700">Timeline tương tác</h3>
                    </div>
                    {isLoadingInteractions && <Loader2 size={16} className="animate-spin text-gray-500" />}
                  </div>

                  {!isLoadingInteractions && activities.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                      Chưa có hoạt động nào cho khách tiềm năng này.
                    </div>
                  )}

                  <div className="space-y-3">
                    {activities.map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {getActivityIcon(item.activityType)}
                            {ACTIVITY_LABELS[item.activityType] || item.activityType}
                          </div>
                          <span className="text-xs text-gray-500">{formatDateTimeVN(item.createdAt)}</span>
                        </div>

                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{translateBackendActivityContent(item.content)}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>Thực hiện bởi: {item.createdByName || item.createdBy || "Hệ thống"}</span>
                          {item.nextActionAt && <span>Hẹn tiếp: {formatDateTimeVN(item.nextActionAt)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tab: Children */}
            {activeTab === 'children' && (
              <LeadChildrenManager
                leadId={currentLead.id}
                isEditable={!readOnly}
                onChildrenChanged={refreshChildProgramInterests}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-end gap-3">
            {!readOnly && (
              <button
                onClick={() => {
                  onEdit(currentLead);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
