"use client";

import { useState } from "react";
import { Send, Star, MessageSquare, SmilePlus, FileText, PhoneCall } from "lucide-react";

const TOPICS = [
  { id: "teacher", label: "Giáo viên" },
  { id: "facility", label: "Cơ sở vật chất" },
  { id: "schedule", label: "Lịch học" },
  { id: "tuition", label: "Học phí" },
  { id: "other", label: "Khác" },
];

export default function FeedbackPage() {
  const [topic, setTopic] = useState("teacher");
  const [rating, setRating] = useState(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Góp ý & Hỗ trợ</h1>
          <p className="text-sm text-slate-600">
            Gửi phản hồi trực tiếp đến trung tâm hoặc liên hệ bộ phận chăm sóc phụ huynh.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
          <PhoneCall size={16} /> Hotline: 1900 555 999
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6">
        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Chủ đề phản hồi</span>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTopic(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  topic === item.id
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Mức độ hài lòng</span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className={`h-10 w-10 rounded-full grid place-items-center border text-sm font-semibold transition ${
                  value <= rating
                    ? "border-amber-300 bg-amber-50 text-amber-600"
                    : "border-slate-200 text-slate-400"
                }`}
              >
                <Star className="w-4 h-4" fill={value <= rating ? "#fbbf24" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Nội dung phản hồi</span>
          <textarea
            rows={6}
            placeholder="Chia sẻ góp ý của bạn..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
            <MessageSquare className="mt-1 text-slate-500" size={18} />
            <div>
              <div className="font-semibold text-gray-900">Phản hồi được phản hồi trong 24h</div>
              <p>Trung tâm sẽ gửi thông báo qua Zalo và email ngay khi có cập nhật.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
            <SmilePlus className="mt-1 text-slate-500" size={18} />
            <div>
              <div className="font-semibold text-gray-900">Chia sẻ thành tích</div>
              <p>Phụ huynh có thể đính kèm hình ảnh hoặc video để giáo viên nắm tình hình học tập.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <Send size={16} /> Gửi phản hồi
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <FileText size={16} /> Tải mẫu góp ý
          </button>
        </div>
      </div>
    </div>
  );
}