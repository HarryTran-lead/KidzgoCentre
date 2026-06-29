"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HeartHandshake,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const storyHighlights = [
  { label: "Nền tảng vững chắc", icon: ShieldCheck },
  { label: "Giao tiếp tự tin", icon: MessageCircle },
  { label: "Giáo viên đồng hành", icon: HeartHandshake },
];

const storyImages = [
  {
    src: "/image/Club1.JPG",
    alt: "Học viên Rex tham gia hoạt động tiếng Anh thực tế",
  },
  {
    src: "/image/Club4.JPG",
    alt: "Không gian học tập thân thiện tại Rex",
  },
  {
    src: "/image/Club5.JPG",
    alt: "Học viên Rex thực hành tiếng Anh theo nhóm",
  },
  {
    src: "/image/Club7.JPG",
    alt: "Hoạt động ngoại khóa giúp học viên tự tin hơn",
  },
];

export default function AboutSection() {
  const [activeImage, setActiveImage] = useState(0);
  const currentImage = storyImages[activeImage];

  const goToPreviousImage = () => {
    setActiveImage((index) =>
      index === 0 ? storyImages.length - 1 : index - 1,
    );
  };

  const goToNextImage = () => {
    setActiveImage((index) => (index + 1) % storyImages.length);
  };

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setActiveImage((index) => (index + 1) % storyImages.length);
    }, 5000);

    return () => window.clearInterval(slideTimer);
  }, []);

  return (
  <section
  id="about"
className="roadmap-page relative z-30 overflow-hidden scroll-mt-24 bg-linear-to-b from-slate-50 via-white to-slate-50 pt-14 pb-32 sm:pt-16 sm:pb-36 lg:pt-18 lg:pb-40" style={{
    borderTopLeftRadius: "3rem",
    borderTopRightRadius: "3rem",
    boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.1)",
  }}
>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase text-[#111827] shadow-sm shadow-red-200/50 backdrop-blur">
              <BookOpen className="size-4 text-red-600" />
              Thông tin trung tâm
            </div>

            <h2 className="text-3xl font-black leading-tight text-[#111827] sm:text-4xl lg:text-[2.65rem]">
              Câu chuyện của <span className="text-red-600">Rex</span>
            </h2>

            <div className="mt-6 rounded-3xl border border-red-100 border-l-[6px] border-l-red-600 bg-white p-4 shadow-md shadow-red-200/30 sm:px-6 sm:py-4">
              <Quote className="mb-3 size-6 text-red-600/80" />
              <p className="text-base font-medium leading-7 text-[#111827] sm:text-lg sm:leading-8">
                “Làm thế nào để mỗi học viên không chỉ học tiếng Anh, mà còn tự
                tin sử dụng tiếng Anh trong đời sống?”
              </p>
              <p className="mt-3 text-sm font-bold text-red-700">
                - Ý tưởng khởi nguồn của Rex
              </p>
            </div>

            <div className="mt-7 max-w-2xl space-y-5 text-base leading-8 text-slate-800 sm:text-lg">
              <p>
                Rex được xây dựng với mong muốn tạo ra một môi trường học tiếng
                Anh gần gũi, nơi trẻ em và học sinh có thể bắt đầu từ{" "}
                <span className="font-semibold text-red-700">
                  nền tảng vững chắc
                </span>
                , luyện{" "}
                <span className="font-semibold text-red-700">
                  phản xạ giao tiếp tự nhiên
                </span>{" "}
                và dần hình thành{" "}
                <span className="font-semibold text-red-700">sự tự tin</span>{" "}
                khi sử dụng ngôn ngữ.
              </p>
              <p>
                Thay vì chỉ tập trung vào điểm số, Rex chú trọng{" "}
                <span className="font-semibold text-red-700">
                  hành trình tiến bộ
                </span>{" "}
                của từng học viên. Giáo viên{" "}
                <span className="font-semibold text-red-700">
                  đồng hành sát sao
                </span>
                , phụ huynh dễ dàng theo dõi kết quả, còn học viên được khuyến
                khích thực hành tiếng Anh qua hoạt động, trò chơi và{" "}
                <span className="font-semibold text-red-700">
                  tình huống thực tế
                </span>
                .
              </p>
            </div>

            <div className="mt-7">
              <a
                href="https://www.facebook.com/kidzgovn"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                <span className="grid size-10 place-items-center rounded-full bg-[#1877F2] text-white shadow-sm transition duration-300 group-hover:scale-105">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 fill-current"
                  >
                    <path d="M14 8.5V7.25C14 6.56 14.56 6 15.25 6H17V3H14.75C12.13 3 10.5 4.63 10.5 7.25V8.5H8V11.75H10.5V21H14V11.75H16.6L17 8.5H14Z" />
                  </svg>
                </span>

                <span className="flex flex-col text-left">
                  <span className="text-sm font-black text-slate-900 transition duration-300 group-hover:text-red-700">
                    Fanpage chính thức Rex
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Xem hoạt động lớp học & tư vấn nhanh
                  </span>
                </span>

                <ExternalLink
                  size={16}
                  className="ml-1 text-slate-400 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red-600"
                />
              </a>
            </div>
          </div>

          <aside className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative rounded-[2rem] border border-red-100 bg-white/90 p-3  backdrop-blur">
              <div
                className="relative overflow-hidden rounded-[1.5rem] bg-red-100"
                style={{ aspectRatio: "16 / 11" }}
              >
                <Image
                  key={currentImage.src}
                  src={currentImage.src}
                  alt={currentImage.alt}
                  fill
                  sizes="(min-width: 1024px) 580px, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/55 via-slate-950/10 to-transparent p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.18)] ring-1 ring-white/70 backdrop-blur">
                    <Sparkles
                      className="size-4 text-amber-400"
                      strokeWidth={2}
                    />
                    Rex đồng hành cùng học viên
                  </div>
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/70 bg-white/85 p-1 shadow-xl shadow-red-950/10 backdrop-blur-md">
                  <button
                    type="button"
                    aria-label="Ảnh trước"
                    onClick={goToPreviousImage}
                    className="grid size-9 place-items-center rounded-full text-red-700 transition duration-300 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    <ChevronLeft size={19} strokeWidth={2.6} />
                  </button>
                  <div className="h-5 w-px bg-red-100" />
                  <button
                    type="button"
                    aria-label="Ảnh tiếp theo"
                    onClick={goToNextImage}
                    className="grid size-9 place-items-center rounded-full text-red-700 transition duration-300 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    <ChevronRight size={19} strokeWidth={2.6} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                {storyImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    aria-label={`Xem ảnh ${index + 1}`}
                    aria-current={index === activeImage}
                    onClick={() => setActiveImage(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeImage
                        ? "w-8 bg-red-600"
                        : "w-2.5 bg-red-200 hover:bg-red-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
              {storyHighlights.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="group inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-[#111827] shadow-md shadow-red-100/70 transition duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg hover:shadow-red-200/70"
                >
                  <Icon
                    className="size-4 text-red-600 transition duration-300 group-hover:scale-110 group-hover:text-red-700"
                    strokeWidth={2.4}
                  />
                  {label}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

 
    </section>
  );
}
