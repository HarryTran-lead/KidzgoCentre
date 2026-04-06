"use client";

import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface LineChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface DashboardLineChartProps {
  data: LineChartDatum[];
  height?: number;
  strokeColor?: string;
  noDataText?: string;
}

function hasRenderableData(data: LineChartDatum[]): boolean {
  return data.some((item) => item.value > 0);
}

export default function DashboardLineChart({
  data,
  height = 260,
  strokeColor,
  noDataText = "Không có dữ liệu",
}: DashboardLineChartProps) {
  if (!hasRenderableData(data)) {
    return <div className="flex h-full min-h-45 items-center justify-center text-sm text-gray-400">{noDataText}</div>;
  }

  const lineColor = strokeColor ?? data[0]?.color ?? "#dc2626";

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number | undefined) => [(value ?? 0).toLocaleString("vi-VN"), "Giá trị"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "white" }}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={3}
            dot={{ r: 4, fill: lineColor, stroke: "#ffffff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: lineColor, stroke: "#ffffff", strokeWidth: 2 }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}