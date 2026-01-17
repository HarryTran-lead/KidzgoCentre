'use client';

import { useState } from "react";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";
import { forgetPasswordWithToast } from "@/lib/api/authActions";

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({ email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"input" | "sent" | "success">("input");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email) {
      setApiError("Email không được bỏ trống");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      await forgetPasswordWithToast({ email: formData.email });
      setCurrentStep("sent");
      startCountdown();
    } catch (error: any) {
      setApiError(error?.message || "Không thể gửi email khôi phục. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setApiError(null);

    try {
      await forgetPasswordWithToast({ email: formData.email });
      startCountdown();
    } catch (error: any) {
      setApiError(error?.message || "Không thể gửi lại email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500">
      <ForgotPasswordCard
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onResend={handleResend}
        isLoading={isLoading}
        apiError={apiError}
        currentStep={currentStep}
        countdown={countdown}
        canResend={canResend}
      />
    </div>
  );
}


