"use client";

import { useState, useEffect } from "react";
import { TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { getParentProgress } from "@/lib/api/parentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

export default function ParentProgressPage() {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useSelectedStudentProfile();

  useEffect(() => {
    let alive = true;
    const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;
    getParentProgress(studentProfileId ? { studentProfileId } : undefined)
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data ?? res?.data ?? null;
        setProgress(raw);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedProfile?.id]);

  const completionRate = progress?.completionRate ?? progress?.completion ?? "—";
  const skillSummary = progress?.skillSummary ?? progress?.summary ?? "";
  const materialsNote = progress?.materialsNote ?? "";

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 grid place-items-center">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tiến độ học tập</h1>
          <p className="text-sm text-gray-600">Xem lộ trình kỹ năng, điểm từng bài và phản hồi mới nhất từ giáo viên.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <CheckCircle size={18} /> Hoàn thành {completionRate}
          </div>
          <p className="text-sm text-red-700 mt-1">{skillSummary || "Đang tải dữ liệu tiến độ..."}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen size={18} /> Bài tập & tài liệu
          </div>
          <p className="text-sm text-gray-600 mt-1">{materialsNote || "Xem chi tiết từng bài nộp, điểm số và tài liệu giáo viên gửi."}</p>
        </div>
      </div>
    </div>
  );
}