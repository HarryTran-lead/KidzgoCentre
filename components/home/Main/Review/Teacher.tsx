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
      className="py-16 pb-0 scroll-mt-24 relative z-30 overflow-hidden"
      style={{ 
        backgroundImage: 'url(/image/background1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/60 to-red-600/40 pointer-events-none z-0"></div>

      {/* Team Carousel từ Lightswind */}
      <div className="relative z-10">
        <TeamCarousel
          members={teachers}
          title="Thầy Cô Siêu Vui Tính!"
          titleSize="2xl"
          titleColor="rgba(220, 38, 38, 1)"
          background="transparent"
          cardWidth={280}
          cardHeight={380}
          cardRadius={20}
          showArrows={true}
          showDots={true}
          keyboardNavigation={true}
          touchNavigation={true}
          animationDuration={600}
          autoPlay={AUTO_MS}
          pauseOnHover={true}
          visibleCards={2}
          sideCardScale={0.9}
          sideCardOpacity={0.8}
          grayscaleEffect={false}
          infoPosition="overlay"
          infoTextColor="rgb(255, 255, 255)"
          infoBackground="rgba(220, 38, 38, 0.9)"
          cardClassName="bg-white/95 backdrop-blur-sm shadow-xl border-4 border-white rounded-3xl"
          titleClassName="text-red-600 font-black drop-shadow-lg"
          onMemberChange={(member, index) => {
            console.log(`Now viewing: ${member.name}`);
          }}
        />
      </div>
    </section>
  );
}