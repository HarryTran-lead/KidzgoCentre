"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Loader2,
  MessageCircle,
  Mic,
  RotateCcw,
  Settings2,
  Square,
  UploadCloud,
  Volume2,
  VolumeX,
  WandSparkles,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  analyzeStudentSpeakingPractice,
  converseStudentSpeaking,
  getStudentHomeworkById,
} from "@/lib/api/studentService";
import type {
  AssignmentDetail,
  HomeworkSpeakingAnalysisResult,
  SpeakingConversationTurn,
  SpeakingTopic,
  SpeakingTopicOption,
} from "@/types/student/homework";

function ResultPills({
  title,
  items,
  tone = "cyan",
}: {
  title: string;
  items?: string[];
  tone?: "purple" | "blue" | "amber" | "emerald" | "rose" | "cyan" | "pink";
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const toneClassMap = {
    purple: "border-purple-400/30 bg-purple-500/15 text-purple-100",
    pink: "border-pink-400/30 bg-pink-500/15 text-pink-100",
    blue: "border-blue-400/30 bg-blue-500/15 text-blue-100",
    amber: "border-amber-400/30 bg-amber-500/15 text-amber-100",
    emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    rose: "border-rose-400/30 bg-rose-500/15 text-rose-100",
    cyan: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  };

  const toneClass = toneClassMap[tone] || toneClassMap.cyan;

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${title}-${index}-${item}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function WarningsBlock({ warnings }: { warnings?: string[] }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="mb-2 text-sm font-bold text-amber-200 flex items-center gap-2">
        <AlertCircle size={14} />
        Lưu ý từ AI
      </div>
      <ul className="space-y-1 text-sm text-amber-50/85">
        {warnings.map((warning, index) => (
          <li key={`speaking-warning-${index}`} className="leading-relaxed">
            • {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpeakingResultCard({
  title,
  result,
}: {
  title: string;
  result: HomeworkSpeakingAnalysisResult;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-5 backdrop-blur-xl shadow-xl shadow-purple-500/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            {title}
          </div>
          {result.summary ? (
            <p className="mt-1 text-sm leading-relaxed text-purple-200/70">
              {result.summary}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {result.stars !== undefined ? (
            <span className="rounded-full border border-yellow-400/30 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-100">
              ⭐ {result.stars} sao
            </span>
          ) : null}
          {result.overallScore !== undefined ? (
            <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-100">
              Tổng điểm {result.overallScore}
            </span>
          ) : null}
        </div>
      </div>

      {(result.pronunciationScore !== undefined ||
        result.fluencyScore !== undefined ||
        result.accuracyScore !== undefined) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-purple-500/30 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-wide text-purple-400 font-bold">
              Phát âm
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-200">
              {result.pronunciationScore ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-wide text-purple-400 font-bold">
              Trôi chảy
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-200">
              {result.fluencyScore ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-wide text-purple-400 font-bold">
              Chính xác
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-200">
              {result.accuracyScore ?? "—"}
            </div>
          </div>
        </div>
      )}

      {result.transcript ? (
        <div className="rounded-xl border border-purple-500/30 bg-slate-900/80 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-purple-400 font-bold">
            AI nghe được
          </div>
          <div className="text-sm leading-relaxed text-purple-100">
            "{result.transcript}"
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? "Thu gọn chi tiết" : "Xem thêm chi tiết"}
      </button>

      {expanded && (
        <div className="space-y-4 pt-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <ResultPills title="Điểm mạnh" items={result.strengths} tone="emerald" />
            <ResultPills title="Cần cải thiện" items={result.issues} tone="rose" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ResultPills
              title="Từ cần luyện"
              items={result.mispronouncedWords}
              tone="amber"
            />
            <ResultPills title="Kế hoạch luyện tập" items={result.practicePlan} tone="blue" />
          </div>

          <ResultPills title="Gợi ý tiếp theo" items={result.suggestions} tone="purple" />

          {result.wordFeedback.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                Phản hồi theo từ
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {result.wordFeedback.map((item, index) => (
                  <div
                    key={`${item.word}-${index}`}
                    className="rounded-xl border border-purple-500/30 bg-slate-900/80 p-4"
                  >
                    <div className="font-bold text-white">{item.word}</div>
                    {item.heardAs ? (
                      <div className="mt-1 text-xs text-purple-400">
                        AI nghe được: {item.heardAs}
                      </div>
                    ) : null}
                    <div className="mt-2 text-sm text-rose-200">{item.issue}</div>
                    <div className="mt-2 text-sm text-purple-200">{item.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <WarningsBlock warnings={result.warnings} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TOPIC_OPTIONS: SpeakingTopicOption[] = [
  {
    value: "free",
    label: "Nói tự do",
    description: "Con muốn nói gì cũng được, AI sẽ lắng nghe và góp ý.",
    greeting:
      "Chào con! Hôm nay con muốn nói về chủ đề gì nào? Con cứ bấm mic và nói tự nhiên nhé, AI sẽ lắng nghe!",
  },
  {
    value: "introduce-yourself",
    label: "Tự giới thiệu",
    description: "Luyện giới thiệu bản thân bằng tiếng Anh.",
    greeting:
      "Let's practice introducing yourself! Press the mic and tell me your name, age, and something you like. I'll listen and help you improve!",
  },
  {
    value: "daily-routine",
    label: "Sinh hoạt hàng ngày",
    description: "Kể về một ngày bình thường của con.",
    greeting:
      "Tell me about your day! What do you do in the morning? Press the mic and describe your daily routine. I'll help with pronunciation and grammar!",
  },
  {
    value: "describe-picture",
    label: "Mô tả hình ảnh",
    description: "Luyện mô tả những gì con thấy.",
    greeting:
      "Let's practice describing! Think of something you can see right now. Press the mic and describe it in English. I'll listen and give you feedback!",
  },
  {
    value: "storytelling",
    label: "Kể chuyện",
    description: "Kể lại một câu chuyện con thích.",
    greeting:
      "Story time! Do you have a favorite story or something fun that happened to you recently? Press the mic and tell me about it!",
  },
  {
    value: "homework",
    label: "Theo homework",
    description: "AI sẽ nghe theo ngữ cảnh bài tập đã gắn.",
    greeting:
      "Con đang luyện nói theo bài homework. Bấm mic và đọc/nói theo yêu cầu bài nhé, AI sẽ nghe và góp ý chi tiết!",
  },
];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function buildRecordedFile(blob: Blob) {
  const mimeType = blob.type || "audio/webm";
  const extension = mimeType.includes("mp4")
    ? "m4a"
    : mimeType.includes("mpeg")
      ? "mp3"
      : mimeType.includes("ogg")
        ? "ogg"
        : "webm";

  return new File([blob], `ai-speaking-${Date.now()}.${extension}`, {
    type: mimeType,
  });
}

function getRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  const supported = candidates.find((type) => MediaRecorder.isTypeSupported(type));
  return supported || "";
}

function generateLocalResponse(
  transcript: string,
  topic: SpeakingTopic,
  language: string,
  studentTurnIndex: number
): string {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 2) {
    return language === "vi"
      ? "Con chưa nói được dài, thử nói thêm một câu nữa nhé!"
      : "Try saying a bit more! I'm right here, don't be shy!";
  }

  const praiseEn = ["Great!", "Excellent!", "Well done!", "Awesome!", "Nice job!", "Fantastic!"];
  const praiseVi = ["Tốt lắm!", "Hay lắm!", "Con nói rất tốt!", "Giỏi quá!"];
  const praise =
    language === "vi"
      ? praiseVi[studentTurnIndex % praiseVi.length]
      : praiseEn[studentTurnIndex % praiseEn.length];

  const followUps: Record<SpeakingTopic, string[]> = {
    free: [
      language === "vi" ? "Con muốn kể thêm gì nữa không?" : "Can you tell me more about that?",
      language === "vi" ? "Hay lắm! Hôm nay con cảm thấy thế nào?" : "Wow! How did that make you feel?",
      language === "vi" ? "Con thích nhất điều gì?" : "What's your favorite part?",
    ],
    "introduce-yourself": [
      "Nice to meet you! What's your favorite hobby?",
      "That's great! Do you have any brothers or sisters?",
      "Wonderful! What subject do you like most at school?",
    ],
    "daily-routine": [
      "Good! What do you usually do in the evenings?",
      "Interesting! What's your favorite part of the day?",
      "I see! What do you eat for breakfast?",
    ],
    "describe-picture": [
      "Good description! What colors can you see?",
      "Great! Is there anything interesting in the background?",
      "Well done! How does this picture make you feel?",
    ],
    storytelling: [
      "Wow, great story! What happened next?",
      "Interesting! How did the story end?",
      "I love it! Who was your favorite character?",
    ],
    homework: [
      "Good effort! Can you say that again a little louder?",
      "Well done! Try to slow down a little on the tricky words.",
      "Nice try! Pay attention to the ending sounds this time.",
    ],
  };

  const followUpList = followUps[topic] ?? followUps.free;
  const followUp = followUpList[studentTurnIndex % followUpList.length];

  const longResponse = wordCount >= 15
    ? (language === "vi" ? " Con nói rất trôi chảy rồi đó!" : " You spoke really fluently!")
    : "";

  return `${praise}${longResponse} ${followUp}`;
}

function makeTurnId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAiReplyText(result: HomeworkSpeakingAnalysisResult): string {
  if (result.summary) return result.summary;

  const parts: string[] = [];

  if (result.strengths.length > 0) {
    parts.push(`Great job with: ${result.strengths.slice(0, 2).join(", ")}.`);
  }
  if (result.issues.length > 0) {
    parts.push(`Let's work on: ${result.issues[0]}.`);
  }
  if (result.mispronouncedWords.length > 0) {
    parts.push(`Try these words again: ${result.mispronouncedWords.slice(0, 3).join(", ")}.`);
  }
  if (result.suggestions.length > 0) {
    parts.push(result.suggestions[0]);
  }

  return parts.length > 0
    ? parts.join(" ")
    : "I heard you! Great effort. Can you try saying that again with more confidence?";
}

function speakText(
  text: string,
  lang: string,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return null;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "vi" ? "vi-VN" : "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1.05;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

function stopSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TopicSelector({
  topic,
  onChange,
  hasHomework,
}: {
  topic: SpeakingTopic;
  onChange: (value: SpeakingTopic) => void;
  hasHomework: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TOPIC_OPTIONS.filter((o) => hasHomework || o.value !== "homework").map(
        (option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border p-4 text-left transition-all duration-300 cursor-pointer ${
              topic === option.value
                ? "border-purple-400/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20 scale-[1.02]"
                : "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-400/50 hover:scale-[1.01]"
            }`}
          >
            <div className="text-sm font-bold text-white">{option.label}</div>
            <div className="mt-1 text-xs leading-relaxed text-purple-300/70">
              {option.description}
            </div>
          </button>
        )
      )}
    </div>
  );
}

function ConversationBubble({ turn }: { turn: SpeakingConversationTurn }) {
  const isAi = turn.role === "ai";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] space-y-2 rounded-3xl px-5 py-4 ${
          isAi
            ? "rounded-tl-lg border border-purple-400/30 bg-gradient-to-br from-purple-500/15 to-slate-900/80 backdrop-blur-sm"
            : "rounded-tr-lg border border-pink-400/30 bg-gradient-to-br from-pink-500/15 to-slate-900/80 backdrop-blur-sm"
        }`}
      >
        <div className="flex items-center gap-2">
          {isAi ? (
            <Sparkles size={14} className="text-purple-300" />
          ) : (
            <Mic size={14} className="text-pink-300" />
          )}
          <span
            className={`text-xs font-bold uppercase tracking-[0.15em] ${
              isAi ? "text-purple-200" : "text-pink-200"
            }`}
          >
            {isAi ? "AI Tutor" : "Con"}
          </span>
        </div>

        <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
          {turn.text}
        </div>

        {turn.audioUrl ? (
          <audio controls className="mt-2 w-full rounded-lg" src={turn.audioUrl} />
        ) : null}

        {turn.analysis && isAi ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setExpanded((c) => !c)}
              className="text-xs font-semibold text-purple-300 transition hover:text-purple-100 flex items-center gap-1 cursor-pointer"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Ẩn chi tiết" : "Xem chi tiết phân tích"}
            </button>
            {expanded ? (
              <div className="mt-3">
                <SpeakingResultCard title="Chi tiết" result={turn.analysis} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type TabMode = "conversation" | "analyze";
type RecordingState = "idle" | "recording" | "processing";

export default function StudentAiSpeakingWorkspace() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = String(params.locale || "vi");
  const homeworkId = searchParams.get("homeworkId");

  // Tab
  const [tab, setTab] = useState<TabMode>("conversation");

  // Shared settings
  const [language, setLanguage] = useState("en");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Conversation state
  const [topic, setTopic] = useState<SpeakingTopic>(homeworkId ? "homework" : "free");
  const [turns, setTurns] = useState<SpeakingConversationTurn[]>([]);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  // Analyze (one-shot) state
  const [analyzeMode, setAnalyzeMode] = useState("speaking");
  const [expectedText, setExpectedText] = useState("");
  const [targetWords, setTargetWords] = useState("");
  const [instructions, setInstructions] = useState("");
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<HomeworkSpeakingAnalysisResult | null>(null);
  const [analyzePreviewUrl, setAnalyzePreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Recording state (shared)
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Homework context
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  // Refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const convChunksRef = useRef<Blob[]>([]);
  const convRecorderRef = useRef<MediaRecorder | null>(null);
  const convStreamRef = useRef<MediaStream | null>(null);

  // Page load animation
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
      stopSpeech();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (convRecorderRef.current && convRecorderRef.current.state !== "inactive") {
        try { convRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      if (convStreamRef.current) {
        convStreamRef.current.getTracks().forEach((t) => t.stop());
        convStreamRef.current = null;
      }
    };
  }, []);

  // Cleanup analyze preview url
  useEffect(() => {
    return () => {
      if (analyzePreviewUrl) URL.revokeObjectURL(analyzePreviewUrl);
    };
  }, [analyzePreviewUrl]);

  // Load homework context
  useEffect(() => {
    if (!homeworkId) {
      setSelectedAssignment(null);
      setContextError(null);
      return;
    }

    let cancelled = false;

    const loadHomeworkContext = async () => {
      setContextLoading(true);
      setContextError(null);

      const response = await getStudentHomeworkById(homeworkId);

      if (cancelled) return;

      if (!response.isSuccess || !response.data) {
        setSelectedAssignment(null);
        setContextError(response.message || "Không thể lấy thông tin homework.");
        setContextLoading(false);
        return;
      }

      const assignment = response.data;
      setSelectedAssignment(assignment);
      setAnalyzeMode(assignment.speakingMode || "speaking");
      setExpectedText(assignment.speakingExpectedText || "");
      setTargetWords((assignment.targetWords || []).join(", "));
      setShowAdvanced(Boolean(assignment.speakingExpectedText || assignment.targetWords?.length));
      setContextLoading(false);
    };

    void loadHomeworkContext();

    return () => {
      cancelled = true;
    };
  }, [homeworkId]);

  // Scroll on new turns
  useEffect(() => {
    if (turns.length > 0) scrollToBottom();
  }, [turns.length, scrollToBottom]);

  // ---------------------------------------------------------------------------
  // Conversation logic
  // ---------------------------------------------------------------------------

  const startConversation = () => {
    const topicOption =
      TOPIC_OPTIONS.find((o) => o.value === topic) || TOPIC_OPTIONS[0];

    const greeting: SpeakingConversationTurn = {
      id: makeTurnId(),
      role: "ai",
      text: topicOption.greeting,
      timestamp: Date.now(),
    };

    setTurns([greeting]);
    setConversationStarted(true);

    if (ttsEnabled) {
      setAiSpeaking(true);
      speakText(topicOption.greeting, language, () => setAiSpeaking(false));
    }
  };

  const resetConversation = () => {
    stopSpeech();
    setTurns([]);
    setConversationStarted(false);
    setAiSpeaking(false);
  };

  const processConversationTurn = async (audioBlob: Blob | null) => {
    const studentTurnIndex = turns.filter((t) => t.role === "student").length;

    const studentTurnId = makeTurnId();
    const aiTurnId = makeTurnId();

    setTurns((prev) => [
      ...prev,
      { id: studentTurnId, role: "student", text: "Đang xử lý...", timestamp: Date.now() },
      { id: aiTurnId, role: "ai", text: "...", timestamp: Date.now() },
    ]);

    let studentText = "(con đã nói)";
    let aiText: string;
    let analysis: HomeworkSpeakingAnalysisResult | null = null;

    if (audioBlob && audioBlob.size > 0) {
      setLoading(true);

      const historyForBE = JSON.stringify(
        turns.slice(-8).map((t) => ({ role: t.role, text: t.text }))
      );
      const topicLabel =
        TOPIC_OPTIONS.find((o) => o.value === topic)?.label || topic;

      const response = await converseStudentSpeaking({
        file: buildRecordedFile(audioBlob),
        language,
        topic: topicLabel,
        conversationHistory: historyForBE,
        instructions: selectedAssignment?.speakingExpectedText || undefined,
        homeworkStudentId: selectedAssignment?.id || undefined,
      });

      setLoading(false);

      if (response.isSuccess && response.data) {
        analysis = response.data;
        studentText = analysis.transcript?.trim() || studentText;
        aiText = buildAiReplyText(analysis);
      } else {
        aiText = generateLocalResponse(studentText, topic, language, studentTurnIndex);
      }
    } else {
      aiText = generateLocalResponse(studentText, topic, language, studentTurnIndex);
    }

    setTurns((prev) =>
      prev.map((t) => {
        if (t.id === studentTurnId) return { ...t, text: studentText };
        if (t.id === aiTurnId) return { ...t, text: aiText, analysis: analysis ?? undefined };
        return t;
      })
    );

    if (ttsEnabled) {
      setAiSpeaking(true);
      speakText(aiText, language, () => setAiSpeaking(false));
    }
  };

  // ---------------------------------------------------------------------------
  // Recording functions
  // ---------------------------------------------------------------------------

  const handleStartRecording = () => {
    if (tab === "conversation") {
      void startConvRecording();
    } else {
      void startMediaRecorder();
    }
  };

  const handleStopRecording = () => {
    if (tab === "conversation") {
      stopConvRecording();
    } else {
      stopMediaRecorder();
    }
  };

  const startConvRecording = async () => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      toast({
        title: "Thiết bị chưa hỗ trợ mic",
        description: "Trình duyệt hiện tại chưa cho ghi âm trực tiếp.",
      });
      return;
    }

    stopSpeech();
    setAiSpeaking(false);
    convChunksRef.current = [];
    stopTimer();
    setRecordedSeconds(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({
        title: "Không thể truy cập micro",
        description: "Vui lòng cho phép ứng dụng sử dụng micro trong cài đặt trình duyệt.",
      });
      return;
    }

    const mimeType = getRecorderMimeType();
    const convRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    convRecorderRef.current = convRecorder;
    convStreamRef.current = stream;
    convChunksRef.current = [];

    convRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) convChunksRef.current.push(e.data);
    };

    convRecorder.onstop = () => {
      const audioBlob = new Blob(convChunksRef.current, {
        type: convRecorder.mimeType || "audio/webm",
      });
      convChunksRef.current = [];

      if (convStreamRef.current) {
        convStreamRef.current.getTracks().forEach((t) => t.stop());
        convStreamRef.current = null;
      }
      convRecorderRef.current = null;

      void processConversationTurn(audioBlob.size > 0 ? audioBlob : null);
    };

    convRecorder.start();
    setRecordingState("recording");
    timerRef.current = window.setInterval(() => {
      setRecordedSeconds((c) => c + 1);
    }, 1000);
  };

  const stopConvRecording = () => {
    stopTimer();
    setRecordingState("idle");
    if (convRecorderRef.current && convRecorderRef.current.state !== "inactive") {
      convRecorderRef.current.stop();
    }
  };

  const startMediaRecorder = async () => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      toast({
        title: "Thiết bị chưa hỗ trợ mic",
        description: "Trình duyệt hiện tại chưa cho ghi âm trực tiếp.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      stopTimer();
      setRecordedSeconds(0);

      chunksRef.current = [];
      recorderRef.current = recorder;
      streamRef.current = stream;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        stopTimer();
        stopStream();

        if (recordedBlob.size === 0) {
          setRecordingState("idle");
          toast({
            title: "Chưa thu được âm thanh",
            description: "Con thử nói lại gần mic hơn nhé.",
          });
          return;
        }

        const file = buildRecordedFile(recordedBlob);
        const audioUrl = URL.createObjectURL(recordedBlob);
        setAnalyzeFile(file);
        setAnalyzeResult(null);
        if (analyzePreviewUrl) URL.revokeObjectURL(analyzePreviewUrl);
        setAnalyzePreviewUrl(audioUrl);
        setRecordingState("idle");
        toast({
          title: "Đã thu âm xong",
          description: "Con có thể bấm Phân tích với AI ngay bây giờ.",
        });
      };

      recorder.start();
      setRecordingState("recording");

      timerRef.current = window.setInterval(() => {
        setRecordedSeconds((c) => c + 1);
      }, 1000);
    } catch (error) {
      console.error("MediaRecorder error:", error);
      stopStream();
      stopTimer();
      setRecordingState("idle");
      toast({
        title: "Không mở được mic",
        description: "Con hãy kiểm tra quyền microphone rồi thử lại nhé.",
      });
    }
  };

  const stopMediaRecorder = () => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    setRecordingState("processing");
    recorderRef.current.stop();
    recorderRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // One-shot analyze
  // ---------------------------------------------------------------------------

  const handleAnalyzeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    stopTimer();
    setRecordingState("idle");
    setRecordedSeconds(0);
    setAnalyzeFile(file);
    setAnalyzeResult(null);
    if (analyzePreviewUrl) URL.revokeObjectURL(analyzePreviewUrl);
    setAnalyzePreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!analyzeFile) {
      toast({
        title: "Chưa có audio",
        description: "Con hãy bấm mic hoặc chọn file trước nha.",
      });
      return;
    }

    setLoading(true);
    const response = await analyzeStudentSpeakingPractice({
      file: analyzeFile,
      language,
      mode: analyzeMode,
      expectedText: expectedText.trim() || undefined,
      targetWords: targetWords.trim() || undefined,
      instructions: instructions.trim() || undefined,
      homeworkStudentId: selectedAssignment?.id || undefined,
    });
    setLoading(false);

    if (!response.isSuccess || !response.data) {
      toast({
        title: "AI chưa nghe được",
        description: response.message || "Con thử lại thêm một lần nữa nha.",
      });
      return;
    }

    setAnalyzeResult(response.data);
    toast({
      title: "Phân tích hoàn tất",
      description: "AI đã đánh giá bài nói của con!",
    });
  };

  const homeworkHref = selectedAssignment
    ? `/${locale}/portal/student/homework/${selectedAssignment.id}`
    : null;

  const isAnalyzeVideoFile = Boolean(analyzeFile?.type?.startsWith("video/"));

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div className={`shrink-0 px-6 pt-6 pb-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        
        {/* Hero Header */}
        <div className="mb-8 relative">
          <div className="text-center pt-4">
            <div className="inline-block relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 opacity-30 blur-2xl"></div>

              {/* Main frame */}
              <div
                className="relative rounded-3xl px-8 md:px-16 py-8 md:py-10 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-violet-500/20 backdrop-blur-xl border border-transparent flex flex-col items-center justify-center"
                style={{
                  backgroundImage: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3), rgba(217,70,239,0.3)), linear-gradient(to right, rgba(168,85,247,0.1), rgba(236,72,153,0.1))",
                  boxShadow: "0 0 60px rgba(168,85,247,0.3), 0 0 30px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-3xl p-[2px] pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #ec4899, #d946ef, #a855f7)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: "4px",
                  }}
                ></div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mic className="w-8 h-8 text-purple-400 animate-pulse" />
                    <h1 className="text-5xl md:text-6xl lg:text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-lg">
                      AI SPEAKING
                    </h1>
                    <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
                  </div>
                  <p className="text-base md:text-lg font-medium text-purple-200/80">
                    Nói chuyện trực tiếp với AI - Luyện phát âm và phản xạ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl border border-purple-500/30 bg-purple-500/10 p-1 w-fit mx-auto mb-6">
          <button
            type="button"
            onClick={() => setTab("conversation")}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 cursor-pointer ${
              tab === "conversation"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                : "text-purple-300 hover:text-white hover:bg-purple-500/20"
            }`}
          >
            <MessageCircle size={15} className="mr-1.5 inline -mt-0.5" />
            Hội thoại
          </button>
          <button
            type="button"
            onClick={() => setTab("analyze")}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 cursor-pointer ${
              tab === "analyze"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                : "text-purple-300 hover:text-white hover:bg-purple-500/20"
            }`}
          >
            <WandSparkles size={15} className="mr-1.5 inline -mt-0.5" />
            Phân tích
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        
        {/* CONVERSATION TAB */}
        {tab === "conversation" ? (
          <div className="space-y-5">
            {!conversationStarted ? (
              <div className="rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-6 space-y-5 backdrop-blur-xl shadow-xl shadow-purple-500/10">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    Chọn chủ đề
                  </h2>
                  <p className="mt-1 text-sm text-purple-300/70">
                    Chọn chủ đề để AI biết cần hội thoại theo hướng nào.
                  </p>
                </div>
                <TopicSelector
                  topic={topic}
                  onChange={setTopic}
                  hasHomework={Boolean(selectedAssignment)}
                />

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-purple-300">
                    <span>Ngôn ngữ:</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="rounded-xl border border-purple-500/30 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="vi">Tiếng Việt</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => setTtsEnabled((c) => !c)}
                    className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-300 transition-all duration-300 hover:bg-purple-500/20 hover:scale-105 cursor-pointer"
                  >
                    {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    {ttsEnabled ? "AI nói bằng giọng" : "AI chỉ hiện text"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={startConversation}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                >
                  <Sparkles size={18} />
                  Bắt đầu hội thoại
                </button>
              </div>
            ) : null}

            {/* Conversation area */}
            {conversationStarted ? (
              <div className="flex flex-col rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 shadow-2xl shadow-purple-500/10 backdrop-blur-xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-purple-500/30 px-5 py-3 bg-purple-500/5">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-white">
                      {TOPIC_OPTIONS.find((o) => o.value === topic)?.label || "Hội thoại"}
                    </div>
                    {aiSpeaking ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-1 text-[11px] font-semibold text-purple-200">
                        <Volume2 size={12} className="animate-pulse" />
                        AI đang nói...
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTtsEnabled((c) => !c)}
                      className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2 text-purple-400 transition-all duration-300 hover:text-white hover:bg-purple-500/20 hover:scale-105 cursor-pointer"
                      title={ttsEnabled ? "Tắt giọng AI" : "Bật giọng AI"}
                    >
                      {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSettings((c) => !c)}
                      className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2 text-purple-400 transition-all duration-300 hover:text-white hover:bg-purple-500/20 hover:scale-105 cursor-pointer"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={resetConversation}
                      className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2 text-purple-400 transition-all duration-300 hover:text-white hover:bg-purple-500/20 hover:scale-105 cursor-pointer"
                      title="Bắt đầu lại"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                {showSettings ? (
                  <div className="border-b border-purple-500/30 px-5 py-4 bg-purple-500/5">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm text-purple-300">
                        <span>Ngôn ngữ:</span>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="rounded-xl border border-purple-500/30 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none cursor-pointer"
                        >
                          <option value="en">English</option>
                          <option value="vi">Tiếng Việt</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" style={{ maxHeight: "60vh", minHeight: 260 }}>
                  {turns.map((turn) => (
                    <ConversationBubble key={turn.id} turn={turn} />
                  ))}

                  {recordingState === "recording" ? (
                    <div className="flex justify-end">
                      <div className="flex items-center gap-2 rounded-3xl rounded-tr-lg border border-pink-400/30 bg-pink-500/15 px-5 py-4 text-sm italic text-pink-300 backdrop-blur-sm">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-pink-400" />
                        Đang ghi âm... {formatDuration(recordedSeconds)}
                      </div>
                    </div>
                  ) : null}

                  {loading ? (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-3xl rounded-tl-lg border border-purple-400/30 bg-purple-500/15 px-5 py-4 text-sm text-purple-200 backdrop-blur-sm">
                        <Loader2 size={16} className="animate-spin" />
                        AI đang suy nghĩ...
                      </div>
                    </div>
                  ) : null}

                  <div ref={chatEndRef} />
                </div>

                <div className="border-t border-purple-500/30 px-5 py-4 bg-purple-500/5">
                  <div className="flex items-center justify-center gap-4">
                    {recordingState === "recording" ? (
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-pink-400 tabular-nums">
                          {formatDuration(recordedSeconds)}
                        </span>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-900/30 transition-all duration-300 hover:scale-110 cursor-pointer"
                        >
                          <Square size={24} />
                        </button>
                        <span className="text-sm text-purple-400">Bấm để dừng</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        disabled={loading || recordingState === "processing" || aiSpeaking}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-110 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        title={aiSpeaking ? "Đợi AI nói xong" : "Bấm để nói"}
                      >
                        {recordingState === "processing" ? (
                          <Loader2 size={24} className="animate-spin" />
                        ) : (
                          <Mic size={24} />
                        )}
                      </button>
                    )}
                  </div>

                  {recordingState === "idle" && !loading ? (
                    <p className="mt-3 text-center text-sm text-purple-400/70">
                      {aiSpeaking
                        ? "Đợi AI nói xong rồi bấm mic nhé"
                        : "Bấm nút mic để nói với AI"}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ANALYZE TAB */}
        {tab === "analyze" ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column - Recording */}
            <div className="rounded-[30px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-6 shadow-2xl shadow-purple-500/10 backdrop-blur-xl">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="text-sm font-bold text-purple-300">Bước 1</div>
                <div className="mt-1 text-sm text-purple-300/70">
                  Bấm mic để nói, hoặc chọn file nếu con đã thu sẵn.
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/70 p-5">
                <button
                  type="button"
                  onClick={
                    recordingState === "recording"
                      ? handleStopRecording
                      : handleStartRecording
                  }
                  disabled={recordingState === "processing" || loading}
                  className={`flex w-full items-center justify-center gap-3 rounded-[24px] px-5 py-5 text-base font-bold text-white transition-all duration-300 cursor-pointer ${
                    recordingState === "recording"
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:scale-[1.02]"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {recordingState === "processing" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : recordingState === "recording" ? (
                    <StopCircle size={20} />
                  ) : (
                    <Mic size={20} />
                  )}
                  {recordingState === "processing"
                    ? "Đang xử lý..."
                    : recordingState === "recording"
                      ? "Đang ghi âm - bấm để dừng"
                      : "Bấm mic để bắt đầu nói"}
                </button>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-4">
                    <div className="text-xs uppercase tracking-wide text-purple-400 font-bold">
                      Thời lượng
                    </div>
                    <div className="mt-2 text-2xl font-bold text-purple-200">
                      {formatDuration(recordedSeconds)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-4 text-sm text-purple-300/70">
                    Con cứ nói tự nhiên. Nói xong thì bấm lại để dừng.
                  </div>
                </div>
              </div>

              <label className="mt-5 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-purple-400/30 bg-slate-900/80 px-5 py-6 text-center transition-all duration-300 hover:border-purple-400/50 hover:bg-purple-500/10">
                <UploadCloud size={28} className="text-purple-300" />
                <div className="mt-3 text-base font-bold text-white">
                  Hoặc chọn file audio/video sẵn
                </div>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={handleAnalyzeFileChange}
                />
              </label>

              {analyzeFile ? (
                <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    File đã chọn
                  </div>
                  <div className="mt-2 text-sm text-purple-300/70">{analyzeFile.name}</div>
                </div>
              ) : null}

              {analyzePreviewUrl && analyzeFile ? (
                <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="text-sm font-bold text-white">Nghe lại</div>
                  {isAnalyzeVideoFile ? (
                    <video controls className="mt-3 max-h-[320px] w-full rounded-2xl bg-black">
                      <source src={analyzePreviewUrl} type={analyzeFile.type} />
                    </video>
                  ) : (
                    <audio controls className="mt-3 w-full rounded-lg">
                      <source src={analyzePreviewUrl} type={analyzeFile.type} />
                    </audio>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right Column - Analyze Controls */}
            <div className="rounded-[30px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-6 shadow-2xl shadow-purple-500/10 backdrop-blur-xl">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="text-sm font-bold text-purple-300">Bước 2</div>
                <div className="mt-1 text-sm text-purple-300/70">
                  Bấm nút để AI nghe và chỉ ra điểm cần sửa.
                </div>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || recordingState === "recording" || !analyzeFile}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <WandSparkles size={18} />
                )}
                Phân tích với AI
              </button>

              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-purple-300 transition-all duration-300 hover:text-purple-100 cursor-pointer"
              >
                {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showAdvanced ? "Ẩn tùy chọn thêm" : "Mở tùy chọn thêm"}
              </button>

              {selectedAssignment?.speakingExpectedText ? (
                <div className="mt-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-400">
                    Đã lấy sẵn từ homework
                  </div>
                  <div className="mt-2 line-clamp-4 leading-relaxed">
                    {selectedAssignment.speakingExpectedText}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Advanced Options */}
            {showAdvanced ? (
              <div className="col-span-full grid gap-4 rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-5 backdrop-blur-xl md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-purple-300">Ngôn ngữ</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 cursor-pointer"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-purple-300">Kiểu bài nói</span>
                  <select
                    value={analyzeMode}
                    onChange={(e) => setAnalyzeMode(e.target.value)}
                    className="w-full rounded-2xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 cursor-pointer"
                  >
                    <option value="speaking">Speaking</option>
                    <option value="phonics">Phonics</option>
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-purple-300">Đoạn mẫu</span>
                  <textarea
                    value={expectedText}
                    onChange={(e) => setExpectedText(e.target.value)}
                    rows={3}
                    placeholder="Dán đoạn văn mẫu nếu muốn AI đối chiếu."
                    className="w-full rounded-2xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-purple-400/50 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-purple-300">Từ muốn luyện</span>
                  <input
                    value={targetWords}
                    onChange={(e) => setTargetWords(e.target.value)}
                    placeholder="hello, family, teacher"
                    className="w-full rounded-2xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-purple-400/50 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30"
                  />
                </label>

                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-300/70">
                  <Sparkles size={14} className="inline mr-2" />
                  Nếu con đang vào từ homework, AI sẽ tự gắn ngữ cảnh bài đó.
                </div>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-purple-300">Ghi chú thêm</span>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    placeholder="Ví dụ: nhờ AI nghe kỹ ending sound và nhấn trọng âm."
                    className="w-full rounded-2xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-purple-400/50 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30"
                  />
                </label>
              </div>
            ) : null}

            {/* Results */}
            {analyzeResult ? (
              <div className="col-span-full">
                <SpeakingResultCard title="Kết quả luyện nói" result={analyzeResult} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}