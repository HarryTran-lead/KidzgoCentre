/**
 * Teacher Classes API Helper Functions
 * 
 * This file provides type-safe helper functions for teacher classes API calls.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import type {
  EnrollmentApiResponse,
  EnrollmentApiItem,
  ClassItem,
  Track,
  FetchClassesParams,
  FetchClassesResult,
  FetchClassDetailParams,
  FetchClassDetailResult,
  Student,
  ClassDetail,
} from "@/types/teacher/classes";

type WeeklyScheduleSlot = {
  dayOfWeek?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
};

type TeacherClassApiItem = {
  id?: string | null;
  classId?: string | null;
  classCode?: string | null;
  code?: string | null;
  classTitle?: string | null;
  title?: string | null;
  programName?: string | null;
  schedulePattern?: string | null;
  weeklyScheduleSlots?: WeeklyScheduleSlot[] | null;
  currentEnrollmentCount?: number | null;
  capacity?: number | null;
  mainTeacherName?: string | null;
  roomName?: string | null;
  plannedRoomName?: string | null;
  actualRoomName?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalSessions?: number | null;
  completedSessions?: number | null;
  progressPercent?: number | null;
};

const DAY_LABELS: Record<string, string> = {
  MO: "Thứ 2",
  TU: "Thứ 3",
  WE: "Thứ 4",
  TH: "Thứ 5",
  FR: "Thứ 6",
  SA: "Thứ 7",
  SU: "CN",
};

function buildScheduleFromWeeklySlots(slotsRaw: unknown): string {
  if (!Array.isArray(slotsRaw) || !slotsRaw.length) return "";

  const toMinutes = (time: string): number => {
    const [hour, minute] = time.split(":").map((x) => Number(x));
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  };

  const toTime = (minutesRaw: number): string => {
    const normalized = ((minutesRaw % (24 * 60)) + 24 * 60) % (24 * 60);
    const hour = Math.floor(normalized / 60);
    const minute = normalized % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const order = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

  const lines = (slotsRaw as WeeklyScheduleSlot[])
    .map((slot) => {
      const dow = String(slot?.dayOfWeek ?? "").trim().toUpperCase();
      const start = String(slot?.startTime ?? "").trim();
      if (!dow || !start) return null;

      const startMin = toMinutes(start);
      const duration = typeof slot?.durationMinutes === "number" && slot.durationMinutes > 0
        ? slot.durationMinutes
        : 90;
      const end = toTime(startMin + duration);

      const label = DAY_LABELS[dow] ?? dow;
      return { dow, text: `${label} (${start} - ${end})` };
    })
    .filter((slot): slot is { dow: string; text: string } => slot !== null)
    .sort((a, b) => order.indexOf(a.dow) - order.indexOf(b.dow));

  return lines.map((x) => x.text).join("; ");
}

function parseRRULEToSchedule(rrule: string): string {
  if (!rrule || !rrule.trim()) return "";

  try {
    const rule = rrule.replace(/^RRULE:/i, "");
    const parts: Record<string, string> = {};

    rule.split(";").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) parts[key.toUpperCase()] = value;
    });

    const freq = parts.FREQ || "";
    const byDay = parts.BYDAY || "";
    const byHour = parts.BYHOUR || "18";
    const byMinute = parts.BYMINUTE || "0";
    const duration = parseInt(parts.DURATION || "120", 10);

    if (freq !== "WEEKLY" || !byDay) return rrule;

    const dayMap: Record<string, string> = {
      MO: "Thứ 2",
      TU: "Thứ 3",
      WE: "Thứ 4",
      TH: "Thứ 5",
      FR: "Thứ 6",
      SA: "Thứ 7",
      SU: "CN",
    };

    const dayOrder = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    const days = byDay.split(",").map((d) => d.trim()).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    const dayText = days.map((d) => dayMap[d] ?? d).join(", ");

    const hour = parseInt(byHour, 10);
    const minute = parseInt(byMinute, 10);
    const startMinutes = hour * 60 + minute;
    const endMinutes = startMinutes + (Number.isFinite(duration) ? duration : 120);

    const toTime = (mins: number) => {
      const normalized = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
      const h = Math.floor(normalized / 60);
      const m = normalized % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    return `${dayText} (${toTime(startMinutes)} - ${toTime(endMinutes)})`;
  } catch {
    return rrule;
  }
}

function toReadableSchedule(raw: { schedulePattern?: string | null; weeklyScheduleSlots?: unknown }): string {
  const schedulePattern = String(raw.schedulePattern ?? "").trim();
  const slotSchedule = buildScheduleFromWeeklySlots(raw.weeklyScheduleSlots);

  if (slotSchedule) return slotSchedule;
  if (!schedulePattern) return "Chưa có lịch";
  if (schedulePattern.includes("RRULE")) return parseRRULEToSchedule(schedulePattern);
  return schedulePattern;
}

function pickRoomName(raw: any): string {
  return String(
    raw?.roomName ??
      raw?.plannedRoomName ??
      raw?.actualRoomName ??
      raw?.classRoomName ??
      raw?.room ??
      "",
  ).trim();
}

function extractTeacherTimetableItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.sessions)) return payload.data.sessions;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function parseDateOnly(value?: string | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const dateOnly = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;

  const [y, m, d] = dateOnly.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function fetchRoomFromTeacherTimetable(
  classId: string,
  first: Record<string, any>,
  classMeta: Record<string, any> | null,
  token: string,
  signal?: AbortSignal,
): Promise<string> {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 180);
  const defaultTo = new Date(now);
  defaultTo.setDate(defaultTo.getDate() + 180);

  const startDate = parseDateOnly(String(first?.startDate ?? classMeta?.startDate ?? ""));
  const endDate = parseDateOnly(String(first?.endDate ?? classMeta?.endDate ?? ""));

  let fromDate = startDate && startDate > defaultFrom ? startDate : defaultFrom;
  let toDate = endDate && endDate < defaultTo ? endDate : defaultTo;

  if (fromDate.getTime() > toDate.getTime()) {
    fromDate = defaultFrom;
    toDate = defaultTo;
  }

  const from = `${toIsoDateOnly(fromDate)}T00:00:00+07:00`;
  const to = `${toIsoDateOnly(toDate)}T23:59:59+07:00`;

  const queryParams = new URLSearchParams({ from, to });
  const res = await fetch(`${TEACHER_ENDPOINTS.TIMETABLE}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) return "";

  const json = await res.json();
  const items = extractTeacherTimetableItems(json);
  if (!items.length) return "";

  const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

  const targetClassId = normalize(classId);
  const targetCode = normalize(first?.classCode ?? first?.code ?? classMeta?.classCode ?? classMeta?.code);
  const targetTitle = normalize(first?.classTitle ?? first?.title ?? classMeta?.classTitle ?? classMeta?.title);

  const matched = items.filter((item) => {
    const itemClassId = normalize(item?.classId ?? item?.classID ?? item?.class?.id);
    if (itemClassId && itemClassId === targetClassId) return true;

    const itemCode = normalize(item?.classCode ?? item?.code);
    if (targetCode && itemCode && itemCode === targetCode) return true;

    const itemTitle = normalize(item?.classTitle ?? item?.className ?? item?.courseName ?? item?.subjectName);
    if (targetTitle && itemTitle) {
      return itemTitle === targetTitle || itemTitle.includes(targetTitle) || targetTitle.includes(itemTitle);
    }

    return false;
  });

  for (const item of matched) {
    const room = pickRoomName(item);
    if (room) return room;
  }

  return "";
}

function extractTeacherClassItems(payload: any): TeacherClassApiItem[] {
  if (Array.isArray(payload?.data?.classes?.items)) return payload.data.classes.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchTeacherClassMetaById(
  classId: string,
  token: string,
  signal?: AbortSignal,
): Promise<TeacherClassApiItem | null> {
  const pageSize = 100;

  for (let pageNumber = 1; pageNumber <= 20; pageNumber += 1) {
    const queryParams = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });

    const res = await fetch(`${TEACHER_ENDPOINTS.CLASSES}?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!res.ok) return null;

    const json = await res.json();
    const items = extractTeacherClassItems(json);
    if (!items.length) return null;

    const found = items.find((item) => {
      const itemId = String(item?.id ?? item?.classId ?? "").trim();
      return itemId === classId;
    });

    if (found) return found;
    if (items.length < pageSize) return null;
  }

  return null;
}

/**
 * Map aggregated enrollment data to ClassItem
 */
function mapApiClassToClassItem(item: any): ClassItem {
  // Extract track from programName/code/title
  const trackHint = `${item?.programName ?? ""} ${item?.classCode ?? item?.code ?? ""} ${item?.classTitle ?? item?.title ?? ""}`.toLowerCase();
  let track: Track = "IELTS";
  if (trackHint.includes("toeic")) track = "TOEIC";
  else if (trackHint.includes("business")) track = "Business";

  // Extract schedule info from schedulePattern, fallback to weeklyScheduleSlots.
  const schedulePattern = String(item?.schedulePattern ?? "").trim();
  const slotSchedule = buildScheduleFromWeeklySlots(item?.weeklyScheduleSlots);
  const schedule = schedulePattern || slotSchedule || "Chưa có lịch";

  // Room info không có trong response này, để mặc định
  const room = "Chưa có phòng";

  // Extract student count from currentEnrollmentCount
  const students = item?.currentEnrollmentCount ?? 0;
  const capacity = item?.capacity ?? 0;

  // Calculate progress based on enrollment vs capacity
  const progress = capacity > 0 ? Math.round((students / capacity) * 100) : undefined;

  // Extract teacher name
  const teacher = item?.mainTeacherName ?? undefined;

  return {
    id: String(item?.classId ?? item?.id ?? ""),
    name: item?.classTitle ?? item?.title ?? "Lớp học",
    code: item?.classCode ?? item?.code ?? "",
    track,
    students,
    schedule,
    room,
    progress,
    teacher,
  };
}

/**
 * Fetch classes for teacher
 * Uses /api/teacher/classes endpoint to get direct list of teacher's classes
 */
export async function fetchTeacherClasses(
  params: FetchClassesParams = {}
): Promise<FetchClassesResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem lớp học.");
  }

  const { pageNumber = 1, pageSize = 100 } = params;
  const queryParams = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const res = await fetch(`${TEACHER_ENDPOINTS.CLASSES}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch classes error:", res.status, text);
    throw new Error("Không thể tải danh sách lớp học từ máy chủ.");
  }

  const json = await res.json();

  // Response structure: { isSuccess: true, data: { classes: { items: [...] } } }
  let rawItems: any[] = [];
  if (json?.data?.classes?.items && Array.isArray(json.data.classes.items)) {
    rawItems = json.data.classes.items;
  } else if (json?.data?.items && Array.isArray(json.data.items)) {
    rawItems = json.data.items;
  } else if (Array.isArray(json?.data)) {
    rawItems = json.data;
  }

  console.log("Fetched classes from /api/teacher/classes:", {
    totalClasses: rawItems.length,
    pageNumber,
    sampleClass: rawItems[0],
  });

  const mappedClasses = rawItems
    .map(mapApiClassToClassItem)
    .filter((c: ClassItem) => c.id);

  return {
    classes: mappedClasses,
    totalPages: json?.data?.classes?.totalPages,
    totalCount: json?.data?.classes?.totalCount,
  };
}

/**
 * Fetch class detail with students
 * Uses enrollments API to get class information and student list
 */
export async function fetchClassDetail(
  params: FetchClassDetailParams,
  signal?: AbortSignal
): Promise<FetchClassDetailResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const { classId, pageNumber = 1, pageSize = 100 } = params;
  const queryParams = new URLSearchParams({
    classId: classId,
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const res = await fetch(`${TEACHER_ENDPOINTS.ENROLLMENTS}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch enrollments error", res.status, text);
    throw new Error("Không thể tải thông tin lớp học.");
  }

  const json: EnrollmentApiResponse = await res.json();
  let rawItems: EnrollmentApiItem[] = [];
  let classMetaFromEnrollment: Record<string, any> | null = null;

  if (json?.data && !Array.isArray(json.data)) {
    // data is an object, check for nested structure
    if (json.data.enrollments?.items && Array.isArray(json.data.enrollments.items)) {
      rawItems = json.data.enrollments.items;
    } else if (Array.isArray(json.data.items)) {
      rawItems = json.data.items;
    }

    const dataAny = json.data as any;
    if (dataAny?.class && typeof dataAny.class === "object") classMetaFromEnrollment = dataAny.class;
    else if (dataAny?.classInfo && typeof dataAny.classInfo === "object") classMetaFromEnrollment = dataAny.classInfo;
    else if (dataAny?.classDetail && typeof dataAny.classDetail === "object") classMetaFromEnrollment = dataAny.classDetail;
  } else if (Array.isArray(json?.data)) {
    rawItems = json.data;
  } else if (Array.isArray(json)) {
    rawItems = json;
  }

  const classMeta =
    classMetaFromEnrollment ??
    (await fetchTeacherClassMetaById(classId, token, signal));

  if (rawItems.length === 0 && !classMeta) {
    throw new Error("Không tìm thấy dữ liệu cho lớp này.");
  }

  const first = (rawItems[0] ?? classMeta ?? {}) as any;

  // Sử dụng thông tin từ enrollments để dựng class detail cơ bản
  const trackHint = `${first.classTitle ?? first.title ?? ""} ${first.classCode ?? first.code ?? ""} ${first.programName ?? ""}`.toLowerCase();
  let track: Track = "IELTS";
  if (trackHint.includes("toeic")) track = "TOEIC";
  else if (trackHint.includes("business")) track = "Business";

  const students: Student[] = rawItems.map((it, index) => ({
    id: String(it.studentProfileId ?? `ST${index}`),
    name: it.studentName ?? "Học viên",
    email: "",
    phone: "",
    avatar: undefined,
    attendance: 100,
    progress: 0,
    stars: 0,
    lastActive: "",
    status: "active",
  }));

  const schedule = toReadableSchedule({
    schedulePattern: String(
      first?.schedulePattern ?? classMeta?.schedulePattern ?? "",
    ),
    weeklyScheduleSlots:
      first?.weeklyScheduleSlots ?? classMeta?.weeklyScheduleSlots ?? null,
  });

  let room = pickRoomName(first) || pickRoomName(classMeta);
  if (!room) {
    room = await fetchRoomFromTeacherTimetable(classId, first, classMeta, token, signal);
  }
  if (!room) {
    room = "Chưa có phòng";
  }

  const currentEnrollmentCount = Number(
    first?.currentEnrollmentCount ?? classMeta?.currentEnrollmentCount ?? students.length,
  );
  const capacity = Number(first?.capacity ?? classMeta?.capacity ?? 0);
  const progressPercentFromApi = Number(
    first?.progressPercent ?? classMeta?.progressPercent,
  );
  const progress =
    Number.isFinite(progressPercentFromApi) && progressPercentFromApi >= 0
      ? progressPercentFromApi
      : capacity > 0
      ? Math.round((currentEnrollmentCount / capacity) * 100)
      : 0;

  const classDetail: ClassDetail = {
    id: String(first.classId ?? classId),
    name: first.classTitle ?? first.title ?? "Lớp học",
    code: first.classCode ?? first.code ?? "",
    track,
    students: Number.isFinite(currentEnrollmentCount) ? currentEnrollmentCount : students.length,
    schedule,
    room,
    progress,
    teacher: String(first.mainTeacherName ?? classMeta?.mainTeacherName ?? "").trim(),
    description: String(first.description ?? classMeta?.description ?? "").trim(),
    startDate: String(first.startDate ?? classMeta?.startDate ?? "").trim(),
    endDate: String(first.endDate ?? classMeta?.endDate ?? "").trim(),
    totalLessons: Number(first.totalSessions ?? classMeta?.totalSessions ?? 0),
    completedLessons: Number(first.completedSessions ?? classMeta?.completedSessions ?? 0),
  };

  return {
    classDetail,
    students,
  };
}
