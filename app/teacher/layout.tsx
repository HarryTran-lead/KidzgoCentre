import "../globals.css";
import Sidebar from "@/components/teacher/Sidebar";
import Header from "@/components/teacher/Header";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7FA] via-[#FFFDF6] to-[#F5FAFF]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Header />
          <main className="p-6 max-w-[1400px] text-gray-900 dark:text-white mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
