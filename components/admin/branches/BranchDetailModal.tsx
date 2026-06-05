"use client";

import { AlertCircle, ArrowRight, BookOpen, Building2, CalendarDays, Check, Circle, ExternalLink, FileText, GraduationCap, Info, Layers, Loader2, Mail, MapPin, Phone, Trash2, Users, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Branch } from "@/types/branch";
import { getBranchPrograms, removeProgramFromBranch, type BranchProgramItem } from "@/lib/api/branchService";
import { getBranchSyllabusAssignments, removeSyllabusFromBranch, type BranchSyllabusAssignment } from "@/lib/api/syllabusService";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import ConfirmModal from "@/components/ConfirmModal";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function Badge({
  color = "gray",
  children,
}: {
  color?:
    | "gray"
    | "blue"
    | "red"
    | "green"
    | "purple"
    | "yellow"
    | "pink"
    | "orange";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    pink: "bg-red-50 text-red-700 border border-red-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
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
    <div className="flex items-start gap-3 p-4 bg-white border border-red-300 rounded-xl  hover:border-red-200 transition-all duration-200">
      <div className="text-red-500 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</div>
        <div className="text-sm text-gray-900 font-medium">{value || "Chưa cập nhật"}</div>
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
      className="group relative overflow-hidden rounded-xl border border-red-300 bg-white p-4 text-left transition-all duration-300 hover:border-red-500 hover:bg-gradient-to-br hover:from-red-50/60 hover:to-red-50/40 hover:shadow-lg hover:-translate-y-0.2 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-red-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-start gap-3">
        <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-2.5 text-red-600 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:from-red-500 group-hover:to-red-600 group-hover:text-white group-hover:shadow-md">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 transition-colors duration-300 group-hover:text-gray-950">{title}</div>
          <div className="mt-0.5 text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-600 line-clamp-1">{description}</div>
        </div>
        <ArrowRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-red-600" />
      </div>
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
  const [confirmRemoveProgram, setConfirmRemoveProgram] = useState<string | null>(null);
  const [confirmRemoveSyllabus, setConfirmRemoveSyllabus] = useState<string | null>(null);

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

  const handleRemoveProgram = (programId: string) => {
    setConfirmRemoveProgram(programId);
  };

  const doConfirmRemoveProgram = async (programId: string) => {
    if (!branch?.id) return;
    setRemovingProgram(programId);
    setTabError(null);
    try {
      await removeProgramFromBranch(branch.id, programId);
      setPrograms((prev) => prev.filter((p) => p.programId !== programId));
      setConfirmRemoveProgram(null);
    } catch (err: any) {
      setTabError(err?.message || "Không thể gỡ chương trình học.");
    } finally {
      setRemovingProgram(null);
    }
  };

  const handleRemoveSyllabus = (assignmentId: string) => {
    setConfirmRemoveSyllabus(assignmentId);
  };

  const doConfirmRemoveSyllabus = async (assignmentId: string) => {
    if (!branch?.id) return;
    setRemovingSyllabus(assignmentId);
    setTabError(null);
    try {
      await removeSyllabusFromBranch(branch.id, assignmentId);
      setSyllabuses((prev) => prev.filter((s) => (s.curriculumAssignmentId ?? s.syllabusId) !== assignmentId));
      setConfirmRemoveSyllabus(null);
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
    <>
      <ConfirmModal
        isOpen={!!confirmRemoveProgram}
        onClose={() => setConfirmRemoveProgram(null)}
        onConfirm={() => doConfirmRemoveProgram(confirmRemoveProgram!)}
        title="Gỡ chương trình học"
        message="Bạn có chắc muốn gỡ chương trình này khỏi chi nhánh? Hành động này không thể hoàn tác."
        confirmText="Gỡ"
        cancelText="Hủy"
        variant="danger"
        isLoading={removingProgram === confirmRemoveProgram}
      />
      <ConfirmModal
        isOpen={!!confirmRemoveSyllabus}
        onClose={() => setConfirmRemoveSyllabus(null)}
        onConfirm={() => doConfirmRemoveSyllabus(confirmRemoveSyllabus!)}
        title="Gỡ khung chương trình"
        message="Bạn có chắc muốn gỡ khung chương trình này khỏi chi nhánh? Hành động này không thể hoàn tác."
        confirmText="Gỡ"
        cancelText="Hủy"
        variant="danger"
        isLoading={removingSyllabus === confirmRemoveSyllabus}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header - GIỮ NGUYÊN */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl px-6 py-5 shrink-0">
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
            <button type="button" onClick={onClose} className="p-2 text-white transition hover:bg-white/20 rounded-lg cursor-pointer shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs - REDESIGNED */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 shrink-0 px-2">
          {([
            ["overview", <Info size={14} />, "Tổng quan"],
            ["programs", <Layers size={14} />, "Chương trình học"],
            ["syllabuses", <BookOpen size={14} />, "Khung chương trình"]
          ] as [Tab, React.ReactNode, string][]).map(([tab, icon, label]) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setTabError(null); }}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 relative cursor-pointer",
                activeTab === tab 
                  ? "text-red-600 bg-white" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
            >
              {icon}
              {label}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content - REDESIGNED */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {tabError && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-50/50 border-l-4 border-red-500 text-sm text-red-700 mb-6">
              <XCircle size={18} className="shrink-0 text-red-500" />
              <span className="font-medium">{tabError}</span>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-red-50/20 border border-red-300 p-6 shadow-sm">
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-20 -mr-20 -mt-20" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-full shadow-sm">{branch.code}</span>
                      <StatusIndicator isActive={branch.isActive} />
                    </div>
                    <h3 className="text-2xl md:text font-bold text-gray-900 tracking-tight">{branch.name}</h3>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <MapPin size={14} className="text-red-400" /> {branch.address || "Chưa cập nhật địa chỉ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Badges */}
              <div className="flex flex-wrap gap-3">
                <Badge color="green"><GraduationCap size={14} /> Học viên: {studentCount}</Badge>
                <Badge color="blue"><Users size={14} /> Lớp học: {classCount}</Badge>
                <Badge color="purple"><Users size={14} /> Giáo viên: {teacherCount}</Badge>
                <Badge color="orange"><Layers size={14} /> Chương trình: {programsLoading ? "..." : programs.length}</Badge>
                <Badge color="yellow"><BookOpen size={14} /> Syllabus: {syllabusesLoading ? "..." : syllabuses.length}</Badge>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-white to-red-50 border border-red-300 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-200">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                        <Info size={18} className="text-red-500" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h4>
                    </div>
                    <div className="grid gap-3 ">
                      <InfoRow label="Địa chỉ" value={branch.address} icon={<MapPin size={16} />} />
                      <InfoRow label="Số liên hệ" value={branch.contactPhone || "Chưa cập nhật"} icon={<Phone size={16} />} />
                      <InfoRow label="Email liên hệ" value={branch.contactEmail || "Chưa cập nhật"} icon={<Mail size={16} />} />
                      {branch.description && <InfoRow label="Mô tả" value={branch.description} icon={<FileText size={16} />} />}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-white to-red-50 border border-red-300 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-200">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                        <CalendarDays size={18} className="text-red-500" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-900">Mốc thời gian</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-red-200">
                        <span className="text-sm font-medium text-gray-500">Ngày tạo</span>
                        <span className="text-sm text-gray-900 font-medium">{formatDateTime(branch.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-red-200">
                        <span className="text-sm font-medium text-gray-500">Cập nhật gần nhất</span>
                        <span className="text-sm text-gray-900 font-medium">{formatDateTime(branch.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Quick Navigation */}
                  <div className="rounded-2xl bg-gradient-to-br from-white to-red-50 border border-red-300 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-red-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                          <Layers size={18} className="text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">Điều hướng nhanh</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Giữ ngữ cảnh chi nhánh hiện tại</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gradient-to-r from-red-100 to-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 border border-red-200 shadow-sm">Giữ filter</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <QuickLinkButton title="Lớp học" description="Quản lý lớp đang vận hành" icon={<Users size={16} />} onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/classes`)} />
                      <QuickLinkButton title="Lịch học" description="Thời khóa biểu & sessions" icon={<CalendarDays size={16} />} onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/schedule`)} />
                      <QuickLinkButton title="Phòng học" description="Cơ sở vật chất theo chi nhánh" icon={<Building2 size={16} />} onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/rooms`)} />
                      <QuickLinkButton title="Enrollments" description="Theo dõi ghi danh" icon={<GraduationCap size={16} />} onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/enrollments`)} />
                      <QuickLinkButton title="Chương trình" description="Quản lý chương trình" icon={<Layers size={16} />} onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/courses/branch`)} />
                      <QuickLinkButton title="Syllabus" description="Editor & import syllabus" icon={<BookOpen size={16} />} onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/syllabuses`)} />
                    </div>
                  </div>

                  {/* Academic Overview */}
                  <div className="rounded-2xl bg-gradient-to-br from-white to-red-50 border border-red-300 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-200">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                        <GraduationCap size={18} className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">Bức tranh học vụ</h4>
                        <p className="text-xs text-gray-400">Chương trình & Syllabus đang áp dụng</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-300">
                        <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Đang hoạt động</div>
                        <div className="mt-2 text-2xl font-bold text-gray-900">{programsLoading ? "..." : `${activeProgramCount}/${programs.length}`}</div>
                        <div className="text-xs text-gray-500 mt-1">Chương trình</div>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-300">
                        <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Đang áp dụng</div>
                        <div className="mt-2 text-2xl font-bold text-gray-900">{syllabusesLoading ? "..." : `${activeSyllabusCount}/${syllabuses.length}`}</div>
                        <div className="text-xs text-gray-500 mt-1">Syllabus</div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50/80 border border-amber-200 px-4 py-3 text-xs leading-5 text-amber-800 flex gap-2 items-start">
                      <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>Level hiển thị trực tiếp ở assignment syllabus. Module/unit drill-down sang editor.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "programs" && (
            <div>
              {programsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-red-500" />
                </div>
              ) : programs.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Layers size={28} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Chi nhánh chưa có chương trình học nào</p>
                  <button onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/courses/branch`)} className="mt-4 cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all shadow-sm">
                    <ExternalLink size={14} /> Mở trang chương trình
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {programs.map((p) => (
                    <div key={p.programId} className="group rounded-2xl bg-gradient-to-br cursor-pointer from-white to-red-50 border border-red-300 p-5 shadow-sm hover:shadow-lg hover:border-red-400 transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 font-mono text-xs font-bold border border-red-300">{p.programCode}</span>
                            <span className="font-semibold text-gray-900">{p.programName}</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {p.isActive ? <Check size={12} /> : <Circle size={12} />}
                              {p.isActive ? "Đang hoạt động" : "Tạm ngừng"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {/* <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"><CalendarDays size={12} /> Gán: {formatDate(p.assignedAt)}</span> */}
                            <span className="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-200"><BookOpen size={12} /> Syllabus liên quan: {syllabusCountsByProgram[p.programId] ?? 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => openProgramSyllabuses(p.programId)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 bg-white text-sm font-medium cursor-pointer text-gray-700 hover:border-red-400 hover:bg-red-50 transition-all">
                            <BookOpen size={14} /> Syllabus liên quan
                          </button>
                          <button onClick={() => handleRemoveProgram(p.programId)} disabled={removingProgram === p.programId} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 cursor-pointer text-sm font-medium text-red-700 hover:bg-red-100 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50">
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
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-red-500" />
                </div>
              ) : syllabuses.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <BookOpen size={28} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Chi nhánh chưa được gán khung chương trình nào</p>
                  <button onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/syllabuses`)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all shadow-sm">
                    <ExternalLink size={14} /> Mở trang syllabus
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {missingSyllabusMetadataCount > 0 && (
                    <div className="rounded-xl bg-amber-50/80 border-l-4 border-l-amber-500 p-4 text-sm text-amber-800 flex gap-2 items-start shadow-sm">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>Có {missingSyllabusMetadataCount} assignment chưa hiện đủ metadata.</span>
                    </div>
                  )}
                  <div className="grid gap-4">
                    {syllabuses.map((s) => {
                      const assignmentId = s.curriculumAssignmentId ?? s.syllabusId;
                      const syllabusCode = s.syllabusCode || `${s.syllabusId.slice(0, 8)}…`;
                      const syllabusTitle = s.syllabusTitle || "Chưa có title từ API";
                      return (
                        <div key={assignmentId} className="group rounded-2xl bg-gradient-to-br cursor-pointer from-white to-red-50 border border-red-300 p-5 shadow-sm hover:shadow-lg hover:border-red-400 transition-all duration-300">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 font-mono text-xs font-bold text-gray-700 border border-red-300">{syllabusCode}</span>
                                {s.syllabusVersion && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">v{s.syllabusVersion}</span>}
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {s.isActive ? <Check size={12} /> : <Circle size={12} />}
                                  {s.isActive ? "Đang áp dụng" : "Tạm ngừng"}
                                </span>
                              </div>
                              <div className="font-semibold text-gray-900">{syllabusTitle}</div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {s.programName && <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">{s.programName}</span>}
                                {s.levelName && <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">{s.levelName}</span>}
                                {typeof s.unitCount === "number" && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s.unitCount} unit</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => openSyllabusEditor(s.syllabusId)} className="inline-flex items-center cursor-pointer gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 bg-white text-sm font-medium text-gray-700 hover:border-red-400 hover:bg-red-50 transition-all">
                                <ExternalLink size={14} /> Editor
                              </button>
                              <button onClick={() => openProgramSyllabuses(s.programId)} className="inline-flex items-center cursor-pointer gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 bg-white text-sm font-medium text-gray-700 hover:border-red-400 hover:bg-red-50 transition-all">
                                <BookOpen size={14} /> Cùng chương trình
                              </button>
                              <button onClick={() => handleRemoveSyllabus(assignmentId)} disabled={removingSyllabus === assignmentId} className="inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 hover:bg-red-100  transition-all disabled:opacity-50">
                                {removingSyllabus === assignmentId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Gỡ
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - GIỮ NGUYÊN */}
        <div className="shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-50/30 to-red-100/30 p-4 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-red-300 bg-white text-gray-700 font-semibold hover:bg-red-50 hover:border-red-400 transition-all duration-200 cursor-pointer shadow-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
    </>
  );
}