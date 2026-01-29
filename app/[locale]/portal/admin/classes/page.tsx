"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus, Search, MapPin, Users, Clock, Eye, Pencil,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  BookOpen, X, Calendar, Tag, User, GraduationCap, AlertCircle
} from "lucide-react";
import clsx from "clsx";
import { fetchAdminClasses } from "@/app/api/admin/classes";
import type { ClassRow } from "@/types/admin/classes";

/* ----------------------------- UI HELPERS ------------------------------ */
function StatusBadge({ value }: { value: ClassRow["status"] }) {
  const map: Record<ClassRow["status"], string> = {
    "Đang học": "bg-emerald-100 text-emerald-700",
    "Sắp khai giảng": "bg-amber-100 text-amber-700",
    "Đã kết thúc": "bg-sky-100 text-sky-700",
  };
  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

function occupancyTint(curr: number, cap: number) {
  if (curr === 0) return "text-emerald-600";
  const r = curr / cap;
  if (r >= 0.9) return "text-rose-600";
  if (r >= 0.75) return "text-amber-600";
  return "text-emerald-600";
}

type SortField = "id" | "name" | "teacher" | "room" | "capacity" | "schedule" | "status";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 5;

/* ----------------------------- API HELPERS ------------------------------ */
function mapApiClassToRow(item: any): ClassRow {
  const id = String(item?.code ?? item?.id ?? "");
  const name = item?.title ?? "Lớp học";
  const sub = item?.programName ?? "";
  const teacher = item?.mainTeacherName ?? "Chưa phân công";
  const room = item?.roomName ?? "Chưa có phòng";
  const current = item?.currentEnrollmentCount ?? 0;
  const capacity = item?.capacity ?? 0;
  const schedulePattern = (item?.schedulePattern as string | undefined) ?? "";
  const schedule = schedulePattern.trim() || "Chưa có lịch";
  
  const rawStatus: string = (item?.status as string | undefined) ?? "";
  let status: ClassRow["status"] = "Sắp khai giảng";
  const normalized = rawStatus.toLowerCase();
  if (normalized === "active") status = "Đang học";
  else if (normalized === "closed") status = "Đã kết thúc";

  return {
    id,
    name,
    sub,
    teacher,
    room,
    current,
    capacity,
    schedule,
    status,
  };
}

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
  align = "left",
}: {
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentField === field;
  const icon = isActive ? (
    direction === "asc" ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />
  ) : <ArrowUpDown size={14} className="text-gray-400" />;
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-pink-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

/* ----------------------------- CREATE CLASS MODAL ------------------------------ */
interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClassFormData) => void;
}

interface ClassFormData {
  code: string;
  name: string;
  program: string;
  teacher: string;
  room: string;
  capacity: number;
  schedule: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
  startDate: string;
  endDate: string;
  description: string;
}

const initialFormData: ClassFormData = {
  code: "",
  name: "",
  program: "",
  teacher: "",
  room: "",
  capacity: 30,
  schedule: "",
  status: "Sắp khai giảng",
  startDate: "",
  endDate: "",
  description: "",
};

function CreateClassModal({ isOpen, onClose, onSubmit }: CreateClassModalProps) {
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClassFormData, string>>>({});
  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClassFormData, string>> = {};
    
    if (!formData.code.trim()) newErrors.code = "Mã lớp là bắt buộc";
    if (!formData.name.trim()) newErrors.name = "Tên lớp là bắt buộc";
    if (!formData.teacher.trim()) newErrors.teacher = "Giáo viên là bắt buộc";
    if (formData.capacity <= 0) newErrors.capacity = "Sĩ số phải lớn hơn 0";
    if (!formData.startDate) newErrors.startDate = "Ngày bắt đầu là bắt buộc";
    if (!formData.endDate) newErrors.endDate = "Ngày kết thúc là bắt buộc";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof ClassFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tạo lớp học mới</h2>
                <p className="text-sm text-pink-100">Nhập thông tin chi tiết về lớp học mới</p>
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

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Mã lớp & Tên lớp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-pink-500" />
                  Mã lớp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.code ? "border-rose-500" : "border-pink-200"
                    )}
                    placeholder="VD: TS12, TS19..."
                  />
                  {errors.code && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.code && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.code}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-pink-500" />
                  Tên lớp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.name ? "border-rose-500" : "border-pink-200"
                    )}
                    placeholder="VD: Lập trình Python cơ bản"
                  />
                  {errors.name && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.name && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
              </div>
            </div>

            {/* Row 2: Chương trình & Giáo viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-pink-500" />
                  Chương trình
                </label>
                <select
                  value={formData.program}
                  onChange={(e) => handleChange("program", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="">Chọn chương trình</option>
                  <option value="Lập trình cơ bản">Lập trình cơ bản</option>
                  <option value="Lập trình nâng cao">Lập trình nâng cao</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-pink-500" />
                  Giáo viên chính *
                </label>
                <div className="relative">
                  <select
                    value={formData.teacher}
                    onChange={(e) => handleChange("teacher", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300",
                      errors.teacher ? "border-rose-500" : "border-pink-200"
                    )}
                  >
                    <option value="">Chọn giáo viên</option>
                    <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                    <option value="Trần Thị B">Trần Thị B</option>
                    <option value="Lê Văn C">Lê Văn C</option>
                    <option value="Phạm Thị D">Phạm Thị D</option>
                  </select>
                  {errors.teacher && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.teacher && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.teacher}</p>}
              </div>
            </div>

            {/* Row 3: Phòng học & Sĩ số */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin size={16} className="text-pink-500" />
                  Phòng học
                </label>
                <select
                  value={formData.room}
                  onChange={(e) => handleChange("room", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="">Chọn phòng học</option>
                  <option value="P.101">Phòng 101</option>
                  <option value="P.102">Phòng 102</option>
                  <option value="P.201">Phòng 201</option>
                  <option value="P.202">Phòng 202</option>
                  <option value="P.301">Phòng 301</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} className="text-pink-500" />
                  Sĩ số tối đa *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.capacity ? "border-rose-500" : "border-pink-200"
                    )}
                  />
                  {errors.capacity && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.capacity && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.capacity}</p>}
              </div>
            </div>

            {/* Row 4: Ngày bắt đầu & Kết thúc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-pink-500" />
                  Ngày bắt đầu *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.startDate ? "border-rose-500" : "border-pink-200"
                    )}
                  />
                  {errors.startDate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.startDate && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-pink-500" />
                  Ngày kết thúc *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all",
                      errors.endDate ? "border-rose-500" : "border-pink-200"
                    )}
                  />
                  {errors.endDate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.endDate && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.endDate}</p>}
              </div>
            </div>

            {/* Row 5: Lịch học & Trạng thái */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-pink-500" />
                  Lịch học
                </label>
                <select
                  value={formData.schedule}
                  onChange={(e) => handleChange("schedule", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="">Chọn lịch học</option>
                  <option value="Thứ 2,4,6 - 18:00-20:00">Thứ 2,4,6 - 18:00-20:00</option>
                  <option value="Thứ 3,5,7 - 18:00-20:00">Thứ 3,5,7 - 18:00-20:00</option>
                  <option value="Sáng thứ 7,CN - 8:00-11:00">Sáng thứ 7,CN - 8:00-11:00</option>
                  <option value="Chiều thứ 7,CN - 14:00-17:00">Chiều thứ 7,CN - 14:00-17:00</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-pink-500" />
                  Trạng thái
                </label>
                <div className="flex gap-2">
                  {(["Sắp khai giảng", "Đang học", "Đã kết thúc"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleChange("status", status)}
                      className={clsx(
                        "flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
                        formData.status === status
                          ? status === "Sắp khai giảng"
                            ? "bg-amber-100 border-amber-300 text-amber-700"
                            : status === "Đang học"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                            : "bg-sky-100 border-sky-300 text-sky-700"
                          : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 6: Mô tả */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-pink-500" />
                Mô tả lớp học
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                placeholder="Mô tả chi tiết về lớp học..."
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(initialFormData);
                  setErrors({});
                }}
                className="px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer"
              >
                Tạo lớp học
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- PAGE --------------------------------- */
export default function Page() {
  const [q, setQ] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ClassRow["status"]>("ALL");
  const [teacherFilter, setTeacherFilter] = useState<"ALL" | string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Gọi API để lấy danh sách lớp từ backend
  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        setError(null);

        const mapped = await fetchAdminClasses();
        setClasses(mapped);
      } catch (err) {
        console.error("Unexpected error when fetching admin classes:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách lớp học.");
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
  }, []);

  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(c => c.status === "Đang học").length;
    const students = classes.reduce((sum, c) => sum + c.current, 0);
    const occupancy = classes.reduce((sum, c) => sum + c.capacity, 0);

    return {
      total,
      active,
      students,
      occupancy: occupancy > 0 ? `${Math.round((students / occupancy) * 100)}%` : "0%",
    };
  }, [classes]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = !kw
      ? classes
      : classes.filter((c) =>
          [c.id, c.name, c.sub, c.teacher, c.room].some((x) =>
            x.toLowerCase().includes(kw)
          )
        );

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (teacherFilter !== "ALL") {
      filtered = filtered.filter((c) => c.teacher === teacherFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: ClassRow) => {
          switch (sortField) {
            case "id": return c.id;
            case "name": return c.name;
            case "teacher": return c.teacher;
            case "room": return c.room;
            case "capacity": return `${c.current}/${c.capacity}`;
            case "schedule": return c.schedule;
            case "status": return c.status;
          }
        };
        const av = getVal(a);
        const bv = getVal(b);
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }
    return filtered;
  }, [q, sortField, sortDirection, classes, statusFilter, teacherFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleCreateClass = (data: ClassFormData) => {
    // TODO: Gọi API để tạo lớp học mới
    console.log("Creating new class:", data);
    
    // Tạm thời thêm lớp học mới vào danh sách
    const newClass: ClassRow = {
      id: data.code,
      name: data.name,
      sub: data.program,
      teacher: data.teacher,
      room: data.room,
      current: 0,
      capacity: data.capacity,
      schedule: data.schedule,
      status: data.status,
    };
    
    setClasses(prev => [newClass, ...prev]);
    
    // Hiển thị thông báo thành công
    alert(`Đã tạo lớp học ${data.name} thành công!`);
  };

  return (
    <>
      <div className="space-y-6 bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6 rounded-3xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Quản lý lớp học</h1>
              <p className="text-sm text-gray-600">Quản lý thông tin lớp học và học viên</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
            type="button"
          >
            <Plus size={18} /> Tạo lớp học mới
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-pink-100 grid place-items-center">
                <Users className="text-pink-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng lớp học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
                <BookOpen className="text-emerald-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đang học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
                <Users className="text-amber-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng học viên</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-sky-100 grid place-items-center">
                <Users className="text-sky-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tỉ lệ lấp đầy</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.occupancy}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-3xl min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Tìm kiếm lớp học..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
                className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Đang học">Đang học</option>
                <option value="Sắp khai giảng">Sắp khai giảng</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
              <select
                value={teacherFilter}
                onChange={(e) => { setTeacherFilter(e.target.value as typeof teacherFilter); setPage(1); }}
                className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="ALL">Tất cả giáo viên</option>
                {[...new Set(classes.map(c => c.teacher))].map((teacher) => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách lớp học</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{rows.length} lớp học</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
                <tr>
                  <SortableHeader field="id" currentField={sortField} direction={sortDirection} onSort={handleSort}>Mã lớp</SortableHeader>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên lớp</SortableHeader>
                  <SortableHeader field="teacher" currentField={sortField} direction={sortDirection} onSort={handleSort}>Giáo viên</SortableHeader>
                  <SortableHeader field="room" currentField={sortField} direction={sortDirection} onSort={handleSort}>Phòng học</SortableHeader>
                  <SortableHeader field="capacity" currentField={sortField} direction={sortDirection} onSort={handleSort}>Sĩ số</SortableHeader>
                  <SortableHeader field="schedule" currentField={sortField} direction={sortDirection} onSort={handleSort}>Lịch học</SortableHeader>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                  <th className="py-3 px-6 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {pagedRows.length > 0 ? (
                  pagedRows.map((c) => (
                    <tr
                      key={c.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6 text-sm text-gray-900 whitespace-nowrap">{c.id}</td>

                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.sub}</div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <span className="inline-block w-5 h-5 rounded-full bg-pink-100 grid place-items-center">
                            <Users size={13} className="text-pink-600" />
                          </span>
                          <span className="truncate">{c.teacher}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="truncate">{c.room}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <Users size={16} className="text-gray-400" />
                          <span className={clsx("text-sm", occupancyTint(c.current, c.capacity))}>
                            {c.current}
                          </span>
                          <span className="text-gray-500 text-sm">/ {c.capacity}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900">
                          <Clock size={16} className="text-gray-400" />
                          <span className="truncate">{c.schedule}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge value={c.status} />
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                          <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Xem">
                            <Eye size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer" title="Sửa">
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                        <Search size={24} className="text-pink-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Không tìm thấy lớp học</div>
                      <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo lớp học mới</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Pagination */}
          {rows.length > 0 && (
            <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                  {' '}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> lớp học
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    onClick={() => goPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <div className="text-sm font-semibold text-gray-900 px-3">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    onClick={() => goPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClass}
      />
    </>
  );
}