"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Target, UserPlus, Download } from "lucide-react";
import { getAllLeads, updateLeadStatus } from "@/lib/api/leadService";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Lead as LeadType } from "@/types/lead";
import {
  LeadStats,
  LeadFilters,
  LeadTable,
  LeadFormModal,
  LeadDetailModal,
  SelfAssignModal,
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

export default function Page() {
  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  
  // Data state
  const [leads, setLeads] = useState<LeadType[]>([]); // Filtered leads for table
  const [allLeads, setAllLeads] = useState<LeadType[]>([]); // All leads for stats (load once)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // UI state
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [selectedSource, setSelectedSource] = useState<string>("Tất cả");
  const [myLeadsOnly, setMyLeadsOnly] = useState<boolean>(false); // Filter chỉ lead của tôi
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  // Table state
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  
  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSelfAssignModalOpen, setIsSelfAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);

  useEffect(() => {
    setIsPageLoaded(true);
    // Fetch initial data for stats and filters when user data is available
    if (currentUser && !isLoadingUser) {
      fetchInitialData();
    }
  }, [currentUser, isLoadingUser]);

  // Debounce search query (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchInitialData = async () => {
    try {
      // Only fetch if user data is loaded and has branchId
      if (!currentUser || isLoadingUser) return;
      
      // Fetch all leads without filters for stats and filter options, but filtered by branch
      const response = await getAllLeads({ 
        pageSize: 1000,
        branchId: currentUser.branchId // Filter by staff's branch
      });
      
      if (response.isSuccess && response.data.leads) {
        const allLeadsData = response.data.leads;
        setAllLeads(allLeadsData);
        
        // Extract available sources
        const sources = new Set(allLeadsData.map(l => l.source).filter(Boolean));
        setAvailableSources(Array.from(sources));
        
        // Calculate status counts
        const counts: Record<string, number> = {
          "Tất cả": allLeadsData.length,
        };
        
        Object.entries(STATUS_MAPPING).forEach(([engStatus, vnStatus]) => {
          counts[vnStatus] = allLeadsData.filter(l => l.status === engStatus).length;
        });
        
        setStatusCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  useEffect(() => {
    if (currentUser && !isLoadingUser) {
      fetchLeads();
    }
  }, [currentPage, pageSize, debouncedSearchQuery, selectedStatus, selectedSource, myLeadsOnly, currentUser, isLoadingUser]);

  const fetchLeads = async () => {
    try {
      // Don't fetch if user data is not ready
      if (!currentUser || isLoadingUser) return;
      
      setIsLoading(true);
      setError(null);
      
      // Map Vietnamese status to English status
      const getEnglishStatus = (vietnameseStatus: string): string | undefined => {
        if (vietnameseStatus === "Tất cả") return undefined;
        const entry = Object.entries(STATUS_MAPPING).find(([_, vn]) => vn === vietnameseStatus);
        return entry ? entry[0] : undefined;
      };
      
      const response = await getAllLeads({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearchQuery || undefined,
        status: getEnglishStatus(selectedStatus),
        source: selectedSource !== "Tất cả" ? selectedSource : undefined,
        branchId: currentUser.branchId, // Filter by staff's branch
        ownerStaffId: myLeadsOnly ? currentUser.id : undefined, // Filter chỉ lead của tôi
      });
      
      if (response.isSuccess && response.data.leads) {
        setLeads(response.data.leads);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách lead");
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lead. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sorted leads (no more client-side filtering, use backend pagination)
  const filteredAndSortedLeads = useMemo(() => {
    const copy = [...leads];
    if (!sortKey) return copy;

    const getValue = (l: LeadType) => {
      switch (sortKey) {
        case "contactName":
          return l.contactName ?? "";
        case "source":
          return l.source ?? "";
        case "ownerStaffName":
          return l.ownerStaffName ?? "";
        case "status":
          return l.status ?? "";
        case "createdAt":
          return l.createdAt ?? "";
        default:
          return "";
      }
    };

    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const res = String(av).localeCompare(String(bv), "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? res : -res;
    });

    return copy;
  }, [leads, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  // Selection handlers
  const allVisibleIds = useMemo(() => filteredAndSortedLeads.map((l) => l.id), [filteredAndSortedLeads]);
  const selectedVisibleCount = useMemo(() => allVisibleIds.filter(id => selectedIds[id]).length, [allVisibleIds, selectedIds]);
  const allVisibleSelected = allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        allVisibleIds.forEach((id) => {
          delete next[id];
        });
        return next;
      }
      allVisibleIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  // Modal handlers
  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsFormModalOpen(true);
  };

  const handleEditLead = (lead: LeadType) => {
    setSelectedLead(lead);
    setIsFormModalOpen(true);
  };

  const handleViewLead = (lead: LeadType) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleLeadAction = (lead: LeadType, action: string) => {
    if (action === "self-assign") {
      // Kiểm tra nếu lead chưa có owner
      if (!lead.ownerStaffId) {
        setSelectedLead(lead);
        setIsSelfAssignModalOpen(true);
      } else {
        toast({
          title: "Thông báo",
          description: "Lead này đã được phân công",
          variant: "destructive",
        });
      }
      return;
    }
    
    // TODO: Implement other actions (add notes, etc.)
    console.log("Action:", action, "Lead:", lead.id);
    toast({
      title: "Thông báo",
      description: `Tính năng ${action} đang được phát triển`,
    });
  };

  const handleStatusChange = async (lead: LeadType, newStatus: string) => {
    try {
      await updateLeadStatus(lead.id, { status: newStatus });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái lead thành công",
        variant: "success",
      });
      fetchLeads();
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    fetchLeads();
    fetchInitialData(); // Refresh stats
  };

  const handleAssignSuccess = () => {
    fetchLeads(); // Only reload table data, no full page refresh
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, selectedStatus, selectedSource, myLeadsOnly]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Target size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Lead & Placement Test
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Nhận lead, phân công tư vấn, đặt lịch test và chuyển đổi ghi danh
              {currentUser?.branchName && (
                <span className="ml-2 text-pink-600 font-medium">
                  • Chi nhánh: {currentUser.branchName}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>
          <button 
            onClick={handleCreateLead}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <UserPlus size={16} /> Nhập lead mới
          </button>
        </div>
      </div>
      <div className={` transition-all duration-700 delay-100 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <LeadStats leads={allLeads} isLoading={false} />
      </div>

      {/* Filter Bar */}
      <div
        className={`transition-all duration-700 delay-150 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <LeadFilters
          leads={leads}
          totalCount={totalCount}
          statusCounts={statusCounts}
          availableSources={availableSources}
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          selectedSource={selectedSource}
          myLeadsOnly={myLeadsOnly}
          currentUserName={currentUser?.fullName}
          pageSize={pageSize}
          onSearchChange={setSearchQuery}
          onStatusChange={setSelectedStatus}
          onSourceChange={setSelectedSource}
          onMyLeadsOnlyChange={setMyLeadsOnly}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Lead Table */}
      <div
        className={`transition-all duration-700 delay-200 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <LeadTable
          leads={filteredAndSortedLeads}
          isLoading={isLoading}
          selectedIds={selectedIds}
          sortKey={sortKey}
          sortDir={sortDir}
          onSelectAll={toggleSelectAllVisible}
          onSelectOne={toggleSelectOne}
          onSort={toggleSort}
          onEdit={handleEditLead}
          onView={handleViewLead}
          onAction={handleLeadAction}
          onStatusChange={handleStatusChange}
          currentUserId={currentUser?.id}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Modals */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        lead={selectedLead}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <LeadDetailModal
        isOpen={isDetailModalOpen}
        lead={selectedLead}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEditLead}
      />

      <SelfAssignModal
        isOpen={isSelfAssignModalOpen}
        lead={selectedLead}
        onClose={() => setIsSelfAssignModalOpen(false)}
        onAssigned={handleAssignSuccess}
      />
    </div>
  );
}
