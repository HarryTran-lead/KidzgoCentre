"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  Upload,
  Paperclip,
  Download,
  Trash2,
  Send,
  AlertCircle,
  Award,
  MessageSquare,
  Eye,
  FileCheck,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  BookOpen,
  Loader2,
  X,
} from "lucide-react";
import type {
  AssignmentDetail,
  AssignmentStatus,
  AttachmentType,
} from "@/types/student/homework";
import { getStudentHomeworkById, submitHomework } from "@/lib/api/studentService";
import type { SubmitHomeworkPayload } from "@/lib/api/studentService";
import ConfirmModal from "@/components/ConfirmModal";

// Status Badge
function StatusBadge({ status }: { status: AssignmentStatus }) {
  const config = {
    SUBMITTED: { text: "Đã nộp", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    PENDING: { text: "Chưa nộp", color: "bg-amber-100 text-amber-700 border-amber-200" },
    MISSING: { text: "Quá hạn", color: "bg-rose-100 text-rose-700 border-rose-200" },
    LATE: { text: "Nộp trễ", color: "bg-sky-100 text-sky-700 border-sky-200" },
  };
  const { text, color } = config[status] || config.PENDING;
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${color}`}>
      {text}
    </span>
  );
}

// Attachment Icon
function AttachmentIcon({ type }: { type: AttachmentType | string }) {
  switch (type) {
    case "PDF": return <FileText size={16} className="text-rose-600" />;
    case "DOC":
    case "DOCX": return <FileText size={16} className="text-blue-600" />;
    case "LINK": return <LinkIcon size={16} className="text-indigo-600" />;
    case "VIDEO": return <Film size={16} className="text-purple-600" />;
    case "IMAGE": return <ImageIcon size={16} className="text-emerald-600" />;
    default: return <FileText size={16} className="text-slate-600" />;
  }
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;

  // API State
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch homework detail
  useEffect(() => {
    const fetchHomeworkDetail = async () => {
      if (!homeworkId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getStudentHomeworkById(homeworkId);
        
        if (response.isSuccess && response.data) {
          setAssignment(response.data);
        } else {
          setError(response.message || "Không thể tải thông tin bài tập");
        }
      } catch (err) {
        console.error("Error fetching homework detail:", err);
        setError("Đã xảy ra lỗi khi tải bài tập");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeworkDetail();
  }, [homeworkId]);

  // Handle file selection with validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Validate file size (max 10MB each)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        setSubmitError(`Các file ${oversizedFiles.map(f => f.name).join(", ")} vượt quá 10MB`);
        setTimeout(() => setSubmitError(null), 5000);
        return;
      }

      // Validate file types
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
        file => !allowedTypes.includes(file.type) &&
        !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png|gif|mp4|webm)$/i)
      );

      if (invalidTypeFiles.length > 0) {
        setSubmitError(`Định dạng file ${invalidTypeFiles.map(f => f.name).join(", ")} không được hỗ trợ`);
        setTimeout(() => setSubmitError(null), 5000);
        return;
      }

      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (newLink.trim()) {
      setSubmissionLinks(prev => [...prev, newLink.trim()]);
      setNewLink("");
    }
  };

  const handleSubmit = () => {
    // Show confirm modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!homeworkId || !assignment) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submissionType = (assignment.submissionType || "").toUpperCase();
      const isFileRequired =
        submissionType === "FILE" ||
        submissionType === "IMAGE" ||
        submissionType === "FILE_AND_TEXT";
      const isTextRequired = submissionType === "TEXT" || submissionType === "FILE_AND_TEXT";
      const isLinkRequired = submissionType === "LINK";

      const cleanText = submissionText.trim();
      const cleanLinks = submissionLinks.map((x) => x.trim()).filter(Boolean);

      if (isFileRequired && cleanLinks.length === 0) {
        setSubmitError(
          "Bài này yêu cầu file. Hãy thêm ít nhất 1 URL file (Drive/Cloudinary) ở mục Link trước khi nộp."
        );
        setIsSubmitting(false);
        return;
      }
      if (isTextRequired && !cleanText) {
        setSubmitError("Bài này yêu cầu câu trả lời dạng văn bản.");
        setIsSubmitting(false);
        return;
      }
      if (isLinkRequired && cleanLinks.length === 0) {
        setSubmitError("Bài này yêu cầu ít nhất 1 link.");
        setIsSubmitting(false);
        return;
      }

      const payload: SubmitHomeworkPayload = {
        homeworkStudentId: homeworkId,
      };

      if (cleanText) {
        payload.textAnswer = cleanText;
      }

      // Current FE has no upload API yet. Use entered links as attachmentUrls for FILE type.
      if (isFileRequired && cleanLinks.length > 0) {
        payload.attachmentUrls = cleanLinks;
      }

      if (isLinkRequired && cleanLinks.length > 0) {
        payload.linkUrl = cleanLinks[0];
      }

      console.log("Submit payload:", JSON.stringify(payload));

      const response = await submitHomework(payload);

      if (response.isSuccess) {
        setSubmitSuccess(true);
        setShowConfirmModal(false);

        // Refresh homework data
        const refreshResponse = await getStudentHomeworkById(homeworkId);
        if (refreshResponse.isSuccess && refreshResponse.data) {
          setAssignment(refreshResponse.data);
        }

        // Clear form
        setSelectedFiles([]);
        setSubmissionText("");
        setSubmissionLinks([]);
      } else {
        setSubmitError(response.message || "Không thể nộp bài");
      }
    } catch (err) {
      console.error("Error submitting homework:", err);
      setSubmitError("Đã xảy ra lỗi khi nộp bài");
    }finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="ml-3 text-white font-semibold">Đang tải...</span>
      </div>
    );
  }

  // Error State
  if (error || !assignment) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-16 h-16 text-rose-400 mb-4" />
        <p className="text-white font-semibold text-lg mb-2">{error || "Không tìm thấy bài tập"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const isPending = assignment.status === "PENDING" || assignment.status === "MISSING";

  return (
    <div className="h-[calc(100vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-8">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white hover:text-white/80 font-medium" 
        >
          <ArrowLeft size={20} />
          Quay lại danh sách
        </button>

        {/* Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {assignment.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {assignment.className}
                </span>
                <span>•</span>
                <span>{assignment.subject}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User size={16} />
                  {assignment.teacher}
                </span>
              </div>
            </div>
            <StatusBadge status={assignment.status} />
          </div>

          {/* Date & Time Info */}
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="text-sm text-slate-500 mb-1">Ngày giao</div>
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <Calendar size={16} />
                {assignment.assignedDate || "Chưa có"}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Hạn nộp</div>
              <div className={`font-medium flex items-center gap-2 ${
                assignment.status === "MISSING" || assignment.status === "LATE"
                  ? "text-rose-600"
                  : "text-slate-900"
              }`}>
                <Clock size={16} />
                {assignment.dueDate || "Chưa có"}
              </div>
            </div>
            {assignment.timeRemaining && (
              <div>
                <div className="text-sm text-slate-500 mb-1">Thời gian còn lại</div>
                <div className={`font-semibold flex items-center gap-2 ${
                  assignment.timeRemaining.includes("giờ")
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}>
                  <AlertCircle size={16} />
                  {assignment.timeRemaining}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20}/>
            Mô tả bài tập
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            {assignment.description || "Không có mô tả"}
          </p>

          {assignment.requirements && assignment.requirements.length > 0 && (
            <>
              <h3 className="font-semibold text-slate-900 mb-3">Yêu cầu:</h3>
              <ul className="space-y-2">
                {assignment.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Rubric */}
        {assignment.rubric && assignment.rubric.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Award size={20} />
              Tiêu chí chấm điểm
            </h2>
            <div className="space-y-3">
              {assignment.rubric.map((criteria) => {
                const rubricScore = assignment.grading?.rubricScores?.find(
                  rs => rs.criteriaId === criteria.id
                );
                return (
                  <div
                    key={criteria.id}
                    className="flex items-start justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{criteria.criteria}</div>
                      <div className="text-sm text-slate-600 mt-1">{criteria.description}</div>
                      {rubricScore?.comment && (
                        <div className="text-sm text-blue-600 mt-2 italic">
                          💬 {rubricScore.comment}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-slate-900">
                        {rubricScore?.score !== undefined ? (
                          <span className="text-emerald-600">
                            {rubricScore.score}/{criteria.maxPoints}
                          </span>
                        ) : (
                          <span>
                            {criteria.maxPoints} điểm
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teacher Attachments */}
        {assignment.teacherAttachments && assignment.teacherAttachments.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Paperclip size={20} />
              Tài liệu đính kèm
            </h2>
            <div className="space-y-2">
              {assignment.teacherAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <AttachmentIcon type={attachment.type} />
                    <div>
                      <div className="font-medium text-slate-900">{attachment.name}</div>
                      {attachment.size && (
                        <div className="text-sm text-slate-500">{attachment.size}</div>
                      )}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-200 rounded-lg transition">
                    <Download size={18} className="text-slate-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Section */}
        {isPending ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload size={20} />
              Nộp bài
            </h2>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload file
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-sm text-slate-700">{file.name}</span>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Trash2 size={16} className="text-rose-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nhập văn bản (nếu cần)
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={6}
                  placeholder="Nhập nội dung bài làm..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Link Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gắn link (Google Docs, Drive, etc.)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddLink}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                  >
                    Thêm
                  </button>
                </div>
                {submissionLinks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {submissionLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {link}
                        </a>
                        <button
                          onClick={() => setSubmissionLinks(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Trash2 size={16} className="text-rose-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-slate-600">
                  {assignment.maxResubmissions && (
                    <span>Được phép nộp lại tối đa {assignment.maxResubmissions} lần</span>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={
                    (selectedFiles.length === 0 && !submissionText.trim() && submissionLinks.length === 0) ||
                    isSubmitting
                  }
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center gap-2 transition"
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
        ) : null}

        {/* Submission History */}
        {assignment.submission && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck size={20} />
              Bài đã nộp
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                  <CheckCircle size={18} />
                  Đã nộp {assignment.submission.status === "ON_TIME" ? "đúng hạn" : "trễ"}
                </div>
                <div className="text-sm text-slate-600">
                  Nộp lúc: {assignment.submission.submittedAt} • Lần nộp thứ {assignment.submission.version}
                </div>
              </div>

              {assignment.submission.content?.files && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">File đã nộp:</h3>
                  <div className="space-y-2">
                    {assignment.submission.content.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <AttachmentIcon type={file.type} />
                          <div>
                            <div className="font-medium text-slate-900">{file.name}</div>
                            {file.size && <div className="text-sm text-slate-500">{file.size}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-200 rounded-lg">
                            <Eye size={18} className="text-slate-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-200 rounded-lg">
                            <Download size={18} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignment.submission.content?.text && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Nội dung:</h3>
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-700">
                    {assignment.submission.content.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grading Section */}
        {assignment.grading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Award size={20} />
              Kết quả chấm điểm
            </h2>

            {/* Score */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl mb-6 text-center border border-emerald-200">
              <div className="text-5xl font-bold text-emerald-600 mb-2">
                {assignment.grading.score}/{assignment.grading.maxScore}
              </div>
              <div className="text-lg text-slate-700">
                Điểm số: {assignment.grading.percentage}%
              </div>
              {assignment.gradedAt && (
                <div className="text-sm text-slate-500 mt-2">
                  Chấm điểm lúc: {assignment.gradedAt}
                </div>
              )}
            </div>

            {/* Teacher Comment */}
            {assignment.grading.teacherComment && (
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Nhận xét của giáo viên
                </h3>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-slate-700">
                  {assignment.grading.teacherComment}
                </div>
              </div>
            )}

            {/* Graded Files */}
            {assignment.grading.gradedFiles && assignment.grading.gradedFiles.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Bài đã chấm:</h3>
                <div className="space-y-2">
                  {assignment.grading.gradedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <AttachmentIcon type={file.type} />
                        <div>
                          <div className="font-medium text-slate-900">{file.name}</div>
                          {file.size && <div className="text-sm text-slate-500">{file.size}</div>}
                        </div>
                      </div>
                      <button className="p-2 hover:bg-slate-200 rounded-lg">
                        <Download size={18} className="text-slate-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal for Submit */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận nộp bài"
        message={`Bạn có chắc chắn muốn nộp bài tập "${assignment.title}" không? Sau khi nộp bạn sẽ không thể chỉnh sửa.`}
        confirmText="Nộp bài"
        cancelText="Hủy"
        variant="success"
        isLoading={isSubmitting}
      />

      {/* Success Toast */}
      {submitSuccess && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle size={24} />
          <div>
            <div className="font-semibold">Nộp bài thành công!</div>
            <div className="text-sm text-emerald-100">Bài tập đã được nộp cho giáo viên</div>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="ml-4 p-1 hover:bg-emerald-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Toast */}
      {submitError && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-rose-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <AlertCircle size={24} />
          <div>
            <div className="font-semibold">Lỗi nộp bài</div>
            <div className="text-sm text-rose-100">{submitError}</div>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="ml-4 p-1 hover:bg-rose-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
