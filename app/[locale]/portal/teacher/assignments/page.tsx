"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  ClipboardList,
  UploadCloud,
  Wand2,
  Send,
  TimerReset,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Filter,
  Search,
  ChevronDown,
  Sparkles,
  BarChart3,
  Calendar,
  FileCheck,
  TrendingUp,
  Zap,
  ArrowUpDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Plus,
  Paperclip,
  Trash2,
  FileText,
  Upload,
  Award,
  Edit
} from "lucide-react";

import { fetchHomework, mapSubmissionToUi, createHomework, fetchClasses, fetchSessions, deleteHomework, fetchHomeworkDetail, updateHomework } from "@/lib/api/homeworkService";
import type { HomeworkSubmission, CreateHomeworkPayload, ClassOption, SessionOption } from "@/types/teacher/homework";

type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED" | "OVERDUE";

type Submission = {
  id: string;
  student: string;
  studentId: string;
  className: string;
  file: string;
  fileSize: string;
  fileType: string;
  assignmentTitle: string;
  dueDate: string;
  skills?: string;
  description?: string;
  note?: string;
  score?: number;
  color: string;
  // Additional fields for detail view
  assignmentId?: string;
  submittedAt?: string;
  attachments?: any[];
  content?: string;
  status?: SubmissionStatus;
  // Session/Buổi học
  session?: string;
  sessionId?: string;
};

const STATUS_CONFIG: Record<SubmissionStatus, {
  text: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  PENDING: {
    text: "Chờ chấm",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
    borderColor: "border-amber-200"
  },
  SUBMITTED: {
    text: "Đã gửi",
    icon: UploadCloud,
    color: "text-sky-600",
    bgColor: "bg-gradient-to-r from-sky-50 to-blue-50",
    borderColor: "border-sky-200"
  },
  REVIEWED: {
    text: "Đã phản hồi",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200"
  },
  OVERDUE: {
    text: "Quá hạn",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-gradient-to-r from-red-50 to-red-100",
    borderColor: "border-red-200"
  }
};

// SortableHeader Component
function SortableHeader<T extends string>({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort
}: {
  label: string;
  column: T;
  sortColumn: T | null;
  sortDirection: "asc" | "desc";
  onSort: (col: T) => void;
}) {
  const isActive = sortColumn === column;

  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-2 hover:text-red-600 transition-colors cursor-pointer text-left"
    >
      <span>{label}</span>
      <div className="flex flex-col">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp size={14} className="text-red-600" />
          ) : (
            <ChevronDown size={14} className="text-red-600" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </div>
    </button>
  );
}

function StudentAvatar({ name = "", color }: { name?: string; color: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config =
    STATUS_CONFIG[status] ?? {
      icon: Clock,
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      color: "text-gray-600",
      text: "Unknown",
    };

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${config.color}`}
    >
      <Icon size={14} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  const typeColors: Record<string, string> = {
    "PDF": "bg-red-100 text-red-700",
    "DOCX": "bg-blue-100 text-blue-700",
    "MP3": "bg-emerald-100 text-emerald-700",
    "ZIP": "bg-amber-100 text-amber-700",
    "PPT": "bg-orange-100 text-orange-700",
    "XLSX": "bg-green-100 text-green-700"
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${typeColors[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
}

function SubmissionRow({ item, onDelete, onViewDetail, onUpdate }: { item: Submission; onDelete: (id: string) => void; onViewDetail: (item: Submission) => void; onUpdate: (item: Submission) => void }) {
  return (
    <tr className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 border-b border-red-100">
      {/* Student Info */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <StudentAvatar name={item.student} color={item.color} />
          <div>
            <div className="font-medium text-gray-900">{item.student}</div>
            <div className="font-medium text-gray-900">{item.className}</div>
          </div>
        </div>
      </td>

      {/* Assignment Title */}
      <td className="py-4 px-6">
        <div className="text-sm font-medium text-gray-900">{item.assignmentTitle}</div>
      </td>

      {/* Session / Buổi học */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-900">{item.session || "-"}</div>
      </td>

      {/* Due Date */}
      <td className="py-4 px-6">
        <div className="font-medium text-gray-900 flex items-center gap-2">
          <Calendar size={12} />
          {item.dueDate}
        </div>
      </td>

      {/* File Info */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-900 truncate max-w-[150px]">{item.file}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <FileTypeBadge type={item.fileType} />
          <span>{item.fileSize}</span>
        </div>
      </td>

      {/* Skills */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-900">{item.skills || "-"}</div>
      </td>

      {/* Description */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">{item.description || "-"}</div>
      </td>

      {/* Actions */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetail(item)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onUpdate(item)}
            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
            title="Cập nhật bài tập"
          >
            <Edit size={14} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer" title="Tải xuống">
            <Download size={14} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer" title="Gửi phản hồi">
            <Send size={14} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer" 
            title="Xóa bài tập"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Create Assignment Modal Component
function CreateAssignmentModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [maxScore, setMaxScore] = useState("10");
  const [rewardStars, setRewardStars] = useState("0");
  const [book, setBook] = useState("");
  const [pages, setPages] = useState("");
  const [skills, setSkills] = useState("");
  const [submissionType, setSubmissionType] = useState<"FILE" | "TEXT" | "FILE_AND_TEXT">("FILE");
  const [missionId, setMissionId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [rubric, setRubric] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Fetch classes from API
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchClasses();
        setClasses(data);
      } catch (error) {
        console.error("Error loading classes:", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // Fetch sessions when class is selected
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedClass) {
        setSessions([]);
        return;
      }
      setIsLoadingSessions(true);
      console.log("🔍 [Sessions] Fetching sessions for classId:", selectedClass);
      try {
        const data = await fetchSessions(selectedClass);
        console.log("✅ [Sessions] Fetched sessions:", data);
        setSessions(data);
      } catch (error) {
        console.error("❌ [Sessions] Error loading sessions:", error);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessions();
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề bài tập");
      return;
    }
    if (!selectedClass) {
      setError("Vui lòng chọn lớp học");
      return;
    }
    if (!dueDate) {
      setError("Vui lòng chọn ngày hết hạn");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Call API to create homework
    try {
      const payload: CreateHomeworkPayload = {
        title,
        description,
        classId: selectedClass,
        sessionId: selectedSession || undefined,
        dueAt: `${dueDate}T${dueTime}:00+07:00`,
        book: book || undefined,
        pages: pages || undefined,
        skills: skills || undefined,
        submissionType,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
        rewardStars: rewardStars ? parseInt(rewardStars) : undefined,
        missionId: missionId || undefined,
        instructions: instructions || undefined,
        expectedAnswer: expectedAnswer || undefined,
        rubric: rubric || undefined,
      };

      const result = await createHomework(payload);

      if (result.ok) {
        onSuccess();
      } else {
        setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl">
              <TimerReset size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Giao bài tập mới</h2>
              <p className="text-sm text-gray-600">Tạo bài tập cho học viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              placeholder="Nhập tiêu đề bài tập..."
            />
          </div>

          {/* Class, Session, MaxScore & Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={isLoadingClasses}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none appearance-none bg-white disabled:bg-gray-100"
              >
                <option value="">{isLoadingClasses ? "Đang tải..." : "Chọn lớp học"}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buổi học
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                disabled={!selectedClass || isLoadingSessions}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none appearance-none bg-white disabled:bg-gray-100"
              >
                <option value="">
                  {!selectedClass
                    ? "Chọn lớp trước"
                    : isLoadingSessions
                      ? "Đang tải..."
                      : "Chọn buổi học"}
                </option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} {session.date ? `(${session.date})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MaxScore & RewardStars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm tối đa
              </label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                min="0"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sao thưởng
              </label>
              <input
                type="number"
                value={rewardStars}
                onChange={(e) => setRewardStars(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ hết hạn
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Book, Pages, Skills */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sách bài tập
              </label>
              <input
                type="text"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                placeholder="Tên sách..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trang
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                placeholder="Trang..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kỹ năng
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                placeholder="Kỹ năng..."
              />
            </div>
          </div>

          {/* Submission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình thức nộp bài
            </label>
            <select
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as "FILE" | "TEXT" | "FILE_AND_TEXT")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="FILE">Nộp file</option>
              <option value="TEXT">Nhập text</option>
              <option value="FILE_AND_TEXT">File và text</option>
            </select>
          </div>

          {/* Mission ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission ID
            </label>
            <input
              type="text"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              placeholder="ID nhiệm vụ (UUID)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả bài tập
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none"
              placeholder="Nhập mô tả chi tiết về bài tập..."
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hướng dẫn
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none"
              placeholder="Hướng dẫn chi tiết cho học viên..."
            />
          </div>

          {/* Expected Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đáp án kỳ vọng
            </label>
            <textarea
              value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none"
              placeholder="Đáp án mẫu / đáp án kỳ vọng..."
            />
          </div>

          {/* Rubric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rubric (Tiêu chí chấm điểm)
            </label>
            <textarea
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none"
              placeholder="Tiêu chí và cách chấm điểm..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang giao...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Giao bài tập
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Update Assignment Modal Component
function UpdateAssignmentModal({
  homework,
  onClose,
  onSuccess
}: {
  homework: Submission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Parse existing due date
  const parseDueDate = (dueDateStr: string) => {
    if (!dueDateStr) return { date: "", time: "23:59" };
    try {
      // dueDateStr is in format "DD/MM/YYYY, HH:mm" or ISO string
      let dateObj: Date;
      if (dueDateStr.includes("/")) {
        const [datePart, timePart] = dueDateStr.split(", ");
        const [day, month, year] = datePart.split("/").map(Number);
        const [hours, minutes] = timePart.split(":").map(Number);
        dateObj = new Date(year, month - 1, day, hours, minutes);
      } else {
        dateObj = new Date(dueDateStr);
      }
      return {
        date: dateObj.toISOString().split("T")[0],
        time: `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`
      };
    } catch {
      return { date: "", time: "23:59" };
    }
  };

  const initialDue = parseDueDate(homework.dueDate);

  const [title, setTitle] = useState(homework.assignmentTitle || "");
  const [description, setDescription] = useState(homework.description || "");
  const [dueDate, setDueDate] = useState(initialDue.date);
  const [dueTime, setDueTime] = useState(initialDue.time);
  const [book, setBook] = useState("");
  const [pages, setPages] = useState("");
  const [skills, setSkills] = useState(homework.skills || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề bài tập");
      return;
    }
    if (!dueDate) {
      setError("Vui lòng chọn ngày hết hạn");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        title,
        description: description || undefined,
        dueAt: `${dueDate}T${dueTime}:00+07:00`,
        book: book || undefined,
        pages: pages || undefined,
        skills: skills || undefined,
      };

      const homeworkId = homework.assignmentId || homework.id;
      const result = await updateHomework(homeworkId, payload);

      if (result.ok) {
        onSuccess();
      } else {
        setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl">
              <Edit size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cập nhật bài tập</h2>
              <p className="text-sm text-gray-600">Chỉnh sửa thông tin bài tập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              placeholder="Nhập tiêu đề bài tập..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả bài tập
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none"
              placeholder="Nhập mô tả chi tiết về bài tập..."
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ hết hạn
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Book, Pages, Skills */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sách bài tập
              </label>
              <input
                type="text"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                placeholder="Tên sách..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trang
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                placeholder="Trang..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kỹ năng
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
                placeholder="Kỹ năng..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Edit size={16} />
                  Cập nhật bài tập
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        pages.push(2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> -{" "}
        <span className="font-semibold text-gray-900">{endItem}</span>{" "}
        trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> bài nộp
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all ${currentPage === 1
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
            }`}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentPage === page
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-all ${currentPage === totalPages
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
            }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [sortColumn, setSortColumn] = useState<"student" | "assignment" | "turnIn" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [homeworkToDelete, setHomeworkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Update modal states
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [homeworkToUpdate, setHomeworkToUpdate] = useState<Submission | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [meta, setMeta] = useState<{ totalItems: number; totalPages: number; pageNumber: number; pageSize: number }>({
    totalItems: 0,
    totalPages: 0,
    pageNumber: 1,
    pageSize: 10
  });
  
  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Submission | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const itemsPerPage = 10;

  // Fetch homework from API
  const loadHomework = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      const result = await fetchHomework({
        pageNumber: page,
        pageSize: itemsPerPage,
        classId: selectedClass !== "ALL" ? selectedClass : undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      console.log({result});
      

      if (result.ok && result.data) {
        const mappedSubmissions = result.data.data.map((item: HomeworkSubmission) => mapSubmissionToUi(item));
        setSubmissions(mappedSubmissions);
        setMeta(result.data.meta || { totalItems: 0, totalPages: 0, pageNumber: 1, pageSize: 10 });
      } else {
        const errorMsg = 'ok' in result ? "Unknown error" : (result as any).error || "Unknown error";
        console.error("Failed to fetch homework:", errorMsg);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error loading homework:", error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, itemsPerPage]);

  // Handle delete homework - mở modal xác nhận
  const handleDeleteHomework = (id: string) => {
    setHomeworkToDelete(id);
    setDeleteModalOpen(true);
  };

  // Handle view homework detail - navigate to detail page
  const handleViewDetail = (item: Submission) => {
    // Use assignmentId if available, otherwise use id
    const homeworkId = item.assignmentId || item.id;
    router.push(`/vi/portal/teacher/assignments/${homeworkId}`);
  };

  // Xác nhận xóa homework
  const confirmDeleteHomework = async () => {
    if (!homeworkToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteHomework(homeworkToDelete);
      if (result.ok) {
        setDeleteModalOpen(false);
        setHomeworkToDelete(null);
        loadHomework(1);
      } else {
        console.error("Failed to delete homework:", result.error);
      }
    } catch (error) {
      console.error("Error deleting homework:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mở modal cập nhật homework
  const handleUpdateHomework = (item: Submission) => {
    setHomeworkToUpdate(item);
    setUpdateModalOpen(true);
  };

  // Xác nhận cập nhật homework
  const confirmUpdateHomework = async (updatedData: {
    title: string;
    description: string;
    dueAt: string;
    book?: string;
    pages?: string;
    skills?: string;
  }) => {
    if (!homeworkToUpdate) return;

    setIsUpdating(true);
    try {
      const homeworkId = homeworkToUpdate.assignmentId || homeworkToUpdate.id;
      const result = await updateHomework(homeworkId, updatedData);
      if (result.ok) {
        setUpdateModalOpen(false);
        setHomeworkToUpdate(null);
        loadHomework(1);
      } else {
        console.error("Failed to update homework:", result.error);
        return { ok: false, error: result.error };
      }
    } catch (error) {
      console.error("Error updating homework:", error);
      return { ok: false, error: "Có lỗi xảy ra" };
    } finally {
      setIsUpdating(false);
    }
    return { ok: true };
  };

  // Initial load
  useEffect(() => {
    loadHomework(1);
    setIsPageLoaded(true);
  }, []);

  // Reload when filter/class changes
  useEffect(() => {
    loadHomework(1);
    setCurrentPage(1);
  }, [filter, selectedClass, loadHomework]);

  const classes = Array.from(new Set(submissions.map(s => s.className)));

  const handleSort = (column: "student" | "assignment" | "turnIn") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = submissions;

    if (selectedClass !== "ALL") {
      result = result.filter(s => s.className === selectedClass);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.student.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query) ||
        s.assignmentTitle.toLowerCase().includes(query) ||
        s.className.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        if (sortColumn === "student") {
          comparison = a.student.localeCompare(b.student);
        } else if (sortColumn === "assignment") {
          comparison = a.assignmentTitle.localeCompare(b.assignmentTitle);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [filter, searchQuery, selectedClass, sortColumn, sortDirection, submissions]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, selectedClass]);

  // Pagination calculations - API handles pagination, no client-side slicing needed
  const totalPages = Math.ceil(meta.totalItems / itemsPerPage);

  const stats = useMemo(() => {
    const total = submissions.length;
    const avgScore = Math.round(
      submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) /
      (submissions.filter(s => s.score).length || 1) * 10
    ) / 10;

    return { total, avgScore };
  }, [submissions]);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <ClipboardList size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Bài tập & Nộp bài
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý bài tập đã giao, theo dõi tiến độ nộp bài và gửi nhận xét cho học viên.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng bài nộp</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{stats.total}</div>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <FileCheck size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Điểm TB</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">{stats.avgScore || "N/A"}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Filters and Actions */}
        <div className="px-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all cursor-pointer"
              >
                <TimerReset size={16} />
                Giao bài mới
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white border border-gray-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all"
                placeholder="Tìm kiếm học viên, bài tập, hoặc mã ID..."
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none rounded-xl bg-white border border-gray-200 pl-4 pr-10 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all"
                >
                  <option value="ALL">Tất cả lớp</option>
                  {classes.map((cls, index) => (
                    <option key={`${cls}-${index}`} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button className="p-3.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                <Filter size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách bài nộp</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filtered.length} bài nộp</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr>
                  <th className="py-3 px-6 text-left">
                    <SortableHeader
                      label="Lớp"
                      column="student"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="py-3 px-6 text-left">
                    <SortableHeader
                      label="Tên bài tập"
                      column="assignment"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Buổi học</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Hạn nộp</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Tệp đính kèm</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Kỹ năng</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Mô tả</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 size={32} className="animate-spin mx-auto text-red-600 mb-4" />
                      <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : submissions.length > 0 ? (
                  submissions.map((item) => (
                    <SubmissionRow key={item.id} item={item} onDelete={handleDeleteHomework} onViewDetail={handleViewDetail} onUpdate={handleUpdateHomework} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                        <Search size={24} className="text-red-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không tìm thấy bài nộp</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, meta.totalItems)}</span> trong tổng số{" "}
                  <span className="font-semibold text-gray-900">{meta.totalItems}</span> bài nộp
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadHomework(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => loadHomework(page)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          page === currentPage
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                            : "border border-red-200 hover:bg-red-50 text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => loadHomework(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Tools Section */}
        <div className={`px-6 pb-6 pt-8 mt-8 border-t border-gray-200 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                  <TimerReset size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Giao bài tập mới</h3>
                  <p className="text-sm text-gray-600">Create & Schedule assignments</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Tạo bài tập theo lớp, đặt hạn nộp và tự động nhắc nhở qua Zalo nếu học viên chưa nộp trước giờ học.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-amber-200 rounded-xl">
                    <div className="text-xs text-gray-600">Đang mở</div>
                    <div className="text-lg font-bold text-amber-600">12</div>
                    <div className="text-xs text-gray-600">bài tập</div>
                  </div>
                  <div className="p-3 bg-white border border-amber-200 rounded-xl">
                    <div className="text-xs text-gray-600">Sắp hết hạn</div>
                    <div className="text-lg font-bold text-amber-600">3</div>
                    <div className="text-xs text-gray-600">trong 24h</div>
                  </div>
                </div>

                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 font-medium hover:shadow-lg transition-all cursor-pointer">
                  <Calendar size={16} />
                  Lên lịch nhắc nhở
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <Wand2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tạo feedback tự động</h3>
                  <p className="text-sm text-gray-600">AI-powered suggestions</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Dùng AI để gợi ý nhận xét chi tiết dựa trên bài làm của học viên, sau đó chỉnh sửa trước khi gửi.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600">Đề xuất từ AI</div>
                      <div className="text-sm text-gray-900 mt-1">"Bài viết có cấu trúc tốt, cần chú ý đến ngữ pháp câu phức..."</div>
                    </div>
                    <Sparkles size={20} className="text-emerald-500" />
                  </div>
                </div>

                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 font-medium hover:shadow-lg transition-all cursor-pointer">
                  <Zap size={16} />
                  Gợi ý từ AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <CreateAssignmentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadHomework(1);
          }}
        />
      )}

      {/* Update Homework Modal */}
      {updateModalOpen && homeworkToUpdate && (
        <UpdateAssignmentModal
          homework={homeworkToUpdate}
          onClose={() => {
            setUpdateModalOpen(false);
            setHomeworkToUpdate(null);
          }}
          onSuccess={() => {
            setUpdateModalOpen(false);
            setHomeworkToUpdate(null);
            loadHomework(1);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl m-4 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa bài tập</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa bài tập này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteHomework}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xóa bài tập
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homework Detail Modal */}
      {detailModalOpen && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDetailModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl">
                  <Eye size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chi tiết bài tập</h2>
                  <p className="text-sm text-gray-600">Xem thông tin chi tiết bài nộp của học viên</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isLoadingDetail ? (
                <div className="py-12 text-center">
                  <Loader2 size={32} className="animate-spin mx-auto text-red-600 mb-4" />
                  <p className="text-gray-600">Đang tải chi tiết...</p>
                </div>
              ) : (
                <>
                  {/* Student & Assignment Info */}
                  <div className="rounded-xl border border-gray-200 p-5 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{selectedHomework.assignmentTitle || "Bài tập"}</h3>
                        <p className="text-gray-600 mt-1">{selectedHomework.className}</p>
                      </div>
                      <StatusBadge status={selectedHomework.status || "PENDING"} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Mã HV:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedHomework.studentId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Hạn nộp:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedHomework.dueDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ngày nộp:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedHomework.submittedAt || "Chưa nộp"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedHomework.description && (
                    <div className="rounded-xl border border-gray-200 p-5">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText size={18} />
                        Mô tả bài tập
                      </h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedHomework.description}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedHomework.skills && (
                    <div className="rounded-xl border border-gray-200 p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">Kỹ năng</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHomework.skills.split(',').map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submitted Content */}
                  <div className="rounded-xl border border-gray-200 p-5">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Upload size={18} />
                      Nội dung bài nộp
                    </h4>
                    
                    {/* File attachments */}
                    {selectedHomework.attachments && selectedHomework.attachments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedHomework.attachments.map((attachment: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Paperclip size={18} className="text-gray-500" />
                              <div>
                                <div className="font-medium text-gray-900">{attachment.name || "Tệp đính kèm"}</div>
                                {attachment.sizeInBytes && (
                                  <div className="text-xs text-gray-500">
                                    {Math.round(attachment.sizeInBytes / 1024)} KB
                                  </div>
                                )}
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                              <Download size={18} className="text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : selectedHomework.content ? (
                      <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                        {selectedHomework.content}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">Chưa có nội dung</div>
                    )}
                  </div>

                  {/* Score/Feedback */}
                  {(selectedHomework.score !== undefined || selectedHomework.note) && (
                    <div className="rounded-xl border border-gray-200 p-5">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Award size={18} />
                        Điểm số & Nhận xét
                      </h4>
                      {selectedHomework.score !== undefined && (
                        <div className="mb-3 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                          <span className="text-3xl font-bold text-emerald-600">{selectedHomework.score}</span>
                          <span className="text-gray-600"> / 10 điểm</span>
                        </div>
                      )}
                      {selectedHomework.note && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-gray-700">{selectedHomework.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
              >
                Đóng
              </button>
              <button className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2 cursor-pointer">
                <Send size={16} />
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}