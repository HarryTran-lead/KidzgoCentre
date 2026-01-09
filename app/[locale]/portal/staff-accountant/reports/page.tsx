"use client";
import { useState, useEffect, useRef } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  AlertCircle,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  Printer,
  Share2,
  PieChart,
  LineChart,
  Target,
  Users,
  Clock,
  ArrowUpRight,
  RefreshCcw,
  FileText,
  Calculator
} from "lucide-react";

type ReportRow = { 
  period: string; 
  revenue: number; 
  byCash: number; 
  byBank: number; 
  byCard: number;
  byWallet: number;
  dues: number;
  growth: number;
  color: string;
};

type ChartType = "revenue" | "payment" | "dues" | "growth";
type TimePeriod = "monthly" | "quarterly" | "yearly";

export default function Page() {
  const [activeChart, setActiveChart] = useState<ChartType>("revenue");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const DATA: ReportRow[] = [
    { 
      period: "08/2025", 
      revenue: 182000000, 
      byCash: 42000000, 
      byBank: 140000000, 
      byCard: 32000000,
      byWallet: 18000000,
      dues: 12000000, 
      growth: -2.5,
      color: "from-blue-500 to-sky-500"
    },
    { 
      period: "09/2025", 
      revenue: 205000000, 
      byCash: 39000000, 
      byBank: 166000000, 
      byCard: 35000000,
      byWallet: 21000000,
      dues: 9500000, 
      growth: 12.6,
      color: "from-emerald-500 to-teal-500"
    },
    { 
      period: "10/2025", 
      revenue: 219500000, 
      byCash: 36000000, 
      byBank: 183500000, 
      byCard: 42000000,
      byWallet: 24000000,
      dues: 7200000, 
      growth: 7.1,
      color: "from-pink-500 to-rose-500"
    },
    { 
      period: "11/2025", 
      revenue: 235000000, 
      byCash: 38000000, 
      byBank: 197000000, 
      byCard: 48000000,
      byWallet: 27000000,
      dues: 5200000, 
      growth: 7.1,
      color: "from-purple-500 to-indigo-500"
    },
    { 
      period: "12/2025", 
      revenue: 248000000, 
      byCash: 42000000, 
      byBank: 206000000, 
      byCard: 52000000,
      byWallet: 30000000,
      dues: 3500000, 
      growth: 5.5,
      color: "from-amber-500 to-orange-500"
    },
  ];

  const stats = {
    totalRevenue: DATA.reduce((sum, r) => sum + r.revenue, 0),
    averageGrowth: DATA.reduce((sum, r) => sum + r.growth, 0) / DATA.length,
    totalDues: DATA.reduce((sum, r) => sum + r.dues, 0),
    paymentMethods: {
      cash: DATA.reduce((sum, r) => sum + r.byCash, 0),
      bank: DATA.reduce((sum, r) => sum + r.byBank, 0),
      card: DATA.reduce((sum, r) => sum + r.byCard, 0),
      wallet: DATA.reduce((sum, r) => sum + r.byWallet, 0),
    }
  };

  const fmt = (n: number) => n.toLocaleString("vi-VN");
  const fmtCurrency = (n: number) => n.toLocaleString("vi-VN") + " đ";

  const exportCSV = () => {
    setIsGenerating(true);
    
    const header = "Kỳ,Doanh thu,Tiền mặt,Chuyển khoản,Thẻ tín dụng,Ví điện tử,Công nợ,Tăng trưởng (%)\n";
    const body = DATA.map(r => [
      r.period, 
      r.revenue, 
      r.byCash, 
      r.byBank, 
      r.byCard,
      r.byWallet,
      r.dues, 
      r.growth
    ].join(",")).join("\n");
    
    const blob = new Blob([`\uFEFF${header}${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-tai-chinh-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const exportPDF = () => {
    setIsGenerating(true);
    // Simulate PDF generation
    setTimeout(() => {
      alert("Báo cáo PDF đang được tạo và sẽ tự động tải xuống...");
      setIsGenerating(false);
    }, 1500);
  };

  const getMaxValue = (key: keyof ReportRow) => {
    return Math.max(...DATA.map(r => r[key] as number));
  };

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <BarChart3 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Báo cáo tài chính
            </h1>
            <p className="text-gray-600 mt-1">
              Doanh thu theo kỳ / phương thức thu / tuổi nợ / phân tích xu hướng
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng doanh thu</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{fmtCurrency(stats.totalRevenue)}</div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                  <TrendingUp size={12} />
                  {stats.averageGrowth.toFixed(1)}% tăng trưởng TB
                </div>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <DollarSign size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Công nợ hiện tại</div>
                <div className="text-2xl font-bold mt-2 text-emerald-600">{fmtCurrency(stats.totalDues)}</div>
                <div className="text-xs text-gray-600 mt-1">Giảm 25% so với đầu kỳ</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <AlertCircle size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Thanh toán phổ biến</div>
                <div className="text-2xl font-bold mt-2 text-blue-600">Chuyển khoản</div>
                <div className="text-xs text-gray-600 mt-1">75% tổng giao dịch</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <CreditCard size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tăng trưởng tháng</div>
                <div className="text-2xl font-bold mt-2 text-purple-600">+5.5%</div>
                <div className="text-xs text-gray-600 mt-1">Tháng 12/2025</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-white border border-pink-200 rounded-xl p-1">
              {(["revenue", "payment", "dues", "growth"] as ChartType[]).map((chart) => (
                <button
                  key={chart}
                  onClick={() => setActiveChart(chart)}
                  className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all ${
                    activeChart === chart
                      ? `bg-gradient-to-r ${
                          chart === "revenue" ? "from-pink-500 to-rose-500" :
                          chart === "payment" ? "from-blue-500 to-sky-500" :
                          chart === "dues" ? "from-amber-500 to-orange-500" :
                          "from-emerald-500 to-teal-500"
                        } text-white`
                      : "text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  {chart === "revenue" && <BarChart3 size={16} />}
                  {chart === "payment" && <PieChart size={16} />}
                  {chart === "dues" && <AlertCircle size={16} />}
                  {chart === "growth" && <LineChart size={16} />}
                  {chart === "revenue" ? "Doanh thu" : 
                   chart === "payment" ? "Phương thức" : 
                   chart === "dues" ? "Công nợ" : "Tăng trưởng"}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-pink-200 rounded-xl p-1">
              {(["monthly", "quarterly", "yearly"] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    timePeriod === period
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                      : "text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  {period === "monthly" ? "Theo tháng" : 
                   period === "quarterly" ? "Theo quý" : "Theo năm"}
                </button>
              ))}
            </div>
            
            <button className="p-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors">
              <Filter size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeChart === "revenue" && <BarChart3 size={20} className="text-pink-500" />}
                  {activeChart === "payment" && <PieChart size={20} className="text-blue-500" />}
                  {activeChart === "dues" && <AlertCircle size={20} className="text-amber-500" />}
                  {activeChart === "growth" && <LineChart size={20} className="text-emerald-500" />}
                  <h3 className="font-bold text-gray-900">
                    {activeChart === "revenue" ? "Biểu đồ doanh thu" : 
                     activeChart === "payment" ? "Phương thức thanh toán" : 
                     activeChart === "dues" ? "Công nợ theo kỳ" : "Tăng trưởng doanh thu"}
                  </h3>
                </div>
                <div className="text-sm text-gray-600">
                  {DATA.length} kỳ • Cập nhật: Hôm nay
                </div>
              </div>
            </div>
            
            <div className="p-6" ref={chartContainerRef}>
              {/* Simplified Chart Visualization */}
              <div className="space-y-8">
                {DATA.map((row) => {
                  const maxRevenue = getMaxValue("revenue");
                  const maxDues = getMaxValue("dues");
                  const revenueHeight = (row.revenue / maxRevenue) * 100;
                  const duesHeight = (row.dues / maxDues) * 100;
                  
                  return (
                    <div key={row.period} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${row.color}`}>
                            <Calendar size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Kỳ {row.period}</div>
                            <div className="text-sm text-gray-600">Doanh thu: {fmtCurrency(row.revenue)}</div>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-1 ${row.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {row.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          <span className="font-semibold">{row.growth >= 0 ? '+' : ''}{row.growth}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Revenue Bar */}
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 w-20">Doanh thu</div>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-700"
                              style={{ width: `${revenueHeight}%` }}
                            />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                            {fmtCurrency(row.revenue)}
                          </div>
                        </div>
                        
                        {/* Dues Bar */}
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 w-20">Công nợ</div>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                              style={{ width: `${duesHeight}%` }}
                            />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                            {fmtCurrency(row.dues)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Methods */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600">Tiền mặt</div>
                          <div className="text-sm font-semibold text-gray-900">{fmtCurrency(row.byCash)}</div>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <div className="text-xs text-gray-600">Chuyển khoản</div>
                          <div className="text-sm font-semibold text-gray-900">{fmtCurrency(row.byBank)}</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <div className="text-xs text-gray-600">Thẻ tín dụng</div>
                          <div className="text-sm font-semibold text-gray-900">{fmtCurrency(row.byCard)}</div>
                        </div>
                        <div className="text-center p-2 bg-amber-50 rounded-lg">
                          <div className="text-xs text-gray-600">Ví điện tử</div>
                          <div className="text-sm font-semibold text-gray-900">{fmtCurrency(row.byWallet)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats & Export */}
        <div className="space-y-6">
          {/* Payment Method Distribution */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={20} className="text-pink-500" />
              <h3 className="font-bold text-gray-900">Phân bổ phương thức</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stats.paymentMethods).map(([method, amount]) => {
                const percentage = (amount / stats.totalRevenue) * 100;
                const colorMap = {
                  cash: "from-blue-500 to-sky-500",
                  bank: "from-emerald-500 to-teal-500",
                  card: "from-purple-500 to-indigo-500",
                  wallet: "from-amber-500 to-orange-500"
                };
                
                return (
                  <div key={method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900">
                        {method === "cash" ? "Tiền mặt" : 
                         method === "bank" ? "Chuyển khoản" : 
                         method === "card" ? "Thẻ tín dụng" : "Ví điện tử"}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{percentage.toFixed(1)}%</div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colorMap[method as keyof typeof colorMap]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 text-right">{fmtCurrency(amount)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download size={20} className="text-pink-500" />
              <h3 className="font-bold text-gray-900">Xuất báo cáo</h3>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={exportCSV}
                disabled={isGenerating}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isGenerating 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'border-pink-200 bg-white hover:bg-pink-50 group'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Xuất CSV</div>
                    <div className="text-xs text-gray-600">Excel, Google Sheets</div>
                  </div>
                </div>
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
                ) : (
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                )}
              </button>
              
              <button
                onClick={exportPDF}
                disabled={isGenerating}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isGenerating 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'border-pink-200 bg-white hover:bg-pink-50 group'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Printer size={16} className="text-rose-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Xuất PDF</div>
                    <div className="text-xs text-gray-600">Bản in, chia sẻ</div>
                  </div>
                </div>
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
                ) : (
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-rose-600" />
                )}
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Share2 size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Chia sẻ</div>
                    <div className="text-xs text-gray-600">Email, Slack, Teams</div>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-bold">Tóm tắt kỳ</h3>
                <p className="text-sm opacity-90">5 tháng gần nhất</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Tăng trưởng TB</div>
                <div className="font-bold">+5.5%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Công nợ giảm</div>
                <div className="font-bold">-70.8%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Khách hàng mới</div>
                <div className="font-bold">+32</div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 bg-white text-purple-600 rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
              <Calculator size={16} />
              Phân tích chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-pink-500" />
                <h3 className="font-bold text-gray-900">Bảng dữ liệu chi tiết</h3>
              </div>
              <div className="text-sm text-gray-600">Đơn vị: VNĐ</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5">
                <tr className="text-gray-700">
                  <th className="px-6 py-3 text-left font-semibold">Kỳ</th>
                  <th className="px-6 py-3 text-left font-semibold">Doanh thu</th>
                  <th className="px-6 py-3 text-left font-semibold">Tiền mặt</th>
                  <th className="px-6 py-3 text-left font-semibold">Chuyển khoản</th>
                  <th className="px-6 py-3 text-left font-semibold">Thẻ tín dụng</th>
                  <th className="px-6 py-3 text-left font-semibold">Ví điện tử</th>
                  <th className="px-6 py-3 text-left font-semibold">Công nợ</th>
                  <th className="px-6 py-3 text-left font-semibold">Tăng trưởng</th>
                </tr>
              </thead>
              <tbody>
                {DATA.map((row, index) => (
                  <tr key={row.period} className={`border-t border-pink-100 hover:bg-pink-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-pink-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${row.color}`}>
                          <Calendar size={14} className="text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">{row.period}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{fmt(row.revenue)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{fmt(row.byCash)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{fmt(row.byBank)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{fmt(row.byCard)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{fmt(row.byWallet)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${row.dues > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {fmt(row.dues)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 ${row.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="font-semibold">{row.growth >= 0 ? '+' : ''}{row.growth.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-pink-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-500" />
            <span>Dữ liệu được cập nhật tự động • Phân tích thời gian thực</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              <Eye size={16} />
              Xem trước
            </button>
            <button className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              <RefreshCcw size={16} />
              Làm mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}