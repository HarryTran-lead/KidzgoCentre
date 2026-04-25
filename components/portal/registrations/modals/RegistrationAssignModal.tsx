"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import SuggestAssignStep from "@/components/portal/placement-tests/registration-flow/SuggestAssignStep";
import type {
  EntryType,
  Registration,
  RegistrationTrackType,
  SuggestedClassBucket,
  WeeklyPatternEntry,
} from "@/types/registration";

type ManualClassOption = {
  id: string;
  label: string;
  remainingSlots: number | null;
  disabled: boolean;
  programId?: string;
  programName?: string;
};

type RegistrationAssignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRegistration: Registration | null;
  branchId?: string;
  isSuggesting: boolean;
  assignViewMode: "none" | "suggested" | "manual";
  handleSuggestClasses: () => void;
  handleLoadManualClasses: () => void;
  isLoadingManualClasses: boolean;
  handleMoveToWaitingList: () => void;
  isWaiting: boolean;
  suggestedClasses: SuggestedClassBucket | null;
  hasSecondaryTrack: boolean;
  showEntryTypeSelector?: boolean;
  selectedTrack: RegistrationTrackType;
  setSelectedTrack: (value: RegistrationTrackType) => void;
  selectedEntryType: EntryType;
  setSelectedEntryType: (value: EntryType) => void;
  selectedClassId: string;
  setSelectedClassId: (value: string) => void;
  activeSuggestedClasses: any[];
  activeAlternativeClasses: any[];
  formatSchedulePattern: (value?: string | null) => string;
  handleAssignClass: (
    sessionSelectionPattern?: string,
    entryType?: EntryType,
    firstStudyDate?: string,
    weeklyPattern?: WeeklyPatternEntry[] | null,
  ) => void;
  handleAssignSuggestedClasses: (payload: {
    primaryClassId: string;
    primarySessionSelectionPattern?: string;
    primaryWeeklyPattern?: WeeklyPatternEntry[] | null;
    primaryFirstStudyDate?: string;
    secondaryClassId?: string;
    secondarySessionSelectionPattern?: string;
    secondaryWeeklyPattern?: WeeklyPatternEntry[] | null;
    secondaryFirstStudyDate?: string;
    entryType?: EntryType;
    firstStudyDate?: string;
  }) => void;
  isAssigning: boolean;
  manualClasses: any[];
  manualClassOptions: ManualClassOption[];
  manualPrimaryClassId: string;
  setManualPrimaryClassId: (value: string) => void;
  manualSecondaryClassId: string;
  setManualSecondaryClassId: (value: string) => void;
  manualPrimaryProgramId?: string;
  manualPrimaryProgramName?: string;
  manualSecondaryProgramId?: string;
  manualSecondaryProgramName?: string;
  manualPrimarySessionPattern: string;
  setManualPrimarySessionPattern: (value: string) => void;
  manualSecondarySessionPattern: string;
  setManualSecondarySessionPattern: (value: string) => void;
  handleAssignManualClasses: (
    entryType?: EntryType,
    firstStudyDate?: string,
    primaryWeeklyPattern?: WeeklyPatternEntry[] | null,
    secondaryWeeklyPattern?: WeeklyPatternEntry[] | null,
    primaryFirstStudyDate?: string,
    secondaryFirstStudyDate?: string,
  ) => void;
};

export default function RegistrationAssignModal({
  isOpen,
  onClose,
  selectedRegistration,
  branchId,
  isSuggesting,
  assignViewMode,
  handleSuggestClasses,
  handleLoadManualClasses,
  isLoadingManualClasses,
  handleMoveToWaitingList,
  isWaiting,
  suggestedClasses,
  hasSecondaryTrack,
  showEntryTypeSelector = true,
  selectedTrack,
  setSelectedTrack,
  selectedEntryType,
  setSelectedEntryType,
  selectedClassId,
  setSelectedClassId,
  activeSuggestedClasses,
  activeAlternativeClasses,
  formatSchedulePattern,
  handleAssignClass,
  handleAssignSuggestedClasses,
  isAssigning,
  manualClasses,
  manualClassOptions,
  manualPrimaryClassId,
  setManualPrimaryClassId,
  manualSecondaryClassId,
  setManualSecondaryClassId,
  manualPrimaryProgramId,
  manualPrimaryProgramName,
  manualSecondaryProgramId,
  manualSecondaryProgramName,
  manualPrimarySessionPattern,
  setManualPrimarySessionPattern,
  manualSecondarySessionPattern,
  setManualSecondarySessionPattern,
  handleAssignManualClasses,
}: RegistrationAssignModalProps) {
  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <div>
            <h3 className="text-lg font-semibold">Gợi ý và xếp lớp</h3>
            <p className="text-xs text-white/90">
              Học viên: {selectedRegistration?.studentName || "-"}
            </p>
          </div>
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
          <SuggestAssignStep
            registrationId={selectedRegistration?.id || ""}
            isSuggesting={isSuggesting}
            assignViewMode={assignViewMode}
            handleSuggestClasses={handleSuggestClasses}
            allowManualAssign={true}
            handleLoadManualClasses={handleLoadManualClasses}
            isLoadingManualClasses={isLoadingManualClasses}
            branchId={selectedRegistration?.branchId || branchId}
            handleMoveToWaitingList={handleMoveToWaitingList}
            isWaiting={isWaiting}
            suggestedClasses={suggestedClasses}
            hasSecondaryTrack={hasSecondaryTrack}
            showEntryTypeSelector={showEntryTypeSelector}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            selectedEntryType={selectedEntryType}
            setSelectedEntryType={setSelectedEntryType}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            activeSuggestedClasses={activeSuggestedClasses}
            activeAlternativeClasses={activeAlternativeClasses}
            formatSchedulePattern={formatSchedulePattern}
            handleAssignClass={handleAssignClass}
            handleAssignSuggestedClasses={handleAssignSuggestedClasses}
            isAssigning={isAssigning}
            manualClasses={manualClasses}
            manualClassOptions={manualClassOptions}
            manualPrimaryClassId={manualPrimaryClassId}
            setManualPrimaryClassId={setManualPrimaryClassId}
            manualSecondaryClassId={manualSecondaryClassId}
            setManualSecondaryClassId={setManualSecondaryClassId}
            manualPrimaryProgramId={manualPrimaryProgramId}
            manualPrimaryProgramName={manualPrimaryProgramName}
            manualSecondaryProgramId={manualSecondaryProgramId}
            manualSecondaryProgramName={manualSecondaryProgramName}
            preferredSchedule={selectedRegistration?.preferredSchedule}
            manualPrimarySessionPattern={manualPrimarySessionPattern}
            setManualPrimarySessionPattern={setManualPrimarySessionPattern}
            manualSecondarySessionPattern={manualSecondarySessionPattern}
            setManualSecondarySessionPattern={setManualSecondarySessionPattern}
            handleAssignManualClasses={handleAssignManualClasses}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
