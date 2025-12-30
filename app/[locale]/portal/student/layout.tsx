// app/[locale]/portal/student/layout.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import Sidebar from "@/components/portal/sidebar";
import PortalHeader from "@/components/portal/header";
import { normalizeRole, type Role } from "@/lib/role";
import { getSession } from "@/lib/auth";
import StudentStreakWrapper from "@/components/student/StudentStreakWrapper";

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
      <div className="h-dvh w-full overflow-hidden">
        <div className="flex h-full min-h-0">
          <Sidebar role={role} />

          <section className="flex min-w-0 flex-1 flex-col min-h-0">
            <PortalHeader role={role} userName={user?.name} avatarUrl={user?.avatar} />

            {/* scroll area */}
            <div className="relative min-h-0 flex-1 min-w-0 overflow-y-auto px-4 py-4 sm:px-6 isolate">
              {/* background layer */}
              <div className="pointer-events-none absolute inset-0 z-0">
                {/* fallback gradient behind image (so contain doesn't look empty) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f63] via-[#23104f] to-[#0b0a36]" />

             <Image
  src="/image/BackGroundStudent.png"
  alt="Student Background"
  fill
  priority
  className="object-cover object-[70%_40%]"
/>


                {/* nhẹ thôi để chữ dễ đọc (đừng đậm quá) */}
                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* content layer */}
              <div className="relative z-10">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </StudentStreakWrapper>
  );
}
