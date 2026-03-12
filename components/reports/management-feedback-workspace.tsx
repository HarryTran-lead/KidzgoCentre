"use client";

import { useState } from "react";
import MonthlyReportsWorkspace from "@/components/reports/monthly-reports-workspace";
import SessionReportsReviewWorkspace from "@/components/reports/session-reports-review-workspace";

type ManageTab = "monthly" | "session";

export default function ManagementFeedbackWorkspace() {
  const [activeTab, setActiveTab] = useState<ManageTab>("monthly");

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
                ? "bg-blue-600 text-white"
                : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
            }`}
          >
            Session Reports
          </button>
        </div>
      </div>

      {activeTab === "monthly" ? (
        <MonthlyReportsWorkspace role="management" />
      ) : (
        <SessionReportsReviewWorkspace />
      )}
    </div>
  );
}

