// components/portal/header/GlobalSearchModal.tsx
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  Search,
  X,
  User,
  Users,
  GraduationCap,
  BookOpen,
  Building,
  ClipboardList,
  Calendar,
  BarChart2,
  Settings,
  DollarSign,
  Loader2,
  ChevronRight,
  PhoneCall,
  Tag,
  FileText,
  Megaphone,
  Shield,
  Ticket,
  CreditCard,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/lib/api/userService";
import { getAllLeads } from "@/lib/api/leadService";
import type { User as UserType } from "@/types/admin/user";
import type { Lead } from "@/types/lead";
import type { Role } from "@/lib/role";
import type { Locale } from "@/lib/i18n";

/* ===================== Types ===================== */

type NavItemDef = {
  labelVi: string;
  labelEn: string;
  keywords: string[];
  path: string; // relative to role base, e.g. "/students"
  icon: ReactNode;
  descVi?: string;
  descEn?: string;
};

type SearchResult = {
  id: string;
  type: "nav" | "user" | "lead";
  label: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  href: string;
  icon: ReactNode;
};

type Props = {
  role: Role;
  locale: Locale;
  onClose: () => void;
};

/* ===================== Nav definitions by role base path ===================== */

const ADMIN_NAV: NavItemDef[] = [
  {
    labelVi: "Tài khoản",
    labelEn: "Accounts",
    keywords: ["tài khoản", "account", "user", "nguoi dung", "nguoi"],
    path: "/accounts",
    icon: <Shield className="w-4 h-4" />,
    descVi: "Quản lý tài khoản hệ thống",
    descEn: "System account management",
  },
  {
    labelVi: "Lớp học",
    labelEn: "Classes",
    keywords: ["lớp học", "lop hoc", "class", "lop"],
    path: "/classes",
    icon: <BookOpen className="w-4 h-4" />,
    descVi: "Quản lý lớp học",
    descEn: "Class management",
  },
  {
    labelVi: "Khóa học / Chương trình",
    labelEn: "Courses / Programs",
    keywords: ["khóa học", "khoa hoc", "course", "chuong trinh", "chương trình", "program"],
    path: "/courses",
    icon: <BookOpen className="w-4 h-4" />,
    descVi: "Quản lý khóa học và chương trình",
    descEn: "Course & program management",
  },
  {
    labelVi: "Tuyển sinh / Leads",
    labelEn: "Leads / Enrollment",
    keywords: ["tuyển sinh", "tuyen sinh", "lead", "tư vấn", "tu van", "phụ huynh tiềm năng"],
    path: "/leads",
    icon: <PhoneCall className="w-4 h-4" />,
    descVi: "Quản lý tuyển sinh và khách hàng tiềm năng",
    descEn: "Lead & prospective enrollment management",
  },
  {
    labelVi: "Đăng ký học",
    labelEn: "Registrations",
    keywords: ["đăng ký", "dang ky", "registration", "enroll", "ghi danh"],
    path: "/registrations",
    icon: <ClipboardList className="w-4 h-4" />,
    descVi: "Quản lý đăng ký học",
    descEn: "Registration management",
  },
  {
    labelVi: "Lịch học & Điểm danh",
    labelEn: "Schedule & Attendance",
    keywords: ["lịch học", "lich hoc", "điểm danh", "diem danh", "schedule", "attendance", "thời khóa biểu"],
    path: "/schedule",
    icon: <Calendar className="w-4 h-4" />,
    descVi: "Lịch học và quản lý điểm danh",
    descEn: "Schedule & attendance",
  },
  {
    labelVi: "Kiểm tra đầu vào",
    labelEn: "Placement Tests",
    keywords: ["kiểm tra đầu vào", "kiem tra dau vao", "placement", "test", "kiem tra", "xep lop"],
    path: "/placement-tests",
    icon: <FileText className="w-4 h-4" />,
    descVi: "Quản lý bài kiểm tra phân loại",
    descEn: "Placement test management",
  },
  {
    labelVi: "Chi nhánh",
    labelEn: "Branches",
    keywords: ["chi nhánh", "chi nhanh", "branch", "trung tâm", "trung tam"],
    path: "/branches",
    icon: <Building className="w-4 h-4" />,
    descVi: "Quản lý chi nhánh",
    descEn: "Branch management",
  },
  {
    labelVi: "Phòng học",
    labelEn: "Rooms / Classrooms",
    keywords: ["phòng học", "phong hoc", "room", "classroom", "phong"],
    path: "/rooms",
    icon: <MapPin className="w-4 h-4" />,
    descVi: "Quản lý phòng học",
    descEn: "Classroom management",
  },
  {
    labelVi: "Tài liệu giảng dạy",
    labelEn: "Teaching Materials",
    keywords: ["tài liệu", "tai lieu", "material", "giảng dạy", "giang day", "sách giáo trình"],
    path: "/materials",
    icon: <BookOpen className="w-4 h-4" />,
    descVi: "Tài liệu và giáo trình",
    descEn: "Teaching materials & textbooks",
  },
  {
    labelVi: "Báo cáo & Thống kê",
    labelEn: "Reports & Analytics",
    keywords: ["báo cáo", "bao cao", "report", "thống kê", "thong ke", "analytics", "phân tích"],
    path: "/reports",
    icon: <BarChart2 className="w-4 h-4" />,
    descVi: "Báo cáo và thống kê hệ thống",
    descEn: "System reports & analytics",
  },
  {
    labelVi: "Thu chi / Sổ quỹ",
    labelEn: "Cash Book",
    keywords: ["thu chi", "so quy", "cashbook", "tài chính", "tai chinh", "finance", "thu ngân"],
    path: "/cashbook",
    icon: <DollarSign className="w-4 h-4" />,
    descVi: "Quản lý thu chi và sổ quỹ",
    descEn: "Cash book & finance",
  },
  {
    labelVi: "Học phí",
    labelEn: "Tuition / Fees",
    keywords: ["học phí", "hoc phi", "tuition", "fee", "học phí", "tiền học"],
    path: "/fees",
    icon: <CreditCard className="w-4 h-4" />,
    descVi: "Quản lý học phí",
    descEn: "Tuition fee management",
  },
  {
    labelVi: "Blog / Bản tin",
    labelEn: "Blogs / News",
    keywords: ["blog", "bản tin", "ban tin", "news", "tin tức", "tin tuc", "thông báo nội bộ"],
    path: "/blogs",
    icon: <Megaphone className="w-4 h-4" />,
    descVi: "Quản lý blog và bản tin",
    descEn: "Blog & news management",
  },
  {
    labelVi: "Cài đặt & Chính sách",
    labelEn: "Settings & Policies",
    keywords: ["cài đặt", "cai dat", "setting", "policy", "chính sách", "chinh sach", "cấu hình"],
    path: "/settings",
    icon: <Settings className="w-4 h-4" />,
    descVi: "Cài đặt hệ thống và chính sách",
    descEn: "System settings & policies",
  },
];

const STAFF_MANAGER_NAV: NavItemDef[] = [
  {
    labelVi: "Học viên",
    labelEn: "Students",
    keywords: ["học viên", "hoc vien", "student", "hồ sơ"],
    path: "/students",
    icon: <GraduationCap className="w-4 h-4" />,
    descVi: "Hồ sơ học viên",
    descEn: "Student profiles",
  },
  {
    labelVi: "Tuyển sinh / Leads",
    labelEn: "Leads",
    keywords: ["tuyển sinh", "tuyen sinh", "lead", "tư vấn", "tu van"],
    path: "/leads",
    icon: <PhoneCall className="w-4 h-4" />,
    descVi: "Quản lý tuyển sinh",
    descEn: "Lead management",
  },
  {
    labelVi: "Đăng ký học",
    labelEn: "Enrollments",
    keywords: ["đăng ký", "dang ky", "enrollment", "enroll", "ghi danh"],
    path: "/enrollments",
    icon: <ClipboardList className="w-4 h-4" />,
    descVi: "Quản lý đăng ký học",
    descEn: "Enrollment management",
  },
  {
    labelVi: "Lịch học",
    labelEn: "Schedule",
    keywords: ["lịch học", "lich hoc", "schedule", "thời khóa biểu", "tkhb"],
    path: "/schedule",
    icon: <Calendar className="w-4 h-4" />,
    descVi: "Lịch học và điểm danh",
    descEn: "Schedule & attendance",
  },
  {
    labelVi: "Kiểm tra đầu vào",
    labelEn: "Placement Tests",
    keywords: ["kiểm tra đầu vào", "kiem tra dau vao", "placement", "test", "xếp lớp"],
    path: "/placement-tests",
    icon: <FileText className="w-4 h-4" />,
    descVi: "Kiểm tra xếp lớp",
    descEn: "Placement tests",
  },
  {
    labelVi: "Giáo án / Kế hoạch bài dạy",
    labelEn: "Lesson Plans",
    keywords: ["giáo án", "giao an", "lesson plan", "kế hoạch bài dạy", "ke hoach", "syllabus"],
    path: "/lesson-plans",
    icon: <BookOpen className="w-4 h-4" />,
    descVi: "Giáo án và kế hoạch bài dạy",
    descEn: "Lesson plans",
  },
  {
    labelVi: "Báo cáo tiết học",
    labelEn: "Session Reports",
    keywords: ["báo cáo tiết học", "bao cao tiet hoc", "session report", "bao cao giao vien"],
    path: "/session-report",
    icon: <BarChart2 className="w-4 h-4" />,
    descVi: "Duyệt báo cáo tiết học của giáo viên",
    descEn: "Review teacher session reports",
  },
  {
    labelVi: "Tài liệu giảng dạy",
    labelEn: "Teaching Materials",
    keywords: ["tài liệu", "tai lieu", "material", "giảng dạy", "giang day"],
    path: "/materials",
    icon: <BookOpen className="w-4 h-4" />,
    descVi: "Tài liệu và giáo trình",
    descEn: "Teaching materials",
  },
  {
    labelVi: "Yêu cầu hỗ trợ / Ticket",
    labelEn: "Support Tickets",
    keywords: ["ticket", "yêu cầu", "yeu cau", "hỗ trợ", "ho tro", "support"],
    path: "/tickets",
    icon: <Ticket className="w-4 h-4" />,
    descVi: "Yêu cầu hỗ trợ",
    descEn: "Support tickets",
  },
  {
    labelVi: "Báo cáo tháng",
    labelEn: "Monthly Reports",
    keywords: ["báo cáo tháng", "bao cao thang", "monthly report", "tháng"],
    path: "/monthly-report",
    icon: <BarChart2 className="w-4 h-4" />,
    descVi: "Báo cáo tổng hợp theo tháng",
    descEn: "Monthly aggregate reports",
  },
];

const STAFF_ACCOUNTANT_NAV: NavItemDef[] = [
  {
    labelVi: "Học viên",
    labelEn: "Students",
    keywords: ["học viên", "hoc vien", "student"],
    path: "/students",
    icon: <GraduationCap className="w-4 h-4" />,
    descVi: "Hồ sơ học viên",
    descEn: "Student profiles",
  },
  {
    labelVi: "Đăng ký học",
    labelEn: "Enrollments",
    keywords: ["đăng ký", "dang ky", "enrollment", "enroll"],
    path: "/enrollments",
    icon: <ClipboardList className="w-4 h-4" />,
    descVi: "Quản lý đăng ký học",
    descEn: "Enrollment management",
  },
  {
    labelVi: "Lịch học",
    labelEn: "Schedule",
    keywords: ["lịch học", "lich hoc", "schedule"],
    path: "/schedule",
    icon: <Calendar className="w-4 h-4" />,
    descVi: "Lịch học",
    descEn: "Schedule",
  },
  {
    labelVi: "Tuyển sinh / Leads",
    labelEn: "Leads",
    keywords: ["tuyển sinh", "tuyen sinh", "lead"],
    path: "/leads",
    icon: <PhoneCall className="w-4 h-4" />,
    descVi: "Quản lý tuyển sinh",
    descEn: "Lead management",
  },
];

/* Utility: normalize for search matching */
function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesQuery(def: NavItemDef, query: string): boolean {
  const q = normalize(query);
  if (normalize(def.labelVi).includes(q)) return true;
  if (normalize(def.labelEn).includes(q)) return true;
  for (const kw of def.keywords) {
    if (normalize(kw).includes(q)) return true;
  }
  return false;
}

/* ===================== Main Component ===================== */

export default function GlobalSearchModal({ role, locale, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  /* Focus on mount */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Determine role base path and nav items */
  const { basePath, navItems } = (() => {
    switch (role) {
      case "Admin":
        return { basePath: "/portal/admin", navItems: ADMIN_NAV };
      case "Staff_Manager":
        return { basePath: "/portal/staff-management", navItems: STAFF_MANAGER_NAV };
      case "Staff_Accountant":
        return { basePath: "/portal/staff-accountant", navItems: STAFF_ACCOUNTANT_NAV };
      default:
        return { basePath: "/portal/admin", navItems: ADMIN_NAV };
    }
  })();

  const makeHref = useCallback(
    (path: string) => `/${locale}${basePath}${path}`,
    [locale, basePath]
  );

  /* Debounced live search */
  useEffect(() => {
    if (query.length < 2) {
      setUsers([]);
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [usersRes, leadsRes] = await Promise.allSettled([
          getAllUsers({ search: query, pageSize: 5 }),
          getAllLeads({ searchTerm: query, pageSize: 5 }),
        ]);

        if (usersRes.status === "fulfilled") {
          const data = usersRes.value as any;
          const items: UserType[] =
            data?.data?.items ??
            data?.data?.users ??
            data?.items ??
            data?.users ??
            [];
          setUsers(items.slice(0, 5));
        }

        if (leadsRes.status === "fulfilled") {
          const data = leadsRes.value as any;
          const items: Lead[] =
            data?.data?.leads ?? data?.leads ?? [];
          setLeads(items.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  /* Build flat result list */
  const filteredNav: SearchResult[] = navItems
    .filter((item) =>
      query.length === 0 ? true : matchesQuery(item, query)
    )
    .map((item) => ({
      id: `nav-${item.path}`,
      type: "nav" as const,
      label: locale === "en" ? item.labelEn : item.labelVi,
      subtitle: locale === "en" ? item.descEn : item.descVi,
      href: makeHref(item.path),
      icon: item.icon,
    }));

  const ROLE_LABEL_VI: Record<string, string> = {
    Admin: "Quản trị viên",
    ManagementStaff: "Nhân viên",
    Teacher: "Giáo viên",
    Parent: "Phụ huynh",
  };

  const userResults: SearchResult[] = users.map((u) => ({
    id: `user-${u.id}`,
    type: "user" as const,
    label: u.name ?? u.username,
    subtitle: u.email,
    badge: locale === "en" ? u.role : ROLE_LABEL_VI[u.role] ?? u.role,
    badgeColor: u.role === "Teacher"
      ? "bg-purple-100 text-purple-700"
      : u.role === "Parent"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-600",
    href: makeHref("/accounts"),
    icon: <User className="w-4 h-4" />,
  }));

  const LEAD_STATUS_VI: Record<string, string> = {
    New: "Mới",
    Contacted: "Đã liên hệ",
    BookedTest: "Đặt kiểm tra",
    TestDone: "Đã kiểm tra",
    Enrolled: "Đã đăng ký",
    Lost: "Không đăng ký",
  };

  const leadResults: SearchResult[] = leads.map((l) => ({
    id: `lead-${l.id}`,
    type: "lead" as const,
    label: l.contactName ?? "(Không có tên)",
    subtitle: l.phone ?? l.email ?? "",
    badge: locale === "en"
      ? l.status ?? "New"
      : LEAD_STATUS_VI[l.status ?? "New"] ?? l.status,
    badgeColor: l.status === "Enrolled"
      ? "bg-green-100 text-green-700"
      : l.status === "Lost"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700",
    href: makeHref("/leads"),
    icon: <PhoneCall className="w-4 h-4" />,
  }));

  const allResults: SearchResult[] = [
    ...filteredNav,
    ...userResults,
    ...leadResults,
  ];

  /* Reset active index when results change */
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  /* Keyboard navigation */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && allResults[activeIndex]) {
        navigate(allResults[activeIndex].href);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  /* Scroll active item into view */
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = resultsRef.current?.querySelector(
      `[data-index="${activeIndex}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const i18n = {
    placeholder: locale === "en" ? "Search in the system..." : "Tìm kiếm trong hệ thống...",
    quickNav: locale === "en" ? "Quick Navigation" : "Điều hướng nhanh",
    accounts: locale === "en" ? "Accounts" : "Tài khoản",
    leads: locale === "en" ? "Leads" : "Tuyển sinh",
    noResults: locale === "en" ? "No results found" : "Không tìm thấy kết quả",
    typeToSearch: locale === "en" ? "Type to search..." : "Nhập từ khóa để tìm kiếm...",
    pressEnter: locale === "en" ? "Press Enter to navigate" : "Nhấn Enter để điều hướng",
    tip: locale === "en"
      ? "Tip: search for names, usernames, contacts..."
      : "Gợi ý: tìm theo tên, email, số điện thoại, tên trang...",
  };

  /* Sections */
  const hasLiveResults = userResults.length > 0 || leadResults.length > 0;
  const hasNavResults = filteredNav.length > 0;
  const isEmpty = !loading && !hasLiveResults && !hasNavResults && query.length >= 2;

  let globalResultIndex = -1;

  function ResultRow({ result }: { result: SearchResult }) {
    globalResultIndex++;
    const idx = globalResultIndex;
    const isActive = activeIndex === idx;

    return (
      <button
        data-index={idx}
        onClick={() => navigate(result.href)}
        onMouseEnter={() => setActiveIndex(idx)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive ? "bg-blue-50" : "hover:bg-slate-50"
        }`}
      >
        <span
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 ${
            isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100"
          }`}
        >
          {result.icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-slate-800 truncate">
            {result.label}
          </span>
          {result.subtitle && (
            <span className="block text-xs text-slate-500 truncate">
              {result.subtitle}
            </span>
          )}
        </span>
        {result.badge && (
          <span
            className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${result.badgeColor ?? "bg-slate-100 text-slate-600"}`}
          >
            {result.badge}
          </span>
        )}
        <ChevronRight
          className={`shrink-0 w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-300"}`}
        />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div className="min-h-screen px-4 flex items-start justify-center pt-16 sm:pt-20">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="relative border-b border-slate-100">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={i18n.placeholder}
              className="w-full pl-14 pr-14 py-4 text-base focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {loading && (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {/* Empty state */}
            {isEmpty && (
              <div className="py-12 text-center text-slate-500">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{i18n.noResults}</p>
              </div>
            )}

            {/* Nav results */}
            {hasNavResults && (
              <div>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wide">
                    {i18n.quickNav}
                  </span>
                </div>
                {filteredNav.map((r) => (
                  <ResultRow key={r.id} result={r} />
                ))}
              </div>
            )}

            {/* Live: User results */}
            {userResults.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wide">
                    {i18n.accounts}
                  </span>
                </div>
                {userResults.map((r) => (
                  <ResultRow key={r.id} result={r} />
                ))}
              </div>
            )}

            {/* Live: Lead results */}
            {leadResults.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wide">
                    {i18n.leads}
                  </span>
                </div>
                {leadResults.map((r) => (
                  <ResultRow key={r.id} result={r} />
                ))}
              </div>
            )}

            {/* Initial tip state */}
            {query.length === 0 && (
              <div className="px-5 py-3 text-xs text-slate-400 border-t border-slate-50 mt-1">
                {i18n.tip}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {allResults.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 bg-slate-50 text-xs text-slate-400">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono shadow-sm">↑</kbd>
                {" "}<kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono shadow-sm">↓</kbd>
                {" "}di chuyển
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono shadow-sm">Enter</kbd>
                {" "}chọn
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono shadow-sm">Esc</kbd>
                {" "}đóng
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
