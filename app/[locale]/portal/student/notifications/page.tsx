"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  AlertCircle,
  Info,
  Check,
  Trash2,
  CheckCircle2,
} from "lucide-react";

type NotiType = "fee" | "schedule" | "grade";

type Notification = {
  id: string;
  type: NotiType;
  title: string;
  message: string;
  createdAt: string; // ISO hoặc text
  unread: boolean;
};

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm font-medium transition",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function NotiIcon({ type }: { type: NotiType }) {
  if (type === "fee") return <AlertCircle className="text-amber-500" size={18} />;
  if (type === "schedule") return <Info className="text-sky-500" size={18} />;
  return <Bell className="text-indigo-500" size={18} />;
}

function SettingRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {hint && <div className="text-sm text-slate-500">{hint}</div>}
      </div>
      <label className="cursor-pointer select-none">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-indigo-600 transition relative">
          <div className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </div>
      </label>
    </div>
  );
}

export default function Page() {
  // ====== Dữ liệu tĩnh mẫu ======
  const [list, setList] = useState<Notification[]>([
    {
      id: "n1",
      type: "fee",
      title: "Nhắc nhở đóng học phí",
      message:
        "Bạn còn 500,000 VND chưa thanh toán cho khóa Tiếng Anh A1. Hạn cuối: 15/01/2025",
      createdAt: "lúc 07:00 20 tháng 12, 2024",
      unread: true,
    },
    {
      id: "n2",
      type: "schedule",
      title: "Thay đổi lịch học",
      message:
        "Lớp Tiếng Anh A1 ngày 25/12 chuyển từ phòng 201 sang phòng 301",
      createdAt: "lúc 07:00 18 tháng 12, 2024",
      unread: true,
    },
    {
      id: "n3",
      type: "grade",
      title: "Cập nhật điểm nghe",
      message: "Bạn vừa có điểm nghe mới cho môn Tiếng Anh A1.",
      createdAt: "lúc 10:12 05 tháng 12, 2024",
      unread: false,
    },
  ]);

  // ====== Bộ lọc ======
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const unreadCount = useMemo(() => list.filter((n) => n.unread).length, [list]);

  const filtered = useMemo(
    () => (tab === "unread" ? list.filter((n) => n.unread) : list),
    [tab, list]
  );

  // ====== Actions ======
  const markAllRead = () =>
    setList((cur) => cur.map((n) => ({ ...n, unread: false })));

  const markRead = (id: string) =>
    setList((cur) => cur.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  const removeOne = (id: string) =>
    setList((cur) => cur.filter((n) => n.id !== id));

  // ====== Settings (state cục bộ) ======
  const [optFees, setOptFees] = useState(true);
  const [optSchedule, setOptSchedule] = useState(true);
  const [optGrades, setOptGrades] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header + hành động */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-bold text-gray-900">Thông báo</div>
        <div className="flex items-center gap-2">
          <Pill active>
            {unreadCount} chưa đọc
          </Pill>
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            title="Đánh dấu tất cả đã đọc"
          >
            <CheckCircle2 size={16} />
            Đánh dấu tất cả
          </button>
        </div>
      </div>

      {/* Switch "Chưa đọc / Tất cả" */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("unread")}
            className={[
              "rounded-xl px-3 py-2 text-center font-medium transition",
              tab === "unread"
                ? "bg-slate-100 text-gray-900"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            onClick={() => setTab("all")}
            className={[
              "rounded-xl px-3 py-2 text-center font-medium transition",
              tab === "all"
                ? "bg-slate-100 text-gray-900"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            Tất cả ({list.length})
          </button>
        </div>
      </div>

      {/* Danh sách thông báo */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={[
              "rounded-2xl border p-4 bg-white flex items-start gap-3",
              n.unread
                ? n.type === "fee"
                  ? "border-amber-200 bg-amber-50"
                  : n.type === "schedule"
                  ? "border-sky-200 bg-sky-50"
                  : "border-indigo-200 bg-indigo-50/40"
                : "border-slate-200",
            ].join(" ")}
          >
            <div className="mt-0.5">
              <NotiIcon type={n.type} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">{n.title}</div>
              <div className="text-slate-700">{n.message}</div>
              <div className="text-xs text-slate-500 mt-1">{n.createdAt}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => markRead(n.id)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Đánh dấu đã đọc"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => removeOne(n.id)}
                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                title="Xoá thông báo"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Không có thông báo nào trong mục này.
          </div>
        )}
      </div>

      {/* Cài đặt thông báo */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 border-b">
          <div className="font-semibold text-gray-900">Cài đặt thông báo</div>
        </div>
        <div className="p-5">
          <SettingRow
            label="Thông báo học phí"
            hint="Nhận nhắc nhở về các khoản phí cần thanh toán"
            checked={optFees}
            onChange={setOptFees}
          />
          <div className="h-px bg-slate-100 my-2" />
          <SettingRow
            label="Thông báo lịch học"
            hint="Thông báo về thay đổi lịch hoặc phòng học"
            checked={optSchedule}
            onChange={setOptSchedule}
          />
          <div className="h-px bg-slate-100 my-2" />
          <SettingRow
            label="Thông báo điểm số"
            hint="Nhận thông báo khi có điểm mới"
            checked={optGrades}
            onChange={setOptGrades}
          />
        </div>
      </div>
    </div>
  );
}
