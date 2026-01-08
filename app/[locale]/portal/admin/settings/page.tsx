import { ShieldCheck, Sparkles, BadgePercent, Clock3, Save } from 'lucide-react';

const POLICIES = [
  {
    icon: <Clock3 className="h-5 w-5" />,
    title: 'Chính sách học bù 24h',
    desc: 'Thiết lập auto-approve và số MakeUpCredit được cấp khi nghỉ đúng hạn.',
    status: 'Đang áp dụng',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Gamification (XP/Star/Mission)',
    desc: 'Cấu hình mức thưởng sao, XP và điều kiện hoàn thành nhiệm vụ.',
    status: 'Cập nhật tuần này',
  },
  {
    icon: <BadgePercent className="h-5 w-5" />,
    title: 'Đơn giá học phí theo buổi',
    desc: 'Thiết lập đơn giá tham chiếu cho EXTRA_PAID và ưu đãi gói học.',
    status: 'Đã đồng bộ',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'RBAC & phân quyền',
    desc: 'Thiết lập quyền truy cập theo vai trò và chi nhánh.',
    status: 'Đang bảo vệ',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Cài đặt & Chính sách</h1>
          <p className="text-sm text-gray-600">
            Quản lý cấu hình hệ thống, chính sách học bù và phân quyền toàn trung tâm.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" /> Lưu thay đổi
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {POLICIES.map((policy) => (
          <div key={policy.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700">
                {policy.icon}
              </div>
              <div className="space-y-2">
                <div className="text-lg font-semibold text-slate-900">{policy.title}</div>
                <div className="text-sm text-slate-500">{policy.desc}</div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {policy.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-700">Cấu hình nhanh</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { label: 'Ngưỡng tự duyệt', value: '24 giờ' },
            { label: 'Sao thưởng mặc định', value: '3 sao/bài tập' },
            { label: 'Điểm XP mỗi buổi', value: '15 XP' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs uppercase text-slate-400">{item.label}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}