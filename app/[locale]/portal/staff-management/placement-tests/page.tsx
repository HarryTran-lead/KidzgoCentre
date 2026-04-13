"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/lightswind/button";
import { Input } from "@/components/lightswind/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import PlacementTestTable from "@/components/portal/placement-tests/PlacementTestTable";
import PlacementTestFormModal, {
  type PlacementTestFormSubmitPayload,
} from "@/components/portal/placement-tests/PlacementTestFormModal";
import ResultFormModal from "@/components/portal/placement-tests/ResultFormModal";
import CreateAccountProfileModal from "@/components/portal/placement-tests/CreateAccountProfileModal";
import PlacementTestDetailModal from "@/components/portal/placement-tests/PlacementTestDetailModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAccessToken } from "@/lib/store/authToken";
import { useCreateAccountFromTest } from "@/hooks/useCreateAccountFromTest";
import {
  createPlacementTest,
  createPlacementTestRetake,
  getPlacementTestErrorMessage,
  updatePlacementTest,
} from "@/lib/api/placementTestService";
import {
  PLACEMENT_TEST_ENDPOINTS,
  USER_ENDPOINTS,
  LEAD_ENDPOINTS,
  PROFILE_ENDPOINTS,
  ADMIN_ENDPOINTS,
  BRANCH_ENDPOINTS,
} from "@/constants/apiURL";
import type {
  PlacementTest,
  PlacementTestFilters,
  PlacementTestResult,
  PlacementTestResultRequest,
} from "@/types/placement-test";

export default function PlacementTestsPage() {
  const { user: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const [tests, setTests] = useState<PlacementTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { isCreateAccountModalOpen, selectedLeadInfo, handleCreateAccount, closeCreateAccountModal } = useCreateAccountFromTest();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PlacementTest | null>(null);
  const [formDefaultMode, setFormDefaultMode] = useState<"create" | "retake">("create");
  const [retakeSourceTestId, setRetakeSourceTestId] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);

  const handleCreateAccountFromTest = async (test: PlacementTest) => {
    setSelectedTest(test);
    await handleCreateAccount(test);
  };

  // Filters
  const [filters, setFilters] = useState<PlacementTestFilters>({
    status: "",
    branchId: "",
    searchTerm: "",
  });

  // Mock data for dropdowns - replace with API calls
  const [leads, setLeads] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<
    Array<{ id: string; fullName: string; branchId?: string; profileType?: string }>
  >([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [invigilators, setInvigilators] = useState<any[]>([]);
  const [retakeBranches, setRetakeBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [retakePrograms, setRetakePrograms] = useState<Array<{ id: string; name: string; branchId?: string }>>([]);
  const [retakeTuitionPlans, setRetakeTuitionPlans] = useState<Array<{ id: string; name: string; programId: string; branchId?: string }>>([]);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(false);

  const resolveCurrentUserBranchId = (user: any): string => {
    return String(
      user?.branchId ||
      user?.branch?.id ||
      user?.branch?.branchId ||
      user?.selectedProfile?.branchId ||
      user?.selectedProfile?.branch?.id ||
      user?.profiles?.[0]?.branchId ||
      user?.profiles?.[0]?.branch?.id ||
      "",
    );
  };

  const currentUserBranchId = useMemo(() => resolveCurrentUserBranchId(currentUser), [currentUser]);
  const activeBranchId = useMemo(() => String(filters.branchId || currentUserBranchId || ""), [filters.branchId, currentUserBranchId]);

  const sortPlacementTestsNewest = (items: PlacementTest[]) => {
    return [...items].sort((a, b) => {
      const bt = new Date(b.createdAt || b.scheduledAt || "").getTime();
      const at = new Date(a.createdAt || a.scheduledAt || "").getTime();
      return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
    });
  };

  const filteredInvigilators = useMemo(() => {
    if (!activeBranchId) return invigilators;
    return invigilators.filter((i: any) => String(i.branchId || "") === activeBranchId);
  }, [invigilators, activeBranchId]);

  // Single effect — re-runs whenever any relevant dep changes (same pattern as leads page)
  useEffect(() => {
    fetchPlacementTests();
  }, [filters, sortKey, sortDir, currentPage, pageSize]);

  // Fetch dropdown data once on mount
  useEffect(() => {
    fetchInvigilators();
  }, []);

  useEffect(() => {
    if (!currentUserBranchId) return;
    fetchStudentProfiles();
  }, [currentUserBranchId]);

  useEffect(() => {
    if (!currentUserBranchId) return;
    fetchClasses();
  }, [currentUserBranchId]);

  useEffect(() => {
    if (isCurrentUserLoading) return;
    fetchLeads();
  }, [isCurrentUserLoading, currentUserBranchId]);

  const fetchPlacementTests = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.branchId) queryParams.append("branchId", filters.branchId);
      if (filters.searchTerm)
        queryParams.append("searchTerm", filters.searchTerm);
      if (sortKey) {
        queryParams.append("sortBy", sortKey);
        queryParams.append("sortOrder", sortDir);
      }
      queryParams.append("page", String(currentPage));
      queryParams.append("pageSize", String(pageSize));

      const response = await fetch(
        `${PLACEMENT_TEST_ENDPOINTS.GET_ALL}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch placement tests");

      const data = await response.json();
      setTests(sortPlacementTestsNewest(data.data?.placementTests || data.data?.items || []));
      setTotalCount(data.data?.totalCount || 0);
      setTotalPages(data.data?.totalPages || 0);
    } catch (error) {
      console.error("Error fetching placement tests:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách kiểm tra xếp lớp",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvigilators = async () => {
    try {
      // Fetch both Admin and ManagementStaff users with pagination
      const adminParams = new URLSearchParams();
      adminParams.append("role", "Admin");
      adminParams.append("isActive", "true");
      adminParams.append("page", "1000");
      adminParams.append("pageNumber", "1");

      const staffParams = new URLSearchParams();
      staffParams.append("role", "ManagementStaff");
      staffParams.append("isActive", "true");
      staffParams.append("pageSize", "1000");
      staffParams.append("page", "1");

      const [adminResponse, staffResponse] = await Promise.all([
        fetch(`${USER_ENDPOINTS.GET_ALL}?${adminParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }),
        fetch(`${USER_ENDPOINTS.GET_ALL}?${staffParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }),
      ]);

      if (adminResponse.ok && staffResponse.ok) {
        const adminData = await adminResponse.json();
        const staffData = await staffResponse.json();

        // Handle multiple response formats
        const adminItems =
          adminData.data?.items ||
          adminData.data?.users ||
          adminData.data ||
          adminData.items ||
          adminData.users ||
          [];
        const staffItems =
          staffData.data?.items ||
          staffData.data?.users ||
          staffData.data ||
          staffData.items ||
          staffData.users ||
          [];

        const admins = adminItems.map((user: any) => ({
          id: user.id,
          fullName: user.fullName || user.userName || user.name || "N/A",
          role: "Admin",
          branchId: user.branchId || user.branch?.id || "",
        }));

        const staff = staffItems.map((user: any) => ({
          id: user.id,
          fullName: user.fullName || user.userName || user.name || "N/A",
          role: "ManagementStaff",
          branchId: user.branchId || user.branch?.id || "",
        }));

        setInvigilators([...admins, ...staff]);
      } else {
        console.error(
          "❌ Failed to fetch invigilators:",
          "Admin:",
          adminResponse.status,
          "Staff:",
          staffResponse.status,
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách người giám sát",
      });
    }
  };

  const fetchLeadsForModal = async () => {
    try {
      const accountBranchId = currentUserBranchId;

      if (!accountBranchId) {
        setLeads([]);
        return [];
      }

      // Create a completely clean URL with minimal params for modal
      const modalParams = new URLSearchParams();
      modalParams.append("status", "New");
      modalParams.append("pageSize", "1000");
      modalParams.append("page", "1");
      if (accountBranchId) {
        modalParams.append("branchPreference", accountBranchId);
      }
      modalParams.append("_modal", "true"); // Flag to indicate this is for modal
      modalParams.append("_t", Date.now().toString()); // Cache buster

      const modalUrl = `${LEAD_ENDPOINTS.GET_ALL}?${modalParams.toString()}`;

      const response = await fetch(modalUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
          "X-Modal-Request": "true", // Header flag for modal request
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle multiple response formats
        const leadsData =
          data.data?.items ||
          data.data?.leads ||
          data.data ||
          data.items ||
          data.leads ||
          [];

        // Filter leads with status "New"

        const filteredLeads = leadsData.filter((lead: any) => {
          const status = lead.status;
          const isNew =
            status === "New" || status === "new" || status === "NEW";
          if (!isNew) return false;

          if (!accountBranchId) return true;
          const leadBranchId = String(
            lead.branchId ||
              lead.branch?.id ||
              lead.branch?.branchId ||
              lead.branchPreference ||
              lead.branchPreferenceId ||
              lead.branchPreference?.id ||
              "",
          );
          return leadBranchId === accountBranchId;
        });

        // Process leads with children
        const leadsWithChildren = await Promise.all(
          filteredLeads.map(async (lead: any) => {
            let children = lead.children || [];

            // If no children in response, try to fetch them separately
            if (children.length === 0) {
              try {
                const childrenResponse = await fetch(
                  LEAD_ENDPOINTS.GET_CHILDREN(lead.id),
                  {
                    headers: {
                      Authorization: `Bearer ${getAccessToken()}`,
                    },
                  },
                );

                if (childrenResponse.ok) {
                  const childrenData = await childrenResponse.json();
                  children = childrenData.data || childrenData || [];
                }
              } catch (error) {
                console.warn(
                  `⚠️ [MODAL] Could not fetch children for lead ${lead.id}:`,
                  error,
                );
              }
            }

            // Map children with correct field name
            const mappedChildren = children.map((child: any) => ({
              id: child.id,
              name: child.childName || child.name || "N/A",
            }));

            return {
              id: lead.id,
              contactName: lead.contactName || lead.fullName || "N/A",
              children: mappedChildren,
            };
          }),
        );

        // Update leads state specifically for modal
        setLeads(leadsWithChildren);

        return leadsWithChildren;
      } else {
        console.error(
          "❌ [MODAL] Failed to fetch leads:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("❌ [MODAL] Error response body:", errorText);
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ [MODAL] Error fetching leads for modal:", error);
      throw error;
    }
  };

  const fetchLeads = async () => {
    try {
      const accountBranchId = currentUserBranchId;

      if (!accountBranchId) {
        setLeads([]);
        return;
      }

      // Only fetch leads with status = "New" for placement test
      const queryParams = new URLSearchParams();
      queryParams.append("status", "New");
      queryParams.append("pageSize", "1000"); // Large page size to get all leads
      queryParams.append("page", "1");
      if (accountBranchId) {
        queryParams.append("branchPreference", accountBranchId);
      }
      queryParams.append("_t", Date.now().toString()); // Cache buster

      const url = `${LEAD_ENDPOINTS.GET_ALL}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store", // Force fresh request
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Handle multiple response formats
        const leadsData =
          data.data?.items ||
          data.data?.leads ||
          data.data ||
          data.items ||
          data.leads ||
          [];
        // Filter leads with status "New" and fetch children for each
        const filteredLeads = leadsData.filter((lead: any) => {
          const status = lead.status;
          const isNew =
            status === "New" || status === "new" || status === "NEW";
          if (!isNew) return false;

          if (!accountBranchId) return true;
          const leadBranchId = String(
            lead.branchId ||
              lead.branch?.id ||
              lead.branch?.branchId ||
              lead.branchPreference ||
              lead.branchPreferenceId ||
              lead.branchPreference?.id ||
              "",
          );
          return leadBranchId === accountBranchId;
        });

        const leadsWithChildren = await Promise.all(
          filteredLeads.map(async (lead: any) => {
            let children = lead.children || [];

            // If no children in response, try to fetch them separately
            if (children.length === 0) {
              try {
                const childrenResponse = await fetch(
                  LEAD_ENDPOINTS.GET_CHILDREN(lead.id),
                  {
                    headers: {
                      Authorization: `Bearer ${getAccessToken()}`,
                    },
                  },
                );

                if (childrenResponse.ok) {
                  const childrenData = await childrenResponse.json();
                  children = childrenData.data || childrenData || [];
                }
              } catch (error) {
                console.warn(
                  `⚠️ Could not fetch children for lead ${lead.id}:`,
                  error,
                );
              }
            }

            // Map children with correct field name
            const mappedChildren = children.map((child: any) => ({
              id: child.id,
              name: child.childName || child.name || "N/A", // childName is the correct field
            }));

            return {
              id: lead.id,
              contactName: lead.contactName || lead.fullName || "N/A",
              children: mappedChildren,
            };
          }),
        );

        setLeads(leadsWithChildren);
      } else {
        console.error(
          "❌ Failed to fetch leads:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("❌ Error response body:", errorText);
      }
    } catch (error) {
      console.error("❌ Error fetching leads:", error);
    }
  };

  const fetchStudentProfiles = async () => {
    try {
      const branchId = currentUserBranchId;
      if (!branchId) {
        setStudentProfiles([]);
        return;
      }

      // Add pagination parameters to get all profiles
      const queryParams = new URLSearchParams();
      queryParams.append("profileType", "Student");
      queryParams.append("branchId", branchId);
      queryParams.append("pageSize", "1000"); // Large page size to get all profiles
      queryParams.append("pageNumber", "1");

      const response = await fetch(
        `${PROFILE_ENDPOINTS.GET_ALL}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Handle multiple response formats
        const profiles =
          data.data?.items ||
          data.data?.profiles ||
          data.data ||
          data.items ||
          data.profiles ||
          [];

        const mappedProfiles = profiles.map((profile: any) => ({
          id: profile.id,
          fullName: profile.fullName || profile.studentName || "N/A",
          branchId: profile.branchId || profile.branch?.id || profile.branch?.branchId || "",
          profileType: profile.profileType || "",
        }));

        setStudentProfiles(mappedProfiles);
      } else {
        console.error(
          "❌ Failed to fetch student profiles:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("❌ Error fetching student profiles:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const branchId = currentUserBranchId;
      if (!branchId) {
        setClasses([]);
        return;
      }

      // Use classrooms API for test room selection
      const queryParams = new URLSearchParams();
      queryParams.append("branchId", branchId);
      queryParams.append("isActive", "true");
      queryParams.append("pageSize", "1000"); // Large page size to get all classes
      queryParams.append("pageNumber", "1");

      const response = await fetch(
        `${ADMIN_ENDPOINTS.CLASSROOMS}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Handle multiple response formats
        const classesData =
          data.data?.classrooms?.items ||
          data.data?.items ||
          data.data?.classrooms ||
          data.data ||
          data.items ||
          data.classrooms?.items ||
          data.classrooms ||
          [];

        const mappedClasses = classesData.map((cls: any) => ({
          id: cls.id,
          className: cls.roomName || cls.classroomName || cls.name || cls.code || "N/A",
        }));

        setClasses(mappedClasses);
      } else {
        console.error(
          "❌ Failed to fetch classes:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("❌ Error fetching classes:", error);
    }
  };

  const fetchRetakeOptions = async () => {
    try {
      const token = getAccessToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [branchRes, programRes, tuitionRes] = await Promise.all([
        fetch(`${BRANCH_ENDPOINTS.GET_ALL_PUBLIC}?page=1&limit=1000&isActive=true`, {
          headers,
        }),
        fetch(`${ADMIN_ENDPOINTS.PROGRAMS}?pageNumber=1&pageSize=1000`, {
          headers,
        }),
        fetch(`${ADMIN_ENDPOINTS.TUITION_PLANS_ACTIVE}?pageNumber=1&pageSize=1000`, {
          headers,
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
      console.error("Error fetching retake options:", error);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, searchTerm }));
  };

  const handleCreate = async () => {
    if (isCurrentUserLoading) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Đang tải thông tin tài khoản, vui lòng thử lại sau ít giây.",
      });
      return;
    }

    if (!currentUserBranchId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không xác định được chi nhánh của tài khoản hiện tại.",
      });
      return;
    }

    setIsLoadingDropdownData(true);

    try {
      // Force refresh leads data specifically for modal (bypass any filters)
      await fetchLeadsForModal();
      const otherDataPromises = [];

      if (studentProfiles.length === 0) {
        otherDataPromises.push(fetchStudentProfiles());
      }

      if (classes.length === 0) {
        otherDataPromises.push(fetchClasses());
      }

      if (invigilators.length === 0) {
        otherDataPromises.push(fetchInvigilators());
      }

      if (
        retakeBranches.length === 0 ||
        retakePrograms.length === 0 ||
        retakeTuitionPlans.length === 0
      ) {
        otherDataPromises.push(fetchRetakeOptions());
      }

      // Wait for other data to be loaded
      if (otherDataPromises.length > 0) {
        await Promise.all(otherDataPromises);
      }
      setFormDefaultMode("create");
      setRetakeSourceTestId("");
      setSelectedTest(null);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("❌ Error loading dropdown data:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu. Vui lòng thử lại.",
      });
    } finally {
      setIsLoadingDropdownData(false);
    }
  };

  const handleEdit = (test: PlacementTest) => {
    setSelectedTest(test);
    setFormDefaultMode("create");
    setRetakeSourceTestId("");
    setIsFormModalOpen(true);
  };

  const handleRetakeFromTable = async (test: PlacementTest) => {
    if (test.status !== "Completed") {
      return;
    }

    setIsLoadingDropdownData(true);

    try {
      const otherDataPromises = [];

      if (studentProfiles.length === 0) {
        otherDataPromises.push(fetchStudentProfiles());
      }

      if (classes.length === 0) {
        otherDataPromises.push(fetchClasses());
      }

      if (
        retakeBranches.length === 0 ||
        retakePrograms.length === 0 ||
        retakeTuitionPlans.length === 0
      ) {
        otherDataPromises.push(fetchRetakeOptions());
      }

      if (otherDataPromises.length > 0) {
        await Promise.all(otherDataPromises);
      }

      setSelectedTest(null);
      setFormDefaultMode("retake");
      setRetakeSourceTestId(test.id);
      setIsFormModalOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu retake. Vui lòng thử lại.",
      });
    } finally {
      setIsLoadingDropdownData(false);
    }
  };

  const handleView = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsDetailModalOpen(true);
  };

  const handleAddResult = (test: PlacementTest) => {
    setSelectedTest(test);
    setIsResultModalOpen(true);
  };

  const handleCancel = (test: PlacementTest) => {
    setSelectedTest(test);
    setConfirmAction({
      action: "cancel",
      title: "Hủy lịch test",
      message: "Bạn có chắc chắn muốn hủy lịch test này?",
    });
    setIsConfirmModalOpen(true);
  };

  const handleNoShow = (test: PlacementTest) => {
    setSelectedTest(test);
    setConfirmAction({
      action: "no-show",
      title: "Đánh dấu không đến",
      message: "Bạn có chắc chắn học viên không đến tham gia test?",
    });
    setIsConfirmModalOpen(true);
  };

  const handleConvertToEnrolled = (test: PlacementTest) => {
    setSelectedTest(test);
    setConfirmAction({
      action: "convert",
      title: "Chuyển thành học viên",
      message: "Chuyển đổi bài kiểm tra xếp lớp này thành học viên chính thức?",
    });
    setIsConfirmModalOpen(true);
  };

  const handleFormSubmit = async (payload: PlacementTestFormSubmitPayload) => {
    try {
      if (payload.action === "update") {
        if (!selectedTest) {
          throw new Error("Không tìm thấy bài kiểm tra xếp lớp để cập nhật");
        }
        await updatePlacementTest(selectedTest.id, payload.data);
      }

      if (payload.action === "create") {
        await createPlacementTest(payload.data);
      }

      if (payload.action === "retake") {
        await createPlacementTestRetake(payload.originalPlacementTestId, payload.data);
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

      fetchPlacementTests();
      setIsFormModalOpen(false);
      setFormDefaultMode("create");
      setRetakeSourceTestId("");
    } catch (error) {
      console.error("Error saving placement test:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: getPlacementTestErrorMessage(error, "Không thể lưu bài kiểm tra xếp lớp"),
      });
      throw error;
    }
  };

  const handleResultSubmit = async (data: Omit<PlacementTestResultRequest, "id">, note: string) => {
    if (!selectedTest) return;

    try {
      // Build the result payload matching API expectations
      const resultPayload = {
        listeningScore: data.listeningScore ?? 0,
        speakingScore: data.speakingScore ?? 0,
        readingScore: data.readingScore ?? 0,
        writingScore: data.writingScore ?? 0,
        resultScore: data.resultScore ?? 0,
        programRecommendationId: data.programRecommendationId || null,
        programRecommendationName: data.programRecommendationName || null,
        secondaryProgramRecommendationId: data.secondaryProgramRecommendationId || null,
        secondaryProgramRecommendationName: data.secondaryProgramRecommendationName || null,
        secondaryProgramSkillFocus: data.secondaryProgramSkillFocus || null,
        attachmentUrl: data.attachmentUrl || "",
      };

      const token = getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const apiCalls: Promise<Response>[] = [
        fetch(PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(selectedTest.id), {
          method: "PUT",
          headers,
          body: JSON.stringify(resultPayload),
        }),
      ];

      if (note) {
        apiCalls.push(
          fetch(PLACEMENT_TEST_ENDPOINTS.ADD_NOTE(selectedTest.id), {
            method: "POST",
            headers,
            body: JSON.stringify({ note }),
          })
        );
      }

      const responses = await Promise.all(apiCalls);
      const failed = responses.find((r) => !r.ok);
      if (failed) throw new Error("Failed to save results");

      toast({
        title: "Thành công",
        description: note ? "Đã lưu kết quả và ghi chú kiểm tra xếp lớp" : "Đã lưu kết quả kiểm tra xếp lớp",
      });

      fetchPlacementTests();
      setIsResultModalOpen(false);
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu kết quả",
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedTest || !confirmAction) return;

    try {
      let url = "";
      switch (confirmAction.action) {
        case "cancel":
          url = PLACEMENT_TEST_ENDPOINTS.CANCEL(selectedTest.id);
          break;
        case "no-show":
          url = PLACEMENT_TEST_ENDPOINTS.NO_SHOW(selectedTest.id);
          break;
        case "convert":
          url = PLACEMENT_TEST_ENDPOINTS.CONVERT_TO_ENROLLED(selectedTest.id);
          break;
      }

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
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error("Error performing action:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thực hiện thao tác",
      });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-r from-red-600 to-red-700 flex items-center justify-center shadow-lg">
                  <FileText className="text-white" size={24} />
                </div>
                Kiểm tra xếp lớp
              </h1>
              <p className="text-slate-600 mt-1">
                Quản lý lịch test và kết quả đánh giá trình độ
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isLoadingDropdownData}
              className="bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-medium disabled:opacity-50"
            >
              {isLoadingDropdownData ? (
                <RefreshCw size={20} className="mr-2 animate-spin" />
              ) : (
                <Plus size={20} className="mr-2" />
              )}
              {isLoadingDropdownData ? "Đang tải..." : "Tạo bài kiểm tra mới"}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Đã lên lịch</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {tests.filter((t) => t.status === "Scheduled").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {tests.filter((t) => t.status === "Completed").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-xl p-4 border border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Đã hủy</p>
                  <p className="text-2xl font-bold text-rose-700">
                    {tests.filter((t) => t.status === "Cancelled").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-200 to-gray-300 rounded-xl p-4 border border-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-r from-gray-700 to-gray-800 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Không đến</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {tests.filter((t) => t.status === "NoShow").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <Input
                  placeholder="Tìm kiếm theo tên, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => {
                setCurrentPage(1);
                setFilters((prev) => ({ ...prev, status: value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="Completed">Đã hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
                <SelectItem value="NoShow">Không đến</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={() => fetchPlacementTests()}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <PlacementTestTable
          tests={tests}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={totalCount}
          onView={handleView}
          onPageChange={(page) => setCurrentPage(page)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={handleEdit}
          onAddResult={handleAddResult}
          onCancel={handleCancel}
          onNoShow={handleNoShow}
          onCreateAccount={handleCreateAccountFromTest}
          onRetake={handleRetakeFromTable}
        />

        {/* Modals */}
        <PlacementTestFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setFormDefaultMode("create");
            setRetakeSourceTestId("");
          }}
          onSuccess={() => {
            fetchPlacementTests();
            setIsFormModalOpen(false);
            setFormDefaultMode("create");
            setRetakeSourceTestId("");
          }}
          test={selectedTest}
          defaultMode={formDefaultMode}
          retakeSourceTestId={retakeSourceTestId}
          onSubmit={handleFormSubmit}
          placementTests={tests}
          leads={leads}
          studentProfiles={studentProfiles}
          classes={classes}
          invigilators={filteredInvigilators}
          branches={retakeBranches}
          programs={retakePrograms}
          tuitionPlans={retakeTuitionPlans}
          defaultBranchId={String(currentUserBranchId || filters.branchId || "")}
        />

        <ResultFormModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          onSubmit={handleResultSubmit}
          testId={selectedTest?.id || ""}
          branchId={currentUserBranchId}
        />

        <PlacementTestDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          test={selectedTest}
        />

        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmAction}
          title={confirmAction?.title || ""}
          message={confirmAction?.message || ""}
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
      </div>
    </div>
  );
}


