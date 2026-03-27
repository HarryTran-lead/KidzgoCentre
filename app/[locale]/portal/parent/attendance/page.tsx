"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
  Plus,
  AlertCircle,
  CheckCircle2,
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
  useMakeupCredit as applyMakeupCredit,
} from "@/lib/api/makeupCreditService";
import { getSessionById } from "@/lib/api/sessionService";
import { fetchStudentAttendanceHistory } from "@/app/api/teacher/attendance";
import LeaveRequestCreateModal from "@/components/portal/parent/modalsLeaveRequest/LeaveRequestCreateModal";
import MakeupSessionCreateModal, {
  type CreateMakeupPayload,
} from "@/components/portal/parent/modalsLeaveRequest/MakeupSessionCreateModal";
import ConfirmModal from "@/components/ConfirmModal";

import type { UserProfile } from "@/types/auth";
import type { StudentClass } from "@/types/student/class";
import type { LeaveRequestPayload, LeaveRequestRecord, LeaveRequestStatus } from "@/types/leaveRequest";
import type { MakeupAllocation } from "@/types/makeupCredit";
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

// giữ màu trạng thái, nhưng “shape” + style giống trang trên
const statusStyles: Record<LeaveRequestStatus, string> = {
  PENDING: "border border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border border-rose-200 bg-rose-50 text-rose-700",
  AUTO_APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border border-slate-200 bg-slate-100 text-slate-700",
};

const attendanceLabels: Record<AttendanceRawStatus, string> = {
  Present: "Co mat",
  Absent: "Vang mat",
  Makeup: "Hoc bu",
  NotMarked: "Chua diem danh",
};

const attendanceStyles: Record<AttendanceRawStatus, string> = {
  Present: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  Absent: "border border-rose-200 bg-rose-50 text-rose-700",
  Makeup: "border border-sky-200 bg-sky-50 text-sky-700",
  NotMarked: "border border-amber-200 bg-amber-50 text-amber-700",
};

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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function canChangeScheduledMakeup(sessionTime?: string | null, usedAt?: string | null) {
  if (usedAt) return false;
  if (!sessionTime) return true;

  const plannedDate = new Date(sessionTime);
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

export default function ParentAttendancePage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const isStudentLocked = !!selectedProfile?.id;

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
  const [makeupLoading, setMakeupLoading] = useState(false);
  const [makeupError, setMakeupError] = useState<string | null>(null);

  // Form state (used inside modal)
  const [formState, setFormState] = useState<FormState>(initialFormState);

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

  const loadMakeupAllocations = useCallback(async (studentProfileId: string) => {
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

      setMakeupAllocations(Array.isArray(list) ? list : []);

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
      setMakeupError("Không thể tải danh sách buổi bù.");
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
        setAttendanceError("Khong the tai lich su diem danh.");
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [formState.studentProfileId]);

  useEffect(() => {
    if (!formState.studentProfileId) return;
    loadMakeupAllocations(formState.studentProfileId);
  }, [formState.studentProfileId, loadMakeupAllocations]);

  /* ===================== Memos ===================== */

  const displayRequests = useMemo(() => requests.slice(0, 5), [requests]);
  const displayMakeup = useMemo(() => makeupAllocations.slice(0, 5), [makeupAllocations]);
  const displayAttendance = useMemo(() => attendanceHistory.slice(0, 5), [attendanceHistory]);

  const classLabel = (c: StudentClass) => c.name ?? c.className ?? c.title ?? c.code ?? c.id;

  const classNameById = (classId: string) => {
    const match = classes.find((item) => item.id === classId);
    return match ? classLabel(match) : classId;
  };

  /* ===================== Actions ===================== */

  const openCreateModal = () => {
    setError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
  };

  const openMakeupModal = (target: MakeupChangeTarget | null = null) => {
    setError(null);
    setSuccessMessage(null);
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

      await loadMakeupAllocations(payload.studentProfileId);
      setSuccessMessage(
        changeMakeupTarget
          ? "Đã thay đổi lịch xếp học bù thành công."
          : "Đã chọn buổi học bù thành công."
      );
    } catch (err: any) {
      const apiError = err?.response?.data;
      const description =
        apiError?.description ??
        apiError?.detail ??
        apiError?.message ??
        apiError?.data?.description ??
        apiError?.data?.detail ??
        apiError?.data?.message ??
        err?.message;

      throw new Error(description ?? "Không thể đặt lịch học bù.");
    }
  };

  const handleConfirmCancelLeaveRequest = async () => {
    if (!cancelTarget?.id) return;

    const target = cancelTarget;
    setCancelSubmitting(true);
    setError(null);
    setSuccessMessage(null);

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

      let refreshWarning: string | null = null;
      if (formState.studentProfileId) {
        try {
          await Promise.all([
            loadLeaveRequests(formState.studentProfileId),
            loadMakeupAllocations(formState.studentProfileId),
          ]);
        } catch (refreshError) {
          console.warn("Refresh after cancel leave request failed:", refreshError);
          refreshWarning =
            "Đơn đã được hủy, nhưng danh sách liên quan chưa làm mới kịp. Vui lòng tải lại trang nếu cần.";
        }
      }

      setSuccessMessage(refreshWarning ?? "Đã hủy đơn xin nghỉ thành công.");
      setCancelTarget(null);
    } catch (err: any) {
      console.error("Cancel leave request error:", err);
      setError(err?.message || "Không thể hủy đơn xin nghỉ. Vui lòng thử lại.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setFormErrors({});

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
        setError("Vui lòng kiểm tra lại thông tin bắt buộc trước khi gửi đơn.");
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
      setSuccessMessage(
        responseStatus === "APPROVED" || responseStatus === "AUTO_APPROVED"
          ? "Đã tạo đơn xin nghỉ. Hệ thống đã duyệt và sẽ tự động xếp lịch bù nếu có suất phù hợp."
          : "Đã tạo đơn xin nghỉ."
      );
      closeCreateModal();
    } catch (err) {
      console.error("Create leave request error:", err);
      const apiError = (err as any)?.response?.data;
      const code = apiError?.code ?? apiError?.title ?? apiError?.data?.code ?? apiError?.data?.title;
      const description =
        apiError?.description ??
        apiError?.detail ??
        apiError?.message ??
        apiError?.data?.description ??
        apiError?.data?.detail ??
        apiError?.data?.message;

      if (code === "LeaveRequest.ExceededMonthlyLeaveLimit") {
        setError("Học viên đã vượt quá giới hạn 2 buổi nghỉ trong tháng.");
      } else {
        setError(description ?? "Tạo đơn thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ===================== Render ===================== */

  const selectedStudentName =
    studentProfiles.find((p) => p.id === formState.studentProfileId)?.displayName ??
    selectedProfile?.displayName ??
    "—";

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center shadow">
                <CalendarCheck className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Xin nghỉ / Điểm danh</h1>
                <p className="text-sm text-gray-600">
                  Tạo đơn xin nghỉ cho học viên và theo dõi trạng thái duyệt.
                </p>
              </div>
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-60"
              disabled={profilesLoading || !!profilesError}
            >
              <Plus size={16} />
              Tạo đơn nghỉ
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {profilesError && <Banner kind="error" text={profilesError} />}
      {error && <Banner kind="error" text={error} />}
      {successMessage && <Banner kind="success" text={successMessage} />}
      {attendanceError && <Banner kind="error" text={attendanceError} />}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Lich su diem danh</div>
            {attendanceLoading ? <div className="text-sm text-gray-500 mt-1">Dang tai...</div> : null}
          </div>
          <div className="text-sm text-gray-600 font-medium">{displayAttendance.length} ban ghi</div>
        </div>

        {!displayAttendance.length && !attendanceLoading ? (
          <div className="px-6 py-10 text-sm text-gray-600">Chua co lich su diem danh.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-600/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Buoi hoc</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Ngay hoc</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Trang thai</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Ghi chu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayAttendance.map((item) => {
                  const status = item.attendanceStatus ?? "NotMarked";
                  return (
                    <tr key={`${item.sessionId}-${item.markedAt ?? item.date ?? ""}`}>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{item.sessionName ?? "Buoi hoc"}</div>
                        <div className="text-xs text-gray-500">{item.className ?? "-"}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {toVNDateLabel(item.date)} {item.startTime ? `- ${item.startTime}` : ""}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${attendanceStyles[status]}`}>
                          {attendanceLabels[status]}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">{item.note ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Đơn nghỉ gần đây</div>
            {requestsLoading ? <div className="text-sm text-gray-500 mt-1">Đang tải…</div> : null}
          </div>
          <div className="text-sm text-gray-600 font-medium">{displayRequests.length} đơn</div>
        </div>

        {!displayRequests.length ? (
          <div className="px-6 py-10 text-sm text-gray-600">Chưa có đơn nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-600/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Thời gian nghỉ
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Ngày tạo
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lớp</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lý do</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {displayRequests.map((r) => {
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
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                        {toVNDateLabel(start)}{" "}
                        {end ? <span className="text-gray-400">→</span> : null}{" "}
                        {end ? toVNDateLabel(end) : null}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                        {toVNDateLabel(created) || "—"}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {(r as any).className ??
                          (r as any).classTitle ??
                          (r as any).classCode ??
                          classNameById(r.classId)}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">{(r as any).reason ?? "—"}</td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
                        >
                          {statusLabels[status]}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Makeup Sessions */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Buổi học bù đã sắp xếp</div>
            {makeupLoading ? <div className="text-sm text-gray-500 mt-1">Đang tải…</div> : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 font-medium">{displayMakeup.length} buổi</div>
            <button
              type="button"
              onClick={() => openMakeupModal()}
              disabled={!formState.studentProfileId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-60"
            >
              <Plus size={16} />
              Chọn buổi học bù
            </button>
          </div>
        </div>

        {makeupError ? <div className="px-6 py-4 text-sm text-red-600">{makeupError}</div> : null}

        {!displayMakeup.length ? (
          <div className="px-6 py-10 text-sm text-gray-600">Chưa có buổi bù nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-600/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Thời gian bù
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lớp</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">
                    Thao tác
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
                  const statusText = m.usedAt ? "Đã học bù" : "Đã xếp lịch";
                  const canChangeSchedule =
                    !!m.makeupCreditId &&
                    !!targetClassId &&
                    !!m.targetSessionId &&
                    canChangeScheduledMakeup(sessionTime, m.usedAt ?? null);
                  const changeHint = canChangeSchedule
                    ? "Chỉ hiển thị các buổi khác trong cùng chương trình bù đã xếp."
                    : m.usedAt
                      ? "Buổi bù này đã được sử dụng, không thể đổi lịch."
                      : !m.makeupCreditId
                        ? "Không thể đổi lịch vì thiếu makeup credit."
                        : !targetClassId
                          ? "Không thể đổi lịch vì chưa xác định được lớp bù hiện tại."
                          : "Không thể đổi lịch khi buổi đã tới hoặc đã qua.";

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
                            Thay đổi lịch xếp
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400" title={changeHint}>
                            Không thể đổi
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

      {/* Info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex gap-3">
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center shadow">
          <MessageSquare className="text-white" size={18} />
        </div>
        <p className="text-sm text-gray-700">
          Nếu học viên vắng, hệ thống sẽ gửi tin nhắn cho phụ huynh để xác nhận lý do và hỗ trợ bù buổi.
        </p>
      </div>

      {/* Modal */}
      <LeaveRequestCreateModal
        open={isModalOpen}
        onClose={closeCreateModal}
        lockedStudentProfileId={selectedProfile?.id ?? null}
        onCreated={(record) => {
          setRequests((prev) => [record, ...prev]);
          const responseStatus = normalizeStatus(record?.status);
          setSuccessMessage(
            responseStatus === "APPROVED" || responseStatus === "AUTO_APPROVED"
              ? "Đã tạo đơn xin nghỉ. Hệ thống đã duyệt và sẽ tự động xếp lịch bù nếu có suất phù hợp."
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
        lockedTargetClassId={changeMakeupTarget?.classId ?? null}
        lockedTargetClassLabel={changeMakeupTarget?.classLabel ?? null}
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
      {false && isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900">Tạo đơn xin nghỉ</div>
                <div className="mt-1 text-sm text-gray-600">Điền thông tin và bấm “Gửi đơn”.</div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 rounded-xl hover:bg-gray-50 transition"
                aria-label="Close"
              >
                <XCircle size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Student */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Học viên</label>
                <select
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={formState.studentProfileId}
                  disabled={profilesLoading || !studentProfiles.length || isStudentLocked}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      studentProfileId: e.target.value,
                      classId: "",
                    }))
                  }
                >
                  {studentProfiles.length ? (
                    studentProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName ?? p.id}
                      </option>
                    ))
                  ) : (
                    <option value="">Không có học viên</option>
                  )}
                </select>

                {formErrors.studentProfileId ? (
                  <div className="text-xs text-red-600">{formErrors.studentProfileId}</div>
                ) : null}
              </div>

              {/* Class */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Lớp</label>
                <select
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={formState.classId}
                  disabled={classesLoading || !classes.length}
                  onChange={(e) => setFormState((prev) => ({ ...prev, classId: e.target.value }))}
                >
                  <option value="">
                    {classesLoading ? "Đang tải lớp…" : classes.length ? "Chọn lớp" : "Không có lớp"}
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {classLabel(c)}
                    </option>
                  ))}
                </select>

                {formErrors.classId ? (
                  <div className="text-xs text-red-600">{formErrors.classId}</div>
                ) : null}
                {classesError ? <div className="text-xs text-red-600">{classesError}</div> : null}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Ngày bắt đầu nghỉ</label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={formState.sessionDate}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, sessionDate: e.target.value }))
                    }
                  />
                  {formErrors.sessionDate ? (
                    <div className="text-xs text-red-600">{formErrors.sessionDate}</div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Ngày kết thúc nghỉ</label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={formState.endDate ?? ""}
                    onChange={(e) => setFormState((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                  {formErrors.endDate ? (
                    <div className="text-xs text-red-600">{formErrors.endDate}</div>
                  ) : null}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Lý do</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Nhập lý do xin nghỉ..."
                  value={formState.reason ?? ""}
                  onChange={(e) => setFormState((prev) => ({ ...prev, reason: e.target.value }))}
                />
                {formErrors.reason ? (
                  <div className="text-xs text-red-600">{formErrors.reason}</div>
                ) : null}
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                disabled={submitting}
              >
                Huỷ
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-60"
                disabled={submitting || profilesLoading}
              >
                <Send size={16} />
                {submitting ? "Đang gửi…" : "Gửi đơn"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
