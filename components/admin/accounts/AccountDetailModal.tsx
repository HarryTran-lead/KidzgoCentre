"use client";

import { X, Mail, Phone, Calendar, Shield, Building, User as UserIcon } from "lucide-react";
import type { User } from "@/types/admin/user";

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: User | null;
}

export default function AccountDetailModal({ isOpen, onClose, account }: AccountDetailModalProps) {
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

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Chi tiết tài khoản</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-2xl font-bold">
                {account.username}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{account.username}</h3>
                <p className="text-sm text-gray-500">ID: {account.id}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200">
              <Shield size={16} className="text-pink-600" />
              <span className="text-sm font-medium text-pink-600">{account.role}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Mail size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{account.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Phone size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="text-sm font-medium text-gray-900">
                    {account.branchContactPhone || 'Chưa có'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50">
                  <UserIcon size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-sm font-medium text-gray-900">{account.username}</p>
                </div>
              </div>

              {account.branchName && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-pink-50">
                    <Building size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chi nhánh</p>
                    <p className="text-sm font-medium text-gray-900">{account.branchName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profiles (for Parents) */}
          {account.profiles && account.profiles.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Profiles ({account.profiles.length})
              </h4>
              <div className="space-y-2">
                {account.profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                        {profile.displayName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{profile.displayName}</p>
                        <p className="text-xs text-gray-500">{profile.profileType}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        profile.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Calendar size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(account.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Calendar size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cập nhật cuối</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(account.updatedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Shield size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      account.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {account.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
