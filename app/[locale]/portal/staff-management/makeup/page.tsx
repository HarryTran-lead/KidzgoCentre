"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ShieldCheck,
  XCircle,
  Plus,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

import {
  approveLeaveRequest,
  approveLeaveRequestsBulk,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leaveRequestService";

import type { LeaveRequestRecord } from "@/types/leaveRequest";

import {
  getMakeupCreditStudents,
  getMakeupCredits,
  expireMakeupCredit,
} from "@/lib/api/makeupCreditService";
import type { MakeupCredit, MakeupCreditStudent } from "@/types/makeupCredit";

import LeaveRequestCreateModal from "@/components/portal/parent/modalsLeaveRequest/LeaveRequestCreateModal";

import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import { nowISOVN } from "@/lib/datetime";

/* ===================== Types ===================== */

type LeaveRequestStatusLabel = "Đã duyệt" | "Chờ duyệt" | "Từ chối" | "Đã hủy";

type LeaveRequest = {
  id: string;
  student: string;
  parentName: string;
  className: string;
  type: string;
  requestTime: string;
  sessionTime: string;
  status: LeaveRequestStatusLabel;
  credit: number;
  note: string;
  raw?: LeaveRequestRecord;
};

type StudentLookup = {
  name?: string;
  parentName?: string;
};

type LeaveRequestLookups = {
  students: Map<string, StudentLookup>;
  classes: Map<string, string>;
  parentByUserId: Map<string, string>;
};

type SessionDetail = {
  id: string;
  classId: string;
  classCode?: string | null;
  classTitle?: string | null;
  plannedDatetime?: string | null;
  plannedRoomName?: string | null;
  branchName?: string | null;
};

type UsedMakeupCredit = {
  id: string;
  studentProfileId?: string;
  student: string;
  status: string;
  createdReason?: string;
  createdAt?: string;
  expiresAt?: string | null;
  sourceSessionId?: string;
  usedSessionId?: string;
  sourceSession?: SessionDetail | null;
  usedSession?: SessionDetail | null;
  raw?: MakeupCredit;
};

/* ===================== Constants ===================== */

const statusMap = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
} as const;

type NormalizedStatusKey = keyof typeof statusMap;

const statusOptions: (LeaveRequestStatusLabel | "Tất cả")[] = [
  "Tất cả",
  "Chờ duyệt",
  "Đã duyệt",
  "Từ chối",
  "Đã hủy",
];

/* ===================== Helpers ===================== */

const pickValue = (obj: any, paths: string[]) => {
  for (const p of paths) {
    const v = p.split(".").reduce((acc, k) => acc?.[k], obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const isAutoApprovedLeaveRequest = (item: LeaveRequestRecord) => {
  const status = String((item as any).status ?? "").trim().toUpperCase();
  if (status === "AUTO_APPROVED" || status === "AUTOAPPROVED" || status === "AUTO_APPROVE") {
    return true;
  }

  const requestedAt = (item as any).requestedAt;
  const approvedAt = (item as any).approvedAt;
  const noticeHours = Number((item as any).noticeHours ?? Number.NaN);

  return !!requestedAt && !!approvedAt && requestedAt === approvedAt && Number.isFinite(noticeHours) && noticeHours >= 24;
};

const unwrap = (res: any) => {
  // axios response thường là { data: ... }
  const root = res?.data ?? res;
  // nhiều API lại wrap thêm 1 lớp data
  return root?.data ?? root;
};

const formatDateTimeVN = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateVN = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const collectIdCandidates = (obj: any, keys: string[]) => {
  const ids = keys
    .map((key) => String(obj?.[key] ?? "").trim())
    .filter(Boolean);
  return Array.from(new Set(ids));
};

const extractListItems = (payload: any): any[] => {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.classes?.items)) return payload.classes.items;
  if (Array.isArray(payload?.students?.items)) return payload.students.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const buildLookups = (
  studentsRaw: any[],
  classesRaw: any[],
  parentProfilesRaw: any[]
): LeaveRequestLookups => {
  const students = new Map<string, StudentLookup>();
  const classes = new Map<string, string>();
  const parentByUserId = new Map<string, string>();
  const studentUserByProfileId = new Map<string, string>();

  studentsRaw.forEach((student) => {
    const ids = collectIdCandidates(student, ["id", "profileId", "studentId", "userId"]);
    if (!ids.length) return;

    const userId = String(student?.userId ?? "").trim();

    const name =
      (pickValue(student, ["fullName", "displayName", "name", "userName"]) as
        | string
        | undefined) ?? undefined;

    const parentName =
      (pickValue(student, [
        "parentName",
        "guardianName",
        "fatherName",
        "motherName",
      ]) as string | undefined) ?? undefined;

    ids.forEach((id) => {
      students.set(id, { name, parentName });
      if (userId) studentUserByProfileId.set(id, userId);
    });
  });

  parentProfilesRaw.forEach((parent) => {
    const userId = String(parent?.userId ?? "").trim();
    if (!userId) return;

    const parentName =
      (pickValue(parent, ["displayName", "fullName", "name"]) as string | undefined) ??
      undefined;

    if (!parentName) return;
    parentByUserId.set(userId, parentName);
  });

  classesRaw.forEach((classItem) => {
    const ids = collectIdCandidates(classItem, ["id", "classId"]);
    if (!ids.length) return;

    const className =
      (pickValue(classItem, ["name", "className", "title", "code"]) as
        | string
        | undefined) ?? undefined;

    if (!className) return;
    ids.forEach((id) => classes.set(id, className));
  });

  studentUserByProfileId.forEach((userId, profileId) => {
    const student = students.get(profileId);
    if (!student || student.parentName) return;

    const mappedParent = parentByUserId.get(userId);
    if (!mappedParent) return;

    students.set(profileId, { ...student, parentName: mappedParent });
  });

  return { students, classes, parentByUserId };
};

async function getSessionById(sessionId: string): Promise<SessionDetail | null> {
  if (!sessionId) return null;
  try {
    const res = await get<any>(`${TEACHER_ENDPOINTS.SESSIONS}/${sessionId}`);
    const api = unwrap(res);
    const s = api?.session ?? api;
    if (!s?.id) return null;

    return {
      id: s.id,
      classId: s.classId,
      classCode: s.classCode ?? null,
      classTitle: s.classTitle ?? null,
      plannedDatetime: s.plannedDatetime ?? null,
      plannedRoomName: s.plannedRoomName ?? null,
      branchName: s.branchName ?? null,
    };
  } catch {
    return null;
  }
}

function normalizeStatus(input: unknown): NormalizedStatusKey {
  if (!input) return "PENDING";

  const raw = String(input).trim();
  const s = raw.replace(/\s+/g, "_").replace(/-+/g, "_").toUpperCase();

  if (s === "APPROVED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
  if (s === "PENDING") return "PENDING";

  if (s === "AUTOAPPROVED" || s === "AUTO_APPROVED" || s === "AUTO_APPROVE")
    return "AUTO_APPROVED";

  return "PENDING";
}

const mapLeaveRequests = (
  items: LeaveRequestRecord[],
  lookups: LeaveRequestLookups
): LeaveRequest[] => {
  if (!items?.length) return [];

  return items.map((item) => {
    const statusKey = normalizeStatus((item as any).status);
    const statusLabel = statusMap[statusKey];

    const start = (item as any).sessionDate ?? "";
    const end = (item as any).endDate ?? (item as any).sessionDate ?? "";
    const isSingleDay = !!start && !!end && start === end;

    const studentId = String((item as any).studentProfileId ?? "").trim();
    const classId = String((item as any).classId ?? "").trim();
    const studentLookup = lookups.students.get(studentId);

    const studentName =
      (pickValue(item, [
        "studentName",
        "studentFullName",
        "studentProfile.fullName",
        "student.fullName",
        "student.name",
      ]) as string | undefined) ?? studentLookup?.name;

    const parentName =
      (pickValue(item, [
        "requesterName",
        "parentName",
        "guardianName",
        "studentProfile.parentName",
        "student.parentName",
      ]) as string | undefined) ?? studentLookup?.parentName;

    const className =
      (pickValue(item, ["className", "class.className", "class.name", "class.title"]) as
        | string
        | undefined) ?? lookups.classes.get(classId);

    return {
      id: (item as any).id,
      student: studentName ?? "Chưa có học viên",
      parentName: parentName ?? "Chưa có phụ huynh",
      className: className ?? "Chưa có lớp",
      type: isSingleDay ? "Nghỉ 1 ngày" : "Nghỉ dài ngày",
      requestTime: (() => {
        const created =
          (item as any).createdAt ?? (item as any).requestedAt ?? (item as any).submittedAt;
        if (!created) return "-";
        return formatDateTimeVN(created);
      })(),
      sessionTime: start
        ? end
          ? `${formatDateVN(start)} → ${formatDateVN(end)}`
          : formatDateVN(start)
        : "-",
      status: statusLabel,
      credit: statusKey !== "REJECTED" && statusKey !== "CANCELLED" && isSingleDay ? 1 : 0,
      note: (item as any).reason ?? "-",
      raw: item,
    };
  });
};

const mapMakeupCredits = (
  items: MakeupCredit[],
  studentLookup?: Map<string, StudentLookup>,
  makeupStudentNames?: Map<string, string>
): UsedMakeupCredit[] => {
  if (!items?.length) return [];

  return items.map((item) => {
    const studentId = pickValue(item, ["studentProfileId", "studentId"]) as string | undefined;
    const studentName =
      (pickValue(item, ["studentName", "studentFullName", "studentProfileName"]) as
        | string
        | undefined) ??
      (studentId
        ? studentLookup?.get(studentId)?.name ?? makeupStudentNames?.get(studentId)
        : undefined) ??
      "Chưa có tên học viên";

    return {
      id: String(pickValue(item, ["id"]) ?? ""),
      studentProfileId: studentId,
      student: studentName,
      status: String(pickValue(item, ["status"]) ?? "Used"),
      createdReason: (pickValue(item, ["createdReason"]) as string | undefined) ?? undefined,
      createdAt: (pickValue(item, ["createdAt"]) as string | undefined) ?? undefined,
      expiresAt:
        (pickValue(item, ["expiresAt", "expiredAt", "expiryDate"]) as string | undefined) ??
        null,
      sourceSessionId: (pickValue(item, ["sourceSessionId"]) as string | undefined) ?? undefined,
      usedSessionId: (pickValue(item, ["usedSessionId"]) as string | undefined) ?? undefined,
      raw: item,
    };
  });
};

const sessionTitle = (session: SessionDetail | null | undefined) =>
  [session?.classCode, session?.classTitle].filter(Boolean).join(" - ") || "Chưa có lớp";

const sessionMeta = (session: SessionDetail | null | undefined) =>
  [session?.branchName, session?.plannedRoomName].filter(Boolean).join(" • ");

const isExpiredCredit = (credit: UsedMakeupCredit) =>
  credit.status.trim().toUpperCase().includes("EXPIRED");

/* ===================== UI bits ===================== */

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="text-sm font-medium whitespace-pre-line">{text}</div>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  columnKey,
  currentSort,
  onSort,
}: {
  label: string;
  columnKey: string;
  currentSort: { column: string; direction: "asc" | "desc" };
  onSort: (column: string) => void;
}) {
  const isActive = currentSort.column === columnKey;
  const Icon = isActive && currentSort.direction === "desc" ? ChevronDown : ChevronUp;

  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className="inline-flex items-center gap-1.5 cursor-pointer hover:text-gray-900 transition-colors"
    >
      <span>{label}</span>
      <Icon size={14} className={isActive ? "text-gray-700" : "text-gray-400"} />
    </button>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
        </div>
        <div
          className={`h-12 w-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center shadow-lg`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  disabled,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-red-200">
        <div className="p-5 border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100/30">
          <div className="text-lg font-bold text-gray-900">{title}</div>
          <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
            {description}
          </div>
        </div>

        <div className="p-5 flex items-center justify-end gap-2 bg-gradient-to-br from-white to-red-50/20">
          <button
            onClick={onClose}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Page ===================== */

export default function Page() {
  const [activeTab, setActiveTab] = useState<"leave" | "makeup">("leave");

  // Leave Requests
  const [requestItems, setRequestItems] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatusLabel | "Tất cả">(
    "Tất cả"
  );

  const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [leaveSort, setLeaveSort] = useState<{ column: string; direction: "asc" | "desc" }>({ column: "student", direction: "asc" });

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    request: LeaveRequest;
  } | null>(null);
  const [showBulkApproveConfirm, setShowBulkApproveConfirm] = useState(false);
  const [expireTarget, setExpireTarget] = useState<UsedMakeupCredit | null>(null);

  const [processingAction, setProcessingAction] = useState(false);
  const [processingBulkApprove, setProcessingBulkApprove] = useState(false);
  const [processingExpire, setProcessingExpire] = useState(false);

  // Makeup credits
  const [makeupCredits, setMakeupCredits] = useState<UsedMakeupCredit[]>([]);
  const [loadingMakeupCredits, setLoadingMakeupCredits] = useState(false);
  const [makeupError, setMakeupError] = useState<string | null>(null);
  const [makeupSort, setMakeupSort] = useState<{ column: string; direction: "asc" | "desc" }>({ column: "student", direction: "asc" });
  const usedCredits = makeupCredits;
  const setUsedCredits = setMakeupCredits;
  const loadingUsedCredits = loadingMakeupCredits;
  const setLoadingUsedCredits = setLoadingMakeupCredits;
  const usedError = makeupError;
  const setUsedError = setMakeupError;

  const [leaveLookups, setLeaveLookups] = useState<LeaveRequestLookups>({
    students: new Map(),
    classes: new Map(),
    parentByUserId: new Map(),
  });

  const fetchLeaveLookups = async (): Promise<LeaveRequestLookups> => {
    try {
      const [studentsRes, classesRes, parentProfilesRes] = await Promise.allSettled([
        get<any>("/api/students", { params: { pageNumber: 1, pageSize: 1000 } }),
        get<any>("/api/classes", { params: { pageNumber: 1, pageSize: 1000 } }),
        get<any>("/api/students", {
          params: { profileType: "Parent", pageNumber: 1, pageSize: 1000 },
        }),
      ]);

      const studentsRaw =
        studentsRes.status === "fulfilled" ? extractListItems(unwrap(studentsRes.value)) : [];

      const classesRaw =
        classesRes.status === "fulfilled" ? extractListItems(unwrap(classesRes.value)) : [];

      const parentProfilesRaw =
        parentProfilesRes.status === "fulfilled"
          ? extractListItems(unwrap(parentProfilesRes.value))
          : [];

      return buildLookups(studentsRaw, classesRaw, parentProfilesRaw);
    } catch {
      return { students: new Map(), classes: new Map(), parentByUserId: new Map() };
    }
  };

  const fetchLeaveRequests = async (lookupsOverride?: LeaveRequestLookups) => {
    setLoadingRequests(true);
    setActionError(null);
    try {
      const response = await getLeaveRequests();
      const api = unwrap(response);
   const items = Array.isArray(api?.items) ? api.items : Array.isArray(api?.data?.items) ? api.data.items : Array.isArray(api) ? api : [];      setRequestItems(
        mapLeaveRequests(items as LeaveRequestRecord[], lookupsOverride ?? leaveLookups)
      );
    } catch {
      setActionError("Không thể tải danh sách đơn xin nghỉ.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchMakeupCredits = async (lookupsOverride?: LeaveRequestLookups) => {
    setLoadingMakeupCredits(true);
    setMakeupError(null);
    try {
      const [creditsResponse, studentsResponse] = await Promise.all([
        getMakeupCredits({ pageNumber: 1, pageSize: 200 }),
        getMakeupCreditStudents(),
      ]);
      const api = unwrap(creditsResponse);
      const items = Array.isArray(api?.items)
        ? api.items
        : Array.isArray(api?.data?.items)
          ? api.data.items
          : Array.isArray(api)
            ? api
            : [];
      const studentApi = unwrap(studentsResponse);
      const studentItems = Array.isArray(studentApi?.items)
        ? studentApi.items
        : Array.isArray(studentApi?.data?.items)
          ? studentApi.data.items
          : Array.isArray(studentApi)
            ? studentApi
            : [];

      const makeupStudentNames = new Map<string, string>();
      (studentItems as MakeupCreditStudent[]).forEach((student) => {
        const id = String(
          pickValue(student, ["studentProfileId", "studentId", "id"]) ?? ""
        ).trim();
        if (!id) return;
        const name =
          (pickValue(student, ["name", "fullName", "studentName", "studentFullName"]) as
            | string
            | undefined) ?? "";
        if (!name.trim()) return;
        makeupStudentNames.set(id, name.trim());
      });

      const mapped = mapMakeupCredits(
        items as MakeupCredit[],
        lookupsOverride?.students ?? leaveLookups.students,
        makeupStudentNames
      );

      const sessionIds = new Set<string>();
      mapped.forEach((credit) => {
        if (credit.sourceSessionId) sessionIds.add(credit.sourceSessionId);
        if (credit.usedSessionId) sessionIds.add(credit.usedSessionId);
      });

      const sessionEntries = await Promise.all(
        Array.from(sessionIds).map(async (id) => [id, await getSessionById(id)] as const)
      );
      const sessionMap = new Map(sessionEntries);

      setMakeupCredits(
        mapped.map((credit) => ({
          ...credit,
          sourceSession: credit.sourceSessionId
            ? sessionMap.get(credit.sourceSessionId) ?? null
            : null,
          usedSession: credit.usedSessionId
            ? sessionMap.get(credit.usedSessionId) ?? null
            : null,
        }))
      );
    } catch {
      setUsedError("Không thể tải danh sách makeup credit.");
    } finally {
      setLoadingUsedCredits(false);
    }
  };

  const fetchUsedCredits = fetchMakeupCredits;

  useEffect(() => {
    const init = async () => {
      const lookups = await fetchLeaveLookups();
      setLeaveLookups(lookups);
      await fetchLeaveRequests(lookups);
      await fetchUsedCredits(lookups);
    };

    init();
  }, []);

  const stats = useMemo(() => {
    const total = requestItems.length;
    const pending = requestItems.filter((r) => r.status === "Chờ duyệt").length;
    const approved = requestItems.filter((r) => r.status === "Đã duyệt").length;
    const rejected = requestItems.filter((r) => r.status === "Từ chối").length;
    const auto = requestItems.filter((r) => r.raw && isAutoApprovedLeaveRequest(r.raw)).length;
    return { total, pending, approved, rejected, auto };
  }, [requestItems]);

  const filteredLeave = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let filtered = requestItems.filter((r) => {
      const matchesStatus = statusFilter === "Tất cả" || r.status === statusFilter;

      const matchesSearch =
        !q ||
        r.student.toLowerCase().includes(q) ||
        r.parentName.toLowerCase().includes(q) ||
        (r.className ?? "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (leaveSort.column) {
        case "student":
          aVal = a.student.toLowerCase();
          bVal = b.student.toLowerCase();
          break;
        case "parentName":
          aVal = a.parentName.toLowerCase();
          bVal = b.parentName.toLowerCase();
          break;
        case "className":
          aVal = (a.className ?? "").toLowerCase();
          bVal = (b.className ?? "").toLowerCase();
          break;
        case "status":
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case "requestTime":
          aVal = new Date(a.requestTime).getTime();
          bVal = new Date(b.requestTime).getTime();
          break;
        default:
          aVal = a.student.toLowerCase();
          bVal = b.student.toLowerCase();
      }

      if (aVal < bVal) return leaveSort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return leaveSort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [requestItems, searchQuery, statusFilter, leaveSort]);

  const pendingVisibleIds = useMemo(
    () => filteredLeave.filter((item) => item.status === statusMap.PENDING).map((item) => item.id),
    [filteredLeave]
  );

  const allPendingVisibleSelected =
    pendingVisibleIds.length > 0 && pendingVisibleIds.every((id) => selectedLeaveIds.includes(id));

  const sortedMakeupCredits = useMemo(() => {
    const sorted = [...makeupCredits];
    
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (makeupSort.column) {
        case "student":
          aVal = a.student.toLowerCase();
          bVal = b.student.toLowerCase();
          break;
        case "status":
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          aVal = a.student.toLowerCase();
          bVal = b.student.toLowerCase();
      }

      if (aVal < bVal) return makeupSort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return makeupSort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [makeupCredits, makeupSort]);

  useEffect(() => {
    setSelectedLeaveIds((prev) =>
      prev.filter((id) => requestItems.some((item) => item.id === id && item.status === statusMap.PENDING))
    );
  }, [requestItems]);

  const toggleLeaveSelection = (requestId: string) => {
    setSelectedLeaveIds((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId]
    );
  };

  const toggleSelectAllPendingVisible = () => {
    setSelectedLeaveIds((prev) => {
      if (allPendingVisibleSelected) {
        return prev.filter((id) => !pendingVisibleIds.includes(id));
      }

      return Array.from(new Set([...prev, ...pendingVisibleIds]));
    });
  };

  const handleLeaveSort = (column: string) => {
    if (leaveSort.column === column) {
      setLeaveSort({ column, direction: leaveSort.direction === "asc" ? "desc" : "asc" });
    } else {
      setLeaveSort({ column, direction: "asc" });
    }
  };

  const handleMakeupSort = (column: string) => {
    if (makeupSort.column === column) {
      setMakeupSort({ column, direction: makeupSort.direction === "asc" ? "desc" : "asc" });
    } else {
      setMakeupSort({ column, direction: "asc" });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setProcessingAction(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const id = confirmAction.request.id;

      if (confirmAction.type === "approve") {
        const res = await approveLeaveRequest(id);
        const api = unwrap(res);
        if (api?.success === false || api?.isSuccess === false) {
          throw new Error(api?.message ?? "Duyệt đơn thất bại");
        }
        setActionMessage("Duyệt đơn thành công.");
      } else {
        const res = await rejectLeaveRequest(id);
        const api = unwrap(res);
        if (api?.success === false || api?.isSuccess === false) {
          throw new Error(api?.message ?? "Từ chối đơn thất bại");
        }
        setActionMessage("Từ chối đơn thành công.");
      }

      setConfirmAction(null);
      await fetchLeaveRequests();
      await fetchUsedCredits();
    } catch (e: any) {
      setActionError(e?.message ?? "Thao tác thất bại.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedLeaveIds.length) return;

    setProcessingBulkApprove(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await approveLeaveRequestsBulk(selectedLeaveIds);
      const api = unwrap(res);
      const approvedIds = Array.isArray(api?.approvedIds)
        ? api.approvedIds
        : Array.isArray(api?.data?.approvedIds)
          ? api.data.approvedIds
          : [];
      const errors = Array.isArray(api?.errors)
        ? api.errors
        : Array.isArray(api?.data?.errors)
          ? api.data.errors
          : [];

      await fetchLeaveRequests();
      await fetchUsedCredits();
      setSelectedLeaveIds([]);
      setShowBulkApproveConfirm(false);

      if (errors.length > 0) {
        const preview = errors
          .slice(0, 3)
          .map((item: any) => item?.message ?? item?.code ?? item?.id ?? "Lỗi không xác định")
          .join("\n");
        setActionMessage(
          `Đã duyệt ${approvedIds.length} đơn. Có ${errors.length} đơn chưa xử lý được.\n${preview}`
        );
      } else {
        setActionMessage(`Đã duyệt hàng loạt ${approvedIds.length} đơn thành công.`);
      }
    } catch (error: any) {
      setActionError(error?.message ?? "Không thể duyệt hàng loạt đơn xin nghỉ.");
    } finally {
      setProcessingBulkApprove(false);
    }
  };

  const handleExpireCredit = async () => {
    if (!expireTarget?.id) return;

    setProcessingExpire(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await expireMakeupCredit(expireTarget.id, { expiresAt: nowISOVN() });
      await fetchUsedCredits();
      setActionMessage("Đã cập nhật trạng thái hết hạn cho makeup credit.");
      setExpireTarget(null);
    } catch (error: any) {
      setActionError(error?.message ?? "Không thể cập nhật trạng thái hết hạn cho makeup credit.");
    } finally {
      setProcessingExpire(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
            <CalendarDays size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Staff Management</h1>
            <p className="text-sm text-gray-600">Quản lý đơn xin nghỉ và makeup credit</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("leave");
              setOpenLeaveModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={18} />
            Tạo đơn xin nghỉ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-red-200 p-1 inline-flex">
        <button
          type="button"
          onClick={() => setActiveTab("leave")}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "leave"
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-600 hover:bg-red-50"
          }`}
        >
          <CalendarDays size={16} />
          Đơn xin nghỉ
          <span
            className={`ml-1 rounded-lg px-2 py-0.5 text-xs font-bold ${
              activeTab === "leave"
                ? "bg-white/20 text-white"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {requestItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("makeup")}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "makeup"
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
              : "text-gray-600 hover:bg-red-50"
          }`}
        >
          <Clock3 size={16} />
          Makeup credit
          <span
            className={`ml-1 rounded-lg px-2 py-0.5 text-xs font-bold ${
              activeTab === "makeup"
                ? "bg-white/20 text-white"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {usedCredits.length}
          </span>
        </button>
      </div>

      {/* Messages */}
      {actionError && <Banner kind="error" text={actionError} />}
      {actionMessage && <Banner kind="success" text={actionMessage} />}

      {/* LEAVE TAB */}
      {activeTab === "leave" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <StatCard
              title="Tổng"
              value={String(stats.total)}
              icon={CalendarDays}
              color="from-red-600 to-red-700"
            />
            <StatCard
              title="Chờ duyệt"
              value={String(stats.pending)}
              icon={AlertCircle}
              color="from-amber-500 to-orange-500"
            />
            <StatCard
              title="Đã duyệt"
              value={String(stats.approved)}
              icon={ShieldCheck}
              color="from-emerald-500 to-teal-500"
            />
            <StatCard
              title="Từ chối"
              value={String(stats.rejected)}
              icon={XCircle}
              color="from-red-500 to-pink-500"
            />
            <StatCard
              title="Auto-approve"
              value={String(stats.auto)}
              icon={CheckCircle2}
              color="from-fuchsia-500 to-purple-500"
            />
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="h-10 w-full rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-auto min-w-max rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => setShowBulkApproveConfirm(true)}
                  disabled={selectedLeaveIds.length === 0}
                  className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Duyệt ({selectedLeaveIds.length})
                </button>
              </div>
            </div>
          </div>

          {/* Leave Table */}
          <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100/30 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">Danh sách đơn xin nghỉ</div>
                {loadingRequests && <div className="text-sm text-gray-500 mt-1">Đang tải...</div>}
              </div>
              <div className="text-sm text-gray-600 font-medium">{filteredLeave.length} đơn</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={allPendingVisibleSelected}
                        onChange={toggleSelectAllPendingVisible}
                        disabled={pendingVisibleIds.length === 0}
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-300"
                        aria-label="Chọn tất cả đơn chờ duyệt đang hiển thị"
                      />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      <SortableHeader label="Học viên" columnKey="student" currentSort={leaveSort} onSort={handleLeaveSort} />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      <SortableHeader label="Phụ huynh" columnKey="parentName" currentSort={leaveSort} onSort={handleLeaveSort} />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      <SortableHeader label="Lớp" columnKey="className" currentSort={leaveSort} onSort={handleLeaveSort} />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      <SortableHeader label="Thời gian" columnKey="requestTime" currentSort={leaveSort} onSort={handleLeaveSort} />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      <SortableHeader label="Trạng thái" columnKey="status" currentSort={leaveSort} onSort={handleLeaveSort} />
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      Ghi chú
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-red-100">
                  {filteredLeave.length > 0 ? (
                    filteredLeave.map((r) => {
                      const canAct = r.status === "Chờ duyệt";
                      return (
                        <tr
                          key={r.id}
                          className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                        >
                          <td className="py-4 px-4 align-top">
                            <input
                              type="checkbox"
                              checked={selectedLeaveIds.includes(r.id)}
                              onChange={() => toggleLeaveSelection(r.id)}
                              disabled={!canAct}
                              className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Chọn đơn ${r.id}`}
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm font-medium text-gray-900">{r.student}</div>
                            <div className="text-xs text-gray-500 font-mono">{r.id}</div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">{r.parentName}</td>
                          <td className="py-4 px-6 text-sm text-gray-700">{r.className}</td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-700">{r.sessionTime}</div>
                            <div className="text-xs text-gray-500">{r.requestTime}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">{r.note}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                disabled={!canAct}
                                onClick={() => setConfirmAction({ type: "approve", request: r })}
                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                                title="Duyệt"
                              >
                                <ShieldCheck size={14} />
                                Duyệt
                              </button>
                              <button
                                disabled={!canAct}
                                onClick={() => setConfirmAction({ type: "reject", request: r })}
                                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                                title="Từ chối"
                              >
                                <XCircle size={14} />
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                          <Search size={24} className="text-red-400" />
                        </div>
                        <div className="text-gray-600 font-medium">Không có đơn phù hợp</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Thử thay đổi bộ lọc hoặc từ khóa
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MAKEUP TAB */}
      {activeTab === "makeup" && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-red-100/30 border-b border-red-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Danh sách makeup credit</h2>
              </div>
              <div className="flex items-center gap-2">
                
                <div className="text-sm text-gray-600 font-medium">{usedCredits.length} credit</div>
              </div>
            </div>

            {loadingUsedCredits && (
              <div className="text-sm text-gray-500 mt-1">Đang tải danh sách makeup credit...</div>
            )}
            {usedError && (
              <div className="mt-2">
                <Banner kind="error" text={usedError} />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    <SortableHeader label="Học viên" columnKey="student" currentSort={makeupSort} onSort={handleMakeupSort} />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Buổi nghỉ
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Buổi bù
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    <SortableHeader label="Trạng thái" columnKey="status" currentSort={makeupSort} onSort={handleMakeupSort} />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    <SortableHeader label="Tạo lúc" columnKey="createdAt" currentSort={makeupSort} onSort={handleMakeupSort} />
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-red-100">
                {usedCredits.length > 0 ? (
                  sortedMakeupCredits.map((credit) => {
                    const sourceTime = credit.sourceSession?.plannedDatetime
                      ? formatDateTimeVN(credit.sourceSession.plannedDatetime)
                      : "Chưa có thời gian";
                    const usedTime = credit.usedSession?.plannedDatetime
                      ? formatDateTimeVN(credit.usedSession.plannedDatetime)
                      : "Chưa có thời gian";
                    const createdTime = credit.createdAt ? formatDateTimeVN(credit.createdAt) : "-";
                    const sourceMeta = sessionMeta(credit.sourceSession);
                    const usedMeta = sessionMeta(credit.usedSession);

                    return (
                      <tr
                        key={credit.id}
                        className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900">{credit.student}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {sessionTitle(credit.sourceSession)}
                          </div>
                          <div className="text-xs text-gray-500">{sourceTime}</div>
                          {sourceMeta && <div className="text-xs text-gray-500">{sourceMeta}</div>}
                          {!credit.sourceSession && credit.sourceSessionId && (
                            <div className="text-xs text-gray-400">Chưa có thông tin buổi nghỉ</div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {sessionTitle(credit.usedSession)}
                          </div>
                          <div className="text-xs text-gray-500">{usedTime}</div>
                          {usedMeta && <div className="text-xs text-gray-500">{usedMeta}</div>}
                          {!credit.usedSession && credit.usedSessionId && (
                            <div className="text-xs text-gray-400">Chưa có thông tin buổi bù</div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            {credit.status}
                          </span>
                          {credit.createdReason && (
                            <div className="mt-1 text-xs text-gray-500">
                              Lý do: {credit.createdReason}
                            </div>
                          )}
                          {credit.expiresAt && (
                            <div className="mt-1 text-xs text-gray-500">
                              Hết hạn: {formatDateTimeVN(credit.expiresAt)}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-700">{createdTime}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isExpiredCredit(credit) ? (
                            <span className="text-xs font-semibold text-gray-400">Đã hết hạn</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExpireTarget(credit)}
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
                            >
                              Đặt hết hạn
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                        <Search size={24} className="text-red-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Chưa có makeup credit</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Danh sách sẽ hiển thị khi hệ thống phát sinh makeup credit từ đơn nghỉ hoặc điểm danh.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === "approve" ? "Xác nhận duyệt đơn" : "Xác nhận từ chối"}
        description={
          confirmAction
            ? `Phụ huynh: ${confirmAction.request.parentName}\nHọc viên: ${confirmAction.request.student}\nLớp: ${confirmAction.request.className}\nThời gian: ${confirmAction.request.sessionTime}`
            : ""
        }
        confirmText={confirmAction?.type === "approve" ? "Duyệt đơn" : "Từ chối"}
        disabled={processingAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
      <ConfirmModal
        open={showBulkApproveConfirm}
        title="Xác nhận duyệt hàng loạt"
        description={`Bạn đang chọn ${selectedLeaveIds.length} đơn chờ duyệt. Hệ thống sẽ duyệt lần lượt theo danh sách đã chọn.`}
        confirmText="Duyệt hàng loạt"
        disabled={processingBulkApprove}
        onClose={() => setShowBulkApproveConfirm(false)}
        onConfirm={handleBulkApprove}
      />
      <ConfirmModal
        open={!!expireTarget}
        title="Xác nhận đặt hết hạn makeup credit"
        description={
          expireTarget
            ? `Học viên: ${expireTarget.student}\nTrạng thái hiện tại: ${expireTarget.status}\nThao tác này sẽ đánh dấu credit là hết hạn theo đúng tài liệu hiện tại.`
            : ""
        }
        confirmText="Xác nhận hết hạn"
        disabled={processingExpire}
        onClose={() => setExpireTarget(null)}
        onConfirm={handleExpireCredit}
      />

      {/* Modals */}
      <LeaveRequestCreateModal
        open={openLeaveModal}
        onClose={() => setOpenLeaveModal(false)}
        onCreated={(record) => {
          const mapped = mapLeaveRequests([record], leaveLookups);
          setRequestItems((prev) => [...mapped, ...prev]);
          void fetchUsedCredits();
          setActiveTab("leave");
        }}
      />

    </div>
  );
}
