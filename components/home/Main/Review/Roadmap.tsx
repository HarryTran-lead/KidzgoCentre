// components/sections/Roadmap.tsx (CLIENT)
"use client";

import { ACCENT_TEXT } from "@/lib/theme/theme";
import { 
  Volume2, 
  MessageCircle, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Users,
  Sparkles,
  Star
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Roadmap() {
  const [isVisible, setIsVisible] = useState<boolean[]>(Array(6).fill(false));
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const finishLineRef = useRef<HTMLDivElement>(null);

  const items = [
    {
      title: "PRONUNCIATION MASTER",
      desc: "Chuẩn hoá âm – nhịp – trọng âm theo kiểu vui & dễ nhớ.",
      icon: Volume2,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      step: 1
    },
    {
      title: "COMMUNICATION BOOST",
      desc: "Giao tiếp phản xạ, trò chơi tình huống – tự tin nói.",
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      step: 2
    },
    {
      title: "EXAM STARTER",
      desc: "Nền tảng Cambridge/Pre-TOEIC – làm bài không sợ.",
      icon: Trophy,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      step: 3
    },
    {
      title: "PLAN & HABITS",
      desc: "Thói quen 20–30' /ngày; ba mẹ theo dõi tiến độ.",
      icon: Calendar,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      step: 4
    },
    {
      title: "REPORT & COACHING",
      desc: "Bảng tiến bộ hàng tháng & 1:1 coaching khi cần.",
      icon: BarChart3,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      step: 5
    },
    {
      title: "PROJECT & CLUB",
      desc: "CLB, field trip – dùng tiếng Anh ngoài lớp.",
      icon: Users,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      step: 6
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !containerRef.current) return;

      const section = sectionRef.current;
      const container = containerRef.current;
      const sectionTop = section.offsetTop;
      const sectionHeight = container.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Tính toán progress của timeline
      const progressStart = sectionTop - windowHeight * 0.5;
      const progressEnd = sectionTop + sectionHeight * 0.7;
      
      let progress = 0;
      if (scrollY > progressStart) {
        progress = Math.min(1, (scrollY - progressStart) / (progressEnd - progressStart));
      }
      setScrollProgress(progress);

      // Hiệu ứng finish line di chuyển
      if (finishLineRef.current) {
        const finishLine = finishLineRef.current;
        const maxScroll = sectionHeight * 0.8;
        const translateY = Math.min(maxScroll, (scrollY - sectionTop + windowHeight * 0.3) * 0.5);
        finishLine.style.transform = `translate(-50%, ${translateY}px)`;
      }

      // Hiệu ứng hiện từng card
      const cardElements = container.querySelectorAll('.roadmap-card');
      cardElements.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const isInView = rect.top < windowHeight * 0.8;
        
        if (isInView) {
          setTimeout(() => {
            setIsVisible(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * 150);
        }
      });
    };

    // Intersection Observer cho hiệu ứng mượt hơn
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * 150);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Quan sát các card
    setTimeout(() => {
      const cardElements = document.querySelectorAll('.roadmap-card');
      cardElements.forEach(card => observer.observe(card));
    }, 100);

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Gọi ngay lần đầu

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Tính toán vị trí của timeline dot dựa trên scroll progress
  const timelineProgress = scrollProgress * 100;

  return (
    <section 
      id="roadmap" 
      ref={sectionRef}
      className="py-20 scroll-mt-24 overflow-hidden bg-linear-to-b from-white to-rose-50/30 relative"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black relative mb-4">
            <span className="inline-block animate-bounce">✨</span>
            Lộ trình học{" "}
            <span className={`${ACCENT_TEXT} relative inline-block`}>
              6 bước
              <Star className="absolute -top-2 -right-4 w-4 h-4 text-yellow-500 animate-spin" />
            </span>
            <span className="inline-block animate-bounce ml-2">🚀</span>
          </h2>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Hành trình khám phá tiếng Anh đầy màu sắc dành riêng cho trẻ em
          </p>
        </div>

        {/* Roadmap Timeline Container */}
        <div ref={containerRef} className="relative min-h-[1200px] lg:min-h-[1400px]">
          {/* Timeline Line - Desktop với animation progress */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-linear-to-b from-pink-300 via-blue-300 to-emerald-300 transform -translate-x-1/2 overflow-hidden">
            {/* Static gradient line */}
            <div className="absolute inset-0 bg-linear-to-b from-pink-300 via-blue-300 to-emerald-300"></div>
            
            {/* Animated progress fill */}
            <div 
              className="absolute top-0 left-0 w-full bg-linear-to-b from-pink-500 via-blue-500 to-emerald-500 transition-all duration-500"
              style={{ height: `${timelineProgress}%` }}
            ></div>
            
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>

          {/* Animated Progress Indicator trên timeline */}
          <div 
            className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 z-20 transition-all duration-500 ease-out"
            style={{ top: `${timelineProgress}%` }}
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full border-4 border-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-xl animate-pulse">
                <div className="absolute -inset-3 rounded-full bg-pink-500/20 animate-ping"></div>
              </div>
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full border-4 border-white/30"></div>
            </div>
          </div>

          {/* Mobile Progress Bar với animation */}
          <div className="lg:hidden mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-pink-600">Bắt đầu</span>
              <span className="text-sm font-medium text-emerald-600">Hoàn thành</span>
            </div>
            <div className="h-2 bg-gradient-to-r from-pink-200 via-blue-200 to-emerald-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${timelineProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Roadmap Items */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-y-12">
            {items.map((item, i) => {
              const Icon = item.icon;
              const isEven = i % 2 === 0;
              
              return (
                <div
                  key={i}
                  className={`relative group ${
                    isEven ? "lg:text-right lg:pr-12" : "lg:text-left lg:pl-12 lg:col-start-2"
                  }`}
                >
                  {/* Step Number & Timeline Dot */}
                  <div className="flex items-center lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:top-8">
                    <div className={`
                      relative w-14 h-14 rounded-full ${item.bgColor} 
                      border-4 border-white shadow-xl flex items-center justify-center
                      group-hover:scale-110 transition-all duration-300
                      hover:rotate-12 z-20
                      ${isEven ? "lg:ml-auto lg:mr-0" : "lg:mr-auto lg:ml-0"}
                      ${isVisible[i] ? 'animate-jump-in animate-duration-500' : 'opacity-0'}
                    `}
                    style={{ animationDelay: `${i * 150}ms` }}>
                      {/* Animated ring */}
                      <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${item.color} opacity-20 animate-ping`}></div>
                      
                      {/* Step number */}
                      <div className={`text-2xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                        {item.step}
                      </div>
                    </div>
                    
                    {/* Mobile connector */}
                    <div className="lg:hidden ml-4 h-1 flex-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full">
                      <div className={`h-full w-1/3 bg-gradient-to-r ${item.color} rounded-full`}></div>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div 
                    className={`
                      roadmap-card mt-6 lg:mt-0 p-6 lg:p-8 rounded-3xl border-2 ${item.borderColor} 
                      bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl 
                      transition-all duration-500 hover:-translate-y-2
                      relative overflow-hidden
                      ${isEven ? "lg:mr-8" : "lg:ml-8"}
                      before:absolute before:inset-0 before:bg-gradient-to-r ${item.color} 
                      before:opacity-0 hover:before:opacity-5 before:transition-opacity before:duration-500
                      ${isVisible[i] 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-10'
                      } transition-all duration-700
                    `}
                    style={{ transitionDelay: `${i * 150 + 300}ms` }}
                  >
                    {/* Step Badge - Góc trái trên cùng */}
                    <div className={`
                      absolute -top-3 -left-3 w-16 h-16 rounded-full 
                      ${item.bgColor} border-4 border-white shadow-2xl
                      flex items-center justify-center z-10
                      group-hover:scale-110 group-hover:rotate-12 transition-all duration-300
                      ${isVisible[i] ? 'animate-jump-in' : 'opacity-0 scale-0'}
                    `}
                    style={{ animationDelay: `${i * 150 + 200}ms` }}>
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.color} opacity-20 animate-pulse`}></div>
                      <div className="relative">
                        <div className={`text-2xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                          {item.step}
                        </div>
                      </div>
                      {/* Glow effect */}
                      <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${item.color} opacity-10 blur-md`}></div>
                    </div>
                    
                    {/* Decorative corner */}
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-linear-to-br ${item.color} opacity-10 rounded-bl-3xl`}></div>
                    
                    {/* Icon - Center với animation */}
                    <div className={`
                      w-20 h-20 rounded-2xl ${item.bgColor} 
                      border-4 border-white shadow-lg grid place-items-center mb-6
                      relative overflow-hidden mx-auto lg:mx-0
                      ${isEven ? "lg:ml-auto" : ""}
                      group-hover:rotate-12 transition-transform duration-300
                      ${isVisible[i] ? 'animate-zoom-in' : 'opacity-0 scale-50'}
                    `}
                    style={{ animationDelay: `${i * 150 + 400}ms` }}>
                      <div className={`absolute inset-0 bg-linear-to-br ${item.color} opacity-10`}></div>
                      <Icon className={`w-10 h-10 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} />
                      
                      {/* Floating dots */}
                      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-yellow-400 animate-ping"></div>
                      <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-pink-400 animate-pulse"></div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center lg:text-left">
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-slate-700 leading-relaxed text-center lg:text-left">
                      {item.desc}
                    </p>

                    {/* Progress indicator */}
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              idx === 0 
                                ? `bg-gradient-to-r ${item.color}` 
                                : "bg-gray-200 group-hover:bg-gray-300"
                            }`}
                          ></div>
                        ))}
                      </div>
                      
                      <span className={`text-sm font-semibold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                        Bước {item.step}
                      </span>
                    </div>

                    {/* Animated border effect */}
                    <div className={`absolute inset-0 rounded-3xl border-2 ${item.borderColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  </div>

                  {/* Desktop Timeline Dot */}
                  <div className="hidden lg:block absolute left-1/2 top-8 transform -translate-x-1/2 z-10">
                    <div className={`
                      w-8 h-8 rounded-full border-4 border-white 
                      shadow-lg bg-gradient-to-r ${item.color}
                      group-hover:scale-125 transition-transform duration-300
                      ${isVisible[i] ? 'animate-ping' : 'opacity-0'}
                    `}
                    style={{ animationDelay: `${i * 150 + 100}ms` }}>
                      <div className="absolute inset-1 rounded-full bg-white/20"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Finish Line với animation scroll */}
          <div 
            ref={finishLineRef}
            className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-out"
            style={{ top: '0%' }}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              {/* Trail effect */}
               <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1 h-12 bg-linear-to-b from-emerald-400 to-transparent"></div>
              {/* Celebration particles */}
              <div className="absolute -top-4 -left-4 w-4 h-4 rounded-full bg-yellow-400 animate-ping"></div>
              <div className="absolute -top-4 -right-4 w-3 h-3 rounded-full bg-pink-400 animate-ping" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute -bottom-4 left-0 w-3 h-3 rounded-full bg-blue-400 animate-ping" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        </div>

        
      </div>

      {/* Custom CSS cho animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes jumpIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(100px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes zoomIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        
        .animate-jump-in {
          animation: jumpIn 0.5s ease-out forwards;
        }
        
        .animate-zoom-in {
          animation: zoomIn 0.5s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}