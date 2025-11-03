import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="font-semibold text-gray-900">Cổng học viên</div>
        <div className="flex items-center gap-3">
          <button className="relative grid place-items-center w-9 h-9 rounded-full text-gray-900 border">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full bg-rose-600 text-white grid place-items-center">2</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white grid place-items-center text-xs">NA</div>
        </div>
      </div>
    </header>
  );
}