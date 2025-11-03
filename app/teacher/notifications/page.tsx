'use client';

import React, { useMemo, useState } from 'react';
import {
  Bell,
  SendHorizonal,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

/**
 * Trang: Thông báo & Trao đổi (Giảng viên)
 * - Next.js App Router + TailwindCSS
 * - Chỉ cần lucide-react cho icon
 * - Không phụ thuộc shadcn/ui hay bất kỳ component ngoài nào
 *
 * Gợi ý đặt file: app/teacher/notifications/page.tsx
 */

// ----------------------------- Utils -----------------------------

type NoticeKind = 'info' | 'warning' | 'success' | 'reminder';

function classNames(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

// ----------------------------- Mock data -----------------------------

type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  createdAt: string; // ISO
  from: 'Hệ thống' | 'Ban quản lý';
  isNew?: boolean;
};

const SEED_NOTICES: Notice[] = [
  {
    id: 'n1',
    kind: 'info',
    title: 'Lịch dạy mới được cập nhật',
    body:
      'Lớp IELTS Foundation - A1 chuyển sang phòng 301 từ ngày 12/10. Vui lòng kiểm tra lại thời khóa biểu.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
    from: 'Ban quản lý',
    isNew: true,
  },
  {
    id: 'n2',
    kind: 'warning',
    title: 'Nhắc nhở điểm danh',
    body:
      'Bạn chưa điểm danh buổi học ngày 08/10 cho lớp TOEIC Intermediate. Vui lòng cập nhật trước 17:00 hôm nay.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
    from: 'Hệ thống',
    isNew: true,
  },
  {
    id: 'n3',
    kind: 'success',
    title: 'Tài liệu mới đã được tải lên',
    body:
      'Đề thi giữa kỳ môn Business English đã được tải lên hệ thống. Bạn có thể tải xuống tại mục Môn học & Tài liệu.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày trước
    from: 'Ban quản lý',
    isNew: false,
  },
  {
    id: 'n4',
    kind: 'info',
    title: 'Thông báo họp giảng viên',
    body:
      'Cuộc họp giảng viên định kỳ sẽ diễn ra vào 9:00 sáng Chủ nhật, 13/10 tại phòng họp tầng 2.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày trước
    from: 'Ban quản lý',
    isNew: false,
  },
  {
    id: 'n5',
    kind: 'success',
    title: 'Đã thanh toán lương tháng 9',
    body:
      'Lương tháng 9/2025 đã được chuyển khoản. Tổng: 20.400.000 VND. Vui lòng kiểm tra tài khoản.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 ngày trước
    from: 'Phòng kế toán',
    isNew: false,
  },
];

type SentItem = {
  id: string;
  title: string;
  toClass: string;
  sentAt: string;
};

const SEED_SENT: SentItem[] = [
  {
    id: 's1',
    title: 'Thông báo dời lịch học',
    toClass: 'IELTS Foundation - A1',
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 's2',
    title: 'Bài tập về nhà tuần này',
    toClass: 'TOEIC Intermediate',
    sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 's3',
    title: 'Nhắc nhở chuẩn bị kiểm tra',
    toClass: 'Business English',
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const CLASS_OPTIONS = [
  'IELTS Foundation - A1',
  'TOEIC Intermediate',
  'Business English',
];

// ----------------------------- Small UI -----------------------------

const Badge: React.FC<{ color?: 'gray' | 'blue' | 'red' | 'green'; children: React.ReactNode }> = ({
  color = 'gray',
  children,
}) => {
  const map = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-rose-100 text-rose-700',
    green: 'bg-emerald-100 text-emerald-700',
  } as const;
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        map[color]
      )}
    >
      {children}
    </span>
  );
};

function KindIcon({ kind }: { kind: NoticeKind }) {
  const base = 'w-5 h-5';
  switch (kind) {
    case 'info':
      return <Info className={classNames(base, 'text-sky-600')} />;
    case 'warning':
      return <AlertTriangle className={classNames(base, 'text-amber-600')} />;
    case 'success':
      return <CheckCircle2 className={classNames(base, 'text-emerald-600')} />;
    case 'reminder':
      return <Clock className={classNames(base, 'text-slate-600')} />;
    default:
      return <Bell className={base} />;
  }
}

const NoticeCard: React.FC<{
  notice: Notice;
}> = ({ notice }) => {
  const created = useMemo(() => new Date(notice.createdAt), [notice.createdAt]);
  return (
    <div className="rounded-2xl border bg-white p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <KindIcon kind={notice.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-gray-900 font-semibold leading-6">{notice.title}</h4>
            {notice.isNew && <Badge color="blue">Mới</Badge>}
          </div>
          <p className="text-sm text-slate-600 mt-1">{notice.body}</p>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <span>Từ: {notice.from}</span>
            <span>•</span>
            <span>{timeAgo(created)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SentHistoryItem: React.FC<{ item: SentItem }> = ({ item }) => {
  const d = new Date(item.sentAt);
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <div className="font-medium text-gray-900">{item.title}</div>
      <div className="text-xs text-slate-500 mt-1">
        Gửi đến: <span className="font-medium">{item.toClass}</span> • {timeAgo(d)}
      </div>
    </div>
  );
};

// ----------------------------- Page -----------------------------

export default function Page() {
  const [tab, setTab] = useState<'feed' | 'send'>('feed');
  const [notices, setNotices] = useState<Notice[]>(SEED_NOTICES);
  const [sent, setSent] = useState<SentItem[]>(SEED_SENT);

  // form
  const [clazz, setClazz] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const unreadCount = notices.filter((n) => n.isNew).length;

  function markAllRead() {
    setNotices((prev) => prev.map((n) => ({ ...n, isNew: false })));
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!clazz || !title || !content) return;

    // push to "Sent" list
    const item: SentItem = {
      id: `s${Date.now()}`,
      title,
      toClass: clazz,
      sentAt: new Date().toISOString(),
    };
    setSent((prev) => [item, ...prev]);

    // optional: also add a new info notice to the feed
    const newNotice: Notice = {
      id: `n${Date.now()}`,
      kind: 'info',
      title,
      body: content,
      createdAt: new Date().toISOString(),
      from: 'Ban quản lý',
      isNew: true,
    };
    setNotices((prev) => [newNotice, ...prev]);

    // reset
    setClazz('');
    setTitle('');
    setContent('');
    // chuyển qua tab thông báo để thấy ngay
    setTab('feed');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Thông báo &amp; Trao đổi</h1>
          <p className="text-sm text-slate-500">
            Quản lý thông báo và gửi tin nhắn cho học viên
          </p>
        </div>

        {tab === 'feed' && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-black/90"
            title="Đánh dấu đã đọc tất cả"
          >
            <CheckCheck size={16} />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex w-full rounded-2xl border bg-white p-1">
        <button
          onClick={() => setTab('feed')}
          className={classNames(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl',
            tab === 'feed' ? 'bg-slate-100 text-gray-900' : 'text-slate-600 hover:text-gray-900'
          )}
        >
          <Bell size={16} />
          Thông báo
          {unreadCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-2 text-white text-xs">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('send')}
          className={classNames(
            'ml-1 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl',
            tab === 'send' ? 'bg-slate-100 text-gray-900' : 'text-slate-600 hover:text-gray-900'
          )}
        >
          <SendHorizonal size={16} />
          Gửi thông báo
        </button>
      </div>

      {tab === 'feed' ? (
        // --------- FEED (Danh sách thông báo) ----------
        <div className="space-y-4">
          {notices.map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
        </div>
      ) : (
        // --------- SEND (Form gửi + Lịch sử gửi) ----------
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Form gửi */}
          <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Gửi thông báo cho học viên</h3>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="text-sm text-slate-600">Chọn lớp học</label>
                <select
                  value={clazz}
                  onChange={(e) => setClazz(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Chọn lớp học...</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-600">Tiêu đề</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo..."
                  className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Nội dung</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  rows={5}
                  className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-black/90"
              >
                <SendHorizonal size={16} />
                Gửi thông báo
              </button>
            </form>
          </div>

          {/* Lịch sử gửi */}
          <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Lịch sử gửi</h3>
            <div className="space-y-3">
              {sent.map((s) => (
                <SentHistoryItem key={s.id} item={s} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
