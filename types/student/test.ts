// types/student/test.ts

// Test Status
export type TestStatus = 
  | "COMPLETED"    // Đã hoàn thành
  | "SCHEDULED"    // Đã lên lịch
  | "MISSED"       // Vắng mặt
  | "IN_PROGRESS"; // Đang làm

// Test Type
export type TestType = 
  | "MIDTERM"      // Giữa kỳ
  | "FINAL"        // Cuối kỳ
  | "QUIZ"         // Kiểm tra nhanh
  | "PRACTICE"     // Luyện tập
  | "SPEAKING"     // Nói
  | "LISTENING"    // Nghe
  | "WRITING"      // Viết
  | "READING";     // Đọc

// Skill Type
export type SkillType = "LISTENING" | "SPEAKING" | "READING" | "WRITING" | "GRAMMAR" | "VOCABULARY";

// Test List Item
export interface TestListItem {
  id: string;
  title: string;
  type: TestType;
  subject: string;
  className: string;
  testDate: string;
  duration: number; // minutes
  status: TestStatus;
  score?: number;
  maxScore: number;
  percentage?: number;
  averageScore?: number; // Class average
  rank?: number; // Ranking in class
  totalStudents?: number;
}

// Test Detail
export interface TestDetail {
  id: string;
  title: string;
  type: TestType;
  subject: string;
  className: string;
  teacher: string;
  testDate: string;
  duration: number;
  status: TestStatus;
  
  // Scores
  score?: number;
  maxScore: number;
  percentage?: number;
  
  // Class Statistics
  classStats?: {
    average: number;
    highest: number;
    lowest: number;
    median: number;
    totalStudents: number;
  };
  
  // Student Ranking
  ranking?: {
    rank: number;
    totalStudents: number;
    percentile: number; // Top x%
  };
  
  // Skill Breakdown
  skillScores?: SkillScore[];
  
  // Section Scores
  sections?: TestSection[];
  
  // Teacher Feedback
  feedback?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    generalComment?: string;
  };
  
  // Answer Review (if available)
  answerSheet?: AnswerSheet;
  
  // Improvement from last test
  improvement?: {
    previousScore: number;
    scoreDifference: number;
    percentageChange: number;
  };
}

// Skill Score
export interface SkillScore {
  skill: SkillType;
  score: number;
  maxScore: number;
  percentage: number;
  classAverage: number;
}

// Test Section
export interface TestSection {
  id: string;
  name: string;
  questionCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent?: number; // minutes
}

// Answer Sheet
export interface AnswerSheet {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  questions?: QuestionReview[];
}

// Question Review
export interface QuestionReview {
  questionNumber: number;
  section: string;
  studentAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  explanation?: string;
}

// Test Stats (for list page)
export interface TestStats {
  total: number;
  completed: number;
  scheduled: number;
  missed: number;
  averageScore?: number;
  highestScore?: number;
  improvementRate?: number; // Percentage
}

// Filter Options
export interface TestFilter {
  status?: TestStatus[];
  type?: TestType[];
  subject?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

// Sort Options
export type TestSortOption = 
  | "DATE_DESC"
  | "DATE_ASC"
  | "SCORE_DESC"
  | "SCORE_ASC"
  | "STATUS";

// Badge Config
export interface StatusBadgeConfig {
  variant: "success" | "warning" | "danger" | "info";
  label: string;
}

export type TestStatusConfig = Record<TestStatus, StatusBadgeConfig>;
