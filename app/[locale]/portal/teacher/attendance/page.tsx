"use client";

import { useMemo, useState, useEffect } from "react";
import { CalendarDays, ArrowRightLeft, BellRing, Users, CheckCircle, Clock, AlertCircle, CalendarCheck, Zap, Send, Filter, ChevronDown, Sparkles, Download, BookOpen, MoreVertical, Search, ChevronLeft, MapPin, TrendingUp, CheckCheckIcon, ArrowUpDown, ChevronUp } from "lucide-react";

type AttendanceStatus = "PRESENT" | "ABSENT_NOTICE" | "ABSENT_LATE" | "MAKEUP";

type AttendanceRecord = {
  id: string;
  student: string;
  avatar?: string;
  status: AttendanceStatus;
  note?: string;
  studentCode: string;
  email?: string;
  phone?: string;
};

type ClassSession = {
  id: string;
  date: string;
  time: string;
  records: AttendanceRecord[];
  color: string;
};

type Class = {
  id: string;
  className: string;
  classCode: string;
  room: string;
  teacher: string;
  color: string;
  sessions: ClassSession[];
};

const INITIAL_CLASSES: Class[] = [
  {
    id: "CLS001",
    className: "IELTS Foundation - A1",
    classCode: "IELTS-FND-A1",
    room: "Phòng 301",
    teacher: "Nguyễn Văn A",
    color: "from-pink-500 to-rose-500",
    sessions: [
      {
        id: "CLS001-20241205",
        date: "05/12/2024",
        time: "19:00 - 21:00",
        color: "from-pink-500 to-rose-500",
        records: [
          { id: "HV001", student: "Nguyễn Văn An", studentCode: "HV001", status: "PRESENT", email: "an.nguyen@email.com", phone: "0912 345 678" },
          { id: "HV002", student: "Trần Thị Bình", studentCode: "HV002", status: "ABSENT_NOTICE", note: "Xin phép 24h trước", email: "binh.tran@email.com", phone: "0913 456 789" },
          { id: "HV003", student: "Lê Văn Cường", studentCode: "HV003", status: "ABSENT_LATE", note: "Thông báo muộn", email: "cuong.le@email.com", phone: "0914 567 890" },
          { id: "HV004", student: "Phạm Thị Dung", studentCode: "HV004", status: "PRESENT", email: "dung.pham@email.com", phone: "0915 678 901" },
          { id: "HV005", student: "Hoàng Minh Đức", studentCode: "HV005", status: "MAKEUP", note: "Bù từ lớp TOEIC B1", email: "duc.hoang@email.com", phone: "0916 789 012" },
          { id: "HV006", student: "Vũ Thị Lan", studentCode: "HV006", status: "PRESENT", email: "lan.vu@email.com", phone: "0917 890 123" },
          { id: "HV007", student: "Nguyễn Thị Hoa", studentCode: "HV007", status: "PRESENT", email: "hoa.nguyen@email.com", phone: "0918 901 234" },
          { id: "HV008", student: "Trần Văn Hùng", studentCode: "HV008", status: "PRESENT", email: "hung.tran@email.com", phone: "0919 012 345" },
          { id: "HV009", student: "Lê Thị Mai", studentCode: "HV009", status: "ABSENT_NOTICE", note: "Xin phép", email: "mai.le@email.com", phone: "0920 123 456" },
          { id: "HV010", student: "Phạm Văn Nam", studentCode: "HV010", status: "PRESENT", email: "nam.pham@email.com", phone: "0921 234 567" },
        ],
      },
      {
        id: "CLS001-20241203",
        date: "03/12/2024",
        time: "19:00 - 21:00",
        color: "from-fuchsia-500 to-purple-500",
        records: [
          { id: "HV001", student: "Nguyễn Văn An", studentCode: "HV001", status: "PRESENT", email: "an.nguyen@email.com", phone: "0912 345 678" },
          { id: "HV002", student: "Trần Thị Bình", studentCode: "HV002", status: "PRESENT", email: "binh.tran@email.com", phone: "0913 456 789" },
          { id: "HV003", student: "Lê Văn Cường", studentCode: "HV003", status: "MAKEUP", note: "Bù từ lớp TOEIC B1", email: "cuong.le@email.com", phone: "0914 567 890" },
          { id: "HV004", student: "Phạm Thị Dung", studentCode: "HV004", status: "PRESENT", email: "dung.pham@email.com", phone: "0915 678 901" },
        ],
      },
    ],
  },
  {
    id: "CLS002",
    className: "TOEIC Intermediate",
    classCode: "TOEIC-INT",
    room: "Phòng 205",
    teacher: "Trần Thị B",
    color: "from-amber-500 to-orange-500",
    sessions: [
      {
        id: "CLS002-20241206",
        date: "06/12/2024",
        time: "14:00 - 16:00",
        color: "from-amber-500 to-orange-500",
        records: [
          { id: "HV007", student: "Nguyễn Thị Hoa", studentCode: "HV007", status: "PRESENT", email: "hoa.nguyen@email.com", phone: "0918 901 234" },
          { id: "HV008", student: "Trần Văn Hùng", studentCode: "HV008", status: "PRESENT", email: "hung.tran@email.com", phone: "0919 012 345" },
          { id: "HV009", student: "Lê Thị Mai", studentCode: "HV009", status: "ABSENT_NOTICE", note: "Xin phép", email: "mai.le@email.com", phone: "0920 123 456" },
        ],
      },
    ],
  },
  {
    id: "CLS003",
    className: "Business English",
    classCode: "BUS-ENG",
    room: "Phòng 102",
    teacher: "Lê Văn C",
    color: "from-emerald-500 to-teal-500",
    sessions: [
      {
        id: "CLS003-20241207",
        date: "07/12/2024",
        time: "09:00 - 11:00",
        color: "from-emerald-500 to-teal-500",
        records: [
          { id: "HV010", student: "Phạm Văn Nam", studentCode: "HV010", status: "PRESENT", email: "nam.pham@email.com", phone: "0921 234 567" },
          { id: "HV011", student: "Hoàng Thị Linh", studentCode: "HV011", status: "PRESENT", email: "linh.hoang@email.com", phone: "0922 345 678" },
        ],
      },
    ],
  },
];

const STATUS_CONFIG: Record<AttendanceStatus, {
  text: string;
  icon: any;
  color: string;
  bgColor: string;
  dotColor: string;
}> = {
  PRESENT: {
    text: "Có mặt",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    dotColor: "bg-emerald-500"
  },
  ABSENT_NOTICE: {
    text: "Vắng phép",
    icon: CalendarCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    dotColor: "bg-amber-500"
  },
  ABSENT_LATE: {
    text: "Vắng muộn",
    icon: Clock,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    dotColor: "bg-rose-500"
  },
  MAKEUP: {
    text: "Buổi bù",
    icon: ArrowRightLeft,
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    dotColor: "bg-sky-500"
  },
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} ${config.color} text-sm font-medium`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
      <Icon size={14} />
      <span>{config.text}</span>
    </div>
  );
}

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

function StatusSelect({ value, onChange }: {
  value: AttendanceStatus;
  onChange: (v: AttendanceStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AttendanceStatus)}
      className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${STATUS_CONFIG[value].bgColor
        } ${STATUS_CONFIG[value].color} border-gray-200 outline-none cursor-pointer`}
    >
      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => (
        <option key={status} value={status} className="bg-white">
          {STATUS_CONFIG[status].text}
        </option>
      ))}
    </select>
  );
}

function StudentAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-xs">
      {initials}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Trang <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          ←
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${currentPage === page
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent'
              : 'border-gray-200 hover:bg-gray-50'
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          →
        </button>
      </div>
    </div>
  );
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<Class[]>(INITIAL_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<"student" | "studentCode" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const recordsPerPage = 8;

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId],
  );

  const selectedSession = useMemo(() => {
    if (!selectedClass || !selectedSessionId) return null;
    return selectedClass.sessions.find((s) => s.id === selectedSessionId);
  }, [selectedClass, selectedSessionId]);

  const handleSort = (column: "student" | "studentCode") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredRecords = useMemo(() => {
    if (!selectedSession) return [];

    let filtered = [...selectedSession.records];

    if (filterStatus !== "ALL") {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.student.toLowerCase().includes(query) ||
        record.studentCode.toLowerCase().includes(query) ||
        record.email?.toLowerCase().includes(query) ||
        record.phone?.includes(query)
      );
    }

    // Sort
    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;
        if (sortColumn === "student") {
          comparison = a.student.localeCompare(b.student);
        } else if (sortColumn === "studentCode") {
          comparison = a.studentCode.localeCompare(b.studentCode);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [selectedSession, filterStatus, searchQuery, sortColumn, sortDirection]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Reset to page 1 when filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortColumn]);

  const stats = useMemo(() => {
    if (!selectedSession) return null;
    const total = selectedSession.records.length;
    const present = selectedSession.records.filter(r => r.status === "PRESENT").length;
    const absent = total - present;
    const makeup = selectedSession.records.filter(r => r.status === "MAKEUP").length;

    return { total, present, absent, makeup };
  }, [selectedSession]);

  const handleStatusChange = (recordId: string, status: AttendanceStatus) => {
    if (!selectedClassId || !selectedSessionId) return;

    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === selectedClassId
          ? {
            ...cls,
            sessions: cls.sessions.map((session) =>
              session.id === selectedSessionId
                ? {
                  ...session,
                  records: session.records.map((record) =>
                    record.id === recordId ? { ...record, status } : record,
                  ),
                }
                : session,
            ),
          }
          : cls,
      ),
    );
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSessionId(null);
    setCurrentPage(1);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/20 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <CheckCheckIcon size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Điểm danh lớp học</h1>
            <p className="text-gray-600 mt-1 text-sm">Quản lý chuyên cần và sắp xếp buổi bù</p>
          </div>
        </div>

        {/* Class Selector */}
        {!selectedClassId && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Chọn lớp học</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleClassSelect(cls.id)}
                  className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-pink-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${cls.color}`}>
                      <BookOpen size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{cls.className}</div>
                      <div className="text-xs text-gray-600">{cls.classCode}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Users size={12} />
                      {cls.sessions[0]?.records.length || 0} học viên
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={12} />
                      {cls.sessions.length} buổi học
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Session Selector */}
        {selectedClassId && !selectedSessionId && selectedClass && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Chọn buổi học</h3>
              <button
                onClick={() => setSelectedClassId(null)}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium cursor-pointer"
              >
                ← Chọn lớp khác
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedClass.sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionSelect(session.id)}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${session.id === selectedSessionId
                    ? `border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50`
                    : "border-gray-200 hover:border-pink-200 hover:bg-pink-50/50"
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-r ${session.color}`}>
                      <CalendarDays size={14} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{session.date}</div>
                      <div className="text-xs text-gray-600">{session.time}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.records.length} học viên
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Session Info */}
        {selectedClassId && selectedSessionId && selectedClass && selectedSession && (
          <>
            {/* Class Info Card */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-white rounded-2xl border border-pink-200 shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedClass.color} text-white shadow-lg`}>
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedClass.className}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={16} className="text-pink-500" />
                          <span className="font-medium">{selectedSession.date}</span>
                          <span>•</span>
                          <span>{selectedSession.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={16} className="text-pink-500" />
                          <span>{selectedClass.room}</span>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedSessionId(null)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    Buổi khác
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${isSaving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                      }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tổng học viên</div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Users size={20} className="text-gray-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats?.total || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Có mặt</div>
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle size={20} className="text-emerald-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600">{stats?.present || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Vắng mặt</div>
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600">{stats?.absent || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-pink-600 uppercase tracking-wide">Tỉ lệ chuyên cần</div>
                  <div className="p-2 rounded-lg bg-pink-100">
                    <TrendingUp size={20} className="text-pink-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-pink-600">
                  {stats ? Math.round((stats.present / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      {selectedSession ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-900">Danh sách học viên</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm học viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-pink-300"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | "ALL")}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="PRESENT">Có mặt</option>
                      <option value="ABSENT_NOTICE">Vắng phép</option>
                      <option value="ABSENT_LATE">Vắng muộn</option>
                      <option value="MAKEUP">Buổi bù</option>
                    </select>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Download size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        <SortableHeader
                          label="Học viên"
                          column="student"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        <SortableHeader
                          label="Mã HV"
                          column="studentCode"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        Trạng thái
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        Ghi chú
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-100">
                    {paginatedRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-colors border-b border-pink-100">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={record.student} />
                            <div>
                              <div className="font-semibold text-gray-900">{record.student}</div>
                              <div className="text-xs text-gray-500">{record.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                          {record.studentCode}
                        </td>
                        <td className="px-4 py-4">
                          <StatusSelect
                            value={record.status}
                            onChange={(status) => handleStatusChange(record.id, status)}
                          />
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          {record.note ? (
                            <div className="flex items-center gap-1 text-amber-600 text-sm">
                              <AlertCircle size={14} />
                              <span className="truncate">{record.note}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Không có</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button className="p-2 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer">
                            <MoreVertical size={16} className="text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRecords.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Không tìm thấy học viên nào
                  </div>
                )}

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Makeup Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg">
                  <ArrowRightLeft size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Buổi bù</h3>
                  <p className="text-sm text-gray-600">Đề xuất lịch bù</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  Chọn lớp tương đương để học viên bù buổi vắng.
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                    <div className="font-medium text-sm text-gray-900">TOEIC B1 - Chiều T3</div>
                    <div className="text-xs text-gray-600 mt-1">15:00 - 17:00 • Phòng 205</div>
                  </div>

                  <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                    <div className="font-medium text-sm text-gray-900">IELTS C1 - Tối T5</div>
                    <div className="text-xs text-gray-600 mt-1">19:00 - 21:00 • Phòng 301</div>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white py-2.5 rounded-lg font-medium text-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CalendarCheck size={16} />
                  Đề xuất lịch bù
                </button>
              </div>
            </div>

            {/* Notification Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <BellRing size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Nhắc nhở</h3>
                  <p className="text-sm text-gray-600">Gửi thông báo</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  Gửi thông báo cho học viên vắng mặt.
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="text-xs font-medium text-emerald-700 mb-1">Tự động gửi</div>
                  <div className="text-xs text-emerald-600">10 phút sau giờ học</div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-lg font-medium text-sm hover:shadow-md transition-shadow cursor-pointer">
                  <Send size={16} />
                  Gửi thông báo
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-4">Thống kê nhanh</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Tỉ lệ chuyên cần</span>
                    <span className="font-semibold text-emerald-600">
                      {stats ? Math.round((stats.present / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                      style={{ width: `${stats ? (stats.present / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-lg font-bold text-rose-500">
                      {selectedSession?.records.filter(r => r.status === "ABSENT_LATE").length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Vắng muộn</div>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-amber-500">
                      {selectedSession?.records.filter(r => r.status === "ABSENT_NOTICE").length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Xin phép</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}