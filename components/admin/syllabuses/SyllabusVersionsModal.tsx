"use client";

import { CheckCircle, GitBranch, Loader2, Plus, Star, Trash2, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type CreateSyllabusVersionRequest,
  type SyllabusVersion,
  createSyllabusVersion,
  deleteSyllabusVersion,
  getSyllabusVersions,
} from "@/lib/api/syllabusService";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function formatDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SyllabusVersionsModal({
  open,
  syllabusId,
  syllabusTitle,
  onClose,
}: {
  open: boolean;
  syllabusId: string;
  syllabusTitle: string;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<SyllabusVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New version form
  const [showForm, setShowForm] = useState(false);
  const [formTag, setFormTag] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && syllabusId) {
      loadVersions();
    } else {
      setVersions([]);
      setShowForm(false);
      setError(null);
    }
  }, [open, syllabusId]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSyllabusVersions(syllabusId);
      setVersions(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách phiên bản.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    setDeletingId(versionId);
    setError(null);
    try {
      await deleteSyllabusVersion(syllabusId, versionId);
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
    } catch (err: any) {
      setError(err?.message || "Không thể xóa phiên bản.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!formTag.trim()) {
      setFormError("Vui lòng nhập version tag.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    const body: CreateSyllabusVersionRequest = {
      versionTag: formTag.trim(),
      label: formLabel.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };
    try {
      await createSyllabusVersion(syllabusId, body);
      await loadVersions();
      setShowForm(false);
      setFormTag("");
      setFormLabel("");
      setFormNotes("");
    } catch (err: any) {
      setFormError(err?.message || "Không thể tạo phiên bản.");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-indigo-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <GitBranch size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lịch sử phiên bản</h2>
                <p className="text-sm text-indigo-100 truncate max-w-xs">{syllabusTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer" aria-label="Đóng">
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <XCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Các snapshot phiên bản của khung chương trình này.</p>
            <button
              onClick={() => { setShowForm(true); setFormError(null); }}
              disabled={showForm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} />
              Tạo phiên bản mới
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 space-y-3">
              <p className="text-sm font-semibold text-indigo-700">Thêm snapshot phiên bản</p>
              {formError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <XCircle size={13} /> {formError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Version Tag *</label>
                  <input
                    type="text"
                    placeholder="vd: v1.0.0"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nhãn</label>
                  <input
                    type="text"
                    placeholder="vd: Bản chính thức Q1 2025"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả thay đổi..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={formSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Lưu phiên bản
                </button>
                <button
                  onClick={() => { setShowForm(false); setFormTag(""); setFormLabel(""); setFormNotes(""); setFormError(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-gray-300 bg-gray-50">
              <GitBranch size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Chưa có phiên bản nào.</p>
              <p className="text-xs text-gray-400 mt-1">Nhấn "Tạo phiên bản mới" để tạo snapshot đầu tiên.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className={cn("flex items-start justify-between p-4 rounded-xl border transition-colors group", v.isActive ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30")}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-mono text-xs font-bold">{v.versionTag}</span>
                      {v.label && <span className="text-sm font-semibold text-gray-800">{v.label}</span>}
                      {v.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <Star size={11} fill="currentColor" />
                          Đang dùng
                        </span>
                      )}
                    </div>
                    {v.notes && <p className="text-xs text-gray-500 mt-1">{v.notes}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Tạo: {formatDate(v.createdAt)}</span>
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={!!deletingId || v.isActive}
                      title={v.isActive ? "Không thể xóa phiên bản đang dùng" : "Xóa phiên bản"}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      {deletingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
