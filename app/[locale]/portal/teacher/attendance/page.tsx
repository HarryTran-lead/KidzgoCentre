"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ArrowRightLeft, BellRing, Users, CheckCircle, Clock, AlertCircle, CalendarCheck, Zap, Send, Filter, ChevronDown, Sparkles, Download } from "lucide-react";

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
  className: string;
  classCode: string;
  date: string;
  time: string;
  room: string;
  teacher: string;
  records: AttendanceRecord[];
  color: string;
};

const INITIAL_SESSIONS: ClassSession[] = [
  {
    id: "CLS001-20241205",
    className: "IELTS Foundation - A1",
    classCode: "IELTS-FND-A1",
    date: "05/12/2024",
    time: "19:00 - 21:00",
    room: "Phòng 301",
    teacher: "Nguyễn Văn A",
    color: "from-pink-500 to-rose-500",
    records: [
      { id: "HV001", student: "Nguyễn Văn An", studentCode: "HV001", status: "PRESENT", email: "an.nguyen@email.com", phone: "0912 345 678" },
      { id: "HV002", student: "Trần Thị Bình", studentCode: "HV002", status: "ABSENT_NOTICE", note: "Xin phép 24h trước", email: "binh.tran@email.com", phone: "0913 456 789" },
      { id: "HV003", student: "Lê Văn Cường", studentCode: "HV003", status: "ABSENT_LATE", note: "Thông báo muộn", email: "cuong.le@email.com", phone: "0914 567 890" },
      { id: "HV004", student: "Phạm Thị Dung", studentCode: "HV004", status: "PRESENT", email: "dung.pham@email.com", phone: "0915 678 901" },
      { id: "HV005", student: "Hoàng Minh Đức", studentCode: "HV005", status: "MAKEUP", note: "Bù từ lớp TOEIC B1", email: "duc.hoang@email.com", phone: "0916 789 012" },
      { id: "HV006", student: "Vũ Thị Lan", studentCode: "HV006", status: "PRESENT", email: "lan.vu@email.com", phone: "0917 890 123" },
    ],
  },
  {
    id: "CLS001-20241203",
    className: "IELTS Foundation - A1",
    classCode: "IELTS-FND-A1",
    date: "03/12/2024",
    time: "19:00 - 21:00",
    room: "Phòng 301",
    teacher: "Nguyễn Văn A",
    color: "from-fuchsia-500 to-purple-500",
    records: [
      { id: "HV001", student: "Nguyễn Văn An", studentCode: "HV001", status: "PRESENT", email: "an.nguyen@email.com", phone: "0912 345 678" },
      { id: "HV002", student: "Trần Thị Bình", studentCode: "HV002", status: "PRESENT", email: "binh.tran@email.com", phone: "0913 456 789" },
      { id: "HV003", student: "Lê Văn Cường", studentCode: "HV003", status: "MAKEUP", note: "Bù từ lớp TOEIC B1", email: "cuong.le@email.com", phone: "0914 567 890" },
      { id: "HV004", student: "Phạm Thị Dung", studentCode: "HV004", status: "PRESENT", email: "dung.pham@email.com", phone: "0915 678 901" },
    ],
  },
];

const STATUS_CONFIG: Record<AttendanceStatus, {
  text: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  PRESENT: {
    text: "Có mặt",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-r from-emerald-50 to-emerald-100",
    borderColor: "border-emerald-200"
  },
  ABSENT_NOTICE: {
    text: "Vắng (xin phép)",
    icon: CalendarCheck,
    color: "text-amber-600",
    bgColor: "bg-gradient-to-r from-amber-50 to-amber-100",
    borderColor: "border-amber-200"
  },
  ABSENT_LATE: {
    text: "Vắng (muộn)",
    icon: Clock,
    color: "text-rose-600",
    bgColor: "bg-gradient-to-r from-rose-50 to-rose-100",
    borderColor: "border-rose-200"
  },
  MAKEUP: {
    text: "Buổi bù",
    icon: ArrowRightLeft,
    color: "text-sky-600",
    bgColor: "bg-gradient-to-r from-sky-50 to-sky-100",
    borderColor: "border-sky-200"
  },
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${config.bgColor} ${config.borderColor} border ${config.color}`}>
      <Icon size={14} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

function StatusOption({ value, current, onChange }: { 
  value: AttendanceStatus; 
  current: AttendanceStatus; 
  onChange: (v: AttendanceStatus) => void;
}) {
  const config = STATUS_CONFIG[value];
  const Icon = config.icon;
  const active = value === current;
  
  return (
    <button
      onClick={() => onChange(value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
        active 
          ? `${config.bgColor} ${config.color} border ${config.borderColor} shadow-sm` 
          : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
      }`}
    >
      <Icon size={16} />
      {config.text}
    </button>
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
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-md">
      {initials}
    </div>
  );
}

function RecordRow({
  record,
  onChange,
}: {
  record: AttendanceRecord;
  onChange: (status: AttendanceStatus) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-4 mb-3 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <StudentAvatar name={record.student} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{record.student}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ID: {record.studentCode}</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
              <span>{record.email}</span>
              <span>•</span>
              <span>{record.phone}</span>
            </div>
            {record.note && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs">
                <AlertCircle size={12} />
                {record.note}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
            >
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showDetails && (
            <div className="mt-3 w-full max-w-xs p-3 bg-white border border-pink-200 rounded-xl">
              <div className="text-xs font-semibold text-gray-700 mb-2">Thay đổi trạng thái</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => (
                  <StatusOption 
                    key={status} 
                    value={status} 
                    current={record.status} 
                    onChange={onChange} 
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

export default function TeacherAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>(INITIAL_SESSIONS);
  const [sessionId, setSessionId] = useState(INITIAL_SESSIONS[0].id);
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "ALL">("ALL");
  const [isSaving, setIsSaving] = useState(false);
  
  const current = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId],
  );

  const filteredRecords = useMemo(() => {
    if (!current) return [];
    if (filterStatus === "ALL") return current.records;
    return current.records.filter(record => record.status === filterStatus);
  }, [current, filterStatus]);

  const stats = useMemo(() => {
    if (!current) return null;
    const total = current.records.length;
    const present = current.records.filter(r => r.status === "PRESENT").length;
    const absent = total - present;
    const makeup = current.records.filter(r => r.status === "MAKEUP").length;
    
    return { total, present, absent, makeup };
  }, [current]);

  const handleStatusChange = (recordId: string, status: AttendanceStatus) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              records: session.records.map((record) =>
                record.id === recordId ? { ...record, status } : record,
              ),
            }
          : session,
      ),
    );
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  if (!current) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Điểm danh & Quản lý buổi bù
            </h1>
            <p className="text-gray-600 mt-1">
              Cập nhật chuyên cần theo thời gian thực, phân loại xin phép trước 24h và xử lý buổi bù cho học viên.
            </p>
          </div>
        </div>

        {/* Session Selector */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-pink-500" />
              <h3 className="font-semibold text-gray-900">Chọn buổi học</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={16} />
              {current.date} • {current.time}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSessionId(session.id)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 ${
                  session.id === sessionId
                    ? `bg-gradient-to-r ${session.color} text-white shadow-lg`
                    : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${session.id === sessionId ? 'bg-white/20' : 'bg-pink-100'}`}>
                  <CalendarDays size={14} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{session.date}</div>
                  <div className="text-xs opacity-80">{session.className}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Sĩ số lớp</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{stats?.total || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <Users size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Có mặt</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{stats?.present || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Vắng mặt</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">{stats?.absent || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-sky-50 rounded-2xl border border-sky-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Buổi bù</div>
                <div className="text-2xl font-bold mt-2 text-sky-600">{stats?.makeup || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-sky-100">
                <ArrowRightLeft size={24} className="text-sky-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Class Info Bar */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-2xl border border-pink-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-gradient-to-r ${current.color} text-white`}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{current.className}</h3>
                <div className="text-sm text-gray-600 flex items-center gap-3">
                  <span>Mã lớp: {current.classCode}</span>
                  <span>•</span>
                  <span>Phòng: {current.room}</span>
                  <span>•</span>
                  <span>Giáo viên: {current.teacher}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                isSaving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg'
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
                  Lưu tất cả thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Danh sách học viên</h3>
                  <span className="text-sm text-gray-600">({filteredRecords.length})</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white border border-pink-200 rounded-xl px-3 py-1.5">
                    <Filter size={16} className="text-gray-500" />
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | "ALL")}
                      className="text-sm bg-transparent outline-none"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="PRESENT">Có mặt</option>
                      <option value="ABSENT_NOTICE">Vắng (xin phép)</option>
                      <option value="ABSENT_LATE">Vắng (muộn)</option>
                      <option value="MAKEUP">Buổi bù</option>
                    </select>
                  </div>
                  
                  <button className="p-2.5 bg-white border border-pink-200 rounded-xl hover:bg-pink-50">
                    <Download size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredRecords.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onChange={(status) => handleStatusChange(record.id, status)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Reminder Card */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                <BellRing size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Nhắc nhở tự động</h3>
                <p className="text-sm text-gray-600">Gửi tin nhắn Zalo</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Tin nhắn sẽ được gửi tự động nếu học viên chưa điểm danh sau 10 phút, phụ huynh có thể xác nhận lý do vắng.
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-700">Đang hoạt động</div>
                  <div className="text-xs text-emerald-600 mt-1">Tự động gửi mỗi buổi học</div>
                </div>
                
                <button className="p-3 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50">
                  <Zap size={18} className="text-emerald-600" />
                </button>
              </div>
              
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                <Send size={16} />
                Gửi ngay
              </button>
            </div>
          </div>

          {/* Makeup Schedule */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg">
                <ArrowRightLeft size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Sắp xếp buổi bù</h3>
                <p className="text-sm text-gray-600">Chọn lớp tương đương</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Chọn lớp tương đương trong tuần hoặc chuyển sang buổi bù sau khóa, thông tin sẽ gửi tới quản lý để duyệt.
              </div>
              
              <div className="space-y-2">
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                  <div className="font-medium text-gray-900">TOEIC B1 - Chiều T3</div>
                  <div className="text-xs text-gray-600 mt-1">15:00 - 17:00 • Phòng 205</div>
                </div>
                
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                  <div className="font-medium text-gray-900">IELTS C1 - Tối T5</div>
                  <div className="text-xs text-gray-600 mt-1">19:00 - 21:00 • Phòng 301</div>
                </div>
              </div>
              
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                <CalendarCheck size={16} />
                Đề xuất lịch bù
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Thống kê nhanh</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Tỉ lệ chuyên cần</div>
                <div className="font-semibold text-emerald-600">
                  {stats ? Math.round((stats.present / stats.total) * 100) : 0}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" 
                  style={{ width: `${stats ? (stats.present / stats.total) * 100 : 0}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <div className="text-center p-2">
                  <div className="text-2xl font-bold text-rose-500">
                    {current.records.filter(r => r.status === "ABSENT_LATE").length}
                  </div>
                  <div className="text-xs text-gray-600">Vắng muộn</div>
                </div>
                
                <div className="text-center p-2">
                  <div className="text-2xl font-bold text-amber-500">
                    {current.records.filter(r => r.status === "ABSENT_NOTICE").length}
                  </div>
                  <div className="text-xs text-gray-600">Xin phép</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}