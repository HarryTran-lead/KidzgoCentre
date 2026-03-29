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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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
  AlertTriangle,
  Tag,
  Star,
  Database,
  Table,
} from "lucide-react";

import { fetchHomework, mapSubmissionToUi, createHomework, fetchClasses, fetchSessions, deleteHomework, updateHomework, createMultipleChoiceHomework } from "@/lib/api/homeworkService";
import type { HomeworkSubmission, CreateHomeworkPayload, ClassOption, SessionOption, MultipleChoiceQuestion } from "@/types/teacher/homework";
import { ImportFromBankModal } from "./modal/ImportFromBankModal";
import { ImportFromExcelModal } from "./modal/ImportFromExcelModal";

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
  assignmentId?: string;
  submittedAt?: string;
  attachments?: any[];
  content?: string;
  status?: SubmissionStatus;
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
      <td className="py-4 px-6">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
        />
      </td>
      <td className="py-4 px-6">
        <div className="text-sm font-medium text-gray-900">{item.assignmentTitle}</div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600">{item.className || "-"}</div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-900">{item.sessionId || "-"}</div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-700 flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span>{item.dueDate}</span>
        </div>
      </td>
      <td className="py-4 px-6">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {item.skills || "-"}
        </span>
      </td>
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
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">{item.description || "-"}</div>
      </td>
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
  const [submissionType, setSubmissionType] = useState<"FILE" | "IMAGE" | "TEXT" | "LINK" | "MULTIPLE_CHOICE">("FILE");
  const [missionId, setMissionId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [rubric, setRubric] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
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
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("0");
  
  const [showImportBankModal, setShowImportBankModal] = useState(false);
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dùng capture phase để bắt event TRƯỚC khi child modals (createPortal) nhận được
    // stopPropagation ngăn event bubble, nên child modal không bị ảnh hưởng
    const handleClickOutside = (event: MouseEvent) => {
      // Khi child modal đang mở, stopPropagation để ngăn onClose của parent
      // Khi child modal không mở, cho phép đóng parent bình thường
      if (showImportBankModal || showImportExcelModal) {
        event.stopPropagation();
        event.preventDefault();
      } else if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, showImportBankModal, showImportExcelModal]);

  if (!isOpen) return null;

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

  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedClass) {
        setSelectedSession("");
        setSessions([]);
        return;
      }
      setIsLoadingSessions(true);
      try {
        const data = await fetchSessions(selectedClass);
        setSessions(data);
      } catch (error) {
        console.error("Error loading sessions:", error);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessions();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSession) return;
    const session = sessions.find((item) => item.id === selectedSession);
    const sessionDateTime = session?.plannedDateTime || session?.date;
    if (!sessionDateTime) return;
    const parsedDate = new Date(sessionDateTime);
    if (Number.isNaN(parsedDate.getTime())) return;
    if (!dueDate) {
      setDueDate(parsedDate.toISOString().split("T")[0]);
    }
  }, [selectedSession, sessions, dueDate]);

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
  
  const handleImportFromBank = (importedQuestions: any[]) => {
    setQuestions(prev => [...prev, ...importedQuestions]);
  };
  
  const handleImportFromExcel = (importedQuestions: any[]) => {
    setQuestions(prev => [...prev, ...importedQuestions]);
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

    try {
      if (activeTab === "MULTIPLE_CHOICE") {
        const apiQuestions: MultipleChoiceQuestion[] = questions.map(q => {
          const correctIndex = q.options.findIndex(opt => opt.isCorrect);
          return {
            questionText: q.question,
            questionType: "multipleChoice",
            options: q.options.map(opt => opt.text),
            correctAnswer: String(correctIndex),
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
          timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : undefined,
          questions: apiQuestions,
        });

        if (result.ok) {
          onSuccess();
        } else {
          setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
      } else {
        const payload: CreateHomeworkPayload = {
          title,
          description,
          classId: selectedClass,
          sessionId: selectedSession || undefined,
          dueAt: `${dueDate}T${dueTime}:00+07:00`,
          book: book || undefined,
          pages: pages || undefined,
          skills: skills || undefined,
          submissionType: submissionType as "FILE" | "IMAGE" | "TEXT" | "LINK" | undefined,
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

  const isMultipleChoice = activeTab === "MULTIPLE_CHOICE";
  const selectedClassOption = classes.find((item) => item.id === selectedClass);
  const selectedSessionOption = sessions.find((item) => item.id === selectedSession);
  const totalQuestionPoints = questions.reduce((sum, item) => sum + (item.points || 0), 0);
  const dueDateTimeLabel = dueDate ? `${dueDate}${dueTime ? ` ${dueTime}` : ""}` : "Chưa chọn";
  const submissionTypeLabel =
    submissionType === "TEXT"
      ? "Nhập text"
      : submissionType === "IMAGE"
        ? "Nộp ảnh"
        : submissionType === "LINK"
          ? "Nộp link"
        : "Nộp file";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          ref={modalRef}
          className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
        >
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

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users size={16} className="text-red-600" />
                    Lớp học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedSession("");
                    }}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isMultipleChoice ? (
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
                ) : (
                  <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Award size={16} className="text-red-600" />
                      Tổng điểm bài trắc nghiệm
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{totalQuestionPoints || 0}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tự tính từ tổng điểm các câu hỏi, không cần teacher nhập tay.
                    </p>
                  </div>
                )}

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

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 text-amber-600" />
                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Flow giao bài tập ưu tiên cho teacher</p>
                    <p>1. Chọn lớp để tải đúng danh sách buổi học.</p>
                    <p>2. Chọn buổi học nếu muốn gắn bài với một buổi cụ thể.</p>
                    <p>3. Hạn nộp sẽ tự gợi ý theo ngày buổi học nếu chưa nhập trước.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Loại bài</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {isMultipleChoice ? "Multiple choice" : "Bài tập thường"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Lớp học</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedClassOption?.name || "Chưa chọn"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Buổi học</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedSessionOption?.name || "Không gắn buổi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Hạn nộp</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{dueDateTimeLabel}</p>
                </div>
              </div>

              {activeTab === "UPLOAD" ? (
                <>
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

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Upload size={16} className="text-red-600" />
                      Hình thức nộp bài
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        { value: "FILE", label: "Nộp file", hint: "Phù hợp khi học viên cần tải bài lên." },
                        { value: "TEXT", label: "Nhập text", hint: "Phù hợp cho câu trả lời ngắn hoặc tự luận." },
                        { value: "IMAGE", label: "Nộp ảnh", hint: "Phù hợp khi học viên gửi ảnh bài làm hoặc sản phẩm thủ công." },
                        { value: "LINK", label: "Nộp link", hint: "Phù hợp cho Google Docs, Drive hoặc sản phẩm online." },
                      ].map((option) => {
                        const isSelected = submissionType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSubmissionType(option.value as "FILE" | "IMAGE" | "TEXT" | "LINK")}
                            className={clsx(
                              "rounded-2xl border p-4 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-red-300 bg-red-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                            )}
                          >
                            <p className={clsx("text-sm font-semibold", isSelected ? "text-red-700" : "text-gray-900")}>
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">{option.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">Teacher đang chọn: {submissionTypeLabel}.</p>
                  </div>

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

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Hướng dẫn chấm điểm</p>
                      <p className="text-xs text-gray-500">
                        Chỉ nhập khi teacher muốn chuẩn hóa cách chấm hoặc lưu đáp án mẫu.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Paperclip size={16} className="text-red-600" />
                      Tệp đính kèm
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-300 transition-colors cursor-pointer"
                      onClick={() => document.getElementById("file-upload-input")?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          setAttachments((prev) => [...prev, ...files]);
                        }
                      }}
                    >
                      <input
                        id="file-upload-input"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.mp3,.zip,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            setAttachments((prev) => [...prev, ...files]);
                          }
                          e.target.value = "";
                        }}
                      />
                      <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Kéo thả file vào đây hoặc click để chọn</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, MP3, ZIP, PNG, JPG (tối đa 50MB)</p>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Paperclip size={16} className="text-red-600" />
                        Tệp đã chọn ({attachments.length})
                      </label>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText size={18} className="text-red-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAttachments((prev) => prev.filter((_, i) => i !== index));
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-red-700">
                          {questions.length} câu hỏi
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-gray-700">
                          {totalQuestionPoints || 0} điểm
                        </span>
                        <span className="text-gray-600">
                          Teacher chỉ cần thêm câu hỏi, hệ thống tự dùng tổng điểm này cho bài trắc nghiệm.
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowImportBankModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                        >
                          <Database size={16} />
                          Ngân hàng câu hỏi
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowImportExcelModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
                        >
                          <Table size={16} />
                          Import Excel
                        </button>
                      </div>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Clock size={16} className="text-red-600" />
                      Thời gian làm bài (phút)
                    </label>
                    <input
                      type="number"
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                      min="0"
                      placeholder="0 - không giới hạn thời gian"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Đặt thời gian làm bài cho bài trắc nghiệm. Để trống hoặc 0 để không giới hạn thời gian.
                    </p>
                  </div>

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

              <div className="rounded-2xl border border-gray-200 bg-gray-50/80">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Thiết lập nâng cao</p>
                      <p className="text-xs text-gray-500">
                        Mission chỉ dùng khi backend đã cấu hình liên kết homework với hệ thống nhiệm vụ.
                      </p>
                    </div>
                  </div>
                  {showAdvancedSettings ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </button>

                {showAdvancedSettings && (
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Tag size={16} className="text-red-600" />
                        Liên kết nhiệm vụ (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={missionId}
                        onChange={(e) => setMissionId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                        placeholder="Nhập missionId nếu backend yêu cầu"
                      />
                      <p className="text-xs text-gray-500">
                        Để trống trong flow giao bài tập thông thường. Trường này không bắt buộc để tạo homework.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

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
                    {isMultipleChoice ? "Tạo bài trắc nghiệm" : "Giao bài tập"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ImportFromBankModal
        isOpen={showImportBankModal}
        onClose={() => setShowImportBankModal(false)}
        onImport={handleImportFromBank}
      />
      
      <ImportFromExcelModal
        isOpen={showImportExcelModal}
        onClose={() => setShowImportExcelModal(false)}
        onImport={handleImportFromExcel}
      />
    </>
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
  const parseDueDate = (dueDateStr: string) => {
    if (!dueDateStr) return { date: "", time: "23:59" };
    try {
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
  
  const itemsPerPage = 10;

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

      if (result.ok && result.data) {
        const mappedSubmissions = result.data.data.map((item: HomeworkSubmission) => mapSubmissionToUi(item));
        setSubmissions(mappedSubmissions);
        setMeta(result.data.meta || { totalItems: 0, totalPages: 0, pageNumber: 1, pageSize: 10 });
      } else {
        console.error("Failed to fetch homework");
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error loading homework:", error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, itemsPerPage]);

  const handleDeleteHomework = (id: string) => {
    setHomeworkToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleViewDetail = (item: Submission) => {
    const homeworkId = item.assignmentId || item.id;
    router.push(`/vi/portal/teacher/assignments/${homeworkId}`);
  };

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

  const handleUpdateHomework = (item: Submission) => {
    setHomeworkToUpdate(item);
    setUpdateModalOpen(true);
  };

  useEffect(() => {
    loadHomework(1);
    setIsPageLoaded(true);
  }, []);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, selectedClass]);

  const totalPages = Math.ceil(meta.totalItems / itemsPerPage);

  const stats = useMemo(() => {
    const total = submissions.length;
    const avgScore = Math.round(
      submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) /
      (submissions.filter(s => s.score).length || 1) * 10
    ) / 10;

    return { total, avgScore };
  }, [submissions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
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

      <div
        className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
                <th className="py-3 px-6 text-left">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
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
