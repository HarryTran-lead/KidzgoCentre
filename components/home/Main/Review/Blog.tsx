// components/sections/Blog.tsx  (SERVER)
import { BLOGS } from "@/lib/data/data";
import { SURFACE_BORDER } from "@/lib/theme/theme";
import { Newspaper } from "lucide-react";

export default function Blog() {
  return (
    <section id="blog" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-black flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-rose-600" /> Bài viết mới
          </h3>
          <a
            href="#"
            className="text-sm font-semibold text-rose-600 hover:underline"
          >
            Xem tất cả
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {BLOGS.map((post) => (
            <article
              key={post.title}
              className={`rounded-2xl overflow-hidden bg-white border ${SURFACE_BORDER} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="relative h-44">
                <img
                  src={post.img}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur border border-white/60">
                  {post.tag}
                </span>
              </div>
              <div className="p-5">
                <h4 className="font-semibold leading-snug">{post.title}</h4>
                <p className="text-sm text-slate-600 mt-2">{post.excerpt}</p>
                <a
                  href="#"
                  className="mt-3 inline-block text-sm font-semibold text-rose-600 hover:underline"
                >
                  Đọc tiếp →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
