"use client";
import React, { useState, useEffect } from "react";
import { Search, Upload, Plus, Filter, Eye, Download, Edit, Trash2, BookOpen, FileText, Clock, Users, Star, ChevronRight, Sparkles, BarChart, FileCheck, Calendar, FileType, HardDrive } from "lucide-react";

// Tabs Component
function Tabs({ value, onChange, items }: { value: string; onChange: (k: string) => void; items: { key: string; label: string; icon?: React.ReactNode }[] }) {
  return (
    <div className="inline-flex bg-white border border-pink-200 rounded-xl p-1 text-sm">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 ${
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
      className={`grid grid-cols-12 gap-3 items-center py-3 px-4 rounded-xl transition-all duration-300 ${
        isHovered ? "bg-gradient-to-r from-pink-50/50 to-rose-50/50 border border-pink-200" : "bg-white"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="col-span-5 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500 mt-0.5">ID: {name.replace(/\s+/g, '-').toLowerCase()}</div>
        </div>
      </div>
      
      <div className="col-span-3">
        <div className="text-sm text-gray-700">{course}</div>
      </div>
      
      <div className="col-span-1">
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
          {kind}
        </span>
      </div>
      
      <div className="col-span-1">
        <div className="flex items-center gap-1 text-sm text-gray-700">
          <HardDrive size={14} />
          {size}
        </div>
      </div>
      
      <div className="col-span-1">
        <div className="text-sm text-gray-700">{date}</div>
      </div>
      
      <div className="col-span-1 flex items-center justify-end gap-1">
        <button className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
          <Eye size={16} />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
          <Download size={16} />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ExamRow Component
function ExamRow({ title, course, date, duration, status, color = "from-pink-500 to-rose-500" }: { 
  title: string; 
  course: string; 
  date: string; 
  duration: string; 
  status: string;
  color?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = {
    "Sắp tới": { color: "bg-amber-100 text-amber-700", icon: Clock },
    "Đang diễn ra": { color: "bg-emerald-100 text-emerald-700", icon: "Activity" },
    "Đã hoàn thành": { color: "bg-sky-100 text-sky-700", icon: FileCheck }
  };

  const StatusIcon = FileCheck; // Default icon

  return (
    <div
      className={`grid grid-cols-12 gap-3 items-center py-3 px-4 rounded-xl transition-all duration-300 ${
        isHovered ? "bg-gradient-to-r from-pink-50/50 to-rose-50/50 border border-pink-200" : "bg-white"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="col-span-5 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
          <FileCheck size={16} className="text-white" />
        </div>
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">Mã đề: {title.split(' ')[0].toLowerCase()}-001</div>
        </div>
      </div>
      
      <div className="col-span-2">
        <div className="text-sm text-gray-700">{course}</div>
      </div>
      
      <div className="col-span-2">
        <div className="flex items-center gap-1 text-sm text-gray-700">
          <Calendar size={14} />
          {date}
        </div>
      </div>
      
      <div className="col-span-1">
        <div className="text-sm text-gray-700">{duration}</div>
      </div>
      
      <div className="col-span-1">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          status === "Sắp tới" 
            ? "bg-amber-100 text-amber-700" 
            : status === "Đã hoàn thành" 
            ? "bg-emerald-100 text-emerald-700" 
            : "bg-sky-100 text-sky-700"
        }`}>
          {status}
        </span>
      </div>
      
      <div className="col-span-1 flex items-center justify-end gap-1">
        <button className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
          <Eye size={16} />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
          <Edit size={16} />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<"monhoc" | "tailieu" | "dekiemtra">("monhoc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
              Môn học & Tài liệu
            </h1>
            <p className="text-gray-600 mt-1">Quản lý chương trình học và tài liệu giảng dạy</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng môn học</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{courseStats.total}</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <BookOpen size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Môn đang dạy</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{courseStats.active}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <Sparkles size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-sky-50 rounded-2xl border border-sky-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tài liệu</div>
                <div className="text-2xl font-bold mt-2 text-sky-600">{courseStats.materials}</div>
              </div>
              <div className="p-3 rounded-xl bg-sky-100">
                <FileText size={24} className="text-sky-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Đề kiểm tra</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">{courseStats.exams}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <FileCheck size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Đã hoàn thành</div>
                <div className="text-2xl font-bold mt-2 text-purple-600">{courseStats.completed}</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <Star size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        {/* Tabs and Actions */}
        <div className="px-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <Tabs
              value={tab}
              onChange={(k) => setTab(k as any)}
              items={[
                { key: "monhoc", label: "Môn học", icon: <BookOpen size={16} /> },
                { key: "tailieu", label: "Tài liệu", icon: <FileText size={16} /> },
                { key: "dekiemtra", label: "Đề kiểm tra", icon: <FileCheck size={16} /> },
              ]}
            />
            
            <div className="flex items-center gap-3">
              {tab !== "monhoc" && (
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all">
                  <Upload size={16} />
                  {tab === "tailieu" ? "Tải lên tài liệu" : "Tải lên đề thi"}
                </button>
              )}
              {tab === "monhoc" && (
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all">
                  <Plus size={16} />
                  Thêm môn học
                </button>
              )}
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
                tab === "monhoc" 
                  ? "Tìm kiếm môn học, mã lớp..." 
                  : tab === "tailieu" 
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
          {tab === "monhoc" && (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <CourseCard 
                title="IELTS Foundation" 
                level="Cơ bản" 
                duration="3 tháng" 
                sessions={36} 
                color="from-pink-500 to-rose-500"
                progress={65}
              />
              <CourseCard 
                title="TOEIC Intermediate" 
                level="Trung cấp" 
                duration="2 tháng" 
                sessions={24} 
                color="from-fuchsia-500 to-purple-500"
                progress={42}
              />
              <CourseCard 
                title="Business English" 
                level="Nâng cao" 
                duration="4 tháng" 
                sessions={48} 
                color="from-amber-500 to-orange-500"
                progress={88}
              />
              <CourseCard 
                title="Academic Writing" 
                level="Trung cấp" 
                duration="2 tháng" 
                sessions={24} 
                color="from-emerald-500 to-teal-500"
                progress={30}
              />
              <CourseCard 
                title="Conversational English" 
                level="Cơ bản" 
                duration="3 tháng" 
                sessions={36} 
                color="from-sky-500 to-blue-500"
                progress={75}
              />
              <CourseCard 
                title="Test Preparation" 
                level="Nâng cao" 
                duration="1 tháng" 
                sessions={12} 
                color="from-violet-500 to-purple-500"
                progress={95}
              />
            </div>
          )}

          {tab === "tailieu" && (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 text-sm text-gray-600 px-4 py-3 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-xl">
                <div className="col-span-5 font-medium">Tên tài liệu</div>
                <div className="col-span-3 font-medium">Môn học</div>
                <div className="col-span-1 font-medium">Loại</div>
                <div className="col-span-1 font-medium">Kích thước</div>
                <div className="col-span-1 font-medium">Ngày tải lên</div>
                <div className="col-span-1 font-medium text-right">Thao tác</div>
              </div>
              
              {/* Materials List */}
              <div className="space-y-1">
                <MaterialRow 
                  name="IELTS Speaking Module 1-5" 
                  course="IELTS Foundation" 
                  kind="PDF" 
                  size="2.5 MB" 
                  date="01/10/2025"
                  color="from-pink-500 to-rose-500"
                />
                <MaterialRow 
                  name="TOEIC Practice Test Vol.1" 
                  course="TOEIC Intermediate" 
                  kind="PDF" 
                  size="1.8 MB" 
                  date="05/09/2025"
                  color="from-fuchsia-500 to-purple-500"
                />
                <MaterialRow 
                  name="Business Vocabulary List" 
                  course="Business English" 
                  kind="DOCX" 
                  size="0.5 MB" 
                  date="15/09/2025"
                  color="from-amber-500 to-orange-500"
                />
                <MaterialRow 
                  name="IELTS Writing Task 2 Samples" 
                  course="IELTS Foundation" 
                  kind="PDF" 
                  size="3.2 MB" 
                  date="20/09/2025"
                  color="from-emerald-500 to-teal-500"
                />
                <MaterialRow 
                  name="Grammar Rules Complete Guide" 
                  course="Academic Writing" 
                  kind="PDF" 
                  size="4.1 MB" 
                  date="10/09/2025"
                  color="from-sky-500 to-blue-500"
                />
              </div>
            </div>
          )}

          {tab === "dekiemtra" && (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 text-sm text-gray-600 px-4 py-3 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-xl">
                <div className="col-span-5 font-medium">Tên bài kiểm tra</div>
                <div className="col-span-2 font-medium">Môn học</div>
                <div className="col-span-2 font-medium">Ngày thi</div>
                <div className="col-span-1 font-medium">Thời lượng</div>
                <div className="col-span-1 font-medium">Trạng thái</div>
                <div className="col-span-1 font-medium text-right">Thao tác</div>
              </div>
              
              {/* Exams List */}
              <div className="space-y-1">
                <ExamRow 
                  title="Kiểm tra giữa kỳ - IELTS" 
                  course="IELTS Foundation" 
                  date="15/10/2025" 
                  duration="90 phút" 
                  status="Sắp tới"
                  color="from-pink-500 to-rose-500"
                />
                <ExamRow 
                  title="Kiểm tra cuối kỳ - TOEIC" 
                  course="TOEIC Intermediate" 
                  date="25/10/2025" 
                  duration="120 phút" 
                  status="Sắp tới"
                  color="from-fuchsia-500 to-purple-500"
                />
                <ExamRow 
                  title="Bài kiểm tra 1 - Business" 
                  course="Business English" 
                  date="05/10/2025" 
                  duration="60 phút" 
                  status="Đã hoàn thành"
                  color="from-amber-500 to-orange-500"
                />
                <ExamRow 
                  title="Writing Assessment" 
                  course="Academic Writing" 
                  date="12/10/2025" 
                  duration="45 phút" 
                  status="Sắp tới"
                  color="from-emerald-500 to-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {tab === "monhoc" && (
          <div className="px-6 pb-6 pt-4 border-t border-pink-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>Hiển thị 6/12 môn học</div>
              <button className="text-pink-600 font-medium hover:text-pink-700 flex items-center gap-1">
                Xem tất cả môn học
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}