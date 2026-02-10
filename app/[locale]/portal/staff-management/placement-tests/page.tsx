"use client";

import { useState, useEffect } from "react";
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
import PlacementTestFormModal from "@/components/portal/placement-tests/PlacementTestFormModal";
import ResultFormModal from "@/components/portal/placement-tests/ResultFormModal";
import PlacementTestDetailModal from "@/components/portal/placement-tests/PlacementTestDetailModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import {
  PLACEMENT_TEST_ENDPOINTS,
  USER_ENDPOINTS,
  LEAD_ENDPOINTS,
  PROFILE_ENDPOINTS,
  ADMIN_ENDPOINTS,
} from "@/constants/apiURL";
import type {
  PlacementTest,
  PlacementTestFilters,
  CreatePlacementTestRequest,
  UpdatePlacementTestRequest,
  PlacementTestResult,
  PlacementTestResultRequest,
} from "@/types/placement-test";

export default function PlacementTestsPage() {
  const [tests, setTests] = useState<PlacementTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>("scheduledAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PlacementTest | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState<PlacementTestFilters>({
    status: "",
    branchId: "",
    searchTerm: "",
  });

  // Mock data for dropdowns - replace with API calls
  const [leads, setLeads] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [invigilators, setInvigilators] = useState<any[]>([]);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(false);

  // Fetch placement tests when filters change
  useEffect(() => {
    fetchPlacementTests();
  }, [filters, sortKey, sortDir]);

  // Fetch dropdown data once on mount
  useEffect(() => {
    fetchInvigilators();
    fetchLeads();
    fetchStudentProfiles();
    fetchClasses();
  }, []); // Empty dependency array - only run once

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

      const response = await fetch(
        `${PLACEMENT_TEST_ENDPOINTS.GET_ALL}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch placement tests");

      const data = await response.json();
      setTests(data.data?.items || data.data || []);
      setTotalCount(data.data?.totalCount || 0);
      setTotalPages(data.data?.totalPages || 0);
    } catch (error) {
      console.error("Error fetching placement tests:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách placement test",
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch(`${USER_ENDPOINTS.GET_ALL}?${staffParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        }));

        const staff = staffItems.map((user: any) => ({
          id: user.id,
          fullName: user.fullName || user.userName || user.name || "N/A",
          role: "ManagementStaff",
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
      // Create a completely clean URL with minimal params for modal
      const modalParams = new URLSearchParams();
      modalParams.append("status", "New");
      modalParams.append("pageSize", "1000");
      modalParams.append("pageNumber", "1");
      modalParams.append("_modal", "true"); // Flag to indicate this is for modal
      modalParams.append("_t", Date.now().toString()); // Cache buster

      const modalUrl = `${LEAD_ENDPOINTS.GET_ALL}?${modalParams.toString()}`;

      const response = await fetch(modalUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          return isNew;
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
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      // Only fetch leads with status = "New" for placement test
      // Force clear any existing branch filter for leads fetch
      const queryParams = new URLSearchParams();
      queryParams.append("status", "New");
      queryParams.append("pageSize", "1000"); // Large page size to get all leads
      queryParams.append("pageNumber", "1");
      queryParams.append("_t", Date.now().toString()); // Cache buster
      // Explicitly don't add branchId to get all leads regardless of branch

      const url = `${LEAD_ENDPOINTS.GET_ALL}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store", // Force fresh request
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          return isNew;
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
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      // Add pagination parameters to get all profiles
      const queryParams = new URLSearchParams();
      queryParams.append("pageSize", "1000"); // Large page size to get all profiles
      queryParams.append("pageNumber", "1");

      const response = await fetch(
        `${PROFILE_ENDPOINTS.GET_ALL}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      // Add pagination parameters to get all classes
      const queryParams = new URLSearchParams();
      queryParams.append("pageSize", "1000"); // Large page size to get all classes
      queryParams.append("pageNumber", "1");

      const response = await fetch(
        `${ADMIN_ENDPOINTS.CLASSES}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Handle multiple response formats
        const classesData =
          data.data?.items ||
          data.data?.classes ||
          data.data ||
          data.items ||
          data.classes ||
          [];

        const mappedClasses = classesData.map((cls: any) => ({
          id: cls.id,
          className: cls.className || cls.name || "N/A",
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

      // Wait for other data to be loaded
      if (otherDataPromises.length > 0) {
        await Promise.all(otherDataPromises);
      }
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
    setIsFormModalOpen(true);
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
      message: "Chuyển đổi placement test này thành học viên chính thức?",
    });
    setIsConfirmModalOpen(true);
  };

  const handleFormSubmit = async (
    data: CreatePlacementTestRequest | UpdatePlacementTestRequest,
  ) => {
    try {
      const url = selectedTest
        ? PLACEMENT_TEST_ENDPOINTS.UPDATE(selectedTest.id)
        : PLACEMENT_TEST_ENDPOINTS.CREATE;

      const method = selectedTest ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save placement test");

      toast({
        title: "Thành công",
        description: selectedTest
          ? "Đã cập nhật placement test"
          : "Đã tạo placement test mới",
      });

      fetchPlacementTests();
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Error saving placement test:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu placement test",
      });
    }
  };

  const handleResultSubmit = async (data: Omit<PlacementTestResultRequest, "id">) => {
    if (!selectedTest) return;

    try {
      // Convert form data to PlacementTestResult format
      const resultData: PlacementTestResult = {
        testId: selectedTest.id,
        ...data,
      };

      const response = await fetch(
        PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(selectedTest.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(resultData),
        },
      );

      if (!response.ok) throw new Error("Failed to save results");

      toast({
        title: "Thành công",
        description: "Đã lưu kết quả placement test",
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-pink-50 to-rose-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <FileText className="text-white" size={24} />
                </div>
                Placement Tests
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
              {isLoadingDropdownData ? "Đang tải..." : "Tạo Test mới"}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
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

            <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
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

            <div className="bg-linear-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-rose-400 to-pink-500 flex items-center justify-center">
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

            <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
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
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
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

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={fetchPlacementTests}
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
          onConvertToEnrolled={handleConvertToEnrolled}
        />

        {/* Modals */}
        <PlacementTestFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            fetchPlacementTests();
            setIsFormModalOpen(false);
          }}
          test={selectedTest}
          onSubmit={handleFormSubmit}
          leads={leads}
          studentProfiles={studentProfiles}
          classes={classes}
          invigilators={invigilators}
        />

        <ResultFormModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          onSubmit={handleResultSubmit}
          testId={selectedTest?.id || ""}
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
      </div>
    </div>
  );
}
