"use client";
import { useState, useEffect, useRef } from "react";
import { QrCode, Link2, RefreshCcw, Copy, CheckCircle2, AlertCircle, Clock, DollarSign, BarChart3, TrendingUp, Download, Filter, Search, Eye, Sparkles, Zap, ArrowUpRight, ChevronRight, Shield, UserRound, Smartphone, CreditCard, Wallet, Lock } from "lucide-react";

type TransactionStatus = "matched" | "mismatch" | "pending" | "failed";
type PaymentMethod = "PayOS-QR" | "Bank-Transfer" | "Credit-Card" | "Wallet";

interface Transaction {
  id: string;
  student: string;
  studentId: string;
  amount: number;
  status: TransactionStatus;
  method: PaymentMethod;
  timestamp: string;
  description: string;
  color: string;
}

export default function Page() {
  const [amount, setAmount] = useState(2500000);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TransactionStatus | "all">("all");
  const [qrValue, setQrValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const transactions: Transaction[] = [
    { 
      id: "TX-2941", 
      student: "Nguyễn Văn A", 
      studentId: "HV001",
      amount: 2500000, 
      status: "matched", 
      method: "PayOS-QR", 
      timestamp: "Hôm nay, 09:30",
      description: "Thanh toán học phí tháng 10",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      id: "TX-2942", 
      student: "Trần Thị B", 
      studentId: "HV002",
      amount: 1800000, 
      status: "mismatch", 
      method: "PayOS-QR", 
      timestamp: "Hôm nay, 10:15",
      description: "Thanh toán khóa IELTS Foundation",
      color: "from-amber-500 to-orange-500"
    },
    { 
      id: "TX-2940", 
      student: "Lê Văn C", 
      studentId: "HV003",
      amount: 3200000, 
      status: "pending", 
      method: "Bank-Transfer", 
      timestamp: "Hôm qua, 14:20",
      description: "Chuyển khoản học phí",
      color: "from-blue-500 to-sky-500"
    },
    { 
      id: "TX-2939", 
      student: "Phạm Thị D", 
      studentId: "HV004",
      amount: 1500000, 
      status: "failed", 
      method: "Credit-Card", 
      timestamp: "2 ngày trước",
      description: "Thanh toán thẻ tín dụng",
      color: "from-rose-500 to-pink-500"
    },
    { 
      id: "TX-2938", 
      student: "Hoàng Minh E", 
      studentId: "HV005",
      amount: 2800000, 
      status: "matched", 
      method: "Wallet", 
      timestamp: "3 ngày trước",
      description: "Ví điện tử PayOS",
      color: "from-emerald-500 to-teal-500"
    },
  ];

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  const statusConfig = {
    matched: { text: "Khớp", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    mismatch: { text: "Sai lệch", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
    pending: { text: "Đang xử lý", color: "bg-blue-100 text-blue-700", icon: Clock },
    failed: { text: "Thất bại", color: "bg-rose-100 text-rose-700", icon: AlertCircle },
  };

  const methodConfig = {
    "PayOS-QR": { color: "from-purple-500 to-indigo-500", icon: QrCode },
    "Bank-Transfer": { color: "from-blue-500 to-sky-500", icon: CreditCard },
    "Credit-Card": { color: "from-amber-500 to-orange-500", icon: CreditCard },
    "Wallet": { color: "from-emerald-500 to-teal-500", icon: Wallet },
  };

  const filteredTransactions = transactions.filter(t => 
    activeFilter === "all" || t.status === activeFilter
  );

  const stats = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    matchedCount: transactions.filter(t => t.status === "matched").length,
    successRate: Math.round((transactions.filter(t => t.status === "matched").length / transactions.length) * 100),
  };

  const copyLink = () => {
    const link = `payos://dynamic-qr?amount=${amount}&ref=${Date.now()}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQR = () => {
    setIsGenerating(true);
    setQrValue(`payos://pay?amount=${amount}&timestamp=${Date.now()}`);
    
    // Simulate QR generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const syncTransactions = () => {
    // Simulate sync
    console.log("Syncing transactions...");
  };

  useEffect(() => {
    setIsPageLoaded(true);
    generateQR();
  }, [amount]);

  useEffect(() => {
    generateQR();
  }, [amount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <QrCode size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Thanh toán PayOS
            </h1>
            <p className="text-gray-600 mt-1">
              Tạo QR động, nhận webhook, đối soát giao dịch
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Giao dịch tháng</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{stats.totalTransactions}</div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <BarChart3 size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng tiền</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{fmt(stats.totalAmount)}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <DollarSign size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Khớp thành công</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">{stats.matchedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <CheckCircle2 size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">{stats.successRate}%</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <TrendingUp size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR Generator */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Tạo QR động</h3>
                </div>
                <div className="text-sm text-gray-600">Tự động cập nhật theo số tiền</div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Amount Input */}
              <div className="mb-8">
                <label className="block mb-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">Nhập số tiền</div>
                  <div className="text-sm text-gray-600">Số tiền sẽ hiển thị trên mã QR</div>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <DollarSign size={20} />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-pink-200 bg-white pl-12 pr-4 py-3.5 text-gray-900 text-lg font-semibold outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                      placeholder="Nhập số tiền"
                    />
                  </div>
                  <button
                    onClick={copyLink}
                    className={`px-5 py-3.5 rounded-xl font-medium flex items-center gap-2 transition-all cursor-pointer ${copied ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"}`}
                  >
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? "Đã copy!" : "Copy link"}
                  </button>
                </div>
              </div>

              {/* QR Display */}
              <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-8">
                <div className="flex flex-col items-center">
                  <div className={`relative p-4 bg-white rounded-2xl border-2 border-dashed ${isGenerating ? "border-pink-300 animate-pulse" : "border-pink-200"}`}>
                    {isGenerating ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                      </div>
                    ) : (
                      <>
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <QrCode size={96} className="text-gray-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white">
                          <Sparkles size={16} />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="text-2xl font-bold text-gray-900">{fmt(amount)}</div>
                    <div className="text-sm text-gray-600 mt-2">Quét mã QR để thanh toán</div>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-1">
                      <Lock size={12} />
                      <span>Bảo mật • Tự động • Thời gian thực</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-md">
                    <button className="p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <RefreshCcw size={16} className="text-gray-600" />
                      Tạo mới
                    </button>
                    <button className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
                      <Download size={16} />
                      Tải xuống
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCcw size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Webhook & đối soát</h3>
                </div>
                <button
                  onClick={syncTransactions}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCcw size={16} />
                  Đồng bộ
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex flex-wrap gap-1">
                {(["all", "matched", "mismatch", "pending", "failed"] as const).map((filter) => {
                  const config = filter === "all" 
                    ? { text: "Tất cả", color: "bg-gray-100 text-gray-700" }
                    : statusConfig[filter];
                  
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
                        activeFilter === filter
                          ? filter === "all" 
                            ? "bg-gray-900 text-white"
                            : `bg-gradient-to-r ${filter === "matched" ? "from-emerald-500 to-teal-500" : filter === "mismatch" ? "from-amber-500 to-orange-500" : filter === "pending" ? "from-blue-500 to-sky-500" : "from-rose-500 to-pink-500"} text-white`
                          : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                      }`}
                    >
                      {filter === "all" ? "Tất cả" : config.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transactions List */}
            <div className="px-6 py-4">
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredTransactions.map((tx) => {
                  const StatusIcon = statusConfig[tx.status].icon;
                  const MethodConfig = methodConfig[tx.method];
                  
                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-xl border border-pink-200 bg-white hover:bg-pink-50/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2.5 rounded-lg bg-gradient-to-r ${MethodConfig.color}`}>
                            <MethodConfig.icon size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-gray-900">{tx.id}</div>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[tx.status].color}`}>
                                <StatusIcon size={12} />
                                {statusConfig[tx.status].text}
                              </span>
                            </div>
                            <div className="text-sm text-gray-900 font-medium">{tx.student}</div>
                            <div className="text-xs text-gray-600 mt-1">{tx.description}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <span>ID: {tx.studentId}</span>
                              <span>•</span>
                              <span>{tx.timestamp}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">{fmt(tx.amount)}</div>
                          <div className="text-xs text-gray-600 mt-1">{tx.method}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-pink-100">
                        <button className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                          <Link2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                      <Search size={32} className="text-pink-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Không có giao dịch</h4>
                    <p className="text-gray-600">Không tìm thấy giao dịch nào với bộ lọc hiện tại</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-bold">Thống kê nhanh</h3>
                <p className="text-sm opacity-90">24 giờ qua</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Giao dịch mới</div>
                <div className="font-bold">8</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Tổng tiền</div>
                <div className="font-bold">{fmt(18500000)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Tỉ lệ khớp</div>
                <div className="font-bold">94.5%</div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 bg-white text-purple-600 rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <BarChart3 size={16} />
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-pink-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-500" />
            <span>Webhook thời gian thực • Tự động đối soát</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 cursor-pointer">
              <Shield size={16} />
              Bảo mật
            </button>
            <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 cursor-pointer">
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}