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
  MapPin
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
            {trend === "down" && <TrendingUp size={12} className="rotate-180" />}
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
    <div className="space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Trang chủ phụ huynh
          </h1>
          <p className="text-xs text-gray-600">
            Theo dõi tiến độ học tập và tài chính của con
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} />}
          label="Tiến độ học tập"
          value={data?.homeworkCompletion != null ? `${data.homeworkCompletion}%` : `${stats.pendingHomeworks ?? 0} bài`}
          hint="Bài tập & tiến độ"
          trend="up"
          color="red"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Buổi học tiếp theo"
          value={nextSession ? new Date(nextSession.plannedDatetime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          hint={nextSession ? `${nextSession.classCode}` : "Không có lịch"}
          trend="stable"
          color="gray"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Học phí chờ thanh toán"
          value={`${stats.pendingInvoices ?? 0}`}
          hint={data?.tuitionDue != null ? `${Number(data.tuitionDue).toLocaleString("vi-VN")} ₫` : "Không có"}
          trend="down"
          color="black"
        />
        <StatCard
          icon={<Bell size={20} />}
          label="Thông báo mới"
          value={`${data?.unreadNotifications ?? 0}`}
          hint="Chưa đọc"
          trend="up"
          color="red"
        />
      </div>

      {/* Child Overview */}
      <ChildOverviewCard data={data} />



      {/* Learning Overview & Notifications */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Learning Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tổng quan học tập</h3>
            <button className="text-xs text-red-600 font-medium inline-flex items-center gap-1">
              Xem điểm chi tiết <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* Approvals */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Thông báo & phê duyệt</h3>
            <Badge color="red">{pendingApprovalItems.length}</Badge>
          </div>
          <div className="p-4 space-y-3">
            {pendingApprovalItems.length === 0 && (
              <p className="text-xs text-gray-500">Không có mục nào cần phê duyệt</p>
            )}
            {pendingApprovalItems.map((item: any, idx: number) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex gap-2">
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
        <div className="bg-white rounded-2xl border border-gray-200">
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
              <div key={item.id ?? idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between">
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