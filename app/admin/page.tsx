import StatCard from "@components/admin/StatCard";
import { Users, UserCog, BookOpen, DollarSign } from "lucide-react";
import Badge from "@components/admin/Badge";

export const metadata = { title: "Dashboard • KidzGo" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-800 text-sm">
          Tổng quan hoạt động trung tâm tiếng Anh KidzGo
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-pink-600" size={20} />} label="Học viên" value="487" hint="+12 so với tháng trước" color="pink" />
        <StatCard icon={<UserCog className="text-emerald-600" size={20} />} label="Giáo viên" value="18" hint="+2 so với tháng trước" color="mint" />
        <StatCard icon={<BookOpen className="text-amber-600" size={20} />} label="Lớp đang hoạt động" value="32" hint="+5 so với tháng trước" color="yellow" />
        <StatCard icon={<DollarSign className="text-sky-600" size={20} />} label="Doanh thu tháng này" value="1.2M VND" hint="+15%" color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold mb-2 text-gray-900">Lớp học hôm nay</h3>
          <div className="divide-y">
            {["English B1-01", "IELTS Prep-02", "TOEIC Advanced"].map((n, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{n}</div>
                  <div className="text-xs text-gray-700">08:00 - 10:00 • Phòng P10{1 + i}</div>
                </div>
                <Badge color={i === 0 ? "green" : "yellow"}>
                  {i === 0 ? "Đang diễn ra" : "Sắp diễn ra"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold mb-2 text-gray-900">Nhắc nhở học phí</h3>
          <div className="space-y-3">
            {[
              { name: "Nguyễn Văn A", course: "English B1", due: "15/10/2025", amount: "2,500,000 VND", state: "Sắp đến hạn" },
              { name: "Trần Thị B", course: "IELTS Prep", due: "01/10/2025", amount: "3,200,000 VND", state: "Quá hạn" },
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-xl border bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-700">
                    {r.course} • Hạn {r.due}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{r.amount}</div>
                  <div className="mt-1">
                    <Badge color={i === 0 ? "yellow" : "red"}>{r.state}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
