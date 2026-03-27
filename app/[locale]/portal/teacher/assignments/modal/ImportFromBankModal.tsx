// components/teacher/assignments/ImportFromBankModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, Database, CheckCircle } from "lucide-react";

interface ImportFromBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: any[]) => void;
}

export function ImportFromBankModal({ isOpen, onClose, onImport }: ImportFromBankModalProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Mock data - thay bằng API call thực tế
  const bankQuestions = [
    {
      id: "1",
      question: "What is the capital of Vietnam?",
      options: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong"],
      correctAnswer: "0",
      explanation: "Hanoi is the capital city of Vietnam",
      points: 10,
      category: "Geography",
      difficulty: "Easy"
    },
    {
      id: "2",
      question: "Which of the following is a renewable energy source?",
      options: ["Coal", "Natural Gas", "Solar Power", "Nuclear"],
      correctAnswer: "2",
      explanation: "Solar power is renewable and sustainable",
      points: 10,
      category: "Science",
      difficulty: "Medium"
    },
    {
      id: "3",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "1",
      explanation: "2 + 2 equals 4",
      points: 5,
      category: "Math",
      difficulty: "Easy"
    },
    {
      id: "4",
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: "1",
      explanation: "William Shakespeare wrote Romeo and Juliet",
      points: 10,
      category: "Literature",
      difficulty: "Medium"
    }
  ];

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredQuestions = bankQuestions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleQuestion = (question: any) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.id === question.id);
      if (exists) {
        return prev.filter(q => q.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  const handleImport = () => {
    const formattedQuestions = selectedQuestions.map(q => ({
      id: crypto.randomUUID(),
      question: q.question,
      options: q.options.map((opt: string, idx: number) => ({
        id: crypto.randomUUID(),
        text: opt,
        isCorrect: idx === parseInt(q.correctAnswer)
      })),
      explanation: q.explanation,
      points: q.points
    }));
    onImport(formattedQuestions);
    onClose();
    setSelectedQuestions([]);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Database size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Import từ ngân hàng câu hỏi
                </h2>
                <p className="text-sm text-red-100">
                  Chọn câu hỏi từ ngân hàng câu hỏi có sẵn
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 pb-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm câu hỏi theo nội dung hoặc danh mục..."
              className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-colors"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Question List */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-280px)]">
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedQuestions.find(sq => sq.id === q.id)
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                }`}
                onClick={() => toggleQuestion(q)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.find(sq => sq.id === q.id) !== undefined}
                    onChange={() => toggleQuestion(q)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-200 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">{q.question}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                        {q.category || "Uncategorized"}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        q.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                        q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-4">
                      {q.options.map((opt: string, idx: number) => (
                        <div
                          key={idx}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            idx === parseInt(q.correctAnswer)
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-2 ml-4 text-xs text-gray-500">
                        <span className="font-medium">Giải thích:</span> {q.explanation}
                      </div>
                    )}
                    <div className="mt-2 ml-4 text-xs font-semibold text-red-600">
                      Điểm: {q.points}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Database size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Không tìm thấy câu hỏi nào</p>
              <p className="text-sm text-gray-400 mt-1">Thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Đã chọn <span className="font-bold text-red-600">{selectedQuestions.length}</span> câu hỏi
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={selectedQuestions.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Import {selectedQuestions.length} câu hỏi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
