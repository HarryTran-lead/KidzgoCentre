import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiHome,
  FiAlertTriangle,
  FiRefreshCcw,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";
import { Tooltip } from "@mui/material";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDetailsOpen: boolean;
  copySuccess: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsOpen: false,
      copySuccess: false,
    };
  }

  // static getDerivedStateFromError(_: Error): Partial<ErrorBoundaryState> {
  //   return { hasError: true };
  // }
  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
  }

  toggleDetails = (): void => {
    this.setState((prevState) => ({
      isDetailsOpen: !prevState.isDetailsOpen,
    }));
  };

  copyErrorDetails = (): void => {
    const { error, errorInfo } = this.state;
    const errorDetails = `Lỗi: ${error?.toString()}\nStack Trace: ${
      errorInfo?.componentStack
    }`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copySuccess: true });
      setTimeout(() => this.setState({ copySuccess: false }), 2000);
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, isDetailsOpen, copySuccess } =
      this.state;

    if (hasError) {
      return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-teal-900 to-slate-900">
            {/* Floating Orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4aa' fill-opacity='0.1'%3E%3Cpath d='M36 30c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Badminton Net Pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2300d4aa' stroke-width='1'%3E%3Cpath d='M10 10h80v80H10z'/%3E%3Cpath d='M20 10v80M30 10v80M40 10v80M50 10v80M60 10v80M70 10v80M80 10v80'/%3E%3Cpath d='M10 20h80M10 30h80M10 40h80M10 50h80M10 60h80M10 70h80M10 80h80'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Main Error Card */}
          <div className="relative z-10 max-w-xl w-full animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 px-8 pt-8 pb-4  space-y-6 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-linear-to-br from-teal-400 to-cyan-500 rounded-full opacity-10 blur-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full opacity-10 blur-xl"></div>

              {/* Error Icon & Title */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-linear-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                    <FiAlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="absolute inset-0 bg-red-300 opacity-20 rounded-full blur-xl animate-pulse"></div>

                  {/* Ripple Effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-30"></div>
                  <div
                    className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-20"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900 animate-fade-in">
                    Oops! Có gì đó không ổn
                  </h1>
                  <p
                    className="text-gray-600 text-sm leading-relaxed animate-fade-in"
                    style={{ animationDelay: "0.2s" }}
                  >
                    Hệ thống gặp sự cố bất ngờ. Đội ngũ kỹ thuật đã được thông
                    báo và đang xử lý.
                  </p>
                </div>
              </div>

              {/* Error Details Toggle */}
              <div
                className="space-y-3 animate-fade-in"
                style={{ animationDelay: "0.4s" }}
              >
                <button
                  onClick={this.toggleDetails}
                  className="w-full group relative overflow-hidden flex items-center justify-between px-6 py-4 bg-gray-50/80 hover:bg-white/80 border border-gray-200/50 hover:border-teal-300/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600 transition-colors duration-300">
                    Chi tiết lỗi
                  </span>
                  <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {isDetailsOpen ? (
                      <FiChevronUp className="w-5 h-5 text-gray-500 group-hover:text-teal-500" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-500 group-hover:text-teal-500" />
                    )}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-linear-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>

                {isDetailsOpen && (
                  <div className="bg-gray-900/5 backdrop-blur-sm p-5 rounded-2xl border border-gray-200/30 animate-slide-down">
                    <div className="relative">
                      {/* Khung code */}
                      <pre className="text-xs text-gray-700 overflow-auto max-h-40 font-mono bg-white/70 p-4 pr-12 rounded-xl border border-gray-200/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {error?.toString()}
                        {errorInfo?.componentStack}
                      </pre>

                      {/* Nút copy nổi trên khung */}
                      <Tooltip
                        title={copySuccess ? "Đã sao chép!" : "Sao chép lỗi"}
                        arrow
                        placement="top"
                      >
                        <button
                          onClick={this.copyErrorDetails}
                          className="absolute top-1 right-4 group p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200"
                        >
                          <div className="transform group-hover:scale-110 transition-transform duration-300">
                            {copySuccess ? (
                              <FiCheck className="w-5 h-5 text-green-500" />
                            ) : (
                              <FiCopy className="w-5 h-5 text-gray-500 group-hover:text-teal-600" />
                            )}
                          </div>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                className="flex justify-center gap-2 animate-fade-in"
                style={{ animationDelay: "0.6s" }}
              >
                {/* Primary Button - Refresh */}
                <button
                  onClick={() => window.location.reload()}
                  className="group relative overflow-hidden px-6 py-3 text-sm font-semibold text-white bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 transform-gpu"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    <FiRefreshCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                    Tải lại trang
                  </div>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="absolute inset-0 rounded-2xl bg-teal-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* Secondary Button - Quay lại trang */}
                <button
                  onClick={() => {
                    window.history.go(-1);
                    setTimeout(() => {
                      window.location.reload();
                    }, 300);
                  }}
                  className="group relative overflow-hidden px-6 py-3 text-sm font-medium text-teal-700 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/50 hover:border-teal-300 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    <FiArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                    Quay lại trang
                  </div>
                  <div className="absolute inset-0 bg-linear-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>

                {/* Secondary Button - Về Trang chủ */}
                <button
                  onClick={() => (window.location.href = "/")}
                  className="group relative overflow-hidden px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/50 hover:border-gray-300 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300  hover:-translate-y-1"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    <FiHome className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Về Trang chủ
                  </div>
                  <div className="absolute inset-0 bg-linear-to-r from-gray-500/0 via-gray-500/10 to-gray-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </div>

              {/* Footer */}
              <div
                className="pt-6 text-center border-t border-gray-200/50 animate-fade-in"
                style={{ animationDelay: "0.8s" }}
              >
                <p className="text-xs text-gray-500 hover:text-teal-600 transition-colors duration-300">
                  © 2025 GetSport. Tất cả quyền được bảo lưu.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
