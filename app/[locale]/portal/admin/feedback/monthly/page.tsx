"use client";

import { FileBarChart, Sparkles } from "lucide-react";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";

export default function AdminFeedbackMonthlyReportPage() {
  return (
    <div className="space-y-6 p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-lg">
            <FileBarChart className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Báo cáo theo tháng
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Quản lý và duyệt báo cáo feedback lớp học theo tháng
            </p>
          </div>
        </div>
        <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          Quản lý
        </div>
      </div>

      {/* Content */}
      <MonthlyReportsWorkspace role="management" />
    </div>
  );
}
