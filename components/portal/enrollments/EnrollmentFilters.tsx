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
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:flex-1">
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
          value={selectedStatus}
          onValueChange={onStatusChange}
        >
          <SelectTrigger className="h-10 w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer">
            <SelectValue placeholder="Trạng thái">
              {selectedStatus === "Tất cả" ? "Tất cả trạng thái" : selectedStatus || "Trạng thái"}
            </SelectValue>
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
  );
}
