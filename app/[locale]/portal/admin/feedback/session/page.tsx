"use client";

import { CalendarCheck } from "lucide-react";
import SessionReportsReviewWorkspace from "@/components/reports/session-reports-review-workspace";

export default function AdminFeedbackSessionReportPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-linear-to-r  from-red-600 to-red-700 shadow-lg ">
            <CalendarCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Báo cáo theo buổi
            </h1>
            <p className="text-sm text-gray-600">
              Review nhanh feedback từng buổi học, phản hồi và kiểm soát chất lượng
            </p>
          </div>
        </div>
        <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          Quản lý
        </div>
      </div>

      {/* Content */}
      <SessionReportsReviewWorkspace />
    </div>
  );
}
