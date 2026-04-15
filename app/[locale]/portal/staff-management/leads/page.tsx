"use client";

import { useEffect, useMemo, useState, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Target,
  UserPlus,
  Download,
  CalendarClock,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import {
  getAllLeads,
  updateLeadStatus,
  getLeadChildren,
} from "@/lib/api/leadService";
import {
  getAllPlacementTests,
  createPlacementTest,
  createPlacementTestRetake,
  getPlacementTestErrorMessage,
  updatePlacementTest,
} from "@/lib/api/placementTestService";
import { getAllUsers } from "@/lib/api/userService";
import { getAllStudents } from "@/lib/api/profileService";
import { getAllClasses } from "@/lib/api/classService";
import { getAccessToken } from "@/lib/store/authToken";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCreateAccountFromTest } from "@/hooks/useCreateAccountFromTest";
import type { Lead as LeadType } from "@/types/lead";
import type {
  PlacementTest,
  PlacementTestResultRequest,
} from "@/types/placement-test";
import {
  ADMIN_ENDPOINTS,
  BRANCH_ENDPOINTS,
  PLACEMENT_TEST_ENDPOINTS,
} from "@/constants/apiURL";
import CreateAccountProfileModal from "@/components/portal/placement-tests/CreateAccountProfileModal";
import {
  LeadStats,
  LeadFilters,
  LeadTable,
  LeadFormModal,
  SelfAssignModal,
  LeadDetailModal,
} from "@/components/portal/leads";
import {
  PlacementTestStats,
  PlacementTestFilters,
  PlacementTestTable,
  PlacementTestFormModal,
  PlacementTestDetailModal,
  ResultFormModal,
  RegistrationFlowModal,
} from "@/components/portal/placement-tests";
import type { PlacementTestFormSubmitPayload } from "@/components/portal/placement-tests/PlacementTestFormModal";
import NoteFormModal from "@/components/portal/placement-tests/NoteFormModal";
import ConvertToEnrolledModal from "@/components/portal/placement-tests/ConvertToEnrolledModal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  EnrollmentStats,
  EnrollmentFilters,
  EnrollmentTable,
  EnrollmentFormModal,
  EnrollmentDetailModal,
} from "@/components/portal/enrollments";
import {
  getAllEnrollments,
  createEnrollment,
  pauseEnrollment,
  dropEnrollment,
  reactivateEnrollment,
} from "@/lib/api/enrollmentService";
import { getRegistrations } from "@/lib/api/registrationService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import type { Enrollment, EnrollmentStatus } from "@/types/enrollment";
import { StaffRegistrationOverview } from "@/components/portal/registrations";

type StatusType =
  | "New"
  | "Contacted"
  | "BookedTest"
  | "TestDone"
  | "Enrolled"
  | "Lost";

const STATUS_MAPPING: Record<StatusType, string> = {
  New: "Mới",
  Contacted: "Đang tư vấn",
  BookedTest: "Đã đặt lịch test",
  TestDone: "Đã test",
  Enrolled: "Đã ghi danh",
  Lost: "Đã hủy",
};

function parseDateValue(value?: string) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortPlacementTestsByNewest(items: PlacementTest[]): PlacementTest[] {
  return [...items].sort((a, b) => {
    const bt = parseDateValue(b.createdAt || b.scheduledAt);
    const at = parseDateValue(a.createdAt || a.scheduledAt);
    return bt - at;
  });
}

function resolveUserBranchId(user: any): string {
  return String(user?.branchId || user?.branch?.id || "");
}

function throwApiFailure(response: any, fallbackMessage: string): never {
  const error = new Error(response?.message || fallbackMessage) as Error & {
    response?: { status?: number; data?: unknown };
    raw?: unknown;
  };
  error.response = {
    status: response?.status,
    data: response,
  };
  error.raw = response;
  throw error;
}

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLinkHandledRef = useRef(false);

  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const {
    isCreateAccountModalOpen,
    selectedLeadInfo,
    handleCreateAccount,
    closeCreateAccountModal,
    setIsCreateAccountModalOpen,
  } = useCreateAccountFromTest();

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "leads" | "placement_tests" | "registrations" | "enrollments"
  >("leads");
  const [registrationTotalCount, setRegistrationTotalCount] = useState(0);

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
  const [sortKey, setSortKey] = useState<string | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSelfAssignModalOpen, setIsSelfAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);

  // Placement Test state
  const [placementTests, setPlacementTests] = useState<PlacementTest[]>([]);
  const [allPlacementTests, setAllPlacementTests] = useState<PlacementTest[]>(
    [],
  );
  const [branchLeadIds, setBranchLeadIds] = useState<Set<string> | null>(null);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [testCurrentPage, setTestCurrentPage] = useState(1);
  const [testPageSize, setTestPageSize] = useState(10);
  const [testTotalCount, setTestTotalCount] = useState(0);
  const [testTotalPages, setTestTotalPages] = useState(0);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [debouncedTestSearchQuery, setDebouncedTestSearchQuery] = useState("");
  const [testSelectedStatus, setTestSelectedStatus] =
    useState<string>("Tất cả");
  const [testSortKey, setTestSortKey] = useState<string | null>(null);
  const [testSortDir, setTestSortDir] = useState<"asc" | "desc">("asc");
  const [testFromDate, setTestFromDate] = useState("");
  const [testToDate, setTestToDate] = useState("");
  const [testStatusCounts, setTestStatusCounts] = useState<
    Record<string, number>
  >({});
  const [isTestFormModalOpen, setIsTestFormModalOpen] = useState(false);
  const [isTestDetailModalOpen, setIsTestDetailModalOpen] = useState(false);
  const [isTestResultModalOpen, setIsTestResultModalOpen] = useState(false);
  const [isTestConfirmModalOpen, setIsTestConfirmModalOpen] = useState(false);
  const [testConfirmAction, setTestConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);
  const [selectedTest, setSelectedTest] = useState<PlacementTest | null>(null);
  const [testFormDefaultMode, setTestFormDefaultMode] = useState<"create" | "retake">("create");
  const [retakeSourceTestId, setRetakeSourceTestId] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isRegistrationFlowOpen, setIsRegistrationFlowOpen] = useState(false);
  const deepLinkedTab = searchParams.get("tab");
  const deepLinkedPlacementTestId = searchParams.get("placementTestId");

  // Enrollment state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [branchClassIds, setBranchClassIds] = useState<Set<string> | null>(
    null,
  );
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollCurrentPage, setEnrollCurrentPage] = useState(1);
  const [enrollPageSize, setEnrollPageSize] = useState(10);
  const [enrollTotalCount, setEnrollTotalCount] = useState(0);
  const [enrollTotalPages, setEnrollTotalPages] = useState(0);
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");
  const [debouncedEnrollSearchQuery, setDebouncedEnrollSearchQuery] =
    useState("");
  const [enrollSelectedStatus, setEnrollSelectedStatus] =
    useState<string>("Tất cả");
  const [enrollStatusCounts, setEnrollStatusCounts] = useState<
    Record<string, number>
  >({});
  const [enrollSortKey, setEnrollSortKey] = useState<string | null>(null);
  const [enrollSortDir, setEnrollSortDir] = useState<"asc" | "desc">("asc");
  const [isEnrollFormModalOpen, setIsEnrollFormModalOpen] = useState(false);
  const [isEnrollDetailModalOpen, setIsEnrollDetailModalOpen] = useState(false);
  const [isEnrollConfirmModalOpen, setIsEnrollConfirmModalOpen] =
    useState(false);
  const [enrollConfirmAction, setEnrollConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);

  // Dropdown data for PlacementTestFormModal
  const [modalLeads, setModalLeads] = useState<
    Array<{
      id: string;
      contactName: string;
      children?: Array<{ id: string; name: string }>;
    }>
  >([]);
  const [modalStudentProfiles, setModalStudentProfiles] = useState<
    Array<{ id: string; fullName: string; branchId?: string; profileType?: string }>
  >([]);
  const [modalClasses, setModalClasses] = useState<
    Array<{ id: string; className: string }>
  >([]);
  const [modalInvigilators, setModalInvigilators] = useState<
    Array<{ id: string; fullName: string; role: string }>
  >([]);
  const [retakeBranches, setRetakeBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [retakePrograms, setRetakePrograms] = useState<Array<{ id: string; name: string; branchId?: string }>>([]);
  const [retakeTuitionPlans, setRetakeTuitionPlans] = useState<Array<{ id: string; name: string; programId: string; branchId?: string }>>([]);

  useEffect(() => {
    setIsPageLoaded(true);
    // Fetch initial data for stats and filters when user data is available
    if (currentUser && !isLoadingUser) {
      fetchInitialData();
      fetchInitialTestData();
      fetchInitialEnrollmentData();
      fetchInitialRegistrationData();
    }
  }, [currentUser, isLoadingUser]);

  useEffect(() => {
    if (deepLinkedTab === "leads") {
      setActiveTab("leads");
      return;
    }

    if (deepLinkedTab === "placement_tests") {
      setActiveTab("placement_tests");
      return;
    }

    if (deepLinkedTab === "registrations") {
      setActiveTab("registrations");
      return;
    }

    if (deepLinkedTab === "enrollments") {
      setActiveTab("enrollments");
    }
  }, [deepLinkedTab]);

  useEffect(() => {
    if (!deepLinkedPlacementTestId || deepLinkHandledRef.current) return;

    const clearPlacementTestQuery = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("placementTestId");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    };

    const openPlacementTestDetailFromQuery = async () => {
      setActiveTab("placement_tests");

      const scopedPlacementTests =
        branchLeadIds !== null
          ? allPlacementTests.filter((test) => branchLeadIds.has(test.leadId))
          : allPlacementTests;

      const matchedTest =
        scopedPlacementTests.find((test) => test.id === deepLinkedPlacementTestId) ||
        allPlacementTests.find((test) => test.id === deepLinkedPlacementTestId);

      if (matchedTest) {
        setSelectedTest(matchedTest);
        setIsTestDetailModalOpen(true);
        deepLinkHandledRef.current = true;
        clearPlacementTestQuery();
        return;
      }

      if (isLoadingTests) {
        return;
      }

      try {
        const response = await fetch(PLACEMENT_TEST_ENDPOINTS.GET_BY_ID(deepLinkedPlacementTestId), {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error("Không tìm thấy bài kiểm tra đầu vào");
        }

        const data = await response.json();
        const placementTest = data?.data?.placementTest || data?.data || null;

        if (placementTest) {
          setSelectedTest(placementTest);
          setIsTestDetailModalOpen(true);
        }

        deepLinkHandledRef.current = true;
        clearPlacementTestQuery();
      } catch {
        deepLinkHandledRef.current = true;
        clearPlacementTestQuery();
        toast({
          variant: "destructive",
          title: "Không tìm thấy bài kiểm tra",
          description: "Không thể mở chi tiết bài kiểm tra đầu vào từ ghi chú này.",
        });
      }
    };

    void openPlacementTestDetailFromQuery();
  }, [
    allPlacementTests,
    branchLeadIds,
    deepLinkedPlacementTestId,
    isLoadingTests,
    pathname,
    router,
    searchParams,
    toast,
  ]);

  // Debounce search query (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce test search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTestSearchQuery(testSearchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [testSearchQuery]);

  // Debounce enrollment search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEnrollSearchQuery(enrollSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [enrollSearchQuery]);

  const fetchInitialData = async () => {
    try {
      // Only fetch if user data is loaded and has branchId
      if (!currentUser || isLoadingUser) return;

      // Fetch all leads without filters for stats and filter options, but filtered by branch preference
      const response = await getAllLeads({
        pageSize: 1000,
        branchPreference: currentUser.branchId, // Filter by staff's branch preference
      });

      if (response.isSuccess && response.data.leads) {
        const allLeadsData = response.data.leads;
        setAllLeads(allLeadsData);
        setBranchLeadIds(new Set(allLeadsData.map((l) => l.id)));

        // Extract available sources
        const sources = new Set(
          allLeadsData.map((l) => l.source).filter(Boolean),
        );
        setAvailableSources(Array.from(sources));

        // Calculate status counts
        const counts: Record<string, number> = {
          "Tất cả": allLeadsData.length,
        };

        Object.entries(STATUS_MAPPING).forEach(([engStatus, vnStatus]) => {
          counts[vnStatus] = allLeadsData.filter(
            (l) => l.status === engStatus,
          ).length;
        });

        setStatusCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  // Fetch initial placement test data for stats
  const fetchInitialTestData = async () => {
    try {
      if (!currentUser || isLoadingUser) return;

      const response = await getAllPlacementTests({
        pageSize: 1000,
        branchId: currentUser.branchId,
      });

      if (response.isSuccess && response.data) {
        const allTestsData = Array.isArray(response.data.items)
          ? response.data.items
          : [];
        setAllPlacementTests(sortPlacementTestsByNewest(allTestsData));

        // Calculate status counts
        const counts: Record<string, number> = {
          "Tất cả": allTestsData.length,
          Scheduled: allTestsData.filter((t) => t.status === "Scheduled")
            .length,
          Completed: allTestsData.filter((t) => t.status === "Completed")
            .length,
          Cancelled: allTestsData.filter((t) => t.status === "Cancelled")
            .length,
          NoShow: allTestsData.filter((t) => t.status === "NoShow").length,
        };

        setTestStatusCounts(counts);
        setTestTotalCount(allTestsData.length);
      }
    } catch (error) {
      console.error("Error fetching initial test data:", error);
    }
  };

  // Fetch placement tests with filters
  useEffect(() => {
    if (currentUser && !isLoadingUser && activeTab === "placement_tests") {
      fetchPlacementTests();
    }
  }, [
    testCurrentPage,
    testPageSize,
    debouncedTestSearchQuery,
    testSelectedStatus,
    testFromDate,
    testToDate,
    currentUser,
    isLoadingUser,
    activeTab,
  ]);

  const fetchPlacementTests = async () => {
    try {
      if (!currentUser || isLoadingUser) return;

      setIsLoadingTests(true);

      const response = await getAllPlacementTests({
        page: 1,
        pageSize: 1000,
        branchId: currentUser.branchId,
      });

      if (response.isSuccess && response.data.items) {
        const sorted = sortPlacementTestsByNewest(response.data.items);
        setAllPlacementTests(sorted);
        setPlacementTests(sorted);
      }
    } catch (err: any) {
      console.error("Error fetching placement tests:", err);
      toast({
        title: "Lỗi",
        description:
          "Không thể tải danh sách kiểm tra xếp lớp. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Fetch initial enrollment data for stats
  const fetchInitialEnrollmentData = async () => {
    try {
      if (!currentUser || isLoadingUser) return;
      const response = await getAllEnrollments({
        pageSize: 1000,
        branchId: currentUser.branchId,
      });
      if (response.isSuccess && response.data) {
        const allItems = Array.isArray(response.data.items)
          ? response.data.items
          : [];
        setAllEnrollments(allItems);
        const counts: Record<string, number> = {
          "Tất cả": allItems.length,
          Active: allItems.filter((e) => e.status === "Active").length,
          Paused: allItems.filter((e) => e.status === "Paused").length,
          Dropped: allItems.filter((e) => e.status === "Dropped").length,
        };
        setEnrollStatusCounts(counts);
        setEnrollTotalCount(allItems.length);
      } else {
        console.warn("Enrollment API returned unsuccessful:", response.message);
        setAllEnrollments([]);
        setEnrollStatusCounts({
          "Tất cả": 0,
          Active: 0,
          Paused: 0,
          Dropped: 0,
        });
        setEnrollTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching initial enrollment data:", error);
    }
  };

  const fetchInitialRegistrationData = async () => {
    try {
      if (!currentUser || isLoadingUser) return;
      const branchId = resolveUserBranchId(currentUser);
      if (!branchId) {
        setRegistrationTotalCount(0);
        return;
      }

      const response = await getRegistrations({
        branchId,
        pageNumber: 1,
        pageSize: 1000,
      });
      const items = response.items || [];
      setRegistrationTotalCount(
        Math.max(Number(response.totalCount || 0), items.length),
      );
    } catch (error) {
      console.error("Error fetching initial registration count:", error);
      setRegistrationTotalCount(0);
    }
  };

  useEffect(() => {
    const fetchBranchClassIds = async () => {
      if (!currentUser?.branchId) {
        setBranchClassIds(null);
        return;
      }

      try {
        const response = await getAllClasses({ pageSize: 1000 });
        const rawData = response?.data || response || {};
        const responseData = rawData?.data || rawData;
        const classes =
          responseData?.classes?.items ||
          responseData?.items ||
          (Array.isArray(responseData) ? responseData : []);
        const ids = new Set<string>(
          classes
            .filter((c: any) => c.branchId === currentUser.branchId)
            .map((c: any) => c.id as string),
        );
        setBranchClassIds(ids);
      } catch {
        setBranchClassIds(new Set<string>());
      }
    };

    if (currentUser && !isLoadingUser) {
      fetchBranchClassIds();
    }
  }, [currentUser, isLoadingUser]);

  // Fetch enrollments with filters
  useEffect(() => {
    if (currentUser && !isLoadingUser && activeTab === "enrollments") {
      fetchEnrollments();
    }
  }, [
    enrollCurrentPage,
    enrollPageSize,
    debouncedEnrollSearchQuery,
    enrollSelectedStatus,
    currentUser,
    isLoadingUser,
    activeTab,
  ]);

  const fetchEnrollments = async () => {
    try {
      if (!currentUser || isLoadingUser) return;
      setIsLoadingEnrollments(true);
      const response = await getAllEnrollments({
        pageNumber: 1,
        pageSize: 1000,
        branchId: currentUser.branchId,
      });
      if (response.isSuccess && response.data) {
        const allItems = Array.isArray(response.data.items)
          ? response.data.items
          : [];
        setAllEnrollments(allItems);
        setEnrollments(allItems);
      }
    } catch (err: any) {
      console.error("Error fetching enrollments:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách ghi danh.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    if (currentUser && !isLoadingUser) {
      fetchLeads();
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearchQuery,
    selectedStatus,
    selectedSource,
    myLeadsOnly,
    currentUser,
    isLoadingUser,
  ]);

  const fetchLeads = async () => {
    try {
      // Don't fetch if user data is not ready
      if (!currentUser || isLoadingUser) return;

      setIsLoading(true);
      setError(null);

      // Map Vietnamese status to English status
      const getEnglishStatus = (
        vietnameseStatus: string,
      ): string | undefined => {
        if (vietnameseStatus === "Tất cả") return undefined;
        const entry = Object.entries(STATUS_MAPPING).find(
          ([_, vn]) => vn === vietnameseStatus,
        );
        return entry ? entry[0] : undefined;
      };

      const response = await getAllLeads({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearchQuery || undefined,
        status: getEnglishStatus(selectedStatus),
        source: selectedSource !== "Tất cả" ? selectedSource : undefined,
        branchPreference: currentUser.branchId, // Filter by staff's branch preference
        ownerStaffId: myLeadsOnly ? currentUser.id : undefined, // Filter chỉ lead của tôi
      });

      if (response.isSuccess && response.data.leads) {
        setLeads(response.data.leads);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách khách tiềm năng");
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách tiềm năng. Vui lòng thử lại.",
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

  const scopedLeadCounts = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();

    const scoped = allLeads.filter((lead) => {
      const sourceMatched = selectedSource === "Tất cả" || lead.source === selectedSource;
      const ownerMatched = !myLeadsOnly || lead.ownerStaffId === currentUser?.id;
      const searchMatched =
        !query ||
        [
          lead.contactName || "",
          lead.phone || "",
          lead.email || "",
          lead.id || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return sourceMatched && ownerMatched && searchMatched;
    });

    const counts: Record<string, number> = {
      "Tất cả": scoped.length,
    };

    Object.entries(STATUS_MAPPING).forEach(([engStatus, vnStatus]) => {
      counts[vnStatus] = scoped.filter((lead) => lead.status === engStatus).length;
    });

    return counts;
  }, [allLeads, selectedSource, myLeadsOnly, currentUser?.id, debouncedSearchQuery]);

  const branchScopedPlacementTests = useMemo(() => {
    return branchLeadIds !== null
      ? allPlacementTests.filter((test) => branchLeadIds.has(test.leadId))
      : allPlacementTests;
  }, [allPlacementTests, branchLeadIds]);

  const branchScopedEnrollments = useMemo(() => {
    return branchClassIds !== null
      ? allEnrollments.filter((e) => branchClassIds.has(e.classId))
      : allEnrollments;
  }, [allEnrollments, branchClassIds]);

  const filteredPlacementTests = useMemo(() => {
    let result = [...branchScopedPlacementTests];

    if (testSelectedStatus !== "Tất cả") {
      result = result.filter((test) => test.status === testSelectedStatus);
    }

    if (debouncedTestSearchQuery) {
      const query = debouncedTestSearchQuery.toLowerCase();
      result = result.filter(
        (test) =>
          test.childName?.toLowerCase().includes(query) ||
          test.leadContactName?.toLowerCase().includes(query) ||
          test.invigilatorName?.toLowerCase().includes(query),
      );
    }

    if (testFromDate) {
      result = result.filter((test) => test.scheduledAt >= testFromDate);
    }
    if (testToDate) {
      const toDateEnd = testToDate + "T23:59:59";
      result = result.filter((test) => test.scheduledAt <= toDateEnd);
    }

    if (testSortKey) {
      result = [...result].sort((a: any, b: any) => {
        const av = String(a?.[testSortKey] ?? "");
        const bv = String(b?.[testSortKey] ?? "");
        const compared = av.localeCompare(bv, "vi", {
          numeric: true,
          sensitivity: "base",
        });
        return testSortDir === "asc" ? compared : -compared;
      });
    }

    return result;
  }, [
    branchScopedPlacementTests,
    testSelectedStatus,
    debouncedTestSearchQuery,
    testFromDate,
    testToDate,
    testSortKey,
    testSortDir,
  ]);

  const filteredPlacementStatusCounts = useMemo(() => {
    const dataToCount = branchScopedPlacementTests;
    const counts: Record<string, number> = {
      "Tất cả": dataToCount.length,
      Scheduled: dataToCount.filter((t) => t.status === "Scheduled").length,
      Completed: dataToCount.filter((t) => t.status === "Completed").length,
      Cancelled: dataToCount.filter((t) => t.status === "Cancelled").length,
      NoShow: dataToCount.filter((t) => t.status === "NoShow").length,
    };
    return counts;
  }, [branchScopedPlacementTests]);

  const placementTotalCount = filteredPlacementTests.length;
  const placementTotalPages = Math.max(
    1,
    Math.ceil(placementTotalCount / testPageSize),
  );
  const pagedPlacementTests = filteredPlacementTests.slice(
    (testCurrentPage - 1) * testPageSize,
    testCurrentPage * testPageSize,
  );

  const filteredEnrollments = useMemo(() => {
    let result = [...branchScopedEnrollments];

    if (enrollSelectedStatus !== "Tất cả") {
      result = result.filter(
        (enrollment) => enrollment.status === enrollSelectedStatus,
      );
    }

    if (debouncedEnrollSearchQuery) {
      const query = debouncedEnrollSearchQuery.toLowerCase();
      result = result.filter(
        (enrollment) =>
          enrollment.studentName?.toLowerCase().includes(query) ||
          enrollment.classTitle?.toLowerCase().includes(query) ||
          enrollment.classCode?.toLowerCase().includes(query) ||
          enrollment.programName?.toLowerCase().includes(query) ||
          enrollment.mainTeacherName?.toLowerCase().includes(query),
      );
    }

    if (enrollSortKey) {
      result = [...result].sort((a: any, b: any) => {
        const av = String(a?.[enrollSortKey] ?? "");
        const bv = String(b?.[enrollSortKey] ?? "");
        const compared = av.localeCompare(bv, "vi", {
          numeric: true,
          sensitivity: "base",
        });
        return enrollSortDir === "asc" ? compared : -compared;
      });
    }

    return result;
  }, [
    branchScopedEnrollments,
    enrollSelectedStatus,
    debouncedEnrollSearchQuery,
    enrollSortKey,
    enrollSortDir,
  ]);

  const filteredEnrollStatusCounts = useMemo(() => {
    const dataToCount = branchScopedEnrollments;
    const counts: Record<string, number> = {
      "Tất cả": dataToCount.length,
      Active: dataToCount.filter((e) => e.status === "Active").length,
      Paused: dataToCount.filter((e) => e.status === "Paused").length,
      Dropped: dataToCount.filter((e) => e.status === "Dropped").length,
    };
    return counts;
  }, [branchScopedEnrollments]);

  const enrollmentTotalCount = filteredEnrollments.length;
  const enrollmentTotalPages = Math.max(
    1,
    Math.ceil(enrollmentTotalCount / enrollPageSize),
  );
  const pagedEnrollments = filteredEnrollments.slice(
    (enrollCurrentPage - 1) * enrollPageSize,
    enrollCurrentPage * enrollPageSize,
  );

  const cycleSort = (
    key: string,
    currentKey: string | null,
    currentDir: "asc" | "desc",
    setKey: Dispatch<SetStateAction<string | null>>,
    setDir: Dispatch<SetStateAction<"asc" | "desc">>,
    defaultDir: "asc" | "desc" = "asc",
  ) => {
    if (currentKey !== key) {
      setKey(key);
      setDir(defaultDir);
      return;
    }

    if (currentDir === "asc") {
      setDir("desc");
      return;
    }

    setKey(null);
    setDir(defaultDir);
  };

  const toggleSort = (key: string) => {
    cycleSort(key, sortKey, sortDir, setSortKey, setSortDir, key === "createdAt" ? "desc" : "asc");
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
          description: "Khách tiềm năng này đã được phân công",
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
        description: "Đã cập nhật trạng thái khách tiềm năng thành công",
        variant: "success",
      });
      fetchLeads();
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Lỗi",
        description: getDomainErrorMessage(
          error,
          "Không thể cập nhật trạng thái khách tiềm năng",
        ),
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Reset to first page when test filters change
  useEffect(() => {
    if (testCurrentPage !== 1) {
      setTestCurrentPage(1);
    }
  }, [debouncedTestSearchQuery, testSelectedStatus, testFromDate, testToDate]);

  useEffect(() => {
    if (testCurrentPage > placementTotalPages) {
      setTestCurrentPage(1);
    }
  }, [testCurrentPage, placementTotalPages]);

  useEffect(() => {
    if (enrollCurrentPage > enrollmentTotalPages) {
      setEnrollCurrentPage(1);
    }
  }, [enrollCurrentPage, enrollmentTotalPages]);

  // Fetch dropdown data for Placement Test Form Modal
  const fetchModalDropdownData = async () => {
    if (!currentUser) return;
    const branchId = String(currentUser.branchId || "");

    try {
      // Fetch all leads for this branch (không filter status để có thể tạo test cho mọi lead)
      const leadsRes = await getAllLeads({ branchPreference: branchId, pageSize: 1000 });
      if (leadsRes.isSuccess && leadsRes.data?.leads) {
        const branchScopedLeads = branchId
          ? leadsRes.data.leads.filter((lead: any) => {
              const leadBranchId = String(
                lead?.branchPreference ||
                  lead?.branchPreferenceId ||
                  lead?.branch?.id ||
                  lead?.branchId ||
                  "",
              );
              return leadBranchId === branchId;
            })
          : leadsRes.data.leads;

        const leadsWithChildren = await Promise.all(
          branchScopedLeads.map(async (lead: any) => {
            let children = lead.children || [];
            if (children.length === 0) {
              try {
                const childrenRes = await getLeadChildren(lead.id);
                if (childrenRes.isSuccess && childrenRes.data) {
                  // Response structure: { children: LeadChild[] }
                  children =
                    childrenRes.data.children ||
                    (Array.isArray(childrenRes.data) ? childrenRes.data : []);
                }
              } catch {
                /* ignore */
              }
            }
            return {
              id: lead.id,
              contactName: lead.contactName || lead.fullName || "N/A",
              children: children.map((c: any) => ({
                id: c.id,
                name: c.childName || c.name || "N/A",
              })),
            };
          }),
        );
        setModalLeads(leadsWithChildren);
      }

      // Fetch student profiles
      const profilesRes = await getAllStudents({
        branchId,
        profileType: "Student",
        pageSize: 1000,
      });
      if (profilesRes.isSuccess && profilesRes.data) {
        const profiles = profilesRes.data.items || [];
        const mapped = profiles.map((p: any) => ({
          id: p.id,
          fullName: p.displayName || p.fullName || p.studentName || "N/A",
          branchId: p.branchId || p.branch?.id || p.branch?.branchId || "",
          profileType: p.profileType || "",
        }));
        setModalStudentProfiles(mapped);
      }

      // Fetch classes
      try {
        const classRes = await fetch(
          `${ADMIN_ENDPOINTS.CLASSROOMS}?pageSize=1000&pageNumber=1&isActive=true&branchId=${branchId}`,
          {
            headers: { Authorization: `Bearer ${getAccessToken()}` },
          },
        );
        if (classRes.ok) {
          const classData = await classRes.json();
          const classItems =
            classData.data?.classrooms?.items ||
            classData.data?.items ||
            classData.data?.classrooms ||
            classData.data ||
            classData.classrooms?.items ||
            classData.classrooms ||
            [];
          const mapped = classItems.map((c: any) => ({
            id: c.id,
            className: c.roomName || c.classroomName || c.name || c.code || "N/A",
          }));
          setModalClasses(mapped);
        }
      } catch {
        /* ignore */
      }

      // Fetch invigilators (Admin + ManagementStaff)
      const [adminRes, staffRes] = await Promise.all([
        getAllUsers({ role: "Admin", isActive: true, pageSize: 1000 }),
        getAllUsers({
          role: "ManagementStaff",
          isActive: true,
          pageSize: 1000,
        }),
      ]);
      const adminUsers =
        adminRes.isSuccess && adminRes.data?.items ? adminRes.data.items : [];
      const staffUsers =
        staffRes.isSuccess && staffRes.data?.items ? staffRes.data.items : [];
      const branchMatchedAdmin = branchId
        ? adminUsers.filter((u: any) => resolveUserBranchId(u) === branchId)
        : adminUsers;
      const branchMatchedStaff = branchId
        ? staffUsers.filter((u: any) => resolveUserBranchId(u) === branchId)
        : staffUsers;
      const invigilators = [
        ...branchMatchedAdmin.map((u: any) => ({
          id: u.id,
          fullName: u.name || u.fullName || u.username || u.email || "N/A",
          role: "Admin",
        })),
        ...branchMatchedStaff.map((u: any) => ({
          id: u.id,
          fullName: u.name || u.fullName || u.username || u.email || "N/A",
          role: "ManagementStaff",
        })),
      ];
      setModalInvigilators(invigilators);

      const [branchRes, programRes, tuitionRes] = await Promise.all([
        fetch(`${BRANCH_ENDPOINTS.GET_ALL_PUBLIC}?page=1&limit=1000&isActive=true`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        }),
        fetch(`${ADMIN_ENDPOINTS.PROGRAMS}?pageNumber=1&pageSize=1000`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        }),
        fetch(`${ADMIN_ENDPOINTS.TUITION_PLANS_ACTIVE}?pageNumber=1&pageSize=1000`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        }),
      ]);

      if (branchRes.ok) {
        const branchData = await branchRes.json();
        const branchItems =
          branchData?.data?.branches ||
          branchData?.data?.items ||
          branchData?.data ||
          branchData?.branches ||
          [];

        const mappedBranches = branchItems
          .map((branch: any) => ({
            id: String(branch?.id || ""),
            name: String(branch?.name || branch?.branchName || "N/A"),
          }))
          .filter((branch: { id: string }) => branch.id);

        setRetakeBranches(mappedBranches);
      }

      if (programRes.ok) {
        const programData = await programRes.json();
        const programItems =
          programData?.data?.programs?.items ||
          programData?.data?.items ||
          programData?.data?.programs ||
          programData?.data ||
          [];

        const mappedPrograms = programItems
          .map((program: any) => ({
            id: String(program?.id || ""),
            name: String(program?.name || "N/A"),
            branchId: program?.branchId ? String(program.branchId) : undefined,
          }))
          .filter((program: { id: string }) => program.id);

        setRetakePrograms(mappedPrograms);
      }

      if (tuitionRes.ok) {
        const tuitionData = await tuitionRes.json();
        const tuitionItems =
          tuitionData?.data?.tuitionPlans?.items ||
          tuitionData?.data?.items ||
          tuitionData?.data?.tuitionPlans ||
          tuitionData?.data ||
          [];

        const mappedTuitionPlans = tuitionItems
          .map((plan: any) => ({
            id: String(plan?.id || ""),
            name: String(plan?.name || "N/A"),
            programId: String(plan?.programId || ""),
            branchId: plan?.branchId ? String(plan.branchId) : undefined,
          }))
          .filter((plan: { id: string; programId: string }) => plan.id && plan.programId);

        setRetakeTuitionPlans(mappedTuitionPlans);
      }
    } catch (error) {
      console.error("❌ Error fetching modal dropdown data:", error);
    }
  };

  // Placement Test handlers
  const handleCreateTest = async () => {
    // Fetch dropdown data first, then open modal
    await fetchModalDropdownData();
    setTestFormDefaultMode("create");
    setRetakeSourceTestId("");
    setSelectedTest(null);
    setIsTestFormModalOpen(true);
  };

  const handleViewTest = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsTestDetailModalOpen(true);
  };

  const handleEditTest = (test: PlacementTest) => {
    setTestFormDefaultMode("create");
    setRetakeSourceTestId("");
    setSelectedTest(test);
    setIsTestFormModalOpen(true);
  };

  const handleRetakeFromTable = async (test: PlacementTest) => {
    if (test.status !== "Completed") {
      return;
    }

    await fetchModalDropdownData();
    setSelectedTest(null);
    setTestFormDefaultMode("retake");
    setRetakeSourceTestId(test.id);
    setIsTestFormModalOpen(true);
  };

  const handleAddResult = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsTestResultModalOpen(true);
  };

  const handleCancelTest = (test: PlacementTest) => {
    setSelectedTest(test);
    setTestConfirmAction({
      action: "cancel",
      title: "Hủy lịch test",
      message: "Bạn có chắc chắn muốn hủy lịch test này?",
    });
    setIsTestConfirmModalOpen(true);
  };

  const handleNoShowTest = (test: PlacementTest) => {
    setSelectedTest(test);
    setTestConfirmAction({
      action: "no-show",
      title: "Đánh dấu không đến",
      message: "Bạn có chắc chắn học viên không đến tham gia test?",
    });
    setIsTestConfirmModalOpen(true);
  };

  const handleConvertToEnrolled = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsConvertModalOpen(true);
  };

  const handleCreateAccountFromTest = async (test: PlacementTest) => {
    setSelectedTest(test);
    await handleCreateAccount(test);
  };

  const handleStartRegistrationFlow = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsRegistrationFlowOpen(true);
  };

  const handleAddNote = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsNoteModalOpen(true);
  };

  const handleTestFormSubmit = async (payload: PlacementTestFormSubmitPayload) => {
    try {
      let response: any = null;
      if (payload.action === "update") {
        if (!selectedTest) {
          throw new Error("Không tìm thấy bài kiểm tra xếp lớp để cập nhật");
        }
        response = await updatePlacementTest(selectedTest.id, payload.data);
      }

      if (payload.action === "create") {
        response = await createPlacementTest(payload.data);
      }

      if (payload.action === "retake") {
        response = await createPlacementTestRetake(payload.originalPlacementTestId, payload.data);
      }

      if (response && (response.isSuccess === false || response.success === false)) {
        throwApiFailure(response, "Không thể lưu bài kiểm tra xếp lớp");
      }

      toast({
        title: "Thành công",
        description:
          payload.action === "update"
            ? "Đã cập nhật bài kiểm tra xếp lớp"
            : payload.action === "retake"
              ? "Đã tạo bài kiểm tra xếp lớp kiểm tra lại"
              : "Đã tạo bài kiểm tra xếp lớp mới",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving placement test:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: getPlacementTestErrorMessage(error, "Không thể lưu bài kiểm tra xếp lớp"),
      });
      throw error; // Re-throw to prevent modal close
    }
  };

  const handleTestResultSubmit = async (
    data: Omit<PlacementTestResultRequest, "id">,
    note: string,
  ) => {
    if (!selectedTest) return;

    try {
      const token = getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const apiCalls: Promise<Response>[] = [
        fetch(PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(selectedTest.id), {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        }),
      ];

      if (note) {
        apiCalls.push(
          fetch(PLACEMENT_TEST_ENDPOINTS.ADD_NOTE(selectedTest.id), {
            method: "POST",
            headers,
            body: JSON.stringify({ note }),
          }),
        );
      }

      const responses = await Promise.all(apiCalls);
      const failedRes = responses.find((r) => !r.ok);
      if (failedRes) {
        const errorData = await failedRes.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to save results");
      }

      toast({
        title: "Thành công",
        description: note
          ? "Đã lưu kết quả và ghi chú kiểm tra xếp lớp"
          : "Đã lưu kết quả kiểm tra xếp lớp",
        variant: "success",
      });

      fetchPlacementTests();
      fetchInitialTestData();
      setIsTestResultModalOpen(false);
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể lưu kết quả",
      });
      throw error;
    }
  };

  const handleNoteSubmit = async (note: string) => {
    if (!selectedTest) return;

    try {
      const response = await fetch(
        PLACEMENT_TEST_ENDPOINTS.ADD_NOTE(selectedTest.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({ note }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to add note");
      }

      toast({
        title: "Thành công",
        description: "Đã thêm ghi chú",
        variant: "success",
      });

      fetchPlacementTests();
      fetchInitialTestData();
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể thêm ghi chú",
      });
      throw error;
    }
  };

  const handleConvertSubmit = async (studentProfileId: string) => {
    if (!selectedTest) return;

    try {
      const response = await fetch(
        PLACEMENT_TEST_ENDPOINTS.CONVERT_TO_ENROLLED(selectedTest.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({ studentProfileId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to convert");
      }

      toast({
        title: "Thành công",
        description: "Đã chuyển thành học viên chính thức",
        variant: "success",
      });

      fetchPlacementTests();
      fetchInitialTestData();
      setIsConvertModalOpen(false);
    } catch (error) {
      console.error("Error converting:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể chuyển đổi",
      });
      throw error;
    }
  };

  const handleTestConfirmAction = async () => {
    if (!selectedTest || !testConfirmAction) return;

    try {
      let url = "";
      switch (testConfirmAction.action) {
        case "cancel":
          url = PLACEMENT_TEST_ENDPOINTS.CANCEL(selectedTest.id);
          break;
        case "no-show":
          url = PLACEMENT_TEST_ENDPOINTS.NO_SHOW(selectedTest.id);
          break;
      }

      if (!url) return;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message: errorData?.message || "Không thể thực hiện thao tác kiểm tra xếp lớp",
        };
      }

      const responseData = await response.json().catch(() => null);
      if (responseData && (responseData.isSuccess === false || responseData.success === false)) {
        throwApiFailure(responseData, "Không thể thực hiện thao tác kiểm tra xếp lớp");
      }

      toast({
        title: "Thành công",
        description: "Đã thực hiện thao tác thành công",
        variant: "success",
      });

      fetchPlacementTests();
      fetchInitialTestData();
      setIsTestConfirmModalOpen(false);
    } catch (error) {
      console.error("Error performing action:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: getPlacementTestErrorMessage(
          error,
          "Không thể thực hiện thao tác kiểm tra xếp lớp",
        ),
      });
    }
  };

  const handleTestFormSuccess = () => {
    fetchPlacementTests();
    fetchInitialTestData();
    setTestFormDefaultMode("create");
    setRetakeSourceTestId("");
  };

  const handleTestPageChange = (page: number) => {
    setTestCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTestPageSizeChange = (size: number) => {
    setTestPageSize(size);
    setTestCurrentPage(1);
  };

  const handleTestSort = (key: string) => {
    cycleSort(key, testSortKey, testSortDir, setTestSortKey, setTestSortDir, key === "scheduledAt" ? "desc" : "asc");
  };

  // ========== Enrollment Handlers ==========
  const handleCreateEnrollment = () => {
    setIsEnrollFormModalOpen(true);
  };

  const handleEnrollmentFormSubmit = async (data: {
    classId: string;
    studentProfileId: string;
    enrollDate: string;
  }) => {
    try {
      const response = await createEnrollment(data);
      if (response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Tạo ghi danh thành công!",
          variant: "success",
        });
        fetchEnrollments();
        fetchInitialEnrollmentData();
        setIsEnrollFormModalOpen(false);
      } else {
        throwApiFailure(response, "Không thể tạo ghi danh");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: getDomainErrorMessage(error, "Không thể tạo ghi danh"),
      });
      throw error;
    }
  };

  const handleViewEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsEnrollDetailModalOpen(true);
  };

  const handlePauseEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setEnrollConfirmAction({
      action: "pause",
      title: "Tạm nghỉ ghi danh",
      message: `Bạn có chắc muốn cho học viên "${enrollment.studentName || "N/A"}" tạm nghỉ?`,
    });
    setIsEnrollConfirmModalOpen(true);
  };

  const handleDropEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setEnrollConfirmAction({
      action: "drop",
      title: "Cho nghỉ ghi danh",
      message: `Bạn có chắc muốn cho học viên "${enrollment.studentName || "N/A"}" nghỉ?`,
    });
    setIsEnrollConfirmModalOpen(true);
  };

  const handleReactivateEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setEnrollConfirmAction({
      action: "reactivate",
      title: "Kích hoạt lại ghi danh",
      message: `Bạn có chắc muốn kích hoạt lại ghi danh cho "${enrollment.studentName || "N/A"}"?`,
    });
    setIsEnrollConfirmModalOpen(true);
  };

  const handleEnrollConfirmAction = async () => {
    if (!selectedEnrollment || !enrollConfirmAction) return;
    try {
      let response;
      switch (enrollConfirmAction.action) {
        case "pause":
          response = await pauseEnrollment(selectedEnrollment.id);
          break;
        case "drop":
          response = await dropEnrollment(selectedEnrollment.id);
          break;
        case "reactivate":
          response = await reactivateEnrollment(selectedEnrollment.id);
          break;
      }
      if (response?.isSuccess) {
        toast({
          title: "Thành công",
          description: "Đã thực hiện thao tác thành công!",
          variant: "success",
        });
        fetchEnrollments();
        fetchInitialEnrollmentData();
      } else {
        throwApiFailure(response, "Không thể thực hiện thao tác ghi danh");
      }
    } catch (error: any) {
      const isScheduleConflict =
        error?.response?.data?.title === "Enrollment.StudentScheduleConflict";
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thực hiện thao tác";
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: getDomainErrorMessage(
          error,
          "Không thể thực hiện thao tác ghi danh",
        ),
      });
    } finally {
      setIsEnrollConfirmModalOpen(false);
    }
  };

  const handleEnrollPageChange = (page: number) => {
    setEnrollCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEnrollPageSizeChange = (size: number) => {
    setEnrollPageSize(size);
    setEnrollCurrentPage(1);
  };

  const handleEnrollSort = (key: string) => {
    cycleSort(key, enrollSortKey, enrollSortDir, setEnrollSortKey, setEnrollSortDir, "asc");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isPageLoaded
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Target size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Quản lý Khách tiềm năng & Kiểm tra xếp lớp
            </h1>
            <p className="text-sm text-gray-700 mt-1">
              Nhận khách tiềm năng, phân công tư vấn, đặt lịch kiểm tra và chuyển đổi ghi danh
              {currentUser?.branchName && (
                <span className="ml-2 text-red-600 font-medium">
                  • Chi nhánh: {currentUser.branchName}
                </span>
              )}
            </p>
          </div>
        </div>
        {activeTab === "leads" ? (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer text-gray-700">
              <Download size={16} /> Xuất DS
            </button>
            <button
              onClick={handleCreateLead}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <UserPlus size={16} /> Nhập khách tiềm năng mới
            </button>
          </div>
        ) : activeTab === "placement_tests" ? (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer text-gray-700">
              <Download size={16} /> Xuất DS Test
            </button>
            <button
              onClick={handleCreateTest}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <CalendarClock size={16} /> Đặt lịch test mới
            </button>
          </div>
        ) : activeTab === "enrollments" ? (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
              <Download size={16} /> Xuất DS Ghi danh
            </button>
            <button
              onClick={handleCreateEnrollment}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <BookOpen size={16} /> Tạo ghi danh mới
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors">
              <Download size={16} /> Xuất DS Đăng ký
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div
        className={`bg-white rounded-2xl border border-gray-200 p-1 inline-flex gap-1 transition-all duration-700 delay-100 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "leads"
              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Target size={16} />
            <span>Khách tiềm năng</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "leads"
                  ? "bg-white/20"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {allLeads.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("placement_tests")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "placement_tests"
              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarClock size={16} />
            <span>Kiểm tra xếp lớp</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "placement_tests"
                  ? "bg-white/20"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {branchScopedPlacementTests.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("registrations")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "registrations"
              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={16} />
            <span>Đăng ký</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "registrations"
                  ? "bg-white/20"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {registrationTotalCount}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "enrollments"
              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-600 hover:bg-pink-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>Ghi danh</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "enrollments" ? "bg-white/20" : "bg-gray-100"
              }`}
            >
              {branchScopedEnrollments.length}
            </span>
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "leads" && (
        <>
          <div
            className={`transition-all duration-700 delay-100 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <LeadStats leads={allLeads} isLoading={false} />
          </div>

          {/* Filter Bar */}
          <div
            className={`transition-all duration-700 delay-150 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            <LeadFilters
              leads={leads}
              totalCount={scopedLeadCounts["Tất cả"] ?? allLeads.length}
              statusCounts={scopedLeadCounts}
              availableSources={availableSources}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus}
              selectedSource={selectedSource}
              myLeadsOnly={myLeadsOnly}
              currentUserName={currentUser?.fullName}
              // pageSize={pageSize}
              onSearchChange={setSearchQuery}
              onStatusChange={setSelectedStatus}
              onSourceChange={setSelectedSource}
              onMyLeadsOnlyChange={setMyLeadsOnly}
              // onPageSizeChange={handlePageSizeChange}
            />
          </div>

          {/* Lead Table */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <LeadTable
              leads={filteredAndSortedLeads}
              isLoading={isLoading}
              sortKey={sortKey}
              sortDir={sortDir}
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
              onRefresh={() => {
                fetchLeads();
                fetchInitialData();
              }}
            />
          </div>
        </>
      )}

      {activeTab === "placement_tests" && (
        // Placement Test Content
        <>
          <div
            className={`transition-all duration-700 delay-100 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <PlacementTestStats
              tests={branchScopedPlacementTests}
              isLoading={false}
            />
          </div>

          {/* Filter Bar */}
          <div
            className={`transition-all duration-700 delay-150 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            <PlacementTestFilters
              searchQuery={testSearchQuery}
              selectedStatus={testSelectedStatus}
              fromDate={testFromDate}
              toDate={testToDate}
              pageSize={testPageSize}
              totalCount={branchScopedPlacementTests.length}
              statusCounts={filteredPlacementStatusCounts}
              onSearchChange={setTestSearchQuery}
              onStatusChange={setTestSelectedStatus}
              onFromDateChange={setTestFromDate}
              onToDateChange={setTestToDate}
              onPageSizeChange={handleTestPageSizeChange}
            />
          </div>

          {/* Placement Test Table */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <PlacementTestTable
              tests={pagedPlacementTests}
              isLoading={isLoadingTests}
              currentPage={testCurrentPage}
              totalPages={placementTotalPages}
              pageSize={testPageSize}
              totalCount={placementTotalCount}
              sortKey={testSortKey}
              sortDir={testSortDir}
              onSort={handleTestSort}
              onView={handleViewTest}
              onEdit={handleEditTest}
              onAddResult={handleAddResult}
              onAddNote={handleAddNote}
              onCancel={handleCancelTest}
              onNoShow={handleNoShowTest}
              onCreateAccount={handleCreateAccountFromTest}
              onStartRegistration={handleStartRegistrationFlow}
              onRetake={handleRetakeFromTable}
              onPageChange={handleTestPageChange}
              onRefresh={() => {
                fetchPlacementTests();
                fetchInitialTestData();
              }}
            />
          </div>
        </>
      )}

      {activeTab === "registrations" && (
        <div
          className={`transition-all duration-700 delay-100 ${
            isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <StaffRegistrationOverview
            branchId={resolveUserBranchId(currentUser)}
            onTotalChange={setRegistrationTotalCount}
          />
        </div>
      )}

      {/* Enrollment Content */}
      {activeTab === "enrollments" && (
        <>
          <div
            className={`transition-all duration-700 delay-100 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <EnrollmentStats
              enrollments={branchScopedEnrollments}
              isLoading={false}
            />
          </div>

          <div
            className={`transition-all duration-700 delay-150 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            <EnrollmentFilters
              searchQuery={enrollSearchQuery}
              selectedStatus={enrollSelectedStatus}
              // pageSize={enrollPageSize}
              totalCount={branchScopedEnrollments.length}
              statusCounts={filteredEnrollStatusCounts}
              onSearchChange={setEnrollSearchQuery}
              onStatusChange={(status: string) => {
                setEnrollSelectedStatus(status);
                setEnrollCurrentPage(1);
              }}
              // onPageSizeChange={handleEnrollPageSizeChange}
            />
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              isPageLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <EnrollmentTable
              enrollments={pagedEnrollments}
              isLoading={isLoadingEnrollments}
              currentPage={enrollCurrentPage}
              totalPages={enrollmentTotalPages}
              pageSize={enrollPageSize}
              totalCount={enrollmentTotalCount}
              sortKey={enrollSortKey}
              sortDir={enrollSortDir}
              onSort={handleEnrollSort}
              onView={handleViewEnrollment}
              onPageChange={handleEnrollPageChange}
              onPause={handlePauseEnrollment}
              onDrop={handleDropEnrollment}
              onReactivate={handleReactivateEnrollment}
              onRefresh={() => {
                fetchEnrollments();
                fetchInitialEnrollmentData();
              }}
            />
          </div>
        </>
      )}

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
        onLeadUpdated={(updatedLead) => {
          setSelectedLead(updatedLead);
          setLeads((prev) => prev.map((item) => (item.id === updatedLead.id ? { ...item, ...updatedLead } : item)));
          setAllLeads((prev) => prev.map((item) => (item.id === updatedLead.id ? { ...item, ...updatedLead } : item)));
        }}
      />

      <SelfAssignModal
        isOpen={isSelfAssignModalOpen}
        lead={selectedLead}
        onClose={() => setIsSelfAssignModalOpen(false)}
        onAssigned={handleAssignSuccess}
      />

      {/* Placement Test Modals */}
      <PlacementTestFormModal
        isOpen={isTestFormModalOpen}
        test={selectedTest}
        onClose={() => {
          setIsTestFormModalOpen(false);
          setTestFormDefaultMode("create");
          setRetakeSourceTestId("");
        }}
        onSuccess={handleTestFormSuccess}
        onSubmit={handleTestFormSubmit}
        defaultMode={testFormDefaultMode}
        retakeSourceTestId={retakeSourceTestId}
        placementTests={branchScopedPlacementTests}
        leads={modalLeads}
        studentProfiles={modalStudentProfiles}
        classes={modalClasses}
        invigilators={modalInvigilators}
        branches={retakeBranches}
        programs={retakePrograms}
        tuitionPlans={retakeTuitionPlans}
        defaultBranchId={resolveUserBranchId(currentUser)}
      />

      <PlacementTestDetailModal
        isOpen={isTestDetailModalOpen}
        test={selectedTest}
        onClose={() => setIsTestDetailModalOpen(false)}
      />

      <ResultFormModal
        isOpen={isTestResultModalOpen}
        onClose={() => setIsTestResultModalOpen(false)}
        onSubmit={handleTestResultSubmit}
        testId={selectedTest?.id || ""}
        branchId={resolveUserBranchId(currentUser)}
      />

      <NoteFormModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSubmit={handleNoteSubmit}
        testId={selectedTest?.id || ""}
      />

      <ConvertToEnrolledModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSubmit={handleConvertSubmit}
        test={selectedTest}
      />

      <CreateAccountProfileModal
        isOpen={isCreateAccountModalOpen}
        onClose={closeCreateAccountModal}
        test={selectedTest}
        leadInfo={selectedLeadInfo}
        onSuccess={() => {
          fetchPlacementTests();
          closeCreateAccountModal();
        }}
      />

      <RegistrationFlowModal
        isOpen={isRegistrationFlowOpen}
        onClose={() => setIsRegistrationFlowOpen(false)}
        test={selectedTest}
        branchId={resolveUserBranchId(currentUser)}
        allowManualAssign
        onSuccess={() => {
          fetchPlacementTests();
          fetchInitialTestData();
          fetchInitialRegistrationData();
        }}
      />

      <ConfirmModal
        isOpen={isTestConfirmModalOpen}
        onClose={() => setIsTestConfirmModalOpen(false)}
        onConfirm={handleTestConfirmAction}
        title={testConfirmAction?.title || ""}
        message={testConfirmAction?.message || ""}
      />

      {/* Enrollment Modals */}
      <EnrollmentFormModal
        isOpen={isEnrollFormModalOpen}
        onClose={() => setIsEnrollFormModalOpen(false)}
        onSubmit={handleEnrollmentFormSubmit}
      />

      <EnrollmentDetailModal
        isOpen={isEnrollDetailModalOpen}
        onClose={() => setIsEnrollDetailModalOpen(false)}
        enrollment={selectedEnrollment}
      />

      <ConfirmModal
        isOpen={isEnrollConfirmModalOpen}
        onClose={() => setIsEnrollConfirmModalOpen(false)}
        onConfirm={handleEnrollConfirmAction}
        title={enrollConfirmAction?.title || ""}
        message={enrollConfirmAction?.message || ""}
      />
    </div>
  );
}
