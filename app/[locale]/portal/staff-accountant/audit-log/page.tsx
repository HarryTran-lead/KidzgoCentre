"use client";
import { useState } from "react";
import { Shield, Search, Filter, Download, Clock, User, FileText, CreditCard, RefreshCw, Eye, Copy, CheckCircle2, AlertCircle, Zap, BarChart3, TrendingUp, Calendar, Users, Lock, Sparkles } from "lucide-react";

type LogType = "invoice" | "payment" | "adjustment" | "refund" | "system";
type UserRole = "ACCOUNTANT" | "ADMIN" | "MANAGER" | "SYSTEM";

interface AuditLog {
  id: string;
  timestamp: string;
  timeAgo: string;
  user: string;
  role: UserRole;
  action: string;
  reference: string;
  type: LogType;
  ipAddress: string;
  details: string;
}

export default function Page() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<LogType | "all">("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const auditLogs: AuditLog[] = [
    { 
      id: "LOG-001", 
      timestamp: "2025-10-21 10:22:45", 
      timeAgo: "2 giờ trước",
      user: "Hoa", 
      role: "ACCOUNTANT", 
      action: "Xuất hóa đơn", 
      reference: "INV-10542",
      type: "invoice",
      ipAddress: "192.168.1.100",
      details: "Hóa đơn học phí tháng 10 cho Nguyễn Văn A"
    },
    { 
      id: "LOG-002", 
      timestamp: "2025-10-21 10:35:12", 
      timeAgo: "2 giờ trước",
      user: "Hoa", 
      role: "ACCOUNTANT", 
      action: "Ghi nhận giao dịch PayOS", 
      reference: "TX-2941",
      type: "payment",
      ipAddress: "192.168.1.100",
      details: "Thanh toán qua mã QR, số tiền: 2,500,000 VND"
    },
    { 
      id: "LOG-003", 
      timestamp: "2025-10-22 08:10:30", 
      timeAgo: "Hôm nay",
      user: "Nam", 
      role: "ADMIN", 
      action: "Đóng kỳ kế toán", 
      reference: "10/2025",
      type: "system",
      ipAddress: "192.168.1.150",
      details: "Hoàn tất đóng sổ kế toán tháng 10/2025"
    },
    { 
      id: "LOG-004", 
      timestamp: "2025-10-21 14:22:18", 
      timeAgo: "22 giờ trước",
      user: "Minh", 
      role: "MANAGER", 
      action: "Điều chỉnh học phí", 
      reference: "ADJ-1001",
      type: "adjustment",
      ipAddress: "192.168.1.200",
      details: "Giảm 10% học phí cho học sinh có thành tích tốt"
    },
    { 
      id: "LOG-005", 
      timestamp: "2025-10-20 16:45:33", 
      timeAgo: "1 ngày trước",
      user: "Hoa", 
      role: "ACCOUNTANT", 
      action: "Hoàn tiền đặt cọc", 
      reference: "REF-045",
      type: "refund",
      ipAddress: "192.168.1.100",
      details: "Hoàn tiền 50% đặt cọc khóa học IELTS"
    },
    { 
      id: "LOG-006", 
      timestamp: "2025-10-20 09:15:07", 
      timeAgo: "2 ngày trước",
      user: "SYSTEM", 
      role: "SYSTEM", 
      action: "Tự động đồng bộ dữ liệu", 
      reference: "SYNC-1020",
      type: "system",
      ipAddress: "192.168.1.1",
      details: "Tự động đồng bộ dữ liệu từ hệ thống PayOS"
    },
    { 
      id: "LOG-007", 
      timestamp: "2025-10-19 11:30:45", 
      timeAgo: "3 ngày trước",
      user: "Lan", 
      role: "ACCOUNTANT", 
      action: "Xuất hóa đơn", 
      reference: "INV-10541",
      type: "invoice",
      ipAddress: "192.168.1.120",
      details: "Hóa đơn học phí tháng 10 cho Trần Thị B"
    },
  ];

  const typeConfig = {
    invoice: { text: "Hóa đơn", color: "from-emerald-500 to-teal-500", icon: FileText },
    payment: { text: "Thanh toán", color: "from-pink-500 to-rose-500", icon: CreditCard },
    adjustment: { text: "Điều chỉnh", color: "from-purple-500 to-indigo-500", icon: RefreshCw },
    refund: { text: "Hoàn tiền", color: "from-rose-500 to-pink-500", icon: TrendingUp },
    system: { text: "Hệ thống", color: "from-fuchsia-500 to-purple-500", icon: Shield },
  };

  const roleConfig = {
    ACCOUNTANT: { text: "Kế toán", color: "bg-pink-100 text-pink-700" },
    ADMIN: { text: "Quản trị", color: "bg-purple-100 text-purple-700" },
    MANAGER: { text: "Quản lý", color: "bg-rose-100 text-rose-700" },
    SYSTEM: { text: "Hệ thống", color: "bg-fuchsia-100 text-fuchsia-700" },
  };

  const users = Array.from(new Set(auditLogs.map(log => log.user)));
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = search === "" || 
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.reference.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || log.type === selectedType;
    const matchesUser = selectedUser === "all" || log.user === selectedUser;
    return matchesSearch && matchesType && matchesUser;
  });

  const stats = {
    totalLogs: auditLogs.length,
    todayLogs: auditLogs.filter(log => log.timeAgo.includes("giờ trước") || log.timeAgo === "Hôm nay").length,
    uniqueUsers: users.length,
    systemLogs: auditLogs.filter(log => log.type === "system").length,
  };

  const copyLogId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 via-white to-pink-50/10 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg shadow-pink-200">
              <Shield size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Nhật ký kiểm toán
              </h1>
              <p className="text-gray-600 mt-1">
                Theo dõi mọi thao tác tài chính và hoạt động hệ thống
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm shadow-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Tổng bản ghi</div>
                  <div className="text-2xl font-bold mt-2 text-gray-900">{stats.totalLogs}</div>
                </div>
                <div className="p-3 rounded-xl bg-pink-100">
                  <BarChart3 size={24} className="text-pink-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-sm shadow-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Hôm nay</div>
                  <div className="text-2xl font-bold mt-2 text-gray-900">{stats.todayLogs}</div>
                </div>
                <div className="p-3 rounded-xl bg-pink-100">
                  <Clock size={24} className="text-pink-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl border border-rose-200 p-5 shadow-sm shadow-rose-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Người dùng</div>
                  <div className="text-2xl font-bold mt-2 text-gray-900">{stats.uniqueUsers}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-100">
                  <Users size={24} className="text-rose-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-fuchsia-50 rounded-2xl border border-fuchsia-200 p-5 shadow-sm shadow-fuchsia-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Hệ thống</div>
                  <div className="text-2xl font-bold mt-2 text-gray-900">{stats.systemLogs}</div>
                </div>
                <div className="p-3 rounded-xl bg-fuchsia-100">
                  <Shield size={24} className="text-fuchsia-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column: Filters & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-lg shadow-pink-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search size={20} className="text-pink-500" />
                Tìm kiếm
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 pl-10 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Tìm kiếm bản ghi..."
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-lg shadow-pink-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={20} className="text-pink-500" />
                Bộ lọc
              </h3>
              
              <div className="space-y-4">
                {/* Type Filter */}
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">Loại hoạt động</div>
                  <div className="space-y-2">
                    {(["all", "invoice", "payment", "adjustment", "refund", "system"] as const).map((type) => {
                      if (type === "all") {
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                              selectedType === type
                                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                                : "bg-white border border-pink-200 text-rose-700 hover:bg-pink-50"
                            }`}
                          >
                            <FileText size={18} />
                            <span className="text-sm">Tất cả</span>
                          </button>
                        );
                      }

                      const config = typeConfig[type];
                      const Icon = config.icon;
                      
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                            selectedType === type
                              ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                              : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-sm">{config.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* User Filter */}
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">Người dùng</div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedUser("all")}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                        selectedUser === "all"
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                          : "bg-white border border-pink-200 text-rose-700 hover:bg-pink-50"
                      }`}
                    >
                      <Users size={18} />
                      <span className="text-sm">Tất cả người dùng</span>
                    </button>
                    {users.map((user) => (
                      <button
                        key={user}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                          selectedUser === user
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                            : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                        }`}
                      >
                        <User size={18} />
                        <span className="text-sm">{user}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 shadow-lg shadow-pink-100">
              <h3 className="font-bold text-rose-900 mb-4">Thao tác nhanh</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-200 transition-all cursor-pointer">
                  <span className="font-medium">Xuất báo cáo</span>
                  <Download size={18} />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-pink-200 bg-white text-rose-700 hover:bg-pink-50 transition-colors cursor-pointer">
                  <span className="font-medium">Làm mới dữ liệu</span>
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-pink-200">
              <div className="flex items-center gap-3 mb-3">
                <Lock size={24} className="text-pink-100" />
                <div>
                  <h3 className="font-bold">Bảo mật cao</h3>
                  <p className="text-sm text-pink-100">Toàn bộ hoạt động được ghi nhận</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-pink-100">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-200"></div>
                  <span>Mã hóa đầu cuối</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-200"></div>
                  <span>Không thể chỉnh sửa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-200"></div>
                  <span>Lưu trữ 5 năm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Logs */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-xl shadow-pink-100">
              {/* Header */}
              <div className="px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-white" />
                    <h2 className="text-xl font-semibold">Nhật ký hoạt động</h2>
                  </div>
                  <div className="text-sm text-gray-100">
                    Hiển thị {filteredLogs.length} bản ghi
                  </div>
                </div>
              </div>

              {/* Logs List */}
              <div className="divide-y divide-pink-100">
                {filteredLogs.map((log) => {
                  const TypeConfig = typeConfig[log.type];
                  const TypeIcon = TypeConfig.icon;
                  const RoleConfig = roleConfig[log.role];
                  
                  return (
                    <div
                      key={log.id}
                      className="p-5 hover:bg-pink-50/50 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Type Icon */}
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${TypeConfig.color} shadow-md`}>
                          <TypeIcon size={20} className="text-white" />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-lg">{log.action}</h3>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${RoleConfig.color}`}>
                                  {RoleConfig.text}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{log.details}</p>
                            </div>
                            <button
                              onClick={() => copyLogId(log.id)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                copiedId === log.id
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {copiedId === log.id ? (
                                <CheckCircle2 size={18} />
                              ) : (
                                <Copy size={18} />
                              )}
                            </button>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span className="font-medium">{log.timestamp}</span>
                              <span className="text-gray-400">•</span>
                              <span>{log.timeAgo}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{log.user}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                              <span>IP: {log.ipAddress}</span>
                            </div>
                          </div>

                          {/* Reference */}
                          <div className="mt-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                              <span className="text-gray-700">Mã tham chiếu:</span>
                              <span className="font-mono font-semibold text-gray-900">{log.reference}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4 shadow-md">
                      <Search size={32} className="text-rose-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy bản ghi</h4>
                    <p className="text-gray-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-pink-200 bg-gradient-to-r from-pink-50/80 to-rose-50/80 p-4">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <span>Dữ liệu được cập nhật thời gian thực</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock size={14} className="text-gray-700" />
                    <span>Kiểm toán • Bảo mật • Tuân thủ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-pink-200">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-gray-700" />
              <span>Hệ thống kiểm toán • Ghi nhận toàn bộ hoạt động • Không thể chỉnh sửa</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                <Calendar size={16} />
                Lịch sử đầy đủ
              </button>
              <button className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                <Download size={16} />
                Xuất nhật ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}