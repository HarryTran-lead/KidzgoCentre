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
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
              className="text-sm text-gray-700 outline-none "
            />
          </div>

          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
