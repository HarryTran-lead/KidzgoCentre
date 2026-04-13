"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Award, FileText, Paperclip, Upload, Loader2, AlertCircle } from "lucide-react";
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
    programRecommendationId: initialData?.programRecommendationId || "",
    programRecommendationName: initialData?.programRecommendationName || "",
    secondaryProgramRecommendationId: initialData?.secondaryProgramRecommendationId || "",
    secondaryProgramRecommendationName: initialData?.secondaryProgramRecommendationName || "",
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
      programRecommendationId: initialData?.programRecommendationId || "",
      programRecommendationName: initialData?.programRecommendationName || "",
      secondaryProgramRecommendationId: initialData?.secondaryProgramRecommendationId || "",
      secondaryProgramRecommendationName: initialData?.secondaryProgramRecommendationName || "",
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

  const handleReset = () => {
    if (initialData) {
      // Reset về dữ liệu ban đầu nếu đang edit
      setFormData({
        listeningScore: initialData?.listeningScore?.toString() || "",
        speakingScore: initialData?.speakingScore?.toString() || "",
        readingScore: initialData?.readingScore?.toString() || "",
        writingScore: initialData?.writingScore?.toString() || "",
        programRecommendationId: initialData?.programRecommendationId || "",
        programRecommendationName: initialData?.programRecommendationName || "",
        secondaryProgramRecommendationId: initialData?.secondaryProgramRecommendationId || "",
        secondaryProgramRecommendationName: initialData?.secondaryProgramRecommendationName || "",
        isSecondaryProgramSupplementary: Boolean(initialData?.isSecondaryProgramSupplementary),
        secondaryProgramSkillFocus: initialData?.secondaryProgramSkillFocus || "",
        attachmentUrl: initialData?.attachmentUrl || "",
        note: "",
      });
    } else {
      // Reset form về trống nếu tạo mới
      setFormData({
        listeningScore: "",
        speakingScore: "",
        readingScore: "",
        writingScore: "",
        programRecommendationId: "",
        programRecommendationName: "",
        secondaryProgramRecommendationId: "",
        secondaryProgramRecommendationName: "",
        isSecondaryProgramSupplementary: false,
        secondaryProgramSkillFocus: "",
        attachmentUrl: "",
        note: "",
      });
    }
    setFormError("");
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
      const secondaryProgramRecommendationId = formData.secondaryProgramRecommendationId.trim();
      const secondaryProgramSkillFocus = formData.secondaryProgramSkillFocus.trim();
      const submitData: Omit<PlacementTestResultRequest, "id"> = {
        listeningScore: parsedScores.listeningScore,
        speakingScore: parsedScores.speakingScore,
        readingScore: parsedScores.readingScore,
        writingScore: parsedScores.writingScore,
        resultScore: computedResultScore,
        programRecommendationId: formData.programRecommendationId || null,
        programRecommendationName: formData.programRecommendationName || null,
        secondaryProgramRecommendationId: secondaryProgramRecommendationId || null,
        secondaryProgramRecommendationName: secondaryProgramRecommendationId
          ? formData.secondaryProgramRecommendationName || null
          : null,
        isSecondaryProgramSupplementary: secondaryProgramRecommendationId
          ? formData.isSecondaryProgramSupplementary
          : null,
        secondaryProgramSkillFocus: secondaryProgramRecommendationId
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
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Nhập kết quả bài kiểm tra
                </h2>
                <p className="text-sm text-red-100">
                  Nhập thông tin chi tiết về kết quả bài kiểm tra
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scores Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Award size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Điểm thi</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Điểm Nghe (Listening)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.listeningScore}
                    onChange={(e) => handleScoreChange("listeningScore", e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Điểm Nói (Speaking)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.speakingScore}
                    onChange={(e) => handleScoreChange("speakingScore", e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Điểm Đọc (Reading)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.readingScore}
                    onChange={(e) => handleScoreChange("readingScore", e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Điểm Viết (Writing)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.writingScore}
                    onChange={(e) => handleScoreChange("writingScore", e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Result Score (Overall) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Award size={16} className="text-red-600" />
                </div>
                <label className="text-sm font-semibold text-gray-700">
                  Điểm Tổng (Result Score)
                </label>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={computedResultScore}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none font-semibold text-lg"
              />
              <p className="text-xs text-gray-500">
                Tự động tính trung bình cộng của 4 kỹ năng: Nghe, Nói, Đọc, Viết.
              </p>
            </div>

            {/* Program Recommendation Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <FileText size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Đề xuất chương trình</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Đề xuất chương trình chính
                </label>
                <Select
                  value={formData.programRecommendationId}
                  onValueChange={(value) => {
                    const selected = programOptions.find((p) => p.id === value);
                    setFormData((prev) => ({
                      ...prev,
                      programRecommendationId: value,
                      programRecommendationName: selected?.name || "",
                    }));
                  }}
                  disabled={isLoadingPrograms || !branchId}
                >
                  <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
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
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                        {program.isSupplementary ? " • Phụ trợ" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {programLoadError ? (
                  <p className="text-xs text-red-600">{programLoadError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Đề xuất chương trình song song (nếu có)
                </label>
                <Select
                  value={formData.secondaryProgramRecommendationId}
                  onValueChange={(value) => {
                    const nextValue = value === "__none__" ? "" : value;
                    const selected = nextValue ? programOptions.find((p) => p.id === nextValue) : null;
                    setFormData((prev) => ({
                      ...prev,
                      secondaryProgramRecommendationId: nextValue,
                      secondaryProgramRecommendationName: selected?.name || "",
                      isSecondaryProgramSupplementary: nextValue
                        ? prev.isSecondaryProgramSupplementary
                        : false,
                      secondaryProgramSkillFocus: nextValue ? prev.secondaryProgramSkillFocus : "",
                    }));
                  }}
                  disabled={isLoadingPrograms || !branchId}
                >
                  <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                    <SelectValue
                      placeholder={
                        isLoadingPrograms
                          ? "Đang tải chương trình..."
                          : !branchId
                            ? "Không xác định chi nhánh"
                            : "Chọn chương trình song song"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không có secondary</SelectItem>
                    {programOptions.map((program) => (
                      <SelectItem key={`secondary-${program.id}`} value={program.id}>
                        {program.name}
                        {program.isSupplementary ? " • Phụ trợ" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Để trống nếu không có học chương trình song song.
                </p>
              </div>

              {formData.secondaryProgramRecommendationId ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Skill focus
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryProgramSkillFocus}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        secondaryProgramSkillFocus: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Speaking"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>
              ) : null}
            </div>

            {/* Attachment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Paperclip size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Tài liệu đính kèm</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
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
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                    >
                      Xóa file
                    </button>
                  ) : null}
                </div>

                <input
                  type="text"
                  value={formData.attachmentUrl}
                  readOnly
                  placeholder="Chưa có file được tải lên"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 outline-none"
                />
              </div>
            </div>

            {/* Note Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <FileText size={16} className="text-red-600" />
                </div>
                <label className="text-sm font-semibold text-gray-700">
                  Ghi chú
                </label>
              </div>
              <textarea
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Nhập ghi chú cho kiểm tra xếp lớp..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
              />
            </div>

            {formError ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle size={16} className="text-red-600" />
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            ) : null}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {initialData ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploadingAttachment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}