"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { ShieldCheck, Users, Lock, Sparkles, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export type PinState = { error?: string };

type Props = {
  locale?: Locale; // 👈 cho optional để không crash nếu không truyền
  studentName: string;
  parentName: string;
  studentAction: (formData: FormData) => void | Promise<void>;
  parentAction: (state: PinState, formData: FormData) => Promise<PinState>;
};

export default function AccountChooser({
  locale,
  studentName,
  parentName,
  studentAction,
  parentAction,
}: Props) {
  const [showPin, setShowPin] = useState(false);
  const pinRef = useRef<HTMLInputElement | null>(null);

  const [state, formAction] = useActionState<PinState, FormData>(
    parentAction,
    {}
  );

  // Fallback locale nếu undefined
  const safeLocale = (locale ?? "vi").toUpperCase();

  useEffect(() => {
    if (showPin) {
      pinRef.current?.focus();
    }
  }, [showPin]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-sky-50 via-white to-indigo-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 px-4 py-1 text-sm font-medium">
            <Sparkles size={16} /> KidzGo Portal — {safeLocale}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Chọn tài khoản để tiếp tục
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Bạn có thể vào trang học viên để xem lịch học, bài tập hoặc vào
            trang phụ huynh để theo dõi học phí và báo cáo tiến độ.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Thẻ học viên */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center text-xl font-semibold">
                NB
              </div>
              <div>
                <div className="text-sm text-slate-500">Tài khoản học viên</div>
                <div className="text-lg font-semibold text-slate-900">
                  {studentName}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 flex gap-3 text-sm text-slate-700">
              <ShieldCheck className="text-indigo-500" size={18} />
              <div>
                <div className="font-medium text-slate-900">Truy cập nhanh</div>
                <p>
                  Xem lịch học, điểm danh, bài tập và tài liệu được giao cho học
                  viên.
                </p>
              </div>
            </div>

            <form action={studentAction}>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-3 font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition"
              >
                Vào trang học sinh <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Thẻ phụ huynh */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white grid place-items-center text-xl font-semibold">
                BK
              </div>
              <div>
                <div className="text-sm text-slate-500">Tài khoản phụ huynh</div>
                <div className="text-lg font-semibold text-slate-900">
                  {parentName}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 flex gap-3 text-sm text-amber-800">
              <Lock className="text-amber-600" size={18} />
              <div>
                <div className="font-medium text-amber-900">
                  Bảo vệ bằng mã PIN
                </div>
                <p>
                  Nhập mã PIN để xem học phí, báo cáo tiến độ và duyệt thông báo
                  cho phụ huynh.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {!showPin ? (
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50 transition"
                  onClick={() => setShowPin(true)}
                >
                  Nhập mã PIN để vào trang phụ huynh
                </button>
              ) : (
                <form action={formAction} className="space-y-3">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="parent-pin"
                  >
                    Mã PIN bảo vệ
                  </label>
                  <input
                    ref={pinRef}
                    id="parent-pin"
                    name="pin"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Nhập 4-6 số"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg tracking-[0.3rem] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  {state?.error ? (
                    <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                      {state.error}
                    </p>
                  ) : null}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={14} /> Chỉ phụ huynh được cung cấp mã PIN mới
                    xem được thông tin tài chính.
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setShowPin(false)}
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-3 font-semibold shadow-md shadow-amber-200 hover:bg-amber-700 transition"
                    >
                      Mở trang phụ huynh <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
