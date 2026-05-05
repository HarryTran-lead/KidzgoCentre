"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  BookOpen,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  History,
  GraduationCap,
  Users,
  Tag,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Enrollment, EnrollmentHistoryItem } from "@/types/enrollment";
import {
  assignTuitionPlan,
  getEnrollmentById,
  getStudentEnrollmentHistory,
} from "@/lib/api/enrollmentService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { useToast } from "@/hooks/use-toast";

type StatusType = "Active" | "Paused" | "Dropped";

const STATUS_MAPPING: Record<StatusType, string> = {
  Active: "Đang học",
  Paused: "Tạm nghỉ",
  Dropped: "Đã nghỉ",
};

interface EnrollmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: Enrollment | null;
  onChanged?: () => void;
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function InfoCard({ icon, label, value, iconColor = "text-red-500" }: { icon?: React.ReactNode; label: string; value: string; iconColor?: string }) {
  return (
    <div className="rounded-xl bg-white p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        {icon && <div className={cn("shrink-0", iconColor)}>{icon}</div>}
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </div>
      </div>
      <div className="mt-1 break-all text-sm font-semibold text-gray-900">{value || "-"}</div>
    </div>
  );
}

function Section({ title, icon, children, colorClass = "border-red-200 bg-red-50/40" }: { title: string; icon?: React.ReactNode; children: React.ReactNode; colorClass?: string }) {
  return (
    <div className={cn("space-y-3 rounded-xl border p-4", colorClass)}>
      <div className="flex items-center gap-2">
        {icon && <div className="shrink-0">{icon}</div>}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function EnrollmentDetailModal({
  isOpen,
  onClose,
  enrollment,
  onChanged,
}: EnrollmentDetailModalProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<EnrollmentHistoryItem[]>([]);
  const [detailEnrollment, setDetailEnrollment] = useState<Enrollment | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  const fetchDetail = useCallback(async () => {
    if (!isOpen || !enrollment?.id) return;

    try {
      setIsLoadingDetail(true);
      const response = await getEnrollmentById(enrollment.id);
      if (response.isSuccess && response.data) {
        setDetailEnrollment(response.data);
        return;
      }
      setDetailEnrollment(null);
    } catch (error) {
      console.error("Error fetching enrollment detail:", error);
      setDetailEnrollment(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [isOpen, enrollment?.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const studentProfileId = detailEnrollment?.studentProfileId || enrollment?.studentProfileId;
    if (isOpen && studentProfileId && activeTab === "history") {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const result = await getStudentEnrollmentHistory(studentProfileId);
          setHistory(result.data || []);
        } catch (error) {
          console.error("Error fetching enrollment history:", error);
          setHistory([]);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, enrollment?.studentProfileId, detailEnrollment?.studentProfileId, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("details");
      setHistory([]);
      setDetailEnrollment(null);
    }
  }, [isOpen]);

  if (!isOpen || !enrollment) return null;

  const displayedEnrollment = detailEnrollment || enrollment;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusText = STATUS_MAPPING[status as StatusType] || status;
    const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
      "Đang học": { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
      "Tạm nghỉ": { bg: "bg-amber-100", text: "text-amber-700", icon: PauseCircle },
      "Đã nghỉ": { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
    };
    const config = statusMap[statusText] || statusMap["Đang học"];
    const Icon = config.icon;
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", config.bg, config.text)}>
        <Icon size={14} />
        {statusText}
      </span>
    );
  };

  const renderWeeklyPattern = (pattern?: Enrollment["weeklyPattern"]) => {
    if (!Array.isArray(pattern) || pattern.length === 0) {
      return "Học toàn bộ lịch lớp";
    }

    return pattern
      .map((entry) => {
        const days = Array.isArray(entry?.dayOfWeeks) ? entry.dayOfWeeks.join(", ") : "";
        const startTime = String(entry?.startTime || "").trim();
        const duration = Number(entry?.durationMinutes || 0);
        const durationLabel = Number.isFinite(duration) && duration > 0 ? `${duration} phút` : "";
        return [days, startTime, durationLabel].filter(Boolean).join(" • ");
      })
      .filter(Boolean)
      .join(" | ");
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header - Gradient đỏ như các modal khác */}
        <div className="sticky top-0 z-10 bg-linear-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Chi tiết ghi danh</h3>
                <p className="text-xs text-red-100">Thông tin chi tiết về ghi danh học</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-all cursor-pointer",
                activeTab === "details"
                  ? "border-b-2 border-red-600 text-red-600 bg-white -mb-px rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} />
                Thông tin
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-all cursor-pointer",
                activeTab === "history"
                  ? "border-b-2 border-red-600 text-red-600 bg-white -mb-px rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <History size={14} />
                Lịch sử
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="space-y-5">
              {/* Status Card */}
              <div className="rounded-xl border border-red-200 bg-linear-to-r from-red-50/50 to-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-md">
                      <GraduationCap size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Trạng thái</div>
                      <div className="text-lg font-bold text-gray-900">
                        {getStatusBadge(displayedEnrollment.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Info Section */}
              <Section 
                title="Thông tin học viên" 
                icon={<User size={16} className="text-blue-600" />}
                colorClass="border-blue-200 bg-blue-50/40"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    icon={<User size={14} />}
                    label="Họ tên học viên"
                    value={displayedEnrollment.studentName || "N/A"}
                  />
                  
                </div>
              </Section>

              {/* Class Info Section */}
              <Section 
                title="Thông tin lớp học" 
                icon={<BookOpen size={16} className="text-emerald-600" />}
                colorClass="border-emerald-200 bg-emerald-50/40"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    icon={<BookOpen size={14} />}
                    label="Tên lớp"
                    value={displayedEnrollment.classTitle || "N/A"}
                  />
                  <InfoCard
                    icon={<Tag size={14} />}
                    label="Mã lớp"
                    value={displayedEnrollment.classCode || "N/A"}
                  />
                  {displayedEnrollment.schedulePattern && (
                    <InfoCard
                      icon={<Clock size={14} />}
                      label="Lịch học"
                      value={displayedEnrollment.schedulePattern}
                    />
                  )}
                  
                </div>
              </Section>

              {/* Enrollment Info Section */}
              <Section 
                title="Thông tin ghi danh" 
                icon={<Calendar size={16} className="text-purple-600" />}
                colorClass="border-purple-200 bg-purple-50/40"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Ngày ghi danh"
                    value={formatDate(displayedEnrollment.enrollDate)}
                  />
                  {displayedEnrollment.tuitionPlanName && (
                    <InfoCard
                      icon={<Tag size={14} />}
                      label="Gói học phí"
                      value={displayedEnrollment.tuitionPlanName}
                    />
                  )}
                  {displayedEnrollment.createdAt && (
                    <InfoCard
                      icon={<Calendar size={14} />}
                      label="Ngày tạo"
                      value={formatDate(displayedEnrollment.createdAt)}
                    />
                  )}
                  {displayedEnrollment.updatedAt && (
                    <InfoCard
                      icon={<Clock size={14} />}
                      label="Cập nhật lần cuối"
                      value={formatDate(displayedEnrollment.updatedAt)}
                    />
                  )}
                  <InfoCard
                    icon={<Clock size={14} />}
                    label="Weekly Pattern"
                    value={renderWeeklyPattern(displayedEnrollment.weeklyPattern)}
                  />
                </div>
              </Section>

            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center gap-2 py-12">
                  <Loader2 size={20} className="animate-spin text-red-500" />
                  <span className="text-sm text-gray-500">Đang tải lịch sử...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-linear-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <History size={24} className="text-gray-400" />
                  </div>
                  <div className="text-gray-600 font-medium">Chưa có lịch sử ghi danh</div>
                  <div className="text-sm text-gray-500 mt-1">Học viên chưa có lịch sử thay đổi lớp</div>
                </div>
              ) : (
                history.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-red-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="shrink-0">
                        <div className="p-2 rounded-lg bg-red-50">
                          <BookOpen size={16} className="text-red-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {item.classTitle || item.classCode || "N/A"}
                          </h4>
                          {/* {getStatusBadge(item.status)} */}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" />
                            <span>Ghi danh: {formatDate(item.enrollDate)}</span>
                          </div>
                           {item.classTitle && (
                            <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-gray-400" />
                              <span>Tên lớp: {item.classTitle}</span>
                            </div>
                          )}
                          {item.classCode && (
                            <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-gray-400" />
                              <span>Mã lớp: {item.classCode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}