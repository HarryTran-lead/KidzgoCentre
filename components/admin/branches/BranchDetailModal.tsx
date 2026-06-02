"use client";

import { ArrowRight, BookOpen, Building2, CalendarDays, ExternalLink, FileText, GraduationCap, Info, Layers, Loader2, Mail, MapPin, Phone, Trash2, Users, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Branch } from "@/types/branch";
import { getBranchPrograms, removeProgramFromBranch, type BranchProgramItem } from "@/lib/api/branchService";
import { getBranchSyllabusAssignments, removeSyllabusFromBranch, type BranchSyllabusAssignment } from "@/lib/api/syllabusService";
import { useBranchFilter } from "@/hooks/useBranchFilter";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

interface BranchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  userStats?: Record<string, { students: number; teachers: number }>;
  classStats?: Record<string, number>;
}

type Tab = "overview" | "programs" | "syllabuses";

function StatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span className={cn("px-3 py-1 text-sm font-medium rounded-full border", isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200")}>
      {isActive ? "Đang hoạt động" : "Không hoạt động"}
    </span>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
      <div className="text-red-600 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
        </div>
        <div className="rounded-xl bg-red-50 p-2.5 text-red-600">{icon}</div>
      </div>
    </div>
  );
}

function QuickLinkButton({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-red-300 hover:bg-red-50/40 hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="rounded-xl bg-red-50 p-2.5 text-red-600 shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-gray-500">{description}</div>
        </div>
      </div>
      <ArrowRight size={16} className="mt-1 shrink-0 text-gray-300 transition-colors group-hover:text-red-600" />
    </button>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

export default function BranchDetailModal({ isOpen, onClose, branch, userStats = {}, classStats = {} }: BranchDetailModalProps) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "vi";
  const { updateBranchId } = useBranchFilter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [programs, setPrograms] = useState<BranchProgramItem[]>([]);
  const [syllabuses, setSyllabuses] = useState<BranchSyllabusAssignment[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [syllabusesLoading, setSyllabusesLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [removingProgram, setRemovingProgram] = useState<string | null>(null);
  const [removingSyllabus, setRemovingSyllabus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setPrograms([]);
      setSyllabuses([]);
      setTabError(null);
      setProgramsLoading(false);
      setSyllabusesLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !branch?.id) return;
    void loadPrograms(true);
    void loadSyllabuses(true);
  }, [isOpen, branch?.id]);

  useEffect(() => {
    if (!isOpen || !branch?.id) return;
    if (activeTab === "programs" && programs.length === 0 && !programsLoading) void loadPrograms();
    if (activeTab === "syllabuses" && syllabuses.length === 0 && !syllabusesLoading) void loadSyllabuses();
  }, [isOpen, activeTab, branch?.id]);

  const loadPrograms = async (silent = false) => {
    if (!branch?.id) return;
    setProgramsLoading(true);
    if (!silent) setTabError(null);
    try {
      const data = await getBranchPrograms(branch.id);
      setPrograms(data);
    } catch (err: any) {
      if (!silent) setTabError(err?.message || "Không thể tải chương trình học.");
    } finally {
      setProgramsLoading(false);
    }
  };

  const loadSyllabuses = async (silent = false) => {
    if (!branch?.id) return;
    setSyllabusesLoading(true);
    if (!silent) setTabError(null);
    try {
      const res = await getBranchSyllabusAssignments(branch.id);
      setSyllabuses(res.data ?? []);
    } catch (err: any) {
      if (!silent) setTabError(err?.message || "Không thể tải khung chương trình.");
    } finally {
      setSyllabusesLoading(false);
    }
  };

  const handleRemoveProgram = async (programId: string) => {
    if (!branch?.id) return;
    setRemovingProgram(programId);
    setTabError(null);
    try {
      await removeProgramFromBranch(branch.id, programId);
      setPrograms((prev) => prev.filter((p) => p.programId !== programId));
    } catch (err: any) {
      setTabError(err?.message || "Không thể gỡ chương trình học.");
    } finally {
      setRemovingProgram(null);
    }
  };

  const handleRemoveSyllabus = async (assignmentId: string) => {
    if (!branch?.id) return;
    setRemovingSyllabus(assignmentId);
    setTabError(null);
    try {
      await removeSyllabusFromBranch(branch.id, assignmentId);
      setSyllabuses((prev) => prev.filter((s) => (s.curriculumAssignmentId ?? s.syllabusId) !== assignmentId));
    } catch (err: any) {
      setTabError(err?.message || "Không thể gỡ khung chương trình.");
    } finally {
      setRemovingSyllabus(null);
    }
  };

  if (!isOpen || !branch) return null;

  const studentCount = userStats[branch.id]?.students ?? branch.totalStudents ?? 0;
  const teacherCount = userStats[branch.id]?.teachers ?? branch.totalTeachers ?? 0;
  const classCount = classStats[branch.id] ?? branch.totalClasses ?? 0;
  const activeProgramCount = programs.filter((program) => program.isActive).length;
  const activeSyllabusCount = syllabuses.filter((syllabus) => syllabus.isActive).length;
  const syllabusCountsByProgram = syllabuses.reduce<Record<string, number>>((acc, item) => {
    if (item.programId) {
      acc[item.programId] = (acc[item.programId] ?? 0) + 1;
    }
    return acc;
  }, {});
  const missingSyllabusMetadataCount = syllabuses.filter(
    (item) => !item.syllabusCode && !item.syllabusTitle && !item.programName && !item.levelName,
  ).length;

  const navigateWithBranchContext = (path: string) => {
    updateBranchId(branch.id);
    onClose();
    router.push(path);
  };

  const openProgramSyllabuses = (programId?: string | null) => {
    const query = programId ? `?programId=${encodeURIComponent(programId)}` : "";
    navigateWithBranchContext(`/${locale}/portal/admin/syllabuses${query}`);
  };

  const openSyllabusEditor = (syllabusId: string) => {
    navigateWithBranchContext(`/${locale}/portal/admin/syllabuses/${syllabusId}/editor`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-linear-to-r rounded-t-2xl from-red-600 to-red-700 px-6 py-5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 text-white">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chi tiết chi nhánh</h2>
                <p className="text-sm text-white/80 mt-0.5">{branch.name}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-white transition hover:bg-white/20 cursor-pointer shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {([["overview", <Info size={14} />, "Tổng quan"], ["programs", <Layers size={14} />, "Chương trình học"], ["syllabuses", <BookOpen size={14} />, "Khung chương trình"]] as [Tab, React.ReactNode, string][]).map(([tab, icon, label]) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setTabError(null); }}
              className={cn("flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer", activeTab === tab ? "border-red-600 text-red-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700")}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tabError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
              <XCircle size={16} className="shrink-0" />
              {tabError}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full border border-red-200">{branch.code}</span>
                    <StatusIndicator isActive={branch.isActive} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{branch.name}</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard label="Học viên" value={studentCount} icon={<GraduationCap size={18} />} />
                <StatCard label="Lớp học" value={classCount} icon={<Users size={18} />} />
                <StatCard label="Giáo viên" value={teacherCount} icon={<Users size={18} />} />
                <StatCard label="Chương trình" value={programsLoading ? "..." : programs.length} icon={<Layers size={18} />} />
                <StatCard label="Syllabus" value={syllabusesLoading ? "..." : syllabuses.length} icon={<BookOpen size={18} />} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Thông tin cơ bản</h4>
                      <p className="mt-1 text-xs text-gray-500">Thông tin định danh và liên hệ của chi nhánh.</p>
                    </div>
                    <div className="grid gap-4">
                      <InfoRow label="Địa chỉ" value={branch.address} icon={<MapPin size={16} />} />
                      <InfoRow label="Số liên hệ" value={branch.contactPhone || "Chưa cập nhật"} icon={<Phone size={16} />} />
                      <InfoRow label="Email liên hệ" value={branch.contactEmail || "Chưa cập nhật"} icon={<Mail size={16} />} />
                      {branch.description && <InfoRow label="Mô tả" value={branch.description} icon={<FileText size={16} />} />}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900">Mốc thời gian</h4>
                    <div className="mt-3 grid gap-3 text-sm text-gray-600">
                      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <span className="font-medium text-gray-500">Ngày tạo</span>
                        <span>{formatDateTime(branch.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <span className="font-medium text-gray-500">Cập nhật gần nhất</span>
                        <span>{formatDateTime(branch.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Điều hướng nhanh</h4>
                        <p className="mt-1 text-xs text-gray-500">Các nút dưới đây sẽ mở đúng màn liên quan và giữ ngữ cảnh chi nhánh hiện tại.</p>
                      </div>
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Giữ filter chi nhánh</span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <QuickLinkButton
                        title="Lớp học"
                        description="Xem các lớp đang vận hành trong chi nhánh này."
                        icon={<Users size={18} />}
                        onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/classes`)}
                      />
                      <QuickLinkButton
                        title="Lịch học"
                        description="Mở lịch để kiểm tra sessions và thời khóa biểu của chi nhánh."
                        icon={<CalendarDays size={18} />}
                        onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/schedule`)}
                      />
                      <QuickLinkButton
                        title="Phòng học"
                        description="Kiểm tra phòng học và tài nguyên cơ sở vật chất theo chi nhánh."
                        icon={<Building2 size={18} />}
                        onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/rooms`)}
                      />
                      <QuickLinkButton
                        title="Enrollments"
                        description="Theo dõi ghi danh, lớp đang học và dữ liệu gắn với chi nhánh."
                        icon={<GraduationCap size={18} />}
                        onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/enrollments`)}
                      />
                      <QuickLinkButton
                        title="Chương trình"
                        description="Mở trang quản lý chương trình liên quan tới chi nhánh."
                        icon={<Layers size={18} />}
                        onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/courses/branch`)}
                      />
                      <QuickLinkButton
                        title="Syllabus"
                        description="Đi tới trang syllabus để xem editor, import và assignment chi tiết hơn."
                        icon={<BookOpen size={18} />}
                        onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/syllabuses`)}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Bức tranh học vụ</h4>
                      <p className="mt-1 text-xs text-gray-500">Tóm tắt chương trình và syllabus đang được gán cho chi nhánh.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs font-medium text-gray-500">Chương trình đang hoạt động</div>
                        <div className="mt-1 text-lg font-bold text-gray-900">{programsLoading ? "Đang tải..." : `${activeProgramCount}/${programs.length}`}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs font-medium text-gray-500">Syllabus đang áp dụng</div>
                        <div className="mt-1 text-lg font-bold text-gray-900">{syllabusesLoading ? "Đang tải..." : `${activeSyllabusCount}/${syllabuses.length}`}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                      Level nên được hiển thị trực tiếp ở assignment syllabus để tránh mơ hồ. Module và unit nên drill-down sang editor hoặc class detail thay vì bung full trong modal chi nhánh.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "programs" && (
            <div>
              {programsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-red-500" />
                </div>
              ) : programs.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                  <Layers size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">Chi nhánh chưa có chương trình học nào.</p>
                  <button
                    type="button"
                    onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/courses/branch`)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} /> Mở trang chương trình
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {programs.map((p) => (
                    <div key={p.programId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50/20">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-xs font-bold">{p.programCode}</span>
                          <span className="text-sm font-semibold text-gray-900">{p.programName}</span>
                          <span className={cn("text-xs font-semibold", p.isActive ? "text-green-600" : "text-gray-400")}>
                            {p.isActive ? "● Đang hoạt động" : "○ Tạm ngừng"}
                          </span>
                        </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">Gán: {formatDate(p.assignedAt)}</span>
                            <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">Syllabus liên quan: {syllabusCountsByProgram[p.programId] ?? 0}</span>
                          </div>
                          <p className="text-xs leading-5 text-gray-500">
                            Dùng tab này để thấy chương trình nào đang được chi nhánh áp dụng, sau đó đi tiếp sang syllabus hoặc classes để xem vận hành thực tế.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openProgramSyllabuses(p.programId)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <BookOpen size={14} /> Syllabus liên quan
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/courses/branch`)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={14} /> Trang chương trình
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProgram(p.programId)}
                            disabled={removingProgram === p.programId}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Gỡ chương trình học"
                          >
                            {removingProgram === p.programId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Gỡ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "syllabuses" && (
            <div>
              {syllabusesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-red-500" />
                </div>
              ) : syllabuses.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                  <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">Chi nhánh chưa được gán khung chương trình nào.</p>
                  <p className="text-xs text-gray-400 mt-1">Vào trang Syllabuses để gán chi nhánh.</p>
                  <button
                    type="button"
                    onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/syllabuses`)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} /> Mở trang syllabus
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {missingSyllabusMetadataCount > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                      Có {missingSyllabusMetadataCount} assignment chưa hiện đủ metadata như code, title, program hoặc level. Nếu backend không trả nested <strong>syllabus</strong> metadata trong <strong>GET /api/branches/{"{id}"}/syllabuses</strong>, FE chỉ có thể fallback theo <strong>syllabusId</strong>.
                    </div>
                  )}
                  {syllabuses.map((s) => {
                    const assignmentId = s.curriculumAssignmentId ?? s.syllabusId;
                    const syllabusCode = s.syllabusCode || `${s.syllabusId.slice(0, 8)}…`;
                    const syllabusTitle = s.syllabusTitle || "Chưa có title từ API";
                    return (
                    <div key={assignmentId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50/20">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-xs font-bold">{syllabusCode}</span>
                          {s.syllabusVersion && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">v{s.syllabusVersion}</span>}
                          <span className={cn("text-xs font-semibold", s.isActive ? "text-green-600" : "text-gray-400")}>
                            {s.isActive ? "● Đang áp dụng" : "○ Tạm ngừng"}
                          </span>
                        </div>
                          <div className="text-sm font-semibold text-gray-900">{syllabusTitle}</div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {s.programName && <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">{s.programName}</span>}
                            {s.levelName && <span className="rounded-full bg-purple-50 px-2.5 py-1 font-medium text-purple-700">{s.levelName}</span>}
                            {typeof s.unitCount === "number" && <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{s.unitCount} unit</span>}
                            {typeof s.sessionTemplateCount === "number" && <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{s.sessionTemplateCount} session template</span>}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                            <span>Hiệu lực: {s.effectiveFrom ? `Từ ${formatDate(s.effectiveFrom)}` : "Chưa đặt"}{s.effectiveTo ? ` đến ${formatDate(s.effectiveTo)}` : ""}</span>
                            <span>Gán vào chi nhánh: {formatDate(s.assignedAt)}</span>
                          </div>
                          {!s.syllabusTitle && (
                            <p className="text-xs text-amber-700">
                              FE đang fallback sang syllabusId vì API assignment chưa trả đủ metadata hiển thị.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openSyllabusEditor(s.syllabusId)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={14} /> Mở editor
                          </button>
                          <button
                            type="button"
                            onClick={() => openProgramSyllabuses(s.programId)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <BookOpen size={14} /> Cùng chương trình
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSyllabus(assignmentId)}
                            disabled={removingSyllabus === assignmentId}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Gỡ khung chương trình"
                          >
                            {removingSyllabus === assignmentId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Gỡ assignment
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
