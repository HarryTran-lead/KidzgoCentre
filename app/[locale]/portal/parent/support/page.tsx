"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Ticket, 
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
  Activity
} from "lucide-react";
import { Button } from "@/components/lightswind/button";

type TabType = "feedback" | "tickets" | "contact";

const MOCK_TICKETS = [
  {
    id: "TICKET-001",
    subject: "Thắc mắc về học phí",
    status: "open",
    date: "25/12/2024",
    lastReply: "26/12/2024",
    priority: "high",
    category: "Tài chính"
  },
  {
    id: "TICKET-002",
    subject: "Đổi lịch học",
    status: "resolved",
    date: "20/12/2024",
    resolvedDate: "21/12/2024",
    category: "Lịch học"
  },
  {
    id: "TICKET-003",
    subject: "Cập nhật thông tin học viên",
    status: "in_progress",
    date: "22/12/2024",
    lastReply: "23/12/2024",
    priority: "medium",
    category: "Thông tin"
  },
];

const SUPPORT_CATEGORIES = [
  { icon: <Calendar className="w-4 h-4" />, label: "Lịch học", color: "red" as const },
  { icon: <Users className="w-4 h-4" />, label: "Giáo viên", color: "gray" as const },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Phản hồi", color: "black" as const },
  { icon: <Headphones className="w-4 h-4" />, label: "Học phí", color: "red" as const },
];

// Badge Component
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
    red: "bg-gradient-to-r from-red-600 to-red-700",
    gray: "bg-gradient-to-r from-gray-600 to-gray-700",
    black: "bg-gradient-to-r from-gray-800 to-gray-900"
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800"
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingUp size={12} className="rotate-180" />}
            {trend === "stable" && <Activity size={12} />}
            {hint}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>("feedback");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge color="red">Đang chờ</Badge>;
      case "resolved": return <Badge color="black">Đã giải quyết</Badge>;
      case "in_progress": return <Badge color="gray">Đang xử lý</Badge>;
      default: return <Badge color="gray">Chưa xử lý</Badge>;
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
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
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
          value="2"
          hint="+1 so với hôm qua"
          trend="up"
          color="red"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Đã giải quyết"
          value="1"
          hint="Trong tháng 12"
          trend="stable"
          color="gray"
        />
        <StatCard
          icon={<Send size={20} />}
          label="Phản hồi trung bình"
          value="24h"
          hint="Nhanh hơn 2h"
          trend="down"
          color="black"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1 flex gap-1">
        {[
          { key: "feedback" as TabType, label: "Gửi phản hồi", icon: MessageSquare },
          { key: "tickets" as TabType, label: "Ticket hỗ trợ", icon: Ticket },
          { key: "contact" as TabType, label: "Liên hệ", icon: Phone },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
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
                <h3 className="text-lg font-bold text-gray-900">Gửi phản hồi cho Kidzgo</h3>
                <p className="text-sm text-gray-600">Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SUPPORT_CATEGORIES.map((category) => {
                    const colorClasses: Record<string, string> = {
                      red: "from-red-600 to-red-700",
                      gray: "from-gray-600 to-gray-700",
                      black: "from-gray-800 to-gray-900"
                    };
                    
                    return (
                      <button
                        key={category.label}
                        onClick={() => setSelectedCategory(category.label)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          selectedCategory === category.label
                            ? `bg-gradient-to-r ${colorClasses[category.color]} text-white shadow-md border-transparent`
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className={selectedCategory === category.label ? "text-white" : "text-gray-600"}>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề</label>
                  <input
                    type="text"
                    placeholder="Nhập chủ đề phản hồi..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ tên phụ huynh..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung phản hồi</label>
                <textarea
                  placeholder="Chia sẻ ý kiến, góp ý của bạn về lớp học, giáo viên hoặc dịch vụ..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent resize-none text-gray-900"
                />
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold text-gray-900 mb-1">Phản hồi sẽ được xử lý trong 24h</div>
                    <p>Chúng tôi cam kết phản hồi tất cả ý kiến của phụ huynh trong thời gian sớm nhất.</p>
                  </div>
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer">
                <Send className="w-4 h-4" />
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <Ticket className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ticket hỗ trợ</h3>
                  <p className="text-sm text-gray-600">Theo dõi các yêu cầu hỗ trợ của bạn</p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer">
                <Sparkles className="w-4 h-4" />
                Tạo ticket mới
              </button>
            </div>

            <div className="space-y-3">
              {MOCK_TICKETS.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge color="gray">{ticket.category}</Badge>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{ticket.subject}</h4>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          Tạo: {ticket.date}
                        </span>
                        {ticket.status === "open" && ticket.lastReply && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            Phản hồi: {ticket.lastReply}
                          </span>
                        )}
                        {ticket.status === "resolved" && ticket.resolvedDate && (
                          <span className="flex items-center gap-1 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-gray-600" />
                            Giải quyết: {ticket.resolvedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      {getStatusBadge(ticket.status)}
                      <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "contact" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <Phone className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Thông tin liên hệ</h3>
                  <p className="text-sm text-gray-600">Liên hệ trực tiếp với trung tâm</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-red-200 transition-all">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Hotline hỗ trợ</div>
                    <div className="text-lg font-bold text-gray-900">1900 xxxx</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-red-200 transition-all">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email hỗ trợ</div>
                    <div className="text-lg font-bold text-gray-900">support@kidzgo.vn</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-red-200 transition-all">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Địa chỉ</div>
                    <div className="text-lg font-bold text-gray-900">123 Đường ABC, Quận 1, TP. HCM</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Giờ làm việc</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Thứ 2 - Thứ 6: 8:00 - 18:00</div>
                    <div>Thứ 7: 8:00 - 12:00</div>
                    <div>Chủ nhật: Nghỉ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Gửi tin nhắn trực tiếp</h3>
                <p className="text-sm text-gray-600">Đội ngũ sẽ phản hồi bạn trong thời gian sớm nhất</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Nhập họ tên..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
                <textarea
                  placeholder="Nhập nội dung bạn muốn hỗ trợ..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent resize-none text-gray-900"
                />
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer">
                <Send className="w-4 h-4" />
                Gửi tin nhắn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Support */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Cần hỗ trợ nhanh?</div>
            <div className="text-sm text-gray-600">Gọi hotline hoặc chat trực tiếp với đội ngũ CSKH</div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <Phone className="w-4 h-4 text-gray-600" />
              Gọi ngay
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer">
              <MessageSquare className="w-4 h-4" />
              Chat với CSKH
            </button>
          </div>
        </div>
      </div>

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