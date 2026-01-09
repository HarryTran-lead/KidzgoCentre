// app/admin/teachers/page.tsx
'use client';

import {
  Phone, Mail, Clock3, Eye, PencilLine, Search
} from 'lucide-react';
import { useMemo } from 'react';

/* ---------- UI helpers ---------- */
function StatusBadge({ type, children }: { type: 'active' | 'off'; children: React.ReactNode }) {
  const styles =
    type === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {children}
    </span>
  );
}

function SubjectChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs border border-sky-100">
      {children}
    </span>
  );
}

function IconButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      className="inline-grid place-items-center w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

/* ---------- Data ---------- */
type Teacher = {
  code: string;
  name: string;
  phone: string;
  email: string;
  subjects: string[];
  extra?: number; // số chip +1
  exp: string;
  load: string;
  classes: number;
  status: 'active' | 'off';
};

const TEACHERS: Teacher[] = [
  {
    code: 'GV001',
    name: 'Ms. Sarah Johnson',
    phone: '0901111111',
    email: 'sarah.johnson@kidzgo.com',
    subjects: ['English Grammar', 'IELTS Speaking'],
    extra: 0,
    exp: '8 năm',
    load: '25h/tuần',
    classes: 2,
    status: 'active',
  },
  {
    code: 'GV002',
    name: 'Mr. John Smith',
    phone: '0902222222',
    email: 'john.smith@kidzgo.com',
    subjects: ['IELTS Writing', 'Academic English'],
    extra: 0,
    exp: '12 năm',
    load: '28h/tuần',
    classes: 2,
    status: 'active',
  },
  {
    code: 'GV003',
    name: 'Ms. Emily Davis',
    phone: '0903333333',
    email: 'emily.davis@kidzgo.com',
    subjects: ['Business English', 'Conversation'],
    extra: 0,
    exp: '5 năm',
    load: '22h/tuần',
    classes: 2,
    status: 'active',
  },
  {
    code: 'GV004',
    name: 'Mr. David Wilson',
    phone: '0904444444',
    email: 'david.wilson@kidzgo.com',
    subjects: ['TOEIC', 'English Grammar'],
    extra: 1,
    exp: '7 năm',
    load: '24h/tuần',
    classes: 2,
    status: 'active',
  },
  {
    code: 'GV005',
    name: 'Ms. Lisa Anderson',
    phone: '0905555555',
    email: 'lisa.anderson@kidzgo.com',
    subjects: ['English for Kids', 'Elementary English'],
    extra: 0,
    exp: '6 năm',
    load: '0h/tuần',
    classes: 0,
    status: 'off',
  },
];

/* ---------- Page Component ---------- */
export default function TeachersPage() {
  // chừa hook ở đây để sau này gắn search/filter
  const data = useMemo(() => TEACHERS, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý giáo viên</h1>
        <p className="text-gray-600 text-sm">Quản lý thông tin và lịch dạy của giáo viên</p>
      </div>

      {/* Card + actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold text-gray-900">Danh sách giáo viên</div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="Tìm kiếm giáo viên..."
              />
            </div>
            <button className="px-4 py-2 rounded-xl text-white font-medium bg-linear-to-r from-pink-500 to-rose-500 shadow hover:shadow-md">
              + Thêm giáo viên
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/70">
              <tr className="text-left text-gray-700">
                <th className="px-5 py-3">Mã GV</th>
                <th className="px-5 py-3">Họ tên</th>
                <th className="px-5 py-3">Liên hệ</th>
                <th className="px-5 py-3">Chuyên môn</th>
                <th className="px-5 py-3">Kinh nghiệm</th>
                <th className="px-5 py-3">Lịch dạy</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {data.map((t) => (
                <tr key={t.code} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{t.code}</td>

                  <td className="px-5 py-3">
                    <div className="text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-600">Tham gia: 15/1/2020</div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4" /> {t.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-4 h-4" /> {t.email}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {t.subjects.map((s) => (
                        <SubjectChip key={s}>{s}</SubjectChip>
                      ))}
                      {t.extra ? (
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200">
                          +{t.extra}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Clock3 className="w-4 h-4" />
                      {t.exp}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="text-gray-900">{t.load}</div>
                    <div className="text-xs text-gray-600">{t.classes} lớp</div>
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge type={t.status}>
                      {t.status === 'active' ? 'Đang làm việc' : 'Tạm nghỉ'}
                    </StatusBadge>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <IconButton title="Xem">
                        <Eye className="w-4 h-4 text-gray-700" />
                      </IconButton>
                      <IconButton title="Sửa">
                        <PencilLine className="w-4 h-4 text-gray-700" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
