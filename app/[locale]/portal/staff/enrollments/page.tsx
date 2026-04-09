"use client";

import { useState, useEffect } from "react";
import { getStaffPendingEnrollments, approveStaffEnrollment, rejectStaffEnrollment } from "@/lib/api/staffPortalService";

export default function StaffEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getStaffPendingEnrollments()
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data?.items ?? res?.data?.data ?? res?.data ?? [];
        setEnrollments(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const handleApprove = (id: string) => {
    approveStaffEnrollment(id).then(() => {
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
    }).catch(() => {});
  };

  const handleReject = (id: string) => {
    rejectStaffEnrollment(id).then(() => {
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Duyệt đăng ký</h1>
        <p className="text-slate-500 text-sm">Xử lý hồ sơ ghi danh mới</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        {enrollments.map((e: any) => (
          <div key={e.id} className="p-3 rounded-xl border flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{e.name ?? e.studentName ?? "—"}</div>
              <div className="text-xs text-slate-500">{e.course ?? e.className ?? ""} • {e.time ?? e.schedule ?? ""}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleReject(e.id)} className="px-3 py-2 rounded-xl border">Từ chối</button>
              <button onClick={() => handleApprove(e.id)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Phê duyệt</button>
            </div>
          </div>
        ))}
        {!loading && enrollments.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">Không có đăng ký chờ duyệt</p>
        )}
      </div>
    </div>
  );
}
