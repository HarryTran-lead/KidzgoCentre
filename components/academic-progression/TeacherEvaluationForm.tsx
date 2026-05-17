"use client";

import { useState } from "react";
import { BookOpen, X } from "lucide-react";
import { createTeacherEvaluation } from "@/lib/api/academicProgressionService";
import type { CreateTeacherEvaluationRequest } from "@/types/academic-progression";

interface Props {
  studentId: string;
  moduleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type SkillKey = "speaking" | "listening" | "reading" | "writing" | "participation" | "confidence" | "behavior";

const SKILLS: { key: SkillKey; label: string }[] = [
  { key: "speaking", label: "Speaking (Nói)" },
  { key: "listening", label: "Listening (Nghe)" },
  { key: "reading", label: "Reading (Đọc)" },
  { key: "writing", label: "Writing (Viết)" },
  { key: "participation", label: "Participation (Tham gia)" },
  { key: "confidence", label: "Confidence (Tự tin)" },
  { key: "behavior", label: "Behavior (Hành vi)" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`h-7 w-7 rounded-lg text-sm font-bold transition-all ${star <= value ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-yellow-100"}`}
        >
          {star}
        </button>
      ))}
    </div>
  );
}

export default function TeacherEvaluationForm({ studentId, moduleId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Omit<CreateTeacherEvaluationRequest, "studentProfileId" | "moduleId">>({
    speaking: 3,
    listening: 3,
    reading: 3,
    writing: 3,
    participation: 3,
    confidence: 3,
    behavior: 3,
    notes: "",
    evaluatedAt: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSkill = (key: SkillKey, val: number) =>
    setForm((p) => ({ ...p, [key]: val }));

  const avgScore =
    (form.speaking + form.listening + form.reading + form.writing + form.participation + form.confidence + form.behavior) / 7;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await createTeacherEvaluation({
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
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <h2 className="text-base font-bold text-gray-800">Đánh giá học viên</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Average badge */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-purple-50 px-4 py-2.5">
          <span className="text-sm text-purple-700">Điểm trung bình</span>
          <span className={`text-lg font-bold ${avgScore >= 4 ? "text-green-600" : avgScore >= 3 ? "text-blue-600" : "text-orange-500"}`}>
            {avgScore.toFixed(1)} / 5
          </span>
        </div>

        <div className="space-y-3">
          {SKILLS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 w-48">{label}</span>
              <StarRating value={form[key]} onChange={(v) => setSkill(key, v)} />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ghi chú</label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
              placeholder="Nhận xét tổng thể về học viên..."
              value={form.notes ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ngày đánh giá</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
              value={form.evaluatedAt.slice(0, 16)}
              onChange={(e) => setForm((p) => ({ ...p, evaluatedAt: new Date(e.target.value).toISOString() }))}
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
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
            Lưu đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}
