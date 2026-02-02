"use client";

import { useEffect, useMemo, useState } from "react";
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

import { createLeaveRequest, getLeaveRequests } from "@/lib/api/leaveRequestService";
import { getProfiles } from "@/lib/api/authService";
import { getStudentClassesByToken } from "@/lib/api/studentService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

import type { UserProfile } from "@/types/auth";
import type { StudentClass } from "@/types/student/class";
import type {
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestStatus,
} from "@/types/leaveRequest";

/* ===================== Types ===================== */

type FormState = LeaveRequestPayload;

/* ===================== Constants ===================== */

const initialFormState: FormState = {
  studentProfileId: "",
  classId: "",
  sessionDate: "",
  endDate: "",
  reason: "",
};

const statusLabels: Record<LeaveRequestStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

// giữ màu trạng thái, nhưng “shape” + style giống trang trên
const statusStyles: Record<LeaveRequestStatus, string> = {
  PENDING: "border border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border border-rose-200 bg-rose-50 text-rose-700",
};

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

/* ===================== UI bits (same vibe as page trên) ===================== */

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700"
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

export default function ParentAttendancePage() {
  const { selectedProfile } = useSelectedStudentProfile();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global submit status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Form state (used inside modal)
  const [formState, setFormState] = useState<FormState>(initialFormState);

  /* ===================== Fetch Profiles ===================== */

  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);

      try {
        const response = await getProfiles({ profileType: "Student" });

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.profiles ?? [];

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

    const defaultProfile =
      (selectedProfile && studentProfiles.find((p) => p.id === selectedProfile.id)) ||
      studentProfiles[0];

    if (defaultProfile && formState.studentProfileId !== defaultProfile.id) {
      setFormState((prev) => ({
        ...prev,
        studentProfileId: defaultProfile.id,
        classId: "",
      }));
    }
  }, [formState.studentProfileId, selectedProfile, studentProfiles]);

  /* ===================== Fetch Classes by Token ===================== */

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedProfile) {
        setClasses([]);
        setFormState((prev) => ({ ...prev, classId: "" }));
        return;
      }

      setClassesLoading(true);
      setClassesError(null);

      try {
        const response = await getStudentClassesByToken({
          pageNumber: 1,
          pageSize: 100,
        });

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items ?? response.data?.classes?.items ?? [];

        setClasses(data);

        if (!data.length) {
          setFormState((prev) => ({ ...prev, classId: "" }));
        }
      } catch (err) {
        console.error("Fetch student classes error:", err);
        setClasses([]);
        setClassesError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [selectedProfile]);

  /* ===================== Fetch Leave Requests ===================== */

  useEffect(() => {
    const fetchRequests = async () => {
      setRequestsLoading(true);

      try {
        const response = await (getLeaveRequests as any)({
          studentProfileId: formState.studentProfileId || undefined,
          pageNumber: 1,
          pageSize: 50,
        });

        const raw = response?.data;

        const list: LeaveRequestRecord[] = Array.isArray(raw)
          ? raw
          : raw?.items ?? raw?.requests?.items ?? raw?.leaveRequests?.items ?? raw?.data ?? [];

        setRequests(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Fetch leave requests error:", err);
        setRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    };

    if (!formState.studentProfileId) return;
    fetchRequests();
  }, [formState.studentProfileId]);

  /* ===================== Memos ===================== */

  const displayRequests = useMemo(() => requests.slice(0, 5), [requests]);

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

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!formState.studentProfileId) {
        setError("Vui lòng chọn học viên.");
        return;
      }
      if (!formState.classId) {
        setError("Vui lòng chọn lớp.");
        return;
      }
      if (!formState.sessionDate) {
        setError("Vui lòng chọn ngày bắt đầu nghỉ.");
        return;
      }
      if (!formState.endDate) {
        setError("Vui lòng chọn ngày kết thúc nghỉ.");
        return;
      }
      if (!formState.reason?.trim()) {
        setError("Vui lòng nhập lý do.");
        return;
      }

      const response = await createLeaveRequest(formState as any);

      if (response?.data) {
        setRequests((prev) => [response.data as any, ...prev]);
      }

      setFormState((prev) => ({
        ...initialFormState,
        studentProfileId: prev.studentProfileId,
      }));

      setSuccessMessage("Đã tạo đơn xin nghỉ. Hệ thống sẽ tự duyệt theo luật 24h nếu đủ điều kiện.");
      closeCreateModal();
    } catch (err) {
      console.error("Create leave request error:", err);
      setError("Tạo đơn thất bại. Vui lòng thử lại.");
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow">
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-60"
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

      {/* Table */}
      <div className="rounded-2xl border border-pink-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-pink-100 px-6 py-4 flex items-center justify-between">
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
              <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-100">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Thời gian nghỉ
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lớp</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lý do</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-pink-50">
                {displayRequests.map((r) => {
                  const status = (r.status ?? "PENDING") as LeaveRequestStatus;
                  const start = (r as any).sessionDate ?? r.sessionDate;
                  const end = (r as any).endDate ?? r.endDate;

                  return (
                    <tr
                      key={(r as any).id ?? `${r.studentProfileId}-${r.classId}-${start}-${end}`}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                        {toVNDateLabel(start)}{" "}
                        {end ? <span className="text-gray-400">→</span> : null}{" "}
                        {end ? toVNDateLabel(end) : null}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {(r as any).className ??
                          (r as any).classTitle ??
                          (r as any).classCode ??
                          classNameById(r.classId)}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {(r as any).reason ?? "—"}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
                        >
                          {statusLabels[status]}
                        </span>
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
      <div className="rounded-2xl border border-pink-200 bg-white p-4 shadow-sm flex gap-3">
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow">
          <MessageSquare className="text-white" size={18} />
        </div>
        <p className="text-sm text-gray-700">
          Nếu học viên vắng, hệ thống sẽ gửi tin nhắn cho phụ huynh để xác nhận lý do và hỗ trợ bù buổi.
        </p>
      </div>

      {/* Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-pink-100">
            <div className="p-5 border-b border-pink-100 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900">Tạo đơn xin nghỉ</div>
                <div className="mt-1 text-sm text-gray-600">Điền thông tin và bấm “Gửi đơn”.</div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 rounded-xl hover:bg-pink-50 transition"
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
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={formState.studentProfileId}
                  disabled={profilesLoading || !studentProfiles.length}
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
              </div>

              {/* Class */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Lớp</label>
                <select
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
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

                {classesError ? <div className="text-xs text-rose-600">{classesError}</div> : null}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Ngày bắt đầu nghỉ</label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    value={formState.sessionDate}
                    onChange={(e) => setFormState((prev) => ({ ...prev, sessionDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Ngày kết thúc nghỉ</label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    value={formState.endDate}
                    onChange={(e) => setFormState((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Lý do</label>
                <textarea
                  className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-800 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Nhập lý do xin nghỉ..."
                  value={formState.reason}
                  onChange={(e) => setFormState((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-5 border-t border-pink-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-pink-50 transition disabled:opacity-60"
                disabled={submitting}
              >
                Huỷ
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-60"
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
