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

            // Fetch classes to map with students
            try {
              const token = getAccessToken();
              if (!token) {
                console.warn("No token available for enrollment fetch");
                setData(students);
                return;
              }

              // Fetch all enrollments for this branch to map student -> classes
              const enrollmentsRes = await fetch(
                `/api/enrollments?pageNumber=1&pageSize=1000&branchId=${branchId}`,
                { headers: { Authorization: `Bearer ${token}` } },
              );

              if (!enrollmentsRes.ok) {
                console.error("Enrollment fetch error:", enrollmentsRes.status);
                setData(students);
                return;
              }

              const enrollmentsJson = await enrollmentsRes.json();
              console.log("Enrollments response:", enrollmentsJson);

              let enrollmentItems: any[] = [];

              // Handle various response structures
              if (Array.isArray(enrollmentsJson?.data?.enrollments?.items)) {
                enrollmentItems = enrollmentsJson.data.enrollments.items;
              } else if (Array.isArray(enrollmentsJson?.data?.items)) {
                enrollmentItems = enrollmentsJson.data.items;
              } else if (Array.isArray(enrollmentsJson?.data)) {
                enrollmentItems = enrollmentsJson.data;
              }

              console.log("Enrollment items:", enrollmentItems);

              // Map enrollments to get classes by student
              const classesByStudentCode: Record<string, string[]> = {};
              const classesByStudentId: Record<string, string[]> = {};

              enrollmentItems.forEach((enrollment: any) => {
                const studentCode = enrollment.studentCode || "";
                const studentProfileId = enrollment.studentProfileId || "";
                const classCode = enrollment.classCode || "";

                // Map by both student code and student ID
                if (studentCode && classCode) {
                  if (!classesByStudentCode[studentCode]) {
                    classesByStudentCode[studentCode] = [];
                  }
                  if (!classesByStudentCode[studentCode].includes(classCode)) {
                    classesByStudentCode[studentCode].push(classCode);
                  }
                }

                if (studentProfileId && classCode) {
                  if (!classesByStudentId[studentProfileId]) {
                    classesByStudentId[studentProfileId] = [];
                  }
                  if (
                    !classesByStudentId[studentProfileId].includes(classCode)
                  ) {
                    classesByStudentId[studentProfileId].push(classCode);
                  }
                }
              });

              console.log("Classes by student code:", classesByStudentCode);
              console.log("Classes by student ID:", classesByStudentId);
              console.log(
                "Students data:",
                students.map((s) => ({ id: s.id, code: s.code })),
              );

              // Merge class info into students
              const enrichedStudents = students.map((student: any) => ({
                ...student,
                classes:
                  classesByStudentCode[student.code] ||
                  classesByStudentId[student.id] ||
                  [],
              }));

              setData(enrichedStudents);
            } catch (err) {
              // If enrollment fetch fails, just show students without classes
              setData(students);
            }
          } else {
            setData([]);
          }
        } else if (statsType === "teachers") {
          const token = getAccessToken();
          if (!token) throw new Error("Chưa đăng nhập");

          // Fetch teachers
          const teachersRes = await fetch(
            `/api/admin/users?pageNumber=1&pageSize=200&role=Teacher&branchId=${branchId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (!teachersRes.ok)
            throw new Error("Không thể tải danh sách giáo viên");

          const teachersJson = await teachersRes.json();
          const teachers =
            teachersJson?.data?.items ?? teachersJson?.data?.users ?? [];

          // Fetch classes to map with teachers
          try {
            const classes = await fetchAdminClasses({ branchId });

            // Create map of classes by teacher name
            const classesByTeacher: Record<string, string[]> = {};
            classes.forEach((cls: any) => {
              const teacherName = cls.teacher || "";
              if (teacherName && teacherName !== "Chưa phân công") {
                if (!classesByTeacher[teacherName]) {
                  classesByTeacher[teacherName] = [];
                }
                classesByTeacher[teacherName].push(cls.code || cls.name);
              }
            });

            // Merge class info into teachers
            const enrichedTeachers = (
              Array.isArray(teachers) ? teachers : []
            ).map((teacher: any) => ({
              ...teacher,
              classes: classesByTeacher[teacher.name || teacher.fullName] || [],
            }));

            setData(enrichedTeachers);
          } catch (err) {
            // If class fetch fails, just show teachers without classes
            setData(Array.isArray(teachers) ? teachers : []);
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

    let matches =
      name.includes(searchLower) ||
      code.includes(searchLower) ||
      details.includes(searchLower);

    // Also search in classes for teachers and students
    if (
      (statsType === "teachers" || statsType === "students") &&
      item?.classes &&
      item.classes.length > 0
    ) {
      const classesText = item.classes.join(" ").toLowerCase();
      matches = matches || classesText.includes(searchLower);
    }

    return matches;
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
            <>
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
              {searchTerm && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm">
                  <span className="text-gray-700">Tìm thấy </span>
                  <span className="font-bold text-red-600">
                    {sortedData.length}
                  </span>
                  <span className="text-gray-700"> kết quả</span>
                </div>
              )}
            </>
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
                        {statsType === "classes" && item?.sub && (
                          <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg border border-blue-300">
                            <span className="font-medium">Chương trình: </span>
                            {item.sub}
                          </span>
                        )}
                        {statsType === "students" && item?.parentName && (
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-900 text-xs font-semibold rounded-lg border border-gray-300">
                            <span className="font-medium">Phụ huynh: </span>
                            {item.parentName}
                          </span>
                        )}

                        {statsType === "teachers" &&
                          item?.classes &&
                          item.classes.length > 0 && (
                            <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg border border-blue-300">
                              <span className="font-medium">Lớp: </span>
                              {item.classes.join(", ")}
                            </span>
                          )}
                        {getItemDetails(item) &&
                          getItemDetails(item) !== getItemCode(item) && (
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-900 text-xs font-semibold rounded-lg border border-gray-300">
                              {getItemDetails(item)}
                            </span>
                          )}
                        {statsType === "students" &&
                          item?.classes &&
                          item.classes.length > 0 && (
                            <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg border border-blue-300">
                              <span className="font-medium">Lớp: </span>
                              {item.classes.join(", ")}
                            </span>
                          )}
                        {statsType === "students" &&
                          (!item?.classes || item.classes.length === 0) && (
                            <span className="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-900 text-xs font-semibold rounded-lg border border-yellow-300">
                              <span className="font-medium">Lớp: </span>
                              Chưa có
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
        <div className="shrink-0 border-t border-gray-200 bg-gradient-to-r from-red-50/30 to-red-100/30 p-4 rounded-b-2xl flex justify-end items-center">
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
