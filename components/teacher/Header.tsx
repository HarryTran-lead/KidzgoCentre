"use client";

import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="font-semibold text-gray-900">Chào mừng trở lại, Nguyễn Thị An!</div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-full p-2 text-gray-900 hover:bg-slate-100">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-pink-500 rounded-full" />
          </button>
          <div className="h-8 w-8 rounded-full bg-slate-200 grid place-items-center text-xs">NT</div>
        </div>
      </div>
    </header>
  );
}
