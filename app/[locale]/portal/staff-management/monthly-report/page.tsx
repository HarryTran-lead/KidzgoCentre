"use client";

const reports = [
  {
    id: "RP-1001",
    className: "IELTS A1",
    teacher: "Lê Quốc Huy",
    status: "Draft",
    note: "Chờ GV chỉnh sửa",
  },
  {
    id: "RP-1002",
    className: "Cambridge Movers B",
    teacher: "Trần Mỹ Linh",
    status: "Submitted",
    note: "Chờ staff duyệt",
  },
  {
    id: "RP-1003",
    className: "Kids Tue",
    teacher: "Ngô Minh Phúc",
    status: "Approved",
    note: "Đã publish",
  },
];

const comments = [
  {
    id: "CM-01",
    author: "Staff",
    text: "Bổ sung nhận xét kỹ năng Speaking cho lớp IELTS A1.",
    time: "10/10 09:30",
  },
  {
    id: "CM-02",
    author: "GV Linh",
    text: "Đã cập nhật điểm mid-term, vui lòng duyệt lại.",
    time: "10/10 11:15",
  },
];

export default function Page() {
  const draftAI = () => alert("Đã tạo bản nháp báo cáo (AI) — Demo");
  const publish = () => alert("Đã publish báo cáo — gửi Zalo + portal (giả lập)");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Báo cáo tháng (AI)
          </h1>
          <p className="text-slate-600 text-sm">
            Gom dữ liệu → tạo draft → GV chỉnh sửa → staff duyệt → publish
          </p>
        </div>
        <div className="space-x-2">
          <button
            onClick={draftAI}
            className="px-3 py-2 rounded-xl border text-sm"
          >
            Tạo draft (AI)
          </button>
          <button
            onClick={publish}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2 text-slate-900">Tiến độ thu thập</h3>
          <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
            <li>Đã nhận 12/18 báo cáo lớp</li>
            <li>Còn thiếu: IELTS A1, TOEIC T3, Kids Tue</li>
            <li>Đã gửi nhắc GV (tự động)</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2 text-slate-900">Checklist duyệt</h3>
          <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
            <li>Soát nhận xét AI trước khi gửi</li>
            <li>Đối chiếu điểm test & attendance</li>
            <li>Đảm bảo có nội dung đề xuất cải thiện</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2 text-slate-900">Comment mới</h3>
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-xl p-3">
                <div className="text-sm text-slate-900 font-semibold">
                  {comment.author}
                </div>
                <div className="text-sm text-slate-600">{comment.text}</div>
                <div className="text-xs text-slate-400">{comment.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Mã</th>
              <th>Lớp</th>
              <th>Giáo viên</th>
              <th>Trạng thái</th>
              <th>Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {reports.map((report) => (
              <tr key={report.id} className="border-t">
                <td className="py-2">{report.id}</td>
                <td>{report.className}</td>
                <td>{report.teacher}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      report.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : report.status === "Submitted"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="text-slate-600">{report.note}</td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Xem bản nháp
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Duyệt
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
