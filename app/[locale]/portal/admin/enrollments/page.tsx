"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getAllEnrollments } from "@/lib/api/enrollmentService";
import { getAllClasses } from "@/lib/api/classService";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import type { Enrollment } from "@/types/enrollment";
import {
  EnrollmentStats,
  EnrollmentFilters,
  EnrollmentTable,
  EnrollmentDetailModal,
} from "@/components/portal/enrollments";

export default function AdminEnrollmentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { selectedBranchId, isLoaded: isBranchLoaded } = useBranchFilter();
  
  // Data state
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Branch class IDs for filtering enrollment by branch via class's branchId
  const [branchClassIds, setBranchClassIds] = useState<Set<string> | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // UI state
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  // Table state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  
  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  // Handlers
  const handleViewDetail = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
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
    window.location.reload();
  };

  // Fetch all enrollments on mount
  useEffect(() => {
    const fetchAllEnrollments = async () => {
      try {
        setIsLoading(true);
        const params: any = { pageSize: 1000 };
        
        const response = await getAllEnrollments(params);
        
        if (response.isSuccess && response.data?.items) {
          const enrollmentsData = response.data.items || [];
          setAllEnrollments(enrollmentsData);
          
          // Calculate status counts - reset to empty object first
          const counts: Record<string, number> = {};
          enrollmentsData.forEach((enrollment) => {
            counts[enrollment.status] = (counts[enrollment.status] || 0) + 1;
          });
          
          setStatusCounts(counts);
        } else {
          setError(response.message || "Không thể tải danh sách enrollments");
        }
      } catch (err) {
        console.error("Error fetching enrollments:", err);
        setError("Đã xảy ra lỗi khi tải danh sách enrollments");
      } finally {
        setIsLoading(false);
        setIsPageLoaded(true);
      }
    };

    if (isBranchLoaded) {
      fetchAllEnrollments();
    }
  }, [isBranchLoaded]);

  // Fetch class IDs for branch filtering (enrollment references classId -> class has branchId)
  useEffect(() => {
    const fetchBranchClassIds = async () => {
      if (!selectedBranchId) {
        setBranchClassIds(null);
        return;
      }
      try {
        const response = await getAllClasses({ pageSize: 1000 });
        const rawData = response?.data || response || {};
        const responseData = rawData?.data || rawData;
        // Response structure: data.classes.items  (or data.items as fallback)
        const classes = responseData?.classes?.items || responseData?.items || (Array.isArray(responseData) ? responseData : []);
        const ids = new Set<string>(
          classes
            .filter((c: any) => c.branchId === selectedBranchId)
            .map((c: any) => c.id as string)
        );
        setBranchClassIds(ids);
      } catch {
        setBranchClassIds(new Set<string>());
      }
    };
    fetchBranchClassIds();
  }, [selectedBranchId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side filtering (profiles style)
  const filteredEnrollments = useMemo(() => {
    let result = [...allEnrollments];
    
    // Apply branch filter via classId -> class's branchId
    if (branchClassIds !== null) {
      result = result.filter(enrollment => branchClassIds.has(enrollment.classId));
    }
    
    // Apply status filter
    if (selectedStatus !== "Tất cả") {
      result = result.filter(enrollment => enrollment.status === selectedStatus);
    }
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(enrollment =>
        (enrollment.studentName?.toLowerCase().includes(query)) ||
        (enrollment.classTitle?.toLowerCase().includes(query)) ||
        (enrollment.classCode?.toLowerCase().includes(query)) ||
        (enrollment.programName?.toLowerCase().includes(query)) ||
        (enrollment.mainTeacherName?.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [allEnrollments, branchClassIds, selectedStatus, debouncedSearchQuery]);

  // Recompute status counts based on branch-filtered data
  const displayStatusCounts = useMemo(() => {
    const dataToCount = branchClassIds !== null
      ? allEnrollments.filter(e => branchClassIds.has(e.classId))
      : allEnrollments;
    const counts: Record<string, number> = {};
    dataToCount.forEach((enrollment) => {
      counts[enrollment.status] = (counts[enrollment.status] || 0) + 1;
    });
    return counts;
  }, [allEnrollments, branchClassIds]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredEnrollments.length / pageSize);
  const totalCount = filteredEnrollments.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentEnrollments = filteredEnrollments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedStatus, selectedBranchId, pageSize]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <UserCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý Ghi danh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Xem và theo dõi danh sách học viên ghi danh
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
          onClick={() => router.push('/vi/portal/admin/placement-tests')}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Placement Tests
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium shadow-md cursor-pointer"
        >
          <UserCheck size={16} />
          Enrollments
        </button>
      </div>

      {/* Stats Overview */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <EnrollmentStats
          enrollments={branchClassIds !== null ? allEnrollments.filter(e => branchClassIds.has(e.classId)) : allEnrollments}
        />
      </div>

      {/* Filters */}
      <div className={`transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <EnrollmentFilters
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          pageSize={pageSize}
          totalCount={branchClassIds !== null ? allEnrollments.filter(e => branchClassIds.has(e.classId)).length : allEnrollments.length}
          statusCounts={displayStatusCounts}
          onSearchChange={setSearchQuery}
          onStatusChange={setSelectedStatus}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Table */}
      <div className={`transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <EnrollmentTable
          enrollments={currentEnrollments}
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
      {selectedEnrollment && (
        <EnrollmentDetailModal
          enrollment={selectedEnrollment}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEnrollment(null);
          }}
        />
      )}
    </div>
  );
}
