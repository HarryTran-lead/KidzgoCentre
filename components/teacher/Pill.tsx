
export default function Pill({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "slate" | "green" | "blue" | "amber" | "red";
}) {
  const cn: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={"px-2.5 py-0.5 rounded-full text-xs font-medium " + (cn[color] || cn.slate)}>
      {children}
    </span>
  );
}
