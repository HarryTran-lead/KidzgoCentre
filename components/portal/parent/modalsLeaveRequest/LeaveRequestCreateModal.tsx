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
import { getClassById } from "@/lib/api/classService";
import { getAllStudents, getStudentClasses } from "@/lib/api/studentService";

import type { LeaveRequestPayload, LeaveRequestRecord } from "@/types/leaveRequest";
import type { StudentClass } from "@/types/student/class";
import type { StudentSummary } from "@/types/student/student";

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

function classLabel(c: StudentClass) {
  const cc = c as any;
  return cc.name ?? cc.className ?? cc.title ?? cc.code ?? cc.id;
}

function studentId(s: StudentSummary) {
  const ss = s as any;
  return (
    ss.id ??
    ss.profileId ??
    ss.studentProfileId ??
    ss.studentId ??
    ss.userId ??
    ""
  );
}

function studentLabel(s: StudentSummary) {
  const ss = s as any;
  return ss.fullName ?? ss.name ?? ss.displayName ?? ss.email ?? ss.id ?? "Học viên";
}

function parentLabel(s: StudentSummary) {
  const ss = s as any;
  return (
    ss.parentName ??
    ss.fatherName ??
    ss.motherName ??
    ss.guardianName ??
    ss.userName ??
    ss.userEmail ??
    ""
  );
}

function studentClassLabel(s: StudentSummary) {
  const ss = s as any;

  if (ss.className) return ss.className;

  if (Array.isArray(ss.classNames) && ss.classNames.length) {
    return ss.classNames.filter(Boolean).join(", ");
  }

  if (Array.isArray(ss.classes) && ss.classes.length) {
    return ss.classes
      .map((c: any) => c.name ?? c.className ?? c.title ?? c.code ?? c.id)
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function studentClassOptions(s: StudentSummary): StudentClass[] {
  const ss = s as any;

  if (Array.isArray(ss.classes) && ss.classes.length) {
    return ss.classes
      .map((c: any) => ({
        id: c.id ?? c.classId ?? "",
        name: c.name ?? c.className ?? c.title ?? c.code,
      }))
      .filter((c: any) => c.id || c.name);
  }

  if (ss.classId || ss.className) {
    return [
      {
        id: ss.classId ?? "",
        name: ss.className ?? "",
      },
    ].filter((c: any) => c.id || c.name);
  }

  return [];
}

async function enrichClassNames(items: StudentClass[]) {
  const needsLookup = items.filter((item) => {
    const it = item as any;
    return !it.name && !it.className && !it.title && !it.code;
  });

  if (!needsLookup.length) return items;

  const lookupIds = Array.from(
    new Set(needsLookup.map((it) => (it as any).id ?? it.id).filter(Boolean))
  );

  const detailResults = await Promise.all(
    lookupIds.map(async (id) => {
      try {
        const res: any = await getClassById(id);
        return res?.data ? { id, detail: res.data } : null;
      } catch {
        return null;
      }
    })
  );

  const detailMap = new Map(
    detailResults.filter(Boolean).map((x: any) => [x.id, x.detail])
  );

  return items.map((item) => {
    const it = item as any;
    const id = it.id ?? item.id;
    const detail = detailMap.get(id);
    if (!detail) return item;

    return {
      ...item,
      name: it.name ?? detail.name ?? detail.className ?? detail.title ?? detail.code,
      className: it.className ?? detail.className,
      title: it.title ?? detail.title,
      code: it.code ?? detail.code,
    } as any;
  });
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

export default function LeaveRequestCreateModal({ open, onClose, onCreated }: Props) {
  const [formState, setFormState] = useState<LeaveRequestPayload>(initialFormState);
  const [creating, setCreating] = useState(false);

  const [studentProfiles, setStudentProfiles] = useState<StudentSummary[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [parentSearchTerm, setParentSearchTerm] = useState("");

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
      setSearchTerm("");
      setParentSearchTerm("");
    }
  }, [open]);

  // load students khi mở
  useEffect(() => {
    if (!open) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const res: any = await getAllStudents({
          profileType: "Student",
          isActive: true,
          pageNumber: 1,
          pageSize: 200,
        });

        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.items ?? res?.data?.students ?? [];

        setStudentProfiles(data);
      } catch {
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredStudents = useMemo(() => {
    const studentTerm = searchTerm.trim().toLowerCase();
    const parentTerm = parentSearchTerm.trim().toLowerCase();

    if (!studentTerm && !parentTerm) return studentProfiles;

    return studentProfiles.filter((student) => {
      const studentName = studentLabel(student).toLowerCase();
      const parentName = parentLabel(student).toLowerCase();

      const matchStudent = studentTerm ? studentName.includes(studentTerm) : true;
      const matchParent = parentTerm ? parentName.includes(parentTerm) : true;

      return matchStudent && matchParent;
    });
  }, [parentSearchTerm, searchTerm, studentProfiles]);

  const selectedStudent = useMemo(
    () =>
      studentProfiles.find((student) => studentId(student) === formState.studentProfileId),
    [formState.studentProfileId, studentProfiles]
  );

  const selectedStudentClassText = useMemo(() => {
    if (!selectedStudent) return "";
    return studentClassLabel(selectedStudent);
  }, [selectedStudent]);

  // load classes theo student
  useEffect(() => {
    if (!open) return;
    if (!formState.studentProfileId) return;

    const fetchClasses = async () => {
      const derived = selectedStudent ? studentClassOptions(selectedStudent) : [];
      if (derived.length) {
        setClasses(derived);
        setClassesLoading(false);
        setClassesError(null);
        if (!formState.classId && derived.length === 1 && (derived[0] as any).id) {
          setFormState((p) => ({ ...p, classId: (derived[0] as any).id }));
        }
        return;
      }

      setClassesLoading(true);
      setClassesError(null);
      try {
        const res: any = await getStudentClasses({
          studentId: formState.studentProfileId,
          pageNumber: 1,
          pageSize: 100,
        });

        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.items ?? res?.data?.classes?.items ?? [];

        const enriched = await enrichClassNames(data);
        setClasses(enriched);
      } catch {
        setClassesError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [open, formState.classId, formState.studentProfileId, selectedStudent]);

  // auto endDate = sessionDate nếu rỗng
  useEffect(() => {
    if (!open) return;
    if (!formState.sessionDate) return;
    if (formState.endDate) return;
    setFormState((p) => ({ ...p, endDate: p.sessionDate }));
  }, [open, formState.sessionDate, formState.endDate]);

  const canSubmit = useMemo(() => {
    return (
      !!formState.studentProfileId &&
      !!formState.classId &&
      !!formState.sessionDate &&
      !!formState.endDate &&
      formState.reason.trim().length > 0
    );
  }, [formState]);

  const handleCreate = async () => {
    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res: any = await createLeaveRequest(formState);
      const isSuccess = res?.isSuccess ?? res?.success ?? false;

      if (!isSuccess) {
        setActionError(res?.message ?? "Không thể tạo đơn xin nghỉ.");
        return;
      }

      const record = res?.data?.record ?? res?.data ?? res?.record;
      if (record) onCreated(record as LeaveRequestRecord);

      setActionMessage("Tạo đơn xin nghỉ thành công.");
      onClose();
    } catch (error) {
      console.error("Create leave request error:", error);
      setActionError("Không thể tạo đơn xin nghỉ.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none opacity-0"}`}
      aria-hidden={!open}
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[min(720px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-3xl border border-pink-200 bg-white shadow-2xl overflow-hidden">
          {/* header */}
          <div className="p-5 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-pink-600" size={18} />
                  <div className="text-lg font-bold text-gray-900">Tạo đơn xin nghỉ</div>
                </div>
                <div className="text-sm text-gray-600">
                  Vui lòng điền thông tin để gửi yêu cầu nghỉ học
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

              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Tìm theo tên học viên"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <input
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Tìm theo tên phụ huynh"
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                />
              </div>

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
                    {profilesLoading
                      ? "Đang tải học viên..."
                      : filteredStudents.length
                        ? "Chọn học viên"
                        : "Không tìm thấy học viên"}
                  </option>

                  {filteredStudents.map((p) => (
                    <option key={studentId(p)} value={studentId(p)}>
                      {studentLabel(p)}
                      {studentClassLabel(p) ? ` • ${studentClassLabel(p)}` : ""}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {profilesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>

              {profilesError && <div className="text-sm text-rose-600">{profilesError}</div>}

              {selectedStudentClassText && (
                <div className="text-xs text-gray-500">
                  Lớp của học viên:{" "}
                  <span className="font-medium">{selectedStudentClassText}</span>
                </div>
              )}
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
                    <option key={(c as any).id ?? c.id} value={(c as any).id ?? c.id}>
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
                  onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Lý do</div>
              <textarea
                className="min-h-[92px] w-full resize-none rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="Nhập lý do xin nghỉ..."
                value={formState.reason}
                onChange={(e) => setFormState((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="h-11 rounded-xl border border-pink-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-pink-50 disabled:opacity-60"
                disabled={creating}
              >
                Hủy
              </button>

              <button
                onClick={handleCreate}
                disabled={!canSubmit || creating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi yêu cầu
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
