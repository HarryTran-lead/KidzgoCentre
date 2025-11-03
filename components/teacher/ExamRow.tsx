
import Pill from "./Pill";
import { Download } from "lucide-react";

export default function ExamRow({
  title,
  course,
  date,
  duration,
  status,
}: {
  title: string;
  course: string;
  date: string;
  duration: string;
  status: "Sắp tới" | "Đã hoàn thành";
}) {
  const color = status === "Đã hoàn thành" ? "green" : "slate";
  return (
    <div className="grid grid-cols-12 items-center gap-3 p-3 rounded-xl border bg-white">
      <div className="col-span-5 font-medium text-gray-900">{title}</div>
      <div className="col-span-2 text-slate-600">{course}</div>
      <div className="col-span-2 text-slate-600">{date}</div>
      <div className="col-span-1 text-slate-600">{duration}</div>
      <div className="col-span-1"><Pill color={color as any}>{status}</Pill></div>
      <div className="col-span-1 flex justify-end">
        <button className="rounded-lg border px-2.5 py-2 hover:bg-slate-50" title="Tải xuống">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
