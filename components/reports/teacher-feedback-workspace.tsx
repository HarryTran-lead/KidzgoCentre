"use client";

import { useState } from "react";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";
import TeacherSessionReportsWorkspace from "@/components/reports/teacher-session-reports-workspace";

type TeacherTab = "monthly" | "session";

export default function TeacherFeedbackWorkspace() {
  const [activeTab, setActiveTab] = useState<TeacherTab>("monthly");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === "monthly"
                ? "bg-red-600 text-white"
                : "border border-red-200 bg-white text-red-700 hover:bg-red-50"
            }`}
          >
            Monthly Reports
          </button>
          <button
            onClick={() => setActiveTab("session")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === "session"
                ? "bg-indigo-600 text-white"
                : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            Session Reports
          </button>
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

