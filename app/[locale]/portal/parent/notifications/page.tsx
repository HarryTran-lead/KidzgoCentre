"use client";

import { Bell, MessageSquare, Shield, ChevronRight, CheckCircle, AlertCircle, Clock, Mail, TrendingUp, Filter, Eye } from "lucide-react";
import { useState } from "react";

const notifications = [
  { 
    id: 1,
    title: "Báo cáo tuần 12", 
    time: "2 giờ trước", 
    summary: "Có phản hồi mới từ cô Phương về bài tập speaking.", 
    type: "academic",
    read: false,
    priority: "high"
  },
  { 
    id: 2,
    title: "Nhắc đóng học phí", 
    time: "Hôm qua", 
    summary: "Còn 500.000 ₫, hạn đến 15/01/2025.", 
    type: "financial",
    read: false,
    priority: "high"
  },
  { 
    id: 3,
    title: "Thông báo sự kiện Noel", 
    time: "2 ngày trước", 
    summary: "Lớp sẽ tổ chức tiệc Noel vào 24/12.", 
    type: "event",
    read: true,
    priority: "medium"
  },
  { 
    id: 4,
    title: "Bài tập về nhà mới", 
    time: "3 ngày trước", 
    summary: "Cô Hạnh đã giao bài tập mới cho lớp PRE-IELTS 11.", 
    type: "homework",
    read: true,
    priority: "medium"
  },
  { 
    id: 5,
    title: "Kết quả kiểm tra", 
    time: "1 tuần trước", 
    summary: "Con đạt 8.5 điểm trong bài test cuối tháng.", 
    type: "result",
    read: true,
    priority: "low"
  },
];

const notificationTypes = [
  { key: "all", label: "Tất cả", count: 5 },
  { key: "unread", label: "Chưa đọc", count: 2 },
  { key: "academic", label: "Học tập", count: 2 },
  { key: "financial", label: "Tài chính", count: 1 },
];

export default function ParentNotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showMarkAll, setShowMarkAll] = useState(false);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "academic": return <TrendingUp className="w-4 h-4" />;
      case "financial": return <AlertCircle className="w-4 h-4" />;
      case "event": return <Bell className="w-4 h-4" />;
      case "homework": return <Mail className="w-4 h-4" />;
      case "result": return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "academic": return "text-blue-600 bg-blue-50 border-blue-200";
      case "financial": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "event": return "text-amber-600 bg-amber-50 border-amber-200";
      case "homework": return "text-purple-600 bg-purple-50 border-purple-200";
      case "result": return "text-pink-600 bg-pink-50 border-pink-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-medium">Quan trọng</span>;
    }
    if (priority === "medium") {
      return <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium">Bình thường</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-gray-500 to-slate-500 text-white text-xs font-medium">Thông tin</span>;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notification.read;
    if (activeFilter === "academic") return notification.type === "academic";
    if (activeFilter === "financial") return notification.type === "financial";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/20 via-white to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Bell className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Thông báo
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Cập nhật quan trọng về học tập và tài chính
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={() => setShowMarkAll(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <CheckCircle size={16} /> Đánh dấu đã đọc
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
            <Filter size={16} /> Lọc
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-pink-600">{notifications.length}</div>
              <div className="text-sm text-gray-600 mt-1">Tổng thông báo</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl">
              <Bell className="w-6 h-6 text-pink-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-amber-600">{unreadCount}</div>
              <div className="text-sm text-gray-600 mt-1">Chưa đọc</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${(unreadCount / notifications.length) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">2</div>
              <div className="text-sm text-gray-600 mt-1">Học tập</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-blue-500 to-sky-500" style={{ width: '40%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-600">1</div>
              <div className="text-sm text-gray-600 mt-1">Tài chính</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '20%' }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap gap-2">
          {notificationTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setActiveFilter(type.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeFilter === type.key
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
              }`}
            >
              <span>{type.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFilter === type.key ? "bg-white/20" : "bg-gray-100"
              }`}>
                {type.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`group rounded-2xl border ${
              notification.read ? 'border-pink-200' : 'border-pink-300'
            } bg-gradient-to-br from-white to-pink-50 p-5 hover:shadow-lg transition-all duration-300 ${
              !notification.read ? 'ring-1 ring-pink-300/50' : ''
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 p-3 rounded-xl border ${getTypeColor(notification.type).split(' ')[2]} ${getTypeColor(notification.type).split(' ')[1]}`}>
                <div className={getTypeColor(notification.type).split(' ')[0]}>
                  {getTypeIcon(notification.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notification.summary}</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    {getPriorityBadge(notification.priority)}
                    <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    Phản hồi
                  </button>
                  {!notification.read && (
                    <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                      <CheckCircle className="w-4 h-4" />
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 flex items-center justify-center">
            <Bell className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có thông báo</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {activeFilter === "unread" 
              ? "Tất cả thông báo đã được đọc" 
              : "Không có thông báo nào trong danh mục này"}
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-2">🔒 Bảo mật thông tin</div>
              <p className="text-sm text-gray-600">
                Thông báo quan trọng chỉ hiển thị sau khi phụ huynh xác thực mã PIN bảo mật.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-2">💬 Phản hồi nhanh</div>
              <p className="text-sm text-gray-600">
                Phản hồi trực tiếp để đặt lịch gặp giáo viên hoặc yêu cầu hỗ trợ thêm.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">💡 Quản lý thông báo</div>
            <div className="text-sm text-gray-600">Cài đặt nhận thông báo qua email và SMS</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
            Cài đặt
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}