"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { RegistrationStatus } from "@/types/registration";

type RegistrationFilterStatus = "ALL" | RegistrationStatus;

const STATUS_OPTIONS: RegistrationFilterStatus[] = [
  "ALL",
  "New",
  "WaitingForClass",
  "Studying",
  "Completed",
];

const STATUS_LABELS: Record<RegistrationFilterStatus, string> = {
  ALL: "Tất cả",
  New: "Mới",
  WaitingForClass: "Chờ xếp lớp",
  Studying: "Đang học",
  Completed: "Hoàn thành",
  Paused: "Tạm dừng",
  Cancelled: "Đã hủy",
};

interface RegistrationFiltersProps {
  searchQuery: string;
  selectedStatus: RegistrationFilterStatus;
  pageSize: number;
  statusCounts: Record<RegistrationFilterStatus, number>;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: RegistrationFilterStatus) => void;
  onPageSizeChange: (size: number) => void;
}

export default function RegistrationFilters({
  searchQuery,
  selectedStatus,
  pageSize,
  statusCounts,
  onSearchChange,
  onStatusChange,
  onPageSizeChange,
}: RegistrationFiltersProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo học viên, chương trình, gói học, ghi chú..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-10 w-35 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
              <SelectValue placeholder="Số dòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / trang</SelectItem>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="20">20 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 overflow-x-auto">
          {STATUS_OPTIONS.map((statusItem) => {
            const count = statusCounts[statusItem] ?? 0;
            const label = STATUS_LABELS[statusItem];

            return (
              <button
                key={statusItem}
                onClick={() => onStatusChange(statusItem)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  selectedStatus === statusItem
                    ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedStatus === statusItem ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
