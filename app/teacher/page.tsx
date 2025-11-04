import { BookOpen, CalendarClock, Users, TrendingUp } from "lucide-react";
import StatCard from "@components/teacher/StatCard";
import Badge from "@components/teacher/Badge";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Tổng quan</h1>
        <p className="text-slate-500 text-sm">Hoạt động giảng dạy tuần này</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="text-pink-600" size={18} />}
          label="Lớp đang dạy"
          value="5"
          hint="Ổn định"
          color="pink"
        />
        <StatCard
          icon={<CalendarClock className="text-emerald-600" size={18} />}
          label="Buổi/tuần này"
          value="12"
          hint="+2 so với tuần trước"
          color="green"
        />
        <StatCard
          icon={<Users className="text-amber-600" size={18} />}
          label="Giờ công tháng này"
          value="68h"
          hint="+5h"
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="text-sky-600" size={18} />}
          label="Tổng học viên"
          value="82"
          hint="+3 mới"
          color="blue"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Lịch dạy sắp tới</h3>
          <div className="divide-y">
            {[
              {
                name: "IELTS Foundation - A1",
                time: "08:00 - 10:00 • Phòng 301",
                tag: <Badge color="blue">Hôm nay</Badge>,
                students: 18,
              },
              {
                name: "TOEIC Intermediate",
                time: "14:00 - 16:00 • Phòng 205",
                tag: <Badge color="blue">Hôm nay</Badge>,
                students: 15,
              },
              {
                name: "Business English",
                time: "09:00 - 11:00 • Phòng 102",
                tag: <Badge color="gray">Thứ 6, 10/10</Badge>,
                students: 12,
              },
            ].map((r, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.time}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500">
                    {r.students} học viên
                  </div>
                  {r.tag}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Thông báo mới</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border bg-white">
              <div className="font-medium">Lịch dạy được cập nhật</div>
              <div className="text-xs text-slate-500">
                Lớp IELTS Foundation - A1 chuyển sang phòng 301 từ ngày 12/10
              </div>
              <div className="mt-2">
                <Badge color="blue">Thông tin</Badge>
              </div>
            </div>
            <div className="p-3 rounded-xl border bg-white">
              <div className="font-medium">Nhắc nhở điểm danh</div>
              <div className="text-xs text-slate-500">
                Chưa điểm danh buổi 08/10 cho lớp TOEIC Intermediate
              </div>
              <div className="mt-2">
                <Badge color="red">Quan trọng</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-3">Tiến độ các lớp</h3>
        <div className="space-y-5">
          {[
            { name: "IELTS Foundation - A1", progress: 65, attend: 92 },
            { name: "TOEIC Intermediate", progress: 45, attend: 88 },
            { name: "Business English", progress: 80, attend: 95 },
          ].map((r) => (
            <div key={r.name}>
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">{r.name}</div>
                <div className="text-slate-500">
                  Tiến độ: {r.progress}% • Chuyên cần: {r.attend}%
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full mt-2">
                <div
                  className="h-2 bg-slate-900 rounded-full"
                  style={{ width: `${r.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
