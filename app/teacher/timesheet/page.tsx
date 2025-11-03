import StatCard from "@/components/teacher/StatCard";
import { Clock4, DollarSign, CalendarDays, CheckCircle2 } from "lucide-react";
import Badge from "@/components/teacher/Badge";

export default function Page() {
  const rows = [
    { date: "01/10/2025", class: "English B1-01", hours: 4, rate: 180000, paid: true },
    { date: "03/10/2025", class: "IELTS Prep", hours: 2, rate: 220000, paid: false },
    { date: "05/10/2025", class: "Business English", hours: 3, rate: 200000, paid: true },
  ];
  const currency = (n: number) => n.toLocaleString("vi-VN") + " VND";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Công giờ & Thu nhập</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard icon={<Clock4 className="text-pink-600" size={18} />} label="Tổng giờ tháng này" value="68h" color="pink" />
        <StatCard icon={<DollarSign className="text-emerald-600" size={18} />} label="Thu nhập dự kiến" value="7.7M VND" color="green" />
        <StatCard icon={<CalendarDays className="text-amber-600" size={18} />} label="Ngày đã dạy" value="12" color="yellow" />
        <StatCard icon={<CheckCircle2 className="text-sky-600" size={18} />} label="Thanh toán hoàn tất" value="2" color="blue" />
      </div>

      <div className="rounded-2xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Ngày</th>
              <th className="text-left p-3">Lớp</th>
              <th className="text-left p-3">Giờ</th>
              <th className="text-left p-3">Đơn giá</th>
              <th className="text-left p-3">Thành tiền</th>
              <th className="text-left p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.class}</td>
                <td className="p-3">{r.hours}h</td>
                <td className="p-3">{currency(r.rate)}</td>
                <td className="p-3 font-medium">{currency(r.rate * r.hours)}</td>
                <td className="p-3">
                  <Badge color={r.paid ? "green" : "yellow"}>
                    {r.paid ? "Đã thanh toán" : "Chờ thanh toán"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
