"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus, RefreshCw } from "lucide-react";
import {
  getAllEnrollments,
  createEnrollment,
  pauseEnrollment,
  dropEnrollment,
  reactivateEnrollment,
} from "@/lib/api/enrollmentService";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Enrollment, CreateEnrollmentRequest, EnrollmentStatus } from "@/types/enrollment";
import {
  EnrollmentStats,
  EnrollmentFilters,
  EnrollmentTable,
  EnrollmentFormModal,
  EnrollmentDetailModal,
} from "@/components/portal/enrollments";
import ConfirmModal from "@/components/ConfirmModal";

const STATUS_MAPPING: Record<EnrollmentStatus, string> = {
  Active: "Đang học",
  Paused: "Tạm nghỉ",
  Dropped: "Đã nghỉ",
};

export default function EnrollmentsPage() {
  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Data state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);

  // Page loaded state
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
    if (currentUser && !isLoadingUser) {
      fetchInitialData();
    }
  }, [currentUser, isLoadingUser]);

  // Debounce search query (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch enrollments when filters change
  useEffect(() => {
    if (currentUser && !isLoadingUser) {
      fetchEnrollments();
    }
  }, [currentPage, pageSize, selectedStatus, debouncedSearchQuery]);

  // ========== Data fetching ==========

  const fetchInitialData = async () => {
    try {
      if (!currentUser || isLoadingUser) return;

      const response = await getAllEnrollments({ pageSize: 1000 });

      if (response.isSuccess && response.data) {
        const allData = Array.isArray(response.data.items) ? response.data.items : [];
        setAllEnrollments(allData);

        // Calculate status counts
        const counts: Record<string, number> = {
          "Tất cả": allData.length,
          Active: allData.filter((e) => e.status === "Active").length,
          Paused: allData.filter((e) => e.status === "Paused").length,
          Dropped: allData.filter((e) => e.status === "Dropped").length,
        };
        setStatusCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);

      const params: Record<string, any> = {
        pageNumber: currentPage,
        pageSize,
      };

      if (selectedStatus !== "Tất cả") {
        params.status = selectedStatus;
      }
      if (debouncedSearchQuery) {
        params.searchTerm = debouncedSearchQuery;
      }

      const response = await getAllEnrollments(params);

      if (response.isSuccess && response.data) {
        setEnrollments(response.data.items || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 0);
      } else {
        setEnrollments([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách ghi danh",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedStatus, debouncedSearchQuery]);

  // ========== Handlers ==========

  const handleCreateEnrollment = async (data: {
    classId: string;
    studentProfileId: string;
    enrollDate: string;
  }) => {
    try {
      const response = await createEnrollment(data as CreateEnrollmentRequest);
      if (response.isSuccess) {
        toast({ title: "Thành công", description: "Đã tạo ghi danh mới" });
        fetchEnrollments();
        fetchInitialData();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể tạo ghi danh",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo ghi danh";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    }
  };

  const handlePause = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setConfirmAction({
      action: "pause",
      title: "Tạm nghỉ học viên",
      message: `Bạn có chắc muốn tạm nghỉ học viên "${enrollment.studentName}" khỏi lớp "${enrollment.classTitle || enrollment.classCode}"?`,
    });
    setIsConfirmModalOpen(true);
  };

  const handleDrop = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setConfirmAction({
      action: "drop",
      title: "Cho học viên nghỉ",
      message: `Bạn có chắc muốn cho học viên "${enrollment.studentName}" nghỉ lớp "${enrollment.classTitle || enrollment.classCode}"?`,
    });
    setIsConfirmModalOpen(true);
  };

  const handleReactivate = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setConfirmAction({
      action: "reactivate",
      title: "Kích hoạt lại",
      message: `Bạn có chắc muốn kích hoạt lại ghi danh của "${enrollment.studentName}" tại lớp "${enrollment.classTitle || enrollment.classCode}"?`,
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedEnrollment || !confirmAction) return;

    try {
      let response;
      switch (confirmAction.action) {
        case "pause":
          response = await pauseEnrollment(selectedEnrollment.id);
          break;
        case "drop":
          response = await dropEnrollment(selectedEnrollment.id);
          break;
        case "reactivate":
          response = await reactivateEnrollment(selectedEnrollment.id);
          break;
        default:
          return;
      }

      if (response.isSuccess) {
        toast({ title: "Thành công", description: "Đã cập nhật trạng thái ghi danh" });
        fetchEnrollments();
        fetchInitialData();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể cập nhật trạng thái",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Đã xảy ra lỗi";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setIsConfirmModalOpen(false);
      setSelectedEnrollment(null);
      setConfirmAction(null);
    }
  };

  const handleView = (enrollment: Enrollment) => {
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

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ========== Sorting ==========

  const sortedEnrollments = [...enrollments].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a as any)[sortKey] || "";
    const bVal = (b as any)[sortKey] || "";
    const cmp = String(aVal).localeCompare(String(bVal), "vi");
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div
      className={`transition-all duration-700 ${
        isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-pink-500" size={28} />
              Quản lý ghi danh
            </h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý ghi danh học viên vào các lớp học</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchEnrollments();
                fetchInitialData();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-200 text-gray-700 hover:bg-pink-50 transition-colors text-sm"
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Tạo ghi danh
            </button>
          </div>
        </div>

        {/* Stats */}
        <EnrollmentStats enrollments={allEnrollments} isLoading={isLoading && allEnrollments.length === 0} />

        {/* Filters */}
        <EnrollmentFilters
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          pageSize={pageSize}
          totalCount={totalCount}
          statusCounts={statusCounts}
          onSearchChange={setSearchQuery}
          onStatusChange={handleStatusChange}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Table */}
        <EnrollmentTable
          enrollments={sortedEnrollments}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={totalCount}
          onView={handleView}
          onPageChange={setCurrentPage}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onPause={handlePause}
          onDrop={handleDrop}
          onReactivate={handleReactivate}
        />

        {/* Create Modal */}
        <EnrollmentFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleCreateEnrollment}
        />

        {/* Detail Modal */}
        <EnrollmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEnrollment(null);
          }}
          enrollment={selectedEnrollment}
        />

        {/* Confirm Modal */}
        {isConfirmModalOpen && confirmAction && (
          <ConfirmModal
            isOpen={isConfirmModalOpen}
            onClose={() => {
              setIsConfirmModalOpen(false);
              setConfirmAction(null);
              setSelectedEnrollment(null);
            }}
            onConfirm={handleConfirmAction}
            title={confirmAction.title}
            message={confirmAction.message}
          />
        )}
      </div>
    </div>
  );
}
