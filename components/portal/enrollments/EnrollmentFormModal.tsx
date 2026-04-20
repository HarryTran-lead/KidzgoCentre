"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Users, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { getAccessToken } from "@/lib/store/authToken";
import { todayDateOnly } from "@/lib/datetime";

interface ClassOption {
  id: string;
  code: string;
  title: string;
}

interface StudentProfileOption {
  id: string;
  fullName: string;
}

interface EnrollmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    classId: string;
    studentProfileId: string;
    enrollDate: string;
  }) => Promise<void>;
}

export default function EnrollmentFormModal({
  isOpen,
  onClose,
  onSubmit,
}: EnrollmentFormModalProps) {
  // Form state
  const [classId, setClassId] = useState("");
  const [studentProfileId, setStudentProfileId] = useState("");
  const [enrollDate, setEnrollDate] = useState(
    todayDateOnly()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Class search state
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [debouncedClassQuery, setDebouncedClassQuery] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Student profile search state
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [debouncedStudentQuery, setDebouncedStudentQuery] = useState("");
  const [studentProfiles, setStudentProfiles] = useState<StudentProfileOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Debounce class search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClassQuery(classSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [classSearchQuery]);

  // Debounce student search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentQuery(studentSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  // Fetch classes
  useEffect(() => {
    if (!isOpen) return;
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const token = getAccessToken();
        const params = new URLSearchParams({ pageSize: "50" });
        if (debouncedClassQuery) params.append("searchTerm", debouncedClassQuery);
        const response = await fetch(`/api/classes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        const data = result?.data || result;
        const items = data?.classes?.items || data?.items || data?.classes || [];
        const mapped = (Array.isArray(items) ? items : []).map((c: any) => ({
          id: c.id || c.classId,
          code: c.code || c.classCode || "",
          title: c.title || c.name || c.classTitle || "",
        }));
        setClasses(mapped);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [isOpen, debouncedClassQuery]);

  // Fetch student profiles
  useEffect(() => {
    if (!isOpen) return;
    const fetchStudentProfiles = async () => {
      setIsLoadingStudents(true);
      try {
        const token = getAccessToken();
        const params = new URLSearchParams({ profileType: "Student", pageSize: "50" });
        if (debouncedStudentQuery) params.append("searchTerm", debouncedStudentQuery);
        const response = await fetch(`/api/profiles?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        const data = result?.data || result;
        const items = data?.items || data?.profiles || [];
        const mapped = (Array.isArray(items) ? items : []).map((p: any) => ({
          id: p.id || p.profileId,
          fullName: p.displayName || p.fullName || p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        }));
        setStudentProfiles(mapped);
      } catch (error) {
        console.error("Error fetching student profiles:", error);
        setStudentProfiles([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudentProfiles();
  }, [isOpen, debouncedStudentQuery]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setClassId("");
      setStudentProfileId("");
      setEnrollDate(todayDateOnly());
      setClassSearchQuery("");
      setStudentSearchQuery("");
    }
  }, [isOpen]);

  const handleReset = () => {
    setClassId("");
    setStudentProfileId("");
    setEnrollDate(todayDateOnly());
    setClassSearchQuery("");
    setStudentSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !studentProfileId || !enrollDate) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ classId, studentProfileId, enrollDate });
      onClose();
    } catch (error) {
      console.error("Error creating enrollment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Lấy tên lớp đã chọn để hiển thị
  const selectedClass = classes.find(c => c.id === classId);
  const selectedClassDisplay = selectedClass ? `${selectedClass.code} - ${selectedClass.title}` : "";

  // Lấy tên học viên đã chọn để hiển thị
  const selectedStudent = studentProfiles.find(s => s.id === studentProfileId);
  const selectedStudentDisplay = selectedStudent ? selectedStudent.fullName : "";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tạo ghi danh mới</h2>
                <p className="text-sm text-red-100">Nhập thông tin chi tiết về ghi danh</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <BookOpen size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thông tin lớp học</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-gray-400" />
                  Chọn lớp học <span className="text-red-500">*</span>
                </label>
                <Select
                  value={classId}
                  onValueChange={(value) => {
                    setClassId(value);
                    setClassSearchQuery("");
                  }}
                >
                  <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                    <SelectValue placeholder="Chọn lớp học">
                      {selectedClassDisplay}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                      <input
                        type="text"
                        value={classSearchQuery}
                        onChange={(e) => setClassSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm lớp học..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {isLoadingClasses ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Đang tải...</div>
                    ) : classes.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy lớp học</div>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          <span className="font-medium text-red-600">{cls.code}</span>
                          <span className="text-gray-600"> - {cls.title}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Profile Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Users size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thông tin học viên</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} className="text-gray-400" />
                  Chọn học viên <span className="text-red-500">*</span>
                </label>
                <Select
                  value={studentProfileId}
                  onValueChange={(value) => {
                    setStudentProfileId(value);
                    setStudentSearchQuery("");
                  }}
                >
                  <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                    <SelectValue placeholder="Chọn học viên">
                      {selectedStudentDisplay}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm học viên..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {isLoadingStudents ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Đang tải...</div>
                    ) : studentProfiles.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy học viên</div>
                    ) : (
                      studentProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <span className="font-medium text-gray-900">{profile.fullName}</span>
                          <span className="text-gray-400 text-xs ml-2">({profile.id.slice(0, 8)}...)</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enroll Date */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Calendar size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thời gian ghi danh</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  Ngày ghi danh <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={enrollDate}
                  onChange={(e) => setEnrollDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all text-sm"
                  required
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Giống modal mẫu */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                Đặt lại
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !classId || !studentProfileId || !enrollDate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Đang xử lý..." : "Tạo ghi danh"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}