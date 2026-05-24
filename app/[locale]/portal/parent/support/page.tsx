"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MessageSquare,
  Ticket as TicketIcon,
  Phone,
  Send,
  Headphones,
  HelpCircle,
  Clock,
  CheckCircle,
  Mail,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  Activity,
  X,
  FileText,
  User,
  Building2,
  Clock as ClockIcon,
  Reply,
  ThumbsUp,
  ArrowRight,
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
  Check,
} from "lucide-react";
import {
  getTickets,
  createTicket,
  getTicketById,
} from "@/lib/api/ticketService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getStudentClassesByToken } from "@/lib/api/studentService";
import { toast } from "@/hooks/use-toast";
import type {
  CreateTicket,
  Ticket,
  TicketCategory,
  TicketComment,
} from "@/types/student/ticket";
import type { StudentClass } from "@/types/student/class";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/lightswind/select";

type TabType = "feedback" | "tickets" | "contact";

type TicketType = CreateTicket["type"];

type TeacherOption = {
  optionKey: string;
  teacherId: string;
  teacherName: string;
  classId?: string;
  classLabel?: string;
};

type TicketCategoryOption = {
  id: TicketCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const SUPPORT_CATEGORIES = [
  { icon: <Calendar className="w-4 h-4" />, label: "Lịch học" },
  { icon: <Users className="w-4 h-4" />, label: "Giáo viên" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Kỹ thuật" },
  { icon: <Headphones className="w-4 h-4" />, label: "Học phí" },
  { icon: <HelpCircle className="w-4 h-4" />, label: "Khác" },
];

const CATEGORY_TO_TICKET: Record<string, TicketCategory> = {
  "Lịch học": "Schedule",
  "Giáo viên": "Homework",
  "Kỹ thuật": "Tech",
  "Học phí": "Finance",
  Khác: "Other",
};

const TICKET_CATEGORIES: TicketCategoryOption[] = [
  { id: "Homework", label: "Bài tập", icon: <FileText size={16} />, description: "Vấn đề về bài tập, tài liệu học tập" },
  { id: "Finance", label: "Học phí", icon: <Award size={16} />, description: "Thắc mắc về học phí, ưu đãi" },
  { id: "Schedule", label: "Lịch học", icon: <Calendar size={16} />, description: "Lịch học, nghỉ bù, thay đổi thời gian" },
  { id: "Tech", label: "Kỹ thuật", icon: <Activity size={16} />, description: "Lỗi phần mềm, thiết bị học tập" },
  { id: "Other", label: "Khác", icon: <HelpCircle size={16} />, description: "Các vấn đề khác" },
];

const normalizeClassItems = (response: any): StudentClass[] => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.classes?.items)) return data.classes.items;
  return [];
};

const normalizeTicketList = (response: any): Ticket[] => {
  const data = response?.data;
  const raw = Array.isArray(data)
    ? data
    : (data?.items ??
      data?.tickets?.items ??
      data?.data?.items ??
      data?.data ??
      []);
  return Array.isArray(raw) ? raw : [];
};

// Badge Component
function Badge({
  color = "gray",
  children,
}: {
  color?: "gray" | "red" | "green" | "blue" | "amber";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}

// Stat Card Component (giữ nguyên)
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "red",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  trend?: "up" | "down" | "stable";
  color?: "red" | "gray" | "black";
}) {
  const colorClasses = {
    red: "bg-gradient-to-r from-red-600 to-rose-600",
    gray: "bg-gradient-to-r from-emerald-600 to-teal-600",
    black: "bg-gradient-to-r from-blue-600 to-cyan-600",
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
      <div className="relative flex items-center gap-3 z-10">
        <div className={`rounded-xl ${colorClasses[color]} p-2.5 text-white flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <div className="text-sm  font-medium text-gray-600">{label}</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{value}</div>

        </div>
      </div>
    </div>
  );
}

// Enhanced Ticket Card Component
const TicketCard = ({ ticket, latestComment, formatDate, getCategoryLabel, getStatusBadge }: { 
  ticket: Ticket; 
  latestComment?: TicketComment; 
  formatDate: (date: string) => string; 
  getCategoryLabel: (category: string) => string; 
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = useMemo(() => {
    switch (ticket.status) {
      case "Open": case "open": return "open";
      case "InProgress": case "in_progress": return "in_progress";
      case "Resolved": case "resolved": case "Closed": case "closed": return "resolved";
      default: return "unknown";
    }
  }, [ticket.status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge color="gray">
              {getCategoryLabel(ticket.category)}
            </Badge>
            {getStatusBadge(status)}
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">
            {ticket.subject}
          </h4>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              Tạo: {formatDate(ticket.createdAt)}
            </span>
            {latestComment && (
              <span className="flex items-center gap-1">
                <Reply className="w-4 h-4 text-gray-500" />
                Phản hồi: {latestComment.message.substring(0, 50)}...
              </span>
            )}
            {status === "resolved" && (
              <span className="flex items-center gap-1 text-gray-700">
                <CheckCircle className="w-4 h-4 text-gray-600" />
                Cập nhật: {formatDate(ticket.updatedAt)}
              </span>
            )}
          </div>
          
          {/* Expandable section for latest comment */}
          {isExpanded && latestComment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-4 bg-white rounded-lg border border-red-100"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-red-50 rounded-full">
                  <Headphones size={14} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Phản hồi từ hỗ trợ:</p>
                  <p className="text-sm text-gray-700">{latestComment.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(latestComment.createdAt)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {latestComment && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <ChevronRight size={18} className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function SupportPage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>("feedback");
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [ticketType, setTicketType] = useState<TicketType>("General");
  const [selectedTeacherOptionKey, setSelectedTeacherOptionKey] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [latestComments, setLatestComments] = useState<Record<string, TicketComment>>({});
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const resolvedProfileId = useMemo(() =>
    selectedProfile?.id ||
    user?.selectedProfile?.id ||
    user?.profiles?.find((profile) => profile.profileType === "Student")?.id ||
    null,
  [selectedProfile, user]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!resolvedProfileId) {
        setClassId(null);
        setTeacherOptions([]);
        setSelectedTeacherOptionKey("");
        return;
      }

      try {
        const response: any = await getStudentClassesByToken({
          pageSize: 100,
          studentProfileId: resolvedProfileId,
        });

        if (response?.isSuccess || response?.success) {
          const classes = normalizeClassItems(response);
          setClassId(classes[0]?.id ?? null);

          const teachers = classes
            .filter((item) => item.mainTeacherId && item.mainTeacherName)
            .map((item, index) => ({
              optionKey: `${item.id ?? "class"}-${item.mainTeacherId ?? "teacher"}-${index}`,
              teacherId: item.mainTeacherId!,
              teacherName: item.mainTeacherName!,
              classId: item.id,
              classLabel: item.title || item.className || item.name || item.code,
            }));

          setTeacherOptions(teachers);
          setSelectedTeacherOptionKey((prev) => {
            if (teachers.length === 0) return "";
            if (teachers.some((teacher) => teacher.optionKey === prev)) return prev;
            return teachers[0].optionKey;
          });
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, [resolvedProfileId]);

  useEffect(() => {
    let alive = true;
    const fetchTickets = async () => {
      if (!resolvedProfileId) {
        setTickets([]);
        setLatestComments({});
        setTicketsLoading(false);
        return;
      }

      try {
        setTicketsLoading(true);
        const response = await getTickets({
          openedByProfileId: resolvedProfileId,
          pageSize: 100,
        });

        if (!alive) return;
        const allTickets = normalizeTicketList(response);
        const filtered = allTickets.filter(
          (ticket) => ticket.openedByProfileId === resolvedProfileId,
        );
        setTickets(filtered);

        const ticketsWithComments = filtered.filter(
          (ticket) => ticket.commentCount > 0,
        );
        if (ticketsWithComments.length > 0) {
          const results = await Promise.allSettled(
            ticketsWithComments.map((ticket) => getTicketById(ticket.id)),
          );

          if (!alive) return;
          const commentMap: Record<string, TicketComment> = {};
          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const detail = result.value as any;
              const comments: TicketComment[] =
                detail?.data?.comments ?? detail?.comments ?? [];
              if (comments.length > 0) {
                commentMap[ticketsWithComments[index].id] =
                  comments[comments.length - 1];
              }
            }
          });
          setLatestComments(commentMap);
        } else {
          setLatestComments({});
        }
      } catch (error) {
        console.error("Error loading tickets:", error);
      } finally {
        if (alive) {
          setTicketsLoading(false);
        }
      }
    };

    fetchTickets();
    return () => {
      alive = false;
    };
  }, [resolvedProfileId, activeTab]);

  const resetTicketForm = useCallback(() => {
    setSelectedCategory("");
    setSubject("");
    setMessage("");
    setTicketType("General");
    setSelectedTeacherOptionKey(teacherOptions[0]?.optionKey ?? "");
  }, [teacherOptions]);

  const handleSubmitTicket = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCategory) {
      toast.warning({ title: "Thiếu thông tin", description: "Vui lòng chọn danh mục." });
      return;
    }

    if (!subject.trim()) {
      toast.warning({ title: "Thiếu thông tin", description: "Vui lòng nhập tiêu đề." });
      return;
    }

    if (!message.trim()) {
      toast.warning({ title: "Thiếu thông tin", description: "Vui lòng nhập nội dung." });
      return;
    }

    if (ticketType === "DirectToTeacher" && !selectedTeacherOptionKey) {
      toast.warning({ title: "Thiếu thông tin", description: "Vui lòng chọn giáo viên nhận ticket." });
      return;
    }

    if (!resolvedProfileId || !user?.branchId) {
      toast.destructive({ title: "Không thể gửi ticket", description: "Thiếu thông tin học viên hoặc chi nhánh." });
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedTeacher = teacherOptions.find(
        (teacher) => teacher.optionKey === selectedTeacherOptionKey,
      );

      const payload: CreateTicket = {
        openedByProfileId: resolvedProfileId,
        branchId: user.branchId,
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        type: ticketType,
      };

      const classIdForTicket = ticketType === "DirectToTeacher" ? (selectedTeacher?.classId ?? classId) : classId;
      if (classIdForTicket) payload.classId = classIdForTicket;
      if (ticketType === "DirectToTeacher" && selectedTeacher?.teacherId) payload.assignedToUserId = selectedTeacher.teacherId;

      const response = await createTicket(payload);

      if (response.isSuccess) {
        toast.success({ title: "Gửi đơn thành công", description: "Yêu cầu của bạn đã được ghi nhận." });
        resetTicketForm();
        setActiveTab("tickets");
      } else {
        toast.destructive({ title: "Gửi đơn thất bại", description: response.message || "Không thể gửi đơn." });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.destructive({ title: "Lỗi hệ thống", description: "Có lỗi xảy ra khi gửi đơn." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendContactMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) {
      toast.warning({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ họ tên, số điện thoại và nội dung." });
      return;
    }
    toast.success({ title: "Đã ghi nhận", description: "Bộ phận hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất." });
    setContactName("");
    setContactPhone("");
    setContactMessage("");
  };

  const mapStatus = (status?: string) => {
    switch (status) {
      case "Open": case "open": return "open";
      case "InProgress": case "in_progress": return "in_progress";
      case "Resolved": case "resolved": case "Closed": case "closed": return "resolved";
      default: return "unknown";
    }
  };

  const getCategoryLabel = (category: string) => {
    const item = TICKET_CATEGORIES.find(c => c.id === category);
    return item?.label || category;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge color="amber">Mới tạo</Badge>;
      case "resolved": return <Badge color="green">Đã giải quyết</Badge>;
      case "in_progress": return <Badge color="blue">Đang xử lý</Badge>;
      default: return <Badge color="gray">Chưa xử lý</Badge>;
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const status = mapStatus(ticket.status);
      const matchesFilter = filterStatus === "all" || status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [tickets, searchTerm, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2 space-y-6">
      {/* Header - Giữ nguyên */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Headphones className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
              Hỗ trợ phụ huynh
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Gửi phản hồi, theo dõi yêu cầu và liên hệ trực tiếp với trung tâm
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer text-gray-700">
            <HelpCircle size={16} className="text-red-600" /> Hướng dẫn
          </button>
        </div>
      </div>

      {/* Stats Cards - Giữ nguyên */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Clock size={20} />}
          label="Đang xử lý"
          value={String(tickets.filter((ticket) => {
            const status = mapStatus(ticket.status);
            return status === "open" || status === "in_progress";
          }).length)}
          hint=""
          trend="up"
          color="red"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Đã giải quyết"
          value={String(tickets.filter((ticket) => mapStatus(ticket.status) === "resolved").length)}
          hint=""
          trend="stable"
          color="gray"
        />
        <StatCard
          icon={<Send size={20} />}
          label="Tổng ticket"
          value={String(tickets.length)}
          hint=""
          trend="down"
          color="black"
        />
      </div>

      {/* Tabs - Nâng cấp với animation */}
      <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-1 flex gap-1">
        {[
          { key: "feedback" as TabType, label: "Gửi đơn hỗ trợ", icon: MessageSquare },
          { key: "tickets" as TabType, label: "Lịch sử đơn hỗ trợ", icon: TicketIcon },
          { key: "contact" as TabType, label: "Liên hệ", icon: Phone },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content with animations */}
      <AnimatePresence mode="wait">
        {activeTab === "feedback" && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-red-100 to-rose-100 rounded-xl border border-red-200">
                  <MessageSquare className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Gửi đơn hỗ trợ cho Rex
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {SUPPORT_CATEGORIES.map((category) => {
                      const isActive = CATEGORY_TO_TICKET[category.label] === selectedCategory;
                      return (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          key={category.label}
                          onClick={() => setSelectedCategory(CATEGORY_TO_TICKET[category.label] ?? "Other")}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${
                            isActive
                              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md border-transparent"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className={isActive ? "text-white" : "text-gray-600"}>
                            {category.icon}
                          </div>
                          <span>{category.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chủ đề
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Nhập chủ đề phản hồi..."
                      className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại hỗ trợ
                    </label>
                    <Select value={ticketType} onValueChange={(value) => setTicketType(value as TicketType)}>
                      <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white focus:ring-2 focus:ring-red-200 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">Gửi trung tâm</SelectItem>
                        <SelectItem value="DirectToTeacher">Gửi trực tiếp giáo viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {ticketType === "DirectToTeacher" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giáo viên nhận đơn
                    </label>
                    <Select value={selectedTeacherOptionKey} onValueChange={setSelectedTeacherOptionKey}>
                      <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white focus:ring-2 focus:ring-red-200 text-gray-900">
                        <SelectValue placeholder="Chọn giáo viên" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.map((teacher) => (
                          <SelectItem key={teacher.optionKey} value={teacher.optionKey}>
                            {teacher.teacherName}
                            {teacher.classLabel ? ` - ${teacher.classLabel}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {teacherOptions.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        Chưa tìm thấy giáo viên chủ nhiệm trong lớp hiện tại.
                      </p>
                    )}
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung phản hồi
                  </label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Chia sẻ ý kiến, góp ý của bạn về lớp học, giáo viên hoặc dịch vụ..."
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent resize-none text-gray-900"
                  />
                </div>

                <div className="p-4 rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <div className="font-semibold text-gray-900 mb-1">
                        Phản hồi sẽ được xử lý trong 24h
                      </div>
                      <p>
                        Chúng tôi cam kết phản hồi tất cả ý kiến của phụ huynh
                        trong thời gian sớm nhất.
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === "tickets" && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                    <TicketIcon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Đơn hỗ trợ
                    </h3>
                    <p className="text-sm text-gray-600">
                      Theo dõi các yêu cầu hỗ trợ của bạn
                    </p>
                  </div>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  >
                    <option value="all">Tất cả</option>
                    <option value="open">Mới tạo</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {ticketsLoading && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-red-600 mx-auto mb-3" />
                    Đang tải danh sách đơn hỗ trợ...
                  </div>
                )}

                {!ticketsLoading && tickets.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Chưa có đơn hỗ trợ nào cho học viên được chọn.
                  </div>
                )}

                {!ticketsLoading && filteredTickets.length === 0 && tickets.length > 0 && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Không tìm thấy đơn hỗ trợ phù hợp.
                  </div>
                )}

                {!ticketsLoading && filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    latestComment={latestComments[ticket.id]}
                    formatDate={formatDate}
                    getCategoryLabel={getCategoryLabel}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6"
          >
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl border border-amber-200">
                  <TicketIcon className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Thông tin liên hệ
                  </h3>
                  <p className="text-sm text-gray-600">
                    Liên hệ trực tiếp với trung tâm
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 hover:border-red-200 transition-all"
                >
                  <div className="p-2 bg-gradient-to-r from-red-100 to-rose-100 rounded-lg">
                    <Phone className="w-5 h-5 text-red-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Hotline hỗ trợ</div>
                    <div className="text-sm  text-gray-900">
                      0867405801
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 hover:border-red-200 transition-all"
                >
                  <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Email hỗ trợ</div>
                    <div className="text-sm  text-gray-900">
                      Tearexenglish@gmail.com
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 hover:border-red-200 transition-all"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Địa chỉ</div>
                    <div className="text-sm  text-gray-900">
                      S302, Vinhomes Grand Park, Q9, Tp.Thủ Đức
                    </div>
                  </div>
                </motion.div>

                <div className="md:col-span-2 p-4 rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50">
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    Giờ làm việc
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Thứ 2 - Thứ 6: 8:00 - 18:00</div>
                    <div>Thứ 7: 8:00 - 12:00</div>
                    <div>Chủ nhật: Nghỉ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                  <MessageSquare className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Để lại lời nhắn
                  </h3>
                  <p className="text-sm text-gray-600">
                    Chúng tôi sẽ liên hệ lại trong 24h
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendContactMessage} className="space-y-4">
                <input
                  type="text"
                  placeholder="Họ tên của bạn"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
                />
                <textarea
                  placeholder="Nội dung cần hỗ trợ..."
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent resize-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                  Gửi liên hệ
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
    </div>
  );
}