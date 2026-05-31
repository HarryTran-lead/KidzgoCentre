"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowUp, ArrowDown, Save, Trash2, Plus, CheckCircle, Archive, Loader2, GripVertical, FileText, Heading, List, Settings, ChevronDown, ChevronRight, Edit3, Check, X, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import {
  addSyllabusSection,
  addSyllabusTableRow,
  archiveSyllabusDocument,
  deleteSyllabusTableRow,
  getSyllabusDocument,
  publishSyllabusDocument,
  reorderSyllabusSections,
  updateSyllabusDocumentMetadata,
  updateSyllabusSection,
  updateSyllabusTableCell,
  type SyllabusDocument,
  type SyllabusDocumentSectionType,
  type SyllabusDocumentSection,
} from "@/lib/api/syllabusService";
import { useToast } from "@/hooks/use-toast";

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Section Type Badge
const SectionTypeBadge = ({ type }: { type: string }) => {
  const config = {
    heading: { label: "Heading", color: "purple", icon: Heading },
    narrative: { label: "Narrative", color: "blue", icon: FileText },
    list: { label: "List", color: "green", icon: List },
    table: { label: "Curriculum", color: "red", icon: BookOpen },
  };
  const c = config[type as keyof typeof config] || config.narrative;
  const Icon = c.icon;
  const colorClasses = {
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${colorClasses[c.color as keyof typeof colorClasses]}`}>
      <Icon size={10} />
      {c.label}
    </span>
  );
};

// Status Badge
function StatusBadge({ status }: { status?: string | null }) {
  const safeStatus = status ?? "Draft";
  const config = {
    Draft: { color: "amber", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    Published: { color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Archived: { color: "gray", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  };
  const c = config[safeStatus as keyof typeof config] || config.Draft;
  return (
    <span className={`inline-flex items-center rounded-full border ${c.border} ${c.bg} px-2.5 py-0.5 text-xs font-semibold ${c.text}`}>
      {safeStatus}
    </span>
  );
}

// Auto-saving indicator
function AutoSaveIndicator({ isSaving, lastSaved }: { isSaving: boolean; lastSaved: Date | null }) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        <span>Đang lưu...</span>
      </div>
    );
  }
  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Check size={10} className="text-emerald-500" />
        <span>Đã lưu {formatDistanceToNow(lastSaved)}</span>
      </div>
    );
  }
  return null;
}

function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return "vừa xong";
  if (seconds < 60) return `${seconds} giây trước`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  return `${Math.floor(minutes / 60)} giờ trước`;
}

// Modern Table Component
function ModernCurriculumTable({
  section,
  cellDraft,
  savingCellKey,
  isReadOnly,
  onCellChange,
  onSaveCell,
  onAddRow,
  onDeleteRow,
}: {
  section: SyllabusDocumentSection;
  cellDraft: Record<string, string>;
  savingCellKey: string | null;
  isReadOnly: boolean;
  onCellChange: (rowId: string, columnKey: string, value: string) => void;
  onSaveCell: (rowId: string, columnKey: string) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
}) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingSave] = useState<{ rowId: string; columnKey: string } | null>(null);

  const handleCellEdit = (rowId: string, columnKey: string, currentValue: string) => {
    setEditingCell(`${rowId}:${columnKey}`);
    setTempValue(currentValue);
  };

  const handleCellSave = (rowId: string, columnKey: string) => {
    onCellChange(rowId, columnKey, tempValue);
    onSaveCell(rowId, columnKey);
    setEditingCell(null);
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue("");
  };

  const columns = section.table?.columns || [];
  const rows = section.table?.rows || [];

  return (
    <div className="space-y-3">
      {/* Modern Table Design */}
      <div className="overflow-x-auto">
        <table className="min-w-200 w-full">
            <thead>
              <tr className="bg-linear-to-r from-red-50/80 to-red-100/50 border-b border-red-200">
                {columns.map((column, idx) => (
                  <th 
                    key={column.key} 
                    className={classNames(
                      "px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700",
                      idx === 0 && "rounded-tl-xl"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {column.label || column.key}
                    </div>
                  </th>
                ))}
                <th className="w-12 px-4 py-3 text-center rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100/50">
              {rows.map((row, rowIdx) => (
                <tr 
                  key={row.rowId} 
                  className={classNames(
                    "transition-colors",
                    rowIdx % 2 === 0 ? "bg-white" : "bg-red-50/20",
                    "hover:bg-red-100/30"
                  )}
                >
                  {columns.map((column) => {
                    const key = `${section.sectionId}:${row.rowId}:${column.key}`;
                    const isEditing = editingCell === `${row.rowId}:${column.key}`;
                    const isSaving = savingCellKey === key;
                    const value = cellDraft[key] ?? "";
                    
                    return (
                      <td key={column.key} className="px-4 py-3 align-top">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              ref={textareaRef}
                              className="min-h-60 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleCellCancel();
                                if (e.key === 'Enter' && e.ctrlKey) handleCellSave(row.rowId, column.key);
                              }}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-gray-400">Ctrl+Enter để lưu</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleCellCancel}
                                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <X size={10} />
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleCellSave(row.rowId, column.key)}
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                  Lưu
                                </button>
                                
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className={classNames(
                              "group/cell relative min-h-15 rounded-lg p-2 transition-all duration-300 ease-out cursor-text",
                              !isReadOnly && "hover:bg-red-100/50 hover:shadow-sm"
                            )}
                            onClick={() => !isReadOnly && handleCellEdit(row.rowId, column.key, value)}
                          >
                            <div className="whitespace-pre-wrap text-sm text-gray-700">
                              {value || <span className="text-gray-300 italic">Nhấn để nhập...</span>}
                            </div>
                            {!isReadOnly && (
                              <div className="absolute right-1 top-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                <Edit3 size={12} className="text-gray-400" />
                              </div>
                            )}
                            {pendingSave && pendingSave.rowId === row.rowId && pendingSave.columnKey === column.key && (
                              <div className="absolute bottom-1 right-1">
                                <Loader2 size={10} className="animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center align-top">
                    {!isReadOnly && (
                      <button
                        onClick={() => onDeleteRow(row.rowId)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-all duration-300 ease-out hover:scale-105 cursor-pointer"
                        title="Xóa dòng"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Add Row Button */}
      {!isReadOnly && (
        <div className="flex justify-center">
          <button
            onClick={onAddRow}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-red-300 bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-2 text-sm font-medium text-red-600 hover:from-red-100 hover:to-red-200/50 hover:border-red-400 hover:shadow-sm transition-all duration-300 ease-out cursor-pointer group"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform duration-300" />
            Thêm dòng mới
          </button>
        </div>
      )}
    </div>
  );
}

// Draggable Section Component
function DraggableSection({
  section,
  index,
  total,
  sectionDraft,
  cellDraft,
  savingCellKey,
  isExpanded,
  isReadOnly,
  saving,
  savingSectionId,
  onToggle,
  onMove,
  onSaveSection,
  onSaveCell,
  onAddRow,
  onDeleteRow,
  onTitleChange,
  onContentChange,
  onCellChange,
  dragHandleProps,
  isDragging,
}: {
  section: SyllabusDocumentSection;
  index: number;
  total: number;
  sectionDraft: Record<string, { title: string; content: string }>;
  cellDraft: Record<string, string>;
  savingCellKey: string | null;
  isExpanded: boolean;
  isReadOnly: boolean;
  saving: boolean;
  savingSectionId: string | null;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onSaveSection: () => void;
  onSaveCell: (rowId: string, columnKey: string) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onCellChange: (rowId: string, columnKey: string, value: string) => void;
  dragHandleProps?: {
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
  };
  isDragging?: boolean;
}) {
  const getCardColors = () => {
    return "border-red-200 bg-gradient-to-br from-white to-red-100/40";
  };

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const currentContent = sectionDraft[section.sectionId]?.content ?? "";

  useEffect(() => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [currentContent, isExpanded]);
  
  return (
    <div 
      className={classNames(
        "rounded-xl border overflow-hidden transition-all duration-300 ease-out",
        getCardColors(),
        isDragging && "opacity-50 shadow-lg ring-2 ring-red-400",
        !isDragging && "shadow-sm hover:shadow-md"
      )}
    >
      {/* Section Header */}
      <div 
        className={classNames(
          "flex cursor-pointer items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50/80 to-red-100/30 transition-all duration-300 ease-out group",
          isReadOnly ? "px-4 py-3" : "pl-2 pr-4 py-3"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          {!isReadOnly && dragHandleProps && (
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-all duration-300 ease-out hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={16} />
            </div>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-rose-500 text-xs font-bold text-white shadow-sm transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-md">
            {index + 1}
          </div>
          <div className="flex items-center gap-2 group-hover:gap-2.5 transition-all duration-300 ease-out">
            <SectionTypeBadge type={section.type} />
            <span className="text-sm font-semibold text-gray-800 transition-all duration-300 ease-out">
              {section.title || `${section.type} section`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 transition-all duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
          <button
            disabled={saving || isReadOnly || index === 0}
            onClick={() => onMove(-1)}
            className="rounded-md p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 transition-all duration-300 ease-out hover:scale-105 cursor-pointer"
            title="Di chuyển lên"
          >
            <ArrowUp size={14} />
          </button>
          <button
            disabled={saving || isReadOnly || index === total - 1}
            onClick={() => onMove(1)}
            className="rounded-md p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 transition-all duration-300 ease-out hover:scale-105 cursor-pointer"
            title="Di chuyển xuống"
          >
            <ArrowDown size={14} />
          </button>
          <button className="ml-1 p-1 text-gray-400 cursor-pointer transition-all duration-300 ease-out hover:text-red-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Title & Content - Only for non-table sections */}
          {section.type !== "table" && (
            <>
              <div className="grid gap-4 grid-cols-1">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Tiêu đề</label>
                  <input
                    className="w-full rounded-lg border border-red-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 disabled:bg-gray-50 transition-all duration-300 ease-out hover:shadow-md hover:border-red-300"
                    value={sectionDraft[section.sectionId]?.title ?? ""}
                    onChange={(e) => onTitleChange(e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Nhập tiêu đề..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Nội dung</label>
                  <textarea
                    ref={contentTextareaRef}
                    className="min-h-10 w-full rounded-lg border border-red-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 disabled:bg-gray-50 resize-none transition-all duration-300 ease-out hover:shadow-md hover:border-red-300"
                    value={sectionDraft[section.sectionId]?.content ?? ""}
                    onChange={(e) => onContentChange(e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Nhập nội dung..."
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  disabled={savingSectionId === section.sectionId || isReadOnly}
                  onClick={onSaveSection}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:shadow-md transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
                >
                  {savingSectionId === section.sectionId ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Lưu thay đổi
                </button>
              </div>
            </>
          )}

          {/* Modern Curriculum Table */}
          {section.type === "table" && section.table && (
            <ModernCurriculumTable
              section={section}
              cellDraft={cellDraft}
              savingCellKey={savingCellKey}
              isReadOnly={isReadOnly}
              onCellChange={onCellChange}
              onSaveCell={onSaveCell}
              onAddRow={onAddRow}
              onDeleteRow={onDeleteRow}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function SyllabusDocumentEditorPage() {
  const { toast } = useToast();
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "vi";
  const syllabusId = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState<SyllabusDocument | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const [metaCode, setMetaCode] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaEdition, setMetaEdition] = useState("");
  const [metaMinutesPerPeriod, setMetaMinutesPerPeriod] = useState("");

  const [newSectionType, setNewSectionType] = useState<SyllabusDocumentSectionType>("narrative");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  const [sectionDraft, setSectionDraft] = useState<Record<string, { title: string; content: string }>>({});
  const [cellDraft, setCellDraft] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isReadOnly = (document?.status ?? "Draft") !== "Draft";

  const syncFromDocument = (next: SyllabusDocument | null) => {
    setDocument(next);
    if (!next) return;
    setMetaCode(next.code ?? "");
    setMetaTitle(next.title ?? "");
    setMetaEdition(next.edition ?? "");
    setMetaMinutesPerPeriod(String(next.summary?.minutesPerPeriod ?? ""));

    const nextSectionDraft: Record<string, { title: string; content: string }> = {};
    const nextCellDraft: Record<string, string> = {};

    for (const section of next.sections) {
      nextSectionDraft[section.sectionId] = {
        title: section.title ?? "",
        content: section.content ?? "",
      };

      if (section.type === "table" && section.table) {
        for (const row of section.table.rows) {
          for (const column of section.table.columns) {
            const cell = row.cells.find((item) => item.columnKey === column.key);
            nextCellDraft[`${section.sectionId}:${row.rowId}:${column.key}`] = cell?.value ?? "";
          }
        }
      }
    }

    setSectionDraft(nextSectionDraft);
    setCellDraft(nextCellDraft);
  };

  const loadDocument = async () => {
    if (!syllabusId) return;
    setLoading(true);
    try {
      const res = await getSyllabusDocument(syllabusId);
      if (!res.isSuccess || !res.data) {
        toast({ title: "Không thể tải document", description: res.message ?? "Vui lòng thử lại.", variant: "destructive" });
        return;
      }
      syncFromDocument(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syllabusId]);

  const expectedVersion = useMemo(() => document?.version ?? 0, [document]);

  const applyMutationResult = (next: SyllabusDocument | null, successMessage: string) => {
    if (!next) return;
    syncFromDocument(next);
    setLastAutoSave(new Date());
    toast({ title: successMessage, variant: "success" });
  };

  const handleSaveMetadata = async () => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await updateSyllabusDocumentMetadata(document.id, {
        expectedVersion,
        code: metaCode.trim(),
        title: metaTitle.trim(),
        edition: metaEdition.trim() || null,
        minutesPerPeriod: metaMinutesPerPeriod ? Number(metaMinutesPerPeriod) : null,
      });
      if (!res.isSuccess) {
        toast({ title: "Lưu metadata thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã lưu metadata");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!document) return;
    setSaving(true);
    try {
      const nextOrder = (document.sections.reduce((max, section) => Math.max(max, section.orderIndex ?? 0), 0) || 0) + 1;
      const res = await addSyllabusSection(document.id, {
        expectedVersion,
        section: {
          type: newSectionType,
          title: newSectionTitle.trim() || null,
          content: newSectionType === "table" ? null : newSectionContent.trim() || null,
          orderIndex: nextOrder,
        },
      });
      if (!res.isSuccess) {
        toast({ title: "Thêm section thất bại", description: res.message, variant: "destructive" });
        return;
      }
      setNewSectionTitle("");
      setNewSectionContent("");
      setShowAddSection(false);
      applyMutationResult(res.data, "Đã thêm section");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!document) return;
    const draft = sectionDraft[sectionId] ?? { title: "", content: "" };
    setSavingSectionId(sectionId);
    try {
      const res = await updateSyllabusSection(document.id, sectionId, {
        expectedVersion,
        title: draft.title.trim() || null,
        content: draft.content.trim() || null,
      });
      if (!res.isSuccess) {
        toast({ title: "Lưu section thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã lưu section");
    } finally {
      setSavingSectionId(null);
    }
  };

  const handleMoveSection = async (sectionId: string, direction: -1 | 1) => {
    if (!document) return;
    const sorted = [...document.sections].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const index = sorted.findIndex((section) => section.sectionId === sectionId);
    const target = sorted[index + direction];
    if (index < 0 || !target) return;

    const swapped = [...sorted];
    [swapped[index], swapped[index + direction]] = [swapped[index + direction], swapped[index]];
    const orders = swapped.map((section, orderIdx) => ({ sectionId: section.sectionId, orderIndex: orderIdx + 1 }));

    setSaving(true);
    try {
      const res = await reorderSyllabusSections(document.id, { expectedVersion, orders });
      if (!res.isSuccess) {
        toast({ title: "Sắp xếp section thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã cập nhật thứ tự section");
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop reorder
  const handleDragStart = (index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isReadOnly) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (isReadOnly || draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (!document) return;

    const sorted = [...document.sections].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const [removed] = sorted.splice(draggedIndex, 1);
    sorted.splice(dragOverIndex, 0, removed);
    const orders = sorted.map((section, orderIdx) => ({ sectionId: section.sectionId, orderIndex: orderIdx + 1 }));

    setSaving(true);
    try {
      const res = await reorderSyllabusSections(document.id, { expectedVersion, orders });
      if (!res.isSuccess) {
        toast({ title: "Sắp xếp section thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã cập nhật thứ tự section");
    } finally {
      setSaving(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  const handleSaveCell = async (sectionId: string, rowId: string, columnKey: string) => {
    if (!document) return;
    const key = `${sectionId}:${rowId}:${columnKey}`;
    setSavingCellKey(key);
    try {
      const res = await updateSyllabusTableCell(document.id, sectionId, rowId, columnKey, {
        expectedVersion,
        value: cellDraft[key] ?? "",
      });
      if (!res.isSuccess) {
        toast({ title: "Lưu ô thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã lưu ô");
    } finally {
      setSavingCellKey(null);
    }
  };

  const handleAddRow = async (sectionId: string) => {
    if (!document) return;
    const section = document.sections.find((item) => item.sectionId === sectionId);
    const table = section?.table;
    if (!table) return;

    const nextOrder = (table.rows.reduce((max, row) => Math.max(max, row.orderIndex ?? 0), 0) || 0) + 1;
    const cells = table.columns.map((column) => ({ columnKey: column.key, value: "" }));

    setSaving(true);
    try {
      const res = await addSyllabusTableRow(document.id, sectionId, {
        expectedVersion,
        orderIndex: nextOrder,
        cells,
      });
      if (!res.isSuccess) {
        toast({ title: "Thêm dòng thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã thêm dòng");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRow = async (sectionId: string, rowId: string) => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await deleteSyllabusTableRow(document.id, sectionId, rowId, expectedVersion);
      if (!res.isSuccess) {
        toast({ title: "Xóa dòng thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã xóa dòng");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await publishSyllabusDocument(document.id, { expectedVersion });
      if (!res.isSuccess) {
        toast({ title: "Publish thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã publish syllabus");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await archiveSyllabusDocument(document.id, { expectedVersion, reason: "Archived from editor" });
      if (!res.isSuccess) {
        toast({ title: "Archive thất bại", description: res.message, variant: "destructive" });
        return;
      }
      applyMutationResult(res.data, "Đã archive syllabus");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-red-50/20">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-200 blur-xl opacity-50 animate-pulse" />
            <Loader2 size={40} className="animate-spin text-red-500 mx-auto mb-3 relative" />
          </div>
          <p className="text-sm text-gray-500">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="rounded-full bg-red-100 p-4 mx-auto mb-3 w-fit">
            <BookOpen size={32} className="text-red-500" />
          </div>
          <p className="text-sm text-red-600">Không tìm thấy syllabus document.</p>
        </div>
      </div>
    );
  }

  const sortedSections = [...document.sections].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 to-red-50/20 p-4 md:p-2">
      <div className="mx-auto max-w-7xl ">
        {/* Header Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/portal/admin/syllabuses`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer group">
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              Danh sách
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">{metaCode || "Syllabus"}</span>
              <StatusBadge status={document.status ?? "Draft"} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AutoSaveIndicator isSaving={saving} lastSaved={lastAutoSave} />
            <button
              onClick={handleArchive}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Archive size={12} />
              Lưu trữ
            </button>
            {document.status === "Draft" && (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <CheckCircle size={12} />
                Xuất bản
              </button>
            )}
            
          </div>
        </div>

        {/* Metadata Card */}
        <div className="mb-6 rounded-xl border border-rose-200 bg-gradient-to-br from-white to-rose-100/40 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-rose-100 bg-gradient-to-r from-rose-50/80 to-rose-100/30 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 p-1.5 text-white shadow-sm">
                <Settings size={14} />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h2>
            </div>
            <button
              onClick={handleSaveMetadata}
              disabled={saving || isReadOnly}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 text-sm font-semibold text-white hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
              Lưu
            </button>
          </div>
          <div className="p-5">
            <div className="grid gap-4 grid-cols-2">
              <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Mã syllabus</label>
                <input 
                  className="w-full rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:bg-gray-50 transition-all"
                  value={metaCode} 
                  onChange={(e) => setMetaCode(e.target.value)} 
                  disabled={isReadOnly}
                  placeholder="VD: SYL_001"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Tiêu đề</label>
                <input 
                  className="w-full rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:bg-gray-50 transition-all" 
                  value={metaTitle} 
                  onChange={(e) => setMetaTitle(e.target.value)} 
                  disabled={isReadOnly}
                  placeholder="Tiêu đề syllabus"
                />
              </div>
              <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Phiên bản</label>
                <input 
                  className="w-full rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:bg-gray-50 transition-all" 
                  value={metaEdition} 
                  onChange={(e) => setMetaEdition(e.target.value)} 
                  disabled={isReadOnly}
                  placeholder="v1.0.0"
                />
              </div>
              <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Thời lượng</label>
                <input 
                  className="w-full rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:bg-gray-50 transition-all" 
                  value={metaMinutesPerPeriod} 
                  onChange={(e) => setMetaMinutesPerPeriod(e.target.value)} 
                  disabled={isReadOnly}
                  placeholder="45"
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Section Toggle */}
        {!isReadOnly && (
          <div className="mb-5">
            {!showAddSection ? (
              <div>
              <h1 className="mb-3 text-xl font-semibold text-gray-700">Sections ({sortedSections.length})</h1>
                <button
                  onClick={() => setShowAddSection(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-red-300 bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-2 text-sm font-medium text-red-600 hover:from-red-100 hover:to-red-200/50 transition-all cursor-pointer group"
                >
                  <Plus size={16} className="group-hover:scale-110 transition-transform" />
                  Thêm section mới
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-100/40 shadow-md p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 p-1.5 text-white shadow-sm">
                      <Plus size={14} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Thêm section mới</h3>
                  </div>
                  <button onClick={() => setShowAddSection(false)} className="rounded-lg p-1 text-gray-400 hover:bg-red-100 hover:text-gray-600 transition-colors cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Loại</label>
                    <Select value={newSectionType} onValueChange={(value) => setNewSectionType(value as SyllabusDocumentSectionType)}>
                      <SelectTrigger className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heading"> Heading</SelectItem>
                        <SelectItem value="narrative"> Narrative</SelectItem>
                        <SelectItem value="list"> List</SelectItem>
                        <SelectItem value="table"> Curriculum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Tiêu đề</label>
                    <input 
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all" 
                      value={newSectionTitle} 
                      onChange={(e) => setNewSectionTitle(e.target.value)} 
                      placeholder="Tiêu đề section"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-600 tracking-wide">Nội dung</label>
                    <input 
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all" 
                      value={newSectionContent} 
                      onChange={(e) => setNewSectionContent(e.target.value)} 
                      placeholder="Nội dung (không áp dụng cho Curriculum)"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleAddSection}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Thêm section
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sections List */}
        <div className="space-y-6">
          {sortedSections.map((section, index) => (
            <div
              key={section.sectionId}
              draggable={!isReadOnly}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={classNames(
                "transition-all duration-200",
                dragOverIndex === index && draggedIndex !== null && "translate-y-1"
              )}
            >
              <DraggableSection
                section={section}
                index={index}
                total={sortedSections.length}
                sectionDraft={sectionDraft}
                cellDraft={cellDraft}
                savingCellKey={savingCellKey}
                isExpanded={expandedSections[section.sectionId] ?? true}
                isReadOnly={isReadOnly}
                saving={saving}
                savingSectionId={savingSectionId}
                onToggle={() => toggleSection(section.sectionId)}
                onMove={(direction) => handleMoveSection(section.sectionId, direction)}
                onSaveSection={() => handleSaveSection(section.sectionId)}
                onSaveCell={(rowId, columnKey) => handleSaveCell(section.sectionId, rowId, columnKey)}
                onAddRow={() => handleAddRow(section.sectionId)}
                onDeleteRow={(rowId) => handleDeleteRow(section.sectionId, rowId)}
                onTitleChange={(title) =>
                  setSectionDraft((prev) => ({
                    ...prev,
                    [section.sectionId]: { ...(prev[section.sectionId] ?? { title: "", content: "" }), title },
                  }))
                }
                onContentChange={(content) =>
                  setSectionDraft((prev) => ({
                    ...prev,
                    [section.sectionId]: { ...(prev[section.sectionId] ?? { title: "", content: "" }), content },
                  }))
                }
                onCellChange={(rowId, columnKey, value) => {
                  const key = `${section.sectionId}:${rowId}:${columnKey}`;
                  setCellDraft((prev) => ({ ...prev, [key]: value }));
                }}
                dragHandleProps={!isReadOnly ? {
                  draggable: true,
                  onDragStart: (e: React.DragEvent) => {
                    e.stopPropagation();
                    handleDragStart(index);
                  },
                } : undefined}
                isDragging={draggedIndex === index}
              />
            </div>
          ))}

          {sortedSections.length === 0 && (
            <div className="rounded-xl border border-dashed border-red-200 bg-gradient-to-br from-white to-red-100/40 py-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4">
                <BookOpen size={28} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Chưa có section nào</p>
              <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm section mới&quot; để bắt đầu xây dựng nội dung</p>
            </div>
          )}
        </div>
        
        {/* Drag & Drop Hint */}
        {!isReadOnly && sortedSections.length > 0 && (
          <div className="mt-5 pt-2 text-center border-t border-red-100">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <GripVertical size={12} />
              Kéo thả các section để sắp xếp lại thứ tự
            </p>
          </div>
        )}
      </div>
    </div>
  );
}