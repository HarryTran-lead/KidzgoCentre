"use client";

import { 
  Search, Eye, Pencil, Clock, Users, Building2, AlertTriangle, 
  Plus, Filter, Calendar, ChevronRight, MoreVertical, CheckCircle, 
  XCircle, ChevronLeft, ChevronsLeft, ChevronsRight, X, Tag, 
  MapPin, Cpu, Monitor, Wifi, Volume2, Thermometer, Square,
  AlertCircle, Save, RotateCcw
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { fetchAdminRooms } from "@/app/api/admin/rooms";
import type { Room, Status as RoomStatus } from "@/types/admin/rooms";

type SortDirection = "asc" | "desc";

type SortState<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

function quickSort<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  if (items.length <= 1) return items;

  const pivot = items[items.length - 1];
  const left: T[] = [];
  const right: T[] = [];

  for (let i = 0; i < items.length - 1; i++) {
    const c = compare(items[i], pivot);
    if (c <= 0) left.push(items[i]);
    else right.push(items[i]);
  }

  return [...quickSort(left, compare), pivot, ...quickSort(right, compare)];
}

function toSortableValue(v: unknown): string | number {
  if (v == null) return "";
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v).toLowerCase();
}

function buildComparator<T>(key: keyof T, direction: SortDirection): (a: T, b: T) => number {
  const dir = direction === "asc" ? 1 : -1;
  return (a, b) => {
    const av = toSortableValue((a as any)[key]);
    const bv = toSortableValue((b as any)[key]);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };
}

/* ---------- Status Components ---------- */
type Status = "using" | "free" | "maintenance";

function StatusPill({ status }: { status: Status }) {
  const map = {
    using: {
      text: "Đang sử dụng",
      bg: "bg-gradient-to-r from-rose-500 to-pink-500",
      icon: <Clock size={12} />,
      textColor: "text-white"
    },
    free: {
      text: "Trống",
      bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
      icon: <CheckCircle size={12} />,
      textColor: "text-white"
    },
    maintenance: {
      text: "Bảo trì",
      bg: "bg-gradient-to-r from-amber-500 to-orange-500",
      icon: <AlertTriangle size={12} />,
      textColor: "text-white"
    },
  } as const;

  const cfg = map[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.textColor} text-xs font-medium shadow-sm`}>
      {cfg.icon}
      {cfg.text}
    </div>
  );
}

function EquipmentBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-50 to-rose-50 text-gray-700 text-xs font-medium border border-pink-200">
      {children}
    </span>
  );
}

function UtilizationRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-slate-200"
        />
        <circle
          cx="24"
          cy="24"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`text-sky-500 transition-all duration-1000 ${clamped > 70 ? 'text-emerald-500' : clamped > 30 ? 'text-amber-500' : 'text-sky-500'}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-900">{clamped}%</span>
      </div>
    </div>
  );
}

/* ---------- Modern Stat Card ---------- */
function ModernStatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  color = "pink"
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  color?: "pink" | "emerald" | "blue" | "amber";
}) {
  const colorClasses = {
    pink: "from-pink-500 to-rose-500",
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-sky-500",
    amber: "from-amber-500 to-orange-500",
  };

  const bgClasses = {
    pink: "bg-pink-100",
    emerald: "bg-emerald-100",
    blue: "bg-blue-100",
    amber: "bg-amber-100",
  };

  const textClasses = {
    pink: "text-pink-600",
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-pink-100/50 cursor-pointer">
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity`} />

      <div className="relative flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>

          <div className="flex items-center gap-3 mt-2">
            {subtitle && (
              <div className="text-xs text-gray-500">{subtitle}</div>
            )}

            {trend && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
                }`}>
                {trend.isPositive ? '↑' : '↓'}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- CREATE ROOM MODAL ---------- */
interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
}

interface RoomFormData {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  area: number;
  equipment: string[];
  status: Status;
  description: string;
}

const initialFormData: RoomFormData = {
  id: "",
  name: "",
  floor: 1,
  capacity: 30,
  area: 50,
  equipment: [],
  status: "free",
  description: "",
};

const equipmentOptions = [
  { id: "projector", label: "Máy chiếu", icon: <Monitor size={16} /> },
  { id: "aircon", label: "Điều hòa", icon: <Thermometer size={16} /> },
  { id: "sound", label: "Hệ thống âm thanh", icon: <Volume2 size={16} /> },
  { id: "wifi", label: "Wi-Fi tốc độ cao", icon: <Wifi size={16} /> },
  { id: "computer", label: "Máy tính", icon: <Cpu size={16} /> },
  { id: "whiteboard", label: "Bảng trắng", icon: <Square size={16} /> },
  { id: "camera", label: "Camera giám sát", icon: <Eye size={16} /> },
  { id: "tablets", label: "Máy tính bảng", icon: <Monitor size={16} /> },
];

function CreateRoomModal({ isOpen, onClose, onSubmit }: CreateRoomModalProps) {
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({});
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(initialFormData.equipment);
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
      setSelectedEquipment([]);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RoomFormData, string>> = {};
    
    if (!formData.id.trim()) newErrors.id = "Mã phòng là bắt buộc";
    if (!formData.name.trim()) newErrors.name = "Tên phòng là bắt buộc";
    if (formData.floor <= 0) newErrors.floor = "Số tầng phải lớn hơn 0";
    if (formData.capacity <= 0) newErrors.capacity = "Sức chứa phải lớn hơn 0";
    if (formData.area <= 0) newErrors.area = "Diện tích phải lớn hơn 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ ...formData, equipment: selectedEquipment });
      onClose();
    }
  };

  const handleChange = (field: keyof RoomFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipment)
        ? prev.filter(item => item !== equipment)
        : [...prev, equipment]
    );
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
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Thêm phòng học mới</h2>
                <p className="text-sm text-pink-100">Nhập thông tin chi tiết về phòng học</p>
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
            {/* Row 1: Mã phòng & Tên phòng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-pink-500" />
                  Mã phòng *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${
                      errors.id ? "border-rose-500" : "border-pink-200"
                    }`}
                    placeholder="VD: P101, P201..."
                  />
                  {errors.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.id && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.id}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-pink-500" />
                  Tên phòng *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${
                      errors.name ? "border-rose-500" : "border-pink-200"
                    }`}
                    placeholder="VD: Phòng học đa năng, Lab CNTT..."
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

            {/* Row 2: Tầng & Sức chứa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin size={16} className="text-pink-500" />
                  Tầng *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.floor}
                    onChange={(e) => handleChange("floor", parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${
                      errors.floor ? "border-rose-500" : "border-pink-200"
                    }`}
                  />
                  {errors.floor && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.floor && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.floor}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} className="text-pink-500" />
                  Sức chứa *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${
                      errors.capacity ? "border-rose-500" : "border-pink-200"
                    }`}
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

            {/* Row 3: Diện tích */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Square size={16} className="text-pink-500" />
                  Diện tích (m²) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="500"
                    step="0.5"
                    value={formData.area}
                    onChange={(e) => handleChange("area", parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all ${
                      errors.area ? "border-rose-500" : "border-pink-200"
                    }`}
                  />
                  {errors.area && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-rose-500" />
                    </div>
                  )}
                </div>
                {errors.area && <p className="text-sm text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.area}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-pink-500" />
                  Trạng thái
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "free" as const, label: "Trống", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
                    { value: "using" as const, label: "Đang sử dụng", color: "bg-rose-100 text-rose-700 border-rose-300" },
                    { value: "maintenance" as const, label: "Bảo trì", color: "bg-amber-100 text-amber-700 border-amber-300" },
                  ]).map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => handleChange("status", status.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        formData.status === status.value
                          ? `${status.color}`
                          : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Thiết bị */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Cpu size={16} className="text-pink-500" />
                Thiết bị trong phòng
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {equipmentOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEquipment(item.label)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      selectedEquipment.includes(item.label)
                        ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 text-pink-700"
                        : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedEquipment.includes(item.label)
                        ? "bg-pink-100 text-pink-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Thiết bị đã chọn:</p>
                {selectedEquipment.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEquipment.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-50 to-rose-50 text-gray-700 text-xs font-medium border border-pink-200"
                      >
                        {equipmentOptions.find(eq => eq.label === item)?.icon}
                        {item}
                        <button
                          type="button"
                          onClick={() => toggleEquipment(item)}
                          className="ml-1 hover:text-rose-600"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Chưa có thiết bị nào được chọn</p>
                )}
              </div>
            </div>

            {/* Row 5: Mô tả */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2 size={16} className="text-pink-500" />
                Mô tả phòng học
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                placeholder="Mô tả chi tiết về phòng học, vị trí, đặc điểm..."
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
                  setSelectedEquipment([]);
                  setErrors({});
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                Đặt lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer"
              >
                <Save size={16} />
                Tạo phòng học
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Page --------------------------------- */

export default function Page() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sort, setSort] = useState<SortState<Room>>({ key: null, direction: "asc" });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Gọi API để lấy danh sách phòng học
  useEffect(() => {
    async function fetchClassrooms() {
      try {
        setLoading(true);
        setError(null);

        const mapped = await fetchAdminRooms();
        setRooms(mapped);
      } catch (err) {
        console.error("Unexpected error when fetching admin classrooms:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách phòng học.");
        setRooms([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClassrooms();
  }, []);

  const toggleSort = (key: keyof Room) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
    setCurrentPage(1);
  };

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof Room;
    className?: string;
  }) => {
    const active = sort.key === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ${className ?? ""}`}
      >
        <span>{label}</span>
        {active ? (
          sort.direction === "asc" ? (
            <span aria-hidden>↑</span>
          ) : (
            <span aria-hidden>↓</span>
          )
        ) : (
          <span aria-hidden className="text-gray-300">↕</span>
        )}
      </button>
    );
  };

  const filteredRooms = useMemo(() => {
    let result = rooms;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((room) =>
        room.id.toLowerCase().includes(searchLower) ||
        room.equipment.some((eq) => eq.toLowerCase().includes(searchLower)) ||
        room.course?.toLowerCase().includes(searchLower) ||
        room.teacher?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((room) => room.status === statusFilter);
    }

    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [rooms, search, statusFilter, sort.key, sort.direction]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = filteredRooms.slice(startIndex, endIndex);

  const handleCreateRoom = (data: RoomFormData) => {
    // TODO: Gọi API để tạo phòng học mới
    console.log("Creating new room:", data);
    
    // Tạm thời thêm phòng học mới vào danh sách
    const newRoom: Room = {
      id: data.id,
      floor: data.floor,
      capacity: data.capacity,
      area: data.area,
      equipment: data.equipment,
      status: data.status,
      utilization: 0,
    };
    
    setRooms(prev => [newRoom, ...prev]);
    
    // Hiển thị thông báo thành công
    alert(`Đã tạo phòng học ${data.name} thành công!`);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <Building2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Quản lý phòng học
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Quản lý phòng học, lịch sử dụng và tài nguyên
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
              <Filter size={16} />
              Lọc
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              Thêm phòng mới
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ModernStatCard
            icon={<Building2 size={20} />}
            title="Tổng phòng học"
            value={`${rooms.length}`}
            subtitle={`${rooms.filter(r => r.status === "free").length} phòng trống`}
            color="blue"
          />

          <ModernStatCard
            icon={<Users size={20} />}
            title="Đang sử dụng"
            value={`${rooms.filter(r => r.status === "using").length}`}
            subtitle="Hoạt động hiện tại"
            trend={{ value: 12, isPositive: true }}
            color="emerald"
          />

          <ModernStatCard
            icon={<CheckCircle size={20} />}
            title="Sẵn sàng"
            value={`${rooms.filter(r => r.status === "free").length}`}
            subtitle="Có thể đặt lịch ngay"
            color="pink"
          />

          <ModernStatCard
            icon={<AlertTriangle size={20} />}
            title="Bảo trì"
            value={`${rooms.filter(r => r.status === "maintenance").length}`}
            subtitle="Đang sửa chữa"
            color="amber"
          />
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" size={16} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm kiếm phòng học, tầng, hoặc thiết bị..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-pink-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
                  className="appearance-none rounded-xl bg-white border border-pink-200 pl-4 pr-10 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200 cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="free">Trống</option>
                  <option value="using">Đang sử dụng</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid xl:grid-cols-[1fr_320px] gap-6">
          {/* Rooms Table */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách phòng học</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{filteredRooms.length} phòng học</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
                  <tr>
                    <th className="py-3 px-6 text-left"><SortHeader label="Phòng học" sortKey="id" /></th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Sức chứa" sortKey="capacity" /></th>
                    <th className="py-3 px-6 text-left"><span className="text-sm font-semibold text-gray-700">Thiết bị</span></th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Sử dụng" sortKey="utilization" /></th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Trạng thái" sortKey="status" /></th>
                    <th className="py-3 px-6 text-right"><span className="text-sm font-semibold text-gray-700">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100">
                  {currentRows.length > 0 ? (
                    currentRows.map((room) => (
                      <tr
                        key={room.id}
                        className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                              <Building2 size={18} className="text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{room.id}</div>
                              <div className="text-xs text-gray-500">Tầng {room.floor} • {room.area}m²</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 flex items-center justify-center border border-pink-200">
                              <span className="text-lg font-bold text-pink-700">{room.capacity}</span>
                            </div>
                            <span className="text-sm text-gray-600">người</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            {room.equipment.slice(0, 3).map((eq, i) => (
                              <EquipmentBadge key={i}>
                                {eq}
                              </EquipmentBadge>
                            ))}
                            {room.equipment.length > 3 && (
                              <EquipmentBadge>
                                +{room.equipment.length - 3}
                              </EquipmentBadge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <UtilizationRing value={room.utilization} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <StatusPill status={room.status} />
                            {room.course && (
                              <div className="text-xs text-gray-600 line-clamp-1">
                                {room.course}
                              </div>
                            )}
                            {room.schedule && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={10} className="text-gray-400" />
                                {room.schedule}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                            <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Xem chi tiết">
                              <Eye size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer" title="Chỉnh sửa">
                              <Pencil size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer " title="Thêm">
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                          <Search size={24} className="text-pink-400" />
                        </div>
                        <div className="text-gray-600 font-medium">Không tìm thấy phòng học</div>
                        <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc thêm phòng học mới</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer - Pagination */}
            {filteredRooms.length > 0 && (
              <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredRooms.length)}</span>
                    {' '}trong tổng số <span className="font-semibold text-gray-900">{filteredRooms.length}</span> phòng học
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    >
                      <ChevronsLeft size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                              : 'border border-pink-200 bg-white text-gray-700 hover:bg-pink-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    >
                      <ChevronsRight size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Lịch hôm nay</h3>
                    <p className="text-xs text-gray-600">Thứ 4, 15/01/2025</p>
                  </div>
                </div>
                <button className="text-xs text-pink-600 font-medium hover:text-pink-700 cursor-pointer">
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    time: "08:00 – 10:00",
                    room: "P101",
                    course: "IELTS Advanced",
                    teacher: "Ms. Sarah",
                    students: 28,
                    status: "Đang diễn ra",
                    statusColor: "bg-emerald-100 text-emerald-700"
                  },
                  {
                    time: "10:30 – 12:30",
                    room: "P103",
                    course: "TOEIC 800+",
                    teacher: "Mr. David",
                    students: 22,
                    status: "Sắp diễn ra",
                    statusColor: "bg-blue-100 text-blue-700"
                  },
                  {
                    time: "14:00 – 16:00",
                    room: "P201",
                    course: "Business English",
                    teacher: "Ms. Lisa",
                    students: 18,
                    status: "Sắp diễn ra",
                    statusColor: "bg-blue-100 text-blue-700"
                  },
                  {
                    time: "17:00 – 19:00",
                    room: "P202",
                    course: "Conversation Class",
                    teacher: "Mr. John",
                    students: 25,
                    status: "Đã lên lịch",
                    statusColor: "bg-gray-100 text-gray-700"
                  },
                ].map((event, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-pink-200 hover:border-pink-300 hover:shadow-sm transition-all group cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
                          <Clock size={12} className="text-pink-600" />
                        </div>
                        <div className="font-medium text-gray-900 text-xs">{event.time}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${event.statusColor}`}>
                        {event.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{event.room}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-xs truncate">{event.course}</div>
                          <div className="text-[10px] text-gray-600 truncate">{event.teacher}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-pink-100">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                          <Users size={12} />
                          <span>{event.students} học viên</span>
                        </div>
                        <ChevronRight size={12} className="text-gray-400 group-hover:text-pink-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="font-bold text-white mb-5 text-sm">Thống kê nhanh</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10">
                  <div className="text-xs">Phòng sử dụng nhiều nhất</div>
                  <div className="font-bold text-sm">P101 (85%)</div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10">
                  <div className="text-xs">Tổng giờ dạy hôm nay</div>
                  <div className="font-bold text-sm">28 giờ</div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10">
                  <div className="text-xs">Phòng trống sắp tới</div>
                  <div className="font-bold text-sm">P102 (12:30)</div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10">
                  <div className="text-xs">Tỷ lệ sử dụng TB</div>
                  <div className="font-bold text-sm">67%</div>
                </div>
              </div>

              <button className="w-full mt-5 py-2.5 rounded-xl bg-white text-pink-600 font-medium hover:bg-pink-50 transition-all cursor-pointer text-sm">
                Đặt lịch mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
      />
    </>
  );
}