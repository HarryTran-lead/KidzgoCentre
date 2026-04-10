"use client";

import { useSearchParams } from "next/navigation";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";
import { FileText } from "lucide-react";

export default function TeacherMonthlyReportPage() {
  const searchParams = useSearchParams();

  const initialClassId = searchParams.get("classId") || null;
  const initialStudentId = searchParams.get("studentId") || null;
  const initialMonth = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const initialYear = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const initialReportTab = searchParams.get("reportTab") || (initialStudentId ? "reports" : null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
          <FileText size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Báo cáo tháng
          </h1>
          <p className="text-gray-600 mt-1">
            Tạo nháp AI và gửi báo cáo tổng hợp hàng tháng cho từng học sinh.
          </p>
        </div>
      </div>

      <MonthlyReportsWorkspace
        role="teacher"
        initialClassId={initialClassId}
        initialStudentId={initialStudentId}
        initialMonth={initialMonth}
        initialYear={initialYear}
        initialTab={initialReportTab}
      />
    </div>
  );
}
