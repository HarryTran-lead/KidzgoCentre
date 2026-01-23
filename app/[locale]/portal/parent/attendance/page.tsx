"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  createLeaveRequest,
  getLeaveRequests,
} from "@/lib/api/leaveRequestService";
import { getProfiles } from "@/lib/api/authService";
import { getStudentClasses } from "@/lib/api/studentService";

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
  AUTO_APPROVED: "Auto-approve",
};

const statusStyles: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
  AUTO_APPROVED: "bg-sky-50 text-sky-700 border border-sky-200",
};

/* ===================== Page ===================== */

export default function ParentAttendancePage() {
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [studentProfiles, setStudentProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  /* ===================== Effects ===================== */

  // Leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoadingList(true);
      setError(null);
      try {
        const response = await getLeaveRequests();
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.items;
        setRequests(data);
      } catch (err) {
        console.error("Fetch leave requests error:", err);
        setError("Không thể tải danh sách đơn xin nghỉ.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  // Student profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const response = await getProfiles({ profileType: "Student" });
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.profiles ?? [];

        const students = data.filter(
          (profile) => profile.profileType === "Student"
        );

        setStudentProfiles(students);

        if (!formState.studentProfileId && students.length > 0) {
          setFormState((prev) => ({
            ...prev,
            studentProfileId: students[0].id,
          }));
        }
      } catch (err) {
        console.error("Fetch profiles error:", err);
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Classes by student
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
        const response = await getStudentClasses(
          formState.studentProfileId,
          { pageNumber: 1, pageSize: 100 }
        );

        const data = Array.isArray(response.data)
          ? response.data
  : response.data?.classes?.items ?? response.data?.items ?? [];
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
  }, [formState.studentProfileId]);

  /* ===================== Memos ===================== */

  const displayRequests = useMemo(
    () => requests.slice(0, 5),
    [requests]
  );

  const classLabel = (c: StudentClass) =>
 c.name ?? c.className ?? c.title ?? c.code ?? c.id;
  /* ===================== Actions ===================== */

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await createLeaveRequest(formState);
      if (response.data) {
        setRequests((prev) => [response.data, ...prev]);
      }
      setFormState(initialFormState);
      setSuccessMessage(
        "Đã tạo đơn xin nghỉ. Hệ thống sẽ tự duyệt theo luật 24h nếu đủ điều kiện."
      );
    } catch (err) {
      console.error("Create leave request error:", err);
      setError("Tạo đơn thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== Render ===================== */

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
          <CalendarCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Điểm danh & vắng mặt
          </h1>
          <p className="text-sm text-slate-600">
            Xác nhận vắng mặt, nhận thông báo chậm trễ và ghi chú từ giáo viên.
          </p>
        </div>
      </div>

      {/* Create leave request */}
      <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-4">
        <div>
          <div className="font-semibold text-slate-900">
            Tạo đơn xin nghỉ
          </div>
          <p className="text-sm text-slate-600">
            Đơn nghỉ 1 ngày tạo trước 24h sẽ tự động auto-approve.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Student */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Học viên
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formState.studentProfileId}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  studentProfileId: e.target.value,
                  classId: "",
                }))
              }
            >
              <option value="" disabled>
                {profilesLoading ? "Đang tải học viên..." : "Chọn học viên"}
              </option>
              {studentProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
            {profilesError && (
              <p className="text-xs text-rose-500">{profilesError}</p>
            )}
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Lớp học
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              value={formState.classId}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  classId: e.target.value,
                }))
              }
              disabled={
                !formState.studentProfileId ||
                classesLoading ||
                classes.length === 0
              }
            >
              <option value="" disabled>
                {classesLoading
                  ? "Đang tải lớp..."
                  : classes.length === 0
                  ? "Chưa có lớp"
                  : "Chọn lớp"}
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </select>
            {classesError && (
              <p className="text-xs text-rose-500">{classesError}</p>
            )}
          </div>

          {/* Dates */}
          <input
            type="date"
            className="rounded-lg border px-3 py-2 text-sm"
            value={formState.sessionDate}
            onChange={(e) =>
              setFormState((p) => ({ ...p, sessionDate: e.target.value }))
            }
          />
          <input
            type="date"
            className="rounded-lg border px-3 py-2 text-sm"
            value={formState.endDate}
            onChange={(e) =>
              setFormState((p) => ({ ...p, endDate: e.target.value }))
            }
          />
        </div>

        {/* Reason */}
        <textarea
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={formState.reason}
          onChange={(e) =>
            setFormState((p) => ({ ...p, reason: e.target.value }))
          }
          placeholder="Nhập lý do..."
        />

        {error && (
          <div className="text-sm text-rose-600 flex items-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="text-sm text-emerald-600 flex items-center gap-2">
            <ShieldCheck size={16} />
            {successMessage}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Send size={16} />
          {loading ? "Đang gửi..." : "Gửi đơn xin nghỉ"}
        </button>
      </div>

      {/* Recent requests */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="font-semibold text-slate-900">
          Đơn xin nghỉ gần đây
        </div>

        {displayRequests.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có đơn xin nghỉ.
          </div>
        ) : (
          displayRequests.map((r) => {
            const status = r.status ?? "PENDING";
            return (
              <div
                key={r.id}
                className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-semibold">
                    {r.studentName ?? r.studentProfileId}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.sessionDate} → {r.endDate}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold rounded-full px-2 py-1 ${statusStyles[status]}`}
                >
                  {statusLabels[status]}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border p-4 bg-white flex gap-3">
        <MessageSquare className="text-amber-600 mt-1" size={18} />
        <p className="text-sm text-slate-700">
          Nếu học viên vắng, hệ thống sẽ gửi tin nhắn cho phụ huynh để
          xác nhận lý do và hỗ trợ bù buổi.
        </p>
      </div>
    </div>
  );
}
