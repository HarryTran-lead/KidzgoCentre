'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Download,
  FileText,
  PlayCircle,
  Music2,
  Link as LinkIcon,
  Calendar,
  Database,
  BookOpen,
} from 'lucide-react';

type MaterialType = 'pdf' | 'video' | 'audio' | 'link';
type Subject = 'en' | 'ja';

type MaterialItem = {
  id: string;
  subject: Subject;
  type: MaterialType;
  title: string;
  date: string; // ISO
  sizeMB?: number;
  href?: string;
};

const DATA: MaterialItem[] = [
  // ======= Tiếng Anh =======
  {
    id: 'en-pdf-1',
    subject: 'en',
    type: 'pdf',
    title: 'Giáo trình Tiếng Anh A1 - Bài 1',
    date: '2024-12-01',
    sizeMB: 2.5,
    href: '#',
  },
  {
    id: 'en-video-1',
    subject: 'en',
    type: 'video',
    title: 'Video bài giảng Grammar',
    date: '2024-12-05',
    sizeMB: 156,
    href: '#',
  },
  {
    id: 'en-link-1',
    subject: 'en',
    type: 'link',
    title: 'Link tài liệu online',
    date: '2024-12-10',
    href: '#',
  },

  // ======= Tiếng Nhật =======
  {
    id: 'ja-pdf-1',
    subject: 'ja',
    type: 'pdf',
    title: 'Giáo trình Tiếng Nhật Minna no Nihongo - Bài 1',
    date: '2024-11-20',
    sizeMB: 3.2,
    href: '#',
  },
  {
    id: 'ja-audio-1',
    subject: 'ja',
    type: 'audio',
    title: 'Audio luyện phát âm N5',
    date: '2024-11-25',
    sizeMB: 45,
    href: '#',
  },
  {
    id: 'ja-pdf-2',
    subject: 'ja',
    type: 'pdf',
    title: 'Bài tập Kanji cơ bản',
    date: '2024-12-01',
    sizeMB: 1.9,
    href: '#',
  },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function TypeBadge({ type }: { type: MaterialType }) {
  const map = {
    pdf: { label: 'PDF', cls: 'bg-slate-100 text-slate-700' },
    video: { label: 'Video', cls: 'bg-slate-100 text-slate-700' },
    audio: { label: 'Audio', cls: 'bg-slate-100 text-slate-700' },
    link: { label: 'Liên kết', cls: 'bg-slate-100 text-slate-700' },
  } as const;
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[type].cls}`}>
      {map[type].label}
    </span>
  );
}

function TypeIcon({ type }: { type: MaterialType }) {
  if (type === 'pdf')
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 grid place-items-center">
        <FileText size={18} />
      </div>
    );
  if (type === 'video')
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
        <PlayCircle size={20} />
      </div>
    );
  if (type === 'audio')
    return (
      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 grid place-items-center">
        <Music2 size={18} />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
      <LinkIcon size={18} />
    </div>
  );
}

function Row({ item }: { item: MaterialItem }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 flex items-center gap-4">
      <TypeIcon type={item.type} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{item.title}</div>
        <div className="text-sm text-slate-600 flex items-center gap-4 mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} />
            {fmtDate(item.date)}
          </span>
          {item.sizeMB ? (
            <span className="inline-flex items-center gap-1">
              <Database size={14} /> {item.sizeMB} MB
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TypeBadge type={item.type} />
        <a
          href={item.href || '#'}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
          title="Tải xuống"
        >
          <Download size={18} />
        </a>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const [tab, setTab] = useState<'all' | 'en' | 'ja'>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const byTab =
      tab === 'all' ? DATA : DATA.filter((d) => d.subject === tab);
    const bySearch = q.trim()
      ? byTab.filter((d) =>
          d.title.toLowerCase().includes(q.trim().toLowerCase())
        )
      : byTab;
    return bySearch;
  }, [tab, q]);

  const listEN = filtered.filter((d) => d.subject === 'en');
  const listJA = filtered.filter((d) => d.subject === 'ja');

  return (
    <div className="space-y-6">
      {/* Search + Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            className={`py-2 rounded-lg text-sm font-medium ${
              tab === 'all'
                ? 'bg-white shadow text-gray-900'
                : 'text-slate-600'
            }`}
            onClick={() => setTab('all')}
          >
            Tất cả
          </button>
          <button
            className={`py-2 rounded-lg text-sm font-medium ${
              tab === 'en'
                ? 'bg-white shadow text-gray-900'
                : 'text-slate-600'
            }`}
            onClick={() => setTab('en')}
          >
            Tiếng Anh
          </button>
          <button
            className={`py-2 rounded-lg text-sm font-medium ${
              tab === 'ja'
                ? 'bg-white shadow text-gray-900'
                : 'text-slate-600'
            }`}
            onClick={() => setTab('ja')}
          >
            Tiếng Nhật
          </button>
        </div>
      </div>

      {/* English section */}
      {(tab === 'all' || tab === 'en') && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-900">Tiếng Anh</div>
            <div className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {listEN.length} tài liệu
            </div>
          </div>
          <div className="p-5 space-y-3">
            {listEN.length ? (
              listEN.map((it) => <Row key={it.id} item={it} />)
            ) : (
              <div className="text-sm text-slate-500">Không có tài liệu</div>
            )}
          </div>
        </div>
      )}

      {/* Japanese section */}
      {(tab === 'all' || tab === 'ja') && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-900">Tiếng Nhật</div>
            <div className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {listJA.length} tài liệu
            </div>
          </div>
          <div className="p-5 space-y-3">
            {listJA.length ? (
              listJA.map((it) => <Row key={it.id} item={it} />)
            ) : (
              <div className="text-sm text-slate-500">Không có tài liệu</div>
            )}
          </div>
        </div>
      )}

      {/* Quick access */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-gray-900">Truy cập nhanh</h3>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-6 hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center text-slate-700">
                <BookOpen size={18} />
              </div>
              <div className="font-medium text-gray-900">Giáo trình</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center text-slate-700">
                <PlayCircle size={20} />
              </div>
              <div className="font-medium text-gray-900">Video bài giảng</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center text-slate-700">
                <Download size={18} />
              </div>
              <div className="font-medium text-gray-900">Bài tập</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center text-slate-700">
                <LinkIcon size={18} />
              </div>
              <div className="font-medium text-gray-900">Tài liệu online</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
