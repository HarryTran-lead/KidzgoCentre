"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCog,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarRange,
  Inbox,
  DollarSign,
  MessageSquare,
  Tent,
  MapPin,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Gift,
  BadgePercent,
} from "lucide-react";

/* ========== helpers ========== */
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

function ItemLink({
  href,
  label,
  icon: Icon,
  active,
  depth = 0,
}: {
  href: string;
  label: string;
  icon?: IconType;
  active: boolean;
  depth?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition
        ${active ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200" : "text-slate-600 hover:bg-slate-50"}`}
      style={{ paddingLeft: 12 + depth * 12 }}
    >
      {Icon ? (
        <Icon size={18} className={active ? "text-sky-600" : "text-slate-400"} />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-sky-600" : "bg-slate-300"}`} />
      )}
      <span>{label}</span>
    </Link>
  );
}

function Collapsible({
  title,
  icon: Icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon?: IconType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(!!defaultOpen);
  return (
    <div className="mb-1">
      <button
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-2">
          {Icon ? <Icon size={16} className="text-slate-400" /> : null}
          {title}
        </span>
        {open ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>
      {open ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}

/* ========== cấu trúc điều hướng theo ảnh mẫu ========== */
const BRANCHES = [
  "Chi nhánh Hồ Chí Minh",
  "Chi nhánh Hà Nội",
  "Chi nhánh Đà Nẵng",
];

export default function Sidebar() {
  const pathname = usePathname();
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [branchOpen, setBranchOpen] = useState(false);

  // để tự mở nhóm chứa route đang active
  const activeFlags = useMemo(() => {
    return {
      center:
        isActive(pathname, "/admin") || isActive(pathname, "/admin/center"),
      leads:
        isActive(pathname, "/admin/leads") ||
        isActive(pathname, "/admin/admissions"),
      campaign:
        isActive(pathname, "/admin/campaigns") ||
        isActive(pathname, "/admin/promotions"),
      course:
        isActive(pathname, "/admin/courses") ||
        isActive(pathname, "/admin/courses/registrations"),
      classmg:
        isActive(pathname, "/admin/classes") ||
        isActive(pathname, "/admin/classes/transfer") ||
        isActive(pathname, "/admin/classes/room-check"),
      student:
        isActive(pathname, "/admin/students") ||
        isActive(pathname, "/admin/students/transfer") ||
        isActive(pathname, "/admin/students/defer"),
    };
  }, [pathname]);

  return (
    <aside className="h-screen sticky top-0 w-[280px] shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b">
        <div className="w-10 h-10 rounded-xl bg-white shadow grid place-items-center overflow-hidden">
          <Image
            src="/image/LogoKidzgo.jpg"
            alt="KidzGo"
            width={40}
            height={40}
            className="rounded-lg object-cover"
          />
        </div>
        <div>
          <div className="font-extrabold text-slate-800 leading-4">KidzGo</div>
          <div className="text-[11px] text-slate-500">Learning Through Play</div>
        </div>
      </div>

      {/* Branch picker */}
      <div className="px-3 py-3 border-b">
        <div className="relative">
          <button
            onClick={() => setBranchOpen((v) => !v)}
            className="w-full inline-flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-pink-500" />
              {branch}
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {branchOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow">
              {BRANCHES.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBranch(b);
                    setBranchOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                    b === branch ? "text-sky-700 font-medium" : "text-slate-700"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 overflow-y-auto h-[calc(100vh-16rem)]">
        {/* Trung tâm */}
        <div className="px-3 py-2 text-xs font-semibold text-slate-500">
          Trung tâm
        </div>
        <ItemLink
          href="/admin"
          label="Tổng quan kinh doanh"
          icon={BarChart3}
          active={isActive(pathname, "/admin") && pathname === "/admin"}
        />
        <ItemLink
          href="/admin/center"
          label="Tổng quan trung tâm"
          icon={LayoutDashboard}
          active={isActive(pathname, "/admin/center")}
        />

        {/* Quản lý tuyển sinh */}
        <div className="mt-3 px-3 py-2 text-xs font-semibold text-slate-500">
          Quản lý tuyển sinh
        </div>
        <ItemLink
          href="/admin/leads"
          label="Quản lý leads"
          icon={Inbox}
          active={isActive(pathname, "/admin/leads")}
        />
        <ItemLink
          href="/admin/admissions"
          label="Quản lý tuyển sinh"
          icon={Users}
          active={isActive(pathname, "/admin/admissions")}
        />

        {/* Chiến dịch */}
        <div className="mt-3 px-3 py-2 text-xs font-semibold text-slate-500">
          Chiến dịch
        </div>
        <ItemLink
          href="/admin/campaigns/create"
          label="Tạo chiến dịch"
          icon={Megaphone}
          active={isActive(pathname, "/admin/campaigns/create")}
        />
        <ItemLink
          href="/admin/campaigns"
          label="Quản lý chiến dịch"
          icon={Megaphone}
          active={isActive(pathname, "/admin/campaigns")}
        />
        <ItemLink
          href="/admin/promotions/programs"
          label="Quản lý chương trình khuyến mãi"
          icon={BadgePercent}
          active={isActive(pathname, "/admin/promotions/programs")}
        />
        <ItemLink
          href="/admin/promotions"
          label="Quản lý khuyến mãi"
          icon={Gift}
          active={isActive(pathname, "/admin/promotions")}
        />

        {/* Học tập */}
        <div className="mt-3 px-3 py-2 text-xs font-semibold text-slate-500">
          Học tập
        </div>

        <Collapsible title="Quản lý khóa học" defaultOpen={activeFlags.course} icon={GraduationCap}>
          <div className="space-y-1">
            <ItemLink
              href="/admin/courses/create"
              label="Tạo khóa học"
              active={isActive(pathname, "/admin/courses/create")}
              depth={1}
            />
            <ItemLink
              href="/admin/courses"
              label="Danh sách khóa học"
              active={isActive(pathname, "/admin/courses")}
              depth={1}
            />
            <ItemLink
              href="/admin/courses/registrations"
              label="Đăng ký học"
              active={isActive(pathname, "/admin/courses/registrations")}
              depth={1}
            />
            <ItemLink
              href="/admin/courses/registrations/history"
              label="Lịch sử đăng ký"
              active={isActive(pathname, "/admin/courses/registrations/history")}
              depth={1}
            />
          </div>
        </Collapsible>

        <Collapsible title="Quản lý lớp học" defaultOpen={activeFlags.classmg} icon={BookOpen}>
          <div className="space-y-1">
            <ItemLink
              href="/admin/classes/create"
              label="Tạo lớp học"
              active={isActive(pathname, "/admin/classes/create")}
              depth={1}
            />
            <ItemLink
              href="/admin/classes"
              label="Danh sách lớp học"
              active={isActive(pathname, "/admin/classes")}
              depth={1}
            />
            <ItemLink
              href="/admin/classes/transfer"
              label="Chuyển lớp"
              active={isActive(pathname, "/admin/classes/transfer")}
              depth={1}
            />
            <ItemLink
              href="/admin/classes/room-check"
              label="Kiểm tra lịch phòng học"
              active={isActive(pathname, "/admin/classes/room-check")}
              depth={1}
            />
          </div>
        </Collapsible>

        <Collapsible title="Quản lý học viên" defaultOpen={activeFlags.student} icon={Users}>
          <div className="space-y-1">
            <ItemLink
              href="/admin/students"
              label="Danh sách học viên"
              active={isActive(pathname, "/admin/students")}
              depth={1}
            />
            <ItemLink
              href="/admin/students/transfer"
              label="Chuyển lớp"
              active={isActive(pathname, "/admin/students/transfer")}
              depth={1}
            />
            <ItemLink
              href="/admin/students/defer"
              label="Bảo lưu"
              active={isActive(pathname, "/admin/students/defer")}
              depth={1}
            />
          </div>
        </Collapsible>

        {/* Các mục quản trị khác (giữ từ sidebar cũ) */}
        <div className="mt-3 px-3 py-2 text-xs font-semibold text-slate-500">
          Vận hành
        </div>
        <ItemLink
          href="/admin/rooms"
          label="Quản lý phòng học"
          icon={Building2}
          active={isActive(pathname, "/admin/rooms")}
        />
        <ItemLink
          href="/admin/schedule"
          label="Lịch & Phân bổ"
          icon={CalendarRange}
          active={isActive(pathname, "/admin/schedule")}
        />
        <ItemLink
          href="/admin/fees"
          label="Học phí & Công nợ"
          icon={DollarSign}
          active={isActive(pathname, "/admin/fees")}
        />
        <ItemLink
          href="/admin/feedback"
          label="Feedback lớp học"
          icon={MessageSquare}
          active={isActive(pathname, "/admin/feedback")}
        />
        <ItemLink
          href="/admin/extracurricular"
          label="Ngoại khóa & Trại hè"
          icon={Tent}
          active={isActive(pathname, "/admin/extracurricular")}
        />
        <ItemLink
          href="/admin/accounts"
          label="Quản lý tài khoản"
          icon={ShieldCheck}
          active={isActive(pathname, "/admin/accounts")}
        />
        <ItemLink
          href="/admin/teachers"
          label="Quản lý giáo viên"
          icon={UserCog}
          active={isActive(pathname, "/admin/teachers")}
        />
        <ItemLink
          href="/admin/reports"
          label="Báo cáo"
          icon={BarChart3}
          active={isActive(pathname, "/admin/reports")}
        />
      </nav>

      <div className="mt-auto p-4 text-xs text-slate-400 border-t">
        Hệ thống KidzGo • v1.0.0
      </div>
    </aside>
  );
}
