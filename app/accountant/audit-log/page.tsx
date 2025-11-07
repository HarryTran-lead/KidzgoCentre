"use client";

const LOGS = [
  { t: "2025-10-21 10:22", who: "ACCOUNTANT:Hoa", act: "Issue invoice", ref: "INV-10542" },
  { t: "2025-10-21 10:35", who: "ACCOUNTANT:Hoa", act: "Record PayOS Tx", ref: "TX-2941" },
  { t: "2025-10-22 08:10", who: "ADMIN:Nam", act: "Close period", ref: "10/2025" },
];

export default function Page(){
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Audit Log</h1>
        <p className="text-slate-600 text-sm">Theo dõi mọi thao tác tài chính</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        {LOGS.map((l,i)=>(
          <div key={i} className="p-3 rounded-xl border flex items-center justify-between">
            <div className="text-slate-900"><b>{l.t}</b> • {l.who}</div>
            <div className="text-slate-600 text-sm">{l.act} — {l.ref}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
