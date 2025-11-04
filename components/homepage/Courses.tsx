// components/sections/Courses.tsx  (SERVER)
import { COURSES } from "@/lib/data/data";
import { SURFACE_BORDER } from "@/lib/theme/theme";
import { Clock } from "lucide-react";

export default function Courses() {
  return (
    <section id="courses" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-rose-600 text-xs font-semibold">
            Chương trình
          </span>
          <h2 className="mt-4 text-4xl font-extrabold">
            Popular{" "}
            <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Courses
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {COURSES.map((c) => (
            <div
              key={c.title}
              className={`rounded-2xl overflow-hidden bg-white border ${
                c.highlight
                  ? "border-rose-300 shadow-[0_0_0_3px_rgba(244,114,182,.15)]"
                  : SURFACE_BORDER
              } hover:shadow-lg transition-shadow`}
            >
              <div className="relative h-40">
                <img
                  src={c.img}
                  alt={c.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 text-xs font-semibold bg-white/90 backdrop-blur px-2 py-1 rounded-full">
                  {c.badge}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{c.title}</h3>
                <div className="text-sm text-slate-600 mt-1">
                  {c.level} •{" "}
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} /> {c.time}
                  </span>
                </div>
                <a
                  href="#contact"
                  className="mt-4 inline-block px-4 py-2 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-sm font-semibold"
                >
                  Gửi tư vấn
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
