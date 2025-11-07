"use client";

import { useMemo, useState } from "react";
import { Award, Flame, Download, GraduationCap, Sparkles, Wand2 } from "lucide-react";

type Report = {
  month: string;
  highlights: string[];
  focus: string[];
  score: number;
  behavior: string;
  remarks: string;
};

const REPORTS: Report[] = [
  {
    month: "12/2024",
    highlights: [
      "Hoàn thành 100% bài tập về nhà",
      "Kết quả bài kiểm tra cuối tháng: 8.5/10",
    ],
    focus: [
      "Luyện phản xạ giao tiếp hàng ngày",
      "Tăng vốn từ vựng chủ đề gia đình",
    ],
    score: 8.5,
    behavior: "Chủ động phát biểu, hợp tác tốt với bạn cùng lớp",
    remarks: "Tiếp tục phát huy tinh thần tự giác và duy trì thói quen ôn bài trước buổi học.",
  },
  {
    month: "11/2024",
    highlights: [
      "Đạt danh hiệu Học viên chăm chỉ",
      "Hoàn thành dự án nhóm về lễ hội Việt Nam",
    ],
    focus: [
      "Cải thiện phát âm âm /θ/",
      "Đa dạng hóa cấu trúc câu khi viết",
    ],
    score: 8.0,
    behavior: "Có tiến bộ rõ rệt trong việc làm việc nhóm",
    remarks: "Nên tham gia thêm các hoạt động ngoại khóa tiếng Anh để nâng cao kỹ năng nghe.",
  },
];

function ReportCard({ data }: { data: Report }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Báo cáo học tập</div>
          <h2 className="text-xl font-semibold text-gray-900">Tháng {data.month}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
          <GraduationCap size={16} /> Điểm tổng: {data.score}/10
        </div>
      </div>

      <section className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          <Award size={16} /> Thành tích nổi bật
        </div>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          {data.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
          <Flame size={16} /> Trọng tâm tháng tới
        </div>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          {data.focus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="font-semibold text-gray-900 mb-1">Thái độ học tập</div>
          <p>{data.behavior}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="font-semibold text-gray-900 mb-1">Nhận xét của giáo viên</div>
          <p>{data.remarks}</p>
        </div>
      </section>

      <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <Download size={16} /> Tải báo cáo PDF
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [month, setMonth] = useState(REPORTS[0].month);
  const current = useMemo(() => REPORTS.find((r) => r.month === month)!, [month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Báo cáo học tập</h1>
          <p className="text-sm text-slate-600">
            Theo dõi tiến bộ hàng tháng và các khuyến nghị luyện tập.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
          <Sparkles size={16} /> AI gợi ý hoạt động bổ trợ
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map((report) => (
          <button
            key={report.month}
            onClick={() => setMonth(report.month)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              report.month === month
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tháng {report.month}
          </button>
        ))}
      </div>

      <ReportCard data={current} />

      <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">Nhận gợi ý tự học từ AI</div>
          <p className="text-sm text-slate-600">
            Tải báo cáo và gửi lên AI (ví dụ: ChatGPT) để nhận bài tập luyện tập phù hợp với trình độ hiện tại.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Wand2 size={16} /> Xuất báo cáo cho AI
        </button>
      </div>
    </div>
  );
}