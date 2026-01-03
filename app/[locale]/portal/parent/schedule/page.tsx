"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/lightswind/button";
import { Badge } from "@/components/lightswind/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/lightswind/dialog";

type TabType = "all" | "classes" | "makeup" | "events";
type TimeSlot = "morning" | "afternoon" | "evening";

interface ClassEvent {
  id: string;
  time: string;
  title: string;
  room?: string;
  location?: string;
  type: "class" | "makeup" | "event";
  color: "blue" | "yellow" | "red" | "green" | "purple";
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
        color: "yellow",
      },
    ],
    "CN": [
      {
        id: "2",
        time: "08:00 - 11:30",
        title: "Mock Test IELTS",
        room: "Phòng 201",
        type: "class",
        color: "yellow",
        teacher: "Ms. Hoa",
        description: "Bài kiểm tra thử IELTS toàn diện bao gồm 4 kỹ năng: Listening, Reading, Writing, Speaking",
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
        color: "blue",
        teacher: "Ms. Lan",
        description: "Lớp học TOEFL Junior dành cho học sinh cấp 2, tập trung vào kỹ năng Listening và Reading",
      },
    ],
    "Thứ 6": [
      {
        id: "4",
        time: "16:00 - 18:00",
        title: "TOEIC Intermediate",
        room: "Phòng 205",
        type: "class",
        color: "red",
        teacher: "Mr. Minh",
        description: "Khóa TOEIC trung cấp, luyện thi đạt điểm 600-750",
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
        color: "blue",
        teacher: "Ms. Hương",
        description: "Khóa học Pre-IELTS cho học sinh lớp 11, chuẩn bị nền tảng cho kỳ thi IELTS",
      },
    ],
    "Thứ 3": [
      {
        id: "6",
        time: "20:15 - 21:15",
        title: "IELTS Speaking Club",
        location: "Hội trường",
        type: "event",
        color: "yellow",
        teacher: "Native Teacher",
        description: "Câu lạc bộ luyện Speaking với giáo viên bản xứ, chủ đề tự do",
      },
    ],
    "Thứ 5": [
      {
        id: "7",
        time: "19:00 - 21:00",
        title: "IELTS Foundation - A1",
        room: "Phòng 301",
        type: "class",
        color: "blue",
        teacher: "Ms. Thu",
        description: "Khóa học IELTS Foundation dành cho người mới bắt đầu, trình độ A1",
      },
    ],
    "Thứ 6": [
      {
        id: "8",
        time: "18:30 - 20:00",
        title: "Kids English F1",
        room: "Phòng 102",
        type: "class",
        color: "purple",
        teacher: "Ms. Trang",
        description: "Tiếng Anh thiếu nhi cơ bản, phát triển 4 kỹ năng qua trò chơi và hoạt động tương tác",
      },
    ],
  },
};

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const TIME_SLOTS = [
  { key: "morning" as TimeSlot, label: "Sáng" },
  { key: "afternoon" as TimeSlot, label: "Chiều" },
  { key: "evening" as TimeSlot, label: "Tối" },
];

const COLOR_STYLES = {
  blue: "bg-blue-100 border-blue-400 text-blue-900",
  yellow: "bg-yellow-100 border-yellow-400 text-yellow-900",
  red: "bg-red-100 border-red-400 text-red-900",
  green: "bg-green-100 border-green-400 text-green-900",
  purple: "bg-purple-100 border-purple-400 text-purple-900",
};

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedClass, setSelectedClass] = useState<ClassEvent | null>(null);
  const [currentWeek, setCurrentWeek] = useState("Tuần 2/12/2024 - 8/12/2024");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lịch học</h1>
        <p className="text-slate-600">Xem thời khóa biểu và lịch học của con.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => setActiveTab("all")}
          className={activeTab === "all" ? "bg-slate-900 text-white" : ""}
        >
          Tất cả
        </Button>
        <Button
          variant={activeTab === "classes" ? "default" : "outline"}
          onClick={() => setActiveTab("classes")}
        >
          Lớp học
        </Button>
        <Button
          variant={activeTab === "makeup" ? "default" : "outline"}
          onClick={() => setActiveTab("makeup")}
        >
          Buổi bù
        </Button>
        <Button
          variant={activeTab === "events" ? "default" : "outline"}
          onClick={() => setActiveTab("events")}
        >
          Sự kiện
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Thời khoá biểu theo tuần</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">
            {currentWeek}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentWeek}>
            Tuần này
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px] border border-slate-200 rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-8 bg-slate-50">
            <div className="p-3 border-r border-slate-200 font-semibold text-slate-700">
              Ca / Ngày
            </div>
            {DAYS.map((day, index) => (
              <div
                key={day}
                className="p-3 border-r last:border-r-0 border-slate-200 text-center"
              >
                <div className="font-semibold text-slate-700">{day}</div>
                <div className="text-xs text-slate-500">{index + 2}</div>
              </div>
            ))}
          </div>

          {/* Time Slots Rows */}
          {TIME_SLOTS.map((slot) => (
            <div key={slot.key} className="grid grid-cols-8 border-t border-slate-200">
              <div className="p-3 border-r border-slate-200 font-medium text-slate-600 bg-slate-50">
                {slot.label}
              </div>
              {DAYS.map((day) => {
                const events = MOCK_WEEKLY_SCHEDULE[slot.key][day] || [];
                const filteredEvents = filterEvents(events);

                return (
                  <div
                    key={`${slot.key}-${day}`}
                    className="p-2 border-r last:border-r-0 border-slate-200 min-h-[100px]"
                  >
                    {filteredEvents.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">Trống</div>
                    ) : (
                      <div className="space-y-2">
                        {filteredEvents.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedClass(event)}
                            className={`w-full text-left p-2 rounded-lg border-l-4 ${
                              COLOR_STYLES[event.color]
                            } hover:shadow-md transition-shadow cursor-pointer`}
                          >
                            <div className="flex items-start gap-1">
                              <div className="w-1 h-1 rounded-full bg-current mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium mb-0.5">{event.time}</div>
                                <div className="text-sm font-semibold leading-tight mb-1">
                                  {event.title}
                                </div>
                                {event.room && (
                                  <div className="text-xs opacity-75">{event.room}</div>
                                )}
                                {event.location && (
                                  <div className="text-xs opacity-75">{event.location}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Class Detail Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Chi tiết lịch học
            </DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {selectedClass.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className={
                      selectedClass.type === "class"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : selectedClass.type === "makeup"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    }
                  >
                    {selectedClass.type === "class"
                      ? "Lớp học"
                      : selectedClass.type === "makeup"
                      ? "Buổi bù"
                      : "Sự kiện"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-700">Thời gian</div>
                    <div className="text-slate-600">{selectedClass.time}</div>
                  </div>
                </div>

                {selectedClass.room && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-slate-500">
                      📍
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">Phòng học</div>
                      <div className="text-slate-600">{selectedClass.room}</div>
                    </div>
                  </div>
                )}

                {selectedClass.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-slate-500">
                      📍
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">Địa điểm</div>
                      <div className="text-slate-600">{selectedClass.location}</div>
                    </div>
                  </div>
                )}

                {selectedClass.teacher && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-slate-500">
                      👨‍🏫
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">Giáo viên</div>
                      <div className="text-slate-600">{selectedClass.teacher}</div>
                    </div>
                  </div>
                )}

                {selectedClass.description && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-slate-500">
                      📝
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">Mô tả</div>
                      <div className="text-slate-600">{selectedClass.description}</div>
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={() => setSelectedClass(null)}>
                Đóng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
