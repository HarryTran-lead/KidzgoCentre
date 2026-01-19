'use client';

import { useState, useEffect } from 'react';
import { 
  User, Mail, Building2, Shield, Calendar, 
  LogOut, ChevronRight, Loader2, Settings,
  Clock, CheckCircle, XCircle
} from 'lucide-react';
import { getUserMe, logout } from '@/lib/api/authService';
import type { UserMeResponse } from '@/types/auth';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await getUserMe();
        
        if ((response.success || response.isSuccess) && response.data) {
          setUser(response.data);
        } else {
          toast({
            title: "Lỗi",
            description: response.message || "Không thể tải thông tin người dùng",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi tải thông tin người dùng",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await logout();
      
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Đăng xuất thành công",
          variant: "success",
        });
        
        // Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Redirect to home
        router.push('/');
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể đăng xuất",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi đăng xuất",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy thông tin người dùng</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'Admin': 'bg-red-500 text-white',
      'Manager': 'bg-purple-500 text-white',
      'Teacher': 'bg-blue-500 text-white',
      'Parent': 'bg-green-500 text-white',
    };
    return colors[role.toUpperCase()] || '';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'Admin': 'QUẢN TRỊ VIÊN',
      'Manager': 'QUẢN LÝ',
      'Teacher': 'GIÁO VIÊN',
      'Parent': 'PHỤ HUYNH',
    };
    return labels[role.toUpperCase()] || role;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-pink-400 to-rose-500 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                  {user.fullName}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{user.fullName}</h2>
                  <p className="text-pink-100 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-8">
            <div className="grid gap-6">
              {/* Status */}
              <InfoItem
                icon={<CheckCircle className="w-5 h-5" />}
                label="Trạng thái tài khoản"
                value={
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    {user.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                }
              />

              {/* Username */}
              {user.userName && (
                <InfoItem
                  icon={<User className="w-5 h-5" />}
                  label="Tên đăng nhập"
                  value={user.userName}
                />
              )}

              {/* Branch */}
              {user.branchId && user.branchName && (
                <InfoItem
                  icon={<Building2 className="w-5 h-5" />}
                  label="Chi nhánh"
                  value={user.branchName}
                />
              )}

              {/* Role */}
              <InfoItem
                icon={<Shield className="w-5 h-5" />}
                label="Vai trò"
                value={getRoleLabel(user.role)}
              />

              {/* Created Date */}
              <InfoItem
                icon={<Calendar className="w-5 h-5" />}
                label="Ngày tạo tài khoản"
                value={new Date(user.createdAt).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              />

              {/* Updated Date */}
              {user.updatedAt && (
                <InfoItem
                  icon={<Clock className="w-5 h-5" />}
                  label="Cập nhật lần cuối"
                  value={new Date(user.updatedAt).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Personal Info Section */}
          {/* <button className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <User className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Hồ sơ cá nhân</h3>
                  <p className="text-sm text-gray-600">Xem và cập nhật thông tin</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-600 transition-colors" />
            </div>
          </button> */}

          {/* Settings */}
          {/* <button className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cài đặt</h3>
                  <p className="text-sm text-gray-600">Tùy chỉnh tài khoản</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </button> */}
        </div>

        {/* Permissions Section (if available) */}
        {user.permissions && user.permissions.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-600" />
              Quyền hạn
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((permission, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium border border-pink-200"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Component
function InfoItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="text-pink-600 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
        <div className="text-base text-gray-900 font-medium">{value}</div>
      </div>
    </div>
  );
}
