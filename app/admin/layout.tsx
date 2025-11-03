import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "../globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7FA] via-[#FFFDF6] to-[#F5FAFF]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Header />
          <main className="p-6 max-w-[1400px] mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
