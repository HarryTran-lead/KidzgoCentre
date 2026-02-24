"use client";

import { Bell, MessageSquare, Shield, ChevronRight, CheckCircle, AlertCircle, Clock, Mail, TrendingUp, Filter, Eye, Users, Calendar, Target, BarChart3, Sparkles } from "lucide-react";
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

// Badge Component (copy từ theme gốc)
function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

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
      case "academic": return "text-gray-900 bg-gray-100 border-gray-200";
      case "financial": return "text-red-600 bg-red-50 border-red-200";
      case "event": return "text-gray-700 bg-gray-50 border-gray-200";
      case "homework": return "text-gray-800 bg-gray-100 border-gray-200";
      case "result": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return <Badge color="red">Quan trọng</Badge>;
    }
    if (priority === "medium") {
      return <Badge color="gray">Bình thường</Badge>;
    }
    return <Badge color="black">Thông tin</Badge>;
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Bell className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Thông báo phụ huynh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Cập nhật hoạt động học tập và tài chính
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={() => setShowMarkAll(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer text-gray-700"
            >
              <CheckCircle size={16} className="text-red-600" /> Đánh dấu đã đọc
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer text-gray-700">
            <Filter size={16} className="text-gray-600" /> Lọc
          </button>
        </div>
      </div>

      {/* Stats Cards - Redesigned with Red-Black-White theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tổng thông báo</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{notifications.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
              <Bell size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center gap-1">
            <TrendingUp size={12} className="text-red-600" />
            +2 thông báo mới
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Chưa đọc</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{unreadCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle size={12} />
            Cần xử lý ngay
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Học tập</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">2</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center gap-1">
            <Users size={12} />
            2 lớp có bài tập mới
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tài chính</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">1</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-red-600 flex items-center gap-1">
            <Calendar size={12} />
            Hạn đóng: 15/01/2025
          </div>
        </div>
      </div>

      {/* Filters - Redesigned */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {notificationTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setActiveFilter(type.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                activeFilter === type.key
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{type.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFilter === type.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
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
            className={`group bg-white rounded-2xl border ${
              notification.read ? 'border-gray-200' : 'border-red-200 bg-gradient-to-r from-white to-red-50/30'
            } p-5 hover:shadow-md transition-all duration-300 cursor-pointer`}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 p-3 rounded-xl border ${getTypeColor(notification.type)}`}>
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
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
                  <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Eye className="w-4 h-4 text-gray-600" />
                    Xem chi tiết
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    Phản hồi
                  </button>
                  {!notification.read && (
                    <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                      <CheckCircle className="w-4 h-4 text-red-600" />
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
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có thông báo</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {activeFilter === "unread" 
              ? "Tất cả thông báo đã được đọc" 
              : "Không có thông báo nào trong danh mục này"}
          </p>
        </div>
      )}

      {/* Info Cards - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200">
              <Shield className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-2">Bảo mật thông tin</div>
              <p className="text-sm text-gray-600">
                Thông báo quan trọng chỉ hiển thị sau khi phụ huynh xác thực mã PIN bảo mật.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200">
              <MessageSquare className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-2">Phản hồi nhanh</div>
              <p className="text-sm text-gray-600">
                Phản hồi trực tiếp để đặt lịch gặp giáo viên hoặc yêu cầu hỗ trợ thêm.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Quản lý thông báo</div>
            <div className="text-sm text-gray-600">Cài đặt nhận thông báo qua email và SMS</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Cài đặt
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 09:30</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Quan trọng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Bình thường</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>Thông tin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}