// components/portal/student/StudentHeader.tsx
"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { LOGO } from "@/lib/theme/theme";

type StudentHeaderProps = {
  userName?: string;
  avatarUrl?: string;
};

export default function StudentHeader({
  userName,
  avatarUrl,
}: StudentHeaderProps) {
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
                6 ngày
              </div>
            </div>
          </div>

          {/* Profile section - noi lien */}
          <div className="flex items-center gap-3 rounded-r-full bg-transparent pr-5 py-2">
            {/* Avatar */}
            <div className="relative rounded-full p-[2px] bg-gradient-to-br from-white/60 via-purple-300 to-blue-300 shadow-lg">
              <div className="relative h-[52px] w-[52px] rounded-full overflow-hidden">
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

            {/* Name + stats */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-base font-black text-white drop-shadow-md">
                  {userName ?? "Nguyen Van An"}
                </span>
                <ChevronDown size={16} className="text-white/80" />
              </div>
              
              {/* Mini stats duoi ten */}
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/dollar.png"
                    alt="Coins"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm font-bold text-white/90">6,367</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/diamond.png"
                    alt="Diamond"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm font-bold text-white/90">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
