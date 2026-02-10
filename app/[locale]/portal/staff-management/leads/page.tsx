"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Target, UserPlus, Download, CalendarClock, BookOpen } from "lucide-react";
import { getAllLeads, updateLeadStatus, getLeadChildren } from "@/lib/api/leadService";
import { getAllPlacementTests, createPlacementTest } from "@/lib/api/placementTestService";
import { getAllUsers } from "@/lib/api/userService";
import { getAllStudents } from "@/lib/api/profileService";
import { getAccessToken } from "@/lib/store/authToken";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Lead as LeadType } from "@/types/lead";
import type { PlacementTest, CreatePlacementTestRequest, UpdatePlacementTestRequest, PlacementTestResultRequest } from "@/types/placement-test";
import { ADMIN_ENDPOINTS, PLACEMENT_TEST_ENDPOINTS } from "@/constants/apiURL";
import {
  LeadStats,
  LeadFilters,
  LeadTable,
  LeadFormModal,
  LeadDetailModal,
  SelfAssignModal,
} from "@/components/portal/leads";
import {
  PlacementTestStats,
  PlacementTestFilters,
  PlacementTestTable,
  PlacementTestFormModal,
  PlacementTestDetailModal,
  ResultFormModal,
} from "@/components/portal/placement-tests";
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
import type { Enrollment, EnrollmentStatus } from "@/types/enrollment";

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
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"leads" | "placement_tests" | "enrollments">("leads");
  
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

  // Placement Test state
  const [placementTests, setPlacementTests] = useState<PlacementTest[]>([]);
  const [allPlacementTests, setAllPlacementTests] = useState<PlacementTest[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [testCurrentPage, setTestCurrentPage] = useState(1);
  const [testPageSize, setTestPageSize] = useState(10);
  const [testTotalCount, setTestTotalCount] = useState(0);
  const [testTotalPages, setTestTotalPages] = useState(0);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [debouncedTestSearchQuery, setDebouncedTestSearchQuery] = useState("");
  const [testSelectedStatus, setTestSelectedStatus] = useState<string>("Tất cả");
  const [testFromDate, setTestFromDate] = useState("");
  const [testToDate, setTestToDate] = useState("");
  const [testStatusCounts, setTestStatusCounts] = useState<Record<string, number>>({});
  const [isTestFormModalOpen, setIsTestFormModalOpen] = useState(false);
  const [isTestDetailModalOpen, setIsTestDetailModalOpen] = useState(false);
  const [isTestResultModalOpen, setIsTestResultModalOpen] = useState(false);
  const [isTestConfirmModalOpen, setIsTestConfirmModalOpen] = useState(false);
  const [testConfirmAction, setTestConfirmAction] = useState<{ action: string; title: string; message: string } | null>(null);
  const [selectedTest, setSelectedTest] = useState<PlacementTest | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Enrollment state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollCurrentPage, setEnrollCurrentPage] = useState(1);
  const [enrollPageSize, setEnrollPageSize] = useState(10);
  const [enrollTotalCount, setEnrollTotalCount] = useState(0);
  const [enrollTotalPages, setEnrollTotalPages] = useState(0);
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");
  const [debouncedEnrollSearchQuery, setDebouncedEnrollSearchQuery] = useState("");
  const [enrollSelectedStatus, setEnrollSelectedStatus] = useState<string>("Tất cả");
  const [enrollStatusCounts, setEnrollStatusCounts] = useState<Record<string, number>>({});
  const [enrollSortKey, setEnrollSortKey] = useState<string | null>(null);
  const [enrollSortDir, setEnrollSortDir] = useState<"asc" | "desc">("asc");
  const [isEnrollFormModalOpen, setIsEnrollFormModalOpen] = useState(false);
  const [isEnrollDetailModalOpen, setIsEnrollDetailModalOpen] = useState(false);
  const [isEnrollConfirmModalOpen, setIsEnrollConfirmModalOpen] = useState(false);
  const [enrollConfirmAction, setEnrollConfirmAction] = useState<{ action: string; title: string; message: string } | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  // Dropdown data for PlacementTestFormModal
  const [modalLeads, setModalLeads] = useState<Array<{ id: string; contactName: string; children?: Array<{ id: string; name: string }> }>>([]);
  const [modalStudentProfiles, setModalStudentProfiles] = useState<Array<{ id: string; fullName: string }>>([]);
  const [modalClasses, setModalClasses] = useState<Array<{ id: string; className: string }>>([]);
  const [modalInvigilators, setModalInvigilators] = useState<Array<{ id: string; fullName: string; role: string }>>([]);

  useEffect(() => {
    setIsPageLoaded(true);
    // Fetch initial data for stats and filters when user data is available
    if (currentUser && !isLoadingUser) {
      fetchInitialData();
      fetchInitialTestData();
      fetchInitialEnrollmentData();
    }
  }, [currentUser, isLoadingUser]);

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

  // Fetch initial placement test data for stats
  const fetchInitialTestData = async () => {
    try {
      if (!currentUser || isLoadingUser) return;
      
      const response = await getAllPlacementTests({
        pageSize: 1000,
        branchId: currentUser.branchId,
      });
      
      if (response.isSuccess && response.data) {
        const allTestsData = Array.isArray(response.data.items) ? response.data.items : [];
        setAllPlacementTests(allTestsData);
        
        // Calculate status counts
        const counts: Record<string, number> = {
          "Tất cả": allTestsData.length,
          "Scheduled": allTestsData.filter(t => t.status === "Scheduled").length,
          "Completed": allTestsData.filter(t => t.status === "Completed").length,
          "Cancelled": allTestsData.filter(t => t.status === "Cancelled").length,
          "NoShow": allTestsData.filter(t => t.status === "NoShow").length,
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
  }, [testCurrentPage, testPageSize, debouncedTestSearchQuery, testSelectedStatus, testFromDate, testToDate, currentUser, isLoadingUser, activeTab]);

  const fetchPlacementTests = async () => {
    try {
      if (!currentUser || isLoadingUser) return;
      
      setIsLoadingTests(true);
      
      const response = await getAllPlacementTests({
        page: testCurrentPage,
        pageSize: testPageSize,
        searchTerm: debouncedTestSearchQuery || undefined,
        status: testSelectedStatus !== "Tất cả" ? testSelectedStatus : undefined,
        branchId: currentUser.branchId,
        fromDate: testFromDate || undefined,
        toDate: testToDate || undefined,
      });
      
      if (response.isSuccess && response.data.items) {
        setPlacementTests(response.data.items);
        setTestTotalCount(response.data.totalCount);
        setTestTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      console.error("Error fetching placement tests:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách placement test. Vui lòng thử lại.",
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
      const response = await getAllEnrollments({ pageSize: 1000 });
      if (response.isSuccess && response.data) {
        const allItems = Array.isArray(response.data.items) ? response.data.items : [];
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
        setEnrollStatusCounts({ "Tất cả": 0, Active: 0, Paused: 0, Dropped: 0 });
        setEnrollTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching initial enrollment data:", error);
    }
  };

  // Fetch enrollments with filters
  useEffect(() => {
    if (currentUser && !isLoadingUser && activeTab === "enrollments") {
      fetchEnrollments();
    }
  }, [enrollCurrentPage, enrollPageSize, debouncedEnrollSearchQuery, enrollSelectedStatus, currentUser, isLoadingUser, activeTab]);

  const fetchEnrollments = async () => {
    try {
      if (!currentUser || isLoadingUser) return;
      setIsLoadingEnrollments(true);
      const response = await getAllEnrollments({
        pageNumber: enrollCurrentPage,
        pageSize: enrollPageSize,
        searchTerm: debouncedEnrollSearchQuery || undefined,
        status: enrollSelectedStatus !== "Tất cả" ? (enrollSelectedStatus as EnrollmentStatus) : undefined,
      });
      if (response.isSuccess && response.data) {
        setEnrollments(response.data.items);
        setEnrollTotalCount(response.data.totalCount);
        setEnrollTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      console.error("Error fetching enrollments:", err);
      toast({ title: "Lỗi", description: "Không thể tải danh sách ghi danh.", variant: "destructive" });
    } finally {
      setIsLoadingEnrollments(false);
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

  // Reset to first page when test filters change
  useEffect(() => {
    if (testCurrentPage !== 1) {
      setTestCurrentPage(1);
    }
  }, [debouncedTestSearchQuery, testSelectedStatus, testFromDate, testToDate]);

  // Fetch dropdown data for Placement Test Form Modal
  const fetchModalDropdownData = async () => {
    if (!currentUser) return;
    const branchId = currentUser.branchId;

    try {
      // Fetch all leads for this branch (không filter status để có thể tạo test cho mọi lead)
      const leadsRes = await getAllLeads({ branchId, pageSize: 1000 });
      if (leadsRes.isSuccess && leadsRes.data?.leads) {
        const leadsWithChildren = await Promise.all(
          leadsRes.data.leads.map(async (lead: any) => {
            let children = lead.children || [];
            if (children.length === 0) {
              try {
                const childrenRes = await getLeadChildren(lead.id);
                if (childrenRes.isSuccess && childrenRes.data) {
                  // Response structure: { children: LeadChild[] }
                  children = childrenRes.data.children || (Array.isArray(childrenRes.data) ? childrenRes.data : []);
                  console.log(`📋 [Modal] Children for ${lead.contactName}:`, children);
                }
              } catch { /* ignore */ }
            }
            return {
              id: lead.id,
              contactName: lead.contactName || lead.fullName || 'N/A',
              children: children.map((c: any) => ({ id: c.id, name: c.childName || c.name || 'N/A' })),
            };
          })
        );
        setModalLeads(leadsWithChildren);
      }

      // Fetch student profiles
      const profilesRes = await getAllStudents({ branchId, pageSize: 1000 });
      if (profilesRes.isSuccess && profilesRes.data) {
        const profiles = profilesRes.data.items || [];
        const mapped = profiles.map((p: any) => ({ id: p.id, fullName: p.displayName || p.fullName || p.studentName || 'N/A' }));
        setModalStudentProfiles(mapped);
      }

      // Fetch classes
      try {
        const classRes = await fetch(`${ADMIN_ENDPOINTS.CLASSES}?pageSize=1000&branchId=${branchId}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (classRes.ok) {
          const classData = await classRes.json();
          const classItems = classData.data?.items || classData.data?.classes || classData.data || [];
          const mapped = classItems.map((c: any) => ({ id: c.id, className: c.className || c.name || 'N/A' }));
          setModalClasses(mapped);
        }
      } catch { /* ignore */ }

      // Fetch invigilators (Admin + ManagementStaff)
      const [adminRes, staffRes] = await Promise.all([
        getAllUsers({ role: 'Admin', isActive: true, pageSize: 1000 }),
        getAllUsers({ role: 'ManagementStaff', isActive: true, pageSize: 1000 }),
      ]);
      const adminUsers = (adminRes.isSuccess && adminRes.data?.items) ? adminRes.data.items : [];
      const staffUsers = (staffRes.isSuccess && staffRes.data?.items) ? staffRes.data.items : [];
      const invigilators = [
        ...adminUsers.map((u: any) => ({ id: u.id, fullName: u.name || u.fullName || u.username || u.email || 'N/A', role: 'Admin' })),
        ...staffUsers.map((u: any) => ({ id: u.id, fullName: u.name || u.fullName || u.username || u.email || 'N/A', role: 'ManagementStaff' })),
      ];
            setModalInvigilators(invigilators);
    } catch (error) {
      console.error("❌ Error fetching modal dropdown data:", error);
    }
  };

  // Placement Test handlers
  const handleCreateTest = async () => {
    // Fetch dropdown data first, then open modal
    await fetchModalDropdownData();
    setSelectedTest(null);
    setIsTestFormModalOpen(true);
  };

  const handleViewTest = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsTestDetailModalOpen(true);
  };

  const handleEditTest = (test: PlacementTest) => {
    setSelectedTest(test);
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

  const handleAddNote = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsNoteModalOpen(true);
  };

  const handleTestFormSubmit = async (data: CreatePlacementTestRequest | UpdatePlacementTestRequest) => {
    try {
      const url = selectedTest
        ? PLACEMENT_TEST_ENDPOINTS.UPDATE(selectedTest.id)
        : PLACEMENT_TEST_ENDPOINTS.CREATE;
      const method = selectedTest ? "PUT" : "POST";

      console.log('[handleTestFormSubmit] Sending:', { url, method, data });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => null);
      console.log('[handleTestFormSubmit] Response:', { status: response.status, data: responseData });

      if (!response.ok) {
        const errorMsg = responseData?.message || `Server returned ${response.status}`;
        throw new Error(errorMsg);
      }

      toast({
        title: "Thành công",
        description: selectedTest ? "Đã cập nhật placement test" : "Đã tạo placement test mới",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving placement test:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu placement test",
      });
      throw error; // Re-throw to prevent modal close
    }
  };

  const handleTestResultSubmit = async (data: Omit<PlacementTestResultRequest, "id">) => {
    if (!selectedTest) return;

    try {
      const response = await fetch(
        PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(selectedTest.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to save results");
      }

      toast({
        title: "Thành công",
        description: "Đã lưu kết quả placement test",
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
        description: error instanceof Error ? error.message : "Không thể lưu kết quả",
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
        }
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
        description: error instanceof Error ? error.message : "Không thể thêm ghi chú",
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
        }
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
        description: error instanceof Error ? error.message : "Không thể chuyển đổi",
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

      if (!response.ok) throw new Error("Failed to perform action");

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
        description: "Không thể thực hiện thao tác",
      });
    }
  };

  const handleTestFormSuccess = () => {
    fetchPlacementTests();
    fetchInitialTestData();
  };

  const handleTestPageChange = (page: number) => {
    setTestCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestPageSizeChange = (size: number) => {
    setTestPageSize(size);
    setTestCurrentPage(1);
  };

  // ========== Enrollment Handlers ==========
  const handleCreateEnrollment = () => {
    setIsEnrollFormModalOpen(true);
  };

  const handleEnrollmentFormSubmit = async (data: { classId: string; studentProfileId: string; enrollDate: string }) => {
    try {
      const response = await createEnrollment(data);
      if (response.isSuccess) {
        toast({ title: "Thành công", description: "Tạo ghi danh thành công!", variant: "success" });
        fetchEnrollments();
        fetchInitialEnrollmentData();
        setIsEnrollFormModalOpen(false);
      } else {
        throw new Error(response.message || "Không thể tạo ghi danh");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: error.message || "Không thể tạo ghi danh" });
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
        toast({ title: "Thành công", description: "Đã thực hiện thao tác thành công!", variant: "success" });
        fetchEnrollments();
        fetchInitialEnrollmentData();
      } else {
        throw new Error(response?.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: error.message || "Không thể thực hiện thao tác" });
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
    if (enrollSortKey === key) {
      setEnrollSortDir(enrollSortDir === "asc" ? "desc" : "asc");
    } else {
      setEnrollSortKey(key);
      setEnrollSortDir("asc");
    }
  };

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
              Quản lý Lead & Placement Test
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
        {activeTab === "leads" ? (
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
        ) : activeTab === "placement_tests" ? (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
              <Download size={16} /> Xuất DS Test
            </button>
            <button 
              onClick={handleCreateTest}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
            >
              <CalendarClock size={16} /> Đặt lịch test mới
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
              <Download size={16} /> Xuất DS Ghi danh
            </button>
            <button 
              onClick={handleCreateEnrollment}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
            >
              <BookOpen size={16} /> Tạo ghi danh mới
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-pink-200 p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "leads"
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "text-gray-600 hover:bg-pink-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Target size={16} />
            <span>Lead</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "leads" ? "bg-white/20" : "bg-gray-100"
            }`}>
              {totalCount}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("placement_tests")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "placement_tests"
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "text-gray-600 hover:bg-pink-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarClock size={16} />
            <span>Placement Test</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "placement_tests" ? "bg-white/20" : "bg-gray-100"
            }`}>
              {allPlacementTests.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "enrollments"
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "text-gray-600 hover:bg-pink-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>Ghi danh</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "enrollments" ? "bg-white/20" : "bg-gray-100"
            }`}>
              {allEnrollments.length}
            </span>
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "leads" && (
        <>
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
        </>
      )}

      {activeTab === "placement_tests" && (
        // Placement Test Content
        <>
          <div className={`transition-all duration-700 delay-100 ${
              isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <PlacementTestStats tests={allPlacementTests} isLoading={false} />
          </div>

          {/* Filter Bar */}
          <div
            className={`transition-all duration-700 delay-150 ${
              isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <PlacementTestFilters
              searchQuery={testSearchQuery}
              selectedStatus={testSelectedStatus}
              fromDate={testFromDate}
              toDate={testToDate}
              pageSize={testPageSize}
              totalCount={testTotalCount}
              statusCounts={testStatusCounts}
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
              isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <PlacementTestTable
              tests={placementTests}
              isLoading={isLoadingTests}
              currentPage={testCurrentPage}
              totalPages={testTotalPages}
              pageSize={testPageSize}
              totalCount={testTotalCount}
              onView={handleViewTest}
              onEdit={handleEditTest}
              onAddResult={handleAddResult}
              onAddNote={handleAddNote}
              onCancel={handleCancelTest}
              onNoShow={handleNoShowTest}
              onConvertToEnrolled={handleConvertToEnrolled}
              onPageChange={handleTestPageChange}
            />
          </div>
        </>
      )}

      {/* Enrollment Content */}
      {activeTab === "enrollments" && (
        <>
          <div className={`transition-all duration-700 delay-100 ${
              isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <EnrollmentStats enrollments={allEnrollments} isLoading={false} />
          </div>

          <div
            className={`transition-all duration-700 delay-150 ${
              isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <EnrollmentFilters
              searchQuery={enrollSearchQuery}
              selectedStatus={enrollSelectedStatus}
              pageSize={enrollPageSize}
              totalCount={enrollTotalCount}
              statusCounts={enrollStatusCounts}
              onSearchChange={setEnrollSearchQuery}
              onStatusChange={(status: string) => {
                setEnrollSelectedStatus(status);
                setEnrollCurrentPage(1);
              }}
              onPageSizeChange={handleEnrollPageSizeChange}
            />
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <EnrollmentTable
              enrollments={enrollments}
              isLoading={isLoadingEnrollments}
              currentPage={enrollCurrentPage}
              totalPages={enrollTotalPages}
              pageSize={enrollPageSize}
              totalCount={enrollTotalCount}
              sortKey={enrollSortKey}
              sortDir={enrollSortDir}
              onSort={handleEnrollSort}
              onView={handleViewEnrollment}
              onPageChange={handleEnrollPageChange}
              onPause={handlePauseEnrollment}
              onDrop={handleDropEnrollment}
              onReactivate={handleReactivateEnrollment}
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
        onClose={() => setIsTestFormModalOpen(false)}
        onSuccess={handleTestFormSuccess}
        onSubmit={handleTestFormSubmit}
        leads={modalLeads}
        studentProfiles={modalStudentProfiles}
        classes={modalClasses}
        invigilators={modalInvigilators}
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
