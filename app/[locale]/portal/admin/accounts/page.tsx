"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, UserPlus, Lock, Mail, Phone, MoreHorizontal } from "lucide-react";

type Role = "ADMIN" | "TEACHER" | "PARENT";

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  lastLogin: string;
};

const ACCOUNTS: Account[] = [
  {
    id: "ACC001",
    name: "Nguyễn Minh Anh",
    email: "admin@kidzgo.vn",
    phone: "0901 111 222",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: "05/12/2024 08:00",
  },
  {
    id: "ACC045",
    name: "Phạm Thu Hằng",
    email: "hang.teacher@kidzgo.vn",
    phone: "0903 456 789",
    role: "TEACHER",
    status: "ACTIVE",
    lastLogin: "04/12/2024 21:30",
  },
  {
    id: "ACC102",
    name: "Trần Văn Bình",
    email: "parent.binh@gmail.com",
    phone: "0987 654 321",
    role: "PARENT",
    status: "SUSPENDED",
    lastLogin: "29/11/2024 10:15",
  },
];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Quản trị",
  TEACHER: "Giáo viên",
  PARENT: "Phụ huynh",
};

function RoleBadge({ role }: { role: Role }) {
  const map = {
    ADMIN: "bg-slate-900 text-white",
    TEACHER: "bg-indigo-50 text-indigo-700",
    PARENT: "bg-emerald-50 text-emerald-700",
  } as const;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export default function AccountsPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL");

  const list = useMemo(() => {
    if (role === "ALL") return ACCOUNTS;
    return ACCOUNTS.filter((acc) => acc.role === role);
  }, [role]);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Quản lý tài khoản</h1>
          <p className="text-sm text-slate-500">
            Phân quyền truy cập cho quản trị, giáo viên và phụ huynh, đặt lại mật khẩu nhanh chóng.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <Lock size={16} /> Khóa nhanh
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <UserPlus size={16} /> Tạo tài khoản mới
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {["ALL", "ADMIN", "TEACHER", "PARENT"].map((item) => (
            <button
              key={item}
              onClick={() => setRole(item as typeof role)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${
                role === item ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              {item === "ALL" ? "Tất cả" : ROLE_LABEL[item as Role]}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            placeholder="Tìm kiếm theo tên hoặc email"
            className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder-slate-400 focus:outline-none"
          />
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.4fr,1.4fr,1fr,1fr,120px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Người dùng</div>
          <div>Email</div>
          <div>Số điện thoại</div>
          <div>Vai trò</div>
          <div className="text-right">Trạng thái</div>
        </div>
        {list.map((acc) => (
          <div key={acc.id} className="grid grid-cols-[1.4fr,1.4fr,1fr,1fr,120px] items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <div className="font-semibold">{acc.name}</div>
              <div className="text-xs text-slate-500">{acc.id}</div>
            </div>
            <div className="text-sm text-slate-600 inline-flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              {acc.email}
            </div>
            <div className="text-sm text-slate-600 inline-flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              {acc.phone}
            </div>
            <div>
              <RoleBadge role={acc.role} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  acc.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {acc.status === "ACTIVE" ? "Đang hoạt động" : "Tạm khóa"}
              </span>
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">Bật xác thực hai lớp</div>
          <p className="text-sm text-slate-600">
            Yêu cầu quản trị viên xác nhận qua OTP khi thao tác nhạy cảm (xuất danh sách học phí, chỉnh sửa lịch).
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <ShieldCheck size={16} /> Cấu hình bảo mật
        </button>
      </div>
    </div>
  );
}