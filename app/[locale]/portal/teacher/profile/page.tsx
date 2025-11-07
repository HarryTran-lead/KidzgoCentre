// app/teacher/profile/page.tsx
"use client";

import { useState } from "react";
import {
  Upload,
  CheckCircle2,
  BadgeCheck,
  ShieldCheck,
  Shield,
  UserRound,
} from "lucide-react";

type TabKey = "info" | "certs" | "security";

export default function Page() {
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-sm text-slate-500">
          Quản lý thông tin và chứng chỉ của bạn
        </p>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 p-2">
          <TabButton active={tab === "info"} onClick={() => setTab("info")}>
            Thông tin cá nhân
          </TabButton>
          <TabButton active={tab === "certs"} onClick={() => setTab("certs")}>
            Chứng chỉ
          </TabButton>
          <TabButton
            active={tab === "security"}
            onClick={() => setTab("security")}
          >
            Bảo mật
          </TabButton>
        </div>
        <div className="border-t border-slate-100" />

        {/* Tab content */}
        <div className="p-6">
          {tab === "info" && <InfoTab />}
          {tab === "certs" && <CertsTab />}
          {tab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */

function TabButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-2 rounded-xl text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-50 text-gray-900 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ---------- Thông tin cá nhân ---------- */

function InfoTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Thông tin giảng viên</h2>
          <p className="text-sm text-slate-500">
            Cập nhật thông tin cá nhân của bạn
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Chỉnh sửa
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-slate-200 grid place-items-center">
          <span className="font-bold text-gray-900">NT</span>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-gray-900">Nguyễn Thị An</div>
          <div className="text-slate-500">Giảng viên</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <LabeledInput label="Họ và tên" value="Nguyễn Thị An" />
        <LabeledInput label="Email" value="teacher@educenter.vn" />
        <LabeledInput label="Số điện thoại" value="0901234567" />
        <LabeledInput label="Trình độ" value="Thạc sĩ Ngôn ngữ Anh" />
      </div>
    </div>
  );
}

/* ---------- Chứng chỉ ---------- */

function CertsTab() {
  const items = [
    {
      title: "IELTS 8.5",
      sub: "British Council • 2020",
    },
    {
      title: "TESOL Certificate",
      sub: "Arizona State University • 2018",
    },
    {
      title: "Cambridge C2 Proficiency",
      sub: "Cambridge • 2017",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Chứng chỉ giảng dạy</h2>
          <p className="text-sm text-slate-500">
            Quản lý các chứng chỉ của bạn
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          <Upload size={16} />
          Thêm chứng chỉ
        </button>
      </div>

      <div className="space-y-3">
        {items.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white grid place-items-center border">
                <BadgeCheck className="text-slate-700" size={18} />
              </div>
              <div>
                <div className="font-medium text-gray-900">{c.title}</div>
                <div className="text-sm text-slate-600">{c.sub}</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 size={14} /> Đã xác nhận
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Bảo mật ---------- */

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-50 grid place-items-center border">
          <Shield className="text-slate-700" size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h2>
          <p className="text-sm text-slate-500">
            Cập nhật mật khẩu để tăng cường bảo mật
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <LabeledInput label="Mật khẩu hiện tại" type="password" placeholder="••••••••" />
        <LabeledInput label="Mật khẩu mới" type="password" placeholder="••••••••" />
        <LabeledInput
          label="Xác nhận mật khẩu mới"
          type="password"
          placeholder="••••••••"
        />
      </div>

      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
        <ShieldCheck size={16} />
        Cập nhật mật khẩu
      </button>
    </div>
  );
}

/* ---------- Small helpers ---------- */

function LabeledInput({
  label,
  value,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-gray-900">{label}</div>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-slate-300"
      />
    </label>
  );
}
