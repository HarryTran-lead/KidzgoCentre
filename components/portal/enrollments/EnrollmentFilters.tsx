"use client";

import { Search, Filter } from "lucide-react";

interface EnrollmentFiltersProps {
  searchQuery: string;
  selectedStatus: string;
  pageSize: number;
  totalCount: number;
  statusCounts: Record<string, number>;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  onPageSizeChange: (size: number) => void;
}

export default function EnrollmentFilters({
  searchQuery,
  selectedStatus,
  pageSize,
  totalCount,
  statusCounts,
  onSearchChange,
  onStatusChange,
  onPageSizeChange,
}: EnrollmentFiltersProps) {
  const statusOptions = [
    { value: "Tất cả", label: "Tất cả", count: statusCounts["Tất cả"] || 0 },
    { value: "Active", label: "Đang học", count: statusCounts["Active"] || 0 },
    { value: "Paused", label: "Tạm nghỉ", count: statusCounts["Paused"] || 0 },
    { value: "Dropped", label: "Đã nghỉ", count: statusCounts["Dropped"] || 0 },
  ];

  return (
    <div className="rounded-2xl border border-pink-200 bg-linear-to-br from-white to-pink-50 p-4 space-y-4">
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
                  ? "bg-linear-to-r from-pink-500 to-rose-500 text-white shadow-sm"
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

      {/* Search and Page Size */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-62.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên học viên, lớp, mã lớp..."
            className="w-full rounded-xl border border-pink-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-xl border border-pink-200 bg-white px-3 py-2.5 text-sm focus:border-pink-500 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-500">/ {totalCount} kết quả</span>
        </div>
      </div>
    </div>
  );
}
