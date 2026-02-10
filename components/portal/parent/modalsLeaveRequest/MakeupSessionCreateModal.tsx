"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send, X, Calendar, Clock } from "lucide-react";

import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

import {
  getMakeupCreditStudents,
  getMakeupCreditsByStudent,
  getMakeupCreditSuggestions,
} from "@/lib/api/makeupCreditService";
import type { StudentClass } from "@/types/student/class";

import type {
  MakeupCredit,
  MakeupCreditStudent,
  MakeupSuggestion,
} from "@/types/makeupCredit";

export type CreateMakeupPayload = {
  studentProfileId: string;
  makeupCreditId: string;

  fromClassId: string;
  targetClassId: string;
  targetSessionId: string;

  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateMakeupPayload) => Promise<void> | void;
};

/* ================= utils ================= */

const pickValue = (obj: any, paths: string[]) => {
  for (const p of paths) {
    const v = p.split(".").reduce((acc, k) => acc?.[k], obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateInputValue = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeInputValue = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const formatDateTimeVN = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ✅ derive timeOfDay theo HH:mm
// Nếu backend dùng value khác (AM/PM, MORNING/AFTERNOON/EVENING) bạn đổi ở đây 1 chỗ là xong.
const deriveTimeOfDay = (time: string) => {
  const [hhStr] = (time || "").split(":");
  const hh = Number(hhStr);
  if (!Number.isFinite(hh)) return undefined;

  // giả định backend nhận Morning/Afternoon/Evening
  if (hh < 12) return "Morning";
  if (hh < 18) return "Afternoon";
  return "Evening";
};

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700"
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

/* ================= session detail ================= */

type SessionDetail = {
  id: string;
  classId: string;
  classCode?: string | null;
  classTitle?: string | null;
  plannedDatetime?: string | null;
  plannedRoomName?: string | null;
  branchName?: string | null;
};

const unwrap = (res: any) => {
  const root = res?.data ?? res;
  return root?.data ?? root; // hỗ trợ {isSuccess,data:{...}} hoặc raw
};

async function getSessionById(sessionId: string): Promise<SessionDetail | null> {
  if (!sessionId) return null;

  const res = await get<any>(`${TEACHER_ENDPOINTS.SESSIONS}/${sessionId}`);
  const api = unwrap(res);
  const s = api?.session ?? api;

  if (!s?.id) return null;

  return {
    id: s.id,
    classId: s.classId,
    classCode: s.classCode ?? null,
    classTitle: s.classTitle ?? null,
    plannedDatetime: s.plannedDatetime ?? null,
    plannedRoomName: s.plannedRoomName ?? null,
    branchName: s.branchName ?? null,
  };
}

const sourceClassDisplay = (s: SessionDetail | null) => {
  if (!s) return "";
  const classPart = [s.classCode, s.classTitle].filter(Boolean).join(" - ");
  const timePart = s.plannedDatetime ? formatDateTimeVN(s.plannedDatetime) : "";
  const meta = [s.branchName, s.plannedRoomName].filter(Boolean).join(" • ");
  return [classPart, timePart].filter(Boolean).join(" • ") + (meta ? ` • ${meta}` : "");
};

/* ================= domain helpers ================= */

const getStudentId = (st: MakeupCreditStudent) =>
  (pickValue(st, ["studentProfileId", "studentId", "id"]) as string | undefined) ?? "";

const getStudentName = (st: MakeupCreditStudent) =>
  (pickValue(st, ["displayName", "name", "fullName", "studentName", "studentFullName"]) as
    | string
    | undefined) ?? "Chưa rõ học viên";

const creditId = (c: MakeupCredit) => (pickValue(c, ["id"]) as string | undefined) ?? "";
const creditStatus = (c: MakeupCredit) => String(pickValue(c, ["status"]) ?? "").toUpperCase();
const creditSourceSessionId = (c: MakeupCredit) =>
  (pickValue(c, ["sourceSessionId"]) as string | undefined) ?? "";

const isUsableCredit = (c: MakeupCredit) => {
  const st = creditStatus(c);
  return !st || st.includes("AVAILABLE") || st.includes("ACTIVE");
};

const normalizeSuggestions = (raw: any[]): MakeupSuggestion[] => {
  const normalized: any[] = [];
  raw.forEach((item) => {
    if (Array.isArray(item?.sessions)) {
      item.sessions.forEach((sess: any) => {
        normalized.push({
          ...sess,
          classId: item.classId ?? sess.classId ?? sess.class?.id,
          className:
            item.classTitle ??
            item.className ??
            sess.classTitle ??
            sess.className ??
            sess.class?.name,
          classCode: item.classCode ?? sess.classCode ?? sess.class?.code,
        });
      });
      return;
    }
    normalized.push(item);
  });
  return normalized as MakeupSuggestion[];
};

const suggestionClassId = (s: any) =>
  (pickValue(s, ["classId", "class.id"]) as string | undefined) ?? "";
const suggestionClassName = (s: any) =>
  (pickValue(s, ["classTitle", "className", "class.name", "class.code"]) as string | undefined) ??
  "Chưa rõ lớp";
const suggestionClassCode = (s: any) =>
  (pickValue(s, ["classCode", "class.code"]) as string | undefined) ?? "";
const suggestionSessionId = (s: any) =>
  (pickValue(s, ["id", "sessionId"]) as string | undefined) ?? "";
const suggestionPlannedDatetime = (s: any) =>
  (pickValue(s, [
    "plannedDatetime",
    "plannedDateTime",
    "actualDatetime",
    "datetime",
    "dateTime",
    "startTime",
  ]) as
    | string
    | undefined) ?? "";

const classIdValue = (c: any) => (pickValue(c, ["id", "classId"]) as string | undefined) ?? "";
const classNameValue = (c: any) =>
  (pickValue(c, ["title", "name", "className"]) as string | undefined) ?? "Chưa rõ lớp";
const classCodeValue = (c: any) => (pickValue(c, ["code", "classCode"]) as string | undefined) ?? "";

const toISODateStart = (dateStr?: string) => {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0);
  return `${toDateInputValue(base)}T00:00:00+07:00`;
};

const toISODateEnd = (dateStr?: string) => {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59);
  return `${toDateInputValue(base)}T23:59:59+07:00`;
};

const normalizeSessions = (raw: any[]): any[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean);
};

/* ================= component ================= */

export default function MakeupSessionCreateModal({ open, onClose, onCreate }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<MakeupCreditStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [credits, setCredits] = useState<MakeupCredit[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const [sourceSession, setSourceSession] = useState<SessionDetail | null>(null);
  const [sourceSessionLoading, setSourceSessionLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<MakeupSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [allClasses, setAllClasses] = useState<StudentClass[]>([]);
  const [allClassesLoading, setAllClassesLoading] = useState(false);

  const [manualSessions, setManualSessions] = useState<any[]>([]);
  const [manualSessionsLoading, setManualSessionsLoading] = useState(false);

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

  // reset when close
  useEffect(() => {
    if (open) return;
    setSubmitting(false);
    setError(null);
    setStudents([]);
    setCredits([]);
    setSourceSession(null);
    setSuggestions([]);
    setAllClasses([]);
    setManualSessions([]);
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
  }, [open]);

  // esc close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // load students
  useEffect(() => {
    if (!open) return;

    const run = async () => {
      setStudentsLoading(true);
      setError(null);
      try {
        const res = await getMakeupCreditStudents();
        const api = unwrap(res);
        const list = (api?.items ?? api?.students ?? api) as any[];
        setStudents(Array.isArray(list) ? list : []);
      } catch {
        setError("Không thể tải danh sách học viên có makeup credit.");
      } finally {
        setStudentsLoading(false);
      }
    };

    run();
  }, [open]);

  // load credits by student
  useEffect(() => {
    if (!open) return;
    if (!payload.studentProfileId) return;

    const run = async () => {
      setCreditsLoading(true);
      setError(null);

      // reset downstream
      setCredits([]);
      setSourceSession(null);
      setSuggestions([]);
      setPayload((p) => ({
        ...p,
        makeupCreditId: "",
        fromClassId: "",
        targetClassId: "",
        targetSessionId: "",
        date: "",
        time: "",
      }));

      try {
        const res = await getMakeupCreditsByStudent(payload.studentProfileId);
        const api = unwrap(res);
        const list = (api?.items ?? api?.credits ?? api) as any[];
        const arr = Array.isArray(list) ? (list as MakeupCredit[]) : [];
        setCredits(arr.filter(isUsableCredit));
      } catch {
        setError("Không thể tải danh sách makeup credit theo học viên.");
      } finally {
        setCreditsLoading(false);
      }
    };

    run();
  }, [open, payload.studentProfileId]);

  // when select credit -> fetch source session detail (để hiện lớp nguồn)
  useEffect(() => {
    if (!open) return;
    if (!payload.makeupCreditId) return;

    const credit = credits.find((c) => creditId(c) === payload.makeupCreditId);
    const sourceId = credit ? creditSourceSessionId(credit) : "";

    const run = async () => {
      setSourceSessionLoading(true);
      setError(null);
      setSourceSession(null);
      setSuggestions([]);

      // reset target
      setPayload((p) => ({
        ...p,
        fromClassId: "",
        targetClassId: "",
        targetSessionId: "",
      }));

      try {
        const s = await getSessionById(sourceId);
        setSourceSession(s);
        setPayload((p) => ({
          ...p,
          fromClassId: s?.classId ?? "",
          // nếu user chưa chọn date/time thì set default theo plannedDatetime để suggestions có input
          date: p.date || (s?.plannedDatetime ? toDateInputValue(new Date(s.plannedDatetime)) : ""),
          time: p.time || (s?.plannedDatetime ? toTimeInputValue(new Date(s.plannedDatetime)) : ""),
        }));
      } catch {
        // ignore
      } finally {
        setSourceSessionLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload.makeupCreditId]);

  // ✅ fetch suggestions khi có credit + makeupDate (và timeOfDay optional)
  useEffect(() => {
    if (!open) return;
    if (!payload.makeupCreditId) return;
    if (!payload.date) return; // swagger có makeupDate => nên bắt buộc để có gợi ý

    const timeOfDay = deriveTimeOfDay(payload.time);

    const run = async () => {
      setSuggestionsLoading(true);
      setError(null);
      try {
        const res = await getMakeupCreditSuggestions(payload.makeupCreditId, {
          makeupDate: payload.date,
          timeOfDay: timeOfDay,
        });

        const api = unwrap(res);
        const list = (api?.items ?? api?.suggestions ?? api) as any[];
        setSuggestions(normalizeSuggestions(Array.isArray(list) ? list : []));
      } catch {
        setError("Không thể tải gợi ý lớp/buổi học bù (suggestions).");
      } finally {
        setSuggestionsLoading(false);
      }
    };

    run();
  }, [open, payload.makeupCreditId, payload.date, payload.time]);

  const shouldEnableManual = useMemo(() => {
    if (!payload.makeupCreditId) return false;
    if (suggestionsLoading) return false;
    return suggestions.length === 0;
  }, [payload.makeupCreditId, suggestionsLoading, suggestions.length]);

  // load classes for manual selection when no suggestions
  useEffect(() => {
    if (!open) return;
    if (!shouldEnableManual) return;

    const run = async () => {
      setAllClassesLoading(true);
      setError(null);
      try {
        const res = await get<any>("/api/classes");
        const api = unwrap(res);
        const list = (api?.items ?? api?.classes ?? api) as any[];
        setAllClasses(Array.isArray(list) ? (list as StudentClass[]) : []);
      } catch {
        setError("Không thể tải danh sách lớp để chọn thủ công.");
      } finally {
        setAllClassesLoading(false);
      }
    };

    run();
  }, [open, shouldEnableManual]);

  // load sessions for manual class selection
  useEffect(() => {
    if (!open) return;
    if (!shouldEnableManual) return;
    if (!payload.targetClassId) {
      setManualSessions([]);
      return;
    }

    const run = async () => {
      setManualSessionsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("classId", payload.targetClassId);
        params.set("from", toISODateStart(payload.date));
        params.set("to", toISODateEnd(payload.date));

        const res = await get<any>(`${TEACHER_ENDPOINTS.TIMETABLE}?${params.toString()}`);
        const api = unwrap(res);
        const list =
          (api?.sessions ??
            api?.items ??
            api?.data?.sessions ??
            api?.data?.items ??
            api) as any[];
        setManualSessions(normalizeSessions(Array.isArray(list) ? list : []));
      } catch {
        setError("Không thể tải danh sách buổi học để chọn thủ công.");
      } finally {
        setManualSessionsLoading(false);
      }
    };

    run();
  }, [open, shouldEnableManual, payload.targetClassId, payload.date]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      const id = getStudentId(s);
      if (!id) return;
      if (!map.has(id)) map.set(id, getStudentName(s));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  const creditOptions = useMemo(() => {
    return credits.map((c) => {
      const id = creditId(c);
      const status = creditStatus(c) || "AVAILABLE";
      const src = creditSourceSessionId(c);
      // label gọn: Available • 605b340e...
      return { id, label: `${status} • ${src?.slice(0, 8)}…`, raw: c };
    });
  }, [credits]);

  const targetClassOptions = useMemo(() => {
    const map = new Map<string, string>();
    suggestions.forEach((s: any) => {
      const id = suggestionClassId(s);
      if (!id) return;
      if (map.has(id)) return;
      const code = suggestionClassCode(s);
      const name = suggestionClassName(s);
      map.set(id, [code, name].filter(Boolean).join(" - "));
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [suggestions]);

  const manualClassOptions = useMemo(() => {
    const map = new Map<string, string>();
    allClasses.forEach((c) => {
      const id = classIdValue(c);
      if (!id) return;
      const label = [classCodeValue(c), classNameValue(c)].filter(Boolean).join(" - ");
      if (!map.has(id)) map.set(id, label || id);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allClasses]);

  const filteredSessions = useMemo(() => {
    if (!payload.targetClassId) return [];
    return suggestions.filter((s: any) => suggestionClassId(s) === payload.targetClassId);
  }, [suggestions, payload.targetClassId]);

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

  if (!open) return null;

  const classOptionsToShow = shouldEnableManual ? manualClassOptions : targetClassOptions;
  const isClassLoading = shouldEnableManual ? allClassesLoading : suggestionsLoading;
  const sessionsToShow = shouldEnableManual ? manualSessions : filteredSessions;
  const isSessionsLoading = shouldEnableManual ? manualSessionsLoading : suggestionsLoading;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-red-200 overflow-hidden">
        {/* header */}
        <div className="p-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tạo lịch học bù</h2>
                <div className="text-sm text-gray-600">
                  Chọn học viên → makeup credit → lớp nguồn → gợi ý hoặc chọn thủ công
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-red-300 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="p-6 space-y-6 bg-gradient-to-b from-white to-red-50/20">
          {error && <Banner kind="error" text={error} />}

          {/* Student */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-800">Học viên</div>
            <div className="relative">
              <select
                className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
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
                }}
              >
                <option value="">{studentsLoading ? "Đang tải học viên..." : "Chọn học viên"}</option>
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {studentsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
              </div>
            </div>
          </div>

          {/* Credit + Target class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">Makeup credit</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-60 cursor-pointer"
                  value={payload.makeupCreditId}
                  disabled={!payload.studentProfileId || creditsLoading}
                  onChange={(e) => {
                    const creditId = e.target.value;
                    setPayload((p) => ({
                      ...p,
                      makeupCreditId: creditId,
                      fromClassId: "",
                      targetClassId: "",
                      targetSessionId: "",
                      // giữ date/time nếu user đã chọn; nếu chưa thì effect credit sẽ set default theo sourceSession
                      date: p.date,
                      time: p.time,
                    }));
                  }}
                >
                  <option value="">
                    {!payload.studentProfileId
                      ? "Chọn học viên trước"
                      : creditsLoading
                        ? "Đang tải makeup credit..."
                        : creditOptions.length
                          ? "Chọn makeup credit"
                          : "Không có credit"}
                  </option>
                  {creditOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {creditsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>
              <div className="text-xs text-gray-500">Chọn makeup credit để hiện lớp nguồn & gọi suggestions.</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">Lớp học bù (đích)</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-60 cursor-pointer"
                  value={payload.targetClassId}
                  disabled={!payload.makeupCreditId || isClassLoading}
                  onChange={(e) =>
                    setPayload((p) => ({
                      ...p,
                      targetClassId: e.target.value,
                      targetSessionId: "",
                    }))
                  }
                >
                  <option value="">
                    {!payload.makeupCreditId
                      ? "Chọn makeup credit trước"
                      : isClassLoading
                        ? shouldEnableManual
                          ? "Đang tải lớp học..."
                          : "Đang tải gợi ý..."
                        : classOptionsToShow.length
                          ? shouldEnableManual
                            ? "Chọn lớp bất kỳ"
                            : "Chọn lớp bù"
                          : shouldEnableManual
                            ? "Chưa có lớp để chọn"
                            : "Chưa có gợi ý"}
                  </option>
                  {classOptionsToShow.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {isClassLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {shouldEnableManual ? (
                  <>Không có gợi ý, bạn có thể chọn lớp bất kỳ để bù.</>
                ) : (
                  <>
                    Suggestions đang filter theo: <b>makeupDate={payload.date || "(chưa chọn)"}</b>,{" "}
                    <b>timeOfDay={deriveTimeOfDay(payload.time) || "(n/a)"}</b>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Source class + session */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">Lớp nguồn</div>
              <div className="p-3 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-red-100/50">
                <div className="text-sm text-gray-700 min-h-[44px] flex items-center">
                  {payload.makeupCreditId
                    ? sourceClassDisplay(sourceSession) ||
                      (sourceSessionLoading ? "Đang lấy lớp nguồn..." : "Không có dữ liệu lớp nguồn")
                    : "Chọn makeup credit để hiện lớp nguồn"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">Buổi học bù</div>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-60 cursor-pointer"
                  value={payload.targetSessionId}
                  disabled={!payload.targetClassId || isSessionsLoading}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const chosen = sessionsToShow.find((s: any) => suggestionSessionId(s) === sid);

                    const planned = chosen ? suggestionPlannedDatetime(chosen) : "";
                    let nextDate = payload.date;
                    let nextTime = payload.time;

                    if (planned) {
                      const d = new Date(planned);
                      if (!Number.isNaN(d.getTime())) {
                        nextDate = toDateInputValue(d);
                        nextTime = toTimeInputValue(d);
                      }
                    }

                    setPayload((p) => ({
                      ...p,
                      targetSessionId: sid,
                      date: nextDate,
                      time: nextTime,
                    }));
                  }}
                >
                  <option value="">
                    {!payload.targetClassId
                      ? "Chọn lớp bù trước"
                      : isSessionsLoading
                        ? "Đang tải buổi học..."
                        : sessionsToShow.length
                          ? shouldEnableManual
                            ? "Chọn buổi học bất kỳ"
                            : "Chọn buổi học bù"
                          : "Không có buổi học"}
                  </option>

                  {sessionsToShow.map((s: any) => {
                    const id = suggestionSessionId(s);
                    const code = suggestionClassCode(s);
                    const name = suggestionClassName(s);
                    const planned = suggestionPlannedDatetime(s);
                    const label = [
                      [code, name].filter(Boolean).join(" - "),
                      planned ? formatDateTimeVN(planned) : "",
                    ]
                      .filter(Boolean)
                      .join(" • ");
                    return (
                      <option key={id} value={id}>
                        {label || id}
                      </option>
                    );
                  })}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {isSessionsLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>
            </div>
          </div>

          {/* Date & time (đổi date/time sẽ refetch suggestions vì useEffect) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={16} className="text-red-600" />
                Ngày học bù (makeupDate)
              </div>
              <input
                type="date"
                className="h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
                value={payload.date}
                onChange={(e) =>
                  setPayload((p) => ({
                    ...p,
                    date: e.target.value,
                    targetClassId: "",
                    targetSessionId: "",
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={16} className="text-red-600" />
                Giờ (derive timeOfDay)
              </div>
              <input
                type="time"
                className="h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
                value={payload.time}
                onChange={(e) =>
                  setPayload((p) => ({
                    ...p,
                    time: e.target.value,
                    targetClassId: "",
                    targetSessionId: "",
                  }))
                }
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-800">Ghi chú (tuỳ chọn)</div>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text"
              value={payload.note ?? ""}
              onChange={(e) => setPayload((p) => ({ ...p, note: e.target.value }))}
              placeholder="Nhập ghi chú..."
            />
          </div>

          {/* footer */}
          <div className="pt-4 border-t border-red-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-700 font-medium hover:bg-red-50 transition-all disabled:opacity-60 cursor-pointer"
            >
              Hủy
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-70 cursor-pointer"
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

          <div className="text-xs text-gray-500 p-3 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100/30">
            *Gợi ý lớp/buổi học bù (suggestions) phụ thuộc <b>makeupDate</b> + <b>timeOfDay</b>. Nếu không có gợi ý, bạn có
            thể chọn lớp/buổi bất kỳ.
          </div>
        </div>
      </div>
    </div>
  );
}