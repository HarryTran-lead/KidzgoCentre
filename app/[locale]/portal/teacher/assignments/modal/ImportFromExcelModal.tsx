// components/teacher/assignments/ImportFromExcelModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, Download, AlertCircle, Table, CheckCircle } from "lucide-react";

interface ImportFromExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: any[]) => void;
}

export function ImportFromExcelModal({ isOpen, onClose, onImport }: ImportFromExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const loadXlsxModule = async () => {
    try {
      return await import("xlsx");
    } catch (err) {
      console.error(err);
      setError("Chua the dung tinh nang Excel vi thieu thu vien xlsx.");
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setError("");
    setIsProcessing(true);

    try {
      const XLSX = await loadXlsxModule();
      if (!XLSX) {
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedQuestions = jsonData.map((row: any, index: number) => {
        const options = [
          row["Option A"] || row["Lựa chọn A"] || "",
          row["Option B"] || row["Lựa chọn B"] || "",
          row["Option C"] || row["Lựa chọn C"] || "",
          row["Option D"] || row["Lựa chọn D"] || ""
        ].filter(opt => opt);

        let correctIndex = -1;
        const correctAnswer = row["Correct Answer"] || row["Đáp án đúng"] || "";
        if (correctAnswer === "A" || correctAnswer === "a") correctIndex = 0;
        else if (correctAnswer === "B" || correctAnswer === "b") correctIndex = 1;
        else if (correctAnswer === "C" || correctAnswer === "c") correctIndex = 2;
        else if (correctAnswer === "D" || correctAnswer === "d") correctIndex = 3;

        return {
          id: `temp-${index}`,
          question: row["Question"] || row["Câu hỏi"] || "",
          program: row["Program"] || row["Chương trình"] || "",
          options,
          correctIndex,
          explanation: row["Explanation"] || row["Giải thích"] || "",
          points: parseInt(row["Points"] || row["Điểm"] || "10"),
          isValid: row["Question"] || row["Câu hỏi"] ? (options.length >= 2 && correctIndex !== -1) : false
        };
      });

      setPreviewData(parsedQuestions);
    } catch (err) {
      setError("Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await loadXlsxModule();
    if (!XLSX) {
      return;
    }

    const template = [
      {
        "Question": "What is the capital of Vietnam?",
        "Program": "Cambridge Flyers",
        "Option A": "Hanoi",
        "Option B": "Ho Chi Minh City",
        "Option C": "Da Nang",
        "Option D": "Hai Phong",
        "Correct Answer": "A",
        "Explanation": "Hanoi is the capital city of Vietnam",
        "Points": 10
      },
      {
        "Question": "Which of the following is a renewable energy source?",
        "Program": "Cambridge Flyers",
        "Option A": "Coal",
        "Option B": "Natural Gas",
        "Option C": "Solar Power",
        "Option D": "Nuclear",
        "Correct Answer": "C",
        "Explanation": "Solar power is renewable and sustainable",
        "Points": 10
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "multiple_choice_template.xlsx");
  };

  const handleImport = () => {
    const validQuestions = previewData.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      setError("Không có câu hỏi hợp lệ để import");
      return;
    }

    const formattedQuestions = validQuestions.map(q => ({
      id: crypto.randomUUID(),
      question: q.question,
      program: q.program || undefined,
      options: q.options.map((opt: string) => ({
        id: crypto.randomUUID(),
        text: opt,
        isCorrect: false
      })),
      explanation: q.explanation || undefined,
      points: q.points
    }));

    formattedQuestions.forEach((q, idx) => {
      const correctIndex = previewData.filter(p => p.isValid)[idx].correctIndex;
      if (correctIndex !== -1 && q.options[correctIndex]) {
        q.options[correctIndex].isCorrect = true;
      }
    });

    onImport(formattedQuestions);
    onClose();
    setFile(null);
    setPreviewData([]);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      const event = { target: { files: [files[0]] } } as any;
      handleFileUpload(event);
    }
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
                <Table size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Import từ Excel
                </h2>
                <p className="text-sm text-red-100">
                  Tải file Excel có cấu trúc mẫu và import câu hỏi
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {!previewData.length && !isProcessing && (
            <div className="text-center py-4">
              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                >
                  <Download size={16} />
                  Tải file mẫu Excel
                </button>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-red-300 hover:bg-red-50/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-base text-gray-600 font-medium">Kéo thả file Excel vào đây hoặc click để chọn</p>
                <p className="text-sm text-gray-400 mt-2">Hỗ trợ .xlsx, .xls, .csv</p>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-medium text-left">{error}</p>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Đang xử lý file...</p>
            </div>
          )}

          {previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">
                    Tổng số câu hỏi: <span className="font-bold text-gray-900">{previewData.length}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Hợp lệ: <span className="font-bold text-emerald-600">{previewData.filter(q => q.isValid).length}</span>
                    {" | "}
                    Không hợp lệ: <span className="font-bold text-red-600">{previewData.filter(q => !q.isValid).length}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setError("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <X size={14} />
                  Xóa file
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {previewData.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-xl ${
                      q.isValid ? "border-gray-200" : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        q.isValid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {idx + 1}
                      </div>
                  <div className="flex-1">
                        <p className="font-medium text-gray-900">{q.question || "Không có câu hỏi"}</p>
                        {q.program && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            Chương trình: {q.program}
                          </p>
                        )}
                        {q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  optIdx === q.correctIndex
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                    : "bg-gray-50 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {!q.isValid && (
                          <p className="mt-2 text-xs text-red-600">
                            {!q.question && "Thiếu câu hỏi. "}
                            {q.options.length < 2 && "Cần ít nhất 2 lựa chọn. "}
                            {q.correctIndex === -1 && "Chưa chọn đáp án đúng."}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Giải thích:</span> {q.explanation}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          Điểm: {q.points}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setError("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={previewData.filter(q => q.isValid).length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Import {previewData.filter(q => q.isValid).length} câu hỏi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
