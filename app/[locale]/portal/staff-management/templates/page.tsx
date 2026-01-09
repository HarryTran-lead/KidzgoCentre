"use client";

import { useState } from "react";

const INIT = [
  {
    id: "TMP-01",
    title: "Nhắc lịch học",
    channel: "Zalo OA",
    category: "Lịch học",
    body: "Chào PH, lớp {class} của {student} vào {time} {date}. Vui lòng có mặt đúng giờ.",
    status: "Active",
  },
  {
    id: "TMP-02",
    title: "Nhắc hạn nộp bài",
    channel: "Zalo OA",
    category: "Bài tập",
    body: "Chào {student}, bài tập {assignment} hạn {date}. Cố gắng hoàn thành nhé!",
    status: "Active",
  },
  {
    id: "TMP-03",
    title: "Biên lai học phí",
    channel: "Email",
    category: "Tài chính",
    body: "Kính gửi PH {parent}. Trung tâm xác nhận đã nhận học phí {amount} cho {student}.",
    status: "Draft",
  },
];

const variables = [
  "{parent}",
  "{student}",
  "{class}",
  "{date}",
  "{time}",
  "{assignment}",
  "{amount}",
];

export default function Page() {
  const [items, setItems] = useState(INIT);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("Zalo OA");
  const [category, setCategory] = useState("Lịch học");

  const add = () => {
    if (!title || !body) return;
    setItems((prev) => [
      ...prev,
      {
        id: `TMP-${(prev.length + 1).toString().padStart(2, "0")}`,
        title,
        channel,
        category,
        body,
        status: "Draft",
      },
    ]);
    setTitle("");
    setBody("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Mẫu thông báo</h1>
        <p className="text-slate-600 text-sm">
          Quản lý template Zalo OA / Email cho lịch học, học phí, báo cáo tháng
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4 space-y-3 lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Tạo mẫu mới</h3>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-xl px-3 py-2 bg-slate-50"
              placeholder="Tiêu đề"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="border rounded-xl px-3 py-2 bg-slate-50"
              >
                <option>Zalo OA</option>
                <option>Email</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-xl px-3 py-2 bg-slate-50"
              >
                <option>Lịch học</option>
                <option>Bài tập</option>
                <option>Báo cáo</option>
                <option>Tài chính</option>
                <option>Sự kiện</option>
              </select>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="border rounded-xl px-3 py-2 bg-slate-50 md:col-span-2 min-h-[120px]"
              placeholder="Nội dung; dùng biến {student}, {class}, {date}, {time}..."
            />
          </div>

          <button
            onClick={add}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            Thêm mẫu
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Biến động dữ liệu</h3>
          <p className="text-sm text-slate-600">
            Dùng biến để tự động điền thông tin học viên/phụ huynh.
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {variables.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
            Mẫu Email dùng cho biên lai, báo cáo tháng, thông báo chính sách.
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Mã</th>
              <th>Tiêu đề</th>
              <th>Kênh</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Nội dung</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="py-2">{t.id}</td>
                <td className="font-medium">{t.title}</td>
                <td>{t.channel}</td>
                <td>{t.category}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      t.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="min-w-[280px] text-slate-600">{t.body}</td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Sửa
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Gửi thử
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
