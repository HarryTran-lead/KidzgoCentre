"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  History,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  getParentInvoices,
  getParentOverview,
  getParentPayments,
} from "@/lib/api/parentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

type TabType = "overview" | "bills" | "history";
type Tone = "neutral" | "danger" | "warning" | "success" | "dark";
type OverviewData = Record<string, unknown>;

type InvoiceItem = {
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
};

type PaymentItem = {
  id: string;
  amount: number;
  method: string;
  date?: string;
  invoiceRef?: string;
  status: string;
  description?: string;
  fallback?: boolean;
};

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
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleDateString("vi-VN") : "Chưa có";
};

const formatDateTime = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed
    ? parsed.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa có";
};

const readPath = (source: unknown, path: string): unknown => {
  let current = source;
  for (const part of path.split(".")) {
    if (!isRecord(current) || !(part in current)) return undefined;
    current = current[part];
  }
  return current;
};

const pickText = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = asText(readPath(source, path));
    if (value) return value;
  }
  return "";
};

const pickNumber = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
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

const openInvoice = (status?: string) => {
  const key = (status ?? "").toLowerCase();
  return key === "pending" || key === "overdue";
};

const paidInvoice = (status?: string) => (status ?? "").toLowerCase() === "paid";

const successfulPayment = (status?: string) => {
  const key = (status ?? "").toLowerCase();
  return key === "" || key === "paid" || key === "success" || key === "completed" || key === "settled";
};

const invoiceBalance = (invoice: InvoiceItem) =>
  typeof invoice.remainingAmount === "number" ? invoice.remainingAmount : invoice.amount;

const invoiceTitle = (invoice: InvoiceItem) =>
  invoice.description || invoice.type || invoice.className || "Bill học phí";

const invoiceRef = (invoice: InvoiceItem) => invoice.invoiceNumber || invoice.id;

const daysUntil = (value?: string | null) => {
  const parsed = parseDate(value);
  if (!parsed) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const describeDue = (value?: string | null) => {
  const diff = daysUntil(value);
  if (diff == null) return "Chưa có hạn đóng";
  if (diff < 0) return `Quá hạn ${Math.abs(diff)} ngày`;
  if (diff === 0) return "Đến hạn hôm nay";
  return `Còn ${diff} ngày tới hạn`;
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
  const paymentValues = [payment.invoiceRef, payment.description].map((value) => value?.toLowerCase().trim()).filter(Boolean) as string[];
  const invoiceValues = [invoice.id, invoice.invoiceNumber, invoiceTitle(invoice)].map((value) => value?.toLowerCase().trim()).filter(Boolean) as string[];
  return paymentValues.some((paymentValue) =>
    invoiceValues.some(
      (invoiceValue) =>
        paymentValue === invoiceValue ||
        paymentValue.includes(invoiceValue) ||
        invoiceValue.includes(paymentValue),
    ),
  );
};

function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const classes: Record<Tone, string> = {
    neutral: "border-gray-200 bg-gray-100 text-gray-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dark: "border-slate-800 bg-slate-900 text-white",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${classes[tone]}`}>{children}</span>;
}

function StatCard({ label, value, hint, icon: Icon, tone = "red" }: { label: string; value: string; hint: string; icon: LucideIcon; tone?: "red" | "dark" | "neutral" }) {
  const tones = { red: "from-red-600 to-red-700", dark: "from-slate-800 to-slate-900", neutral: "from-gray-600 to-gray-700" };
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-gray-950">{value}</div>
          <div className="mt-3 text-xs leading-5 text-gray-600">{hint}</div>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${tones[tone]}`}><Icon size={20} /></div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-gray-200 py-3 last:border-b-0 last:pb-0">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="max-w-[60%] text-right text-sm font-medium text-gray-900">{value}</div>
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
        const nextOverview = unwrap(overviewRes);
        setOverview(isRecord(nextOverview) ? nextOverview : null);
        setInvoices(getItems(invoiceRes).map(normalizeInvoice));
        setPayments(getItems(paymentRes).map(normalizePayment));
        setLastUpdatedAt(new Date().toISOString());
      } catch (loadError) {
        console.error("[ParentPaymentPage] Failed to load package data", loadError);
        if (!alive) return;
        setError("Không thể tải dữ liệu gói học lúc này. Vui lòng thử lại sau.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [selectedProfile?.id, selectedProfile?.studentId]);

  const sortedInvoices = useMemo(() => [...invoices].sort((a, b) => {
    const groupA = openInvoice(a.status) ? 0 : paidInvoice(a.status) ? 1 : 2;
    const groupB = openInvoice(b.status) ? 0 : paidInvoice(b.status) ? 1 : 2;
    if (groupA !== groupB) return groupA - groupB;
    const dueA = parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const dueB = parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;
    return (parseDate(b.issuedAt)?.getTime() ?? 0) - (parseDate(a.issuedAt)?.getTime() ?? 0);
  }), [invoices]);

  useEffect(() => {
    if (!sortedInvoices.length) {
      setSelectedBillId(null);
      return;
    }
    if (!selectedBillId || !sortedInvoices.some((invoice) => invoice.id === selectedBillId)) {
      setSelectedBillId(sortedInvoices[0].id);
    }
  }, [selectedBillId, sortedInvoices]);

  const selectedBill = sortedInvoices.find((invoice) => invoice.id === selectedBillId) ?? sortedInvoices[0] ?? null;
  const studentInfo = isRecord(overview?.studentInfo) ? overview.studentInfo : Array.isArray(overview?.studentProfiles) ? overview?.studentProfiles?.find(isRecord) ?? null : null;
  const classItems = Array.isArray(overview?.classes) ? overview.classes.filter(isRecord) : isRecord(overview?.classInfo) ? [overview.classInfo] : [];
  const upcomingSessions = Array.isArray(overview?.upcomingSessions) ? overview.upcomingSessions.filter(isRecord) : [];
  const stats = isRecord(overview?.statistics) ? overview.statistics : {};
  const studentName = selectedProfile?.displayName || pickText(studentInfo, ["displayName", "name"]) || invoices[0]?.studentName || "Học viên đang chọn";
  const classNames = classItems.map((item) => pickText(item, ["title", "classTitle", "code", "classCode"])).filter(Boolean).slice(0, 3);
  const programLabel = pickText(overview, ["programName", "package.programName", "registration.programName"]) || classNames[0] || (selectedBill ? invoiceTitle(selectedBill) : "") || "Gói học hiện tại";
  const remainingSessions = pickNumber(overview, ["remainingSessions", "registration.remainingSessions", "package.remainingSessions", "studentPackage.remainingSessions"]);
  const usedSessions = pickNumber(overview, ["usedSessions", "registration.usedSessions", "package.usedSessions", "studentPackage.usedSessions"]);
  const totalSessions = pickNumber(overview, ["totalSessions", "registration.totalSessions", "package.totalSessions", "studentPackage.totalSessions"]);
  const openInvoices = sortedInvoices.filter((invoice) => openInvoice(invoice.status));
  const paidInvoices = sortedInvoices.filter((invoice) => paidInvoice(invoice.status));
  const nextDueInvoice = [...openInvoices].sort((a, b) => (parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER))[0] ?? null;
  const nextDueDate = pickText(overview, ["nextDueDate", "package.nextDueDate", "registration.nextDueDate"]) || nextDueInvoice?.dueDate || undefined;
  const backendOutstanding = pickNumber(overview, ["outstandingAmount", "package.outstandingAmount", "registration.outstandingAmount"]);
  const outstandingAmount = backendOutstanding ?? openInvoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  const history = payments.length ? payments : fallbackHistory(paidInvoices);
  const validHistory = history.filter((item) => item.fallback || successfulPayment(item.status));
  const totalSpent = validHistory.reduce((sum, item) => sum + item.amount, 0);
  const selectedBillHistory = selectedBill ? validHistory.filter((item) => paymentMatchesBill(item, selectedBill)) : [];
  const spentForBill = selectedBillHistory.reduce((sum, item) => sum + item.amount, 0) || (selectedBill && paidInvoice(selectedBill.status) ? selectedBill.amount : 0);
  const missingSessions = remainingSessions == null;
  const sessionValue = remainingSessions == null ? "Chưa đồng bộ" : `${remainingSessions} buổi`;
  const sessionHint = remainingSessions == null ? "Hệ thống phụ huynh chưa trả số buổi còn lại cho gói hiện tại." : totalSessions != null ? `${usedSessions ?? Math.max(totalSessions - remainingSessions, 0)}/${totalSessions} buổi đã dùng` : "Số buổi còn lại lấy trực tiếp từ backend.";
  const tabs: Array<{ key: TabType; label: string; icon: LucideIcon; count: string }> = [
    { key: "overview", label: "Gói hiện tại", icon: BookOpen, count: "1" },
    { key: "bills", label: "Bill & kỳ phí", icon: Receipt, count: String(sortedInvoices.length) },
    { key: "history", label: "Lịch sử chi tiêu", icon: History, count: String(validHistory.length) },
  ];

  if (loading) return <div className="min-h-screen bg-gray-50 p-4 md:p-6"><div className="space-y-6"><div className="h-56 animate-pulse rounded-[28px] bg-white shadow-sm" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl bg-white shadow-sm" />)}</div><div className="h-16 animate-pulse rounded-3xl bg-white shadow-sm" /><div className="grid gap-6 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-white shadow-sm" /><div className="h-80 animate-pulse rounded-3xl bg-white shadow-sm" /></div></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"><Sparkles size={14} /> Không còn là màn thanh toán trực tiếp</div>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><Wallet size={28} /></div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gói học & kỳ phí của phụ huynh</h1>
                  <p className="mt-2 text-sm leading-6 text-white/75">Theo dõi số buổi còn lại, mốc cần đóng tiếp, bill chi tiết và toàn bộ chi phí đã chi cho hồ sơ đang chọn.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/55">Đang xem</div>
                <div className="mt-2 text-lg font-semibold">{studentName}</div>
                <div className="mt-3 flex flex-wrap gap-2"><Pill tone="dark"><Users size={12} /> Hồ sơ đang chọn</Pill>{nextDueDate ? <Pill tone="neutral">{describeDue(nextDueDate)}</Pill> : null}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/55">Chương trình</div>
                <div className="mt-2 text-lg font-semibold">{programLabel}</div>
                <div className="mt-2 text-sm text-white/70">{classNames.length ? classNames.join(" • ") : "Trang đang bám dữ liệu bill và lớp hiện có."}</div>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Buổi còn lại" value={sessionValue} hint={sessionHint} icon={BookOpen} tone="red" />
          <StatCard label="Đến kỳ đóng lại" value={nextDueDate ? formatDate(nextDueDate) : "Chưa có bill mở"} hint={describeDue(nextDueDate)} icon={Calendar} tone="neutral" />
          <StatCard label="Công nợ hiện tại" value={formatCurrency(outstandingAmount)} hint={`${openInvoices.length} bill đang mở hoặc quá hạn`} icon={AlertCircle} tone="dark" />
          <StatCard label="Đã chi đến nay" value={formatCurrency(totalSpent)} hint={`${paidInvoices.length} bill đã hoàn tất`} icon={CreditCard} tone="red" />
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-1 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`flex flex-1 items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-left transition ${activeTab === tab.key ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-50"}`}>
                <div className="flex items-center gap-3"><tab.icon size={18} /><div><div className="text-sm font-semibold">{tab.label}</div><div className={`text-xs ${activeTab === tab.key ? "text-white/75" : "text-gray-500"}`}>{tab.count} mục liên quan</div></div></div>
                <ArrowRight size={16} className={activeTab === tab.key ? "text-white/75" : "text-gray-400"} />
              </button>
            ))}
          </div>
        </section>

        {activeTab === "overview" ? (
          <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Tình trạng gói hiện tại</div>
                    <div className="mt-2 text-sm leading-6 text-gray-600">
                      Khu vực này dùng để phụ huynh xem tình trạng gói học và kỳ phí hiện có, không
                      thay thế luồng thanh toán hay luồng quản trị khác.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedBill ? <Pill tone={paidInvoice(selectedBill.status) ? "success" : openInvoice(selectedBill.status) ? "warning" : "dark"}>{paidInvoice(selectedBill.status) ? "Đã thanh toán" : openInvoice(selectedBill.status) ? "Đang mở" : selectedBill.status}</Pill> : null}
                    <Pill tone={daysUntil(nextDueDate) != null && daysUntil(nextDueDate)! < 0 ? "danger" : "neutral"}>{describeDue(nextDueDate)}</Pill>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-red-500">Học viên</div>
                    <div className="mt-2 text-lg font-semibold text-gray-950">{studentName}</div>
                    <div className="mt-2 text-sm text-gray-600">{classNames.length ? classNames.join(" • ") : "Chưa có thông tin lớp trong overview."}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Gói / chương trình</div>
                    <div className="mt-2 text-lg font-semibold text-gray-950">{programLabel}</div>
                    <div className="mt-2 text-sm text-gray-600">{selectedBill ? invoiceTitle(selectedBill) : "Chưa có bill để đối chiếu"}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Kỳ phí gần nhất</div>
                    <div className="mt-2 text-lg font-semibold text-gray-950">{nextDueDate ? formatDate(nextDueDate) : "Chưa có"}</div>
                    <div className="mt-2 text-sm text-gray-600">{describeDue(nextDueDate)}</div>
                  </div>
                </div>

                {missingSessions ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    Số buổi còn lại sẽ hiển thị ngay khi backend parent trả dữ liệu gói học. Hiện tại
                    trang ưu tiên hiển thị đúng bill, hạn đóng và chi phí đã chi để tránh suy diễn sai.
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Buổi còn lại</div>
                    <div className="mt-2 text-2xl font-bold text-gray-950">{sessionValue}</div>
                    <div className="mt-2 text-sm text-gray-600">{sessionHint}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Bill đang mở</div>
                    <div className="mt-2 text-2xl font-bold text-gray-950">{openInvoices.length}</div>
                    <div className="mt-2 text-sm text-gray-600">{nextDueInvoice ? `Bill gần nhất đến hạn ${formatDate(nextDueInvoice.dueDate)}` : "Hiện không có bill mở."}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Lịch học sắp tới</div>
                    <div className="mt-2 text-2xl font-bold text-gray-950">{upcomingSessions.length || asNumber(stats.upcomingSessions)}</div>
                    <div className="mt-2 text-sm text-gray-600">{upcomingSessions[0] ? `${pickText(upcomingSessions[0], ["classTitle", "classCode"])} • ${formatDateTime(pickText(upcomingSessions[0], ["plannedDatetime"]))}` : "Chưa có buổi học sắp tới."}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Lịch học và bill cần chú ý</div>
                <div className="mt-1 text-sm text-gray-600">Ghép lịch học gần nhất với các bill đang mở để phụ huynh theo dõi dễ hơn.</div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">Buổi học sắp tới</div>
                    {upcomingSessions.length ? upcomingSessions.slice(0, 4).map((session, index) => (
                      <div key={`${pickText(session, ["sessionId", "classId"])}-${index}`} className="rounded-2xl border border-white bg-white p-4">
                        <div className="text-sm font-semibold text-gray-900">{pickText(session, ["classTitle", "classCode"]) || "Buổi học sắp tới"}</div>
                        <div className="mt-1 text-sm text-gray-600">{formatDateTime(pickText(session, ["plannedDatetime"]))}</div>
                        <div className="mt-2 text-xs text-gray-500">{pickText(session, ["attendanceStatus"]) || "Chưa điểm danh"}</div>
                      </div>
                    )) : <EmptyState title="Chưa có lịch học gần" description="Khi có buổi học sắp diễn ra cho hồ sơ đang chọn, danh sách sẽ hiện tại đây." icon={Calendar} />}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">Bill cần theo dõi ngay</div>
                    {openInvoices.length ? openInvoices.slice(0, 4).map((invoice) => (
                      <button key={invoice.id} type="button" onClick={() => { setSelectedBillId(invoice.id); setActiveTab("bills"); }} className="w-full rounded-2xl border border-white bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{invoiceTitle(invoice)}</div>
                            <div className="mt-1 text-sm text-gray-600">{formatCurrency(invoiceBalance(invoice))}</div>
                            <div className="mt-2 text-xs text-gray-500">Hạn đóng {formatDate(invoice.dueDate)}</div>
                          </div>
                          <Pill tone={daysUntil(invoice.dueDate) != null && daysUntil(invoice.dueDate)! < 0 ? "danger" : "neutral"}>{describeDue(invoice.dueDate)}</Pill>
                        </div>
                      </button>
                    )) : <EmptyState title="Không có bill mở" description="Hồ sơ đang chọn hiện chưa phát sinh bill chờ thanh toán hoặc quá hạn." icon={Receipt} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Bill đang theo dõi</div>
                <div className="mt-1 text-sm text-gray-600">Xem nhanh bill hiện tại cùng số tiền đã chi cho bill đó.</div>
                {selectedBill ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-red-500">Bill hiện tại</div>
                      <div className="mt-2 text-lg font-semibold text-gray-950">{invoiceTitle(selectedBill)}</div>
                      <div className="mt-3 flex flex-wrap gap-2"><Pill tone="neutral">Mã {invoiceRef(selectedBill)}</Pill><Pill tone={daysUntil(selectedBill.dueDate) != null && daysUntil(selectedBill.dueDate)! < 0 ? "danger" : "neutral"}>{describeDue(selectedBill.dueDate)}</Pill></div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 p-5">
                      <DetailRow label="Học viên" value={selectedBill.studentName || studentName} />
                      <DetailRow label="Ngày phát hành" value={formatDate(selectedBill.issuedAt)} />
                      <DetailRow label="Hạn đóng" value={formatDate(selectedBill.dueDate)} />
                      <DetailRow label="Tổng bill" value={formatCurrency(selectedBill.amount)} />
                      <DetailRow label="Còn cần xử lý" value={formatCurrency(invoiceBalance(selectedBill))} />
                      <DetailRow label="Đã chi theo bill này" value={formatCurrency(spentForBill)} />
                      <DetailRow label="Mô tả" value={selectedBill.description || selectedBill.type || "Chưa có mô tả chi tiết"} />
                    </div>
                    {selectedBill.payosPaymentLink ? <a href={selectedBill.payosPaymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"><FileText size={16} /> Mở bill gốc</a> : null}
                  </div>
                ) : <EmptyState title="Chưa có bill để xem" description="Khi backend trả bill cho hồ sơ đang chọn, chi tiết sẽ hiển thị ở đây." icon={FileText} />}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Ghi chú phạm vi dữ liệu</div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">Trang này bám vào overview, invoices và payments của hồ sơ đang chọn.</div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">Nếu chưa có remainingSessions cho phụ huynh, trang sẽ hiển thị trạng thái chờ đồng bộ thay vì tự suy diễn.</div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">Phần chi phí đã chi ưu tiên payment history, nếu chưa có sẽ fallback từ bill đã thanh toán.</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "bills" ? (
          <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Danh sách bill</div>
                  <div className="mt-1 text-sm text-gray-600">Bill đang mở được đẩy lên trước để phụ huynh theo dõi sát hơn.</div>
                </div>
                <Pill tone="neutral"><Receipt size={12} /> {sortedInvoices.length} bill</Pill>
              </div>
              <div className="mt-5 space-y-3">
                {sortedInvoices.length ? sortedInvoices.map((invoice) => {
                  const active = selectedBill?.id === invoice.id;
                  return (
                    <button key={invoice.id} type="button" onClick={() => setSelectedBillId(invoice.id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-300 bg-red-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{invoiceTitle(invoice)}</div>
                          <div className="mt-1 text-sm text-gray-600">{formatCurrency(invoiceBalance(invoice))}</div>
                          <div className="mt-2 text-xs text-gray-500">Phát hành {formatDate(invoice.issuedAt)} • Hạn đóng {formatDate(invoice.dueDate)}</div>
                        </div>
                        <Pill tone={paidInvoice(invoice.status) ? "success" : openInvoice(invoice.status) ? "warning" : "dark"}>{paidInvoice(invoice.status) ? "Đã thanh toán" : openInvoice(invoice.status) ? "Đang mở" : invoice.status}</Pill>
                      </div>
                    </button>
                  );
                }) : <EmptyState title="Chưa có bill" description="Danh sách bill cho hồ sơ đang chọn sẽ hiển thị ở đây khi backend trả dữ liệu." icon={Receipt} />}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Chi tiết bill</div>
              <div className="mt-1 text-sm text-gray-600">Xem đầy đủ bill, hạn đóng, số tiền còn lại và phần đã chi.</div>
              {selectedBill ? (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-red-500">Tổng bill</div><div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(selectedBill.amount)}</div></div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-gray-500">Còn cần xử lý</div><div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(invoiceBalance(selectedBill))}</div></div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-gray-500">Đã chi theo bill</div><div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(spentForBill)}</div></div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <DetailRow label="Mã bill" value={invoiceRef(selectedBill)} />
                    <DetailRow label="Học viên" value={selectedBill.studentName || studentName} />
                    <DetailRow label="Chương trình / gói" value={programLabel} />
                    <DetailRow label="Mô tả" value={invoiceTitle(selectedBill)} />
                    <DetailRow label="Ngày phát hành" value={formatDate(selectedBill.issuedAt)} />
                    <DetailRow label="Hạn đóng" value={formatDate(selectedBill.dueDate)} />
                    <DetailRow label="Tình trạng hạn" value={describeDue(selectedBill.dueDate)} />
                    <DetailRow label="Nội dung thêm" value={selectedBill.note || "Bill này chưa có ghi chú bổ sung."} />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Lịch sử chi theo bill này</div>
                        <div className="mt-1 text-sm text-gray-600">Ghép từ payment history theo mã bill hoặc mô tả liên quan.</div>
                      </div>
                      <Pill tone="neutral"><History size={12} /> {selectedBillHistory.length} giao dịch</Pill>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedBillHistory.length ? selectedBillHistory.map((payment) => (
                        <div key={payment.id} className="rounded-2xl border border-white bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{payment.method}</div>
                              <div className="mt-1 text-sm text-gray-600">{payment.description || payment.invoiceRef || "Giao dịch học phí"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
                              <div className="mt-1 text-xs text-gray-500">{formatDateTime(payment.date)}</div>
                            </div>
                          </div>
                        </div>
                      )) : <EmptyState title="Chưa có lịch sử gắn với bill này" description="Nếu payment history chưa map được theo bill, bạn vẫn xem được tổng chi ở tab lịch sử." icon={History} />}
                    </div>
                  </div>
                </div>
              ) : <EmptyState title="Chọn một bill để xem chi tiết" description="Khi bạn chọn bill ở cột trái, toàn bộ thông tin chi tiết sẽ hiển thị tại đây." icon={FileText} />}
            </div>
          </section>
        ) : null}

        {activeTab === "history" ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="text-sm text-gray-500">Tổng đã chi</div><div className="mt-2 text-2xl font-bold text-gray-950">{formatCurrency(totalSpent)}</div><div className="mt-3 text-xs text-gray-600">Tổng hợp cho hồ sơ đang chọn dựa trên payment history hoặc bill đã thanh toán.</div></div>
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="text-sm text-gray-500">Bill đã hoàn tất</div><div className="mt-2 text-2xl font-bold text-gray-950">{paidInvoices.length}</div><div className="mt-3 text-xs text-gray-600">Số bill đã ở trạng thái thanh toán hoàn tất.</div></div>
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="text-sm text-gray-500">Bản ghi chi tiêu</div><div className="mt-2 text-2xl font-bold text-gray-950">{validHistory.length}</div><div className="mt-3 text-xs text-gray-600">{payments.length ? "Danh sách này dùng để phụ huynh xem lại mức chi cho từng kỳ phí." : "Đang fallback từ bill đã thanh toán do payment history chưa trả dữ liệu."}</div></div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Lịch sử chi tiêu của phụ huynh</div>
                  <div className="mt-1 text-sm text-gray-600">Xem lại từng lần đã đóng cho hồ sơ hiện tại và đối chiếu với bill tương ứng.</div>
                </div>
                <Pill tone="neutral"><CheckCircle2 size={12} /> {validHistory.length} giao dịch hợp lệ</Pill>
              </div>
              <div className="mt-5 space-y-3">
                {validHistory.length ? validHistory.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-gray-100 p-3 text-gray-600"><History size={18} /></div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><div className="text-sm font-semibold text-gray-900">{payment.method}</div>{payment.fallback ? <Pill tone="neutral">Từ bill đã thanh toán</Pill> : null}</div>
                          <div className="mt-1 text-sm text-gray-600">{payment.description || payment.invoiceRef || "Giao dịch học phí"}</div>
                          <div className="mt-2 text-xs text-gray-500">{payment.invoiceRef ? `Tham chiếu ${payment.invoiceRef}` : "Chưa có mã tham chiếu"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
                        <div className="mt-1 text-xs text-gray-500">{formatDateTime(payment.date)}</div>
                      </div>
                    </div>
                  </div>
                )) : <EmptyState title="Chưa có lịch sử chi tiêu" description="Khi hệ thống ghi nhận bill đã thanh toán hoặc payment history, danh sách sẽ hiển thị tại đây." icon={History} />}
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Tóm tắt cuối trang</div>
              <div className="mt-1 text-sm text-gray-600">Đây là nơi phụ huynh theo dõi gói học, bill và chi phí đã chi của hồ sơ đang chọn. Luồng thanh toán trực tiếp không được đụng tới ở trang này.</div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <Pill tone="neutral"><Calendar size={12} /> Cập nhật {formatDateTime(lastUpdatedAt)}</Pill>
              <Pill tone="neutral"><Receipt size={12} /> {sortedInvoices.length} bill</Pill>
              <Pill tone="neutral"><History size={12} /> {validHistory.length} giao dịch</Pill>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
