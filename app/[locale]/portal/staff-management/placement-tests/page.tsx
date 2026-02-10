"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, RefreshCw, FileText, Download } from "lucide-react";
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
import { PLACEMENT_TEST_ENDPOINTS } from "@/constants/apiURL";
import type { 
  PlacementTest, 
  PlacementTestFilters, 
  CreatePlacementTestRequest, 
  UpdatePlacementTestRequest,
  PlacementTestResult 
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
  const [confirmAction, setConfirmAction] = useState<{ action: string; title: string; message: string } | null>(null);

  // Filters
  const [filters, setFilters] = useState<PlacementTestFilters>({
    status: "",
    branchId: "",
    searchTerm: "",
  });

  // Mock data for dropdowns - replace with API calls
  const [leads, setLeads] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchPlacementTests();
    // fetchLeads();
    // fetchBranches();
    // fetchTeachers();
  }, [filters, sortKey, sortDir]);

  const fetchPlacementTests = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.branchId) queryParams.append("branchId", filters.branchId);
      if (filters.searchTerm) queryParams.append("searchTerm", filters.searchTerm);
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
        }
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  const handleCreate = () => {
    setSelectedTest(null);
    setIsFormModalOpen(true);
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

  const handleFormSubmit = async (data: CreatePlacementTestRequest | UpdatePlacementTestRequest) => {
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

  const handleResultSubmit = async (data: PlacementTestResult) => {
    if (!selectedTest) return;

    try {
      const response = await fetch(
        PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(selectedTest.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
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
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center shadow-lg">
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
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium"
            >
              <Plus size={20} className="mr-2" />
              Tạo Test mới
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Đã lên lịch</p>
                  <p className="text-2xl font-bold text-red-700">
                    {tests.filter(t => t.status === 'Scheduled').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {tests.filter(t => t.status === 'Completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 border border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Đã hủy</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {tests.filter(t => t.status === 'Cancelled').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-4 border border-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Không đến</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tests.filter(t => t.status === 'NoShow').length}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
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
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
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
          branches={branches}
          teachers={teachers}
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
