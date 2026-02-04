"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Link as LinkIcon, Search, 
  Loader2, UserCircle, Mail, Calendar, 
  CheckCircle, XCircle, Edit, Trash2, Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getAllStudents, 
  createParentAccount, 
  createStudentProfile,
  linkStudentToParent,
  deleteProfile
} from "@/lib/api/profileService";
import { createUser } from "@/lib/api/userService";
import type { CreateUserRequest } from "@/types/admin/user";
import type { CreateParentAccountRequest, CreateStudentProfileRequest } from "@/types/profile";
import CreateParentAccountModal from "@/components/admin/profile/CreateParentAccountModal";
import CreateStudentProfileModal from "@/components/admin/profile/CreateStudentProfileModal";
import LinkStudentToParentModal from "@/components/admin/profile/LinkStudentToParentModal";

interface ProfileItem {
  id: string;
  userId: string;
  userEmail: string;
  profileType: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileManagementPage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Parent" | "Student">("all");
  
  // Modal states
  const [showCreateParentModal, setShowCreateParentModal] = useState(false);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParentForLink, setSelectedParentForLink] = useState<{ id: string; name: string } | null>(null);

  // Fetch all profiles
  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      const response = await getAllStudents({
        pageSize: 100,
      });

      if (response.data?.items) {
        setProfiles(response.data.items as ProfileItem[]);
        setFilteredProfiles(response.data.items as ProfileItem[]);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Filter profiles
  useEffect(() => {
    let filtered = profiles;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(p => p.profileType === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProfiles(filtered);
  }, [profiles, filterType, searchTerm]);

  // Handle create parent account
  const handleCreateParent = async (
    userData: CreateUserRequest, 
    profileData: CreateParentAccountRequest
  ) => {
    try {
      // Step 1: Create User account
      const userResponse = await createUser(userData);
      
      if (!userResponse.data?.id) {
        throw new Error("Failed to create user account");
      }

      // Step 2: Create Parent profile
      profileData.userId = userResponse.data.id;
      await createParentAccount(profileData);

      toast({
        title: "Thành công",
        description: "Tạo tài khoản Parent thành công",
        variant: "default",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error creating parent:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài khoản Parent",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle create student profile
  const handleCreateStudent = async (profileData: CreateStudentProfileRequest) => {
    try {
      await createStudentProfile(profileData);

      toast({
        title: "Thành công",
        description: "Tạo profile Student thành công",
        variant: "default",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error creating student:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo profile Student",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle link student to parent
  const handleLinkProfiles = async (data: any) => {
    try {
      await linkStudentToParent(data);

      toast({
        title: "Thành công",
        description: "Link Student với Parent thành công",
        variant: "default",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error linking profiles:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể link profiles",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle delete profile
  const handleDeleteProfile = async (id: string, displayName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa profile "${displayName}"?`)) {
      return;
    }

    try {
      await deleteProfile(id);

      toast({
        title: "Thành công",
        description: "Xóa profile thành công",
        variant: "default",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa profile",
        variant: "destructive",
      });
    }
  };

  // Open link modal with parent pre-selected
  const handleOpenLinkModal = (parentId: string, parentName: string) => {
    setSelectedParentForLink({ id: parentId, name: parentName });
    setShowLinkModal(true);
  };

  // Close link modal
  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setSelectedParentForLink(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Users className="text-purple-600" size={40} />
            Quản lý Profiles
          </h1>
          <p className="text-gray-600">
            Quản lý tài khoản Parent và profile Student
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowCreateParentModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <UserPlus size={20} />
              Tạo tài khoản Parent
            </button>

            <button
              onClick={() => setShowCreateStudentModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <UserCircle size={20} />
              Tạo profile Student
            </button>

            <button
              onClick={() => {
                setSelectedParentForLink(null);
                setShowLinkModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <LinkIcon size={20} />
              Link Student với Parent
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter by Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  filterType === "all"
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterType("Parent")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  filterType === "Parent"
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Parents
              </button>
              <button
                onClick={() => setFilterType("Student")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  filterType === "Student"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Students
              </button>
            </div>
          </div>
        </div>

        {/* Profiles Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không có profile nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Loại</th>
                    <th className="px-6 py-4 text-left font-semibold">Tên hiển thị</th>
                    <th className="px-6 py-4 text-left font-semibold">Email</th>
                    <th className="px-6 py-4 text-left font-semibold">User ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Trạng thái</th>
                    <th className="px-6 py-4 text-left font-semibold">Ngày tạo</th>
                    <th className="px-6 py-4 text-center font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          profile.profileType === "Parent"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {profile.profileType === "Parent" ? <Shield size={12} /> : <UserCircle size={12} />}
                          {profile.profileType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{profile.displayName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Mail size={14} />
                          {profile.userEmail || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 font-mono">
                          {profile.userId.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {profile.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircle size={12} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {profile.profileType === "Parent" && (
                            <button
                              onClick={() => handleOpenLinkModal(profile.id, profile.displayName)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Link với Student"
                            >
                              <LinkIcon size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProfile(profile.id, profile.displayName)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tổng Profiles</p>
                <p className="text-3xl font-bold mt-1">{profiles.length}</p>
              </div>
              <Users size={40} className="text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Parents</p>
                <p className="text-3xl font-bold mt-1">
                  {profiles.filter(p => p.profileType === "Parent").length}
                </p>
              </div>
              <Shield size={40} className="text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Students</p>
                <p className="text-3xl font-bold mt-1">
                  {profiles.filter(p => p.profileType === "Student").length}
                </p>
              </div>
              <UserCircle size={40} className="text-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateParentAccountModal
        isOpen={showCreateParentModal}
        onClose={() => setShowCreateParentModal(false)}
        onSubmit={handleCreateParent}
      />

      <CreateStudentProfileModal
        isOpen={showCreateStudentModal}
        onClose={() => setShowCreateStudentModal(false)}
        onSubmit={handleCreateStudent}
      />

      <LinkStudentToParentModal
        isOpen={showLinkModal}
        onClose={handleCloseLinkModal}
        onSubmit={handleLinkProfiles}
        parentProfileId={selectedParentForLink?.id}
        parentName={selectedParentForLink?.name}
      />
    </div>
  );
}
