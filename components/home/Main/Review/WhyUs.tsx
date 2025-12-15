"use client";

import { ACCENT_TEXT } from "@/lib/theme/theme";
import { WHY } from "@/lib/data/data";
import { useEffect, useRef, useState } from 'react';

export default function WhyUs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

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

    const cards = containerRef.current?.querySelectorAll('[data-index]');
    cards?.forEach(card => observer.observe(card));

    return () => {
      cards?.forEach(card => observer.unobserve(card));
    };
  }, []);

  // Gradient colors cho từng card
  const cardGradients = [
    'from-amber-500/10 via-orange-500/5 to-transparent',
    'from-blue-500/10 via-purple-500/5 to-transparent',
    'from-emerald-500/10 via-teal-500/5 to-transparent',
    'from-rose-500/10 via-pink-500/5 to-transparent',
    'from-indigo-500/10 via-violet-500/5 to-transparent',
    'from-cyan-500/10 via-sky-500/5 to-transparent',
  ];

  const iconGradients = [
    'bg-gradient-to-br from-amber-500 to-orange-500',
    'bg-gradient-to-br from-blue-500 to-purple-500',
    'bg-gradient-to-br from-emerald-500 to-teal-500',
    'bg-gradient-to-br from-rose-500 to-pink-500',
    'bg-gradient-to-br from-indigo-500 to-violet-500',
    'bg-gradient-to-br from-cyan-500 to-sky-500',
  ];

  return (
    <section id="why" className="py-24 scroll-mt-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header với animation */}
        <div className="text-center mb-16">
          <div className="inline-block relative">
            <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 text-sm font-semibold border border-amber-200/50 backdrop-blur-sm">
              Vì sao chọn KidzGo
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
          </div>
          <h2 className="mt-6 text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Khác biệt tạo <span className={ACCENT_TEXT}>hiệu quả</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá những điểm đặc biệt giúp KidzGo trở thành lựa chọn hàng đầu
          </p>
        </div>

        {/* Grid card hiện đại */}
        <div 
          ref={containerRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {WHY.map(({ icon: Icon, title, desc }, index) => {
            const isVisible = visibleCards.includes(index);
            const gradientIndex = index % cardGradients.length;
            
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
                {/* Background glow effect */}
                <div className={`
                  absolute inset-0 rounded-3xl bg-gradient-to-br ${cardGradients[gradientIndex]} 
                  blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  ${isVisible ? 'opacity-30' : 'opacity-0'}
                `}></div>
                
                {/* Main card */}
                <div className={`
                  relative h-full rounded-2xl backdrop-blur-sm bg-white/70
                  border border-white/50 shadow-lg shadow-gray-200/50
                  overflow-hidden
                  group-hover:bg-white/80 group-hover:shadow-xl group-hover:shadow-gray-300/50
                  transition-all duration-500
                  before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/50 before:to-transparent
                `}>
                  {/* Decorative top border */}
                  <div className={`h-1 bg-gradient-to-r ${cardGradients[gradientIndex].replace('/10', '/100').replace('/5', '/100')}`}></div>
                  
                  <div className="p-6 lg:p-8">
                    {/* Icon với glow effect */}
                    <div className="relative mb-6">
                      <div className={`
                        absolute inset-0 ${iconGradients[gradientIndex]} rounded-2xl 
                        blur-lg opacity-50 scale-110
                        ${isVisible ? 'animate-pulse' : ''}
                      `}></div>
                      <div className={`
                        relative w-14 h-14 rounded-xl ${iconGradients[gradientIndex]} 
                        grid place-items-center text-white shadow-lg
                        transform transition-all duration-500
                        ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
                        group-hover:scale-110 group-hover:rotate-3
                      `}>
                        <Icon size={24} />
                      </div>
                      {/* Icon number */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-gray-100 shadow-sm grid place-items-center">
                        <span className="text-xs font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                      {title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {desc}
                    </p>
                    
                    {/* Read more indicator */}
                    <div className="mt-6 flex items-center gap-2">
                      <div className="h-px w-8 bg-gradient-to-r from-gray-300 to-transparent"></div>
                      <span className="text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
                        Khám phá thêm
                      </span>
                      <div className={`ml-auto w-8 h-8 rounded-full ${iconGradients[gradientIndex]} grid place-items-center transform transition-transform duration-300 group-hover:translate-x-1`}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -z-10 top-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-md"></div>
                <div className="absolute -z-10 bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-md"></div>
              </div>
            );
          })}
        </div>

        
      </div>
    </section>
  );
}