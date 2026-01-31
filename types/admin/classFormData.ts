/**
 * Types for class form dropdown options
 */

export interface SelectOption {
  id: string;
  name: string;
}

export interface ClassFormSelectData {
  programs: SelectOption[];
  branches: SelectOption[];
  teachers: SelectOption[];
  classrooms: SelectOption[];
}
