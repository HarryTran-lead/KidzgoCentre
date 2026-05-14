import { useEffect, useState } from "react";
import { Rocket, Wallet } from "lucide-react";
import { getTicketBalance } from "@/lib/api/learningTicketService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import type { LearningTicketBalance } from "@/types/learning-ticket";

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
  studentProfileId?: string;
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
  studentProfileId,
}: UpgradeRegistrationStepProps) {
  const safeTotalSessions = Math.max(0, Number(totalSessions || 0));
  const safeUsedSessions = Math.max(0, Number(usedSessions || 0));
  const safeRemainingSessions = Math.max(0, Number(remainingSessions || 0));
  const [ticketBalance, setTicketBalance] = useState<LearningTicketBalance | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!studentProfileId) {
      setTicketBalance(null);
      setTicketLoading(false);
      return () => {
        isActive = false;
      };
    }

    const loadBalance = async () => {
      try {
        setTicketLoading(true);
        const balance = await getTicketBalance(studentProfileId);
        if (!isActive) return;
        setTicketBalance(balance ?? null);
      } catch {
        if (!isActive) return;
        setTicketBalance(null);
      } finally {
        if (isActive) {
          setTicketLoading(false);
        }
      }
    };

    loadBalance();

    return () => {
      isActive = false;
    };
  }, [studentProfileId]);

  const displayedAvailable = ticketBalance?.available ?? safeRemainingSessions;
  const displayedConsumed = ticketBalance?.consumed ?? safeUsedSessions;
  const displayedTotalGranted = ticketBalance?.totalGranted ?? safeTotalSessions;

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-3">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
        <Rocket size={18} className="text-red-600" />
        Học vụ phát sinh
      </div>

      <div className="mb-3 rounded-xl border border-red-100 bg-white/90 p-3">
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-3">
          <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Vé học còn lại</p>
            <p className="flex items-center gap-1 font-semibold text-gray-900">
              <Wallet size={14} className="text-amber-600" />
              {ticketLoading ? "Đang tải..." : `${displayedAvailable} vé`}
            </p>
            <p className="text-xs text-gray-500">Đã dùng: {displayedConsumed} vé</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Chương trình hiện tại</p>
            <p className="font-semibold text-gray-900">{selectedProgramName || "-"}</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Tổng vé đã cấp</p>
            <p className="font-semibold text-gray-900">{displayedTotalGranted} vé</p>
            <p className="text-xs text-gray-500">Gói đang học: {currentTuitionPlanName || "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-100 bg-white/80 p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Gói học mới</label>
            <Select
              value={upgradeTuitionPlanId || "__none__"}
              onValueChange={(value) =>
                setUpgradeTuitionPlanId(value === "__none__" ? "" : value)
              }
            >
              <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn gói để gia hạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chọn gói để gia hạn</SelectItem>
                {filteredTuitionPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.totalSessions} buổi)
                    {p.id === tuitionPlanId ? " • Gói hiện tại" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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