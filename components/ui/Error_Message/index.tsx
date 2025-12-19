import React from "react";
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

interface ErrorMessageProps {
  message?: string | { message?: string; title?: string };
  type?: 'error' | 'warning' | 'info';
  variant?: 'default' | 'minimal' | 'card' | 'banner';
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = "Đã xảy ra lỗi không mong muốn",
  type = 'error',
  variant = 'default',
  showIcon = true,
  dismissible = false,
  onDismiss,
  className = ""
}) => {
  const parsedMessage =
    typeof message === "string"
      ? message
      : message?.message || message?.title || "Đã xảy ra lỗi không mong muốn.";

  // Icon mapping
  const iconMap = {
    error: FaExclamationTriangle,
    warning: FaExclamationTriangle,
    info: FaInfoCircle
  };

  // Color schemes based on teal theme
  const colorSchemes = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      accent: 'bg-red-100'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      accent: 'bg-amber-100'
    },
    info: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      icon: 'text-teal-600',
      accent: 'bg-teal-100'
    }
  };

  const colors = colorSchemes[type];
  const IconComponent = iconMap[type];

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className={`inline-flex items-center space-x-2 ${className}`}>
            {showIcon && (
              <div className="shrink-0">
                <IconComponent className={`h-5 w-5 ${colors.icon} animate-pulse`} />
              </div>
            )}
            <p className={`text-sm font-medium ${colors.text}`}>
              {parsedMessage}
            </p>
          </div>
        );

      case 'card':
        return (
          <div className={`relative ${colors.bg} ${colors.border} border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <div className={`w-full h-full ${colors.accent} rounded-full blur-xl`}></div>
            </div>
            
            <div className="relative flex items-start space-x-4">
              {showIcon && (
                <div className="shrink-0 mt-1">
                  <div className={`p-2 ${colors.accent} rounded-full`}>
                    <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold ${colors.text} leading-relaxed`}>
                  {parsedMessage}
                </p>
                {type === 'error' && (
                  <p className={`mt-2 text-sm ${colors.text} opacity-75`}>
                    Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                  </p>
                )}
              </div>
              {dismissible && (
                <button
                  onClick={onDismiss}
                  className={`shrink-0 p-1 rounded-full hover:${colors.accent} transition-colors duration-200`}
                >
                  <FaTimes className={`h-4 w-4 ${colors.icon} hover:opacity-75`} />
                </button>
              )}
            </div>
          </div>
        );

      case 'banner':
        return (
          <div className={`relative ${colors.bg} ${colors.border} border-l-4 ${colors.border.replace('border-', 'border-l-')} rounded-r-xl p-4 shadow-sm ${className}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {showIcon && (
                  <div className="shrink-0">
                    <IconComponent className={`h-5 w-5 ${colors.icon} animate-bounce`} />
                  </div>
                )}
                <p className={`text-sm font-medium ${colors.text}`}>
                  {parsedMessage}
                </p>
              </div>
              {dismissible && (
                <button
                  onClick={onDismiss}
                  className={`ml-4 shrink-0 p-1 rounded-full hover:${colors.accent} transition-all duration-200 hover:scale-110`}
                >
                  <FaTimes className={`h-4 w-4 ${colors.icon}`} />
                </button>
              )}
            </div>
          </div>
        );

      default: // 'default'
        return (
          <div className={`flex items-center justify-center space-x-3 ${colors.bg} ${colors.border} border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group ${className}`}>
            {showIcon && (
              <div className="shrink-0">
                <div className={`p-2 ${colors.accent} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                </div>
              </div>
            )}
            <div className="flex-1">
              <p className={`text-base font-semibold ${colors.text} text-center group-hover:scale-105 transition-transform duration-300`}>
                {parsedMessage}
              </p>
            </div>
            {dismissible && (
              <button
                onClick={onDismiss}
                className={`shrink-0 p-2 rounded-full hover:${colors.accent} transition-all duration-200 hover:scale-110 hover:rotate-90`}
              >
                <FaTimes className={`h-4 w-4 ${colors.icon}`} />
              </button>
            )}
          </div>
        );
    }
  };

  return getVariantStyles();
};

// Example usage component
const ErrorMessageShowcase: React.FC = () => {
  const [showDismissible, setShowDismissible] = React.useState(true);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ErrorMessage Component - BadmintonCourt Pro
          </h1>
          <p className="text-gray-600">
            Hệ thống thông báo lỗi chuyên nghiệp với nhiều biến thể và animation
          </p>
        </div>

        {/* Default Variants */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Các biến thể cơ bản
          </h2>
          
          <div className="grid gap-4">
            <ErrorMessage 
              message="Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng." 
              type="error" 
            />
            <ErrorMessage 
              message="Sân cầu lông bạn chọn sắp hết chỗ. Vui lòng đặt sớm để đảm bảo có chỗ." 
              type="warning" 
            />
            <ErrorMessage 
              message="Đặt sân thành công! Chúng tôi đã gửi xác nhận qua email." 
              type="info" 
            />
          </div>
        </div>

        {/* Card Variants */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Biến thể Card
          </h2>
          
          <div className="grid gap-6">
            <ErrorMessage 
              message="Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng dịch vụ." 
              type="error" 
              variant="card"
              dismissible={showDismissible}
              onDismiss={() => setShowDismissible(false)}
            />
            <ErrorMessage 
              message="Hệ thống bảo trì định kỳ từ 2:00 - 4:00 sáng hàng ngày." 
              type="info" 
              variant="card" 
            />
          </div>
        </div>

        {/* Banner Variants */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Biến thể Banner
          </h2>
          
          <div className="space-y-4">
            <ErrorMessage 
              message="Thanh toán thất bại. Vui lòng thử lại với phương thức khác." 
              type="error" 
              variant="banner"
              dismissible
            />
            <ErrorMessage 
              message="Khuyến mãi đặt sân cuối tuần giảm 30% - Còn 3 ngày!" 
              type="warning" 
              variant="banner" 
            />
          </div>
        </div>

        {/* Minimal Variants */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Biến thể Minimal
          </h2>
          
          <div className="space-y-4">
            <ErrorMessage 
              message="Email không hợp lệ" 
              type="error" 
              variant="minimal" 
            />
            <ErrorMessage 
              message="Đã lưu thay đổi" 
              type="info" 
              variant="minimal" 
            />
            <ErrorMessage 
              message="Không có icon" 
              type="warning" 
              variant="minimal"
              showIcon={false}
            />
          </div>
        </div>

        {/* Custom Message Object */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Object Message
          </h2>
          
          <ErrorMessage 
            message={{ 
              title: "Lỗi xác thực", 
              message: "Tên đăng nhập hoặc mật khẩu không chính xác" 
            }} 
            type="error"
            variant="card"
          />
        </div>
      </div>
    </div>
  );
};

export default ErrorMessageShowcase;