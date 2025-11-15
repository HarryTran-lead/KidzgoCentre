// components/sections/Gallery.tsx  (SERVER)
import { Image as ImageIcon } from "lucide-react";
import { GALLERY } from "@/lib/data/data";
import { SURFACE_BORDER } from "@/lib/theme/theme";

export default function Gallery() {
  return (
    <section id="gallery" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-rose-600" /> Lớp học & CLB
              Tiếng Anh KidzGo
            </h3>
            <p className="text-slate-600">
              Khoảnh khắc học tập – vui chơi – ngoại khóa.
            </p>
          </div>
        </div>

        <div className="columns-2 sm:columns-3 lg:columns-3 gap-4 [&>img]:mb-4">
          {GALLERY.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`KidzGo gallery ${i + 1}`}
              className={`w-full rounded-xl border ${SURFACE_BORDER} shadow-sm object-cover break-inside-avoid`}
            />
          ))}
        </div>
     
      </div>
    </section>
  );
}
