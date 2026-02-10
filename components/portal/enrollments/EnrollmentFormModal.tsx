"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Search } from "lucide-react";
import { getAccessToken } from "@/lib/store/authToken";

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
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Class search state
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [debouncedClassQuery, setDebouncedClassQuery] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState("");

  // Student profile search state
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [debouncedStudentQuery, setDebouncedStudentQuery] = useState("");
  const [studentProfiles, setStudentProfiles] = useState<StudentProfileOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");

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
      setEnrollDate(new Date().toISOString().split("T")[0]);
      setClassSearchQuery("");
      setStudentSearchQuery("");
      setSelectedClassName("");
      setSelectedStudentName("");
    }
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={22} />
            Tạo ghi danh mới
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Class Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Chọn lớp học <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={classId ? selectedClassName : classSearchQuery}
                onChange={(e) => {
                  setClassSearchQuery(e.target.value);
                  setClassId("");
                  setSelectedClassName("");
                  setShowClassDropdown(true);
                }}
                onFocus={() => setShowClassDropdown(true)}
                placeholder="Tìm kiếm lớp học..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm"
              />
              {classId && (
                <button
                  type="button"
                  onClick={() => {
                    setClassId("");
                    setSelectedClassName("");
                    setClassSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
              {showClassDropdown && !classId && (
                <>
                  <div className="fixed inset-0 z-9998" onClick={() => setShowClassDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-9999">
                    {isLoadingClasses ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Đang tải...</div>
                    ) : classes.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy lớp học</div>
                    ) : (
                      classes.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setClassId(cls.id);
                            setSelectedClassName(`${cls.code} - ${cls.title}`);
                            setShowClassDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                        >
                          <span className="font-medium text-blue-600">{cls.code}</span>
                          <span className="text-gray-600"> - {cls.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Student Profile Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Chọn học viên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={studentProfileId ? selectedStudentName : studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  setStudentProfileId("");
                  setSelectedStudentName("");
                  setShowStudentDropdown(true);
                }}
                onFocus={() => setShowStudentDropdown(true)}
                placeholder="Tìm kiếm học viên..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm"
              />
              {studentProfileId && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentProfileId("");
                    setSelectedStudentName("");
                    setStudentSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
              {showStudentDropdown && !studentProfileId && (
                <>
                  <div className="fixed inset-0 z-9998" onClick={() => setShowStudentDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-9999">
                    {isLoadingStudents ? (
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
                            setSelectedStudentName(profile.fullName);
                            setShowStudentDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                        >
                          <span className="font-medium">{profile.fullName}</span>
                          <span className="text-gray-400 text-xs ml-2">({profile.id.slice(0, 8)}...)</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Enroll Date */}
          <div className="space-y-2">
            <label htmlFor="enrollDate" className="block text-sm font-medium text-gray-700">
              Ngày ghi danh <span className="text-rose-500">*</span>
            </label>
            <input
              id="enrollDate"
              type="date"
              value={enrollDate}
              onChange={(e) => setEnrollDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm"
              required
            />
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
              disabled={isSubmitting || !classId || !studentProfileId || !enrollDate}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Tạo ghi danh"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
