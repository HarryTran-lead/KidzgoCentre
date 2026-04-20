"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Calendar,
  Download,
  GraduationCap,
  Loader2,
  Printer,
  School,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportRegistrationEnrollmentConfirmationPdf,
  getRegistrationEnrollmentConfirmationPdf,
  type EnrollmentConfirmationPdfResponse,
} from "@/lib/api/registrationService";
import { buildFileUrl } from "@/constants/apiURL";

type RegistrationCompletionPdfModalProps = {
  isOpen: boolean;
  registrationId: string;
  studentName?: string;
  onClose: () => void;
};

function formatCurrency(amount: number, currency: string) {
  if (!amount) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 rounded-lg bg-red-50 p-1.5 text-red-600">
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

export default function RegistrationCompletionPdfModal({
  isOpen,
  registrationId,
  studentName,
  onClose,
}: RegistrationCompletionPdfModalProps) {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfData, setPdfData] = useState<EnrollmentConfirmationPdfResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isOpen || !registrationId) return;

    let disposed = false;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await getRegistrationEnrollmentConfirmationPdf(registrationId);

        if (disposed) return;
        setPdfData(data);
      } catch (error: any) {
        if (disposed) return;
        setPdfData(null);
        setHasError(true);
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể tải phiếu hoàn thành đăng ký.",
          variant: "destructive",
        });
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void loadPdf();

    return () => {
      disposed = true;
    };
  }, [isOpen, registrationId, toast]);

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  const pdfPreviewUrl = pdfData?.pdfUrl ? buildFileUrl(pdfData.pdfUrl) : "";

  const handleExport = async () => {
    if (!registrationId || isExporting) return;

    try {
      setIsExporting(true);
      const exportedFileName = await exportRegistrationEnrollmentConfirmationPdf(
        registrationId,
      );
      toast({
        title: "Thành công",
        description: `Đã xuất file PDF: ${exportedFileName}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể xuất phiếu hoàn thành đăng ký.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) {
      toast({
        title: "Không thể in",
        description: "Vui lòng chờ file PDF tải xong rồi thử lại.",
        variant: "warning",
      });
      return;
    }

    frameWindow.focus();
    frameWindow.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-10010 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left sidebar - Registration info */}
        <div className="hidden md:flex w-[340px] flex-col border-r border-gray-200 bg-gray-50">
          {/* Header */}
          <div className="bg-linear-to-r from-red-600 to-red-700 px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Phiếu hoàn thành đăng ký
            </h3>
            <p className="mt-0.5 text-xs text-white/80">
              Học viên: {pdfData?.studentName || studentName || "-"}
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Đang tải...
              </div>
            ) : pdfData ? (
              <>
                <InfoRow
                  icon={User}
                  label="Học viên"
                  value={pdfData.studentName || "-"}
                />
                <InfoRow
                  icon={BookOpen}
                  label="Chương trình"
                  value={pdfData.programName || "-"}
                />
                <InfoRow
                  icon={School}
                  label="Lớp"
                  value={
                    pdfData.classTitle
                      ? `${pdfData.classTitle} (${pdfData.classCode})`
                      : pdfData.classCode || "-"
                  }
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Gói học"
                  value={pdfData.tuitionPlanName || "-"}
                />
                <InfoRow
                  icon={Wallet}
                  label="Học phí"
                  value={formatCurrency(pdfData.tuitionAmount, pdfData.currency)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Ngày ghi danh"
                  value={formatDate(pdfData.enrollDate)}
                />
                {pdfData.firstStudyDate && (
                  <InfoRow
                    icon={Calendar}
                    label="Ngày bắt đầu học"
                    value={formatDate(pdfData.firstStudyDate)}
                  />
                )}

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Loại phiếu</span>
                    <span className="font-medium text-gray-700">
                      {pdfData.formType === "continue"
                        ? "Phiếu đối soát và thu học phí"
                        : pdfData.formType === "new"
                          ? "Phiếu thu học phí"
                          : pdfData.formType || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Track</span>
                    <span className="font-medium text-gray-700 capitalize">
                      {pdfData.track || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Ngày tạo PDF</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(pdfData.pdfGeneratedAt)}
                    </span>
                  </div>
                </div>
              </>
            ) : hasError ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-gray-500">
                <X size={24} className="text-red-300" />
                <span>Không thể tải thông tin đăng ký.</span>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 bg-white px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !pdfPreviewUrl}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Printer size={14} /> In
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Xuất file
            </button>
          </div>
        </div>

        {/* Right side - PDF Preview */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header (shown on small screens) */}
          <div className="flex md:hidden items-center justify-between bg-linear-to-r from-red-600 to-red-700 px-4 py-3 text-white">
            <div>
              <h3 className="text-sm font-semibold">Phiếu hoàn thành đăng ký</h3>
              <p className="text-xs text-white/80">
                {pdfData?.studentName || studentName || "-"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isLoading || !pdfPreviewUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-50 cursor-pointer"
              >
                <Printer size={12} /> In
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                Xuất
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-white/20 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Desktop close button */}
          <div className="hidden md:flex items-center justify-between border-b border-gray-200 bg-white px-5 py-2.5">
            <span className="text-sm font-medium text-gray-700">Xem trước phiếu PDF</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 bg-gray-100">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải phiếu đăng ký...
              </div>
            ) : pdfPreviewUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfPreviewUrl}
                title="Phiếu hoàn thành đăng ký"
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-gray-500">
                <div className="rounded-2xl bg-gray-200/60 p-4">
                  <X size={28} className="text-gray-400" />
                </div>
                <p className="text-sm">Không thể hiển thị file PDF.</p>
                <p className="text-xs text-gray-400">
                  Vui lòng kiểm tra lại đăng ký hoặc liên hệ quản trị viên.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
