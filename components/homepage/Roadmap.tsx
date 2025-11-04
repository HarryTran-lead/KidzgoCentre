// components/sections/Roadmap.tsx  (SERVER)
import { ACCENT_TEXT } from "@lib/theme/theme";
import { CheckCircle } from "lucide-react";

export default function Roadmap() {
  const items = [
    {
      title: "PRONUNCIATION MASTER",
      desc: "Chuẩn hoá âm – nhịp – trọng âm theo kiểu vui & dễ nhớ.",
    },
    {
      title: "COMMUNICATION BOOST",
      desc: "Giao tiếp phản xạ, trò chơi tình huống – tự tin nói.",
    },
    {
      title: "EXAM STARTER",
      desc: "Nền tảng Cambridge/Pre-TOEIC – làm bài không sợ.",
    },
    {
      title: "PLAN & HABITS",
      desc: "Thói quen 20–30’/ngày; ba mẹ theo dõi tiến độ.",
    },
    {
      title: "REPORT & COACHING",
      desc: "Bảng tiến bộ hàng tháng & 1:1 coaching khi cần.",
    },
    {
      title: "PROJECT & CLUB",
      desc: "CLB, field trip – dùng tiếng Anh ngoài lớp.",
    },
  ];
  return (
    <section id="roadmap" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black">
            Lộ trình gồm <span className={ACCENT_TEXT}>1 khóa học</span> – nền
            tảng vững chắc
          </h2>
          <p className="mt-2 text-slate-600">
            Phát âm • Giao tiếp • Kỹ năng làm bài – thiết kế riêng cho trẻ em.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-6 shadow-sm border border-rose-100 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-pink-100 text-rose-600 grid place-items-center mb-3">
                <CheckCircle size={18} />
              </div>
              <h3 className="font-bold">{c.title}</h3>
              <p className="text-sm text-slate-600 mt-2">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
