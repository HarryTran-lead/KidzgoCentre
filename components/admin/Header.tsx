
"use client";
import { Bell, Search, Menu } from "lucide-react";
import Image from "next/image";

export default function Header(){
  return (
    <header className="h-16 sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200 flex items-center">
      <div className="px-6 w-full flex items-center gap-3">
        <div className="hidden md:block flex-1">
          <div className="w-full max-w-md relative">
            <input className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                   placeholder="Tìm kiếm nhanh..."/>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          </div>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-slate-50">
          <Bell size={18} className="text-slate-600"/>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-pink-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2">
          <Image src="/image/LogoKidzgo.jpg" alt="avatar" width={28} height={28} className="rounded-md object-cover"/>
          <div className="text-sm">
            <div className="font-semibold text-black leading-4">Admin</div>
            <div className="text-[10px] text-slate-500">KidzGo</div>
          </div>
        </div>
      </div>
    </header>
  );
}
