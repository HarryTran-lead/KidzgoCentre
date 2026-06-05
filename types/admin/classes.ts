export type ClassRow = {
  id: string; 
  code: string; 
  name: string;
  sub: string;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  teacher: string;
  branch: string;
  current: number;
  capacity: number;
  schedule: string;
  startDate?: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
};

export interface ScheduleSlot {
  dayOfWeek: "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
  startTime: string; // Format: "HH:mm"
  durationMinutes: number;
}

export interface SimpleSchedule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface CreateClassRequest {
  branchId: string;
  programId: string;
  syllabusId: string;
  levelId: string;
  startModuleId: string;
  startSessionIndex: number;
  code: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  mainTeacherId?: string | null;
  assistantTeacherId?: string | null;
  roomId?: string | null;
  startDate: string;
  endDate?: string | null;
  capacity: number;
  sessionsToGenerate?: number | null;
  skipHolidays?: boolean;
  schedule?: SimpleSchedule | null;
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  status?: string;
  slotTypeId?: string | null;
}

export interface UpdateClassRequest {
  branchId: string;
  programId: string;
  syllabusId: string;
  levelId: string;
  startModuleId: string;
  startSessionIndex: number;
  code: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  mainTeacherId?: string | null;
  assistantTeacherId?: string | null;
  roomId?: string | null;
  startDate: string;
  endDate?: string | null;
  capacity: number;
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  slotTypeId?: string | null;
}

export type PreviewSessionsRequest = CreateClassRequest;

export interface PreviewSessionItem {
  classSessionNo: number;
  date: string;
  moduleName: string;
  unitName: string;
  lessonTitle: string;
  curriculumSessionIndex: number;
}

export interface PreviewSessionsResponse {
  expectedEndDate: string;
  sessions: PreviewSessionItem[];
  warnings: string[];
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  orderIndex: number;
  requiredSessions: number;
  completedClassSessions: number;
  completedLessonPlans: number;
  startSessionIndex: number;
  currentSessionIndex: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ScheduleSegment {
  id: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  weeklyScheduleSlots: ScheduleSlot[];
}

export interface ResyncFutureLessonsResponse {
  classId: string;
  updatedSessionCount: number;
  currentModuleId: string | null;
  currentSessionIndex: number;
  currentLessonPlanTemplateId: string | null;
}

export interface Class {
  id: string;
  code?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  programId?: string | null;
  programName?: string | null;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  levelId?: string | null;
  levelName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  startModuleId?: string | null;
  startModuleName?: string | null;
  startSessionIndex?: number | null;
  currentModuleId?: string | null;
  currentModuleName?: string | null;
  currentSessionIndex?: number | null;
  currentLessonPlanTemplateId?: string | null;
  currentLessonTitle?: string | null;
  mainTeacherId?: string | null;
  mainTeacherName?: string | null;
  assistantTeacherId?: string | null;
  assistantTeacherName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  capacity?: number | null;
  currentEnrollmentCount?: number | null;
  studentCount?: number | null;
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  scheduleText?: string | null;
  schedulePattern?: string | null;
  status?: string | null;
  slotTypeId?: string | null;
  slotTypeCode?: string | null;
  slotTypeName?: string | null;
  totalSessions?: number | null;
  completedSessions?: number | null;
  totalCurriculumSessions?: number | null;
  completedClassSessions?: number | null;
  completedLessonPlans?: number | null;
  progressPercent?: number | null;
  operationalProgressPercent?: number | null;
  curriculumProgressPercent?: number | null;
}

export interface CreateClassResponse {
  id: string;
  branchId?: string | null;
  programId?: string | null;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  levelId?: string | null;
  startModuleId?: string | null;
  startSessionIndex?: number | null;
  currentModuleId?: string | null;
  currentSessionIndex?: number | null;
  currentLessonPlanTemplateId?: string | null;
  code?: string | null;
  title?: string | null;
  name?: string | null;
  roomId?: string | null;
  mainTeacherId?: string | null;
  assistantTeacherId?: string | null;
  slotTypeId?: string | null;
  slotTypeCode?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  capacity?: number | null;
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  scheduleText?: string | null;
  description?: string | null;
}

export interface ClassApiDetail {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  programId?: string | null;
  programName?: string | null;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  levelId?: string | null;
  levelName?: string | null;
  startModuleId?: string | null;
  startModuleName?: string | null;
  startSessionIndex?: number | null;
  currentModuleId?: string | null;
  currentModuleName?: string | null;
  currentSessionIndex?: number | null;
  currentLessonPlanTemplateId?: string | null;
  currentLessonTitle?: string | null;
  code?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  status?: string | null;
  capacity?: number | null;
  currentEnrollmentCount?: number | null;
  teacherIds?: string[];
  teacherNames?: string[];
  roomId?: string | null;
  roomName?: string | null;
  slotTypeId?: string | null;
  slotTypeCode?: string | null;
  totalSessions?: number | null;
  completedSessions?: number | null;
  totalCurriculumSessions?: number | null;
  completedClassSessions?: number | null;
  completedLessonPlans?: number | null;
  progressPercent?: number | null;
  operationalProgressPercent?: number | null;
  curriculumProgressPercent?: number | null;
  moduleProgresses?: ModuleProgress[];
  scheduleSegments?: ScheduleSegment[];
  weeklyScheduleSlots?: ScheduleSlot[] | null;
  scheduleText?: string | null;
}

export type Track = "IELTS" | "TOEIC" | "Business";

export interface ClassDetail {
  id: string;
  name: string;
  code: string;
  track: Track;
  students: number;
  schedule: string;
  room: string;
  branchId?: string | null;
  branch: string;
  program: string;
  programId: string;
  syllabusId?: string | null;
  syllabusCode?: string | null;
  syllabusVersion?: string | null;
  syllabusTitle?: string | null;
  totalSessions: number;
  progress: number;
  teacher: string;
  assistantTeacher: string;
  description: string;
  startDate: string;
  endDate: string;
  completedLessons: number;
  slotTypeId?: string | null;
  slotTypeCode?: string | null;
  slotTypeName?: string | null;
}
