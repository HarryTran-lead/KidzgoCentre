"use client";

import { useState, useEffect, useRef } from "react";
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
import { getUserMe, updateUserMe, changePassword, uploadAvatar } from "@/lib/api/authService";
import type { UserMeResponse } from "@/types/auth";
import { toast } from "@/hooks/use-toast";

type Tab = "info" | "password" | "preferences";

const ROLE_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Admin: { label: "Quản trị viên", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <ShieldCheck size={12} /> },
  Staff_Manager: { label: "Quản lý", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <User size={12} /> },
  Staff_Accountant: { label: "Kế toán", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Award size={12} /> },
  Teacher: { label: "Giáo viên", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Sparkles size={12} /> },
  Student: { label: "Học viên", color: "bg-sky-100 text-sky-700 border-sky-200", icon: <UserRound size={12} /> },
  Parent: { label: "Phụ huynh", color: "bg-rose-100 text-rose-700 border-rose-200", icon: <Users size={12} /> },
};

export default function UserProfileWorkspace() {
  const [tab, setTab] = useState<Tab>("info");
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Edit info state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserMe();
        if ((res.success || res.isSuccess) && res.data) {
          setUser(res.data);
          setFullName(res.data.fullName ?? "");
          setEmail(res.data.email ?? "");
          setPhoneNumber(res.data.phoneNumber ?? "");
        } else {
          toast({ title: "Lỗi", description: res.message || "Không thể tải thông tin", variant: "destructive" });
        }
      } catch {
        toast({ title: "Lỗi", description: "Có lỗi xảy ra khi tải thông tin", variant: "destructive" });
      } finally {
        setIsLoading(false);
        setIsPageLoaded(true);
      }
    };
    fetchUser();
  }, []);

  const handleSaveInfo = async () => {
    if (!fullName.trim()) {
      toast({ title: "Lỗi", description: "Họ tên không được để trống", variant: "destructive" });
      return;
    }
    try {
      setIsSavingInfo(true);
      const res = await updateUserMe({ 
        fullName: fullName.trim(), 
        email: email.trim(), 
        phoneNumber: phoneNumber.trim(),

      });
      if (res.success || res.isSuccess) {
        if (res.data) setUser(res.data);
        toast({ title: "Thành công", description: "Đã cập nhật thông tin cá nhân", variant: "success" });
      } else {
        toast({ title: "Lỗi", description: res.message || "Không thể cập nhật thông tin", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra khi cập nhật", variant: "destructive" });
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
      const res = await changePassword({ currentPassword, newPassword });
      if (res.success || res.isSuccess) {
        toast({ title: "Thành công", description: "Đã đổi mật khẩu thành công", variant: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: "Lỗi", description: res.message || "Không thể đổi mật khẩu", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra khi đổi mật khẩu", variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Lỗi", description: "Vui lòng chọn file ảnh", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Kích thước ảnh không được vượt quá 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingAvatar(true);
      const res = await uploadAvatar(file);
      if (res.success || res.isSuccess) {
        toast({ title: "Thành công", description: "Đã cập nhật ảnh đại diện", variant: "success" });
        const userRes = await getUserMe();
        if ((userRes.success || userRes.isSuccess) && userRes.data) {
          setUser(userRes.data);
        }
      } else {
        toast({ title: "Lỗi", description: res.message || "Không thể cập nhật ảnh đại diện", variant: "destructive" });
        setAvatarPreview(null);
      }
    } catch {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra khi cập nhật ảnh đại diện", variant: "destructive" });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
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

  const avatarLetter = (user?.fullName ?? user?.userName ?? "?")[0]?.toUpperCase() ?? "?";
  const roleInfo = ROLE_LABEL[user?.role ?? ""] ?? { label: user?.role ?? "", color: "bg-gray-100 text-gray-700 border-gray-200", icon: null };

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
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                <span className="text-xs text-gray-500">Đã kết nối</span>
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
                      ) : user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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

                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user?.fullName || user?.userName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
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

                {/* Stats */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">1</p>
                      <p className="text-xs text-gray-500">Khóa học</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Chứng chỉ</p>
                    </div>
                  </div>
                </div>

                {/* Account meta */}
                {user?.userName && (
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
              <TabButton
                active={tab === "preferences"}
                onClick={() => setTab("preferences")}
                icon={<Bell size={16} />}
                label="Cài đặt"
              />
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

            {tab === "preferences" && (
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
                  <button className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden">
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

