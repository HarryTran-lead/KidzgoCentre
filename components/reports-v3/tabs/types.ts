import type { ReactNode } from "react";
import type { ReportPeriodType, ReportTemplateType } from "@/types/reports-v3";

export type Option = {
  id: string;
  label: string;
  meta?: string;
};

export type PeriodDraft = {
  id?: string;
  code: string;
  name: string;
  type: ReportPeriodType;
  startDate: string;
  endDate: string;
};

export type TemplateDraft = {
  id?: string;
  code: string;
  name: string;
  type: ReportTemplateType;
  contentSchema: string;
  isActive: boolean;
};

export type DashboardFocusOption = {
  id: "class" | "branch";
  label: string;
  icon: ReactNode;
};
