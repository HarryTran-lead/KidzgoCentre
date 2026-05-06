"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { getAccessToken } from "@/lib/store/authToken";
import {
  changeSessionRoom,
  changeSessionTeacher,
  fetchAdminSessions,
} from "@/app/api/admin/sessions";
import type {
  ChangeTeacherRole,
  Session,
} from "@/types/admin/sessions";
import { useToast } from "@/hooks/use-toast";

type SelectOption = { id: string; label: string };
type ActionMode = "room" | "teacher";
type SkippedSessionDetail = {
  sessionId: string;
  message: string;
};

function parseSessionDate(isoString?: string | null): Date | null {
  if (!isoString) return null;

  const parsed = new Date(isoString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatSessionDateTime(session: Session): string {
  const start = parseSessionDate(session.plannedDatetime);
  if (!start) return "Không xác định thời gian";

  const end = new Date(start.getTime() + (session.durationMinutes || 60) * 60 * 1000);
  const datePart = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(start);
  const startPart = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(start);
  const endPart = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(end);

  return `${datePart} • ${startPart} - ${endPart}`;
}

function getSessionWindow(session: Session): { start: Date; end: Date } | null {
  const start = parseSessionDate(session.plannedDatetime);
  if (!start) return null;

  const duration = session.durationMinutes && session.durationMinutes > 0 ? session.durationMinutes : 60;
  const end = new Date(start.getTime() + duration * 60 * 1000);
  return { start, end };
}

function isSessionEnded(session: Session): boolean {
  const window = getSessionWindow(session);
  if (!window) return false;
  return window.end.getTime() <= Date.now();
}

function currentTeacherLabel(session: Session): string {
  const mainTeacher =
    session.plannedTeacherName ||
    session.teacherName ||
    session.actualTeacherName ||
    "Chưa có GV chính";
  const assistantTeacher =
    session.plannedAssistantName ||
    session.assistantName ||
    session.actualAssistantName ||
    "";

  return assistantTeacher
    ? `${mainTeacher} • GV phụ: ${assistantTeacher}`
    : mainTeacher;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getSkippedSessionDetails(
  skippedSessionIds: string[],
  errors: string[]
): SkippedSessionDetail[] {
  return skippedSessionIds.map((sessionId) => {
    const matchedError = errors.find((error) => error.includes(sessionId));
    return {
      sessionId,
      message: matchedError ?? "Buổi học bị bỏ qua nhưng backend không trả chi tiết lỗi.",
    };
  });
}

export default function SessionBulkChangeModal({
  isOpen,
  onClose,
  classId,
  className,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("room");
  const [teacherRole, setTeacherRole] = useState<ChangeTeacherRole>("MainTeacher");
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [allRoomOptions, setAllRoomOptions] = useState<SelectOption[]>([]);
  const [allTeacherOptions, setAllTeacherOptions] = useState<SelectOption[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<string[]>([]);
  const [skippedDetails, setSkippedDetails] = useState<SkippedSessionDetail[]>([]);
  const [showAllActionErrors, setShowAllActionErrors] = useState(false);

  const resetDateFilter = () => {
    const today = new Date();
    setFromDate(toDateInputValue(today));
    setToDate("");
    setSelectedSessionIds([]);
  };

  const applyQuickRange = (mode: "today" | "next7" | "month") => {
    const base = new Date();

    if (mode === "today") {
      const day = toDateInputValue(base);
      setFromDate(day);
      setToDate(day);
      setSelectedSessionIds([]);
      return;
    }

    if (mode === "next7") {
      const to = new Date(base);
      to.setDate(to.getDate() + 7);
      setFromDate(toDateInputValue(base));
      setToDate(toDateInputValue(to));
      setSelectedSessionIds([]);
      return;
    }

    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const last = endOfMonth(base);
    setFromDate(toDateInputValue(first));
    setToDate(toDateInputValue(last));
    setSelectedSessionIds([]);
  };

  const exportSkippedDetails = () => {
    if (skippedDetails.length === 0) return;

    const lines = [
      `Class: ${className}`,
      `Action: ${actionMode === "room" ? "change-room" : "change-teacher"}`,
      `GeneratedAt: ${new Date().toISOString()}`,
      "",
      ...skippedDetails.map(
        (detail, index) =>
          `${index + 1}. sessionId=${detail.sessionId}\n   message=${detail.message}`
      ),
    ];

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `session-skip-details-${Date.now()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const filteredSessions = useMemo(() => {
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return sessions.filter((session) => {
      const planned = parseSessionDate(session.plannedDatetime);
      if (!planned) return false;

      const plannedMs = planned.getTime();
      if (fromMs !== null && plannedMs < fromMs) return false;
      if (toMs !== null && plannedMs > toMs) return false;
      return true;
    });
  }, [sessions, fromDate, toDate]);

  const selectableSessionIds = useMemo(
    () => filteredSessions.filter((session) => !isSessionEnded(session)).map((session) => session.id),
    [filteredSessions]
  );

  const selectedRoomName = useMemo(
    () => roomOptions.find((room) => room.id === selectedRoomId)?.label ?? "",
    [roomOptions, selectedRoomId]
  );

  const selectedTeacherName = useMemo(
    () => teacherOptions.find((teacher) => teacher.id === selectedTeacherId)?.label ?? "",
    [teacherOptions, selectedTeacherId]
  );

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setActionMode("room");
    setTeacherRole("MainTeacher");
    setSelectedSessionIds([]);
    setSelectedRoomId("");
    setSelectedTeacherId("");
    resetDateFilter();
    setError(null);
    setActionErrors([]);
    setSkippedDetails([]);
    setShowAllActionErrors(false);
    setIsLoading(true);

    const token = getAccessToken();
    if (!token) {
      setError("Bạn chưa đăng nhập.");
      setIsLoading(false);
      return;
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetchAdminSessions({
        classId,
        status: "Scheduled",
        pageNumber: 1,
        pageSize: 100,
      }),
      fetch(`/api/classrooms?pageNumber=1&pageSize=200`, { headers: authHeaders })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
      fetch(`/api/admin/users?pageNumber=1&pageSize=200&role=Teacher`, { headers: authHeaders })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
    ])
      .then(([sessionItems, roomsJson, teachersJson]) => {
        if (!active) return;

        const roomsItems: any[] =
          roomsJson?.data?.classrooms?.items ??
          roomsJson?.data?.items ??
          roomsJson?.data ??
          (Array.isArray(roomsJson) ? roomsJson : []);
        const teachersItems: any[] =
          teachersJson?.data?.items ??
          teachersJson?.data?.users ??
          teachersJson?.data ??
          (Array.isArray(teachersJson) ? teachersJson : []);

        const sortedSessions = [...sessionItems]
          .filter((session) => session.id)
          .sort((left, right) => {
            const leftTime = parseSessionDate(left.plannedDatetime)?.getTime() ?? 0;
            const rightTime = parseSessionDate(right.plannedDatetime)?.getTime() ?? 0;
            return leftTime - rightTime;
          });

        setSessions(sortedSessions);
        const mappedRooms = roomsItems
          .map((room) => ({
            id: String(room?.id ?? ""),
            label: String(room?.name ?? "Phòng"),
          }))
          .filter((room) => room.id);
        const mappedTeachers = teachersItems
          .map((teacher) => ({
            id: String(teacher?.id ?? ""),
            label: String(teacher?.name ?? teacher?.fullName ?? teacher?.email ?? "Teacher"),
          }))
          .filter((teacher) => teacher.id);

        setAllRoomOptions(mappedRooms);
        setAllTeacherOptions(mappedTeachers);
        setRoomOptions(mappedRooms);
        setTeacherOptions(mappedTeachers);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError((loadError as Error)?.message ?? "Không thể tải danh sách buổi học.");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [classId, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSubmitting, onClose]);

  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((current) =>
      current.includes(sessionId)
        ? current.filter((item) => item !== sessionId)
        : [...current, sessionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSessionIds.length === selectableSessionIds.length) {
      setSelectedSessionIds([]);
      return;
    }

    setSelectedSessionIds(selectableSessionIds);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (selectedSessionIds.length === 0) {
      setRoomOptions(allRoomOptions);
      setTeacherOptions(allTeacherOptions);
      return;
    }

    const selectedSessions = sessions.filter((session) => selectedSessionIds.includes(session.id));
    const selectedWindows = selectedSessions
      .map((session) => ({ sessionId: session.id, window: getSessionWindow(session) }))
      .filter((item): item is { sessionId: string; window: { start: Date; end: Date } } => Boolean(item.window));

    if (selectedWindows.length === 0) {
      setRoomOptions(allRoomOptions);
      setTeacherOptions(allTeacherOptions);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const minStart = selectedWindows.reduce(
      (min, item) => (item.window.start.getTime() < min ? item.window.start.getTime() : min),
      selectedWindows[0].window.start.getTime()
    );
    const maxEnd = selectedWindows.reduce(
      (max, item) => (item.window.end.getTime() > max ? item.window.end.getTime() : max),
      selectedWindows[0].window.end.getTime()
    );

    const from = toDateInputValue(new Date(minStart));
    const to = toDateInputValue(new Date(maxEnd));

    let active = true;
    setIsCheckingAvailability(true);

    fetchAdminSessions({ from, to, pageNumber: 1, pageSize: 1000 })
      .then((allSessions) => {
        if (!active) return;

        const relevantSessions = Array.isArray(allSessions) ? allSessions : [];

        const isRoomAvailableForAll = (roomId: string) => {
          for (const target of selectedWindows) {
            const hasConflict = relevantSessions.some((session) => {
              if (!session?.id || session.id === target.sessionId) return false;
              const status = String(session.status || "").toLowerCase();
              if (status === "cancelled" || status === "completed") return false;

              const sessionWindow = getSessionWindow(session);
              if (!sessionWindow) return false;
              if (!(target.window.start < sessionWindow.end && sessionWindow.start < target.window.end)) return false;

              const occupiedRoomId = session.plannedRoomId ?? session.actualRoomId;
              return occupiedRoomId ? String(occupiedRoomId) === roomId : false;
            });
            if (hasConflict) return false;
          }
          return true;
        };

        const isTeacherAvailableForAll = (teacherId: string) => {
          for (const target of selectedWindows) {
            const hasConflict = relevantSessions.some((session) => {
              if (!session?.id || session.id === target.sessionId) return false;
              const status = String(session.status || "").toLowerCase();
              if (status === "cancelled" || status === "completed") return false;

              const sessionWindow = getSessionWindow(session);
              if (!sessionWindow) return false;
              if (!(target.window.start < sessionWindow.end && sessionWindow.start < target.window.end)) return false;

              const occupiedTeacherIds = [
                session.plannedTeacherId,
                session.actualTeacherId,
                session.plannedAssistantId,
                session.actualAssistantId,
              ]
                .filter(Boolean)
                .map((id) => String(id));

              return occupiedTeacherIds.includes(teacherId);
            });
            if (hasConflict) return false;
          }
          return true;
        };

        const availableRooms = allRoomOptions.filter((room) => isRoomAvailableForAll(room.id));
        const availableTeachers = allTeacherOptions.filter((teacher) => isTeacherAvailableForAll(teacher.id));

        setRoomOptions(availableRooms);
        setTeacherOptions(availableTeachers);

        setSelectedRoomId((current) =>
          current && !availableRooms.some((room) => room.id === current) ? "" : current
        );
        setSelectedTeacherId((current) =>
          current && !availableTeachers.some((teacher) => teacher.id === current) ? "" : current
        );
      })
      .catch(() => {
        if (!active) return;
        setRoomOptions(allRoomOptions);
        setTeacherOptions(allTeacherOptions);
      })
      .finally(() => {
        if (active) {
          setIsCheckingAvailability(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    isOpen,
    selectedSessionIds,
    sessions,
    allRoomOptions,
    allTeacherOptions,
  ]);

  const handleSubmit = async () => {
    if (!classId) return;

    if (selectedSessionIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 buổi học.");
      return;
    }

    if (actionMode === "room" && !selectedRoomId) {
      setError("Vui lòng chọn phòng học mới.");
      return;
    }

    if (actionMode === "teacher" && !selectedTeacherId) {
      setError("Vui lòng chọn giáo viên.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionErrors([]);
    setSkippedDetails([]);
    setShowAllActionErrors(false);

    try {
      const result =
        actionMode === "room"
          ? await changeSessionRoom({
              sessionIds: selectedSessionIds,
              roomId: selectedRoomId,
            })
          : await changeSessionTeacher({
              sessionIds: selectedSessionIds,
              teacherId: selectedTeacherId,
              role: teacherRole,
            });

      const updatedCount = Number(result?.data?.updatedSessionsCount ?? 0);
      const skippedSessionIds = Array.isArray(result?.data?.skippedSessionIds)
        ? result.data.skippedSessionIds
        : [];
      const skippedCount = skippedSessionIds.length;
      const errors = Array.isArray(result?.data?.errors) ? result.data.errors : [];
      setSkippedDetails(getSkippedSessionDetails(skippedSessionIds, errors));

      if (updatedCount === 0 && errors.length > 0) {
        setShowAllActionErrors(true);
        setActionErrors(errors);
        setError(errors.join("\n"));
        return;
      }

      const actionLabel =
        actionMode === "room"
          ? `Đã đổi phòng sang ${selectedRoomName || "phòng mới"}`
          : `Đã đổi ${teacherRole === "MainTeacher" ? "GV chính" : "GV phụ"} sang ${selectedTeacherName || "giáo viên mới"}`;
      const description = `${actionLabel} cho ${updatedCount} buổi học của lớp ${className}.`;

      if (errors.length > 0 || skippedCount > 0) {
        toast.warning({
          title: "Cập nhật một phần",
          description: `${description}${skippedCount > 0 ? ` Bỏ qua ${skippedCount} buổi.` : ""}${errors.length > 0 ? `\n${errors.slice(0, 3).join("\n")}` : ""}`,
        });
      } else {
        toast.success({
          title: actionMode === "room" ? "Đổi phòng thành công" : "Đổi giáo viên thành công",
          description,
        });
      }

      onSuccess();
      onClose();
    } catch (submitError: unknown) {
      setError((submitError as Error)?.message ?? "Không thể cập nhật buổi học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-white">Đổi phòng / giáo viên theo buổi học</div>
            <div className="text-sm text-emerald-100 mt-1">{className}</div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer disabled:opacity-60"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Chọn một hoặc nhiều buổi Scheduled để đổi phòng hoặc đổi giáo viên. Buổi đã kết thúc sẽ bị khóa ở FE, backend vẫn là nguồn kiểm tra cuối cùng.
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 whitespace-pre-line">
              {error}
            </div>
          )}

          {actionErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} />
                  Các lỗi từ backend
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllActionErrors((value) => !value)}
                  className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  {showAllActionErrors ? "Thu gọn" : "Xem tất cả"}
                </button>
              </div>
              <div className="mt-2 whitespace-pre-line">{(showAllActionErrors ? actionErrors : actionErrors.slice(0, 5)).join("\n")}</div>
            </div>
          )}

          {skippedDetails.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">Chi tiết session bị skip ({skippedDetails.length})</div>
                <button
                  type="button"
                  onClick={exportSkippedDetails}
                  className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Export TXT
                </button>
              </div>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-amber-200 bg-white">
                {skippedDetails.map((detail) => (
                  <div key={`${detail.sessionId}-${detail.message}`} className="border-b border-amber-100 px-3 py-2 last:border-b-0">
                    <div className="font-mono text-[11px] text-amber-800">{detail.sessionId}</div>
                    <div className="text-xs text-amber-900 mt-1 whitespace-pre-line">{detail.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Danh sách buổi học</div>
                  <div className="text-xs text-gray-500">Tải từ GET /api/sessions?classId={"{"}classId{"}"}&status=Scheduled&pageSize=100</div>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  disabled={selectableSessionIds.length === 0 || isLoading}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  {selectedSessionIds.length === selectableSessionIds.length && selectableSessionIds.length > 0
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              </div>

              <div className="px-4 py-3 border-b border-gray-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="text-xs text-gray-700">
                  Từ ngày
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => {
                      setFromDate(event.target.value);
                      setSelectedSessionIds([]);
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-700">
                  Đến ngày
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => {
                      setToDate(event.target.value);
                      setSelectedSessionIds([]);
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetDateFilter}
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Clear filter
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange("today")}
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange("next7")}
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    7 ngày tới
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange("month")}
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Tháng này
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Đang tải danh sách buổi học...
                  </div>
                )}

                {!isLoading && filteredSessions.length === 0 && (
                  <div className="px-4 py-10 text-sm text-gray-500 text-center">
                    Không có buổi Scheduled nào để đổi phòng hoặc đổi giáo viên.
                  </div>
                )}

                {!isLoading &&
                  filteredSessions.map((session) => {
                    const ended = isSessionEnded(session);
                    const checked = selectedSessionIds.includes(session.id);

                    return (
                      <label
                        key={session.id}
                        className={`flex gap-3 px-4 py-3 ${ended ? "bg-gray-50 text-gray-400" : "hover:bg-emerald-50/40 cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={ended || isSubmitting}
                          onChange={() => toggleSession(session.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{session.classTitle || session.className || "Buổi học"}</span>
                            {ended && (
                              <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                Đã kết thúc
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{formatSessionDateTime(session)}</div>
                          <div className="text-xs text-gray-600">Phòng hiện tại: <span className="font-semibold">{session.plannedRoomName || session.roomName || session.actualRoomName || "Chưa có"}</span></div>
                          <div className="text-xs text-gray-600">Giáo viên hiện tại: <span className="font-semibold">{currentTeacherLabel(session)}</span></div>
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                <div className="text-sm font-semibold text-gray-900">Loại thao tác</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode("room");
                      setError(null);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                      actionMode === "room"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                    }`}
                  >
                    Đổi phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode("teacher");
                      setError(null);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                      actionMode === "teacher"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50"
                    }`}
                  >
                    Đổi giáo viên
                  </button>
                </div>
              </div>

              {actionMode === "room" ? (
                <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Phòng học mới</div>
                  <div className="text-xs text-gray-500">Chỉ hiển thị phòng rảnh cho tất cả buổi học đang chọn.</div>
                  <select
                    value={selectedRoomId}
                    onChange={(event) => setSelectedRoomId(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900"
                  >
                    <option value="">Chọn phòng học</option>
                    {roomOptions.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                  {!isCheckingAvailability && selectedSessionIds.length > 0 && roomOptions.length === 0 && (
                    <div className="text-xs text-amber-700">Không có phòng nào rảnh cho toàn bộ buổi học đã chọn.</div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Giáo viên mới</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTeacherRole("MainTeacher")}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border ${
                        teacherRole === "MainTeacher"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50"
                      }`}
                    >
                      GV chính
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherRole("Assistant")}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border ${
                        teacherRole === "Assistant"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50"
                      }`}
                    >
                      GV phụ
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">Chỉ hiển thị giáo viên rảnh cho tất cả buổi học đang chọn.</div>
                  <select
                    value={selectedTeacherId}
                    onChange={(event) => setSelectedTeacherId(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900"
                  >
                    <option value="">Chọn giáo viên</option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.label}
                      </option>
                    ))}
                  </select>
                  {!isCheckingAvailability && selectedSessionIds.length > 0 && teacherOptions.length === 0 && (
                    <div className="text-xs text-amber-700">Không có giáo viên nào rảnh cho toàn bộ buổi học đã chọn.</div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 space-y-1">
                <div>Đã chọn: <span className="font-semibold text-gray-900">{selectedSessionIds.length}</span> buổi học</div>
                <div>Khả dụng: <span className="font-semibold text-gray-900">{selectableSessionIds.length}</span> buổi học</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 cursor-pointer disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || isSubmitting || selectedSessionIds.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? "Đang cập nhật..." : actionMode === "room" ? "Đổi phòng đã chọn" : "Đổi giáo viên đã chọn"}
          </button>
        </div>
      </div>
    </div>
  );
}