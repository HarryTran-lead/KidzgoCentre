// app/[locale]/portal/student/layout.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import { normalizeRole, ROLES, type Role } from "@/lib/role";
import { getSession } from "@/lib/auth";
import StudentStreakWrapper from "@/components/portal/student/StudentStreakWrapper";
import StudentHeader from "@/components/portal/student/StudentHeader";
import StudentFooter from "@/components/portal/student/StudentFooter";
import NeonContentFrame from "@/components/portal/student/NeonContentFrame";
import StudentSidebar from "@/components/portal/sidebar/StudentSidebar";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const dinos = [
  { src: "/dino/dino1.gif", position: "bottom-0 left-0", size: "w-[400px] h-[400px]" },
  { src: "/dino/dino4.gif", position: "top-8 -left-12", size: "w-[320px] h-[320px]" },
  { src: "/dino/dino5.gif", position: "top-12 -right-10", size: "w-[300px] h-[300px]" },
  { src: "/dino/dino6.gif", position: "top-1/3 -left-16", size: "w-[280px] h-[280px]" },
  { src: "/dino/dino7.gif", position: "top-1/2 -right-14", size: "w-[270px] h-[270px]" },
  { src: "/dino/dino8.gif", position: "bottom-8 left-[10%]", size: "w-[260px] h-[260px]" },
  { src: "/dino/dino9.gif", position: "bottom-4 right-[8%]", size: "w-[250px] h-[250px]" },
  { src: "/dino/dino10.gif", position: "bottom-20 left-[40%]", size: "w-[240px] h-[240px]" },
  { src: "/dino/dino11.gif", position: "bottom-12 right-[15%]", size: "w-[230px] h-[230px]" },
  { src: "/dino/dino1.gif", position: "top-[70%] left-[85%]", size: "w-[200px] h-[200px]" },
  { src: "/dino/dino4.gif", position: "top-[85%] left-[5%]", size: "w-[190px] h-[190px]" },
];

export default async function StudentLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session || !session.role) {
    return <div className="min-h-dvh bg-slate-50">{children}</div>;
  }

  const role: Role = normalizeRole(session.role);
  const user = session.user;
  const roleRoot = ROLES[role];

  return (
    <StudentStreakWrapper>
      <div className="h-dvh w-full overflow-hidden flex flex-col">
        {/* Modern background layer */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {/* Dynamic gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2a] via-[#1a1a3a] to-[#2a1a3a]" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-gradient-to-b from-[#6366f1]/30 via-[#a855f7]/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-200px] left-[-200px] w-[800px] h-[600px] bg-gradient-to-tr from-[#ec489a]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute top-1/2 right-[-200px] w-[700px] h-[700px] bg-gradient-to-tl from-[#06b6d4]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: "7s", animationDelay: "2s" }} />
          
          {/* Floating particles */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute top-[60%] left-[80%] w-3 h-3 bg-purple-300 rounded-full animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
            <div className="absolute top-[80%] left-[30%] w-2 h-2 bg-pink-300 rounded-full animate-ping" style={{ animationDuration: "5s", animationDelay: "2s" }} />
            <div className="absolute top-[40%] left-[90%] w-2.5 h-2.5 bg-blue-300 rounded-full animate-ping" style={{ animationDuration: "4.5s", animationDelay: "1.5s" }} />
            <div className="absolute top-[15%] left-[85%] w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
            <div className="absolute top-[75%] left-[15%] w-2 h-2 bg-violet-300 rounded-full animate-ping" style={{ animationDuration: "5.5s", animationDelay: "2.5s" }} />
          </div>

          {/* Larger dinosaur characters */}
          {dinos.map((dino, index) => (
            <div
              key={`${dino.src}-${index}`}
              className={`absolute ${dino.position} ${dino.size} pointer-events-none opacity-60 hover:opacity-80 transition-opacity duration-500`}
              style={{
                animation: `float ${4 + (index % 4)}s ease-in-out infinite`,
                animationDelay: `${index * 0.3}s`
              }}
            >
              <Image
                src={dino.src}
                alt=""
                fill
                className="object-contain object-bottom drop-shadow-2xl"
                unoptimized
              />
            </div>
          ))}

          {/* Modern grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(transparent, transparent 50px, rgba(99, 102, 241, 0.1) 50px, rgba(99, 102, 241, 0.1) 51px),
                repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(99, 102, 241, 0.1) 50px, rgba(99, 102, 241, 0.1) 51px)
              `,
            }}
          />

          {/* Animated radial gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_70%)] animate-pulse" style={{ animationDuration: "6s" }} />

          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a2a]/80 via-transparent to-transparent" />
        </div>

        {/* Header section */}
        <div className="relative z-10 shrink-0">
          <StudentHeader userName={user?.name} avatarUrl={user?.avatar} />
        </div>

        {/* Main content section with sidebar */}
        <div className="relative flex flex-1 min-h-0 px-4 pb-4 pt-2">
          <StudentSidebar roleRoot={roleRoot} version="v1.0.0" />

          <section className="flex min-w-0 flex-1 flex-col min-h-0 relative ml-3">
            <NeonContentFrame>
              <div className="relative h-full overflow-hidden backdrop-blur-sm">
                <div className="relative z-10 h-full overflow-hidden">{children}</div>
              </div>
            </NeonContentFrame>
          </section>
        </div>

        <StudentFooter />
      </div>

      {/* Global styles for float animation */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
        `}
      </style>
    </StudentStreakWrapper>
  );
}