import { Rocket } from "lucide-react";
import type { TuitionPlan } from "@/types/admin/tuition_plan";

interface UpgradeRegistrationStepProps {
  upgradeTuitionPlanId: string;
  setUpgradeTuitionPlanId: (value: string) => void;
  filteredTuitionPlans: TuitionPlan[];
  tuitionPlanId: string;
  handleUpgrade: () => void;
  registrationId: string;
  isUpgrading: boolean;
  selectedProgramName: string;
  currentTuitionPlanName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
}

export default function UpgradeRegistrationStep({
  upgradeTuitionPlanId,
  setUpgradeTuitionPlanId,
  filteredTuitionPlans,
  tuitionPlanId,
  handleUpgrade,
  registrationId,
  isUpgrading,
  selectedProgramName,
  currentTuitionPlanName,
  totalSessions,
  usedSessions,
  remainingSessions,
}: UpgradeRegistrationStepProps) {
  const safeTotalSessions = Math.max(0, Number(totalSessions || 0));
  const safeUsedSessions = Math.max(0, Number(usedSessions || 0));
  const safeRemainingSessions = Math.max(0, Number(remainingSessions || 0));

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-3">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
        <Rocket size={18} className="text-red-600" />
        Học vụ phát sinh (cập nhật trên cùng đăng ký)
      </div>

      <div className="mb-3 rounded-xl border border-red-100 bg-white/90 p-3">
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-3">
          <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Chương trình hiện tại</p>
            <p className="font-semibold text-gray-900">{selectedProgramName || "-"}</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Gói đang học</p>
            <p className="font-semibold text-gray-900">{currentTuitionPlanName || "-"}</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Số buổi còn lại</p>
            <p className="font-semibold text-gray-900">
              {safeRemainingSessions} / {safeTotalSessions} buổi
            </p>
            <p className="text-xs text-gray-500">Đã học: {safeUsedSessions} buổi</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-100 bg-white/80 p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Gói học mới</label>
            <select
              value={upgradeTuitionPlanId}
              onChange={(e) => setUpgradeTuitionPlanId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Chọn gói để gia hạn</option>
              {filteredTuitionPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.totalSessions} buổi)
                  {p.id === tuitionPlanId ? " • Gói hiện tại" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Hiển thị các gói active của đúng chương trình học hiện tại (bao gồm cả gói hiện tại).
            </p>
            {filteredTuitionPlans.length === 0 && (
              <p className="text-xs font-medium text-red-600">
                Không có gói gia hạn phù hợp cho chương trình này.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={!registrationId || !upgradeTuitionPlanId || isUpgrading}
            className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
                       {isUpgrading ? "Đang cập nhật..." : "Cập nhật gói học"}
          </button>
        </div>
      </div>
    </div>
  );
}