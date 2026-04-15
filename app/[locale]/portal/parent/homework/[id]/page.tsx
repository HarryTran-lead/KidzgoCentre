"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  Paperclip,
  AlertCircle,
  Award,
  MessageSquare,
  Eye,
  Download,
  BookOpen,
  Sparkles,
  Loader2,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { getParentHomeworkById } from "@/lib/api/parentPortalService";
import { buildFileUrl } from "@/constants/apiURL";

// ── Types ──────────────────────────────────────────────────────
type AssignmentStatus = "SUBMITTED" | "PENDING" | "MISSING" | "LATE" | "ASSIGNED";

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: string;
}

interface RubricCriteria {
  id: string;
  criteria: string;
  description: string;
  maxPoints: number;
  earnedPoints?: number;
}

interface Submission {
  id: string;
  submittedAt: string;
  status: "ON_TIME" | "LATE";
  content?: {
    text?: string;
    files?: Attachment[];
    links?: string[];
  };
  version: number;
}

interface Grading {
  score: number;
  maxScore: number;
  percentage: number;
  teacherComment?: string;
  aiFeedback?: string;
  rubricScores?: { criteriaId: string; score: number; comment?: string }[];
}

interface HomeworkDetail {
  id: string;
  title: string;
  className: string;
  subject: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: AssignmentStatus;
  submissionType?: string;
  description: string;
  instructions?: string;
  requirements?: string[];
  rubric?: RubricCriteria[];
  teacherAttachments?: Attachment[];
  maxScore?: number;
  submission?: Submission;
  submissionHistory?: Submission[];
  grading?: Grading;
  submittedAt?: string;
  gradedAt?: string;
  book?: string | null;
  pages?: string | null;
  skills?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────
function StatusBadge({ status, isGraded = false }: { status: AssignmentStatus; isGraded?: boolean }) {
  if (isGraded) {
    return (
      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
        Đã chấm
      </span>
    );
  }
  const config: Record<string, { text: string; cls: string }> = {
    ASSIGNED: { text: "Đã giao", cls: "bg-blue-50 border-blue-200 text-blue-700" },
    SUBMITTED: { text: "Đã nộp", cls: "bg-gray-900 border-gray-800 text-white" },
    PENDING: { text: "Chưa nộp", cls: "bg-amber-50 border-amber-200 text-amber-700" },
    MISSING: { text: "Quá hạn", cls: "bg-red-50 border-red-200 text-red-700" },
    LATE: { text: "Nộp trễ", cls: "bg-orange-50 border-orange-200 text-orange-700" },
  };
  const { text, cls } = config[status] || config.PENDING;
  return <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${cls}`}>{text}</span>;
}

function AttachmentIcon({ type }: { type: string }) {
  switch (type) {
    case "PDF": return <FileText size={16} className="text-red-500" />;
    case "DOC":
    case "DOCX": return <FileText size={16} className="text-blue-500" />;
    case "LINK": return <LinkIcon size={16} className="text-indigo-500" />;
    case "VIDEO": return <Film size={16} className="text-purple-500" />;
    case "IMAGE": return <ImageIcon size={16} className="text-emerald-500" />;
    default: return <FileText size={16} className="text-gray-500" />;
  }
}

const formatDateVn = (dateString?: string | null): string => {
  if (!dateString) return "Chưa có";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return dateString;
  }
};

// ── Main Page ──────────────────────────────────────────────────
export default function ParentHomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;
  const locale = (params.locale as string) || "vi";

  const [homework, setHomework] = useState<HomeworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!homeworkId) return;
    let alive = true;
    setLoading(true);
    setError(null);

    getParentHomeworkById(homeworkId)
      .then((res) => {
        if (!alive) return;
        const data = res?.data?.data ?? res?.data ?? res;
        if (data) {
          setHomework(data);
        } else {
          setError("Không tìm thấy bài tập");
        }
      })
      .catch(() => {
        if (alive) setError("Đã xảy ra lỗi khi tải bài tập");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [homeworkId]);

  const hasGrading = Boolean(homework?.grading || homework?.gradedAt);
  const teacherComment = homework?.grading?.teacherComment?.trim();
  const aiFeedback = homework?.grading?.aiFeedback?.trim();

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="ml-3 text-gray-700 font-medium">Đang tải...</span>
      </div>
    );
  }

  // ── Error ──
  if (error || !homework) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-gray-900 font-semibold text-lg mb-2">{error || "Không tìm thấy bài tập"}</p>
        <button
          onClick={() => router.push(`/${locale}/portal/parent/homework`)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${locale}/portal/parent/homework`)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-white font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg flex-shrink-0">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  {homework.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {homework.className && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {homework.className}
                    </span>
                  )}
                  {homework.subject && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                      {homework.subject}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <StatusBadge status={homework.status} isGraded={hasGrading} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            {homework.teacher && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Giáo viên</div>
                  <div className="text-sm font-medium text-gray-900">{homework.teacher}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Ngày giao</div>
                <div className="text-sm font-medium text-gray-900">{formatDateVn(homework.assignedDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Hạn nộp</div>
                <div className={`text-sm font-medium ${
                  homework.status === "MISSING" || homework.status === "LATE"
                    ? "text-red-600" : "text-gray-900"
                }`}>
                  {formatDateVn(homework.dueDate)}
                </div>
              </div>
            </div>
            {homework.submissionType && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Loại nộp</div>
                  <div className="text-sm font-medium text-gray-900">{homework.submissionType}</div>
                </div>
              </div>
            )}
            {homework.book && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Sách</div>
                  <div className="text-sm font-medium text-gray-900">
                    {homework.book}{homework.pages ? ` — Trang ${homework.pages}` : ""}
                  </div>
                </div>
              </div>
            )}
            {homework.skills && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Award className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Kỹ năng</div>
                  <div className="text-sm font-medium text-gray-900">{homework.skills}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grading Result */}
        {hasGrading && homework.grading && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-emerald-600" />
              Kết quả chấm bài
            </h2>

            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Điểm</div>
                <div className="mt-2 text-2xl font-bold text-red-600">
                  {homework.grading.score}/{homework.grading.maxScore}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Nộp lúc</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDateVn(homework.submittedAt)}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Chấm lúc</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDateVn(homework.gradedAt)}
                </div>
              </div>
            </div>

            {(teacherComment || aiFeedback) && (
              <div className="grid gap-4 md:grid-cols-2">
                {teacherComment && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <MessageSquare size={16} />
                      Nhận xét của giáo viên
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{teacherComment}</p>
                  </div>
                )}
                {aiFeedback && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
                      <Sparkles size={16} />
                      Gợi ý từ AI
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{aiFeedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description & Requirements */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-red-600" />
            Mô tả bài tập
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            {homework.description || "Không có mô tả"}
          </p>

          {homework.instructions && (
            <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-sm font-semibold text-gray-700 mb-2">Hướng dẫn:</div>
              <p className="text-sm text-gray-600 leading-relaxed">{homework.instructions}</p>
            </div>
          )}

          {homework.requirements && homework.requirements.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-900 mb-3">Yêu cầu:</h3>
              <ul className="space-y-2">
                {homework.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Rubric */}
        {homework.rubric && homework.rubric.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-red-600" />
              Tiêu chí chấm điểm
            </h2>
            <div className="space-y-3">
              {homework.rubric.map((criteria) => {
                const rubricScore = homework.grading?.rubricScores?.find(
                  (rs) => rs.criteriaId === criteria.id
                );
                return (
                  <div
                    key={criteria.id}
                    className="flex items-start justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{criteria.criteria}</div>
                      <div className="text-sm text-gray-500 mt-1">{criteria.description}</div>
                      {rubricScore?.comment && (
                        <div className="text-sm text-blue-600 mt-2 italic">{rubricScore.comment}</div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {rubricScore?.score !== undefined ? (
                        <span className="text-sm font-semibold text-emerald-600">
                          {rubricScore.score}/{criteria.maxPoints}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-500">{criteria.maxPoints} điểm</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teacher Attachments */}
        {homework.teacherAttachments && homework.teacherAttachments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Paperclip size={20} className="text-red-600" />
              Tài liệu đính kèm
            </h2>
            <div className="space-y-3">
              {homework.teacherAttachments.map((attachment) => {
                const isImage = attachment.type === "IMAGE" || attachment.type?.includes("image");
                const fileUrl = buildFileUrl(attachment.url);

                if (isImage && fileUrl) {
                  return (
                    <div key={attachment.id} className="rounded-xl border border-gray-200 overflow-hidden hover:border-red-300 transition group">
                      <div className="relative bg-gray-50 flex items-center justify-center min-h-[200px]">
                        <img
                          src={fileUrl}
                          alt={attachment.name}
                          className="w-full h-auto max-h-96 object-contain p-2"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div className="hidden flex-col items-center justify-center gap-2 p-6">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                          <p className="text-gray-400 text-sm">Không thể tải ảnh</p>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg bg-red-600/80 hover:bg-red-700 transition"
                            title="Xem"
                          >
                            <Eye size={18} className="text-white" />
                          </a>
                          <a
                            href={fileUrl}
                            download
                            className="p-2.5 rounded-lg bg-gray-800/80 hover:bg-gray-900 transition"
                            title="Tải về"
                          >
                            <Download size={18} className="text-white" />
                          </a>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-100">
                        <div className="font-medium text-gray-900 text-sm truncate">{attachment.name}</div>
                        {attachment.size && (
                          <div className="text-xs text-gray-500 mt-0.5">{attachment.size}</div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={attachment.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-red-200 transition">
                    <div className="flex items-center gap-3">
                      <AttachmentIcon type={attachment.type} />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{attachment.name}</div>
                        {attachment.size && (
                          <div className="text-xs text-gray-500">{attachment.size}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Xem"
                      >
                        <Eye size={18} className="text-red-600" />
                      </a>
                      <a
                        href={fileUrl}
                        download
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Tải về"
                      >
                        <Download size={18} className="text-gray-600" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submission History (read-only for parents) */}
        {homework.submission && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-600" />
              Bài nộp của con
            </h2>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Nộp lúc</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDateVn(homework.submission.submittedAt)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Trạng thái</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  homework.submission.status === "ON_TIME"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-orange-50 text-orange-700 border border-orange-200"
                }`}>
                  {homework.submission.status === "ON_TIME" ? "Đúng hạn" : "Nộp trễ"}
                </span>
              </div>

              {homework.submission.content?.text && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Nội dung:</div>
                  <div className="text-sm text-gray-700 p-3 bg-white rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {homework.submission.content.text}
                  </div>
                </div>
              )}

              {homework.submission.content?.files && homework.submission.content.files.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Tệp đã nộp:</div>
                  <div className="space-y-2">
                    {homework.submission.content.files.map((file) => {
                      const fileUrl = buildFileUrl(file.url);
                      return (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <AttachmentIcon type={file.type} />
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Download size={16} className="text-gray-500" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {homework.submission.content?.links && homework.submission.content.links.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Liên kết:</div>
                  <div className="space-y-1">
                    {homework.submission.content.links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:underline"
                      >
                        <LinkIcon size={14} />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission History */}
        {homework.submissionHistory && homework.submissionHistory.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-gray-600" />
              Lịch sử nộp bài ({homework.submissionHistory.length} lần)
            </h2>
            <div className="space-y-3">
              {homework.submissionHistory.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      v{sub.version}
                    </div>
                    <div className="text-sm text-gray-700">{formatDateVn(sub.submittedAt)}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sub.status === "ON_TIME"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-orange-50 text-orange-600"
                  }`}>
                    {sub.status === "ON_TIME" ? "Đúng hạn" : "Trễ"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Message for PENDING */}
        {(homework.status === "PENDING" || homework.status === "ASSIGNED") && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Bài tập chưa được nộp</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Con bạn chưa nộp bài tập này. Hạn nộp: {formatDateVn(homework.dueDate)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message for MISSING */}
        {homework.status === "MISSING" && (
          <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Bài tập đã quá hạn</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Bài tập này đã quá hạn nộp và chưa được nộp.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
