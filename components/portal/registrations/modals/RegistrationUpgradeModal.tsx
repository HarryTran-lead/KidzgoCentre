"use client";

import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import UpgradeRegistrationStep from "@/components/portal/placement-tests/registration-flow/UpgradeRegistrationStep";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import type { Registration } from "@/types/registration";

type RegistrationUpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoadingOptions: boolean;
  upgradeTuitionPlanId: string;
  setUpgradeTuitionPlanId: (value: string) => void;
  filteredTuitionPlans: TuitionPlan[];
  selectedRegistration: Registration | null;
  handleUpgrade: () => void;
  isUpgrading: boolean;
};

export default function RegistrationUpgradeModal({
  isOpen,
  onClose,
  isLoadingOptions,
  upgradeTuitionPlanId,
  setUpgradeTuitionPlanId,
  filteredTuitionPlans,
  selectedRegistration,
  handleUpgrade,
  isUpgrading,
}: RegistrationUpgradeModalProps) {
  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <h3 className="text-lg font-semibold">Cập nhật gói học</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/15"
            aria-label="Dong"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {isLoadingOptions ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-600">
              <Loader2 size={16} className="animate-spin" /> Dang tai danh sach goi hoc...
            </div>
          ) : (
            <UpgradeRegistrationStep
              upgradeTuitionPlanId={upgradeTuitionPlanId}
              setUpgradeTuitionPlanId={setUpgradeTuitionPlanId}
              filteredTuitionPlans={filteredTuitionPlans}
              tuitionPlanId={selectedRegistration?.tuitionPlanId || ""}
              handleUpgrade={handleUpgrade}
              registrationId={selectedRegistration?.id || ""}
              isUpgrading={isUpgrading}
              selectedProgramName={selectedRegistration?.programName || ""}
              currentTuitionPlanName={selectedRegistration?.tuitionPlanName || ""}
              totalSessions={selectedRegistration?.totalSessions || 0}
              usedSessions={selectedRegistration?.usedSessions || 0}
              remainingSessions={selectedRegistration?.remainingSessions || 0}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
