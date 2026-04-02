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
}

export default function UpgradeRegistrationStep({
  upgradeTuitionPlanId,
  setUpgradeTuitionPlanId,
  filteredTuitionPlans,
  tuitionPlanId,
  handleUpgrade,
  registrationId,
  isUpgrading,
}: UpgradeRegistrationStepProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-3">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
        <Rocket size={18} className="text-red-600" />
        Bước 3: Học vụ phát sinh (Upgrade)
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
            <option value="">Chọn gói để upgrade</option>
            {filteredTuitionPlans
              .filter((p) => p.id !== tuitionPlanId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.totalSessions} buổi)
                </option>
              ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={!registrationId || !upgradeTuitionPlanId || isUpgrading}
          className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpgrading ? "Đang upgrade..." : "Upgrade"}
        </button>
        </div>
      </div>
    </div>
  );
}
