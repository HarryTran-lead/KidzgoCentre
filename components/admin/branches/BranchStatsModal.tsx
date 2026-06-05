"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Users,
  GraduationCap,
  BookOpen,
  X,
  Search,
} from "lucide-react";
import { fetchAdminClasses } from "@/app/api/admin/classes";
import { getAllUsers } from "@/lib/api/userService";
import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

type StatsType = "students" | "classes" | "teachers";

interface BranchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  statsType: StatsType;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
}

export default function BranchStatsModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  statsType,
}: BranchStatsModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!isOpen) {
      setData([]);
      setError(null);
      setSearchTerm("");
      setSortOrder("asc");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (statsType === "classes") {
          const classes = await fetchAdminClasses({ branchId });
          setData(classes);
        } else if (statsType === "students") {
          const response = await getAllUsers({
            branchId,
            pageSize: 200,
            isActive: true,
          });
          const responseData = response.data || response;

          if ((response.success || response.isSuccess) && responseData?.items) {
            const allUsers = responseData.items;
            const students: any[] = [];

            // Extract students from user profiles - only include users who have Student profile
            allUsers.forEach((user: any) => {
              if (
                user.profiles &&
                Array.isArray(user.profiles) &&
                user.profiles.length > 0
              ) {
                const studentProfiles = user.profiles.filter(
                  (p: any) =>
                    p.profileType && p.profileType.trim() === "Student",
                );
                // Only add user if they have at least one Student profile
                if (studentProfiles.length > 0) {
                  studentProfiles.forEach((profile: any) => {
                    students.push({
                      id: profile.id || user.id,
                      fullName:
                        profile.displayName || user.fullName || user.name,
                      name: profile.displayName || user.fullName || user.name,
                      email: user.email,
                      studentCode: profile.code || profile.studentCode || "",
                      code: profile.code || profile.studentCode || "",
                      parentName: user.fullName || user.name,
                    });
                  });
                }
              }
            });
            setData(students);
          } else {
            setData([]);
          }
        } else if (statsType === "teachers") {
          const token = getAccessToken();
          if (!token) throw new Error("Chưa đăng nhập");

          const res = await fetch(
            `${ADMIN_ENDPOINTS.CLASSROOMS}?branchId=${branchId}&role=Teacher&pageNumber=1&pageSize=200`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (!res.ok) throw new Error("Không thể tải danh sách giáo viên");

          const json = await res.json();
          // Try to fetch teachers directly from users endpoint
          const teachersRes = await fetch(
            `/api/admin/users?pageNumber=1&pageSize=200&role=Teacher&branchId=${branchId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (teachersRes.ok) {
            const teachersJson = await teachersRes.json();
            const teachers =
              teachersJson?.data?.items ?? teachersJson?.data?.users ?? [];
            setData(Array.isArray(teachers) ? teachers : []);
          } else {
            setData([]);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Không thể tải dữ liệu");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, branchId, statsType]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (statsType) {
      case "students":
        return "Danh sách học viên";
      case "classes":
        return "Danh sách lớp học";
      case "teachers":
        return "Danh sách giáo viên";
    }
  };

  const getIcon = () => {
    switch (statsType) {
      case "students":
        return <GraduationCap size={20} />;
      case "classes":
        return <BookOpen size={20} />;
      case "teachers":
        return <Users size={20} />;
    }
  };

  const getItemName = (item: any) => {
    if (statsType === "classes") {
      return item?.classTitle || item?.title || item?.name || "Lớp học";
    } else if (statsType === "students") {
      return item?.fullName || item?.name || item?.email || "Học viên";
    } else {
      return item?.name || item?.fullName || item?.email || "Giáo viên";
    }
  };

  const getItemCode = (item: any) => {
    if (statsType === "classes") {
      return item?.classCode || item?.code || "";
    } else if (statsType === "students") {
      return item?.studentCode || item?.code || "";
    } else {
      return item?.email || "";
    }
  };

  const getItemDetails = (item: any) => {
    if (statsType === "classes") {
      return item?.programName || "";
    } else if (statsType === "students") {
      return item?.email || "";
    } else {
      return item?.email || "";
    }
  };

  // Filter and sort data
  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const name = getItemName(item).toLowerCase();
    const code = getItemCode(item).toLowerCase();
    const details = getItemDetails(item).toLowerCase();
    return (
      name.includes(searchLower) ||
      code.includes(searchLower) ||
      details.includes(searchLower)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const nameA = getItemName(a);
    const nameB = getItemName(b);
    const comparison = nameA.localeCompare(nameB, "vi");
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl px-6 py-5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 text-white">
                {getIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-block px-3 py-1 bg-blue-500/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-blue-300/80">
                    {branchName}
                  </span>
                  {statsType === "students" && (
                    <span className="inline-block px-2.5 py-0.5 bg-green-500/60 text-white text-xs font-semibold rounded-full border border-green-300/80 backdrop-blur-sm">
                      {data.length} Học viên
                    </span>
                  )}
                  {statsType === "classes" && (
                    <span className="inline-block px-2.5 py-0.5 bg-yellow-300/60 text-white text-xs font-semibold rounded-full border border-orange-300/80 backdrop-blur-sm">
                      {data.length} Lớp học
                    </span>
                  )}
                  {statsType === "teachers" && (
                    <span className="inline-block px-2.5 py-0.5 bg-purple-500/60 text-white text-xs font-semibold rounded-full border border-purple-300/80 backdrop-blur-sm">
                      {data.length} Giáo viên
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white transition hover:bg-white/20 rounded-lg cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar cursor-pointer">
          {!isLoading && !error && data.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <Select
                value={sortOrder}
                onValueChange={(val) => setSortOrder(val as "asc" | "desc")}
              >
                <SelectTrigger className="w-auto px-3 py-2.5 border-gray-300 focus:ring-red-300 cursor-pointer">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-red-500" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-600">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-red-200 bg-gradient-to-br from-red-50/80 to-red-50/30">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-red-400">
                {getIcon()}
              </div>
              <p className="font-medium text-gray-600">
                {searchTerm ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedData.map((item, idx) => (
                <div
                  key={item?.id ?? idx}
                  className="rounded-lg border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4 hover:border-red-300 hover:bg-red-100/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {getItemName(item)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {getItemCode(item)}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {statsType === "students" && item?.parentName && (
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-900 text-xs font-semibold rounded-lg border border-gray-300">
                            <span className="font-medium">Phụ huynh: </span>
                            {item.parentName}
                          </span>
                        )}
                        {getItemDetails(item) &&
                          getItemDetails(item) !== getItemCode(item) && (
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-900 text-xs font-semibold rounded-lg border border-gray-300">
                              {getItemDetails(item)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-50/30 to-red-100/30 p-4 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{sortedData.length}</span>{" "}
            {statsType === "students"
              ? "học viên"
              : statsType === "classes"
                ? "lớp học"
                : "giáo viên"}
            {searchTerm && (
              <span className="text-xs text-gray-500 ml-2">
                ({data.length} tổng cộng)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-red-300 bg-white text-gray-700 font-semibold hover:bg-red-50 hover:border-red-400 transition-all duration-200 cursor-pointer shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
