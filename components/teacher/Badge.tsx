import { ReactNode } from "react";

export default function Badge({ children, color = "gray" }: { children: ReactNode; color?: "gray" | "green" | "yellow" | "red" | "blue" }) {
  const map = {
    gray: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-sky-100 text-sky-700",
  } as const;

  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[color]}`}>{children}</span>;
}
