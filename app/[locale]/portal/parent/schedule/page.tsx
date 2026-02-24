"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Users, Clock3 } from "lucide-react";

type TabType = "all" | "classes" | "makeup" | "events";
type TimeSlot = "morning" | "afternoon" | "evening";

interface ClassEvent {
  id: string;
  time: string;
  title: string;
  room?: string;
  location?: string;
  type: "class" | "makeup" | "event";
  teacher?: string;
  description?: string;
}

interface DaySchedule {
  [key: string]: ClassEvent[];
}

const MOCK_WEEKLY_SCHEDULE: { [key in TimeSlot]: DaySchedule } = {
  morning: {
    "Thứ 7": [
      {
        id: "1",
        time: "09:00 - 11:00",
        title: "Họp phụ huynh tháng 12",
        location: "Hội trường",
        type: "event",
        teacher: "Ban quản lý",
      },
    ],
    "CN": [
      {
        id: "2",
        time: "08:00 - 11:30",
        title: "Mock Test IELTS",
        room: "Phòng 201",
        type: "class",
        teacher: "Academic",
        description: "Bài kiểm tra thử IELTS toàn diện",
      },
    ],
  },
  afternoon: {
    "Thứ 4": [
      {
        id: "3",
        time: "17:30 - 19:00",
        title: "TOEFL Junior A",
        room: "Phòng 202",
        type: "class",
        teacher: "Thầy Tín",
      },
    ],
    "Thứ 6": [
      {
        id: "4",
        time: "16:00 - 18:00",
        title: "TOEIC Intermediate",
        room: "Phòng 205",
        type: "class",
        teacher: "Thầy Minh",
        description: "Bù cho 03/12",
      },
    ],
  },
  evening: {
    "Thứ 2": [
      {
        id: "5",
        time: "18:30 - 20:00",
        title: "PRE-IELTS 11",
        room: "Phòng 101",
        type: "class",
        teacher: "Cô Hạnh",
      },
    ],
    "Thứ 3": [
      {
        id: "6",
        time: "20:15 - 21:15",
        title: "IELTS Speaking Club",
        location: "Hội trường",
        type: "event",
        teacher: "Academic",
      },
    ],
    "Thứ 5": [
      {
        id: "7",
        time: "19:00 - 21:00",
        title: "IELTS Foundation - A1",
        room: "Phòng 301",
        type: "class",
        teacher: "Cô Phương",
      },
    ],
    "Thứ 6": [
      {
        id: "8",
        time: "18:30 - 20:00",
        title: "Kids English F1",
        room: "Phòng 102",
        type: "class",
        teacher: "Cô Vi",
      },
    ],
  },
};

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const DAY_DATES = ["02/12", "03/12", "04/12", "05/12", "06/12", "07/12", "08/12"];
const TIME_SLOTS = [
  { key: "morning" as TimeSlot, label: "Sáng" },
  { key: "afternoon" as TimeSlot, label: "Chiều" },
  { key: "evening" as TimeSlot, label: "Tối" },
];

const TYPE_META = {
  class: {
    text: "Lớp học",
    badge: "bg-red-600 text-white",
    chip: "bg-red-50 text-red-700 border border-red-200",
  },
  makeup: {
    text: "Buổi bù",
    badge: "bg-gray-700 text-white",
    chip: "bg-gray-100 text-gray-700 border border-gray-200",
  },
  event: {
    text: "Sự kiện",
    badge: "bg-gray-600 text-white",
    chip: "bg-gray-100 text-gray-700 border border-gray-200",
  },
};

function TypeBadge({ type }: { type: "class" | "makeup" | "event" }) {
  const { text, badge } = TYPE_META[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{text}</span>;
}

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedClass, setSelectedClass] = useState<ClassEvent | null>(null);
  const [currentWeek, setCurrentWeek] = useState("02/12/2024 - 08/12/2024");

  const filterEvents = (events: ClassEvent[]) => {
    if (activeTab === "all") return events;
    if (activeTab === "classes") return events.filter((e) => e.type === "class");
    if (activeTab === "makeup") return events.filter((e) => e.type === "makeup");
    if (activeTab === "events") return events.filter((e) => e.type === "event");
    return events;
  };

  const goToPreviousWeek = () => {
    // Logic to navigate to previous week
    console.log("Previous week");
  };

  const goToNextWeek = () => {
    // Logic to navigate to next week
    console.log("Next week");
  };

  const goToCurrentWeek = () => {
    // Logic to go to current week
    console.log("Current week");
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "class":
        return "bg-gradient-to-r from-red-600 to-red-700";
      case "makeup":
        return "bg-gradient-to-r from-gray-600 to-gray-700";
      case "event":
        return "bg-gradient-to-r from-gray-600 to-gray-700";
      default:
        return "bg-gradient-to-r from-red-600 to-red-700";
    }
  };

  const getLightColor = (type: string) => {
    switch (type) {
      case "class":
        return "bg-gradient-to-br from-red-50 to-red-100";
      case "makeup":
        return "bg-gradient-to-br from-gray-100 to-gray-200";
      case "event":
        return "bg-gradient-to-br from-gray-100 to-gray-200";
      default:
        return "bg-gradient-to-br from-red-50 to-red-100";
    }
  };

  const modeDot = (room?: string, location?: string) => {
    const place = room || location || "";
    return place.toLowerCase().includes("online") ? "bg-red-600" : "bg-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <CalendarDays className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Lịch học của con
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Xem thời khoá biểu theo tuần, buổi bù và sự kiện đặc biệt của con.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-2 inline-flex gap-2">
        {["all", "classes", "makeup", "events"].map((tab) => {
          const isActive = activeTab === tab;
          const tabText = {
            all: "Tất cả",
            classes: "Lớp học",
            makeup: "Buổi bù",
            events: "Sự kiện",
          }[tab];
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "bg-white border border-red-200 text-gray-600 hover:bg-red-50"
              }`}
            >
              {tabText}
            </button>
          );
        })}
      </div>

      {/* Week Navigation - Style giống admin */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <div className="flex items-center gap-4">
            <div className="relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
              <CalendarDays size={24} />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">
                  02
                </span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
              <div className="text-gray-600">{currentWeek}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
              Tuần từ 02/12 đến 08/12
            </div>
            <button
              className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={goToNextWeek}
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <button
              className="ml-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm hover:bg-red-50 transition-colors cursor-pointer text-gray-700"
              onClick={goToCurrentWeek}
            >
              Tuần này
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-t border-red-200 bg-gradient-to-r from-red-50 to-gray-100 text-sm font-semibold text-gray-700">
              <div className="px-4 py-3">Ca / Ngày</div>
              {DAYS.map((day, index) => (
                <div key={day} className="px-4 py-3 border-l border-red-200">
                  <div className="flex flex-col items-center gap-1">
                    <span className="capitalize">{day}</span>
                    <span className="h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold bg-white text-gray-700 border border-red-200">
                      {index + 2}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots Rows */}
            {TIME_SLOTS.map((slot, rowIdx) => (
              <div key={slot.key} className="grid grid-cols-8 border-t border-red-200">
                <div className="px-4 py-4 text-sm font-semibold text-gray-800 bg-gradient-to-r from-red-50 to-gray-100 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{slot.label}</span>
                    {slot.key === "morning" && <span className="text-xs text-gray-500 mt-1">7:00-12:00</span>}
                    {slot.key === "afternoon" && <span className="text-xs text-gray-500 mt-1">12:00-18:00</span>}
                    {slot.key === "evening" && <span className="text-xs text-gray-500 mt-1">18:00-22:00</span>}
                  </div>
                </div>

                {DAYS.map((day) => {
                  const events = MOCK_WEEKLY_SCHEDULE[slot.key][day] || [];
                  const filteredEvents = filterEvents(events);

                  return (
                    <div
                      key={`${slot.key}-${day}`}
                      className={`min-h-[130px] p-3 ${
                        rowIdx % 2 ? "bg-white" : "bg-gray-50"
                      } border-l border-red-200`}
                    >
                      <div className="space-y-2">
                        {filteredEvents.map((event) => {
                          const lightColor = getLightColor(event.type);
                          return (
                            <button
                              key={event.id}
                              onClick={() => setSelectedClass(event)}
                              className={`w-full text-left rounded-xl p-2.5 text-xs transition-all duration-200 hover:shadow-md cursor-pointer border border-red-200 ${lightColor}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`h-2 w-2 rounded-full ${modeDot(event.room, event.location)}`} />
                                    <span className="font-semibold text-gray-900 truncate">{event.title}</span>
                                  </div>
                                  <div className="text-[11px] text-gray-600 mb-1">{event.time}</div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                    <MapPin size={10} />
                                    <span className="truncate">{event.room || event.location}</span>
                                  </div>
                                  {event.teacher && (
                                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                      <Users size={10} />
                                      <span>{event.teacher}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        {filteredEvents.length === 0 && (
                          <div className="text-[13px] text-gray-400 italic text-center py-4">
                            Trống
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Detail Modal */}
      {selectedClass && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedClass(null)}
        >
          <div 
            className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-red-200 bg-gradient-to-br from-white to-red-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-red-100 to-red-100 border-b border-red-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${getEventColor(selectedClass.type)} text-white shadow-md`}>
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Chi tiết lịch học</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 rounded-lg hover:bg-red-200/60 bg-white/60 border border-red-200 transition-colors cursor-pointer"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <TypeBadge type={selectedClass.type} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedClass.title}
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock3 className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-700">Thời gian</div>
                      <div className="text-gray-600">{selectedClass.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-700">
                        {selectedClass.room ? "Phòng học" : "Địa điểm"}
                      </div>
                      <div className="text-gray-600">{selectedClass.room || selectedClass.location}</div>
                    </div>
                  </div>

                  {selectedClass.teacher && (
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-700">Giáo viên</div>
                        <div className="text-gray-600">{selectedClass.teacher}</div>
                      </div>
                    </div>
                  )}

                  {selectedClass.description && (
                    <div className="mt-4 pt-4 border-t border-red-100">
                      <div className="font-medium text-gray-700 mb-2">Mô tả</div>
                      <div className="text-gray-600 bg-white/50 rounded-lg p-3 text-sm">
                        {selectedClass.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-red-200 flex justify-end">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-600"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-700"></div>
            <span className="text-sm text-gray-600">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-red-600 to-red-700"></div>
            <span className="text-sm text-gray-600">Lớp học</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-gray-600 to-gray-700"></div>
            <span className="text-sm text-gray-600">Buổi bù</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-gray-600 to-gray-700"></div>
            <span className="text-sm text-gray-600">Sự kiện</span>
          </div>
        </div>
      </div>
    </div>
  );
}