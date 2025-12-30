"use client";

import {
  Calendar,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/lightswind/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/lightswind/avatar";
import { Badge } from "@/components/lightswind/badge";

type ChildOverview = {
  id: string;
  name: string;
  avatar?: string;
  className: string;
  level: string;
  enrollmentDate: string;
  totalClasses: number;
  attendanceRate: number;
  completedHomework: number;
  totalHomework: number;
  currentXP: number;
  currentLevel: number;
  streak: number;
  stars: number;
};

// Mock data - replace with actual data from API
const MOCK_OVERVIEW: ChildOverview = {
  id: "1",
  name: "Nguyễn Minh An",
  avatar: "/image/avatar-placeholder.png",
  className: "Class 1A - Morning",
  level: "Level 3",
  enrollmentDate: "15/09/2024",
  totalClasses: 48,
  attendanceRate: 95.8,
  completedHomework: 42,
  totalHomework: 45,
  currentXP: 3450,
  currentLevel: 8,
  streak: 15,
  stars: 127,
};

export default function ChildOverviewCard() {
  const overview = MOCK_OVERVIEW;

  return (
    <Card className="border-pink-100 shadow-sm">
      <CardContent className="p-6">
        {/* Header with Avatar */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-20 w-20 border-4 border-pink-100">
            <AvatarImage src={overview.avatar} alt={overview.name} />
            <AvatarFallback className="bg-linear-to-br from-pink-400 to-purple-500 text-white text-2xl font-bold">
              {overview.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{overview.name}</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-xs border-pink-300 text-pink-700">
                {overview.className}
              </Badge>
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                {overview.level}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Ngày nhập học: {overview.enrollmentDate}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Attendance Rate */}
          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Điểm danh</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{overview.attendanceRate}%</div>
            <p className="text-xs text-green-600 mt-1">{overview.totalClasses} buổi học</p>
          </div>

          {/* Homework Completion */}
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Bài tập</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {overview.completedHomework}/{overview.totalHomework}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {Math.round((overview.completedHomework / overview.totalHomework) * 100)}% hoàn thành
            </p>
          </div>

          {/* Level & XP */}
          <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Level</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">Level {overview.currentLevel}</div>
            <p className="text-xs text-purple-600 mt-1">{overview.currentXP.toLocaleString()} XP</p>
          </div>

          {/* Streak & Stars */}
          <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Thành tích</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{overview.streak} ngày</div>
            <p className="text-xs text-orange-600 mt-1">⭐ {overview.stars} sao</p>
          </div>
        </div>

        {/* Progress Bar for next level */}
        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">Tiến độ lên level tiếp theo</span>
            <span className="text-xs font-semibold text-purple-600">68%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: "68%" }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Còn 1,150 XP để đạt Level 9</p>
        </div>
      </CardContent>
    </Card>
  );
}
