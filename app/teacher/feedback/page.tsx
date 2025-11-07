"use client";

import { useMemo, useState } from "react";
import {
  UserRound,
  Sparkles,
  Download,
  Send,
  FileAudio,
  Stars,
  Wand2,
  BookOpenCheck,
} from "lucide-react";

type Feedback = {
  studentId: string;
  studentName: string;
  month: string;
  achievements: string[];
  improvement: string[];
  homeworkRate: number;
  attendanceRate: number;
};

const FEEDBACKS: Feedback[] = [
  {
    studentId: "HV001",
    studentName: "Nguyễn Văn An",
    month: "12/2024",
    achievements: [
      "Hoàn thành 100% bài tập tuần",
      "Chủ động phát biểu trong 3/4 buổi học",
    ],
    improvement: ["Luyện phát âm âm /th/", "Tăng phản xạ nghe - trả lời"],
    homeworkRate: 100,
    attendanceRate: 95,
  },
  {
    studentId: "HV002",
    studentName: "Trần Thị Bình",
    month: "12/2024",
    achievements: [
      "Hoàn thành bài thuyết trình nhóm", "Tiến bộ rõ rệt về từ vựng chủ đề du lịch",
    ],
    improvement: ["Duy trì thời gian nộp bài đúng hạn", "Trau dồi kỹ năng viết đoạn văn"],
    homeworkRate: 90,
    attendanceRate: 88,
  },
];

function FeedbackCard({ data }: { data: Feedback }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Mã HV: {data.studentId}</div>
          <div className="text-lg font-semibold text-gray-900">{data.studentName}</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <BookOpenCheck size={16} /> Tháng {data.month}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4 space-y-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Stars size={16} /> Thành tích
          </div>
          <ul className="list-disc pl-5 text-sm text-emerald-900 space-y-1">
            {data.achievements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-amber-50 p-4 space-y-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Sparkles size={16} /> Hướng cải thiện
          </div>
          <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
            {data.improvement.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Tỷ lệ hoàn thành bài tập</div>
          <div className="text-2xl font-extrabold text-gray-900">{data.homeworkRate}%</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Tỷ lệ chuyên cần</div>
          <div className="text-2xl font-extrabold text-gray-900">{data.attendanceRate}%</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Download size={16} /> Xuất báo cáo PDF
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Send size={16} /> Gửi phụ huynh qua Zalo
        </button>
      </div>
    </div>
  );
}

export default function TeacherFeedbackPage() {
  const [month, setMonth] = useState("12/2024");
  const list = useMemo(() => FEEDBACKS.filter((f) => f.month === month), [month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Feedback tháng cho học viên</h1>
          <p className="text-sm text-slate-500">
            Tổng hợp báo cáo từng học viên, gửi phụ huynh sau khi quản lý duyệt.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          <UserRound size={18} /> 18 học viên trong tháng
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["12/2024", "11/2024", "10/2024"].map((m) => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              m === month
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tháng {m}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <FeedbackCard key={item.studentId} data={item} />
        ))}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Chưa có báo cáo cho tháng này.
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Tạo nhận xét bằng AI</div>
          <p className="text-sm text-slate-600">
            Sao chép nhận xét từ lớp học, gửi sang ChatGPT để tạo bản nháp và đồng bộ lại chỉ với một nút bấm.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Wand2 size={16} /> Đồng bộ từ AI
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Lưu trữ và chia sẻ</div>
          <p className="text-sm text-slate-600">
            Sau khi quản lý duyệt, báo cáo sẽ tự động hiển thị cho phụ huynh và được xuất thành file riêng từng học viên.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <FileAudio size={16} /> Xuất file gửi quản lý
          </button>
        </div>
      </div>
    </div>
  );
}