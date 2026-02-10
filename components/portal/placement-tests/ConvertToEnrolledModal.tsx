"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, Search } from "lucide-react";
import { getAccessToken } from "@/lib/store/authToken";
import type { PlacementTest } from "@/types/placement-test";

interface StudentProfileOption {
  id: string;
  displayName: string;
}

interface ConvertToEnrolledModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentProfileId: string) => Promise<void>;
  test: PlacementTest | null;
}

export default function ConvertToEnrolledModal({
  isOpen,
  onClose,
  onSubmit,
  test,
}: ConvertToEnrolledModalProps) {
  const [studentProfileId, setStudentProfileId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self-fetch student profiles with debounce search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [studentProfiles, setStudentProfiles] = useState<StudentProfileOption[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState("");

  // Debounce search (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch student profiles from API with profileType=Student
  useEffect(() => {
    if (!isOpen) return;
    const fetchProfiles = async () => {
      setIsLoadingProfiles(true);
      try {
        const token = getAccessToken();
        const params = new URLSearchParams({ profileType: "Student", pageSize: "50" });
        if (debouncedQuery) params.append("searchTerm", debouncedQuery);
        const response = await fetch(`/api/profiles?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        const data = result?.data || result;
        const items = data?.items || data?.profiles || [];
        const mapped = (Array.isArray(items) ? items : []).map((p: any) => ({
          id: p.id || p.profileId,
          displayName: p.displayName || p.fullName || p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "N/A",
        }));
        setStudentProfiles(mapped);
      } catch (error) {
        console.error("Error fetching student profiles:", error);
        setStudentProfiles([]);
      } finally {
        setIsLoadingProfiles(false);
      }
    };
    fetchProfiles();
  }, [isOpen, debouncedQuery]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStudentProfileId("");
      setSearchQuery("");
      setSelectedName("");
      setShowDropdown(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfileId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(studentProfileId);
      onClose();
    } catch (error) {
      console.error("Error converting to enrolled:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCheck size={22} />
            Chuyển thành học viên
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Test Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Tên trẻ:</span> {test.childName || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Phụ huynh:</span> {test.leadContactName || "N/A"}
            </p>
            {test.resultScore !== undefined && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Điểm tổng:</span>{" "}
                <span className="text-purple-600 font-semibold">{test.resultScore}</span>
              </p>
            )}
            {test.levelRecommendation && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Trình độ đề xuất:</span>{" "}
                <span className="text-indigo-600 font-semibold">{test.levelRecommendation}</span>
              </p>
            )}
          </div>

          {/* Student Profile Selection with Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Chọn Student Profile <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={studentProfileId ? selectedName : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setStudentProfileId("");
                  setSelectedName("");
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Tìm kiếm học viên..."
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none text-sm"
              />
              {studentProfileId && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentProfileId("");
                    setSelectedName("");
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
              {showDropdown && !studentProfileId && (
                <>
                  <div className="fixed inset-0 z-9998" onClick={() => setShowDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-9999">
                    {isLoadingProfiles ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Đang tải...</div>
                    ) : studentProfiles.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy học viên</div>
                    ) : (
                      studentProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            setStudentProfileId(profile.id);
                            setSelectedName(`${profile.displayName} (${profile.id.slice(0, 8)}...)`);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm"
                        >
                          <span className="font-medium">{profile.displayName}</span>
                          <span className="text-gray-400 text-xs ml-2">({profile.id.slice(0, 8)}...)</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Chọn hồ sơ học viên tương ứng để chuyển đổi thành học viên chính thức.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !studentProfileId}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận chuyển đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
