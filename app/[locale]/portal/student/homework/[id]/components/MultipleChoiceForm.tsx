"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
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
  
  // ========== STATE DECLARATIONS ==========
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
  
  // ========== REFS ==========
  const hasAutoSubmitted = useRef(false);
  const isDirty = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number>(0);
  const remainingOnLeaveRef = useRef<number>(0);
  
  // ========== ROUTER ==========
  const router = useRouter();
  const pathname = usePathname();

  // ========== DERIVED VALUES (calculated after state) ==========
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const hasAnsweredAll = answeredCount === totalQuestions && totalQuestions > 0;
  
  // Timer related
  const timeLimitMinutes = assignment.timeLimitMinutes;
  const totalSeconds = timeLimitMinutes && timeLimitMinutes > 0 ? timeLimitMinutes * 60 : 0;
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  
  // UI helpers
  const isUrgent = timeRemaining > 0 && timeRemaining <= 5 * 60;
  const isCritical = timeRemaining > 0 && timeRemaining <= 60;
  const timerPercentage = totalSeconds > 0 ? (timeRemaining / totalSeconds) * 100 : 0;

  // ========== HELPER FUNCTIONS ==========
  const getStorageKey = useCallback((suffix: string = "") => {
    return `quiz_${homeworkId}${suffix}`;
  }, [homeworkId]);

  // ========== CORE FUNCTIONS (defined in order of usage) ==========
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      if (totalQuestions === 0) {
        onError("Bài trắc nghiệm chưa có câu hỏi để học sinh làm.");
        setIsSubmitting(false);
        return;
      }

      if (!isAutoSubmit) {
        const unanswered = questions.find((q) => !selectedAnswers[q.id]);
        if (unanswered) {
          onError("Vui lòng chọn đáp án cho tất cả câu hỏi trước khi nộp.");
          setIsSubmitting(false);
          return;
        }
      }

      const payload: SubmitMultipleChoicePayload = {
        homeworkStudentId: homeworkId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: selectedAnswers[q.id] || "",
        })),
      };

      const response = await submitMultipleChoiceHomework(payload);
      if (response.isSuccess) {
        hasAutoSubmitted.current = true;
        localStorage.setItem(getStorageKey("_submitted"), "true");
        onSubmitSuccess();
      } else {
        onError(response.message || "Không thể nộp bài trắc nghiệm");
        setIsTimerActive(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      onError("Đã xảy ra lỗi khi nộp bài");
      setIsTimerActive(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, totalQuestions, questions, selectedAnswers, homeworkId, onSubmitSuccess, onError, stopTimer, getStorageKey]);

  const autoSubmitAndLeave = useCallback(async () => {
    if (isAutoSubmitting || hasAutoSubmitted.current) return;
    
    setIsAutoSubmitting(true);
    stopTimer();
    
    try {
      const payload: SubmitMultipleChoicePayload = {
        homeworkStudentId: homeworkId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: selectedAnswers[q.id] || "",
        })),
      };

      const response = await submitMultipleChoiceHomework(payload);
      if (response.isSuccess) {
        hasAutoSubmitted.current = true;
        localStorage.setItem(getStorageKey("_submitted"), "true");
        onSubmitSuccess();
        return true;
      } else {
        onError(response.message || "Không thể nộp bài trắc nghiệm");
        return false;
      }
    } catch (err) {
      console.error("Error auto-submitting quiz:", err);
      onError("Đã xảy ra lỗi khi nộp bài");
      return false;
    } finally {
      setIsAutoSubmitting(false);
    }
  }, [isAutoSubmitting, questions, selectedAnswers, homeworkId, onSubmitSuccess, onError, stopTimer, getStorageKey]);

  const handleNavigationAttempt = useCallback(async (targetUrl?: string) => {
    if (hasAutoSubmitted.current || isSubmitting) {
      if (targetUrl) {
        router.push(targetUrl);
      }
      return;
    }

    setShowLeaveWarning(true);
    setPendingNavigation(targetUrl || null);
  }, [router, isSubmitting]);

  const handleConfirmLeave = useCallback(async () => {
    setShowLeaveWarning(false);
    
    const submitted = await autoSubmitAndLeave();
    
    if (submitted && pendingNavigation) {
      router.push(pendingNavigation);
    } else if (submitted) {
      router.back();
    }
    
    setPendingNavigation(null);
  }, [autoSubmitAndLeave, pendingNavigation, router]);

  const handleStay = useCallback(() => {
    setShowLeaveWarning(false);
    setPendingNavigation(null);
    window.history.pushState(null, "", window.location.href);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    if (!homeworkId || !assignment) return;
    setShowSubmitModal(false);
    submitQuiz(false);
  }, [homeworkId, assignment, submitQuiz]);

  const handleAutoSubmit = useCallback(() => {
    setTimeUpModal(false);
    submitQuiz(true);
  }, [submitQuiz]);

  // ========== EFFECTS ==========
  // Notify parent about unsaved changes
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(isDirty.current);
    }
  }, [selectedAnswers, onUnsavedChanges]);

  // Initialize from localStorage
  useEffect(() => {
    const storageKey = getStorageKey();
    
    const savedAnswers = localStorage.getItem(`${storageKey}_answers`);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setSelectedAnswers(parsed);
        if (Object.keys(parsed).length > 0) {
          isDirty.current = true;
        }
      } catch {
        // ignore
      }
    }

    const savedMarked = localStorage.getItem(`${storageKey}_marked`);
    if (savedMarked) {
      try {
        setMarkedQuestions(new Set(JSON.parse(savedMarked)));
      } catch {
        // ignore
      }
    }

    const savedStartTime = localStorage.getItem(`${storageKey}_startTime`);
    const savedRemaining = localStorage.getItem(`${storageKey}_remaining`);
    const savedSubmitted = localStorage.getItem(`${storageKey}_submitted`);
    const savedLastActive = localStorage.getItem(`${storageKey}_lastActive`);

    if (savedSubmitted === "true") {
      setIsInitialized(true);
      return;
    }

    if (savedStartTime && savedRemaining) {
      const remaining = parseInt(savedRemaining, 10);
      const lastActive = savedLastActive ? parseInt(savedLastActive, 10) : Date.now();
      const elapsed = Math.floor((Date.now() - lastActive) / 1000);
      const newRemaining = Math.max(0, remaining - elapsed);

      if (newRemaining <= 0) {
        setTimeRemaining(0);
        setIsTimerActive(false);
        setTimeUpModal(true);
      } else {
        setTimeRemaining(newRemaining);
        remainingOnLeaveRef.current = newRemaining;
        timerStartTimeRef.current = Date.now();
        localStorage.setItem(`${storageKey}_startTime`, String(Date.now()));
        localStorage.setItem(`${storageKey}_remaining`, String(newRemaining));
      }
    } else if (totalSeconds > 0) {
      const now = Date.now();
      timerStartTimeRef.current = now;
      remainingOnLeaveRef.current = totalSeconds;
      localStorage.setItem(`${storageKey}_startTime`, String(now));
      localStorage.setItem(`${storageKey}_remaining`, String(totalSeconds));
      localStorage.setItem(`${storageKey}_lastActive`, String(now));
    }

    setIsInitialized(true);
  }, [getStorageKey, totalSeconds]);

  // Save state to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    const storageKey = getStorageKey();
    localStorage.setItem(`${storageKey}_answers`, JSON.stringify(selectedAnswers));
    localStorage.setItem(`${storageKey}_marked`, JSON.stringify([...markedQuestions]));
    localStorage.setItem(`${storageKey}_lastActive`, String(Date.now()));
  }, [selectedAnswers, markedQuestions, isInitialized, getStorageKey]);

  // Update last active timestamp
  useEffect(() => {
    if (!isInitialized) return;
    
    const updateLastActive = () => {
      const storageKey = getStorageKey();
      localStorage.setItem(`${storageKey}_lastActive`, String(Date.now()));
    };

    const interval = setInterval(updateLastActive, 5000);
    return () => clearInterval(interval);
  }, [isInitialized, getStorageKey]);

  // Countdown timer
  useEffect(() => {
    if (!isInitialized) return;
    if (!totalSeconds || totalSeconds <= 0 || !isTimerActive) return;
    if (hasAutoSubmitted.current || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsTimerActive(false);
          setTimeUpModal(true);
          localStorage.setItem(getStorageKey("_submitted"), "true");
          return 0;
        }

        const newTime = prev - 1;

        if (newTime === 5 * 60 && !countdownWarning) {
          setCountdownWarning(true);
          setTimeout(() => setCountdownWarning(false), 5000);
        }

        if (newTime === 60) {
          setCountdownWarning(true);
          setTimeout(() => setCountdownWarning(false), 5000);
        }

        if (newTime % 10 === 0) {
          localStorage.setItem(getStorageKey("_remaining"), String(newTime));
          localStorage.setItem(getStorageKey("_startTime"), String(Date.now()));
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [totalSeconds, isTimerActive, timeRemaining, countdownWarning, isInitialized, getStorageKey]);

  // Navigation warning
  useEffect(() => {
    if (!isInitialized || hasAutoSubmitted.current || isSubmitting) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleNavigationAttempt();
      window.history.pushState(null, "", window.location.href);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAutoSubmitted.current) return;
      e.preventDefault();
      e.returnValue = "Bạn chưa hoàn thành bài làm. Bạn có chắc muốn rời khỏi?";
      return e.returnValue;
    };

    const handleLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const isInternal = href.startsWith("/") && !href.startsWith("//");
      
      if (isInternal && !hasAutoSubmitted.current) {
        e.preventDefault();
        e.stopPropagation();
        await handleNavigationAttempt(href);
      }
    };

    const handleFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form && !hasAutoSubmitted.current) {
        e.preventDefault();
        handleNavigationAttempt();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("submit", handleFormSubmit, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
      document.removeEventListener("submit", handleFormSubmit, true);
    };
  }, [isInitialized, isSubmitting, handleNavigationAttempt]);

  // ========== RENDER LOGIC ==========
  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    isDirty.current = true;
  };

  const handleClearAnswer = (questionId: string) => {
    setSelectedAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
  };

  const handleMarkQuestion = (questionId: string) => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (totalQuestions === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="flex flex-col items-center justify-center text-center">
          <BookOpen className="h-16 w-16 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có câu hỏi
          </h3>
          <p className="text-gray-500">
            Bài trắc nghiệm này hiện chưa có câu hỏi nào.
          </p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {/* Countdown Warning Toast */}
      {countdownWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] bg-amber-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <AlertTriangle size={24} />
          <div>
            <div className="font-semibold">
              {timeRemaining <= 60 ? "Chỉ còn 1 phút!" : "Còn 5 phút!"}
            </div>
            <div className="text-sm text-amber-100">
              {timeRemaining <= 60
                ? "Vui lòng nhanh chóng hoàn thành bài thi."
                : "Vui lòng kiểm tra lại các câu hỏi đã đánh dấu."}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Left Panel */}
        <div className="flex-1 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden flex flex-col">
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  Tổng số {totalQuestions} câu hỏi
                </span>
                <span className="rounded-lg bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Đã trả lời: {answeredCount}
                </span>
              </div>

              {timeLimitMinutes && timeLimitMinutes > 0 && totalSeconds > 0 && (
                <div className="relative md:hidden">
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono font-bold text-lg transition-all ${
                    isCritical
                      ? "bg-rose-100 text-rose-700 animate-pulse ring-2 ring-rose-400"
                      : isUrgent
                      ? "bg-amber-100 text-amber-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}>
                    <Timer className="h-5 w-5" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-12rem)]">
            {questions.map((question, idx) => {
              const status = getQuestionStatus(question.id);
              const isAnswered = status === "answered";
              const isMarked = status === "marked";

              return (
                <div
                  key={question.id}
                  id={`question-${question.id}`}
                  className={`rounded-xl border-2 transition-all ${
                    isAnswered
                      ? "border-green-200 bg-gradient-to-r from-green-50 to-white"
                      : isMarked
                      ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {question.questionText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.points && (
                          <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                            {question.points} điểm
                          </span>
                        )}
                        {isAnswered && (
                          <button
                            onClick={() => handleClearAnswer(question.id)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
                            title="Xóa câu trả lời"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Xóa đáp án
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkQuestion(question.id)}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                            isMarked
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-white text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Flag className="h-3 w-3" />
                          {isMarked ? "Đã đánh dấu" : "Đánh dấu"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    {question.options.map((option) => {
                      const isSelected = selectedAnswers[question.id] === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.id}
                            checked={isSelected}
                            onChange={() => handleSelectAnswer(question.id, option.id)}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm text-gray-700">{option.text}</span>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 flex-shrink-0">
          <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden sticky top-6">
            {timeLimitMinutes && timeLimitMinutes > 0 && totalSeconds > 0 && (
              <div className={`p-4 border-b transition-colors ${
                isCritical
                  ? "bg-rose-50 border-rose-200"
                  : isUrgent
                  ? "bg-amber-50 border-amber-200"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-100"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <Clock className={`h-5 w-5 ${
                    isCritical ? "text-rose-600 animate-pulse" : isUrgent ? "text-amber-600" : "text-indigo-600"
                  }`} />
                  <span className={`font-mono text-2xl font-bold ${
                    isCritical ? "text-rose-600" : isUrgent ? "text-amber-600" : "text-indigo-700"
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${
                    isCritical ? "bg-rose-500" : isUrgent ? "bg-amber-500" : "bg-indigo-500"
                  }`} style={{ width: `${timerPercentage}%` }} />
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">Thời gian còn lại</p>
              </div>
            )}

            <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Tiến độ</h3>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {answeredCount}/{totalQuestions}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((question, idx) => {
                  const status = getQuestionStatus(question.id);
                  let statusClass = "";
                  if (status === "answered") statusClass = "bg-green-500 text-white";
                  else if (status === "marked") statusClass = "bg-amber-500 text-white";
                  else statusClass = "bg-gray-200 text-gray-600 hover:bg-gray-300";

                  return (
                    <button
                      key={question.id}
                      onClick={() => {
                        const element = document.getElementById(`question-${question.id}`);
                        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className={`cursor-pointer relative flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-all hover:scale-105 ${statusClass}`}
                      title={`Câu ${idx + 1}: ${status === "answered" ? "Đã trả lời" : status === "marked" ? "Đã đánh dấu" : "Chưa trả lời"}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-gray-600">Đã trả lời</span>
                  </div>
                  <span className="font-medium text-gray-700">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-gray-600">Đã đánh dấu</span>
                  </div>
                  <span className="font-medium text-gray-700">{markedQuestions.size}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                    <span className="text-gray-600">Chưa trả lời</span>
                  </div>
                  <span className="font-medium text-gray-700">{totalQuestions - answeredCount}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-3 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Hoàn thành</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((answeredCount / totalQuestions) * 100)}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={!hasAnsweredAll || isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Nộp bài
              </button>
              {!hasAnsweredAll && totalQuestions > 0 && (
                <p className="mt-2 text-center text-xs text-amber-600">
                  ⚠️ Bạn còn {totalQuestions - answeredCount} câu chưa trả lời
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900">Xác nhận nộp bài</h3>
            </div>
            <div className="p-6">
              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">
                      Bạn có chắc chắn muốn hoàn thành bài trắc nghiệm{" "}
                      <strong className="font-semibold">{assignment.title}</strong>?
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Số câu đã trả lời: {answeredCount}/{totalQuestions}</li>
                      <li>• Câu chưa trả lời: {totalQuestions - answeredCount}</li>
                      {timeLimitMinutes && timeLimitMinutes > 0 && (
                        <li>• Thời gian còn lại: {formatTime(timeRemaining)}</li>
                      )}
                      <li className="text-amber-600">• Sau khi nộp, hệ thống sẽ chấm điểm ngay lập tức</li>
                    </ul>
                  </div>
                </div>
              </div>
              {!hasAnsweredAll && (
                <div className="mb-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-sm text-amber-700">
                    ⚠️ Bạn chưa trả lời hết {totalQuestions - answeredCount} câu hỏi.
                    Vui lòng hoàn thành tất cả câu hỏi trước khi nộp.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitModal(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer">
                  Hủy
                </button>
                <button onClick={handleConfirmSubmit} disabled={!hasAnsweredAll || isSubmitting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận nộp bài"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time's Up Modal */}
      {timeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
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
              <button onClick={handleAutoSubmit} disabled={isSubmitting} className="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? "Đang nộp bài..." : "Nộp bài ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Warning Modal */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
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
                <button onClick={handleStay} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer">Ở lại trang</button>
                <button onClick={handleConfirmLeave} disabled={isAutoSubmitting} className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                  {isAutoSubmitting ? "Đang nộp..." : "Rời khỏi & Nộp bài"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}