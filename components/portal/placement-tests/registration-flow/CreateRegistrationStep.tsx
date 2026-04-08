import { Clock3, Loader2, School, Sparkles, CheckCircle2 } from "lucide-react";
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

interface CreateRegistrationStepProps {
  isBootstrapping: boolean;
  effectiveStudentProfileId: string;
  programId: string;
  setProgramId: (value: string) => void;
  tuitionPlanId: string;
  setTuitionPlanId: (value: string) => void;
  isSecondaryEnabled: boolean;
  setIsSecondaryEnabled: (value: boolean) => void;
  secondaryProgramId: string;
  setSecondaryProgramId: (value: string) => void;
  secondaryProgramSkillFocus: string;
  setSecondaryProgramSkillFocus: (value: string) => void;
  expectedStartDate: string;
  setExpectedStartDate: (value: string) => void;
  sessionsPerWeek: number;
  handleSessionsPerWeekChange: (value: number) => void;
  selectedDays: string[];
  toggleDay: (value: string) => void;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (value: string) => void;
  useCustomTime: boolean;
  setUseCustomTime: (value: boolean) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  handleCreateRegistration: () => void;
  canCreate: boolean;
  isCreating: boolean;
  registrationId: string;
  programs: ProgramOption[];
  filteredTuitionPlans: TuitionPlan[];
  secondaryPrograms: ProgramOption[];
  sessionsPerWeekOptions: Array<{ value: number; label: string }>;
  weekDays: WeekDayOption[];
  timeSlots: TimeSlotOption[];
}

export default function CreateRegistrationStep({
  isBootstrapping,
  effectiveStudentProfileId,
  programId,
  setProgramId,
  tuitionPlanId,
  setTuitionPlanId,
  isSecondaryEnabled,
  setIsSecondaryEnabled,
  secondaryProgramId,
  setSecondaryProgramId,
  secondaryProgramSkillFocus,
  setSecondaryProgramSkillFocus,
  expectedStartDate,
  setExpectedStartDate,
  sessionsPerWeek,
  handleSessionsPerWeekChange,
  selectedDays,
  toggleDay,
  selectedTimeSlot,
  setSelectedTimeSlot,
  useCustomTime,
  setUseCustomTime,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  note,
  setNote,
  handleCreateRegistration,
  canCreate,
  isCreating,
  registrationId,
  programs,
  filteredTuitionPlans,
  secondaryPrograms,
  sessionsPerWeekOptions,
  weekDays,
  timeSlots,
}: CreateRegistrationStepProps) {
  // Biến selectedSlotMeta hiện tại không dùng tới do đã bỏ bảng Summary, 
  // nhưng vẫn giữ lại để không ảnh hưởng logic nếu sau này bạn cần dùng.
  const selectedSlotMeta = timeSlots.find((slot) => slot.value === selectedTimeSlot);

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-3 h-full flex flex-col">
      <div className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-900 shrink-0">
        <School size={18} className="text-red-600" />
        Tạo đăng ký học viên
      </div>

      {isBootstrapping ? (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
          <Loader2 size={16} className="animate-spin" /> Đang tải chương trình và gói học...
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* KHU VỰC 2 CỘT */}
          <div 
            className="flex-1 overflow-y-auto pr-1 mb-4"
            style={{ 
              display: "grid", 
              // Đã đổi thành 2 cột: Cột form (1 phần) và Cột Lịch (1.1 phần cho rộng rãi)
              gridTemplateColumns: "1fr 1.1fr", 
              gap: "16px",
              alignItems: "start" // Đổi thành start để 2 bên không bị kéo giãn chiều cao ép bằng nhau
            }}
          >
            {/* CỘT 1: Form Inputs */}
            <div className="space-y-3 rounded-xl border border-red-100 bg-white/80 p-3 h-fit">
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Student Profile ID</label>
                  <input
                    value={effectiveStudentProfileId}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Chương trình chính</label>
                  <Select value={programId} onValueChange={(val) => setProgramId(val)}>
                    <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200">
                      <SelectValue placeholder="Chọn chương trình" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Gói học</label>
                  <Select value={tuitionPlanId} onValueChange={(val) => setTuitionPlanId(val)}>
                    <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200">
                      <SelectValue placeholder="Chọn gói học" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTuitionPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.totalSessions} buổi)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ngày dự kiến bắt đầu</label>
                  <input
                    type="date"
                    value={expectedStartDate}
                    onChange={(e) => setExpectedStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div className="space-y-1 mt-1">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={isSecondaryEnabled}
                      onChange={(e) => setIsSecondaryEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    Đăng ký chương trình song song
                  </label>
                </div>

                {isSecondaryEnabled && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Chương trình song song</label>
                      <select
                        value={secondaryProgramId}
                        onChange={(e) => setSecondaryProgramId(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Không chọn secondary</option>
                        {secondaryPrograms.map((p) => (
                          <option key={`secondary-${p.id}`} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Chú trọng kỹ năng</label>
                      <input
                        value={secondaryProgramSkillFocus}
                        onChange={(e) => setSecondaryProgramSkillFocus(e.target.value)}
                        disabled={!secondaryProgramId}
                        placeholder="Ví dụ: Speaking"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>
            </div>

            {/* CỘT 2: Lịch Học */}
            <div className="space-y-3 rounded-xl border border-red-100 bg-white/80 p-3 h-fit">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock3 size={16} className="text-red-600" />
                Lịch học mong muốn <span className="text-red-500">*</span>
              </label>

              <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-600">Số buổi học mỗi tuần</p>
                  <div className="flex gap-2">
                    {sessionsPerWeekOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSessionsPerWeekChange(option.value)}
                        className={`flex-1 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                          sessionsPerWeek === option.value
                            ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm text-gray-600">
                    Chọn ngày học (tối đa {sessionsPerWeek} ngày) <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const isSelected = selectedDays.includes(day.value);
                      const isDisabled = !isSelected && selectedDays.length >= sessionsPerWeek;

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          disabled={isDisabled}
                          className={`rounded-xl border p-1.5 text-center transition-colors cursor-pointer ${
                            isSelected
                              ? "border-red-500 bg-red-100 text-red-700"
                              : isDisabled
                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="text-sm font-semibold leading-none">{day.shortLabel}</div>
                          <div className="text-[11px] leading-tight mt-1">{day.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Khung giờ học <span className="text-red-500">*</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setUseCustomTime(!useCustomTime)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      {useCustomTime ? "Chọn khung giờ mẫu" : "Nhập giờ tùy chỉnh"}
                    </button>
                  </div>

                  {!useCustomTime ? (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot.value)}
                          className={`rounded-xl border px-2 py-1.5 text-center transition-colors cursor-pointer ${
                            selectedTimeSlot === slot.value
                              ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="text-sm font-semibold leading-none">{slot.label}</div>
                          <div className="text-[11px] leading-tight mt-1">{slot.timeRange}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                      <span className="text-sm text-gray-500 font-medium">đến</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* KHU VỰC FOOTER: Nút Tạo & ID (Dưới cùng bên phải) */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-red-100 shrink-0">
          

            {/* Nút Tạo đăng ký (Ngoài cùng bên phải) */}
            <button
              type="button"
              onClick={handleCreateRegistration}
              disabled={!canCreate || isCreating || isBootstrapping}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-rose-600 cursor-pointer px-8 py-2.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 transition-all hover:opacity-90"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : null}
              Tạo đăng ký
            </button>
          </div>
        </div>
      )}
    </div>
  );
}