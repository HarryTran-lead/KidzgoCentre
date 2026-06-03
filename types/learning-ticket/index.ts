/** Learning Ticket types — Phase 1 + Phase 1.5 */

export type LearningTicketItemStatus = "Available" | "Consumed" | "Expired" | "Voided";
export type LearningTicketTransactionType = "Grant" | "Consume" | "Refund" | "Void" | "Adjustment";
export type LearningTicketSource = "Purchase" | "FreeGrant" | "Adjustment" | "Import";

export interface LearningTicketBalance {
  studentProfileId: string;
  available: number;
  consumed: number;
  totalGranted: number;
}

export interface LearningTicketLedgerItem {
  id: string;
  transactionType: LearningTicketTransactionType;
  quantity: number;
  reason: string | null;
  sessionId: string | null;
  attendanceId: string | null;
  createdAt: string;
  ticketTypeId?: string | null;
  ticketTypeCode?: string | null;
}

export interface LearningTicketLedgerResponse {
  items: LearningTicketLedgerItem[];
}

/** Phase 1.5 — Compatible ticket check response */
export interface CompatibleTicketCheckResponse {
  compatible: boolean;
  ticketItemId: string | null;
  ticketTypeId: string | null;
  ticketTypeCode: string | null;
  reason: string;
}

export interface CompatibleLearningTicketItem {
  id?: string | null;
  ticketItemId?: string | null;
  ticketTypeId?: string | null;
  ticketTypeCode?: string | null;
  ticketTypeName?: string | null;
  learningTicketTypeId?: string | null;
  learningTicketTypeCode?: string | null;
  learningTicketTypeName?: string | null;
  name?: string | null;
  available?: number | null;
  consumed?: number | null;
  totalGranted?: number | null;
  remaining?: number | null;
  quantity?: number | null;
  reason?: string | null;
  expiresAt?: string | null;
  programId?: string | null;
  programName?: string | null;
  levelId?: string | null;
  levelName?: string | null;
  [key: string]: unknown;
}

export interface CompatibleLearningTicketsResponse {
  items: CompatibleLearningTicketItem[];
}
