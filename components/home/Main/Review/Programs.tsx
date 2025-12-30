// components/sections/Courses.tsx (CLIENT) - Phiên bản đã chỉnh sửa
"use client";

import React from "react";
import { BookOpen, Users, Star, Sparkles, Clock, Award, PlayCircle, Globe, Palette, ArrowRight, ChevronRight, Smile, CheckCircle, Brain, GraduationCap, Target } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from 'next/image';

export default function Courses() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [rightColumnHeight, setRightColumnHeight] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // Dữ liệu các khóa học với màu sắc tươi sáng
  const courseCards = [
    {
      ageGroup: "3-5 tuổi",
      title: "Bé Khởi Đầu",
      subtitle: "Khởi đầu ngôn ngữ vui nhộn",
      description: "Bé làm quen với tiếng Anh qua các bài hát, trò chơi và hoạt động sáng tạo. Xây dựng nền tảng phát âm chuẩn và tình yêu với ngôn ngữ mới.",
      icon: PlayCircle,
      bannerText: "VUI HỌC",
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80",
      features: [
        "Học qua bài hát và trò chơi",
        "Phát triển phát âm tự nhiên",
        "Hoạt động vận động tinh",
        "Tương tác với giáo viên bản ngữ",
        "Nhận biết màu sắc, số đếm"
      ],
      schedule: "2 buổi/tuần • 60 phút/buổi",
      learningOutcomes: [
        "Nhận biết 200+ từ vựng cơ bản",
        "Hát được 20+ bài hát tiếng Anh",
        "Tự tin giao tiếp đơn giản",
        "Phát âm chuẩn ngay từ đầu"
      ],
      color: "from-pink-400 to-orange-300",
      bgColor: "bg-gradient-to-br from-pink-50 to-orange-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-600",
      accentColor: "bg-pink-400",
      stickerIndex: 1,
      teacher: "Cô Lily (UK) & Cô Sunny (US)",
      classSize: "8-10 bé/lớp"
    },
    {
      ageGroup: "6-8 tuổi",
      title: "Bé Khám Phá",
      subtitle: "Khám phá thế giới diệu kỳ",
      description: "Bé được khám phá thế giới xung quanh qua tiếng Anh. Phát triển kỹ năng giao tiếp, mở rộng vốn từ vựng về các chủ đề quen thuộc trong cuộc sống.",
      icon: Globe,
      bannerText: "KHÁM PHÁ",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      features: [
        "Học qua dự án nhỏ",
        "Kể chuyện sáng tạo",
        "Hoạt động nhóm vui nhộn",
        "Thực hành giao tiếp",
        "Khám phá văn hóa các nước"
      ],
      schedule: "3 buổi/tuần • 75 phút/buổi",
      learningOutcomes: [
        "Sử dụng 500+ từ vựng",
        "Kể chuyện đơn giản",
        "Viết câu ngắn đúng ngữ pháp",
        "Tự tin thuyết trình nhóm"
      ],
      color: "from-blue-400 to-cyan-300",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      accentColor: "bg-blue-400",
      stickerIndex: 2,
      teacher: "Thầy Tom (Australia) & Cô Mia (Canada)",
      classSize: "10-12 bé/lớp"
    },
    {
      ageGroup: "9-11 tuổi",
      title: "Bé Sáng Tạo",
      subtitle: "Sáng tạo không giới hạn",
      description: "Khuyến khích sự sáng tạo thông qua các dự án tiếng Anh thú vị. Phát triển tư duy phản biện, kỹ năng thuyết trình và làm việc nhóm.",
      icon: Palette,
      bannerText: "SÁNG TẠO",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      features: [
        "Dự án sáng tạo hàng tháng",
        "Thuyết trình nhóm tự tin",
        "Viết sáng tạo và kể chuyện",
        "Đóng kịch tiếng Anh vui nhộn",
        "Lập trình Scratch cơ bản"
      ],
      schedule: "3 buổi/tuần • 90 phút/buổi",
      learningOutcomes: [
        "Thuyết trình trước lớp tự tin",
        "Viết đoạn văn ngắn sáng tạo",
        "Tư duy phản biện và giải quyết vấn đề",
        "Làm việc nhóm hiệu quả"
      ],
      color: "from-purple-400 to-violet-300",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      accentColor: "bg-purple-400",
      stickerIndex: 3,
      teacher: "Cô Emma (UK) & Thầy Alex (US)",
      classSize: "12-14 bé/lớp"
    },
    {
      ageGroup: "12-14 tuổi",
      title: "Bé Dẫn Đầu",
      subtitle: "Dẫn đầu tương lai",
      description: "Chuẩn bị hành trang cho tương lai với khóa học tập trung phát triển kỹ năng học thuật, tư duy lãnh đạo và chuẩn bị cho các kỳ thi quốc tế.",
      icon: Award,
      bannerText: "DẪN ĐẦU",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
      features: [
        "Tiếng Anh học thuật",
        "Kỹ năng nghiên cứu và thuyết trình",
        "Thảo luận nhóm chuyên sâu",
        "Chuẩn bị thi Cambridge",
        "Kỹ năng lãnh đạo"
      ],
      schedule: "4 buổi/tuần • 90 phút/buổi",
      learningOutcomes: [
        "Đạt trình độ A2-B1 Cambridge",
        "Kỹ năng nghiên cứu chuyên sâu",
        "Viết luận và báo cáo học thuật",
        "Tự tin thảo luận và tranh biện"
      ],
      color: "from-green-400 to-emerald-300",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      accentColor: "bg-green-400",
      stickerIndex: 4,
      teacher: "Thầy David (UK) & Cô Sophia (US)",
      classSize: "14-16 bé/lớp"
    }
  ];

  // Theo dõi chiều cao của left column
  useEffect(() => {
    const updateHeight = () => {
      const leftColumn = document.querySelector('.courses-left-column');
      if (leftColumn) {
        setRightColumnHeight(leftColumn.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [activeCard]);

  // Xử lý scroll mượt mà
  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;
      if (!sectionRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionTop = sectionRect.top;

      if (sectionTop > windowHeight || sectionTop + sectionRect.height < 0) {
        return;
      }

      const scrollPercentage = Math.max(0, Math.min(1, 
        (windowHeight - sectionTop) / (windowHeight + sectionRect.height)
      ));

      const cardIndex = Math.floor(scrollPercentage * courseCards.length);
      const newActiveCard = Math.min(cardIndex, courseCards.length - 1);

      if (newActiveCard !== activeCard) {
        setIsScrolling(true);
        setActiveCard(newActiveCard);
        
        setTimeout(() => {
          setIsScrolling(false);
        }, 500);
      }
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', throttledScroll, { passive: true });
    
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', throttledScroll);
    };
  }, [activeCard, courseCards.length, isScrolling]);

  // Throttle function for smooth scrolling
  function throttle(func: () => void, limit: number) {
    let inThrottle: boolean;
    return function() {
      if (!inThrottle) {
        func();
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Handle manual card click
  const handleCardClick = (index: number) => {
    setIsScrolling(true);
    setActiveCard(index);
    
    const element = document.getElementById(`course-${index}`);
    if (element) {
      const offset = 120;
      const elementRect = element.getBoundingClientRect().top;
      const offsetPosition = elementRect + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    
    setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  return (
    <section 
      ref={sectionRef}
      id="courses" 
      className="pt-16 md:pt-32 pb-0 scroll-mt-24 bg-gradient-to-b from-yellow-50 via-amber-50 to-yellow-100 relative z-30 overflow-hidden min-h-screen"
    >
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 rounded-full blur-3xl"
        style={{ y: y1 }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-yellow-200/30 rounded-full blur-3xl"
        style={{ y: y2 }}
      />
      
      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-10 w-8 h-8 bg-yellow-300 rounded-full animate-bounce opacity-40"></div>
      <div className="absolute top-1/3 right-20 w-6 h-6 bg-amber-300 rounded-full animate-bounce opacity-50 animation-delay-200"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10" ref={containerRef}>
        {/* Header với animation đẹp */}
        <motion.div
          className="text-center mb-12 md:mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring" }}
        >

          
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              Bé Yêu
            </span>
            <span className="text-gray-800 block md:inline md:ml-4">Học Tiếng Anh Vui</span>
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Mỗi bé là một thiên tài nhỏ! Chúng tôi thiết kế khóa học riêng biệt phù hợp với từng độ tuổi và tính cách của bé 💫
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Left Column - Course Selector Cards */}
          <div className="courses-left-column space-y-4 lg:space-y-6 flex flex-col">
            {courseCards.map((course, index) => {
              const IconComponent = course.icon;
              const isActive = index === activeCard;
              
              return (
                <motion.div
                  key={index}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    isActive ? 'scale-[1.02] shadow-2xl z-10' : 'opacity-90 hover:opacity-100 hover:shadow-xl'
                  }`}
                  onClick={() => handleCardClick(index)}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className={`${course.bgColor} rounded-2xl shadow-lg border-2 ${course.borderColor} p-4 md:p-5 transition-all duration-300 relative overflow-hidden h-full`}>
                    {/* Age badge */}
                    <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-white font-bold text-xs shadow-lg ${course.accentColor}`}>
                      {course.ageGroup}
                    </div>
                    
                    {/* Course header */}
                    <div className="flex items-start gap-3 mb-3 relative z-10">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg ${course.accentColor} flex-shrink-0`}>
                        <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">{course.title}</h3>
                        <p className={`${course.textColor} text-sm md:text-base font-semibold truncate`}>{course.subtitle}</p>
                        <p className="text-gray-600 text-xs md:text-sm mt-1 line-clamp-2">{course.description}</p>
                      </div>
                    </div>
                    
                    {/* Quick info */}
                    <div className="grid grid-cols-2 gap-2 mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className={`w-4 h-4 ${course.textColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 text-sm truncate">{course.classSize}</div>
                          <div className="text-gray-500 text-xs truncate">Quy mô lớp</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className={`w-4 h-4 ${course.textColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 text-sm truncate">
                            {course.schedule.split('•')[0]}
                          </div>
                          <div className="text-gray-500 text-xs truncate">
                            {course.schedule.split('•')[1]}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Features preview */}
                    <div className="relative z-10">
                      <div className="flex flex-wrap gap-1.5">
                        {course.features.slice(0, 3).map((feature, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-1 rounded-lg text-xs ${course.textColor} ${course.bgColor.replace('50', '100')} border ${course.borderColor}`}
                          >
                            {feature.split(' ')[0]}...
                          </span>
                        ))}
                        {course.features.length > 3 && (
                          <span className={`px-2 py-1 rounded-lg text-xs ${course.textColor} ${course.bgColor.replace('50', '100')} border ${course.borderColor}`}>
                            +{course.features.length - 3} nữa
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-3/4 rounded-r-full ${course.accentColor}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column - Course Details */}
          <div className="relative flex flex-col">
            <div className="sticky top-24 h-full flex flex-col">
              {courseCards.map((course, index) => {
                const isActive = index === activeCard;
                const IconComponent = course.icon;
                
                return (
                  <motion.div
                    key={index}
                    id={`course-${index}`}
                    className={`${!isActive ? 'hidden' : 'flex'} flex-col h-full`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Main Course Card - Thu gọn lại */}
                    <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border-2 ${course.borderColor} flex flex-col flex-1`}>
                      {/* Course Header - Sáng hơn */}
                      <div className={`relative bg-gradient-to-br ${course.color} px-6 py-5 shadow-lg`}>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/40 flex-shrink-0 shadow-md">
                            <IconComponent className="w-7 h-7 text-white drop-shadow-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-1 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                              {course.title}
                            </h2>
                            <div className="text-white/95 font-semibold text-sm md:text-base drop-shadow-md">
                              {course.subtitle}
                            </div>
                          </div>
                        </div>
                        
                        {/* Teacher Info - Compact */}
                        <div className="flex items-center gap-2 text-white/95">
                          <Smile className="w-4 h-4" />
                          <span className="text-sm font-medium truncate">{course.teacher}</span>
                        </div>
                      </div>

                      {/* Content Area - Không scroll, thu gọn */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col">
                        {/* Description - Compact */}
                        <div>
                          <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">
                            {course.description}
                          </p>
                        </div>

                        {/* Features - Compact Grid */}
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Điểm đặc biệt
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {course.features.slice(0, 4).map((feature, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className={`w-6 h-6 rounded ${course.accentColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-gray-800 text-xs leading-snug">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Learning Outcomes - Compact */}
                        <div>
                          <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-500" />
                            Kết quả đạt được
                          </h4>
                          <div className="space-y-2">
                            {course.learningOutcomes.map((outcome, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className={`w-6 h-6 rounded-full ${course.accentColor} flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-white font-bold text-xs">{idx + 1}</span>
                                </div>
                                <span className="text-gray-800 text-xs">{outcome}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Fixed CTA at Bottom */}
                      <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="text-center sm:text-left">
                            <div className="font-bold text-gray-900 text-sm">{course.schedule}</div>
                            <div className="text-gray-500 text-xs">Tặng học liệu trị giá 500K</div>
                          </div>
                          <motion.a
                            href="#contact"
                            className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 shadow-md group relative overflow-hidden whitespace-nowrap text-sm"
                            style={{
                              background: `linear-gradient(135deg, ${course.color.split(' ')[1]}, ${course.color.split(' ')[3]})`
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="relative">Đăng ký học thử</span>
                            <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                          </motion.a>
                        </div>
                        
                        {/* Navigation Dots - Inside card */}
                        <div className="flex justify-center gap-2 pt-2 border-t border-gray-200">
                          {courseCards.map((_, dotIndex) => (
                            <button
                              key={dotIndex}
                              onClick={() => handleCardClick(dotIndex)}
                              className="relative group"
                              aria-label={`Chuyển đến khóa học ${dotIndex + 1}`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                  dotIndex === activeCard 
                                    ? `${courseCards[dotIndex].accentColor} scale-125 shadow-md` 
                                    : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
        

      </div>

      {/* Wave shape bottom decoration - seamless transition to Blog.tsx */}
      <div className="relative w-full" style={{ marginBottom: '0', lineHeight: 0, marginTop: 40}}>
        <svg 
          viewBox="0 0 1440 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
          style={{ display: 'block', verticalAlign: 'bottom' }}
        >
          {/* Smooth wave with color #eef6ff */}
          <path 
            d="M0,50 C240,10 480,90 720,50 C960,10 1200,90 1440,50 L1440,100 L0,100 Z" 
            fill="#eef6ff"
            stroke="none"
            style={{ shapeRendering: 'geometricPrecision' }}
          />
        </svg>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}