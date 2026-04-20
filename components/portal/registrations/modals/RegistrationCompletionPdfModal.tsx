"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Printer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportRegistrationEnrollmentConfirmationPdf,
  getRegistrationEnrollmentConfirmationPdf,
} from "@/lib/api/registrationService";

type RegistrationCompletionPdfModalProps = {
  isOpen: boolean;
  registrationId: string;
  studentName?: string;
  onClose: () => void;
};

export default function RegistrationCompletionPdfModal({
  isOpen,
  registrationId,
  studentName,
  onClose,
}: RegistrationCompletionPdfModalProps) {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen || !registrationId) return;

    let nextObjectUrl = "";
    let disposed = false;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const file = await getRegistrationEnrollmentConfirmationPdf(registrationId);

        if (disposed) return;

        nextObjectUrl = URL.createObjectURL(file.blob);
        setPdfObjectUrl(nextObjectUrl);
        setFileName(file.fileName);
      } catch (error: any) {
        if (disposed) return;
        setPdfObjectUrl("");
        setFileName("");
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
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [isOpen, registrationId, toast]);

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

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
        className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-red-100 bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <div>
            <h3 className="text-base font-semibold">Phiếu hoàn thành đăng ký</h3>
            <p className="text-xs text-white/90">
              Học viên: {studentName || "-"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !pdfObjectUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer size={14} /> In
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Xuất file
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-white/20"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="h-[calc(90vh-56px)] bg-gray-50">
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 size={16} className="animate-spin" /> Đang tải phiếu đăng ký...
            </div>
          ) : pdfObjectUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfObjectUrl}
              title={fileName || "registration-completion-pdf"}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-sm text-gray-500">
              Không thể hiển thị file PDF.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
