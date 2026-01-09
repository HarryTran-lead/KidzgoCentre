"use client";

const plans = [
  {
    id: "LP-01",
    program: "Cambridge Movers",
    unit: "Unit 4",
    status: "Đã chuẩn hóa",
    lastUpdate: "08/10",
  },
  {
    id: "LP-02",
    program: "IELTS A1",
    unit: "Writing Task 1",
    status: "Chờ cập nhật",
    lastUpdate: "05/10",
  },
];

const reviews = [
  {
    id: "RV-01",
    className: "IELTS A1",
    teacher: "Lê Quốc Huy",
    status: "Chưa nộp",
  },
  {
    id: "RV-02",
    className: "Kids Tue",
    teacher: "Ngô Minh Phúc",
    status: "Đã nộp",
  },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Giáo án & chất lượng
          </h1>
          <p className="text-slate-600 text-sm">
            Thư viện giáo án khung, theo dõi nộp giáo án thực tế và kiểm soát nội dung
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Tạo giáo án khung
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold text-slate-900 mb-3">
            Thư viện giáo án
          </h3>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-xl p-3">
                <div className="font-medium text-slate-900">
                  {plan.program} • {plan.unit}
                </div>
                <div className="text-xs text-slate-500">
                  Cập nhật: {plan.lastUpdate}
                </div>
                <span
                  className={`mt-2 inline-flex px-2 py-1 rounded-lg text-xs ${
                    plan.status === "Đã chuẩn hóa"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {plan.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold text-slate-900 mb-3">
            Giáo án thực tế cần theo dõi
          </h3>
          <div className="space-y-2">
            {reviews.map((item) => (
              <div key={item.id} className="border rounded-xl p-3">
                <div className="font-medium text-slate-900">{item.className}</div>
                <div className="text-xs text-slate-500">GV: {item.teacher}</div>
                <span
                  className={`mt-2 inline-flex px-2 py-1 rounded-lg text-xs ${
                    item.status === "Đã nộp"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}