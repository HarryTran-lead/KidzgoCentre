import { BookOpen, X } from "lucide-react";

interface RegistrationFlowHeaderProps {
  studentName?: string;
  onClose: () => void;
}

export default function RegistrationFlowHeader({
  studentName,
  onClose,
}: RegistrationFlowHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-linear-to-r from-red-600 to-red-700 px-6 py-4 text-white">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Đăng Ký Từ kiểm tra đầu vào</h2>
          <p className="text-sm text-red-100">
            Học viên: {studentName || "Chưa có tên"}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="rounded-full p-2 transition-all hover:bg-white/20 active:scale-95 cursor-pointer"
        aria-label="Đóng"
      >
        <X size={20} />
      </button>
    </div>
  );
}
