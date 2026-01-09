"use client";

import { useState } from "react";
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
} from "lucide-react";
import type {
  AssignmentDetail,
  AssignmentStatus,
  Attachment,
  AttachmentType,
} from "@/types/student/homework";

// Status Badge
function StatusBadge({ status }: { status: AssignmentStatus }) {
  const config = {
    SUBMITTED: { text: "Đã nộp", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    PENDING: { text: "Chưa nộp", color: "bg-amber-100 text-amber-700 border-amber-200" },
    MISSING: { text: "Quá hạn", color: "bg-rose-100 text-rose-700 border-rose-200" },
    LATE: { text: "Nộp trễ", color: "bg-sky-100 text-sky-700 border-sky-200" },
  };
  const { text, color } = config[status];
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${color}`}>
      {text}
    </span>
  );
}

// Attachment Icon
function AttachmentIcon({ type }: { type: AttachmentType }) {
  switch (type) {
    case "PDF": return <FileText size={16} className="text-rose-600" />;
    case "DOC":
    case "DOCX": return <FileText size={16} className="text-blue-600" />;
    case "LINK": return <LinkIcon size={16} className="text-indigo-600" />;
    case "VIDEO": return <Film size={16} className="text-purple-600" />;
    case "IMAGE": return <ImageIcon size={16} className="text-emerald-600" />;
  }
}

// Sample Data
const SAMPLE_DATA: AssignmentDetail = {
  id: "1",
  title: "Bài viết: Giáng Sinh",
  className: "Lớp Tiếng Anh A1",
  subject: "Tiếng Anh",
  teacher: "Cô Nguyễn Thị Mai",
  assignedDate: "15/12/2024",
  dueDate: "22/12/2024",
  status: "PENDING",
  timeRemaining: "6 giờ 30 phút",
  description: "Viết một bài luận ngắn (200-250 từ) về kỷ niệm Giáng Sinh đáng nhớ nhất của em. Sử dụng thì quá khứ đơn và quá khứ tiếp diễn. Chú ý ngữ pháp, chính tả và cấu trúc bài.",
  requirements: [
    "Độ dài: 200-250 từ",
    "Sử dụng đúng thì quá khứ đơn và quá khứ tiếp diễn",
    "Có câu mở bài, thân bài và kết luận rõ ràng",
    "Kiểm tra chính tả và ngữ pháp trước khi nộp",
    "Format: Times New Roman, size 12, line spacing 1.5",
  ],
  rubric: [
    {
      id: "1",
      criteria: "Nội dung",
      description: "Ý tưởng rõ ràng, phù hợp chủ đề",
      maxPoints: 3,
    },
    {
      id: "2",
      criteria: "Ngữ pháp",
      description: "Sử dụng đúng thì, cấu trúc câu",
      maxPoints: 3,
    },
    {
      id: "3",
      criteria: "Từ vựng",
      description: "Đa dạng, phù hợp ngữ cảnh",
      maxPoints: 2,
    },
    {
      id: "4",
      criteria: "Trình bày",
      description: "Cấu trúc bài, chính tả, format",
      maxPoints: 2,
    },
  ],
  teacherAttachments: [
    {
      id: "1",
      name: "Hướng dẫn viết bài.pdf",
      type: "PDF",
      url: "#",
      size: "1.2 MB",
    },
    {
      id: "2",
      name: "Bài mẫu tham khảo.docx",
      type: "DOCX",
      url: "#",
      size: "850 KB",
    },
    {
      id: "3",
      name: "Checklist chấm điểm",
      type: "LINK",
      url: "#",
    },
  ],
  allowResubmit: true,
  maxResubmissions: 2,
  editCount: 0,
};

// Sample submitted assignment
const SUBMITTED_DATA: AssignmentDetail = {
  ...SAMPLE_DATA,
  id: "2",
  title: "Worksheet Unit 5",
  status: "SUBMITTED",
  timeRemaining: undefined,
  submission: {
    id: "sub1",
    submittedAt: "21/12/2024 20:30",
    status: "ON_TIME",
    content: {
      text: "Đây là nội dung bài làm của em...",
      files: [
        {
          id: "f1",
          name: "Unit5_NguyenVanAn.docx",
          type: "DOCX",
          url: "#",
          size: "2.1 MB",
          uploadedAt: "21/12/2024 20:30",
        },
      ],
    },
    version: 1,
  },
  submissionHistory: [
    {
      id: "sub1",
      submittedAt: "21/12/2024 20:30",
      status: "ON_TIME",
      content: {
        files: [
          {
            id: "f1",
            name: "Unit5_NguyenVanAn.docx",
            type: "DOCX",
            url: "#",
            size: "2.1 MB",
          },
        ],
      },
      version: 1,
    },
  ],
  grading: {
    score: 9.5,
    maxScore: 10,
    percentage: 95,
    teacherComment: "Bài làm rất tốt! Em đã nắm vững kiến thức và áp dụng chính xác. Chỉ có một số lỗi nhỏ về chính tả. Tiếp tục phát huy nhé!",
    rubricScores: [
      { criteriaId: "1", score: 3, comment: "Xuất sắc" },
      { criteriaId: "2", score: 2.5, comment: "Một vài lỗi nhỏ" },
      { criteriaId: "3", score: 2, comment: "Tốt" },
      { criteriaId: "4", score: 2, comment: "Hoàn hảo" },
    ],
    gradedFiles: [
      {
        id: "g1",
        name: "Unit5_NguyenVanAn_Graded.pdf",
        type: "PDF",
        url: "#",
        size: "2.5 MB",
      },
    ],
  },
  submittedAt: "21/12/2024 20:30",
  gradedAt: "21/12/2024 22:15",
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  // Use submitted data for demo
  const isSubmitted = assignmentId === "2";
  const assignment = isSubmitted ? SUBMITTED_DATA : SAMPLE_DATA;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
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
    // Handle submission logic
    console.log("Submit:", { selectedFiles, submissionText, submissionLinks });
  };

  return (
    <div className="space-y-6 min-h-screen p-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white hover:text-white/20 font-medium"
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
              {assignment.assignedDate}
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
              {assignment.dueDate}
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
          <FileText size={20} />
          Mô tả bài tập
        </h2>
        <p className="text-slate-700 leading-relaxed mb-6">
          {assignment.description}
        </p>

        <h3 className="font-semibold text-slate-900 mb-3">Yêu cầu:</h3>
        <ul className="space-y-2">
          {assignment.requirements.map((req, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-700">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{req}</span>
            </li>
          ))}
        </ul>
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
      {assignment.status === "PENDING" || assignment.status === "MISSING" ? (
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
                disabled={selectedFiles.length === 0 && !submissionText && submissionLinks.length === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <Send size={18} />
                Nộp bài
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
                          <div className="text-sm text-slate-500">{file.size}</div>
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
          <div className="p-6 bg-linear-to-br from-emerald-50 to-blue-50 rounded-xl mb-6 text-center border border-emerald-200">
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
                        <div className="text-sm text-slate-500">{file.size}</div>
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
  );
}
