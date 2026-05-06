"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus, RefreshCw, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import {
  getAllEnrollments,
  createEnrollment,
  pauseEnrollment,
  dropEnrollment,
  reactivateEnrollment,
} from "@/lib/api/enrollmentService";
import {
  extractDomainErrorCode,
  getDomainErrorMessage,
} from "@/lib/api/domainErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Enrollment, CreateEnrollmentRequest } from "@/types/enrollment";
import {
  EnrollmentStats,
  EnrollmentTable,
  EnrollmentFormModal,
  EnrollmentDetailModal,
  EnrollmentScheduleSegmentModal,
} from "@/components/portal/enrollments";
import ConfirmModal from "@/components/ConfirmModal";

const getEnrollmentErrorTitle = (error: unknown) => {
  const code = extractDomainErrorCode(error);

  if (
    code === "Enrollment.StudentScheduleConflict" ||
    code === "Registration.StudentScheduleConflict" ||
    code === "StudentScheduleConflict"
  ) {
    return "Trùng lịch học";
  }

  if (code === "Enrollment.ClassFull" || code === "ClassFull") {
    return "Lớp đã đủ sĩ số";
  }

  if (code === "Enrollment.AlreadyEnrolled" || code === "AlreadyEnrolled") {
    return "Đã có ghi danh";
  }

  return "Lỗi";
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
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isScheduleSegmentModalOpen, setIsScheduleSegmentModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [scheduleSegmentEnrollment, setScheduleSegmentEnrollment] = useState<Enrollment | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);

  // Page loaded state
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    if (currentUser && !isLoadingUser) {
      fetchInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, selectedStatus, debouncedSearchQuery, currentUser, isLoadingUser]);

  // ========== Data fetching ==========

  const fetchInitialData = async () => {
    try {
      if (!currentUser || isLoadingUser) return;

      const response = await getAllEnrollments({ pageSize: 1000 });

      if (response.isSuccess && response.data) {
        const allData = Array.isArray(response.data.items) ? response.data.items : [];
        setAllEnrollments(allData);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);

      const params: Record<string, string | number> = {
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
        description: getDomainErrorMessage(error, "Không thể tải danh sách ghi danh."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedStatus, debouncedSearchQuery, toast]);

  // ========== Handlers ==========

  const handleCreateEnrollment = async (data: CreateEnrollmentRequest) => {
    try {
      const response = await createEnrollment(data);
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
    } catch (error: unknown) {
      toast({
        title: getEnrollmentErrorTitle(error),
        description: getDomainErrorMessage(error, "Không thể tạo ghi danh."),
        variant: "destructive",
      });
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
    } catch (error: unknown) {
      toast({
        title: getEnrollmentErrorTitle(error),
        description: getDomainErrorMessage(error, "Không thể cập nhật trạng thái ghi danh."),
        variant: "destructive",
      });
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

  const canManageScheduleSegment = (enrollment: Enrollment) => {
    if (enrollment.track === "secondary") return true;

    const normalizedSource = [
      enrollment.programName,
      enrollment.classTitle,
      enrollment.classCode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return /(supplementary|makeup|compensatory|bù|\bbu\b)/i.test(normalizedSource);
  };

  const handleManageScheduleSegment = (enrollment: Enrollment) => {
    if (!canManageScheduleSegment(enrollment)) {
      toast({
        title: "Không áp dụng",
        description: "Schedule segment chỉ áp dụng cho chương trình bù.",
        variant: "destructive",
      });
      return;
    }

    setScheduleSegmentEnrollment(enrollment);
    setIsScheduleSegmentModalOpen(true);
  };

  // ========== Sorting ==========

  const sortedEnrollments = [...enrollments].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof Enrollment] ?? "";
    const bVal = b[sortKey as keyof Enrollment] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal), "vi");
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div
      className={`transition-all duration-700 ${
        isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6 px-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BookOpen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quản lý ghi danh</h1>
              <p className="text-sm text-gray-600 mt-1">Quản lý ghi danh học viên vào các lớp học</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                fetchEnrollments();
                fetchInitialData();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-linear-to-r from-white to-red-50 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tạo ghi danh
            </button>
          </div>
        </div>

        {/* Stats */}
        <EnrollmentStats enrollments={allEnrollments} isLoading={isLoading && allEnrollments.length === 0} />

        {/* Filters */}
        <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1 lg:flex-1">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã ghi danh, tên học viên, lớp học..."
                className="w-full h-10 rounded-xl border border-red-300 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 shrink-0" />
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-10 w-auto min-w-35 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tất cả">Tất cả</SelectItem>
                  <SelectItem value="Active">Đang học</SelectItem>
                  <SelectItem value="Paused">Tạm nghỉ</SelectItem>
                  <SelectItem value="Dropped">Đã nghỉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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
          onManageScheduleSegment={handleManageScheduleSegment}
          canManageScheduleSegment={canManageScheduleSegment}
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
          onChanged={() => {
            fetchEnrollments();
            fetchInitialData();
          }}
        />

        <EnrollmentScheduleSegmentModal
          isOpen={isScheduleSegmentModalOpen}
          onClose={() => {
            setIsScheduleSegmentModalOpen(false);
            setScheduleSegmentEnrollment(null);
          }}
          enrollment={scheduleSegmentEnrollment}
          onChanged={() => {
            fetchEnrollments();
            fetchInitialData();
          }}
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
