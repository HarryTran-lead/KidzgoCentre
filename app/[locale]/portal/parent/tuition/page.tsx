"use client";

import { useState, useEffect } from "react";
import { CreditCard, Receipt, ShieldCheck } from "lucide-react";
import { getParentInvoices } from "@/lib/api/parentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

export default function ParentTuitionPage() {
  const [tuitionData, setTuitionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useSelectedStudentProfile();

  useEffect(() => {
    let alive = true;
    const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;
    getParentInvoices(studentProfileId ? { studentProfileId } : undefined)
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data ?? res?.data ?? null;
        setTuitionData(raw);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedProfile?.id]);

  const items = Array.isArray(tuitionData?.items) ? tuitionData.items : Array.isArray(tuitionData) ? tuitionData : [];
  const pendingItems = items.filter((inv: any) => inv.status === "pending" || inv.status === "Pending");
  const remainingAmount = pendingItems.reduce((sum: number, inv: any) => sum + (inv.amount ?? 0), 0);
  const dueDate = pendingItems[0]?.dueDate ?? "—";
  const formatCurrency = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
          <CreditCard size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Học phí & hoá đơn</h1>
          <p className="text-sm text-slate-600">Theo dõi các kỳ học, lịch sử thanh toán và yêu cầu xuất hoá đơn.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900">Còn lại: {loading ? "..." : formatCurrency(remainingAmount)}</div>
          <div className="text-sm text-slate-600">Hạn thanh toán {dueDate}</div>
        </div>
        <button className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
          Thanh toán ngay <ShieldCheck size={16} />
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 bg-white flex items-start gap-3">
        <Receipt className="text-indigo-600 mt-1" size={18} />
        <div className="flex-1 text-sm text-slate-700">
          Xem và tải hoá đơn điện tử sau mỗi lần thanh toán. Hỗ trợ thanh toán chuyển khoản, tiền mặt và ví điện tử.
        </div>
      </div>
    </div>
  );
}