"use client";

import { Search, Filter } from "lucide-react";

interface EnrollmentFiltersProps {
  searchQuery: string;
  selectedStatus: string;
  totalCount: number;
  statusCounts: Record<string, number>;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
}

export default function EnrollmentFilters({
  searchQuery,
  selectedStatus,
  totalCount,
  statusCounts,
  onSearchChange,
  onStatusChange,
}: EnrollmentFiltersProps) {
  const statusOptions = [
    { value: "Tất cả", label: "Tất cả trạng thái", count: totalCount },
    { value: "Active", label: "Đang học", count: statusCounts["Active"] || 0 },
    { value: "Paused", label: "Tạm nghỉ", count: statusCounts["Paused"] || 0 },
    { value: "Dropped", label: "Đã nghỉ", count: statusCounts["Dropped"] || 0 },
  ];

  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100">
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const isActive = selectedStatus === option.value;

            return (
              <button
                key={option.value}
                onClick={() => onStatusChange(option.value)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {option.label}
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {option.count}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên học viên, lớp, mã lớp..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>
    </div>
  );
}
