"use client";

import { Search } from "lucide-react";
import type { RegistrationStatus } from "@/types/registration";

type RegistrationFilterStatus = "ALL" | RegistrationStatus;

const STATUS_OPTIONS: RegistrationFilterStatus[] = [
  "ALL",
  "New",
  "WaitingForClass",
  "ClassAssigned",
  "Studying",
  "Completed",
  "Paused",
  "Cancelled",
];

const STATUS_LABELS: Record<RegistrationFilterStatus, string> = {
  ALL: "Tất cả trạng thái",
  New: "Mới",
  WaitingForClass: "Chờ xếp lớp",
  ClassAssigned: "Đã xếp lớp",
  Studying: "Đang học",
  Completed: "Hoàn thành",
  Paused: "Tạm dừng",
  Cancelled: "Đã hủy",
};

interface RegistrationFiltersProps {
  searchQuery: string;
  selectedStatus: RegistrationFilterStatus;
  statusCounts: Record<RegistrationFilterStatus, number>;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: RegistrationFilterStatus) => void;
}

export default function RegistrationFilters({
  searchQuery,
  selectedStatus,
  statusCounts,
  onSearchChange,
  onStatusChange,
}: RegistrationFiltersProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100">
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((statusItem) => {
            const count = statusCounts[statusItem] ?? 0;
            const label = STATUS_LABELS[statusItem];
            const isActive = selectedStatus === statusItem;

            return (
              <button
                key={statusItem}
                onClick={() => onStatusChange(statusItem)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {label}
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo học viên, chương trình, gói học, ghi chú..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>
    </div>
  );
}
