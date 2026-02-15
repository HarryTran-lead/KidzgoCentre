import { 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  BookOpen, 
  ArrowRight, 
  TrendingUp, 
  Clock,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Target,
  Activity,
  MapPin
} from "lucide-react";
import ChildOverviewCard from "@/components/portal/parent/ChildOverviewCard";

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

const weeklySchedule = [
  { day: "Thứ 2", time: "19:00 - 21:00", room: "P201", topic: "Reading & Vocabulary" },
  { day: "Thứ 5", time: "19:00 - 21:00", room: "P301", topic: "Speaking practice" },
];

const approvals = [
  { title: "Xác nhận học phí kỳ 1", detail: "500.000 ₫ còn lại • Hạn 15/01/2025" },
  { title: "Phản hồi cuối kỳ", detail: "Báo cáo tuần 12 đã sẵn sàng để xem" },
];

export default function ParentPage() {
  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Trang chủ phụ huynh
          </h1>
          <p className="text-xs text-gray-600">
            Theo dõi tiến độ học tập và tài chính của con
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} />}
          label="Tiến độ học tập"
          value="82%"
          hint="Hoàn thành mục tiêu tuần"
          trend="up"
          color="red"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Buổi học tiếp theo"
          value="19:00"
          hint="Hôm nay • Phòng 201"
          trend="stable"
          color="gray"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Học phí còn lại"
          value="500K"
          hint="Hạn thanh toán 15/01"
          trend="down"
          color="black"
        />
        <StatCard
          icon={<Bell size={20} />}
          label="Thông báo mới"
          value="3"
          hint="Chưa đọc"
          trend="up"
          color="red"
        />
      </div>

      {/* Child Overview */}
      <ChildOverviewCard />

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white grid place-items-center text-lg font-bold shadow-md">
              BK
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">Chào phụ huynh, Bố Khương</div>
              <div className="text-xs text-gray-600">Theo dõi tiến độ và các thông tin tài chính của học viên</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs font-semibold text-gray-900">Tiến độ tuần</span>
              </div>
              <div className="text-sm font-medium text-gray-900">Hoàn thành 82%</div>
              <div className="text-[10px] text-gray-500 mt-0.5">mục tiêu học tập</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-xs font-semibold text-gray-900">Buổi tiếp theo</span>
              </div>
              <div className="text-sm font-medium text-gray-900">19:00 hôm nay</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Phòng 201</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500">Học phí còn lại</div>
            <div className="text-xl font-bold text-gray-900 mt-1">500.000 ₫</div>
            <div className="text-[10px] text-red-600 mt-0.5">Hạn: 15/01/2025</div>
            <button className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
              Xem chi tiết <ArrowRight size={12} />
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500">Báo cáo gần nhất</div>
            <div className="text-xl font-bold text-gray-900 mt-1">Tuần 12</div>
            <div className="text-[10px] text-gray-600 mt-0.5">Đã có phản hồi</div>
            <button className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-gray-700">
              Xem báo cáo <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Learning Overview & Notifications */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Learning Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tổng quan học tập</h3>
            <button className="text-xs text-red-600 font-medium inline-flex items-center gap-1">
              Xem điểm chi tiết <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-4 grid sm:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-gray-900">Tiến bộ kỹ năng</span>
              </div>
              <p className="text-xs text-gray-600">
                Kỹ năng Speaking tăng 12% so với tuần trước. Học viên tham gia đầy đủ và tích cực phát biểu.
              </p>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-4 h-4 text-gray-700" />
                <span className="text-xs font-semibold text-gray-900">Bài tập & tài liệu</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Đã nộp: Worksheet buổi 7 (9/10)</span>
                </li>
                <li className="flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Chưa nộp: Viết đoạn văn Unit 5</span>
                </li>
                <li className="flex items-start gap-1">
                  <Sparkles className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Tài liệu mới: Audio luyện nghe bài 8</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Approvals */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Thông báo & phê duyệt</h3>
            <Badge color="red">{approvals.length}</Badge>
          </div>
          <div className="p-4 space-y-3">
            {approvals.map((item, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{item.detail}</div>
                  <button className="mt-2 text-xs text-red-600 font-medium inline-flex items-center gap-0.5">
                    Xem và xác nhận <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule & Communication */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly Schedule */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Lịch học tuần này</h3>
            <button className="text-xs text-gray-600 font-medium inline-flex items-center gap-1">
              Tải xuống <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {weeklySchedule.map((item, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.day}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{item.topic}</div>
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.room}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Communication */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Trao đổi với trung tâm</h3>
            <button className="text-xs text-red-600 font-medium inline-flex items-center gap-1">
              Gửi tin nhắn <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 border border-gray-200 rounded-xl flex items-start gap-2">
              <Bell className="w-4 h-4 text-gray-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Nhận thông báo quan trọng</div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Tin nhắn về học phí, báo cáo và điểm danh sẽ được gửi qua ứng dụng và Zalo.
                </p>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-gray-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Thanh toán & hoá đơn</div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Tra cứu lịch sử đóng học phí, tải hoá đơn điện tử và chọn phương thức thanh toán.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Cập nhật 09:30 • Dữ liệu mới nhất</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Quan trọng</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Thông tin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}