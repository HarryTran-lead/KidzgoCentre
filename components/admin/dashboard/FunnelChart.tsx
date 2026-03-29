"use client";

import DashboardBarChart, { type BarChartDatum } from "./BarChart";

interface FunnelChartProps {
  data: BarChartDatum[];
  height?: number;
}

export default function FunnelChart({ data, height = 280 }: FunnelChartProps) {
  return <DashboardBarChart data={data} layout="vertical" height={height} />;
}
