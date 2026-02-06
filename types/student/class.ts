import type { ApiResponse, ListData } from "../apiResponse";

export interface StudentClass {
  id: string;
  name?: string;
  className?: string;
    title?: string;
  code?: string;
}

export type StudentClassesResponse = ApiResponse<ListData<StudentClass>>;
export type StudentClassResponse = ApiResponse<StudentClass>;