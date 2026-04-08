"use client";

import { 
  Search, Eye, Pencil, Clock, Users, Building2, AlertTriangle, 
  Plus, Filter, Calendar, ChevronRight, MoreVertical, CheckCircle, 
  XCircle, ChevronLeft, ChevronsLeft, ChevronsRight, X, Tag, 
  MapPin,
  AlertCircle, Save, RotateCcw, Power, PowerOff
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { fetchAdminRooms, createAdminRoom, updateAdminRoom, fetchAdminRoomDetail, toggleRoomStatus } from "@/app/api/admin/rooms";
import { fetchClassFormSelectData } from "@/app/api/admin/classFormData";
import { fetchAdminSessions } from "@/app/api/admin/sessions";
import { todayDateOnly, dateOnlyVN } from "@/lib/datetime";
import type { Room, Status as RoomStatus, CreateRoomRequest } from "@/types/admin/rooms";
import type { SelectOption } from "@/types/admin/classFormData";
import type { Session } from "@/types/admin/sessions";
import { useToast } from "@/hooks/use-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { useBranchFilter } from "@/hooks/useBranchFilter";

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
type Status = "active" | "inactive";

function StatusPill({ status }: { status: Status }) {
  const map = {
    active: {
      text: "Hoạt động",
      bg: "bg-gradient-to-r from-green-600 to-green-700",
      icon: <CheckCircle size={12} />,
      textColor: "text-white"
    },
    inactive: {
      text: "Không hoạt động",
      bg: "bg-gradient-to-r from-gray-600 to-gray-800",
      icon: <XCircle size={12} />,
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-50 to-red-100 text-gray-700 text-xs font-medium border border-red-200">
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
          className="text-gray-200"
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
          className={`text-red-600 transition-all duration-1000 ${clamped > 70 ? 'text-red-700' : clamped > 30 ? 'text-gray-700' : 'text-gray-600'}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{clamped}%</span>
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
  color = "red"
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  color?: "red" | "gray" | "black" | "green";
}) {
  const colorClasses = {
    red: "from-red-600 to-red-700",
    gray: "from-gray-600 to-gray-700",
    black: "from-gray-800 to-gray-900",
    green: "from-green-600 to-green-700",
  };

  const bgClasses = {
    red: "bg-red-100",
    gray: "bg-gray-100",
    black: "bg-black/10",
    green: "bg-green-100",
  };

  const textClasses = {
    red: "text-red-600",
    gray: "text-gray-600",
    black: "text-gray-800",
    green: "text-green-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:shadow-xl hover:shadow-red-100/50 cursor-pointer">
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
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-100 text-gray-700'
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
  mode?: "create" | "edit";
  initialData?: RoomFormData | null;
}

interface RoomFormData {
  branchId: string;
  name: string;
  capacity: number;
  note: string;
  status: Status;
}

const initialFormData: RoomFormData = {
  branchId: "",
  name: "",
  capacity: 30,
  note: "",
  status: "active",
};

function CreateRoomModal({ isOpen, onClose, onSubmit, mode = "create", initialData }: CreateRoomModalProps) {
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({});
  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
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

  const fetchSelectData = async () => {
    try {
      setLoadingOptions(true);
      const data = await fetchClassFormSelectData();
      setBranchOptions(data.branches);
    } catch (err) {
      console.error("Failed to fetch select data:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
      } else {
      setFormData(initialFormData);
      }
      setErrors({});
      fetchSelectData();
    }
  }, [isOpen, mode, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RoomFormData, string>> = {};
    
    if (!formData.branchId) newErrors.branchId = "Chi nhánh là bắt buộc";
    if (!formData.name.trim()) newErrors.name = "Tên phòng là bắt buộc";
    if (formData.capacity <= 0) newErrors.capacity = "Sức chứa phải lớn hơn 0";

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

  const handleChange = (field: keyof RoomFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật phòng học" : "Thêm phòng học mới"}
                </h2>
                <p className="text-sm text-red-100">
                  {mode === "edit" ? "Chỉnh sửa thông tin phòng học" : "Nhập thông tin chi tiết về phòng học"}
                </p>
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
            {/* Row 1: Chi nhánh & Tên phòng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-red-600" />
                  Chi nhánh *
                </label>
                <div className="relative">
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    disabled={loadingOptions}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.branchId ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">{loadingOptions ? "Đang tải..." : "Chọn chi nhánh"}</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-red-600" />
                  Tên phòng *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="VD: Phòng học đa năng, Lab CNTT..."
                  />
                  {errors.name && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
              </div>
            </div>

            {/* Row 2: Sức chứa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} className="text-red-600" />
                  Sức chứa *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all ${
                      errors.capacity ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.capacity && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.capacity && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.capacity}</p>}
              </div>
            </div>

            {/* Row 3: Trạng thái (chỉ hiển thị khi edit) */}
            {mode === "edit" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CheckCircle size={16} className="text-red-600" />
                  Trạng thái
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["active", "inactive"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleChange("status", status)}
                      className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        formData.status === status
                          ? status === "active"
                            ? "bg-green-100 border-green-300 text-green-700"
                            : "bg-gray-200 border-gray-400 text-gray-800"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 4: Ghi chú */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2 size={16} className="text-red-600" />
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                placeholder="Ghi chú về phòng học, thiết bị, đặc điểm..."
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (mode === "edit" && initialData) {
                    setFormData(initialData);
                  } else {
                  setFormData(initialFormData);
                  }
                  setErrors({});
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                {mode === "edit" ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                <Save size={16} />
                {mode === "edit" ? "Lưu thay đổi" : "Tạo phòng học"}
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
  const { toast } = useToast();
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sort, setSort] = useState<SortState<Room>>({ key: null, direction: "asc" });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<RoomFormData | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [originalRoomStatus, setOriginalRoomStatus] = useState<Status | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Fetch rooms with branch filter
  useEffect(() => {
    if (!isLoaded) return;

    async function fetchClassrooms() {
      try {
        setLoading(true);
        setError(null);

        const branchId = getBranchQueryParam();
        console.log("🏫 Fetching rooms for branch:", branchId || "All branches");

        const mapped = await fetchAdminRooms({ branchId });
        setRooms(mapped);
        console.log("✅ Loaded", mapped.length, "rooms");
      } catch (err) {
        console.error("Unexpected error when fetching admin classrooms:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách phòng học.");
        setRooms([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClassrooms();
    setCurrentPage(1);
  }, [selectedBranchId, isLoaded]);

  // Fetch today's sessions
  useEffect(() => {
    async function fetchTodaySessions() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessions = await fetchAdminSessions({
          from: today.toISOString(),
          to: tomorrow.toISOString(),
          pageNumber: 1,
          pageSize: 100,
        });

        // Filter sessions for today only
        const todayKey = todayDateOnly();
        const todayOnly = sessions.filter((s: Session) => {
          const sessionDate = new Date(s.plannedDatetime);
          const sessionKey = dateOnlyVN(sessionDate);
          return sessionKey === todayKey;
        });

        // Sort by time
        todayOnly.sort((a, b) => {
          const timeA = new Date(a.plannedDatetime).getTime();
          const timeB = new Date(b.plannedDatetime).getTime();
          return timeA - timeB;
        });

        setTodaySessions(todayOnly);
      } catch (err) {
        console.error("Failed to fetch today's sessions:", err);
        setTodaySessions([]);
      }
    }

    fetchTodaySessions();
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
        room.name.toLowerCase().includes(searchLower) ||
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

  const handleCreateRoom = async (data: RoomFormData) => {
    try {
      const payload: CreateRoomRequest = {
        branchId: data.branchId,
        name: data.name,
        capacity: data.capacity,
        note: data.note || undefined,
      };

      const created = await createAdminRoom(payload);

      const branchId = getBranchQueryParam();
      const updatedRooms = await fetchAdminRooms({ branchId });
      setRooms(updatedRooms);

      toast({
        title: "Thành công",
        description: `Đã tạo phòng học ${data.name} thành công!`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to create room:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tạo phòng học. Vui lòng thử lại.",
        type: "destructive",
      });
    }
  };

  const handleOpenEditRoom = (room: Room) => {
    setIsEditModalOpen(true);
    setEditingRoomId(room.id);

    const formData: RoomFormData = {
      branchId: room.branchId ?? "",
      name: room.name,
      capacity: room.capacity,
      note: room.equipment.join(", "),
      status: room.status,
    };

    setEditingInitialData(formData);
    setOriginalRoomStatus(room.status);
  };

  const handleUpdateRoom = async (data: RoomFormData) => {
    if (!editingRoomId) return;
    try {
      const payload: CreateRoomRequest = {
        branchId: data.branchId,
        name: data.name,
        capacity: data.capacity,
        note: data.note || undefined,
      };

      // Cập nhật thông tin phòng học
      await updateAdminRoom(editingRoomId, payload);

      // Nếu trạng thái thay đổi giữa "active" và "inactive", gọi toggle-status API
      if (originalRoomStatus !== null && data.status !== originalRoomStatus) {
        // toggle-status API chỉ hỗ trợ chuyển đổi giữa active và inactive
        if (
          (data.status === "active" && originalRoomStatus === "inactive") ||
          (data.status === "inactive" && originalRoomStatus === "active")
        ) {
          await toggleRoomStatus(editingRoomId);
        }
      }

      const updatedRooms = await fetchAdminRooms();
      setRooms(updatedRooms);

      toast({
        title: "Thành công",
        description: `Đã cập nhật phòng học ${data.name} thành công!`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to update room:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể cập nhật phòng học. Vui lòng thử lại.",
        type: "destructive",
      });
    } finally {
      setEditingRoomId(null);
      setEditingInitialData(null);
      setOriginalRoomStatus(null);
    }
  };

  // Helper functions for today's schedule
  const formatTimeRange = (plannedDatetime: string, durationMinutes: number): string => {
    const start = new Date(plannedDatetime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const sh = String(start.getHours()).padStart(2, "0");
    const sm = String(start.getMinutes()).padStart(2, "0");
    const eh = String(end.getHours()).padStart(2, "0");
    const em = String(end.getMinutes()).padStart(2, "0");
    return `${sh}:${sm} – ${eh}:${em}`;
  };

  const getSessionStatus = (session: Session): { status: string; statusColor: string } => {
    const now = new Date();
    const start = new Date(session.plannedDatetime);
    const end = new Date(start.getTime() + session.durationMinutes * 60 * 1000);

    if (now >= start && now <= end) {
      return { status: "Đang diễn ra", statusColor: "bg-red-100 text-red-700" };
    } else if (now < start) {
      const minutesUntilStart = Math.floor((start.getTime() - now.getTime()) / (1000 * 60));
      if (minutesUntilStart <= 30) {
        return { status: "Sắp diễn ra", statusColor: "bg-gray-100 text-gray-700" };
      }
      return { status: "Đã lên lịch", statusColor: "bg-gray-100 text-gray-700" };
    } else {
      return { status: "Đã kết thúc", statusColor: "bg-gray-100 text-gray-500" };
    }
  };

  const formatTodayDate = (): string => {
    const today = new Date();
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const dayName = days[today.getDay()];
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  };

  const handleViewDetail = async (room: Room) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      setSelectedRoomDetail(null);

      const detail = await fetchAdminRoomDetail(room.id);
      setSelectedRoomDetail(detail);
    } catch (err: any) {
      console.error("Failed to load room detail:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tải thông tin chi tiết phòng học.",
        type: "destructive",
      });
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = (room: Room) => {
    setSelectedRoom(room);
    setShowToggleStatusModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentRows.map(row => row.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const confirmToggleStatus = async () => {
    if (!selectedRoom) return;

    // Xác định trạng thái mới dựa trên trạng thái hiện tại
    const currentStatus = selectedRoom.status;
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const actionText = newStatus === "active" ? "kích hoạt" : "tạm dừng";

    try {
      setIsTogglingStatus(true);
      await toggleRoomStatus(selectedRoom.id);
      
      // Cập nhật danh sách
      const updatedRooms = await fetchAdminRooms();
      setRooms(updatedRooms);
      
      toast({
        title: "Thành công",
        description: `Đã ${actionText} phòng học "${selectedRoom.name}" thành công!`,
        type: "success",
      });
      
      setShowToggleStatusModal(false);
      setSelectedRoom(null);
    } catch (err: any) {
      console.error("Failed to toggle room status:", err);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể thay đổi trạng thái phòng học. Vui lòng thử lại.",
        type: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <Building2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Quản lý phòng học
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Quản lý phòng học, lịch sử dụng và tài nguyên
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer">
              <Filter size={16} />
              Lọc
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              Thêm phòng mới
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <ModernStatCard
            icon={<Building2 size={20} />}
            title="Tổng phòng học"
            value={`${rooms.length}`}
            subtitle={`${rooms.filter(r => r.status === "active").length} phòng hoạt động`}
            color="red"
          />

          <ModernStatCard
            icon={<CheckCircle size={20} />}
            title="Hoạt động"
            value={`${rooms.filter(r => r.status === "active").length}`}
            subtitle="Sẵn sàng sử dụng"
            trend={{ value: 12, isPositive: true }}
            color="green"
          />

          <ModernStatCard
            icon={<Users size={20} />}
            title="Tổng sức chứa"
            value={`${rooms.reduce((acc, r) => acc + r.capacity, 0)}`}
            subtitle="chỗ ngồi"
            color="gray"
          />

          <ModernStatCard
            icon={<XCircle size={20} />}
            title="Không hoạt động"
            value={`${rooms.filter(r => r.status === "inactive").length}`}
            subtitle="Tạm dừng"
            color="black"
          />
        </div>

        {/* Branch Filter Indicator */}
        {selectedBranchId && (
          <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Building2 size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Đang lọc theo chi nhánh đã chọn
            </span>
          </div>
        )}

        {/* Search and Filter */}
        <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm kiếm phòng học, tầng, hoặc thiết bị..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
                  className="appearance-none rounded-xl bg-white border border-gray-200 pl-4 pr-10 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`grid xl:grid-cols-[1fr_320px] gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Rooms Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Danh sách phòng học</h2>
                  {selectedRows.length > 0 && (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      {selectedRows.length} đã chọn
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{filteredRooms.length} phòng học</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={currentRows.length > 0 && selectedRows.length === currentRows.length}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Phòng học" sortKey="id" /></th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Chi nhánh" sortKey="branch" /></th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Sức chứa" sortKey="capacity" /></th>
                    <th className="py-3 px-6 text-left"><span className="text-sm font-semibold text-gray-700">Thiết bị</span></th>
                    <th className="py-3 px-6 text-left"><SortHeader label="Trạng thái" sortKey="status" /></th>
                    <th className="py-3 px-6 text-right"><span className="text-sm font-semibold text-gray-700">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentRows.length > 0 ? (
                    currentRows.map((room) => (
                      <tr
                        key={room.id}
                        className={`group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 ${selectedRows.includes(room.id) ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(room.id)}
                            onChange={() => toggleSelectRow(room.id)}
                            className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center">
                              <Building2 size={18} className="text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{room.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="truncate">{room.branch}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-50 to-red-100 flex items-center justify-center border border-red-200">
                              <span className="text-lg font-bold text-red-700">{room.capacity}</span>
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
                            <button 
                              onClick={() => handleViewDetail(room)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer" 
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenEditRoom(room)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(room)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                room.status === "active"
                                  ? "hover:bg-red-50 text-gray-400 hover:text-red-600"
                                  : "hover:bg-green-50 text-gray-400 hover:text-green-600"
                              }`}
                              title={room.status === "active" ? "Tạm dừng phòng học" : "Kích hoạt phòng học"}
                            >
                              {room.status === "active" ? <PowerOff size={14} /> : <Power size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                          <Search size={24} className="text-gray-400" />
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
              <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredRooms.length)}</span>
                    {' '}trong tổng số <span className="font-semibold text-gray-900">{filteredRooms.length}</span> phòng học
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: (number | string)[] = [];
                        const maxVisible = 7;

                        if (totalPages <= maxVisible) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          if (currentPage <= 3) {
                            for (let i = 1; i <= 5; i++) pages.push(i);
                            pages.push("...");
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            pages.push(1);
                            pages.push("...");
                            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            pages.push("...");
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                            pages.push("...");
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => typeof p === "number" && setCurrentPage(p)}
                            disabled={p === "..."}
                            className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                              p === currentPage
                                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                                : p === "..."
                                ? "cursor-default text-gray-400"
                                : "border border-red-200 hover:bg-red-50 text-gray-700"
                            }`}
                          >
                            {p}
                          </button>
                        ));
                      })()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Lịch hôm nay</h3>
                    <p className="text-xs text-gray-600">{formatTodayDate()}</p>
                  </div>
                </div>
                <button className="text-xs text-red-600 font-medium hover:text-red-700 cursor-pointer">
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-2">
                {todaySessions.length > 0 ? (
                  todaySessions.map((session) => {
                    const timeRange = formatTimeRange(session.plannedDatetime, session.durationMinutes);
                    const { status, statusColor } = getSessionStatus(session);
                    const roomName = session.plannedRoomName ?? session.roomName ?? "Chưa có phòng";
                    const courseName = session.classTitle ?? session.className ?? "Buổi học";
                    const teacherName = session.plannedTeacherName ?? session.teacherName ?? "Chưa phân công";

                    return (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group cursor-pointer bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="p-1 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                              <Clock size={12} className="text-red-600" />
                            </div>
                            <div className="font-medium text-gray-900 text-xs">{timeRange}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">{roomName.substring(0, 4)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-xs truncate">{courseName}</div>
                              <div className="text-[10px] text-gray-600 truncate">{teacherName}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                              <MapPin size={12} />
                              <span className="truncate">{roomName}</span>
                            </div>
                            <ChevronRight size={12} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-xl mb-2">
                      <Calendar size={20} className="text-red-600" />
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Không có lịch học hôm nay</div>
                    <div className="text-xs text-gray-500 mt-1">Tất cả phòng học đều trống</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white shadow-lg">
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

              <button className="w-full mt-5 py-2.5 rounded-xl bg-white text-red-600 font-medium hover:bg-red-50 transition-all cursor-pointer text-sm">
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
        mode="create"
        initialData={null}
      />

      {/* Edit Room Modal */}
      <CreateRoomModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRoomId(null);
          setEditingInitialData(null);
          setOriginalRoomStatus(null);
        }}
        onSubmit={handleUpdateRoom}
        mode="edit"
        initialData={editingInitialData}
      />

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Building2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết phòng học</h2>
                    <p className="text-sm text-red-100">Thông tin chi tiết về phòng học</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRoomDetail(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : selectedRoomDetail ? (
                <div className="space-y-6">
                  {/* Tên phòng và Chi nhánh */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Tag size={16} className="text-red-600" />
                        Tên phòng học
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedRoomDetail.name || "Chưa có thông tin"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MapPin size={16} className="text-red-600" />
                        Chi nhánh
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedRoomDetail.branchName || selectedRoomDetail.branch?.name || "Chưa có chi nhánh"}
                      </div>
                    </div>
                  </div>

                  {/* Sức chứa và Trạng thái */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Users size={16} className="text-red-600" />
                        Sức chứa
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedRoomDetail.capacity ? `${selectedRoomDetail.capacity} người` : "Chưa có thông tin"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <CheckCircle size={16} className="text-red-600" />
                        Trạng thái
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                        <StatusPill status={selectedRoomDetail.isActive === false ? "inactive" : "active"} />
                      </div>
                    </div>
                  </div>

                  {/* Ghi chú / Thiết bị */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Building2 size={16} className="text-red-600" />
                      Ghi chú / Thiết bị
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 min-h-[80px]">
                      {selectedRoomDetail.note ? (
                        <div className="space-y-2">
                          <p>{selectedRoomDetail.note}</p>
                          {selectedRoomDetail.equipment && Array.isArray(selectedRoomDetail.equipment) && selectedRoomDetail.equipment.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {selectedRoomDetail.equipment.map((eq: string, i: number) => (
                                <EquipmentBadge key={i}>{eq}</EquipmentBadge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Chưa có ghi chú</p>
                      )}
                    </div>
                  </div>


                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Không có dữ liệu để hiển thị
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRoomDetail(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={showToggleStatusModal}
        onClose={() => {
          setShowToggleStatusModal(false);
          setSelectedRoom(null);
        }}
        onConfirm={confirmToggleStatus}
        title={selectedRoom?.status === "active" ? "Xác nhận tạm dừng phòng học" : "Xác nhận kích hoạt phòng học"}
        message={
          selectedRoom?.status === "active"
            ? `Bạn có chắc chắn muốn tạm dừng phòng học "${selectedRoom?.name}"? Phòng học sẽ không còn sử dụng được sau khi tạm dừng.`
            : `Bạn có chắc chắn muốn kích hoạt phòng học "${selectedRoom?.name}"? Phòng học sẽ được kích hoạt và có thể sử dụng ngay.`
        }
        confirmText={selectedRoom?.status === "active" ? "Tạm dừng" : "Kích hoạt"}
        cancelText="Hủy"
        variant={selectedRoom?.status === "active" ? "warning" : "success"}
        isLoading={isTogglingStatus}
      />
    </>
  );
}