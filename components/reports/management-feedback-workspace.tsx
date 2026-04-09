"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarCheck, FileBarChart } from "lucide-react";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";
import SessionReportsReviewWorkspace from "@/components/reports/session-reports-review-workspace";

type ManageTab = "monthly" | "session";

export default function ManagementFeedbackWorkspace() {
  const [activeTab, setActiveTab] = useState<ManageTab>("monthly");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const tabs = [
    {
      id: "monthly" as const,
      label: "Báo cáo theo tháng",
      description: "Đi thẳng vào hàng chờ duyệt, điều phối theo lớp và công bố báo cáo.",
      icon: FileBarChart,
    },
    {
      id: "session" as const,
      label: "Báo cáo theo buổi",
      description: "Review nhanh từng buổi học, phản hồi và kiểm soát chất lượng giảng dạy.",
      icon: CalendarCheck,
    },
  ];

  const activeConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
      {/* Header Section - Redesigned theo style mới */}
      <div className={`transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <FileBarChart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Quản lý phản hồi & đánh giá
              </h1>
              <p className="text-sm text-gray-600">
                Chọn đúng workspace để xử lý ngay, không phải cuộn qua nhiều khối hướng dẫn.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-gray-600">
            Vai trò: Quản lý
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                    : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Description Card */}
        <div className="mt-4 rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{activeConfig.label}:</span>{" "}
          {activeConfig.description}{" "}
          <span className="text-gray-500">
            Gợi ý bắt đầu:{" "}
            {activeTab === "monthly"
              ? "mở hàng chờ duyệt để xử lý các báo cáo submitted trước."
              : "review từng buổi học gần nhất rồi phản hồi ngay cho giáo viên."}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {activeTab === "monthly" ? (
          <MonthlyReportsWorkspace role="management" />
        ) : (
          <SessionReportsReviewWorkspace />
        )}
      </div>
    </div>
  );
}