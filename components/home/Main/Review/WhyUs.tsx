// components/sections/WhyUs.tsx  (SERVER)
import { ACCENT_TEXT, SURFACE_BORDER } from "@/lib/theme/theme";
import { WHY } from "@/lib/data/data";

export default function WhyUs() {
  return (
    <section id="why" className="py-20 scroll-mt-24">
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
          {WHY.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={`rounded-2xl border ${SURFACE_BORDER} bg-white p-6 hover:shadow-md transition-shadow`}
            >
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
  );
}
