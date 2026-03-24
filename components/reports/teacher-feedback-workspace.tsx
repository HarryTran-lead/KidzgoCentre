"use client";

import { useState } from "react";
import { CalendarCheck, FileBarChart, GraduationCap } from "lucide-react";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";
import TeacherSessionReportsWorkspace from "@/components/reports/teacher-session-reports-workspace";

type TeacherTab = "monthly" | "session";

export default function TeacherFeedbackWorkspace() {
  const [activeTab, setActiveTab] = useState<TeacherTab>("monthly");

  const tabs = [
    {
      id: "monthly" as const,
      label: "Báo cáo tháng",
      description: "Chọn lớp, học sinh, tạo nháp AI và gửi báo cáo tổng hợp theo tháng.",
      icon: FileBarChart,
    },
    {
      id: "session" as const,
      label: "Báo cáo buổi học",
      description: "Theo dõi nhận xét từng buổi, chỉnh sửa và gửi review nhanh theo session.",
      icon: CalendarCheck,
    },
  ];

  const activeConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-4 bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      <div className="rounded-[24px] border border-red-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                Workspace Báo Cáo Giáo Viên
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Chuyển nhanh giữa báo cáo tháng và báo cáo buổi học, không cần lướt qua quá nhiều phần đầu trang.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-gray-600">
            Vai trò: Giáo viên
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                    : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{activeConfig.label}:</span>{" "}
          {activeConfig.description}{" "}
          <span className="text-gray-500">
            Gợi ý bắt đầu:{" "}
            {activeTab === "monthly"
              ? "mở công cụ giáo viên, chọn lớp và học sinh rồi soạn nháp."
              : "xử lý nhận xét theo buổi trước, sau đó mới tổng hợp lên báo cáo tháng."}
          </span>
        </div>
      </div>

      {activeTab === "monthly" ? (
        <MonthlyReportsWorkspace role="teacher" />
      ) : (
        <TeacherSessionReportsWorkspace />
      )}
    </div>
  );
}
