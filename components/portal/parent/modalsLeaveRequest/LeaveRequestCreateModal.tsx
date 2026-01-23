"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  X,
} from "lucide-react";

import { createLeaveRequest } from "@/lib/api/leaveRequestService";
import { getProfiles } from "@/lib/api/authService";
import { getStudentClasses } from "@/lib/api/studentService";

import type {
  LeaveRequestPayload,
  LeaveRequestRecord,
} from "@/types/leaveRequest";
import type { UserProfile } from "@/types/auth";
import type { StudentClass } from "@/types/student/class";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (record: LeaveRequestRecord) => void;
};

const initialFormState: LeaveRequestPayload = {
  studentProfileId: "",
  classId: "",
  sessionDate: "",
  endDate: "",
  reason: "",
};

function profileLabel(p: UserProfile) {
  // @ts-expect-error - dự án có nhiều field name
  return p.fullName ?? p.name ?? p.displayName ?? p.email ?? p.id;
}

function classLabel(c: StudentClass) {
  // @ts-expect-error - dự án có nhiều field name
  return c.name ?? c.className ?? c.title ?? c.code ?? c.id;
}

function Banner({
  kind,
  text,
}: {
  kind: "error" | "success";
  text: string;
}) {
  const cls =
    kind === "error"
      ? "border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="text-sm font-medium">{text}</div>
      </div>
    </div>
  );
}

export default function LeaveRequestCreateModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [formState, setFormState] =
    useState<LeaveRequestPayload>(initialFormState);

  const [creating, setCreating] = useState(false);

  const [studentProfiles, setStudentProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // reset khi đóng
  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
      setCreating(false);
      setActionError(null);
      setActionMessage(null);
      setClasses([]);
      setClassesError(null);
      setProfilesError(null);
    }
  }, [open]);

  // load students khi mở
  useEffect(() => {
    if (!open) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const res = await getProfiles({ profileType: "Student" });
        const data = Array.isArray(res.data) ? res.data : res.data?.profiles ?? [];
        const students = data.filter((p: any) => p.profileType === "Student");
        setStudentProfiles(students);
      } catch {
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    if (!studentProfiles.length) fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // load classes theo student
  useEffect(() => {
    if (!open) return;
    if (!formState.studentProfileId) return;

    const fetchClasses = async () => {
      setClassesLoading(true);
      setClassesError(null);
      try {
        const res = await getStudentClasses(formState.studentProfileId, {
          pageNumber: 1,
          pageSize: 100,
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        setClasses(data);
      } catch {
        setClassesError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [open, formState.studentProfileId]);

  // auto endDate = sessionDate nếu rỗng
  useEffect(() => {
    if (!open) return;
    if (!formState.sessionDate) return;
    if (formState.endDate) return;
    setFormState((p) => ({ ...p, endDate: p.sessionDate }));
  }, [open, formState.sessionDate, formState.endDate]);

  const canSubmit = useMemo(() => {
    return (
      formState.studentProfileId &&
      formState.classId &&
      formState.sessionDate &&
      formState.endDate &&
      formState.reason.trim().length > 0
    );
  }, [formState]);

  const handleCreate = async () => {
    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const payload: LeaveRequestPayload = {
        ...formState,
        endDate: formState.endDate || formState.sessionDate,
      };

      const res = await createLeaveRequest(payload);
      if (res?.data) {
        onCreated(res.data);
        setActionMessage("Đã tạo đơn xin nghỉ.");
        onClose();
      } else {
        setActionError("Tạo đơn xin nghỉ thất bại (không có dữ liệu trả về).");
      }
    } catch {
      setActionError("Tạo đơn xin nghỉ thất bại.");
    } finally {
      setCreating(false);
    }
  };

  // ESC đóng modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-xl">
          {/* header */}
          <div className="border-b border-pink-200 bg-gradient-to-r from-pink-500/10 to-rose-500/10 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    Tạo đơn xin nghỉ
                  </div>
                  <div className="text-sm text-gray-600">
                    Chọn học viên → chọn lớp → nhập thời gian & lý do.
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-pink-200 bg-white text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* body */}
          <div className="p-5 space-y-4">
            {(actionError || actionMessage) && (
              <div className="space-y-3">
                {actionError && <Banner kind="error" text={actionError} />}
                {actionMessage && <Banner kind="success" text={actionMessage} />}
              </div>
            )}

            {/* Student */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Học viên</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={formState.studentProfileId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormState((p) => ({
                      ...p,
                      studentProfileId: id,
                      classId: "",
                    }));
                    setClasses([]);
                  }}
                >
                  <option value="">
                    {profilesLoading ? "Đang tải học viên..." : "Chọn học viên"}
                  </option>
                  {studentProfiles.map((p) => (
                    <option key={(p as any).id} value={(p as any).id}>
                      {profileLabel(p)}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {profilesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>
              {profilesError && <div className="text-sm text-rose-600">{profilesError}</div>}
            </div>

            {/* Class */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Lớp</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60"
                  value={formState.classId}
                  onChange={(e) => setFormState((p) => ({ ...p, classId: e.target.value }))}
                  disabled={!formState.studentProfileId || classesLoading}
                >
                  <option value="">
                    {!formState.studentProfileId
                      ? "Chọn học viên trước"
                      : classesLoading
                        ? "Đang tải lớp..."
                        : "Chọn lớp"}
                  </option>
                  {classes.map((c) => (
                    <option key={(c as any).id} value={(c as any).id}>
                      {classLabel(c)}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {classesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>
              {classesError && <div className="text-sm text-rose-600">{classesError}</div>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-800">Ngày nghỉ (từ)</div>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={formState.sessionDate}
                  onChange={(e) => setFormState((p) => ({ ...p, sessionDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-800">Ngày nghỉ (đến)</div>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={formState.endDate}
                  min={formState.sessionDate || undefined}
                  onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Lý do</div>
              <textarea
                className="w-full min-h-[110px] rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="Nhập lý do..."
                value={formState.reason}
                onChange={(e) => setFormState((p) => ({ ...p, reason: e.target.value }))}
              />
              <div className="text-xs text-gray-500">
                Tip: Đơn tạo trước 24h có thể auto-approve (tuỳ rule backend).
              </div>
            </div>

            {/* footer */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={!canSubmit || creating}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi đơn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
