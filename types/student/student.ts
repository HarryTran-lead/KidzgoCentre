import type { ApiResponse, ListData } from "../apiResponse";

export interface StudentSummary {
  id?: string;
  studentId?: string;
  profileId?: string;
  userId?: string;
  userEmail?: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  parentName?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  userName?: string;
  classId?: string;
  className?: string;
  classNames?: string[];
  classes?: Array<{
    id?: string;
    classId?: string;
    name?: string;
    className?: string;
    title?: string;
    code?: string;
  }>;
}

export type StudentsResponse = ApiResponse<ListData<StudentSummary>>;