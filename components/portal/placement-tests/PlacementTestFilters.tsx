"use client";

import { Search, Filter, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

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
    { value: "Tất cả", label: "Tất cả", count: totalCount },
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
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row">
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
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-10.5 w-35 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
            <SelectValue placeholder="Số dòng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 / trang</SelectItem>
            <SelectItem value="10">10 / trang</SelectItem>
            <SelectItem value="20">20 / trang</SelectItem>
            <SelectItem value="50">50 / trang</SelectItem>
          </SelectContent>
        </Select>

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

      <div className="flex flex-wrap items-center gap-2">
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
                  selectedStatus === option.value
                    ? "bg-white/20"
                    : "bg-gray-100"
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
