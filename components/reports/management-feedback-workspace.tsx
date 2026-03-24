"use client";

import { useState } from "react";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";
import SessionReportsReviewWorkspace from "@/components/reports/session-reports-review-workspace";
import { FileBarChart, CalendarCheck, ChevronRight } from "lucide-react";

type ManageTab = "monthly" | "session";

export default function ManagementFeedbackWorkspace() {
  const [activeTab, setActiveTab] = useState<ManageTab>("monthly");
  const [isPageLoaded] = useState(true);

  const tabs = [
    { id: "monthly" as const, label: "Báo cáo theo tháng", icon: FileBarChart, color: "red" },
    { id: "session" as const, label: "Báo cáo theo buổi", icon: CalendarCheck, color: "blue" },
  ];

  const activeTabConfig = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 transition-all duration-700 opacity-100 translate-y-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <FileBarChart size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Quản lý phản hồi & đánh giá
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi và duyệt báo cáo định kỳ từ giáo viên, tổng hợp phản hồi học tập
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-white/80 rounded-full px-3 py-1.5 border border-red-200">
            Vai trò: Quản lý
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-1 shadow-sm transition-all duration-700">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                    : "text-gray-600 hover:bg-red-50"
                }`}
              >
                <div className="relative flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </div>
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/30" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-2 ${
            activeTab === "monthly" 
              ? "bg-gradient-to-r from-red-600 to-red-700" 
              : "bg-gradient-to-r from-blue-500 to-cyan-500"
          } text-white shadow-sm`}>
            {activeTab === "monthly" ? <FileBarChart size={18} /> : <CalendarCheck size={18} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {activeTab === "monthly" ? "Báo cáo tổng kết tháng" : "Báo cáo từng buổi học"}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {activeTab === "monthly" 
                ? "Xem và duyệt báo cáo định kỳ theo tháng của giáo viên, theo dõi tiến độ hoàn thành"
                : "Duyệt từng nhận xét buổi học, gửi phản hồi và quản lý chất lượng giảng dạy"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="transition-all duration-500">
        {activeTab === "monthly" ? (
          <MonthlyReportsWorkspace role="management" />
        ) : (
          <SessionReportsReviewWorkspace />
        )}
      </div>
    </div>
  );
}