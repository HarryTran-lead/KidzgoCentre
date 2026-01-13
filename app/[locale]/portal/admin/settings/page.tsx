import { 
  ShieldCheck, 
  Sparkles, 
  BadgePercent, 
  Clock3, 
  Save, 
  Settings, 
  Bell, 
  Users,
  Calendar,
  BookOpen,
  Zap,
  ChevronRight,
  Edit2,
  MoreVertical
} from 'lucide-react';

const POLICIES = [
  {
    icon: <Clock3 className="h-5 w-5" />,
    title: 'Chính sách học bù 24h',
    desc: 'Thiết lập auto-approve và số MakeUpCredit được cấp khi nghỉ đúng hạn.',
    status: 'Đang áp dụng',
    color: 'bg-gradient-to-r from-blue-500 to-sky-500',
    statusColor: 'emerald',
    features: ['Auto-approve', 'MakeUpCredit', 'Thông báo tự động']
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Gamification (XP/Star/Mission)',
    desc: 'Cấu hình mức thưởng sao, XP và điều kiện hoàn thành nhiệm vụ.',
    status: 'Cập nhật tuần này',
    color: 'bg-gradient-to-r from-pink-500 to-rose-500',
    statusColor: 'amber',
    features: ['Hệ thống sao', 'Missions', 'Leaderboard']
  },
  {
    icon: <BadgePercent className="h-5 w-5" />,
    title: 'Đơn giá học phí theo buổi',
    desc: 'Thiết lập đơn giá tham chiếu cho EXTRA_PAID và ưu đãi gói học.',
    status: 'Đã đồng bộ',
    color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    statusColor: 'blue',
    features: ['Định giá linh hoạt', 'Ưu đãi gói', 'Chiết khấu']
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'RBAC & phân quyền',
    desc: 'Thiết lập quyền truy cập theo vai trò và chi nhánh.',
    status: 'Đang bảo vệ',
    color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    statusColor: 'purple',
    features: ['Role-based', 'Chi nhánh', 'Audit log']
  },
];

const QUICK_SETTINGS = [
  { icon: <Bell className="h-4 w-4" />, label: 'Thông báo tự động', value: 'Bật', active: true },
  { icon: <Users className="h-4 w-4" />, label: 'Giới hạn học thử', value: '2 buổi', active: true },
  { icon: <Calendar className="h-4 w-4" />, label: 'Thời gian đóng đăng ký', value: 'Trước 2h', active: false },
  { icon: <BookOpen className="h-4 w-4" />, label: 'Gia hạn tự động', value: 'Tắt', active: false },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <Settings size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Cài đặt & Chính sách
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Zap size={14} className="text-pink-500" />
                Quản lý cấu hình hệ thống, chính sách học bù và phân quyền toàn trung tâm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors cursor-pointer">
              <Edit2 size={16} />
              Chế độ chỉnh sửa
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
              <Save size={16} />
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-pink-600">Chính sách</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">4</div>
                <div className="text-xs text-gray-500 mt-1">đang hoạt động</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600">Cấu hình</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">12</div>
                <div className="text-xs text-gray-500 mt-1">tuỳ chỉnh</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-100 to-sky-100 flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-600">Đã đồng bộ</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">3</div>
                <div className="text-xs text-gray-500 mt-1">chính sách</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center">
                <BadgePercent className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-600">Cần xem xét</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">1</div>
                <div className="text-xs text-gray-500 mt-1">cập nhật</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Policies Section */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Chính sách hệ thống</h2>
            <span className="text-sm text-gray-500">4 chính sách</span>
          </div>

          <div className="grid gap-4">
            {POLICIES.map((policy, index) => (
              <div key={policy.title} className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 transition-all hover:border-pink-300 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${policy.color} flex items-center justify-center text-white`}>
                    {policy.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{policy.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{policy.desc}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-pink-100 rounded-lg">
                        <MoreVertical size={18} className="text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        policy.statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        policy.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        policy.statusColor === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                        {policy.status}
                      </span>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {policy.features.map((feature, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs text-pink-700">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-pink-100">
                  <div className="text-sm text-gray-500">Cập nhật lần cuối: 2 ngày trước</div>
                  <button className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700 cursor-pointer">
                    Chi tiết
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Settings Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Hành động nhanh</h3>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-xl border border-pink-200 bg-white p-3 hover:bg-pink-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Phân quyền nhân sự</div>
                    <div className="text-xs text-gray-500">Cấp quyền theo vai trò</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              
              <button className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-white p-3 hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-100 to-sky-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Lịch học bù</div>
                    <div className="text-xs text-gray-500">Cấu hình auto-schedule</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              
              <button className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-white p-3 hover:bg-emerald-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Cài đặt học phí</div>
                    <div className="text-xs text-gray-500">Điều chỉnh đơn giá</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Quick Configuration */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Cấu hình nhanh</h3>
            <div className="space-y-3">
              {QUICK_SETTINGS.map((setting, index) => (
                <div key={setting.label} className="flex items-center justify-between p-3 rounded-xl border border-pink-100 hover:bg-pink-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      setting.active 
                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500'
                    }`}>
                      {setting.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{setting.label}</div>
                      <div className="text-xs text-gray-500">Trạng thái hiện tại</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      setting.active ? 'text-emerald-700' : 'text-gray-700'
                    }`}>
                      {setting.value}
                    </span>
                    <div className={`h-2 w-2 rounded-full ${
                      setting.active ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
        <div className="space-y-3">
          {[
            { action: 'Cập nhật chính sách học bù', user: 'Admin', time: '10 phút trước', type: 'policy' },
            { action: 'Thay đổi phân quyền giáo viên', user: 'Quản lý', time: '2 giờ trước', type: 'security' },
            { action: 'Điều chỉnh đơn giá TOEIC', user: 'Kế toán', time: 'Hôm qua', type: 'finance' },
            { action: 'Kích hoạt gamification', user: 'Admin', time: '2 ngày trước', type: 'feature' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-pink-100 hover:bg-pink-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'policy' ? 'bg-blue-50 text-blue-600' :
                  activity.type === 'security' ? 'bg-purple-50 text-purple-600' :
                  activity.type === 'finance' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-pink-50 text-pink-600'
                }`}>
                  {activity.type === 'policy' ? <Clock3 size={14} /> :
                   activity.type === 'security' ? <ShieldCheck size={14} /> :
                   activity.type === 'finance' ? <BadgePercent size={14} /> :
                   <Sparkles size={14} />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  <div className="text-xs text-gray-500">bởi {activity.user}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          <span className="text-pink-600 font-medium">KidzGo System v2.5</span> • Tất cả thay đổi sẽ được áp dụng sau 5 phút
        </p>
      </div>
    </div>
  );
}