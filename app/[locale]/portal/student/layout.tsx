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
        {/* Background image */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <Image
            src="/image/background-dinosaur.jpg"
            alt="Background"
            fill
            className="object-cover object-center"
            unoptimized
          />
          {/* Dark overlay + blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
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
    </StudentStreakWrapper>
  );
}