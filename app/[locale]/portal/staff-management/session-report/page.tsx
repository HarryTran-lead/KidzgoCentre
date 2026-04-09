"use client";

import SessionReportsReviewWorkspace from "@/components/reports/session-reports-review-workspace";
import { FileText, Sparkles } from "lucide-react";

export default function StaffManagementSessionReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Báo cáo buổi học
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                Xem, duyệt và xuất bản báo cáo buổi học của giáo viên
              </p>
            </div>
          </div>
        </div>
      </div>

      <SessionReportsReviewWorkspace />
    </div>
  );
}
