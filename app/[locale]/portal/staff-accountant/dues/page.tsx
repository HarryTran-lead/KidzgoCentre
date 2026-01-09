"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Clock, 
  Phone, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  Sparkles,
  Zap,
  BarChart3,
  Target,
  Wallet,
  PieChart,
  Bell,
  UserRound,
  CreditCard,
  ArrowUpRight
} from "lucide-react";

type DebtStatus = "current" | "overdue" | "critical" | "in_collection";
type DebtBucket = "0-30" | "31-60" | "61-90" | "90+";

interface DebtItem {
  id: string;
  student: string;
  studentId: string;
  className: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: DebtStatus;
  bucket: DebtBucket;
  lastContact: string;
  color: string;
}

interface AgingBucket {
  bucket: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
  trend: "up" | "down" | "stable";
}

export default function Page() {
  const [activeFilter, setActiveFilter] = useState<DebtStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<DebtBucket | "all">("all");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const AGING: AgingBucket[] = [
    { 
      bucket: "0-30", 
      label: "0-30 ngày", 
      count: 12, 
      amount: 15200000, 
      percentage: 45, 
      color: "from-blue-500 to-sky-500",
      trend: "down"
    },
    { 
      bucket: "31-60", 
      label: "31-60 ngày", 
      count: 6, 
      amount: 11200000, 
      percentage: 28, 
      color: "from-amber-500 to-orange-500",
      trend: "up"
    },
    { 
      bucket: "61-90", 
      label: "61-90 ngày", 
      count: 3, 
      amount: 5600000, 
      percentage: 16, 
      color: "from-rose-500 to-pink-500",
      trend: "stable"
    },
    { 
      bucket: "90+", 
      label: "90+ ngày", 
      count: 2, 
      amount: 3800000, 
      percentage: 11, 
      color: "from-purple-500 to-indigo-500",
      trend: "up"
    },
  ];

  const DEBTS: DebtItem[] = [
    { 
      id: "DN001", 
      student: "Nguyễn Văn An", 
      studentId: "HV001",
      className: "IELTS Foundation - A1", 
      amount: 2500000, 
      dueDate: "15/10/2025",
      daysOverdue: 5,
      status: "overdue", 
      bucket: "0-30",
      lastContact: "Hôm nay, 09:30",
      color: "from-amber-500 to-orange-500"
    },
    { 
      id: "DN002", 
      student: "Trần Thị Bình", 
      studentId: "HV002",
      className: "TOEIC Intermediate", 
      amount: 1800000, 
      dueDate: "10/10/2025",
      daysOverdue: 10,
      status: "overdue", 
      bucket: "0-30",
      lastContact: "Hôm qua, 14:20",
      color: "from-amber-500 to-orange-500"
    },
    { 
      id: "DN003", 
      student: "Lê Văn Cường", 
      studentId: "HV003",
      className: "Business English", 
      amount: 3200000, 
      dueDate: "05/10/2025",
      daysOverdue: 15,
      status: "critical", 
      bucket: "31-60",
      lastContact: "2 ngày trước",
      color: "from-rose-500 to-pink-500"
    },
    { 
      id: "DN004", 
      student: "Phạm Thị Dung", 
      studentId: "HV004",
      className: "Academic Writing", 
      amount: 1500000, 
      dueDate: "20/09/2025",
      daysOverdue: 25,
      status: "critical", 
      bucket: "31-60",
      lastContact: "3 ngày trước",
      color: "from-rose-500 to-pink-500"
    },
    { 
      id: "DN005", 
      student: "Hoàng Minh Đức", 
      studentId: "HV005",
      className: "IELTS Advanced", 
      amount: 4200000, 
      dueDate: "15/09/2025",
      daysOverdue: 35,
      status: "in_collection", 
      bucket: "61-90",
      lastContact: "5 ngày trước",
      color: "from-purple-500 to-indigo-500"
    },
    { 
      id: "DN006", 
      student: "Vũ Thị Lan", 
      studentId: "HV006",
      className: "TOEIC Advanced", 
      amount: 2800000, 
      dueDate: "01/09/2025",
      daysOverdue: 50,
      status: "in_collection", 
      bucket: "90+",
      lastContact: "1 tuần trước",
      color: "from-purple-500 to-indigo-500"
    },
  ];

  const statusConfig = {
    current: { text: "Đúng hạn", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    overdue: { text: "Quá hạn", color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
    critical: { text: "Quá hạn nghiêm trọng", color: "bg-rose-100 text-rose-700", icon: AlertTriangle },
    in_collection: { text: "Đang thu hồi", color: "bg-purple-100 text-purple-700", icon: Wallet },
  };

  const collectionPlan = [
    { action: "Gọi nhắc 0-30 ngày mỗi thứ 4 & thứ 7", icon: Phone, color: "from-blue-500 to-sky-500" },
    { action: "Gửi Zalo tự động trước hạn 3 ngày", icon: MessageSquare, color: "from-emerald-500 to-teal-500" },
    { action: "61-90+ ngày chuyển quản lý lớp phối hợp", icon: Users, color: "from-purple-500 to-indigo-500" },
    { action: "Email nhắc nhở hàng tuần cho quá hạn", icon: Send, color: "from-amber-500 to-orange-500" },
  ];

  const totalDebt = AGING.reduce((sum, bucket) => sum + bucket.amount, 0);
  const totalStudents = AGING.reduce((sum, bucket) => sum + bucket.count, 0);
  const averageDebt = Math.round(totalDebt / totalStudents);
  
  const filteredDebts = DEBTS.filter(debt => {
    if (activeFilter !== "all" && debt.status !== activeFilter) return false;
    if (selectedBucket !== "all" && debt.bucket !== selectedBucket) return false;
    if (searchQuery && !debt.student.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !debt.studentId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <AlertTriangle size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Công nợ
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi nợ — nhắc hạn — phân loại tuổi nợ — kế hoạch thu
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng công nợ</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{fmt(totalDebt)}</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <DollarSign size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Học viên nợ</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">{totalStudents}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Users size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl border border-rose-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Trung bình/học viên</div>
                <div className="text-2xl font-bold mt-2 text-rose-600">{fmt(averageDebt)}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-100">
                <BarChart3 size={24} className="text-rose-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Ngày nợ trung bình</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">21 ngày</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Clock size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Aging Analysis */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Phân tích tuổi nợ</h3>
                </div>
                <div className="text-sm text-gray-600">Tổng cộng: {fmt(totalDebt)}</div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {AGING.map((bucket) => {
                  const TrendIcon = bucket.trend === "up" ? TrendingUp : 
                                  bucket.trend === "down" ? TrendingDown : 
                                  Target;
                  
                  return (
                    <div key={bucket.bucket} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${bucket.color}`}>
                            <Clock size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{bucket.label}</div>
                            <div className="text-sm text-gray-600">{bucket.count} học viên</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{fmt(bucket.amount)}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <TrendIcon size={12} className={bucket.trend === "up" ? "text-rose-600" : bucket.trend === "down" ? "text-emerald-600" : "text-amber-600"} />
                            {bucket.percentage}% tổng nợ
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${bucket.color}`}
                          style={{ width: `${bucket.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Table */}
              <div className="mt-8 rounded-xl border border-pink-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Bucket</th>
                      <th className="px-6 py-3 text-left font-semibold">Số học viên</th>
                      <th className="px-6 py-3 text-left font-semibold">Tỷ lệ</th>
                      <th className="px-6 py-3 text-left font-semibold">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AGING.map((bucket, index) => (
                      <tr key={bucket.bucket} className={`border-t border-pink-100 ${index % 2 === 0 ? 'bg-white' : 'bg-pink-50/30'}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${bucket.color}`} />
                            <span className="font-medium text-gray-900">{bucket.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-bold text-gray-900">{bucket.count}</div>
                          <div className="text-xs text-gray-600">học viên</div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-bold text-gray-900">{bucket.percentage}%</div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-bold text-gray-900">{fmt(bucket.amount)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Plan */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-pink-500" />
              <h3 className="font-bold text-gray-900">Kế hoạch thu nợ</h3>
            </div>
            
            <div className="space-y-4">
              {collectionPlan.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-r ${item.color}`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.action}</div>
                      <div className="text-xs text-gray-600 mt-1">Tự động • Hiệu quả cao</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-pink-200">
              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all">
                <Bell size={16} className="inline mr-2" />
                Kích hoạt nhắc nhở
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-500 to-sky-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-bold">Thống kê nhanh</h3>
                <p className="text-sm opacity-90">Tháng 10/2025</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Đã thu hồi</div>
                <div className="font-bold">{fmt(12500000)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Tỉ lệ thành công</div>
                <div className="font-bold">78%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Cuộc gọi đã thực hiện</div>
                <div className="font-bold">24</div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-white/90 transition-colors">
              <BarChart3 size={16} className="inline mr-2" />
              Xem báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Debt List */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-pink-500" />
                <h3 className="font-bold text-gray-900">Danh sách công nợ</h3>
                <span className="text-sm text-gray-600">({filteredDebts.length} học viên)</span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm học viên hoặc ID..."
                    className="pl-10 pr-4 py-2 rounded-xl border border-pink-200 bg-white text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  />
                </div>
                
                {/* Status Filters */}
                <div className="flex items-center gap-1">
                  {(["all", "overdue", "critical", "in_collection"] as const).map((filter) => {
                    const config = filter === "all" 
                      ? { text: "Tất cả", color: "bg-gray-100 text-gray-700" }
                      : statusConfig[filter];
                    
                    return (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          activeFilter === filter
                            ? filter === "all" 
                              ? "bg-gray-900 text-white"
                              : `bg-gradient-to-r ${filter === "overdue" ? "from-amber-500 to-orange-500" : filter === "critical" ? "from-rose-500 to-pink-500" : "from-purple-500 to-indigo-500"} text-white`
                            : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                        }`}
                      >
                        {filter === "all" ? "Tất cả" : config.text}
                      </button>
                    );
                  })}
                </div>
                
                {/* Bucket Filters */}
                <div className="relative">
                  <select
                    value={selectedBucket}
                    onChange={(e) => setSelectedBucket(e.target.value as DebtBucket | "all")}
                    className="pl-3 pr-8 py-2 rounded-xl border border-pink-200 bg-white text-sm appearance-none outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="all">Tất cả bucket</option>
                    {AGING.map(bucket => (
                      <option key={bucket.bucket} value={bucket.bucket}>
                        {bucket.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Debt Items */}
          <div className="divide-y divide-pink-100">
            {filteredDebts.length > 0 ? (
              filteredDebts.map((debt) => {
                const StatusIcon = statusConfig[debt.status].icon;
                const bucketInfo = AGING.find(b => b.bucket === debt.bucket);
                
                return (
                  <div key={debt.id} className="px-6 py-4 hover:bg-pink-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${bucketInfo?.color || debt.color}`}>
                          <UserRound size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-gray-900">{debt.student}</div>
                            <span className="text-xs text-gray-500">ID: {debt.studentId}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[debt.status].color}`}>
                              <StatusIcon size={12} />
                              {statusConfig[debt.status].text}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900">{debt.className}</div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Hạn: {debt.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>Quá hạn: {debt.daysOverdue} ngày</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone size={12} />
                              <span>Liên hệ cuối: {debt.lastContact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{fmt(debt.amount)}</div>
                        <div className="text-sm text-gray-600 mt-1">{bucketInfo?.label}</div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <button className="px-3 py-1.5 text-xs rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                            <Phone size={12} className="inline mr-1" />
                            Gọi
                          </button>
                          <button className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                            <MessageSquare size={12} className="inline mr-1" />
                            Zalo
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-lg">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                  <Search size={32} className="text-pink-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy công nợ</h4>
                <p className="text-gray-600">Không có công nợ nào khớp với bộ lọc hiện tại</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-pink-200">
            <button className="w-full text-center text-pink-600 font-medium hover:text-pink-700 flex items-center justify-center gap-1">
              Xem tất cả công nợ ({DEBTS.length} học viên)
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-pink-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-500" />
            <span>Cập nhật lần cuối: Hôm nay, 10:45 • Tự động nhắc nhở đã kích hoạt</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              <Download size={16} />
              Xuất báo cáo
            </button>
            <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              <CreditCard size={16} />
              Tạo hóa đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}