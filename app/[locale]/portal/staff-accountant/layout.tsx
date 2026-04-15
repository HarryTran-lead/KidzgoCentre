// app/[locale]/portal/layout.tsx
import type { ReactNode } from "react";
import Sidebar from "@/components/portal/sidebar";
import PortalHeader from "@/components/portal/header";
import { normalizeRole, type Role } from "@/lib/role";
import type { Locale } from "@/lib/i18n";
import { getSession } from "@/lib/auth";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PortalLayout({ children, params }: Props) {
  // Next 15: params là Promise nên phải await
  const session = await getSession();

  if (!session || !session.role) {
    return <div className="min-h-dvh bg-slate-50">{children}</div>;
  }

  // ✅ Từ đây trở xuống, chắc chắn đã có session + role → safe cho TypeScript
  const role: Role = normalizeRole(session.role);
  const user = session.user;

  return (
    <div className="h-dvh w-full">
      <div className="flex h-full">
        {/* Sidebar: desktop chiếm chỗ thật, mobile overlay ở trong chính component */}
        <Sidebar role={role} />

        {/* Cột nội dung: container cuộn chính */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header sticky trong cùng container */}
          <PortalHeader
            role={role}
            userName={user?.name}
            avatarUrl={user?.avatar}
          />

          {/* Nội dung cuộn dưới header */}
          <div className="grow px-4 sm:px-6 py-6 min-w-0 overflow-y-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
