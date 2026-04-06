"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  rightContent?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({ title, rightContent, children }: ChartCardProps) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-red-300 hover:shadow-md md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 md:text-base">{title}</h3>
        {rightContent ? <div className="text-xs text-gray-500">{rightContent}</div> : null}
      </div>
      {children}
    </section>
  );
}