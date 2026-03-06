/**
 * Ticket API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { TICKET_ENDPOINTS } from "@/constants/apiURL";
import { get, post, patch } from "@/lib/axios";
import type {
  CreateTicket,
  TicketCommentRequest,
  TicketStatusUpdate,
  TicketListResponse,
  TicketDetailResponse,
  TicketCreateResponse,
  AddTicketCommentResponse,
  TicketHistoryResponse,
} from "@/types/student/ticket";

export interface TicketAssignRequest {
  assignedToUserId: string;
}

export interface GetTicketsParams {
  mine?: boolean;
  branchId?: string;
  openedByUserId?: string;
  openedByProfileId?: string;
  assignedToUserId?: string;
  status?: string;
  category?: string;
  classId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export async function getTickets(params?: GetTicketsParams): Promise<TicketListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.mine !== undefined) queryParams.append('mine', String(params.mine));
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.openedByUserId) queryParams.append('openedByUserId', params.openedByUserId);
  if (params?.openedByProfileId) queryParams.append('openedByProfileId', params.openedByProfileId);
  if (params?.assignedToUserId) queryParams.append('assignedToUserId', params.assignedToUserId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.classId) queryParams.append('classId', params.classId);
  if (params?.pageNumber) queryParams.append('pageNumber', String(params.pageNumber));
  if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
  
  const url = queryParams.toString() 
    ? `${TICKET_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
    : TICKET_ENDPOINTS.GET_ALL;
  
  return get<TicketListResponse>(url);
}

export async function getTicketById(id: string): Promise<TicketDetailResponse> {
  return get<TicketDetailResponse>(TICKET_ENDPOINTS.GET_BY_ID(id));
}

export async function createTicket(data: CreateTicket): Promise<TicketCreateResponse> {
  return post<TicketCreateResponse>(TICKET_ENDPOINTS.CREATE, data);
}

export async function updateTicketStatus(id: string, data: TicketStatusUpdate): Promise<TicketDetailResponse> {
  return patch<TicketDetailResponse>(TICKET_ENDPOINTS.UPDATE_STATUS(id), data);
}

export async function addTicketComment(id: string, data: TicketCommentRequest): Promise<AddTicketCommentResponse> {
  return post<AddTicketCommentResponse>(TICKET_ENDPOINTS.ADD_COMMENT(id), data);
}

export async function getTicketHistory(id: string): Promise<TicketHistoryResponse> {
  return get<TicketHistoryResponse>(TICKET_ENDPOINTS.GET_HISTORY(id));
}

export async function assignTicket(id: string, data: TicketAssignRequest): Promise<TicketDetailResponse> {
  return patch<TicketDetailResponse>(TICKET_ENDPOINTS.ASSIGN(id), data);
}

export async function getTicketSla(id: string): Promise<any> {
  return get<any>(TICKET_ENDPOINTS.GET_SLA(id));
}
