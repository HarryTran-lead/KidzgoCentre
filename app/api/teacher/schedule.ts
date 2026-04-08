/**
 * Teacher Schedule API Helper Functions
 *
 * This file provides type-safe helper functions for teacher schedule API calls.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import type {
  TimetableApiResponse,
  TimetableApiItem,
  Lesson,
  DaySchedule,
  Track,
  FetchTimetableParams,
  FetchTimetableResult,
} from "@/types/teacher/schedule";

/**
 * Lay thu (Tieng Viet) tu Date
 */
function getVietnameseDow(date: Date): string {
  const day = date.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
  if (day === 0) return 'Chủ nhật';
  return `Thứ ${day}`;
}

/**
 * Format yyyy-mm-dd tu Date
 */
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse ISO datetime string thanh Date object ma khong bi anh huong boi timezone.
 * Trich xuat truc tiep cac thanh phan tu chuoi ISO string.
 */
function parseISODateTime(isoString: string): Date {
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return new Date(
      parseInt(match[1]),
      parseInt(match[2]) - 1,
      parseInt(match[3]),
      parseInt(match[4]),
      parseInt(match[5]),
      parseInt(match[6])
    );
  }
  return new Date(isoString);
}

/**
 * Map du lieu API timetable -> Lesson + date
 */
function mapApiLessonToLesson(item: TimetableApiItem, fallbackDate: string, index: number): { date: string; lesson: Lesson } {
  const plannedDatetime: string | undefined = item?.plannedDatetime ?? undefined;
  const durationMinutesRaw: number | undefined = item?.durationMinutes ?? undefined;

  if (typeof plannedDatetime === 'string') {
    // Parse truc tiep tu ISO string de tranh van de timezone (giong admin schedule)
    const startDate = parseISODateTime(plannedDatetime);

    // Get date string (yyyy-mm-dd)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    // Get time string (HH:mm)
    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');
    const startTimeStr = `${hours}:${minutes}`;

    const duration = typeof durationMinutesRaw === 'number' && durationMinutesRaw > 0 ? durationMinutesRaw : 60;

    // Compute end time
    let endTimeStr = '00:00';
    try {
      const endDateCalc = new Date(startDate.getTime() + duration * 60 * 1000);
      const eh = String(endDateCalc.getHours()).padStart(2, '0');
      const em = String(endDateCalc.getMinutes()).padStart(2, '0');
      endTimeStr = `${eh}:${em}`;
    } catch {
      endTimeStr = '00:00';
    }

    const timeRange = `${startTimeStr} - ${endTimeStr}`;

    const course: string =
      item?.classTitle ??
      item?.className ??
      item?.courseName ??
      item?.subjectName ??
      'Buoi hoc';

    const room: string =
      item?.plannedRoomName ??
      item?.actualRoomName ??
      item?.roomName ??
      item?.room ??
      'Phong';

    const teacher: string | undefined =
      (item?.plannedTeacherName ?? null) ||
      (item?.actualTeacherName ?? null) ||
      (item?.teacherName ?? null) ||
      (item?.teacherFullName ?? null) ||
      undefined;

    // Track khong co trong API -> co gang suy tu classCode/classTitle
    const trackHint = `${item?.classCode ?? ''} ${course}`.toLowerCase();
    let track: Track = 'IELTS';
    if (trackHint.includes('toeic')) track = 'TOEIC';
    else if (trackHint.includes('business')) track = 'Business';

    const colorByTrack: Record<Track, string> = {
      IELTS: 'bg-gradient-to-r from-red-400 to-red-500',
      TOEIC: 'bg-gradient-to-r from-red-300 to-red-400',
      Business: 'bg-gradient-to-r from-gray-400 to-gray-500',
    };

    const id: string =
      String(item?.id ?? item?.sessionId ?? item?.timetableId ?? index);

    const lesson: Lesson = {
      id,
      course,
      time: timeRange,
      room,
      students: 0,
      track,
      color: colorByTrack[track],
      duration,
      teacher,
    };

    return { date, lesson };
  }

  // Uu tien lay start/end dang ISO datetime
  const rawStart: string | undefined =
    item?.startTime ??
    item?.start_time ??
    item?.start ??
    item?.startAt ??
    item?.beginTime ??
    item?.start_datetime ??
    undefined;

  const rawEnd: string | undefined =
    item?.endTime ??
    item?.end_time ??
    item?.end ??
    item?.endAt ??
    item?.finishTime ??
    item?.end_datetime ??
    undefined;

  let date = fallbackDate;
  let startTimeStr = '00:00';
  let endTimeStr = '00:00';

  if (typeof rawStart === 'string') {
    const [d, t] = rawStart.split('T');
    if (d) date = d;
    if (t) startTimeStr = t.slice(0, 5);
  }

  if (typeof rawEnd === 'string') {
    const [, t] = rawEnd.split('T');
    if (t) endTimeStr = t.slice(0, 5);
  }

  const timeRange =
    rawStart && rawEnd
      ? `${startTimeStr} - ${endTimeStr}`
      : typeof item?.time === 'string'
      ? item.time
      : '00:00 - 00:00';

  // Tinh duration (phut)
  let duration = 60;
  try {
    const [start, end] = timeRange.split(' - ');
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (!Number.isNaN(sh) && !Number.isNaN(eh)) {
      duration = Math.max(30, (eh * 60 + em) - (sh * 60 + sm));
    }
  } catch {
    duration = 60;
  }

  const course: string =
    (item?.courseName ?? null) ||
    (item?.className ?? null) ||
    (item?.subjectName ?? null) ||
    'Buoi hoc';

  const room: string =
    (item?.roomName ?? null) ||
    (item?.room ?? null) ||
    'Phong';

  const students: number =
    item?.students ??
    item?.studentCount ??
    item?.totalStudents ??
    item?.total_students ??
    0;

  const trackRaw: string =
    item?.track ??
    item?.program ??
    item?.programName ??
    item?.trackName ??
    '';

  let track: Track = 'IELTS';
  const trackLower = String(trackRaw).toLowerCase();
  if (trackLower.includes('toeic')) track = 'TOEIC';
  else if (trackLower.includes('business')) track = 'Business';

  // Chon mau theo track
  const colorByTrack: Record<Track, string> = {
    IELTS: 'bg-gradient-to-r from-pink-500 to-rose-500',
    TOEIC: 'bg-gradient-to-r from-rose-500 to-pink-600',
    Business: 'bg-gradient-to-r from-fuchsia-500 to-purple-500',
  };

  const id: string =
    String(item?.id ?? item?.sessionId ?? item?.timetableId ?? index);

  const teacher: string | undefined =
    (item?.teacherName ?? null) ||
    (item?.teacherFullName ?? null) ||
    undefined;

  const lesson: Lesson = {
    id,
    course,
    time: timeRange,
    room,
    students,
    track,
    color: colorByTrack[track],
    duration,
    teacher,
  };

  return { date, lesson };
}

/**
 * Fetch timetable for teacher
 * Uses timetable API to get schedule data for a date range
 */
export async function fetchTeacherTimetable(
  params: FetchTimetableParams
): Promise<FetchTimetableResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Ban chua dang nhap. Vui long dang nhap lai de xem lich day.');
  }

  const queryParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  const res = await fetch(`${TEACHER_ENDPOINTS.TIMETABLE}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch timetable error:', res.status, text);
    throw new Error('Khong the tai lich day tu may chu.');
  }

  const json: TimetableApiResponse = await res.json();
  let rawItems: TimetableApiItem[] = [];

  if (json?.data && !Array.isArray(json.data)) {
    if (Array.isArray(json.data.sessions)) {
      rawItems = json.data.sessions;
    }
  } else if (Array.isArray(json?.data)) {
    rawItems = json.data;
  } else if (Array.isArray(json)) {
    rawItems = json;
  }

  console.log('Fetched timetable:', {
    totalSessions: rawItems.length,
    dateRange: `${params.from} to ${params.to}`,
    sampleSession: rawItems[0],
  });

  const now = new Date();
  const fallbackDate = formatDateISO(now);
  const byDate: Record<string, Lesson[]> = {};

  rawItems.forEach((item, index) => {
    const mapped = mapApiLessonToLesson(item, fallbackDate, index);
    if (!byDate[mapped.date]) {
      byDate[mapped.date] = [];
    }
    byDate[mapped.date].push(mapped.lesson);
  });

  console.log('Mapped lessons by date:', Object.keys(byDate).map(date => ({
    date,
    count: byDate[date].length,
    lessons: byDate[date].map(l => ({ course: l.course, time: l.time })),
  })));

  const weekData: DaySchedule[] = Object.entries(byDate)
    .map(([date, lessons]) => {
      const d = new Date(date);
      return {
        date,
        dow: getVietnameseDow(d),
        day: d.getDate(),
        month: `Tháng ${d.getMonth() + 1}`,
        lessons,
      };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    weekData,
  };
}

// Export utility functions for use in components
export { getVietnameseDow, formatDateISO };
