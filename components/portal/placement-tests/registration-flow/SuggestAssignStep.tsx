import { ArrowRight, Loader2, School } from "lucide-react";
import type { RegistrationTrackType, SuggestedClassBucket } from "@/types/registration";

interface SuggestAssignStepProps {
  registrationId: string;
  isSuggesting: boolean;
  assignViewMode: "none" | "suggested" | "manual";
  handleSuggestClasses: () => void;
  allowManualAssign: boolean;
  handleLoadManualClasses: () => void;
  isLoadingManualClasses: boolean;
  branchId?: string;
  handleMoveToWaitingList: () => void;
  isWaiting: boolean;
  suggestedClasses: SuggestedClassBucket | null;
  hasSecondaryTrack: boolean;
  selectedTrack: RegistrationTrackType;
  setSelectedTrack: (value: RegistrationTrackType) => void;
  selectedClassId: string;
  setSelectedClassId: (value: string) => void;
  activeSuggestedClasses: any[];
  activeAlternativeClasses: any[];
  formatSchedulePattern: (value?: string | null) => string;
  handleAssignClass: () => void;
  isAssigning: boolean;
  manualClasses: any[];
  manualClassOptions: Array<{
    id: string;
    label: string;
    remainingSlots: number | null;
    disabled: boolean;
  }>;
  manualPrimaryClassId: string;
  setManualPrimaryClassId: (value: string) => void;
  manualSecondaryClassId: string;
  setManualSecondaryClassId: (value: string) => void;
  handleAssignManualClasses: () => void;
}

export default function SuggestAssignStep({
  registrationId,
  isSuggesting,
  assignViewMode,
  handleSuggestClasses,
  allowManualAssign,
  handleLoadManualClasses,
  isLoadingManualClasses,
  branchId,
  handleMoveToWaitingList,
  isWaiting,
  suggestedClasses,
  hasSecondaryTrack,
  selectedTrack,
  setSelectedTrack,
  selectedClassId,
  setSelectedClassId,
  activeSuggestedClasses,
  activeAlternativeClasses,
  formatSchedulePattern,
  handleAssignClass,
  isAssigning,
  manualClasses,
  manualClassOptions,
  manualPrimaryClassId,
  setManualPrimaryClassId,
  manualSecondaryClassId,
  setManualSecondaryClassId,
  handleAssignManualClasses,
}: SuggestAssignStepProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
        <ArrowRight size={18} className="text-red-600" />
        Bước 2: Gợi ý lớp phù hợp và xếp lớp
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <button
            type="button"
            onClick={handleSuggestClasses}
            disabled={!registrationId || isSuggesting}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              assignViewMode === "suggested"
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-300 bg-white text-red-700"
            }`}
          >
            {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <School size={14} />}
            Gợi ý lớp phù hợp
          </button>

          <button
            type="button"
            onClick={handleLoadManualClasses}
            disabled={!allowManualAssign || !registrationId || isLoadingManualClasses || !branchId}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              assignViewMode === "manual"
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-300 bg-white text-red-700"
            }`}
          >
            {isLoadingManualClasses ? <Loader2 size={14} className="animate-spin" /> : <School size={14} />}
            Xếp lớp thủ công
          </button>

          <button
            type="button"
            onClick={handleMoveToWaitingList}
            disabled={!registrationId || isWaiting}
            className="w-full rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWaiting ? "Đang xử lý..." : "Đưa vào waiting list"}
          </button>
        </div>

        <div className="rounded-xl border border-red-100 bg-white/80 p-3">
          <p className="pb-2 text-xs text-gray-500">
            Mỗi lần chỉ hiển thị một giao diện xếp lớp để thao tác nhanh và ít rối.
          </p>

          {assignViewMode === "suggested" && suggestedClasses && (
            <div className="space-y-3">
              {(hasSecondaryTrack || suggestedClasses.programName) && (
                <div className="rounded-xl border border-red-200 bg-white p-3">
                  <div className="text-sm font-semibold text-gray-900">Track xếp lớp</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack("primary");
                        setSelectedClassId(String(suggestedClasses.suggestedClasses?.[0]?.id ?? ""));
                      }}
                      className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                        selectedTrack === "primary"
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      Primary
                      {suggestedClasses.programName ? ` • ${suggestedClasses.programName}` : ""}
                    </button>
                    {hasSecondaryTrack ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrack("secondary");
                          setSelectedClassId(String(suggestedClasses.secondarySuggestedClasses?.[0]?.id ?? ""));
                        }}
                        className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                          selectedTrack === "secondary"
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        Secondary
                        {suggestedClasses.secondaryProgramName ? ` • ${suggestedClasses.secondaryProgramName}` : ""}
                      </button>
                    ) : null}
                  </div>
                  {selectedTrack === "secondary" && suggestedClasses.secondaryProgramSkillFocus ? (
                    <div className="mt-2 text-xs text-gray-500">
                      Skill focus: {suggestedClasses.secondaryProgramSkillFocus}
                    </div>
                  ) : null}
                </div>
              )}

              {activeSuggestedClasses.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {activeSuggestedClasses.map((cls: any) => {
                    const isSelected = selectedClassId === cls.id;
                    const remainingSlots =
                      typeof cls.remainingSlots === "number"
                        ? cls.remainingSlots
                        : typeof cls.capacity === "number" && typeof cls.currentEnrollment === "number"
                          ? cls.capacity - cls.currentEnrollment
                          : typeof cls.capacity === "number" && typeof cls.currentEnrollmentCount === "number"
                            ? cls.capacity - cls.currentEnrollmentCount
                            : null;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassId(String(cls.id))}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "border-red-500 bg-red-100"
                            : "border-red-200 bg-white hover:bg-red-50"
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">{cls.code}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          Còn chỗ: {typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : "-"}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-600" title={cls.schedulePattern || ""}>
                          Lịch: {formatSchedulePattern(cls.schedulePattern)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                  Chưa có lớp gợi ý cho track {selectedTrack}.
                </div>
              )}

              {activeAlternativeClasses.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="text-sm font-semibold text-amber-900">Lớp thay thế</div>
                  <div className="mt-2 text-xs text-amber-800">
                    Có {activeAlternativeClasses.length} lớp thay thế cho track {selectedTrack}.
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleAssignClass}
                disabled={!selectedClassId || isAssigning}
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning ? "Đang xếp lớp..." : "Xếp vào lớp đã chọn"}
              </button>
            </div>
          )}

          {allowManualAssign && assignViewMode === "manual" && (
            <div className="space-y-3 rounded-xl border border-red-200 bg-white p-3">
              <div className="text-sm font-semibold text-gray-900">Xếp lớp thủ công theo chương trình</div>
              <p className="text-xs text-gray-500">
                Chế độ thủ công sẽ gọi API assign class riêng cho từng track. Nếu có secondary, hệ thống sẽ gọi 2 lần: Primary rồi Secondary.
              </p>

              {manualClasses.length === 0 && !isLoadingManualClasses ? (
                <div className="text-xs text-gray-600">
                  Không có lớp để xếp thủ công trong phạm vi chi nhánh hiện tại.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Lớp cho chương trình Primary</label>
                    <select
                      value={manualPrimaryClassId}
                      onChange={(e) => setManualPrimaryClassId(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">Chọn lớp Primary</option>
                      {manualClassOptions.map((option) => (
                        <option
                          key={`manual-primary-${option.id}`}
                          value={option.id}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasSecondaryTrack && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Lớp cho chương trình Secondary</label>
                      <select
                        value={manualSecondaryClassId}
                        onChange={(e) => setManualSecondaryClassId(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Chọn lớp Secondary</option>
                        {manualClassOptions.map((option) => (
                          <option
                            key={`manual-secondary-${option.id}`}
                            value={option.id}
                            disabled={option.disabled}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleAssignManualClasses}
                disabled={
                  !manualPrimaryClassId ||
                  isAssigning ||
                  manualClasses.length === 0 ||
                  (hasSecondaryTrack && !manualSecondaryClassId)
                }
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning
                  ? "Đang xếp lớp..."
                  : hasSecondaryTrack
                    ? "Xếp lớp thủ công (Primary + Secondary)"
                    : "Xếp lớp thủ công (Primary)"}
              </button>
            </div>
          )}

          {assignViewMode === "none" && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
              Chọn "Gợi ý lớp phù hợp" hoặc "Xếp lớp thủ công" để bắt đầu thao tác xếp lớp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
