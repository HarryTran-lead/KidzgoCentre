import { CreditCard, ShieldCheck, Bell, BookOpen, ArrowRight, TrendingUp, Clock } from "lucide-react";

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
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-500 to-orange-500 text-white grid place-items-center text-xl font-bold">
              BK
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">Chào phụ huynh, Bố Khương</div>
              <div className="text-slate-500 text-sm">Theo dõi tiến độ và các thông tin tài chính của học viên.</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <div className="font-semibold text-amber-800">Tiến độ tuần</div>
              <div className="text-amber-700">Hoàn thành 82% mục tiêu</div>
            </div>
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
              <div className="font-semibold text-indigo-800">Buổi học sắp tới</div>
              <div className="text-indigo-700">19:00 hôm nay — Phòng 201</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-500">Học phí còn lại</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">500.000 ₫</div>
            <div className="text-sm text-amber-600">Hạn thanh toán: 15/01/2025</div>
            <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
              Xem chi tiết <ArrowRight size={16} />
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-500">Báo cáo gần nhất</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">Tuần 12</div>
            <div className="text-sm text-slate-600">Đã có phản hồi từ giáo viên</div>
            <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
              Xem báo cáo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Tổng quan học tập</h3>
            <button className="text-sm text-indigo-600 font-semibold inline-flex items-center gap-1">
              Xem điểm chi tiết <ArrowRight size={16} />
            </button>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                <TrendingUp size={18} /> Tiến bộ kỹ năng
              </div>
              <p className="text-slate-700 text-sm mt-2">Kỹ năng Speaking tăng 12% so với tuần trước. Học viên tham gia đầy đủ và tích cực phát biểu.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen size={18} /> Bài tập & tài liệu
              </div>
              <ul className="mt-2 text-sm text-slate-700 space-y-1 list-disc list-inside">
                <li>Đã nộp: Worksheet buổi 7 (điểm 9/10)</li>
                <li>Chưa nộp: Viết đoạn văn Unit 5 (hạn 22/12)</li>
                <li>Tài liệu mới: Audio luyện nghe bài 8</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Thông báo & phê duyệt</h3>
            <div className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">{approvals.length}</div>
          </div>
          <div className="p-5 space-y-3">
            {approvals.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 flex gap-3">
                <ShieldCheck className="text-amber-600 mt-1" size={18} />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  <div className="text-sm text-slate-600">{item.detail}</div>
                  <button className="mt-2 text-sm text-amber-700 font-semibold inline-flex items-center gap-1">
                    Xem và xác nhận <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Lịch học tuần này</h3>
            <button className="text-sm text-indigo-600 font-semibold inline-flex items-center gap-1">
              Tải xuống <ArrowRight size={16} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {weeklySchedule.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{item.day}</div>
                  <div className="text-sm text-slate-600">{item.topic}</div>
                  <div className="text-xs text-slate-500">{item.room}</div>
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-indigo-700 font-semibold">
                  <Clock size={16} /> {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Trao đổi với trung tâm</h3>
            <button className="text-sm text-indigo-600 font-semibold inline-flex items-center gap-1">
              Gửi tin nhắn <ArrowRight size={16} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="rounded-xl border border-slate-200 p-3 bg-white flex items-start gap-3">
              <Bell className="text-indigo-600 mt-1" size={18} />
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Nhận thông báo quan trọng</div>
                <p className="text-sm text-slate-600">
                  Tin nhắn về học phí, báo cáo và điểm danh sẽ được gửi qua ứng dụng và Zalo của phụ huynh.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-white flex items-start gap-3">
              <CreditCard className="text-emerald-600 mt-1" size={18} />
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Thanh toán & hoá đơn</div>
                <p className="text-sm text-slate-600">
                  Tra cứu lịch sử đóng học phí, tải hoá đơn điện tử và chọn phương thức thanh toán nhanh chóng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}