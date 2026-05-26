import { useEffect, useState } from "react";
import { BookOpen, Package, Rocket, Wallet } from "lucide-react";
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

      <div className="mb-3 space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-amber-600" />
              <p className="text-sm font-medium text-gray-600">Vé học còn lại</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {ticketLoading ? "..." : `${displayedAvailable}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">Đã dùng: {displayedConsumed}</p>
          </div>
          
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/30 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={14} className="text-blue-600" />
              <p className="text-sm font-medium text-gray-600">Chương trình</p>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {selectedProgramName || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-emerald-600" />
              <p className="text-sm font-medium text-gray-600">Tổng vé cấp</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {displayedTotalGranted}
            </p>
            <p className="text-sm text-gray-500 mt-1 truncate">Gói: {currentTuitionPlanName || "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-100 bg-white/80 p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-red-600" />
            <label className="text-sm font-medium text-gray-900">Gói học mới</label>
          </div>
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
                  <div className="flex items-center gap-2">
                    <span>{p.name} ({p.totalSessions} buổi)</span>
                    {p.id === tuitionPlanId && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded">
                        Gói hiện tại
                      </span>
                    )}
                  </div>
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
      </div>
    </div>
  );
}