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

import {
  getAllMakeupCredits,
  getMakeupCreditSuggestions,
} from "@/lib/api/makeupCreditService";

import type { MakeupCredit, MakeupSuggestion } from "@/types/makeupCredit";

export type CreateMakeupPayload = {
  studentProfileId: string;
  makeupCreditId: string;
  fromClassId: string;
  targetClassId: string;
  targetSessionId: string;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  note?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateMakeupPayload) => Promise<void> | void;
};

const getValueByPath = (obj: Record<string, any> | null, path: string) => {
  if (!obj) return undefined;
  return path.split(".").reduce<any>((acc, key) => acc?.[key], obj);
};

const pickValue = (obj: Record<string, any> | null, paths: string[]) => {
  for (const path of paths) {
    const value = getValueByPath(obj, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const formatScheduleInfo = (data: Record<string, any> | null) => {
  if (!data) return "";
  const day = pickValue(data, [
    "dayOfWeek",
    "weekday",
    "day",
    "sessionDay",
    "sessionDate",
    "date",
  ]);
  const session = pickValue(data, ["session", "shift", "period", "slot"]);
  const start = pickValue(data, ["startTime", "startAt", "timeStart"]);
  const end = pickValue(data, ["endTime", "endAt", "timeEnd"]);
  const time = start && end ? `${start} - ${end}` : start ?? end;

  return [session, day, time].filter(Boolean).join(" • ");
};

const getStudentIdFromCredit = (credit: MakeupCredit) =>
  (pickValue(credit as Record<string, any>, [
    "studentProfileId",
    "studentId",
    "student.id",
    "studentProfile.id",
  ]) as string | undefined) ?? "";

const getStudentNameFromCredit = (credit: MakeupCredit) =>
  (pickValue(credit as Record<string, any>, [
    "studentName",
    "studentFullName",
    "student.name",
    "student.fullName",
    "studentProfile.fullName",
    "studentProfile.name",
  ]) as string | undefined) ?? "Chưa rõ học viên";

const getClassIdFromCredit = (credit: MakeupCredit) =>
  (pickValue(credit as Record<string, any>, [
    "classId",
    "class.id",
    "sourceClassId",
  ]) as string | undefined) ?? "";

const getClassNameFromCredit = (credit: MakeupCredit) =>
  (pickValue(credit as Record<string, any>, [
    "className",
    "class.name",
    "class.className",
    "class.title",
    "class.code",
  ]) as string | undefined) ?? "Chưa rõ lớp";

const getCreditStatus = (credit: MakeupCredit) =>
  String(
    pickValue(credit as Record<string, any>, ["status", "state", "creditStatus"]) ??
      ""
  ).toUpperCase();

const getCreditRemaining = (credit: MakeupCredit) => {
  const raw = pickValue(credit as Record<string, any>, [
    "remainingCredits",
    "remaining",
    "credit",
    "creditCount",
    "totalCredits",
    "balance",
  ]);
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const isApprovedCredit = (credit: MakeupCredit) => {
  const status = getCreditStatus(credit);
  const remaining = getCreditRemaining(credit);

  const isBlocked = ["USED", "EXPIRED", "REJECT", "CANCEL"].some((s) =>
    status.includes(s)
  );

  const isApproved =
    !status ||
    ["APPROVED", "AUTO_APPROVED", "ACTIVE", "AVAILABLE"].some((s) =>
      status.includes(s)
    );

  const hasCredit = remaining === undefined ? true : remaining > 0;

  return isApproved && !isBlocked && hasCredit;
};

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

export default function MakeupSessionCreateModal({ open, onClose, onCreate }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [makeupCredits, setMakeupCredits] = useState<MakeupCredit[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<MakeupSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [payload, setPayload] = useState<CreateMakeupPayload>({
    studentProfileId: "",
    makeupCreditId: "",
    fromClassId: "",
    targetClassId: "",
    targetSessionId: "",
    date: "",
    time: "",
    note: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
      setSuggestions([]);
      setPayload({
        studentProfileId: "",
        makeupCreditId: "",
        fromClassId: "",
        targetClassId: "",
        targetSessionId: "",
        date: "",
        time: "",
        note: "",
      });
    }
  }, [open]);

  // Load credits when open
  useEffect(() => {
    if (!open) return;

    const fetchCredits = async () => {
      setCreditsLoading(true);
      setError(null);
      try {
        const res = await getAllMakeupCredits();
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.items ?? res.data?.credits ?? [];

        const filtered = data.filter((item: MakeupCredit) => isApprovedCredit(item));
        setMakeupCredits(filtered);
      } catch {
        setError("Không thể tải danh sách makeup credit.");
      } finally {
        setCreditsLoading(false);
      }
    };

    if (!makeupCredits.length) fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load suggestions when choose credit
  useEffect(() => {
    if (!open) return;
    if (!payload.makeupCreditId) return;

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      setError(null);
      try {
        const res = await getMakeupCreditSuggestions(payload.makeupCreditId);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.items ?? res.data?.suggestions ?? [];

        const normalized: MakeupSuggestion[] = [];
        data.forEach((item: any) => {
          if (Array.isArray(item?.sessions)) {
            item.sessions.forEach((session: any) => {
              normalized.push({
                ...session,
                classId:
                  item.classId ?? item.class?.id ?? session.classId ?? session.class?.id,
                className:
                  item.className ??
                  item.class?.name ??
                  item.class?.className ??
                  session.className ??
                  session.class?.name,
              });
            });
            return;
          }
          normalized.push(item);
        });

        setSuggestions(normalized);
      } catch {
        setError("Không thể tải gợi ý lớp bù.");
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [open, payload.makeupCreditId]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, string>();
    makeupCredits.forEach((credit) => {
      const studentId = getStudentIdFromCredit(credit);
      if (!studentId) return;
      if (!map.has(studentId)) map.set(studentId, getStudentNameFromCredit(credit));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [makeupCredits]);

  const studentCredits = useMemo(() => {
    if (!payload.studentProfileId) return [];
    return makeupCredits.filter(
      (credit) => getStudentIdFromCredit(credit) === payload.studentProfileId
    );
  }, [makeupCredits, payload.studentProfileId]);

  const targetClassOptions = useMemo(() => {
    const map = new Map<string, string>();
    suggestions.forEach((item) => {
      const classId =
        (pickValue(item as Record<string, any>, ["classId", "class.id"]) as
          | string
          | undefined) ?? "";
      if (!classId) return;

      if (!map.has(classId)) {
        const className =
          (pickValue(item as Record<string, any>, [
            "className",
            "class.name",
            "class.className",
            "class.title",
            "class.code",
          ]) as string | undefined) ?? "Chưa rõ lớp";
        map.set(classId, className);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [suggestions]);

  const filteredSessions = useMemo(() => {
    if (!payload.targetClassId) return suggestions;

    return suggestions.filter((item) => {
      const classId =
        (pickValue(item as Record<string, any>, ["classId", "class.id"]) as
          | string
          | undefined) ?? "";
      return classId === payload.targetClassId;
    });
  }, [payload.targetClassId, suggestions]);

  const sourceClassInfo = useMemo(() => {
    const credit = studentCredits.find((item) => (item as any).id === payload.makeupCreditId);
    if (!credit) return "";
    return formatScheduleInfo(credit as Record<string, any>);
  }, [payload.makeupCreditId, studentCredits]);

  const targetClassInfo = useMemo(() => {
    if (!payload.targetClassId) return "";
    const candidate = suggestions.find((item) => {
      const classId =
        (pickValue(item as Record<string, any>, ["classId", "class.id"]) as
          | string
          | undefined) ?? "";
      return classId === payload.targetClassId;
    });
    return candidate ? formatScheduleInfo(candidate as Record<string, any>) : "";
  }, [payload.targetClassId, suggestions]);

  const canSubmit = useMemo(() => {
    return (
      payload.studentProfileId &&
      payload.makeupCreditId &&
      payload.fromClassId &&
      payload.targetClassId &&
      payload.targetSessionId &&
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-pink-100 overflow-hidden">
        {/* header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow">
                <CalendarDays size={18} />
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900">
                  Tạo lịch học bù
                </div>
                <div className="text-xs text-gray-500">
                  Chọn MakeupCredit và buổi học bù phù hợp
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
                    makeupCreditId: "",
                    fromClassId: "",
                    targetClassId: "",
                    targetSessionId: "",
                    date: "",
                    time: "",
                  }));
                  setSuggestions([]);
                }}
              >
                <option value="">
                  {creditsLoading ? "Đang tải học viên..." : "Chọn học viên"}
                </option>
                {studentOptions.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {creditsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
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
                  value={payload.makeupCreditId}
                  disabled={!payload.studentProfileId || creditsLoading}
                  onChange={(e) => {
                    const creditId = e.target.value;
                    const credit = studentCredits.find(
                      (item) => (item as any).id === creditId
                    );

                    setPayload((p) => ({
                      ...p,
                      makeupCreditId: creditId,
                      fromClassId: credit ? getClassIdFromCredit(credit) : "",
                      targetClassId: "",
                      targetSessionId: "",
                      date: "",
                      time: "",
                    }));
                    setSuggestions([]);
                  }}
                >
                  <option value="">
                    {!payload.studentProfileId
                      ? "Chọn học viên trước"
                      : creditsLoading
                        ? "Đang tải lớp..."
                        : "Chọn lớp nguồn"}
                  </option>

                  {studentCredits.map((credit) => {
                    const creditId = (credit as any).id as string;
                    const className = getClassNameFromCredit(credit);
                    const info = formatScheduleInfo(credit as Record<string, any>);
                    return (
                      <option key={creditId} value={creditId}>
                        {info ? `${className} • ${info}` : className}
                      </option>
                    );
                  })}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {creditsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>

              {sourceClassInfo && (
                <div className="text-xs text-gray-500">
                  Thông tin lớp nguồn: {sourceClassInfo}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Lớp học bù (đích)</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60"
                  value={payload.targetClassId}
                  disabled={!payload.makeupCreditId || suggestionsLoading}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      targetClassId: e.target.value,
                      targetSessionId: "",
                      date: "",
                      time: "",
                    }))
                  }
                >
                  <option value="">
                    {!payload.makeupCreditId
                      ? "Chọn lớp nguồn trước"
                      : suggestionsLoading
                        ? "Đang tải gợi ý..."
                        : targetClassOptions.length
                          ? "Chọn lớp bù"
                          : "Chưa có gợi ý"}
                  </option>

                  {targetClassOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {suggestionsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>

              {targetClassInfo && (
                <div className="text-xs text-gray-500">
                  Thông tin lớp bù: {targetClassInfo}
                </div>
              )}
            </div>
          </div>

          {/* Session */}
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-800">Buổi học bù</div>
            <div className="relative">
              <select
                className="h-11 w-full appearance-none rounded-xl border border-pink-200 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60"
                value={payload.targetSessionId}
                disabled={!payload.targetClassId || suggestionsLoading}
                onChange={(e) => {
                  const sessionId = e.target.value;
                  const chosen = filteredSessions.find((item) => {
                    const id =
                      (pickValue(item as Record<string, any>, [
                        "id",
                        "sessionId",
                        "targetSessionId",
                      ]) as string | undefined) ?? "";
                    return id === sessionId;
                  });

                  const date =
                    (pickValue(chosen as Record<string, any>, [
                      "sessionDate",
                      "date",
                      "startDate",
                    ]) as string | undefined) ?? "";

                  const startTime =
                    (pickValue(chosen as Record<string, any>, [
                      "startTime",
                      "time",
                      "startAt",
                    ]) as string | undefined) ?? "";

                  setPayload((p) => ({
                    ...p,
                    targetSessionId: sessionId,
                    date: date || p.date,
                    time: startTime || p.time,
                  }));
                }}
              >
                <option value="">
                  {!payload.targetClassId
                    ? "Chọn lớp bù trước"
                    : suggestionsLoading
                      ? "Đang tải buổi học..."
                      : filteredSessions.length
                        ? "Chọn buổi học bù"
                        : "Chưa có buổi học gợi ý"}
                </option>

                {filteredSessions.map((item) => {
                  const sessionId =
                    (pickValue(item as Record<string, any>, [
                      "id",
                      "sessionId",
                      "targetSessionId",
                    ]) as string | undefined) ?? "";

                  const className =
                    (pickValue(item as Record<string, any>, [
                      "className",
                      "class.name",
                      "class.className",
                      "class.title",
                      "class.code",
                    ]) as string | undefined) ?? "";

                  const date =
                    (pickValue(item as Record<string, any>, [
                      "sessionDate",
                      "date",
                      "startDate",
                    ]) as string | undefined) ?? "";

                  const info = formatScheduleInfo(item as Record<string, any>);
                  const label = [className, date, info].filter(Boolean).join(" • ");

                  return (
                    <option key={sessionId} value={sessionId}>
                      {label || sessionId}
                    </option>
                  );
                })}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {suggestionsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
              </div>
            </div>
          </div>

          {/* Suggestion quick pick */}
          {suggestions.length > 0 && (
            <div className="rounded-2xl border border-pink-100 bg-white/70 p-4 space-y-2">
              <div className="text-sm font-semibold text-gray-800">
                Gợi ý lớp & buổi học bù
              </div>

              <div className="grid gap-2">
                {filteredSessions.map((item, idx) => {
                  const sessionId =
                    (pickValue(item as Record<string, any>, [
                      "id",
                      "sessionId",
                      "targetSessionId",
                    ]) as string | undefined) ?? "";

                  const className =
                    (pickValue(item as Record<string, any>, [
                      "className",
                      "class.name",
                      "class.className",
                      "class.title",
                      "class.code",
                    ]) as string | undefined) ?? "Lớp bù";

                  const date =
                    (pickValue(item as Record<string, any>, [
                      "sessionDate",
                      "date",
                      "startDate",
                    ]) as string | undefined) ?? "";

                  const info = formatScheduleInfo(item as Record<string, any>);
                  const label = [className, date, info].filter(Boolean).join(" • ");

                  return (
                    <button
                      key={`${sessionId}-${idx}`}
                      type="button"
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                        payload.targetSessionId === sessionId
                          ? "border-pink-300 bg-pink-50 text-pink-700"
                          : "border-pink-100 bg-white hover:border-pink-200"
                      }`}
                      onClick={() =>
                        setPayload((p) => ({
                          ...p,
                          targetClassId:
                            (pickValue(item as Record<string, any>, [
                              "classId",
                              "class.id",
                            ]) as string | undefined) ?? p.targetClassId,
                          targetSessionId: sessionId,
                          date:
                            (pickValue(item as Record<string, any>, [
                              "sessionDate",
                              "date",
                              "startDate",
                            ]) as string | undefined) ?? p.date,
                          time:
                            (pickValue(item as Record<string, any>, [
                              "startTime",
                              "time",
                              "startAt",
                            ]) as string | undefined) ?? p.time,
                        }))
                      }
                    >
                      <span>{label || "Buổi học bù gợi ý"}</span>
                      {payload.targetSessionId === sessionId && (
                        <span className="text-xs font-semibold">Đã chọn</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              rows={3}
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
              value={payload.note ?? ""}
              onChange={(e) => setPayload((p) => ({ ...p, note: e.target.value }))}
              placeholder="Ví dụ: Học bù do nghỉ ốm..."
            />
          </div>

          {/* actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
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
        </div>
      </div>
    </div>
  );
}
