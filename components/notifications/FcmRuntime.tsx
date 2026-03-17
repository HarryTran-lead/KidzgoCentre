"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/role";
import { startFcmForegroundListener } from "@/lib/firebase/fcm-web";

function getRoleFromPath(pathname: string): Role | null {
  if (pathname.includes("/portal/admin")) return "Admin";
  if (pathname.includes("/portal/staff-management")) return "Staff_Manager";
  if (pathname.includes("/portal/staff-accountant")) return "Staff_Accountant";
  if (pathname.includes("/portal/teacher")) return "Teacher";
  if (pathname.includes("/portal/parent")) return "Parent";
  if (pathname.includes("/portal/student")) return "Student";
  return null;
}

export default function FcmRuntime() {
  const pathname = usePathname();
  const role = useMemo(() => getRoleFromPath(pathname), [pathname]);

  useEffect(() => {
    if (!role) {
      return;
    }
    void startFcmForegroundListener({ role });
  }, [role]);

  return null;
}
