"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/lightswind/avatar";
import { Badge } from "@/components/lightswind/badge";

type Child = {
  id: string;
  name: string;
  avatar?: string;
  className?: string;
  level?: string;
};

// Mock data - replace with actual data from API
const MOCK_CHILDREN: Child[] = [
  {
    id: "1",
    name: "Nguyễn Minh An",
    avatar: "/image/avatar-placeholder.png",
    className: "Class 1A",
    level: "Level 3",
  },
  {
    id: "2",
    name: "Nguyễn Minh Hằng",
    avatar: "/image/avatar-placeholder.png",
    className: "Class 2B",
    level: "Level 5",
  },
];

export default function ChildSelector() {
  const [open, setOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(MOCK_CHILDREN[0]?.id);

  const selectedChild = MOCK_CHILDREN.find((child) => child.id === selectedChildId);

  return (
    <div className="w-full">
      <div className="relative">
        {/* Selected Child Button */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          {selectedChild && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0">
                <AvatarImage src={selectedChild.avatar} alt={selectedChild.name} />
                <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                  {selectedChild.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{selectedChild.name}</div>
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 mt-1">
                  Student
                </Badge>
              </div>
            </div>
          )}
          <ChevronDown 
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`} 
          />
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
              {MOCK_CHILDREN.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                    selectedChildId === child.id ? "bg-blue-50" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0">
                    <AvatarImage src={child.avatar} alt={child.name} />
                    <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                      {child.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{child.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {child.className} • {child.level}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
