"use client";

import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

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
    { value: "Tất cả", label: "Tất cả", count: totalCount },
    { value: "Active", label: "Đang học", count: statusCounts["Active"] || 0 },
    { value: "Paused", label: "Tạm nghỉ", count: statusCounts["Paused"] || 0 },
    { value: "Dropped", label: "Đã nghỉ", count: statusCounts["Dropped"] || 0 },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên học viên, lớp, mã lớp..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>

        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-10.5 min-w-30 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
            <SelectValue placeholder="Số dòng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / trang</SelectItem>
            <SelectItem value="20">20 / trang</SelectItem>
            <SelectItem value="50">50 / trang</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-500" />
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                selectedStatus === option.value
                  ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
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

      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-red-600">{totalCount}</span> ghi danh
      </div>
    </div>
  );
}
