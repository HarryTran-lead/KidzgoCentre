"use client";

import type { ProgramProgressionTabItem, ProgramProgressionTabKey } from "./config";

type ProgramProgressionTabsProps = {
  tabs: ProgramProgressionTabItem[];
  activeTab: ProgramProgressionTabKey;
  onChange: (tab: ProgramProgressionTabKey) => void;
  isStudentView?: boolean;
};

export default function ProgramProgressionTabs({
  tabs,
  activeTab,
  onChange,
  isStudentView = false,
}: ProgramProgressionTabsProps) {
  return (
    <div
      className={
        isStudentView
          ? "rounded-2xl border border-indigo-400/30 bg-slate-900/80 p-2 backdrop-blur"
          : "rounded-2xl border border-red-200 bg-white p-2"
      }
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={
                isStudentView
                  ? `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-left transition-all ${
                      isActive
                        ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                        : "bg-slate-950/60 text-indigo-100 hover:bg-slate-950/80"
                    }`
                  : `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-left transition-all ${
                      isActive
                        ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "bg-red-50/60 text-gray-700 hover:bg-red-100"
                    }`
              }
            >
              <span className="text-sm font-semibold">{tab.label}</span>
              {isActive && (
                <span
                  className={
                    isStudentView
                      ? "hidden text-xs text-indigo-100 md:inline"
                      : "hidden text-xs text-red-100 md:inline"
                  }
                >
                  {tab.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
