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
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';
  room?: string;
  invigilatorUserId?: string;
  invigilatorName?: string;
  resultScore?: number;
  listeningScore?: number;
  speakingScore?: number;
  readingScore?: number;
  writingScore?: number;
  levelRecommendation?: string;
  programRecommendation?: string;
  attachmentUrl?: string;
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
  levelRecommendation: string;
  programRecommendation: string;
  attachmentUrl: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';
  updatedAt: string;
}

export interface PlacementTestResultRequest {
  id: string;
  listeningScore: number;
  speakingScore: number;
  readingScore: number;
  writingScore: number;
  resultScore: number;
  levelRecommendation: string;
  programRecommendation: string;
  attachmentUrl: string;
}

export interface PlacementTestResult {
  testId: string;
  listeningScore?: number;
  speakingScore?: number;
  readingScore?: number;
  writingScore?: number;
  resultScore?: number;
  levelRecommendation?: string;
  programRecommendation?: string;
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
  leadId: string;
  leadChildId: string;
  studentProfileId?: string;
  classId?: string;
  scheduledAt: string;
  room?: string;
  invigilatorUserId: string;
}

export interface CreatePlacementTestResponse {
  id: string;
  leadId: string;
  leadChildId: string;
  studentProfileId?: string;
  classId?: string;
  scheduledAt: string;
  status: string;
  room?: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';
  invigilatorUserId: string;
  createdAt: string;
}


export interface UpdatePlacementTestRequest {
  scheduledAt?: string;
  room?: string;
  invigilatorUserId?: string;
  notes?: string;
}


export interface PlacementTestFilters {
  status?: string;
  branchId?: string;
  assignedTeacherId?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
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
