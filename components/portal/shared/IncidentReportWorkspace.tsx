"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Loader2,
  AlertTriangle, MessageSquare, UserCheck, Clock,
  FileText, Send, Building2, User, Paperclip,
  CheckCircle2, XCircle, ArrowRightCircle, ShieldAlert,
} from "lucide-react";
import {
  getIncidentReports,
  getIncidentReportById,
  createIncidentReport,
  addIncidentComment,
  assignIncidentReport,
  updateIncidentStatus,
  getIncidentStatistics,
} from "@/lib/api/incidentReportService";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { getAllUsers } from "@/lib/api/userService";
import type {
  IncidentReportDto,
  IncidentReportDetailDto,
  IncidentReportCategory,
  IncidentReportStatus,
  IncidentReportCommentType,
  IncidentReportListQuery,
  CreateIncidentReportPayload,
} from "@/types/admin/incidentReport";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

/* ───────────── helpers ───────────── */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function getErrMsg(err: unknown, fallback: string): string {
  const e = err as Record<string, Record<string, Record<string, string>>>;
  return e?.response?.data?.detail || e?.response?.data?.message || (err as Error)?.message || fallback;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return iso; }
}

const PAGE_SIZE = 10;

/* ───────────── Enums / Maps ───────────── */
const CATEGORIES: IncidentReportCategory[] = [
  "Classroom", "Student", "TeachingMaterial", "TeachingSchedule",
  "Equipment", "System", "Academic", "Finance", "Operations",
  "ParentStudentFeedback", "Other",
];

const CATEGORY_LABEL: Record<IncidentReportCategory, string> = {
  Classroom: "Lớp học",
  Student: "Học sinh",
  TeachingMaterial: "Tài liệu giảng dạy",
  TeachingSchedule: "Lịch giảng dạy",
  Equipment: "Thiết bị",
  System: "Hệ thống",
  Academic: "Học vụ",
  Finance: "Tài chính",
  Operations: "Vận hành",
  ParentStudentFeedback: "Phản hồi PH/HS",
  Other: "Khác",
};

const CATEGORY_COLOR: Record<IncidentReportCategory, string> = {
  Classroom: "bg-violet-100 text-violet-700 border-violet-200",
  Student: "bg-pink-100 text-pink-700 border-pink-200",
  TeachingMaterial: "bg-cyan-100 text-cyan-700 border-cyan-200",
  TeachingSchedule: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Equipment: "bg-orange-100 text-orange-700 border-orange-200",
  System: "bg-red-100 text-red-700 border-red-200",
  Academic: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Finance: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Operations: "bg-teal-100 text-teal-700 border-teal-200",
  ParentStudentFeedback: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUSES: IncidentReportStatus[] = ["Open", "InProgress", "Resolved", "Closed", "Rejected"];

const STATUS_MAP: Record<IncidentReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  Open: { label: "Mở", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  InProgress: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ArrowRightCircle },
  Resolved: { label: "Đã giải quyết", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  Closed: { label: "Đã đóng", color: "bg-gray-100 text-gray-500 border-gray-200", icon: XCircle },
  Rejected: { label: "Từ chối", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const COMMENT_TYPE_LABEL: Record<IncidentReportCommentType, string> = {
  AdditionalInfo: "Thông tin bổ sung",
  Evidence: "Minh chứng",
  ProcessingNote: "Ghi chú xử lý",
};

const COMMENT_TYPE_COLOR: Record<IncidentReportCommentType, string> = {
  AdditionalInfo: "bg-blue-100 text-blue-700",
  Evidence: "bg-amber-100 text-amber-700",
  ProcessingNote: "bg-emerald-100 text-emerald-700",
};

const VALID_TRANSITIONS: Record<IncidentReportStatus, IncidentReportStatus[]> = {
  Open: ["InProgress", "Resolved", "Closed", "Rejected"],
  InProgress: ["Resolved", "Closed", "Rejected"],
  Resolved: ["Closed", "Rejected"],
  Closed: [],
  Rejected: [],
};

/* ───────────── Badges ───────────── */
function StatusBadge({ status }: { status: IncidentReportStatus }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP.Open;
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", info.color)}>{info.label}</span>;
}

function CategoryBadge({ category }: { category: IncidentReportCategory }) {
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", CATEGORY_COLOR[category] || CATEGORY_COLOR.Other)}>
      {CATEGORY_LABEL[category] || category}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="text-amber-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-gray-900 font-medium">{value}</div>
      </div>
    </div>
  );
}

/* ───────────── Branch / User options ───────────── */
interface BranchOption { id: string; name: string; }
interface UserOption { id: string; fullName: string; role: string; }

/* ═══════════════════════════════════════════════════════
   Create Incident Modal
   ═══════════════════════════════════════════════════════ */
function CreateIncidentModal({
  isOpen, onClose, onCreated, defaultBranchId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultBranchId?: string | null;
}) {
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [branchId, setBranchId] = useState(defaultBranchId || "");
  const [category, setCategory] = useState<IncidentReportCategory>("System");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await getAllBranchesPublic({ isActive: true });
        const list = res?.data?.branches || res?.data || [];
        setBranches(Array.isArray(list) ? list : []);
      } catch { /* ignore */ }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (defaultBranchId) setBranchId(defaultBranchId);
  }, [defaultBranchId]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (loading) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("mousedown", handler); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose, loading]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSubject(""); setMessage(""); setEvidenceUrl(""); setCategory("System");
      if (defaultBranchId) setBranchId(defaultBranchId);
    }
  }, [isOpen, defaultBranchId]);

  const handleSubmit = async () => {
    if (!branchId || !subject.trim() || !message.trim()) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ thông tin bắt buộc.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const payload: CreateIncidentReportPayload = {
        branchId, category, subject: subject.trim(), message: message.trim(),
        ...(evidenceUrl.trim() ? { evidenceUrl: evidenceUrl.trim() } : {}),
      };
      await createIncidentReport(payload);
      toast({ title: "Thành công", description: "Đã tạo báo cáo sự cố thành công." });
      onCreated();
      onClose();
    } catch (err) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể tạo báo cáo sự cố."), variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div ref={modalRef} className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tạo báo cáo sự cố</h2>
                <p className="text-sm text-amber-100">Mô tả chi tiết sự cố cần xử lý</p>
              </div>
            </div>
            <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Branch */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Chi nhánh <span className="text-red-500">*</span></label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full rounded-xl border border-amber-200 bg-white text-sm transition-all hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 data-[state=open]:border-amber-400 data-[state=open]:ring-2 data-[state=open]:ring-amber-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                <SelectValue placeholder="— Chọn chi nhánh —" />
              </SelectTrigger>
              <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Danh mục <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c} type="button" onClick={() => setCategory(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    category === c ? CATEGORY_COLOR[c] : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
          {/* Subject */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all"
              value={subject} onChange={e => setSubject(e.target.value)} maxLength={200}
              placeholder="Mô tả ngắn gọn sự cố"
            />
            <p className="text-xs text-gray-400 text-right">{subject.length}/200</p>
          </div>
          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Nội dung chi tiết <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none transition-all"
              rows={4} value={message} onChange={e => setMessage(e.target.value)} maxLength={2000}
              placeholder="Mô tả chi tiết sự cố xảy ra, bao gồm thời gian, địa điểm, tình huống..."
            />
            <p className="text-xs text-gray-400 text-right">{message.length}/2000</p>
          </div>
          {/* Evidence URL */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Link minh chứng <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all"
              value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://cdn.example.com/evidence/..."
            />
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-amber-500/5 to-orange-600/5 p-4 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Hủy</button>
          <button
            onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:shadow-lg transition-all cursor-pointer disabled:opacity-70"
          >
            {loading ? "Đang tạo..." : "Tạo báo cáo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Detail / Comment / Admin Actions Panel
   ═══════════════════════════════════════════════════════ */
function DetailPanel({
  isOpen, onClose, incidentId, isAdmin, onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string | null;
  isAdmin: boolean;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const modalRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<IncidentReportDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  // Comment form
  const [commentMsg, setCommentMsg] = useState("");
  const [commentType, setCommentType] = useState<IncidentReportCommentType>("AdditionalInfo");
  const [commentAttachment, setCommentAttachment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Admin: assign
  const [assignUserId, setAssignUserId] = useState("");
  const [assignUsers, setAssignUsers] = useState<UserOption[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Admin: status
  const [newStatus, setNewStatus] = useState<IncidentReportStatus | "">("");
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      const res = await getIncidentReportById(incidentId);
      if (res?.isSuccess && res.data) setDetail(res.data);
    } catch (err) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể tải chi tiết."), variant: "destructive" });
    } finally { setLoading(false); }
  }, [incidentId, toast]);

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchDetail();
      setCommentMsg(""); setCommentAttachment(""); setAssignUserId(""); setNewStatus("");
    }
  }, [isOpen, incidentId, fetchDetail]);

  // Fetch users for assign (admin only)
  useEffect(() => {
    if (!isAdmin || !isOpen) return;
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers({ isActive: true, pageSize: 200 });
        const items = res?.data?.items || [];
        setAssignUsers(Array.isArray(items) ? items.map((u: { id: string; name: string; role: string }) => ({ id: u.id, fullName: u.name, role: u.role })) : []);
      } catch { /* ignore */ }
    };
    fetchUsers();
  }, [isAdmin, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleAddComment = async () => {
    if (!incidentId || !commentMsg.trim()) return;
    try {
      setSubmittingComment(true);
      await addIncidentComment(incidentId, {
        message: commentMsg.trim(),
        commentType,
        ...(commentAttachment.trim() ? { attachmentUrl: commentAttachment.trim() } : {}),
      });
      toast({ title: "Thành công", description: "Đã thêm bình luận." });
      setCommentMsg(""); setCommentAttachment("");
      fetchDetail();
      onUpdated();
    } catch (err) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể thêm bình luận."), variant: "destructive" });
    } finally { setSubmittingComment(false); }
  };

  const handleAssign = async () => {
    if (!incidentId || !assignUserId) return;
    try {
      setAssignLoading(true);
      await assignIncidentReport(incidentId, { assignedToUserId: assignUserId });
      toast({ title: "Thành công", description: "Đã phân công xử lý." });
      setAssignUserId("");
      fetchDetail();
      onUpdated();
    } catch (err) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể phân công."), variant: "destructive" });
    } finally { setAssignLoading(false); }
  };

  const handleStatusUpdate = async () => {
    if (!incidentId || !newStatus) return;
    try {
      setStatusLoading(true);
      await updateIncidentStatus(incidentId, { status: newStatus as IncidentReportStatus });
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái." });
      setNewStatus("");
      fetchDetail();
      onUpdated();
    } catch (err) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể cập nhật trạng thái."), variant: "destructive" });
    } finally { setStatusLoading(false); }
  };

  if (!isOpen) return null;

  const availableTransitions = detail ? VALID_TRANSITIONS[detail.status] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div ref={modalRef} className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chi tiết sự cố</h2>
                {detail && <p className="text-sm text-amber-100">{CATEGORY_LABEL[detail.category]}</p>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-amber-500" /></div>
        ) : detail ? (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Status + Category badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={detail.status} />
              <CategoryBadge category={detail.category} />
              {detail.commentCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1">
                  <MessageSquare size={12} /> {detail.commentCount}
                </span>
              )}
            </div>

            {/* Subject */}
            <h3 className="text-lg font-bold text-gray-900">{detail.subject}</h3>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow icon={User} label="Người báo cáo" value={detail.openedByUserName} />
              <InfoRow icon={Building2} label="Chi nhánh" value={detail.branchName} />
              {detail.classCode && <InfoRow icon={FileText} label="Lớp" value={`${detail.classCode} – ${detail.classTitle}`} />}
              {detail.assignedToUserName && <InfoRow icon={UserCheck} label="Người xử lý" value={detail.assignedToUserName} />}
              <InfoRow icon={Clock} label="Ngày tạo" value={formatDateTime(detail.createdAt)} />
              <InfoRow icon={Clock} label="Cập nhật" value={formatDateTime(detail.updatedAt)} />
            </div>

            {/* Message */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-semibold text-amber-700 mb-1.5">Nội dung sự cố</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{detail.message}</div>
            </div>

            {detail.evidenceUrl && (
              <a href={detail.evidenceUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors">
                <Paperclip size={16} /> Xem minh chứng đính kèm
              </a>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-5 space-y-4">
                <h4 className="font-bold text-sm text-amber-800 flex items-center gap-2">
                  <ShieldAlert size={16} /> Hành động quản trị
                </h4>

                {/* Assign */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Phân công xử lý</label>
                  <div className="flex gap-2">
                    <Select value={assignUserId} onValueChange={setAssignUserId}>
                      <SelectTrigger className="flex-1 rounded-xl border border-amber-200 bg-white text-sm transition-all hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                        <SelectValue placeholder="— Chọn người xử lý —" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignUsers.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={handleAssign} disabled={!assignUserId || assignLoading}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {assignLoading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Gán
                    </button>
                  </div>
                </div>

                {/* Status update */}
                {availableTransitions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Cập nhật trạng thái</label>
                    <div className="flex gap-2">
                      <Select value={newStatus} onValueChange={v => setNewStatus(v as IncidentReportStatus)}>
                        <SelectTrigger className="flex-1 rounded-xl border border-amber-200 bg-white text-sm transition-all hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                          <SelectValue placeholder="— Chọn trạng thái mới —" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTransitions.map(s => (
                            <SelectItem key={s} value={s}>{STATUS_MAP[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={handleStatusUpdate} disabled={!newStatus || statusLoading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {statusLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Cập nhật
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-500" /> Bình luận ({detail.comments?.length || 0})
              </h4>
              {detail.comments?.length ? (
                <div className="space-y-3">
                  {detail.comments.map(c => (
                    <div key={c.id} className={cn(
                      "rounded-xl p-4 text-sm border transition-all",
                      c.commenterUserId === user?.id
                        ? "bg-blue-50/70 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <User size={14} className="text-white" />
                          </span>
                          <span className="font-semibold text-gray-800">{c.commenterUserName}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <span className={cn("inline-block px-2 py-0.5 rounded-md text-xs font-semibold mb-2", COMMENT_TYPE_COLOR[c.commentType])}>
                        {COMMENT_TYPE_LABEL[c.commentType]}
                      </span>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{c.message}</p>
                      {c.attachmentUrl && (
                        <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-2 font-medium">
                          <Paperclip size={12} /> Xem đính kèm
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <MessageSquare size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Chưa có bình luận nào.</p>
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-700">Thêm bình luận</h4>
              <div className="flex flex-wrap gap-2">
                {(["AdditionalInfo", "Evidence", "ProcessingNote"] as IncidentReportCommentType[]).map(t => (
                  <button
                    key={t} type="button" onClick={() => setCommentType(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                      commentType === t ? COMMENT_TYPE_COLOR[t] + " border-current" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {COMMENT_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none transition-all"
                rows={3} value={commentMsg} onChange={e => setCommentMsg(e.target.value)} maxLength={2000}
                placeholder="Nhập nội dung bình luận..."
              />
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all"
                value={commentAttachment} onChange={e => setCommentAttachment(e.target.value)}
                placeholder="Link đính kèm (không bắt buộc)"
              />
              <button
                onClick={handleAddComment} disabled={submittingComment || !commentMsg.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Gửi bình luận
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertTriangle size={32} className="mb-2 text-gray-300" />
            <p className="text-sm">Không tìm thấy dữ liệu.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Statistics Panel (Admin only)
   ═══════════════════════════════════════════════════════ */
function StatisticsCards({ branchId, isPageLoaded }: { branchId?: string | null; isPageLoaded: boolean }) {
  const [stats, setStats] = useState<{
    total: number; open: number; inProgress: number; resolved: number;
    closed: number; rejected: number; unassigned: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getIncidentStatistics(branchId ? { branchId } : undefined);
        if (res?.isSuccess && res.data) setStats(res.data);
      } catch { /* ignore */ }
    };
    load();
  }, [branchId]);

  if (!stats) return null;

  const cards = [
    { label: "Tổng", value: stats.total, icon: FileText, bg: "bg-gray-100", fg: "text-gray-600" },
    { label: "Mở", value: stats.open, icon: AlertTriangle, bg: "bg-amber-100", fg: "text-amber-600" },
    { label: "Đang xử lý", value: stats.inProgress, icon: ArrowRightCircle, bg: "bg-blue-100", fg: "text-blue-600" },
    { label: "Đã giải quyết", value: stats.resolved, icon: CheckCircle2, bg: "bg-green-100", fg: "text-green-600" },
    { label: "Đã đóng", value: stats.closed, icon: XCircle, bg: "bg-gray-100", fg: "text-gray-500" },
    { label: "Từ chối", value: stats.rejected, icon: XCircle, bg: "bg-red-100", fg: "text-red-600" },
    { label: "Chưa gán", value: stats.unassigned, icon: UserCheck, bg: "bg-orange-100", fg: "text-orange-600" },
  ];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 transition-all duration-700 delay-100", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {cards.map(c => (
        <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <span className={cn("w-10 h-10 rounded-xl grid place-items-center", c.bg)}>
              <c.icon className={c.fg} size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">{c.label}</div>
              <div className="text-2xl font-extrabold text-gray-900">{c.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Workspace
   ═══════════════════════════════════════════════════════ */
export default function IncidentReportWorkspace({ isAdmin = false }: { isAdmin?: boolean }) {
  const { toast } = useToast();
  const { selectedBranchId } = useBranchFilter();

  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [items, setItems] = useState<IncidentReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentReportStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<IncidentReportCategory | "ALL">("ALL");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { setIsPageLoaded(true); }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const query: IncidentReportListQuery = {
        pageNumber: page,
        pageSize: PAGE_SIZE,
        ...(keyword ? { keyword } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      };
      const res = await getIncidentReports(query);
      const paginated = res?.data?.incidentReports ?? (res as unknown as Record<string, unknown>)?.data;
      if (paginated && typeof paginated === "object") {
        const p = paginated as { items?: IncidentReportDto[]; totalPages?: number; totalCount?: number };
        setItems(p.items || []);
        setTotalPages(p.totalPages || 1);
        setTotalCount(p.totalCount || 0);
      }
    } catch (err) {
      toast({ title: "Lỗi", description: getErrMsg(err, "Không thể tải danh sách."), variant: "destructive" });
    } finally { setLoading(false); }
  }, [page, keyword, statusFilter, categoryFilter, selectedBranchId, toast]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = (id: string) => { setSelectedId(id); setShowDetail(true); };

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        {/* Header */}
        <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {isAdmin ? "Báo cáo sự cố" : "Báo cáo sự cố của tôi"}
              </h1>
              <p className="text-sm text-gray-600">
                {isAdmin ? "Quản lý tất cả báo cáo sự cố" : "Theo dõi và báo cáo sự cố"}
                {totalCount > 0 && ` · ${totalCount} báo cáo`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Tạo báo cáo
          </button>
        </div>

        {/* Statistics (Admin only) */}
        {isAdmin && <StatisticsCards branchId={selectedBranchId} isPageLoaded={isPageLoaded} />}

        {/* Filters */}
        <div className={cn("rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-4 transition-all duration-700 delay-100", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}
                placeholder="Tìm theo tiêu đề, nội dung..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as IncidentReportStatus | "ALL"); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-auto h-10 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 transition-all hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 data-[state=open]:border-amber-400 data-[state=open]:ring-2 data-[state=open]:ring-amber-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_MAP[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v as IncidentReportCategory | "ALL"); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-auto h-10 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 transition-all hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 data-[state=open]:border-amber-400 data-[state=open]:ring-2 data-[state=open]:ring-amber-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={cn("rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300", isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách báo cáo sự cố</h2>
              <span className="text-sm text-gray-600 font-medium">{totalCount} báo cáo</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-500/5 to-orange-600/5 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Tiêu đề</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Danh mục</th>
                  <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Chi nhánh</th>
                  {isAdmin && <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Người báo cáo</th>}
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Người xử lý</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                  <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700">💬</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center">
                      <Loader2 size={32} className="mx-auto animate-spin text-amber-500" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-amber-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Chưa có báo cáo sự cố nào</div>
                      <div className="text-sm text-gray-500 mt-1">Nhấn &quot;Tạo báo cáo&quot; để báo cáo sự cố mới</div>
                    </td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.id} onClick={() => openDetail(item.id)} className="group hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-white transition-all duration-200 cursor-pointer">
                    <td className="py-3 px-6">
                      <div className="text-sm font-medium text-gray-900 max-w-[250px] truncate group-hover:text-amber-700 transition-colors">{item.subject}</div>
                    </td>
                    <td className="py-3 px-6"><CategoryBadge category={item.category} /></td>
                    <td className="py-3 px-6 text-center"><StatusBadge status={item.status} /></td>
                    <td className="py-3 px-6 text-sm text-gray-600">{item.branchName}</td>
                    {isAdmin && <td className="py-3 px-6 text-sm text-gray-600">{item.openedByUserName}</td>}
                    <td className="py-3 px-6 text-sm text-gray-600">{item.assignedToUserName || <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-6 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-6 text-center">
                      {item.commentCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <MessageSquare size={11} /> {item.commentCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-amber-500/5 to-orange-600/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang <span className="font-semibold text-gray-900">{page}</span> / <span className="font-semibold text-gray-900">{totalPages}</span>
                  <span className="ml-2 text-gray-400">· {totalCount} kết quả</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg border border-amber-200 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p} onClick={() => setPage(p)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                          p === page
                            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                            : "border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200"
                        )}
                      >{p}</button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg border border-amber-200 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateIncidentModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchList}
        defaultBranchId={selectedBranchId}
      />
      <DetailPanel
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        incidentId={selectedId}
        isAdmin={isAdmin}
        onUpdated={fetchList}
      />
    </>
  );
}
