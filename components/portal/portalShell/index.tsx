// components/portal/PortalShell.tsx
"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/portal/sidebar";
import { normalizeRole, type Role } from "@/lib/role";

export default function PortalShell({
  role: roleRaw,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const role: Role = normalizeRole(roleRaw);
  return (
    <div className="min-h-screen grid md:grid-cols-[280px_1fr] bg-slate-50">
      <Sidebar role={role} />
      <main className="p-6">{children}</main>
    </div>
  );
}
