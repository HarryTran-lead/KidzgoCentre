"use client";

import { useState } from "react";
import { MessageSquare, Ticket, Phone, Send, Headphones, HelpCircle, Clock, CheckCircle, Mail, MapPin, Calendar, Users, AlertCircle, ChevronRight, Sparkles } from "lucide-react";

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
  { icon: <Calendar className="w-4 h-4" />, label: "Lịch học", color: "from-blue-500 to-sky-500" },
  { icon: <Users className="w-4 h-4" />, label: "Giáo viên", color: "from-emerald-500 to-teal-500" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Phản hồi", color: "from-pink-500 to-rose-500" },
  { icon: <Headphones className="w-4 h-4" />, label: "Học phí", color: "from-purple-500 to-fuchsia-500" },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>("feedback");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "resolved": return "bg-gradient-to-r from-emerald-500 to-teal-500";
      case "in_progress": return "bg-gradient-to-r from-blue-500 to-sky-500";
      default: return "bg-gradient-to-r from-gray-500 to-slate-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return "Đang chờ";
      case "resolved": return "Đã giải quyết";
      case "in_progress": return "Đang xử lý";
      default: return "Chưa xử lý";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        priority === "high" 
          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" 
          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
      }`}>
        {priority === "high" ? "Ưu tiên cao" : "Ưu tiên"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/20 via-white to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Headphones className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Hỗ trợ phụ huynh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gửi phản hồi, theo dõi yêu cầu và liên hệ trực tiếp với trung tâm
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
            <HelpCircle size={16} /> Hướng dẫn
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-amber-600">2</div>
              <div className="text-sm text-gray-600 mt-1">Đang xử lý</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '66%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-600">1</div>
              <div className="text-sm text-gray-600 mt-1">Đã giải quyết</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '33%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">24h</div>
              <div className="text-sm text-gray-600 mt-1">Phản hồi trung bình</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
              <Send className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-blue-500 to-sky-500" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-2 flex gap-2">
        {[
          { key: "feedback" as TabType, label: "Gửi phản hồi", icon: MessageSquare },
          { key: "tickets" as TabType, label: "Ticket hỗ trợ", icon: Ticket },
          { key: "contact" as TabType, label: "Liên hệ", icon: Phone },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
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
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl">
                <MessageSquare className="w-6 h-6 text-pink-500" />
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
                  {SUPPORT_CATEGORIES.map((category) => (
                    <button
                      key={category.label}
                      onClick={() => setSelectedCategory(category.label)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        selectedCategory === category.label
                          ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                          : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50"
                      }`}
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề</label>
                  <input
                    type="text"
                    placeholder="Nhập chủ đề phản hồi..."
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ tên phụ huynh..."
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung phản hồi</label>
                <textarea
                  placeholder="Chia sẻ ý kiến, góp ý của bạn về lớp học, giáo viên hoặc dịch vụ..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
                />
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/40">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold text-emerald-700 mb-1">💡 Phản hồi sẽ được xử lý trong 24h</div>
                    <p>Chúng tôi cam kết phản hồi tất cả ý kiến của phụ huynh trong thời gian sớm nhất.</p>
                  </div>
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer">
                <Send className="w-4 h-4" />
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
                  <Ticket className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ticket hỗ trợ</h3>
                  <p className="text-sm text-gray-600">Theo dõi các yêu cầu hỗ trợ của bạn</p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
                <Sparkles className="w-4 h-4" />
                Tạo ticket mới
              </button>
            </div>

            <div className="space-y-3">
              {MOCK_TICKETS.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 rounded-xl border border-pink-200 bg-white hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-sky-500/10 text-blue-600 text-xs font-semibold">
                          {ticket.category}
                        </span>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{ticket.subject}</h4>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Tạo: {ticket.date}
                        </span>
                        {ticket.status === "open" && ticket.lastReply && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            Phản hồi: {ticket.lastReply}
                          </span>
                        )}
                        {ticket.status === "resolved" && ticket.resolvedDate && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            Giải quyết: {ticket.resolvedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)} text-white`}>
                        {getStatusText(ticket.status)}
                      </span>
                      <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer">
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
            <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
                  <Phone className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Thông tin liên hệ</h3>
                  <p className="text-sm text-gray-600">Liên hệ trực tiếp với trung tâm</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border border-pink-200 bg-white">
                  <div className="p-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg">
                    <Phone className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Hotline hỗ trợ</div>
                    <div className="text-lg font-bold text-gray-900">1900 xxxx</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-pink-200 bg-white">
                  <div className="p-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email hỗ trợ</div>
                    <div className="text-lg font-bold text-gray-900">support@kidzgo.vn</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-pink-200 bg-white">
                  <div className="p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Địa chỉ</div>
                    <div className="text-lg font-bold text-gray-900">123 Đường ABC, Quận 1, TP. HCM</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/50 to-sky-50/40">
                  <div className="text-sm font-semibold text-blue-900 mb-2">🕐 Giờ làm việc</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Thứ 2 - Thứ 6: 8:00 - 18:00</div>
                    <div>Thứ 7: 8:00 - 12:00</div>
                    <div>Chủ nhật: Nghỉ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-xl">
                <MessageSquare className="w-6 h-6 text-purple-500" />
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
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
                <textarea
                  placeholder="Nhập nội dung bạn muốn hỗ trợ..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
                />
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
                <Send className="w-4 h-4" />
                Gửi tin nhắn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Support */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">💡 Cần hỗ trợ nhanh?</div>
            <div className="text-sm text-gray-600">Gọi hotline hoặc chat trực tiếp với đội ngũ CSKH</div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
              <Phone className="w-4 h-4" />
              Gọi ngay
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
              <MessageSquare className="w-4 h-4" />
              Chat với CSKH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}