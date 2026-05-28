"use client";

import type { LessonPlanTemplate } from "@/lib/api/lessonPlanService";
import { buildFileUrl } from "@/constants/apiURL";

type ProcedureRowLike = {
  stage?: string;
  step?: string;
  details?: string;
  mediaLinks?: string[];
};

type LessonPlanTemplateDocumentProps = {
  template: LessonPlanTemplate;
  procedureRows?: ProcedureRowLike[];
  mediaLinks?: string[];
  className?: string;
};

function parseProcedureRows(text: string): ProcedureRowLike[] {
  if (!text?.trim()) return [];

  const cleaned = text.replace(/^\s*Stages\s*\|\s*Step\s*\|\s*Details\s*/i, "").trim();
  const rows: ProcedureRowLike[] = [];
  const rowRegex = /(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\s\S]*?)(?=\s+\d+\s*\||\s*$)/g;

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(cleaned)) !== null) {
    rows.push({
      stage: match[1].trim(),
      step: match[2].trim(),
      details: match[3].trim(),
      mediaLinks: [],
    });
  }

  return rows;
}

function formatDetailsText(text: string): string {
  if (!text?.trim()) return text;

  return text
    .replace(/[ \t]+((?:I{1,3}|IV|VI{0,3}|IX|X{1,3}I{0,3}|X))\s*\.\s+/g, "\n$1. ")
    .replace(/[ \t]+(\d+)\.\s+([A-Z*\-])/g, "\n$1. $2")
    .trim();
}

export default function LessonPlanTemplateDocument({
  template,
  procedureRows,
  mediaLinks,
  className,
}: LessonPlanTemplateDocumentProps) {
  const normalizedRows =
    Array.isArray(procedureRows) && procedureRows.length > 0
      ? procedureRows
      : parseProcedureRows(template.procedure || "");

  const normalizedMediaLinks = Array.isArray(mediaLinks)
    ? Array.from(new Set(mediaLinks.filter(Boolean)))
    : [];

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm ${className || ""}`}>
      <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500">
          {template.programName && (
            <>
              <span className="font-semibold text-slate-700">{template.programName}</span>
              <span className="text-gray-300">&gt;</span>
            </>
          )}
          {(template.levelName || template.level) && (
            <>
              <span className="font-semibold text-indigo-600">{template.levelName || template.level}</span>
              <span className="text-gray-300">&gt;</span>
            </>
          )}
          {(template.moduleName || template.moduleCode) && (
            <>
              <span className="font-semibold text-red-600">{template.moduleName || template.moduleCode}</span>
              <span className="text-gray-300">&gt;</span>
            </>
          )}
          {template.lessonPlanUnitName && (
            <>
              <span className="font-semibold text-orange-600">{template.lessonPlanUnitName}</span>
              <span className="text-gray-300">&gt;</span>
            </>
          )}
          <span className="font-bold text-gray-900 truncate max-w-[220px]">{template.title}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {[
            template.programName && { label: "Course", value: template.programName, color: "bg-slate-100 text-slate-700 border-slate-200" },
            (template.levelName || template.level) && { label: "Level", value: template.levelName || template.level, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            (template.moduleName || template.moduleCode) && { label: "Module", value: template.moduleName || template.moduleCode, color: "bg-red-50 text-red-700 border-red-200" },
            template.lessonPlanUnitName && { label: "Unit", value: template.lessonPlanUnitName, color: "bg-orange-50 text-orange-700 border-orange-200" },
            (template.sessionOrder != null || template.sessionIndex != null) && {
              label: "Lesson",
              value: `#${template.sessionOrder ?? template.sessionIndex}`,
              color: "bg-emerald-50 text-emerald-700 border-emerald-200",
            },
          ]
            .filter(Boolean)
            .map((badge, index) => {
              const b = badge as { label: string; value: string | number | undefined; color: string };
              return (
                <span key={index} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${b.color}`}>
                  <span className="opacity-60">{b.label}</span>
                  <span>{b.value}</span>
                </span>
              );
            })}
        </div>
      </div>

      <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 text-center space-y-1">
        <div className="text-base font-bold text-gray-900">{template.title}</div>
        {template.createdByName && <div className="text-[11px] text-gray-400">Tạo bởi {template.createdByName}</div>}
      </div>

      <div className="divide-y divide-gray-100">
        {template.objectives && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-emerald-50/70 border-r border-emerald-100">
              <span className="text-xs font-extrabold text-emerald-700">A</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 mb-1.5">Objectives / Mục tiêu</div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.objectives}</div>
            </div>
          </div>
        )}

        {(template.languageContent || template.vocabulary || template.grammar) && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-blue-50/70 border-r border-blue-100">
              <span className="text-xs font-extrabold text-blue-700">B</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700 mb-1.5">Language Content / Nội dung ngôn ngữ</div>
              {template.languageContent && <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6 mb-1">{template.languageContent}</div>}
              {template.vocabulary && <div className="text-sm text-gray-700 mb-0.5"><span className="font-semibold text-blue-600">Vocabulary: </span>{template.vocabulary}</div>}
              {template.grammar && <div className="text-sm text-gray-700"><span className="font-semibold text-blue-600">Grammar: </span>{template.grammar}</div>}
            </div>
          </div>
        )}

        {template.teachingMethodology && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-orange-50/70 border-r border-orange-100">
              <span className="text-xs font-extrabold text-orange-700">C</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-700 mb-1.5">Teaching Methodology / Phương pháp</div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.teachingMethodology}</div>
            </div>
          </div>
        )}

        {template.teacherMaterials && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-amber-50/70 border-r border-amber-100">
              <span className="text-xs font-extrabold text-amber-700">D</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-1.5">Materials for Teacher / Học liệu giáo viên</div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.teacherMaterials}</div>
            </div>
          </div>
        )}

        {template.studentMaterials && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-yellow-50/70 border-r border-yellow-100">
              <span className="text-xs font-extrabold text-yellow-600">E</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-1.5">Materials for Students / Học liệu học viên</div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.studentMaterials}</div>
            </div>
          </div>
        )}

        {(template.procedure || normalizedRows.length > 0) && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-teal-50/70 border-r border-teal-100">
              <span className="text-xs font-extrabold text-teal-700">F</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700 mb-2">Procedure / Tiến trình dạy</div>
              {normalizedRows.length > 0 ? (
                <div className="rounded-xl border border-teal-200 overflow-hidden text-sm">
                  <div className="grid grid-cols-[2.5rem_9rem_1fr] bg-teal-50 border-b border-teal-200 text-[11px] font-semibold text-teal-700">
                    <div className="px-2 py-2 text-center border-r border-teal-200">Stages</div>
                    <div className="px-3 py-2 text-center border-r border-teal-200">Step</div>
                    <div className="px-3 py-2 text-left">Details</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {normalizedRows.map((row, index) => (
                      <div key={`procedure-row-${index}`} className={`grid grid-cols-[2.5rem_9rem_1fr] ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <div className="px-2 py-3 text-center font-bold text-gray-600 border-r border-gray-100">{row.stage || String(index + 1)}</div>
                        <div className="px-3 py-3 font-semibold text-gray-700 border-r border-gray-100 leading-5">{row.step || "-"}</div>
                        <div className="px-3 py-3 text-gray-700 leading-6">
                          <div className="whitespace-pre-wrap">{formatDetailsText(row.details || "-")}</div>
                          {!!row.mediaLinks?.length && (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {row.mediaLinks.map((link, mediaIndex) => {
                                const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(link);
                                return (
                                  <a
                                    key={`procedure-media-${index}-${mediaIndex}`}
                                    href={buildFileUrl(link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] text-teal-700 hover:bg-teal-100"
                                  >
                                    {isImage ? "Xem ảnh minh họa" : "Xem media/link"}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.procedure}</div>
              )}
            </div>
          </div>
        )}

        {template.evaluation && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-red-50/70 border-r border-red-100">
              <span className="text-xs font-extrabold text-red-700">G</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-700 mb-1.5">Evaluation / Đánh giá</div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.evaluation}</div>
            </div>
          </div>
        )}

        {template.homework && (
          <div className="flex">
            <div className="w-10 flex-shrink-0 flex items-start justify-center pt-4 bg-pink-50/70 border-r border-pink-100">
              <span className="text-xs font-extrabold text-pink-700">H</span>
            </div>
            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-pink-700 mb-1.5">Homework / Bài tập về nhà</div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.homework}</div>
            </div>
          </div>
        )}

        {template.teacherNote && (
          <div className="px-5 py-3 bg-yellow-50/50">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-700 mb-1">Teacher Note / Ghi chú giáo án</div>
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-6">{template.teacherNote}</div>
          </div>
        )}

        {!template.objectives && !template.languageContent && !template.vocabulary && !template.grammar
          && !template.teachingMethodology && !template.teacherMaterials && !template.studentMaterials
          && !template.procedure && !template.evaluation && !template.homework && (
          <div className="px-5 py-4">
            {template.syllabusContent ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700">{template.syllabusContent}</div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Mẫu giáo án này chưa có dữ liệu syllabus chi tiết.
              </div>
            )}
          </div>
        )}
      </div>

      {normalizedMediaLinks.length > 0 && (
        <div className="border-t border-cyan-100 bg-cyan-50/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Media / Hình ảnh tham chiếu</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {normalizedMediaLinks.map((link, index) => {
              const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(link);
              return (
                <a
                  key={`lesson-media-${index}`}
                  href={buildFileUrl(link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs text-cyan-700 hover:bg-cyan-50"
                >
                  {isImage ? "Mở ảnh trong tab mới" : "Mở media/link trong tab mới"}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
