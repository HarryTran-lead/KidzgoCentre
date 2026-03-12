/**
 * Types for class form dropdown options
 */

export interface SelectOption {
  id: string;
  name: string;
  totalSessions?: number; // Số buổi học của chương trình
}

export interface ClassFormSelectData {
  programs: SelectOption[];
  branches: SelectOption[];
  teachers: SelectOption[];
  classrooms: SelectOption[];
}
