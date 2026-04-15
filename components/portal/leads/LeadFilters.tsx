"use client";

import { Search, Filter } from "lucide-react";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { getLeadSourceLabel, LeadSource } from "@/types/lead";
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
  totalCount: number;
  statusCounts?: Record<string, number>;
  availableSources?: string[];
  searchQuery: string;
  selectedStatus: string;
  selectedSource: string;
  myLeadsOnly?: boolean;
  currentUserName?: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onMyLeadsOnlyChange?: (value: boolean) => void;
}

export default function LeadFilters({
  leads,
  totalCount,
  statusCounts = {},
  availableSources = [],
  searchQuery,
  selectedStatus,
  selectedSource,
  myLeadsOnly = false,
  currentUserName,
  onSearchChange,
  onStatusChange,
  onSourceChange,
  onMyLeadsOnlyChange,
}: LeadFiltersProps) {
  const statusOptions = ["Tất cả", ...Object.values(STATUS_MAPPING)];
  
  const sourceOptions = useMemo(() => {
    const beSourceValues = Object.values(LeadSource);
    const runtimeSources = new Set([
      ...availableSources,
      ...leads.map((l) => l.source).filter(Boolean),
    ]);
    const extraSources = Array.from(runtimeSources).filter(
      (source) => !beSourceValues.includes(source as LeadSource)
    );
    return ["Tất cả", ...beSourceValues, ...extraSources];
  }, [availableSources, leads]);

  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm tên, SĐT, email, mã khách tiềm năng..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="flex items-center gap-3">
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
              {statusOptions.map((statusLabel) => {
                // Keep "Tất cả" stable from full-scope totals, not current filtered rows.
                const count = statusLabel === "Tất cả" 
                  ? (statusCounts["Tất cả"] ?? totalCount)
                  : statusCounts[statusLabel] ?? 0;
                return (
                  <SelectItem key={statusLabel} value={statusLabel}>
                    {statusLabel === "Tất cả" ? "Tất cả trạng thái" : statusLabel} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            value={selectedSource}
            onValueChange={onSourceChange}
          >
            <SelectTrigger className="h-10 w-35 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 cursor-pointer">
              <SelectValue placeholder="Nguồn">
                {selectedSource === "Tất cả" ? "Tất cả nguồn" : selectedSource || "Nguồn"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source === "Tất cả" ? source : getLeadSourceLabel(source)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Filter chỉ lead của tôi */}
          {onMyLeadsOnlyChange && currentUserName && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={myLeadsOnly}
                onChange={(e) => onMyLeadsOnlyChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-200 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Chỉ khách tiềm năng của tôi
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
