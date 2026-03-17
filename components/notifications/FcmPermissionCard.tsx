"use client";

import { useMemo, useState } from "react";
import { BellRing, ShieldCheck } from "lucide-react";
import type { Role } from "@/lib/role";
import {
  isFcmReadyInBrowser,
  requestFcmPermissionAndToken,
} from "@/lib/firebase/fcm-web";
import { toast } from "@/hooks/use-toast";

export default function FcmPermissionCard({ role }: { role: Role }) {
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  const permission = useMemo(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }, [version]);

  if (!isFcmReadyInBrowser()) {
    return null;
  }

  const handleEnable = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const result = await requestFcmPermissionAndToken({ role });
      setVersion((value) => value + 1);

      if (result.permission === "granted") {
        toast.success({
          title: "Đã bật push notification",
          description: "Trình duyệt đã sẵn sàng nhận thông báo realtime qua FCM.",
        });
        return;
      }

      toast.warning({
        title: "Chưa bật được thông báo",
        description:
          result.permission === "denied"
            ? "Trình duyệt đang chặn notification. Hãy mở lại trong browser settings."
            : "Bạn chưa cấp quyền nhận thông báo.",
      });
    } catch (error) {
      toast.destructive({
        title: "FCM chưa khởi tạo được",
        description: error instanceof Error ? error.message : "Không thể bật push notification.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-sky-600 p-3 text-white">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Push notification qua Firebase FCM</h2>
              {permission === "granted" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Đã bật
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Khi bật quyền, trình duyệt sẽ nhận thông báo realtime và tự đổ vào inbox trong hệ thống.
            </p>
          </div>
        </div>

        <button
          onClick={handleEnable}
          disabled={loading || permission === "granted"}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {permission === "granted"
            ? "Đã kết nối FCM"
            : loading
            ? "Đang kết nối..."
            : "Bật thông báo realtime"}
        </button>
      </div>
    </section>
  );
}
