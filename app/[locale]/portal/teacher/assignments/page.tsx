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
  RefreshCw,
} from "lucide-react";

import {
  fetchHomework,
  mapSubmissionToUi,
  createHomework,
  fetchClasses,
  fetchSessions,
  deleteHomework,
  updateHomework,
  createMultipleChoiceHomework,
  fetchHomeworkDetail,
} from "@/lib/api/homeworkService";
import { get } from "@/lib/axios";
import { uploadFile, isUploadSuccess } from "@/lib/api/fileService";
import {
  getActiveProgramsForDropdown,
  getAllProgramsForDropdown,
} from "@/lib/api/programService";
import { dateOnlyVN } from "@/lib/datetime";
import { toast } from "@/hooks/use-toast";
import type {
  HomeworkSubmission,
  CreateHomeworkPayload,
  ClassOption,
  SessionOption,
  MultipleChoiceQuestion,
} from "@/types/teacher/homework";
import type { AiGeneratedQuestionDraft } from "@/app/api/admin/question-bank";
import AiCreatorModal from "@/components/question-bank/AiCreatorModal";
import { ImportFromBankModal } from "./modal/ImportFromBankModal";
import { ImportFromExcelModal } from "./modal/ImportFromExcelModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED" | "OVERDUE";

type Submission = {
  id: string;
  student: string;
  studentId: string;
  classId?: string;
  className: string;
  file: string;
  fileSize: string;
  fileType: string;
  assignmentTitle: string;
  dueDate: string;
  startDate?: string;
  description?: string;
  note?: string;
  score?: number;
  color: string;
  assignmentId?: string;
  submittedAt?: string;
  attachments?: any[];
  attachmentUrl?: string;
  content?: string;
  status?: SubmissionStatus;
  session?: string;
  sessionId?: string;
  submissionType?: string;
  questions?: any[];
};

type BuilderQuestionOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type BuilderQuestion = {
  id: string;
  question: string;
  options: BuilderQuestionOption[];
  explanation?: string;
  points: number;
};

function createEmptyBuilderOptions(): BuilderQuestionOption[] {
  return [
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
  ];
}

function normalizeCorrectOptionIndex(
  options: string[],
  correctAnswer?: string | null,
) {
  const normalizedAnswer = String(correctAnswer ?? "").trim();

  if (/^\d+$/.test(normalizedAnswer)) {
    const numericIndex = Number(normalizedAnswer);
    if (numericIndex >= 0 && numericIndex < options.length) {
      return numericIndex;
    }

    if (numericIndex > 0 && numericIndex - 1 < options.length) {
      return numericIndex - 1;
    }
  }

  const normalizedLabel = normalizedAnswer
    .replace(/[\.\)]/g, "")
    .trim()
    .toUpperCase();
  if (/^[A-Z]$/.test(normalizedLabel)) {
    const alphaIndex = normalizedLabel.charCodeAt(0) - 65;
    if (alphaIndex >= 0 && alphaIndex < options.length) {
      return alphaIndex;
    }
  }

  const matchedIndex = options.findIndex(
    (option) => option.trim().toLowerCase() === normalizedAnswer.toLowerCase(),
  );

  return matchedIndex >= 0 ? matchedIndex : 0;
}

function mapAiDraftToBuilderQuestion(
  draft: AiGeneratedQuestionDraft,
): BuilderQuestion | null {
  if (draft.questionType !== "MultipleChoice") {
    return null;
  }

  const questionText = String(draft.questionText ?? "").trim();
  const options = Array.isArray(draft.options)
    ? draft.options.map((option) => String(option ?? "").trim()).filter(Boolean)
    : [];

  if (!questionText || options.length < 2) {
    return null;
  }

  const correctIndex = normalizeCorrectOptionIndex(
    options,
    draft.correctAnswer,
  );
  const points = Number(draft.points);

  return {
    id: crypto.randomUUID(),
    question: questionText,
    options: options.map((option, index) => ({
      id: crypto.randomUUID(),
      text: option,
      isCorrect: index === correctIndex,
    })),
    explanation: String(draft.explanation ?? "").trim() || undefined,
    points: Number.isFinite(points) && points > 0 ? points : 1,
  };
}

const STATUS_CONFIG: Record<
  SubmissionStatus,
  {
    text: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  PENDING: {
    text: "Chờ chấm",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
  },
  SUBMITTED: {
    text: "Đã gửi",
    icon: UploadCloud,
    color: "text-sky-600",
    bgColor: "bg-gradient-to-r from-sky-50 to-blue-50",
    borderColor: "border-sky-200",
  },
  REVIEWED: {
    text: "Đã phản hồi",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
  },
  OVERDUE: {
    text: "Quá hạn",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-gradient-to-r from-red-50 to-red-100",
    borderColor: "border-red-200",
  },
};

// Helper function to translate submission types to Vietnamese
const getSubmissionTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    "Quiz": "Trắc nghiệm",
    "FILE": "Nộp file",
    "TEXT": "Nhập văn bản",
    "IMAGE": "Nộp ảnh",
    "LINK": "Nộp link",
    "MULTIPLE_CHOICE": "Trắc nghiệm",
  };
  return typeMap[type] || "Nộp file";
};

// Helper function to get color for submission type
const getSubmissionTypeColor = (type: string): string => {
  if (!type) return "bg-gray-100 text-gray-600 border border-gray-600";
  
  const normalizedType = String(type).toUpperCase().trim();
  
  if (normalizedType === "QUIZ" || normalizedType === "MULTIPLE_CHOICE") {
    return "bg-red-100 text-red-600 border border-red-600";
  } else if (normalizedType === "FILE") {
    return "bg-blue-100 text-blue-600 border border-blue-600";
  } else if (normalizedType === "TEXT") {
    return "bg-green-100 text-green-600 border border-green-600";
  } else if (normalizedType === "IMAGE") {
    return "bg-purple-100 text-purple-600 border border-purple-600";
  } else if (normalizedType === "LINK") {
    return "bg-orange-100 text-orange-600 border border-orange-600";
  }
  
  return "bg-gray-100 text-gray-600 border border-gray-600";
};

function SortableHeader<T extends string>({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
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
        <span aria-hidden className="text-gray-300">
          ↕
        </span>
      )}
    </button>
  );
}

function StudentAvatar({ name = "", color }: { name?: string; color: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = STATUS_CONFIG[status] ?? {
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
    PDF: "bg-red-100 text-red-700",
    DOCX: "bg-blue-100 text-blue-700",
    MP3: "bg-emerald-100 text-emerald-700",
    ZIP: "bg-amber-100 text-amber-700",
    PPT: "bg-orange-100 text-orange-700",
    XLSX: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${typeColors[type] || "bg-gray-100 text-gray-700"}`}
    >
      {type}
    </span>
  );
}

function SubmissionRow({
  item,
  onDelete,
  onViewDetail,
  onUpdate,
  onViewAssignmentDetails,
}: {
  item: Submission;
  onDelete: (id: string) => void;
  onViewDetail: (item: Submission) => void;
  onUpdate: (item: Submission) => void;
  onViewAssignmentDetails: (item: Submission) => void;
}) {
  const normalizedSubmissionType = String(item.submissionType ?? "").trim().toUpperCase();

  const submissionTypeConfig: Record<string, { label: string; className: string }> = {
    MULTIPLE_CHOICE: {
      label: "Trắc nghiệm",
      className: "bg-violet-50 text-violet-700 border-violet-200",
    },
    QUIZ: {
      label: "Quiz",
      className: "bg-violet-50 text-violet-700 border-violet-200",
    },
    FILE: {
      label: "Nộp file",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    TEXT: {
      label: "Nhập text",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    IMAGE: {
      label: "Nộp ảnh",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    LINK: {
      label: "Nộp link",
      className: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
  };

  const typeView =
    submissionTypeConfig[normalizedSubmissionType] ?? {
      label: item.submissionType || "Nộp file",
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };

  return (
    <tr className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 border-b border-red-100">
      <td className="py-4 px-6">
        <div className="text-sm font-medium text-gray-900">
          {item.assignmentTitle}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600">{item.className || "-"}</div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-700 flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span>{item.dueDate}</span>
        </div>
      </td>
      <td className="py-4 px-6">
        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold ${getSubmissionTypeColor(item.submissionType || "")}`}
        >
          {getSubmissionTypeLabel(item.submissionType || "")}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">
          {item.description || "-"}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetail(item)}
            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
            title="Xem danh sách nộp bài"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onViewAssignmentDetails(item)}
            className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors text-gray-400 hover:text-purple-600 cursor-pointer"
            title="Xem chi tiết bài tập"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => onUpdate(item)}
            className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
            title="Cập nhật bài tập"
          >
            <Edit size={14} />
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
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"UPLOAD" | "MULTIPLE_CHOICE">(
    "UPLOAD",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [showSessionSelect, setShowSessionSelect] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [maxScore, setMaxScore] = useState("10");
  const [rewardStars, setRewardStars] = useState("0");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [book, setBook] = useState("");
  const [pages, setPages] = useState("");
  const [submissionType, setSubmissionType] = useState<
    "FILE" | "IMAGE" | "TEXT" | "LINK" | "MULTIPLE_CHOICE"
  >("FILE");
  const [instructions, setInstructions] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [rubric, setRubric] = useState("");
  const [showRubricSection, setShowRubricSection] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState<BuilderQuestionOption[]>(
    createEmptyBuilderOptions(),
  );
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [currentPoints, setCurrentPoints] = useState("10");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("0");

  const [showImportBankModal, setShowImportBankModal] = useState(false);
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const [showAiCreatorModal, setShowAiCreatorModal] = useState(false);
  const [aiCreatorCourseOptions, setAiCreatorCourseOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingAiCreatorCourses, setIsLoadingAiCreatorCourses] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const classSelectRef = useRef<HTMLDivElement>(null);
  const hasChildModalOpen =
    showImportBankModal || showImportExcelModal || showAiCreatorModal;

  useEffect(() => {
    // Dùng capture phase để bắt event TRƯỚC khi child modals (createPortal) nhận được
    // stopPropagation ngăn event bubble, nên child modal không bị ảnh hưởng
    const handleClickOutside = (event: MouseEvent) => {
      // Khi child modal đang mở, stopPropagation để ngăn onClose của parent
      // Khi child modal không mở, cho phép đóng parent bình thường
      if (hasChildModalOpen) {
        return;
      }

      const target = event.target as HTMLElement;

      // Check if click is from Select dropdown (trigger or content)
      // SelectContent được render vào document.body nên cần check riêng
      if (target.closest("[data-state]") || target.closest('[role="option"]')) {
        return;
      }

      if (modalRef.current && !modalRef.current.contains(target)) {
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
  }, [hasChildModalOpen, isOpen, onClose]);

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
      setDueDate(dateOnlyVN(parsedDate));
    }
  }, [selectedSession, sessions, dueDate]);

  const addOption = () => {
    setCurrentOptions([
      ...currentOptions,
      { id: crypto.randomUUID(), text: "", isCorrect: false },
    ]);
  };

  const removeOption = (id: string) => {
    if (currentOptions.length > 2) {
      setCurrentOptions(currentOptions.filter((opt) => opt.id !== id));
    }
  };

  const updateOptionText = (id: string, text: string) => {
    setCurrentOptions(
      currentOptions.map((opt) => (opt.id === id ? { ...opt, text } : opt)),
    );
  };

  const toggleCorrectOption = (id: string) => {
    setCurrentOptions(
      currentOptions.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      })),
    );
  };

  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      setError("Vui lòng nhập câu hỏi");
      return;
    }
    if (currentOptions.some((opt) => !opt.text.trim())) {
      setError("Vui lòng nhập đầy đủ nội dung các lựa chọn");
      return;
    }
    if (!currentOptions.some((opt) => opt.isCorrect)) {
      setError("Vui lòng chọn đáp án đúng");
      return;
    }

    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: currentQuestion,
        options: [...currentOptions],
        explanation: currentExplanation || undefined,
        points: parseInt(currentPoints) || 10,
      },
    ]);

    setCurrentQuestion("");
    setCurrentOptions(createEmptyBuilderOptions());
    setCurrentExplanation("");
    setCurrentPoints("10");
    setShowQuestionForm(false);
    setError("");
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const loadAiCreatorCourses = async () => {
    if (aiCreatorCourseOptions.length > 0 || isLoadingAiCreatorCourses) {
      return;
    }

    setIsLoadingAiCreatorCourses(true);
    try {
      const activePrograms = await getActiveProgramsForDropdown();
      const fallbackPrograms =
        activePrograms.length > 0
          ? activePrograms
          : (await getAllProgramsForDropdown()).filter(
              (program) => program.isActive !== false,
            );

      setAiCreatorCourseOptions(
        fallbackPrograms.map((program) => ({
          id: program.id,
          name: program.name || program.code || program.id,
        })),
      );
    } catch (loadError) {
      console.error("Error loading AI creator courses:", loadError);
      setAiCreatorCourseOptions([]);
    } finally {
      setIsLoadingAiCreatorCourses(false);
    }
  };

  const handleOpenAiCreatorModal = () => {
    setShowAiCreatorModal(true);
    void loadAiCreatorCourses();
  };

  const handleUseAiDrafts = (drafts: AiGeneratedQuestionDraft[]) => {
    const mappedQuestions = drafts
      .map(mapAiDraftToBuilderQuestion)
      .filter((item): item is BuilderQuestion => Boolean(item));

    if (mappedQuestions.length === 0) {
      throw new Error(
        "AI chưa tạo được câu hỏi trắc nghiệm hợp lệ để thêm vào bài tập.",
      );
    }

    setQuestions((prev) => [...prev, ...mappedQuestions]);
    setError("");
    return mappedQuestions.length;
  };

  const handleImportFromBank = (importedQuestions: BuilderQuestion[]) => {
    setQuestions((prev) => [...prev, ...importedQuestions]);
  };

  const handleImportFromExcel = (importedQuestions: BuilderQuestion[]) => {
    setQuestions((prev) => [...prev, ...importedQuestions]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tiêu đề bài tập",
        variant: "destructive",
        duration: 3000,
      });
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!selectedClass) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn lớp học",
        variant: "destructive",
        duration: 3000,
      });
      classSelectRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!dueDate) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngày hết hạn",
        variant: "destructive",
        duration: 3000,
      });
      dueDateRef.current?.focus();
      dueDateRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (activeTab === "MULTIPLE_CHOICE" && questions.length === 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng thêm ít nhất 1 câu hỏi",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Auto-set startDate to today if not provided
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];

    try {
      if (activeTab === "MULTIPLE_CHOICE") {
        const apiQuestions: MultipleChoiceQuestion[] = questions.map((q) => {
          const correctIndex = q.options.findIndex((opt) => opt.isCorrect);
          return {
            questionText: q.question,
            questionType: "multipleChoice",
            options: q.options.map((opt) => opt.text),
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
          startAt: `${finalStartDate}T${startTime}:00+07:00`,
          dueAt: `${dueDate}T${dueTime}:00+07:00`,
          rewardStars: rewardStars ? parseInt(rewardStars) : undefined,
          instructions: instructions || undefined,
          timeLimitMinutes: timeLimitMinutes
            ? parseInt(timeLimitMinutes)
            : undefined,
          maxAttempts: maxAttempts ? parseInt(maxAttempts) : undefined,
          questions: apiQuestions,
        });

        if (result.ok) {
          toast({
            title: "Thành công",
            description:
              "Bài tập trắc nghiệm đã được tạo và giao cho học viên.",
            variant: "success",
            duration: 5000,
          });
          onSuccess();
        } else {
          setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
          toast({
            title: "Lỗi",
            description: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        const uploadedAttachmentUrls: string[] = [];

        for (const attachment of attachments) {
          const uploadResult = await uploadFile(attachment, "homework");
          if (!isUploadSuccess(uploadResult) || !uploadResult.url) {
            setError(
              !isUploadSuccess(uploadResult)
                ? uploadResult.detail ||
                    uploadResult.error ||
                    uploadResult.title ||
                    `KhÃ´ng thá»ƒ táº£i file ${attachment.name}`
                : `KhÃ´ng thá»ƒ táº£i file ${attachment.name}`,
            );
            return;
          }

          uploadedAttachmentUrls.push(uploadResult.url);
        }

        const payload: CreateHomeworkPayload = {
          title,
          description,
          classId: selectedClass,
          sessionId: selectedSession || undefined,
          startDate: `${finalStartDate}T${startTime}:00+07:00`,
          dueAt: `${dueDate}T${dueTime}:00+07:00`,
          book: book || undefined,
          pages: pages || undefined,
          submissionType: submissionType as
            | "FILE"
            | "IMAGE"
            | "TEXT"
            | "LINK"
            | undefined,
          maxScore: maxScore ? parseInt(maxScore) : undefined,
          rewardStars: rewardStars ? parseInt(rewardStars) : undefined,
          instructions: instructions || undefined,
          expectedAnswer: undefined,
          rubric: rubric || undefined,
          maxAttempts: maxAttempts ? parseInt(maxAttempts) : undefined,
          attachment: uploadedAttachmentUrls[0] || undefined,
          attachmentUrls:
            uploadedAttachmentUrls.length > 0
              ? uploadedAttachmentUrls
              : undefined,
          attachments:
            uploadedAttachmentUrls.length > 0
              ? uploadedAttachmentUrls
              : undefined,
        };

        const result = await createHomework(payload);

        if (result.ok) {
          toast({
            title: "Thành công",
            description: "Bài tập đã được tạo và giao cho học viên.",
            variant: "success",
            duration: 5000,
          });
          onSuccess();
        } else {
          setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
          toast({
            title: "Lỗi",
            description: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } catch {
      const errorMessage = "Có lỗi xảy ra. Vui lòng thử lại.";
      setError(errorMessage);
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMultipleChoice = activeTab === "MULTIPLE_CHOICE";
  const selectedClassOption = classes.find((item) => item.id === selectedClass);
  const selectedSessionOption = sessions.find(
    (item) => item.id === selectedSession,
  );
  const totalQuestionPoints = questions.reduce(
    (sum, item) => sum + (item.points || 0),
    0,
  );
  const dueDateTimeLabel = dueDate
    ? `${dueDate}${dueTime ? ` ${dueTime}` : ""}`
    : "Chưa chọn";
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
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <div className="flex items-center gap-2">
                  <Upload size={18} />
                  Tải file đề
                </div>
              </button>
              <button
                onClick={() => setActiveTab("MULTIPLE_CHOICE")}
                className={clsx(
                  "py-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer",
                  activeTab === "MULTIPLE_CHOICE"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} />
                  Trắc nghiệm
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
                  ref={titleRef}
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
                  <div
                    onClick={(e) => e.stopPropagation()}
                    ref={classSelectRef}
                  >
                    <Select
                      value={selectedClass}
                      onValueChange={(val) => {
                        setSelectedClass(val);
                        setSelectedSession("");
                      }}
                      disabled={isLoadingClasses}
                    >
                      <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300">
                        <SelectValue
                          placeholder={
                            isLoadingClasses ? "Đang tải..." : "Chọn lớp học..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!isMultipleChoice && (
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
                )}
                {isMultipleChoice && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Clock size={16} className="text-red-600" />
                      Thời gian làm bài (phút) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                      min="0"
                      placeholder="0 - không giới hạn"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showSessionSelect}
                      onChange={(e) => {
                        setShowSessionSelect(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedSession("");
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 cursor-pointer"
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                      <Calendar size={16} className="text-red-600" />
                      Gắn với buổi học (tùy chọn)
                    </span>
                  </label>
                  {showSessionSelect && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={selectedSession}
                        onValueChange={(val) => setSelectedSession(val)}
                        disabled={!selectedClass || isLoadingSessions}
                      >
                        <SelectTrigger className="w-full border-gray-200 rounded-xl">
                          <SelectValue
                            placeholder={
                              !selectedClass
                                ? "Chọn lớp trước"
                                : isLoadingSessions
                                  ? "Đang tải..."
                                  : "Chọn buổi học..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.name}{" "}
                              {session.date ? `(${session.date})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <RefreshCw size={16} className="text-red-600" />
                    Số lần làm bài tối đa
                  </label>
                  <input
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    min="1"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar size={16} className="text-red-600" />
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock size={16} className="text-red-600" />
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
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
                    ref={dueDateRef}
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

              {activeTab === "UPLOAD" && (
                <>
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
                </>
              )}

              {isMultipleChoice && (
                <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Award size={16} className="text-red-600" />
                    Tổng điểm bài trắc nghiệm
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {totalQuestionPoints || 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Tự tính từ tổng điểm các câu hỏi, không cần teacher nhập
                    tay.
                  </p>
                </div>
              )}

              {/* <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 text-amber-600" />
                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Flow giao bài tập ưu tiên cho teacher</p>
                    <p>1. Chọn lớp để tải đúng danh sách buổi học.</p>
                    <p>2. Chọn buổi học nếu muốn gắn bài với một buổi cụ thể.</p>
                    <p>3. Hạn nộp sẽ tự gợi ý theo ngày buổi học nếu chưa nhập trước.</p>
                  </div>
                </div>
              </div> */}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Loại bài
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {isMultipleChoice ? "Trắc nghiệm" : "Bài tập thường"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Lớp học
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedClassOption?.name || "Chưa chọn"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Buổi học
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedSessionOption?.name || "Không gắn buổi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Hạn nộp
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {dueDateTimeLabel}
                  </p>
                </div>
              </div>

              {activeTab === "UPLOAD" ? (
                <>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Upload size={16} className="text-red-600" />
                      Hình thức nộp bài
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          value: "FILE",
                          label: "Nộp file",
                          hint: "Phù hợp khi học viên cần tải bài lên.",
                        },
                        {
                          value: "TEXT",
                          label: "Nhập text",
                          hint: "Phù hợp cho câu trả lời ngắn hoặc tự luận.",
                        },
                        {
                          value: "IMAGE",
                          label: "Nộp ảnh",
                          hint: "Phù hợp khi học viên gửi ảnh bài làm hoặc sản phẩm thủ công.",
                        },
                        {
                          value: "LINK",
                          label: "Nộp link",
                          hint: "Phù hợp cho Google Docs, Drive hoặc sản phẩm online.",
                        },
                      ].map((option) => {
                        const isSelected = submissionType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setSubmissionType(
                                option.value as
                                  | "FILE"
                                  | "IMAGE"
                                  | "TEXT"
                                  | "LINK",
                              )
                            }
                            className={clsx(
                              "rounded-2xl border p-4 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-red-300 bg-red-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40",
                            )}
                          >
                            <p
                              className={clsx(
                                "text-sm font-semibold",
                                isSelected ? "text-red-700" : "text-gray-900",
                              )}
                            >
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {option.hint}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      Teacher đang chọn: {submissionTypeLabel}.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70">
                    <button
                      type="button"
                      onClick={() => setShowRubricSection(!showRubricSection)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Hướng dẫn chấm điểm
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Nhập tiêu chí và cách chấm điểm cho bài tập
                        </p>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-gray-600 transition-transform flex-shrink-0 ${
                          showRubricSection ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showRubricSection && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-3">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <BarChart3 size={16} className="text-red-600" />
                            Tiêu chí chấm điểm
                          </label>
                          <textarea
                            value={rubric}
                            onChange={(e) => setRubric(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                            placeholder="Nhập tiêu chí và cách chấm điểm..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Paperclip size={16} className="text-red-600" />
                      Tệp đính kèm
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-300 transition-colors cursor-pointer"
                      onClick={() =>
                        document.getElementById("file-upload-input")?.click()
                      }
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
                      <UploadCloud
                        size={32}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        Kéo thả file vào đây hoặc click để chọn
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOCX, MP3, ZIP, PNG, JPG (tối đa 50MB)
                      </p>
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
                              <FileText
                                size={18}
                                className="text-red-500 flex-shrink-0"
                              />
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
                                setAttachments((prev) =>
                                  prev.filter((_, i) => i !== index),
                                );
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
                          Teacher chỉ cần thêm câu hỏi, hệ thống tự dùng tổng
                          điểm này cho bài trắc nghiệm.
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleOpenAiCreatorModal}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 cursor-pointer"
                        >
                          <Sparkles size={16} />
                          Tạo câu hỏi bằng AI
                        </button>
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
                          <div
                            key={q.id}
                            className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {q.question}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 ml-8">
                                  {q.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className={clsx(
                                        "px-3 py-2 rounded-lg text-sm border",
                                        opt.isCorrect
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                          : "bg-white border-gray-200 text-gray-600",
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        {opt.isCorrect && (
                                          <CheckCircle
                                            size={14}
                                            className="text-emerald-600"
                                          />
                                        )}
                                        <span
                                          className={
                                            opt.isCorrect ? "font-medium" : ""
                                          }
                                        >
                                          {opt.text}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <div className="mt-2 ml-8 text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-200">
                                    <span className="font-medium">
                                      Giải thích:
                                    </span>{" "}
                                    {q.explanation}
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
                        <h4 className="font-medium text-gray-900">
                          Thêm câu hỏi mới
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuestionForm(false);
                            setCurrentQuestion("");
                            setCurrentOptions(createEmptyBuilderOptions());
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
                        <label className="text-sm font-medium text-gray-700">
                          Câu hỏi
                        </label>
                        <textarea
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                          placeholder="Nhập nội dung câu hỏi..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Các lựa chọn
                        </label>
                        {currentOptions.map((opt, index) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) =>
                                  updateOptionText(opt.id, e.target.value)
                                }
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
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200",
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
                        <label className="text-sm font-medium text-gray-700">
                          Giải thích (không bắt buộc)
                        </label>
                        <textarea
                          value={currentExplanation}
                          onChange={(e) =>
                            setCurrentExplanation(e.target.value)
                          }
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                          placeholder="Giải thích đáp án đúng..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Điểm
                        </label>
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
                            setCurrentOptions(createEmptyBuilderOptions());
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
        selectedClassId={selectedClass}
        classesData={classes}
      />

      <AiCreatorModal
        isOpen={showAiCreatorModal}
        onClose={() => setShowAiCreatorModal(false)}
        courseOptions={aiCreatorCourseOptions}
        loadingCourses={isLoadingAiCreatorCourses}
        onUseDrafts={handleUseAiDrafts}
        useDraftsLabel="Dùng cho bài tập này"
        allowedQuestionTypes={["MultipleChoice"]}
      />

      <ImportFromExcelModal
        isOpen={showImportExcelModal}
        onClose={() => setShowImportExcelModal(false)}
        onImport={handleImportFromExcel}
      />
    </>
  );
}

// Assignment Details Modal Component
function AssignmentDetailsModal({
  assignmentId,
  onClose,
}: {
  assignmentId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchHomeworkDetail(assignmentId);
        if (result.ok && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Không tìm thấy bài tập");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  if (!assignmentId) return null;
  
  if (isLoading) return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  const homework = data;
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-red-700 text-white px-8 py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chi tiết bài tập</h2>
              <p className="text-sm text-red-100 mt-1">{homework.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Thông tin cơ bản - Tiêu đề riêng */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
              <h3 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-red-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Lớp học</span>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {homework.classTitle || homework.classCode || "N/A"}
                </div>
                {homework.classCode && (
                  <div className="text-xs text-gray-500 mt-2">{homework.classCode}</div>
                )}
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-red-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Loại nộp</span>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold ${getSubmissionTypeColor(homework.submissionType || "")}`}
                >
                  {getSubmissionTypeLabel(homework.submissionType || "")}
                </span>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-red-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Ngày bắt đầu</span>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {homework.startDate ? formatDateTime(homework.startDate) : "Không xác định"}
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-red-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Ngày hết hạn</span>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {formatDateTime(homework.dueAt)}
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} className="text-red-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Điểm tối đa</span>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {homework.maxScore || "N/A"}
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw size={16} className="text-red-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Số lần làm</span>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {homework.maxAttempts || "Không giới hạn"}
                </div>
              </div>
            </div>
          </div>

          {/* Tiêu đề bài tập */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
              <h3 className="text-base font-semibold text-gray-900">Tiêu đề bài tập</h3>
            </div>
            <div className="px-5 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-900 font-medium text-sm">
              {homework.title}
            </div>
          </div>

          {/* Mô tả */}
          {homework.description && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Mô tả bài tập</h3>
              </div>
              <div className="px-5 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {homework.description}
              </div>
            </div>
          )}

          {/* Hướng dẫn */}
          {homework.instructions && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Hướng dẫn làm bài</h3>
              </div>
              <div className="px-5 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {homework.instructions}
              </div>
            </div>
          )}

          {/* Đáp án mong đợi */}
          {homework.expectedAnswer && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Đáp án mong đợi</h3>
              </div>
              <div className="px-5 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {homework.expectedAnswer}
              </div>
            </div>
          )}

          {/* Rubric */}
          {homework.rubric && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Tiêu chí chấm điểm</h3>
              </div>
              <div className="px-5 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {homework.rubric}
              </div>
            </div>
          )}

          {/* Tệp đính kèm */}
          {homework.attachmentUrl && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Tệp đính kèm</h3>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:shadow-md transition-all">
                <Paperclip size={18} className="text-red-600 flex-shrink-0" />
                <a
                  href={homework.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:text-red-700 font-medium truncate flex-1 underline"
                >
                  {homework.attachmentUrl.split("/").pop()}
                </a>
                <Download size={16} className="text-gray-400 flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Danh sách câu hỏi */}
          {homework.questions && homework.questions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Danh sách câu hỏi</h3>
                <span className="ml-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                  {homework.questions.length} câu
                </span>
              </div>
              <div className="space-y-4">
                {homework.questions.map((question: any, index: number) => (
                  <div
                    key={question.id}
                    className="p-5 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{question.questionText}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                            {question.points} điểm
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Các tùy chọn */}
                    {question.options && question.options.length > 0 && (
                      <div className="ml-10 space-y-2 mb-4">
                        {question.options.map((option: string, optionIndex: number) => (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded-lg text-sm border transition-colors ${
                              option === question.correctAnswer
                                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-medium"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                            {option === question.correctAnswer && (
                              <span className="ml-2 text-xs font-bold text-emerald-600">Đáp án đúng</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Giải thích */}
                    {question.explanation && (
                      <div className="ml-10 p-3 rounded-lg bg-white border border-red-200">
                        <div className="text-xs font-bold text-red-700 mb-1.5">Giải thích</div>
                        <div className="text-xs text-gray-700 leading-relaxed">{question.explanation}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-8 py-4 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Update Assignment Modal Component
function UpdateAssignmentModal({
  homework,
  onClose,
  onSuccess,
}: {
  homework: Submission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const parseISODate = (isoStr: string | undefined) => {
    if (!isoStr) return { date: "", time: "00:00" };
    try {
      const dateObj = new Date(isoStr);
      if (Number.isNaN(dateObj.getTime())) return { date: "", time: "00:00" };
      return {
        date: dateOnlyVN(dateObj),
        time: `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`,
      };
    } catch {
      return { date: "", time: "00:00" };
    }
  };

  const [title, setTitle] = useState(homework.assignmentTitle || "");
  const [description, setDescription] = useState(homework.description || "");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [submissionType, setSubmissionType] = useState(homework.submissionType || "");
  const [attachmentUrl, setAttachmentUrl] = useState(homework.attachmentUrl || "");
  const [questions, setQuestions] = useState<any[]>(homework.questions || []);
  const [book, setBook] = useState("");
  const [pages, setPages] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Question form state for update modal
  const [showQuestionFormUpdate, setShowQuestionFormUpdate] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState<BuilderQuestionOption[]>(
    createEmptyBuilderOptions(),
  );
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [currentPoints, setCurrentPoints] = useState("10");
  const [showImportBankModal, setShowImportBankModal] = useState(false);
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const updateTitleRef = useRef<HTMLInputElement>(null);
  const updateDueDateRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load full homework details to get raw ISO dates from API
  useEffect(() => {
    const loadFullDetails = async () => {
      const homeworkId = homework.assignmentId || homework.id;
      if (!homeworkId) return;

      setIsLoadingDetails(true);
      try {
        const result = await fetchHomeworkDetail(homeworkId);
        if (result.ok && result.data) {
          const fullData = result.data as any;
          console.log("Full homework data:", fullData);
          console.log("Submission Type:", fullData.submissionType || fullData.type);
          console.log("Attachments:", fullData.attachments);
          
          // Parse dueAt (ISO format from API)
          if (fullData.dueAt) {
            const dueParsed = parseISODate(fullData.dueAt);
            setDueDate(dueParsed.date);
            setDueTime(dueParsed.time);
          }
          
          // Parse startDate (ISO format from API)
          if (fullData.startDate) {
            const startParsed = parseISODate(fullData.startDate);
            setStartDate(startParsed.date);
            setStartTime(startParsed.time);
          }
          
          // Update title and description from full data if not present
          if (fullData.title) setTitle(fullData.title);
          if (fullData.description) setDescription(fullData.description);
          
          // Set submissionType from full data
          if (fullData.submissionType) {
            setSubmissionType(fullData.submissionType);
          } else if (fullData.type) {
            setSubmissionType(fullData.type);
          }
          
          // Load attachmentUrl for TEXT submissions
          if (fullData.attachmentUrl) {
            setAttachmentUrl(fullData.attachmentUrl);
          } else if (fullData.attachments && fullData.attachments.length > 0) {
            setAttachmentUrl(fullData.attachments[0].url || "");
          }
          
          // Load questions for MULTIPLE_CHOICE submissions
          if (fullData.questions && Array.isArray(fullData.questions)) {
            setQuestions(fullData.questions);
          }
        }
      } catch (err) {
        console.error("Error loading homework details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadFullDetails();
  }, [homework.id, homework.assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tiêu đề bài tập",
        variant: "destructive",
        duration: 3000,
      });
      updateTitleRef.current?.focus();
      updateTitleRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!dueDate) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngày hết hạn",
        variant: "destructive",
        duration: 3000,
      });
      updateDueDateRef.current?.focus();
      updateDueDateRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Auto-set startDate to today if not provided
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];

    try {
      const payload: Partial<any> = {
        title,
        description: description || undefined,
        startDate: `${finalStartDate}T${startTime}:00+07:00`,
        dueAt: `${dueDate}T${dueTime}:00+07:00`,
      };

      if (maxAttempts) {
        payload.maxAttempts = parseInt(maxAttempts);
      }
      if (book) {
        payload.book = book;
      }
      if (pages) {
        payload.pages = pages;
      }

      // Handle file upload if new file is selected
      if (selectedFile && submissionType.toUpperCase() === "TEXT") {
        try {
          const uploadResult = await uploadFile(selectedFile, "homework");
          if (isUploadSuccess(uploadResult) && uploadResult.url) {
            payload.attachmentUrl = uploadResult.url;
            setAttachmentUrl(uploadResult.url);
          } else {
            const errorData = uploadResult as any;
            const errorMsg = errorData.detail || errorData.error || errorData.title || "Không thể tải file lên";
            setError(errorMsg);
            toast({
              title: "Lỗi upload",
              description: errorMsg,
              variant: "destructive",
              duration: 5000,
            });
            return;
          }
        } catch {
          setError("Lỗi khi upload file");
          toast({
            title: "Lỗi",
            description: "Không thể upload file. Vui lòng thử lại.",
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
      } else if (attachmentUrl && submissionType.toUpperCase() === "TEXT") {
        // Keep existing attachment URL if no new file is selected
        payload.attachmentUrl = attachmentUrl;
      }

      if (questions && submissionType.toUpperCase() === "MULTIPLE_CHOICE") {
        payload.questions = questions;
      }

      const homeworkId = homework.assignmentId || homework.id;
      const result = await updateHomework(homeworkId, payload);

      if (result.ok) {
        toast({
          title: "Thành công",
          description: "Bài tập đã được cập nhật.",
          variant: "success",
          duration: 5000,
        });
        onSuccess();
      } else {
        setError(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch {
      const errorMessage = "Có lỗi xảy ra. Vui lòng thử lại.";
      setError(errorMessage);
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-linear-to-r from-red-600 to-red-700 text-white px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Edit size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cập nhật bài tập</h2>
              <p className="text-sm text-red-100 mt-1">{homework.assignmentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-6" id="update-homework-form">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-4 border border-red-200/50">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <BookMarked size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Lớp học</span>
            </div>
            <div className="text-base font-semibold text-gray-900">
              {homework.className}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              ref={updateTitleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
              placeholder="Nhập mô tả chi tiết về bài tập..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <input
                ref={updateDueDateRef}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số lần làm bài tối đa
            </label>
            <input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              min="1"
              placeholder="1"
            />
          </div>

          {submissionType.toUpperCase() === "TEXT" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tệp đính kèm
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              
              <div className="space-y-3">
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-red-300 bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  {selectedFile ? "Chọn tệp khác" : "Chọn tệp để upload"}
                </button>

                {/* Selected File Display */}
                {selectedFile && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={18} className="text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Current Attachment Display */}
                {!selectedFile && attachmentUrl && (
                  <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Paperclip size={18} className="text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">Tệp hiện tại</p>
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-700 underline truncate"
                        >
                          {attachmentUrl.split("/").pop()}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {submissionType.toUpperCase() === "MULTIPLE_CHOICE" && questions.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-red-700">
                      {questions.length} câu hỏi
                    </span>
                    <span className="text-sm text-gray-600">
                      Chọn thêm câu hỏi để cập nhật hoặc import câu hỏi mới.
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportBankModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      <Database size={16} />
                      Ngân hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportExcelModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      <Table size={16} />
                      Excel
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <ClipboardList size={16} className="text-red-600" />
                  Danh sách câu hỏi ({questions.length})
                </label>
                <div className="space-y-3">
                  {questions.map((q: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">
                              {q.questionText}
                            </span>
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 ml-8">
                              {q.options.map((opt: any, optIdx: number) => (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-2 rounded-lg text-sm border ${
                                    opt === q.correctAnswer
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                      : "bg-white border-gray-200 text-gray-600"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {opt === q.correctAnswer && (
                                      <CheckCircle
                                        size={14}
                                        className="text-emerald-600"
                                      />
                                    )}
                                    <span
                                      className={
                                        opt === q.correctAnswer ? "font-medium" : ""
                                      }
                                    >
                                      {opt}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.explanation && (
                            <div className="mt-2 ml-8 text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-200">
                              <span className="font-medium">Giải thích:</span>{" "}
                              {q.explanation}
                            </div>
                          )}
                          {q.points && (
                            <div className="mt-2 ml-8 text-xs font-medium text-red-600">
                              Điểm: {q.points}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setQuestions((prev: any[]) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQuestionFormUpdate(true)}
                className="w-full py-4 border-2 border-dashed border-red-300 rounded-xl text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={20} />
                Thêm câu hỏi
              </button>

              {showQuestionFormUpdate && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Thêm câu hỏi mới
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuestionFormUpdate(false);
                        setCurrentQuestion("");
                        setCurrentOptions(createEmptyBuilderOptions());
                        setCurrentExplanation("");
                        setCurrentPoints("10");
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Câu hỏi
                    </label>
                    <textarea
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Các lựa chọn
                    </label>
                    {currentOptions.map((opt, optIndex) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              setCurrentOptions(
                                currentOptions.map((o) =>
                                  o.id === opt.id
                                    ? { ...o, text: e.target.value }
                                    : o
                                )
                              )
                            }
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + optIndex)}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentOptions(
                              currentOptions.map((o) => ({
                                ...o,
                                isCorrect: o.id === opt.id,
                              }))
                            )
                          }
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            opt.isCorrect
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title="Đánh dấu là đáp án đúng"
                        >
                          <CheckCircle size={16} />
                        </button>
                        {currentOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentOptions(
                                currentOptions.filter((o) => o.id !== opt.id)
                              )
                            }
                            className="p-2 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentOptions([
                          ...currentOptions,
                          {
                            id: crypto.randomUUID(),
                            text: "",
                            isCorrect: false,
                          },
                        ])
                      }
                      className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      Thêm lựa chọn
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Giải thích (không bắt buộc)
                    </label>
                    <textarea
                      value={currentExplanation}
                      onChange={(e) =>
                        setCurrentExplanation(e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                      placeholder="Giải thích đáp án đúng..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Điểm
                    </label>
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
                        setShowQuestionFormUpdate(false);
                        setCurrentQuestion("");
                        setCurrentOptions(createEmptyBuilderOptions());
                        setCurrentExplanation("");
                        setCurrentPoints("10");
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentQuestion.trim()) {
                          alert("Vui lòng nhập câu hỏi");
                          return;
                        }
                        if (currentOptions.some((opt) => !opt.text.trim())) {
                          alert("Vui lòng nhập đầy đủ nội dung các lựa chọn");
                          return;
                        }
                        if (!currentOptions.some((opt) => opt.isCorrect)) {
                          alert("Vui lòng chọn đáp án đúng");
                          return;
                        }

                        setQuestions([
                          ...questions,
                          {
                            questionText: currentQuestion,
                            options: currentOptions.map((o) => o.text),
                            correctAnswer: currentOptions.find(
                              (o) => o.isCorrect
                            )?.text,
                            explanation: currentExplanation || undefined,
                            points: parseInt(currentPoints) || 10,
                          },
                        ]);

                        setCurrentQuestion("");
                        setCurrentOptions(createEmptyBuilderOptions());
                        setCurrentExplanation("");
                        setCurrentPoints("10");
                        setShowQuestionFormUpdate(false);
                      }}
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

        <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-8 py-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-sm"
          >
            Hủy bỏ
          </button>
          <button
            form="update-homework-form"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
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
      </div>

      <ImportFromBankModal
        isOpen={showImportBankModal}
        onClose={() => setShowImportBankModal(false)}
        onImport={(importedQuestions: BuilderQuestion[]) => {
          setQuestions((prev: any[]) => [
            ...prev,
            ...importedQuestions.map((q) => ({
              questionText: q.question,
              options: q.options.map((o) => o.text),
              correctAnswer: q.options.find((o) => o.isCorrect)?.text,
              explanation: q.explanation,
              points: q.points,
            })),
          ]);
          setShowImportBankModal(false);
        }}
        selectedClassId=""
        classesData={[]}
      />

      <ImportFromExcelModal
        isOpen={showImportExcelModal}
        onClose={() => setShowImportExcelModal(false)}
        onImport={(importedQuestions: BuilderQuestion[]) => {
          setQuestions((prev: any[]) => [
            ...prev,
            ...importedQuestions.map((q) => ({
              questionText: q.question,
              options: q.options.map((o) => o.text),
              correctAnswer: q.options.find((o) => o.isCorrect)?.text,
              explanation: q.explanation,
              points: q.points,
            })),
          ]);
          setShowImportExcelModal(false);
        }}
      />
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [sortColumn, setSortColumn] = useState<
    "student" | "assignment" | "turnIn" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [homeworkToDelete, setHomeworkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [homeworkToUpdate, setHomeworkToUpdate] = useState<Submission | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignmentDetailsModalOpen, setAssignmentDetailsModalOpen] =
    useState(false);
  const [selectedAssignmentForDetails, setSelectedAssignmentForDetails] =
    useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [isLoadingClassOptions, setIsLoadingClassOptions] = useState(false);
  const [meta, setMeta] = useState<{
    totalItems: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }>({
    totalItems: 0,
    totalPages: 0,
    pageNumber: 1,
    pageSize: 10,
  });

  const itemsPerPage = 10;

  const loadHomework = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      setCurrentPage(page);
      try {
        const result = await get<any>(
          `/api/homework/my-created?pageNumber=${page}&pageSize=${itemsPerPage}${
            selectedClass !== "ALL" ? `&classId=${selectedClass}` : ""
          }`,
        );

        console.log("API Response:", result);

        if (result?.data) {
          // Parse response structure: result.data.homeworkAssignments.items
          const homeworkData = result.data?.homeworkAssignments;
          const items = homeworkData?.items || [];

          console.log("Mapped items:", items);
          const mappedSubmissions = (Array.isArray(items) ? items : []).map(
            (item: any) => mapSubmissionToUi(item),
          );

          console.log("Mapped submissions:", mappedSubmissions);
          setSubmissions(mappedSubmissions);

          // Get totalStudents from homeworkAssignments or first item
          const totalStudents = homeworkData?.totalStudents || 0;

          setMeta({
            totalItems: totalStudents,
            totalPages: Math.ceil(totalStudents / itemsPerPage),
            pageNumber: page,
            pageSize: itemsPerPage,
          });
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
    },
    [selectedClass, itemsPerPage],
  );

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
        toast({
          title: "Thành công",
          description: "Bài tập đã được xóa.",
          variant: "success",
          duration: 5000,
        });
        setDeleteModalOpen(false);
        setHomeworkToDelete(null);
        loadHomework(1);
      } else {
        toast({
          title: "Lỗi",
          description:
            result.error || "Không thể xóa bài tập. Vui lòng thử lại.",
          variant: "destructive",
          duration: 5000,
        });
        console.error("Failed to delete homework:", result.error);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive",
        duration: 5000,
      });
      console.error("Error deleting homework:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateHomework = (item: Submission) => {
    setHomeworkToUpdate(item);
    setUpdateModalOpen(true);
  };

  const handleViewAssignmentDetails = (item: Submission) => {
    const homeworkId = item.assignmentId || item.id;
    setSelectedAssignmentForDetails(homeworkId);
    setAssignmentDetailsModalOpen(true);
  };

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    loadHomework(1);
    setCurrentPage(1);
  }, [selectedClass, loadHomework]);

  useEffect(() => {
    const loadClassOptions = async () => {
      setIsLoadingClassOptions(true);
      try {
        const data = await fetchClasses();
        setClassOptions(data);
      } catch (error) {
        console.error("Error loading class options:", error);
        setClassOptions([]);
      } finally {
        setIsLoadingClassOptions(false);
      }
    };

    loadClassOptions();
  }, []);

  const handleSort = (column: "student" | "assignment" | "turnIn") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const filtered = useMemo(() => {
    let result = submissions;

    if (selectedClass !== "ALL") {
      result = result.filter(
        (s) => s.classId === selectedClass || s.className === selectedClass,
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.student.toLowerCase().includes(query) ||
          s.studentId.toLowerCase().includes(query) ||
          s.assignmentTitle.toLowerCase().includes(query) ||
          s.className.toLowerCase().includes(query),
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
  }, [
    filter,
    searchQuery,
    selectedClass,
    sortColumn,
    sortDirection,
    submissions,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, selectedClass]);

  const displayTotalItems = meta.totalItems > 0 ? meta.totalItems : filtered.length;
  const totalPages = Math.max(1, Math.ceil(displayTotalItems / itemsPerPage));
  const displayFrom = filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const displayTo = filtered.length > 0 ? Math.min(currentPage * itemsPerPage, displayTotalItems) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isPageLoaded
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
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
              Quản lý bài tập đã giao, theo dõi tiến độ nộp bài và gửi nhận xét
              cho học viên.
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
        className={`grid gap-4 md:grid-cols-3 transition-all duration-700 delay-100 ${
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
                {submissions.length}
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
                {submissions.filter((s) => s.status === "REVIEWED").length}
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
                {submissions.filter((s) => s.status === "PENDING").length}
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
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm học viên, bài tập..."
                className="h-10 w-full rounded-xl border border-red-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={isLoadingClassOptions}
              className="h-10 rounded-xl border border-red-200 bg-white px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả lớp</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute ml-64 pointer-events-none text-gray-400"
            />
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
              <span className="font-medium">{filtered.length} bài nộp</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
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
                  Hạn nộp
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Loại nộp
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Mô tả
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">
                    Thao tác
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-gray-600 font-medium mt-2">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <SubmissionRow
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteHomework}
                    onViewDetail={handleViewDetail}
                    onUpdate={handleUpdateHomework}
                    onViewAssignmentDetails={handleViewAssignmentDetails}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">
                      Không tìm thấy bài nộp
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </div>
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
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {displayFrom}-
                  {displayTo}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-gray-900">
                  {displayTotalItems}
                </span>{" "}
                bài nộp
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
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
                    ),
                  )}
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

      {assignmentDetailsModalOpen && selectedAssignmentForDetails && (
        <AssignmentDetailsModal
          assignmentId={selectedAssignmentForDetails}
          onClose={() => {
            setAssignmentDetailsModalOpen(false);
            setSelectedAssignmentForDetails(null);
          }}
        />
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
