"use client";

import { useState } from "react";
import { Award, X } from "lucide-react";
import { createAssessment } from "@/lib/api/academicProgressionService";
import type { CreateAssessmentRequest } from "@/types/academic-progression";

interface Props {
  studentId: string;
  moduleId: string;
  sessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssessmentForm({ studentId, moduleId, sessionId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Omit<CreateAssessmentRequest, "studentProfileId" | "moduleId">>({
    type: "Module Assessment",
    score: 0,
    teacherComment: "",
    sessionId: sessionId ?? null,
    assessedAt: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultLabel = form.score >= 70 ? "ĐẠT" : "CHƯA ĐẠT";
  const resultColor = form.score >= 70 ? "text-green-600" : "text-red-500";

  const handleSave = async () => {
    if (form.score < 0 || form.score > 100) {
      setError("Điểm phải từ 0 đến 100");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await createAssessment({
      studentProfileId: studentId,
      moduleId,
      ...form,
    });
    if (res.isSuccess) {
      onSuccess();
    } else {
      setError(res.message ?? "Lưu thất bại");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-bold text-gray-800">Tạo Assessment</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Score input */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Điểm (0-100) *</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={form.score}
                onChange={(e) => setForm((p) => ({ ...p, score: Number(e.target.value) }))}
              />
              <span className={`text-sm font-bold ${resultColor}`}>{resultLabel}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Quy tắc: &ge;70 = Đạt | &lt;70 = Chưa đạt</p>
          </div>

          {/* Score visualization */}
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full transition-all ${form.score >= 70 ? "bg-green-500" : "bg-red-400"}`}
              style={{ width: `${Math.min(100, form.score)}%` }}
            />
          </div>

          {/* Assessment type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Loại kiểm tra</label>
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="Module Assessment">Module Assessment</option>
              <option value="Mid-term Assessment">Mid-term Assessment</option>
              <option value="Final Assessment">Final Assessment</option>
              <option value="Remedial Assessment">Remedial Assessment</option>
            </select>
          </div>

          {/* Teacher comment */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nhận xét giáo viên</label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="Nhận xét về kết quả học tập..."
              value={form.teacherComment ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, teacherComment: e.target.value }))}
            />
          </div>

          {/* Assessed at */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ngày kiểm tra</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={form.assessedAt.slice(0, 16)}
              onChange={(e) => setForm((p) => ({ ...p, assessedAt: new Date(e.target.value).toISOString() }))}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
            Lưu Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
