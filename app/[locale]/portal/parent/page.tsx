"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  BookOpen, 
  ArrowRight, 
  TrendingUp, 
  Clock,
  Users,
  Activity,
  MapPin,
  Sparkles
} from "lucide-react";
import ChildOverviewCard from "@/components/portal/parent/ChildOverviewCard";
import { getParentOverview } from "@/lib/api/parentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

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

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "neutral",
  color = "red",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  color?: "red" | "emerald" | "blue" | "violet" | "amber";
}) {
  const iconColorMap = {
    red: "from-red-600 to-red-700",
    emerald: "from-emerald-600 to-teal-600",
    blue: "from-blue-600 to-cyan-600",
    violet: "from-violet-600 to-purple-600",
    amber: "from-amber-600 to-orange-600",
  };

  const trendColorMap = {
    up: "text-red-600 bg-red-50 border-red-100",
    down: "text-gray-600 bg-gray-100 border-gray-200",
    neutral: "text-gray-600 bg-gray-50 border-gray-200",
  };

  const iconGradient = iconColorMap[color];
  const trendStyle = trendColorMap[trend];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
      <div className="flex items-start gap-3 relative z-10">
        {icon ? (
          <div className={`rounded-xl bg-gradient-to-r ${iconGradient} p-2.5 text-white flex-shrink-0`}>
            <span className="text-white">{icon}</span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-900 leading-tight mt-1">{value}</p>

        </div>
      </div>
    </div>
  );
}



export default function ParentPage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getParentOverview(
          selectedProfile?.id ? { studentProfileId: selectedProfile.id } : undefined
        );
        setData(res?.data?.data ?? res?.data ?? null);
      } catch (err) {
        console.error("[ParentDashboard] Failed to load overview", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedProfile?.id]);

  const stats = data?.statistics ?? {};
  const upcomingSessions = data?.upcomingSessions ?? [];
  const pendingApprovalItems = data?.pendingApprovals ?? data?.openTickets ?? [];
  const nextSession = upcomingSessions[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <Users size={25} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                Trang chủ phụ huynh
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                Theo dõi tiến độ học tập và tài chính của con
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<BookOpen size={18} />}
          label="Tiến độ học tập"
          value={data?.homeworkCompletion != null ? `${data.homeworkCompletion}%` : `${stats.pendingHomeworks ?? 0} bài`}
          hint="Bài tập & tiến độ"
          trend="up"
          color="red"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Buổi học tiếp theo"
          value={nextSession ? new Date(nextSession.plannedDatetime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          hint={nextSession ? `${nextSession.classCode}` : "Không có lịch"}
          trend="neutral"
          color="emerald"
        />
        <StatCard
          icon={<CreditCard size={18} />}
          label="Học phí chờ thanh toán"
          value={`${stats.pendingInvoices ?? 0}`}
          hint={data?.tuitionDue != null ? `${Number(data.tuitionDue).toLocaleString("vi-VN")} ₫` : "Không có"}
          trend="down"
          color="blue"
        />
        <StatCard
          icon={<Bell size={18} />}
          label="Thông báo mới"
          value={`${data?.unreadNotifications ?? 0}`}
          hint="Chưa đọc"
          trend="up"
          color="violet"
        />
      </div>

      {/* Child Overview */}
      <ChildOverviewCard data={data} />



      {/* Learning Overview & Notifications */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Learning Overview */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-red-50/30 rounded-2xl border border-red-100">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tổng quan học tập</h3>
            <button className="text-xs text-red-600 font-medium inline-flex items-center gap-1">
              Xem điểm chi tiết <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* Approvals */}
        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl border border-red-100">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Thông báo & phê duyệt</h3>
            <Badge color="red">{pendingApprovalItems.length}</Badge>
          </div>
          <div className="p-4 space-y-3">
            {pendingApprovalItems.length === 0 && (
              <p className="text-xs text-gray-500">Không có mục nào cần phê duyệt</p>
            )}
            {pendingApprovalItems.map((item: any, idx: number) => (
              <div key={idx} className="p-3 border border-red-100 rounded-xl bg-gradient-to-br from-red-50/40 to-white/60 flex gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{item.description ?? item.detail ?? item.status}</div>
                  <button className="mt-2 text-xs text-red-600 font-medium inline-flex items-center gap-0.5">
                    Xem và xác nhận <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule & Communication */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly Schedule */}
        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl border border-red-100">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Lịch học tuần này</h3>
            <button className="text-xs text-gray-600 font-medium inline-flex items-center gap-1">
              Tải xuống <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {upcomingSessions.length === 0 && (
              <p className="text-xs text-gray-500">Không có lịch học tuần này</p>
            )}
            {upcomingSessions.slice(0, 5).map((item: any, idx: number) => {
              const d = new Date(item.plannedDatetime);
              const dayStr = d.toLocaleDateString("vi-VN", { weekday: "long" });
              const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
              return (
              <div key={item.id ?? idx} className="p-3 border border-red-100 rounded-xl bg-gradient-to-br from-red-50/40 to-white/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{dayStr}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{item.classCode}</div>
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.status}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {timeStr}
                </div>
              </div>
              );
            })}
          </div>
        </div>


      </div>


    </div>
  );
}