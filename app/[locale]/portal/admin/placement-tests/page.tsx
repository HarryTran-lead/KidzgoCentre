"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, Loader2, AlertCircle, RefreshCw, UserCheck } from "lucide-react";
import { getAllPlacementTests } from "@/lib/api/placementTestService";
import { getAllLeads } from "@/lib/api/leadService";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import type { PlacementTest } from "@/types/placement-test";
import {
  PlacementTestStats,
  PlacementTestFilters,
  PlacementTestTable,
  PlacementTestDetailModal,
} from "@/components/portal/placement-tests";

function toTime(value?: string) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export default function AdminPlacementTestsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBranchId, isLoaded: isBranchLoaded } = useBranchFilter();
  
  // Data state
  const [allTests, setAllTests] = useState<PlacementTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Branch lead IDs for filtering PT by branch via lead's branchPreference
  const [branchLeadIds, setBranchLeadIds] = useState<Set<string> | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // UI state
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  // Table state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  
  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PlacementTest | null>(null);

  // Handlers
  const handleViewDetail = (test: PlacementTest) => {
    setSelectedTest(test);
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

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchQuery("");
    setSelectedStatus("Tất cả");
    setFromDate("");
    setToDate("");
    window.location.reload();
  };

  // Fetch all tests on mount
  useEffect(() => {
    const fetchAllTests = async () => {
      try {
        setIsLoading(true);
        const params: any = { pageSize: 1000 };
        
        const response = await getAllPlacementTests(params);
        
        if (response.isSuccess && response.data?.items) {
          const testsData = [...(response.data.items || [])].sort((a, b) => {
            const bTime = toTime(b.createdAt || b.scheduledAt);
            const aTime = toTime(a.createdAt || a.scheduledAt);
            return bTime - aTime;
          });
          setAllTests(testsData);
          
          // Calculate status counts - reset to empty object first
          const counts: Record<string, number> = {};
          testsData.forEach((test) => {
            counts[test.status] = (counts[test.status] || 0) + 1;
          });
          
          setStatusCounts(counts);
        } else {
          setError(response.message || "Không thể tải danh sách placement tests");
        }
      } catch (err) {
        console.error("Error fetching placement tests:", err);
        setError("Đã xảy ra lỗi khi tải danh sách placement tests");
      } finally {
        setIsLoading(false);
        setIsPageLoaded(true);
      }
    };

    if (isBranchLoaded) {
      fetchAllTests();
    }
  }, [isBranchLoaded]);

  // Auto-open detail modal when placementTestId is in URL query params
  useEffect(() => {
    if (allTests.length === 0) return;
    const placementTestId = searchParams.get("placementTestId");
    if (!placementTestId) return;
    const match = allTests.find(t => t.id === placementTestId);
    if (match) {
      setSelectedTest(match);
      setIsDetailModalOpen(true);
    }
  }, [allTests, searchParams]);

  // Fetch lead IDs for branch filtering (PT references leadId -> lead has branchPreference)
  useEffect(() => {
    const fetchBranchLeadIds = async () => {
      if (!selectedBranchId) {
        setBranchLeadIds(null);
        return;
      }
      try {
        const response = await getAllLeads({ pageSize: 1000, branchPreference: selectedBranchId });
        if (response.isSuccess && response.data?.leads) {
          const ids = new Set(response.data.leads.map((l: any) => l.id));
          setBranchLeadIds(ids);
        } else {
          setBranchLeadIds(new Set());
        }
      } catch {
        setBranchLeadIds(new Set());
      }
    };
    fetchBranchLeadIds();
  }, [selectedBranchId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side filtering (profiles style)
  const filteredTests = useMemo(() => {
    let result = [...allTests];
    
    // Apply branch filter via leadId -> lead's branchPreference
    if (branchLeadIds !== null) {
      result = result.filter(test => branchLeadIds.has(test.leadId));
    }
    
    // Apply status filter
    if (selectedStatus !== "Tất cả") {
      result = result.filter(test => test.status === selectedStatus);
    }
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(test =>
        (test.childName?.toLowerCase().includes(query)) ||
        (test.leadContactName?.toLowerCase().includes(query)) ||
        (test.invigilatorName?.toLowerCase().includes(query))
      );
    }
    
    // Apply date filters
    if (fromDate) {
      result = result.filter(test => test.scheduledAt >= fromDate);
    }
    if (toDate) {
      const toDateEnd = toDate + "T23:59:59";
      result = result.filter(test => test.scheduledAt <= toDateEnd);
    }
    
    return result;
  }, [allTests, branchLeadIds, selectedStatus, debouncedSearchQuery, fromDate, toDate]);

  // Recompute status counts based on branch-filtered data
  const displayStatusCounts = useMemo(() => {
    const dataToCount = branchLeadIds !== null
      ? allTests.filter(test => branchLeadIds.has(test.leadId))
      : allTests;
    const counts: Record<string, number> = {};
    dataToCount.forEach((test) => {
      counts[test.status] = (counts[test.status] || 0) + 1;
    });
    return counts;
  }, [allTests, branchLeadIds]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredTests.length / pageSize);
  const totalCount = filteredTests.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTests = filteredTests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedStatus, fromDate, toDate, selectedBranchId, pageSize]);

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
            <ClipboardCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý Placement Test
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Xem và theo dõi lịch sử kiểm tra đầu vào
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
          onClick={() => router.push('/vi/portal/admin/leads')}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          Leads
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl font-medium shadow-md cursor-pointer"
        >
          <ClipboardCheck size={16} />
          Placement Tests
        </button>
        <button
          onClick={() => router.push('/vi/portal/admin/enrollments')}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <UserCheck size={16} />
          Enrollments
        </button>
      </div>

      {/* Stats Overview */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PlacementTestStats 
          tests={branchLeadIds !== null ? allTests.filter(t => branchLeadIds.has(t.leadId)) : allTests}
        />
      </div>

      {/* Filters */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PlacementTestFilters
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          fromDate={fromDate}
          toDate={toDate}
          pageSize={pageSize}
          totalCount={branchLeadIds !== null ? allTests.filter(t => branchLeadIds.has(t.leadId)).length : allTests.length}
          statusCounts={displayStatusCounts}
          onSearchChange={setSearchQuery}
          onStatusChange={setSelectedStatus}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Table */}
      <div className={`transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PlacementTestTable
          tests={currentTests}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onView={handleViewDetail}
          onPageChange={setCurrentPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          readOnly={true}
        />
      </div>

      {/* Detail Modal */}
      {selectedTest && (
        <PlacementTestDetailModal
          test={selectedTest}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
}

