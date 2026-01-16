"use client";

import { useState } from "react";
import { FileCheck, BarChart3, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { Badge } from "@/components/lightswind/badge";

type TabType = "placement" | "periodic" | "monthly" | "history";

const MOCK_TEST_RESULTS = [
  {
    id: "1",
    name: "Mid-term Test - December",
    date: "15/12/2024",
    score: 85,
    maxScore: 100,
    grade: "A",
    subjects: [
      { name: "Reading", score: 90 },
      { name: "Writing", score: 80 },
      { name: "Listening", score: 85 },
      { name: "Speaking", score: 85 },
    ],
  },
  {
    id: "2",
    name: "Progress Test Unit 5",
    date: "08/12/2024",
    score: 42,
    maxScore: 50,
    grade: "B+",
    subjects: [
      { name: "Grammar", score: 45 },
      { name: "Vocabulary", score: 40 },
    ],
  },
];

const MOCK_MONTHLY_REPORTS = [
  {
    month: "Tháng 12/2024",
    attendance: 95,
    homework: 90,
    participation: 88,
    overall: "Excellent",
    comments:
      "Học viên có sự tiến bộ rõ rệt trong kỹ năng Speaking. Cần rèn luyện thêm về Writing.",
  },
  {
    month: "Tháng 11/2024",
    attendance: 90,
    homework: 85,
    participation: 85,
    overall: "Very Good",
    comments: "Học viên tham gia tích cực và hoàn thành tốt các bài tập.",
  },
];

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("periodic");

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 to-white p-4 md:p-6">
      {/* Header – theo theme parent/teacher */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Kiểm tra & Báo cáo
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi kết quả kiểm tra, báo cáo tháng và lịch sử học tập của con tại Kidzgo.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-white via-white to-pink-50/40 rounded-2xl border border-pink-200 overflow-hidden shadow-sm">
        {/* Tabs – dùng style giống parent account */}
        <div className="px-6 pt-6">
          <div className="flex flex-wrap gap-2">
            <TestsTabButton
              active={activeTab === "placement"}
              onClick={() => setActiveTab("placement")}
            >
              Placement Test
            </TestsTabButton>
            <TestsTabButton
              active={activeTab === "periodic"}
              onClick={() => setActiveTab("periodic")}
            >
              Kiểm tra định kỳ
            </TestsTabButton>
            <TestsTabButton
              active={activeTab === "monthly"}
              onClick={() => setActiveTab("monthly")}
            >
              Báo cáo tháng
            </TestsTabButton>
            <TestsTabButton
              active={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            >
              Lịch sử báo cáo
            </TestsTabButton>
          </div>
        </div>

        <div className="border-t border-pink-100 mt-4" />

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === "placement" && (
            <Card className="border-pink-100 bg-gradient-to-br from-white to-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  Kết quả Placement Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-slate-500">
                    Chưa có kết quả Placement Test cho học viên. Vui lòng liên hệ giáo viên hoặc quản lý
                    trung tâm để được hỗ trợ.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "periodic" && (
            <div className="space-y-4">
              {MOCK_TEST_RESULTS.map((test) => (
                <Card
                  key={test.id}
                  className="border-pink-100 bg-gradient-to-br from-white to-pink-50/40 shadow-sm"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-pink-600" />
                          {test.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Ngày kiểm tra: {test.date}</p>
                      </div>
                      <Badge
                        className={
                          test.grade.startsWith("A")
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300 text-lg px-4 py-1 rounded-full"
                            : "bg-blue-100 text-blue-700 border-blue-300 text-lg px-4 py-1 rounded-full"
                        }
                      >
                        {test.grade}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Tổng điểm</span>
                        <span className="text-2xl font-bold text-slate-900">
                          {test.score}/{test.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all"
                          style={{ width: `${(test.score / test.maxScore) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900">Chi tiết theo kỹ năng</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {test.subjects.map((subject, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white/70 rounded-xl border border-pink-100 flex items-center justify-between"
                          >
                            <span className="text-sm font-medium text-slate-700">
                              {subject.name}
                            </span>
                            <span className="text-lg font-bold text-pink-600">
                              {subject.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4 border-pink-200 text-pink-700 hover:bg-pink-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Tải báo cáo chi tiết
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "monthly" && (
            <div className="space-y-4">
              {MOCK_MONTHLY_REPORTS.map((report, idx) => (
                <Card
                  key={idx}
                  className="border-pink-100 bg-gradient-to-br from-white to-blue-50/40 shadow-sm"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      {report.month}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div className="text-2xl font-bold text-emerald-700">
                          {report.attendance}%
                        </div>
                        <div className="text-sm text-slate-600">Điểm danh</div>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-2xl border border-pink-200">
                        <div className="text-2xl font-bold text-pink-700">{report.homework}%</div>
                        <div className="text-sm text-slate-600">Bài tập</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                        <div className="text-2xl font-bold text-purple-700">
                          {report.participation}%
                        </div>
                        <div className="text-sm text-slate-600">Tham gia</div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                        <div className="text-lg font-bold text-amber-700">{report.overall}</div>
                        <div className="text-sm text-slate-600">Đánh giá chung</div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/70 rounded-2xl border border-blue-100">
                      <h4 className="font-semibold text-slate-900 mb-2">
                        Nhận xét của giáo viên
                      </h4>
                      <p className="text-sm text-slate-700">{report.comments}</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Tải báo cáo PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <Card className="border-pink-100 bg-gradient-to-br from-white to-slate-50/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Lịch sử báo cáo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <HistoryItem
                    title="Báo cáo tháng 12/2024"
                    time="Xuất lúc: 31/12/2024"
                  />
                  <HistoryItem
                    title="Báo cáo tháng 11/2024"
                    time="Xuất lúc: 30/11/2024"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TestsTabButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 group cursor-pointer ${
        active
          ? "bg-pink-100 text-pink-700 border border-pink-200 shadow-sm"
          : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
      }`}
    >
      {children}
      {!active && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-5 transition-opacity" />
      )}
    </button>
  );
}

function HistoryItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500">{time}</p>
      </div>
      <Button variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50">
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
}

