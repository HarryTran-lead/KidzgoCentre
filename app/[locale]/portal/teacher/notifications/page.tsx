"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Bell,
  SendHorizonal,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Users,
  MessageSquare,
  Pin,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  Sparkles,
  BarChart3,
  Volume2,
  Calendar,
  UserRound,
  Zap,
} from "lucide-react";

/**
 * Trang: Thông báo & Trao đổi (Giảng viên)
 */

// ----------------------------- Utils -----------------------------

type NoticeKind = "info" | "warning" | "success" | "reminder" | "urgent";

function classNames(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

// ----------------------------- Mock data -----------------------------

type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  createdAt: string;
  from: "Hệ thống" | "Ban quản lý" | "Phòng kế toán" | "Học viên" | "Giáo viên";
  isNew?: boolean;
  isPinned?: boolean;
  priority: "low" | "medium" | "high";
  relatedClass?: string;
  color: string;
};

const SEED_NOTICES: Notice[] = [
  {
    id: "n1",
    kind: "urgent",
    title: "Lịch dạy mới được cập nhật",
    body: "Lớp IELTS Foundation - A1 chuyển sang phòng 301 từ ngày 12/10. Vui lòng kiểm tra lại thời khóa biểu và chuẩn bị sẵn sàng.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    from: "Ban quản lý",
    isNew: true,
    isPinned: true,
    priority: "high",
    relatedClass: "IELTS Foundation - A1",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "n2",
    kind: "warning",
    title: "Nhắc nhở điểm danh khẩn",
    body: "Bạn chưa điểm danh buổi học ngày 08/10 cho lớp TOEIC Intermediate. Vui lòng cập nhật trước 17:00 hôm nay để tránh ảnh hưởng đến lương.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    from: "Hệ thống",
    isNew: true,
    priority: "high",
    relatedClass: "TOEIC Intermediate",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "n3",
    kind: "success",
    title: "Tài liệu mới đã được tải lên",
    body: "Đề thi giữa kỳ môn Business English đã được tải lên hệ thống. Bạn có thể tải xuống và chuẩn bị cho học viên.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    from: "Ban quản lý",
    isNew: false,
    priority: "medium",
    relatedClass: "Business English",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "n4",
    kind: "info",
    title: "Thông báo họp giảng viên",
    body: "Cuộc họp giảng viên định kỳ sẽ diễn ra vào 9:00 sáng Chủ nhật, 13/10 tại phòng họp tầng 2. Vui lòng có mặt đúng giờ.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    from: "Ban quản lý",
    isNew: false,
    isPinned: true,
    priority: "medium",
    color: "from-blue-500 to-sky-500",
  },
  {
    id: "n5",
    kind: "success",
    title: "Đã thanh toán lương tháng 9",
    body: "Lương tháng 9/2025 đã được chuyển khoản. Tổng: 20.400.000 VND. Vui lòng kiểm tra tài khoản và xác nhận.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    from: "Phòng kế toán",
    isNew: false,
    priority: "low",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "n6",
    kind: "reminder",
    title: "Nhắc lịch dạy sắp tới",
    body: "Bạn có 2 buổi dạy trong 3 giờ tới. Vui lòng chuẩn bị giáo án và tài liệu đầy đủ.",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    from: "Hệ thống",
    isNew: true,
    priority: "medium",
    color: "from-fuchsia-500 to-pink-500",
  },
];

type SentItem = {
  id: string;
  title: string;
  toClass: string;
  sentAt: string;
  status: "sent" | "read" | "failed";
  recipientCount: number;
  color: string;
};

const SEED_SENT: SentItem[] = [
  {
    id: "s1",
    title: "Thông báo dời lịch học",
    toClass: "IELTS Foundation - A1",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "read",
    recipientCount: 18,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "s2",
    title: "Bài tập về nhà tuần này",
    toClass: "TOEIC Intermediate",
    sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "sent",
    recipientCount: 15,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "s3",
    title: "Nhắc nhở chuẩn bị kiểm tra",
    toClass: "Business English",
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "read",
    recipientCount: 12,
    color: "from-emerald-500 to-teal-500",
  },
];

const CLASS_OPTIONS = [
  { value: "IELTS Foundation - A1", color: "from-pink-500 to-rose-500" },
  { value: "TOEIC Intermediate", color: "from-amber-500 to-orange-500" },
  { value: "Business English", color: "from-emerald-500 to-teal-500" },
  { value: "Tất cả các lớp", color: "from-blue-500 to-sky-500" },
];

// ----------------------------- UI Components -----------------------------

function KindIcon({ kind }: { kind: NoticeKind }) {
  const config = {
    info: { icon: Info, color: "text-blue-500" },
    warning: { icon: AlertTriangle, color: "text-amber-500" },
    success: { icon: CheckCircle2, color: "text-emerald-500" },
    reminder: { icon: Clock, color: "text-purple-500" },
    urgent: { icon: AlertTriangle, color: "text-rose-500" },
  }[kind];

  const Icon = config.icon;
  return <Icon className={`w-5 h-5 ${config.color}`} />;
}

function PriorityBadge({ priority }: { priority: Notice["priority"] }) {
  const config = {
    low: { text: "Thấp", color: "bg-gray-100 text-gray-700" },
    medium: { text: "Trung bình", color: "bg-amber-100 text-amber-700" },
    high: { text: "Cao", color: "bg-rose-100 text-rose-700" },
  }[priority];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
}

function StatusBadge({ status }: { status: SentItem["status"] }) {
  const config = {
    sent: { text: "Đã gửi", color: "bg-blue-100 text-blue-700" },
    read: { text: "Đã đọc", color: "bg-emerald-100 text-emerald-700" },
    failed: { text: "Thất bại", color: "bg-rose-100 text-rose-700" },
  }[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
}

const NoticeCard: React.FC<{
  notice: Notice;
  onTogglePin: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}> = ({ notice, onTogglePin, onMarkAsRead }) => {
  const created = useMemo(() => new Date(notice.createdAt), [notice.createdAt]);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-gradient-to-br from-white to-pink-50 rounded-2xl border ${notice.isNew ? 'border-pink-300' : 'border-pink-200'} p-5 transition-all duration-300 hover:shadow-xl hover:shadow-pink-100/30 hover:-translate-y-0.5 ${notice.isPinned ? 'ring-1 ring-pink-300' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-r ${notice.color}`}>
          <KindIcon kind={notice.kind} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-bold text-gray-900">{notice.title}</h4>
                {notice.isNew && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium">
                    Mới
                  </span>
                )}
                {notice.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    <Pin size={10} />
                    Ghim
                  </span>
                )}
                <PriorityBadge priority={notice.priority} />
              </div>
              
              <p className="text-sm text-gray-700 mt-2">{notice.body}</p>
              
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <UserRound size={12} />
                  <span>Từ: {notice.from}</span>
                </div>
                {notice.relatedClass && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{notice.relatedClass}</span>
                    </div>
                  </>
                )}
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{timeAgo(created)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {isHovered && (
                <>
                  <button
                    onClick={() => onTogglePin(notice.id)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title={notice.isPinned ? "Bỏ ghim" : "Ghim"}
                  >
                    <Pin size={16} className={notice.isPinned ? "fill-amber-400" : ""} />
                  </button>
                  <button
                    onClick={() => onMarkAsRead(notice.id)}
                    className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Đánh dấu đã đọc"
                  >
                    {notice.isNew ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SentHistoryItem: React.FC<{ item: SentItem }> = ({ item }) => {
  const d = new Date(item.sentAt);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-4 transition-all duration-300 hover:shadow-lg ${isHovered ? 'border-pink-300' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color}`}>
              <SendHorizonal size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{item.title}</div>
              <div className="text-sm text-gray-600">{item.toClass}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{item.recipientCount} người nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{timeAgo(d)}</span>
            </div>
            <StatusBadge status={item.status} />
          </div>
        </div>
        
        {isHovered && (
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Eye size={16} />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
              <SendHorizonal size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------- Page -----------------------------

export default function Page() {
  const [tab, setTab] = useState<"feed" | "send">("feed");
  const [notices, setNotices] = useState<Notice[]>(SEED_NOTICES);
  const [sent, setSent] = useState<SentItem[]>(SEED_SENT);
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // form state
  const [clazz, setClazz] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const unreadCount = notices.filter((n) => n.isNew).length;
  const pinnedCount = notices.filter((n) => n.isPinned).length;

  const filteredNotices = useMemo(() => {
    let filtered = [...notices];
    
    if (filter === "unread") {
      filtered = filtered.filter(n => n.isNew);
    } else if (filter === "pinned") {
      filtered = filtered.filter(n => n.isPinned);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.from.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort: pinned first, then new, then by date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notices, filter, searchQuery]);

  useEffect(() => {
    // Animation on load
    document.body.classList.add('loaded');
  }, []);

  function markAllRead() {
    setNotices((prev) => prev.map((n) => ({ ...n, isNew: false })));
  }

  function togglePin(id: string) {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  }

  function markAsRead(id: string) {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isNew: false } : n))
    );
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!clazz || !title || !content) return;

    const selectedClass = CLASS_OPTIONS.find(c => c.value === clazz);
    const item: SentItem = {
      id: `s${Date.now()}`,
      title,
      toClass: clazz,
      sentAt: new Date().toISOString(),
      status: "sent",
      recipientCount: Math.floor(Math.random() * 20) + 10,
      color: selectedClass?.color || "from-blue-500 to-sky-500",
    };
    setSent((prev) => [item, ...prev]);

    const newNotice: Notice = {
      id: `n${Date.now()}`,
      kind: "info",
      title: `Bạn đã gửi: ${title}`,
      body: content,
      createdAt: new Date().toISOString(),
      from: "Giáo viên",
      isNew: true,
      priority: "medium",
      relatedClass: clazz,
      color: selectedClass?.color || "from-blue-500 to-sky-500",
    };
    setNotices((prev) => [newNotice, ...prev]);

    setClazz("");
    setTitle("");
    setContent("");
    setTab("feed");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Bell size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Thông báo & Trao đổi
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý thông báo và gửi tin nhắn cho học viên
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Thông báo chưa đọc</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{unreadCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <Bell size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Thông báo đã ghim</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">{pinnedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Pin size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tin đã gửi</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{sent.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <SendHorizonal size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tỉ lệ đọc</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">85%</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <BarChart3 size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="inline-flex bg-white border border-pink-200 rounded-xl p-1 text-sm">
              <button
                onClick={() => setTab("feed")}
                className={classNames(
                  "px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300",
                  tab === "feed"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-pink-50"
                )}
              >
                <Bell size={16} />
                Thông báo
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("send")}
                className={classNames(
                  "px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300",
                  tab === "send"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-pink-50"
                )}
              >
                <SendHorizonal size={16} />
                Gửi thông báo
              </button>
            </div>

            {tab === "feed" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all"
                >
                  <CheckCheck size={16} />
                  Đánh dấu đã đọc tất cả
                </button>
              </div>
            )}
          </div>

          {/* Search and Filter Bar */}
          {tab === "feed" && (
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white border border-pink-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                  placeholder="Tìm kiếm thông báo..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-white border border-pink-200 rounded-xl p-1">
                  {(["all", "unread", "pinned"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 text-sm rounded-lg transition-all ${
                        filter === f
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                          : "text-gray-700 hover:bg-pink-50"
                      }`}
                    >
                      {f === "all" ? "Tất cả" : f === "unread" ? "Chưa đọc" : "Đã ghim"}
                    </button>
                  ))}
                </div>
                
                <button className="p-3.5 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition-colors">
                  <Filter size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === "feed" ? (
            // --------- FEED (Danh sách thông báo) ----------
            <div className="space-y-4">
              {filteredNotices.length > 0 ? (
                filteredNotices.map((n) => (
                  <NoticeCard
                    key={n.id}
                    notice={n}
                    onTogglePin={togglePin}
                    onMarkAsRead={markAsRead}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                    <Search size={32} className="text-pink-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy thông báo
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem kết quả.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // --------- SEND (Form gửi + Lịch sử gửi) ----------
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Form gửi */}
              <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                    <SendHorizonal size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Gửi thông báo cho học viên</h3>
                    <p className="text-sm text-gray-600">Nhập thông tin và gửi ngay</p>
                  </div>
                </div>
                
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Chọn lớp học</label>
                    <select
                      value={clazz}
                      onChange={(e) => setClazz(e.target.value)}
                      className="w-full rounded-xl bg-white border border-pink-200 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn lớp học...</option>
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Tiêu đề</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nhập tiêu đề thông báo..."
                      className="w-full rounded-xl bg-white border border-pink-200 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Nội dung</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung thông báo..."
                      rows={6}
                      className="w-full rounded-xl bg-white border border-pink-200 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-3 font-medium hover:shadow-lg transition-all"
                    >
                      <SendHorizonal size={16} />
                      Gửi thông báo
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white text-gray-700 px-4 py-3 font-medium hover:bg-pink-50 transition-all"
                    >
                      <Zap size={16} />
                      AI hỗ trợ
                    </button>
                  </div>
                </form>
              </div>

              {/* Lịch sử gửi */}
              <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Lịch sử gửi</h3>
                      <p className="text-sm text-gray-600">{sent.length} thông báo đã gửi</p>
                    </div>
                  </div>
                  <button className="text-sm text-pink-600 font-medium hover:text-pink-700">
                    Xem tất cả
                  </button>
                </div>
                
                <div className="space-y-3">
                  {sent.map((s) => (
                    <SentHistoryItem key={s.id} item={s} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}