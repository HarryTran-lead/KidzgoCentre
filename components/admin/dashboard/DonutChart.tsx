"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutChartDatum {
  label: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  noDataText?: string;
}

function hasRenderableData(data: DonutChartDatum[]): boolean {
  return data.some((item) => item.value > 0);
}

export default function DonutChart({
  data,
  height = 240,
  innerRadius = 58,
  outerRadius = 82,
  noDataText = "Không có dữ liệu",
}: DonutChartProps) {
  if (!hasRenderableData(data)) {
    return <div className="flex h-full min-h-45 items-center justify-center text-sm text-gray-400">{noDataText}</div>;
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={innerRadius} outerRadius={outerRadius} strokeWidth={2}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name) => [(value ?? 0).toLocaleString("vi-VN"), name]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "white" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}