import type { ReactNode } from "react";
import AccountantSidebar from "@/components/accountant/Sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <AccountantSidebar />
      <main className="flex-1 p-6 max-w-[1400px] mx-auto">{children}</main>
    </div>
  );
}
