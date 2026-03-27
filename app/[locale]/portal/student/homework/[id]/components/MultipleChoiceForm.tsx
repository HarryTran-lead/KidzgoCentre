"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  Send,
  Flag,
  BookOpen,
  HelpCircle,
  List,
  Timer,
  AlertTriangle,
  Clock,
  RotateCcw,
  LogOut,
  ArrowLeft,
  Play,
} from "lucide-react";
import type { AssignmentDetail } from "@/types/student/homework";
import type { SubmitMultipleChoicePayload } from "@/lib/api/studentService";
import { submitMultipleChoiceHomework } from "@/lib/api/studentService";

interface MultipleChoiceFormProps {
  assignment: AssignmentDetail;
  homeworkId: string;
  onSubmitSuccess: () => void;
  onError: (msg: string | null) => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function MultipleChoiceForm({
  assignment,
  homeworkId,
  onSubmitSuccess,
  onError,
  onUnsavedChanges,
}: MultipleChoiceFormProps) {
  const questions = assignment.questions || [];
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeUpModal, setTimeUpModal] = useState(false);
  const [countdownWarning, setCountdownWarning] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [showQuizStartModal, setShowQuizStartModal] = useState(false);
  
  const hasAutoSubmitted = useRef(false);
  const isDirty = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number>(0);
  const remainingOnLeaveRef = useRef<number>(0);
  
  const router = useRouter();

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const hasAnsweredAll = answeredCount === totalQuestions && totalQuestions > 0;
  
  const timeLimitMinutes = assignment.timeLimitMinutes;
  const totalSeconds = timeLimitMinutes && timeLimitMinutes > 0 ? timeLimitMinutes * 60 : 0;
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  
  const isUrgent = timeRemaining > 0 && timeRemaining <= 5 * 60;
  const isCritical = timeRemaining > 0 && timeRemaining <= 60;
  const timerPercentage = totalSeconds > 0 ? (timeRemaining / totalSeconds) * 100 : 0;

  const getStorageKey = useCallback((suffix: string = "") => `quiz_${homeworkId}${suffix}`, [homeworkId]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsTimerActive(false);
  }, []);

  const getQuestionStatus = useCallback((questionId: string) => {
    if (selectedAnswers[questionId]) return "answered";
    if (markedQuestions.has(questionId)) return "marked";
    return "unanswered";
  }, [selectedAnswers, markedQuestions]);

  const submitQuiz = useCallback(async (isAutoSubmit = false) => {
    if (isSubmitting || hasAutoSubmitted.current) return;
    stopTimer();
    setIsSubmitting(true);
    try {
      if (totalQuestions === 0) { onError("Bài trắc nghiệm chưa có câu hỏi."); setIsSubmitting(false); return; }
      if (!isAutoSubmit) {
        const unanswered = questions.find((q) => !selectedAnswers[q.id]);
        if (unanswered) { onError("Vui lòng chọn đáp án cho tất cả câu hỏi."); setIsSubmitting(false); return; }
      }
      const payload: SubmitMultipleChoicePayload = {
        homeworkStudentId: homeworkId,
        answers: questions.map((q) => ({ questionId: q.id, selectedOptionId: selectedAnswers[q.id] || "" })),
      };
      const response = await submitMultipleChoiceHomework(payload);
      if (response.isSuccess) {
        hasAutoSubmitted.current = true;
        localStorage.setItem(getStorageKey("_submitted"), "true");
        onSubmitSuccess();
      } else {
        onError(response.message || "Không thể nộp bài.");
        setIsTimerActive(true);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      onError("Đã xảy ra lỗi khi nộp bài");
      setIsTimerActive(true);
    } finally { setIsSubmitting(false); }
  }, [isSubmitting, totalQuestions, questions, selectedAnswers, homeworkId, onSubmitSuccess, onError, stopTimer, getStorageKey]);

  const autoSubmitAndLeave = useCallback(async () => {
    if (isAutoSubmitting || hasAutoSubmitted.current) return;
    setIsAutoSubmitting(true);
    stopTimer();
    try {
      const payload: SubmitMultipleChoicePayload = {
        homeworkStudentId: homeworkId,
        answers: questions.map((q) => ({ questionId: q.id, selectedOptionId: selectedAnswers[q.id] || "" })),
      };
      const response = await submitMultipleChoiceHomework(payload);
      if (response.isSuccess) {
        hasAutoSubmitted.current = true;
        localStorage.setItem(getStorageKey("_submitted"), "true");
        onSubmitSuccess();
        return true;
      } else { onError(response.message || "Không thể nộp bài."); return false; }
    } catch { onError("Đã xảy ra lỗi khi nộp bài"); return false; }
    finally { setIsAutoSubmitting(false); }
  }, [isAutoSubmitting, questions, selectedAnswers, homeworkId, onSubmitSuccess, onError, stopTimer, getStorageKey]);

  const handleNavigationAttempt = useCallback(async (targetUrl?: string) => {
    if (hasAutoSubmitted.current || isSubmitting) { if (targetUrl) router.push(targetUrl); return; }
    setShowLeaveWarning(true);
    setPendingNavigation(targetUrl || null);
  }, [router, isSubmitting]);

  const handleConfirmLeave = useCallback(async () => {
    setShowLeaveWarning(false);
    const submitted = await autoSubmitAndLeave();
    if (submitted && pendingNavigation) router.push(pendingNavigation);
    else if (submitted) router.back();
    setPendingNavigation(null);
  }, [autoSubmitAndLeave, pendingNavigation, router]);

  const handleStay = useCallback(() => { setShowLeaveWarning(false); setPendingNavigation(null); window.history.pushState(null, "", window.location.href); }, []);

  const handleConfirmSubmit = useCallback(() => { if (!homeworkId || !assignment) return; setShowSubmitModal(false); submitQuiz(false); }, [homeworkId, assignment, submitQuiz]);

  const handleAutoSubmit = useCallback(() => { setTimeUpModal(false); submitQuiz(true); }, [submitQuiz]);

  const handleStartQuiz = useCallback(() => {
    const storageKey = getStorageKey();
    const now = Date.now();
    setSelectedAnswers({});
    setMarkedQuestions(new Set());
    isDirty.current = false;
    if (totalSeconds > 0) {
      timerStartTimeRef.current = now;
      remainingOnLeaveRef.current = totalSeconds;
      setTimeRemaining(totalSeconds);
      setIsTimerActive(true);
      localStorage.setItem(`${storageKey}_startTime`, String(now));
      localStorage.setItem(`${storageKey}_remaining`, String(totalSeconds));
      localStorage.setItem(`${storageKey}_lastActive`, String(now));
    }
    localStorage.removeItem(`${storageKey}_submitted`);
    localStorage.removeItem(`${storageKey}_answers`);
    localStorage.removeItem(`${storageKey}_marked`);
    setShowQuizStartModal(false);
  }, [getStorageKey, totalSeconds]);

  useEffect(() => { if (onUnsavedChanges) onUnsavedChanges(isDirty.current); }, [selectedAnswers, onUnsavedChanges]);

  useEffect(() => {
    const storageKey = getStorageKey();
    const savedAnswers = localStorage.getItem(`${storageKey}_answers`);
    if (savedAnswers) { try { const parsed = JSON.parse(savedAnswers); setSelectedAnswers(parsed); if (Object.keys(parsed).length > 0) isDirty.current = true; } catch { /* ignore */ } }
    const savedMarked = localStorage.getItem(`${storageKey}_marked`);
    if (savedMarked) { try { setMarkedQuestions(new Set(JSON.parse(savedMarked))); } catch { /* ignore */ } }
    const savedStartTime = localStorage.getItem(`${storageKey}_startTime`);
    const savedRemaining = localStorage.getItem(`${storageKey}_remaining`);
    const savedSubmitted = localStorage.getItem(`${storageKey}_submitted`);
    const savedLastActive = localStorage.getItem(`${storageKey}_lastActive`);
    if (savedSubmitted === "true") { setIsInitialized(true); return; }
    if (savedStartTime && savedRemaining) {
      setShowQuizStartModal(false);
      const remaining = parseInt(savedRemaining, 10);
      const lastActive = savedLastActive ? parseInt(savedLastActive, 10) : Date.now();
      const elapsed = Math.floor((Date.now() - lastActive) / 1000);
      const newRemaining = Math.max(0, remaining - elapsed);
      if (newRemaining <= 0) { setTimeRemaining(0); setIsTimerActive(false); setTimeUpModal(true); }
      else {
        setTimeRemaining(newRemaining);
        remainingOnLeaveRef.current = newRemaining;
        timerStartTimeRef.current = Date.now();
        localStorage.setItem(`${storageKey}_startTime`, String(Date.now()));
        localStorage.setItem(`${storageKey}_remaining`, String(newRemaining));
      }
    } else { setShowQuizStartModal(true); }
    setIsInitialized(true);
  }, [getStorageKey, totalSeconds]);

  useEffect(() => {
    if (!isInitialized) return;
    const storageKey = getStorageKey();
    localStorage.setItem(`${storageKey}_answers`, JSON.stringify(selectedAnswers));
    localStorage.setItem(`${storageKey}_marked`, JSON.stringify([...markedQuestions]));
    localStorage.setItem(`${storageKey}_lastActive`, String(Date.now()));
  }, [selectedAnswers, markedQuestions, isInitialized, getStorageKey]);

  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(() => { const storageKey = getStorageKey(); localStorage.setItem(`${storageKey}_lastActive`, String(Date.now())); }, 5000);
    return () => clearInterval(interval);
  }, [isInitialized, getStorageKey]);

  useEffect(() => {
    if (!isInitialized || showQuizStartModal) return;
    if (!totalSeconds || totalSeconds <= 0 || !isTimerActive) return;
    if (hasAutoSubmitted.current || timeRemaining <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; setIsTimerActive(false); setTimeUpModal(true); localStorage.setItem(getStorageKey("_submitted"), "true"); return 0; }
        const newTime = prev - 1;
        if (newTime === 5 * 60 && !countdownWarning) { setCountdownWarning(true); setTimeout(() => setCountdownWarning(false), 5000); }
        if (newTime === 60) { setCountdownWarning(true); setTimeout(() => setCountdownWarning(false), 5000); }
        if (newTime % 10 === 0) { localStorage.setItem(getStorageKey("_remaining"), String(newTime)); localStorage.setItem(`${getStorageKey}_startTime`, String(Date.now())); }
        return newTime;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
  }, [totalSeconds, isTimerActive, timeRemaining, countdownWarning, isInitialized, getStorageKey, showQuizStartModal]);

  useEffect(() => {
    if (!isInitialized || hasAutoSubmitted.current || isSubmitting || showQuizStartModal) return;
    const handlePopState = (e: PopStateEvent) => { e.preventDefault(); handleNavigationAttempt(); window.history.pushState(null, "", window.location.href); };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (hasAutoSubmitted.current) return; e.preventDefault(); e.returnValue = "Bạn chưa hoàn thành bài làm."; };
    const handleLinkClick = async (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (href.startsWith("/") && !href.startsWith("//") && !hasAutoSubmitted.current) { e.preventDefault(); e.stopPropagation(); await handleNavigationAttempt(href); }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    return () => { window.removeEventListener("popstate", handlePopState); window.removeEventListener("beforeunload", handleBeforeUnload); document.removeEventListener("click", handleLinkClick, true); };
  }, [isInitialized, isSubmitting, handleNavigationAttempt, showQuizStartModal]);

  const handleSelectAnswer = (questionId: string, optionId: string) => { setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId })); isDirty.current = true; };
  const handleClearAnswer = (questionId: string) => { setSelectedAnswers((prev) => { const n = { ...prev }; delete n[questionId]; return n; }); };
  const handleMarkQuestion = (questionId: string) => { setMarkedQuestions((prev) => { const n = new Set(prev); n.has(questionId) ? n.delete(questionId) : n.add(questionId); return n; }); };

  if (totalQuestions === 0) return (<div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100"><div className="flex flex-col items-center justify-center text-center"><BookOpen className="h-16 w-16 text-amber-400 mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có câu hỏi</h3><p className="text-gray-500">Bài trắc nghiệm này hiện chưa có câu hỏi nào.</p></div></div>);
  if (!isInitialized) return (<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>);

  return (
    <>
      {countdownWarning && !showQuizStartModal && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] bg-amber-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <AlertTriangle size={24} />
          <div><div className="font-semibold">{timeRemaining <= 60 ? "Chỉ còn 1 phút!" : "Còn 5 phút!"}</div><div className="text-sm text-amber-100">{timeRemaining <= 60 ? "Vui lòng nhanh chóng hoàn thành bài thi." : "Vui lòng kiểm tra lại các câu hỏi đã đánh dấu."}</div></div>
        </div>
      )}

      {showQuizStartModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950" />
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute rounded-full animate-pulse" style={{ width: `${Math.random() * 6 + 2}px`, height: `${Math.random() * 6 + 2}px`, background: `rgba(255,255,255,${Math.random() * 0.5 + 0.2})`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 3 + 2}s` }} />
            ))}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute -top-1 -left-1 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 blur-sm opacity-80" />
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 blur-sm opacity-80" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 blur-sm opacity-80" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 blur-sm opacity-80" />
              <div className="relative bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden">
                <div className="relative">
                  <div className="absolute top-2 right-4 px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur text-white text-[10px] font-bold tracking-wider shadow-lg shadow-blue-500/40 border border-blue-300/30 z-10">SET PRIMARY</div>
                  <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-4 shadow-lg">
                    <h2 className="text-white font-bold text-lg drop-shadow-md pr-16">{assignment.title}</h2>
                    <p className="text-orange-100 text-xs font-medium mt-0.5">{assignment.className} • {assignment.subject}</p>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-y border-purple-500/20">
                  <p className="text-purple-200 text-center text-sm font-medium">Bài kiểm tra có: <span className="text-white font-bold">{totalQuestions} phần</span> — Tổng: <span className="text-white font-bold">{timeLimitMinutes || 0} phút</span></p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="relative rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-purple-900/60 via-indigo-900/60 to-violet-900/60 backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10" />
                    <div className="relative px-5 py-3 border-b border-blue-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40"><BookOpen className="w-5 h-5 text-white" /></div>
                        <div><h3 className="text-white font-bold text-base tracking-wide">{assignment.subject || 'BÀI KIỂM TRA'}</h3><p className="text-blue-300 text-xs font-medium">READING - WRITING</p></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-5">
                      <div className="relative rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 text-center border border-purple-500/20">
                        <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">ĐIỂM TỐI ĐA</div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500 drop-shadow-lg">{assignment.grading?.maxScore || 10}</div>
                        <div className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold mt-1">ĐIỂM</div>
                      </div>
                      <div className="relative rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 text-center border border-purple-500/20">
                        <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">THỜI GIAN</div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 drop-shadow-lg">{timeLimitMinutes || 0}</div>
                        <div className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold mt-1">PHÚT</div>
                      </div>
                    </div>
                    <div className="px-5 pb-4">
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-800/60 py-2 border border-purple-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white text-xs font-bold">Tổng cộng <span className="text-amber-400">{totalQuestions}</span> câu hỏi</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-amber-200 text-xs leading-relaxed"><strong className="font-bold text-amber-300">Lưu ý:</strong> Khi bắt đầu làm bài, bạn sẽ không thể tạm dừng. Hệ thống sẽ tự động nộp bài khi hết giờ. Đảm bảo bạn có đủ thời gian để hoàn thành.</div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => router.back()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-6 py-4 text-white font-semibold transition-all duration-300 hover:bg-white/20 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Quay lại
                    </button>
                    <button
                      onClick={handleStartQuiz}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white font-bold shadow-xl shadow-green-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/60 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Play className="w-5 h-5" />
                      Bắt đầu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showQuizStartModal && (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
          {/* Left Panel - Questions */}
          <div className="flex-1 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl shadow-2xl shadow-purple-900/30 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold">{assignment.title}</h2>
                    <p className="text-purple-300 text-xs">{assignment.subject} • READING - WRITING</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-purple-500/30 border border-purple-400/40 px-3 py-1 text-sm font-semibold text-purple-200">Tổng: {totalQuestions} câu</span>
                  <span className="rounded-lg bg-green-500/30 border border-green-400/40 px-3 py-1 text-sm font-medium text-green-300">Đã trả lời: {answeredCount}</span>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-16rem)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {questions.map((question, idx) => {
                const status = getQuestionStatus(question.id);
                const isAnswered = status === "answered";
                const isMarked = status === "marked";
                return (
                  <div key={question.id} id={`question-${question.id}`} className={`rounded-2xl border-2 transition-all backdrop-blur-sm ${isAnswered ? "border-green-500/50 bg-green-500/10" : isMarked ? "border-amber-500/50 bg-amber-500/10" : "border-purple-500/30 bg-purple-500/5 hover:border-purple-400/50"}`}>
                    <div className="px-5 py-4 border-b border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-lg ${isAnswered ? "bg-green-500 text-white" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"}`}>{idx + 1}</span>
                          <span className="font-semibold text-white text-sm leading-relaxed max-w-2xl">{question.questionText}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {question.points && <span className="rounded-lg bg-amber-500/20 border border-amber-400/30 px-2 py-1 text-xs font-medium text-amber-300">{question.points} điểm</span>}
                          {isAnswered && <button onClick={() => handleClearAnswer(question.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-400/30 hover:bg-rose-500/30 transition"><RotateCcw className="h-3 w-3" /> Xóa</button>}
                          <button onClick={() => handleMarkQuestion(question.id)} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium border transition ${isMarked ? "bg-amber-500/20 text-amber-300 border-amber-400/30" : "bg-slate-800/50 text-slate-400 border-slate-600/30 hover:bg-slate-700/50"}`}><Flag className="h-3 w-3" />{isMarked ? "Đã đánh dấu" : "Đánh dấu"}</button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {question.options.map((option, oIdx) => {
                        const isSelected = selectedAnswers[question.id] === option.id;
                        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                        return (
                          <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all backdrop-blur-sm ${isSelected ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20" : "border-purple-500/20 bg-slate-800/30 hover:border-blue-400/50 hover:bg-blue-500/10"}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner ${isSelected ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white" : "bg-purple-500/20 text-purple-300 border border-purple-400/30"}`}>
                              {letters[oIdx]}
                            </div>
                            <input type="radio" name={`question-${question.id}`} value={option.id} checked={isSelected} onChange={() => handleSelectAnswer(question.id, option.id)} className="sr-only" />
                            <span className={`flex-1 text-sm leading-relaxed ${isSelected ? "text-green-200 font-medium" : "text-slate-300"}`}>{option.text}</span>
                            {isSelected && <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Sidebar */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            {/* Timer Card */}
            {timeLimitMinutes && timeLimitMinutes > 0 && totalSeconds > 0 && (
              <div className={`rounded-2xl border p-4 backdrop-blur-xl shadow-lg ${isCritical ? "bg-rose-500/20 border-rose-500/50" : isUrgent ? "bg-amber-500/20 border-amber-500/50" : "bg-gradient-to-b from-indigo-900/60 to-purple-900/60 border-purple-500/40"}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/40">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <span className={`font-mono text-3xl font-black ${isCritical ? "text-rose-400" : isUrgent ? "text-amber-400" : "text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-400"}`}>{formatTime(timeRemaining)}</span>
                  <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${isCritical ? "bg-rose-500" : isUrgent ? "bg-amber-500" : "bg-gradient-to-r from-blue-500 to-purple-500"}`} style={{ width: `${timerPercentage}%` }} />
                  </div>
                  <span className="text-purple-300 text-xs font-medium">Thời gian còn lại</span>
                </div>
              </div>
            )}

            {/* Progress Card */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-4 shadow-lg shadow-purple-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Tiến độ</h3>
                </div>
                <span className="text-sm font-bold text-purple-300">{answeredCount}/{totalQuestions}</span>
              </div>
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
              </div>

              {/* Question grid */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((question, idx) => {
                  const status = getQuestionStatus(question.id);
                  const cls = status === "answered" ? "bg-green-500 text-white border-green-400/50" : status === "marked" ? "bg-amber-500 text-white border-amber-400/50" : "bg-slate-800 text-slate-400 border-slate-600/30 hover:bg-slate-700";
                  return (
                    <button key={question.id} onClick={() => { const el = document.getElementById(`question-${question.id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }} className={`flex items-center justify-center rounded-lg p-2 text-xs font-bold border transition-all hover:scale-105 ${cls}`} title={`Câu ${idx + 1}`}>{idx + 1}</button>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="space-y-2 border-t border-purple-500/20 pt-3">
                <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="text-slate-400">Đã trả lời</span></div><span className="font-bold text-green-400">{answeredCount}</span></div>
                <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-slate-400">Đã đánh dấu</span></div><span className="font-bold text-amber-400">{markedQuestions.size}</span></div>
                <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-slate-600" /><span className="text-slate-400">Chưa trả lời</span></div><span className="font-bold text-slate-400">{totalQuestions - answeredCount}</span></div>
              </div>

              {/* Completion */}
              <div className="mt-4 rounded-xl bg-slate-800/50 border border-purple-500/20 p-3 text-center">
                <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-1">Hoàn thành</p>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-purple-400">{Math.round((answeredCount / totalQuestions) * 100)}%</p>
              </div>
            </div>

            {/* Submit Button */}
            <button onClick={() => setShowSubmitModal(true)} disabled={!hasAnsweredAll || isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-green-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Nộp bài
            </button>
            {!hasAnsweredAll && totalQuestions > 0 && (
              <p className="text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">⚠️ Còn {totalQuestions - answeredCount} câu chưa trả lời</p>
            )}
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6"><h3 className="text-xl font-semibold text-gray-900">Xác nhận nộp bài</h3></div>
            <div className="p-6">
              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">Bạn có chắc chắn muốn hoàn thành bài trắc nghiệm <strong>{assignment.title}</strong>?</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Đã trả lời: {answeredCount}/{totalQuestions}</li>
                      <li>• Chưa trả lời: {totalQuestions - answeredCount}</li>
                      {timeLimitMinutes && timeLimitMinutes > 0 && <li>• Thời gian còn lại: {formatTime(timeRemaining)}</li>}
                      <li className="text-amber-600">• Hệ thống sẽ chấm điểm ngay lập tức</li>
                    </ul>
                  </div>
                </div>
              </div>
              {!hasAnsweredAll && <div className="mb-4 rounded-lg bg-amber-50 p-3"><p className="text-sm text-amber-700">⚠️ Bạn chưa trả lời hết {totalQuestions - answeredCount} câu hỏi.</p></div>}
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitModal(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Hủy</button>
                <button onClick={handleConfirmSubmit} disabled={!hasAnsweredAll || isSubmitting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{isSubmitting ? "Đang xử lý..." : "Xác nhận nộp bài"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {timeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100"><AlertTriangle className="h-8 w-8 text-rose-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Hết giờ làm bài!</h3>
              <p className="mt-2 text-sm text-gray-600">Thời gian làm bài đã kết thúc. Hệ thống sẽ tự động nộp bài của bạn.</p>
            </div>
            <div className="p-6">
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div><p className="text-sm text-gray-500">Đã trả lời</p><p className="text-xl font-bold text-green-600">{answeredCount}/{totalQuestions}</p></div>
                  <div><p className="text-sm text-gray-500">Chưa trả lời</p><p className="text-xl font-bold text-rose-600">{totalQuestions - answeredCount}</p></div>
                </div>
              </div>
              <button onClick={handleAutoSubmit} disabled={isSubmitting} className="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{isSubmitting ? "Đang nộp bài..." : "Nộp bài ngay"}</button>
            </div>
          </div>
        </div>
      )}

      {showLeaveWarning && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"><AlertTriangle className="h-8 w-8 text-amber-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Cảnh báo rời khỏi trang</h3>
              <p className="mt-2 text-sm text-gray-600">Bạn đang làm bài thi. Nếu rời khỏi, hệ thống sẽ tự động nộp bài với những câu đã trả lời.</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                <div className="flex items-center gap-2 mb-1"><Timer className="h-4 w-4" /><span className="font-medium">Thời gian còn lại:</span><span className="font-bold">{formatTime(timeRemaining)}</span></div>
                <div className="flex items-center gap-2"><List className="h-4 w-4" /><span className="font-medium">Đã trả lời:</span><span className="font-bold">{answeredCount}/{totalQuestions}</span></div>
                <div className="flex items-center gap-2 mt-1"><LogOut className="h-4 w-4" /><span className="font-medium">Sẽ tự động nộp:</span><span className="font-bold text-amber-800">Những câu đã trả lời</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleStay} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Ở lại trang</button>
                <button onClick={handleConfirmLeave} disabled={isAutoSubmitting} className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer">{isAutoSubmitting ? "Đang nộp..." : "Rời khỏi & Nộp bài"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
