"use client";

import { Search, Filter, Calendar } from "lucide-react";

interface PlacementTestFiltersProps {
  searchQuery: string;
  selectedStatus: string;
  fromDate: string;
  toDate: string;
  pageSize: number;
  totalCount: number;
  statusCounts: Record<string, number>;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onPageSizeChange: (size: number) => void;
}

export default function PlacementTestFilters({
  searchQuery,
  selectedStatus,
  fromDate,
  toDate,
  pageSize,
  totalCount,
  statusCounts,
  onSearchChange,
  onStatusChange,
  onFromDateChange,
  onToDateChange,
  onPageSizeChange,
}: PlacementTestFiltersProps) {
  const statusOptions = [
    { value: "Tất cả", label: "Tất cả trạng thái", count: totalCount },
    {
      value: "Scheduled",
      label: "Đã đặt lịch",
      count: statusCounts["Scheduled"] || 0,
    },
    {
      value: "Completed",
      label: "Hoàn thành",
      count: statusCounts["Completed"] || 0,
    },
    {
      value: "Cancelled",
      label: "Đã hủy",
      count: statusCounts["Cancelled"] || 0,
    },
    { value: "NoShow", label: "Không đến", count: statusCounts["NoShow"] || 0 },
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

        {/* Search and Date Inputs */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo tên bé, tên PH, SĐT..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="text-sm text-gray-700 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="text-sm text-gray-700 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
