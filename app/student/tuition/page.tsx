"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Banknote,
} from "lucide-react";

/* =========================================================
   DATA (tĩnh để bạn copy-dán nhanh như yêu cầu)
   ========================================================= */

type DebtCourse = {
  name: string;
  total: number;
  paid: number;
  due: string;
  overdue?: boolean;
};

const debtCourses: DebtCourse[] = [
  {
    name: "Khóa Tiếng Anh A1",
    total: 2_000_000,
    paid: 1_500_000,
    due: "15/1/2025",
    overdue: true,
  },
  {
    name: "Khóa Tiếng Nhật N5",
    total: 2_500_000,
    paid: 2_500_000,
    due: "1/12/2024",
    overdue: true,
  },
];

type Payment = {
  course: string;
  date: string;
  amount: number;
  method: "Chuyển khoản" | "Tiền mặt";
};

const payments: Payment[] = [
  { course: "Khóa Tiếng Anh A1", date: "1/12/2024", amount: 1_000_000, method: "Chuyển khoản" },
  { course: "Khóa Tiếng Anh A1", date: "15/11/2024", amount: 500_000, method: "Tiền mặt" },
  { course: "Khóa Tiếng Nhật N5", date: "1/10/2024", amount: 2_500_000, method: "Chuyển khoản" },
];

const methods = [
  {
    icon: <CreditCard size={18} />,
    title: "Chuyển khoản ngân hàng",
    note: "STK: 1234567890 - Ngân hàng ABC",
  },
  {
    icon: <Banknote size={18} />,
    title: "Thanh toán tại trung tâm",
    note: "Tiền mặt hoặc thẻ ATM",
  },
];

/* =========================================================
   UTILS
   ========================================================= */

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

/* =========================================================
   PAGE
   ========================================================= */

export default function TuitionPage() {
  const [tab, setTab] = useState<"debt" | "history">("debt");

  const { totalDebt, debtCount } = useMemo(() => {
    const owedList = debtCourses.map((c) => Math.max(0, c.total - c.paid));
    const total = owedList.reduce((a, b) => a + b, 0);
    const count = owedList.filter((x) => x > 0).length;
    return { totalDebt: total, debtCount: count };
  }, []);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button
          onClick={() => setTab("debt")}
          className={`py-2 rounded-xl text-sm font-semibold transition ${
            tab === "debt" ? "bg-white shadow text-slate-900" : "text-slate-600"
          }`}
        >
          Công nợ
        </button>
        <button
          onClick={() => setTab("history")}
          className={`py-2 rounded-xl text-sm font-semibold transition ${
            tab === "history" ? "bg-white shadow text-slate-900" : "text-slate-600"
          }`}
        >
          Lịch sử
        </button>
      </div>

      {tab === "debt" ? (
        <DebtSection totalDebt={totalDebt} debtCount={debtCount} />
      ) : (
        <HistorySection />
      )}
    </div>
  );
}

/* =========================================================
   CÔNG NỢ
   ========================================================= */

function DebtSection({ totalDebt, debtCount }: { totalDebt: number; debtCount: number }) {
  return (
    <div className="space-y-6">
      {/* Tổng quan công nợ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-100 p-5">
            <div className="text-slate-600 text-sm">Tổng nợ</div>
            <div className="text-2xl font-extrabold text-rose-600">{formatVND(totalDebt)}</div>
          </div>
          <div className="rounded-xl bg-slate-100 p-5">
            <div className="text-slate-600 text-sm">Khoản nợ</div>
            <div className="text-2xl font-extrabold text-slate-900">{debtCount} khóa</div>
          </div>
        </div>
      </div>

      {/* Danh sách khóa */}
      {debtCourses.map((c, idx) => {
        const owed = Math.max(0, c.total - c.paid);
        const progress = Math.min(1, c.paid / c.total);

        const isPaid = owed === 0;

        return (
          <div
            key={idx}
            className={`rounded-2xl border p-5 ${
              isPaid
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-amber-200 bg-amber-50/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">{c.name}</div>
                <div className="text-slate-600">
                  Hạn thanh toán: {c.due}{" "}
                  {c.overdue && <span className="text-rose-600">(Quá hạn)</span>}
                </div>
              </div>

              {isPaid ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Đã thanh toán
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  Còn nợ
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="h-2.5 w-full rounded-full bg-slate-300/40 overflow-hidden">
                <div
                  className="h-full bg-slate-900 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="mt-2 text-right text-slate-600">{Math.round(progress * 100)}%</div>
            </div>

            {/* Numbers */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <div className="text-slate-600">Tổng học phí</div>
                <div className="text-xl font-bold text-slate-900">{formatVND(c.total)}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <div className="text-slate-600">Đã thanh toán</div>
                <div className="text-xl font-bold text-emerald-600">{formatVND(c.paid)}</div>
              </div>
            </div>

            {!isPaid && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <div className="text-amber-800 font-medium">
                  Còn nợ: <b>{formatVND(owed)}</b>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                  <CreditCard size={16} /> Thanh toán
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   LỊCH SỬ THANH TOÁN + PHƯƠNG THỨC
   ========================================================= */

function HistorySection() {
  return (
    <div className="space-y-6">
      {/* Lịch sử thanh toán */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-slate-900">Lịch sử thanh toán</h3>
        </div>

        <div className="p-4 space-y-3">
          {payments.map((p, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-100 px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{p.course}</div>
                  <div className="text-sm text-slate-500">{p.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{formatVND(p.amount)}</div>
                  <div className="text-sm text-slate-500">{p.method}</div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">
                  Hoàn thành
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-slate-900">Phương thức thanh toán</h3>
        </div>

        <div className="p-4 space-y-3">
          {methods.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center text-slate-700">
                {m.icon}
              </div>
              <div>
                <div className="font-medium text-slate-900">{m.title}</div>
                <div className="text-sm text-slate-500">{m.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
