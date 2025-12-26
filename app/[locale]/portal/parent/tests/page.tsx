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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kiểm tra & Báo cáo</h1>
        <p className="text-slate-600">Xem kết quả kiểm tra và báo cáo học tập của con.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "placement" ? "default" : "outline"}
          onClick={() => setActiveTab("placement")}
        >
          Placement Test
        </Button>
        <Button
          variant={activeTab === "periodic" ? "default" : "outline"}
          onClick={() => setActiveTab("periodic")}
        >
          Kiểm tra định kỳ
        </Button>
        <Button
          variant={activeTab === "monthly" ? "default" : "outline"}
          onClick={() => setActiveTab("monthly")}
        >
          Báo cáo tháng
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
        >
          Lịch sử báo cáo
        </Button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "placement" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                Kết quả Placement Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-slate-500">Chưa có kết quả Placement Test</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "periodic" && (
          <div className="space-y-4">
            {MOCK_TEST_RESULTS.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{test.date}</p>
                    </div>
                    <Badge
                      className={
                        test.grade.startsWith("A")
                          ? "bg-green-100 text-green-700 border-green-300 text-lg px-4 py-1"
                          : "bg-blue-100 text-blue-700 border-blue-300 text-lg px-4 py-1"
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
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${(test.score / test.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Chi tiết theo kỹ năng:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {test.subjects.map((subject, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">
                              {subject.name}
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {subject.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4">
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
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{report.month}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{report.attendance}%</div>
                      <div className="text-sm text-slate-600">Điểm danh</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{report.homework}%</div>
                      <div className="text-sm text-slate-600">Bài tập</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">
                        {report.participation}%
                      </div>
                      <div className="text-sm text-slate-600">Tham gia</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-lg font-bold text-orange-700">{report.overall}</div>
                      <div className="text-sm text-slate-600">Đánh giá</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">Nhận xét của giáo viên:</h4>
                    <p className="text-sm text-slate-700">{report.comments}</p>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Tải báo cáo PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                Lịch sử báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Báo cáo tháng 12/2024</h4>
                      <p className="text-sm text-slate-500">Xuất lúc: 31/12/2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Báo cáo tháng 11/2024</h4>
                      <p className="text-sm text-slate-500">Xuất lúc: 30/11/2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
