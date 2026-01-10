"use client";
import React, { useState, useEffect } from "react";
import { Search, Upload, Plus, Filter, Eye, Download, Edit, Trash2, BookOpen, FileText, Clock, Users, Star, ChevronRight, Sparkles, BarChart, FileCheck, Calendar, FileType, HardDrive, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

// SortableHeader Component
function SortableHeader<T extends string>({ 
  label, 
  column, 
  sortColumn, 
  sortDirection, 
  onSort 
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
      className="flex items-center gap-2 hover:text-pink-600 transition-colors cursor-pointer text-left"
    >
      <span>{label}</span>
      <div className="flex flex-col">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp size={14} className="text-pink-600" />
          ) : (
            <ChevronDown size={14} className="text-pink-600" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </div>
    </button>
  );
}

// Tabs Component
function Tabs({ value, onChange, items }: { value: string; onChange: (k: string) => void; items: { key: string; label: string; icon?: React.ReactNode }[] }) {
  return (
    <div className="inline-flex bg-white border border-pink-200 rounded-xl p-1 text-sm">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 cursor-pointer ${
            value === item.key
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "text-gray-700 hover:bg-pink-50"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// CourseCard Component
function CourseCard({ title, level, duration, sessions, color = "from-pink-500 to-rose-500", progress = 65 }: { 
  title: string; 
  level: string; 
  duration: string; 
  sessions: number;
  color?: string;
  progress?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const levelColor = {
    "Cơ bản": "bg-emerald-100 text-emerald-700",
    "Trung cấp": "bg-amber-100 text-amber-700",
    "Nâng cao": "bg-rose-100 text-rose-700"
  }[level] || "bg-gray-100 text-gray-700";

  return (
    <div
      className={`bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 transition-all duration-500 hover:shadow-xl hover:shadow-pink-100/50 hover:-translate-y-1 ${
        isHovered ? "ring-2 ring-pink-200" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full ${levelColor} font-medium`}>
              {level}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">{sessions} buổi</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={14} />
            <span>24 học viên</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Tiến độ khóa học</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-pink-100">
          <button className="text-xs text-pink-600 font-medium hover:text-pink-700 flex items-center gap-1">
            Xem chi tiết
            <ChevronRight size={12} className={isHovered ? "translate-x-0.5" : ""} />
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg">
              <Edit size={14} />
            </button>
            <button className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// MaterialRow Component
function MaterialRow({ name, course, kind, size, date, color = "from-pink-500 to-rose-500" }: { 
  name: string; 
  course: string; 
  kind: string; 
  size: string; 
  date: string;
  color?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const iconMap = {
    "PDF": FileText,
    "DOCX": FileType,
    "PPT": FileText,
    "VIDEO": "PlayCircle",
    "AUDIO": "Music"
  };

  const Icon = FileText; // Default icon

  return (
    <div
      className={`grid grid-cols-12 gap-3 items-center py-4 px-4 rounded-xl transition-all duration-300 border ${
        isHovered 
          ? "bg-gradient-to-r from-pink-50/50 to-rose-50/50 border-pink-200 shadow-sm" 
          : "bg-white border-pink-100"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="col-span-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${color} shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{name}</div>
          <div className="text-xs text-gray-500 mt-0.5">ID: {name.replace(/\s+/g, '-').toLowerCase()}</div>
        </div>
      </div>
      
      <div className="col-span-2">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
          {kind}
        </span>
      </div>
      
      <div className="col-span-2">
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <HardDrive size={16} className="text-gray-400" />
          <span className="font-medium">{size}</span>
        </div>
      </div>
      
      <div className="col-span-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={14} className="text-gray-400" />
          <span>{date}</span>
        </div>
      </div>
      
      <div className="col-span-1 flex items-center justify-end gap-1">
        <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer">
          <Eye size={16} />
        </button>
        <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
          <Download size={16} />
        </button>
        <button className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ExamRow Component
function ExamRow({ title, course, class: className, date, duration, status, color = "from-pink-500 to-rose-500" }: { 
  title: string; 
  course: string; 
  class: string;
  date: string; 
  duration: string; 
  status: string;
  color?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`grid grid-cols-12 gap-3 items-center py-4 px-4 rounded-xl transition-all duration-300 border ${
        isHovered 
          ? "bg-gradient-to-r from-pink-50/50 to-rose-50/50 border-pink-200 shadow-sm" 
          : "bg-white border-pink-100"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="col-span-2 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${color} shadow-sm`}>
          <FileCheck size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">Mã đề: {title.split(' ')[0].toLowerCase()}-001</div>
        </div>
      </div>
      
      <div className="col-span-2">
        <div className="text-sm text-gray-700 font-medium truncate">{className}</div>
      </div>
      
      <div className="col-span-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={14} className="text-gray-400" />
          <span>{date}</span>
        </div>
      </div>
      
      <div className="col-span-2">
        <div className="flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap">
          <Clock size={14} className="text-gray-400" />
          <span className="font-medium">{duration}</span>
        </div>
      </div>
      
      <div className="col-span-2">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
          status === "Sắp tới" 
            ? "bg-amber-100 text-amber-700 border-amber-200" 
            : status === "Đã hoàn thành" 
            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
            : "bg-sky-100 text-sky-700 border-sky-200"
        }`}>
          {status}
        </span>
      </div>
      
      <div className="col-span-2 flex items-center justify-end gap-1">
        <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer">
          <Eye size={16} />
        </button>
        <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
          <Edit size={16} />
        </button>
        <button className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

type Material = {
  id: string;
  name: string;
  course: string;
  kind: string;
  size: string;
  date: string;
  color: string;
};

type Exam = {
  id: string;
  title: string;
  course: string;
  class: string;
  date: string;
  duration: string;
  status: string;
  color: string;
};

export default function Page() {
  const [tab, setTab] = useState<"tailieu" | "dekiemtra">("tailieu");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [sortColumn, setSortColumn] = useState<"name" | "size" | "date" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortColumnExam, setSortColumnExam] = useState<"title" | "date" | "duration" | null>(null);
  const [sortDirectionExam, setSortDirectionExam] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const materialsData: Material[] = [
    { id: "1", name: "IELTS Speaking Module 1-5", course: "IELTS Foundation", kind: "PDF", size: "2.5 MB", date: "01/10/2025", color: "from-pink-500 to-rose-500" },
    { id: "2", name: "TOEIC Practice Test Vol.1", course: "TOEIC Intermediate", kind: "PDF", size: "1.8 MB", date: "05/09/2025", color: "from-fuchsia-500 to-purple-500" },
    { id: "3", name: "Business Vocabulary List", course: "Business English", kind: "DOCX", size: "0.5 MB", date: "15/09/2025", color: "from-amber-500 to-orange-500" },
    { id: "4", name: "IELTS Writing Task 2 Samples", course: "IELTS Foundation", kind: "PDF", size: "3.2 MB", date: "20/09/2025", color: "from-emerald-500 to-teal-500" },
    { id: "5", name: "Grammar Rules Complete Guide", course: "Academic Writing", kind: "PDF", size: "4.1 MB", date: "10/09/2025", color: "from-sky-500 to-blue-500" },
  ];

  const handleSort = (column: "name" | "size" | "date") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedMaterials = [...materialsData].sort((a, b) => {
    if (!sortColumn) return 0;

    let comparison = 0;
    if (sortColumn === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === "size") {
      const sizeA = parseFloat(a.size.replace(" MB", ""));
      const sizeB = parseFloat(b.size.replace(" MB", ""));
      comparison = sizeA - sizeB;
    } else if (sortColumn === "date") {
      const dateA = new Date(a.date.split("/").reverse().join("-"));
      const dateB = new Date(b.date.split("/").reverse().join("-"));
      comparison = dateA.getTime() - dateB.getTime();
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const filteredMaterials = sortedMaterials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const examsData: Exam[] = [
    { id: "1", title: "Kiểm tra giữa kỳ - IELTS", course: "IELTS Foundation", class: "IELTS Foundation - A1", date: "15/10/2025", duration: "90 phút", status: "Sắp tới", color: "from-pink-500 to-rose-500" },
    { id: "2", title: "Kiểm tra cuối kỳ - TOEIC", course: "TOEIC Intermediate", class: "TOEIC Intermediate", date: "25/10/2025", duration: "120 phút", status: "Sắp tới", color: "from-fuchsia-500 to-purple-500" },
    { id: "3", title: "Bài kiểm tra 1 - Business", course: "Business English", class: "Business English", date: "05/10/2025", duration: "60 phút", status: "Đã hoàn thành", color: "from-amber-500 to-orange-500" },
    { id: "4", title: "Writing Assessment", course: "Academic Writing", class: "Academic Writing", date: "12/10/2025", duration: "45 phút", status: "Sắp tới", color: "from-emerald-500 to-teal-500" },
  ];

  const handleSortExam = (column: "title" | "date" | "duration") => {
    if (sortColumnExam === column) {
      setSortDirectionExam(sortDirectionExam === "asc" ? "desc" : "asc");
    } else {
      setSortColumnExam(column);
      setSortDirectionExam("asc");
    }
  };

  const sortedExams = [...examsData].sort((a, b) => {
    if (!sortColumnExam) return 0;

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

  const filteredExams = sortedExams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const courseStats = {
    total: 12,
    active: 8,
    completed: 4,
    materials: 156,
    exams: 24
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Tài liệu
            </h1>
            <p className="text-gray-600 mt-1">Quản lý chương trình học và tài liệu giảng dạy</p>
          </div>
        </div>

        
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        {/* Tabs and Actions */}
        <div className="px-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 ">
            <Tabs
              value={tab}
              onChange={(k) => setTab(k as any)}
              items={[
                { key: "tailieu", label: "Tài liệu", icon: <FileText size={16} /> },
                { key: "dekiemtra", label: "Đề kiểm tra", icon: <FileCheck size={16} /> },
              ]}
            />
            
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all cursor-pointer">
                <Upload size={16} />
                {tab === "tailieu" ? "Tải lên tài liệu" : "Tải lên đề thi"}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white border border-pink-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
              placeholder={
                tab === "tailieu" 
                  ? "Tìm kiếm tài liệu, tên file..." 
                  : "Tìm kiếm đề thi, bài kiểm tra..."
              }
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-pink-600">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === "tailieu" && (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-700 px-4 py-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl">
                <div className="col-span-4">
                  <SortableHeader
                    label="Tên tài liệu"
                    column="name"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </div>
                <div className="col-span-2">Loại</div>
                <div className="col-span-2">
                  <SortableHeader
                    label="Kích thước"
                    column="size"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </div>
                <div className="col-span-3">
                  <SortableHeader
                    label="Ngày tải lên"
                    column="date"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </div>
                <div className="col-span-1 text-right">Thao tác</div>
              </div>
              
              {/* Materials List */}
              <div className="space-y-2">
                {filteredMaterials.map((material) => (
                  <MaterialRow 
                    key={material.id}
                    name={material.name} 
                    course={material.course} 
                    kind={material.kind} 
                    size={material.size} 
                    date={material.date}
                    color={material.color}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "dekiemtra" && (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-700 px-4 py-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl">
                <div className="col-span-2">
                  <SortableHeader
                    label="Tên bài kiểm tra"
                    column="title"
                    sortColumn={sortColumnExam}
                    sortDirection={sortDirectionExam}
                    onSort={handleSortExam}
                  />
                </div>
                <div className="col-span-2">Lớp</div>
                <div className="col-span-2">
                  <SortableHeader
                    label="Ngày thi"
                    column="date"
                    sortColumn={sortColumnExam}
                    sortDirection={sortDirectionExam}
                    onSort={handleSortExam}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    label="Thời lượng"
                    column="duration"
                    sortColumn={sortColumnExam}
                    sortDirection={sortDirectionExam}
                    onSort={handleSortExam}
                  />
                </div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-2 text-right">Thao tác</div>
              </div>
              
              {/* Exams List */}
              <div className="space-y-2">
                {filteredExams.map((exam) => (
                  <ExamRow 
                    key={exam.id}
                    title={exam.title} 
                    course={exam.course} 
                    class={exam.class}
                    date={exam.date} 
                    duration={exam.duration} 
                    status={exam.status}
                    color={exam.color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}