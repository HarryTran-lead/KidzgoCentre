// components/home/Main/Review/Teacher.tsx (CLIENT)
"use client";

import { useMemo } from "react";
import { TeamCarousel, TeamMember } from "@/components/lightswind/team-carousel";

// Dữ liệu giáo viên - chuyển đổi cho TeamCarousel
const TEACHERS: TeamMember[] = [
  {
    id: "1",
    name: "Cô Lily",
    role: "Cambridge Starters-Movers",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 10+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Phạm Tuấn Tài",
  },
  {
    id: "2",
    name: "Cô Sunny",
    role: "Giao tiếp phản xạ",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    bio: "🇺🇸 US • 8+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Times City",
  },
  {
    id: "3",
    name: "Thầy Tom",
    role: "Cambridge Flyers",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    bio: "🇦🇺 Australia • 12+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Vũ Tông Phan",
  },
  {
    id: "4",
    name: "Cô Emma",
    role: "IELTS cho trẻ em",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 9+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Phạm Tuấn Tài",
  },
  {
    id: "5",
    name: "Thầy David",
    role: "Tiếng Anh học thuật",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 15+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Times City",
  }
];

const AUTO_MS = 5000;

export default function Teacher() {
  const teachers = useMemo(() => TEACHERS.filter(Boolean), []);

  if (teachers.length === 0) return null;

  return (
    <section 
      id="teachers" 
      className="teacher-page py-16 pb-0 scroll-mt-24 relative z-30 overflow-hidden bg-white"
      style={{ 
        backgroundImage: 'url(/image/background1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-transparent pointer-events-none z-0"></div>

      {/* Animated gradient shadow - Using CSS animations for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-red-300 to-red-400 rounded-full mix-blend-multiply blur-3xl opacity-35 animate-pulse-scale"
        />
        <div 
          className="absolute bottom-32 right-10 w-96 h-96 bg-gradient-to-tr from-red-400 to-rose-300 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse-scale-sm"
        />
        <div 
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-red-400 to-red-300 rounded-full mix-blend-multiply blur-3xl opacity-25 animate-pulse-scale-md"
        />
      </div>

      {/* Title Section */}
      <div className="relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black drop-shadow-lg mb-4">
          <span className="text-black">Thầy Cô</span> <span className="text-red-600">Siêu Vui Tính</span>
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Đội ngũ giáo viên giàu kinh nghiệm và đam mê giáo dục
        </p>
      </div>

      {/* Team Carousel từ Lightswind */}
      <div className="relative z-10 mt-12">
        <TeamCarousel
          members={teachers}
          title=""
          titleSize="2xl"
          titleColor="rgba(220, 38, 38, 1)"
          background="transparent"
          cardWidth={320}
          cardHeight={420}
          cardRadius={24}
          showArrows={true}
          showDots={true}
          keyboardNavigation={true}
          touchNavigation={true}
          animationDuration={600}
          autoPlay={AUTO_MS}
          pauseOnHover={true}
          visibleCards={2}
          sideCardScale={0.85}
          sideCardOpacity={0.7}
          grayscaleEffect={false}
          infoPosition="overlay"
          infoTextColor="rgb(255, 255, 255)"
          infoBackground="rgba(220, 38, 38, 0.95)"
          cardClassName="bg-gradient-to-br from-white via-white to-red-50 backdrop-blur-md shadow-2xl shadow-red-500/20 border-2 border-white/80 rounded-3xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 hover:border-red-300"
          titleClassName="text-red-600 font-black drop-shadow-lg"
          onMemberChange={(member, index) => {
            console.log(`Now viewing: ${member.name}`);
          }}
        />
      </div>
    </section>
  );
}