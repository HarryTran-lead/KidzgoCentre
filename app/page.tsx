"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users, Award, Clock, Globe, Star, GraduationCap,
  CheckCircle, Phone, Mail, MapPin, ArrowRight, Sparkles,
  BookOpen, Image as ImageIcon, Newspaper
} from "lucide-react";

/** Assets */
const LOGO_LOCAL = "/image/LogoKidzgo.jpg";
const HERO_IMG =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop";

/* ================================
   PASTEL KIDZGO PALETTE (white–yellow–pink)
   -> chỉ cần chỉnh 4 biến dưới nếu muốn đổi tông
=================================== */
const PRIMARY_GRAD = "bg-gradient-to-r from-amber-300 via-pink-300 to-rose-300"; // pastel chính
const PRIMARY_GRAD_SOFT = "bg-gradient-to-r from-amber-200 via-pink-200 to-rose-200";
const CTA_GRAD = "bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400"; // CTA đậm hơn chút để dễ đọc
const ACCENT_TEXT =
  "bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent";
const SURFACE_SOFT = "bg-gradient-to-b from-pink-50 via-amber-50 to-white";
const SURFACE_BORDER = "border-rose-100";

export default function Landing() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  return (
    <div className={`min-h-screen ${SURFACE_SOFT} text-slate-900`}>
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-rose-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-16 flex items-center justify-between">
            <a href="#hero" className="flex items-center gap-3 group">
              <div className={`w-10 h-10 rounded-xl ${PRIMARY_GRAD} grid place-items-center shadow-lg overflow-hidden`}>
                <Image src={LOGO_LOCAL} alt="KidzGo logo" width={26} height={26} priority className="object-contain" />
              </div>
              <div>
                <div className="font-semibold text-lg">KidzGo</div>
                <div className="text-[11px] text-slate-500">Learning Through Play</div>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#roadmap" className="hover:text-rose-600">Lộ trình</a>
              <a href="#courses" className="hover:text-rose-600">Courses</a>
              <a href="#programs" className="hover:text-rose-600">Khóa học</a>
              <a href="#gallery" className="hover:text-rose-600">Hình ảnh</a>
              <a href="#blog" className="hover:text-rose-600">Blog</a>
              <a href="#contact" className={`px-4 py-2 rounded-lg text-white font-medium ${CTA_GRAD} hover:shadow-lg`}>
                Liên hệ
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="relative pt-28 pb-16 overflow-hidden">
        {/* pastel blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-200/55 blur-3xl" />
          <div className="absolute top-40 -right-20 w-[28rem] h-[28rem] rounded-full bg-pink-200/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-rose-200/45 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Ưu đãi khai giảng – đăng ký ngay
              </span>

              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                Lộ trình <span className={ACCENT_TEXT}>Tiếng Anh Pastel</span> cho bé
              </h1>

              <p className="text-lg text-slate-600 max-w-xl">
                Không gian dịu mắt – màu sắc vui nhộn. Lớp nhỏ, theo sát từng bé: phát âm • giao tiếp • kỹ năng làm bài.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#courses"
                  className={`group px-6 py-3 rounded-xl text-white font-semibold ${CTA_GRAD} hover:shadow-xl transition-all flex items-center gap-2`}
                >
                  Đăng ký học <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#contact"
                  className={`px-6 py-3 rounded-xl border ${SURFACE_BORDER} font-semibold hover:bg-slate-900 hover:text-white transition-colors`}
                >
                  Nhận tư vấn
                </a>
              </div>

              {/* stats */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { num: "10,000+", label: "Học viên" },
                  { num: "50+", label: "Giáo viên" },
                  { num: "95%", label: "Hài lòng" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border ${SURFACE_BORDER} bg-white p-4 text-center`}>
                    <div className="text-2xl font-extrabold text-rose-600">{s.num}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-pink-200/50 blur-2xl" />
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
                <img src={HERO_IMG} alt="Classroom" className="w-full h-[520px] object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black">
              Lộ trình gồm <span className={ACCENT_TEXT}>1 khóa học</span> – nền tảng vững chắc
            </h2>
            <p className="mt-2 text-slate-600">Phát âm • Giao tiếp • Kỹ năng làm bài – thiết kế riêng cho trẻ em.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "PRONUNCIATION MASTER", desc: "Chuẩn hoá âm – nhịp – trọng âm theo kiểu vui & dễ nhớ." },
              { title: "COMMUNICATION BOOST", desc: "Giao tiếp phản xạ, trò chơi tình huống – tự tin nói." },
              { title: "EXAM STARTER", desc: "Nền tảng Cambridge/Pre-TOEIC – làm bài không sợ." },
              { title: "PLAN & HABITS", desc: "Thói quen 20–30’/ngày; ba mẹ theo dõi tiến độ." },
              { title: "REPORT & COACHING", desc: "Bảng tiến bộ hàng tháng & 1:1 coaching khi cần." },
              { title: "PROJECT & CLUB", desc: "CLB, field trip – dùng tiếng Anh ngoài lớp." },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
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

      {/* WHY US */}
      <section id="why" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              Vì sao chọn KidzGo
            </span>
            <h2 className="mt-4 text-4xl font-extrabold">
              Khác biệt tạo <span className={ACCENT_TEXT}>hiệu quả</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Lớp nhỏ", desc: "Tối đa 8 học viên – cá nhân hoá cao." },
              { icon: Award, title: "GV chuẩn quốc tế", desc: "Kinh nghiệm luyện thi & giao tiếp cho trẻ em." },
              { icon: Clock, title: "Lịch linh hoạt", desc: "Sáng/chiều/tối & cuối tuần." },
              { icon: Globe, title: "Ứng dụng thực tế", desc: "Dự án – CLB – field trip." },
              { icon: Star, title: "Kết quả đo lường", desc: "Theo dõi tiến bộ hàng tuần." },
              { icon: GraduationCap, title: "Test đầu vào/ra", desc: "Miễn phí & chính xác." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={`rounded-2xl border ${SURFACE_BORDER} bg-white p-6 hover:shadow-md transition-shadow`}>
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 grid place-items-center mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-slate-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-rose-600 text-xs font-semibold">Chương trình</span>
            <h2 className="mt-4 text-4xl font-extrabold">Popular <span className={ACCENT_TEXT}>Courses</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "General English", level: "All Levels", time: "2 × 90’ / tuần", badge: "Adults",
                img: "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop" },
              { title: "IELTS Intensive", level: "Intermediate+", time: "3 × 90’ / tuần", badge: "Exam",
                img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1400&auto=format&fit=crop", highlight: true },
              { title: "Kids & Teens", level: "6–17 tuổi", time: "2 × 60’ / tuần", badge: "Young Learners",
                img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1400&auto=format&fit=crop" },
            ].map((c) => (
              <div
                key={c.title}
                className={`rounded-2xl overflow-hidden bg-white border ${
                  c.highlight ? "border-rose-300 shadow-[0_0_0_3px_rgba(244,114,182,.15)]" : SURFACE_BORDER
                } hover:shadow-lg transition-shadow`}
              >
                <div className="relative h-40">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 text-xs font-semibold bg-white/90 backdrop-blur px-2 py-1 rounded-full">
                    {c.badge}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{c.title}</h3>
                  <div className="text-sm text-slate-600 mt-1">
                    {c.level} • <span className="inline-flex items-center gap-1"><Clock size={14} /> {c.time}</span>
                  </div>
                  <a href="#contact" className={`mt-4 inline-block px-4 py-2 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-sm font-semibold`}>
                    Gửi tư vấn
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS BY LEVEL */}
      <section id="programs" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-black">
              Khóa học <span className={ACCENT_TEXT}>phù hợp</span> với từng bé
            </h3>
            <div className="mt-2 inline-block px-3 py-1 rounded-full border border-amber-300 text-xs font-bold tracking-wide">
              Khóa 2 tháng tặng ngay 1 tháng
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "1. Cambridge (Starters–Movers–Flyers)",
                bullets: ["Mục tiêu học bổng", "Đánh vần chuẩn Mỹ – phát âm tự nhiên", "Song song Cambridge → IELTS"],
              },
              {
                title: "2. Giao tiếp phản xạ",
                bullets: ["Tình huống & role-play", "Tăng vốn từ và flow khi nói", "Speaking task mỗi buổi"],
              },
              {
                title: "3. Khơi dậy yêu thích",
                bullets: ["Trò chơi, âm nhạc, kể chuyện", "Hình thành thói quen nghe–nói", "Báo cáo tiến bộ cho PH"],
              },
              {
                title: "4. Kỹ năng & Dự án",
                bullets: ["Kỹ năng mềm, phản biện", "Dự án văn hoá bằng TA", "Review hàng tuần"],
              },
              {
                title: "5. Hoạt động ngoại khoá",
                bullets: ["City tour, field trip", "Tự lập & teamwork", "Ứng dụng TA ngoài lớp"],
              },
            ].map((box, i) => (
              <div key={i} className={`rounded-2xl bg-white border ${SURFACE_BORDER} p-6 shadow-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-rose-600" />
                  <h4 className="font-semibold">{box.title}</h4>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {box.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-1"><CheckCircle className="w-4 h-4 text-amber-500" /></span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-rose-600 text-xs font-semibold">
              Student Success Stories
            </span>
            <h2 className="mt-4 text-4xl font-extrabold">
              Học viên nói gì về <span className={ACCENT_TEXT}>KidzGo</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Minh Anh", score: "5.5 → 7.5", quote: "Giáo viên tận tâm, phương pháp dễ hiểu – tiến bộ rất nhanh!" },
              { name: "Thanh Long", score: "Beginner → B2", quote: "Tự tin giao tiếp sau 3 tháng. Lớp nhỏ nên được sửa rất kỹ." },
              { name: "Mai Linh", score: "6.0 → 8.0", quote: "Đậu trường mơ ước. Cảm ơn thầy cô đã đồng hành!" },
            ].map((t) => (
              <div key={t.name} className={`rounded-2xl border ${SURFACE_BORDER} bg-white p-6`}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-slate-700 italic">“{t.quote}”</p>
                <div className="mt-3 text-xs text-slate-500 font-medium">{t.name} — {t.score}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-black flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-rose-600" /> Lớp học & CLB Tiếng Anh KidzGo
              </h3>
              <p className="text-slate-600">Khoảnh khắc học tập – vui chơi – ngoại khóa.</p>
            </div>
          </div>

          {/* Masonry-ish grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>img]:mb-4">
            {[
              "/gallery/1.jpg","/gallery/2.jpg","/gallery/3.jpg","/gallery/4.jpg","/gallery/5.jpg","/gallery/6.jpg",
              "/gallery/7.jpg","/gallery/8.jpg","/gallery/9.jpg","/gallery/10.jpg","/gallery/11.jpg","/gallery/12.jpg",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`KidzGo gallery ${i + 1}`}
                className={`w-full rounded-xl border ${SURFACE_BORDER} shadow-sm object-cover`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            (Đặt ảnh thật tại <code>/public/gallery/1.jpg … 12.jpg</code> để hiển thị đẹp nhất.)
          </p>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-black flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-rose-600" /> Bài viết mới
            </h3>
            <a href="#" className="text-sm font-semibold text-rose-600 hover:underline">Xem tất cả</a>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "5 mẹo sửa phát âm cho bé tại nhà",
                img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop",
                excerpt: "Hoạt động đơn giản giúp bé tự tin nói tiếng Anh mỗi ngày.",
                tag: "Kỹ năng",
              },
              {
                title: "Cambridge: Starters → Movers → Flyers",
                img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop",
                excerpt: "Cấu trúc đề & cách luyện đều – chắc – vui tại KidzGo.",
                tag: "Cambridge",
              },
              {
                title: "Checklist xin học bổng trung học Mỹ",
                img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
                excerpt: "Chuẩn bị hồ sơ, hoạt động ngoại khoá & chứng chỉ.",
                tag: "Học bổng",
              },
            ].map((post) => (
              <article key={post.title} className={`rounded-2xl overflow-hidden bg-white border ${SURFACE_BORDER} shadow-sm hover:shadow-md transition-shadow`}>
                <div className="relative h-44">
                  <img src={post.img} alt={post.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur border border-white/60">
                    {post.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="font-semibold leading-snug">{post.title}</h4>
                  <p className="text-sm text-slate-600 mt-2">{post.excerpt}</p>
                  <a href="#" className="mt-3 inline-block text-sm font-semibold text-rose-600 hover:underline">
                    Đọc tiếp →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA pastel */}
      <section className={`py-16 ${CTA_GRAD} text-white`}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-3">Ưu đãi còn lại hôm nay</h2>
          <p className="text-lg text-white/90">Đăng ký giữ chỗ để nhận giảm học phí và bộ tài liệu Kids Starter.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <a href="#contact" className="px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:shadow-lg">
              Giữ chỗ ngay
            </a>
            <a href="#courses" className="px-6 py-3 rounded-xl border border-white/80 font-semibold hover:bg-white/10">
              Xem chương trình
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold">Liên hệ <span className={ACCENT_TEXT}>KidzGo</span></h2>
            <p className="text-slate-600">Phản hồi trong 24 giờ</p>
          </div>

        <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              {[
                { icon: Phone, label: "Hotline", value: "+84 999 888 777" },
                { icon: Mail, label: "Email", value: "hello@kidzgo.edu.vn" },
                { icon: MapPin, label: "Địa chỉ", value: "123 Nguyen Hue, District 1, HCMC" },
              ].map((i, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${PRIMARY_GRAD} text-white grid place-items-center`}>
                    <i.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{i.label}</div>
                    <div className="font-semibold">{i.value}</div>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl overflow-hidden h-56 ring-1 ring-black/5">
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop"
                  className="w-full h-full object-cover"
                  alt="Location"
                />
              </div>
            </div>

            <form className={`rounded-2xl bg-white border ${SURFACE_BORDER} p-6 space-y-3 shadow-sm`}>
              <input
                className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:outline-none"
                placeholder="Họ và tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:outline-none"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:outline-none"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 focus:outline-none h-28"
                placeholder="Nhu cầu & mục tiêu của bé"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button className={`w-full py-3 rounded-lg text-white font-semibold ${CTA_GRAD} hover:shadow-lg`}>
                Gửi yêu cầu tư vấn
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-rose-200/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${PRIMARY_GRAD} grid place-items-center font-black text-sm text-white`}>KG</div>
                <div className="font-semibold">KidzGo</div>
              </div>
              <p className="text-sm text-slate-700 mt-3">
                Đồng hành cùng con trên hành trình chinh phục tiếng Anh.
              </p>
            </div>
            <div>
              <div className="font-semibold mb-3">Programs</div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>General English</li><li>IELTS</li><li>Kids & Teens</li><li>Business English</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3">Company</div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>About</li><li>Teachers</li><li>Success Stories</li><li>Careers</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3">Contact</div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>+84 999 888 777</li><li>hello@kidzgo.edu.vn</li><li>HCMC, Vietnam</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-rose-200 mt-8 pt-6 text-center text-slate-700 text-sm">
            © {new Date().getFullYear()} KidzGo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
