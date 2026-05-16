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
