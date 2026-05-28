"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
} from "@/lib/api/syllabusService";
import { useToast } from "@/hooks/use-toast";

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SyllabusDocumentEditorPage() {
  const { toast } = useToast();
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "vi";
  const syllabusId = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState<SyllabusDocument | null>(null);

  const [metaCode, setMetaCode] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaEdition, setMetaEdition] = useState("");
  const [metaMinutesPerPeriod, setMetaMinutesPerPeriod] = useState("");

  const [newSectionType, setNewSectionType] = useState<SyllabusDocumentSectionType>("narrative");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");

  const [sectionDraft, setSectionDraft] = useState<Record<string, { title: string; content: string }>>({});
  const [cellDraft, setCellDraft] = useState<Record<string, string>>({});

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
  }, [syllabusId]);

  const expectedVersion = useMemo(() => document?.version ?? 0, [document]);

  const applyMutationResult = (next: SyllabusDocument | null, successMessage: string) => {
    if (!next) return;
    syncFromDocument(next);
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
      applyMutationResult(res.data, "Đã thêm section");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!document) return;
    const draft = sectionDraft[sectionId] ?? { title: "", content: "" };
    setSaving(true);
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
      setSaving(false);
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

  const handleSaveCell = async (sectionId: string, rowId: string, columnKey: string) => {
    if (!document) return;
    const key = `${sectionId}:${rowId}:${columnKey}`;
    setSaving(true);
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
      setSaving(false);
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

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Đang tải syllabus document...</div>;
  }

  if (!document) {
    return <div className="p-6 text-sm text-red-600">Không tìm thấy syllabus document.</div>;
  }

  const sortedSections = [...document.sections].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/${locale}/portal/admin/syllabuses`} className="text-sm text-gray-500 hover:text-red-600">
              ← Quay lại danh sách syllabus
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Document Editor</h1>
            <p className="text-sm text-gray-500">ID: {document.id} · Version: {document.version} · Status: {document.status}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving || isReadOnly}
              onClick={handlePublish}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Publish
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleArchive}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Archive
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">Metadata</p>
          <div className="grid gap-3 md:grid-cols-4">
            <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={metaCode} onChange={(e) => setMetaCode(e.target.value)} placeholder="Code" />
            <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Title" />
            <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={metaEdition} onChange={(e) => setMetaEdition(e.target.value)} placeholder="Edition" />
            <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={metaMinutesPerPeriod} onChange={(e) => setMetaMinutesPerPeriod(e.target.value)} placeholder="Minutes/period" />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={saving || isReadOnly}
              onClick={handleSaveMetadata}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Lưu metadata
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">Thêm section</p>
          <div className="grid gap-3 md:grid-cols-4">
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={newSectionType} onChange={(e) => setNewSectionType(e.target.value as SyllabusDocumentSectionType)}>
              <option value="heading">heading</option>
              <option value="narrative">narrative</option>
              <option value="list">list</option>
              <option value="table">table</option>
            </select>
            <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Section title" />
            <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2" value={newSectionContent} onChange={(e) => setNewSectionContent(e.target.value)} placeholder="Section content" />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={saving || isReadOnly}
              onClick={handleAddSection}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Thêm section
            </button>
          </div>
        </div>

        {sortedSections.map((section, index) => (
          <div key={section.sectionId} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Section #{index + 1} · {section.type} · {section.sectionId}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving || isReadOnly}
                  onClick={() => handleMoveSection(section.sectionId, -1)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={saving || isReadOnly}
                  onClick={() => handleMoveSection(section.sectionId, 1)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  ↓
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={sectionDraft[section.sectionId]?.title ?? ""}
                onChange={(e) =>
                  setSectionDraft((prev) => ({
                    ...prev,
                    [section.sectionId]: { ...(prev[section.sectionId] ?? { title: "", content: "" }), title: e.target.value },
                  }))
                }
                placeholder="Section title"
              />
              {section.type !== "table" && (
                <textarea
                  className="min-h-20 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={sectionDraft[section.sectionId]?.content ?? ""}
                  onChange={(e) =>
                    setSectionDraft((prev) => ({
                      ...prev,
                      [section.sectionId]: { ...(prev[section.sectionId] ?? { title: "", content: "" }), content: e.target.value },
                    }))
                  }
                  placeholder="Section content"
                />
              )}
            </div>

            {section.type !== "table" && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={saving || isReadOnly}
                  onClick={() => handleSaveSection(section.sectionId)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Lưu section
                </button>
              </div>
            )}

            {section.type === "table" && section.table && (
              <div className="mt-4 space-y-3">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {section.table.columns.map((column) => (
                          <th key={column.key} className="border-b border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">
                            {column.label || column.key}
                          </th>
                        ))}
                        <th className="border-b border-gray-200 px-2 py-2 text-right text-xs font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.rowId} className="border-b border-gray-100">
                          {section.table?.columns.map((column) => {
                            const key = `${section.sectionId}:${row.rowId}:${column.key}`;
                            return (
                              <td key={column.key} className="px-2 py-2 align-top">
                                <textarea
                                  className={classNames(
                                    "min-h-16 w-full rounded border border-gray-200 px-2 py-1 text-xs",
                                    isReadOnly && "bg-gray-100",
                                  )}
                                  value={cellDraft[key] ?? ""}
                                  disabled={isReadOnly}
                                  onChange={(e) => setCellDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                                />
                                <button
                                  type="button"
                                  disabled={saving || isReadOnly}
                                  onClick={() => handleSaveCell(section.sectionId, row.rowId, column.key)}
                                  className="mt-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                                >
                                  Save cell
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-right align-top">
                            <button
                              type="button"
                              disabled={saving || isReadOnly}
                              onClick={() => handleDeleteRow(section.sectionId, row.rowId)}
                              className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                            >
                              Delete row
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={saving || isReadOnly}
                    onClick={() => handleAddRow(section.sectionId)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Thêm dòng
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
