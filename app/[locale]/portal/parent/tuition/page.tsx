"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Search,
  TicketCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  getCompatibleTicketForSession,
  getCompatibleTicketsForStudent,
  getTicketBalance,
  getTicketLedger,
} from "@/lib/api/learningTicketService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import type {
  CompatibleLearningTicketItem,
  CompatibleTicketCheckResponse,
  LearningTicketBalance,
  LearningTicketLedgerItem,
} from "@/types/learning-ticket";

type Tone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-gray-200 bg-gray-100 text-gray-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asText(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function transactionLabel(type?: string | null) {
  const normalized = asText(type).toLowerCase();
  if (normalized === "grant") return "Cấp vé";
  if (normalized === "consume") return "Dùng vé";
  if (normalized === "refund") return "Hoàn vé";
  if (normalized === "void") return "Hủy vé";
  if (normalized === "adjustment") return "Điều chỉnh";
  return type || "Giao dịch";
}

function transactionTone(type?: string | null): Tone {
  const normalized = asText(type).toLowerCase();
  if (normalized === "grant" || normalized === "refund") return "success";
  if (normalized === "consume" || normalized === "void") return "danger";
  if (normalized === "adjustment") return "warning";
  return "neutral";
}

function quantityLabel(item: LearningTicketLedgerItem) {
  const amount = asNumber(item.quantity) ?? 0;
  const normalized = asText(item.transactionType).toLowerCase();
  const sign = normalized === "consume" || normalized === "void" ? "-" : "+";
  return `${sign}${Math.abs(amount)}`;
}

function ticketTitle(ticket: CompatibleLearningTicketItem) {
  return (
    asText(ticket.name) ||
    asText(ticket.learningTicketTypeName) ||
    asText(ticket.ticketTypeName) ||
    asText(ticket.learningTicketTypeCode) ||
    asText(ticket.ticketTypeCode) ||
    "Vé học"
  );
}

function ticketCode(ticket: CompatibleLearningTicketItem) {
  return (
    asText(ticket.learningTicketTypeCode) ||
    asText(ticket.ticketTypeCode) ||
    asText(ticket.ticketTypeId) ||
    "-"
  );
}

function ticketAvailable(ticket: CompatibleLearningTicketItem) {
  return (
    asNumber(ticket.available) ??
    asNumber(ticket.remaining) ??
    asNumber(ticket.quantity) ??
    0
  );
}

function ticketTotal(ticket: CompatibleLearningTicketItem) {
  return asNumber(ticket.totalGranted) ?? asNumber(ticket.available) ?? null;
}

function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "red" | "green" | "blue" | "dark";
}) {
  const accents: Record<"red" | "green" | "blue" | "dark", string> = {
    red: "from-red-600 to-rose-600",
    green: "from-emerald-600 to-teal-600",
    blue: "from-blue-600 to-cyan-600",
    dark: "from-slate-800 to-slate-700",
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-red-100 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-gray-950">{value}</div>
          <div className="mt-2 text-xs text-gray-500">{hint}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-r ${accents[tone]} text-white shadow-sm`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-500">
        <Icon size={24} />
      </div>
      <div className="mt-4 text-base font-semibold text-gray-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-gray-600">{description}</div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
      <Loader2 className="mx-auto mb-3 animate-spin text-red-500" size={24} />
      Đang tải dữ liệu vé học...
    </div>
  );
}

export default function ParentTuitionPage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id ?? "";
  const studentName = selectedProfile?.displayName || "Học viên";

  const [balance, setBalance] = useState<LearningTicketBalance | null>(null);
  const [ledgerItems, setLedgerItems] = useState<LearningTicketLedgerItem[]>([]);
  const [compatibleTickets, setCompatibleTickets] = useState<CompatibleLearningTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CompatibleTicketCheckResponse | null>(null);

  const loadData = useCallback(
    async (initial = false) => {
      if (!studentProfileId) {
        setBalance(null);
        setLedgerItems([]);
        setCompatibleTickets([]);
        setLoading(false);
        return;
      }

      try {
        if (initial) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const [balanceRes, ledgerRes, compatibleRes] = await Promise.all([
          getTicketBalance(studentProfileId),
          getTicketLedger(studentProfileId),
          getCompatibleTicketsForStudent(studentProfileId),
        ]);

        setBalance(balanceRes);
        setLedgerItems(Array.isArray(ledgerRes?.items) ? ledgerRes.items : []);
        setCompatibleTickets(Array.isArray(compatibleRes?.items) ? compatibleRes.items : []);
        setLastUpdatedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      } catch (loadError) {
        console.error("Error loading learning tickets:", loadError);
        setError("Không thể tải dữ liệu vé học. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentProfileId],
  );

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const sortedLedgerItems = useMemo(
    () =>
      [...ledgerItems].sort((a, b) => {
        const left = new Date(a.createdAt || "").getTime();
        const right = new Date(b.createdAt || "").getTime();
        return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
      }),
    [ledgerItems],
  );

  const available = asNumber(balance?.available) ?? 0;
  const consumed = asNumber(balance?.consumed) ?? 0;
  const totalGranted = asNumber(balance?.totalGranted) ?? available + consumed;
  const compatibleAvailable = compatibleTickets.reduce(
    (sum, ticket) => sum + ticketAvailable(ticket),
    0,
  );

  const handleCheckSession = async () => {
    const trimmedSessionId = sessionId.trim();
    if (!studentProfileId || !trimmedSessionId) return;

    try {
      setChecking(true);
      setCheckResult(null);
      const result = await getCompatibleTicketForSession(studentProfileId, trimmedSessionId);
      setCheckResult(result);
    } catch (checkError) {
      console.error("Error checking compatible ticket:", checkError);
      setCheckResult({
        compatible: false,
        ticketItemId: null,
        ticketTypeId: null,
        ticketTypeCode: null,
        reason: "Không kiểm tra được buổi học này.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
              <TicketCheck size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vé học & gói học</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{studentName}</span>
                {lastUpdatedAt ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={13} /> Cập nhật {lastUpdatedAt}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadData(false)}
            disabled={refreshing || loading || !studentProfileId}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {!studentProfileId ? (
          <EmptyState
            icon={AlertCircle}
            title="Chưa chọn học viên"
            description="Chọn hồ sơ học viên để xem số dư vé học và các gói có thể dùng."
          />
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <LoadingPanel />
        ) : studentProfileId ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Vé còn lại"
                value={`${available}`}
                hint="Số vé khả dụng trên hệ thống"
                icon={WalletCards}
                tone="red"
              />
              <StatCard
                label="Đã sử dụng"
                value={`${consumed}`}
                hint="Tổng vé đã được ghi nhận tiêu thụ"
                icon={History}
                tone="dark"
              />
              <StatCard
                label="Tổng đã cấp"
                value={`${totalGranted}`}
                hint="Cộng dồn từ các lần cấp vé"
                icon={BadgeCheck}
                tone="green"
              />
              <StatCard
                label="Vé tương thích"
                value={`${compatibleAvailable}`}
                hint={`${compatibleTickets.length} loại vé có thể dùng`}
                icon={CheckCircle2}
                tone="blue"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-gray-900">Sổ vé học</div>
                    <div className="mt-1 text-sm text-gray-500">Các lần cấp, dùng, hoàn hoặc điều chỉnh vé.</div>
                  </div>
                  <Pill tone="neutral">
                    <FileText size={12} /> {sortedLedgerItems.length} giao dịch
                  </Pill>
                </div>

                <div className="mt-5 space-y-3">
                  {sortedLedgerItems.length ? (
                    sortedLedgerItems.slice(0, 8).map((item) => {
                      const tone = transactionTone(item.transactionType);
                      return (
                        <div key={item.id} className="rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${toneClasses[tone]}`}>
                                {tone === "danger" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {transactionLabel(item.transactionType)}
                                  </div>
                                  {item.ticketTypeCode ? <Pill tone="neutral">{item.ticketTypeCode}</Pill> : null}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  {item.reason || "Không có ghi chú"}
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  {formatDateTime(item.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className={`text-right text-lg font-bold ${tone === "danger" ? "text-red-600" : "text-emerald-600"}`}>
                              {quantityLabel(item)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={History}
                      title="Chưa có giao dịch vé"
                      description="Khi hệ thống cấp hoặc dùng vé, lịch sử sẽ hiển thị tại đây."
                    />
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-gray-900">Vé có thể sử dụng</div>
                      <div className="mt-1 text-sm text-gray-500">Danh sách vé tương thích với hồ sơ học viên.</div>
                    </div>
                    <Pill tone={compatibleTickets.length ? "success" : "neutral"}>
                      <TicketCheck size={12} /> {compatibleTickets.length}
                    </Pill>
                  </div>

                  <div className="mt-5 space-y-3">
                    {compatibleTickets.length ? (
                      compatibleTickets.map((ticket, index) => {
                        const total = ticketTotal(ticket);
                        const remaining = ticketAvailable(ticket);
                        return (
                          <div key={asText(ticket.id) || asText(ticket.ticketItemId) || `ticket-${index}`} className="rounded-2xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{ticketTitle(ticket)}</div>
                                <div className="mt-1 text-sm text-gray-600">
                                  {[asText(ticket.programName), asText(ticket.levelName)].filter(Boolean).join(" • ") || "Không có nhãn chương trình"}
                                </div>
                              </div>
                              <Pill tone="success">{ticketCode(ticket)}</Pill>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-red-100 bg-red-50 p-3">
                                <div className="text-xs text-red-500">Còn lại</div>
                                <div className="mt-1 text-xl font-bold text-gray-950">{remaining}</div>
                              </div>
                              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                                <div className="text-xs text-gray-500">Tổng vé</div>
                                <div className="mt-1 text-xl font-bold text-gray-950">{total ?? "-"}</div>
                              </div>
                            </div>
                            {ticket.expiresAt ? (
                              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                <CalendarClock size={13} /> Hết hạn {formatDate(ticket.expiresAt)}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <EmptyState
                        icon={TicketCheck}
                        title="Chưa có vé tương thích"
                        description="Khi học viên có vé phù hợp, danh sách sẽ hiển thị tại đây."
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-base font-semibold text-gray-900">Kiểm tra buổi học</div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={sessionId}
                      onChange={(event) => setSessionId(event.target.value)}
                      placeholder="Session ID"
                      className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCheckSession()}
                      disabled={checking || !sessionId.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {checking ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      Kiểm tra
                    </button>
                  </div>

                  {checkResult ? (
                    <div className={`mt-4 rounded-2xl border p-4 ${checkResult.compatible ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`grid h-10 w-10 place-items-center rounded-2xl ${checkResult.compatible ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {checkResult.compatible ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {checkResult.compatible ? "Có vé phù hợp" : "Chưa có vé phù hợp"}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {checkResult.reason || "Không có ghi chú từ hệ thống."}
                          </div>
                          {checkResult.ticketTypeCode ? (
                            <div className="mt-2">
                              <Pill tone={checkResult.compatible ? "success" : "neutral"}>
                                {checkResult.ticketTypeCode}
                              </Pill>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
