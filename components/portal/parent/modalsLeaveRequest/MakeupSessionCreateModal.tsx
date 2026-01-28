"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Send,
  X,
} from "lucide-react";

import { getProfiles } from "@/lib/api/authService";
import { getStudentClasses } from "@/lib/api/studentService";

import type { UserProfile } from "@/types/auth";
import type { StudentClass } from "@/types/student/class";

export type CreateMakeupPayload = {
  studentProfileId: string;
  fromClassId: string;
  targetClassId: string;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  note?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateMakeupPayload) => Promise<void> | void;
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

export default function MakeupSessionCreateModal({
  open,
  onClose,
  onCreate,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [studentProfiles, setStudentProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  const [payload, setPayload] = useState<CreateMakeupPayload>({
    studentProfileId: "",
    fromClassId: "",
    targetClassId: "",
    date: "",
    time: "",
    note: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
      setClasses([]);
      setPayload({
        studentProfileId: "",
        fromClassId: "",
        targetClassId: "",
        date: "",
        time: "",
        note: "",
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setError(null);
      try {
        const res = await getProfiles({ profileType: "Student" });
        const data = Array.isArray(res.data) ? res.data : res.data?.profiles ?? [];
        const students = data.filter((p: any) => p.profileType === "Student");
        setStudentProfiles(students);
      } catch {
        setError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    if (!studentProfiles.length) fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!payload.studentProfileId) return;

    const fetchClasses = async () => {
      setClassesLoading(true);
      setError(null);
      try {
        const res = await getStudentClasses({
          studentProfileId: payload.studentProfileId,
          pageNumber: 1,
          pageSize: 100,
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        setClasses(data);
      } catch {
        setError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [open, payload.studentProfileId]);

  const canSubmit = useMemo(() => {
    return (
      payload.studentProfileId &&
      payload.fromClassId &&
      payload.targetClassId &&
      payload.date &&
      payload.time
    );
  }, [payload]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(payload);
      onClose();
    } catch {
      setError("Tạo lịch bù thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ESC đóng
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
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

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
                    Tạo lịch học bù
                  </div>
                  <div className="text-sm text-gray-600">
                    Chọn học viên, lớp nguồn/đích và thời gian học bù.
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
            {error && <Banner kind="error" text={error} />}

            {/* Student */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Học viên</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={payload.studentProfileId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPayload((p) => ({
                      ...p,
                      studentProfileId: id,
                      fromClassId: "",
                      targetClassId: "",
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
            </div>

            {/* Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-800">Lớp nguồn</div>
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60"
                    value={payload.fromClassId}
                    disabled={!payload.studentProfileId || classesLoading}
                    onChange={(e) =>
                      setPayload((p) => ({ ...p, fromClassId: e.target.value }))
                    }
                  >
                    <option value="">
                      {!payload.studentProfileId
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
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-800">Lớp học bù (đích)</div>
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60"
                    value={payload.targetClassId}
                    disabled={!payload.studentProfileId || classesLoading}
                    onChange={(e) =>
                      setPayload((p) => ({ ...p, targetClassId: e.target.value }))
                    }
                  >
                    <option value="">
                      {!payload.studentProfileId
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
              </div>
            </div>

            {/* Date + time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-800">Ngày học bù</div>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={payload.date}
                  onChange={(e) => setPayload((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-800">Giờ</div>
                <input
                  type="time"
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  value={payload.time}
                  onChange={(e) => setPayload((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Ghi chú (tuỳ chọn)</div>
              <textarea
                className="w-full min-h-[110px] rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                value={payload.note}
                onChange={(e) => setPayload((p) => ({ ...p, note: e.target.value }))}
                placeholder="Nhập ghi chú..."
              />
            </div>

            {/* footer */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Tạo lịch bù
                  </>
                )}
              </button>
            </div>

            {classesLoading && (
              <div className="text-sm text-gray-500">
                Đang tải danh sách lớp...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
