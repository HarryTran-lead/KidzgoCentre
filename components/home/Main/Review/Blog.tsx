"use client";

import { BLOGS } from "@/lib/data/data";
import { ArrowRight, Newspaper } from "lucide-react";
import { motion, cubicBezier } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Blog() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 36 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.75,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.22,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 48, scale: 0.92 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
    hover: {
      y: -8,
      rotateZ: 1.4,
      transition: {
        type: "spring" as const,
        stiffness: 220,
        damping: 16,
      },
    },
  };

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();

    if (tagLower === "tips" || tagLower === "kỹ năng") {
      return { bg: "bg-red-500", text: "text-white" };
    }

    if (tagLower === "news" || tagLower === "tin tức") {
      return { bg: "bg-red-600", text: "text-white" };
    }

    if (tagLower === "guide" || tagLower === "hướng dẫn") {
      return { bg: "bg-rose-500", text: "text-white" };
    }

    if (tagLower === "activity" || tagLower === "hoạt động") {
      return { bg: "bg-red-700", text: "text-white" };
    }

    return { bg: "bg-red-600", text: "text-white" };
  };

  const generateStats = (index: number) => {
    const seed = index * 12345;

    return [
      { count: Math.abs((seed * 17) % 500) + 500, label: "xem" },
      { count: Math.abs((seed * 23) % 150) + 50, label: "thích" },
      { count: Math.abs((seed * 31) % 40) + 10, label: "bình luận" },
    ];
  };

  return (
    <section
      id="blog"
      className="blog-page relative z-30 overflow-visible pt-12 scroll-mt-24 sm:pt-14 lg:pt-16"
      style={{
        backgroundColor: "#f0f9ff",
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(255, 200, 124, 0.15) 0%, transparent 20%),
          radial-gradient(circle at 90% 80%, rgba(168, 230, 207, 0.15) 0%, transparent 20%)
        `,
      }}
    >
      <div className="pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[99%] leading-none">
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-[86px] w-full sm:h-[104px] lg:h-[116px]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,70 C180,25 360,110 540,70 C720,30 900,105 1080,70 C1260,35 1350,50 1440,35 L1440,120 L0,120 Z"
            fill="#f0f9ff"
          />
        </svg>
      </div>

      {/* Cute background elements - giữ effect cũ */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-10 top-10 size-32 rounded-full bg-gradient-to-r from-red-200/30 to-red-300/30"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="absolute bottom-20 right-20 size-40 rounded-full bg-gradient-to-r from-red-200/20 to-rose-200/20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header đồng bộ section khác */}
        <motion.div
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            variants={fadeInUp}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase text-[#111827] shadow-sm shadow-red-100/60 backdrop-blur"
          >
            <Newspaper className="size-4 text-red-600" />
            Bản tin Rex
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-3xl font-black tracking-tight text-[#111827] sm:text-4xl lg:text-[2.65rem]"
          >
            Góc chia sẻ{" "}
            <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              hữu ích
            </span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base"
          >
            Cập nhật kiến thức, hoạt động và những mẹo học tiếng Anh dễ áp dụng
            cho học viên Rex.
          </motion.p>
        </motion.div>

        {/* Blog grid - giữ effect cũ, card gọn hơn */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {BLOGS.map((post, index) => {
            const tagColor = getTagColor(post.tag);

            return (
              <motion.article
                key={post.title}
                className="group relative"
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                whileHover="hover"
                custom={index}
                transition={{ delay: index * 0.08 }}
              >
                <div className="relative h-full cursor-pointer overflow-hidden rounded-[30px] border-[3px] border-white bg-gradient-to-b from-white to-white/90 shadow-xl transition-all duration-500 hover:border-red-400 hover:shadow-2xl">
                  {/* Top decoration */}
                  <div className="absolute left-0 right-0 top-0 h-2.5 rounded-t-[30px] bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

                  {/* Image */}
                  <div className="relative m-4 mb-0 mt-5 h-40 overflow-hidden rounded-[22px] border-[3px] border-white shadow-lg sm:h-44">
                    <motion.img
                      src={post.img}
                      alt={post.title}
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Tag badge */}
                    <motion.div
                      className="absolute left-3 top-3"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        delay: index * 0.15,
                      }}
                    >
                      <div
                        className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold shadow-lg ${tagColor.bg} ${tagColor.text}`}
                      >
                        {post.tag}
                      </div>
                    </motion.div>

                    {/* Date */}
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm">
                      {index + 12}/12
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <motion.h3
                      className="blog-title text-lg font-black leading-snug text-[#111827] transition-colors duration-300 group-hover:text-red-700"
                      whileHover={{ scale: 1.015 }}
                    >
                      {post.title}
                    </motion.h3>

                    <p className="blog-excerpt mt-3 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-3 text-sm leading-6 text-slate-600">
                      {post.excerpt}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-rose-50 p-3">
                      {generateStats(index).map((stat) => (
                        <div key={stat.label} className="text-center">
                          <p className="text-sm font-black text-[#111827]">
                            {stat.count}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Link href="/blogs" className="mt-4 block">
                      <motion.div
                        className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-[18px] py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                        style={{
                          background: `linear-gradient(135deg, ${
                            ["#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"][
                              index % 4
                            ]
                          }, ${
                            ["#ef4444", "#f87171", "#fca5a5", "#fecaca"][
                              index % 4
                            ]
                          })`,
                        }}
                        whileHover={{ scale: 1.035, rotate: [0, -1, 1, 0] }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Đọc ngay nào!
                        </span>

                        <motion.div
                          className="relative z-10"
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ArrowRight size={18} />
                        </motion.div>

                        {/* Sparkle effect giữ lại */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.7 }}
                        />
                      </motion.div>
                    </Link>
                  </div>

                  {/* Corner decorations giữ lại */}
                  <motion.div
                    className="absolute -left-3 -top-3 size-11 rounded-full bg-gradient-to-r from-red-400/20 to-red-500/20"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <motion.div
                    className="absolute -bottom-3 -right-3 size-10 rounded-full bg-gradient-to-r from-red-400/20 to-rose-400/20"
                    animate={{
                      rotate: -360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* CTA giữ effect cũ */}
        <motion.div
          className="mt-12 text-center sm:mt-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/blogs">
            <motion.div
              className="group inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-[#111827] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-red-700 hover:shadow-red-700/25 sm:px-7"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Xem tất cả bản tin
              </span>

              <ArrowRight
                size={16}
                className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
              />
            </motion.div>
          </Link>
        </motion.div>
      </div>

      <div className="relative mt-8 w-full sm:mt-10 lg:mt-12">
        <Image
          src="/image/hero-deluxe-end.svg"
          alt="Hero deluxe end"
          width={1440}
          height={180}
          className="h-auto w-full"
        />
      </div>

      <style jsx>{`
        .blog-title {
          min-height: 50px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-excerpt {
          min-height: 72px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}
