"use client";
import { useState } from "react";

const INIT = [
  { id:"TMP-01", title:"Nhắc lịch học", body:"Chào PH, lớp {class} của {student} vào {time} {date}. Vui lòng có mặt đúng giờ." },
  { id:"TMP-02", title:"Nhắc hạn nộp bài", body:"Chào {student}, bài tập {assignment} hạn {date}. Cố gắng hoàn thành nhé!" },
  { id:"TMP-03", title:"Thông báo lịch bù", body:"HS {student} được xếp bù vào lớp {class} lúc {time} ngày {date}." },
];

export default function Page(){
  const [items, setItems] = useState(INIT);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const add = ()=>{
    if(!title || !body) return;
    setItems(prev => [...prev, { id: `TMP-${(prev.length+1).toString().padStart(2,"0")}`, title, body }]);
    setTitle(""); setBody("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Mẫu thông báo</h1>
        <p className="text-slate-600 text-sm">Soạn mẫu gửi Zalo/Portal</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} className="border rounded-xl px-3 py-2 bg-slate-50" placeholder="Tiêu đề" />
          <textarea value={body} onChange={e=>setBody(e.target.value)} className="border rounded-xl px-3 py-2 bg-slate-50 md:col-span-2" placeholder="Nội dung; dùng biến {student}, {class}, {date}, {time}..." />
        </div>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Thêm mẫu</button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        {items.map(t => (
          <div key={t.id} className="p-3 rounded-xl border">
            <div className="font-semibold text-slate-900">{t.title}</div>
            <div className="text-sm text-slate-600">{t.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
