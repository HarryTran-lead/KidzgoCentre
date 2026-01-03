import React from "react";
import { FiMail, FiAlertCircle, FiCheck, FiRefreshCw, FiShield, FiClock } from "react-icons/fi";
import LoadingSpinner from "@/components/ui/loadingSpinner";

interface ForgotPasswordCardProps {
  formData: { email: string };
  setFormData: React.Dispatch<React.SetStateAction<{ email: string }>>;
  onSubmit: () => void;
  onResend: () => void;
  isLoading: boolean;
  apiError: string | null;
  currentStep: "input" | "sent" | "success";
  countdown: number;
  canResend: boolean;
}

const ForgotPasswordCard: React.FC<ForgotPasswordCardProps> = ({
  formData,
  setFormData,
  onSubmit,
  onResend,
  isLoading,
  apiError,
  currentStep,
  countdown,
  canResend,
}) => {
  return (
    <div className="w-full max-w-sm p-6 rounded-xl bg-white shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Khôi phục mật khẩu</h2>
        <p className="text-sm text-gray-600">
          Nhập email để nhận hướng dẫn khôi phục mật khẩu.
        </p>
      </div>

      {/* Email Input */}
      {currentStep === "input" && (
        <div className="space-y-4">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700"
          >
            Email
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ email: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 border-2 rounded-xl outline-none bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200 border-gray-200 focus:border-teal-500"
              placeholder="your@email.com"
            />
          </div>

          {apiError && (
            <div className="flex items-center gap-1 text-red-600">
              <FiAlertCircle className="w-4 h-4" />
              <p className="text-sm">{apiError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full bg-linear-to-r from-teal-500 to-cyan-600 text-white font-medium py-3 rounded-xl shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner color="white" size="5" inline />
                Đang gửi...
              </span>
            ) : (
              <span className="inline-flex items-center">
                <FiMail className="w-5 h-5 mr-2" />
                Gửi email khôi phục
              </span>
            )}
          </button>
        </div>
      )}

      {/* Sent Confirmation */}
      {currentStep === "sent" && (
        <div className="space-y-7 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-18 h-18 bg-teal-100 rounded-full flex items-center justify-center mb-2.5 animate-pulse">
            <FiCheck className="w-9 h-9 text-teal-600" />
          </div>

          {/* Header */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              Email đã được gửi!
            </h2>
            <p className="text-gray-600 mb-1.5 text-sm md:text-[0.95rem]">
              Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến:
            </p>
            <p className="text-teal-600 font-semibold text-[1.05rem] break-all">
              {formData.email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-3.5 text-left">
            <div className="flex items-start gap-3">
              <FiShield className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 mb-0.5">
                  Kiểm tra email của bạn
                </p>
                <p className="text-sm text-gray-600">
                  Click vào link trong email để thiết lập mật khẩu mới
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiClock className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 mb-0.5">
                  Thời gian hiệu lực
                </p>
                <p className="text-sm text-gray-600">
                  Link sẽ hết hạn sau 1 giờ vì lý do bảo mật
                </p>
              </div>
            </div>
          </div>

          {/* Resend Button */}
          <p className="text-sm text-gray-600">
            Không nhận được email?{" "}
            <button
              onClick={onResend}
              disabled={!canResend || isLoading}
              className={`font-medium transition-colors duration-200 ${
                canResend && !isLoading
                  ? "text-teal-600 hover:text-teal-700 hover:underline"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <span className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-1" />
                  Đang gửi...
                </span>
              ) : canResend ? (
                <span className="inline-flex items-center">
                  <FiRefreshCw className="w-3.5 h-3.5 mr-1" />
                  Gửi lại
                </span>
              ) : (
                `Gửi lại sau ${countdown}s`
              )}
            </button>
          </p>
        </div>
      )}

      {/* Success Step */}
      {currentStep === "success" && (
        <div className="space-y-7 text-center">
          <div className="mx-auto w-18 h-18 bg-teal-100 rounded-full flex items-center justify-center mb-2.5 animate-pulse">
            <FiCheck className="w-9 h-9 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              Mật khẩu đã được đặt lại!
            </h2>
            <p className="text-gray-600 mb-1.5 text-sm md:text-[0.95rem]">
              Mật khẩu của bạn đã được cập nhật thành công.
            </p>
            <p className="text-gray-600 text-sm md:text-[0.95rem]">
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/auth?view=login")}
            className="w-full bg-linear-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordCard;
