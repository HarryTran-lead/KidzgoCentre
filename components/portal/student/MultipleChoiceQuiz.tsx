
import { useState, useMemo } from "react";
import {
  Clock,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Flag,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { HomeworkQuestion } from "@/types/student/homework";

interface MultipleChoiceQuizProps {
  questions: HomeworkQuestion[];
  selectedAnswers: Record<string, string>;
  onSelectAnswer: (questionId: string, optionId: string) => void;
  timeRemaining: number | null;
  isTimerActive: boolean;
  maxScore?: number;
  title?: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
}

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
          <div className="text-white font-bold text-sm truncate max-w-[180px]">{title || "Bai kiem tra"}</div>
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

function QuestionBlock({ question, questionIndex, totalQuestions, selectedOptionId, onSelect, wordColorIndex, isAnswered }: {
  question: HomeworkQuestion; questionIndex: number; totalQuestions: number; selectedOptionId?: string;
  onSelect: (optionId: string) => void; wordColorIndex: number; isAnswered: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-100 via-purple-50 to-fuchsia-50 px-5 py-3 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-blue-600">{questionIndex + 1}.</div>
          <div className="flex-1" />
          {question.points && (
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{question.points} diem</span>
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
          <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-3">Chon dap an dung</div>
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

export default function MultipleChoiceQuiz({
  questions, selectedAnswers, onSelectAnswer, timeRemaining, isTimerActive,
  maxScore, title, isSubmitting, onSubmit,
}: MultipleChoiceQuizProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 3;
  const totalPages = Math.ceil((questions?.length || 0) / questionsPerPage);

  const answeredCount = useMemo(() => questions.filter(q => selectedAnswers[q.id]).length, [questions, selectedAnswers]);
  const currentQuestions = questions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage);

  return (
    <div className="space-y-4">
      <QuizHeader title={title} timeRemaining={timeRemaining} isTimerActive={isTimerActive} answeredCount={answeredCount} totalQuestions={questions.length} />

      <div className="rounded-2xl border-2 border-blue-300 bg-white shadow-xl overflow-hidden">
        <div className="p-6 space-y-4">
          {currentQuestions.map((question, index) => (
            <QuestionBlock
              key={question.id}
              question={question}
              questionIndex={currentPage * questionsPerPage + index}
              totalQuestions={questions.length}
              selectedOptionId={selectedAnswers[question.id]}
              onSelect={(optionId) => onSelectAnswer(question.id, optionId)}
              wordColorIndex={currentPage * questionsPerPage + index}
              isAnswered={!!selectedAnswers[question.id]}
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
          Cau truoc
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
            Cau tiep
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={answeredCount < questions.length || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg cursor-pointer ${
              answeredCount < questions.length ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            }`}
          >
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Dang nap...</> : <><CheckCircle size={18} /> Nap bai</>}
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-200 transition cursor-pointer shadow-sm">
          <Lightbulb size={18} className="text-rose-500" />
          <span className="text-sm font-semibold text-rose-700">Goi y</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-yellow-100 hover:bg-yellow-200 rounded-xl border border-yellow-200 transition cursor-pointer shadow-sm">
          <Flag size={16} className="text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-700">Bao cao loi</span>
        </button>
      </div>
    </div>
  );
}