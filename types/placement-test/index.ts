/**
 * Placement Test Types and Interfaces
 * Defines types for placement test management system
 */

export interface PlacementTest {
  id: string;
  leadId: string;
  leadChildId: string;
  leadContactName?: string;
  childName?: string;
  studentProfileId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  scheduledAt: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
  room?: string;
  invigilatorUserId?: string;
  invigilatorName?: string;
  resultScore?: number;
  listeningScore?: number;
  speakingScore?: number;
  readingScore?: number;
  writingScore?: number;
  programRecommendation?: string;
  secondaryProgramRecommendation?: string;
  isSecondaryProgramSupplementary?: boolean;
  secondaryProgramSkillFocus?: string;
  attachmentUrl?: string;
  isAccountProfileCreated?: boolean;
  isConvertedToEnrolled?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlacementTestResultResponse {
  id: string;
  listeningScore: number;
  speakingScore: number;
  readingScore: number;
  writingScore: number;
  resultScore: number;
  programRecommendation: string;
  secondaryProgramRecommendation?: string | null;
  isSecondaryProgramSupplementary?: boolean | null;
  secondaryProgramSkillFocus?: string | null;
  attachmentUrl: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
  updatedAt: string;
}

export interface PlacementTestResultRequest {
  id: string;
  listeningScore: number;
  speakingScore: number;
  readingScore: number;
  writingScore: number;
  resultScore: number;
  programRecommendation: string;
  secondaryProgramRecommendation?: string | null;
  isSecondaryProgramSupplementary?: boolean | null;
  secondaryProgramSkillFocus?: string | null;
  attachmentUrl: string;
}

export interface PlacementTestResult {
  testId: string;
  listeningScore?: number;
  speakingScore?: number;
  readingScore?: number;
  writingScore?: number;
  resultScore?: number;
  programRecommendation?: string;
  secondaryProgramRecommendation?: string | null;
  isSecondaryProgramSupplementary?: boolean | null;
  secondaryProgramSkillFocus?: string | null;
  attachmentUrl?: string;
}

export interface PlacementTestNote {
  id?: string;
  testId: string;
  note: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CreatePlacementTestRequest {
  leadId?: string;
  leadChildId?: string;
  scheduledAt: string;
  room?: string;
  invigilatorUserId?: string;
  studentProfileId?: string;
  classId?: string;
}

export interface CreatePlacementTestResponse {
  id: string;
  leadId: string;
  leadChildId: string;
  studentProfileId?: string;
  classId?: string;
  scheduledAt: string;
  status: string;
  room?: string;
  invigilatorUserId: string;
  createdAt: string;
}

export interface UpdatePlacementTestRequest {
  scheduledAt?: string;
  room?: string;
  invigilatorUserId?: string;
  studentProfileId?: string;
  classId?: string;
  notes?: string;
}

export interface PlacementTestFilters {
  leadId?: string;
  studentProfileId?: string;
  status?: string;
  branchId?: string;
  assignedTeacherId?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "Ascending" | "Descending";
  page?: number;
  pageSize?: number;
}

export interface PlacementTestListResponse {
  data: PlacementTest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlacementTestRetakeRequest {
  studentProfileId: string;
  newProgramId: string;
  newTuitionPlanId: string;
  branchId: string;
  scheduledAt?: string;
  room?: string;
  invigilatorUserId?: string;
  note?: string;
}

export interface PlacementTestRetakeResponse {
  newPlacementTestId: string;
  originalPlacementTestId: string;
  studentProfileId: string;
  newProgramName: string;
  newTuitionPlanName: string;
  placementTestStatus: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
  scheduledAt?: string;
  room?: string;
  invigilatorUserId?: string;
  createdAt: string;
  originalProgramName?: string;
  originalTuitionPlanName?: string;
  originalRemainingSessions?: number;
}
