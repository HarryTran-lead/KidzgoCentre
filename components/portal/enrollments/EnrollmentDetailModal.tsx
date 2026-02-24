"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import type { Enrollment, EnrollmentHistoryItem } from "@/types/enrollment";
import { getStudentEnrollmentHistory } from "@/lib/api/enrollmentService";

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
}

export default function EnrollmentDetailModal({
  isOpen,
  onClose,
  enrollment,
}: EnrollmentDetailModalProps) {
  const [history, setHistory] = useState<EnrollmentHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  useEffect(() => {
    if (isOpen && enrollment?.studentProfileId && activeTab === "history") {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const result = await getStudentEnrollmentHistory(enrollment.studentProfileId);
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
  }, [isOpen, enrollment?.studentProfileId, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("details");
      setHistory([]);
    }
  }, [isOpen]);

  if (!isOpen || !enrollment) return null;

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
      "Đang học": { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
      "Tạm nghỉ": { bg: "bg-amber-100", text: "text-amber-700", icon: PauseCircle },
      "Đã nghỉ": { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
    };
    const config = statusMap[statusText] || statusMap["Đang học"];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon size={14} />
        {statusText}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-500 to-indigo-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={22} />
            Chi tiết ghi danh
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Thông tin
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <History size={14} />
              Lịch sử
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trạng thái</span>
                {getStatusBadge(enrollment.status)}
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-purple-500" />
                  Thông tin học viên
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Họ tên</p>
                    <p className="text-sm font-medium">{enrollment.studentName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mã hồ sơ</p>
                    <p className="text-sm font-medium text-gray-600">
                      {enrollment.studentProfileId?.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Class Info */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500" />
                  Thông tin lớp học
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Tên lớp</p>
                    <p className="text-sm font-medium">{enrollment.classTitle || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mã lớp</p>
                    <p className="text-sm font-medium">{enrollment.classCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Chương trình</p>
                    <p className="text-sm font-medium">{enrollment.programName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">GVCN</p>
                    <p className="text-sm font-medium">{enrollment.mainTeacherName || "N/A"}</p>
                  </div>
                  {enrollment.schedulePattern && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Lịch học</p>
                      <p className="text-sm font-medium">{enrollment.schedulePattern}</p>
                    </div>
                  )}
                  {enrollment.capacity !== undefined && enrollment.capacity !== null && (
                    <div>
                      <p className="text-xs text-gray-500">Sĩ số</p>
                      <p className="text-sm font-medium">{enrollment.capacity}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enrollment Info */}
              <div className="bg-green-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={16} className="text-green-500" />
                  Thông tin ghi danh
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Ngày ghi danh</p>
                    <p className="text-sm font-medium">{formatDate(enrollment.enrollDate)}</p>
                  </div>
                  {enrollment.tuitionPlanName && (
                    <div>
                      <p className="text-xs text-gray-500">Gói học phí</p>
                      <p className="text-sm font-medium">{enrollment.tuitionPlanName}</p>
                    </div>
                  )}
                  {enrollment.createdAt && (
                    <div>
                      <p className="text-xs text-gray-500">Ngày tạo</p>
                      <p className="text-sm font-medium">{formatDate(enrollment.createdAt)}</p>
                    </div>
                  )}
                  {enrollment.updatedAt && (
                    <div>
                      <p className="text-xs text-gray-500">Cập nhật lần cuối</p>
                      <p className="text-sm font-medium">{formatDate(enrollment.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Đang tải lịch sử...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Chưa có lịch sử ghi danh</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.classTitle || item.classCode || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.programName && `${item.programName} • `}
                        Ghi danh: {formatDate(item.enrollDate)}
                      </p>
                      {item.mainTeacherName && (
                        <p className="text-xs text-gray-400 mt-0.5">GVCN: {item.mainTeacherName}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
