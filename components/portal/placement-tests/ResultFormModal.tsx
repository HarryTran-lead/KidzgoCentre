"use client";

import { useEffect, useMemo, useState } from "react";
import { X, FileText, Award, Paperclip, Upload, Loader2 } from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import { uploadFile, isUploadSuccess } from "@/lib/api/fileService";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { PlacementTestResultRequest } from "@/types/placement-test";

type ProgramOption = {
  id: string;
  name: string;
  isSupplementary?: boolean;
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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    listeningScore: initialData?.listeningScore?.toString() || "",
    speakingScore: initialData?.speakingScore?.toString() || "",
    readingScore: initialData?.readingScore?.toString() || "",
    writingScore: initialData?.writingScore?.toString() || "",
    programRecommendation: initialData?.programRecommendation || "",
    secondaryProgramRecommendation: initialData?.secondaryProgramRecommendation || "",
    isSecondaryProgramSupplementary: Boolean(initialData?.isSecondaryProgramSupplementary),
    secondaryProgramSkillFocus: initialData?.secondaryProgramSkillFocus || "",
    attachmentUrl: initialData?.attachmentUrl || "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [programLoadError, setProgramLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      listeningScore: initialData?.listeningScore?.toString() || "",
      speakingScore: initialData?.speakingScore?.toString() || "",
      readingScore: initialData?.readingScore?.toString() || "",
      writingScore: initialData?.writingScore?.toString() || "",
      programRecommendation: initialData?.programRecommendation || "",
      secondaryProgramRecommendation: initialData?.secondaryProgramRecommendation || "",
      isSecondaryProgramSupplementary: Boolean(initialData?.isSecondaryProgramSupplementary),
      secondaryProgramSkillFocus: initialData?.secondaryProgramSkillFocus || "",
      attachmentUrl: initialData?.attachmentUrl || "",
      note: "",
    });
    setFormError("");
  }, [initialData, isOpen]);

  const SCORE_FIELDS = [
    { key: "listeningScore", label: "Điểm Nghe" },
    { key: "speakingScore", label: "Điểm Nói" },
    { key: "readingScore", label: "Điểm Đọc" },
    { key: "writingScore", label: "Điểm Viết" },
  ] as const;

  const isValidScoreInput = (value: string): boolean => {
    if (value === "") return true;
    return /^\d+(\.\d{0,2})?$/.test(value);
  };

  const parseScoreOrNull = (value: string): number | null => {
    if (value.trim() === "") return 0;
    if (!isValidScoreInput(value)) return null;

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  const handleScoreChange = (
    field: "listeningScore" | "speakingScore" | "readingScore" | "writingScore",
    rawValue: string,
  ) => {
    if (isValidScoreInput(rawValue)) {
      setFormError("");
      setFormData((prev) => ({ ...prev, [field]: rawValue }));
    }
  };

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    try {
      const result = await uploadFile(file, "placement-tests");
      if (!isUploadSuccess(result)) {
        const errMessage =
          result.detail ||
          result.error ||
          result.title ||
          "Không thể tải tài liệu lên";
        toast({
          title: "Lỗi tải file",
          description: errMessage,
          variant: "destructive",
        });
        return;
      }

      setFormData((prev) => ({ ...prev, attachmentUrl: result.url }));
      toast({
        title: "Thành công",
        description: "Đã tải tài liệu lên thành công",
        variant: "success",
      });
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải tài liệu lên",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = "";
    }
  };

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
            isSupplementary: Boolean(program?.isSupplementary),
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
    setFormError("");

    const parsedScores: Record<string, number> = {};
    for (const field of SCORE_FIELDS) {
      const raw = formData[field.key];
      const parsed = parseScoreOrNull(raw);
      if (parsed === null) {
        setFormError(`${field.label} chỉ được nhập số và không được âm.`);
        return;
      }
      parsedScores[field.key] = parsed;
    }

    setIsSubmitting(true);

    try {
      const secondaryProgramRecommendation = formData.secondaryProgramRecommendation.trim();
      const secondaryProgramSkillFocus = formData.secondaryProgramSkillFocus.trim();
      const submitData: Omit<PlacementTestResultRequest, "id"> = {
        listeningScore: parsedScores.listeningScore,
        speakingScore: parsedScores.speakingScore,
        readingScore: parsedScores.readingScore,
        writingScore: parsedScores.writingScore,
        resultScore: computedResultScore,
        programRecommendation: formData.programRecommendation || "",
        secondaryProgramRecommendation: secondaryProgramRecommendation || "",
        isSecondaryProgramSupplementary: secondaryProgramRecommendation
          ? formData.isSecondaryProgramSupplementary
          : null,
        secondaryProgramSkillFocus: secondaryProgramRecommendation
          ? secondaryProgramSkillFocus || null
          : null,
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
        <div className="sticky top-0 bg-linear-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
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
                onChange={(e) => handleScoreChange("listeningScore", e.target.value)}
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
                onChange={(e) => handleScoreChange("speakingScore", e.target.value)}
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
                onChange={(e) => handleScoreChange("readingScore", e.target.value)}
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
                onChange={(e) => handleScoreChange("writingScore", e.target.value)}
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
            <Select
              value={formData.programRecommendation}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, programRecommendation: value }))
              }
              disabled={isLoadingPrograms || !branchId}
            >
              <SelectTrigger className="h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-left focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-50 disabled:opacity-80">
                <SelectValue
                  placeholder={
                    isLoadingPrograms
                      ? "Đang tải chương trình..."
                      : !branchId
                        ? "Không xác định chi nhánh"
                        : "Chọn chương trình"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Chọn chương trình</SelectItem>
                {programOptions.map((program) => (
                  <SelectItem key={program.id} value={program.name}>
                    {program.name}
                    {program.isSupplementary ? " • Phụ trợ" : ""}
                  </SelectItem>
                ))}
                {formData.programRecommendation &&
                !programOptions.some((program) => program.name === formData.programRecommendation) ? (
                  <SelectItem value={formData.programRecommendation}>
                    {formData.programRecommendation}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            {programLoadError ? (
              <p className="text-xs text-red-600">{programLoadError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="secondaryProgramRecommendation" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText size={16} />
              Đề xuất chương trình song song / secondary
            </label>
            <Select
              value={formData.secondaryProgramRecommendation}
              onValueChange={(value) =>
                setFormData((prev) => {
                  const nextValue = value === "__none__" ? "" : value;
                  return {
                    ...prev,
                    secondaryProgramRecommendation: nextValue,
                    isSecondaryProgramSupplementary: nextValue
                      ? prev.isSecondaryProgramSupplementary
                      : false,
                    secondaryProgramSkillFocus: nextValue ? prev.secondaryProgramSkillFocus : "",
                  };
                })
              }
              disabled={isLoadingPrograms || !branchId}
            >
              <SelectTrigger className="h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-left focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-50 disabled:opacity-80">
                <SelectValue
                  placeholder={
                    isLoadingPrograms
                      ? "Đang tải chương trình..."
                      : !branchId
                        ? "Không xác định chi nhánh"
                        : "Chọn chương trình secondary"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không có secondary</SelectItem>
                {programOptions.map((program) => (
                  <SelectItem key={`secondary-${program.id}`} value={program.name}>
                    {program.name}
                    {program.isSupplementary ? " • Phụ trợ" : ""}
                  </SelectItem>
                ))}
                {formData.secondaryProgramRecommendation &&
                !programOptions.some((program) => program.name === formData.secondaryProgramRecommendation) ? (
                  <SelectItem value={formData.secondaryProgramRecommendation}>
                    {formData.secondaryProgramRecommendation}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Để trống nếu không có học chương trình song song.
            </p>
          </div>

          {formData.secondaryProgramRecommendation ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="secondaryProgramSkillFocus" className="block text-sm font-medium text-gray-700">
                  Skill focus
                </label>
                <input
                  id="secondaryProgramSkillFocus"
                  type="text"
                  value={formData.secondaryProgramSkillFocus}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      secondaryProgramSkillFocus: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Speaking"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>
            </div>
          ) : null}

          {/* Attachment */}
          <div className="space-y-2">
            <label htmlFor="attachmentUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Paperclip size={16} />
              Tài liệu đính kèm (Attachment)
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  {isUploadingAttachment ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang tải file...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Chọn file và tải lên
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentUpload}
                    disabled={isUploadingAttachment}
                  />
                </label>

                {formData.attachmentUrl ? (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, attachmentUrl: "" }))}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Xóa file
                  </button>
                ) : null}
              </div>

              <input
                id="attachmentUrl"
                type="text"
                value={formData.attachmentUrl}
                readOnly
                placeholder="Chưa có file được tải lên"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
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

          {formError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

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
              disabled={isSubmitting || isUploadingAttachment}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu kết quả"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
