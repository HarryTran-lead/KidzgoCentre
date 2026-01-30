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
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
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
    { title: "Lead mới", value: stats.new.toString(), icon: Sparkles, color: "from-amber-500 to-orange-500", subtitle: "Chưa xử lý" },
    { title: "Đang tư vấn", value: stats.contacted.toString(), icon: Phone, color: "from-blue-500 to-cyan-500", subtitle: "Đang liên hệ" },
    { title: "Đã test", value: stats.testDone.toString(), icon: FileText, color: "from-purple-500 to-violet-500", subtitle: "Đã kiểm tra" },
    { title: "Đã ghi danh", value: stats.enrolled.toString(), icon: CheckCircle2, color: "from-emerald-500 to-teal-500", subtitle: "Thành công" },
  ], [stats]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 animate-pulse" />
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
