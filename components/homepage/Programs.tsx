// components/sections/Programs.tsx  (SERVER)
import { PROGRAM_BOXES } from "@lib/data/data";
import { SURFACE_BORDER } from "@lib/theme/theme";
import { BookOpen, CheckCircle } from "lucide-react";

export default function Programs() {
  return (
    <section id="programs" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <h3 className="text-3xl md:text-4xl font-black">
            Khóa học{" "}
            <span className="bg-linear-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              phù hợp
            </span>{" "}
            với từng bé
          </h3>
          <div className="mt-2 inline-block px-3 py-1 rounded-full border border-amber-300 text-xs font-bold tracking-wide">
            Khóa 2 tháng tặng ngay 1 tháng
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PROGRAM_BOXES.map((box, i) => (
            <div
              key={i}
              className={`rounded-2xl bg-white border ${SURFACE_BORDER} p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-rose-600" />
                <h4 className="font-semibold">{box.title}</h4>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                {box.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
