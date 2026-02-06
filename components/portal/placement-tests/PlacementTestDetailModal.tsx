"use client";

import { X, Calendar, MapPin, User, FileText, Award, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/lightswind/button";
import type { PlacementTest, PlacementTestResult } from "@/types/placement-test";
import { formatDateTime } from "@/lib/utils";

interface PlacementTestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
  result?: PlacementTestResult | null;
}

export default function PlacementTestDetailModal({
  isOpen,
  onClose,
  test,
  result,
}: PlacementTestDetailModalProps) {
  if (!isOpen || !test) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
      Scheduled: { bg: "bg-blue-100 text-blue-700", text: "Đã lên lịch", icon: Clock },
      Completed: { bg: "bg-green-100 text-green-700", text: "Đã hoàn thành", icon: Award },
      Cancelled: { bg: "bg-rose-100 text-rose-700", text: "Đã hủy", icon: X },
      NoShow: { bg: "bg-amber-100 text-amber-700", text: "Không đến", icon: Clock },
    };
    const config = statusMap[status] || statusMap.Scheduled;
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${config.bg}`}>
        <Icon size={16} />
        <span>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-pink-500 to-rose-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Chi tiết Placement Test</h2>
            <p className="text-blue-100 mt-1">ID: {test.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Trạng thái</h3>
            {getStatusBadge(test.status)}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Thông tin trẻ & phụ huynh
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Tên trẻ</p>
                    <p className="font-medium text-slate-900">{test.childName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Phụ huynh</p>
                    <p className="font-medium text-slate-900">{test.leadContactName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Số điện thoại</p>
                    <p className="font-medium text-slate-900">{(test as any).leadPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
                Thông tin lịch test
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Thời gian</p>
                    <p className="font-medium text-slate-900">{formatDateTime(test.scheduledAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Chi nhánh</p>
                    <p className="font-medium text-slate-900">{(test as any).branchName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Địa điểm</p>
                    <p className="font-medium text-slate-900">{(test as any).testLocation || test.room || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-600">Giáo viên phụ trách</p>
                    <p className="font-medium text-slate-900">{test.invigilatorName || 'Chưa phân công'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {test.notes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                <FileText size={18} />
                Ghi chú
              </h3>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{test.notes}</p>
            </div>
          )}

          {/* Results */}
          {result && test.status === 'Completed' && (
            <div className="space-y-4 bg-linear-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-purple-200 pb-2 flex items-center gap-2">
                <Award size={18} className="text-purple-600" />
                Kết quả Placement Test
              </h3>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-slate-600 mb-1">Nghe</p>
                  <p className="text-2xl font-bold text-blue-600">{result.listeningScore || 'N/A'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-slate-600 mb-1">Nói</p>
                  <p className="text-2xl font-bold text-green-600">{result.speakingScore || 'N/A'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-slate-600 mb-1">Đọc</p>
                  <p className="text-2xl font-bold text-purple-600">{result.readingScore || 'N/A'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-slate-600 mb-1">Viết</p>
                  <p className="text-2xl font-bold text-orange-600">{result.writingScore || 'N/A'}</p>
                </div>
              </div>

              {/* Overall Score */}
              {result.overallScore && (
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-300">
                  <p className="text-sm text-slate-600 mb-1">Điểm tổng</p>
                  <p className="text-4xl font-bold text-purple-600">{result.overallScore}</p>
                </div>
              )}

              {/* Suggested Level */}
              {result.suggestedLevel && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-slate-600 mb-1">Trình độ đề xuất</p>
                  <p className="text-xl font-semibold text-indigo-600">{result.suggestedLevel}</p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.strengths && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <TrendingUp size={16} />
                      Điểm mạnh
                    </h4>
                    <p className="text-sm text-slate-700">{result.strengths}</p>
                  </div>
                )}
                {result.weaknesses && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-rose-700 mb-2 flex items-center gap-2">
                      <TrendingDown size={16} />
                      Điểm yếu
                    </h4>
                    <p className="text-sm text-slate-700">{result.weaknesses}</p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {result.recommendations && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Gợi ý và đề xuất
                  </h4>
                  <p className="text-sm text-slate-700">{result.recommendations}</p>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={onClose}
              className="bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
