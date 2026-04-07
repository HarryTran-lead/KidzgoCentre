"use client";

import { X, Calendar, MapPin, User, FileText, Award, BookOpen, Paperclip, Clock, Phone, Mail, Building } from "lucide-react";
import type { PlacementTest } from "@/types/placement-test";
import { formatDateTime } from "@/lib/utils";

interface PlacementTestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
}

export default function PlacementTestDetailModal({
  isOpen,
  onClose,
  test,
}: PlacementTestDetailModalProps) {
  if (!isOpen || !test) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
      Scheduled: { bg: "bg-blue-100 text-blue-700", text: "Đã lên lịch", icon: Clock },
      Completed: { bg: "bg-green-100 text-green-700", text: "Đã hoàn thành", icon: Award },
      Cancelled: { bg: "bg-gray-100 text-gray-700", text: "Đã hủy", icon: X },
      NoShow: { bg: "bg-yellow-100 text-yellow-700", text: "Không đến", icon: Clock },
    };
    const config = statusMap[status] || statusMap.Scheduled;
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${config.bg}`}>
        <Icon size={16} />
        <span>{config.text}</span>
      </div>
    );
  };

  const hasResult = test.status === 'Completed' && (
    test.resultScore !== undefined ||
    test.listeningScore !== undefined ||
    test.programRecommendationId !== undefined ||
    test.programRecommendationName !== undefined
  );

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Chi tiết Placement Test</h2>
                <p className="text-sm text-red-100">Thông tin chi tiết về bài kiểm tra đầu vào</p>
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

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Status Row */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Clock size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Trạng thái</h3>
              </div>
              {getStatusBadge(test.status)}
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thông tin trẻ & phụ huynh */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <User size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Thông tin trẻ & phụ huynh</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <User className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Tên trẻ</p>
                      <p className="font-semibold text-gray-900">{test.childName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <User className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Phụ huynh</p>
                      <p className="font-semibold text-gray-900">{test.leadContactName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin lịch test */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <Calendar size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Thông tin lịch test</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Calendar className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Thời gian</p>
                      <p className="font-semibold text-gray-900">{formatDateTime(test.scheduledAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <MapPin className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Phòng</p>
                      <p className="font-semibold text-gray-900">{test.room || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <User className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Giáo viên phụ trách</p>
                      <p className="font-semibold text-gray-900">{test.invigilatorName || 'Chưa phân công'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {test.notes && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <FileText size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Ghi chú</h3>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{test.notes}</p>
                </div>
              </div>
            )}

            {/* Results Section */}
            {hasResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <Award size={16} className="text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Kết quả Placement Test</h3>
                </div>

                <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Nghe (Listening)</p>
                      <p className="text-2xl font-bold text-red-600">{test.listeningScore ?? 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Nói (Speaking)</p>
                      <p className="text-2xl font-bold text-red-600">{test.speakingScore ?? 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Đọc (Reading)</p>
                      <p className="text-2xl font-bold text-red-600">{test.readingScore ?? 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Viết (Writing)</p>
                      <p className="text-2xl font-bold text-red-600">{test.writingScore ?? 'N/A'}</p>
                    </div>
                  </div>

                  {/* Result Score (Overall) */}
                  {test.resultScore !== undefined && (
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 rounded-xl shadow-lg mb-5">
                      <p className="text-sm text-red-100 mb-1">Điểm Tổng (Result Score)</p>
                      <p className="text-5xl font-bold text-white">{test.resultScore}</p>
                    </div>
                  )}

                  {/* Program Recommendation */}
                  {(test.programRecommendationName || test.programRecommendationId) && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                      <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                        <FileText size={14} className="text-red-500" />
                        Đề xuất chương trình
                      </p>
                      <p className="text-lg font-semibold text-red-700">
                        {test.programRecommendationName || test.programRecommendationId || 'N/A'}
                      </p>
                      {test.programRecommendationId && (
                        <p className="text-xs text-gray-400 mt-0.5">ID: {test.programRecommendationId}</p>
                      )}
                    </div>
                  )}

                  {(test.secondaryProgramRecommendationName || test.secondaryProgramRecommendationId) && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                      <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                        <BookOpen size={14} className="text-red-500" />
                        Chương trình đề xuất thứ cấp
                      </p>
                      <p className="text-lg font-semibold text-red-700">
                        {test.secondaryProgramRecommendationName || test.secondaryProgramRecommendationId || 'N/A'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          test.isSecondaryProgramSupplementary
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {test.isSecondaryProgramSupplementary ? "Bổ trợ" : "Chính"}
                        </span>
                        {test.secondaryProgramSkillFocus && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Kỹ năng: {test.secondaryProgramSkillFocus}
                          </span>
                        )}
                      </div>
                      {test.secondaryProgramRecommendationId && (
                        <p className="text-xs text-gray-400 mt-1">ID: {test.secondaryProgramRecommendationId}</p>
                      )}
                    </div>
                  )}

                  {/* Attachment URL */}
                  {test.attachmentUrl && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                        <Paperclip size={14} className="text-red-500" />
                        Tài liệu đính kèm
                      </p>
                      <a
                        href={test.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-700 hover:underline break-all text-sm"
                      >
                        {test.attachmentUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Giống modal mẫu */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}