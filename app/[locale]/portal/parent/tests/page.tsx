"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  FileCheck, 
  BarChart3, 
  FileText, 
  Download, 
  PieChart, 
  TrendingUp, 
  Users, 
  BookOpen,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
  Award,
  Clock,
  TrendingDown,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { getProfiles } from "@/lib/api/authService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import type { UserProfile } from "@/types/auth";

type TabType = "placement" | "periodic" | "monthly" | "session" | "history";
type ReportStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Published" | string;

type MonthlyReport = {
  id: string;
  studentProfileId?: string;
  studentName?: string;
  teacherName?: string;
  className?: string;
  status?: ReportStatus;
  month?: number;
  year?: number;
  draftContent?: string;
  updatedAt?: string;
};

type Paginated<T> = {
  items?: T[];
  data?: T[];
};

type ReportPayload = Paginated<MonthlyReport> & {
  reports?: Paginated<MonthlyReport>;
};

type SessionReport = {
  id: string;
  sessionId?: string;
  studentProfileId?: string;
  studentName?: string;
  teacherName?: string;
  className?: string;
  teacherUserId?: string;
  classId?: string;
  reportDate?: string;
  feedback?: string;
  reason?: string;
  status?: ReportStatus;
  updatedAt?: string;
  createdAt?: string;
};

type SessionReportPayload = Paginated<Record<string, unknown>> & {
  sessionReports?: Paginated<Record<string, unknown>> | Record<string, unknown>[];
};

const STATUS_ALIAS: Record<string, string> = {
  Review: "Submitted",
};

function pickValue(raw: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return undefined;
}

function normalizeSessionReport(raw: Record<string, unknown>): SessionReport | null {
  const id = pickValue(raw, "id", "Id", "reportId", "ReportId");
  if (!id) return null;
  return {
    id,
    sessionId: pickValue(raw, "sessionId", "SessionId"),
    studentProfileId: pickValue(raw, "studentProfileId", "StudentProfileId"),
    studentName: pickValue(raw, "studentName", "StudentName", "displayName"),
    teacherName: pickValue(raw, "teacherName", "TeacherName"),
    className: pickValue(raw, "className", "ClassName"),
    teacherUserId: pickValue(raw, "teacherUserId", "TeacherUserId"),
    classId: pickValue(raw, "classId", "ClassId"),
    reportDate: pickValue(raw, "reportDate", "ReportDate"),
    feedback: pickValue(raw, "feedback", "Feedback"),
    reason: pickValue(raw, "reason", "Reason", "rejectReason", "RejectReason", "rejectionReason", "RejectionReason"),
    status: pickValue(raw, "status", "Status"),
    updatedAt: pickValue(raw, "updatedAt", "UpdatedAt"),
    createdAt: pickValue(raw, "createdAt", "CreatedAt"),
  };
}

const MOCK_TEST_RESULTS = [
  {
    id: "1",
    name: "Mid-term Test - December",
    date: "15/12/2024",
    score: 85,
    maxScore: 100,
    grade: "A",
    subjects: [
      { name: "Reading", score: 90, max: 100 },
      { name: "Writing", score: 80, max: 100 },
      { name: "Listening", score: 85, max: 100 },
      { name: "Speaking", score: 85, max: 100 },
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
      { name: "Grammar", score: 45, max: 50 },
      { name: "Vocabulary", score: 40, max: 50 },
    ],
  },
  {
    id: "3",
    name: "Speaking Assessment",
    date: "05/12/2024",
    score: 88,
    maxScore: 100,
    grade: "A",
    subjects: [
      { name: "Fluency", score: 90, max: 100 },
      { name: "Pronunciation", score: 85, max: 100 },
      { name: "Vocabulary", score: 88, max: 100 },
    ],
  },
  {
    id: "4",
    name: "Writing Test",
    date: "01/12/2024",
    score: 78,
    maxScore: 100,
    grade: "B",
    subjects: [
      { name: "Grammar", score: 75, max: 100 },
      { name: "Structure", score: 80, max: 100 },
      { name: "Content", score: 78, max: 100 },
    ],
  },
];

// Badge Component
function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// Simple Pie Chart Component
function SimplePieChart({ value, max = 100, size = 60, color = "red" }: { value: number; max?: number; size?: number; color?: string }) {
  const percentage = (value / max) * 100;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const colorClass = color === "red" ? "text-red-600" : "text-gray-700";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color === "red" ? "#dc2626" : "#374151"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colorClass}`}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "red",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  trend?: "up" | "down" | "stable";
  color?: "red" | "gray" | "black";
}) {
  const colorClasses = {
    red: "bg-gradient-to-r from-red-600 to-red-700",
    gray: "bg-gradient-to-r from-gray-600 to-gray-700",
    black: "bg-gradient-to-r from-gray-800 to-gray-900"
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800"
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingDown size={12} />}
            {trend === "stable" && <Activity size={12} />}
            {hint}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("periodic");
  const [studentProfiles, setStudentProfiles] = useState<UserProfile[]>([]);
  const [publishedReports, setPublishedReports] = useState<MonthlyReport[]>([]);
  const [publishedSessionReports, setPublishedSessionReports] = useState<SessionReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [sessionReportsLoading, setSessionReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [sessionReportsError, setSessionReportsError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<MonthlyReport | null>(null);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [sessionDetailError, setSessionDetailError] = useState<string | null>(null);
  const [activeSessionReport, setActiveSessionReport] = useState<SessionReport | null>(null);
  const { selectedProfile, setSelectedProfile } = useSelectedStudentProfile();

  const activeStudentProfileId = selectedProfile?.id ?? studentProfiles[0]?.id ?? "";

  useEffect(() => {
    let alive = true;
    getProfiles({ profileType: "Student" })
      .then((response) => {
        if (!alive) return;
        const raw = Array.isArray(response.data) ? response.data : response.data?.profiles ?? [];
        const students = raw.filter((profile) => profile.profileType === "Student");
        setStudentProfiles(students);
        if (!selectedProfile && students.length > 0) {
          setSelectedProfile(students[0]);
        }
      })
      .catch(() => {
        if (!alive) return;
        setStudentProfiles([]);
      });

    return () => {
      alive = false;
    };
  }, [selectedProfile, setSelectedProfile]);

  const getToken = () => {
    if (typeof window === "undefined") return "";

    const localToken =
      localStorage.getItem("kidzgo.accessToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");

    if (localToken) return localToken;

    const cookieToken = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("kidzgo.accessToken="))
      ?.split("=")
      .slice(1)
      .join("=");

    return cookieToken || "";
  };

  useEffect(() => {
    if (!activeStudentProfileId) {
      setPublishedReports([]);
      return;
    }

    const normalizeStatus = (status?: ReportStatus) =>
      STATUS_ALIAS[status ?? ""] ?? status ?? "";

    const getPaginatedItems = <T,>(
      payload: Paginated<T> | { [key: string]: unknown } | undefined,
      key?: string,
    ): T[] => {
      if (!payload) return [];
      const direct = payload as Paginated<T>;
      if (Array.isArray(direct.items)) return direct.items;
      if (Array.isArray(direct.data)) return direct.data;
      if (!key) return [];
      const payloadObj = payload as Record<string, unknown>;
      const nested = payloadObj[key] as Paginated<T> | undefined;
      if (Array.isArray(nested?.items)) return nested.items;
      if (Array.isArray(nested?.data)) return nested.data;
      return [];
    };

    const loadPublishedReports = async () => {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const query = new URLSearchParams({
          status: "Published",
          studentProfileId: activeStudentProfileId,
          pageNumber: "1",
          pageSize: "200",
        });

        const token = getToken();
        const response = await fetch(`/api/monthly-reports?${query.toString()}`, {
          method: "GET",
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        const text = await response.text();
        const payload = text ? JSON.parse(text) : {};
        if (!response.ok) {
          throw new Error(payload?.message || "Không thể tải báo cáo đã publish.");
        }

        const root = (payload?.data ?? payload) as ReportPayload;
        const reports = getPaginatedItems<MonthlyReport>(root, "reports")
          .filter((item) => item.studentProfileId === activeStudentProfileId)
          .filter((item) => normalizeStatus(item.status) === "Published")
          .sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
          });

        setPublishedReports(reports);
      } catch (error) {
        setPublishedReports([]);
        setReportsError(error instanceof Error ? error.message : "Không thể tải báo cáo đã publish.");
      } finally {
        setReportsLoading(false);
      }
    };

    loadPublishedReports();
  }, [activeStudentProfileId]);

  useEffect(() => {
    if (!activeStudentProfileId) {
      setPublishedSessionReports([]);
      return;
    }

    const normalizeStatus = (status?: ReportStatus) =>
      String(STATUS_ALIAS[status ?? ""] ?? status ?? "").trim().toUpperCase();

    const getSessionItems = (payload: SessionReportPayload | undefined): Record<string, unknown>[] => {
      if (!payload) return [];
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.sessionReports)) return payload.sessionReports;
      if (
        payload.sessionReports &&
        typeof payload.sessionReports === "object" &&
        Array.isArray(payload.sessionReports.items)
      ) {
        return payload.sessionReports.items;
      }
      if (
        payload.sessionReports &&
        typeof payload.sessionReports === "object" &&
        Array.isArray(payload.sessionReports.data)
      ) {
        return payload.sessionReports.data;
      }
      return [];
    };

    const loadPublishedSessionReports = async () => {
      setSessionReportsLoading(true);
      setSessionReportsError(null);
      try {
        const query = new URLSearchParams({
          status: "PUBLISHED",
          studentProfileId: activeStudentProfileId,
          pageNumber: "1",
          pageSize: "200",
        });

        const token = getToken();
        const response = await fetch(`/api/session-reports?${query.toString()}`, {
          method: "GET",
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        const text = await response.text();
        const payload = text ? JSON.parse(text) : {};
        if (!response.ok) {
          throw new Error(payload?.message || "Không thể tải báo cáo theo buổi.");
        }

        const root = (payload?.data ?? payload) as SessionReportPayload;
        const rows = getSessionItems(root)
          .map((item) => normalizeSessionReport(item))
          .filter((item): item is SessionReport => Boolean(item))
          .filter((item) => item.studentProfileId === activeStudentProfileId)
          .filter((item) => normalizeStatus(item.status) === "PUBLISHED")
          .sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.createdAt || "").getTime() || 0;
            const bTime = new Date(b.updatedAt || b.createdAt || "").getTime() || 0;
            return bTime - aTime;
          });

        setPublishedSessionReports(rows);
      } catch (error) {
        setPublishedSessionReports([]);
        setSessionReportsError(error instanceof Error ? error.message : "Không thể tải báo cáo theo buổi.");
      } finally {
        setSessionReportsLoading(false);
      }
    };

    loadPublishedSessionReports();
  }, [activeStudentProfileId]);

  const selectedStudentName = useMemo(() => {
    if (selectedProfile?.displayName) return selectedProfile.displayName;
    return studentProfiles.find((profile) => profile.id === activeStudentProfileId)?.displayName ?? "Học viên";
  }, [activeStudentProfileId, selectedProfile?.displayName, studentProfiles]);


  const normalizeDraftContent = (raw?: string | null): string => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as { draft_text?: string; draftText?: string };
        return parsed?.draft_text ?? parsed?.draftText ?? trimmed;
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  };

  const openReportDetail = async (report: MonthlyReport) => {
    setActiveReport(report);
    setDetailError(null);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const token = getToken();
      const response = await fetch(`/api/monthly-reports/${report.id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tải chi tiết báo cáo.");
      }

      const detail = (payload?.data ?? payload) as MonthlyReport;
      setActiveReport({ ...report, ...detail });
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Không thể tải chi tiết báo cáo.");
    } finally {
      setDetailLoading(false);
    }
  };

  const openSessionReportDetail = async (report: SessionReport) => {
    setActiveSessionReport(report);
    setSessionDetailError(null);
    setSessionDetailOpen(true);
    setSessionDetailLoading(true);

    try {
      const token = getToken();
      const response = await fetch(`/api/session-reports/${report.id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tải chi tiết báo cáo theo buổi.");
      }

      const detail = normalizeSessionReport((payload?.data ?? payload) as Record<string, unknown>);
      if (detail) {
        setActiveSessionReport({ ...report, ...detail });
      }
    } catch (error) {
      setSessionDetailError(error instanceof Error ? error.message : "Không thể tải chi tiết báo cáo theo buổi.");
    } finally {
      setSessionDetailLoading(false);
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("vi-VN");
  };

  // Calculate stats
  const totalTests = MOCK_TEST_RESULTS.length;
  const averageScore = (MOCK_TEST_RESULTS.reduce((acc, test) => acc + (test.score / test.maxScore * 100), 0) / totalTests).toFixed(1);
  const bestScore = Math.max(...MOCK_TEST_RESULTS.map(test => (test.score / test.maxScore * 100)));
  const totalReports = publishedReports.length;
  const totalSessionReports = publishedSessionReports.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Kiểm tra & Báo cáo
          </h1>
          <p className="text-sm text-gray-600">
            Theo dõi kết quả kiểm tra và báo cáo học tập
          </p>
        </div>
      </div>

      {/* Stats Cards - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileCheck size={20} />}
          label="Tổng bài kiểm tra"
          value={totalTests.toString()}
          hint="+2 bài trong tháng 12"
          trend="up"
          color="red"
        />
        <StatCard
          icon={<Target size={20} />}
          label="Điểm trung bình"
          value={`${averageScore}%`}
          hint="Tăng 5% so với tháng trước"
          trend="up"
          color="gray"
        />
        <StatCard
          icon={<Award size={20} />}
          label="Điểm cao nhất"
          value={`${bestScore}%`}
          hint="Bài Mid-term Test"
          trend="up"
          color="black"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Báo cáo đã nhận"
          value={(totalReports + totalSessionReports).toString()}
          hint={`Tháng: ${totalReports} - Theo buổi: ${totalSessionReports}`}
          trend="stable"
          color="red"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === "placement"} onClick={() => setActiveTab("placement")}>
          <FileCheck className="w-4 h-4" />
          Placement Test
        </TabButton>
        <TabButton active={activeTab === "periodic"} onClick={() => setActiveTab("periodic")}>
          <BarChart3 className="w-4 h-4" />
          Kiểm tra định kỳ
        </TabButton>
        <TabButton active={activeTab === "monthly"} onClick={() => setActiveTab("monthly")}>
          <PieChart className="w-4 h-4" />
          Báo cáo tháng
        </TabButton>
        <TabButton active={activeTab === "session"} onClick={() => setActiveTab("session")}>
          <BookOpen className="w-4 h-4" />
          Báo cáo theo buổi
        </TabButton>
        <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
          <FileText className="w-4 h-4" />
          Lịch sử báo cáo
        </TabButton>
      </div>

      {/* Content - Grid 3 columns */}
      {activeTab === "placement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <FileCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có Placement Test</h3>
              <p className="text-sm text-gray-600 mb-4">Liên hệ giáo viên để được hỗ trợ</p>
              <Button className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Đặt lịch kiểm tra
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "periodic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_TEST_RESULTS.map((test) => (
            <Card key={test.id} className="border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200 flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{test.name}</h3>
                      <p className="text-xs text-gray-500">{test.date}</p>
                    </div>
                  </div>
                  <Badge color={test.grade.startsWith("A") ? "red" : "black"}>
                    {test.grade}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <CardContent className="p-3 space-y-3">
                {/* Overall Score */}
                <div className="flex items-center gap-3">
                  <SimplePieChart value={test.score} max={test.maxScore} size={60} color="red" />
                  <div>
                    <div className="text-xs text-gray-500">Tổng điểm</div>
                    <div className="text-lg font-bold text-gray-900">
                      {test.score}/{test.maxScore}
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="grid grid-cols-2 gap-2">
                  {test.subjects.slice(0, 4).map((subject, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600 truncate mr-1">{subject.name}</span>
                      <span className="text-xs font-bold text-red-600 flex-shrink-0">{subject.score}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white h-8 text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Xem chi tiết
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-200 h-8 w-8 p-0">
                    <Download className="w-3.5 h-3.5 text-gray-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "monthly" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportsLoading && (
            <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center text-sm text-gray-600">
                Đang tải báo cáo đã phát hành...
              </CardContent>
            </Card>
          )}

          {!reportsLoading && reportsError && (
            <Card className="border-red-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
              <CardContent className="p-6">
                <div className="text-sm text-red-700">{reportsError}</div>
              </CardContent>
            </Card>
          )}

          {!reportsLoading && !reportsError && publishedReports.length === 0 && (
            <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có báo cáo đã phát hành</h3>
                <p className="text-sm text-gray-600">
                  Học viên {selectedStudentName} chưa có báo cáo tháng ở trạng thái Published.
                </p>
              </CardContent>
            </Card>
          )}

          {!reportsLoading &&
            !reportsError &&
            publishedReports.map((report) => (
              <Card key={report.id} className="border-gray-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                      <PieChart className="w-4 h-4 text-gray-700" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      Tháng {report.month ?? "?"}/{report.year ?? "?"}
                    </h3>
                  </div>
                </div>

                <CardContent className="p-3 space-y-3">
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Học viên: {report.studentName ?? selectedStudentName}</div>
                    <div>Lớp: {report.className ?? "—"}</div>
                    <div>Giáo viên: {report.teacherName ?? "—"}</div>
                    <div>Cập nhật: {formatDateTime(report.updatedAt)}</div>
                  </div>

                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {normalizeDraftContent(report.draftContent) || "Published report"}
                    </p>
                  </div>

                                    <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white h-8 text-xs"
                      onClick={() => openReportDetail(report)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View report
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-red-200 to-red-300 text-white h-8 text-xs"
                      disabled
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      PDF soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {activeTab === "session" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessionReportsLoading && (
            <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center text-sm text-gray-600">
                Đang tải báo cáo theo buổi...
              </CardContent>
            </Card>
          )}

          {!sessionReportsLoading && sessionReportsError && (
            <Card className="border-red-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
              <CardContent className="p-6">
                <div className="text-sm text-red-700">{sessionReportsError}</div>
              </CardContent>
            </Card>
          )}

          {!sessionReportsLoading && !sessionReportsError && publishedSessionReports.length === 0 && (
            <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có báo cáo theo buổi</h3>
                <p className="text-sm text-gray-600">
                  Học viên {selectedStudentName} chưa có Session Report ở trạng thái Published.
                </p>
              </CardContent>
            </Card>
          )}

          {!sessionReportsLoading &&
            !sessionReportsError &&
            publishedSessionReports.map((report) => (
              <Card key={report.id} className="border-gray-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                      <BookOpen className="w-4 h-4 text-gray-700" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      Buổi {report.reportDate || "-"}
                    </h3>
                  </div>
                </div>

                <CardContent className="p-3 space-y-3">
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Học viên: {report.studentName ?? selectedStudentName}</div>
                    <div>Lớp: {report.className ?? report.classId ?? "—"}</div>
                    <div>Giáo viên: {report.teacherName ?? report.teacherUserId ?? "—"}</div>
                    <div>Cập nhật: {formatDateTime(report.updatedAt || report.createdAt)}</div>
                  </div>

                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {report.feedback || "Published session report"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white h-8 text-xs"
                      onClick={() => openSessionReportDetail(report)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Xem báo cáo buổi học
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="p-4 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="w-5 h-5 text-gray-700" />
                Lịch sử báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {(reportsLoading || sessionReportsLoading) && <div className="text-sm text-gray-600">Đang tải lịch sử...</div>}
              {!reportsLoading && !sessionReportsLoading && publishedReports.length === 0 && publishedSessionReports.length === 0 && (
                <div className="text-sm text-gray-600">Chưa có báo cáo đã phát hành.</div>
              )}
              {!reportsLoading &&
                publishedReports.map((report) => (
                  <HistoryItem
                    key={report.id}
                    title={`Báo cáo tháng ${report.month ?? "?"}/${report.year ?? "?"}`}
                    date={formatDateTime(report.updatedAt)}
                    size="Published"
                  />
                ))}
              {!sessionReportsLoading &&
                publishedSessionReports.map((report) => (
                  <HistoryItem
                    key={report.id}
                    title={`Session report ${report.reportDate ?? "-"}`}
                    date={formatDateTime(report.updatedAt || report.createdAt)}
                    size="Published"
                  />
                ))}
            </CardContent>
          </Card>
        </div>
      )}


      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900">Report details</div>
                <div className="text-sm text-gray-600 mt-1">
                  {activeReport?.studentName ?? selectedStudentName} - {activeReport?.month ?? "?"}/{activeReport?.year ?? "?"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-3">
              {detailLoading && <div className="text-sm text-gray-600">Loading report details...</div>}
              {detailError && <div className="text-sm text-red-700">{detailError}</div>}

              <div className="text-xs text-gray-600 space-y-1">
                <div>Class: {activeReport?.className ?? "-"}</div>
                <div>Teacher: {activeReport?.teacherName ?? "-"}</div>
                <div>Updated: {formatDateTime(activeReport?.updatedAt)}</div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Content</div>
                <div className="text-sm text-gray-700 whitespace-pre-line leading-6">
                  {normalizeDraftContent(activeReport?.draftContent) || "Published report has no visible content."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sessionDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900">Chi tiết báo cáo theo buổi</div>
                <div className="text-sm text-gray-600 mt-1">
                  {activeSessionReport?.studentName ?? selectedStudentName} - {activeSessionReport?.reportDate ?? "-"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionDetailOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-3">
              {sessionDetailLoading && <div className="text-sm text-gray-600">Đang tải chi tiết báo cáo...</div>}
              {sessionDetailError && <div className="text-sm text-red-700">{sessionDetailError}</div>}

              <div className="text-xs text-gray-600 space-y-1">
                <div>Session: {activeSessionReport?.sessionId ?? "-"}</div>
                <div>Class: {activeSessionReport?.className ?? activeSessionReport?.classId ?? "-"}</div>
                <div>Teacher: {activeSessionReport?.teacherName ?? activeSessionReport?.teacherUserId ?? "-"}</div>
                <div>Updated: {formatDateTime(activeSessionReport?.updatedAt || activeSessionReport?.createdAt)}</div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Nội dung feedback</div>
                <div className="text-sm text-gray-700 whitespace-pre-line leading-6">
                  {activeSessionReport?.feedback || "Session report has no visible content."}
                </div>
              </div>

              {activeSessionReport?.reason ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm font-semibold text-rose-700 mb-1">Lý do từ chối trước đó</div>
                  <div className="text-sm text-rose-700 whitespace-pre-line leading-6">{activeSessionReport.reason}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Cập nhật 09:30</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>A</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>B</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function HistoryItem({ title, date, size }: { title: string; date: string; size: string }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          <FileText className="w-4 h-4 text-gray-600" />
        </div>
        <div className="truncate">
          <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{date}</span>
            <span>•</span>
            <span>{size}</span>
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 flex-shrink-0">
        <Download className="w-4 h-4 text-gray-600" />
      </Button>
    </div>
  );
}


