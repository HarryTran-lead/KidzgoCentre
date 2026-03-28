"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  X,
  Calendar,
  Clock,
  ChevronDown,
} from "lucide-react";

import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

import {
  getMakeupCreditStudents,
  getMakeupCreditById,
  getMakeupCreditsByStudent,
  getMakeupCreditAvailableSessions,
} from "@/lib/api/makeupCreditService";
import { resolveMakeupCreditActionError } from "@/lib/makeupCreditErrors";
import type { StudentClass } from "@/types/student/class";

import type { MakeupCredit, MakeupCreditStudent, MakeupSuggestion } from "@/types/makeupCredit";

export type CreateMakeupPayload = {
  studentProfileId: string;
  makeupCreditId: string;

  fromClassId: string;
  targetClassId: string;
  targetSessionId: string;
};

type MakeupFormState = CreateMakeupPayload & {
  date: string;
  time: string;
  note?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateMakeupPayload) => Promise<void> | void;
  lockedStudentProfileId?: string | null;
  lockedStudentLabel?: string | null;
  allowManualFallback?: boolean;
  initialMakeupCreditId?: string | null;
  preferredTargetClassId?: string | null;
  preferredTargetClassLabel?: string | null;
  excludedSessionId?: string | null;
  initialTargetSessionDateTime?: string | null;
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

const formatDateVN = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
const creditSourceSessionDate = (c: MakeupCredit) =>
  (pickValue(c, ["sourceSessionDate", "sessionDate"]) as string | undefined) ?? "";
const creditClassName = (c: MakeupCredit) =>
  (pickValue(c, ["className", "classTitle", "sourceClassName"]) as string | undefined) ?? "";
const creditCreatedAt = (c: MakeupCredit) =>
  (pickValue(c, ["createdAt", "createdDate"]) as string | undefined) ?? "";
const creditExpiresAt = (c: MakeupCredit) =>
  (pickValue(c, ["expiresAt", "expiredAt", "expiryDate"]) as string | undefined) ?? "";

const creditStatusLabel = (status: string) => {
  const normalized = String(status ?? "").trim().toUpperCase();
  if (!normalized || normalized.includes("AVAILABLE") || normalized.includes("ACTIVE")) {
    return "Co the xep lich";
  }
  if (normalized.includes("USED") || normalized.includes("CONSUMED")) {
    return "Da xep lich";
  }
  if (normalized.includes("EXPIRE")) {
    return "Da het han";
  }
  if (normalized.includes("CANCEL")) {
    return "Da huy";
  }
  return normalized;
};

const creditClassLabel = (credit: MakeupCredit, sourceDetail?: SessionDetail | null) => {
  const explicitClass = creditClassName(credit);
  if (explicitClass) return explicitClass;
  if (!sourceDetail) return "";
  return [sourceDetail.classCode, sourceDetail.classTitle].filter(Boolean).join(" - ");
};

const isUsableCredit = (c: MakeupCredit) => {
  const st = creditStatus(c);
  return !st || st.includes("AVAILABLE") || st.includes("ACTIVE");
};

const isSelectableCredit = (c: MakeupCredit, pinnedCreditId?: string | null) => {
  const id = creditId(c);
  if (pinnedCreditId && id === pinnedCreditId) return true;
  return isUsableCredit(c);
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
  ]) as string | undefined) ?? "";

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
  const base = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    23,
    59,
    59
  );
  return `${toDateInputValue(base)}T23:59:59+07:00`;
};

const plusDaysInputValue = (dateStr: string | undefined, days: number) => {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
};

const normalizeSessions = (raw: any[]): any[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean);
};

const toArrayIfAny = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  return [];
};

const extractClassItems = (api: any): any[] => {
  return toArrayIfAny(
    api?.items ??
      api?.classes?.items ??
      api?.classes ??
      api?.data?.items ??
      api?.data?.classes?.items ??
      api?.data?.classes ??
      api
  );
};

const extractSessionItems = (api: any): any[] => {
  return toArrayIfAny(
    api?.sessions?.items ??
      api?.sessions ??
      api?.items ??
      api?.data?.sessions?.items ??
      api?.data?.sessions ??
      api?.data?.items ??
      api
  );
};

const fetchTimetableSessions = async ({
  classId,
  from,
  to,
}: {
  classId?: string;
  from?: string;
  to?: string;
}) => {
  const params = new URLSearchParams();
  if (classId) params.set("classId", classId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await get<any>(`${TEACHER_ENDPOINTS.TIMETABLE}?${params.toString()}`);
  const api = unwrap(res);
  const list = extractSessionItems(api);
  return normalizeSessions(list);
};

/* ================= component ================= */

export default function MakeupSessionCreateModal({
  open,
  onClose,
  onCreate,
  lockedStudentProfileId = null,
  lockedStudentLabel = null,
  allowManualFallback = true,
  initialMakeupCreditId = null,
  preferredTargetClassId = null,
  preferredTargetClassLabel = null,
  excludedSessionId = null,
  initialTargetSessionDateTime = null,
}: Props) {
  const isChangeMode = !!initialMakeupCreditId;
  const shouldLoadSessionsFirst = isChangeMode;
  const lockedTargetClassId: string | null = null;
  const lockedTargetClassLabel = preferredTargetClassLabel;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [students, setStudents] = useState<MakeupCreditStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [credits, setCredits] = useState<MakeupCredit[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const [sourceSession, setSourceSession] = useState<SessionDetail | null>(null);
  const [sourceSessionLoading, setSourceSessionLoading] = useState(false);
  const [creditSourceSessions, setCreditSourceSessions] = useState<Map<string, SessionDetail>>(
    new Map()
  );

  const [suggestions, setSuggestions] = useState<MakeupSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [allClasses, setAllClasses] = useState<StudentClass[]>([]);
  const [allClassesLoading, setAllClassesLoading] = useState(false);

  const [manualSessions, setManualSessions] = useState<any[]>([]);
  const [manualFallbackSessions, setManualFallbackSessions] = useState<any[]>([]);
  const [manualSessionsLoading, setManualSessionsLoading] = useState(false);

  const [payload, setPayload] = useState<MakeupFormState>({
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
    setStep(1);
    setStudents([]);
    setCredits([]);
    setSourceSession(null);
    setCreditSourceSessions(new Map());
    setSuggestions([]);
    setAllClasses([]);
    setManualSessions([]);
    setManualFallbackSessions([]);
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

  useEffect(() => {
    if (!open || !lockedStudentProfileId) return;

    setPayload((prev) => {
      if (prev.studentProfileId === lockedStudentProfileId) {
        return prev;
      }

      return {
        ...prev,
        studentProfileId: lockedStudentProfileId,
        makeupCreditId: "",
        fromClassId: "",
        targetClassId: "",
        targetSessionId: "",
        date: "",
        time: "",
      };
    });
  }, [open, lockedStudentProfileId]);

  useEffect(() => {
    if (!open || !initialMakeupCreditId) return;

    const targetDate =
      !shouldLoadSessionsFirst && initialTargetSessionDateTime
        ? new Date(initialTargetSessionDateTime)
        : null;
    const nextDate =
      targetDate && !Number.isNaN(targetDate.getTime()) ? toDateInputValue(targetDate) : "";
    const nextTime =
      targetDate && !Number.isNaN(targetDate.getTime()) ? toTimeInputValue(targetDate) : "";

    setPayload((prev) => ({
      ...prev,
      makeupCreditId: initialMakeupCreditId,
      targetClassId: preferredTargetClassId ?? prev.targetClassId,
      targetSessionId: "",
      date: shouldLoadSessionsFirst ? "" : nextDate || prev.date,
      time: shouldLoadSessionsFirst ? "" : nextTime || prev.time,
    }));
    setStep(2);
  }, [
    open,
    initialMakeupCreditId,
    preferredTargetClassId,
    initialTargetSessionDateTime,
    shouldLoadSessionsFirst,
  ]);

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
    if (lockedStudentProfileId) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }

    const run = async () => {
      setStudentsLoading(true);
      setError(null);
      try {
        const res = await getMakeupCreditStudents();
        const api = unwrap(res);
        const list = (api?.items ?? api?.students ?? api) as any[];
        setStudents(Array.isArray(list) ? list : []);
      } catch {
        setError("Không thể tải danh sách học viên có quyền học bù.");
      } finally {
        setStudentsLoading(false);
      }
    };

    run();
  }, [open, lockedStudentProfileId]);

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
      setCreditSourceSessions(new Map());
      setSuggestions([]);
      setAllClasses([]);
      setManualSessions([]);
      setManualFallbackSessions([]);

      setPayload((p) => ({
        ...p,
        makeupCreditId: initialMakeupCreditId ?? "",
        fromClassId: "",
        targetClassId: preferredTargetClassId ?? "",
        targetSessionId: "",
        date:
          shouldLoadSessionsFirst || !initialTargetSessionDateTime
            ? ""
            : toDateInputValue(new Date(initialTargetSessionDateTime)),
        time:
          shouldLoadSessionsFirst || !initialTargetSessionDateTime
            ? ""
            : toTimeInputValue(new Date(initialTargetSessionDateTime)),
      }));

      try {
        const res = await getMakeupCreditsByStudent(payload.studentProfileId);
        const api = unwrap(res);
        const list = (api?.items ?? api?.credits ?? api) as any[];
        const arr = Array.isArray(list) ? (list as MakeupCredit[]) : [];
        const nextCredits = [...arr];

        if (
          initialMakeupCreditId &&
          !arr.some((credit) => creditId(credit) === initialMakeupCreditId)
        ) {
          try {
            const detailRes = await getMakeupCreditById(initialMakeupCreditId);
            const detail = unwrap(detailRes) as MakeupCredit | null;
            if (detail && creditId(detail)) {
              nextCredits.unshift(detail);
            }
          } catch {
            // Keep the reschedule flow usable even if the detail endpoint fails.
          }
        }

        const deduped = Array.from(
          new Map(
            nextCredits
              .filter((credit) => creditId(credit))
              .map((credit) => [creditId(credit), credit] as const)
          ).values()
        );

        setCredits(deduped.filter((credit) => isSelectableCredit(credit, initialMakeupCreditId)));
      } catch {
        setError("Không thể tải danh sách quyền học bù của học viên.");
      } finally {
        setCreditsLoading(false);
      }
    };

    run();
  }, [
    open,
    payload.studentProfileId,
    initialMakeupCreditId,
    preferredTargetClassId,
    initialTargetSessionDateTime,
    shouldLoadSessionsFirst,
  ]);

  // prefetch source session detail for credit list
  useEffect(() => {
    if (!open) return;
    if (!credits.length) return;

    let alive = true;
    const run = async () => {
      const ids = Array.from(
        new Set(
          credits
            .map((c) => creditSourceSessionId(c))
            .filter((id) => typeof id === "string" && id.trim().length > 0)
        )
      );

      if (!ids.length) {
        if (alive) setCreditSourceSessions(new Map());
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const detail = await getSessionById(id);
            return detail ? ([id, detail] as const) : null;
          } catch {
            return null;
          }
        })
      );

      if (!alive) return;

      const map = new Map<string, SessionDetail>();
      results.filter(Boolean).forEach((pair) => {
        const [id, detail] = pair as [string, SessionDetail];
        map.set(id, detail);
      });
      setCreditSourceSessions(map);
    };

    run();

    return () => {
      alive = false;
    };
  }, [credits, open]);

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
        targetClassId: preferredTargetClassId ?? "",
        targetSessionId: "",
      }));

      try {
        const s = await getSessionById(sourceId);
        setSourceSession(s);
        setPayload((p) => {
          if (shouldLoadSessionsFirst) {
            return {
              ...p,
              fromClassId: s?.classId ?? "",
            };
          }

          return {
            ...p,
            fromClassId: s?.classId ?? "",
          // nếu user chưa chọn date/time thì set default theo plannedDatetime để suggestions có input
          date: p.date || (s?.plannedDatetime ? toDateInputValue(new Date(s.plannedDatetime)) : ""),
          time: p.time || (s?.plannedDatetime ? toTimeInputValue(new Date(s.plannedDatetime)) : ""),
          };
        });
      } catch {
        // ignore
      } finally {
        setSourceSessionLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload.makeupCreditId, preferredTargetClassId, shouldLoadSessionsFirst]);

  // Lấy danh sách buổi bù khả dụng theo đúng contract hiện tại của module makeup.
  useEffect(() => {
    if (!open) return;
    if (!payload.makeupCreditId) return;
    if (!shouldLoadSessionsFirst && !payload.date) return;

    const timeOfDay = shouldLoadSessionsFirst ? undefined : deriveTimeOfDay(payload.time);

    const run = async () => {
      setSuggestionsLoading(true);
      setError(null);
      try {
        const res = await getMakeupCreditAvailableSessions(
          payload.makeupCreditId,
          shouldLoadSessionsFirst
            ? undefined
            : {
                fromDate: payload.date,
                toDate: plusDaysInputValue(payload.date, 7),
                timeOfDay,
              }
        );

        const api = unwrap(res);
        const list = (api?.items ?? api?.suggestions ?? api) as any[];
        setSuggestions(normalizeSuggestions(Array.isArray(list) ? list : []));
      } catch {
        setError("Không thể tải danh sách buổi học bù khả dụng.");
      } finally {
        setSuggestionsLoading(false);
      }
    };

    run();
  }, [open, payload.makeupCreditId, payload.date, payload.time, shouldLoadSessionsFirst]);

  const shouldEnableManual = useMemo(() => {
    if (!allowManualFallback) return false;
    if (!payload.makeupCreditId) return false;
    if (suggestionsLoading) return false;
    return suggestions.length === 0;
  }, [allowManualFallback, payload.makeupCreditId, suggestionsLoading, suggestions.length]);

  // load classes + session pool for manual selection when no suggestions
  useEffect(() => {
    if (!open) return;
    if (!shouldEnableManual) return;

    const run = async () => {
      setAllClassesLoading(true);
      setError(null);
      try {
        const classesRes = await get<any>("/api/classes?pageNumber=1&pageSize=200");
        const api = unwrap(classesRes);
        const list = extractClassItems(api);
        setAllClasses(list as StudentClass[]);
      } catch {
        setError("Không thể tải danh sách lớp để chọn thủ công.");
      }

      try {
        const fallbackSessions = await fetchTimetableSessions({
          from: toISODateStart(payload.date),
          to: toISODateEnd(plusDaysInputValue(payload.date, 90)),
        });
        setManualFallbackSessions(Array.isArray(fallbackSessions) ? fallbackSessions : []);
      } catch {
        // Không block manual class dropdown nếu endpoint buổi học bị giới hạn quyền.
        setManualFallbackSessions([]);
      } finally {
        setAllClassesLoading(false);
      }
    };

    run();
  }, [open, shouldEnableManual, payload.date]);

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
        const sessionsFromPool = manualFallbackSessions.filter(
          (s: any) => suggestionClassId(s) === payload.targetClassId
        );
        if (sessionsFromPool.length > 0) {
          setManualSessions(sessionsFromPool);
          return;
        }

        // Ưu tiên ngày user đang chọn; nếu trống thì fallback mở rộng để user vẫn thấy các buổi tự do khác.
        const selectedDateSessions = await fetchTimetableSessions({
          classId: payload.targetClassId,
          from: toISODateStart(payload.date),
          to: toISODateEnd(payload.date),
        });

        if (selectedDateSessions.length > 0) {
          setManualSessions(selectedDateSessions);
          return;
        }

        const startDate = payload.date ? new Date(payload.date) : new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 90);

        const expandedSessions = await fetchTimetableSessions({
          classId: payload.targetClassId,
          from: toISODateStart(toDateInputValue(startDate)),
          to: toISODateEnd(toDateInputValue(endDate)),
        });

        setManualSessions(expandedSessions);
      } catch {
        setError("Không thể tải danh sách buổi học để chọn thủ công.");
      } finally {
        setManualSessionsLoading(false);
      }
    };

    run();
  }, [open, shouldEnableManual, payload.targetClassId, payload.date, manualFallbackSessions]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      const id = getStudentId(s);
      if (!id) return;
      if (!map.has(id)) map.set(id, getStudentName(s));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  const selectedStudentName = useMemo(() => {
    if (!payload.studentProfileId) return "";
    if (lockedStudentProfileId && payload.studentProfileId === lockedStudentProfileId) {
      return lockedStudentLabel ?? lockedStudentProfileId;
    }
    return (
      studentOptions.find((s) => s.id === payload.studentProfileId)?.name ?? payload.studentProfileId
    );
  }, [lockedStudentLabel, lockedStudentProfileId, payload.studentProfileId, studentOptions]);

  // ✅ FIX TOÀN BỘ TEXT BỊ LỖI TRONG CREDIT LABEL
  const creditOptions = useMemo(() => {
    return credits.map((c) => {
      const id = creditId(c);
      const expires = formatDateVN(creditExpiresAt(c));
      const srcId = creditSourceSessionId(c);

      const srcDetail = srcId ? creditSourceSessions.get(srcId) : undefined;
      const classText = creditClassLabel(c, srcDetail);
      const sourceDate =
        (srcDetail?.plannedDatetime ? formatDateVN(srcDetail.plannedDatetime) : "") ||
        formatDateVN(creditSourceSessionDate(c));
      const status = [
        creditStatusLabel(creditStatus(c) || "AVAILABLE"),
        sourceDate ? `Buoi nghi: ${sourceDate}` : "",
      ]
        .filter(Boolean)
        .join(" • ");
      const className = classText;
      const srcClassText = "";
      const created = sourceDate ? "" : formatDateVN(creditCreatedAt(c));
      const src: string = "";

      const detailParts = [
        src ? `Source: ${src.slice(0, 8)}…` : "",
        className ? `Lớp: ${className}` : srcClassText ? `Lớp: ${srcClassText}` : "",
        created ? `Tạo: ${created}` : "",
        expires ? `Hết hạn: ${expires}` : "",
      ].filter(Boolean);

      return {
        id,
        label: `${status}${detailParts.length ? ` • ${detailParts.join(" • ")}` : ""}`,
        raw: c,
      };
    });
  }, [credits, creditSourceSessions]);

  const selectedCreditLabel = useMemo(() => {
    if (!payload.makeupCreditId) return "";
    return creditOptions.find((c) => c.id === payload.makeupCreditId)?.label ?? "";
  }, [creditOptions, payload.makeupCreditId]);

  const selectedCreditSummary = useMemo(() => {
    if (!payload.makeupCreditId) return null;

    const credit = credits.find((item) => creditId(item) === payload.makeupCreditId);
    if (!credit) return null;

    const sourceId = creditSourceSessionId(credit);
    const sourceDetail = sourceId ? creditSourceSessions.get(sourceId) : undefined;

    return {
      status: creditStatusLabel(creditStatus(credit) || "AVAILABLE"),
      sourceDate: sourceDetail?.plannedDatetime
        ? formatDateTimeVN(sourceDetail.plannedDatetime)
        : formatDateVN(creditSourceSessionDate(credit)),
      classText: creditClassLabel(credit, sourceDetail),
      created: formatDateVN(creditCreatedAt(credit)),
      expires: formatDateVN(creditExpiresAt(credit)),
    };
  }, [creditSourceSessions, credits, payload.makeupCreditId]);

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

    manualFallbackSessions.forEach((s: any) => {
      const id = suggestionClassId(s);
      if (!id || map.has(id)) return;
      const code = suggestionClassCode(s);
      const name = suggestionClassName(s);
      map.set(id, [code, name].filter(Boolean).join(" - ") || id);
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allClasses, manualFallbackSessions]);

  const filteredSessions = useMemo(() => {
    if (!payload.targetClassId) return [];
    return suggestions.filter(
      (s: any) =>
        suggestionClassId(s) === payload.targetClassId &&
        suggestionSessionId(s) !== excludedSessionId
    );
  }, [suggestions, payload.targetClassId, excludedSessionId]);

  const canSubmit = useMemo(() => {
    return (
      payload.studentProfileId &&
      payload.makeupCreditId &&
      payload.targetClassId &&
      payload.targetSessionId &&
      payload.date &&
      payload.time
    );
  }, [payload]);

  useEffect(() => {
    if (!open) return;
    if (!targetClassOptions.length) return;

    setPayload((prev) => {
      if (
        prev.targetClassId &&
        targetClassOptions.some((option) => option.id === prev.targetClassId)
      ) {
        return prev;
      }

      const nextClassId =
        (preferredTargetClassId &&
        targetClassOptions.some((option) => option.id === preferredTargetClassId)
          ? preferredTargetClassId
          : null) ??
        (targetClassOptions.length === 1 ? targetClassOptions[0]?.id : null);

      if (!nextClassId || nextClassId === prev.targetClassId) {
        return prev;
      }

      return {
        ...prev,
        targetClassId: nextClassId,
        targetSessionId: "",
      };
    });
  }, [open, preferredTargetClassId, targetClassOptions]);

  const canGoStep2 = !!payload.studentProfileId && !!payload.makeupCreditId;
  const canGoStep3 = canSubmit;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        studentProfileId: payload.studentProfileId,
        makeupCreditId: payload.makeupCreditId,
        fromClassId: payload.fromClassId,
        targetClassId: payload.targetClassId,
        targetSessionId: payload.targetSessionId,
      });
      onClose();
    } catch (err: any) {
      const description = resolveMakeupCreditActionError(
        err,
        isChangeMode ? "change" : "create"
      );
      setError(description);
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
                <h2 className="text-xl font-bold text-gray-900">
                  {isChangeMode ? "Thay đổi lịch xếp học bù" : "Tạo lịch học bù"}
                </h2>
                <div className="text-sm text-gray-600">
                  Bước {step}/3 • Chọn buổi nghỉ • Chọn buổi bù • Xác nhận
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

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-800">Bước 1 • Chọn học viên</div>
                {lockedStudentProfileId ? (
                  <div className="flex h-11 items-center rounded-xl border border-red-300 bg-white px-4 text-sm font-medium text-gray-800">
                    {selectedStudentName || "Học viên đã chọn"}
                  </div>
                ) : (
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
                        setStep(1);
                      }}
                    >
                      <option value="">
                        {studentsLoading ? "Đang tải học viên..." : "Chọn học viên"}
                      </option>
                      {studentOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {studentsLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-800">Bước 1 • Chọn buổi nghỉ cần xếp học bù</div>
                {isChangeMode ? (
                  <div className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-gray-800">
                    {selectedCreditLabel || "Đang tải thông tin buổi nghỉ..."}
                  </div>
                ) : (
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-60 cursor-pointer"
                    value={payload.makeupCreditId}
                    disabled={!payload.studentProfileId || creditsLoading}
                    onChange={(e) => {
                      const creditIdValue = e.target.value;
                      setPayload((p) => ({
                        ...p,
                        makeupCreditId: creditIdValue,
                        fromClassId: "",
                        targetClassId: preferredTargetClassId ?? "",
                        targetSessionId: "",
                        date: p.date,
                        time: p.time,
                      }));
                    }}
                  >
                    <option value="">
                      {!payload.studentProfileId
                        ? "Chọn học viên trước"
                        : creditsLoading
                          ? "Đang tải danh sách buổi nghỉ..."
                          : creditOptions.length
                            ? "Chọn buổi nghỉ cần xếp học bù"
                            : "Chưa có quyền học bù khả dụng"}
                    </option>
                    {creditOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {creditsLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                  {/*
                      NgÃ y vÃ  giá» sáº½ tá»± cáº­p nháº­t sau khi báº¡n chá»n buá»•i há»c bÃ¹.
                    </div>
                  ) : null}
                  */}
                </div>
                )}

                <div className="p-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 text-sm text-gray-700">
                  {payload.makeupCreditId
                    ? selectedCreditSummary
                      ? [
                          `Trạng thái: ${selectedCreditSummary.status}`,
                          selectedCreditSummary.sourceDate
                            ? `Buổi nghỉ gốc: ${selectedCreditSummary.sourceDate}`
                            : "",
                          selectedCreditSummary.classText
                            ? `Lớp nghỉ: ${selectedCreditSummary.classText}`
                            : sourceClassDisplay(sourceSession),
                          selectedCreditSummary.expires
                            ? `Hạn dùng: ${selectedCreditSummary.expires}`
                            : "",
                          !selectedCreditSummary.sourceDate && selectedCreditSummary.created
                            ? `Cấp ngày: ${selectedCreditSummary.created}`
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" • ")
                      : sourceSessionLoading
                        ? "Đang tải thông tin buổi nghỉ..."
                        : "Không có dữ liệu buổi nghỉ gốc"
                    : "Chọn buổi nghỉ cần xếp học bù để xem chi tiết"}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar size={16} className="text-red-600" />
                    Ngày học bù
                  </div>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                    value={payload.date}
                    disabled={shouldLoadSessionsFirst}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        date: e.target.value,
                        targetClassId: preferredTargetClassId ?? "",
                        targetSessionId: "",
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Clock size={16} className="text-red-600" />
                    Giờ dự kiến
                  </div>
                  <input
                    type="time"
                    className="h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                    value={payload.time}
                    disabled={shouldLoadSessionsFirst}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        time: e.target.value,
                        targetClassId: preferredTargetClassId ?? "",
                        targetSessionId: "",
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-800">Bước 2 • Chọn lớp bù</div>
                  {lockedTargetClassId ? (
                    <div className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-gray-800">
                      {lockedTargetClassLabel || classOptionsToShow[0]?.label || lockedTargetClassId}
                    </div>
                  ) : (
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
                            ? "Chọn buổi nghỉ trước"
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
                        {isClassLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {isChangeMode && !shouldEnableManual ? (
                      <>Chỉ hiển thị các buổi thuộc chương trình bù đã được xếp cho credit này.</>
                    ) : shouldEnableManual ? (
                      <>Không có gợi ý, bạn có thể chọn lớp bất kỳ để bù.</>
                    ) : (
                      <>
                        Gợi ý theo: <b>ngày {payload.date || "(chưa chọn)"}</b>,{" "}
                        <b>buổi {deriveTimeOfDay(payload.time) || "(n/a)"}</b>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-800">Bước 2 • Chọn buổi bù</div>
                  <div className="relative">
                    <select
                      className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-60 cursor-pointer"
                      value={payload.targetSessionId}
                      disabled={!payload.targetClassId || isSessionsLoading}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const chosen = sessionsToShow.find((s: any) => suggestionSessionId(s) === sid);
                        const chosenClassId = chosen ? suggestionClassId(chosen) : payload.targetClassId;

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
                          targetClassId: chosenClassId || p.targetClassId,
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
                      {isSessionsLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!suggestionsLoading &&
              !shouldLoadSessionsFirst &&
              !allowManualFallback &&
              payload.makeupCreditId &&
              (shouldLoadSessionsFirst || payload.date) &&
              suggestions.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Hiện chưa có buổi học bù phù hợp theo điều kiện hệ thống. Bạn có thể đổi ngày hoặc giờ để xem gợi ý
                  khác.
                </div>
              ) : null}
              {!suggestionsLoading &&
              shouldLoadSessionsFirst &&
              !allowManualFallback &&
              payload.makeupCreditId &&
              suggestions.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Hien chua co buoi nao khac con slot trong cung chuong trinh bu nay de thay doi.
                </div>
              ) : null}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-white p-4 space-y-2 text-sm text-gray-700">
                <div className="font-semibold text-gray-900">Xác nhận lịch bù</div>
                <div>
                  Học viên: <b>{selectedStudentName || "?"}</b>
                </div>
                <div>
                  Credit: <b>{selectedCreditLabel || "?"}</b>
                </div>
                <div>
                  Lớp nguồn: <b>{sourceClassDisplay(sourceSession) || "?"}</b>
                </div>
                <div>
                  Lớp bù: <b>{payload.targetClassId || "?"}</b>
                </div>
                <div>
                  Buổi bù: <b>{payload.targetSessionId || "?"}</b>
                </div>
                <div>
                  Ngày/Giờ:{" "}
                  <b>
                    {payload.date || "?"} {payload.time || ""}
                  </b>
                </div>
              </div>

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
            </div>
          )}

          {/* footer */}
          <div className="pt-4 border-t border-red-200 flex items-center justify-end gap-3">
            {step > (isChangeMode ? 2 : 1) && (
              <button
                onClick={() =>
                  setStep((s) => {
                    if (isChangeMode) {
                      return s <= 2 ? 2 : ((s - 1) as 2 | 3);
                    }
                    return s === 1 ? 1 : ((s - 1) as 1 | 2 | 3);
                  })
                }
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-red-300 bg-white text-gray-700 font-medium hover:bg-red-50 transition-all disabled:opacity-60 cursor-pointer"
              >
                Quay lại
              </button>
            )}

            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-700 font-medium hover:bg-red-50 transition-all disabled:opacity-60 cursor-pointer"
            >
              Huỷ
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as 1 | 2 | 3)))}
                disabled={(step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-70 cursor-pointer"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-70 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {isChangeMode ? "Thay đổi lịch xếp" : "Tạo lịch bù"}
                  </>
                )}
              </button>
            )}
          </div>

          {step === 2 && !shouldLoadSessionsFirst && (
            <div className="text-xs text-gray-500 p-3 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100/30">
              Gợi ý buổi bù phụ thuộc <b>ngày</b> + <b>buổi</b>. Nếu không có gợi ý, bạn có thể chọn
              lớp/buổi bất kỳ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
