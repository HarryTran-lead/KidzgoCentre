// components/sections/CtaStrip.tsx  (SERVER)
import { CTA_GRAD } from "@lib/theme/theme";

export default function CtaStrip() {
  return (
    <section className={`py-16 ${CTA_GRAD} text-white`}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-3">
          Ưu đãi còn lại hôm nay
        </h2>
        <p className="text-lg text-white/90">
          Đăng ký giữ chỗ để nhận giảm học phí và bộ tài liệu Kids Starter.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <a
            href="#contact"
            className="px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:shadow-lg"
          >
            Giữ chỗ ngay
          </a>
          <a
            href="#courses"
            className="px-6 py-3 rounded-xl border border-white/80 font-semibold hover:bg-white/10"
          >
            Xem chương trình
          </a>
        </div>
      </div>
    </section>
  );
}
