"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserRound,
  Shield,
  LogOut,
  Save,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { getParentAccount, updateParentAccount } from "@/lib/api/parentPortalService";
import {
  verifyParentPin,
  changePin,
  requestPinReset,
  requestPinResetZaloOtp,
  verifyPinResetZaloOtp,
  resetPin,
  getUserMe,
  updateUserMe,
} from "@/lib/api/authService";
import { uploadAvatar, isUploadSuccess } from "@/lib/api/fileService";
import { buildFileUrl } from "@/constants/apiURL";

type TabType = "profile" | "password" | "pin";

type PinMode = "idle" | "set" | "change" | "forgot-email" | "forgot-zalo" | "otp-verify" | "reset";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
    address: "",
    childrenCount: 0,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // PIN state
  const [pinMode, setPinMode] = useState<PinMode>("idle");
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [parentProfileId, setParentProfileId] = useState("");
  const [pinForm, setPinForm] = useState({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
  const [otpForm, setOtpForm] = useState({ challengeId: "", otp: "", resetToken: "" });
  const [pinMsg, setPinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        // Load parent account
        const accountRes: any = await getParentAccount();
        if (!alive) return;
        const raw = accountRes?.data?.data ?? accountRes?.data ?? {};
        setProfileData({
          name: raw.name ?? raw.fullName ?? "",
          phone: raw.phone ?? raw.phoneNumber ?? "",
          email: raw.email ?? "",
          birthDate: raw.birthDate ?? raw.dateOfBirth ?? "",
          address: raw.address ?? "",
          childrenCount: raw.childrenCount ?? raw.numberOfChildren ?? 0,
        });

        // Load user info for avatar & pin status
        const meRes: any = await getUserMe();
        const meData = meRes?.data?.data ?? meRes?.data ?? meRes ?? {};
        if (meData.avatarUrl) setAvatarUrl(meData.avatarUrl);

        // Check PIN status from profiles
        const profiles = meData.profiles ?? [];
        const parentProfile = profiles.find((p: any) => p.profileType === "Parent");
        if (parentProfile) {
          setParentProfileId(parentProfile.id);
          setHasPinSetup(!!parentProfile.hasPinSetup);
        }
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, []);

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(file);
      if (isUploadSuccess(result)) {
        setAvatarUrl(result.url);
        // Also update user profile with new avatar
        await updateUserMe({ avatarUrl: result.url } as any).catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // PIN handlers
  const handleSetPin = async () => {
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
      await verifyParentPin({ profileId: parentProfileId, pin: pinForm.pin });
      setHasPinSetup(true);
      setPinMode("idle");
      setPinMsg({ type: "success", text: "Đã thiết lập mã PIN thành công" });
      setPinForm({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? "Có lỗi xảy ra";
      setPinMsg({ type: "error", text: msg });
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!pinForm.currentPin || !pinForm.newPin) {
      setPinMsg({ type: "error", text: "Vui lòng điền đầy đủ PIN hiện tại và PIN mới" });
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinMsg({ type: "error", text: "PIN mới không khớp" });
      return;
    }
    if (!/^\d+$/.test(pinForm.newPin)) {
      setPinMsg({ type: "error", text: "PIN chỉ được chứa số" });
      return;
    }
    setPinLoading(true);
    setPinMsg(null);
    try {
      await changePin({ currentPin: pinForm.currentPin, newPin: pinForm.newPin });
      setPinMode("idle");
      setPinMsg({ type: "success", text: "Đã đổi mã PIN thành công" });
      setPinForm({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? "Có lỗi xảy ra";
      setPinMsg({ type: "error", text: msg });
    } finally {
      setPinLoading(false);
    }
  };

  const handleForgotPinEmail = async () => {
    setPinLoading(true);
    setPinMsg(null);
    try {
      await requestPinReset({ profileId: parentProfileId });
      setPinMsg({ type: "success", text: "Đã gửi link đặt lại PIN qua email. Vui lòng kiểm tra hộp thư." });
      setPinMode("idle");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? "Có lỗi xảy ra";
      setPinMsg({ type: "error", text: msg });
    } finally {
      setPinLoading(false);
    }
  };

  const handleForgotPinZalo = async () => {
    setPinLoading(true);
    setPinMsg(null);
    try {
      const res: any = await requestPinResetZaloOtp({ profileId: parentProfileId });
      const data = res?.data?.data ?? res?.data ?? {};
      if (data.challengeId) {
        setOtpForm({ challengeId: data.challengeId, otp: "", resetToken: "" });
        setPinMode("otp-verify");
        setPinMsg({ type: "success", text: "Đã gửi mã OTP qua Zalo. Vui lòng kiểm tra tin nhắn." });
      } else {
        setPinMsg({ type: "error", text: "Không nhận được challenge từ server" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? "Có lỗi xảy ra";
      setPinMsg({ type: "error", text: msg });
    } finally {
      setPinLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpForm.otp || otpForm.otp.length !== 6) {
      setPinMsg({ type: "error", text: "OTP phải đúng 6 chữ số" });
      return;
    }
    setPinLoading(true);
    setPinMsg(null);
    try {
      const res: any = await verifyPinResetZaloOtp({
        challengeId: otpForm.challengeId,
        otp: otpForm.otp,
      });
      const data = res?.data?.data ?? res?.data ?? {};
      if (data.resetToken) {
        setOtpForm((prev) => ({ ...prev, resetToken: data.resetToken }));
        setPinMode("reset");
        setPinMsg({ type: "success", text: "Xác minh OTP thành công. Vui lòng nhập PIN mới." });
      } else {
        setPinMsg({ type: "error", text: "OTP không hợp lệ hoặc đã hết hạn" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? "OTP không hợp lệ hoặc đã hết hạn";
      setPinMsg({ type: "error", text: msg });
    } finally {
      setPinLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!pinForm.newPin || pinForm.newPin !== pinForm.confirmPin) {
      setPinMsg({ type: "error", text: "PIN mới không khớp" });
      return;
    }
    if (!/^\d+$/.test(pinForm.newPin)) {
      setPinMsg({ type: "error", text: "PIN chỉ được chứa số" });
      return;
    }
    setPinLoading(true);
    setPinMsg(null);
    try {
      await resetPin({ token: otpForm.resetToken, newPin: pinForm.newPin });
      setPinMode("idle");
      setPinMsg({ type: "success", text: "Đã đặt lại mã PIN thành công" });
      setPinForm({ pin: "", currentPin: "", newPin: "", confirmPin: "" });
      setOtpForm({ challengeId: "", otp: "", resetToken: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? "Có lỗi xảy ra";
      setPinMsg({ type: "error", text: msg });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      {/* Header – giống style admin accounts */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <UserRound size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Tài khoản phụ huynh
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý thông tin cá nhân và bảo mật tài khoản của phụ huynh với giao diện hiện đại.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card – bo góc, gradient giống admin */}
      <div className="bg-gradient-to-br from-white via-white to-red-50/30 rounded-2xl border border-red-200 overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
              icon={<UserRound size={16} />}
              color="red"
            >
              Thông tin phụ huynh
            </TabButton>
            <TabButton
              active={activeTab === "pin"}
              onClick={() => { setActiveTab("pin"); setPinMsg(null); }}
              icon={<KeyRound size={16} />}
              color="red"
            >
              Mã PIN
            </TabButton>
            <TabButton
              active={activeTab === "password"}
              onClick={() => setActiveTab("password")}
              icon={<Shield size={16} />}
              color="red"
            >
              Bảo mật / Mật khẩu
            </TabButton>
          </div>
        </div>

        <div className="border-t border-red-200 mt-4" />

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-8">
              {/* Profile header – copy style từ admin accounts */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/10 to-red-700/10 p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-700/20 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-red-700/20 rounded-full translate-y-12 -translate-x-12" />

                <div className="relative flex flex-col md:flex-row items-start gap-8">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-r from-red-600 to-red-700">
                      {avatarUrl ? (
                        <img
                          src={buildFileUrl(avatarUrl)}
                          alt="Parent"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                          {profileData.name?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Camera size={16} />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white shadow-md flex items-center gap-2 text-xs text-red-700 mt-4">
                      <Heart size={12} />
                      {profileData.childrenCount} con đang theo học
                    </div>
                  </div>

                  {/* Basic info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                          {profileData.name}
                        </h2>
                        <div className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs md:text-sm font-medium rounded-full">
                          Phụ huynh Rex
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-gray-700">
                        Đồng hành cùng con trong hành trình học tập tại Rex Centre.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoRow icon={<Mail size={16} />} label="Email" value={profileData.email} />
                      <InfoRow icon={<Phone size={16} />} label="Điện thoại" value={profileData.phone} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoRow
                        icon={<Calendar size={16} />}
                        label="Năm sinh"
                        value={new Date(profileData.birthDate).getFullYear().toString()}
                      />
                      <InfoRow icon={<MapPin size={16} />} label="Khu vực" value="TP. Hồ Chí Minh" />
                    </div>
                  </div>

                  {/* Edit buttons – giống style admin */}
                  <div className="absolute top-4 right-0 md:right-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all shadow-sm text-sm"
                        >
                          Huỷ
                        </button>
                        <button
                          onClick={() => {
                            updateParentAccount(profileData).then(() => setIsEditing(false)).catch(() => {});
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg transition-all shadow-sm flex items-center gap-2 text-sm"
                        >
                          <Save size={16} />
                          Lưu thay đổi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all shadow-sm text-sm"
                      >
                        Chỉnh sửa thông tin
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail form – tone giống teacher */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <LabeledInput
                    label="Họ và tên"
                    value={profileData.name}
                    disabled={!isEditing}
                    icon={<UserRound size={16} />}
                    onChange={(value) => setProfileData({ ...profileData, name: value })}
                  />
                  <LabeledInput
                    label="Số điện thoại"
                    value={profileData.phone}
                    disabled={!isEditing}
                    icon={<Phone size={16} />}
                    onChange={(value) => setProfileData({ ...profileData, phone: value })}
                  />
                  <LabeledInput
                    label="Email"
                    value={profileData.email}
                    disabled={!isEditing}
                    icon={<Mail size={16} />}
                    onChange={(value) => setProfileData({ ...profileData, email: value })}
                  />
                </div>

                <div className="space-y-4">
                  <LabeledInput
                    label="Ngày sinh"
                    type="date"
                    value={profileData.birthDate}
                    disabled={!isEditing}
                    icon={<Calendar size={16} />}
                    onChange={(value) => setProfileData({ ...profileData, birthDate: value })}
                  />
                  <LabeledInput
                    label="Địa chỉ"
                    value={profileData.address}
                    disabled={!isEditing}
                    icon={<MapPin size={16} />}
                    onChange={(value) => setProfileData({ ...profileData, address: value })}
                  />
                  <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 text-sm text-gray-700">
                    <div className="font-semibold mb-1">Gợi ý</div>
                    <p>
                      Cập nhật đầy đủ thông tin giúp nhà trường liên hệ nhanh hơn khi có thông báo quan
                      trọng về lớp học của con.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-8">
              {/* Security card – giống style admin accounts */}
              <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-lg">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Đổi mật khẩu</h3>
                    <p className="text-sm text-gray-600">
                      Sử dụng mật khẩu mạnh để bảo vệ tài khoản phụ huynh tốt hơn.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <PasswordInput
                    label="Mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={(value) =>
                      setPasswordForm({ ...passwordForm, currentPassword: value })
                    }
                  />
                  <PasswordInput
                    label="Mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
                  />
                  <PasswordInput
                    label="Xác nhận mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={(value) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: value })
                    }
                  />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                      }
                      className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all shadow-sm text-sm"
                    >
                      <Lock size={16} />
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </div>
              </div>

              {/* Logout card – style gần giống Stats/Security của teacher */}
              <div className="bg-gradient-to-br from-white to-amber-50/40 rounded-2xl border border-amber-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <LogOut size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Đăng xuất tài khoản</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Đăng xuất khỏi tài khoản phụ huynh trên thiết bị này. Bạn có thể đăng nhập lại bất
                        cứ lúc nào.
                      </p>
                      <p className="text-xs text-amber-700 mt-2">
                        Nên đăng xuất sau khi sử dụng trên máy tính công cộng hoặc thiết bị lạ.
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white hover:shadow-lg transition-all text-sm">
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pin" && (
            <div className="space-y-6">
              {/* PIN status card */}
              <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-lg">
                    <KeyRound size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Quản lý mã PIN</h3>
                    <p className="text-sm text-gray-600">
                      Mã PIN dùng để xác thực khi phụ huynh thực hiện các thao tác quan trọng.
                    </p>
                  </div>
                  <div className="ml-auto">
                    {hasPinSetup ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                        <CheckCircle2 size={14} /> Đã thiết lập
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                        <AlertCircle size={14} /> Chưa thiết lập
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                {pinMsg && (
                  <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                    pinMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}>
                    {pinMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {pinMsg.text}
                  </div>
                )}

                {/* Idle state - show action buttons */}
                {pinMode === "idle" && (
                  <div className="space-y-3">
                    {!hasPinSetup ? (
                      <button
                        onClick={() => { setPinMode("set"); setPinMsg(null); }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-left"
                      >
                        <div className="p-2 bg-red-100 rounded-lg text-red-600"><KeyRound size={18} /></div>
                        <div>
                          <div className="font-medium text-gray-900">Thiết lập mã PIN</div>
                          <div className="text-xs text-gray-500">Tạo mã PIN lần đầu để bảo vệ tài khoản</div>
                        </div>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => { setPinMode("change"); setPinMsg(null); }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-left"
                        >
                          <div className="p-2 bg-red-100 rounded-lg text-red-600"><Lock size={18} /></div>
                          <div>
                            <div className="font-medium text-gray-900">Đổi mã PIN</div>
                            <div className="text-xs text-gray-500">Đổi PIN hiện tại sang PIN mới</div>
                          </div>
                        </button>
                        <button
                          onClick={() => { setPinMode("forgot-email"); setPinMsg(null); }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-amber-200 hover:bg-amber-50 transition-all text-left"
                        >
                          <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Mail size={18} /></div>
                          <div>
                            <div className="font-medium text-gray-900">Quên PIN – Khôi phục qua Email</div>
                            <div className="text-xs text-gray-500">Nhận link đặt lại PIN qua email đã đăng ký</div>
                          </div>
                        </button>
                        <button
                          onClick={() => { setPinMode("forgot-zalo"); setPinMsg(null); }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-blue-200 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Smartphone size={18} /></div>
                          <div>
                            <div className="font-medium text-gray-900">Quên PIN – Khôi phục qua Zalo OTP</div>
                            <div className="text-xs text-gray-500">Nhận mã OTP qua Zalo để xác minh và đặt lại PIN</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Set PIN (first time) */}
                {pinMode === "set" && (
                  <div className="space-y-4">
                    <PinInput label="Nhập mã PIN mới" value={pinForm.pin} onChange={(v) => setPinForm({ ...pinForm, pin: v })} />
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPinMode("idle"); setPinMsg(null); }} className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm">Hủy</button>
                      <button onClick={handleSetPin} disabled={pinLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                        Thiết lập PIN
                      </button>
                    </div>
                  </div>
                )}

                {/* Change PIN */}
                {pinMode === "change" && (
                  <div className="space-y-4">
                    <PinInput label="PIN hiện tại" value={pinForm.currentPin} onChange={(v) => setPinForm({ ...pinForm, currentPin: v })} />
                    <PinInput label="PIN mới" value={pinForm.newPin} onChange={(v) => setPinForm({ ...pinForm, newPin: v })} />
                    <PinInput label="Nhập lại PIN mới" value={pinForm.confirmPin} onChange={(v) => setPinForm({ ...pinForm, confirmPin: v })} />
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPinMode("idle"); setPinMsg(null); }} className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm">Hủy</button>
                      <button onClick={handleChangePin} disabled={pinLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                        Đổi PIN
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot PIN – Email */}
                {pinMode === "forgot-email" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                      <p>Một link khôi phục PIN sẽ được gửi đến email <strong>{profileData.email || "(chưa cập nhật)"}</strong>.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPinMode("idle"); setPinMsg(null); }} className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm">Hủy</button>
                      <button onClick={handleForgotPinEmail} disabled={pinLoading || !profileData.email} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        Gửi link khôi phục
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot PIN – Zalo OTP */}
                {pinMode === "forgot-zalo" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                      <p>Mã OTP sẽ được gửi qua tin nhắn Zalo OA. Vui lòng kiểm tra Zalo sau khi bấm gửi.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPinMode("idle"); setPinMsg(null); }} className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm">Hủy</button>
                      <button onClick={handleForgotPinZalo} disabled={pinLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                        Gửi OTP qua Zalo
                      </button>
                    </div>
                  </div>
                )}

                {/* OTP Verify */}
                {pinMode === "otp-verify" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                      <p>Nhập mã OTP 6 chữ số đã nhận qua Zalo.</p>
                    </div>
                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-gray-900">Mã OTP</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpForm.otp}
                        onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        placeholder="000000"
                        className="w-full max-w-xs rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono text-gray-900 outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPinMode("idle"); setPinMsg(null); }} className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm">Hủy</button>
                      <button onClick={handleVerifyOtp} disabled={pinLoading || otpForm.otp.length !== 6} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Xác minh OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* Reset PIN (after OTP verified or email token) */}
                {pinMode === "reset" && (
                  <div className="space-y-4">
                    <PinInput label="PIN mới" value={pinForm.newPin} onChange={(v) => setPinForm({ ...pinForm, newPin: v })} />
                    <PinInput label="Nhập lại PIN mới" value={pinForm.confirmPin} onChange={(v) => setPinForm({ ...pinForm, confirmPin: v })} />
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPinMode("idle"); setPinMsg(null); }} className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-700 hover:bg-red-50 transition-all text-sm">Hủy</button>
                      <button onClick={handleResetPin} disabled={pinLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                        {pinLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                        Đặt lại PIN
                      </button>
                    </div>
                  </div>
                )}
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
  children,
  icon,
  onClick,
  color = "red",
}: {
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  color?: "red";
}) {
  const colorClasses = {
    red: "from-red-600 to-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 group cursor-pointer ${
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
          : "bg-white border border-red-200 text-gray-700 hover:bg-red-50"
      }`}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
      {children}
      {!active && (
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity`}
        />
      )}
    </button>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-red-100">
      <div className="p-2 bg-red-100 rounded-lg text-red-600">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  placeholder,
  type = "text",
  disabled = false,
  icon,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "date";
  disabled?: boolean;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-gray-900">{label}</div>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full rounded-xl border border-red-200 bg-white/60 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all ${
            icon ? "pl-10" : ""
          } ${disabled ? "bg-transparent cursor-not-allowed" : ""}`}
        />
      </div>
    </label>
  );
}

function PasswordInput({
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
      <div className="mb-2 text-sm font-medium text-gray-900">{label}</div>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Lock size={16} className="text-gray-400" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-red-200 bg-white/60 pl-10 pr-10 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

function PinInput({
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
      <div className="mb-2 text-sm font-medium text-gray-900">{label}</div>
      <div className="relative max-w-xs">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <KeyRound size={16} className="text-gray-400" />
        </div>
        <input
          type={show ? "text" : "password"}
          inputMode="numeric"
          maxLength={9}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="••••"
          className="w-full rounded-xl border border-red-200 bg-white/60 pl-10 pr-10 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all tracking-widest"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}
