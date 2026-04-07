"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MessageSquare,
  User,
  X,
} from "lucide-react";

import { createPauseEnrollmentRequest } from "@/lib/api/pauseEnrollmentService";
import { getStudentClasses } from "@/lib/api/studentService";
import type {
  CreatePauseEnrollmentRequestPayload,
  PauseEnrollmentRequestRecord,
  PauseEnrollmentStudentOption,
} from "@/types/pauseEnrollment";
import type { StudentClass } from "@/types/student/class";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (record: PauseEnrollmentRequestRecord) => void;
  studentOptions: PauseEnrollmentStudentOption[];
  studentOptionsLoading?: boolean;
  studentOptionsError?: string | null;
  lockedStudentProfileId?: string | null;
  lockedStudentLabel?: string | null;
  lockedStudentClassText?: string | null;
};

type FormState = CreatePauseEnrollmentRequestPayload;

const initialFormState: FormState = {
  studentProfileId: "",
  pauseFrom: "",
  pauseTo: "",
  reason: "",
};

function classLabel(item: StudentClass) {
  return item.name ?? item.className ?? item.title ?? item.code ?? item.id;
}

function extractClassItems(payload: unknown): StudentClass[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as {
    data?: {
      items?: StudentClass[];
      classes?: {
        items?: StudentClass[];
      };
    };
  };

  if (Array.isArray(root.data?.items)) return root.data.items;
  if (Array.isArray(root.data?.classes?.items)) return root.data.classes.items;
  return [];
}

function extractCreatedRecord(payload: unknown): PauseEnrollmentRequestRecord | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as {
    data?: unknown;
    record?: PauseEnrollmentRequestRecord;
    pauseEnrollmentRequest?: PauseEnrollmentRequestRecord;
    pauseEnrollmentRequests?: PauseEnrollmentRequestRecord[];
  };

  const data = root.data as any;

  if (root.record?.id) return root.record;
  if (root.pauseEnrollmentRequest?.id) return root.pauseEnrollmentRequest;
  if (Array.isArray(root.pauseEnrollmentRequests) && root.pauseEnrollmentRequests[0]?.id) {
    return root.pauseEnrollmentRequests[0];
  }

  if (data?.record?.id) return data.record;
  if (data?.pauseEnrollmentRequest?.id) return data.pauseEnrollmentRequest;
  if (Array.isArray(data?.pauseEnrollmentRequests) && data.pauseEnrollmentRequests[0]?.id) {
    return data.pauseEnrollmentRequests[0];
  }
  if (data?.id) return data as PauseEnrollmentRequestRecord;

  return null;
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
      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700";
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

export default function PauseEnrollmentCreateModal({
  open,
  onClose,
  onCreated,
  studentOptions,
  studentOptionsLoading = false,
  studentOptionsError,
  lockedStudentProfileId,
  lockedStudentLabel,
  lockedStudentClassText,
}: Props) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedStudent = useMemo(
    () => studentOptions.find((item) => item.id === formState.studentProfileId),
    [formState.studentProfileId, studentOptions]
  );
  const lockedStudent = useMemo(
    () =>
      lockedStudentProfileId
        ? studentOptions.find((item) => item.id === lockedStudentProfileId)
        : null,
    [lockedStudentProfileId, studentOptions]
  );
  const displayStudentLabel =
    lockedStudent?.label ??
    selectedStudent?.label ??
    lockedStudentLabel ??
    "Học sinh đang chọn";
  const displayStudentClassText =
    lockedStudent?.classText ??
    selectedStudent?.classText ??
    lockedStudentClassText ??
    null;

  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
      setClasses([]);
      setClassesError(null);
      setActionError(null);
      setActionMessage(null);
      setSubmitting(false);
      return;
    }

    const nextStudentId =
      lockedStudentProfileId ||
      formState.studentProfileId ||
      studentOptions[0]?.id ||
      "";

    setFormState((prev) => ({
      ...prev,
      studentProfileId: nextStudentId,
    }));
  }, [formState.studentProfileId, lockedStudentProfileId, open, studentOptions]);

  useEffect(() => {
    if (!open || !formState.studentProfileId) {
      setClasses([]);
      return;
    }

    const loadClasses = async () => {
      setClassesLoading(true);
      setClassesError(null);

      try {
        const response = await getStudentClasses({
          studentProfileId: formState.studentProfileId,
          pageNumber: 1,
          pageSize: 100,
        });

        setClasses(extractClassItems(response));
      } catch {
        setClasses([]);
        setClassesError("Không thể tải lớp hiện tại của học sinh.");
      } finally {
        setClassesLoading(false);
      }
    };

    void loadClasses();
  }, [formState.studentProfileId, open]);

  const handleReset = () => {
    const nextStudentId = lockedStudentProfileId || studentOptions[0]?.id || "";
    setFormState({
      studentProfileId: nextStudentId,
      pauseFrom: "",
      pauseTo: "",
      reason: "",
    });
    setActionError(null);
    setActionMessage(null);
  };

  if (!open) return null;

  const handleSubmit = async () => {
    setActionError(null);
    setActionMessage(null);

    if (!formState.studentProfileId) {
      setActionError("Vui lòng chọn học sinh cần bảo lưu.");
      return;
    }

    if (!formState.pauseFrom) {
      setActionError("Vui lòng chọn ngày bắt đầu bảo lưu.");
      return;
    }

    if (!formState.pauseTo) {
      setActionError("Vui lòng chọn ngày kết thúc bảo lưu.");
      return;
    }

    if (formState.pauseTo < formState.pauseFrom) {
      setActionError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await createPauseEnrollmentRequest(formState);
      const created = extractCreatedRecord(response);

      if (!created) {
        throw new Error("Không nhận được dữ liệu yêu cầu bảo lưu từ hệ thống.");
      }

      setActionMessage("Đã tạo yêu cầu bảo lưu.");
      onCreated(created);
      onClose();
    } catch (error: any) {
      setActionError(
        error?.response?.data?.message ??
          error?.message ??
          "Không thể tạo yêu cầu bảo lưu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white transition hover:bg-white/20 cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg">
              <CalendarDays size={22} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Tạo yêu cầu bảo lưu</h2>
              <p className="max-w-2xl text-sm leading-6 text-red-100">
                Bảo lưu là luồng riêng với xin nghỉ ngắn ngày. Hệ thống sẽ tự
                quét các lớp có buổi học nằm trong khoảng ngày bạn chọn và chỉ
                áp dụng khi yêu cầu được duyệt.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6 sm:px-8 max-h-[70vh] overflow-y-auto">
          {actionError ? <Banner kind="error" text={actionError} /> : null}
          {actionMessage ? <Banner kind="success" text={actionMessage} /> : null}
          {studentOptionsError ? <Banner kind="error" text={studentOptionsError} /> : null}

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-red-600" />
                  Học sinh
                </label>

                {lockedStudentProfileId ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {displayStudentLabel}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Đã khóa theo học sinh đang chọn trên thanh bên.
                        </div>
                      </div>
                      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                        Cố định
                      </span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formState.studentProfileId}
                    disabled={studentOptionsLoading || submitting}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        studentProfileId: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                  >
                    <option value="">
                      {studentOptionsLoading ? "Đang tải..." : "Chọn học sinh"}
                    </option>
                    {studentOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.parentName
                          ? `${item.label} - PH: ${item.parentName}`
                          : item.label}
                      </option>
                    ))}
                  </select>
                )}

                {displayStudentClassText ? (
                  <div className="mt-3 text-xs text-gray-500">
                    Lớp hiện tại: {displayStudentClassText}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={formState.pauseFrom}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        pauseFrom: event.target.value,
                      }))
                    }
                    disabled={submitting}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={formState.pauseTo}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        pauseTo: event.target.value,
                      }))
                    }
                    disabled={submitting}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MessageSquare size={16} className="text-red-600" />
                  Lý do bảo lưu
                </label>
                <textarea
                  value={formState.reason ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                  disabled={submitting}
                  rows={5}
                  placeholder="Ví dụ: nghỉ dài ngày do sức khỏe / công tác / chuyển nơi ở tạm thời..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <BookOpen size={16} className="text-red-600" />
                  Lớp liên quan
                </div>

                {classesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Đang tải lớp hiện tại...
                  </div>
                ) : classesError ? (
                  <div className="text-sm text-red-600">{classesError}</div>
                ) : classes.length ? (
                  <div className="flex flex-wrap gap-2">
                    {classes.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        {classLabel(item)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Chưa có lớp hoạt động để hiển thị trước. Hệ thống vẫn sẽ
                    kiểm tra chính xác theo khoảng ngày khi tạo yêu cầu.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <div className="font-semibold text-amber-900">Lưu ý nghiệp vụ</div>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Chức năng này dành cho nghỉ dài ngày, không phải nghỉ lẻ từng buổi.</li>
                  <li>Khoảng ngày sẽ được đối chiếu theo UTC date ở backend.</li>
                  <li>Chỉ khi yêu cầu được duyệt, enrollment liên quan mới được pause.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold cursor-pointer text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold cursor-pointer text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || (!lockedStudentProfileId && studentOptionsLoading)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 text-sm font-semibold cursor-pointer text-white shadow-lg hover:shadow-xl transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo yêu cầu"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}