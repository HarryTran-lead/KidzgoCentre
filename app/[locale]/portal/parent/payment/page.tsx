"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  History,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  getParentInvoices,
  getParentOverview,
  getParentPayments,
} from "@/lib/api/parentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

/* ── Types ── */

type TabType = "overview" | "bills" | "history";
type Tone = "neutral" | "danger" | "warning" | "success" | "dark";

interface OverviewData {
  programName?: string;
  packageName?: string;
  totalSessions?: number;
  usedSessions?: number;
  remainingSessions?: number;
  outstandingAmount?: number;
  tuitionDue?: number;
  nextDueDate?: string;
  daysUntilDue?: number;
  studentInfo?: Record<string, unknown>;
  studentProfiles?: Record<string, unknown>[];
  classInfo?: Record<string, unknown>;
  classes?: Record<string, unknown>[];
  upcomingSessions?: Record<string, unknown>[];
  statistics?: Record<string, unknown>;
  attendanceRate?: number;
  homeworkCompletion?: number;
  xp?: number;
  level?: number;
  streak?: number;
  stars?: number;
  nextClasses?: unknown[];
  pendingApprovals?: unknown[];
  pendingInvoices?: unknown[];
  unreadNotifications?: number;
}

interface InvoiceItem {
  id: string;
  studentName: string;
  description: string;
  type: string;
  amount: number;
  remainingAmount?: number;
  dueDate?: string;
  issuedAt?: string;
  status: string;
  payosPaymentLink?: string;
  invoiceNumber?: string;
  className?: string;
  note?: string;
}

interface PaymentItem {
  id: string;
  amount: number;
  method: string;
  date?: string;
  invoiceRef?: string;
  status: string;
  description?: string;
  fallback?: boolean;
}

/* ── Helpers ── */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrap = (value: unknown): unknown => {
  let current = value;
  for (let i = 0; i < 2; i += 1) {
    if (isRecord(current) && "data" in current && current.data != null) current = current.data;
    else break;
  }
  return current;
};

const asText = (value: unknown) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const asNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleDateString("vi-VN") : "—";
};

const formatDateTime = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed
    ? parsed.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
};

const getItems = (value: unknown): unknown[] => {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.items)) return payload.items;
  for (const key of ["invoices", "payments", "results"]) {
    const nested = unwrap(payload[key]);
    if (Array.isArray(nested)) return nested;
    if (isRecord(nested) && Array.isArray(nested.items)) return nested.items;
  }
  return [];
};

const normalizeInvoice = (value: unknown, index: number): InvoiceItem => {
  const source = isRecord(unwrap(value)) ? (unwrap(value) as Record<string, unknown>) : {};
  return {
    id: asText(source.id) || asText(source.invoiceId) || `invoice-${index}`,
    studentName: asText(source.studentName),
    description: asText(source.description),
    type: asText(source.type),
    amount: asNumber(source.amount),
    remainingAmount: source.remainingAmount == null ? undefined : asNumber(source.remainingAmount),
    dueDate: asText(source.dueDate) || asText(source.dueAt) || undefined,
    issuedAt: asText(source.issuedAt) || asText(source.createdAt) || undefined,
    status: asText(source.status) || "Unknown",
    payosPaymentLink: asText(source.payosPaymentLink) || undefined,
    invoiceNumber: asText(source.invoiceNumber) || asText(source.code) || undefined,
    className: asText(source.className) || asText(source.classTitle) || undefined,
    note: asText(source.note) || undefined,
  };
};

const normalizePayment = (value: unknown, index: number): PaymentItem => {
  const source = isRecord(unwrap(value)) ? (unwrap(value) as Record<string, unknown>) : {};
  return {
    id: asText(source.id) || `payment-${index}`,
    amount: asNumber(source.amount),
    method: asText(source.method) || asText(source.paymentMethod) || asText(source.channel) || "Giao dịch học phí",
    date: asText(source.paidAt) || asText(source.paymentDate) || asText(source.createdAt) || asText(source.date) || undefined,
    invoiceRef: asText(source.invoiceId) || asText(source.invoice) || asText(source.referenceCode) || undefined,
    status: asText(source.status) || "Paid",
    description: asText(source.description) || undefined,
  };
};

const isOpen = (status?: string) => {
  const key = (status ?? "").toLowerCase();
  return key === "pending" || key === "overdue";
};

const isPaid = (status?: string) => (status ?? "").toLowerCase() === "paid";

const isOverdue = (status?: string) => (status ?? "").toLowerCase() === "overdue";

const isSuccessfulPayment = (status?: string) => {
  const key = (status ?? "").toLowerCase();
  return key === "" || key === "paid" || key === "success" || key === "completed" || key === "settled";
};

const invoiceBalance = (invoice: InvoiceItem) =>
  typeof invoice.remainingAmount === "number" ? invoice.remainingAmount : invoice.amount;

const invoiceTitle = (invoice: InvoiceItem) =>
  invoice.description || invoice.type || invoice.className || "Học phí";

const invoiceRef = (invoice: InvoiceItem) => invoice.invoiceNumber || invoice.id;

const describeDue = (days: number | null | undefined) => {
  if (days == null) return "Không có hạn đóng";
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`;
  if (days === 0) return "Đến hạn hôm nay";
  return `Còn ${days} ngày`;
};

const describeDueFromDate = (value?: string | null) => {
  const parsed = parseDate(value);
  if (!parsed) return "Không có hạn đóng";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return describeDue(diff);
};

const fallbackHistory = (invoices: InvoiceItem[]): PaymentItem[] =>
  invoices.map((invoice, index) => ({
    id: `fallback-${invoice.id}-${index}`,
    amount: invoice.amount,
    method: "Tổng hợp từ bill đã thanh toán",
    date: invoice.issuedAt || invoice.dueDate,
    invoiceRef: invoiceRef(invoice),
    status: invoice.status,
    description: invoiceTitle(invoice),
    fallback: true,
  }));

const paymentMatchesBill = (payment: PaymentItem, invoice: InvoiceItem) => {
  const pVals = [payment.invoiceRef, payment.description].map((v) => v?.toLowerCase().trim()).filter(Boolean) as string[];
  const iVals = [invoice.id, invoice.invoiceNumber, invoiceTitle(invoice)].map((v) => v?.toLowerCase().trim()).filter(Boolean) as string[];
  return pVals.some((pv) => iVals.some((iv) => pv === iv || pv.includes(iv) || iv.includes(pv)));
};

/* ── Sub-components ── */

function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const cls: Record<Tone, string> = {
    neutral: "border-gray-200 bg-gray-100 text-gray-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dark: "border-slate-700 bg-slate-800 text-white",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls[tone]}`}>{children}</span>;
}

function StatCard({ label, value, hint, icon: Icon, tone = "neutral" }: { label: string; value: string; hint: string; icon: LucideIcon; tone?: "red" | "dark" | "neutral" | "green" }) {
  const bg: Record<string, string> = { red: "from-red-600 to-red-700", dark: "from-slate-800 to-slate-900", neutral: "from-gray-600 to-gray-700", green: "from-emerald-600 to-emerald-700" };
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-gray-950 truncate">{value}</div>
          <div className="mt-3 text-xs leading-5 text-gray-600">{hint}</div>
        </div>
        <div className={`shrink-0 rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${bg[tone]}`}><Icon size={20} /></div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: "danger" | "success" }) {
  const valueColor = tone === "danger" ? "text-red-600" : tone === "success" ? "text-emerald-600" : "text-gray-900";
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-gray-200 py-3 last:border-b-0 last:pb-0">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`max-w-[60%] text-right text-sm font-medium ${valueColor}`}>{value}</div>
    </div>
  );
}

function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-500"><Icon size={24} /></div>
      <div className="mt-4 text-base font-semibold text-gray-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-gray-600">{description}</div>
    </div>
  );
}

function ProgressBar({ used, total, className = "" }: { used: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
        <span>{used}/{total} buổi đã học</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Page ── */

export default function PaymentPage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  /* ── Fetch ── */

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;
        const params = studentProfileId ? { studentProfileId } : undefined;
        const [overviewRes, invoiceRes, paymentRes] = await Promise.all([
          getParentOverview(params).catch(() => null),
          getParentInvoices(params).catch(() => null),
          getParentPayments(params).catch(() => null),
        ]);
        if (!alive) return;
        const raw = unwrap(overviewRes);
        setOverview(isRecord(raw) ? (raw as OverviewData) : null);
        setInvoices(getItems(invoiceRes).map(normalizeInvoice));
        setPayments(getItems(paymentRes).map(normalizePayment));
        setLastUpdatedAt(new Date().toISOString());
      } catch {
        if (!alive) return;
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [selectedProfile?.id, selectedProfile?.studentId]);

  /* ── Derived data from BE overview ── */

  const programName = asText(overview?.programName) || undefined;
  const packageName = asText(overview?.packageName) || undefined;
  const totalSessions = typeof overview?.totalSessions === "number" ? overview.totalSessions : null;
  const usedSessions = typeof overview?.usedSessions === "number" ? overview.usedSessions : null;
  const remainingSessions = typeof overview?.remainingSessions === "number" ? overview.remainingSessions : null;
  const outstandingAmountBE = typeof overview?.outstandingAmount === "number" ? overview.outstandingAmount : null;
  const nextDueDateBE = asText(overview?.nextDueDate) || undefined;
  const daysUntilDueBE = typeof overview?.daysUntilDue === "number" ? overview.daysUntilDue : null;

  const hasSessions = totalSessions != null && usedSessions != null && remainingSessions != null;
  const programLabel = programName || packageName || "Chưa có thông tin gói học";
  const packageLabel = packageName || (totalSessions != null ? `${totalSessions} buổi` : undefined);

  /* ── Derived from student info ── */

  const studentInfo = isRecord(overview?.studentInfo) ? overview!.studentInfo : null;
  const classInfo = isRecord(overview?.classInfo) ? overview!.classInfo : null;
  const upcomingSessions = Array.isArray(overview?.upcomingSessions) ? overview!.upcomingSessions.filter(isRecord) : [];
  const studentName = selectedProfile?.displayName || asText(studentInfo?.displayName) || asText(studentInfo?.name) || invoices[0]?.studentName || "Học viên";
  const classCode = asText(classInfo?.code) || asText(classInfo?.classCode) || undefined;
  const classTitle = asText(classInfo?.title) || asText(classInfo?.classTitle) || undefined;
  const classLabel = classTitle || classCode;

  /* ── Invoices ── */

  const sortedInvoices = useMemo(() => [...invoices].sort((a, b) => {
    const ga = isOpen(a.status) ? 0 : isPaid(a.status) ? 1 : 2;
    const gb = isOpen(b.status) ? 0 : isPaid(b.status) ? 1 : 2;
    if (ga !== gb) return ga - gb;
    const da = parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const db = parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (da !== db) return da - db;
    return (parseDate(b.issuedAt)?.getTime() ?? 0) - (parseDate(a.issuedAt)?.getTime() ?? 0);
  }), [invoices]);

  useEffect(() => {
    if (!sortedInvoices.length) { setSelectedBillId(null); return; }
    if (!selectedBillId || !sortedInvoices.some((i) => i.id === selectedBillId)) {
      setSelectedBillId(sortedInvoices[0].id);
    }
  }, [selectedBillId, sortedInvoices]);

  const selectedBill = sortedInvoices.find((i) => i.id === selectedBillId) ?? sortedInvoices[0] ?? null;
  const openInvoices = sortedInvoices.filter((i) => isOpen(i.status));
  const paidInvoices = sortedInvoices.filter((i) => isPaid(i.status));
  const overdueInvoices = sortedInvoices.filter((i) => isOverdue(i.status));

  /* ── Outstanding: prefer BE, fallback to FE sum ── */

  const outstandingAmount = outstandingAmountBE ?? openInvoices.reduce((s, i) => s + invoiceBalance(i), 0);

  /* ── Due date: prefer BE, fallback to nearest open invoice ── */

  const nextDueInvoice = [...openInvoices].sort((a, b) => (parseDate(a.dueDate)?.getTime() ?? Infinity) - (parseDate(b.dueDate)?.getTime() ?? Infinity))[0] ?? null;
  const nextDueDate = nextDueDateBE || nextDueInvoice?.dueDate || undefined;
  const daysUntilDue = daysUntilDueBE;
  const dueDescription = daysUntilDue != null ? describeDue(daysUntilDue) : describeDueFromDate(nextDueDate);

  /* ── Payment history ── */

  const history = payments.length ? payments : fallbackHistory(paidInvoices);
  const validHistory = history.filter((h) => h.fallback || isSuccessfulPayment(h.status));
  const totalSpent = validHistory.reduce((s, h) => s + h.amount, 0);
  const selectedBillHistory = selectedBill ? validHistory.filter((h) => paymentMatchesBill(h, selectedBill)) : [];
  const spentForBill = selectedBillHistory.reduce((s, h) => s + h.amount, 0) || (selectedBill && isPaid(selectedBill.status) ? selectedBill.amount : 0);

  /* ── Tabs ── */

  const tabs: Array<{ key: TabType; label: string; icon: LucideIcon; badge: string }> = [
    { key: "overview", label: "Tổng quan gói học", icon: GraduationCap, badge: hasSessions ? `${remainingSessions} buổi còn` : "—" },
    { key: "bills", label: "Hóa đơn & kỳ phí", icon: Receipt, badge: `${sortedInvoices.length}` },
    { key: "history", label: "Lịch sử thanh toán", icon: History, badge: `${validHistory.length}` },
  ];

  /* ── Loading skeleton ── */

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-[28px] bg-white shadow-sm" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white shadow-sm" />)}
        </div>
        <div className="h-16 animate-pulse rounded-3xl bg-white shadow-sm" />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-3xl bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">

        {/* ── Hero header ── */}
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><Wallet size={28} /></div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tài chính & gói học</h1>
                  <p className="mt-2 text-sm leading-6 text-white/70">Theo dõi tiến độ gói học, công nợ, hạn đóng và lịch sử thanh toán.</p>
                </div>
              </div>

              {/* Quick chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                <Pill tone="dark"><Users size={12} /> {studentName}</Pill>
                {classLabel ? <Pill tone="dark"><BookOpen size={12} /> {classLabel}</Pill> : null}
                {programName ? <Pill tone="dark"><Package size={12} /> {programName}</Pill> : null}
                {daysUntilDue != null ? (
                  <Pill tone={daysUntilDue < 0 ? "danger" : daysUntilDue <= 7 ? "warning" : "success"}>
                    <Clock size={12} /> {dueDescription}
                  </Pill>
                ) : null}
              </div>
            </div>

            {/* Session progress card in hero */}
            {hasSessions ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:min-w-[320px]">
                <div className="text-xs uppercase tracking-[0.22em] text-white/50">Tiến độ gói học</div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="text-3xl font-bold">{remainingSessions}</div>
                  <div className="mb-1 text-sm text-white/70">buổi còn lại / {totalSessions}</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
                    <span>{usedSessions}/{totalSessions} đã học</span>
                    <span>{totalSessions! > 0 ? Math.round((usedSessions! / totalSessions!) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        usedSessions! / totalSessions! >= 0.9 ? "bg-red-400" : usedSessions! / totalSessions! >= 0.7 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${totalSessions! > 0 ? Math.min(Math.round((usedSessions! / totalSessions!) * 100), 100) : 0}%` }}
                    />
                  </div>
                </div>
                {packageLabel ? <div className="mt-3 text-xs text-white/50">Gói: {packageLabel}</div> : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:min-w-[280px]">
                <div className="text-xs uppercase tracking-[0.22em] text-white/50">Gói học</div>
                <div className="mt-3 text-sm text-white/70">Chưa có dữ liệu tiến độ gói học từ hệ thống.</div>
              </div>
            )}
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {/* ── Stat cards ── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Buổi còn lại"
            value={remainingSessions != null ? `${remainingSessions}` : "—"}
            hint={hasSessions ? `Đã học ${usedSessions}/${totalSessions} buổi` : "Chưa có dữ liệu từ BE"}
            icon={BookOpen}
            tone="red"
          />
          <StatCard
            label="Hạn đóng tiếp"
            value={nextDueDate ? formatDate(nextDueDate) : "Không có"}
            hint={dueDescription}
            icon={Calendar}
            tone={daysUntilDue != null && daysUntilDue < 0 ? "red" : "neutral"}
          />
          <StatCard
            label="Công nợ hiện tại"
            value={formatCurrency(outstandingAmount)}
            hint={overdueInvoices.length ? `${overdueInvoices.length} hóa đơn quá hạn` : `${openInvoices.length} hóa đơn đang mở`}
            icon={AlertCircle}
            tone={outstandingAmount > 0 ? "dark" : "green"}
          />
          <StatCard
            label="Đã thanh toán"
            value={formatCurrency(totalSpent)}
            hint={`${paidInvoices.length} hóa đơn đã hoàn tất`}
            icon={CreditCard}
            tone="green"
          />
        </section>

        {/* ── Tab navigation ── */}
        <section className="rounded-3xl border border-gray-200 bg-white p-1 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`flex flex-1 items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-left transition ${activeTab === tab.key ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <tab.icon size={18} />
                  <div>
                    <div className="text-sm font-semibold">{tab.label}</div>
                    <div className={`text-xs ${activeTab === tab.key ? "text-white/75" : "text-gray-500"}`}>{tab.badge}</div>
                  </div>
                </div>
                <ArrowRight size={16} className={activeTab === tab.key ? "text-white/75" : "text-gray-400"} />
              </button>
            ))}
          </div>
        </section>

        {/* ════════════════ TAB: OVERVIEW ════════════════ */}
        {activeTab === "overview" ? (
          <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">

              {/* Package & session detail */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-gray-900">Thông tin gói học</div>
                    <div className="mt-1 text-sm text-gray-500">Dữ liệu lấy trực tiếp từ hệ thống, không suy diễn.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {daysUntilDue != null ? (
                      <Pill tone={daysUntilDue < 0 ? "danger" : daysUntilDue <= 7 ? "warning" : "success"}>{dueDescription}</Pill>
                    ) : null}
                    {outstandingAmount === 0 ? <Pill tone="success"><CheckCircle2 size={12} /> Không còn nợ</Pill> : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-red-500">Học viên</div>
                    <div className="mt-2 text-lg font-semibold text-gray-950">{studentName}</div>
                    {classLabel ? <div className="mt-2 text-sm text-gray-600">{classLabel}</div> : null}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Chương trình</div>
                    <div className="mt-2 text-lg font-semibold text-gray-950">{programName || "—"}</div>
                    {packageLabel ? <div className="mt-2 text-sm text-gray-600">Gói: {packageLabel}</div> : null}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Hạn đóng tiếp</div>
                    <div className="mt-2 text-lg font-semibold text-gray-950">{nextDueDate ? formatDate(nextDueDate) : "—"}</div>
                    <div className="mt-2 text-sm text-gray-600">{dueDescription}</div>
                  </div>
                </div>

                {/* Session progress */}
                {hasSessions ? (
                  <div className="mt-6 rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">Tiến độ gói học</div>
                    <ProgressBar used={usedSessions!} total={totalSessions!} />
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-950">{totalSessions}</div>
                        <div className="text-xs text-gray-500 mt-1">Tổng buổi</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{usedSessions}</div>
                        <div className="text-xs text-gray-500 mt-1">Đã học</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{remainingSessions}</div>
                        <div className="text-xs text-gray-500 mt-1">Còn lại</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    Chưa có dữ liệu tiến độ gói học. Khi hệ thống cập nhật, số buổi sẽ hiển thị tại đây.
                  </div>
                )}

                {/* Financial summary */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                      {outstandingAmount > 0 ? <TrendingDown size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Công nợ</div>
                    </div>
                    <div className={`mt-2 text-2xl font-bold ${outstandingAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(outstandingAmount)}</div>
                    <div className="mt-2 text-sm text-gray-600">{openInvoices.length} hóa đơn đang mở{overdueInvoices.length > 0 ? `, ${overdueInvoices.length} quá hạn` : ""}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Đã thanh toán</div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(totalSpent)}</div>
                    <div className="mt-2 text-sm text-gray-600">{paidInvoices.length} hóa đơn hoàn tất</div>
                  </div>
                </div>
              </div>

              {/* Upcoming sessions & open bills */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-base font-semibold text-gray-900">Lịch học & hóa đơn cần chú ý</div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">Buổi học sắp tới</div>
                    {upcomingSessions.length ? upcomingSessions.slice(0, 4).map((session, index) => (
                      <div key={`session-${index}`} className="rounded-2xl border border-white bg-white p-4">
                        <div className="text-sm font-semibold text-gray-900">{asText(session.classTitle) || asText(session.classCode) || "Buổi học"}</div>
                        <div className="mt-1 text-sm text-gray-600">{formatDateTime(asText(session.plannedDatetime))}</div>
                      </div>
                    )) : <EmptyState title="Chưa có lịch học" description="Danh sách buổi học sắp tới sẽ hiện tại đây." icon={Calendar} />}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">Hóa đơn cần theo dõi</div>
                    {openInvoices.length ? openInvoices.slice(0, 4).map((inv) => (
                      <button key={inv.id} type="button" onClick={() => { setSelectedBillId(inv.id); setActiveTab("bills"); }} className="w-full rounded-2xl border border-white bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{invoiceTitle(inv)}</div>
                            <div className="mt-1 text-sm text-gray-600">{formatCurrency(invoiceBalance(inv))}</div>
                            <div className="mt-2 text-xs text-gray-500">Hạn: {formatDate(inv.dueDate)}</div>
                          </div>
                          <Pill tone={isOverdue(inv.status) ? "danger" : "warning"}>{isOverdue(inv.status) ? "Quá hạn" : "Đang mở"}</Pill>
                        </div>
                      </button>
                    )) : <EmptyState title="Không có hóa đơn mở" description="Hiện chưa phát sinh hóa đơn chờ thanh toán." icon={Receipt} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-base font-semibold text-gray-900">Hóa đơn đang xem</div>
                {selectedBill ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-red-500">{invoiceTitle(selectedBill)}</div>
                      <div className="mt-2 text-lg font-semibold text-gray-950">{formatCurrency(invoiceBalance(selectedBill))}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill tone={isPaid(selectedBill.status) ? "success" : isOverdue(selectedBill.status) ? "danger" : isOpen(selectedBill.status) ? "warning" : "neutral"}>
                          {isPaid(selectedBill.status) ? "Đã thanh toán" : isOverdue(selectedBill.status) ? "Quá hạn" : isOpen(selectedBill.status) ? "Chờ thanh toán" : selectedBill.status}
                        </Pill>
                        <Pill tone="neutral">Mã: {invoiceRef(selectedBill)}</Pill>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 p-5">
                      <DetailRow label="Học viên" value={selectedBill.studentName || studentName} />
                      <DetailRow label="Chương trình" value={programLabel} />
                      <DetailRow label="Ngày phát hành" value={formatDate(selectedBill.issuedAt)} />
                      <DetailRow label="Hạn đóng" value={formatDate(selectedBill.dueDate)} />
                      <DetailRow label="Tổng hóa đơn" value={formatCurrency(selectedBill.amount)} />
                      <DetailRow label="Còn phải trả" value={formatCurrency(invoiceBalance(selectedBill))} tone={invoiceBalance(selectedBill) > 0 ? "danger" : "success"} />
                      <DetailRow label="Đã trả" value={formatCurrency(spentForBill)} tone="success" />
                    </div>
                    {selectedBill.payosPaymentLink ? (
                      <a href={selectedBill.payosPaymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                        <CreditCard size={16} /> Thanh toán online
                      </a>
                    ) : null}
                  </div>
                ) : <EmptyState title="Chưa có hóa đơn" description="Khi có hóa đơn, chi tiết sẽ hiển thị ở đây." icon={FileText} />}
              </div>

              {/* Info notes */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Lưu ý</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">Số buổi, công nợ và hạn đóng được tính từ hệ thống backend.</div>
                  {outstandingAmountBE == null ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">Tổng nợ đang tính từ hóa đơn FE. Khi BE cập nhật, giá trị sẽ chuẩn hơn.</div>
                  ) : null}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">Lịch sử thanh toán ưu tiên dữ liệu payment, fallback từ hóa đơn đã thanh toán.</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ════════════════ TAB: BILLS ════════════════ */}
        {activeTab === "bills" ? (
          <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-gray-900">Danh sách hóa đơn</div>
                  <div className="mt-1 text-sm text-gray-500">Hóa đơn đang mở được đẩy lên trước.</div>
                </div>
                <Pill tone="neutral"><Receipt size={12} /> {sortedInvoices.length}</Pill>
              </div>
              <div className="mt-5 space-y-3 max-h-[600px] overflow-y-auto">
                {sortedInvoices.length ? sortedInvoices.map((inv) => {
                  const active = selectedBill?.id === inv.id;
                  return (
                    <button key={inv.id} type="button" onClick={() => setSelectedBillId(inv.id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-300 bg-red-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{invoiceTitle(inv)}</div>
                          <div className="mt-1 text-sm text-gray-600">{formatCurrency(invoiceBalance(inv))}</div>
                          <div className="mt-2 text-xs text-gray-500">Phát hành {formatDate(inv.issuedAt)} • Hạn {formatDate(inv.dueDate)}</div>
                        </div>
                        <Pill tone={isPaid(inv.status) ? "success" : isOverdue(inv.status) ? "danger" : isOpen(inv.status) ? "warning" : "neutral"}>
                          {isPaid(inv.status) ? "Đã trả" : isOverdue(inv.status) ? "Quá hạn" : isOpen(inv.status) ? "Chờ trả" : inv.status}
                        </Pill>
                      </div>
                    </button>
                  );
                }) : <EmptyState title="Chưa có hóa đơn" description="Danh sách hóa đơn sẽ hiển thị khi có dữ liệu." icon={Receipt} />}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-base font-semibold text-gray-900">Chi tiết hóa đơn</div>
              {selectedBill ? (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-red-500">Tổng hóa đơn</div>
                      <div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(selectedBill.amount)}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Còn phải trả</div>
                      <div className={`mt-2 text-2xl font-bold ${invoiceBalance(selectedBill) > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(invoiceBalance(selectedBill))}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Đã trả</div>
                      <div className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(spentForBill)}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <DetailRow label="Mã hóa đơn" value={invoiceRef(selectedBill)} />
                    <DetailRow label="Học viên" value={selectedBill.studentName || studentName} />
                    <DetailRow label="Chương trình" value={programLabel} />
                    {packageLabel ? <DetailRow label="Gói học" value={packageLabel} /> : null}
                    <DetailRow label="Mô tả" value={invoiceTitle(selectedBill)} />
                    <DetailRow label="Ngày phát hành" value={formatDate(selectedBill.issuedAt)} />
                    <DetailRow label="Hạn đóng" value={formatDate(selectedBill.dueDate)} />
                    <DetailRow label="Trạng thái hạn" value={describeDueFromDate(selectedBill.dueDate)} tone={isOverdue(selectedBill.status) ? "danger" : undefined} />
                    {selectedBill.note ? <DetailRow label="Ghi chú" value={selectedBill.note} /> : null}
                  </div>

                  {selectedBill.payosPaymentLink ? (
                    <a href={selectedBill.payosPaymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 shadow-lg">
                      <CreditCard size={16} /> Thanh toán online
                    </a>
                  ) : null}

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">Lịch sử trả theo hóa đơn này</div>
                      <Pill tone="neutral"><History size={12} /> {selectedBillHistory.length}</Pill>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedBillHistory.length ? selectedBillHistory.map((p) => (
                        <div key={p.id} className="rounded-2xl border border-white bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{p.method}</div>
                              <div className="mt-1 text-sm text-gray-600">{p.description || p.invoiceRef || "Giao dịch học phí"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-emerald-600">{formatCurrency(p.amount)}</div>
                              <div className="mt-1 text-xs text-gray-500">{formatDateTime(p.date)}</div>
                            </div>
                          </div>
                        </div>
                      )) : <EmptyState title="Chưa có lịch sử" description="Chưa ghi nhận thanh toán cho hóa đơn này." icon={History} />}
                    </div>
                  </div>
                </div>
              ) : <EmptyState title="Chọn hóa đơn" description="Chọn hóa đơn ở cột trái để xem chi tiết." icon={FileText} />}
            </div>
          </section>
        ) : null}

        {/* ════════════════ TAB: HISTORY ════════════════ */}
        {activeTab === "history" ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp size={16} className="text-emerald-500" /> Tổng đã trả</div>
                <div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(totalSpent)}</div>
                <div className="mt-3 text-xs text-gray-600">Tổng hợp từ lịch sử thanh toán.</div>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500"><CheckCircle2 size={16} className="text-emerald-500" /> Hóa đơn hoàn tất</div>
                <div className="mt-2 text-2xl font-bold text-gray-950">{paidInvoices.length}</div>
                <div className="mt-3 text-xs text-gray-600">Đã thanh toán đầy đủ.</div>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500"><History size={16} className="text-gray-500" /> Bản ghi giao dịch</div>
                <div className="mt-2 text-2xl font-bold text-gray-950">{validHistory.length}</div>
                <div className="mt-3 text-xs text-gray-600">{payments.length ? "Từ payment history." : "Fallback từ hóa đơn đã trả."}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-gray-900">Lịch sử thanh toán</div>
                <Pill tone="neutral"><CheckCircle2 size={12} /> {validHistory.length} giao dịch</Pill>
              </div>
              <div className="mt-5 space-y-3">
                {validHistory.length ? validHistory.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><CreditCard size={18} /></div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">{p.method}</div>
                            {p.fallback ? <Pill tone="neutral">Từ hóa đơn đã trả</Pill> : null}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">{p.description || p.invoiceRef || "Giao dịch học phí"}</div>
                          <div className="mt-2 text-xs text-gray-500">{p.invoiceRef ? `Ref: ${p.invoiceRef}` : ""}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-emerald-600">{formatCurrency(p.amount)}</div>
                        <div className="mt-1 text-xs text-gray-500">{formatDateTime(p.date)}</div>
                      </div>
                    </div>
                  </div>
                )) : <EmptyState title="Chưa có lịch sử" description="Khi có giao dịch, danh sách sẽ hiển thị tại đây." icon={History} />}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Footer summary ── */}
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-600">
              {programName ? <span className="font-medium text-gray-900">{programName}</span> : null}
              {programName && packageLabel ? <span> • {packageLabel}</span> : null}
              {hasSessions ? <span> • {remainingSessions}/{totalSessions} buổi còn lại</span> : null}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <Pill tone="neutral"><Calendar size={12} /> {formatDateTime(lastUpdatedAt)}</Pill>
              <Pill tone="neutral"><Receipt size={12} /> {sortedInvoices.length} hóa đơn</Pill>
              <Pill tone="neutral"><History size={12} /> {validHistory.length} giao dịch</Pill>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
