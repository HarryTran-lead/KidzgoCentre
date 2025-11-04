import type { ReactNode } from "react";
import StaffSidebar from "../../components/staff/Sidebar";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <StaffSidebar />
      <main className="flex-1 p-6 max-w-[1400px] mx-auto">{children}</main>
    </div>
  );
}
