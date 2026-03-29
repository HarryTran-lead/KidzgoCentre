"use client";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface DashboardBarChartProps {
  data: BarChartDatum[];
  layout?: "horizontal" | "vertical";
  height?: number;
  noDataText?: string;
}

function hasRenderableData(data: BarChartDatum[]): boolean {
  return data.some((item) => item.value > 0);
}

export default function DashboardBarChart({
  data,
  layout = "horizontal",
  height = 260,
  noDataText = "Không có dữ liệu",
}: DashboardBarChartProps) {
  if (!hasRenderableData(data)) {
    return <div className="flex h-full min-h-45 items-center justify-center text-sm text-slate-400">{noDataText}</div>;
  }

  const isVertical = layout === "vertical";

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} layout={isVertical ? "vertical" : "horizontal"} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={!isVertical} horizontal={isVertical} />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" width={95} tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} />
            </>
          )}
          <Tooltip
            formatter={(value: number | undefined, name) => [(value ?? 0).toLocaleString("vi-VN"), name]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
          <Bar dataKey="value" radius={isVertical ? [0, 8, 8, 0] : [8, 8, 0, 0]} barSize={isVertical ? 16 : 26}>
            {data.map((item, idx) => (
              <Cell key={`${item.label}-${idx}`} fill={item.color ?? "#2563eb"} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
