"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  Clock,
  Calendar,
  BarChart,
  GraduationCap,
  ClipboardList,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  X,
  Upload,
  Download,
  User,
  Hash,
  CalendarDays,
  AlignLeft,
  Home,
  BookMarked,
  Save,
  AlertTriangle,
  HelpCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { createLessonPlan, getAllLessonPlans, updateLessonPlan, deleteLessonPlan, CreateLessonPlanRequest, LessonPlan } from "@/lib/api/lessonPlanService";
import { getTeacherClasses, getTeacherTimetable, TeacherSession, TeacherClass } from "@/lib/api/teacherService";
import { getAllDocuments } from "@/lib/api/documentService";

// SortableHeader Component
function SortableHeader<T extends string>({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
}: {
  label: string;
  column: T;
  sortColumn: T | null;
  sortDirection: "asc" | "desc";
  onSort: (col: T) => void;
}) {
  const isActive = sortColumn === column;

  return (
    <button
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
    >
      <span>{label}</span>
      {isActive ? (
        sortDirection === "asc" ? (
          <span aria-hidden>↑</span>
        ) : (
          <span aria-hidden>↓</span>
        )
      ) : (
        <span aria-hidden className="text-gray-300">↕</span>
      )}
    </button>
  );
}

// StatCard Component
function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}
      ></div>
      <div className="relative flex items-center justify-between gap-3">
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">
            {title}
          </div>
          <div className="text-xl font-bold text-gray-900 leading-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}

type Material = {
  id: string;
  name: string;
  sessionTitle: string;
  classCode: string;
  templateLevel: string;
  plannedContent: string;
  actualContent: string;
  actualHomework: string;
  teacherNotes: string;
  submittedByName: string | null;
  submittedAt: string | null;
  createdAt: string;
};

type Subject = {
  id: string;
  title: string;
  level: string;
  duration: string;
  sessions: number;
  students: number;
  progress: number;
  color: string;
};

export default function TeacherSubjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [sortColumnMaterial, setSortColumnMaterial] = useState<"name" | "date" | null>(null);
  const [sortDirectionMaterial, setSortDirectionMaterial] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // State for bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state for creating lesson plan
  const [formData, setFormData] = useState({
    classId: "",
    sessionId: "",
    templateId: "",
    plannedContent: "",
    actualContent: "",
    actualHomework: "",
    teacherNotes: "",
  });

  // Update form state
  const [updateFormData, setUpdateFormData] = useState({
    plannedContent: "",
    actualContent: "",
    actualHomework: "",
    teacherNotes: "",
  });

  // Sessions data from API
  const [classesData, setClassesData] = useState<TeacherClass[]>([]);
  const [sessionsData, setSessionsData] = useState<TeacherSession[]>([]);
  const [templatesData, setTemplatesData] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false);

  // Fetch sessions and templates when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      const fetchData = async () => {
        setIsLoadingDropdown(true);
        try {
          // Fetch classes using teacher-specific API
          const classesResponse = await getTeacherClasses({ pageSize: 100 });
          if (classesResponse.isSuccess && classesResponse.data) {
            const classesDataObj = classesResponse.data.classes;
            // Handle both array and paginated object structure
            const classes = classesDataObj?.items || classesDataObj;
            setClassesData(Array.isArray(classes) ? classes : []);
          }

          // Fetch sessions using teacher timetable API (get all sessions for current teacher)
          // Using a date range that covers reasonable period
          const now = new Date();
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
          
          const sessionsResponse = await getTeacherTimetable({
            from: threeMonthsAgo.toISOString(),
            to: threeMonthsLater.toISOString(),
            pageSize: 100
          });
          if (sessionsResponse.isSuccess && sessionsResponse.data) {
            const sessionsDataObj = sessionsResponse.data.sessions as { items: TeacherSession[] } | TeacherSession[];
            const sessions = sessionsDataObj && 'items' in sessionsDataObj ? sessionsDataObj.items : sessionsDataObj;
            setSessionsData(Array.isArray(sessions) ? sessions : []);
          }

          // Fetch templates (documents)
          const templatesResponse = await getAllDocuments({ pageSize: 100 });
          if (templatesResponse.isSuccess && templatesResponse.data) {
            const templates = templatesResponse.data.templates;
            if (templates && templates.items && Array.isArray(templates.items)) {
              setTemplatesData(
                templates.items.map((doc: any) => ({
                  id: doc.id,
                  name: doc.title || doc.name || "Untitled",
                }))
              );
            }
          }
        } catch (error) {
          console.error("Error fetching dropdown data:", error);
        } finally {
          setIsLoadingDropdown(false);
        }
      };
      fetchData();
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const subjectsData: Subject[] = [
    {
      id: "1",
      title: "IELTS Foundation",
      level: "Cơ bản",
      duration: "48 giờ",
      sessions: 24,
      students: 18,
      progress: 65,
      color: "from-red-600 to-red-700",
    },
    {
      id: "2",
      title: "TOEIC Intermediate",
      level: "Trung cấp",
      duration: "60 giờ",
      sessions: 30,
      students: 24,
      progress: 40,
      color: "from-gray-600 to-gray-700",
    },
    {
      id: "3",
      title: "Business English",
      level: "Nâng cao",
      duration: "72 giờ",
      sessions: 36,
      students: 12,
      progress: 85,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "4",
      title: "Academic Writing",
      level: "Nâng cao",
      duration: "54 giờ",
      sessions: 27,
      students: 15,
      progress: 55,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "5",
      title: "English Conversation",
      level: "Trung cấp",
      duration: "36 giờ",
      sessions: 18,
      students: 20,
      progress: 70,
      color: "from-sky-500 to-blue-500",
    },
  ];

  const [materialsData, setMaterialsData] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // Fetch lesson plans (materials) on mount
  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const response = await getAllLessonPlans({ pageSize: 100 });
      if (response.isSuccess && response.data) {
        // Handle both array and paginated object structure (API may return LessonPlans with capital L)
        const data = response.data as any;
        const lessonPlansData = data.LessonPlans || data.lessonPlans;
        const plans = lessonPlansData?.items || lessonPlansData || [];
        setMaterialsData(Array.isArray(plans) ? plans.map((plan: any) => ({
          id: plan.id,
          name: plan.templateLevel ? `Level ${plan.templateLevel} - Session ${plan.templateSessionIndex}` : "Lesson Plan",
          sessionTitle: plan.sessionTitle || "",
          classCode: plan.classCode || "",
          templateLevel: plan.templateLevel || "",
          plannedContent: plan.plannedContent || "",
          actualContent: plan.actualContent || "",
          actualHomework: plan.actualHomework || "",
          teacherNotes: plan.teacherNotes || "",
          submittedByName: plan.submittedByName,
          submittedAt: plan.submittedAt,
          createdAt: plan.createdAt,
        })) : []);
      }
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSortMaterial = (column: "name" | "date") => {
    if (sortColumnMaterial === column) {
      setSortDirectionMaterial(sortDirectionMaterial === "asc" ? "desc" : "asc");
    } else {
      setSortColumnMaterial(column);
      setSortDirectionMaterial("asc");
    }
  };

  const sortedMaterials = useMemo(() => {
    let result = [...materialsData];

    // Filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (material) =>
          material.name.toLowerCase().includes(searchLower) ||
          material.sessionTitle.toLowerCase().includes(searchLower) ||
          material.classCode.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortColumnMaterial) {
      result.sort((a, b) => {
        let comparison = 0;
        if (sortColumnMaterial === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (sortColumnMaterial === "date") {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
        }
        return sortDirectionMaterial === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [materialsData, debouncedSearch, sortColumnMaterial, sortDirectionMaterial]);

  // Pagination
  const sortedMaterialData = sortedMaterials;
  const totalMaterialPages = Math.ceil(sortedMaterialData.length / itemsPerPage);
  const materialStartIndex = (currentPage - 1) * itemsPerPage;
  const materialEndIndex = materialStartIndex + itemsPerPage;
  const paginatedMaterials = sortedMaterialData.slice(materialStartIndex, materialEndIndex);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedMaterials.length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set<string>();
      paginatedMaterials.forEach(material => newSelected.add(material.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    setSubmitError(null);

    try {
      // Delete each selected material
      const deletePromises = Array.from(selectedIds).map(id => deleteLessonPlan(id));
      await Promise.all(deletePromises);
      
      await fetchMaterials(); // Refresh data
      setSelectedIds(new Set()); // Clear selection
      setIsBulkDeleteModalOpen(false);
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 1500);
    } catch (error: any) {
      console.error("Error deleting materials:", error);
      setSubmitError(error.response?.data?.message || "Có lỗi xảy ra khi xóa tài liệu");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const stats = {
    total: subjectsData.length,
    totalStudents: subjectsData.reduce((sum, s) => sum + s.students, 0),
    totalSessions: subjectsData.reduce((sum, s) => sum + s.sessions, 0),
    completedSessions: subjectsData.reduce(
      (sum, s) => sum + Math.round((s.progress / 100) * s.sessions),
      0
    ),
  };

  // Handle form submission for creating lesson plan
  const handleSubmitLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.classId || !formData.sessionId || !formData.templateId) {
      setSubmitError("Vui lòng chọn lớp học, buổi học và mẫu giáo án");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const requestData: CreateLessonPlanRequest = {
        classId: formData.classId,
        sessionId: formData.sessionId,
        templateId: formData.templateId,
        plannedContent: formData.plannedContent,
        actualContent: formData.actualContent,
        actualHomework: formData.actualHomework,
        teacherNotes: formData.teacherNotes,
      };

      await createLessonPlan(requestData);
      await fetchMaterials(); // Refresh data

      setSubmitSuccess(true);
      setFormData({
        classId: "",
        sessionId: "",
        templateId: "",
        plannedContent: "",
        actualContent: "",
        actualHomework: "",
        teacherNotes: "",
      });
      
      // Close modal after short delay
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setSubmitSuccess(false);
      }, 1500);
    } catch (error: any) {
      console.error("Error creating lesson plan:", error);
      setSubmitError(error.response?.data?.message || "Có lỗi xảy ra khi tạo tài liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission for updating lesson plan
  const handleUpdateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMaterial) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const requestData = {
        plannedContent: updateFormData.plannedContent,
        actualContent: updateFormData.actualContent,
        actualHomework: updateFormData.actualHomework,
        teacherNotes: updateFormData.teacherNotes,
      };

      await updateLessonPlan(selectedMaterial.id, requestData);
      await fetchMaterials(); // Refresh data

      setSubmitSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        setSubmitSuccess(false);
        setSelectedMaterial(null);
        setUpdateFormData({
          plannedContent: "",
          actualContent: "",
          actualHomework: "",
          teacherNotes: "",
        });
      }, 1500);
    } catch (error: any) {
      console.error("Error updating lesson plan:", error);
      setSubmitError(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật tài liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete lesson plan
  const handleDeleteLessonPlan = async () => {
    if (!selectedMaterial) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteLessonPlan(selectedMaterial.id);
      await fetchMaterials(); // Refresh data

      setSubmitSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setSubmitSuccess(false);
        setSelectedMaterial(null);
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting lesson plan:", error);
      setSubmitError(error.response?.data?.message || "Có lỗi xảy ra khi xóa tài liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Handle view detail
  const handleViewDetail = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
  };

  // Handle update material
  const handleUpdateMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setUpdateFormData({
      plannedContent: material.plannedContent || "",
      actualContent: material.actualContent || "",
      actualHomework: material.actualHomework || "",
      teacherNotes: material.teacherNotes || "",
    });
    setIsUpdateModalOpen(true);
  };

  // Handle delete material - open confirm modal
  const handleDeleteClick = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  // Close update modal
  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setSelectedMaterial(null);
    setUpdateFormData({
      plannedContent: "",
      actualContent: "",
      actualHomework: "",
      teacherNotes: "",
    });
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setSelectedMaterial(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý tài liệu
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tài liệu giảng dạy
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
            <Filter size={16} /> Lọc
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tải lên tài liệu
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <StatCard
          title="Tổng môn học"
          value={`${stats.total}`}
          icon={<BookOpen size={20} />}
          color="from-red-600 to-red-700"
          subtitle="Đang giảng dạy"
        />
        <StatCard
          title="Tổng học viên"
          value={`${stats.totalStudents}`}
          icon={<Users size={20} />}
          color="from-blue-500 to-cyan-500"
          subtitle="Tất cả các lớp"
        />
        <StatCard
          title="Tổng buổi học"
          value={`${stats.totalSessions}`}
          icon={<Clock size={20} />}
          color="from-emerald-500 to-teal-500"
          subtitle="Theo kế hoạch"
        />
        <StatCard
          title="Hoàn thành"
          value={`${Math.round(
            (stats.completedSessions / stats.totalSessions) * 100
          )}%`}
          icon={<BarChart size={20} />}
          color="from-amber-500 to-orange-500"
          subtitle={`${stats.completedSessions}/${stats.totalSessions} buổi`}
        />
      </div>

      {/* Filter Bar */}
      <div
        className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600 font-medium">
              Danh sách tài liệu
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-red-200">
                <span className="text-sm text-gray-600">
                  Đã chọn <span className="font-semibold text-red-600">{selectedIds.size}</span> tài liệu
                </span>
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash2 size={14} />
                  Xóa đã chọn
                </button>
              </div>
            )}
          </div>

          {/* Search and Items Per Page */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tài liệu, tên file..."
                className="h-10 w-72 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách tài liệu
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {sortedMaterialData.length} tài liệu
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
                <th className="py-3 px-4 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                  >
                    {selectedIds.size === paginatedMaterials.length && paginatedMaterials.length > 0 ? (
                      <CheckSquare size={18} className="text-red-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <SortableHeader
                    label="Tên tài liệu"
                    column="name"
                    sortColumn={sortColumnMaterial}
                    sortDirection={sortDirectionMaterial}
                    onSort={handleSortMaterial}
                  />
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Lớp học
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Buổi học
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Level
                </th>
                <th className="py-3 px-6 text-left">
                  <SortableHeader
                    label="Ngày tạo"
                    column="date"
                    sortColumn={sortColumnMaterial}
                    sortDirection={sortDirectionMaterial}
                    onSort={handleSortMaterial}
                  />
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {isLoadingMaterials ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-gray-600 font-medium mt-2">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : paginatedMaterials.length > 0 ? (
                paginatedMaterials.map((material) => (
                  <tr
                    key={material.id}
                    className={`group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 ${
                      selectedIds.has(material.id) ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleSelectOne(material.id)}
                        className="flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                      >
                        {selectedIds.has(material.id) ? (
                          <CheckSquare size={18} className="text-red-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 shadow-sm">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{material.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {material.plannedContent.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700">{material.classCode || "-"}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700">{material.sessionTitle || "-"}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                        {material.templateLevel ? `Level ${material.templateLevel}` : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{material.createdAt ? new Date(material.createdAt).toLocaleDateString("vi-VN") : "-"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDetail(material)}
                          className="p-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer group relative"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleUpdateMaterial(material)}
                          className="p-2 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer group relative"
                          title="Cập nhật"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(material)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer group relative" 
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy dữ liệu</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {sortedMaterialData.length > 0 && (
          <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{materialStartIndex + 1}-{Math.min(materialEndIndex, sortedMaterialData.length)}</span> trong tổng số{" "}
                <span className="font-semibold text-gray-900">{sortedMaterialData.length}</span> tài liệu
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | string)[] = [];
                    const maxVisible = 7;
                    if (totalMaterialPages <= maxVisible) {
                      for (let i = 1; i <= totalMaterialPages; i++) pages.push(i);
                    } else {
                      if (currentPage <= 3) {
                        for (let i = 1; i <= 5; i++) pages.push(i);
                        pages.push("...");
                        pages.push(totalMaterialPages);
                      } else if (currentPage >= totalMaterialPages - 2) {
                        pages.push(1);
                        pages.push("...");
                        for (let i = totalMaterialPages - 4; i <= totalMaterialPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        pages.push("...");
                        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                        pages.push("...");
                        pages.push(totalMaterialPages);
                      }
                    }
                    return pages.map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof page === "number" && setCurrentPage(page)}
                        disabled={page === "..."}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          page === currentPage
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                            : page === "..."
                            ? "cursor-default text-gray-400"
                            : "border border-red-200 hover:bg-red-50 text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalMaterialPages, prev + 1))}
                  disabled={currentPage === totalMaterialPages}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Lesson Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={24} />
                <div>
                  <h2 className="text-xl font-bold">Tạo giáo án mới</h2>
                  <p className="text-sm text-red-100">Tạo tài liệu giảng dạy cho buổi học</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitLessonPlan} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp học <span className="text-red-500">*</span></label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value, sessionId: "" })}
                  className="w-full h-11 px-4 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  required
                  disabled={isLoadingDropdown}
                >
                  <option value="">{isLoadingDropdown ? "Đang tải..." : "Chọn lớp học..."}</option>
                  {(classesData || []).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title || cls.name || cls.code || "Lớp học"} {cls.programName ? `- ${cls.programName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Buổi học <span className="text-red-500">*</span></label>
                <select
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  required
                  disabled={isLoadingDropdown || !formData.classId}
                >
                  <option value="">{!formData.classId ? "Chọn lớp trước" : isLoadingDropdown ? "Đang tải..." : "Chọn buổi học..."}</option>
                  {Array.isArray(sessionsData) && sessionsData
                    .filter((session) => session.classId === formData.classId)
                    .map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.classTitle || session.classCode || "Buổi học"} - {session.plannedDatetime ? new Date(session.plannedDatetime).toLocaleDateString("vi-VN") : ""}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mẫu giáo án <span className="text-red-500">*</span></label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  required
                  disabled={isLoadingDropdown}
                >
                  <option value="">{isLoadingDropdown ? "Đang tải..." : "Chọn mẫu giáo án..."}</option>
                  {templatesData.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung dự kiến</label>
                <textarea
                  value={formData.plannedContent}
                  onChange={(e) => setFormData({ ...formData, plannedContent: e.target.value })}
                  placeholder="Nhập nội dung dự kiến..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung thực tế</label>
                <textarea
                  value={formData.actualContent}
                  onChange={(e) => setFormData({ ...formData, actualContent: e.target.value })}
                  placeholder="Nhập nội dung thực tế..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bài tập về nhà</label>
                <textarea
                  value={formData.actualHomework}
                  onChange={(e) => setFormData({ ...formData, actualHomework: e.target.value })}
                  placeholder="Nhập bài tập về nhà..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú của giáo viên</label>
                <textarea
                  value={formData.teacherNotes}
                  onChange={(e) => setFormData({ ...formData, teacherNotes: e.target.value })}
                  placeholder="Nhập ghi chú..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{submitError}</p>
                </div>
              )}
              
              {submitSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <p className="text-sm text-emerald-600 font-medium">Tạo tài liệu thành công!</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Tạo tài liệu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={24} />
                <div>
                  <h2 className="text-xl font-bold">Chi tiết tài liệu</h2>
                  <p className="text-sm text-red-100">{selectedMaterial.name}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <BookMarked size={16} />
                    <span className="text-xs font-medium uppercase">Lớp học</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{selectedMaterial.classCode || "-"}</div>
                </div>
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <ClipboardList size={16} />
                    <span className="text-xs font-medium uppercase">Buổi học</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{selectedMaterial.sessionTitle || "-"}</div>
                </div>
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <BarChart size={16} />
                    <span className="text-xs font-medium uppercase">Level</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedMaterial.templateLevel ? `Level ${selectedMaterial.templateLevel}` : "-"}
                  </div>
                </div>
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <CalendarDays size={16} />
                    <span className="text-xs font-medium uppercase">Ngày tạo</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedMaterial.createdAt ? new Date(selectedMaterial.createdAt).toLocaleDateString("vi-VN") : "-"}
                  </div>
                </div>
              </div>

              {/* Nội dung chi tiết */}
              <div className="space-y-4">
                <div className="bg-white border border-red-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <AlignLeft size={16} />
                    Nội dung dự kiến
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMaterial.plannedContent || "Chưa có nội dung"}</p>
                </div>

                <div className="bg-white border border-red-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Nội dung thực tế
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMaterial.actualContent || "Chưa có nội dung"}</p>
                </div>

                <div className="bg-white border border-red-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                    <BookOpen size={16} />
                    Bài tập về nhà
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMaterial.actualHomework || "Chưa có bài tập"}</p>
                </div>

                <div className="bg-white border border-red-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Ghi chú giáo viên
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMaterial.teacherNotes || "Chưa có ghi chú"}</p>
                </div>
              </div>

              {/* Footer - chỉ còn nút Đóng */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-100">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold hover:shadow-lg transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseUpdateModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit size={24} />
                <div>
                  <h2 className="text-xl font-bold">Cập nhật tài liệu</h2>
                  <p className="text-sm text-red-100">{selectedMaterial.name}</p>
                </div>
              </div>
              <button onClick={handleCloseUpdateModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateLessonPlan} className="p-6 space-y-5">
              {/* Thông tin cơ bản (chỉ để hiển thị, không thể sửa) */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <BookMarked size={16} />
                    <span className="text-xs font-medium uppercase">Lớp học</span>
                  </div>
                  <div className="text-base font-semibold text-gray-900">{selectedMaterial.classCode || "-"}</div>
                </div>
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <ClipboardList size={16} />
                    <span className="text-xs font-medium uppercase">Buổi học</span>
                  </div>
                  <div className="text-base font-semibold text-gray-900">{selectedMaterial.sessionTitle || "-"}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung dự kiến</label>
                <textarea
                  value={updateFormData.plannedContent}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, plannedContent: e.target.value })}
                  placeholder="Nhập nội dung dự kiến..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung thực tế</label>
                <textarea
                  value={updateFormData.actualContent}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, actualContent: e.target.value })}
                  placeholder="Nhập nội dung thực tế..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bài tập về nhà</label>
                <textarea
                  value={updateFormData.actualHomework}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, actualHomework: e.target.value })}
                  placeholder="Nhập bài tập về nhà..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú của giáo viên</label>
                <textarea
                  value={updateFormData.teacherNotes}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, teacherNotes: e.target.value })}
                  placeholder="Nhập ghi chú..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{submitError}</p>
                </div>
              )}
              
              {submitSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <p className="text-sm text-emerald-600 font-medium">Cập nhật tài liệu thành công!</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-100">
                <button
                  type="button"
                  onClick={handleCloseUpdateModal}
                  className="px-5 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Single */}
      {isDeleteModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseDeleteModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={20} />
                Xác nhận xóa
              </h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700">
                    Bạn có chắc chắn muốn xóa tài liệu này?
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedMaterial.name}
                  </p>
                </div>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
              
              {submitSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <p className="text-sm text-emerald-600 font-medium">Xóa tài liệu thành công!</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteLessonPlan}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={20} />
                Xác nhận xóa hàng loạt
              </h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700">
                    Bạn có chắc chắn muốn xóa <span className="font-semibold text-red-600">{selectedIds.size}</span> tài liệu đã chọn?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
              
              {submitSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <p className="text-sm text-emerald-600 font-medium">Xóa tài liệu thành công!</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isBulkDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xóa {selectedIds.size} tài liệu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}