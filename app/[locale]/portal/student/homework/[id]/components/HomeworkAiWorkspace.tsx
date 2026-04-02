"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Languages,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Mic,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  analyzeStudentSpeakingPractice,
  getStudentHomeworkHint,
  getStudentHomeworkRecommendations,
  getStudentHomeworkSpeakingAnalysis,
} from "@/lib/api/studentService";
import type {
  AssignmentDetail,
  HomeworkAiHintResult,
  HomeworkAiRecommendationResult,
  HomeworkSpeakingAnalysisResult,
} from "@/types/student/homework";

type HomeworkAiWorkspaceProps = {
  homeworkStudentId: string;
  assignment: AssignmentDetail;
};

type LoadingAction =
  | "hint"
  | "recommendations"
  | "analysis"
  | "practice"
  | null;

function ResultPills({
  title,
  items,
  tone = "purple",
}: {
  title: string;
  items?: string[];
  tone?: "purple" | "blue" | "amber" | "emerald" | "rose" | "cyan";
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const toneClass =
    tone === "blue"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
      : tone === "cyan"
        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
      : tone === "amber"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
        : tone === "emerald"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
          : tone === "rose"
            ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
            : "border-purple-400/20 bg-purple-500/10 text-purple-100";

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${title}-${index}-${item}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
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
      <div className="mb-2 text-sm font-semibold text-amber-200">Luu y tu AI</div>
      <ul className="space-y-1 text-sm text-amber-50/85">
        {warnings.map((warning, index) => (
          <li key={`warning-${index}`} className="leading-relaxed">
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
  return (
    <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {result.summary ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {result.summary}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {result.stars !== undefined ? (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-100">
              {result.stars} sao
            </span>
          ) : null}
          {result.overallScore !== undefined ? (
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              Tong diem {result.overallScore}
            </span>
          ) : null}
        </div>
      </div>

      {(result.pronunciationScore !== undefined ||
        result.fluencyScore !== undefined ||
        result.accuracyScore !== undefined) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Pronunciation
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-200">
              {result.pronunciationScore ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Fluency
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-200">
              {result.fluencyScore ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Accuracy
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-200">
              {result.accuracyScore ?? "—"}
            </div>
          </div>
        </div>
      )}

      {result.transcript ? (
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            Transcript
          </div>
          <div className="text-sm leading-relaxed text-slate-200">
            {result.transcript}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ResultPills title="Diem manh" items={result.strengths} tone="emerald" />
        <ResultPills title="Can cai thien" items={result.issues} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResultPills
          title="Tu can luyen"
          items={result.mispronouncedWords}
          tone="amber"
        />
        <ResultPills
          title="Ke hoach luyen tap"
          items={result.practicePlan}
          tone="blue"
        />
      </div>

      {result.wordFeedback.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Phan hoi theo tu
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.wordFeedback.map((item, index) => (
              <div
                key={`${item.word}-${index}`}
                className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              >
                <div className="font-semibold text-white">{item.word}</div>
                {item.heardAs ? (
                  <div className="mt-1 text-xs text-slate-400">
                    AI nghe duoc: {item.heardAs}
                  </div>
                ) : null}
                <div className="mt-2 text-sm text-rose-200">{item.issue}</div>
                <div className="mt-2 text-sm text-cyan-100">{item.tip}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <WarningsBlock warnings={result.warnings} />
    </div>
  );
}

export default function HomeworkAiWorkspace({
  homeworkStudentId,
  assignment,
}: HomeworkAiWorkspaceProps) {
  const hasAnyAi =
    assignment.aiHintEnabled ||
    assignment.aiRecommendEnabled ||
    Boolean(assignment.speakingMode);

  const [language, setLanguage] = useState("vi");
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [practiceFile, setPracticeFile] = useState<File | null>(null);
  const [practiceInstructions, setPracticeInstructions] = useState("");
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [hintResult, setHintResult] = useState<HomeworkAiHintResult | null>(null);
  const [recommendResult, setRecommendResult] =
    useState<HomeworkAiRecommendationResult | null>(null);
  const [speakingResult, setSpeakingResult] =
    useState<HomeworkSpeakingAnalysisResult | null>(null);
  const [practiceResult, setPracticeResult] =
    useState<HomeworkSpeakingAnalysisResult | null>(null);

  useEffect(() => {
    setCurrentAnswerText(assignment.submission?.content?.text || "");
    setCurrentTranscript(assignment.submission?.content?.text || "");
  }, [assignment.id, assignment.submission?.content?.text]);

  const targetWordsText = useMemo(
    () => (assignment.targetWords || []).join(", "),
    [assignment.targetWords]
  );

  if (!hasAnyAi) {
    return null;
  }

  const handleHint = async () => {
    setLoadingAction("hint");
    const response = await getStudentHomeworkHint(homeworkStudentId, {
      currentAnswerText,
      language,
    });
    setLoadingAction(null);

    if (!response.isSuccess || !response.data) {
      toast({
        title: "Khong the lay goi y",
        description: response.message || "Vui long thu lai sau.",
        type: "destructive",
      });
      return;
    }

    setHintResult(response.data);
  };

  const handleRecommendations = async () => {
    setLoadingAction("recommendations");
    const response = await getStudentHomeworkRecommendations(homeworkStudentId, {
      currentAnswerText,
      language,
      maxItems: 5,
    });
    setLoadingAction(null);

    if (!response.isSuccess || !response.data) {
      toast({
        title: "Khong the lay bai luyen them",
        description: response.message || "Vui long thu lai sau.",
        type: "destructive",
      });
      return;
    }

    setRecommendResult(response.data);
  };

  const handleSpeakingAnalysis = async () => {
    setLoadingAction("analysis");
    const response = await getStudentHomeworkSpeakingAnalysis(homeworkStudentId, {
      currentTranscript,
      language,
    });
    setLoadingAction(null);

    if (!response.isSuccess || !response.data) {
      toast({
        title: "Khong the phan tich bai noi",
        description: response.message || "Vui long thu lai sau.",
        type: "destructive",
      });
      return;
    }

    setSpeakingResult(response.data);
  };

  const handleSpeakingPractice = async () => {
    if (!practiceFile) {
      toast({
        title: "Chua co file speaking",
        description: "Hay chon audio/video truoc khi gui cho AI.",
        type: "warning",
      });
      return;
    }

    setLoadingAction("practice");
    const response = await analyzeStudentSpeakingPractice({
      file: practiceFile,
      homeworkStudentId,
      language,
      mode: assignment.speakingMode || "speaking",
      expectedText: assignment.speakingExpectedText || undefined,
      targetWords: targetWordsText || undefined,
      instructions: practiceInstructions || undefined,
    });
    setLoadingAction(null);

    if (!response.isSuccess || !response.data) {
      toast({
        title: "Khong the luyen noi voi AI",
        description: response.message || "Vui long thu lai sau.",
        type: "destructive",
      });
      return;
    }

    setPracticeResult(response.data);
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-xl shadow-fuchsia-900/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-200">
            <Bot size={20} className="text-fuchsia-300" />
            <h2 className="text-lg font-semibold text-white">Tro ly AI cho bai tap</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Goi y, bai luyen them va phan tich speaking se chi ho tro ban luyen tap.
            He thong khong tu dong doi diem hay trang thai bai nop.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/20 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          <Languages size={16} className="text-fuchsia-300" />
          <span>Ngoan ngu</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-lg border border-fuchsia-400/20 bg-slate-950/80 px-2 py-1 text-sm text-white outline-none"
          >
            <option value="vi">Tieng Viet</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      {(assignment.aiHintEnabled || assignment.aiRecommendEnabled) && (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
          <div className="flex items-center gap-2 text-white">
            <Lightbulb size={18} className="text-amber-300" />
            <h3 className="font-semibold">AI ho tro bai hien tai</h3>
          </div>

          <textarea
            value={currentAnswerText}
            onChange={(event) => setCurrentAnswerText(event.target.value)}
            rows={4}
            placeholder="Neu muon, ban co the dan cau tra loi hien tai de AI goi y sat hon..."
            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-400/40"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            {assignment.aiHintEnabled && (
              <button
                onClick={handleHint}
                disabled={loadingAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "hint" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Lightbulb size={15} />
                )}
                Xin goi y
              </button>
            )}

            {assignment.aiRecommendEnabled && (
              <button
                onClick={handleRecommendations}
                disabled={loadingAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "recommendations" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                Luyen tap them
              </button>
            )}
          </div>

          {hintResult && (
            <div className="mt-5 space-y-4 rounded-2xl border border-amber-500/20 bg-slate-900/60 p-5">
              <div>
                <div className="text-sm font-semibold text-white">Goi y tu AI</div>
                {hintResult.summary ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {hintResult.summary}
                  </p>
                ) : null}
                {hintResult.encouragement ? (
                  <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {hintResult.encouragement}
                  </div>
                ) : null}
              </div>

              <ResultPills title="Huong goi y" items={hintResult.hints} tone="amber" />
              <div className="grid gap-4 lg:grid-cols-2">
                <ResultPills
                  title="Ngu phap nen xem lai"
                  items={hintResult.grammarFocus}
                  tone="blue"
                />
                <ResultPills
                  title="Tu vung nen on"
                  items={hintResult.vocabularyFocus}
                  tone="purple"
                />
              </div>
              <WarningsBlock warnings={hintResult.warnings} />
            </div>
          )}

          {recommendResult && (
            <div className="mt-5 space-y-4 rounded-2xl border border-fuchsia-500/20 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Bai luyen tap goi y</div>
                  {recommendResult.summary ? (
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                      {recommendResult.summary}
                    </p>
                  ) : null}
                </div>
                {recommendResult.focusSkill ? (
                  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-100">
                    Focus: {recommendResult.focusSkill}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ResultPills
                  title="Topics"
                  items={recommendResult.topics}
                  tone="purple"
                />
                <ResultPills
                  title="Dang bai"
                  items={recommendResult.practiceTypes}
                  tone="blue"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ResultPills
                  title="Grammar tags"
                  items={recommendResult.grammarTags}
                  tone="amber"
                />
                <ResultPills
                  title="Vocabulary tags"
                  items={recommendResult.vocabularyTags}
                  tone="emerald"
                />
              </div>

              {recommendResult.items.length > 0 && (
                <div className="grid gap-3">
                  {recommendResult.items.map((item, index) => (
                    <div
                      key={`${item.questionBankItemId}-${index}`}
                      className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Cau {index + 1}
                          </div>
                          <div className="mt-1 text-sm leading-relaxed text-slate-200">
                            {item.questionText}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.level ? (
                            <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200">
                              {item.level}
                            </span>
                          ) : null}
                          {item.questionType ? (
                            <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200">
                              {item.questionType}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {item.reason ? (
                        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                          {item.reason}
                        </div>
                      ) : null}

                      {item.options.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.options.map((option, optionIndex) => (
                            <span
                              key={`${item.questionBankItemId}-${optionIndex}`}
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <WarningsBlock warnings={recommendResult.warnings} />
            </div>
          )}
        </div>
      )}

      {assignment.speakingMode && (
        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-5">
          <div className="flex items-center gap-2 text-white">
            <Mic size={18} className="text-cyan-300" />
            <h3 className="font-semibold">AI Speaking</h3>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <textarea
                value={currentTranscript}
                onChange={(event) => setCurrentTranscript(event.target.value)}
                rows={5}
                placeholder="Dan transcript tam neu ban muon AI phan tich theo text..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />

              {assignment.speakingExpectedText ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Expected text
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    {assignment.speakingExpectedText}
                  </div>
                </div>
              ) : null}

              {(assignment.targetWords || []).length > 0 && (
                <ResultPills
                  title="Target words"
                  items={assignment.targetWords}
                  tone="cyan"
                />
              )}

              <button
                onClick={handleSpeakingAnalysis}
                disabled={loadingAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "analysis" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <MessageSquareText size={15} />
                )}
                Phan tich bai noi hien tai
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/25 bg-slate-900/60 px-4 py-6 text-center transition hover:border-cyan-300/40 hover:bg-slate-900/80">
                <UploadCloud size={24} className="text-cyan-300" />
                <div className="mt-3 text-sm font-semibold text-white">
                  Tai file audio/video de luyen noi
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  WebM, MP4, MP3, MOV...
                </div>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(event) => setPracticeFile(event.target.files?.[0] || null)}
                />
                {practiceFile ? (
                  <div className="mt-4 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    {practiceFile.name}
                  </div>
                ) : null}
              </label>

              <textarea
                value={practiceInstructions}
                onChange={(event) => setPracticeInstructions(event.target.value)}
                rows={3}
                placeholder="Huong dan them cho AI neu can, vi du: nghe cach nhan trong am va ending sounds."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />

              <button
                onClick={handleSpeakingPractice}
                disabled={loadingAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "practice" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Mic size={15} />
                )}
                Luyen noi voi AI
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {speakingResult ? (
              <SpeakingResultCard
                title="Phan tich tu bai nop hien tai"
                result={speakingResult}
              />
            ) : null}
            {practiceResult ? (
              <SpeakingResultCard
                title="Phan tich tu file practice"
                result={practiceResult}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
