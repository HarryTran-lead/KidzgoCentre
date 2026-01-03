// types/student/report.ts

// Report Type
export type ReportType = "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY";

// Performance Level
export type PerformanceLevel = "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT";

// Attendance Status Summary
export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  presentRate: number; // percentage
  punctualityRate: number; // percentage
  notes: string[];
}

// Academic Performance
export interface AcademicPerformance {
  overallPerformance: PerformanceLevel;
  averageScore: number;
  testScores: {
    subject: string;
    score: number;
    maxScore: number;
  }[];
  homeworkCompletion: number; // percentage
  classParticipation: PerformanceLevel;
  notes: string[];
}

// Skill Progress
export interface SkillProgress {
  skillName: string;
  currentLevel: number;
  previousLevel: number;
  improvement: number;
  performance: PerformanceLevel;
  notes: string;
}

// Behavior & Attitude
export interface BehaviorReport {
  overallRating: number; // Average
  discipline: number; // 1-5
  cooperation: number; // 1-5
  respect: number; // 1-5
  responsibility: number; // 1-5
  notes: string[];
}

// Teacher Comment
export interface TeacherCommentSection {
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  generalComment: string;
  teacherName: string;
}

// Monthly Report Detail
export interface MonthlyReport {
  id: string;
  month: string;
  year: number;
  period: string; // "01/12/2024 - 31/12/2024"
  overallGrade: string;
  averageScore: number;
  attendanceRate: number;
  status: "PUBLISHED" | "DRAFT";
  publishedDate: string;
  
  // Attendance
  attendance: AttendanceSummary;
  
  // Academic Performance
  academic: AcademicPerformance;
  
  // Skill Progress
  skills: SkillProgress[];
  
  // Behavior & Attitude
  behavior: BehaviorReport;
  
  // Achievements
  achievements: Achievement[];
  
  // Teacher Comments
  teacherComments: TeacherCommentSection;
}

// Achievement
export interface Achievement {
  title: string;
  date: string;
  category: string;
}

// Report List Item
export interface ReportListItem {
  id: string;
  month: string;
  year: number;
  period: string; // "01/12/2024 - 31/12/2024"
  overallGrade: string;
  averageScore: number;
  attendanceRate: number;
  status: "PUBLISHED" | "DRAFT";
  publishedDate?: string;
}

// Report Stats
export interface ReportStats {
  totalReports: number;
  averageGrade: string;
  averageScore: number;
  attendanceRate: number;
  improvementTrend: "UP" | "STABLE" | "DOWN";
}

// Performance Badge Config
export interface PerformanceBadgeConfig {
  variant: "success" | "info" | "warning" | "danger";
  label: string;
  color: string;
}

export type PerformanceLevelConfig = Record<PerformanceLevel, PerformanceBadgeConfig>;
