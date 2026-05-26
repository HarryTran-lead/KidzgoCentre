"use client";

import { useMemo } from "react";
import { Sparkles, Phone, FileText, CheckCircle2 } from "lucide-react";
import type { Lead } from "@/types/lead";

interface LeadStatsProps {
  leads: Lead[];
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className={`absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color} text-white shadow-sm flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-600 truncate">{title}</div>
          <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

export default function LeadStats({ leads, isLoading }: LeadStatsProps) {
  const stats = useMemo(() => {
    return {
      new: leads.filter(l => l.status === "New").length,
      contacted: leads.filter(l => l.status === "Contacted").length,
      testDone: leads.filter(l => l.status === "TestDone").length,
      enrolled: leads.filter(l => l.status === "Enrolled").length,
    };
  }, [leads]);

  const funnel = useMemo(() => [
    { title: "Khách tiềm năng mới", value: stats.new.toString(), icon: Sparkles, color: "from-red-600 to-red-700", subtitle: "Chưa xử lý" },
    { title: "Đang tư vấn", value: stats.contacted.toString(), icon: Phone, color: "from-blue-600 to-cyan-600", subtitle: "Đang liên hệ" },
    { title: "Đã test", value: stats.testDone.toString(), icon: FileText, color: "from-amber-600 to-orange-600", subtitle: "Đã kiểm tra" },
    { title: "Đã ghi danh", value: stats.enrolled.toString(), icon: CheckCircle2, color: "from-emerald-600 to-teal-600", subtitle: "Thành công" },
  ], [stats]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
      <div className="h-24 rounded-2xl border border-gray-200 bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {funnel.map((item, idx) => (
        <StatCard key={`stat-${idx}`} {...item} />
      ))}
    </div>
  );
}
