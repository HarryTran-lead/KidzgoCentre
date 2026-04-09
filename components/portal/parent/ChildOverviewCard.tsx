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

interface ChildOverviewCardProps {
  data?: any;
}

export default function ChildOverviewCard({ data }: ChildOverviewCardProps) {
  const studentInfo = data?.studentInfo ?? data?.studentProfiles?.[0] ?? {};
  const classInfo = data?.classInfo ?? data?.classes?.[0] ?? {};
  const stats = data?.statistics ?? {};

  const overview = {
    name: studentInfo.displayName ?? studentInfo.name ?? "Học sinh",
    avatar: studentInfo.avatarUrl ?? "",
    className: classInfo.title ?? classInfo.code ?? "",
    level: studentInfo.level ?? `Level ${data?.level ?? 0}`,
    enrollmentDate: classInfo.startDate ? new Date(classInfo.startDate).toLocaleDateString("vi-VN") : "",
    totalClasses: stats.totalClasses ?? 0,
    attendanceRate: data?.attendanceRate ?? 0,
    completedHomework: data?.homeworkCompletion ?? stats.pendingHomeworks ?? 0,
    totalHomework: (data?.homeworkCompletion ?? 0) + (stats.pendingHomeworks ?? 0) || 0,
    currentXP: data?.xp ?? studentInfo.xp ?? 0,
    currentLevel: data?.level ?? studentInfo.level ?? 0,
    streak: data?.streak ?? 0,
    stars: data?.stars ?? studentInfo.totalStars ?? 0,
  };

  if (!data) return null;

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
            <span className="text-xs font-semibold text-purple-600">{overview.currentXP} XP</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (overview.currentXP % 1000) / 10)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Level {overview.currentLevel} • {overview.stars} ⭐</p>
        </div>
      </CardContent>
    </Card>
  );
}
