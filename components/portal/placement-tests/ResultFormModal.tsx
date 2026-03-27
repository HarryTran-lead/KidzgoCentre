"use client";

import { useEffect, useMemo, useState } from "react";
import { X, FileText, Award, BookOpen, Paperclip } from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import type { PlacementTestResultRequest } from "@/types/placement-test";

type ProgramOption = {
  id: string;
  name: string;
};

interface ResultFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PlacementTestResultRequest, "id">, note: string) => Promise<void>;
  testId: string;
  branchId?: string;
  initialData?: Partial<PlacementTestResultRequest> | null;
}

export default function ResultFormModal({
  isOpen,
  onClose,
  onSubmit,
  testId,
  branchId,
  initialData,
}: ResultFormModalProps) {
  const [formData, setFormData] = useState({
    listeningScore: initialData?.listeningScore?.toString() || "",
    speakingScore: initialData?.speakingScore?.toString() || "",
    readingScore: initialData?.readingScore?.toString() || "",
    writingScore: initialData?.writingScore?.toString() || "",
    programRecommendation: initialData?.programRecommendation || "",
    attachmentUrl: initialData?.attachmentUrl || "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [programLoadError, setProgramLoadError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchPrograms = async () => {
      if (!branchId) {
        setProgramOptions([]);
        setProgramLoadError("Không xác định được chi nhánh để tải chương trình");
        return;
      }

      setIsLoadingPrograms(true);
      setProgramLoadError("");

      try {
        const queryParams = new URLSearchParams();
        queryParams.append("branchId", branchId);
        queryParams.append("isActive", "true");
        queryParams.append("pageNumber", "1");
        queryParams.append("pageSize", "1000");

        const response = await fetch(
          `${ADMIN_ENDPOINTS.PROGRAMS}?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch programs: ${response.status}`);
        }

        const data = await response.json();
        const items =
          data?.data?.programs?.items ||
          data?.data?.items ||
          data?.data?.programs ||
          data?.data ||
          [];

        const mapped = items
          .map((program: any) => ({
            id: String(program?.id || ""),
            name: String(program?.name || ""),
          }))
          .filter((program: ProgramOption) => program.id && program.name);

        setProgramOptions(mapped);
      } catch (error) {
        console.error("Error fetching programs for result modal:", error);
        setProgramOptions([]);
        setProgramLoadError("Không thể tải danh sách chương trình");
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, [isOpen, branchId]);

  const computedResultScore = useMemo(() => {
    const listening = Number.parseFloat(formData.listeningScore || "0") || 0;
    const speaking = Number.parseFloat(formData.speakingScore || "0") || 0;
    const reading = Number.parseFloat(formData.readingScore || "0") || 0;
    const writing = Number.parseFloat(formData.writingScore || "0") || 0;

    return Number(((listening + speaking + reading + writing) / 4).toFixed(1));
  }, [formData.listeningScore, formData.speakingScore, formData.readingScore, formData.writingScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: Omit<PlacementTestResultRequest, "id"> = {
        listeningScore: formData.listeningScore ? parseFloat(formData.listeningScore) : 0,
        speakingScore: formData.speakingScore ? parseFloat(formData.speakingScore) : 0,
        readingScore: formData.readingScore ? parseFloat(formData.readingScore) : 0,
        writingScore: formData.writingScore ? parseFloat(formData.writingScore) : 0,
        resultScore: computedResultScore,
        programRecommendation: formData.programRecommendation || "",
        attachmentUrl: formData.attachmentUrl || "",
      };

      await onSubmit(submitData, formData.note.trim());
      onClose();
    } catch (error) {
      console.error("Error submitting result:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-pink-500 to-rose-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award size={24} />
            Nhập kết quả Placement Test
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="listeningScore" className="block text-sm font-medium text-gray-700">Điểm Nghe (Listening)</label>
              <input
                id="listeningScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.listeningScore}
                onChange={(e) => setFormData(prev => ({ ...prev, listeningScore: e.target.value }))}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="speakingScore" className="block text-sm font-medium text-gray-700">Điểm Nói (Speaking)</label>
              <input
                id="speakingScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.speakingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, speakingScore: e.target.value }))}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="readingScore" className="block text-sm font-medium text-gray-700">Điểm Đọc (Reading)</label>
              <input
                id="readingScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.readingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, readingScore: e.target.value }))}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="writingScore" className="block text-sm font-medium text-gray-700">Điểm Viết (Writing)</label>
              <input
                id="writingScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.writingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, writingScore: e.target.value }))}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>
          </div>

          {/* Result Score (Overall) */}
          <div className="space-y-2">
            <label htmlFor="resultScore" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Award size={16} />
              Điểm Tổng (Result Score)
            </label>
            <input
              id="resultScore"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={computedResultScore}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none font-semibold text-lg"
            />
            <p className="text-xs text-gray-500">Tự động tính trung bình cộng của 4 kỹ năng: Nghe, Nói, Đọc, Viết.</p>
          </div>

          {/* Program Recommendation */}
          <div className="space-y-2">
            <label htmlFor="programRecommendation" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText size={16} />
              Đề xuất chương trình (Program Recommendation)
            </label>
            <select
              id="programRecommendation"
              value={formData.programRecommendation}
              onChange={(e) => setFormData(prev => ({ ...prev, programRecommendation: e.target.value }))}
              disabled={isLoadingPrograms || !branchId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none disabled:bg-gray-50 disabled:opacity-80"
            >
              <option value="">
                {isLoadingPrograms
                  ? "Đang tải chương trình..."
                  : !branchId
                    ? "Không xác định chi nhánh"
                    : "Chọn chương trình"}
              </option>
              {programOptions.map((program) => (
                <option key={program.id} value={program.name}>
                  {program.name}
                </option>
              ))}
              {formData.programRecommendation &&
              !programOptions.some((program) => program.name === formData.programRecommendation) ? (
                <option value={formData.programRecommendation}>{formData.programRecommendation}</option>
              ) : null}
            </select>
            {programLoadError ? (
              <p className="text-xs text-red-600">{programLoadError}</p>
            ) : null}
          </div>

          {/* Attachment URL */}
          <div className="space-y-2">
            <label htmlFor="attachmentUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Paperclip size={16} />
              Link tài liệu đính kèm (Attachment URL)
            </label>
            <input
              id="attachmentUrl"
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, attachmentUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label htmlFor="note" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText size={16} />
              Ghi chú (Note)
            </label>
            <textarea
              id="note"
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Nhập ghi chú cho placement test..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu kết quả"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
