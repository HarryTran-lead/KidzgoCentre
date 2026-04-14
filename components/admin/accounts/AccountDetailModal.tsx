"use client";

import { X, Mail, Phone, Calendar, Shield, Building, User as UserIcon, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { User } from "@/types/admin/user";
import { useRef, useEffect } from "react";
import clsx from "clsx";

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: User | null;
}

export default function AccountDetailModal({ isOpen, onClose, account }: AccountDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !account) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ManagementStaff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Teacher':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Parent':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatOfflineDuration = (seconds?: number) => {
    if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) return "Chưa cập nhật";

    if (seconds < 60) return "vài giây";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header - Giống style modal class */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <UserIcon size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Chi tiết tài khoản
                </h2>
                <p className="text-sm text-red-100">
                  Thông tin chi tiết về tài khoản người dùng
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info - Card Style */}
          <div className="bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {account.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{account.name}</h3>
                <p className="text-sm text-gray-500 mt-1">@{account.username}</p>
                <div className="mt-2">
                  <span className={clsx(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border",
                    getRoleBadgeStyle(account.role)
                  )}>
                    <Shield size={14} />
                    {account.role === 'Admin' && 'Quản trị viên'}
                    {account.role === 'ManagementStaff' && 'Nhân viên quản lý'}
                    {account.role === 'Teacher' && 'Giáo viên'}
                    {account.role === 'Parent' && 'Phụ huynh'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div>
            <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
              Thông tin liên hệ
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Email Card */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                <div className="p-2 rounded-lg bg-red-100">
                  <Mail size={18} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 break-all">{account.email}</p>
                </div>
              </div>

              {/* Phone Card */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                <div className="p-2 rounded-lg bg-red-100">
                  <Phone size={18} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Số điện thoại</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {account.phoneNumber || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              {/* Branch Card */}
              {account.branchName && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow md:col-span-2">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Building size={18} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chi nhánh</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{account.branchName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profiles Section (for Parents) */}
          {account.profiles && account.profiles.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
                Hồ sơ học viên ({account.profiles.length})
              </h4>
              <div className="space-y-3">
                {account.profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{profile.displayName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {profile.profileType === 'Student' ? 'Học viên' : profile.profileType}
                        </p>
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border",
                        profile.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      )}
                    >
                      {profile.isActive ? (
                        <>
                          <CheckCircle size={12} />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} />
                          Bị khóa
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps Section */}
          <div>
            <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
              Thông tin hệ thống
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white md:col-span-2">
                <div className="p-2 rounded-lg bg-red-100">
                  <Clock size={18} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái hoạt động</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border",
                        account.isOnline
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {account.isOnline ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {account.isOnline ? "Đang online" : "Đang offline"}
                    </span>
                    <span className="text-xs text-gray-500">isOnline: {account.isOnline ? "true" : "false"}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p>lastLoginAt: {account.lastLoginAt ? formatDate(account.lastLoginAt) : "Chưa đăng nhập"}</p>
                    <p>lastSeenAt: {account.lastSeenAt ? formatDate(account.lastSeenAt) : "Chưa cập nhật"}</p>
                    <p>offlineDurationSeconds: {formatOfflineDuration(account.offlineDurationSeconds)}</p>
                  </div>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Calendar size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ngày tạo</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" />
                    {formatDate(account.createdAt)}
                  </p>
                </div>
              </div>

              {/* Updated At */}
              {account.updatedAt && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Calendar size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cập nhật lần cuối</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {formatDate(account.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}