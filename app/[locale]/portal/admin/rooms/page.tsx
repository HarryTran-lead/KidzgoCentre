import { Search, Eye, Pencil, Clock, Users, Building2, AlertTriangle } from "lucide-react";

/* ---------- Small UI atoms (định nghĩa ngoài hàm Page để tránh lỗi render) ---------- */

type Status = "using" | "free" | "maintenance";

function StatusPill({ status }: { status: Status }) {
  const map = {
    using: { text: "Đang sử dụng", bg: "bg-rose-100", dot: "bg-rose-500", textColor: "text-rose-700" },
    free: { text: "Trống", bg: "bg-emerald-100", dot: "bg-emerald-600", textColor: "text-emerald-700" },
    maintenance: { text: "Bảo trì", bg: "bg-amber-100", dot: "bg-amber-500", textColor: "text-amber-800" },
  } as const;

  const cfg = map[status];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.textColor}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.text}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
      {children}
    </span>
  );
}

function Progress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-44">
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-sky-400"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-900">{clamped}%</div>
    </div>
  );
}

function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      type="button"
      className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

/* ----------------------------- Mock dữ liệu ----------------------------- */

type Room = {
  id: string;
  floor: number;
  area: number; // m2
  capacity: number;
  equipment: string[];
  utilization: number; // %
  status: Status;
  course?: string; // nếu đang dùng
};

const ROOMS: Room[] = [
  {
    id: "P101",
    floor: 1,
    area: 45,
    capacity: 30,
    equipment: ["Projector", "Whiteboard"],
    utilization: 10,
    status: "using",
    course: "English B1-01",
  },
  {
    id: "P102",
    floor: 1,
    area: 35,
    capacity: 25,
    equipment: ["Smart Board", "Air Conditioner"],
    utilization: 7,
    status: "free",
  },
  {
    id: "P103",
    floor: 1,
    area: 38,
    capacity: 25,
    equipment: ["Projector", "Whiteboard"],
    utilization: 7,
    status: "using",
    course: "TOEIC Advanced",
  },
  {
    id: "P201",
    floor: 2,
    area: 30,
    capacity: 20,
    equipment: ["Smart TV", "Whiteboard"],
    utilization: 7,
    status: "using",
    course: "Business English",
  },
  {
    id: "P202",
    floor: 2,
    area: 50,
    capacity: 35,
    equipment: ["Projector", "Smart Board"],
    utilization: 2,
    status: "free",
  },
  {
    id: "P301",
    floor: 3,
    area: 25,
    capacity: 15,
    equipment: ["TV", "Whiteboard"],
    utilization: 0,
    status: "maintenance",
  },
];

/* --------------------------------- Page --------------------------------- */

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Quản lý phòng học</h1>
        <p className="text-sm text-slate-600">
          Quản lý phòng học và lịch sử dụng
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-pink-100">
            <Building2 className="text-pink-600" size={20} />
          </div>
          <div>
            <div className="text-slate-500 text-xs">Tổng phòng</div>
            <div className="text-xl font-bold text-slate-900">{ROOMS.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-emerald-100">
            <Users className="text-emerald-600" size={20} />
          </div>
          <div>
            <div className="text-slate-500 text-xs">Đang sử dụng</div>
            <div className="text-xl font-bold text-slate-900">
              {ROOMS.filter(r => r.status === "using").length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-sky-100">
            <Clock className="text-sky-600" size={20} />
          </div>
          <div>
            <div className="text-slate-500 text-xs">Sẵn sàng</div>
            <div className="text-xl font-bold text-slate-900">
              {ROOMS.filter(r => r.status === "free").length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-amber-100">
            <AlertTriangle className="text-amber-600" size={20} />
          </div>
          <div>
            <div className="text-slate-500 text-xs">Bảo trì</div>
            <div className="text-xl font-bold text-slate-900">
              {ROOMS.filter(r => r.status === "maintenance").length}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid xl:grid-cols-[1fr_380px] gap-6">
        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Tìm kiếm phòng…"
                className="outline-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <button className="px-3 py-2 rounded-xl bg-gradient-to-br from-pink-500 to-amber-400 text-white text-sm font-semibold shadow-sm">
              + Thêm phòng học
            </button>
          </div>

          {/* Header */}
          <div className="px-5 py-3 grid grid-cols-[110px_110px_1fr_180px_160px_90px] text-xs font-semibold text-slate-500">
            <div>Phòng</div>
            <div>Sức chứa</div>
            <div>Trang thiết bị</div>
            <div>Tỷ lệ sử dụng</div>
            <div>Trạng thái</div>
            <div className="text-right">Thao tác</div>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {ROOMS.map((r) => (
              <div
                key={r.id}
                className="px-5 py-4 grid items-center grid-cols-[110px_110px_1fr_180px_160px_90px]"
              >
                {/* Room */}
                <div>
                  <div className="font-semibold text-slate-900">{r.id}</div>
                  <div className="text-xs text-slate-500">
                    Tầng {r.floor} • {r.area} m²
                  </div>
                </div>

                {/* Capacity */}
                <div className="text-slate-900 font-medium">{r.capacity} chỗ</div>

                {/* Equipment */}
                <div className="flex flex-wrap gap-2">
                  {r.equipment.map((eq, i) => (
                    <Chip key={i}>{eq}</Chip>
                  ))}
                  {r.equipment.length <= 2 ? null : (
                    <Chip>+{r.equipment.length - 2}</Chip>
                  )}
                </div>

                {/* Utilization */}
                <div className="flex items-center">
                  <Progress value={r.utilization} />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <StatusPill status={r.status} />
                  {r.course && (
                    <span className="text-xs text-slate-500">• {r.course}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <IconBtn title="Xem">
                    <Eye size={16} className="text-slate-600" />
                  </IconBtn>
                  <IconBtn title="Sửa">
                    <Pencil size={16} className="text-slate-600" />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today schedule */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-slate-900 mb-3">Lịch hôm nay</div>

          {[
            { time: "08:00–10:00", room: "P101", course: "English B1-01", teacher: "Ms. Sarah", students: 25, state: "Đang diễn ra", stateColor: "bg-sky-100 text-sky-700" },
            { time: "10:30–12:30", room: "P102", course: "English A2-01", teacher: "Ms. Lisa", students: 20, state: "Sắp diễn ra", stateColor: "bg-amber-100 text-amber-800" },
            { time: "14:00–16:00", room: "P103", course: "TOEIC Prep", teacher: "Mr. David", students: 22, state: "Sắp diễn ra", stateColor: "bg-amber-100 text-amber-800" },
          ].map((ev, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Clock size={16} className="text-slate-500" />
                  {ev.time}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${ev.stateColor}`}>{ev.state}</span>
              </div>
              <div className="mt-2 text-sm text-slate-700">
                <div className="font-semibold">{ev.room}</div>
                <div>{ev.course}</div>
                <div className="text-slate-500 text-xs mt-1">
                  {ev.teacher} • {ev.students} học viên
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
