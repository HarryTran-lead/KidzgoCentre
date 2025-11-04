// components/sections/Testimonials.tsx  (SERVER)
import { SURFACE_BORDER } from "@lib/theme/theme";
import { TESTIMONIALS } from "@lib/data/data";
import { Star } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-rose-600 text-xs font-semibold">
            Student Success Stories
          </span>
          <h2 className="mt-4 text-4xl font-extrabold">
            Học viên nói gì về{" "}
            <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              KidzGo
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border ${SURFACE_BORDER} bg-white p-6`}
            >
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic">“{t.quote}”</p>
              <div className="mt-3 text-xs text-slate-500 font-medium">
                {t.name} — {t.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
