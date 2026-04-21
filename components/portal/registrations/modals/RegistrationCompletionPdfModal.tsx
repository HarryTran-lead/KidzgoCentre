"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Calendar,
  Download,
  GraduationCap,
  History,
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
  generateRegistrationEnrollmentConfirmationPdf,
  getRegistrationEnrollmentConfirmationPdf,
  getRegistrationEnrollmentConfirmationPdfHistory,
  type EnrollmentConfirmationPdfResponse,
} from "@/lib/api/registrationService";
import type { PdfHistoryItem } from "@/types/registration";
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
        <div className="text-sm font-medium text-gray-900 wrap-break-word">{value}</div>
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
  const [historyItems, setHistoryItems] = useState<PdfHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");

  const loadPreview = async (id: string) => {
    const data = await getRegistrationEnrollmentConfirmationPdf(id);
    setPdfData(data);
    setSelectedPdfUrl(data.activePdf?.pdfUrl || "");
    return data;
  };

  const loadHistory = async (id: string) => {
    try {
      setIsLoadingHistory(true);
      const items = await getRegistrationEnrollmentConfirmationPdfHistory(id);
      setHistoryItems(items);
      return items;
    } catch {
      setHistoryItems([]);
      return [] as PdfHistoryItem[];
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !registrationId) return;

    let disposed = false;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const [preview] = await Promise.all([
          loadPreview(registrationId),
          loadHistory(registrationId),
        ]);

        if (disposed) return;
        setPdfData(preview);
      } catch (error: any) {
        if (disposed) return;
        setPdfData(null);
        setHistoryItems([]);
        setSelectedPdfUrl("");
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

  const activePdfUrl = pdfData?.activePdf?.pdfUrl || "";
  const effectivePdfUrl = selectedPdfUrl || activePdfUrl;
  const pdfPreviewUrl = effectivePdfUrl ? buildFileUrl(effectivePdfUrl) : "";

  const handleGeneratePdf = async () => {
    if (!registrationId || isGenerating) return;

    try {
      setIsGenerating(true);
      await generateRegistrationEnrollmentConfirmationPdf(registrationId);
      await Promise.all([loadPreview(registrationId), loadHistory(registrationId)]);
      toast({
        title: "Thành công",
        description: "Đã tạo bản PDF mới và cập nhật lịch sử.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tạo file PDF mới.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdfByUrl = async (rawUrl: string) => {
    const normalized = String(rawUrl || "").trim();
    if (!normalized) return;

    try {
      const downloadUrl = buildFileUrl(normalized);
      const fileName =
        normalized.split("/").pop() || `phieu-dang-ky-${pdfData?.preview?.studentName || registrationId}.pdf`;
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      toast({
        title: "Thành công",
        description: `Đã tải file PDF: ${fileName}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải file PDF.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCurrentPdf = async () => {
    if (!activePdfUrl) {
      toast({
        title: "Không có dữ liệu",
        description: "Chưa có bản PDF hiện tại để tải.",
        variant: "warning",
      });
      return;
    }
    await downloadPdfByUrl(activePdfUrl);
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
        <div className="hidden md:flex w-85 flex-col border-r border-gray-200 bg-gray-50">
          {/* Header */}
          <div className="bg-linear-to-r from-red-600 to-red-700 px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Phiếu hoàn thành đăng ký
            </h3>
            <p className="mt-0.5 text-xs text-white/80">
              Học viên: {pdfData?.preview?.studentName || studentName || "-"}
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
                  value={pdfData.preview?.studentName || "-"}
                />
                <InfoRow
                  icon={BookOpen}
                  label="Chương trình"
                  value={String(pdfData.preview?.programName || "-")}
                />
                <InfoRow
                  icon={School}
                  label="Lớp"
                  value={String(pdfData.preview?.classCode || pdfData.preview?.classTitle || "-")}
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Gói học"
                  value={String(pdfData.preview?.tuitionPlanName || "-")}
                />
                <InfoRow
                  icon={Wallet}
                  label="Tổng thanh toán"
                  value={formatCurrency(Number(pdfData.preview?.totalPayment || 0), "VND")}
                />
                <InfoRow
                  icon={Calendar}
                  label="Form đã resolve"
                  value={
                    pdfData.formTypeResolved === "continuingStudent"
                      ? "Học viên đang học (continuing)"
                      : "Học viên mới (new)"
                  }
                />

                {pdfData.formTypeResolved === "continuingStudent" && (
                  <InfoRow
                    icon={Calendar}
                    label="Đối soát"
                    value={
                      String(
                        pdfData.preview?.reconciliationSummary ||
                          pdfData.preview?.reconciliationText ||
                          "Có dữ liệu đối soát cho học viên đang học.",
                      )
                    }
                  />
                )}

                {Array.isArray(pdfData.warnings) && pdfData.warnings.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                      <AlertTriangle size={13} /> Cảnh báo dữ liệu
                    </div>
                    <div className="space-y-1 text-xs text-amber-700">
                      {pdfData.warnings.map((warning, index) => (
                        <div key={`pdf-warning-${index}`}>• {warning}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Loại phiếu</span>
                    <span className="font-medium text-gray-700">
                      {pdfData.formTypeResolved === "continuingStudent"
                        ? "Phiếu đối soát và thu học phí"
                        : "Phiếu thu học phí"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Track</span>
                    <span className="font-medium text-gray-700 capitalize">
                      {pdfData.trackResolved || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Ngày tạo bản active</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(pdfData.activePdf?.generatedAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <History size={13} /> Lịch sử PDF
                  </div>
                  {isLoadingHistory ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 size={12} className="animate-spin" /> Đang tải lịch sử...
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="text-xs text-gray-500">Chưa có lịch sử PDF.</div>
                  ) : (
                    <div className="space-y-2">
                      {historyItems.map((item) => {
                        const isCurrent = item.isActive;
                        return (
                          <button
                            key={item.pdfRecordId}
                            type="button"
                            onClick={() => setSelectedPdfUrl(item.pdfUrl)}
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-800">
                                {item.classCode || "PDF"}
                              </span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                  <CheckCircle2 size={10} /> Active
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-gray-500">
                              {formatDate(item.generatedAt)} • {item.generatedByName || "-"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
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
              onClick={handleDownloadCurrentPdf}
              disabled={isLoading || !activePdfUrl}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Download size={14} /> Tải bản hiện tại
            </button>
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGenerating || isLoading}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Tạo bản mới
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !pdfPreviewUrl}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Printer size={14} /> In
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
                {pdfData?.preview?.studentName || studentName || "-"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadCurrentPdf}
                disabled={isLoading || !activePdfUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-50 cursor-pointer"
              >
                <Download size={12} /> Tải
              </button>
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
                onClick={handleGeneratePdf}
                disabled={isGenerating || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                Tạo
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
