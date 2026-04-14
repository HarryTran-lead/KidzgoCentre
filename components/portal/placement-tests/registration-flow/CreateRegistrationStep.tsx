import type { ReactNode } from "react";
import { Clock3, Loader2, School, Calendar, Tag, FileText, Sparkles } from "lucide-react";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import { SelectContent, Select, SelectTrigger, SelectValue, SelectItem } from "@/components/lightswind/select";

type ProgramOption = {
  id: string;
  name: string;
};

type WeekDayOption = {
  value: string;
  shortLabel: string;
  label: string;
};

type TimeSlotOption = {
  value: string;
  label: string;
  timeRange: string;
};

type ScheduleMode = "single" | "manual";

interface CreateRegistrationStepProps {
  isBootstrapping: boolean;
  effectiveStudentProfileId: string;
  studentName: string;
  programId: string;
  setProgramId: (value: string) => void;
  tuitionPlanId: string;
  setTuitionPlanId: (value: string) => void;
  isSecondaryEnabled: boolean;
  setIsSecondaryEnabled: (value: boolean) => void;
  secondaryAllowed: boolean;
  secondaryProgramId: string;
  setSecondaryProgramId: (value: string) => void;
  secondaryProgramSkillFocus: string;
  setSecondaryProgramSkillFocus: (value: string) => void;
  expectedStartDate: string;
  setExpectedStartDate: (value: string) => void;
  scheduleMode: ScheduleMode;
  onScheduleModeChange: (mode: ScheduleMode) => void;
  sessionsPerWeek: number;
  handleSessionsPerWeekChange: (value: number) => void;
  manualSessionsInput: string;
  onManualSessionsInputChange: (value: string) => void;
  onManualSessionsInputBlur: () => void;
  selectedDays: string[];
  toggleDay: (value: string) => void;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  handleCreateRegistration: () => void;
  canCreate: boolean;
  isCreating: boolean;
  registrationId: string;
  programs: ProgramOption[];
  filteredTuitionPlans: TuitionPlan[];
  secondaryPrograms: ProgramOption[];
  weekDays: WeekDayOption[];
  timeSlots: TimeSlotOption[];
  suggestedPanel?: ReactNode;
}

export default function CreateRegistrationStep({
  isBootstrapping,
  effectiveStudentProfileId,
  studentName,
  programId,
  setProgramId,
  tuitionPlanId,
  setTuitionPlanId,
  isSecondaryEnabled,
  setIsSecondaryEnabled,
  secondaryAllowed,
  secondaryProgramId,
  setSecondaryProgramId,
  secondaryProgramSkillFocus,
  setSecondaryProgramSkillFocus,
  expectedStartDate,
  setExpectedStartDate,
  scheduleMode,
  onScheduleModeChange,
  sessionsPerWeek,
  handleSessionsPerWeekChange,
  manualSessionsInput,
  onManualSessionsInputChange,
  onManualSessionsInputBlur,
  selectedDays,
  toggleDay,
  selectedTimeSlot,
  setSelectedTimeSlot,
  note,
  setNote,
  handleCreateRegistration,
  canCreate,
  isCreating,
  programs,
  filteredTuitionPlans,
  secondaryPrograms,
  weekDays,
  timeSlots,
  suggestedPanel,
}: CreateRegistrationStepProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2 shrink-0">
        <div className="p-1.5 bg-red-100 rounded-xl">
          <School size={18} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tạo đăng ký học viên</h2>
          <p className="text-xs text-gray-500 mt-0.5">Điền thông tin để tạo lịch học mới</p>
        </div>
      </div>

      {isBootstrapping ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin text-red-500" /> 
          <span>Đang tải chương trình và gói học...</span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 p-5 pt-4">
          
          {/* 2 CỘT CHÍNH */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            
            {/* Hàng 1: Thông tin chính - 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Cột trái: Thông tin học viên & chương trình */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                    Thông tin cơ bản
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Tên học viên */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Học viên</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-red-600">
                            {studentName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-800 font-medium">{studentName}</span>
                      </div>
                    </div>

                    {/* Chương trình chính */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Chương trình chính</label>
                      <Select value={programId} onValueChange={(val) => setProgramId(val)}>
                        <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                          <SelectValue placeholder="Chọn chương trình" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gói học */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Gói học</label>
                      <Select value={tuitionPlanId} onValueChange={(val) => setTuitionPlanId(val)}>
                        <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                          <SelectValue placeholder="Chọn gói học" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredTuitionPlans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} <span className="text-gray-400 text-xs ml-1">({p.totalSessions} buổi)</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ngày bắt đầu */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Ngày dự kiến bắt đầu</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={expectedStartDate}
                          onChange={(e) => setExpectedStartDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chương trình song song */}
                {secondaryAllowed && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                        Chương trình song song
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSecondaryEnabled}
                          onChange={(e) => setIsSecondaryEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-red-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                    </div>

                    {isSecondaryEnabled && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Chương trình</label>
                          <Select value={secondaryProgramId} onValueChange={setSecondaryProgramId}>
                            <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm">
                              <SelectValue placeholder="Chọn chương trình" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Không chọn</SelectItem>
                              {secondaryPrograms.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Chú trọng kỹ năng</label>
                          <input
                            value={secondaryProgramSkillFocus}
                            onChange={(e) => setSecondaryProgramSkillFocus(e.target.value)}
                            disabled={!secondaryProgramId}
                            placeholder="VD: Speaking, Writing, ..."
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-400"
                          />
                        </div>
                      </div>
                    )}

                    {!isSecondaryEnabled && (
                      <p className="text-xs text-gray-400 italic mt-1">Bật để đăng ký thêm chương trình song song</p>
                    )}
                  </div>
                )}
              </div>

              {/* Cột phải: Lịch học */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock3 size={14} className="text-red-500" />
                  Lịch học mong muốn
                  <span className="text-xs text-red-500 font-normal ml-1">*</span>
                </h3>

                <div className="space-y-4">
                  {/* Số buổi/tuần */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Số buổi mỗi tuần</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onScheduleModeChange("single")}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                          scheduleMode === "single"
                            ? "border-red-500 bg-red-500 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50"
                        }`}
                      >
                        1 buổi/tuần
                      </button>
                      <button
                        type="button"
                        onClick={() => onScheduleModeChange("manual")}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                          scheduleMode === "manual"
                            ? "border-red-500 bg-red-500 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50"
                        }`}
                      >
                        Nhập tay
                      </button>
                    </div>
                    {scheduleMode === "manual" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={manualSessionsInput}
                          onChange={(e) => onManualSessionsInputChange(e.target.value)}
                          onBlur={onManualSessionsInputBlur}
                          placeholder="Số buổi/tuần"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Ngày học */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">
                      Ngày học <span className="text-red-500">(tối đa {sessionsPerWeek} ngày)</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {weekDays.map((day) => {
                        const isSelected = selectedDays.includes(day.value);
                        const isDisabled = !isSelected && selectedDays.length >= sessionsPerWeek;

                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            disabled={isDisabled}
                            className={`rounded-xl border p-2 text-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-red-400 bg-red-50 text-red-700 ring-1 ring-red-400"
                                : isDisabled
                                  ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50"
                            }`}
                          >
                            <div className="text-sm font-semibold">{day.shortLabel}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{day.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Khung giờ */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Khung giờ học</label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot.value)}
                          className={`rounded-xl border px-2 py-2 text-center transition-all cursor-pointer ${
                            selectedTimeSlot === slot.value
                              ? "border-red-500 bg-red-500 text-white shadow-sm"
                              : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50"
                          }`}
                        >
                          <div className="text-sm font-semibold">{slot.label}</div>
                          <div className="text-[10px] opacity-80 mt-0.5">{slot.timeRange}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hàng 2: Ghi chú */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                Ghi chú
              </h3>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú cho đăng ký này (nếu có)..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
              />
            </div>

            {/* Suggested Panel */}
            {suggestedPanel && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-3">
                <div className="flex items-center gap-2 text-amber-700 text-sm mb-1">
                  <Sparkles size={14} />
                  <span className="font-medium">Gợi ý</span>
                </div>
                {suggestedPanel}
              </div>
            )}
          </div>

          {/* Footer với nút tạo */}
          <div className="flex justify-end pt-4 mt-2 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={handleCreateRegistration}
              disabled={!canCreate || isCreating || isBootstrapping}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 transition-all hover:shadow-lg hover:from-red-600 hover:to-red-700 active:scale-[0.98]"
            >
              {isCreating && <Loader2 size={16} className="animate-spin" />}
              <span>{isCreating ? "Đang tạo..." : "Tạo đăng ký"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}