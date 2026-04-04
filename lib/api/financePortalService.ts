import { FINANCE_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type FinancePortalQuery = QueryParams;

export async function getFinanceCashbook(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.CASHBOOK}${buildQueryString(params)}`);
}

export async function createFinanceCashbook(payload: Record<string, unknown>): Promise<any> {
  return post<any>(FINANCE_ENDPOINTS.CASHBOOK, payload);
}

export async function updateFinanceCashbook(
  id: string,
  payload: Record<string, unknown>
): Promise<any> {
  return put<any>(FINANCE_ENDPOINTS.CASHBOOK_BY_ID(id), payload);
}

export async function getFinanceFees(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.FEES}${buildQueryString(params)}`);
}

export async function getFinancePayroll(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.PAYROLL}${buildQueryString(params)}`);
}

export async function getFinanceAccountantDashboard(
  params?: FinancePortalQuery
): Promise<any> {
  return get<any>(
    `${FINANCE_ENDPOINTS.ACCOUNTANT_DASHBOARD}${buildQueryString(params)}`
  );
}

export async function getFinanceDues(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.DUES}${buildQueryString(params)}`);
}

export async function getFinanceInvoices(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.INVOICES}${buildQueryString(params)}`);
}

export async function createFinanceInvoice(payload: Record<string, unknown>): Promise<any> {
  return post<any>(FINANCE_ENDPOINTS.INVOICES, payload);
}

export async function updateFinanceInvoice(
  id: string,
  payload: Record<string, unknown>
): Promise<any> {
  return put<any>(FINANCE_ENDPOINTS.INVOICE_BY_ID(id), payload);
}

export async function sendFinanceInvoice(id: string): Promise<any> {
  return post<any>(FINANCE_ENDPOINTS.INVOICE_SEND(id), {});
}

export async function getPayosTransactions(params?: FinancePortalQuery): Promise<any> {
  return get<any>(
    `${FINANCE_ENDPOINTS.PAYOS_TRANSACTIONS}${buildQueryString(params)}`
  );
}

export async function generatePayosLink(payload: Record<string, unknown>): Promise<any> {
  return post<any>(FINANCE_ENDPOINTS.PAYOS_GENERATE_LINK, payload);
}

export async function generatePayosQr(payload: Record<string, unknown>): Promise<any> {
  return post<any>(FINANCE_ENDPOINTS.PAYOS_GENERATE_QR, payload);
}

export async function getFinanceAdjustments(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.ADJUSTMENTS}${buildQueryString(params)}`);
}

export async function createFinanceAdjustment(
  payload: Record<string, unknown>
): Promise<any> {
  return post<any>(FINANCE_ENDPOINTS.ADJUSTMENTS, payload);
}

export async function getFinanceAuditLogs(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.AUDIT_LOGS}${buildQueryString(params)}`);
}

export async function getFinanceReports(params?: FinancePortalQuery): Promise<any> {
  return get<any>(`${FINANCE_ENDPOINTS.REPORTS}${buildQueryString(params)}`);
}
