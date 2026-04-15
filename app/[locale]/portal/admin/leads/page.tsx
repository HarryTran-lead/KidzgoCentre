"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getAllLeads } from "@/lib/api/leadService";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import type { Lead as LeadType } from "@/types/lead";
import {
  LeadStats,
  LeadFilters,
  LeadTable,
  LeadDetailModal,
} from "@/components/portal/leads";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';

const STATUS_MAPPING: Record<StatusType, string> = {
  New: "Mới",
  Contacted: "Đang tư vấn",
  BookedTest: "Đã đặt lịch test",
  TestDone: "Đã test",
  Enrolled: "Đã ghi danh",
  Lost: "Đã hủy",
};

function toTime(value?: string) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export default function AdminLeadsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { selectedBranchId, isLoaded: isBranchLoaded } = useBranchFilter();
  
  // Data state
  const [allLeads, setAllLeads] = useState<LeadType[]>([]); // All leads for stats (load once)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // UI state
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [selectedSource, setSelectedSource] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  // Table state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  
  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);

  // Client-side filtering (profiles style)
  const filteredLeads = useMemo(() => {
    let result = [...allLeads];
    
    // Apply status filter
    if (selectedStatus !== "Tất cả") {
      const statusKey = Object.keys(STATUS_MAPPING).find(
        (key) => STATUS_MAPPING[key as StatusType] === selectedStatus
      );
      if (statusKey) {
        result = result.filter(lead => lead.status === statusKey);
      }
    }
    
    // Apply source filter
    if (selectedSource !== "Tất cả") {
      result = result.filter(lead => lead.source === selectedSource);
    }
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(lead => 
        (lead.contactName?.toLowerCase().includes(query)) ||
        (lead.phone?.toLowerCase().includes(query)) ||
        (lead.email?.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [allLeads, selectedStatus, selectedSource, debouncedSearchQuery]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const totalCount = filteredLeads.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  // Handlers
  const handleViewDetail = (lead: LeadType) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleEdit = (lead: LeadType) => {
    // Admin read-only, no edit action
    console.log("Edit not available in admin view");
  };

  const handleAction = (lead: LeadType, action: string) => {
    // Admin read-only, no action
    console.log("Action not available in admin view");
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchQuery("");
    setSelectedStatus("Tất cả");
    setSelectedSource("Tất cả");
    window.location.reload();
  };

  //Fetch all leads on mount (for stats and filtering)
  useEffect(() => {
    const fetchAllLeads = async () => {
      try {
        setIsLoading(true);
        const params: any = { pageSize: 1000 };
        
        // Add branch filter if selected
        if (selectedBranchId) {
          params.branchPreference = selectedBranchId;
        }
        
        const response = await getAllLeads(params);
        
        if (response.isSuccess && response.data?.leads) {
          const leadsData = [...(response.data.leads || [])].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
          setAllLeads(leadsData);
          
          // Calculate status counts - reset to empty object first
          const counts: Record<string, number> = {};
          leadsData.forEach((lead) => {
            const statusLabel = STATUS_MAPPING[lead.status as StatusType] || lead.status || '';
            if (statusLabel) {
              counts[statusLabel] = (counts[statusLabel] || 0) + 1;
            }
          });
          setStatusCounts(counts);
          
          // Extract unique sources
          const sources = [...new Set(response.data.leads.map((l) => l.source).filter(Boolean))];
          setAvailableSources(sources as string[]);
        } else {
          setError(response.message || "Không thể tải danh sách leads");
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError("Đã xảy ra lỗi khi tải danh sách leads");
      } finally {
        setIsLoading(false);
        setIsPageLoaded(true);
      }
    };

    // Only fetch when branch filter is loaded
    if (isBranchLoaded) {
      fetchAllLeads();
    }
  }, [selectedBranchId, isBranchLoaded]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedStatus, selectedSource, pageSize]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-linear-to-r from-red-100 to-red-200 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Target size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý Lead & CRM
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Xem và theo dõi danh sách khách hàng tiềm năng
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex gap-2 transition-all duration-700 delay-50 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl font-medium shadow-md cursor-pointer"
        >
          <Target size={16} />
          Leads
        </button>
        <button
          onClick={() => router.push('/vi/portal/admin/placement-tests')}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
          Placement Tests
        </button>
        <button
          onClick={() => router.push('/vi/portal/admin/enrollments')}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Enrollments
        </button>
      </div>

      {/* Stats Overview */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <LeadStats 
          leads={allLeads}
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <LeadFilters
          leads={allLeads}
          totalCount={totalCount}
          statusCounts={statusCounts}
          availableSources={availableSources}
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          selectedSource={selectedSource}
          // pageSize={pageSize}
          onSearchChange={setSearchQuery}
          onStatusChange={setSelectedStatus}
          onSourceChange={setSelectedSource}
          // onPageSizeChange={setPageSize}
        />
      </div>

      {/* Table */}
      <div className={`transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <LeadTable
          leads={currentLeads}
          isLoading={isLoading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={handleEdit}
          onView={handleViewDetail}
          onAction={handleAction}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          readOnly={true}
        />
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLead(null);
          }}
          onEdit={handleEdit}
          readOnly={true}
        />
      )}
    </div>
  );
}
