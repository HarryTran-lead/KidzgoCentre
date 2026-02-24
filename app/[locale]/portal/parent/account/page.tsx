"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/lightswind/button";

type TabType = "profile" | "password";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Nguyễn Văn A",
    phone: "0912 345 678",
    email: "parent@email.com",
    birthDate: "1985-01-01",
    address: "123 Đường ABC, Quận 1, TP. HCM",
    childrenCount: 2,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
                      <img
                        src="/image/avatar-placeholder.png"
                        alt="Parent"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white shadow-md flex items-center gap-2 text-xs text-red-700">
                      <Heart size={12} />
                      {profileData.childrenCount} con đang theo học
                    </div>
                  </div>

                  {/* Basic info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                          {profileData.fullName}
                        </h2>
                        <div className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs md:text-sm font-medium rounded-full">
                          Phụ huynh Kidzgo
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-gray-700">
                        Đồng hành cùng con trong hành trình học tập tại Kidzgo Centre.
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
                          onClick={() => setIsEditing(false)}
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
                    value={profileData.fullName}
                    disabled={!isEditing}
                    icon={<UserRound size={16} />}
                    onChange={(value) => setProfileData({ ...profileData, fullName: value })}
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
