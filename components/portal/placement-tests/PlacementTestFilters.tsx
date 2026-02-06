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
    { value: "Tất cả", label: "Tất cả", count: statusCounts["Tất cả"] || 0 },
    { value: "Scheduled", label: "Đã đặt lịch", count: statusCounts["Scheduled"] || 0 },
    { value: "Completed", label: "Hoàn thành", count: statusCounts["Completed"] || 0 },
    { value: "Cancelled", label: "Đã hủy", count: statusCounts["Cancelled"] || 0 },
    { value: "NoShow", label: "Không đến", count: statusCounts["NoShow"] || 0 },
  ];

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 space-y-4">
      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-500" />
        <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1 flex-wrap gap-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                selectedStatus === option.value
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              {option.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedStatus === option.value ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Date Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên bé, tên PH, SĐT..."
            className="w-full rounded-xl border border-pink-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {/* From Date */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-pink-200 px-3 py-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="text-sm border-none focus:outline-none"
          />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-pink-200 px-3 py-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="text-sm border-none focus:outline-none"
          />
        </div>

        {/* Page Size */}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-xl border border-pink-200 bg-white px-3 py-2.5 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
        >
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
          <option value={100}>100 / trang</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-pink-600">{totalCount}</span> placement test
      </div>
    </div>
  );
}
