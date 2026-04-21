"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  Building2,
  FileText,
  History,
  FileWarning,
  CalendarDays,
} from "lucide-react";

import {
  cancelLeaveRequest,
  createLeaveRequest,
  getLeaveRequestsWithParams,
} from "@/lib/api/leaveRequestService";
import { getProfiles } from "@/lib/api/authService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { getStudentClasses } from "@/lib/api/studentService";
import {
  getMakeupAllocations,
  getMakeupCreditsByStudent,
  useMakeupCredit as applyMakeupCredit,
} from "@/lib/api/makeupCreditService";
import { resolveMakeupCreditActionError } from "@/lib/makeupCreditErrors";
import { getSessionById } from "@/lib/api/sessionService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { fetchStudentAttendanceHistory } from "@/app/api/teacher/attendance";
import { parseApiDateKeepWallClock } from "@/lib/datetime";
import LeaveRequestCreateModal from "@/components/portal/parent/modalsLeaveRequest/LeaveRequestCreateModal";
import MakeupSessionCreateModal, {
  type CreateMakeupPayload,
} from "@/components/portal/parent/modalsLeaveRequest/MakeupSessionCreateModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";

import type { UserProfile } from "@/types/auth";
import type { StudentClass } from "@/types/student/class";
import type { LeaveRequestPayload, LeaveRequestRecord, LeaveRequestStatus } from "@/types/leaveRequest";
import type { MakeupAllocation, MakeupCredit } from "@/types/makeupCredit";
import type { SourceSession } from "@/lib/api/sessionService";
import type { AttendanceRawStatus, StudentAttendanceHistoryItem } from "@/types/teacher/attendance";

/* ===================== Types ===================== */

type FormState = LeaveRequestPayload;
type MakeupChangeTarget = {
  makeupCreditId: string;
  classId: string;
  classLabel: string;
  sessionId?: string | null;
  sessionTime?: string | null;
};

type MakeupCreditSummary = {
  total: number;
  available: number;
};

type TabType = "leaveRequests" | "makeup";

/* ===================== Constants ===================== */

const initialFormState: FormState = {
  studentProfileId: "",
  classId: "",
  sessionDate: "",
  endDate: null,
  reason: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const statusLabels: Record<LeaveRequestStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
};

// Cập nhật style status badges theo theme đỏ
const statusStyles: Record<LeaveRequestStatus, string> = {
  PENDING: "border border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border border-rose-200 bg-rose-50 text-rose-700",
  AUTO_APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border border-slate-200 bg-slate-100 text-slate-700",
};

const attendanceLabels: Record<AttendanceRawStatus, string> = {
  Present: "Có mặt",
  Absent: "Vắng mặt",
  Makeup: "Make-up",
  NotMarked: "Chưa điểm danh",
};

const attendanceStyles: Record<AttendanceRawStatus, string> = {
  Present: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  Absent: "border border-rose-200 bg-rose-50 text-rose-700",
  Makeup: "border border-sky-200 bg-sky-50 text-sky-700",
  NotMarked: "border border-amber-200 bg-amber-50 text-amber-700",
};

const attendanceAbsenceTypeLabels: Record<string, string> = {
  WithNotice24H: "Báo trước >= 24h",
  Under24H: "Báo trước < 24h",
  NoNotice: "Không báo trước",
  LongTerm: "Nghi dai han",
};

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

const normalizeStatus = (value?: string | null): LeaveRequestStatus => {
  if (!value) return "PENDING";

  const normalized = value.replace(/\s+/g, "_").replace(/-+/g, "_").toUpperCase();

  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CANCELLED" || normalized === "CANCELED") return "CANCELLED";
  if (normalized === "AUTO_APPROVED" || normalized === "AUTOAPPROVED") return "AUTO_APPROVED";
  if (normalized === "PENDING") return "PENDING";

  return "PENDING";
};

function parseDateOnly(value?: string | null) {
  if (!value) return null;

  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function canCancelLeaveRequest(record: LeaveRequestRecord) {
  if (!record?.id) return false;

  const status = normalizeStatus(record.status);
  if (status === "REJECTED" || status === "CANCELLED") return false;

  const effectiveDate = parseDateOnly(
    (record as any).sessionDate ?? (record as any).endDate ?? null
  );
  if (!effectiveDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return effectiveDate >= today;
}

function getCancelActionHint(record: LeaveRequestRecord) {
  if (!record?.id) return "Không tìm thấy mã đơn để thực hiện thao tác.";

  const status = normalizeStatus(record.status);
  if (status === "CANCELLED") return "Đơn đã được hủy.";
  if (status === "REJECTED") return "Đơn đã bị từ chối.";

  const effectiveDate = parseDateOnly(
    (record as any).sessionDate ?? (record as any).endDate ?? null
  );
  if (!effectiveDate) return "Không xác định được ngày nghỉ.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (effectiveDate < today) return "Không thể hủy đơn của buổi đã qua ngày.";
  return "Có thể hủy đơn này.";
}

function toVNDateLabel(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function toVNDateTimeLabel(value?: string | null) {
  if (!value) return "";
  const d = parseApiDateKeepWallClock(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function getAttendanceHistoryTitle(item: StudentAttendanceHistoryItem) {
  const sessionName = String(item.sessionName ?? "").trim();
  if (sessionName) return sessionName;

  const className = String(item.className ?? "").trim();
  if (className) return className;

  const sessionId = String(item.sessionId ?? "").trim();
  if (sessionId) return `Buổi học ${sessionId.slice(0, 8)}`;

  return "Buổi học";
}

function getAttendanceAbsenceTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return attendanceAbsenceTypeLabels[normalized] ?? normalized;
}

function canChangeScheduledMakeup(sessionTime?: string | null, usedAt?: string | null) {
  if (usedAt) return false;
  if (!sessionTime) return true;

  const plannedDate = parseApiDateKeepWallClock(sessionTime);
  if (Number.isNaN(plannedDate.getTime())) return true;

  return plannedDate.getTime() > Date.now();
}

function extractClasses(payload: unknown): StudentClass[] {
  if (!payload || typeof payload !== "object") return [];

  const raw = payload as {
    data?: {
      items?: StudentClass[];
      classes?: {
        items?: StudentClass[];
      };
    };
  };

  if (Array.isArray(raw.data?.items)) return raw.data.items;
  if (Array.isArray(raw.data?.classes?.items)) return raw.data.classes.items;

  return [];
}

function extractMakeupCredits(payload: unknown): MakeupCredit[] {
  if (!payload || typeof payload !== "object") return [];

  const raw = payload as {
    items?: MakeupCredit[];
    credits?: MakeupCredit[] | { items?: MakeupCredit[] };
    data?: MakeupCredit[] | { items?: MakeupCredit[]; credits?: MakeupCredit[] };
  };

  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.credits)) return raw.credits;
  if (raw.credits && typeof raw.credits === "object" && Array.isArray(raw.credits.items)) {
    return raw.credits.items;
  }
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && typeof raw.data === "object") {
    if (Array.isArray(raw.data.items)) return raw.data.items;
    if (Array.isArray(raw.data.credits)) return raw.data.credits;
  }

  return [];
}

function isAvailableMakeupCredit(credit: MakeupCredit) {
  const status = String(credit?.status ?? "").trim().toUpperCase();
  if (!status) return true;

  return status.includes("AVAILABLE") || status.includes("ACTIVE");
}

/* ===================== UI bits (same vibe as page trên) ===================== */

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700";
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

/* ===================== Tab Component ===================== */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: (props: any) => JSX.Element;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "text-gray-600 hover:bg-red-50 hover:text-red-600"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded-full text-xs",
          active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function ParentAttendancePage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const isStudentLocked = !!selectedProfile?.id;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("leaveRequests");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [changeMakeupTarget, setChangeMakeupTarget] = useState<MakeupChangeTarget | null>(null);

  // Global submit status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [cancelTarget, setCancelTarget] = useState<LeaveRequestRecord | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Profiles
  const [studentProfiles, setStudentProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // Classes
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  // Leave Requests
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<StudentAttendanceHistoryItem[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // Makeup Sessions
  const [makeupAllocations, setMakeupAllocations] = useState<MakeupAllocation[]>([]);
  const [makeupSessionsById, setMakeupSessionsById] = useState<Map<string, SourceSession>>(
    new Map()
  );
  const [makeupCreditSummary, setMakeupCreditSummary] = useState<MakeupCreditSummary>({
    total: 0,
    available: 0,
  });
  const [makeupLoading, setMakeupLoading] = useState(false);
  const [makeupError, setMakeupError] = useState<string | null>(null);

  // Form state (used inside modal)
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const pageMessageRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const loadLeaveRequests = useCallback(async (studentProfileId: string) => {
    setRequestsLoading(true);

    try {
      const response = await getLeaveRequestsWithParams({
        studentProfileId,
        pageNumber: 1,
        pageSize: 50,
      });

      const raw = response?.data;

      const list: LeaveRequestRecord[] = Array.isArray(raw)
        ? raw
        : raw && "items" in raw
          ? raw.items
          : [];

      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch leave requests error:", err);
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadMakeupState = useCallback(async (studentProfileId: string) => {
    setMakeupLoading(true);
    setMakeupError(null);

    try {
      const response: any = await getMakeupAllocations({
        studentProfileId,
      });

      const raw = response?.data ?? response;
      const list: MakeupAllocation[] = Array.isArray(raw)
        ? raw
        : raw?.items ?? raw?.allocations?.items ?? raw?.data ?? [];

      // Deduplicate allocations by id or targetSessionId to prevent duplicate display
      const seen = new Set<string>();
      const deduped = (Array.isArray(list) ? list : []).filter((item) => {
        const key = item.id ?? item.targetSessionId ?? JSON.stringify(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setMakeupAllocations(deduped);

      try {
        const creditsResponse = await getMakeupCreditsByStudent(studentProfileId);
        const credits = extractMakeupCredits(creditsResponse?.data ?? creditsResponse);

        setMakeupCreditSummary({
          total: credits.length,
          available: credits.filter(isAvailableMakeupCredit).length,
        });
      } catch (creditError) {
        console.warn("Fetch makeup credits summary error:", creditError);
        setMakeupCreditSummary({ total: 0, available: 0 });
      }

      const sessionIds = Array.from(
        new Set(
          (Array.isArray(list) ? list : [])
            .map((item) => item?.targetSessionId)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (!sessionIds.length) {
        setMakeupSessionsById(new Map());
        return;
      }

      const entries = await Promise.all(
        sessionIds.map(async (id) => {
          try {
            const res = await getSessionById(id);
            const session = res?.data?.session ?? null;
            return session?.id ? [session.id, session] : null;
          } catch {
            return null;
          }
        })
      );

      const map = new Map(entries.filter(Boolean) as [string, SourceSession][]);
      setMakeupSessionsById(map);
    } catch (err) {
      console.error("Fetch makeup allocations error:", err);
      setMakeupAllocations([]);
      setMakeupCreditSummary({ total: 0, available: 0 });
      setMakeupError("Unable to load make-up sessions.");
    } finally {
      setMakeupLoading(false);
    }
  }, []);

  /* ===================== Fetch Profiles ===================== */

  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);

      try {
        const response = await getProfiles({ profileType: "Student" });

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.profiles ??
            response.data?.data ??
            [];

        const students = data.filter((p: UserProfile) => p.profileType === "Student");
        setStudentProfiles(students);
      } catch (err) {
        console.error("Fetch profiles error:", err);
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  /* ===================== Default Student Profile in Form ===================== */

  useEffect(() => {
    if (!studentProfiles.length) return;

    const profileFromSelector =
      (selectedProfile && studentProfiles.find((p) => p.id === selectedProfile.id)) ||
      studentProfiles[0];

    if (!profileFromSelector) return;

    setFormState((prev) => {
      if (prev.studentProfileId === profileFromSelector.id) return prev;

      return {
        ...prev,
        studentProfileId: profileFromSelector.id,
        classId: "",
      };
    });
  }, [selectedProfile, studentProfiles]);

  /* ===================== Fetch Classes by Token ===================== */

  useEffect(() => {
    const fetchClasses = async () => {
      if (!formState.studentProfileId) {
        setClasses([]);
        setFormState((prev) => ({ ...prev, classId: "" }));
        return;
      }

      setClassesLoading(true);
      setClassesError(null);

      try {
        const response = await getStudentClasses({
          studentProfileId: formState.studentProfileId,
          pageNumber: 1,
          pageSize: 100,
        });

        const data = extractClasses(response);

        setClasses(data);

        if (!data.length) {
          setFormState((prev) => ({ ...prev, classId: "" }));
        }
      } catch (err) {
        console.error("Fetch student classes error:", err);
        setClasses([]);
        setClassesError("Không thể tải danh sách lớp. Vui lòng thử lại hoặc chọn học viên khác.");
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [formState.studentProfileId]);

  /* ===================== Fetch Leave Requests ===================== */

  useEffect(() => {
    if (!formState.studentProfileId) return;
    loadLeaveRequests(formState.studentProfileId);
  }, [formState.studentProfileId, loadLeaveRequests]);

  /* ===================== Fetch Makeup Allocations ===================== */

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!formState.studentProfileId) {
        setAttendanceHistory([]);
        return;
      }

      setAttendanceLoading(true);
      setAttendanceError(null);

      try {
        const response = await fetchStudentAttendanceHistory({
          pageNumber: 1,
          pageSize: 10,
        });
        setAttendanceHistory(response.items);
      } catch (err) {
        console.error("Fetch attendance history error:", err);
        setAttendanceHistory([]);
        setAttendanceError("Không thể tải lịch sử điểm danh.");
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [formState.studentProfileId]);

  useEffect(() => {
    if (!formState.studentProfileId) return;
    loadMakeupState(formState.studentProfileId);
  }, [formState.studentProfileId, loadMakeupState]);

  /* ===================== Memos ===================== */

  const displayRequests = useMemo(() => requests.slice(0, 10), [requests]);
  const displayMakeup = useMemo(() => makeupAllocations.slice(0, 10), [makeupAllocations]);
  const displayAttendance = useMemo(() => attendanceHistory.slice(0, 10), [attendanceHistory]);

  const classLabel = (c: StudentClass) => c.name ?? c.className ?? c.title ?? c.code ?? c.id;

  const classNameById = (classId: string) => {
    const match = classes.find((item) => item.id === classId);
    return match ? classLabel(match) : classId;
  };

  const scrollToMessages = useCallback(() => {
    requestAnimationFrame(() => {
      pageMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  /* ===================== Actions ===================== */

  const openCreateModal = () => {
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
  };

  const openMakeupModal = (target: MakeupChangeTarget | null = null) => {
    setChangeMakeupTarget(target);
    setIsMakeupModalOpen(true);
  };

  const closeMakeupModal = () => {
    setIsMakeupModalOpen(false);
    setChangeMakeupTarget(null);
  };

  const handleCreateMakeupSession = async (payload: CreateMakeupPayload) => {
    try {
      await applyMakeupCredit(payload.makeupCreditId, {
        studentProfileId: payload.studentProfileId,
        classId: payload.targetClassId,
        targetSessionId: payload.targetSessionId,
      });

      await loadMakeupState(payload.studentProfileId);
      toast.success({
        title: changeMakeupTarget
          ? "Make-up session rescheduled"
          : "Make-up session selected",
        description:
          changeMakeupTarget
            ? "The make-up schedule has been updated successfully."
            : "The make-up session has been scheduled successfully.",
      });
    } catch (err: any) {
      const description = resolveMakeupCreditActionError(
        err,
        changeMakeupTarget ? "change" : "create"
      );
      toast.destructive({
        title: "Unable to schedule make-up session",
        description,
      });
    }
  };

  const handleConfirmCancelLeaveRequest = async () => {
    if (!cancelTarget?.id) return;

    const target = cancelTarget;
    setCancelSubmitting(true);

    try {
      const response = await cancelLeaveRequest(target.id);
      const api: any = response?.data ?? response;

      if (api?.success === false || api?.isSuccess === false) {
        throw new Error(api?.message ?? "Hủy đơn xin nghỉ thất bại.");
      }

      setRequests((prev) =>
        prev.map((item) =>
          item.id === target.id
            ? {
                ...item,
                status: "CANCELLED",
              }
            : item
        )
      );

      if (formState.studentProfileId) {
        try {
          await Promise.all([
            loadLeaveRequests(formState.studentProfileId),
            loadMakeupState(formState.studentProfileId),
          ]);
        } catch (refreshError) {
          console.warn("Refresh after cancel leave request failed:", refreshError);
          toast.warning({
            title: "Hủy đơn nghỉ thành công",
            description: "Đơn đã được hủy, nhưng danh sách liên quan chưa làm mới kịp. Vui lòng tải lại trang nếu cần.",
          });
          setCancelTarget(null);
          return;
        }
      }

      toast.success({
        title: "Hủy đơn nghỉ thành công",
        description: "Đã hủy đơn xin nghỉ thành công.",
      });
      setCancelTarget(null);
    } catch (err: any) {
      console.error("Cancel leave request error:", err);
      const errorText = getDomainErrorMessage(
        err,
        "Không thể hủy đơn xin nghỉ. Vui lòng thử lại."
      );
      toast.destructive({
        title: "Không thể hủy đơn nghỉ",
        description: errorText,
      });
      setCancelTarget(null);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const nextErrors: FormErrors = {};

      if (!formState.studentProfileId) {
        nextErrors.studentProfileId = "Vui lòng chọn học viên.";
      }
      if (!formState.classId) {
        nextErrors.classId = "Vui lòng chọn lớp.";
      }
      if (!formState.sessionDate) {
        nextErrors.sessionDate = "Vui lòng chọn ngày bắt đầu nghỉ.";
      }
      if (!formState.reason?.trim()) {
        nextErrors.reason = "Vui lòng nhập lý do.";
      }

      if (formState.sessionDate && formState.endDate && formState.endDate < formState.sessionDate) {
        nextErrors.endDate = "Ngày kết thúc nghỉ phải lớn hơn hoặc bằng ngày bắt đầu nghỉ.";
      }

      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors);
        toast.warning({
          title: "Vui lòng kiểm tra lại",
          description: "Thông tin bắt buộc chưa đầy đủ. Vui lòng điền đủ thông tin trước khi gửi đơn.",
        });
        return;
      }

      const response = await createLeaveRequest(formState as any);

      const createdRecord =
        (response?.data as any)?.leaveRequests?.[0] ??
        (response?.data as any)?.record ??
        response?.data;

      if (createdRecord) {
        setRequests((prev) => [createdRecord as any, ...prev]);
      }

      setFormState((prev) => ({
        ...initialFormState,
        studentProfileId: prev.studentProfileId,
      }));
      setFormErrors({});

      const responseStatus = normalizeStatus((createdRecord as LeaveRequestRecord | undefined)?.status);
      toast.success({
        title: "Tạo đơn nghỉ thành công",
        description:
          responseStatus === "APPROVED" || responseStatus === "AUTO_APPROVED"
            ? "Đơn đã được duyệt tự động. Nếu có lượt học bù, vui lòng chọn buổi học bù để hoàn tất xếp lịch."
            : "Đã tạo đơn xin nghỉ thành công.",
      });
      closeCreateModal();
    } catch (err) {
      console.error("Create leave request error:", err);
      const apiError = (err as any)?.response?.data;
      const code = apiError?.code ?? apiError?.title ?? apiError?.data?.code ?? apiError?.data?.title;

      if (code === "LeaveRequest.ExceededMonthlyLeaveLimit") {
        setError("Học viên đã vượt quá giới hạn 2 buổi nghỉ trong tháng.");
      } else {
        setError(getDomainErrorMessage(err, "Tạo đơn thất bại. Vui lòng thử lại."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ===================== Render ===================== */

  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const stats = useMemo(() => {
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => normalizeStatus(r.status as string | undefined) === "PENDING").length,
      makeupCredits: makeupCreditSummary.available,
      attendanceRate: attendanceHistory.length > 0
        ? Math.round((attendanceHistory.filter(i => (i.attendanceStatus ?? "NotMarked") === "Present").length / attendanceHistory.length * 100))
        : 0,
    };
  }, [requests, makeupCreditSummary, attendanceHistory]);

  const selectedStudentName =
    studentProfiles.find((p) => p.id === formState.studentProfileId)?.displayName ??
    selectedProfile?.displayName ??
    "—";

  // Tab configurations
  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType; count: number }> = [
    { id: "leaveRequests", label: "Đơn nghỉ", icon: FileWarning, count: requests.filter(r => normalizeStatus(r.status as string | undefined) === "PENDING").length },
    { id: "makeup", label: "Makeup Credit", icon: CalendarDays, count: makeupAllocations.length },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
            <CalendarCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Xin nghỉ / Điểm danh</h1>
            <p className="text-sm text-gray-600">
              Tạo đơn xin nghỉ cho học viên và theo dõi trạng thái duyệt.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Học viên</div>
            <div className="text-sm font-semibold text-gray-800">{selectedStudentName}</div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={profilesLoading || !!profilesError}
          >
            <Plus size={18} />
            Tạo đơn nghỉ
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
              <CalendarCheck className="text-red-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng đơn nghỉ</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.totalRequests}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
              <Clock className="text-amber-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Chờ duyệt</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.pendingRequests}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-100 grid place-items-center">
              <FileText className="text-sky-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Available makeup credits</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.makeupCredits}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
              <CheckCircle2 className="text-emerald-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tỷ lệ có mặt</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.attendanceRate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div ref={pageMessageRef} />

      {/* Messages */}
      {profilesError && <Banner kind="error" text={profilesError} />}
      {error && <Banner kind="error" text={error} />}
      {successMessage && <Banner kind="success" text={successMessage} />}
      {attendanceError && <Banner kind="error" text={attendanceError} />}

      {/* Tab Navigation */}
      <div className={`flex flex-wrap gap-2 border-b border-gray-200 pb-2 transition-all duration-700 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon as (props: any) => JSX.Element}
            label={tab.label}
            count={tab.count}
          />
        ))}
      </div>

      {/* Tab Content - Leave Requests */}
      {activeTab === "leaveRequests" && (
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Đơn nghỉ</h2>
                {requestsLoading ? <div className="text-sm text-gray-500 mt-1">Đang tải…</div> : null}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{requests.length} đơn</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                    Thời gian nghỉ
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                    Ngày tạo
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">Lớp</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">Lý do</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">
                    Trạng thái
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-semibold tracking-wide text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {!displayRequests.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <FileWarning size={24} className="text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Chưa có đơn nghỉ nào</div>
                      <div className="text-sm text-gray-500 mt-1">Bấm "Tạo đơn nghỉ" để gửi yêu cầu nghỉ học.</div>
                    </td>
                  </tr>
                ) : (
                  displayRequests.map((r) => {
                    const status = normalizeStatus(r.status as string | undefined);
                    const start = (r as any).sessionDate ?? r.sessionDate;
                    const end = (r as any).endDate ?? r.endDate;
                    const canCancel = canCancelLeaveRequest(r);
                    const cancelHint = getCancelActionHint(r);

                    const created =
                      (r as any).createdAt ??
                      (r as any).submittedAt ??
                      (r as any).requestedAt ??
                      (r as any).requestedDate;

                    return (
                      <tr
                        key={(r as any).id ?? `${r.studentProfileId}-${r.classId}-${start}-${end}`}
                        className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">
                          {toVNDateLabel(start)}{" "}
                          {end ? <span className="text-gray-400">→</span> : null}{" "}
                          {end ? toVNDateLabel(end) : null}
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">
                          {toVNDateLabel(created) || "—"}
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-700">
                          {(r as any).className ??
                            (r as any).classTitle ??
                            (r as any).classCode ??
                            classNameById(r.classId)}
                        </td>

                        <td className="py-3 px-6 text-sm text-gray-700">{(r as any).reason ?? "—"}</td>

                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
                          >
                            {statusLabels[status]}
                          </span>
                        </td>

                        <td className="py-3 px-6 text-right">
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(r)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300 cursor-pointer"
                              title={cancelHint}
                            >
                              <XCircle size={14} />
                              Hủy đơn
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400" title={cancelHint}>
                              {status === "CANCELLED" ? "Đã hủy" : "Không thể hủy"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content - Makeup Sessions */}
      {activeTab === "makeup" && (
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">Scheduled make-up sessions</div>
              {makeupLoading ? <div className="text-sm text-gray-500 mt-1">Loading...</div> : null}
              {!makeupLoading && makeupCreditSummary.available > 0 ? (
                <div className="mt-1 text-sm text-amber-700">
                  {makeupCreditSummary.available}/{makeupCreditSummary.total} makeup credits are still unscheduled. Sessions appear here after a parent picks a schedule for each credit.
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 font-medium">{makeupAllocations.length} sessions</div>
              <button
                type="button"
                onClick={() => openMakeupModal()}
                disabled={!formState.studentProfileId}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                Select make-up session
              </button>
            </div>
          </div>

          {makeupError ? <div className="px-6 py-4 text-sm text-red-600">{makeupError}</div> : null}

          {!displayMakeup.length ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                <CalendarDays size={24} className="text-gray-400" />
              </div>
              <div className="text-gray-600 font-medium">No make-up sessions yet</div>
              <div className="text-sm text-gray-500 mt-1">When makeup credits are available, you can schedule them here.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-600/5 to-red-700/5 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      Session time
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Class</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {displayMakeup.map((m) => {
                    const session = m.targetSessionId
                      ? makeupSessionsById.get(m.targetSessionId)
                      : undefined;
                    const sessionTime = session?.plannedDatetime ?? session?.actualDatetime ?? null;
                    const targetClassId = m.classId ?? session?.classId ?? null;
                    const classText =
                      session?.classTitle ??
                      session?.classCode ??
                      (targetClassId ? classNameById(targetClassId) : null) ??
                      targetClassId ??
                      "—";
                    const statusText = m.usedAt ? "Completed" : "Scheduled";
                    const canChangeSchedule =
                      !!m.makeupCreditId &&
                      !!targetClassId &&
                      !!m.targetSessionId &&
                      canChangeScheduledMakeup(sessionTime, m.usedAt ?? null);
                    const changeHint = canChangeSchedule
                      ? "Only alternative sessions in the same makeup program are shown."
                      : m.usedAt
                        ? "This make-up session has already been used and cannot be changed."
                        : !m.makeupCreditId
                          ? "Cannot reschedule because makeup credit is missing."
                          : !targetClassId
                            ? "Cannot reschedule because current makeup class is missing."
                            : "Cannot reschedule when session time has arrived or passed.";

                    return (
                      <tr
                        key={m.id ?? `${m.makeupCreditId}-${m.targetSessionId}-${m.allocatedAt}`}
                        className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                          {toVNDateTimeLabel(sessionTime) ||
                            toVNDateTimeLabel(m.allocatedAt) ||
                            "—"}
                        </td>

                        <td className="py-4 px-6 text-sm text-gray-700">{classText}</td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700">
                            {statusText}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          {canChangeSchedule ? (
                            <button
                              type="button"
                              onClick={() =>
                                openMakeupModal({
                                  makeupCreditId: m.makeupCreditId as string,
                                  classId: targetClassId as string,
                                  classLabel: classText,
                                  sessionId: m.targetSessionId ?? null,
                                  sessionTime: sessionTime ?? null,
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 hover:border-red-300 cursor-pointer"
                              title={changeHint}
                            >
                              <Plus size={14} />
                              Reschedule
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400" title={changeHint}>
                              Not available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex gap-3 transition-all duration-700 delay-400 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center shadow">
          <MessageSquare className="text-white" size={18} />
        </div>
        <p className="text-sm text-gray-700">
          Nếu học viên vắng, hệ thống sẽ gửi tin nhắn cho phụ huynh để xác nhận lý do và hỗ trợ bù buổi.
        </p>
      </div>

      {/* Modals */}
      <LeaveRequestCreateModal
        open={isModalOpen}
        onClose={closeCreateModal}
        lockedStudentProfileId={selectedProfile?.id ?? null}
        onCreated={(record) => {
          setRequests((prev) => [record, ...prev]);
          const responseStatus = normalizeStatus(record?.status);
          if (record?.studentProfileId) {
            void Promise.allSettled([
              loadLeaveRequests(record.studentProfileId),
              loadMakeupState(record.studentProfileId),
            ]);
          }
          setSuccessMessage(
            responseStatus === "APPROVED" || responseStatus === "AUTO_APPROVED"
              ? "Đã tạo đơn xin nghỉ. Đơn đã được duyệt; nếu có lượt học bù, vui lòng chọn buổi học bù để hoàn tất xếp lịch."
              : "Đã tạo đơn xin nghỉ."
          );
        }}
      />
      <MakeupSessionCreateModal
        open={isMakeupModalOpen}
        onClose={closeMakeupModal}
        onCreate={handleCreateMakeupSession}
        lockedStudentProfileId={selectedProfile?.id ?? formState.studentProfileId ?? null}
        lockedStudentLabel={selectedStudentName}
        allowManualFallback={false}
        initialMakeupCreditId={changeMakeupTarget?.makeupCreditId ?? null}
        preferredTargetClassId={changeMakeupTarget?.classId ?? null}
        preferredTargetClassLabel={changeMakeupTarget?.classLabel ?? null}
        excludedSessionId={changeMakeupTarget?.sessionId ?? null}
        initialTargetSessionDateTime={changeMakeupTarget?.sessionTime ?? null}
      />
      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => {
          if (!cancelSubmitting) {
            setCancelTarget(null);
          }
        }}
        onConfirm={handleConfirmCancelLeaveRequest}
        title="Xác nhận hủy đơn xin nghỉ"
        message={
          cancelTarget
            ? `Bạn có chắc muốn hủy đơn xin nghỉ ngày ${toVNDateLabel(
                (cancelTarget as any).sessionDate ?? cancelTarget.sessionDate
              )}${
                (cancelTarget as any).endDate
                  ? ` đến ${toVNDateLabel((cancelTarget as any).endDate)}`
                  : ""
              } không? Nếu đơn đã được duyệt, các credit hoặc buổi bù liên quan có thể bị gỡ bỏ.`
            : ""
        }
        confirmText="Hủy đơn"
        cancelText="Đóng"
        variant="warning"
        isLoading={cancelSubmitting}
      />
    </div>
  );
}