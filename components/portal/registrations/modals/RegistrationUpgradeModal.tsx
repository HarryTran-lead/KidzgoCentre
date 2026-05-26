"use client";

import { createPortal } from "react-dom";
import { Loader2, X, Rocket } from "lucide-react";
import UpgradeRegistrationStep from "@/components/portal/registrations/modals/UpgradeRegistrationStep";
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Rocket size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Gia hạn gói học
                </h3>
                <p className="text-xs text-red-100">
                  Cập nhật thêm buổi học cho học viên
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingOptions ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-600">
              <Loader2 size={20} className="animate-spin text-red-500" />
              <span>Đang tải danh sách gói học...</span>
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
              studentProfileId={selectedRegistration?.studentProfileId || ""}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm border border-red-200 bg-white text-red-700 font-semibold hover:bg-red-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="px-6 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isUpgrading ? "Đang cập nhật..." : "Cập nhật gói học"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
