"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ArrowRightLeft, BellRing, Users } from "lucide-react";

type AttendanceStatus = "PRESENT" | "ABSENT_NOTICE" | "ABSENT_LATE" | "MAKEUP";

type AttendanceRecord = {
  id: string;
  student: string;
  status: AttendanceStatus;
  note?: string;
};

type ClassSession = {
  id: string;
  className: string;
  date: string;
  time: string;
  room: string;
  records: AttendanceRecord[];
};

const INITIAL_SESSIONS: ClassSession[] = [
  {
    id: "CLS001-20241205",
    className: "IELTS Foundation - A1",
    date: "05/12/2024",
    time: "19:00 - 21:00",
    room: "Phòng 301",
    records: [
      { id: "HV001", student: "Nguyễn Văn An", status: "PRESENT" },
      { id: "HV002", student: "Trần Thị Bình", status: "ABSENT_NOTICE", note: "Xin phép 24h trước" },
      { id: "HV003", student: "Lê Văn Cường", status: "ABSENT_LATE", note: "Thông báo muộn" },
      { id: "HV004", student: "Phạm Thị Dung", status: "PRESENT" },
    ],
  },
  {
    id: "CLS001-20241203",
    className: "IELTS Foundation - A1",
    date: "03/12/2024",
    time: "19:00 - 21:00",
    room: "Phòng 301",
    records: [
      { id: "HV001", student: "Nguyễn Văn An", status: "PRESENT" },
      { id: "HV002", student: "Trần Thị Bình", status: "PRESENT" },
      { id: "HV003", student: "Lê Văn Cường", status: "MAKEUP", note: "Bù từ lớp TOEIC B1" },
      { id: "HV004", student: "Phạm Thị Dung", status: "PRESENT" },
    ],
  },
];

const STATUS_LABEL: Record<AttendanceStatus, { text: string; cls: string }> = {
  PRESENT: { text: "Có mặt", cls: "bg-emerald-50 text-emerald-700" },
  ABSENT_NOTICE: { text: "Vắng (xin phép)", cls: "bg-amber-50 text-amber-700" },
  ABSENT_LATE: { text: "Vắng (muộn)", cls: "bg-rose-50 text-rose-700" },
  MAKEUP: { text: "Buổi bù", cls: "bg-sky-50 text-sky-700" },
};

function StatusRadio({ value, current, onChange }: { value: AttendanceStatus; current: AttendanceStatus; onChange: (v: AttendanceStatus) => void }) {
  const active = value === current;
  return (
    <button
      onClick={() => onChange(value)}
      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {STATUS_LABEL[value].text}
    </button>
  );
}

function RecordRow({
  record,
  onChange,
}: {
  record: AttendanceRecord;
  onChange: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.2fr,1fr,1fr] items-center border-b border-slate-100 py-3">
      <div>
        <div className="font-medium text-gray-900">{record.student}</div>
        <div className="text-xs text-slate-500">Mã: {record.id}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((status) => (
          <StatusRadio key={status} value={status} current={record.status} onChange={onChange} />
        ))}
      </div>
      <div className="text-xs text-slate-500">
        {record.note ? <span className="text-slate-600">{record.note}</span> : "Không có ghi chú"}
      </div>
    </div>
  );
}

export default function TeacherAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>(INITIAL_SESSIONS);
  const [sessionId, setSessionId] = useState(INITIAL_SESSIONS[0].id);
  const current = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId],
  );

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

  if (!current) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Điểm danh & Quản lý buổi bù</h1>
          <p className="text-sm text-slate-500">
            Cập nhật chuyên cần theo thời gian thực, phân loại xin phép trước 24h và xử lý buổi bù cho học viên.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <CalendarDays size={18} className="text-slate-500" />
          {current.date} • {current.time}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setSessionId(session.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              session.id === sessionId
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {session.date} • {session.className}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-1">
          <div className="text-sm text-slate-500">Sĩ số lớp</div>
          <div className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-slate-500" /> {current.records.length}
          </div>
          <div className="text-xs text-slate-400">Bao gồm học viên bù</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-1">
          <div className="text-sm text-slate-500">Đã điểm danh</div>
          <div className="text-3xl font-extrabold text-emerald-600">{current.records.filter((r) => r.status === "PRESENT").length}</div>
          <div className="text-xs text-slate-400">Tính tới hiện tại</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-1">
          <div className="text-sm text-slate-500">Đang chờ xử lý</div>
          <div className="text-3xl font-extrabold text-amber-600">
            {current.records.filter((r) => r.status !== "PRESENT").length}
          </div>
          <div className="text-xs text-slate-400">Cần phân bổ buổi bù</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Danh sách học viên
        </div>
        {current.records.map((record) => (
          <RecordRow
            key={record.id}
            record={record}
            onChange={(status) => handleStatusChange(record.id, status)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Gửi nhắc nhở Zalo</div>
          <p className="text-sm text-slate-600">
            Tin nhắn sẽ được gửi tự động nếu học viên chưa điểm danh sau 10 phút, phụ huynh có thể xác nhận lý do vắng.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <BellRing size={16} /> Kích hoạt nhắc nhở
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Sắp xếp buổi bù</div>
          <p className="text-sm text-slate-600">
            Chọn lớp tương đương trong tuần hoặc chuyển sang buổi bù sau khóa, thông tin sẽ gửi tới quản lý để duyệt.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            <ArrowRightLeft size={16} /> Đề xuất lịch bù
          </button>
        </div>
      </div>
    </div>
  );
}