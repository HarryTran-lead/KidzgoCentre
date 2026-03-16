"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  Megaphone,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationKind,
} from "@/types/notification";
import FcmPermissionCard from "@/components/notifications/FcmPermissionCard";

const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string }[] = [
  { value: "all", label: "Tất cả role" },
  { value: "family", label: "Parent + Student" },
  { value: "teaching", label: "Teacher" },
  { value: "management", label: "Admin + Staff" },
  { value: "Parent", label: "Chỉ Parent" },
  { value: "Student", label: "Chỉ Student" },
  { value: "Teacher", label: "Chỉ Teacher" },
];

const KIND_OPTIONS: { value: NotificationKind; label: string }[] = [
  { value: "system", label: "Hệ thống" },
  { value: "schedule", label: "Lịch học" },
  { value: "report", label: "Báo cáo" },
  { value: "payment", label: "Tài chính" },
  { value: "homework", label: "Bài tập" },
  { value: "feedback", label: "Góp ý" },
  { value: "event", label: "Sự kiện" },
];

const CHANNEL_OPTIONS: NotificationChannel[] = [
  "InApp",
  "Email",
  "Zalo OA",
  "InApp + Email",
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function NotificationBroadcastPage() {
  const { campaigns, createCampaign } = useNotifications("Staff_Manager");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<NotificationAudience>("family");
  const [channel, setChannel] = useState<NotificationChannel>("InApp");
  const [kind, setKind] = useState<NotificationKind>("system");

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const sentToday = campaigns.filter((item) => new Date(item.createdAt).toDateString() === today).length;
    const delivered = campaigns.reduce((sum, item) => sum + item.deliveredCount, 0);
    return {
      total: campaigns.length,
      sentToday,
      delivered,
    };
  }, [campaigns]);

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      return;
    }

    createCampaign({
      title: title.trim(),
      message: message.trim(),
      audience,
      channel,
      kind,
      senderRole: "Staff_Manager",
      senderName: "Phòng học vụ",
      priority: kind === "payment" || kind === "report" ? "high" : "medium",
    });

    setTitle("");
    setMessage("");
    setAudience("family");
    setChannel("InApp");
    setKind("system");
  };

  return (
    <div className="space-y-6">
      <FcmPermissionCard role="Staff_Manager" />

      <section className="rounded-[28px] border border-red-200 bg-gradient-to-br from-[#d90429] via-[#ef233c] to-[#ff6b35] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              <Megaphone className="h-3.5 w-3.5" />
              Broadcast Center
            </div>
            <h1 className="mt-4 text-3xl font-bold">Điều phối thông báo cho toàn hệ thống</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
              Staff/manager có thể tạo thông báo in-app dùng chung. Sau khi gửi, bell ở header và
              trang notifications của teacher, parent, student và các role quản lý sẽ cập nhật ngay.
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/75">Campaign</div>
              <div className="mt-2 text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/75">Hôm nay</div>
              <div className="mt-2 text-2xl font-bold">{stats.sentToday}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/75">Delivered</div>
              <div className="mt-2 text-2xl font-bold">{stats.delivered}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Tạo broadcast mới</h2>
              <p className="text-sm text-slate-500">Thông báo sẽ được đẩy vào inbox nội bộ của role được chọn.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Tiêu đề</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-red-300"
                placeholder="Ví dụ: Báo cáo tháng đã được publish"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Nội dung</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[140px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-300"
                placeholder="Nhập nội dung thông báo..."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Audience</span>
                <select
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as NotificationAudience)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-red-300"
                >
                  {AUDIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Loại</span>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as NotificationKind)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-red-300"
                >
                  {KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Kênh</span>
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as NotificationChannel)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-red-300"
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
              Gửi broadcast
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Quy tắc hoạt động</h2>
              <p className="text-sm text-slate-500">Phiên bản hiện tại là in-app notification dùng chung trong web.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              `Staff Management` là nơi tạo campaign broadcast chính.
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              Teacher, parent, student và các role quản lý nhận cùng một nguồn thông báo theo audience.
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              Bell ở header lấy từ cùng store nên unread count cập nhật ngay sau khi gửi.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Lịch sử campaign</h2>
            <p className="text-sm text-slate-500">Các campaign gần nhất đang được lưu trong store chung.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {campaigns.length ? (
            campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{campaign.title}</h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                        {campaign.channel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{campaign.message}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Audience: {campaign.audience}</span>
                      <span>Người gửi: {campaign.senderName}</span>
                      <span>{formatTime(campaign.createdAt)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Delivered</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{campaign.deliveredCount}</div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
              Chưa có campaign nào.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
