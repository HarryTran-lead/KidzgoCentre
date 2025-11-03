
"use client";
import React from "react";

type Tab = { key: string; label: string };

export default function Tabs({
  value,
  onChange,
  items,
  className = "",
}: {
  value: string;
  onChange: (k: string) => void;
  items: Tab[];
  className?: string;
}) {
  return (
    <div className={"inline-flex rounded-2xl bg-slate-100 p-1 " + className}>
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={[
              "px-4 py-2 rounded-xl text-sm font-medium transition",
              active ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
