"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserRound,
  Mail,
  Phone,
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
} from "lucide-react";
import { getUserMe, updateUserMe, changePassword } from "@/lib/api/authService";
import { uploadAvatar, isUploadSuccess, type UploadFileError } from "@/lib/api/fileService";
import type { UserMeResponse } from "@/types/auth";
import { toast } from "@/hooks/use-toast";

type Tab = "info" | "password";

const ROLE_LABEL: Record<string, string> = {
  Admin: "Quản trị viên",
  Staff_Manager: "Quản lý",
  Staff_Accountant: "Kế toán",
  Teacher: "Giáo viên",
  Student: "Học viên",
  Parent: "Phụ huynh",
};

export default function UserProfileWorkspace() {
  const [tab, setTab] = useState<Tab>("info");
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserMe();
        if ((res.success || res.isSuccess) && res.data) {
          setUser(res.data);
          setFullName(res.data.fullName ?? "");
          setEmail(res.data.email ?? "");
          setPhoneNumber(res.data.phoneNumber ?? "");
          if (res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(file);
      if (isUploadSuccess(result)) {
        setAvatarUrl(result.url);
        toast({ title: "Thành công", description: "Đã cập nhật ảnh đại diện", variant: "success" });
      } else {
        const msg = (result as UploadFileError).detail ?? (result as UploadFileError).error ?? "Không thể tải ảnh lên";
        toast({ title: "Lỗi", description: msg, variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra khi tải ảnh", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSaveInfo = async () => {
    if (!fullName.trim()) {
      toast({ title: "Lỗi", description: "Họ tên không được để trống", variant: "destructive" });
      return;
    }
    try {
      setIsSavingInfo(true);
      const res = await updateUserMe({ fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim() });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const avatarLetter = (user?.fullName ?? user?.userName ?? "?")[0]?.toUpperCase() ?? "?";
  const roleLabel = ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <UserRound size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Quản lý thông tin cá nhân và bảo mật tài khoản
            </p>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* LEFT: Profile card (sticky) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
            {/* Banner */}
            <div className="h-28 bg-gradient-to-r from-red-600 to-red-700" />
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="relative w-20 h-20 shrink-0 group">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-3xl font-bold select-none">
                      {avatarLetter}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                    title="Đổi ảnh đại diện"
                  >
                    {avatarUploading
                      ? <Loader2 size={20} className="text-white animate-spin" />
                      : <Camera size={20} className="text-white" />}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-0.5">
                {user?.fullName || user?.userName}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p>

              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <User size={11} />
                  {roleLabel}
                </span>
                {user?.branchName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <Building2 size={11} />
                    {user.branchName}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  user?.isActive
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {user?.isActive
                    ? <><CheckCircle size={11} /> Đang hoạt động</>
                    : <><XCircle size={11} /> Không hoạt động</>
                  }
                </span>
              </div>

              {/* Account meta */}
              {user?.userName && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Tên đăng nhập</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{user.userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ngày tạo tài khoản</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </p>
                  </div>
                  {user.phoneNumber && (
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{user.phoneNumber}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Tabs + Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <TabButton
              active={tab === "info"}
              onClick={() => setTab("info")}
              icon={<UserRound size={14} />}
              label="Thông tin cá nhân"
            />
            <TabButton
              active={tab === "password"}
              onClick={() => setTab("password")}
              icon={<KeyRound size={14} />}
              label="Đổi mật khẩu"
            />
          </div>

          {/* Tab panels */}
          {tab === "info" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="p-2 bg-red-50 rounded-lg">
                  <UserRound size={16} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Thông tin cá nhân</h3>
                  <p className="text-xs text-gray-500">Cập nhật tên, email và số điện thoại</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User size={14} className="text-red-600" />
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail size={14} className="text-red-600" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone size={14} className="text-red-600" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveInfo}
                  disabled={isSavingInfo}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingInfo ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {tab === "password" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="p-2 bg-red-50 rounded-lg">
                  <ShieldCheck size={16} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Bảo mật tài khoản</h3>
                  <p className="text-xs text-gray-500">Thay đổi mật khẩu đăng nhập</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <PasswordField
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    show={showCurrent}
                    onChange={setCurrentPassword}
                    onToggle={() => setShowCurrent((v) => !v)}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div>
                  <PasswordField
                    label="Mật khẩu mới"
                    value={newPassword}
                    show={showNew}
                    onChange={setNewPassword}
                    onToggle={() => setShowNew((v) => !v)}
                    placeholder="Ít nhất 6 ký tự"
                  />
                </div>
                <div>
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

              {/* Password tip */}
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700 flex items-start gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-red-600" />
                <span>Mật khẩu mạnh nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isSavingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}
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
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
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
        <Lock size={14} className="text-red-600" />
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-11 rounded-xl border border-pink-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition placeholder-gray-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition cursor-pointer"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
