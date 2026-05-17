"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import {
  getStudentProgress,
  getAssessmentsByStudent,
  getTeacherEvaluationsByStudent,
  getRemedialPlansByStudent,
} from "@/lib/api/academicProgressionService";
import type {
  StudentProgressDto,
  AssessmentDto,
  TeacherEvaluationDto,
  RemedialPlanDto,
  StudentProgressStatus,
  PromotionStatus,
} from "@/types/academic-progression";
import AssessmentForm from "./AssessmentForm";
import TeacherEvaluationForm from "./TeacherEvaluationForm";
import PromotionDecisionPanel from "./PromotionDecisionPanel";

interface Props {
  studentId: string;
  studentName?: string;
  roleMode: "admin" | "staff" | "teacher";
}

const STATUS_LABEL: Record<StudentProgressStatus, string> = {
  NotStarted: "Chưa bắt đầu",
  InProgress: "Đang học",
  Completed: "Hoàn thành",
  RemedialRequired: "Cần phụ đạo",
};

const STATUS_COLOR: Record<StudentProgressStatus, string> = {
  NotStarted: "bg-gray-100 text-gray-600",
  InProgress: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  RemedialRequired: "bg-orange-100 text-orange-700",
};

const PROMOTION_LABEL: Record<PromotionStatus, string> = {
  Pending: "Chờ xét",
  Passed: "Đã lên cấp",
  Failed: "Không đạt",
  RemedialRequired: "Cần phụ đạo",
};

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color = clamped >= 80 ? "bg-green-500" : clamped >= 50 ? "bg-blue-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{clamped.toFixed(0)}%</span>
    </div>
  );
}

export default function StudentProgressWorkspace({ studentId, studentName, roleMode }: Props) {
  const [progressList, setProgressList] = useState<StudentProgressDto[]>([]);
  const [assessments, setAssessments] = useState<AssessmentDto[]>([]);
  const [evaluations, setEvaluations] = useState<TeacherEvaluationDto[]>([]);
  const [remedialPlans, setRemedialPlans] = useState<RemedialPlanDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Panel states
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [assessmentModuleId, setAssessmentModuleId] = useState<string>("");
  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [evalModuleId, setEvalModuleId] = useState<string>("");
  const [promotionModuleId, setPromotionModuleId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [progressRes, assessRes, evalRes, remedialRes] = await Promise.all([
      getStudentProgress(studentId),
      getAssessmentsByStudent(studentId),
      getTeacherEvaluationsByStudent(studentId),
      getRemedialPlansByStudent(studentId),
    ]);
    if (progressRes.isSuccess) setProgressList(progressRes.data.items);
    else setError(progressRes.message ?? "Không thể tải tiến trình học viên");
    if (assessRes.isSuccess) setAssessments(assessRes.data.items);
    if (evalRes.isSuccess) setEvaluations(evalRes.data.items);
    if (remedialRes.isSuccess) setRemedialPlans(remedialRes.data.items);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleModule = (moduleId: string) =>
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));

  const assessmentsForModule = (moduleId: string) =>
    assessments.filter((a) => a.moduleId === moduleId);

  const evalForModule = (moduleId: string) =>
    evaluations.filter((e) => e.moduleId === moduleId);

  const remedialForModule = (moduleId: string) =>
    remedialPlans.filter((r) => r.moduleId === moduleId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-red-500" />
          <h2 className="font-bold text-gray-800">
            {studentName ? `Tiến trình: ${studentName}` : "Tiến trình học viên"}
          </h2>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-3 w-3" />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <span className="ml-2 text-sm">Đang tải...</span>
        </div>
      ) : progressList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <TrendingUp className="mb-2 h-8 w-8" />
          <p className="text-sm">Học viên chưa có tiến trình nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {progressList.map((prog) => {
            const isExpanded = expandedModule === prog.moduleId;
            const modAssessments = assessmentsForModule(prog.moduleId);
            const modEvals = evalForModule(prog.moduleId);
            const modRemedial = remedialForModule(prog.moduleId);
            const latestAssessment = modAssessments[0];
            const latestEval = modEvals[0];

            return (
              <div key={prog.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Module summary row */}
                <div
                  className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-gray-50"
                  onClick={() => toggleModule(prog.moduleId)}
                >
                  <div className="mt-0.5 text-gray-400">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                        {prog.moduleCode ?? prog.moduleId.slice(0, 8)}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {prog.moduleName ?? prog.moduleId}
                      </span>
                      {prog.levelCode && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                          {prog.levelCode}
                        </span>
                      )}
                    </div>
                    <ProgressBar percent={prog.completionPercent} />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[prog.status]}`}>
                        {STATUS_LABEL[prog.status]}
                      </span>
                      {prog.promotionStatus && (
                        <span className="text-gray-500">
                          Promotion: {PROMOTION_LABEL[prog.promotionStatus]}
                        </span>
                      )}
                      {latestAssessment && (
                        <span className={`flex items-center gap-1 ${latestAssessment.result === "Pass" ? "text-green-600" : latestAssessment.result === "Fail" ? "text-red-500" : "text-gray-400"}`}>
                          {latestAssessment.result === "Pass" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          Assessment: {latestAssessment.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Action buttons */}
                  {(roleMode === "teacher" || roleMode === "admin" || roleMode === "staff") && (
                    <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setAssessmentModuleId(prog.moduleId); setAssessmentFormOpen(true); }}
                        className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        <Award className="inline h-3 w-3 mr-1" />
                        Assessment
                      </button>
                      <button
                        onClick={() => { setEvalModuleId(prog.moduleId); setEvalFormOpen(true); }}
                        className="rounded-lg border border-purple-200 px-2.5 py-1 text-xs text-purple-600 hover:bg-purple-50"
                      >
                        <BookOpen className="inline h-3 w-3 mr-1" />
                        Đánh giá
                      </button>
                      <button
                        onClick={() => setPromotionModuleId(prog.moduleId)}
                        className="rounded-lg border border-green-200 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        Xét lên lớp
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-4">
                    {/* Assessments */}
                    {modAssessments.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Kết quả kiểm tra
                        </p>
                        <div className="space-y-1.5">
                          {modAssessments.map((a) => (
                            <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm text-sm">
                              <span className={`font-bold ${a.result === "Pass" ? "text-green-600" : "text-red-500"}`}>
                                {a.score}/100
                              </span>
                              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${a.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {a.result === "Pass" ? "Đạt" : "Chưa đạt"}
                              </span>
                              <span className="flex-1 text-gray-600">{a.type}</span>
                              {a.teacherComment && (
                                <span className="text-xs text-gray-400 italic">"{a.teacherComment}"</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Teacher Evaluations */}
                    {modEvals.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Đánh giá giáo viên
                        </p>
                        {modEvals.slice(0, 1).map((ev) => (
                          <div key={ev.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                            <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                              {[
                                { label: "Nói", val: ev.speaking },
                                { label: "Nghe", val: ev.listening },
                                { label: "Đọc", val: ev.reading },
                                { label: "Viết", val: ev.writing },
                                { label: "Tham gia", val: ev.participation },
                                { label: "Tự tin", val: ev.confidence },
                              ].map((s) => (
                                <div key={s.label} className="text-center">
                                  <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${s.val >= 4 ? "bg-green-100 text-green-700" : s.val >= 3 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-600"}`}>
                                    {s.val}
                                  </div>
                                  <p className="text-gray-500">{s.label}</p>
                                </div>
                              ))}
                            </div>
                            {ev.notes && (
                              <p className="mt-2 text-xs text-gray-500 italic">"{ev.notes}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Remedial Plans */}
                    {modRemedial.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-orange-600 uppercase tracking-wide">
                          Kế hoạch phụ đạo
                        </p>
                        {modRemedial.map((r) => (
                          <div key={r.id} className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm">
                            <div className="flex items-center gap-2 text-orange-700">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="font-medium">{r.recommendedSessionCount} buổi phụ đạo</span>
                            </div>
                            {r.weakSkills && (
                              <p className="mt-1 text-xs text-orange-600">Kỹ năng yếu: {r.weakSkills}</p>
                            )}
                            {r.notes && (
                              <p className="mt-1 text-xs text-gray-500 italic">"{r.notes}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex gap-4 text-xs text-gray-400">
                      {prog.startedAt && <span>Bắt đầu: {new Date(prog.startedAt).toLocaleDateString("vi-VN")}</span>}
                      {prog.completedAt && <span>Hoàn thành: {new Date(prog.completedAt).toLocaleDateString("vi-VN")}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment Form Modal */}
      {assessmentFormOpen && (
        <AssessmentForm
          studentId={studentId}
          moduleId={assessmentModuleId}
          onClose={() => setAssessmentFormOpen(false)}
          onSuccess={() => { setAssessmentFormOpen(false); loadAll(); }}
        />
      )}

      {/* Teacher Evaluation Form Modal */}
      {evalFormOpen && (
        <TeacherEvaluationForm
          studentId={studentId}
          moduleId={evalModuleId}
          onClose={() => setEvalFormOpen(false)}
          onSuccess={() => { setEvalFormOpen(false); loadAll(); }}
        />
      )}

      {/* Promotion Decision Panel */}
      {promotionModuleId && (
        <PromotionDecisionPanel
          studentId={studentId}
          moduleId={promotionModuleId}
          onClose={() => setPromotionModuleId(null)}
          onSuccess={() => { setPromotionModuleId(null); loadAll(); }}
        />
      )}
    </div>
  );
}
