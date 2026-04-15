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
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:flex-1">
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

        <Select value={selectedStatus} onValueChange={(value) => onStatusChange(value as RegistrationFilterStatus)}>
          <SelectTrigger className="h-10 w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer">
            <SelectValue placeholder="Trang thai">
              {selectedStatus === "ALL" ? "Tất cả trạng thái" : STATUS_LABELS[selectedStatus] || "Trang thai"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((statusItem) => {
              const count = statusCounts[statusItem] ?? 0;
              const label = STATUS_LABELS[statusItem];
              return (
                <SelectItem key={statusItem} value={statusItem}>
                  {label} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
