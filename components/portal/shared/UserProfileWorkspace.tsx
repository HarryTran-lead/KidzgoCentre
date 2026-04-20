"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ShieldCheck,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  KeyRound,
  User,
  Camera,
  Calendar,
  Fingerprint,
  Bell,
  Palette,
  Moon,
  Sun,
  Smartphone,
  Award,
  Users,
} from "lucide-react";
import {
  getUserMe,
  updateUserMe,
  changePassword,
  verifyParentPin,
  changePin,
  requestPinReset,
} from "@/lib/api/authService";
import { uploadAvatar, isUploadSuccess } from "@/lib/api/fileService";
import { buildFileUrl } from "@/constants/apiURL";
import type { UserMeResponse, UserProfile } from "@/types/auth";
import { toast } from "@/hooks/use-toast";
import { emitCurrentUserUpdated } from "@/hooks/useCurrentUser";
import { normalizeRole } from "@/lib/role";

type Tab = "info" | "password" | "preferences" | "pin";
type PinMode = "idle" | "set" | "change" | "forgot-email";

const ROLE_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Admin: { label: "Quản trị viên", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <ShieldCheck size={12} /> },
  Staff_Manager: { label: "Quản lý", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <User size={12} /> },
  Staff_Accountant: { label: "Kế toán", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Award size={12} /> },
  Teacher: { label: "Giáo viên", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Sparkles size={12} /> },
  Student: { label: "Học viên", color: "bg-sky-100 text-sky-700 border-sky-200", icon: <UserRound size={12} /> },
  Parent: { label: "Phụ huynh", color: "bg-rose-100 text-rose-700 border-rose-200", icon: <Users size={12} /> },
};

const hasExplicitFailure = (response: any): boolean => {
  return Boolean(response && (response.success === false || response.isSuccess === false));
};

const unwrapApiData = <T,>(response: any): T | null => {
  if (!response || hasExplicitFailure(response)) return null;
  const level1 = response?.data ?? response;
  const level2 = level1?.data ?? level1;
  return (level2 ?? null) as T | null;
};

const toViErrorMessage = (message?: string, fallback = "Có lỗi xảy ra") => {
  const raw = (message || "").trim();
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();

  if (normalized.includes("current password") && normalized.includes("incorrect")) {
    return "Mật khẩu hiện tại không đúng.";
  }
  if (normalized.includes("pin is incorrect") || normalized.includes("incorrect pin")) {
    return "Mã PIN không đúng.";
  }
  if (normalized.includes("users.invalidcurrentpassword")) {
    return "Mật khẩu hiện tại không đúng.";
  }
  if (normalized.includes("no file provided")) {
    return "Bạn chưa chọn file ảnh.";
  }
  if (normalized.includes("file type is not allowed")) {
    return "Định dạng ảnh không hợp lệ. Chỉ nhận JPG, PNG, WEBP.";
  }
  if (normalized.includes("file size exceeds maximum allowed size of 10mb")) {
    return "Kích thước ảnh vượt quá 10MB.";
  }
  if (normalized.includes("parent account must select a student profile")) {
    return "Phụ huynh cần chọn học sinh trước khi cập nhật thông tin học sinh.";
  }
  if (normalized.includes("request failed with status code")) {
    return fallback;
  }

  return raw;
};

const findParentProfile = (profiles?: UserProfile[]): UserProfile | undefined => {
  return profiles?.find((profile) => profile.profileType === "Parent");
};

const findStudentProfile = (user?: UserMeResponse | null): UserProfile | undefined => {
  if (!user) return undefined;
  const targetStudentId = findStudentProfileId(user);
  if (!targetStudentId) return undefined;
  return user.profiles?.find(
    (profile) => profile.profileType === "Student" && profile.id === targetStudentId
  );
};

const findActiveProfileByRole = (
  user: UserMeResponse,
  role: string | null
): UserProfile | undefined => {
  if (role === "Student") {
    return findStudentProfile(user);
  }

  if (role === "Parent") {
    return findParentProfile(user.profiles);
  }

  return undefined;
};

const findStudentProfileId = (user?: UserMeResponse | null): string => {
  if (!user) return "";

  return (
    user.selectedProfileId ??
    user.selectedProfile?.id ??
    user.profiles?.find((profile) => profile.profileType === "Student")?.id ??
    ""
  );
};

const getEffectiveRole = (rawRole?: string): string | null => {
  const value = (rawRole || "").trim();
  if (!value) return null;
  try {
    return normalizeRole(value);
  } catch {
    return value;
  }
};

const getPortalRoleFromPathname = (pathname?: string): string | null => {
  const path = (pathname || "").replace(/^\/(vi|en)(?=\/|$)/, "");
  if (path.startsWith("/portal/admin")) return "Admin";
  if (path.startsWith("/portal/staff-management")) return "Staff_Manager";
  if (path.startsWith("/portal/staff-accountant")) return "Staff_Accountant";
  if (path.startsWith("/portal/teacher")) return "Teacher";
  if (path.startsWith("/portal/student")) return "Student";
  if (path.startsWith("/portal/parent")) return "Parent";
  return null;
};

const getApiErrorMessage = (error: any, fallback = "Có lỗi xảy ra") => {
  const payload = error?.response?.data;
  return toViErrorMessage(
    payload?.detail ?? payload?.message ?? payload?.data?.message ?? payload?.title ?? error?.message,
    fallback
  );
};

export default function UserProfileWorkspace() {
  const pathname = usePathname();
  const portalRole = useMemo(() => getPortalRoleFromPathname(pathname), [pathname]);

  const [tab, setTab] = useState<Tab>("info");
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());
  const [isParentRole, setIsParentRole] = useState(false);

  // Parent PIN state
  const [pinMode, setPinMode] = useState<PinMode>("idle");
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [parentProfileId, setParentProfileId] = useState("");
  const [pinForm, setPinForm] = useState({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
  const [pinMsg, setPinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Edit info state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState("");
  const [profileDisplayNames, setProfileDisplayNames] = useState<Record<string, string>>({});
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences state
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const effectiveRole = portalRole ?? getEffectiveRole(user?.role);
  const isStudentPortal = effectiveRole === "Student";

  const activeProfile = useMemo(() => {
    if (!user?.profiles?.length) return undefined;

    if (effectiveRole === "Parent") {
      return findParentProfile(user.profiles);
    }

    if (effectiveRole === "Student") {
      return findStudentProfile(user);
    }

    return undefined;
  }, [effectiveRole, user]);

  const editableProfiles = useMemo(() => {
    if (!user?.profiles?.length) {
      return [] as UserProfile[];
    }

    if (effectiveRole === "Parent") {
      const parent = findParentProfile(user.profiles);
      return parent ? [parent] : [];
    }

    if (effectiveRole === "Student") {
      const student = findStudentProfile(user);
      return student ? [student] : [];
    }

    return [] as UserProfile[];
  }, [effectiveRole, user]);

  const applyUserState = (nextUser: UserMeResponse) => {
    const normalizedRole = getEffectiveRole(nextUser.role);
    const resolvedRole = portalRole ?? normalizedRole;
    const normalizedUser = {
      ...nextUser,
      fullName: (nextUser as any).fullName ?? (nextUser as any).name ?? "",
      avatarUrl: (nextUser as any).avatarUrl ?? (nextUser as any).avatar ?? undefined,
    } as UserMeResponse;

    const normalizedProfiles = Array.isArray(normalizedUser.profiles)
      ? normalizedUser.profiles
      : [];

    setUser(normalizedUser);
    const studentProfile =
      resolvedRole === "Student"
        ? findStudentProfile(normalizedUser)
        : undefined;

    const parentProfile =
      resolvedRole === "Parent"
        ? findParentProfile(normalizedProfiles)
        : undefined;

    const mappedDisplayName =
      studentProfile?.displayName ??
      parentProfile?.displayName ??
      normalizedUser.fullName ??
      "";

    setFullName(mappedDisplayName);
    setEmail(normalizedUser.email ?? "");
    setPhoneNumber(normalizedUser.phoneNumber ?? "");
    setSelectedStudentProfileId(findStudentProfileId(normalizedUser));
    setProfileDisplayNames(() => {
      const nextProfileNames: Record<string, string> = {};
      normalizedProfiles.forEach((profile) => {
        if (!profile?.id) return;
        nextProfileNames[profile.id] = profile.displayName ?? "";
      });
      return nextProfileNames;
    });

    const parentProfileState = findParentProfile(normalizedProfiles);
    const parentDetected = resolvedRole === "Parent";

    setIsParentRole(parentDetected);

    if (parentDetected && parentProfileState?.id) {
      setParentProfileId(parentProfileState.id);
      setHasPinSetup(Boolean(parentProfileState.hasPinSetup));
    } else {
      setParentProfileId("");
      setHasPinSetup(false);
      setPinMode("idle");
      setPinMsg(null);
    }

    setTab((prev) => {
      if (parentDetected && prev === "preferences") return "info";
      if (!parentDetected && prev === "pin") return "info";
      return prev;
    });
  };

  const emitHeaderProfileUpdate = (nextUser: UserMeResponse, fallbackAvatarUrl?: string) => {
    const resolvedRole = portalRole ?? getEffectiveRole(nextUser.role);
    const activeProfileByRole = findActiveProfileByRole(nextUser, resolvedRole);
    const resolvedName =
      activeProfileByRole?.displayName ??
      ((nextUser as any).fullName ?? (nextUser as any).name ?? "");
    const resolvedAvatar =
      activeProfileByRole?.avatarUrl ??
      ((nextUser as any).avatarUrl ?? (nextUser as any).avatar ?? fallbackAvatarUrl);

    emitCurrentUserUpdated({
      fullName: resolvedName,
      avatarUrl: resolvedAvatar,
      profiles: nextUser.profiles,
      selectedProfile: nextUser.selectedProfile,
      selectedProfileId: nextUser.selectedProfileId,
    });
  };

  useEffect(() => {
    let alive = true;

    const fetchUser = async () => {
      try {
        const response = await getUserMe();
        if (hasExplicitFailure(response)) {
          throw new Error(toViErrorMessage(response?.message, "Không thể tải thông tin"));
        }

        const meData = unwrapApiData<UserMeResponse>(response);
        if (!meData) {
          throw new Error("Không thể tải thông tin người dùng");
        }

        if (!alive) return;
        applyUserState(meData);
      } catch (error: any) {
        if (!alive) return;
        toast({ title: "Lỗi", description: getApiErrorMessage(error, "Có lỗi xảy ra khi tải thông tin"), variant: "destructive" });
      } finally {
        if (!alive) return;
        setIsLoading(false);
        setIsPageLoaded(true);
      }
    };

    fetchUser();

    return () => {
      alive = false;
    };
  }, []);

  const handleSaveInfo = async () => {
    if (!fullName.trim()) {
      toast({ title: "Lỗi", description: "Họ tên không được để trống", variant: "destructive" });
      return;
    }

    const profileUpdates = editableProfiles.map((profile) => ({
      id: profile.id,
      displayName: (profileDisplayNames[profile.id] ?? profile.displayName ?? "").trim(),
    }));

    if (profileUpdates.some((profile) => !profile.displayName)) {
      toast({
        title: "Lỗi",
        description: "Tên hiển thị của profile không được để trống",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingInfo(true);
      const response = await updateUserMe({
        fullName: isStudentPortal ? undefined : fullName.trim(),
        email: isStudentPortal ? undefined : email.trim(),
        phoneNumber: isStudentPortal ? undefined : phoneNumber.trim(),
        profiles: profileUpdates.length ? profileUpdates : undefined,
      });

      if (hasExplicitFailure(response)) {
        toast({
          title: "Lỗi",
          description: toViErrorMessage(response?.message, "Không thể cập nhật thông tin"),
          variant: "destructive",
        });
        return;
      }

      const updatedUser = unwrapApiData<UserMeResponse>(response);
      if (updatedUser && typeof updatedUser === "object") {
        applyUserState(updatedUser);
        emitHeaderProfileUpdate(updatedUser);
      } else {
        const meResponse = await getUserMe();
        const latestUser = unwrapApiData<UserMeResponse>(meResponse);
        if (latestUser) {
          applyUserState(latestUser);
          emitHeaderProfileUpdate(latestUser);
        }
      }

      toast({ title: "Thành công", description: "Đã cập nhật thông tin cá nhân", variant: "success" });
    } catch (error: any) {
      toast({ title: "Lỗi", description: getApiErrorMessage(error, "Có lỗi xảy ra khi cập nhật"), variant: "destructive" });
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu mới phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp", variant: "destructive" });
      return;
    }
    try {
      setIsSavingPassword(true);
      const response = await changePassword({ currentPassword, newPassword });

      if (hasExplicitFailure(response)) {
        toast({
          title: "Lỗi",
          description: toViErrorMessage(response?.message, "Không thể đổi mật khẩu"),
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Thành công", description: "Đã đổi mật khẩu thành công", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Lỗi", description: getApiErrorMessage(error, "Không thể đổi mật khẩu"), variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetProfileId =
      effectiveRole === "Parent"
        ? parentProfileId
        : effectiveRole === "Student"
          ? selectedStudentProfileId
          : "";

    if ((effectiveRole === "Parent" || effectiveRole === "Student") && !targetProfileId) {
      const description =
        effectiveRole === "Parent"
          ? "Không tìm thấy hồ sơ phụ huynh để cập nhật avatar"
          : "Không tìm thấy hồ sơ học sinh đang được chọn để cập nhật avatar";
      toast({ title: "Lỗi", description, variant: "destructive" });
      if (e.target) e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Lỗi",
        description: "Định dạng ảnh không hợp lệ. Chỉ nhận JPG, PNG, WEBP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Kích thước ảnh không được vượt quá 10MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingAvatar(true);
      const response = await uploadAvatar(file, {
        targetProfileId: targetProfileId || undefined,
      });
      if (isUploadSuccess(response)) {
        toast({ title: "Thành công", description: "Đã cập nhật ảnh đại diện", variant: "success" });

        setAvatarVersion(Date.now());

        const meResponse = await getUserMe();
        if (!hasExplicitFailure(meResponse)) {
          const latestUser = unwrapApiData<UserMeResponse>(meResponse);
          if (latestUser) {
            applyUserState(latestUser);
            emitHeaderProfileUpdate(latestUser, response.url);
          }
        }

        setAvatarPreview(null);
      } else {
        const message = toViErrorMessage(
          response?.detail || response?.error || response?.title,
          "Không thể cập nhật ảnh đại diện"
        );
        toast({ title: "Lỗi", description: message, variant: "destructive" });
        setAvatarPreview(null);
      }
    } catch (error: any) {
      const message = getApiErrorMessage(error, "Có lỗi xảy ra khi cập nhật ảnh đại diện");
      toast({ title: "Lỗi", description: message, variant: "destructive" });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSetPin = async () => {
    if (!parentProfileId) {
      setPinMsg({ type: "error", text: "Không tìm thấy hồ sơ phụ huynh để xác thực PIN" });
      return;
    }
    if (!pinForm.pin || pinForm.pin.length < 4) {
      setPinMsg({ type: "error", text: "PIN phải có ít nhất 4 chữ số" });
      return;
    }
    if (!/^\d+$/.test(pinForm.pin)) {
      setPinMsg({ type: "error", text: "PIN chỉ được chứa số" });
      return;
    }

    setPinLoading(true);
    setPinMsg(null);

    try {
      const response = await verifyParentPin({ profileId: parentProfileId, pin: pinForm.pin });

      if (hasExplicitFailure(response)) {
        const message = toViErrorMessage(response?.message, "Xác thực PIN thất bại");
        setPinMsg({ type: "error", text: message });
        toast({ title: "Lỗi", description: message, variant: "destructive" });
        return;
      }

      setHasPinSetup(true);
      setPinMode("idle");
      setPinForm({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
      setPinMsg({ type: "success", text: "Đã xác thực mã PIN thành công" });
      toast({ title: "Thành công", description: "Đã xác thực mã PIN", variant: "success" });
    } catch (error: any) {
      const message = toViErrorMessage(error?.response?.data?.detail ?? error?.response?.data?.message, "Xác thực PIN thất bại");
      setPinMsg({ type: "error", text: message });
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!pinForm.currentPin || !pinForm.newPin || !pinForm.confirmPin) {
      setPinMsg({ type: "error", text: "Vui lòng nhập đầy đủ thông tin PIN" });
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinMsg({ type: "error", text: "PIN xác nhận không khớp" });
      return;
    }

    if (!/^\d+$/.test(pinForm.newPin)) {
      setPinMsg({ type: "error", text: "PIN chỉ được chứa số" });
      return;
    }

    setPinLoading(true);
    setPinMsg(null);

    try {
      const response = await changePin({ currentPin: pinForm.currentPin, newPin: pinForm.newPin });

      if (hasExplicitFailure(response)) {
        const message = toViErrorMessage(response?.message, "Đổi PIN thất bại");
        setPinMsg({ type: "error", text: message });
        toast({ title: "Lỗi", description: message, variant: "destructive" });
        return;
      }

      setPinMode("idle");
      setPinForm({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
      setPinMsg({ type: "success", text: "Đã đổi mã PIN thành công" });
      toast({ title: "Thành công", description: "Đã đổi mã PIN", variant: "success" });
    } catch (error: any) {
      const message = toViErrorMessage(error?.response?.data?.detail ?? error?.response?.data?.message, "Đổi PIN thất bại");
      setPinMsg({ type: "error", text: message });
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  const handleForgotPinEmail = async () => {
    if (!parentProfileId) {
      setPinMsg({ type: "error", text: "Không tìm thấy hồ sơ phụ huynh để khôi phục PIN" });
      return;
    }

    setPinLoading(true);
    setPinMsg(null);

    try {
      const response = await requestPinReset({ profileId: parentProfileId });

      if (hasExplicitFailure(response)) {
        const message = toViErrorMessage(response?.message, "Khôi phục PIN thất bại");
        setPinMsg({ type: "error", text: message });
        toast({ title: "Lỗi", description: message, variant: "destructive" });
        return;
      }

      setPinMode("idle");
      setPinMsg({ type: "success", text: "Đã gửi link đặt lại PIN qua email. Vui lòng kiểm tra hộp thư." });
      toast({ title: "Thành công", description: "Đã gửi link khôi phục PIN qua email", variant: "success" });
    } catch (error: any) {
      const message = toViErrorMessage(error?.response?.data?.detail ?? error?.response?.data?.message, "Khôi phục PIN thất bại");
      setPinMsg({ type: "error", text: message });
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
          <div className="relative bg-white p-6 rounded-2xl shadow-xl text-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = activeProfile?.displayName ?? fullName ?? user?.fullName ?? user?.userName ?? "";
  const avatarLetter = (displayName || "?")[0]?.toUpperCase() ?? "?";
  const roleInfo = ROLE_LABEL[effectiveRole ?? ""] ?? {
    label: user?.role ?? "",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: null,
  };
  const avatarSrc = activeProfile?.avatarUrl
    ? buildFileUrl(activeProfile.avatarUrl)
    : user?.avatarUrl
      ? buildFileUrl(user.avatarUrl)
      : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-8xl mx-auto relative z-10">
        {/* Page Header with Animation */}
        <div className={`mb-10 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-lg">
                  <UserRound size={28} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Hồ sơ cá nhân
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <Sparkles size={14} className="text-red-500" />
                  Quản lý thông tin cá nhân và bảo mật tài khoản
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* LEFT: Profile card (sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden sticky top-6 transition-all duration-300 hover:shadow-2xl">
              {/* Gradient Banner with Pattern */}
              <div className="relative h-32 bg-gradient-to-r from-red-600 via-red-500 to-red-700 overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px',
                  }}
                ></div>
                <div className="absolute -bottom-6 left-0 right-0 h-12 bg-white/80 backdrop-blur-sm rounded-t-3xl"></div>
              </div>
              
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <div className="flex justify-center -mt-12 mb-4">
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div 
                      className="relative w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-3xl font-bold select-none overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : avatarSrc ? (
                        <img
                          src={`${avatarSrc}${avatarSrc.includes("?") ? "&" : "?"}v=${avatarVersion}`}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        avatarLetter
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mb-4">
                  Ảnh JPG/PNG/WEBP, dung lượng tối đa 10MB.
                </p>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {displayName || user?.userName}
                  </h2>
                  {!isStudentPortal && <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>}
                </div>

                {/* Chips */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${roleInfo.color}`}>
                    {roleInfo.icon}
                    {roleInfo.label}
                  </span>
                  {user?.branchName && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      <Building2 size={11} />
                      {user.branchName}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    user?.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    {user?.isActive
                      ? <><CheckCircle size={11} /> Đang hoạt động</>
                      : <><XCircle size={11} /> Không hoạt động</>
                    }
                  </span>
                </div>
                {/* Account meta */}
                {!isStudentPortal && user?.userName && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <Fingerprint size={14} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Tên đăng nhập</p>
                        <p className="text-sm font-semibold text-gray-900">{user.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <Calendar size={14} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Ngày tạo tài khoản</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </p>
                      </div>
                    </div>
                    {user.phoneNumber && (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Smartphone size={14} className="text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Số điện thoại</p>
                          <p className="text-sm font-semibold text-gray-900">{user.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Tabs + Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 p-1.5 rounded-2xl shadow-sm">
              <TabButton
                active={tab === "info"}
                onClick={() => setTab("info")}
                icon={<UserRound size={16} />}
                label="Thông tin cá nhân"
              />
              <TabButton
                active={tab === "password"}
                onClick={() => setTab("password")}
                icon={<KeyRound size={16} />}
                label="Đổi mật khẩu"
              />
              {isParentRole ? (
                <TabButton
                  active={tab === "pin"}
                  onClick={() => {
                    setTab("pin");
                    setPinMode("idle");
                    setPinMsg(null);
                  }}
                  icon={<KeyRound size={16} />}
                  label="Mã PIN"
                />
              ) : (
                <TabButton
                  active={tab === "preferences"}
                  onClick={() => setTab("preferences")}
                  icon={<Bell size={16} />}
                  label="Cài đặt"
                />
              )}
            </div>

            {/* Tab panels */}
            {tab === "info" && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <UserRound size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                    <p className="text-sm text-gray-500">Cập nhật thông tin cơ bản của bạn</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User size={14} className="text-red-500" />
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {!isStudentPortal && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Mail size={14} className="text-red-500" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@gmail.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Smartphone size={14} className="text-red-500" />
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0901234567"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {editableProfiles.length > 0 && (
                    <div className="md:col-span-2 space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Users size={14} className="text-red-500" />
                        Tên hiển thị profile
                      </label>
                      <div className="space-y-3">
                        {editableProfiles.map((profile) => {
                          const typeLabel = profile.profileType === "Parent" ? "Phụ huynh" : "Học sinh";
                          const typeColor =
                            profile.profileType === "Parent"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-sky-50 text-sky-700 border-sky-200";

                          return (
                            <div key={profile.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full border font-medium ${typeColor}`}>
                                  {typeLabel}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={profileDisplayNames[profile.id] ?? ""}
                                onChange={(event) =>
                                  setProfileDisplayNames((prev) => ({
                                    ...prev,
                                    [profile.id]: event.target.value,
                                  }))
                                }
                                placeholder={`Nhập tên hiển thị cho ${typeLabel.toLowerCase()}`}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveInfo}
                    disabled={isSavingInfo}
                    className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative flex items-center gap-2">
                      {isSavingInfo ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Lưu thay đổi
                    </span>
                  </button>
                </div>
              </div>
            )}

            {tab === "password" && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <ShieldCheck size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bảo mật tài khoản</h3>
                    <p className="text-sm text-gray-500">Thay đổi mật khẩu đăng nhập</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <PasswordField
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    show={showCurrent}
                    onChange={setCurrentPassword}
                    onToggle={() => setShowCurrent((v) => !v)}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <PasswordField
                      label="Mật khẩu mới"
                      value={newPassword}
                      show={showNew}
                      onChange={setNewPassword}
                      onToggle={() => setShowNew((v) => !v)}
                      placeholder="Ít nhất 6 ký tự"
                    />
                    <PasswordField
                      label="Xác nhận mật khẩu mới"
                      value={confirmPassword}
                      show={showConfirm}
                      onChange={setConfirmPassword}
                      onToggle={() => setShowConfirm((v) => !v)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          newPassword.length >= 8 ? "w-full bg-emerald-500" :
                          newPassword.length >= 6 ? "w-2/3 bg-amber-500" :
                          "w-1/3 bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {newPassword.length >= 8 ? "Mật khẩu mạnh" :
                       newPassword.length >= 6 ? "Mật khẩu trung bình" :
                       "Mật khẩu yếu"}
                    </p>
                  </div>
                )}

                {/* Password tip */}
                <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <ShieldCheck size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <span>Mật khẩu mạnh nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.</span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword}
                    className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative flex items-center gap-2">
                      {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                      Đổi mật khẩu
                    </span>
                  </button>
                </div>
              </div>
            )}

            {isParentRole && tab === "pin" && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <KeyRound size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quản lý mã PIN</h3>
                    <p className="text-sm text-gray-500">PIN chỉ áp dụng cho tài khoản phụ huynh</p>
                  </div>
                  <div className="ml-auto">
                    {hasPinSetup ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                        <CheckCircle size={12} /> Đã xác thực
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                        <AlertCircle size={12} /> Chưa xác thực
                      </span>
                    )}
                  </div>
                </div>

                {pinMsg && (
                  <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                    pinMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}>
                    {pinMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {pinMsg.text}
                  </div>
                )}

                {pinMode === "idle" && (
                  <div className="space-y-3">
                    {!hasPinSetup ? (
                      <button
                        onClick={() => {
                          setPinMode("set");
                          setPinMsg(null);
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-left"
                      >
                        <div className="p-2 bg-red-100 rounded-lg text-red-600"><KeyRound size={18} /></div>
                        <div>
                          <div className="font-medium text-gray-900">Thiết lập mã PIN</div>
                          <div className="text-xs text-gray-500">Xác thực PIN để bảo mật thao tác của phụ huynh</div>
                        </div>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPinMode("change");
                            setPinMsg(null);
                          }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-left"
                        >
                          <div className="p-2 bg-red-100 rounded-lg text-red-600"><Lock size={18} /></div>
                          <div>
                            <div className="font-medium text-gray-900">Đổi mã PIN</div>
                            <div className="text-xs text-gray-500">Đổi PIN hiện tại sang PIN mới</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setPinMode("forgot-email");
                            setPinMsg(null);
                          }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-amber-200 hover:bg-amber-50 transition-all text-left"
                        >
                          <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Mail size={18} /></div>
                          <div>
                            <div className="font-medium text-gray-900">Quên PIN - Khôi phục qua Email</div>
                            <div className="text-xs text-gray-500">Nhận link đặt lại PIN qua email đã đăng ký</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {pinMode === "set" && (
                  <div className="space-y-4">
                    <PinField
                      label="Nhập mã PIN hiện tại"
                      value={pinForm.pin}
                      onChange={(value) => setPinForm((prev) => ({ ...prev, pin: value }))}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setPinMode("idle");
                          setPinMsg(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSetPin}
                        disabled={pinLoading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                        Xác nhận
                      </button>
                    </div>
                  </div>
                )}

                {pinMode === "change" && (
                  <div className="space-y-4">
                    <PinField
                      label="PIN hiện tại"
                      value={pinForm.currentPin}
                      onChange={(value) => setPinForm((prev) => ({ ...prev, currentPin: value }))}
                    />
                    <PinField
                      label="PIN mới"
                      value={pinForm.newPin}
                      onChange={(value) => setPinForm((prev) => ({ ...prev, newPin: value }))}
                    />
                    <PinField
                      label="Nhập lại PIN mới"
                      value={pinForm.confirmPin}
                      onChange={(value) => setPinForm((prev) => ({ ...prev, confirmPin: value }))}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setPinMode("idle");
                          setPinMsg(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleChangePin}
                        disabled={pinLoading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                        Đổi PIN
                      </button>
                    </div>
                  </div>
                )}

                {pinMode === "forgot-email" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                      <p>
                        Link khôi phục PIN sẽ được gửi đến email <strong>{email || "(chưa cập nhật)"}</strong>.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setPinMode("idle");
                          setPinMsg(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleForgotPinEmail}
                        disabled={pinLoading || !email}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        Gửi link khôi phục
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isParentRole && tab === "preferences" && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <Palette size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cài đặt</h3>
                    <p className="text-sm text-gray-500">Tùy chỉnh trải nghiệm của bạn</p>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <Palette size={14} className="text-red-500" />
                      Giao diện
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          theme === "light" 
                            ? "border-red-500 bg-red-50/50 shadow-sm" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Sun size={20} className={theme === "light" ? "text-red-500" : "text-gray-500"} />
                        <span className={`text-xs ${theme === "light" ? "text-red-600 font-medium" : "text-gray-600"}`}>Sáng</span>
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          theme === "dark" 
                            ? "border-red-500 bg-red-50/50 shadow-sm" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Moon size={20} className={theme === "dark" ? "text-red-500" : "text-gray-500"} />
                        <span className={`text-xs ${theme === "dark" ? "text-red-600 font-medium" : "text-gray-600"}`}>Tối</span>
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          theme === "system" 
                            ? "border-red-500 bg-red-50/50 shadow-sm" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Smartphone size={20} className={theme === "system" ? "text-red-500" : "text-gray-500"} />
                        <span className={`text-xs ${theme === "system" ? "text-red-600 font-medium" : "text-gray-600"}`}>Hệ thống</span>
                      </button>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <Bell size={14} className="text-red-500" />
                      Thông báo
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-700">Thông báo qua email</span>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications.email}
                            onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-red-600 transition-colors"></div>
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Bell size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-700">Thông báo đẩy</span>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications.push}
                            onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-red-600 transition-colors"></div>
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Smartphone size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-700">Thông báo SMS</span>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications.sms}
                            onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-red-600 transition-colors"></div>
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative flex items-center gap-2">
                      <Save size={16} />
                      Lưu cài đặt
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PasswordField({
  label,
  value,
  show,
  onChange,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        <Lock size={14} className="text-red-500" />
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function PinField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-gray-700">{label}</div>
      <div className="relative max-w-xs">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <KeyRound size={16} />
        </div>
        <input
          type={show ? "text" : "password"}
          inputMode="numeric"
          maxLength={9}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="••••"
          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-10 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all tracking-widest"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

