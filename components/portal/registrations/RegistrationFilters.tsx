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
  ALL: "Tat ca",
  New: "Moi",
  WaitingForClass: "Cho xep lop",
  ClassAssigned: "Da xep lop",
  Studying: "Dang hoc",
  Completed: "Hoan thanh",
  Paused: "Tam dung",
  Cancelled: "Da huy",
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
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tim theo hoc vien, chuong trinh, goi hoc, ghi chu..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-10 w-35 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
              <SelectValue placeholder="So dong" />
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

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="inline-flex overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
          {STATUS_OPTIONS.map((statusItem) => {
            const count = statusCounts[statusItem] ?? 0;
            const label = STATUS_LABELS[statusItem];

            return (
              <button
                key={statusItem}
                onClick={() => onStatusChange(statusItem)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedStatus === statusItem
                    ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
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
