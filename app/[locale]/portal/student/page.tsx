import { Calendar, Clock, UserRound, AlertCircle, BookOpen, Wallet, Bell, ArrowRight } from "lucide-react";

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50  grid place-items-center">{icon}</div>
      <div>
        <div className="text-xs text-gray-900  text-slate-500">{label}</div>
        <div className="text-xl text-gray-900 font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function QuickAction({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl text-gray-900 border border-slate-200 bg-white p-6 hover:shadow-sm transition flex items-center gap-3">
      <div className="w-10 h-10 text-gray-900 rounded-xl bg-slate-50 grid place-items-center">{icon}</div>
      <div className="font-medium text-gray-900">{title}</div>
    </div>
  );
}

export default function Page() {
  const todayClass = {
    name: "Lớp Tiếng Anh A1",
    time: "19:00 - 21:00",
    room: "Phòng 201",
    teacher: "Cô Phương",
  };

  const notices = [
    { type: "warning", title: "Nhắc nhở đóng học phí", date: "20/12/2024", content: "Bạn còn 500,000 VND của khóa A1." },
    { type: "info", title: "Thay đổi lịch học", date: "18/12/2024", content: "Buổi 25/12 chuyển sang phòng 301." },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black text-white grid place-items-center text-xl font-bold">A</div>
            <div>
              <div className="text-lg text-gray-900 font-bold">Xin chào, Nguyễn Văn An</div>
              <div className="text-slate-500 text-sm">Chúc bạn một ngày học tập hiệu quả!</div>
            </div>
          </div>
        </div>
        <StatCard
          icon={<Calendar className="text-indigo-600" size={20} />}
          label="Lớp học hôm nay"
          value={1}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold">Lịch học hôm nay</h3>
            <button className="text-sm text-indigo-600 inline-flex items-center gap-1">
              Xem tất cả <ArrowRight size={16} />
            </button>
          </div>
          <div className="p-5">
            <div className="rounded-xl bg-slate-50 p-4 flex flex-wrap gap-4 items-center">
              <div className="font-medium text-gray-900">{todayClass.name}</div>
              <div className="text-sm text-slate-600 flex items-center gap-2"><Clock size={16}/> {todayClass.time}</div>
              <div className="text-sm text-slate-600 flex items-center gap-2"><BookOpen size={16}/> {todayClass.room}</div>
              <div className="text-sm text-slate-600 flex items-center gap-2"><UserRound size={16}/> {todayClass.teacher}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold">Thông báo quan trọng</h3>
            <div className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">{notices.length}</div>
          </div>
          <div className="p-5 space-y-3">
            {notices.map((n, i) => (
              <div key={i} className="rounded-xl border p-3 bg-white flex items-start gap-3">
                <div className={"mt-0.5 " + (n.type === "warning" ? "text-amber-500" : "text-sky-500")}>
                  <AlertCircle size={18}/>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{n.title}</div>
                  <div className="text-sm text-slate-600 line-clamp-2">{n.content}</div>
                  <div className="text-xs text-slate-400 mt-1">{n.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Thao tác nhanh</h3>
        </div>
        <div className="p-5 grid md:grid-cols-4 gap-4">
          <QuickAction icon={<Calendar size={18} />} title="Lịch học" />
          <QuickAction icon={<UserRound size={18} />} title="Điểm số" />
          <QuickAction icon={<Wallet size={18} />} title="Học phí" />
          <QuickAction icon={<BookOpen size={18} />} title="Tài liệu" />
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start justify-between">
        <div>
          <div className="font-semibold text-amber-800">Nhắc nhở thanh toán</div>
          <div className="text-amber-700">Khóa Tiếng Anh A1 • Còn nợ: <b>500.000 ₫</b> • Hạn cuối: 15/1/2025</div>
        </div>
        <button className="bg-amber-600 text-white rounded-xl px-3 py-2 text-sm">Xem chi tiết</button>
      </div>
    </div>
  );
}