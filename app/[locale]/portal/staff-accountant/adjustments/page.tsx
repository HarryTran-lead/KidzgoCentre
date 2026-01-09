"use client";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Receipt, FileText, AlertCircle, CheckCircle2, Clock, Shield, Download, BarChart3, TrendingUp, Sparkles, Zap, ChevronRight, Lock, DollarSign } from "lucide-react";

type TransactionStatus = "success" | "pending" | "failed";
type AdjustmentType = "refund" | "adjustment" | "write-off";

interface AdjustmentHistory {
  id: string;
  code: string;
  amount: number;
  type: AdjustmentType;
  status: TransactionStatus;
  timestamp: string;
  note: string;
  user: string;
}

export default function Page() {
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("adjustment");
  const [copied, setCopied] = useState(false);

  // Mock data for history
  const adjustmentHistory: AdjustmentHistory[] = [
    { id: "ADJ-001", code: "INV-2024-1001", amount: -500000, type: "write-off", status: "success", timestamp: "Hôm nay, 09:30", note: "Giảm giá khuyến mãi", user: "Nguyễn Văn A" },
    { id: "ADJ-002", code: "INV-2024-1002", amount: 1200000, type: "refund", status: "pending", timestamp: "Hôm nay, 10:15", note: "Hoàn tiền đặt cọc", user: "Trần Thị B" },
    { id: "ADJ-003", code: "INV-2024-1003", amount: -750000, type: "adjustment", status: "success", timestamp: "Hôm qua, 14:20", note: "Điều chỉnh sai sót", user: "Lê Văn C" },
    { id: "ADJ-004", code: "INV-2024-1004", amount: 2000000, type: "refund", status: "failed", timestamp: "2 ngày trước", note: "Hoàn tiền khóa học", user: "Phạm Thị D" },
  ];

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  const statusConfig = {
    success: { text: "Thành công", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    pending: { text: "Đang xử lý", color: "bg-blue-100 text-blue-700", icon: Clock },
    failed: { text: "Thất bại", color: "bg-rose-100 text-rose-700", icon: AlertCircle },
  };

  const typeConfig = {
    refund: { text: "Hoàn tiền", color: "from-pink-500 to-rose-500", icon: ArrowUpRight },
    adjustment: { text: "Điều chỉnh", color: "from-purple-500 to-indigo-500", icon: ArrowDownRight },
    "write-off": { text: "Ghi giảm", color: "from-amber-500 to-orange-500", icon: ArrowDownRight },
  };

  const doAdjust = () => {
    alert(`Thực hiện bút toán cho ${code} số tiền ${amount.toLocaleString("vi-VN")} đ\nGhi chú: ${note}`);
    // In a real app, this would call an API
  };

  const copyAdjustmentCode = () => {
    const adjustmentCode = `ADJ-${Date.now().toString().slice(-6)}`;
    navigator.clipboard.writeText(adjustmentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate stats
  const stats = {
    totalAdjustments: adjustmentHistory.length,
    totalAmount: Math.abs(adjustmentHistory.reduce((sum, adj) => sum + adj.amount, 0)),
    successCount: adjustmentHistory.filter(adj => adj.status === "success").length,
    refundCount: adjustmentHistory.filter(adj => adj.type === "refund").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Receipt size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Điều chỉnh & Hoàn tiền
            </h1>
            <p className="text-gray-600 mt-1">
              Ghi giảm, hoàn tiền, bút toán điều chỉnh
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white via-white to-pink-50/40 rounded-2xl border border-pink-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold tracking-wide text-pink-500 uppercase">Tổng điều chỉnh</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{stats.totalAdjustments}</div>
                <div className="text-xs text-gray-500 mt-1">Số bút toán đã ghi nhận</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-inner">
                <BarChart3 size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 rounded-2xl border border-emerald-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold tracking-wide text-emerald-500 uppercase">Tổng giá trị</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{fmt(stats.totalAmount)}</div>
                <div className="text-xs text-gray-500 mt-1">Giá trị tuyệt đối các điều chỉnh</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-inner">
                <DollarSign size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white via-white to-blue-50/40 rounded-2xl border border-blue-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold tracking-wide text-blue-500 uppercase">Hoàn tiền</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">{stats.refundCount}</div>
                <div className="text-xs text-gray-500 mt-1">Số bút toán hoàn tiền</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 shadow-inner">
                <ArrowUpRight size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white via-white to-amber-50/40 rounded-2xl border border-amber-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold tracking-wide text-amber-500 uppercase">Thành công</div>
                <div className="text-2xl font-bold mt-2 text-amber-600">{stats.successCount}</div>
                <div className="text-xs text-gray-500 mt-1">Số bút toán xử lý thành công</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-inner">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Adjustment Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-lg">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-white" />
                  <h2 className="text-xl font-semibold">Tạo bút toán điều chỉnh</h2>
                </div>
                <p className="text-pink-100 text-sm mt-1">
                  Nhập thông tin cần điều chỉnh hoặc hoàn tiền
                </p>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Input Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block">
                      <div className="text-sm font-medium text-gray-900 mb-1">Mã hóa đơn / biên lai</div>
                      <div className="text-sm text-gray-600">Mã gốc cần điều chỉnh</div>
                    </label>
                    <div className="relative">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                        placeholder="VD: INV-2024-001"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <div className="text-sm font-medium text-gray-900 mb-1">Loại điều chỉnh</div>
                      <div className="text-sm text-gray-600">Chọn loại bút toán</div>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["adjustment", "refund", "write-off"] as AdjustmentType[]).map((type) => {
                        const config = typeConfig[type];
                        const Icon = config.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => setAdjustmentType(type)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                              adjustmentType === type
                                ? `bg-gradient-to-r ${config.color} text-white border-transparent shadow-lg`
                                : "bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                            }`}
                          >
                            <Icon size={20} />
                            <span className="text-sm font-medium">{config.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <label className="block">
                    <div className="text-sm font-medium text-gray-900 mb-1">Số tiền điều chỉnh</div>
                    <div className="text-sm text-gray-600">Nhập số tiền (+/-), âm cho ghi giảm</div>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <DollarSign size={20} />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-pink-200 bg-white pl-12 pr-4 py-3.5 text-gray-900 text-lg font-semibold outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      VND
                    </div>
                  </div>
                  {amount !== 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`font-medium ${amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {amount > 0 ? "↗ Tăng giá trị" : "↘ Giảm giá trị"}
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="font-bold text-gray-900">{Math.abs(amount).toLocaleString("vi-VN")} đ</div>
                    </div>
                  )}
                </div>

                {/* Notes Textarea */}
                <div className="space-y-3">
                  <label className="block">
                    <div className="text-sm font-medium text-gray-900 mb-1">Ghi chú</div>
                    <div className="text-sm text-gray-600">Mô tả lý do điều chỉnh</div>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all resize-none"
                    placeholder="Nhập ghi chú cho bút toán điều chỉnh..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    onClick={copyAdjustmentCode}
                    className={`px-5 py-3.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                      copied ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"
                    }`}
                  >
                    {copied ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                    {copied ? "Đã copy mã!" : "Tạo mã mới"}
                  </button>

                  <button
                    onClick={doAdjust}
                    className="group flex-1 min-w-[200px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                      {adjustmentType === "refund" ? (
                        <ArrowUpRight className="text-white" size={20} />
                      ) : (
                        <ArrowDownRight className="text-white" size={20} />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">
                        {adjustmentType === "refund" ? "Hoàn tiền" : adjustmentType === "write-off" ? "Ghi giảm" : "Điều chỉnh"}
                      </div>
                      <div className="text-sm opacity-90">
                        {adjustmentType === "refund" 
                          ? "Trả lại tiền cho khách hàng" 
                          : adjustmentType === "write-off" 
                          ? "Điều chỉnh giảm giá trị" 
                          : "Điều chỉnh số liệu"}
                      </div>
                    </div>
                    <ChevronRight className="opacity-80" size={20} />
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50 p-4">
                <div className="flex items-center justify-between text-sm text-rose-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></div>
                    <span>Hệ thống sẽ ghi nhận bút toán ngay lập tức</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-600 font-medium">
                    <Lock size={14} />
                    <span>Bảo mật • Tự động • Thời gian thực</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-pink-100 to-pink-50 border border-pink-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <ArrowDownRight size={20} className="text-pink-600" />
                  </div>
                  <div className="text-sm font-medium text-rose-800">Ghi giảm</div>
                </div>
                <div className="text-xs text-rose-600">
                  Điều chỉnh giảm giá trị hóa đơn, khấu trừ, giảm giá, sai sót
                </div>
              </div>
              <div className="bg-gradient-to-r from-rose-100 to-rose-50 border border-rose-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <ArrowUpRight size={20} className="text-rose-600" />
                  </div>
                  <div className="text-sm font-medium text-rose-800">Hoàn tiền</div>
                </div>
                <div className="text-xs text-rose-600">
                  Trả lại toàn bộ hoặc một phần số tiền cho khách hàng, hoàn đặt cọc
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Shield size={20} className="text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-purple-800">Lưu ý</div>
                </div>
                <div className="text-xs text-purple-600">
                  Vui lòng kiểm tra kỹ thông tin và xác nhận trước khi thực hiện bút toán
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: History & Quick Stats */}
          <div className="space-y-6">
            {/* Recent Adjustments */}
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-pink-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-pink-500" />
                    <h3 className="font-bold text-gray-900">Lịch sử điều chỉnh</h3>
                  </div>
                  <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                    Xem tất cả
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {adjustmentHistory.map((adj) => {
                    const StatusIcon = statusConfig[adj.status].icon;
                    const TypeConfig = typeConfig[adj.type];
                    
                    return (
                      <div
                        key={adj.id}
                        className="p-4 rounded-xl border border-pink-200 bg-white hover:bg-pink-50/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2.5 rounded-lg bg-gradient-to-r ${TypeConfig.color}`}>
                              <TypeConfig.icon size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-semibold text-gray-900">{adj.code}</div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[adj.status].color}`}>
                                  <StatusIcon size={12} />
                                  {statusConfig[adj.status].text}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900">{adj.note}</div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                <span>ID: {adj.id}</span>
                                <span>•</span>
                                <span>{adj.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`font-bold text-lg ${adj.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {adj.amount >= 0 ? "+" : ""}{fmt(adj.amount)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{adj.user}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Thống kê nhanh</h3>
                  <p className="text-sm opacity-90">7 ngày qua</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-90">Điều chỉnh mới</div>
                  <div className="font-bold">12</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-90">Tổng hoàn tiền</div>
                  <div className="font-bold">{fmt(4500000)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-90">Tỉ lệ thành công</div>
                  <div className="font-bold">92.3%</div>
                </div>
              </div>
              
              <button className="w-full mt-6 py-2.5 bg-white text-purple-600 rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-pink-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-pink-500" />
              <span>Bút toán tự động • Tài chính thời gian thực • Đối soát tự động</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
                <Shield size={16} />
                Kiểm toán
              </button>
              <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
                <Download size={16} />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}