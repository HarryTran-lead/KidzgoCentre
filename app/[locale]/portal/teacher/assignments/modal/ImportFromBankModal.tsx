"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  Database,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { getActiveProgramsForDropdown, getAllProgramsForDropdown } from "@/lib/api/programService";
import { fetchQuestionBankItems } from "@/lib/api/homeworkService";
import type {
  QuestionBankDifficulty,
  QuestionBankItem,
} from "@/types/teacher/homework";

type ImportedQuestion = {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  points: number;
};

interface ImportFromBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: ImportedQuestion[]) => void;
}

const LEVEL_OPTIONS: Array<{
  value: "ALL" | QuestionBankDifficulty;
  label: string;
}> = [
  { value: "ALL", label: "Tat ca" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

function isMultipleChoiceQuestion(question: QuestionBankItem) {
  const questionType = String(question.questionType || "").trim().toLowerCase();
  return [
    "multiplechoice",
    "multiple_choice",
    "multiple-choice",
    "mcq",
  ].includes(questionType);
}

function normalizeCorrectIndex(question: QuestionBankItem) {
  const correctAnswer = String(question.correctAnswer ?? "").trim();
  if (/^\d+$/.test(correctAnswer)) {
    return Number(correctAnswer);
  }

  const matchedIndex = question.options.findIndex(
    (option) => option.trim().toLowerCase() === correctAnswer.toLowerCase()
  );
  return matchedIndex >= 0 ? matchedIndex : 0;
}

function toImportedQuestion(question: QuestionBankItem): ImportedQuestion {
  const correctIndex = normalizeCorrectIndex(question);
  return {
    id: crypto.randomUUID(),
    question: question.questionText,
    options: question.options.map((option, index) => ({
      id: crypto.randomUUID(),
      text: option,
      isCorrect: index === correctIndex,
    })),
    explanation: question.explanation || undefined,
    points: question.points || 1,
  };
}

export function ImportFromBankModal({
  isOpen,
  onClose,
  onImport,
}: ImportFromBankModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"ALL" | QuestionBankDifficulty>("ALL");
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const loadPrograms = async () => {
      setIsLoadingPrograms(true);
      try {
        const activePrograms = await getActiveProgramsForDropdown();
        const response =
          activePrograms.length > 0
            ? activePrograms
            : (await getAllProgramsForDropdown()).filter(
                (program) => program.isActive !== false
              );
        const mappedPrograms = response.map((program) => ({
          id: program.id,
          name: program.name || program.code || program.id,
        }));

        setPrograms(mappedPrograms);
        setSelectedProgramId((current) => current || mappedPrograms[0]?.id || "");
      } catch (loadError) {
        console.error("Error loading programs:", loadError);
        setPrograms([]);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    loadPrograms();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      setError(null);

      const response = await fetchQuestionBankItems({
        programId: selectedProgramId || undefined,
        level: selectedLevel === "ALL" ? undefined : selectedLevel,
        pageNumber: 1,
        pageSize: 100,
      });

      if (response.ok) {
        setQuestions(response.data.filter(isMultipleChoiceQuestion));
      } else {
        setQuestions([]);
        setError(response.error || "Khong tai duoc ngan hang cau hoi.");
      }

      setIsLoadingQuestions(false);
    };

    loadQuestions();
  }, [isOpen, selectedProgramId, selectedLevel]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProgramId("");
      setSelectedQuestionIds([]);
      setSearchTerm("");
      setQuestions([]);
      setError(null);
    }
  }, [isOpen]);

  const programOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    programs.forEach((program) => {
      if (!program.id) return;
      map.set(program.id, program);
    });

    questions.forEach((question) => {
      if (!question.programId) return;
      if (map.has(question.programId)) return;

      map.set(question.programId, {
        id: question.programId,
        name: question.programName || question.programId,
      });
    });

    return Array.from(map.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "vi")
    );
  }, [programs, questions]);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return questions;
    }

    return questions.filter((question) => {
      const haystacks = [
        question.questionText,
        question.level,
        question.programName,
        ...question.options,
      ];
      return haystacks.some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [questions, searchTerm]);

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    );
  };

  const handleImport = () => {
    const selectedQuestions = questions
      .filter((question) => selectedQuestionIds.includes(question.id))
      .map(toImportedQuestion);

    if (selectedQuestions.length === 0) {
      return;
    }

    onImport(selectedQuestions);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2">
                <Database size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Import tu ngan hang cau hoi
                </h2>
                <p className="text-sm text-red-100">
                  Lay cau hoi that tu backend va dua vao quiz builder hien tai.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white transition hover:bg-white/20"
              aria-label="Dong modal"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-gray-200 p-6 md:grid-cols-[1.1fr_0.7fr_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Program</label>
            <select
              value={selectedProgramId}
              onChange={(event) => setSelectedProgramId(event.target.value)}
              disabled={isLoadingPrograms && programOptions.length === 0}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isLoadingPrograms && programOptions.length === 0
                  ? "Dang tai program..."
                  : "Tat ca program"}
              </option>
              {programOptions.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Do kho</label>
            <select
              value={selectedLevel}
              onChange={(event) =>
                setSelectedLevel(event.target.value as "ALL" | QuestionBankDifficulty)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Tim kiem</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Noi dung cau hoi, dap an..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-10 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoadingQuestions ? (
            <div className="flex min-h-[280px] items-center justify-center gap-3 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Dang tai cau hoi...</span>
            </div>
          ) : filteredQuestions.length > 0 ? (
            <div className="space-y-3">
              {filteredQuestions.map((question) => {
                const isSelected = selectedQuestionIds.includes(question.id);
                const correctIndex = normalizeCorrectIndex(question);

                return (
                  <div
                    key={question.id}
                    onClick={() => toggleQuestion(question.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-red-200 hover:bg-red-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestion(question.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {question.questionText}
                          </span>
                          {question.level && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              {question.level}
                            </span>
                          )}
                          {question.programName && (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              {question.programName}
                            </span>
                          )}
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            {question.points || 1} diem
                          </span>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          {question.options.map((option, index) => (
                            <div
                              key={`${question.id}-${index}`}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                index === correctIndex
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="mt-3 text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">
                              Giai thich:
                            </span>{" "}
                            {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <Database size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-600">Khong tim thay cau hoi nao</p>
              <p className="mt-1 text-sm text-gray-400">
                Thu doi program, do kho hoac tu khoa tim kiem.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Da chon{" "}
              <span className="font-semibold text-red-600">
                {selectedQuestionIds.length}
              </span>{" "}
              cau hoi
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Huy
              </button>
              <button
                onClick={handleImport}
                disabled={selectedQuestionIds.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle size={16} />
                Import {selectedQuestionIds.length} cau hoi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
