/**
 * Placement Test Types and Interfaces
 * Defines types for placement test management system
 */

export interface PlacementTest {
  id: string;
  leadId: string;
  childId: string;
  childName?: string;
  leadName?: string;
  leadPhone?: string;
  scheduledAt: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';
  testLocation?: string;
  branchId?: string;
  branchName?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlacementTestResult {
  testId: string;
  listeningScore?: number;
  speakingScore?: number;
  readingScore?: number;
  writingScore?: number;
  overallScore?: number;
  suggestedLevel?: string;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  completedAt?: string;
}

export interface PlacementTestNote {
  id?: string;
  testId: string;
  content: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CreatePlacementTestRequest {
  leadId: string;
  childId: string;
  scheduledAt: string;
  testLocation?: string;
  branchId?: string;
  assignedTeacherId?: string;
  notes?: string;
}

export interface UpdatePlacementTestRequest {
  scheduledAt?: string;
  testLocation?: string;
  branchId?: string;
  assignedTeacherId?: string;
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
