"use client";

import { useEffect, useState } from "react";
import { X, User, Mail, Calendar, CheckCircle, XCircle, Shield, Loader2, UserCircle } from "lucide-react";
import { getProfileById } from "@/lib/api/profileService";
import type { Profile } from "@/types/profile";
import { toast } from "@/hooks/use-toast";

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string | null;
}

export default function ProfileDetailModal({
  isOpen,
  onClose,
  profileId
}: ProfileDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (isOpen && profileId) {
      fetchProfileDetail();
    }
  }, [isOpen, profileId]);

  const fetchProfileDetail = async () => {
    if (!profileId) return;
    
    try {
      setLoading(true);
      const response = await getProfileById(profileId);
      
      if ((response.success || response.isSuccess) && response.data) {
        setProfile(response.data);
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể tải thông tin profile",
          variant: "destructive",
        });
        onClose();
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải thông tin profile",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className={`sticky top-0 px-6 py-4 flex items-center justify-between ${
          profile?.profileType === "Parent" 
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-blue-500 to-cyan-500"
        }`}>
          <h2 className="text-xl font-bold text-white">
            Chi tiết Profile
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Type Badge */}
              <div className="flex items-center justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  profile.profileType === "Parent"
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-2 border-emerald-200"
                    : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-2 border-blue-200"
                }`}>
                  {profile.profileType === "Parent" ? <Shield size={18} /> : <UserCircle size={18} />}
                  {profile.profileType}
                </span>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Thông tin cơ bản
                </h3>

                <div className="grid gap-4">
                  {/* Display Name */}
                  <InfoRow 
                    icon={<User size={18} />}
                    label="Tên hiển thị"
                    value={profile.displayName}
                  />

                  {/* User Email */}
                  {profile.userEmail && (
                    <InfoRow 
                      icon={<Mail size={18} />}
                      label="Email"
                      value={profile.userEmail}
                    />
                  )}

                  {/* User ID */}
                  <InfoRow 
                    icon={<User size={18} />}
                    label="User ID"
                    value={profile.userId}
                    mono
                  />

                  {/* Profile ID */}
                  <InfoRow 
                    icon={<User size={18} />}
                    label="Profile ID"
                    value={profile.id}
                    mono
                  />

                  {/* Status */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-600 mt-0.5">
                      {profile.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Trạng thái</div>
                      <div className="mt-1">
                        {profile.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            <CheckCircle size={12} />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                            <XCircle size={12} />
                            Không hoạt động
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Created At */}
                  <InfoRow 
                    icon={<Calendar size={18} />}
                    label="Ngày tạo"
                    value={formatDate(profile.createdAt)}
                  />

                  {/* Updated At */}
                  <InfoRow 
                    icon={<Calendar size={18} />}
                    label="Cập nhật lần cuối"
                    value={formatDate(profile.updatedAt)}
                  />
                </div>
              </div>

              {/* Additional Info */}
              {profile.profileType === "Parent" && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                  <p className="text-sm text-emerald-800">
                    <strong>Lưu ý:</strong> Profile Parent có tài khoản đăng nhập và có thể truy cập hệ thống. 
                    Có thể link với nhiều Student profiles.
                  </p>
                </div>
              )}

              {profile.profileType === "Student" && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Profile Student sử dụng User ID của Parent để quản lý. 
                    Student không có tài khoản đăng nhập riêng.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy thông tin profile
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function InfoRow({ 
  icon, 
  label, 
  value,
  mono = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-600 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className={`mt-1 text-gray-900 break-all ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
