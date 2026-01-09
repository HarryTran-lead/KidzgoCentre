"use client";

type Account = {
  id: string;
  name: string;
  role: string;
  phone: string;
  branch: string;
  status: "Active" | "Locked";
};

const ACCS: Account[] = [
  {
    id: "U1001",
    name: "Nguyễn Văn A",
    role: "STUDENT",
    phone: "0901 234 567",
    branch: "Quận 1",
    status: "Active",
  },
  {
    id: "U1002",
    name: "Trần Thị B",
    role: "PARENT",
    phone: "0909 888 111",
    branch: "Quận 1",
    status: "Active",
  },
  {
    id: "U2001",
    name: "Lê Minh",
    role: "TEACHER",
    phone: "0912 555 777",
    branch: "Quận 7",
    status: "Locked",
  },
];

const ROLES = [
  "STUDENT",
  "PARENT",
  "TEACHER",
  "STAFF",
  "ACCOUNTANT",
  "MANAGER",
];

export default function Page() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Quản lý tài khoản & phân quyền
          </h1>
          <p className="text-slate-600 text-sm">
            Thêm/sửa vai trò, gán chi nhánh và reset mật khẩu/PIN
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Tạo tài khoản
        </button>
      </div>

      {/* Role filter */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {ROLES.map((role) => (
            <span
              key={role}
              className="rounded-full border border-slate-200 px-3 py-1"
            >
              {role}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Staff/Teacher được gán 1 chi nhánh cố định theo mô hình multi-branch.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Mã</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Chi nhánh</th>
              <th>SĐT</th>
              <th>Trạng thái</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {ACCS.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.role}</td>
                <td>{r.branch}</td>
                <td>{r.phone}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      r.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Đổi quyền
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Reset PIN
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Khoá
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
