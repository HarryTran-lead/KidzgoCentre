"use client";

import { useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Link as LinkIcon,
  Loader2,
  Send,
} from "lucide-react";
import { uploadFile, isUploadSuccess } from "@/lib/api/fileService";
import { useToast } from "@/hooks/use-toast";
import type { AssignmentDetail } from "@/types/student/homework";
import type { SubmitHomeworkPayload } from "@/lib/api/studentService";

type UploadedHomeworkFile = {
  name: string;
  size: number;
  url: string;
};

interface FileSubmissionFormProps {
  assignment: AssignmentDetail;
  onSubmit: (payload: SubmitHomeworkPayload) => Promise<void>;
  isSubmitting: boolean;
  onError: (msg: string | null) => void;
}

export default function FileSubmissionForm({
  assignment,
  onSubmit,
  isSubmitting,
  onError,
}: FileSubmissionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const submissionType = (assignment.submissionType || "").toUpperCase();
  const isFileSubmission =
    submissionType === "FILE" ||
    submissionType === "IMAGE" ||
    submissionType === "FILE_AND_TEXT";
  const isTextSubmission =
    submissionType === "TEXT" || submissionType === "FILE_AND_TEXT";
  const isLinkSubmission = submissionType === "LINK";

  const [uploadedFiles, setUploadedFiles] = useState<UploadedHomeworkFile[]>([]);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const attachmentSourcesCount = uploadedFiles.length + submissionLinks.length;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = newFiles.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      onError(
        `Các file ${oversizedFiles.map((f) => f.name).join(", ")} vượt quá 10MB`
      );
      setTimeout(() => onError(null), 5000);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];
    const invalidTypeFiles = newFiles.filter(
      (file) =>
        !allowedTypes.includes(file.type) &&
        !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png|gif|mp4|webm)$/i)
    );
    if (invalidTypeFiles.length > 0) {
      onError(
        `Định dạng file ${invalidTypeFiles
          .map((f) => f.name)
          .join(", ")} không được hỗ trợ`
      );
      setTimeout(() => onError(null), 5000);
      return;
    }

    setIsUploadingFiles(true);
    try {
      const uploadedBatch: UploadedHomeworkFile[] = [];
      for (const file of newFiles) {
        const result = await uploadFile(file, "homework");
        if (!isUploadSuccess(result)) {
          const errMsg =
            result.detail ||
            result.error ||
            result.title ||
            `Khong the tai len file ${file.name}`;
          onError(errMsg);
          toast({
            title: "Tai file that bai",
            description: errMsg,
            variant: "destructive",
          });
          continue;
        }
        uploadedBatch.push({
          name: result.fileName || file.name,
          size: result.size || file.size,
          url: result.url,
        });
      }
      if (uploadedBatch.length > 0) {
        setUploadedFiles((prev) => [...prev, ...uploadedBatch]);
        toast({
          title: "Tai file thanh cong",
          description:
            uploadedBatch.length === 1
              ? `Da them ${uploadedBatch[0].name} vao bai nop`
              : `Da them ${uploadedBatch.length} file vao bai nop`,
          variant: "success",
        });
      }
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    const trimmedLink = newLink.trim();
    if (!trimmedLink) return;
    try {
      const parsed = new URL(trimmedLink);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("invalid-protocol");
      }
    } catch {
      onError(
        "Link khong hop le. Vui long dung duong dan bat dau bang http hoac https."
      );
      return;
    }
    if (submissionLinks.includes(trimmedLink)) {
      onError("Link nay da duoc them roi.");
      return;
    }
    setSubmissionLinks((prev) => [...prev, trimmedLink]);
    setNewLink("");
  };

  const handleSubmitClick = async () => {
    const cleanText = submissionText.trim();
    const cleanLinks = submissionLinks.map((x) => x.trim()).filter(Boolean);
    const uploadedUrls = uploadedFiles.map((file) => file.url).filter(Boolean);
    const attachmentUrls = [...uploadedUrls, ...cleanLinks];

    if (isFileSubmission && attachmentUrls.length === 0) {
      onError("Bai nay can it nhat 1 file hoac link bai lam truoc khi nop.");
      return;
    }
    if (isTextSubmission && !cleanText) {
      onError("Bài này yêu cầu câu trả lời dạng văn bản.");
      return;
    }
    if (isLinkSubmission && cleanLinks.length === 0) {
      onError("Bài này yêu cầu ít nhất 1 link.");
      return;
    }

    const payload: SubmitHomeworkPayload = {
      homeworkStudentId: assignment.id || "",
    };
    if (cleanText) {
      payload.textAnswer = cleanText;
    }
    if (isFileSubmission && attachmentUrls.length > 0) {
      payload.attachmentUrls = attachmentUrls;
    }
    if (isLinkSubmission && cleanLinks.length > 0) {
      payload.linkUrl = cleanLinks[0];
    }

    await onSubmit(payload);
  };

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Upload size={20} className="text-purple-400" />
        Nộp bài
      </h2>

      <div className="space-y-4">
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span className="rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-300 px-3 py-1">Cách nộp phù hợp</span>
            {isFileSubmission && (
              <span className="rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1">
                Tải file
              </span>
            )}
            {isTextSubmission && (
              <span className="rounded-full bg-green-500/20 border border-green-400/30 text-green-300 px-3 py-1">
                Viết câu trả lời
              </span>
            )}
            {(isFileSubmission || isLinkSubmission) && (
              <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1">
                Dán link bài làm
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {isFileSubmission
              ? "Chọn file để tải lên trực tiếp. Nếu bài làm nằm trên Google Drive hoặc Docs, bạn có thể dán thêm link bên dưới."
              : isLinkSubmission
              ? "Dán 1 link bài làm là đủ. Nên mở quyền xem để giáo viên chấm bài không gặp lỗi."
              : "Nhập bài làm bằng cách đơn giản nhất theo yêu cầu của giáo viên."}
          </p>
        </div>

        {isFileSubmission && (
          <div className="space-y-3 rounded-xl border border-dashed border-purple-500/30 bg-slate-800/40 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Tải file bài làm
              </label>
              <p className="text-sm text-slate-500">
                Hỗ trợ PDF, Word, ảnh, video nhỏ. Mỗi file tối đa 10MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isUploadingFiles}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-500 file:text-white hover:file:from-blue-600 hover:file:to-purple-600 block w-full text-sm text-slate-400 disabled:opacity-60 cursor-pointer"
            />
            {isUploadingFiles && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-purple-300 border border-purple-500/20">
                <Loader2 size={16} className="animate-spin" />
                Đang tải file lên...
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={`${file.url}-${idx}`}
                    className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-purple-500/20 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">
                        {file.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(
                          file.size /
                          (file.size >= 1024 * 1024 ? 1024 * 1024 : 1024)
                        ).toFixed(file.size >= 1024 * 1024 ? 1 : 2)}{" "}
                        {file.size >= 1024 * 1024 ? "MB" : "KB"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="rounded p-1 hover:bg-rose-500/20 transition"
                      aria-label={`Xóa ${file.name}`}
                    >
                      <Trash2 size={16} className="text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isTextSubmission && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nhập văn bản (nếu cần)
            </label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={6}
              placeholder="Nhập nội dung bài làm..."
              className="w-full rounded-xl border border-purple-500/30 bg-slate-800/60 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400/50"
            />
          </div>
        )}

        {(isFileSubmission || isLinkSubmission) && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Gắn link (Google Docs, Drive, etc.)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-xl border border-purple-500/30 bg-slate-800/60 px-4 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400/50"
              />
              <button
                onClick={handleAddLink}
                className="rounded-xl bg-purple-500/20 border border-purple-500/30 px-4 py-2 font-medium text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/40 transition"
              >
                Thêm
              </button>
            </div>
            {submissionLinks.length > 0 && (
              <div className="mt-3 space-y-2">
                {submissionLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-800/40 border border-purple-500/20 p-3"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {link}
                    </a>
                    <button
                      onClick={() =>
                        setSubmissionLinks((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="rounded p-1 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 size={16} className="text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between border-t border-purple-500/20 pt-4">
          <div className="text-sm text-slate-500">
            {assignment.maxResubmissions && (
              <span>
                Được phép nộp lại tối đa {assignment.maxResubmissions} lần
              </span>
            )}
          </div>
          <button
            onClick={handleSubmitClick}
            disabled={
              attachmentSourcesCount === 0 && !submissionText.trim() || isSubmitting || isUploadingFiles
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white transition hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-600 disabled:to-slate-700 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
