"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus, Search, HelpCircle, FileQuestion, BarChart3,
  Eye, Pencil, Clock, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, X, AlertCircle, BookOpen,
  Building2, Power, PowerOff, Trash2, Copy, Layers, Loader2, Sparkles, Star,
  Upload, FileText, CheckCircle2, Download,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import {
  fetchAdminQuestions, createAdminQuestion, updateAdminQuestion,
  toggleQuestionStatus, deleteAdminQuestion, fetchAdminQuestionDetail,
  importQuestions,
} from "@/app/api/admin/question-bank";
import type { QuestionRow } from "@/app/api/admin/question-bank";
import { fetchAdminPrograms } from "@/app/api/admin/programs";
import type { CourseRow } from "@/types/admin/programs";
import AiCreatorModal from "@/components/question-bank/AiCreatorModal";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

type QuestionType =
  | "MultipleChoice"
  | "TrueFalse"
  | "Essay"
  | "FillInBlank"
  | "TextInput";
type DifficultyLevel = "Easy" | "Medium" | "Hard";
type SortField = "content" | "type" | "difficulty" | "course" | "status" | "createdAt" | "usageCount";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 10;

function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const map: Record<QuestionType, { label: string; className: string }> = {
    TextInput: { label: "Text Input", className: "bg-sky-100 text-sky-700 border-sky-200" },
    MultipleChoice: { label: "Trắc nghiệm", className: "bg-blue-100 text-blue-700 border-blue-200" },
    TrueFalse: { label: "Đúng/Sai", className: "bg-purple-100 text-purple-700 border-purple-200" },
    Essay: { label: "Tự luận", className: "bg-amber-100 text-amber-700 border-amber-200" },
    FillInBlank: { label: "Điền trống", className: "bg-teal-100 text-teal-700 border-teal-200" },
  };
  const cfg = map[type] || { label: type || "Unknown", className: "bg-gray-100 text-gray-700 border-gray-200" };
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.className)}>{cfg.label}</span>;
}

function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const map: Record<DifficultyLevel, { label: string; className: string }> = {
    Easy: { label: "Dễ", className: "bg-green-100 text-green-700 border-green-200" },
    Medium: { label: "Trung bình", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    Hard: { label: "Khó", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const cfg = map[level] || { label: level || "Unknown", className: "bg-gray-100 text-gray-700 border-gray-200" };
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.className)}>{cfg.label}</span>;
}

function StatusBadge({ value }: { value: "Đang hoạt động" | "Tạm dừng" }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-green-100 text-green-700 border border-green-200",
    "Tạm dừng": "bg-gray-100 text-gray-700 border border-gray-200",
  };
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value] || "bg-gray-100 text-gray-700 border border-gray-200")}>{value}</span>;
}

function SortableHeader({ field, currentField, direction, onSort, children, align = "left" }: {
  field: SortField; currentField: SortField | null; direction: SortDirection;
  onSort: (f: SortField) => void; children: React.ReactNode; align?: "left" | "center" | "right";
}) {
  const isActive = currentField === field;
  const icon = isActive ? (direction === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />) : <ArrowUpDown size={14} className="text-gray-400" />;
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th onClick={() => onSort(field)} className={cn("py-3 px-6", alignClass, "text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors")}>
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

interface QuestionFormData {
  programId: string;
  questionText: string;
  questionType: QuestionType;
  level: DifficultyLevel;
  options: string[];
  correctAnswer: string;
  points: string;
  explanation: string;
}

const initialFormData: QuestionFormData = {
  programId: "", questionText: "", questionType: "MultipleChoice", level: "Medium",
  options: ["", ""], correctAnswer: "", points: "1", explanation: "",
};

interface QuestionModalProps {
  isOpen: boolean; onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<boolean> | boolean;
  mode?: "create" | "edit"; initialData?: QuestionFormData | null;
  courseOptions: Array<{ id: string; name: string }>; loadingCourses: boolean;
}

function QuestionModal({ isOpen, onClose, onSubmit, mode = "create", initialData, courseOptions, loadingCourses }: QuestionModalProps) {
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof QuestionFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submitting) return;
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (isOpen) {
      setFormData(mode === "edit" && initialData ? initialData : initialFormData);
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const isMultipleChoice = formData.questionType === "MultipleChoice";

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof QuestionFormData, string>> = {};
    if (!formData.programId) newErrors.programId = "Chương trình học là bắt buộc";
    if (!formData.questionText.trim()) newErrors.questionText = "Nội dung câu hỏi là bắt buộc";
    if (isMultipleChoice) {
      if (formData.options.filter(o => o.trim()).length < 2) newErrors.options = "Cần ít nhất 2 đáp án";
      if (!formData.correctAnswer.trim()) newErrors.correctAnswer = "Đáp án đúng là bắt buộc";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const isSuccess = await onSubmit(formData);
      if (isSuccess !== false) onClose();
    } finally { setSubmitting(false); }
  };

  const handleChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => {
      if (field === "questionType" && value !== "MultipleChoice") return { ...prev, [field]: value, options: [], correctAnswer: "" };
      return { ...prev, [field]: value };
    });
    if (errors[field as keyof typeof errors]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
    if (errors.options) setErrors(prev => ({ ...prev, options: undefined }));
  };

  const handleCorrectAnswerChange = (value: string) => {
    setFormData(prev => ({ ...prev, correctAnswer: value }));
    if (errors.correctAnswer) setErrors(prev => ({ ...prev, correctAnswer: undefined }));
  };

  const addOption = () => setFormData(prev => ({ ...prev, options: [...prev.options, ""] }));
  const removeOption = (index: number) => {
    setFormData(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      const removedValue = prev.options[index];
      const newCorrect = prev.correctAnswer === removedValue ? "" : prev.correctAnswer;
      return { ...prev, options: newOptions, correctAnswer: newCorrect };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20"><HelpCircle size={20} className="text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">{mode === "edit" ? "Cập nhật câu hỏi" : "Tạo câu hỏi mới"}</h2>
                <p className="text-sm text-red-100">{mode === "edit" ? "Chỉnh sửa thông tin câu hỏi" : "Nhập thông tin chi tiết về câu hỏi mới"}</p>
              </div>
            </div>
            <button onClick={onClose} disabled={submitting} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-60 cursor-pointer"><X size={24} className="text-white" /></button>
          </div>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><BookOpen size={16} className="text-red-600" />Chương trình học *</label>
              {loadingCourses ? (
                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" />Đang tải chương trình học...</div>
              ) : (
                <Select value={formData.programId} onValueChange={(value) => handleChange("programId", value)}>
                  <SelectTrigger className={cn("w-full rounded-xl", errors.programId && "border-red-500")}>
                    <SelectValue placeholder="Chọn chương trình học" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={14} />{errors.programId}</p>}
              {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{errors.programId}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><HelpCircle size={16} className="text-red-600" />Loại câu hỏi</label>
                <Select value={formData.questionType} onValueChange={(value) => handleChange("questionType", value as QuestionType)}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MultipleChoice">Trắc nghiệm</SelectItem>
                    <SelectItem value="TrueFalse">Đúng/Sai</SelectItem>
                    <SelectItem value="Essay">Tự luận</SelectItem>
                    <SelectItem value="FillInBlank">Điền trống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><BarChart3 size={16} className="text-red-600" />Độ khó</label>
                <Select value={formData.level} onValueChange={(value) => handleChange("level", value as DifficultyLevel)}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Dễ</SelectItem>
                    <SelectItem value="Medium">Trung bình</SelectItem>
                    <SelectItem value="Hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Star size={16} className="text-red-600" />Điểm</label>
                <input type="number" min="1" value={formData.points} onChange={(e) => handleChange("points", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="VD: 10" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FileQuestion size={16} className="text-red-600" />Nội dung câu hỏi *</label>
              <div className="relative">
                <textarea value={formData.questionText} onChange={(e) => handleChange("questionText", e.target.value)} rows={3}
                  className={cn("w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none",
                    errors.questionText ? "border-red-500" : "border-gray-200")}
                  placeholder="Nhập nội dung câu hỏi..." />
                {errors.questionText && <div className="absolute right-3 top-3"><AlertCircle size={18} className="text-red-500" /></div>}
              </div>
              {errors.questionText && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{errors.questionText}</p>}
            </div>

            {isMultipleChoice && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Layers size={16} className="text-red-600" />Đáp án</label>
                  <button type="button" onClick={addOption} className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer">
                    <Plus size={14} />Thêm đáp án
                  </button>
                </div>
                {errors.options && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{errors.options}</p>}
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <button type="button" onClick={() => handleCorrectAnswerChange(option)}
                        className={cn("mt-3 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
                          formData.correctAnswer === option && option.trim() ? "border-green-500 bg-green-500 text-white" : "border-gray-300 hover:border-green-400")}
                        title="Đặt làm đáp án đúng">
                        {formData.correctAnswer === option && option.trim() && <div className="w-2 h-2 rounded-full bg-white" />}
                      </button>
                      <div className="relative flex-1">
                        <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                          className={cn("w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300",
                            formData.correctAnswer === option && option.trim() ? "border-green-400 bg-green-50" : "border-gray-200")}
                          placeholder={`Đáp án ${index + 1}`} />
                      </div>
                      {formData.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(index)} className="mt-3 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer" title="Xóa"><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.correctAnswer && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{errors.correctAnswer}</p>}
                {formData.correctAnswer && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>
                    Đáp án đúng: <span className="font-semibold">{formData.correctAnswer || "—"}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FileQuestion size={16} className="text-red-600" />Giải thích (tùy chọn)</label>
              <textarea value={formData.explanation} onChange={(e) => handleChange("explanation", e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                placeholder="Giải thích đáp án đúng..." />
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-5">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onClose} disabled={submitting} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-60 cursor-pointer text-sm">Hủy bỏ</button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setFormData(mode === "edit" && initialData ? initialData : initialFormData); setErrors({}); }}
                disabled={submitting} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-60 cursor-pointer text-sm">
                {mode === "edit" ? "Khôi phục" : "Đặt lại"}
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-70 cursor-pointer text-sm">
                {submitting ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo câu hỏi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { toast } = useToast();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MultipleChoice" | "TrueFalse" | "Essay" | "FillInBlank" | "TextInput">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | "Easy" | "Medium" | "Hard">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Đang hoạt động" | "Tạm dừng">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<QuestionFormData | null>(null);
  const [courseOptions, setCourseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [courseNameMap, setCourseNameMap] = useState<Record<string, string>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRow | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<QuestionRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAiCreatorModal, setShowAiCreatorModal] = useState(false);

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgramId, setImportProgramId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => { setIsPageLoaded(true); }, []);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const rows: CourseRow[] = await fetchAdminPrograms({});
      setCourseOptions(rows.map(c => ({ id: c.id, name: c.name })));
      setCourseNameMap(Object.fromEntries(rows.map(c => [c.id, c.name])));
    } catch (err) { console.error("Failed to load courses:", err); }
    finally { setLoadingCourses(false); }
  };

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true); setError(null);
        const { data } = await fetchAdminQuestions({
          pageNumber: 1, pageSize: 200,
          type: typeFilter !== "ALL" ? typeFilter : undefined,
          difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          search: q.trim() || undefined,
        });
        setQuestions(data);
      } catch (err) {
        setError((err as Error)?.message || "Không thể tải danh sách câu hỏi.");
        setQuestions([]);
      } finally { setLoading(false); }
    }
    fetchQuestions();
    setPage(1);
  }, [typeFilter, difficultyFilter, statusFilter, q]);

  const stats = useMemo(() => ({
    total: questions.length,
    active: questions.filter(c => c.status === "Đang hoạt động").length,
    multipleChoice: questions.filter(c => c.type === "MultipleChoice").length,
    totalUsage: questions.reduce((acc, q) => acc + q.usageCount, 0),
  }), [questions]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = questions.filter(c => {
      // Áp dụng bộ lọc loại
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      // Áp dụng bộ lọc độ khó
      if (difficultyFilter !== "ALL" && c.difficulty !== difficultyFilter) return false;
      // Áp dụng bộ lọc trạng thái
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      // Áp dụng bộ lọc tìm kiếm
      if (kw && ![c.id, c.content, c.course, c.branch].some(x => x?.toLowerCase().includes(kw))) return false;
      return true;
    });
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: QuestionRow) => {
          switch (sortField) {
            case "content": return c.content; case "type": return c.type;
            case "difficulty": return c.difficulty;
            case "course": return c.course; case "status": return c.status;
            case "createdAt": return c.createdAt; case "usageCount": return String(c.usageCount);
          }
        };
        return sortDirection === "asc" ? getVal(a).localeCompare(getVal(b)) : getVal(b).localeCompare(getVal(a));
      });
    }
    return filtered;
  }, [q, sortField, sortDirection, questions, typeFilter, difficultyFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
      else setSortDirection("asc");
    } else { setSortField(field); setSortDirection("asc"); }
    setPage(1);
  };

  const handleSelectAll = () => setSelectedQuestions(selectedQuestions.length === pagedRows.length ? [] : pagedRows.map(c => c.id));
  const handleSelectQuestion = (id: string) => setSelectedQuestions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    if (courseOptions.length === 0) await loadCourses();
  };

  const handleCreateQuestion = async (data: QuestionFormData): Promise<boolean> => {
    try {
      await createAdminQuestion({
        programId: data.programId,
        items: [{ questionText: data.questionText, questionType: data.questionType, options: data.options.filter(o => o.trim()), correctAnswer: data.correctAnswer, points: Number(data.points) || 10, explanation: data.explanation, level: data.level }],
      });
      const { data: refreshed } = await fetchAdminQuestions({ pageNumber: 1, pageSize: 200 });
      setQuestions(refreshed);
      toast({ title: "Thành công", description: "Đã tạo câu hỏi mới!", type: "success" });
      return true;
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể tạo câu hỏi.", type: "destructive" }); return false; }
  };

  const handleUpdateQuestion = async (data: QuestionFormData): Promise<boolean> => {
    if (!editingQuestionId) return false;
    try {
      await updateAdminQuestion(editingQuestionId, { 
        programId: data.programId,
        questionText: data.questionText, 
        questionType: data.questionType, 
        options: data.options.filter(o => o.trim()), 
        correctAnswer: data.correctAnswer, 
        points: Number(data.points) || 10, 
        explanation: data.explanation, 
        level: data.level 
      });
      const { data: refreshed } = await fetchAdminQuestions({ pageNumber: 1, pageSize: 200 });
      setQuestions(refreshed);
      toast({ title: "Thành công", description: "Đã cập nhật câu hỏi!", type: "success" });
      return true;
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể cập nhật.", type: "destructive" }); return false; }
  };

  const handleOpenEditQuestion = async (row: QuestionRow) => {
    try {
      setEditingQuestionId(row.id);
      if (courseOptions.length === 0) await loadCourses();
      const detail = await fetchAdminQuestionDetail(row.id);
      setEditingInitialData({
        programId: detail.programId ?? "",
        questionText: detail.questionText ?? row.content,
        questionType: detail.questionType ?? row.type,
        level: detail.level ?? row.difficulty,
        options: Array.isArray(detail.options) && detail.options.length > 0 ? detail.options : ["", ""],
        correctAnswer: typeof detail.correctAnswer === "string" ? detail.correctAnswer : String(detail.correctAnswer ?? ""),
        points: String(detail.points ?? 1),
        explanation: detail.explanation ?? "",
      });
      setIsEditModalOpen(true);
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể tải chi tiết.", type: "destructive" }); }
  };

  const handleViewDetail = async (row: QuestionRow) => {
    try { setLoadingDetail(true); setShowDetailModal(true); setSelectedQuestionDetail(null);
      const detail = await fetchAdminQuestionDetail(row.id);
      setSelectedQuestionDetail({
        ...detail,
        programName: courseNameMap[detail.programId] || detail.programName || detail.course,
      });
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể tải chi tiết.", type: "destructive" }); setShowDetailModal(false); }
    finally { setLoadingDetail(false); }
  };

  const confirmToggleStatus = async () => {
    if (!selectedQuestion) return;
    try { setIsTogglingStatus(true);
      await toggleQuestionStatus(selectedQuestion.id);
      const { data: refreshed } = await fetchAdminQuestions({ pageNumber: 1, pageSize: 200 });
      setQuestions(refreshed);
      toast({ title: "Thành công", description: "Đã thay đổi trạng thái!", type: "success" });
      setShowToggleStatusModal(false); setSelectedQuestion(null);
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể thay đổi.", type: "destructive" }); }
    finally { setIsTogglingStatus(false); }
  };

  const confirmDelete = async () => {
    if (!selectedForDelete) return;
    try { setIsDeleting(true);
      await deleteAdminQuestion(selectedForDelete.id);
      setQuestions(prev => prev.filter(q => q.id !== selectedForDelete.id));
      setSelectedQuestions(prev => prev.filter(id => id !== selectedForDelete.id));
      toast({ title: "Thành công", description: "Đã xóa câu hỏi!", type: "success" });
      setShowDeleteModal(false); setSelectedForDelete(null);
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể xóa.", type: "destructive" }); }
    finally { setIsDeleting(false); }
  };

  const handleDuplicate = async (row: QuestionRow) => {
    try {
      const detail = await fetchAdminQuestionDetail(row.id);
      await createAdminQuestion({
        programId: detail.programId ?? "",
        items: [{ questionText: cn(row.content, " (Bản sao)"), questionType: detail.questionType ?? row.type, options: Array.isArray(detail.options) ? detail.options : [], correctAnswer: typeof detail.correctAnswer === "string" ? detail.correctAnswer : String(detail.correctAnswer ?? ""), points: detail.points ?? 1, explanation: detail.explanation ?? "", level: detail.level ?? row.difficulty }],
      });
      const { data: refreshed } = await fetchAdminQuestions({ pageNumber: 1, pageSize: 200 });
      setQuestions(refreshed);
      toast({ title: "Thành công", description: "Đã sao chép câu hỏi!", type: "success" });
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Không thể sao chép.", type: "destructive" }); }
  };

  const handleImport = async () => {
    if (!importProgramId) { toast({ title: "Lỗi", description: "Vui lòng chọn chương trình học.", type: "destructive" }); return; }
    if (!importFile) { toast({ title: "Lỗi", description: "Vui lòng chọn file.", type: "destructive" }); return; }
    try {
      setIsImporting(true);
      await importQuestions(importProgramId, importFile);
      toast({ title: "Thành công", description: "Import câu hỏi thành công!", type: "success" });
      setShowImportModal(false);
      setImportFile(null);
      setImportProgramId("");
      const { data: refreshed } = await fetchAdminQuestions({ pageNumber: 1, pageSize: 200 });
      setQuestions(refreshed);
    } catch (err: any) { toast({ title: "Lỗi", description: err?.message || "Import thất bại.", type: "destructive" }); }
    finally { setIsImporting(false); }
  };

  const handleAiCreatorSaved = async (count: number) => {
    const { data: refreshed } = await fetchAdminQuestions({ pageNumber: 1, pageSize: 200 });
    setQuestions(refreshed);
    toast({
      title: "Thành công",
      description: `Đã tạo ${count} câu hỏi từ công cụ AI.`,
      type: "success",
    });
  };

  const handleDownloadTemplate = (format: "csv" | "excel" | "word" | "pdf") => {
    const headers = ["QuestionText", "Options", "CorrectAnswer", "Level", "Points", "Explanation"];
    const sampleRows = [
      ["Hà Nội là thủ đô của Việt Nam đúng không?", "Đúng|Sai", "Đúng", "Easy", "1", "Hà Nội là thủ đô của Việt Nam."],
      ["1 + 1 = ?", "1|2|3|4", "2", "Easy", "1", "1 + 1 = 2"],
      ["Mặt trời mọc ở hướng nào?", "Đông|Tây|Nam|Bắc", "Đông", "Medium", "2", "Mặt trời mọc ở hướng Đông."],
      ["Năm 2024 có phải năm nhuận không?", "Có|Không", "Có", "Medium", "2", "Năm nhuận là năm chia hết cho 4."],
      ["Tỉ lệ thuận là gì?", "Đáp án tự luận", "Tự luận", "Hard", "5", ""],
    ];

    if (format === "csv") {
      const csvContent = [
        headers.join(","),
        ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, "question-bank-template.csv");
    } else if (format === "excel") {
      // Simple HTML table as Excel-readable file (xls format)
      const rows = sampleRows.map(r => `    <tr>${r.map(c => `<td style="mso-number-format:'\\@'">${escapeHtml(c)}</td>`).join("")}</tr>`).join("\n");
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<head><meta charset="utf-8" /><style>td{mso-number-format:'\\@';white-space:nowrap}</style></head>
<body><table border="1">
<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
${rows}
</table></body></html>`;
      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
      downloadBlob(blob, "question-bank-template.xls");
    } else if (format === "word") {
      // Simple HTML table as Word-readable file
      const rows = sampleRows.map(r => `    <tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("\n");
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" /></head>
<body><table border="1" style="border-collapse:collapse">
<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
${rows}
</table></body></html>`;
      const blob = new Blob([html], { type: "application/msword;charset=utf-8;" });
      downloadBlob(blob, "question-bank-template.doc");
    } else {
      // PDF: tab-separated text
      const content = [
        headers.join("\t"),
        ...sampleRows.map(row => row.join("\t"))
      ].join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      downloadBlob(blob, "question-bank-template.txt");
    }
    toast({ title: "Thành công", description: `Đã tải file mẫu ${format.toUpperCase()}!`, type: "success" });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const statCards = [
    { icon: <HelpCircle size={18} className="text-red-600" />, label: "Tổng câu hỏi", value: loading ? "-" : stats.total, bg: "bg-red-100" },
    { icon: <Power size={18} className="text-green-600" />, label: "Đang hoạt động", value: loading ? "-" : stats.active, bg: "bg-green-100" },
    { icon: <FileQuestion size={18} className="text-blue-600" />, label: "Trắc nghiệm", value: loading ? "-" : stats.multipleChoice, bg: "bg-blue-100" },
    { icon: <BarChart3 size={18} className="text-amber-600" />, label: "Tổng lượt sử dụng", value: loading ? "-" : stats.totalUsage, bg: "bg-amber-100" },
  ];

  const importFormats = [
    { ext: "CSV", icon: <FileText size={20} />, desc: "Danh sách câu hỏi dạng bảng, phân cách bằng dấu phẩy" },
    { ext: "Excel", icon: <FileText size={20} />, desc: ".xlsx, .xls - Sheet 1, dòng 1 là header" },
    { ext: "Word", icon: <FileText size={20} />, desc: ".docx - Bảng đầu tiên, dòng 1 là header" },
    { ext: "PDF", icon: <FileText size={20} />, desc: "Dòng 1 là header, delimiter: , hoặc | hoặc tab" },
  ];

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg"><HelpCircle className="text-white" size={24} /></div>
            <div><h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Quản lý ngân hàng câu hỏi</h1><p className="text-sm text-gray-600">Quản lý câu hỏi, phân loại và độ khó</p></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAiCreatorModal(true); if (courseOptions.length === 0) loadCourses(); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"><Sparkles size={18} />Tạo câu hỏi bằng AI</button>
            <button onClick={() => { setShowImportModal(true); if (courseOptions.length === 0) loadCourses(); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"><Upload size={18} />Import</button>
            <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"><Plus size={18} />Tạo câu hỏi mới</button>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-all duration-700 delay-100", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          {statCards.map((stat, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <span className={cn("w-10 h-10 rounded-xl grid place-items-center", stat.bg)}>{stat.icon}</span>
                <div><div className="text-sm text-gray-600">{stat.label}</div><div className="text-2xl font-extrabold text-gray-900">{stat.value}</div></div>
              </div>
            </div>
          ))}
        </div>

        <div className={cn("rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Tìm kiếm câu hỏi..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-auto min-w-max rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  <SelectItem value="MultipleChoice">Trắc nghiệm</SelectItem>
                  <SelectItem value="TrueFalse">Đúng/Sai</SelectItem>
                  <SelectItem value="Essay">Tự luận</SelectItem>
                  <SelectItem value="FillInBlank">Điền trống</SelectItem>
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as typeof difficultyFilter)}>
                <SelectTrigger className="w-auto min-w-max rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả độ khó</SelectItem>
                  <SelectItem value="Easy">Dễ</SelectItem>
                  <SelectItem value="Medium">Trung bình</SelectItem>
                  <SelectItem value="Hard">Khó</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-auto min-w-max rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                  <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className={cn("rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><h2 className="text-lg font-semibold text-gray-900">Danh sách câu hỏi</h2>
                {selectedQuestions.length > 0 && <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">{selectedQuestions.length} đã chọn</span>}
              </div>
              <span className="text-sm text-gray-600 font-medium">{rows.length} câu hỏi</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-red-500" /><span className="ml-3 text-gray-500">Đang tải dữ liệu...</span></div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16"><AlertCircle size={32} className="text-red-500 mb-3" /><div className="text-gray-600 font-medium">{error}</div></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                  <tr>
                    <SortableHeader field="content" currentField={sortField} direction={sortDirection} onSort={handleSort}>Nội dung</SortableHeader>
                    <SortableHeader field="type" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Loại</SortableHeader>
                    <SortableHeader field="difficulty" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Độ khó</SortableHeader>
                    <SortableHeader field="course" currentField={sortField} direction={sortDirection} onSort={handleSort}>Chương trình học</SortableHeader>
                    <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                    <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedRows.length > 0 ? pagedRows.map((c) => (
                    <tr key={c.id} className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all">
                      <td className="py-3 px-6 max-w-xs"><div className="text-sm text-gray-900 line-clamp-2">{c.content}</div></td>
                      <td className="py-3 px-6 text-center"><QuestionTypeBadge type={c.type} /></td>
                      <td className="py-3 px-6 text-center"><DifficultyBadge level={c.difficulty} /></td>
                      <td className="py-3 px-6"><div className="flex items-center gap-2 text-sm"><span className="truncate">{courseNameMap[c.programId] || c.course || "—"}</span></div></td>
                      <td className="py-3 px-6 text-center"><StatusBadge value={c.status} /></td>
                      <td className="py-3 px-6"><div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewDetail(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer" title="Xem chi tiết"><Eye size={14} /></button>
                        <button onClick={() => handleOpenEditQuestion(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-800 cursor-pointer" title="Sửa"><Pencil size={14} /></button>
                        <button onClick={() => handleDuplicate(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 cursor-pointer" title="Sao chép"><Copy size={14} /></button>
                        <button onClick={() => { setSelectedForDelete(c); setShowDeleteModal(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer" title="Xóa"><Trash2 size={14} /></button>
                      </div></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center"><Search size={24} className="text-gray-400" /></div>
                      <div className="text-gray-600 font-medium">Không tìm thấy câu hỏi</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo câu hỏi mới</div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {!loading && !error && rows.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span> trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> câu hỏi</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 cursor-pointer"><ChevronLeft size={18} /></button>
                  <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 cursor-pointer"><ChevronRight size={18} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <QuestionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateQuestion} mode="create" initialData={null} courseOptions={courseOptions} loadingCourses={loadingCourses} />

      <QuestionModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingQuestionId(null); setEditingInitialData(null); }} onSubmit={handleUpdateQuestion} mode="edit" initialData={editingInitialData} courseOptions={courseOptions} loadingCourses={loadingCourses} />

      <ConfirmModal isOpen={showToggleStatusModal} onClose={() => { setShowToggleStatusModal(false); setSelectedQuestion(null); }} onConfirm={confirmToggleStatus}
        title={selectedQuestion?.status === "Đang hoạt động" ? "Xác nhận tạm dừng" : "Xác nhận kích hoạt"}
        message={selectedQuestion?.status === "Đang hoạt động" ? "Tạm dừng câu hỏi này?" : "Kích hoạt câu hỏi này?"}
        confirmText={selectedQuestion?.status === "Đang hoạt động" ? "Tạm dừng" : "Kích hoạt"} cancelText="Hủy"
        variant={selectedQuestion?.status === "Đang hoạt động" ? "warning" : "success"} isLoading={isTogglingStatus} />

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedForDelete(null); }} onConfirm={confirmDelete}
        title="Xác nhận xóa câu hỏi" message="Hành động này không thể hoàn tác." confirmText="Xóa" cancelText="Hủy" variant="danger" isLoading={isDeleting} />

      {showDetailModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDetailModal(false); setSelectedQuestionDetail(null); }}>
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-white/20"><HelpCircle size={24} className="text-white" /></div><div><h2 className="text-2xl font-bold text-white">Chi tiết câu hỏi</h2><p className="text-sm text-red-100">Thông tin chi tiết về câu hỏi</p></div></div>
                <button onClick={() => { setShowDetailModal(false); setSelectedQuestionDetail(null); }} className="p-2 rounded-full hover:bg-white/20 cursor-pointer"><X size={24} className="text-white" /></button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-red-500" /><span className="ml-3 text-gray-500">Đang tải...</span></div>
              ) : selectedQuestionDetail ? (
                <>
                  <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FileQuestion size={16} className="text-red-600" />Nội dung</label><div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">{selectedQuestionDetail.questionText || selectedQuestionDetail.content || "—"}</div></div>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1"><label className="text-xs font-semibold text-gray-500">Loại</label><div><QuestionTypeBadge type={selectedQuestionDetail.questionType || selectedQuestionDetail.type} /></div></div>
                    <div className="space-y-1"><label className="text-xs font-semibold text-gray-500">Độ khó</label><div><DifficultyBadge level={selectedQuestionDetail.level || selectedQuestionDetail.difficulty} /></div></div>
                    <div className="space-y-1"><label className="text-xs font-semibold text-gray-500">Điểm</label><div className="px-3 py-1 rounded-full border border-gray-200 bg-white text-sm">{selectedQuestionDetail.points ?? 10}</div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><BookOpen size={16} className="text-red-600" />Chương trình học</label><div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">{selectedQuestionDetail.course || selectedQuestionDetail.programName || "—"}</div></div>
                    <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Clock size={16} className="text-red-600" />Ngày tạo</label><div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">{formatDate(selectedQuestionDetail.createdAt)}</div></div>
                  </div>
                  {Array.isArray(selectedQuestionDetail.options) && selectedQuestionDetail.options.length > 0 && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Layers size={16} className="text-red-600" />Đáp án</label>
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        {selectedQuestionDetail.options.map((opt: string, idx: number) => {
                          const isCorrect = opt === selectedQuestionDetail.correctAnswer;
                          return <div key={idx} className={cn("flex items-center gap-3 px-4 py-3", idx !== selectedQuestionDetail.options.length - 1 && "border-b border-gray-100", isCorrect && "bg-green-50")}>
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", isCorrect ? "border-green-500 bg-green-500" : "border-gray-300")}>{isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}</div>
                            <span className={cn("text-sm", isCorrect ? "text-green-700 font-semibold" : "text-gray-900")}>{opt}</span>
                            {isCorrect && <span className="ml-auto text-xs text-green-600 font-medium">Đáp án đúng</span>}
                          </div>;
                        })}
                      </div>
                    </div>
                  )}
                  {selectedQuestionDetail.explanation && <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FileQuestion size={16} className="text-red-600" />Giải thích</label><div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm">{selectedQuestionDetail.explanation}</div></div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><BarChart3 size={16} className="text-red-600" />Lượt sử dụng</label><div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">{selectedQuestionDetail.usageCount ?? 0} lần</div></div>
                    <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Building2 size={16} className="text-red-600" />Trạng thái</label><div className="px-4 py-3 rounded-xl border border-gray-200 bg-white"><StatusBadge value={selectedQuestionDetail.status === "Tạm dừng" ? "Tạm dừng" : "Đang hoạt động"} /></div></div>
                  </div>
                </>
              ) : <div className="text-center py-12 text-gray-500">Không có dữ liệu</div>}
            </div>
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex justify-end"><button onClick={() => { setShowDetailModal(false); setSelectedQuestionDetail(null); }} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer">Đóng</button></div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowImportModal(false); setImportFile(null); setImportProgramId(""); }}>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20"><Upload size={24} className="text-white" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Import Câu Hỏi</h2>
                    <p className="text-sm text-red-100">Nhập câu hỏi từ tập tin</p>
                  </div>
                </div>
                <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportProgramId(""); }} disabled={isImporting} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-60 cursor-pointer"><X size={20} className="text-white" /></button>
              </div>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><BookOpen size={16} className="text-red-600" />Chương trình học *</label>
                {loadingCourses ? (
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" />Đang tải...</div>
                ) : (
                  <Select value={importProgramId} onValueChange={setImportProgramId}>
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue placeholder="Chọn chương trình học" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FileText size={16} className="text-red-600" />Tập tin *</label>
                <div className={cn("border-2 border-dashed rounded-lg p-4 text-center transition-colors", importFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-red-400")}>
                  {importFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={24} className="text-green-500" />
                      <div className="text-sm font-medium text-gray-900 truncate max-w-full">{importFile.name}</div>
                      <div className="text-sm text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</div>
                      <button onClick={() => setImportFile(null)} className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer mt-1">Xóa</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" accept=".csv,.xlsx,.xls,.docx,.pdf" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="hidden" />
                      <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                      <div className="text-sm text-gray-600 font-medium">Chọn tập tin hoặc kéo thả</div>
                      <div className="text-sm text-gray-400 mt-1">CSV, Excel, Word, PDF</div>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Cột bắt buộc</label>
                <div className="flex flex-wrap gap-2">
                  {["QuestionText", "Options", "CorrectAnswer", "Level"].map((col) => (
                    <span key={col} className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">{col}</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600">Options: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">A|B|C|D</code></p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tải mẫu</label>
                <button onClick={() => handleDownloadTemplate("csv")} className="w-full px-3 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                  <Download size={16} />Tải mẫu CSV
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportProgramId(""); }} disabled={isImporting} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-60 cursor-pointer">Hủy</button>
                <button onClick={handleImport} disabled={isImporting || !importFile || !importProgramId}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {isImporting && <Loader2 size={16} className="animate-spin" />}
                  {isImporting ? "Đang nhập..." : "Nhập"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AiCreatorModal
        isOpen={showAiCreatorModal}
        onClose={() => setShowAiCreatorModal(false)}
        courseOptions={courseOptions}
        loadingCourses={loadingCourses}
        onSaved={handleAiCreatorSaved}
      />
    </>
  );
}
