"use client";

import { ACCENT_TEXT } from "@/lib/theme/theme";
import { WHY } from "@/lib/data/data";
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function WhyUs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50px 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const index = parseInt(entry.target.getAttribute('data-index') || '0');
        
        if (entry.isIntersecting) {
          setVisibleCards(prev => {
            if (!prev.includes(index)) {
              return [...prev, index];
            }
            return prev;
          });
        }
      });
    }, observerOptions);

    // Intersection Observer cho title header
    const titleObserverOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    const titleObserverCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsTitleVisible(true);
        }
      });
    };

    const titleObserver = new IntersectionObserver(titleObserverCallback, titleObserverOptions);

    const cards = containerRef.current?.querySelectorAll('[data-index]');
    cards?.forEach(card => observer.observe(card));

    // Quan sát title header
    if (titleRef.current) {
      titleObserver.observe(titleRef.current);
    }

    return () => {
      cards?.forEach(card => observer.unobserve(card));
      titleObserver.disconnect();
    };
  }, []);

  // Sticker images mapping
  const getStickerPath = (index: number) => {
    const stickerNumber = (index % 18) + 1; // Cycle through 1-18
    return `/sticker/${stickerNumber}.png`;
  };

  return (
    <section id="why" className="py-24 scroll-mt-24 overflow-hidden bg-white relative z-30">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-80 h-80 bg-linear-to-br from-pink-300 to-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-32 right-10 w-96 h-96 bg-gradient-to-tr from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        {/* Floating orb */}
        <motion.div 
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-linear-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
          animate={{
            scale: [1, 1.3, 1],
            borderRadius: ["50%", "40%", "50%"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-linear-to-r from-pink-400/30 to-rose-400/30 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 10) % 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header với animation */}
        <div ref={titleRef} className="text-center mb-16">
          <h2 className={`mt-6 text-5xl md:text-6xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent transition-all duration-1000 ${
            isTitleVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Khác biệt tạo <span className={ACCENT_TEXT}>hiệu quả</span>
          </h2>
          <p className={`mt-4 text-lg text-gray-600 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${
            isTitleVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Khám phá những điểm đặc biệt giúp KidzGo trở thành lựa chọn hàng đầu
          </p>
        </div>

        {/* Grid card hiện đại */}
        <div 
          ref={containerRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {WHY.map(({ title, desc }, index) => {
            const isVisible = visibleCards.includes(index);
            const stickerPath = getStickerPath(index);
            
            return (
              <div
                key={title}
                data-index={index}
                className={`
                  relative group
                  transition-all duration-1000 transform
                  ${isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-12 scale-95'
                  }
                `}
                style={{
                  transitionDelay: `${(index % 6) * 150}ms`
                }}
              >
                {/* Main card */}
                <div className={`
                  relative h-full rounded-3xl bg-white
                  border-2 border-pink-200
                  shadow-lg shadow-gray-200/50
                  overflow-hidden
                  group-hover:shadow-xl group-hover:shadow-pink-200/50
                  transition-all duration-500
                `}>
                  {/* Sticker image section */}
                  <div className="relative w-full h-48 bg-linear-to-br from-pink-50 to-rose-50 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <motion.div 
                        className="relative w-full h-full flex items-center justify-center"
                        initial={{ scale: 0, rotate: -180, opacity: 0 }}
                        animate={isVisible ? {
                          scale: 1,
                          rotate: 0,
                          opacity: 1,
                          y: [0, -10, 0]
                        } : {
                          scale: 0,
                          rotate: -180,
                          opacity: 0
                        }}
                        transition={{
                          scale: { duration: 0.6, delay: index * 0.1 + 0.2, type: "spring", stiffness: 200, damping: 15 },
                          rotate: { duration: 0.6, delay: index * 0.1 + 0.2 },
                          opacity: { duration: 0.4, delay: index * 0.1 + 0.2 },
                          y: {
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: index * 0.1 + 0.8
                          }
                        }}
                        whileHover={{
                          scale: 1.15,
                          rotate: [0, -5, 5, -5, 0],
                          transition: {
                            scale: { duration: 0.3 },
                            rotate: { duration: 0.5 }
                          }
                        }}
                      >
                        <Image
                          src={stickerPath}
                          alt={title}
                          width={200}
                          height={200}
                          className="object-contain w-auto h-full drop-shadow-lg"
                          priority={index < 3}
                        />
                      </motion.div>
                    </div>
                    
                    {/* Number badge */}
                    <motion.div 
                      className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full border-2 border-pink-200 shadow-md grid place-items-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={isVisible ? {
                        scale: 1,
                        opacity: 1
                      } : {
                        scale: 0,
                        opacity: 0
                      }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1 + 0.5,
                        type: "spring",
                        stiffness: 300
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: 360,
                        transition: { duration: 0.5 }
                      }}
                    >
                      <span className="text-sm font-bold text-gray-800">
                        {index + 1}
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* Content section */}
                  <div className="p-6 lg:p-8">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {desc}
                    </p>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            );
          })}
        </div>

        
      </div>
    </section>
  );
}