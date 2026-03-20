"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Flag,
  CheckCircle,
  Loader2,
  X,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { getStudentHomeworkById, submitMultipleChoiceHomework } from "@/lib/api/studentService";
import type { SubmitMultipleChoicePayload } from "@/lib/api/studentService";
import type { AssignmentDetail, HomeworkQuestion } from "@/types/student/homework";
import ConfirmModal from "@/components/ConfirmModal";

const WORD_COLORS = [
  "from-orange-400 to-yellow-400",
  "from-violet-400 to-purple-400",
  "from-rose-400 to-pink-400",
  "from-cyan-400 to-blue-400",
  "from-emerald-400 to-teal-400",
  "from-amber-400 to-orange-400",
];

function QuizHeader({ title, timeRemaining, isTimerActive, answeredCount, totalQuestions }: {
  title?: string; timeRemaining: number | null; isTimerActive: boolean; answeredCount: number; totalQuestions: number;
}) {
  const minutes = timeRemaining !== null ? Math.floor(timeRemaining / 60) : 0;
  const seconds = timeRemaining !== null ? timeRemaining % 60 : 0;
  const isLow = timeRemaining !== null && timeRemaining <= 60;
  const isWarning = timeRemaining !== null && timeRemaining <= 180;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-orange-500 via-purple-500 to-fuchsia-500 px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg border border-white/30">
          <span className="text-white font-black text-2xl">X</span>
        </div>
        <div className="hidden sm:block">
          <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest">SET PRIMARY</div>
          <div className="text-white font-bold text-sm truncate max-w-[180px]">{title || "Bài Kiểm Tra"}</div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <div className="h-3 bg-slate-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          {totalQuestions > 0 && (
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 border-orange-400 transition-all duration-500" style={{ left: `calc(${progress}% - 10px)` }} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-slate-900/40 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className={isLow ? "text-rose-300 animate-pulse" : isWarning ? "text-amber-300" : "text-white/80"} />
              <span className={`font-black text-lg ${isLow ? "text-rose-300" : isWarning ? "text-amber-300" : "text-white"}`}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
            <div className="w-px h-6 bg-white/30" />
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-white font-bold text-sm">{answeredCount}/{totalQuestions}</span>
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-lg border-2 border-white/50">
          <Clock size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function QuestionBlock({ question, questionIndex, totalQuestions, selectedOptionId, onSelect, wordColorIndex }: {
  question: HomeworkQuestion; questionIndex: number; totalQuestions: number; selectedOptionId?: string;
  onSelect: (optionId: string) => void; wordColorIndex: number;
}) {
  const isAnswered = !!selectedOptionId;

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-100 via-purple-50 to-fuchsia-50 px-5 py-3 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-blue-600">{questionIndex + 1}.</div>
          <div className="flex-1" />
          {question.points && (
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{question.points} Ä‘iá»ƒm</span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="bg-slate-100 rounded-xl px-4 py-3 mb-5 border-l-4 border-blue-400">
          <p className="text-base font-bold text-slate-900 uppercase tracking-wide">{question.questionText}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {question.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const colorClass = WORD_COLORS[(wordColorIndex + idx) % WORD_COLORS.length];

            return (
              <button
                key={option.id}
                onClick={() => onSelect(option.id)}
                disabled={isAnswered}
                className={`group transition-all duration-200 ${isAnswered ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div
                  className={`relative px-4 py-3 rounded-xl bg-gradient-to-r ${colorClass} shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 ${
                    isSelected ? "ring-4 ring-emerald-400 ring-offset-2 scale-105" : ""
                  }`}
                >
                  <span className="text-white font-bold text-sm uppercase tracking-wide drop-shadow-sm text-center block">{option.text}</span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/50">
          <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-3">Chá»n Ä‘Ã¡p Ã¡n Ä‘Ãºng</div>
          <div className="flex flex-wrap gap-2">
            {question.options.map((option, idx) => {
              const isSelected = selectedOptionId === option.id;
              const colorClass = WORD_COLORS[(wordColorIndex + idx) % WORD_COLORS.length];
              if (!isSelected) return null;
              return (
                <div key={option.id} className={`px-4 py-2 rounded-xl bg-gradient-to-r ${colorClass} shadow-md`}>
                  <span className="text-white font-bold text-sm uppercase tracking-wide drop-shadow-sm">{option.text}</span>
                </div>
              );
            })}
            {!selectedOptionId && (
              <div className="px-6 py-2 rounded-xl border-2 border-dashed border-blue-300 bg-white">
                <span className="text-blue-300 font-medium text-sm">?</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTimeUpWarning, setShowTimeUpWarning] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      if (!homeworkId) return;
      setIsLoading(true);
      try {
        const response = await getStudentHomeworkById(homeworkId);
        if (response.isSuccess && response.data) {
          setAssignment(response.data);
          setTimeRemaining(10 * 60);
          setIsTimerActive(true);
        } else {
          setError(response.message || "KhÃ´ng thá»ƒ táº£i bÃ i táº­p");
        }
      } catch {
        setError("ÄÃ£ xáº£y ra lá»—i khi táº£i bÃ i táº­p");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [homeworkId]);

  useEffect(() => {
    if (!isTimerActive || timeRemaining === null || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          setIsTimerActive(false);
          setShowTimeUpWarning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerActive, timeRemaining]);

  const handleSelectAnswer = useCallback((questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }, []);

  const handleSubmit = () => setShowConfirmModal(true);

  const handleConfirmSubmit = async () => {
    if (!homeworkId || !assignment) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const questions = assignment.questions || [];
      const unanswered = questions.find(q => !selectedAnswers[q.id]);

      if (questions.length === 0) {
        setSubmitError("BÃ i tráº¯c nghiá»‡m chÆ°a cÃ³ cÃ¢u há»i.");
        setIsSubmitting(false);
        return;
      }

      if (unanswered) {
        setSubmitError("Vui lÃ²ng tráº£ lá»i táº¥t cáº£ cÃ¢u há»i trÆ°á»›c khi ná»™p.");
        setIsSubmitting(false);
        return;
      }

      const payload: SubmitMultipleChoicePayload = {
        homeworkStudentId: homeworkId,
        answers: questions.map(q => ({
          questionId: q.id,
          selectedOptionId: selectedAnswers[q.id],
        })),
      };

      const response = await submitMultipleChoiceHomework(payload);

      if (response.isSuccess) {
        setSubmitSuccess(true);
        setShowConfirmModal(false);
        setTimeout(() => {
          router.push(`/${params.locale}/portal/student/homework`);
        }, 2000);
      } else {
        setSubmitError(response.message || "KhÃ´ng thá»ƒ ná»™p bÃ i");
      }
    } catch {
      setSubmitError("ÄÃ£ xáº£y ra lá»—i khi ná»™p bÃ i");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
          <span className="text-white font-semibold">Äang táº£i bÃ i kiá»ƒm tra...</span>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center p-6">
        <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <AlertCircle className="w-16 h-16 text-rose-300 mb-4" />
          <p className="text-white font-semibold text-lg mb-2">{error || "KhÃ´ng tÃ¬m tháº¥y bÃ i táº­p"}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold cursor-pointer transition">
            Quay láº¡i
          </button>
        </div>
      </div>
    );
  }

  const questions = assignment.questions || [];
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const answeredCount = useMemo(() => questions.filter(q => selectedAnswers[q.id]).length, [questions, selectedAnswers]);
  const currentQuestions = questions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-emerald-100 to-teal-100 flex flex-col">
      <QuizHeader title={assignment.title} timeRemaining={timeRemaining} isTimerActive={isTimerActive} answeredCount={answeredCount} totalQuestions={questions.length} />

      <div className="px-6 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition cursor-pointer">
          <ArrowLeft size={18} />
          Quay láº¡i
        </button>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="rounded-2xl border-2 border-blue-300 bg-white shadow-xl overflow-hidden">
            <div className="p-6 space-y-4">
              {currentQuestions.map((question, index) => (
                <QuestionBlock
                  key={question.id}
                  question={question}
                  questionIndex={currentPage * questionsPerPage + index}
                  totalQuestions={questions.length}
                  selectedOptionId={selectedAnswers[question.id]}
                  onSelect={(optionId) => handleSelectAnswer(question.id, optionId)}
                  wordColorIndex={currentPage * questionsPerPage + index}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg cursor-pointer ${
                currentPage === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              }`}
            >
              <ChevronLeft size={18} />
              CÃ¢u trÆ°á»›c
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    idx === currentPage ? "bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg scale-125" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            {currentPage < totalPages - 1 ? (
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold text-sm transition shadow-lg cursor-pointer"
              >
                CÃ¢u tiáº¿p
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answeredCount < questions.length || isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg cursor-pointer ${
                  answeredCount < questions.length ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                }`}
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Äang ná»™p...</> : <><CheckCircle size={18} /> Ná»™p bÃ i</>}
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-200 transition cursor-pointer shadow-sm">
              <Lightbulb size={18} className="text-rose-500" />
              <span className="text-sm font-semibold text-rose-700">Gá»£i Ã½</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-yellow-100 hover:bg-yellow-200 rounded-xl border border-yellow-200 transition cursor-pointer shadow-sm">
              <Flag size={16} className="text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-700">BÃ¡o cÃ¡o lá»—i</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="XÃ¡c nháº­n ná»™p bÃ i"
        message={`Báº¡n Ä‘Ã£ tráº£ lá»i ${answeredCount}/${questions.length} cÃ¢u. Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n ná»™p bÃ i khÃ´ng?`}
        confirmText="Ná»™p bÃ i"
        cancelText="Há»§y"
        variant="success"
        isLoading={isSubmitting}
      />

      {showTimeUpWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Háº¿t giá»!</h3>
            <p className="text-slate-600 mb-6">Thá»i gian lÃ m bÃ i Ä‘Ã£ káº¿t thÃºc. BÃ i tráº¯c nghiá»‡m sáº½ Ä‘Æ°á»£c ná»™p tá»± Ä‘á»™ng.</p>
            <button
              onClick={() => { setShowTimeUpWarning(false); handleSubmit(); }}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-bold cursor-pointer transition"
            >
              Ná»™p bÃ i ngay
            </button>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="fixed top-6 right-6 z-[10000] bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle size={24} />
          <div>
            <div className="font-bold">Ná»™p bÃ i thÃ nh cÃ´ng!</div>
            <div className="text-sm text-white/80">Äang chuyá»ƒn vá» trang bÃ i táº­p...</div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <AlertCircle size={24} />
          <div>
            <div className="font-bold">Lá»—i ná»™p bÃ i</div>
            <div className="text-sm text-rose-100">{submitError}</div>
          </div>
          <button onClick={() => setSubmitError(null)} className="ml-4 p-1 hover:bg-rose-600 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}