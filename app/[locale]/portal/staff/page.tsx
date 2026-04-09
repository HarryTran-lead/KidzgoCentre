"use client";
import { useState, useEffect } from "react";
import { Users, DollarSign, ClipboardList } from "lucide-react";
import { getStaffDashboard } from "@/lib/api/staffPortalService";

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">
          <Icon size={18} className="text-slate-700" />
        </div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function StaffDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getStaffDashboard()
      .then((res: any) => {
        if (!alive) return;
        setDashboard(res?.data?.data ?? res?.data ?? {});
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const activeStudents = String(dashboard?.activeStudents ?? dashboard?.totalStudents ?? 0);
  const monthlyRevenue = dashboard?.monthlyRevenue ?? dashboard?.revenue ?? "0 đ";
  const pendingEnrollments = String(dashboard?.pendingEnrollments ?? 0);
  const recentActivities: string[] = Array.isArray(dashboard?.recentActivities) ? dashboard.recentActivities : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Tổng quan</h1>
        <p className="text-slate-500 text-sm">Tình hình vận hành tháng này</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={Users} label="Học viên đang hoạt động" value={activeStudents} />
        <Stat icon={DollarSign} label="Thu học phí tháng này" value={typeof monthlyRevenue === "number" ? monthlyRevenue.toLocaleString("vi-VN") + " đ" : monthlyRevenue} />
        <Stat icon={ClipboardList} label="Đăng ký chờ duyệt" value={pendingEnrollments} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Nhật ký gần đây</h3>
        <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
          {recentActivities.length > 0
            ? recentActivities.map((a: string, i: number) => <li key={i}>{a}</li>)
            : <li>Không có hoạt động gần đây</li>
          }
        </ul>
      </div>
    </div>
  );
}
