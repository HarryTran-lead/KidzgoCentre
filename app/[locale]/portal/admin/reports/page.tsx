"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  GraduationCap,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
import clsx from "clsx";

/* ------------------------ tiny ui helpers (outside render) ------------------------ */
type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
};
function SummaryCard({ icon, label, value, hint }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-slate-50">
          {icon}
        </div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-emerald-600">{hint}</div> : null}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function ProgressBar({
  value,
  className,
}: {
  value: number; // 0..100
  className?: string;
}) {
  return (
    <div className={clsx("h-2 w-full rounded-full bg-slate-100", className)}>
      <div
        className="h-2 rounded-full bg-indigo-500"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

function ColorDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block size-2 rounded-full ring-2 ring-white",
        className
      )}
    />
  );
}

/* ------------------------------- page component ------------------------------- */
export default function ReportsPage() {
  const [tab, setTab] = useState<
    "tuyensinh" | "doanhthu" | "khoahoc" | "giaovien" | "cosovatchat"
  >("tuyensinh");

  // demo data — có thể nối API sau
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const enrollSeries = [45, 52, 48, 61, 56, 59, 63, 58, 70, 76];

  const distribution = useMemo(
    () => [
      { name: "English B1", pct: 35, color: "bg-violet-500" },
      { name: "IELTS Prep", pct: 19, color: "bg-emerald-500" },
      { name: "TOEIC", pct: 11, color: "bg-amber-500" },
      { name: "Business English", pct: 9, color: "bg-orange-500" },
      { name: "English A2", pct: 12, color: "bg-green-500" },
      { name: "English B2", pct: 14, color: "bg-blue-600" },
    ],
    []
  );

  const courseDetail = [
    { name: "English B1", count: 72, color: "bg-violet-500" },
    { name: "IELTS Prep", count: 38, color: "bg-emerald-500" },
    { name: "TOEIC", count: 22, color: "bg-amber-500" },
    { name: "Business English", count: 18, color: "bg-orange-500" },
    { name: "English A2", count: 25, color: "bg-green-500" },
    { name: "English B2", count: 28, color: "bg-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Báo cáo & Thống kê
          </h1>
          <p className="text-sm text-slate-600">
            Tổng hợp báo cáo và phân tích dữ liệu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <Calendar className="size-4" />
            <input
              type="date"
              defaultValue="2025-01-01"
              className="outline-none bg-transparent"
            />
          </label>
          <span className="text-slate-500">đến</span>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <Calendar className="size-4" />
            <input
              type="date"
              defaultValue="2025-10-31"
              className="outline-none bg-transparent"
            />
          </label>

          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="size-4" />
            Lọc
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Download className="size-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<Users className="text-indigo-600" />}
          label="Tổng học viên"
          value="487"
          hint="+8.2% so với kỳ trước"
        />
        <SummaryCard
          icon={<DollarSign className="text-green-600" />}
          label="Doanh thu YTD"
          value="1.48B VND"
          hint="+15.3%"
        />
        <SummaryCard
          icon={<GraduationCap className="text-purple-600" />}
          label="Khóa học hoạt động"
          value="7"
          hint="+1"
        />
        <SummaryCard
          icon={<CheckCircle2 className="text-emerald-600" />}
          label="Tỷ lệ hoàn thành"
          value="94.2%"
          hint="+2.1%"
        />
      </div>

      {/* tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-1">
        <div className="flex flex-wrap">
          {[
            { key: "tuyensinh", label: "Tuyển sinh" },
            { key: "doanhthu", label: "Doanh thu" },
            { key: "khoahoc", label: "Khóa học" },
            { key: "giaovien", label: "Giáo viên" },
            { key: "cosovatchat", label: "Cơ sở vật chất" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() =>
                setTab(t.key as typeof tab)
              }
              className={clsx(
                "px-4 py-2 text-sm font-medium rounded-xl",
                tab === (t.key as typeof tab)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* content – Tuyển sinh */}
      {tab === "tuyensinh" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {/* chart: trend */}
          <SectionCard title="Xu hướng tuyển sinh theo tháng">
            <div className="mt-2 grid grid-cols-12 items-end gap-2">
              {enrollSeries.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-7 rounded-t-xl bg-indigo-400"
                    style={{
                      height: `${(v / Math.max(...enrollSeries)) * 180 + 24}px`,
                    }}
                    title={`${months[i]}: ${v}`}
                  />
                  <div className="text-xs text-slate-600">{months[i]}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* list: distribution (thay pie chart bằng list + progress, dễ đọc & không cần lib) */}
          <SectionCard title="Phân bố học viên theo khóa học">
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <ColorDot className={d.color} />
                  <div className="w-48 text-sm text-slate-900">{d.name}</div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={clsx("h-2 rounded-full", d.color)}
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-14 text-right text-sm font-semibold text-slate-900">
                    {d.pct}%
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* detail per course */}
          <SectionCard title="Chi tiết tuyển sinh theo khóa học">
            <div className="grid gap-4 md:grid-cols-2">
              {courseDetail.map((c) => (
                <div
                  key={c.name}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <ColorDot className={c.color} />
                    <div className="font-semibold text-slate-900">{c.name}</div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {c.count}
                  </div>
                  <div className="text-xs text-slate-500">học viên</div>
                  <div className="mt-3">
                    <ProgressBar value={Math.min((c.count / 80) * 100, 100)} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* other tabs – placeholders (có thể đổ số liệu thực sau) */}
      {tab !== "tuyensinh" && (
        <SectionCard title="Đang cập nhật">
          <div className="text-slate-600">
            Nội dung tab <b className="text-slate-900">{tab}</b> sẽ được nối
            dữ liệu thật sau. Layout, thẻ tóm tắt và bảng biểu giữ nguyên phong
            cách ở trên để đồng nhất hệ thống KidzGo.
          </div>
        </SectionCard>
      )}
    </div>
  );
}
