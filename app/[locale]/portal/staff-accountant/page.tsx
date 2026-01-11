"use client";
import { FileText, QrCode, AlertTriangle, TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, Calendar, Clock, Download, Filter, Search, Zap, CheckCircle, XCircle, BarChart3, Wallet, Eye, ArrowUpRight, ChevronRight, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  hint, 
  trend = "up",
  color = "pink",
  delay = 0 
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "stable";
  color?: "pink" | "green" | "blue" | "yellow" | "purple";
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    pink: "from-pink-500 to-rose-500",
    green: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-sky-500",
    yellow: "from-amber-500 to-orange-500",
    purple: "from-purple-500 to-indigo-500"
  };

  const trendIcons = {
    up: <TrendingUp size={14} className="text-emerald-600" />,
    down: <TrendingDown size={14} className="text-rose-600" />,
    stable: <span className="text-amber-600">→</span>
  };

  const trendTexts = {
    up: "Tăng",
    down: "Giảm",
    stable: "Ổn định"
  };

  return (
    <div
      className={`bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 transition-all duration-700 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          {hint && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
              {trendIcons[trend]}
              <span>{hint}</span>
              <span className="text-gray-400">•</span>
              <span className={trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-amber-600"}>
                {trendTexts[trend]}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function PaymentStatusPieChart() {
  const data = [
    { label: "Đã thanh toán", value: 89, color: "#10b981" },
    { label: "Chờ xử lý", value: 8, color: "#f59e0b" },
    { label: "Quá hạn", value: 3, color: "#ef4444" }
  ];
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 180;
  const center = size / 2;
  const radius = 70;
  
  let currentAngle = -90;
  const arcs = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = `
      M ${center} ${center}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: item.color,
      value: item.value,
      percentage: percentage,
      label: item.label
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-4">
        {arcs.map((arc, index) => (
          <path
            key={index}
            d={arc.path}
            fill={arc.color}
            className="transition-all duration-1000 opacity-90 hover:opacity-100"
            style={{ 
              animationDelay: `${index * 200}ms`,
              transformOrigin: `${center}px ${center}px`
            }}
          />
        ))}
        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.4}
          fill="white"
        />
        {/* Center text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dy="0.35em"
          className="text-lg font-bold fill-gray-900"
        >
          {total}%
        </text>
      </svg>
      
      {/* Legend */}
      <div className="space-y-2 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionItem({ 
  type, 
  description, 
  amount, 
  status, 
  date, 
  icon: Icon 
}: {
  type: "invoice" | "payment" | "debt" | "closing";
  description: string;
  amount: string;
  status: "completed" | "pending" | "failed";
  date: string;
  icon: any;
}) {
  const statusConfig = {
    completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    pending: { color: "bg-amber-100 text-amber-700", icon: Clock },
    failed: { color: "bg-rose-100 text-rose-700", icon: XCircle }
  };

  const StatusIcon = statusConfig[status].icon;
  const typeColors = {
    invoice: "from-pink-500 to-rose-500",
    payment: "from-emerald-500 to-teal-500",
    debt: "from-amber-500 to-orange-500",
    closing: "from-blue-500 to-sky-500"
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white hover:bg-pink-50/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${typeColors[type]}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <div className="font-medium text-gray-900">{description}</div>
          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
            <span>{date}</span>
            <span>•</span>
            <span className="font-semibold text-gray-900">{amount}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
          <StatusIcon size={12} />
          {status === "completed" ? "Hoàn thành" : status === "pending" ? "Đang xử lý" : "Thất bại"}
        </span>
        <button className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [activeFilter, setActiveFilter] = useState<"all" | "invoices" | "payments" | "debts">("all");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const financialStats = [
    { label: "Hóa đơn phát hành", value: "182", hint: "+14", trend: "up", color: "pink", icon: FileText },
    { label: "Giao dịch PayOS", value: "126", hint: "98.4%", trend: "up", color: "green", icon: QrCode },
    { label: "Công nợ hiện tại", value: "37.2M đ", hint: "21 ngày", trend: "down", color: "yellow", icon: AlertTriangle },
    { label: "Doanh thu tháng", value: "258.45M đ", hint: "+12.5%", trend: "up", color: "blue", icon: DollarSign },
  ];

  const recentTransactions = [
    { 
      type: "invoice" as const, 
      description: "Xuất hoá đơn #INV-10542 cho lớp IELTS A1", 
      amount: "2.500.000 đ", 
      status: "completed" as const, 
      date: "Hôm nay, 09:30", 
      icon: FileText 
    },
    { 
      type: "payment" as const, 
      description: "Ghi nhận biên lai PayOS #TX-2941 (QR động)", 
      amount: "1.800.000 đ", 
      status: "completed" as const, 
      date: "Hôm nay, 10:15", 
      icon: CreditCard 
    },
    { 
      type: "closing" as const, 
      description: "Khóa sổ kỳ 10/2025", 
      amount: "Đã hoàn thành", 
      status: "completed" as const, 
      date: "Hôm qua, 16:45", 
      icon: Receipt 
    },
    { 
      type: "invoice" as const, 
      description: "Hoá đơn #INV-10543 - TOEIC Intermediate", 
      amount: "3.200.000 đ", 
      status: "pending" as const, 
      date: "Hôm qua, 14:20", 
      icon: FileText 
    },
    { 
      type: "debt" as const, 
      description: "Nhắc nợ học viên #STD-045", 
      amount: "1.500.000 đ", 
      status: "pending" as const, 
      date: "2 ngày trước", 
      icon: AlertTriangle 
    },
    { 
      type: "payment" as const, 
      description: "Thanh toán PayOS #TX-2940", 
      amount: "2.100.000 đ", 
      status: "failed" as const, 
      date: "3 ngày trước", 
      icon: CreditCard 
    },
  ];

  const filteredTransactions = recentTransactions.filter(t => 
    activeFilter === "all" || t.type === activeFilter.slice(0, -1)
  );

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <DollarSign size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Tổng quan tài chính
            </h1>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {financialStats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              trend={stat.trend as any}
              color={stat.color as any}
              delay={index * 100}
            />
          ))}
        </div>

      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Nhật ký giao dịch gần đây</h3>
                  <span className="text-sm text-gray-600">({recentTransactions.length} giao dịch)</span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex bg-white border border-pink-200 rounded-xl p-0.5">
                    {(["all", "invoices", "payments", "debts"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          activeFilter === filter
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                            : "text-gray-700 hover:bg-pink-50"
                        }`}
                      >
                        {filter === "all" ? "Tất cả" : 
                         filter === "invoices" ? "Hóa đơn" :
                         filter === "payments" ? "Thanh toán" : "Công nợ"}
                      </button>
                    ))}
                  </div>
                  
                  <button className="p-2 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors cursor-pointer">
                    <Filter size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-pink-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <TransactionItem
                    key={index}
                    type={transaction.type}
                    description={transaction.description}
                    amount={transaction.amount}
                    status={transaction.status}
                    date={transaction.date}
                    icon={transaction.icon}
                  />
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                    <Search size={32} className="text-pink-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Không có giao dịch</h4>
                  <p className="text-gray-600">Không tìm thấy giao dịch nào với bộ lọc hiện tại</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-pink-200">
              <button className="w-full text-center text-pink-600 font-medium hover:text-pink-700 flex items-center justify-center gap-1 cursor-pointer">
                Xem tất cả giao dịch
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Charts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-pink-500" />
              <h3 className="font-bold text-gray-900">Thao tác nhanh</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <FileText size={16} className="text-pink-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Xuất hóa đơn</div>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-pink-600" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <QrCode size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Tạo QR PayOS</div>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-emerald-600" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Quản lý công nợ</div>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-amber-600" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Download size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Xuất báo cáo</div>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-r from-blue-500 to-sky-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Tổng quan tháng</h3>
                  <p className="text-sm opacity-90">Tháng 10/2025</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">258.45M</div>
                <div className="text-sm opacity-90">Tổng doanh thu</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Doanh thu thuần</div>
                <div className="font-bold">245.53M</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Chi phí hoạt động</div>
                <div className="font-bold">42.18M</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Lợi nhuận</div>
                <div className="font-bold">203.35M</div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-white/90 transition-colors cursor-pointer">
              <BarChart3 size={16} className="inline mr-2" />
              Xem chi tiết
            </button>
          </div>

          {/* Payment Status */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Trạng thái thanh toán</h3>
              <Calendar size={18} className="text-gray-500" />
            </div>
            
            <PaymentStatusPieChart />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-pink-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-pink-500" />
            <span>Dữ liệu được cập nhật thời gian thực</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-pink-600 hover:text-pink-700 font-medium cursor-pointer">
              <Download size={16} className="inline mr-1" />
              Xuất báo cáo
            </button>
            <button className="text-pink-600 hover:text-pink-700 font-medium cursor-pointer">
              <Calendar size={16} className="inline mr-1" />
              Chọn kỳ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}