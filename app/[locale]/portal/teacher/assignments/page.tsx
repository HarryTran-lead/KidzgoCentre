"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

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
  Edit,
  Save,
  BookOpen,
  Users,
  GraduationCap,
  BookMarked,
  AlignLeft,
  CalendarDays,
  AlertTriangle,
  Tag,
  Star,
} from "lucide-react";

import { fetchHomework, mapSubmissionToUi, createHomework, fetchClasses, fetchSessions, deleteHomework, fetchHomeworkDetail, updateHomework, createMultipleChoiceHomework } from "@/lib/api/homeworkService";
import type { HomeworkSubmission, CreateHomeworkPayload, ClassOption, SessionOption, MultipleChoiceQuestion } from "@/types/teacher/homework";

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
  submissionType?: string;
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
      className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
    >
      <span>{label}</span>
      {isActive ? (
        sortDirection === "asc" ? (
          <span aria-hidden>↑</span>
        ) : (
          <span aria-hidden>↓</span>
        )
      ) : (
        <span aria-hidden className="text-gray-300">↕</span>
      )}
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

function SubmissionRow({ item, onDelete, onViewDetail, onUpdate, isSelected, onSelect }: { item: Submission; onDelete: (id: string) => void; onViewDetail: (item: Submission) => void; onUpdate: (item: Submission) => void; isSelected: boolean; onSelect: (id: string) => void }) {
  return (
    <tr className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 border-b border-red-100">
      {/* Multiple Choice Checkbox */}
      <td className="py-4 px-6">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
        />
      </td>

      {/* Assignment Title */}
      <td className="py-4 px-6">
        <div className="text-sm font-medium text-gray-900">{item.assignmentTitle}</div>
      </td>

      {/* Class / Lớp học */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600">{item.className || "-"}</div>
      </td>

      {/* Session / Buổi học */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-900">{item.sessionId || "-"}</div>
      </td>

      {/* Due Date */}
      <td className="py-4 px-6">
        <div className="text-sm text-gray-700 flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span>{item.dueDate}</span>
        </div>
      </td>

      {/* Skills */}
      <td className="py-4 px-6">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {item.skills || "-"}
        </span>
      </td>

      {/* Submission Type */}
      <td className="py-4 px-6">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
          item.submissionType === "Quiz" 
            ? "bg-purple-50 text-purple-700 border-purple-200"
            : item.submissionType === "FILE"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : item.submissionType === "TEXT"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-700 border-gray-200"
        }`}>
          {item.submissionType || "File"}
        </span>
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
            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onUpdate(item)}
            className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
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
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"UPLOAD" | "MULTIPLE_CHOICE">("UPLOAD");
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
  const [submissionType, setSubmissionType] = useState<"FILE" | "TEXT" | "FILE_AND_TEXT" | "MULTIPLE_CHOICE">("FILE");
  const [missionId, setMissionId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [rubric, setRubric] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Multiple choice specific states
  const [questions, setQuestions] = useState<Array<{
    id: string;
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    explanation?: string;
    points: number;
  }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState<Array<{ id: string; text: string; isCorrect: boolean }>>([
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false }
  ]);
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [currentPoints, setCurrentPoints] = useState("10");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const addOption = () => {
    setCurrentOptions([...currentOptions, { id: crypto.randomUUID(), text: "", isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    if (currentOptions.length > 2) {
      setCurrentOptions(currentOptions.filter(opt => opt.id !== id));
    }
  };

  const updateOptionText = (id: string, text: string) => {
    setCurrentOptions(currentOptions.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    ));
  };

  const toggleCorrectOption = (id: string) => {
    setCurrentOptions(currentOptions.map(opt => ({
      ...opt,
      isCorrect: opt.id === id
    })));
  };

  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      setError("Vui lòng nhập câu hỏi");
      return;
    }
    if (currentOptions.some(opt => !opt.text.trim())) {
      setError("Vui lòng nhập đầy đủ nội dung các lựa chọn");
      return;
    }
    if (!currentOptions.some(opt => opt.isCorrect)) {
      setError("Vui lòng chọn đáp án đúng");
      return;
    }

    setQuestions([...questions, {
      id: crypto.randomUUID(),
      question: currentQuestion,
      options: [...currentOptions],
      explanation: currentExplanation || undefined,
      points: parseInt(currentPoints) || 10
    }]);

    // Reset form
    setCurrentQuestion("");
    setCurrentOptions([
      { id: crypto.randomUUID(), text: "", isCorrect: false },
      { id: crypto.randomUUID(), text: "", isCorrect: false }
    ]);
    setCurrentExplanation("");
    setCurrentPoints("10");
    setShowQuestionForm(false);
    setError("");
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

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
    if (activeTab === "MULTIPLE_CHOICE" && questions.length === 0) {
      setError("Vui lòng thêm ít nhất 1 câu hỏi");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Call API to create homework
    try {
      // Determine which API to call based on tab
      if (activeTab === "MULTIPLE_CHOICE") {
        // Prepare questions for API - convert from UI format to API format
        // correctAnswer should be the INDEX of the correct option (as string/number)
        const apiQuestions: MultipleChoiceQuestion[] = questions.map(q => {
          const correctIndex = q.options.findIndex(opt => opt.isCorrect);
          return {
            questionText: q.question,
            questionType: "multipleChoice",
            options: q.options.map(opt => opt.text),
            correctAnswer: correctIndex, 
            points: q.points || 10,
            explanation: q.explanation,
          };
        });

        const result = await createMultipleChoiceHomework({
          title,
          description: description || undefined,
          classId: selectedClass,
          sessionId: selectedSession || undefined,
          dueAt: `${dueDate}T${dueTime}:00+07:00`,
          rewardStars: rewardStars ? parseInt(rewardStars) : undefined,
          missionId: missionId || undefined,
          instructions: instructions || undefined,
          questions: apiQuestions,
        });

        if (result.ok) {
          onSuccess();
        } else {
          setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
      } else {
        // Upload tab - use regular homework API
        const payload: CreateHomeworkPayload = {
          title,
          description,
          classId: selectedClass,
          sessionId: selectedSession || undefined,
          dueAt: `${dueDate}T${dueTime}:00+07:00`,
          book: book || undefined,
          pages: pages || undefined,
          skills: skills || undefined,
          submissionType: submissionType as "FILE" | "TEXT" | "FILE_AND_TEXT" | undefined,
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
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <TimerReset size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Giao bài tập mới
                </h2>
                <p className="text-sm text-red-100">
                  Tạo bài tập cho học viên
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50 px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("UPLOAD")}
              className={clsx(
                "py-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer",
                activeTab === "UPLOAD"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Upload size={18} />
                Upload file đề
              </div>
            </button>
            <button
              onClick={() => setActiveTab("MULTIPLE_CHOICE")}
              className={clsx(
                "py-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer",
                activeTab === "MULTIPLE_CHOICE"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={18} />
                Multiple choice
              </div>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-red-600" />
                Tiêu đề bài tập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                placeholder="Nhập tiêu đề bài tập..."
              />
            </div>

            {/* Class, Session */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} className="text-red-600" />
                  Lớp học <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={isLoadingClasses}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{isLoadingClasses ? "Đang tải..." : "Chọn lớp học..."}</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-red-600" />
                  Buổi học
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  disabled={!selectedClass || isLoadingSessions}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedClass
                      ? "Chọn lớp trước"
                      : isLoadingSessions
                        ? "Đang tải..."
                        : "Chọn buổi học..."}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Award size={16} className="text-red-600" />
                  Điểm tối đa
                </label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  min="0"
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Star size={16} className="text-red-600" />
                  Sao thưởng
                </label>
                <input
                  type="number"
                  value={rewardStars}
                  onChange={(e) => setRewardStars(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-red-600" />
                  Ngày hết hạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
                  Giờ hết hạn
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                />
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "UPLOAD" ? (
              /* Upload tab content */
              <>
                {/* Book, Pages, Skills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BookOpen size={16} className="text-red-600" />
                      Sách bài tập
                    </label>
                    <input
                      type="text"
                      value={book}
                      onChange={(e) => setBook(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                      placeholder="Tên sách..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText size={16} className="text-red-600" />
                      Trang
                    </label>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                      placeholder="Trang..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Sparkles size={16} className="text-red-600" />
                      Kỹ năng
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                      placeholder="Kỹ năng..."
                    />
                  </div>
                </div>

                {/* Submission Type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Upload size={16} className="text-red-600" />
                    Hình thức nộp bài
                  </label>
                  <select
                    value={submissionType}
                    onChange={(e) => setSubmissionType(e.target.value as "FILE" | "TEXT" | "FILE_AND_TEXT")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    <option value="FILE">Nộp file</option>
                    <option value="TEXT">Nhập text</option>
                    <option value="FILE_AND_TEXT">File và text</option>
                  </select>
                </div>

                {/* Mission ID */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Tag size={16} className="text-red-600" />
                    Mission ID
                  </label>
                  <input
                    type="text"
                    value={missionId}
                    onChange={(e) => setMissionId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="ID nhiệm vụ (UUID)"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <AlignLeft size={16} className="text-red-600" />
                    Mô tả bài tập
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                    placeholder="Nhập mô tả chi tiết về bài tập..."
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookMarked size={16} className="text-red-600" />
                    Hướng dẫn
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                    placeholder="Hướng dẫn chi tiết cho học viên..."
                  />
                </div>

                {/* Expected Answer */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle size={16} className="text-red-600" />
                    Đáp án kỳ vọng
                  </label>
                  <textarea
                    value={expectedAnswer}
                    onChange={(e) => setExpectedAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                    placeholder="Đáp án mẫu / đáp án kỳ vọng..."
                  />
                </div>

                {/* Rubric */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BarChart3 size={16} className="text-red-600" />
                    Rubric (Tiêu chí chấm điểm)
                  </label>
                  <textarea
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                    placeholder="Tiêu chí và cách chấm điểm..."
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Paperclip size={16} className="text-red-600" />
                    Tệp đính kèm
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-300 transition-colors cursor-pointer">
                    <input type="file" multiple className="hidden" />
                    <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Kéo thả file vào đây hoặc click để chọn</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOCX, MP3, ZIP (tối đa 50MB)</p>
                  </div>
                </div>
              </>
            ) : (
              /* Multiple Choice tab content - Fields matching API: classId, sessionId, title, description, dueAt, rewardStars, missionId, instructions, questions */
              <div className="space-y-4">
                {/* Instructions for Multiple Choice */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookMarked size={16} className="text-red-600" />
                    Hướng dẫn làm bài
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                    placeholder="Hướng dẫn học viên làm bài trắc nghiệm..."
                  />
                </div>

                {/* Mission ID for Multiple Choice */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Tag size={16} className="text-red-600" />
                    Mission ID
                  </label>
                  <input
                    type="text"
                    value={missionId}
                    onChange={(e) => setMissionId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="ID nhiệm vụ (UUID)"
                  />
                </div>

                {/* Description for Multiple Choice */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <AlignLeft size={16} className="text-red-600" />
                    Mô tả bài tập
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                    placeholder="Mô tả chi tiết về bài tập trắc nghiệm..."
                  />
                </div>

                {/* Questions List */}
                {questions.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <ClipboardList size={16} className="text-red-600" />
                      Danh sách câu hỏi ({questions.length})
                    </label>
                    <div className="space-y-3">
                      {questions.map((q, index) => (
                        <div key={q.id} className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-900">{q.question}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 ml-8">
                                {q.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className={clsx(
                                      "px-3 py-2 rounded-lg text-sm border",
                                      opt.isCorrect
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                        : "bg-white border-gray-200 text-gray-600"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {opt.isCorrect && <CheckCircle size={14} className="text-emerald-600" />}
                                      <span className={opt.isCorrect ? "font-medium" : ""}>{opt.text}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <div className="mt-2 ml-8 text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-200">
                                  <span className="font-medium">Giải thích:</span> {q.explanation}
                                </div>
                              )}
                              <div className="mt-2 ml-8 text-xs font-medium text-red-600">
                                Điểm: {q.points}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeQuestion(q.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Question Button */}
                {!showQuestionForm && (
                  <button
                    type="button"
                    onClick={() => setShowQuestionForm(true)}
                    className="w-full py-4 border-2 border-dashed border-red-300 rounded-xl text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus size={20} />
                    Thêm câu hỏi
                  </button>
                )}

                {/* Question Form */}
                {showQuestionForm && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Thêm câu hỏi mới</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuestionForm(false);
                          setCurrentQuestion("");
                          setCurrentOptions([
                            { id: crypto.randomUUID(), text: "", isCorrect: false },
                            { id: crypto.randomUUID(), text: "", isCorrect: false }
                          ]);
                          setCurrentExplanation("");
                          setCurrentPoints("10");
                          setError("");
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>

                    {/* Question Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Câu hỏi</label>
                      <textarea
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Các lựa chọn</label>
                      {currentOptions.map((opt, index) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => updateOptionText(opt.id, e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCorrectOption(opt.id)}
                            className={clsx(
                              "p-2 rounded-lg transition-colors cursor-pointer",
                              opt.isCorrect
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                            title="Đánh dấu là đáp án đúng"
                          >
                            <CheckCircle size={16} />
                          </button>
                          {currentOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(opt.id)}
                              className="p-2 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addOption}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        Thêm lựa chọn
                      </button>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Giải thích (không bắt buộc)</label>
                      <textarea
                        value={currentExplanation}
                        onChange={(e) => setCurrentExplanation(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder="Giải thích đáp án đúng..."
                      />
                    </div>

                    {/* Points */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Điểm</label>
                      <input
                        type="number"
                        value={currentPoints}
                        onChange={(e) => setCurrentPoints(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder="Điểm cho câu hỏi này"
                        min="1"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuestionForm(false);
                          setCurrentQuestion("");
                          setCurrentOptions([
                            { id: crypto.randomUUID(), text: "", isCorrect: false },
                            { id: crypto.randomUUID(), text: "", isCorrect: false }
                          ]);
                          setCurrentExplanation("");
                          setCurrentPoints("10");
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all cursor-pointer"
                      >
                        Thêm câu hỏi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit size={24} />
            <div>
              <h2 className="text-xl font-bold">Cập nhật bài tập</h2>
              <p className="text-sm text-red-100">{homework.assignmentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <Users size={16} />
                <span className="text-xs font-medium uppercase">Học viên</span>
              </div>
              <div className="text-base font-semibold text-gray-900">{homework.student}</div>
              <div className="text-xs text-gray-500">{homework.studentId}</div>
            </div>
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <BookMarked size={16} />
                <span className="text-xs font-medium uppercase">Lớp học</span>
              </div>
              <div className="text-base font-semibold text-gray-900">{homework.className}</div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Nhập tiêu đề bài tập..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả bài tập
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              placeholder="Nhập mô tả chi tiết về bài tập..."
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giờ hết hạn
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Book, Pages, Skills */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sách bài tập
              </label>
              <input
                type="text"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Tên sách..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trang
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Trang..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kỹ năng
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Kỹ năng..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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

  const handleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
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
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý bài tập
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý bài tập đã giao, theo dõi tiến độ nộp bài và gửi nhận xét cho học viên.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
            <Filter size={16} /> Lọc
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={16} />
            Giao bài mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-red-600"></div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-600 truncate">
                Tổng bài nộp
              </div>
              <div className="text-xl font-bold text-gray-900 leading-tight">
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-blue-600"></div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-600 truncate">
                Điểm trung bình
              </div>
              <div className="text-xl font-bold text-gray-900 leading-tight">
                {stats.avgScore || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-emerald-600"></div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm flex-shrink-0">
              <CheckCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-600 truncate">
                Đã chấm
              </div>
              <div className="text-xl font-bold text-gray-900 leading-tight">
                {submissions.filter(s => s.status === "REVIEWED").length}
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-amber-600"></div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex-shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-600 truncate">
                Chờ chấm
              </div>
              <div className="text-xl font-bold text-gray-900 leading-tight">
                {submissions.filter(s => s.status === "PENDING").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600 font-medium">
              Danh sách bài nộp
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm học viên, bài tập..."
                className="h-10 w-72 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-10 rounded-xl border border-red-200 bg-white px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 appearance-none"
              >
                <option value="ALL">Tất cả lớp</option>
                {classes.map((cls, index) => (
                  <option key={`${cls}-${index}`} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách bài nộp
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {filtered.length} bài nộp
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
                <th className="py-3 px-6 text-left">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        // Toggle all selections
                        submissions.forEach(sub => {
                          if (e.target.checked && !selectedItems.includes(sub.id)) {
                            setSelectedItems(prev => [...prev, sub.id]);
                          } else if (!e.target.checked) {
                            setSelectedItems([]);
                          }
                        });
                      }}
                      checked={selectedItems.length > 0 && selectedItems.length === submissions.length}
                      className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                    />
                  </div>
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
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Lớp học
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Buổi học
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Hạn nộp
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Kỹ năng
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Loại nộp
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Mô tả
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-gray-600 font-medium mt-2">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : submissions.length > 0 ? (
                submissions.map((item) => (
                  <SubmissionRow 
                    key={item.id} 
                    item={item} 
                    onDelete={handleDeleteHomework} 
                    onViewDetail={handleViewDetail} 
                    onUpdate={handleUpdateHomework} 
                    isSelected={selectedItems.includes(item.id)} 
                    onSelect={handleSelect} 
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
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
      <div
        className={`grid lg:grid-cols-2 gap-6 transition-all duration-700 delay-300 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
              <TimerReset size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Giao bài tập mới</h3>
              <p className="text-sm text-gray-500">Tạo và lên lịch bài tập</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Tạo bài tập theo lớp, đặt hạn nộp và tự động nhắc nhở qua Zalo nếu học viên chưa nộp trước giờ học.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-amber-200 rounded-xl">
                <div className="text-xs text-gray-500">Đang mở</div>
                <div className="text-lg font-bold text-amber-600">12</div>
                <div className="text-xs text-gray-500">bài tập</div>
              </div>
              <div className="p-3 bg-white border border-amber-200 rounded-xl">
                <div className="text-xs text-gray-500">Sắp hết hạn</div>
                <div className="text-lg font-bold text-amber-600">3</div>
                <div className="text-xs text-gray-500">trong 24h</div>
              </div>
            </div>

            <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 font-medium hover:shadow-lg transition-all cursor-pointer">
              <Calendar size={16} />
              Lên lịch nhắc nhở
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
              <Wand2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Tạo feedback tự động</h3>
              <p className="text-sm text-gray-500">Gợi ý từ AI</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Dùng AI để gợi ý nhận xét chi tiết dựa trên bài làm của học viên, sau đó chỉnh sửa trước khi gửi.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-white border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Đề xuất từ AI</div>
                  <div className="text-sm text-gray-700 mt-1">"Bài viết có cấu trúc tốt, cần chú ý đến ngữ pháp câu phức..."</div>
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

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <CreateAssignmentModal
          isOpen={isCreateModalOpen}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={20} />
                Xác nhận xóa
              </h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700">
                    Bạn có chắc chắn muốn xóa bài tập này không?
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteHomework}
                  disabled={isDeleting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
    </div>
  );
}