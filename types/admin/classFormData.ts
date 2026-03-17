/**
 * Types for class form dropdown options
 */

export interface SelectOption {
  id: string;
  name: string;
  totalSessions?: number; // Số buổi học của chương trình
  status?: string; // Trạng thái của chương trình: "Đang hoạt động" | "Tạm dừng"
}

export interface ClassFormSelectData {
  programs: SelectOption[];
  branches: SelectOption[];
  teachers: SelectOption[];
  classrooms: SelectOption[];
}
