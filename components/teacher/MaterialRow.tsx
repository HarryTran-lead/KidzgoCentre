
import { Download } from "lucide-react";
import Pill from "./Pill";

export default function MaterialRow({
  name,
  course,
  kind,
  size,
  date,
}: {
  name: string;
  course: string;
  kind: string;
  size: string;
  date: string;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 p-3 rounded-xl border bg-white">
      <div className="col-span-5">
        <div className="font-medium text-gray-900">{name}</div>
      </div>
      <div className="col-span-3 text-slate-600">{course}</div>
      <div className="col-span-1"><Pill color="slate">{kind}</Pill></div>
      <div className="col-span-1 text-slate-600">{size}</div>
      <div className="col-span-1 text-slate-600">{date}</div>
      <div className="col-span-1 flex justify-end">
        <button className="rounded-lg border px-2.5 py-2 hover:bg-slate-50" title="Tải xuống">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
