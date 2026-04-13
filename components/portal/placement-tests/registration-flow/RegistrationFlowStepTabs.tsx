type StepKey = "create" | "assign";

interface RegistrationFlowStepTabsProps {
  activeStep: StepKey;
  onChangeStep: (step: StepKey) => void;
}

export default function RegistrationFlowStepTabs({
  activeStep,
  onChangeStep,
}: RegistrationFlowStepTabsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onChangeStep("create")}
        className={`rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
          activeStep === "create"
            ? "border-red-500 bg-red-50 text-red-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-red-200"
        }`}
      >
        <div className="text-base font-bold">Tạo đăng ký</div>
        <div className="text-xs">Nhập lịch và xem lớp gợi ý ngay</div>
      </button>
      <button
        type="button"
        onClick={() => onChangeStep("assign")}
        className={`rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
          activeStep === "assign"
            ? "border-red-500 bg-red-50 text-red-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-red-200"
        }`}
      >
        <div className="text-base font-bold">Xếp lớp thủ công & chờ</div>
        <div className="text-xs">Thao tác thủ công hoặc đưa vào danh sách chờ</div>
      </button>
    </div>
  );
}
