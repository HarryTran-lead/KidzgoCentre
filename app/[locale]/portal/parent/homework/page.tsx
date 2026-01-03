"use client";

import { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, Calendar, Upload, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { Badge } from "@/components/lightswind/badge";

type TabType = "all" | "pending" | "submitted" | "late";

type Assignment = {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  status: "PENDING" | "SUBMITTED" | "LATE";
  submittedAt?: string;
  score?: number;
  feedback?: string;
};

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "1",
    subject: "Tiếng Anh",
    title: "Viết đoạn văn về gia đình",
    description: "Hoàn thành đoạn văn 200 từ giới thiệu về gia đình.",
    deadline: "30/12/2024 21:00",
    status: "PENDING",
  },
  {
    id: "2",
    subject: "Tiếng Anh",
    title: "Bài tập ngữ pháp Unit 5",
    description: "Làm trọn bộ bài tập Unit 5 trong giáo trình.",
    deadline: "28/12/2024 20:00",
    status: "SUBMITTED",
    submittedAt: "27/12/2024 19:10",
    score: 9,
    feedback: "Làm tốt! Cần chú ý thêm về thì hiện tại hoàn thành.",
  },
  {
    id: "3",
    subject: "Tiếng Anh",
    title: "Speaking Practice - Video",
    description: "Quay video giới thiệu bản thân 3-5 phút.",
    deadline: "25/12/2024 23:59",
    status: "LATE",
  },
];

export default function HomeworkPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const filteredAssignments = MOCK_ASSIGNMENTS.filter((assignment) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return assignment.status === "PENDING";
    if (activeTab === "submitted") return assignment.status === "SUBMITTED";
    if (activeTab === "late") return assignment.status === "LATE";
    return true;
  });

  const stats = {
    total: MOCK_ASSIGNMENTS.length,
    pending: MOCK_ASSIGNMENTS.filter((a) => a.status === "PENDING").length,
    submitted: MOCK_ASSIGNMENTS.filter((a) => a.status === "SUBMITTED").length,
    late: MOCK_ASSIGNMENTS.filter((a) => a.status === "LATE").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bài tập & Nộp bài</h1>
        <p className="text-slate-600">Theo dõi các bài tập được giao và tiến độ nộp bài của bạn.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Tổng số bài tập</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-slate-600">Chưa nộp</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <div className="text-sm text-slate-600">Đã nộp</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.late}</div>
            <div className="text-sm text-slate-600">Quá hạn</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => setActiveTab("all")}
        >
          Tất cả ({stats.total})
        </Button>
        <Button
          variant={activeTab === "pending" ? "default" : "outline"}
          onClick={() => setActiveTab("pending")}
        >
          Chưa nộp ({stats.pending})
        </Button>
        <Button
          variant={activeTab === "submitted" ? "default" : "outline"}
          onClick={() => setActiveTab("submitted")}
        >
          Đã nộp ({stats.submitted})
        </Button>
        <Button
          variant={activeTab === "late" ? "default" : "outline"}
          onClick={() => setActiveTab("late")}
        >
          Quá hạn ({stats.late})
        </Button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      {assignment.subject}
                    </Badge>
                    <Badge
                      className={
                        assignment.status === "SUBMITTED"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : assignment.status === "LATE"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      }
                    >
                      {assignment.status === "SUBMITTED"
                        ? "Đã nộp"
                        : assignment.status === "LATE"
                        ? "Quá hạn"
                        : "Chưa nộp"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{assignment.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{assignment.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Hạn nộp: {assignment.deadline}
                    </span>
                    {assignment.submittedAt && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã nộp: {assignment.submittedAt}
                      </span>
                    )}
                    {assignment.score !== undefined && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        Điểm: {assignment.score}/10
                      </span>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-blue-700 mb-1">
                            Nhận xét của giáo viên:
                          </div>
                          <div className="text-sm text-slate-700">{assignment.feedback}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {assignment.status === "PENDING" && (
                <Button className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Nộp bài
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredAssignments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Không có bài tập nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
