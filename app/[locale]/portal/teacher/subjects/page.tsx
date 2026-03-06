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
} from "lucide-react";
import { createLessonPlan, CreateLessonPlanRequest } from "@/lib/api/lessonPlanService";
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

// Tab Navigation Component
function TabNav({
  activeTab,
  onChange,
  items,
}: {
  activeTab: string;
  onChange: (key: string) => void;
  items: { key: string; label: string; icon: React.ReactNode; count?: number }[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-1 inline-flex gap-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === item.key
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-600 hover:bg-red-50"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.count !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === item.key ? "bg-white/20" : "bg-gray-100"
            }`}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
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

type Exam = {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  duration: string;
  status: string;
  color: string;
};

type Material = {
  id: string;
  name: string;
  subject: string;
  kind: string;
  size: string;
  date: string;
  color: string;
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
  const [tab, setTab] = useState<"dekiemtra" | "tailieu">("dekiemtra");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [sortColumnExam, setSortColumnExam] = useState<"title" | "date" | "duration" | null>(null);
  const [sortDirectionExam, setSortDirectionExam] = useState<"asc" | "desc">("asc");
  const [sortColumnMaterial, setSortColumnMaterial] = useState<"name" | "size" | "date" | null>(null);
  const [sortDirectionMaterial, setSortDirectionMaterial] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
            const sessionsDataObj = sessionsResponse.data.sessions;
            // Handle both array and paginated object structure
            const sessions = sessionsDataObj?.items || sessionsDataObj;
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
  }, [debouncedSearch, tab]);

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

  const examsData: Exam[] = [
    {
      id: "1",
      title: "Kiểm tra giữa kỳ - IELTS",
      subject: "IELTS Foundation",
      class: "IELTS Foundation - A1",
      date: "15/10/2025",
      duration: "90 phút",
      status: "Sắp tới",
      color: "from-red-600 to-red-700",
    },
    {
      id: "2",
      title: "Kiểm tra cuối kỳ - TOEIC",
      subject: "TOEIC Intermediate",
      class: "TOEIC Intermediate",
      date: "25/10/2025",
      duration: "120 phút",
      status: "Sắp tới",
      color: "from-gray-600 to-gray-700",
    },
    {
      id: "3",
      title: "Bài kiểm tra 1 - Business",
      subject: "Business English",
      class: "Business English",
      date: "05/10/2025",
      duration: "60 phút",
      status: "Đã hoàn thành",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "4",
      title: "Writing Assessment",
      subject: "Academic Writing",
      class: "Academic Writing",
      date: "12/10/2025",
      duration: "45 phút",
      status: "Sắp tới",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "5",
      title: "Test 5 - IELTS",
      subject: "IELTS Foundation",
      class: "IELTS Foundation - A2",
      date: "30/10/2025",
      duration: "90 phút",
      status: "Sắp tới",
      color: "from-red-600 to-red-700",
    },
    {
      id: "6",
      title: "Final Exam - TOEIC",
      subject: "TOEIC Intermediate",
      class: "TOEIC Intermediate",
      date: "01/11/2025",
      duration: "120 phút",
      status: "Sắp tới",
      color: "from-gray-600 to-gray-700",
    },
  ];

  const materialsData: Material[] = [
    {
      id: "1",
      name: "IELTS Speaking Module 1-5",
      subject: "IELTS Foundation",
      kind: "PDF",
      size: "2.5 MB",
      date: "01/10/2025",
      color: "from-red-600 to-red-700",
    },
    {
      id: "2",
      name: "TOEIC Practice Test Vol.1",
      subject: "TOEIC Intermediate",
      kind: "PDF",
      size: "1.8 MB",
      date: "05/09/2025",
      color: "from-gray-600 to-gray-700",
    },
    {
      id: "3",
      name: "Business Vocabulary List",
      subject: "Business English",
      kind: "DOCX",
      size: "0.5 MB",
      date: "15/09/2025",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "4",
      name: "IELTS Writing Task 2 Samples",
      subject: "IELTS Foundation",
      kind: "PDF",
      size: "3.2 MB",
      date: "20/09/2025",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "5",
      name: "Business Email Templates",
      subject: "Business English",
      kind: "DOCX",
      size: "1.2 MB",
      date: "25/09/2025",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "6",
      name: "Grammar Review Sheet",
      subject: "English Conversation",
      kind: "PDF",
      size: "0.8 MB",
      date: "28/09/2025",
      color: "from-sky-500 to-blue-500",
    },
  ];

  const handleSortExam = (column: "title" | "date" | "duration") => {
    if (sortColumnExam === column) {
      setSortDirectionExam(sortDirectionExam === "asc" ? "desc" : "asc");
    } else {
      setSortColumnExam(column);
      setSortDirectionExam("asc");
    }
  };

  const sortedExams = useMemo(() => {
    let result = [...examsData];

    // Filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchLower) ||
          exam.subject.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortColumnExam) {
      result.sort((a, b) => {
        let comparison = 0;
        if (sortColumnExam === "title") {
          comparison = a.title.localeCompare(b.title);
        } else if (sortColumnExam === "date") {
          const dateA = new Date(a.date.split("/").reverse().join("-"));
          const dateB = new Date(b.date.split("/").reverse().join("-"));
          comparison = dateA.getTime() - dateB.getTime();
        } else if (sortColumnExam === "duration") {
          const durationA = parseFloat(a.duration.replace(" phút", ""));
          const durationB = parseFloat(b.duration.replace(" phút", ""));
          comparison = durationA - durationB;
        }
        return sortDirectionExam === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [examsData, debouncedSearch, sortColumnExam, sortDirectionExam]);

  const handleSortMaterial = (column: "name" | "size" | "date") => {
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
          material.subject.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortColumnMaterial) {
      result.sort((a, b) => {
        let comparison = 0;
        if (sortColumnMaterial === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (sortColumnMaterial === "size") {
          const sizeA = parseFloat(a.size.replace(" MB", ""));
          const sizeB = parseFloat(b.size.replace(" MB", ""));
          comparison = sizeA - sizeB;
        } else if (sortColumnMaterial === "date") {
          const dateA = new Date(a.date.split("/").reverse().join("-"));
          const dateB = new Date(b.date.split("/").reverse().join("-"));
          comparison = dateA.getTime() - dateB.getTime();
        }
        return sortDirectionMaterial === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [materialsData, debouncedSearch, sortColumnMaterial, sortDirectionMaterial]);

  // Pagination - separate variables for exams and materials
  const sortedExamData = sortedExams;
  const sortedMaterialData = sortedMaterials;
  const totalExamPages = Math.ceil(sortedExamData.length / itemsPerPage);
  const totalMaterialPages = Math.ceil(sortedMaterialData.length / itemsPerPage);
  const examStartIndex = (currentPage - 1) * itemsPerPage;
  const examEndIndex = examStartIndex + itemsPerPage;
  const materialStartIndex = (currentPage - 1) * itemsPerPage;
  const materialEndIndex = materialStartIndex + itemsPerPage;
  const paginatedExams = sortedExamData.slice(examStartIndex, examEndIndex);
  const paginatedMaterials = sortedMaterialData.slice(materialStartIndex, materialEndIndex);

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

  // Close modal and reset form
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSubmitError(null);
    setSubmitSuccess(false);
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
              Quản lý môn học
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tài liệu giảng dạy và bài kiểm tra
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
            <Filter size={16} /> Lọc
          </button>
          <button
            onClick={() => tab === "tailieu" && setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={16} />
            {tab === "dekiemtra" ? "Tạo đề thi" : "Tải lên tài liệu"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className={`transition-all duration-700 delay-100 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <TabNav
          activeTab={tab}
          onChange={(key) => setTab(key as "dekiemtra" | "tailieu")}
          items={[
            {
              key: "dekiemtra",
              label: "Đề kiểm tra",
              icon: <ClipboardList size={16} />,
              count: examsData.length,
            },
            {
              key: "tailieu",
              label: "Tài liệu",
              icon: <FileText size={16} />,
              count: materialsData.length,
            },
          ]}
        />
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
              {tab === "dekiemtra" ? "Danh sách đề kiểm tra" : "Danh sách tài liệu"}
            </div>
          </div>

          {/* Search and Items Per Page */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  tab === "dekiemtra"
                    ? "Tìm kiếm đề thi, bài kiểm tra..."
                    : "Tìm kiếm tài liệu, tên file..."
                }
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
              {tab === "dekiemtra" ? "Danh sách đề kiểm tra" : "Danh sách tài liệu"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {tab === "dekiemtra" ? sortedExamData.length : sortedMaterialData.length} {tab === "dekiemtra" ? "đề thi" : "tài liệu"}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {tab === "dekiemtra" ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr>
                  <th className="py-3 px-6 text-left">
                    <SortableHeader
                      label="Tên bài kiểm tra"
                      column="title"
                      sortColumn={sortColumnExam}
                      sortDirection={sortDirectionExam}
                      onSort={handleSortExam}
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Môn học
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Lớp
                  </th>
                  <th className="py-3 px-6 text-left">
                    <SortableHeader
                      label="Ngày thi"
                      column="date"
                      sortColumn={sortColumnExam}
                      sortDirection={sortDirectionExam}
                      onSort={handleSortExam}
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Thời lượng
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="py-3 px-6 text-left">
                    <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {paginatedExams.length > 0 ? (
                  paginatedExams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg bg-gradient-to-r ${exam.color} shadow-sm`}>
                            <ClipboardList size={18} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{exam.title}</div>
                            <div className="text-xs text-gray-500">{exam.subject}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">{exam.subject}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700 font-medium">{exam.class}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{exam.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock size={14} className="text-gray-400" />
                          <span className="font-medium">{exam.duration}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                            exam.status === "Sắp tới"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : exam.status === "Đã hoàn thành"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-sky-100 text-sky-700 border-sky-200"
                          }`}
                        >
                          {exam.status === "Sắp tới" ? (
                            <Clock size={10} className="mr-1" />
                          ) : exam.status === "Đã hoàn thành" ? (
                            <CheckCircle size={10} className="mr-1" />
                          ) : (
                            <Clock size={10} className="mr-1" />
                          )}
                          {exam.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer">
                            <Eye size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer">
                            <Edit size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer">
                            <Trash2 size={14} />
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
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr>
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
                    Môn học
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Loại
                  </th>
                  <th className="py-3 px-6 text-left">
                    <SortableHeader
                      label="Kích thước"
                      column="size"
                      sortColumn={sortColumnMaterial}
                      sortDirection={sortDirectionMaterial}
                      onSort={handleSortMaterial}
                    />
                  </th>
                  <th className="py-3 px-6 text-left">
                    <SortableHeader
                      label="Ngày tải lên"
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
                {paginatedMaterials.length > 0 ? (
                  paginatedMaterials.map((material) => (
                    <tr
                      key={material.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg bg-gradient-to-r ${material.color} shadow-sm`}>
                            <FileText size={18} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{material.name}</div>
                            <div className="text-xs text-gray-500">{material.subject}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">{material.subject}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                          {material.kind}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <span className="font-medium">{material.size}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{material.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer">
                            <Eye size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
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
          )}
        </div>

        {/* Table Footer - Pagination */}
        {tab === "dekiemtra" ? (
          sortedExamData.length > 0 && (
            <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{examStartIndex + 1}-{Math.min(examEndIndex, sortedExamData.length)}</span> trong tổng số{" "}
                  <span className="font-semibold text-gray-900">{sortedExamData.length}</span> đề thi
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
                      if (totalExamPages <= maxVisible) {
                        for (let i = 1; i <= totalExamPages; i++) pages.push(i);
                      } else {
                        if (currentPage <= 3) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalExamPages);
                        } else if (currentPage >= totalExamPages - 2) {
                          pages.push(1);
                          pages.push("...");
                          for (let i = totalExamPages - 4; i <= totalExamPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push("...");
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalExamPages);
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
                    onClick={() => setCurrentPage(prev => Math.min(totalExamPages, prev + 1))}
                    disabled={currentPage === totalExamPages}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          sortedMaterialData.length > 0 && (
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
          )
        )}
      </div>

      {/* Create Lesson Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-red-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-xl">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tạo giáo án mới</h2>
                  <p className="text-sm text-gray-500">Tạo tài liệu giảng dạy cho buổi học</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                <X size={20} className="text-gray-500" />
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
              {submitError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600 font-medium">{submitError}</p></div>}
              {submitSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"><div className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-600" /><p className="text-sm text-emerald-600 font-medium">Tạo tài liệu thành công!</p></div></div>}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-100">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer">
                  {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang tạo...</> : <><Upload size={16} />Tạo tài liệu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
