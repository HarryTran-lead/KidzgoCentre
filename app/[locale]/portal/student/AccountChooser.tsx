"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { LogOut, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/lightswind/avatar";
import { Button } from "@/components/lightswind/button";
import { Card, CardContent } from "@/components/lightswind/card";
import { Input } from "@/components/lightswind/input";

export type PinState = { error?: string };

type Props = {
  locale?: Locale;
  studentName: string;
  parentName: string;
  studentAction: (formData: FormData) => void | Promise<void>;
  parentAction: (state: PinState, formData: FormData) => Promise<PinState>;
};

// Mock data - Trong thực tế sẽ lấy từ API
const MOCK_CHILDREN = [
  {
    id: "1",
    name: "Nhật",
    avatar: "/image/avatar-placeholder.png",
  },
  {
    id: "2",
    name: "Thịnh",
    avatar: "/image/avatar-placeholder.png",
  },
  {
    id: "3",
    name: "Anh",
    avatar: "/image/avatar-placeholder.png",
  },
];

// 👉 Hàm lấy chữ cái đầu làm avatar
function initialAvatar(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

export default function AccountChooser({
  locale,
  studentName,
  parentName,
  studentAction,
  parentAction,
}: Props) {
  const [showPinForm, setShowPinForm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pinRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction] = useActionState<PinState, FormData>(
    parentAction,
    {}
  );

  const safeLocale = (locale ?? "vi").toUpperCase();

  useEffect(() => {
    if (showPinForm && !isAnimating) {
      setTimeout(() => {
        pinRef.current?.focus();
      }, 600);
    }
  }, [showPinForm, isAnimating]);

  const handleParentClick = () => {
    setIsAnimating(true);
    // Sau 500ms animation, hiển thị form PIN
    setTimeout(() => {
      setShowPinForm(true);
      setIsAnimating(false);
    }, 500);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Tự động submit khi nhập đủ 4 số
    if (value.length === 4) {
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
    }
  };

  const handleLogout = () => {
    // Logic logout
    window.location.href = "/vi";
  };

  const parentAvatarText = initialAvatar(parentName);

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-purple-500 to-blue-400 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-16 text-center">
          Select user
        </h1>

        {/* Avatar Container */}
        <div className="relative">
          {/* Children Avatars - Hidden when animating or showing PIN form */}
          <div
            className={`flex items-center gap-8 transition-all duration-500 ${
              isAnimating || showPinForm
                ? "opacity-0 scale-75 pointer-events-none"
                : "opacity-100 scale-100"
            }`}
          >
            {MOCK_CHILDREN.map((child, index) => (
              <form key={child.id} action={studentAction}>
                <input type="hidden" name="studentId" value={child.id} />
                <button
                  type="submit"
                  className="flex flex-col items-center gap-3 group"
                >
                  <Avatar className="w-35 h-35 border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                    <AvatarImage src={child.avatar || undefined} alt={child.name} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
                      {initialAvatar(child.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white font-medium max-w-[120px] truncate">
                    {child.name}
                  </span>
                </button>
              </form>
            ))}

            {/* Parent Avatar */}
            <button
              onClick={handleParentClick}
              disabled={isAnimating || showPinForm}
              className="flex flex-col items-center gap-3 group"
            >
              <Avatar className="w-35 h-35 border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
                  {parentAvatarText}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium max-w-[120px] truncate">
                {parentName}
              </span>
            </button>
          </div>

          {/* Parent Avatar Centered - Show during animation or PIN form */}
          {(isAnimating || showPinForm) && (
            <div
              className={`absolute left-1/2 top-0 -translate-x-1/2 transition-all duration-500 ${
                showPinForm ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-35 h-35 border-4 border-white shadow-xl">
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
                    {parentAvatarText}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-medium">{parentName}</span>
              </div>
            </div>
          )}
        </div>

        {/* PIN Form - Show after animation */}
        {showPinForm && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="w-[400px] max-w-[90vw] relative">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowPinForm(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <CardContent className="p-6 pt-8">
                <form ref={formRef} action={formAction} className="space-y-4">
                  <div>
                    <label
                      htmlFor="parent-pin"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Nhập mã PIN
                    </label>
                    <Input
                      ref={pinRef}
                      id="parent-pin"
                      name="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="• • • •"
                      className="text-center text-2xl tracking-[0.5rem] font-bold"
                      onChange={handlePinChange}
                      required
                    />
                  </div>

                  {state?.error && (
                    <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      {state.error}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logout Button */}
        <div className="absolute bottom-8">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/90 backdrop-blur-sm hover:bg-gray-200 border-white/50 px-8 py-6 text-base"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
