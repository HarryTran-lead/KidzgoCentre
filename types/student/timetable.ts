export type StudentTimetableSession = {
  id: string;
  classId: string;
  classCode?: string | null;
  classTitle?: string | null;
  plannedDatetime?: string | null;
  actualDatetime?: string | null;
  durationMinutes?: number | null;
  registrationId?: string | null;
  track?: string | null;
  isMakeup?: boolean | null;
  attendanceStatus?: string | null;
  absenceType?: string | null;
  participationType?: string | null;
  status?: string | null;
  plannedRoomName?: string | null;
  actualRoomName?: string | null;
  plannedTeacherName?: string | null;
  actualTeacherName?: string | null;
  lessonPlanLink?: string | null;
  color?: string | null;
};

export type StudentTimetableResponse = {
  sessions?: StudentTimetableSession[];
  data?: {
    sessions?: StudentTimetableSession[];
  };
};
