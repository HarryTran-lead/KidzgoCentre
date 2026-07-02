"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { BLOGS } from "@/lib/data/data";
import { ArrowRight } from "lucide-react";
import { motion, cubicBezier } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { EndPoint } from "@/lib/routes";
import SectionTitle from "./SectionTitle";
import SectionWaveTop from "./SectionWaveTop";

const BLOG_SECTION_COPY = {
  vi: {
    title: {
      leading: "Bản tin",
      accent: "Rex",
    },
    description:
      "Cập nhật kiến thức, hoạt động và những mẹo học tiếng Anh dễ áp dụng cho học viên Rex.",
    statLabels: ["xem", "thích", "bình luận"],
    primaryCta: "Đọc ngay nào!",
    secondaryCta: "Xem tất cả bản tin",
    posts: [
      {
        title: "5 mẹo sửa phát âm cho bé tại nhà",
        excerpt:
          "Hoạt động đơn giản giúp bé tự tin nói tiếng Anh mỗi ngày.",
        tag: "Kỹ năng",
      },
      {
        title: "Cambridge: Starters → Movers → Flyers",
        excerpt: "Cấu trúc đề và cách luyện đều, chắc, vui tại Rex.",
        tag: "Cambridge",
      },
      {
        title: "Checklist xin học bổng trung học Mỹ",
        excerpt: "Chuẩn bị hồ sơ, hoạt động ngoại khóa và chứng chỉ.",
        tag: "Học bổng",
      },
    ],
  },
  en: {
    title: {
      leading: "News from",
      accent: "Rex",
    },
    description:
      "Stay updated with learning tips, center activities, and practical English ideas for Rex students.",
    statLabels: ["views", "likes", "comments"],
    primaryCta: "Read now!",
    secondaryCta: "View all news",
    posts: [
      {
        title: "5 ways to improve your child's pronunciation at home",
        excerpt:
          "Simple activities that help children speak English more confidently every day.",
        tag: "Tips",
      },
      {
        title: "Cambridge: Starters to Movers to Flyers",
        excerpt:
          "A clearer look at the test pathway and how Rex helps students build steadily.",
        tag: "Cambridge",
      },
      {
        title: "Checklist for U.S. middle-school scholarship applications",
        excerpt:
          "A quick guide to profiles, extracurriculars, and certificates to prepare early.",
        tag: "Scholarship",
      },
    ],
  },
} as const;

export default function Blog() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const blogText = BLOG_SECTION_COPY[locale];
  const blogHref = localizePath(EndPoint.BLOGS, locale);

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

    if (tagLower === "cambridge") {
      return { bg: "bg-red-600", text: "text-white" };
    }

    if (tagLower === "scholarship" || tagLower === "học bổng") {
      return { bg: "bg-amber-500", text: "text-white" };
    }

    return { bg: "bg-red-600", text: "text-white" };
  };

  const generateStats = (index: number) => {
    const seed = index * 12345;
    const [viewsLabel, likesLabel, commentsLabel] = blogText.statLabels;

    return [
      { count: Math.abs((seed * 17) % 500) + 500, label: viewsLabel },
      { count: Math.abs((seed * 23) % 150) + 50, label: likesLabel },
      { count: Math.abs((seed * 31) % 40) + 10, label: commentsLabel },
    ];
  };

  const posts = useMemo(
    () =>
      BLOGS.map((post, index) => ({
        ...post,
        ...blogText.posts[index],
      })),
    [blogText.posts],
  );

  return (
    <section
      id="blog"
      className="blog-page relative z-30 overflow-visible pt-12 scroll-mt-24 sm:pt-14 lg:pt-16"
      style={{
        backgroundColor: "#d8eeff",
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(255, 200, 124, 0.18) 0%, transparent 22%),
          radial-gradient(circle at 90% 80%, rgba(168, 230, 207, 0.2) 0%, transparent 22%)
        `,
      }}
    >
      <SectionWaveTop fill="#d8eeff" />

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
        <motion.div
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={fadeInUp}>
            <SectionTitle
              leading={blogText.title.leading}
              accent={blogText.title.accent}
            />
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base"
          >
            {blogText.description}
          </motion.p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {posts.map((post, index) => {
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
                  <div className="absolute left-0 right-0 top-0 h-2.5 rounded-t-[30px] bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

                  <div className="relative m-4 mb-0 mt-5 h-40 overflow-hidden rounded-[22px] border-[3px] border-white shadow-lg sm:h-44">
                    <motion.img
                      src={post.img}
                      alt={post.title}
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

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

                    <div className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm">
                      {index + 12}/12
                    </div>
                  </div>

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

                    <Link href={blogHref} className="mt-4 block">
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
                          {blogText.primaryCta}
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

                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.7 }}
                        />
                      </motion.div>
                    </Link>
                  </div>

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

        <motion.div
          className="mt-12 text-center sm:mt-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href={blogHref}>
            <motion.div
              className="group inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-[#111827] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-red-700 hover:shadow-red-700/25 sm:px-7"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {blogText.secondaryCta}
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
