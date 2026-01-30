"use client";

import { Search, Filter } from "lucide-react";
import { useMemo } from "react";
import type { Lead } from "@/types/lead";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';

const STATUS_MAPPING: Record<StatusType, string> = {
  New: "Mới",
  Contacted: "Đang tư vấn",
  BookedTest: "Đã đặt lịch test",
  TestDone: "Đã test",
  Enrolled: "Đã ghi danh",
  Lost: "Đã hủy",
};

interface LeadFiltersProps {
  leads: Lead[];
  searchQuery: string;
  selectedStatus: string;
  selectedSource: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
}

export default function LeadFilters({
  leads,
  searchQuery,
  selectedStatus,
  selectedSource,
  onSearchChange,
  onStatusChange,
  onSourceChange,
}: LeadFiltersProps) {
  const statusOptions = ["Tất cả", ...Object.values(STATUS_MAPPING)];
  
  const sourceOptions = useMemo(() => {
    const sources = new Set(leads.map(l => l.source).filter(Boolean));
    return ["Tất cả", ...Array.from(sources)];
  }, [leads]);

  const getStatusCount = (status: string) => {
    if (status === "Tất cả") return leads.length;
    return leads.filter((l) => l.status && STATUS_MAPPING[l.status as StatusType] === status).length;
  };

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm tên, SĐT, email, mã lead..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1 overflow-x-auto">
          {statusOptions.map((status) => {
            const count = getStatusCount(status);
            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  selectedStatus === status
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-pink-50"
                }`}
              >
                {status}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedStatus === status ? "bg-white/20" : "bg-gray-100"
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
