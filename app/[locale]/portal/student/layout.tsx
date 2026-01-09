// app/[locale]/portal/student/layout.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import Sidebar from "@/components/portal/sidebar";
import { normalizeRole, type Role } from "@/lib/role";
import { getSession } from "@/lib/auth";
import StudentStreakWrapper from "@/components/portal/student/StudentStreakWrapper";
import StudentHeader from "@/components/portal/student/StudentHeader";
import StudentFooter from "@/components/portal/student/StudentFooter";
import NeonContentFrame from "@/components/portal/student/NeonContentFrame";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function StudentLayout({ children }: Props) {
  const session = await getSession();

  if (!session || !session.role) {
    return <div className="min-h-dvh bg-slate-50">{children}</div>;
  }

  const role: Role = normalizeRole(session.role);
  const user = session.user;

  return (
    <StudentStreakWrapper>
      <div className="h-dvh w-full overflow-hidden flex flex-col">
        {/* background layer */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f63] via-[#23104f] to-[#0b0a36]" />
          <Image
            src="/image/BackGroundStudent.png"
            alt="Student Background"
            fill
            priority
            quality={100}
            className="object-fill object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/5" />
        </div>

        {/* Header section */}
        <div className="relative z-10 shrink-0">
          <StudentHeader userName={user?.name} avatarUrl={user?.avatar} />
        </div>

      
        {/* Main content section with sidebar */}
        <div className="relative flex flex-1 min-h-0 px-4 pb-4 pt-2">
          <Sidebar role={role} />

          <section className="flex min-w-0 flex-1 flex-col min-h-0 relative ml-3">
            <NeonContentFrame>
              <div className="relative h-full overflow-hidden">
                {/* content layer - full width for dashboard */}
                <div className="relative z-10 p-6 h-full overflow-hidden">{children}</div>
              </div>
            </NeonContentFrame>
          </section>
        </div>

        <StudentFooter />
      </div>
    </StudentStreakWrapper>
  );
}
