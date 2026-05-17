"use client";

import { useState } from "react";
import { TrendingUp, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createPromotionDecision } from "@/lib/api/academicProgressionService";
import type { CreatePromotionDecisionRequest, PromotionDecisionOutcome } from "@/types/academic-progression";

interface Props {
  studentId: string;
  moduleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionDecisionPanel({ studentId, moduleId, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ decision: PromotionDecisionOutcome } | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    const body: CreatePromotionDecisionRequest = {
      studentProfileId: studentId,
      moduleId,
      reason: reason || null,
      approvedAt: new Date().toISOString(),
    };
    const res = await createPromotionDecision(body);
    if (res.isSuccess && res.data) {
      setResult({ decision: res.data.decision });
    } else {
      setError(res.message ?? "Xét lên lớp thất bại");
    }
    setSaving(false);
  };

  const DECISION_CONFIG: Record<PromotionDecisionOutcome, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    Pass: {
      label: "LÊN LỚP",
      color: "text-green-600 bg-green-50 border-green-200",
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      description: "Học viên đủ điều kiện lên module tiếp theo. Module mới đã được tự động tạo.",
    },
    Fail: {
      label: "KHÔNG ĐẠT",
      color: "text-red-600 bg-red-50 border-red-200",
      icon: <X className="h-8 w-8 text-red-500" />,
      description: "Học viên không đủ điều kiện lên lớp.",
    },
    RemedialRequired: {
      label: "CẦN PHỤ ĐẠO",
      color: "text-orange-600 bg-orange-50 border-orange-200",
      icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
      description: "Học viên cần tham gia phụ đạo. Kế hoạch phụ đạo đã được tự động tạo (2 buổi).",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h2 className="text-base font-bold text-gray-800">Xét lên lớp</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          /* Result view */
          <div className={`rounded-2xl border p-5 text-center ${DECISION_CONFIG[result.decision].color}`}>
            <div className="flex justify-center mb-3">
              {DECISION_CONFIG[result.decision].icon}
            </div>
            <p className="text-xl font-bold mb-2">{DECISION_CONFIG[result.decision].label}</p>
            <p className="text-sm">{DECISION_CONFIG[result.decision].description}</p>
            <button
              onClick={onSuccess}
              className="mt-4 rounded-xl bg-white border px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        ) : (
          /* Form view */
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Hệ thống sẽ tự động quyết định dựa trên:</p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• Assessment kết quả (Pass/Fail)</li>
                <li>• Completion &ge;80%</li>
                <li>• Confidence &ge;3/5 trong đánh giá giáo viên</li>
              </ul>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Ghi chú (override)
              </label>
              <textarea
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                placeholder="Lý do đặc biệt nếu có..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
                Xét lên lớp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
