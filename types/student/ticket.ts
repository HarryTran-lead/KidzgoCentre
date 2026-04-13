import type { ApiResponse } from "@/types/apiResponse";
import type { ListData } from "@/types/apiResponse";

export type TicketStatus = "Open" | "InProgress" | "Resolved" | "Closed";
export type TicketCategory = "Homework" | "Finance" | "Schedule" | "Tech" | "Other";

export interface CreateTicket {
  openedByProfileId?: string;
  branchId: string;
  classId?: string;
  category: TicketCategory;
  subject: string;
  message: string;
  type: "General" | "DirectToTeacher";
  assignedToUserId?: string;
}

export interface TicketCommentRequest{
  commenterProfileId?: string;
  message: string;
  attachmentUrl?: string;
}

export interface TicketComment {
  id: string;
  commenterUserId: string;
  commenterUserName: string;
  commenterProfileId?: string;
  commenterProfileName?: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Ticket{
  id: string;
  openedByUserId: string;
  openedByUserName: string;
  openedByProfileId?: string;
  openedByProfileName?: string;
  branchId: string;
  branchName: string;
  classId?: string;
  classCode?: string;
  classTitle?: string;
  category: TicketCategory;
  type?: "General" | "DirectToTeacher";
  subject: string;
  message: string;
  status: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface TicketDetail extends Omit<Ticket, 'commentCount'> {
  comments: TicketComment[];
}

export interface TicketStatusUpdate {
  status: TicketStatus;
}

export type TicketListResponse = ApiResponse<ListData<Ticket>>;
export type TicketDetailResponse = ApiResponse<TicketDetail>;
export type TicketCreateResponse = ApiResponse<Ticket>;
export type AddTicketCommentResponse = ApiResponse<TicketComment>;
export type TicketHistoryResponse = ApiResponse<any>;
