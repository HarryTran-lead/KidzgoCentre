// import { useState } from "react";
// import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

// // Giả lập API để xử lý gửi email khôi phục
// export default function ForgotPassword() {
//   const [formData, setFormData] = useState({ email: "" });
//   const [isLoading, setIsLoading] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [currentStep, setCurrentStep] = useState<"input" | "sent" | "success">("input");
//   const [countdown, setCountdown] = useState(60);
//   const [canResend, setCanResend] = useState(false);

//   // Giả lập gửi email
//   const handleSubmit = async () => {
//     if (!formData.email) {
//       setApiError("Email không được bỏ trống");
//       return;
//     }

//     setIsLoading(true);
//     setApiError(null);

//     // Giả lập gọi API với setTimeout
//     setTimeout(() => {
//       if (formData.email === "valid@email.com") {
//         setCurrentStep("sent");
//         startCountdown();
//         alert("Đã gửi email khôi phục mật khẩu đến: " + formData.email);
//       } else {
//         setApiError("Không thể gửi email khôi phục. Vui lòng thử lại.");
//       }
//       setIsLoading(false);
//     }, 2000); // Giả lập delay 2 giây
//   };

//   const startCountdown = () => {
//     setCanResend(false);
//     setCountdown(60);
//     const timer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           setCanResend(true);
//           clearInterval(timer);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//   };

//   // Hàm xử lý gửi lại email
//   const handleResend = async () => {
//     if (!canResend) return;
//     setIsLoading(true);
//     setApiError(null);

//     // Giả lập gửi lại email
//     setTimeout(() => {
//       alert("Đã gửi lại email khôi phục mật khẩu đến: " + formData.email);
//       startCountdown();
//       setIsLoading(false);
//     }, 2000);
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500">
//       <ForgotPasswordCard
//         formData={formData}
//         setFormData={setFormData}
//         onSubmit={handleSubmit}
//         onResend={handleResend}
//         isLoading={isLoading}
//         apiError={apiError}
//         currentStep={currentStep}
//         countdown={countdown}
//         canResend={canResend}
//       />
//     </div>
//   );
// }
import React from 'react'

export default function page() {
  return (
    <div>
      
    </div>
  )
}

