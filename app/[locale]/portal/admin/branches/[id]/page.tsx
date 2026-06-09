"use client";

import { ArrowLeft, BookOpen, Building2, CalendarDays, Check, Circle, ExternalLink, FileText, GitBranch, GraduationCap, Info, Layers, Loader2, Mail, MapPin, Phone, Settings2, Trash2, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Branch } from "@/types/branch";
import { getBranchPrograms, removeProgramFromBranch, getAllBranches, getBranchById, type BranchProgramItem } from "@/lib/api/branchService";
import { getBranchSyllabusAssignments, removeSyllabusFromBranch, type BranchSyllabusAssignment } from "@/lib/api/syllabusService";
import { useToast } from "@/hooks/use-toast";
import { fetchAdminClasses } from "@/app/api/admin/classes";
import { getAllUsers } from "@/lib/api/userService";
import { getAccessToken } from "@/lib/store/authToken";
import ConfirmModal from "@/components/ConfirmModal";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function translateErrorMessage(error: string): { title: string; description?: string } {
  if (error.includes("409") || error.includes("Conflict")) {
    return {
      title: "Không thể gỡ chương trình này",
      description: "Chương trình đang được sử dụng hoặc có xung đột với dữ liệu hiện tại. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.",
    };
  }

  if (error.includes("cannot be removed") && error.includes("operational classes")) {
    return {
      title: "Không thể gỡ chương trình học",
      description: "Chương trình này vẫn có lớp học đang hoạt động. Vui lòng xóa hoặc chuyển lớp học trước khi gỡ chương trình.",
    };
  }

  if (error.includes("cannot be removed") && error.includes("operational enrollments")) {
    return {
      title: "Không thể gỡ chương trình học",
      description: "Chương trình này vẫn có học viên đang ghi danh. Vui lòng xóa ghi danh trước khi gỡ chương trình.",
    };
  }

  if (error.includes("401") || error.includes("Unauthorized")) {
    return {
      title: "Lỗi xác thực",
      description: "Bạn không có quyền thực hiện hành động này. Vui lòng kiểm tra quyền truy cập.",
    };
  }

  if (error.includes("403") || error.includes("Forbidden")) {
    return {
      title: "Truy cập bị từ chối",
      description: "Bạn không có quyền gỡ chương trình này. Liên hệ quản trị viên để được hỗ trợ.",
    };
  }

  if (error.includes("404") || error.includes("Not Found")) {
    return {
      title: "Không tìm thấy",
      description: "Chương trình hoặc chi nhánh không tồn tại. Vui lòng tải lại trang.",
    };
  }

  return {
    title: "Lỗi",
    description: error || "Có lỗi xảy ra. Vui lòng thử lại sau.",
  };
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
    <div className="group flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm border border-red-200/60 rounded-xl hover:border-red-400/80 hover:shadow-md transition-all duration-300">
      <div className="text-red-500 mt-0.5 group-hover:scale-110 transition-transform duration-300">{icon}</div>
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
      className="group relative overflow-hidden rounded-xl border border-red-300 bg-white p-4 text-left transition-all duration-300 hover:border-red-500 hover:bg-gradient-to-br hover:from-red-50/60 hover:to-red-50/40 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
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
        <ExternalLink size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-red-600" />
      </div>
    </button>
  );
}

function ModernCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-red-50/20 border border-red-200/60 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/10 group-hover:to-red-50/5 transition-all duration-500" />
      <div className="relative">
        {children}
      </div>
    </div>
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

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "vi";
  const branchId = params?.id;
  const { toast } = useToast();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [programs, setPrograms] = useState<BranchProgramItem[]>([]);
  const [syllabuses, setSyllabuses] = useState<BranchSyllabusAssignment[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [syllabusesLoading, setSyllabusesLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [removingProgram, setRemovingProgram] = useState<string | null>(null);
  const [confirmRemoveProgram, setConfirmRemoveProgram] = useState<string | null>(null);
  const [removingSyllabus, setRemovingSyllabus] = useState<string | null>(null);
  const [confirmRemoveSyllabus, setConfirmRemoveSyllabus] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [classCount, setClassCount] = useState(0);

  // Load branch data from API
  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    (async () => {
      try {
        const response = await getBranchById(branchId);
        console.log("getBranchById full response:", response);
        
        const isSuccessful = response?.isSuccess || response?.success;
        let branchData = null;
        console.log({response});
        
        
        // Handle different response structures from backend
        if (response?.data) {
          // Check if data.branch exists (typed response)
          if (response.data?.branch) {
            branchData = response.data.branch;
          }
          // Check if data is the branch object directly (when backend returns branch as data)
          else if (typeof response.data === 'object') {
            branchData = response.data;
          }
        }
        
        console.log("Extracted branch data:", branchData);
        
        if (isSuccessful && branchData) {
          setBranch(branchData as Branch);
        } else {
          console.error("API returned unsuccessful response or no branch data:", {
            isSuccess: response?.isSuccess,
            success: response?.success,
            data: response?.data,
            message: response?.message,
          });
          setBranch(null);
        }
      } catch (err) {
        console.error("Failed to load branch:", err);
        setBranch(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  useEffect(() => {
    if (!branch?.id) return;
    void loadPrograms(true);
    void loadSyllabuses(true);
    void loadStatistics();
  }, [branch?.id]);

  useEffect(() => {
    if (!branch?.id) return;
    if (activeTab === "programs" && programs.length === 0 && !programsLoading) void loadPrograms();
    if (activeTab === "syllabuses" && syllabuses.length === 0 && !syllabusesLoading) void loadSyllabuses();
  }, [activeTab, branch?.id]);

  const loadStatistics = async () => {
    if (!branchId) return;
    try {
      // Fetch classes count
      const classes = await fetchAdminClasses({ branchId });
      setClassCount(classes.length);

      // Fetch students count
      const usersResponse = await getAllUsers({
        branchId,
        pageSize: 200,
        isActive: true,
      });
      const responseData = usersResponse.data || usersResponse;
      
      if ((usersResponse.success || usersResponse.isSuccess) && responseData?.items) {
        const allUsers = responseData.items;
        let studentCount = 0;
        
        // Count users with Student profile
        allUsers.forEach((user: any) => {
          if (user.profiles && Array.isArray(user.profiles) && user.profiles.length > 0) {
            const studentProfiles = user.profiles.filter((p: any) => p.profileType && p.profileType.trim() === "Student");
            if (studentProfiles.length > 0) {
              studentCount += studentProfiles.length;
            }
          }
        });
        
        setStudentCount(studentCount);
      }

      // Fetch teachers count
      const token = getAccessToken();
      if (token) {
        try {
          const teachersRes = await fetch(
            `/api/admin/users?pageNumber=1&pageSize=200&role=Teacher&branchId=${branchId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (teachersRes.ok) {
            const teachersJson = await teachersRes.json();
            const teachers = teachersJson?.data?.items ?? teachersJson?.data?.users ?? [];
            setTeacherCount(Array.isArray(teachers) ? teachers.length : 0);
          }
        } catch (err) {
          console.error("Failed to load teachers:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

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
      toast.success({ title: "Gỡ chương trình học thành công" });
    } catch (err: any) {
      const errorMsg = err?.message || "Không thể gỡ chương trình học";
      const translated = translateErrorMessage(errorMsg);
      toast.destructive({ title: translated.title, description: translated.description });
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
      toast.success({ title: "Gỡ khung chương trình thành công" });
    } catch (err: any) {
      const errorMsg = err?.message || "Không thể gỡ khung chương trình";
      const translated = translateErrorMessage(errorMsg);
      toast.destructive({ title: translated.title, description: translated.description });
    } finally {
      setRemovingSyllabus(null);
    }
  };

  const navigateWithBranchContext = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <XCircle size={48} className="text-red-500" />
        <p className="text-gray-600 font-medium">Chi nhánh không tồn tại</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const activeProgramCount = programs.filter((program) => program.isActive).length;

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

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Content */}
        <div className="flex-1  mx-auto w-full py-2">
          {/* Header Info - Modern Redesigned */}
          <ModernCard className="mb-8">
            <div className="relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100/40 to-red-50/20 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-red-100/30 to-transparent rounded-full blur-2xl -ml-24 -mb-24" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-50/10 rounded-full blur-3xl" />
              
              <div className="relative p-6 md:p-8">
                {/* Back button row */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => router.back()}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/80 text-sm font-medium text-gray-700 hover:bg-white hover:border-red-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Quay lại
                  </button>

                </div>

                {/* Main content */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl shadow-md">
                        <GitBranch size={14} className="opacity-90" />
                        {branch.code}
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium backdrop-blur-sm border",
                        branch.isActive 
                          ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/60" 
                          : "bg-gray-100/80 text-gray-600 border-gray-200/60"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          branch.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                        )} />
                        {branch.isActive ? "Đang hoạt động" : "Không hoạt động"}
                      </div>
                    </div>

                    {/* Title and description */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                      {branch.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-red-50">
                          <MapPin size={14} className="text-red-500" />
                        </div>
                        <span>{branch.address || "Chưa cập nhật địa chỉ"}</span>
                      </div>
                      {branch.contactPhone && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-red-50">
                            <Phone size={14} className="text-red-500" />
                          </div>
                          <span>{branch.contactPhone}</span>
                        </div>
                      )}
                      {branch.contactEmail && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-red-50">
                            <Mail size={14} className="text-red-500" />
                          </div>
                          <span className="text-sm">{branch.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <div className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/60 px-4 py-3 min-w-[100px] hover:border-red-300/60 hover:shadow-lg transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/20 group-hover:to-red-50/10 transition-all duration-300" />
                      <div className="relative">
                        <GraduationCap size={16} className="text-red-500 mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="text-2xl font-bold text-gray-900">{studentCount}</div>
                        <div className="text-xs text-gray-500 font-medium">Học viên</div>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/60 px-4 py-3 min-w-[100px] hover:border-red-300/60 hover:shadow-lg transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/20 group-hover:to-red-50/10 transition-all duration-300" />
                      <div className="relative">
                        <Users size={16} className="text-red-500 mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="text-2xl font-bold text-gray-900">{classCount}</div>
                        <div className="text-xs text-gray-500 font-medium">Lớp học</div>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/60 px-4 py-3 min-w-[100px] hover:border-red-300/60 hover:shadow-lg transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/20 group-hover:to-red-50/10 transition-all duration-300" />
                      <div className="relative">
                        <Users size={16} className="text-red-500 mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="text-2xl font-bold text-gray-900">{teacherCount}</div>
                        <div className="text-xs text-gray-500 font-medium">Giáo viên</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider with decorative line */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200/60"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="px-3 bg-transparent">
                      <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent rounded-full"></div>
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </ModernCard>

          {/* Tabs - Modern Design */}
          <div className="flex gap-1 mb-0 border-b border-gray-200/80 bg-transparent backdrop-blur-sm">
            {([
              ["overview", <Info size={14} />, "Tổng quan"],
              ["programs", <Layers size={14} />, "Chương trình học"],
              ["syllabuses", <BookOpen size={14} />, "Khung chương trình"]
            ] as [Tab, React.ReactNode, string][]).map(([tab, icon, label]) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setTabError(null); }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200 relative border-b-2 cursor-pointer group",
                  activeTab === tab 
                    ? "text-red-600 border-red-600" 
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <span className={cn(
                  "transition-transform duration-200",
                  activeTab === tab ? "scale-110" : "group-hover:scale-105"
                )}>
                  {icon}
                </span>
                {label}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content - Modern Cards */}
          <div className="mt-6">
            {tabError && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-50/50 border-l-4 border-red-500 text-sm text-red-700 mb-6 animate-in slide-in-from-top-2 duration-200">
                <XCircle size={18} className="shrink-0 text-red-500" />
                <span className="font-medium">{tabError}</span>
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Stats Badges */}
                <div className="flex flex-wrap gap-3">
                  <Badge color="green"><GraduationCap size={14} /> Học viên: {studentCount}</Badge>
                  <Badge color="blue"><Users size={14} /> Lớp học: {classCount}</Badge>
                  <Badge color="purple"><Users size={14} /> Giáo viên: {teacherCount}</Badge>
                  <Badge color="orange"><Layers size={14} /> Chương trình: {programsLoading ? "..." : programs.length}</Badge>
                  <Badge color="yellow"><BookOpen size={14} /> Syllabus: {syllabusesLoading ? "..." : syllabuses.length}</Badge>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <ModernCard>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-200/60">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                            <Info size={18} className="text-red-500" />
                          </div>
                          <h4 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h4>
                        </div>
                        <div className="grid gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoRow label="Email liên hệ" value={branch.contactEmail || "Chưa cập nhật"} icon={<Mail size={16} />} />
                            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border border-red-200/60 rounded-xl hover:border-red-400/80 hover:shadow-md transition-all duration-300">
                              <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Ngày tạo</div>
                                <div className="text-sm text-gray-900 font-medium">{formatDateTime(branch.createdAt)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoRow label="Số liên hệ" value={branch.contactPhone || "Chưa cập nhật"} icon={<Phone size={16} />} />
                            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border border-red-200/60 rounded-xl hover:border-red-400/80 hover:shadow-md transition-all duration-300">
                              <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Cập nhật gần nhất</div>
                                <div className="text-sm text-gray-900 font-medium">{formatDateTime(branch.updatedAt)}</div>
                              </div>
                            </div>
                          </div>
                          <InfoRow label="Địa chỉ" value={branch.address} icon={<MapPin size={16} />} />
                          {branch.description && <InfoRow label="Mô tả" value={branch.description} icon={<FileText size={16} />} />}
                        </div>
                      </div>
                    </ModernCard>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Quick Navigation */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-red-50/20 border border-red-200/60 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                      <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-red-200/60">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                            <Layers size={18} className="text-red-500" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">Quản lý nhanh</h4>
                            <p className="text-xs text-gray-400 mt-1">Giữ filter chi nhánh</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-gradient-to-r from-red-100 to-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 border border-red-200 shadow-sm backdrop-blur-sm">Giữ filter</span>
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
                  </div>
                </div>
              </div>
            )}

            {activeTab === "programs" && (
              <div className="animate-in fade-in duration-300">
                {programsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-red-500" />
                  </div>
                ) : programs.length === 0 ? (
                  <ModernCard>
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Layers size={28} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Chi nhánh chưa có chương trình học nào</p>
                      <button onClick={() => navigateWithBranchContext(`/${locale}/portal/admin/courses/branch`)} className="mt-4 cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg">
                        <ExternalLink size={14} /> Mở trang chương trình
                      </button>
                    </div>
                  </ModernCard>
                ) : (
                  <div className="grid gap-4">
                    {programs.map((p, index) => (
                      <ModernCard key={p.programId}>
                        <div className="p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-3 py-1 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 font-mono text-sm font-bold text-gray-700">{p.programCode}</span>
                                {p.isActive && (
                                  <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                                    <Check size={12} /> Đang hoạt động
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-lg">{p.programName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => handleRemoveProgram(p.programId)} disabled={removingProgram === p.programId} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 cursor-pointer text-sm font-medium text-red-700 hover:bg-red-100 hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50">
                                <Trash2 size={14} />
                                Gỡ
                              </button>
                            </div>
                          </div>
                        </div>
                      </ModernCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "syllabuses" && (
              <div className="animate-in fade-in duration-300">
                {syllabusesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-red-500" />
                  </div>
                ) : syllabuses.length === 0 ? (
                  <ModernCard>
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <BookOpen size={28} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Chi nhánh chưa được gán khung chương trình nào</p>
                      <button onClick={() => router.push(`/${locale}/portal/admin/syllabuses`)} className="mt-4 cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg">
                        <ExternalLink size={14} /> Mở trang syllabus
                      </button>
                    </div>
                  </ModernCard>
                ) : (
                  <div className="grid gap-4">
                    {syllabuses.map((s) => {
                      const assignmentId = s.curriculumAssignmentId ?? s.syllabusId;
                      const syllabusCode = s.syllabusCode || `${s.syllabusId.slice(0, 8)}…`;
                      const syllabusTitle = s.syllabusTitle || "Chưa có title";
                      return (
                        <ModernCard key={assignmentId}>
                          <div className="p-5">
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
                                <button onClick={() => handleRemoveSyllabus(assignmentId)} disabled={removingSyllabus === assignmentId} className="inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 hover:bg-red-100 hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50">
                                  {removingSyllabus === assignmentId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  Gỡ
                                </button>
                              </div>
                            </div>
                          </div>
                        </ModernCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Confirm Modals */}
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
      </div>
    </>
  );
}