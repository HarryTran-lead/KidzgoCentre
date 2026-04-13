"use client";

import { useState, useEffect } from "react";
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
  { id: "Homework", label: "Bài tập" },
  { id: "Finance", label: "Học phí" },
  { id: "Schedule", label: "Lịch học" },
  { id: "Tech", label: "Kỹ thuật" },
  { id: "Other", label: "Khác" },
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

// Stat Card Component
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
    red: "bg-linear-to-r from-red-600 to-red-700",
    gray: "bg-linear-to-r from-gray-600 to-gray-700",
    black: "bg-linear-to-r from-gray-800 to-gray-900",
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div
            className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}
          >
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && (
              <TrendingUp size={12} className="rotate-180" />
            )}
            {trend === "stable" && <Activity size={12} />}
            {hint}
          </div>
        </div>
        <div
          className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>("feedback");
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | "">(
    "",
  );
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
  const [latestComments, setLatestComments] = useState<
    Record<string, TicketComment>
  >({});
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedProfileId =
    selectedProfile?.id ||
    user?.selectedProfile?.id ||
    user?.profiles?.find((profile) => profile.profileType === "Student")?.id ||
    null;

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
              classLabel:
                item.title || item.className || item.name || item.code,
            }));

          setTeacherOptions(teachers);
          setSelectedTeacherOptionKey((prev) => {
            if (teachers.length === 0) return "";
            if (teachers.some((teacher) => teacher.optionKey === prev))
              return prev;
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

  const resetTicketForm = () => {
    setSelectedCategory("");
    setSubject("");
    setMessage("");
    setTicketType("General");
    setSelectedTeacherOptionKey(teacherOptions[0]?.optionKey ?? "");
  };

  const handleSubmitTicket = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCategory) {
      toast.warning({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn danh mục.",
      });
      return;
    }

    if (!subject.trim()) {
      toast.warning({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tiêu đề.",
      });
      return;
    }

    if (!message.trim()) {
      toast.warning({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập nội dung.",
      });
      return;
    }

    if (ticketType === "DirectToTeacher" && !selectedTeacherOptionKey) {
      toast.warning({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn giáo viên nhận ticket.",
      });
      return;
    }

    if (!resolvedProfileId || !user?.branchId) {
      toast.destructive({
        title: "Không thể gửi ticket",
        description:
          "Thiếu thông tin học viên hoặc chi nhánh. Vui lòng tải lại trang.",
      });
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

      const classIdForTicket =
        ticketType === "DirectToTeacher"
          ? (selectedTeacher?.classId ?? classId)
          : classId;

      if (classIdForTicket) {
        payload.classId = classIdForTicket;
      }

      if (ticketType === "DirectToTeacher" && selectedTeacher?.teacherId) {
        payload.assignedToUserId = selectedTeacher.teacherId;
      }

      const response = await createTicket(payload);

      if (response.isSuccess) {
        toast.success({
          title: "Gửi đơn thành công",
          description: "Yêu cầu của bạn đã được ghi nhận.",
        });
        resetTicketForm();
        setActiveTab("tickets");
      } else {
        toast.destructive({
          title: "Gửi đơn thất bại",
          description:
            response.message || "Không thể gửi đơn. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.destructive({
        title: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi gửi đơn.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendContactMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) {
      toast.warning({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ họ tên, số điện thoại và nội dung.",
      });
      return;
    }

    toast.success({
      title: "Đã ghi nhận",
      description:
        "Bộ phận hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất.",
    });

    setContactName("");
    setContactPhone("");
    setContactMessage("");
  };

  const mapStatus = (status?: string) => {
    switch (status) {
      case "Open":
      case "open":
        return "open";
      case "InProgress":
      case "in_progress":
        return "in_progress";
      case "Resolved":
      case "resolved":
      case "Closed":
      case "closed":
        return "resolved";
      default:
        return "unknown";
    }
  };

  const getCategoryLabel = (category: string) => {
    const item = TICKET_CATEGORIES.find(
      (ticketCategory) => ticketCategory.id === category,
    );
    return item?.label || category;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge color="amber">Mới tạo</Badge>;
      case "resolved":
        return <Badge color="green">Đã giải quyết</Badge>;
      case "in_progress":
        return <Badge color="blue">Đang xử lý</Badge>;
      default:
        return <Badge color="gray">Chưa xử lý</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    if (priority === "high") {
      return <Badge color="red">Ưu tiên cao</Badge>;
    }
    return <Badge color="gray">Ưu tiên</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Headphones className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Hỗ trợ phụ huynh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gửi phản hồi, theo dõi yêu cầu và liên hệ trực tiếp với trung tâm
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer text-gray-700">
            <HelpCircle size={16} className="text-gray-600" /> Hướng dẫn
          </button>
        </div>
      </div>

      {/* Stats Cards - Redesigned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Clock size={20} />}
          label="Đang xử lý"
          value={String(
            tickets.filter((ticket) => {
              const status = mapStatus(ticket.status);
              return status === "open" || status === "in_progress";
            }).length,
          )}
          hint=""
          trend="up"
          color="red"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Đã giải quyết"
          value={String(
            tickets.filter((ticket) => mapStatus(ticket.status) === "resolved")
              .length,
          )}
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1 flex gap-1">
        {[
          {
            key: "feedback" as TabType,
            label: "Gửi đơn hỗ trợ",
            icon: MessageSquare,
          },
          {
            key: "tickets" as TabType,
            label: "Lịch sử đơn hỗ trợ",
            icon: TicketIcon,
          },
          { key: "contact" as TabType, label: "Liên hệ", icon: Phone },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Gửi đơn hỗ trợ cho Kidzgo
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
                    const isActive =
                      CATEGORY_TO_TICKET[category.label] === selectedCategory;

                    return (
                      <button
                        type="button"
                        key={category.label}
                        onClick={() =>
                          setSelectedCategory(
                            CATEGORY_TO_TICKET[category.label] ?? "Other",
                          )
                        }
                        className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          isActive
                            ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md border-transparent"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={isActive ? "text-white" : "text-gray-600"}
                        >
                          {category.icon}
                        </div>
                        <span>{category.label}</span>
                      </button>
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại hỗ trợ
                  </label>
                  <select
                    value={ticketType}
                    onChange={(event) =>
                      setTicketType(event.target.value as TicketType)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                  >
                    <option value="General">Gửi trung tâm</option>
                    <option value="DirectToTeacher">
                      Gửi trực tiếp giáo viên
                    </option>
                  </select>
                </div>
              </div>

              {ticketType === "DirectToTeacher" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giáo viên nhận đơn
                  </label>
                  <select
                    value={selectedTeacherOptionKey}
                    onChange={(event) =>
                      setSelectedTeacherOptionKey(event.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                  >
                    <option value="">Chọn giáo viên</option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.optionKey} value={teacher.optionKey}>
                        {teacher.teacherName}
                        {teacher.classLabel ? ` - ${teacher.classLabel}` : ""}
                      </option>
                    ))}
                  </select>
                  {teacherOptions.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Chưa tìm thấy giáo viên chủ nhiệm trong lớp hiện tại.
                    </p>
                  )}
                </div>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent resize-none text-gray-900"
                />
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
            </div>

            <div className="space-y-3">
              {ticketsLoading && (
                <div className="py-10 text-center text-sm text-gray-500">
                  Đang tải danh sách đơn hỗ trợ...
                </div>
              )}

              {!ticketsLoading && tickets.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                  Chưa có đơn hỗ trợ nào cho học viên được chọn.
                </div>
              )}

              {!ticketsLoading &&
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge color="gray">
                            {getCategoryLabel(ticket.category)}
                          </Badge>
                          {getPriorityBadge((ticket as any).priority)}
                        </div>

                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          {ticket.subject}
                        </h4>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Tạo: {formatDate(ticket.createdAt)}
                          </span>
                          {latestComments[ticket.id] && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              Phản hồi: {latestComments[ticket.id].message}
                            </span>
                          )}
                          {mapStatus(ticket.status) === "resolved" && (
                            <span className="flex items-center gap-1 text-gray-700">
                              <CheckCircle className="w-4 h-4 text-gray-600" />
                              Cập nhật: {formatDate(ticket.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        {getStatusBadge(mapStatus(ticket.status))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "contact" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                <Phone className="w-6 h-6 text-gray-700" />
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
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-red-200 transition-all">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Hotline hỗ trợ</div>
                  <div className="text-lg font-bold text-gray-900">
                    0867405801
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-red-200 transition-all">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email hỗ trợ</div>
                  <div className="text-lg font-bold text-gray-900">
                    Tearexenglish@gmail.com
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-red-200 transition-all">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Địa chỉ</div>
                  <div className="text-lg font-bold text-gray-900">
                    S302, Vinhomes Grand Park, Q9, Tp.Thủ Đức
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
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
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Cập nhật 09:30 • Hỗ trợ 24/7</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Khẩn cấp</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Bình thường</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>Đã xử lý</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
