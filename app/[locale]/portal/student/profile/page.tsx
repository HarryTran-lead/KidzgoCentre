// src/pages/student/ProfilePage.tsx
"use client";

import { useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Award,
  Download,
  CheckCircle2,
} from "lucide-react";
import { FilterTabs, TabOption } from "@/components/portal/student/FilterTabs";

type Score = {
  title: string;
  subject: string;
  date: string;
  score: number;
  label: string;
};

type Course = {
  name: string;
  status: "ongoing" | "completed";
  summary?: string;
  finishedAt?: string;
  finalScore?: string;
  hasCertificate?: boolean;
};

// Tab options for FilterTabs
const profileTabOptions: TabOption[] = [
  { id: "info", label: "Thông tin" },
  { id: "scores", label: "Điểm số" },
  { id: "history", label: "Lịch sử" },
];

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-50 grid place-items-center">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-gray-900 font-medium">{value}</div>
      </div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-900 font-medium">Tỷ lệ tham gia</div>
        <div className="text-gray-900 font-semibold">{percent}%</div>
      </div>
      <div className="h-3 rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-gray-900"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-sm text-slate-600 mt-2">
        Bạn đã tham gia {percent}% buổi học trong tháng này
      </div>
    </div>
  );
}

function ScoreItem({ item }: { item: Score }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-gray-900 font-semibold">{item.title}</div>
        <div className="text-sm text-slate-600">{item.subject}</div>
        <div className="text-xs text-slate-500 mt-1">{item.date}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-gray-900 text-lg font-bold">{item.score}/10</div>
        <div className="inline-flex items-center gap-1 text-xs bg-slate-200 text-gray-900 px-2 py-1 rounded-full mt-1">
          <CheckCircle2 size={14} className="text-emerald-600" />
          {item.label}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ c }: { c: Course }) {
  const badge =
    c.status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-blue-100 text-blue-700";
  const badgeText = c.status === "completed" ? "Hoàn thành" : "Đang học";

  return (
    <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-gray-900 font-semibold">{c.name}</div>
        {c.status === "completed" ? (
          <>
            <div className="text-sm text-slate-600">
              Hoàn thành: {c.finishedAt}
            </div>
            {c.finalScore && (
              <div className="text-sm text-slate-600">
                Điểm tổng kết: {c.finalScore}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-600">Đang học…</div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-3">
        {c.status === "completed" && c.hasCertificate && (
          <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-slate-50">
            <Download size={16} />
            Chứng chỉ
          </button>
        )}
        <div className={`px-3 py-1.5 rounded-full text-xs ${badge}`}>{badgeText}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState<"info" | "scores" | "history">("info");

  // ======= DATA TĨNH DEMO =======
  const student = {
    name: "Nguyễn Văn An",
    level: "Trung cấp",
    email: "nguyen.van.an@email.com",
    phone: "0123456789",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    dob: "15/5/1995",
    attendPercent: 92,
  };

  const scores: Score[] = [
    {
      title: "Kiểm tra giữa kỳ",
      subject: "Tiếng Anh",
      date: "15/12/2024",
      score: 8.5,
      label: "Giữa kỳ",
    },
    {
      title: "Bài kiểm tra 15 phút",
      subject: "Tiếng Anh",
      date: "1/12/2024",
      score: 9.0,
      label: "Kiểm tra",
    },
    {
      title: "Kiểm tra cuối kỳ",
      subject: "Tiếng Anh",
      date: "20/12/2024",
      score: 8.8,
      label: "Cuối kỳ",
    },
    {
      title: "Kiểm tra nghe",
      subject: "Tiếng Anh",
      date: "28/12/2024",
      score: 7.8,
      label: "Kỹ năng",
    },
  ];

  const history: Course[] = [
    {
      name: "Khóa Tiếng Anh A1",
      status: "ongoing",
    },
    {
      name: "Khóa Tiếng Anh Sơ cấp",
      status: "completed",
      finishedAt: "30/8/2024",
      finalScore: "8.2/10",
      hasCertificate: true,
    },
    {
      name: "Khóa Tiếng Nhật N5",
      status: "ongoing",
    },
  ];

  // ======= UI =======
  return (
    <div className="space-y-4">
      {/* Tabs sử dụng FilterTabs */}
      <div className="rounded-2xl p-2">
        <FilterTabs
          tabs={profileTabOptions}
          activeTab={tab}
          onChange={(tabId) => setTab(tabId as "info" | "scores" | "history")}
          variant="outline"
          size="md"
          className="justify-center"
        />
      </div>

      {tab === "info" && (
        <div className="space-y-4">
          {/* Profile Card - gọn hơn */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-gray-900 text-white grid place-items-center text-xl font-bold shrink-0">
                {student.name.split(" ").pop()?.[0] ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-gray-900 text-lg font-bold truncate">
                  {student.name}
                </div>
                <div className="text-slate-600 text-sm">{student.level}</div>
              </div>
              <button className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-slate-50">
                Chỉnh sửa
              </button>
            </div>

            {/* Info Grid - compact */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                icon={<UserRound size={16} className="text-gray-900" />}
                label="Họ và tên"
                value={student.name}
              />
              <InfoRow
                icon={<Mail size={16} className="text-gray-900" />}
                label="Email"
                value={student.email}
              />
              <InfoRow
                icon={<Phone size={16} className="text-gray-900" />}
                label="Số điện thoại"
                value={student.phone}
              />
              <InfoRow
                icon={<MapPin size={16} className="text-gray-900" />}
                label="Địa chỉ"
                value={student.address}
              />
              <InfoRow
                icon={<CalendarIcon size={16} className="text-gray-900" />}
                label="Ngày sinh"
                value={student.dob}
              />
              <InfoRow
                icon={<Award size={16} className="text-gray-900" />}
                label="Trình độ"
                value={student.level}
              />
            </div>
          </div>

          {/* Attendance Progress - compact */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <ProgressBar percent={student.attendPercent} />
          </div>
        </div>
      )}

      {tab === "scores" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="text-gray-900 font-semibold mb-2">Kết quả học tập</div>
          {scores.map((s, i) => (
            <ScoreItem key={i} item={s} />
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="text-gray-900 font-semibold mb-2">Lịch sử học tập</div>
          {history.map((c, i) => (
            <CourseCard key={i} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
