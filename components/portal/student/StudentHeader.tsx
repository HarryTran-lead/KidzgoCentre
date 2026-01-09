// components/portal/student/StudentHeader.tsx
"use client";

import { ChevronDown, User, LogOut } from "lucide-react";
import Image from "next/image";
import { LOGO } from "@/lib/theme/theme";
import { useState } from "react";

type StudentHeaderProps = {
  userName?: string;
  avatarUrl?: string;
};

export default function StudentHeader({
  userName,
  avatarUrl,
}: StudentHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative z-10 px-4 sm:px-6 pt-2 pb-2">
      <div className="flex justify-between items-center">
        {/* Logo section */}
        <div className="flex items-center">
          <Image
            src={LOGO}
            alt="KidzGo Logo"
            width={130}
            height={90}
            className="drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
            priority
          />
        </div>

        {/* User info section */}
        <div className="flex items-center">
          {/* Header hoa quyen - 1 thanh dai chung border */}
          <div className="flex items-center rounded-full">
            {/* Stats badges section */}
            <div className="flex items-center gap-4 bg-transparent px-5 py-3">
              {/* Coins */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center">
                  <Image
                    src="/icons/dollar.png"
                    alt="Coins"
                    width={30}
                    height={30}
                  />
                </div>
                <div className="text-lg font-black text-white drop-shadow-md">
                  3,636
                </div>
              </div>

              {/* Kim cuong */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center">
                  <Image
                    src="/icons/diamond.png"
                    alt="Diamond"
                    width={30}
                    height={30}
                  />
                </div>
                <div className="text-lg font-black text-white drop-shadow-md">
                  3,636
                </div>
              </div>

              {/* Chuoi ngay */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center">
                  <Image
                    src="/icons/fire.png"
                    alt="Fire"
                    width={30}
                    height={30}
                  />
                </div>
                <div className="text-lg font-black text-white drop-shadow-md">
                  36 ngày
                </div>
              </div>
            </div>

            {/* Profile section - noi lien */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 rounded-full bg-transparent pr-5 py-2 hover:bg-white/5 transition-all cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative rounded-full p-[2px] bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 shadow-lg">
                  <div className="relative h-[52px] w-[52px] rounded-full overflow-hidden bg-indigo-900">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={userName ?? "Student"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                        {(userName ?? "N")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white drop-shadow-md">
                    {userName ?? "Nguyen Van An"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-white/80 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/30"
                    onClick={() => setIsDropdownOpen(false)}
                  />

                  {/* Menu */}
                  <div className="absolute -right-1.5 top-22 w-[320px] rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-2 border-cyan-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 p-4">
                      {/* Role Badge */}
                      {/* <div className="flex justify-end mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[10px] font-bold text-white uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Học sinh
                        </span>
                      </div> */}

                      {/* Experience Bar */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-black text-white">Level 12</span>
                        </div>
                        
                        {/* Progress Bar with XP overlay */}
                        <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                            style={{ width: '85%' }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            850 / 1000 XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all group">
                        <div className="p-1.5 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-all">
                          <User size={18} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          Hồ sơ cá nhân
                        </span>
                      </button>

                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all group mt-1">
                        <div className="p-1.5 rounded-lg bg-red-50 group-hover:bg-red-100 transition-all">
                          <LogOut size={18} className="text-red-600" />
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          Đăng xuất
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
