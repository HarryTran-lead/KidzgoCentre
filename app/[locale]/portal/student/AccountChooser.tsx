"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { ROLES } from "@/lib/role";
import {
  getAccessToken,
  clearAccessToken,
  clearRefreshToken,
} from "@/lib/store/authToken";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/lightswind/avatar";
import { Button } from "@/components/lightswind/button";
import { Card, CardContent } from "@/components/lightswind/card";
import { Input } from "@/components/lightswind/input";

/* ================= TYPES ================= */

type Props = {
  locale?: Locale;
};

type ApiResponse<T> = {
  success?: boolean;
  isSuccess?: boolean;
  data?: T;
  message?: string;
};

type Profile = {
  id: string;
  displayName: string;
  profileType: number; // 1 = Student, 0 = Parent
  avatarUrl?: string | null;
};

/* ================= CONST ================= */

const PROFILE_TYPE = {
  STUDENT: 1,
  PARENT: 0,
} as const;

const DEFAULT_ERROR_MESSAGE =
  "Không thể tải danh sách profiles. Vui lòng thử lại.";

/* ================= HELPERS ================= */

function initialAvatar(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

/* ================= COMPONENT ================= */

export default function AccountChooser({ locale }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPinForm, setShowPinForm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Profile | null>(null);

  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pinRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const router = useRouter();

  const safeLocale = useMemo<Locale>(() => locale ?? "vi", [locale]);
  const studentPath = useMemo(
    () => localizePath(ROLES.STUDENT, safeLocale),
    [safeLocale]
  );
  const parentPath = useMemo(
    () => localizePath(ROLES.PARENT, safeLocale),
    [safeLocale]
  );

  /* ================= FETCH PROFILES ================= */

  useEffect(() => {
    const fetchProfiles = async () => {
      const token = getAccessToken();
      if (!token) {
        setErrorMessage("Phiên đăng nhập đã hết hạn.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/profiles", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload: ApiResponse<Profile[]> = await res.json();
        const isSuccess = payload.success ?? payload.isSuccess;

        if (!isSuccess) {
          setErrorMessage(payload.message ?? DEFAULT_ERROR_MESSAGE);
          return;
        }

        setProfiles(payload.data ?? []);
      } catch {
        setErrorMessage(DEFAULT_ERROR_MESSAGE);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  /* ================= FILTER ================= */

  const studentProfiles = useMemo(
    () => profiles.filter((p) => p.profileType === PROFILE_TYPE.STUDENT),
    [profiles]
  );

  const parentProfiles = useMemo(
    () => profiles.filter((p) => p.profileType === PROFILE_TYPE.PARENT),
    [profiles]
  );

  /* ================= EFFECT ================= */

  useEffect(() => {
    if (showPinForm && !isAnimating) {
      setTimeout(() => pinRef.current?.focus(), 500);
    }
  }, [showPinForm, isAnimating]);

  /* ================= ACTIONS ================= */

  const handleStudentSelect = async (profile: Profile) => {
    if (isSubmitting) return;

    const token = getAccessToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/profiles/select-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileId: profile.id }),
      });

      const payload: ApiResponse<unknown> = await res.json();
      const isSuccess = payload.success ?? payload.isSuccess;
      if (!isSuccess) return;

      router.push(studentPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParentClick = (profile: Profile) => {
    setSelectedParent(profile);
    setPinError(null);

    setIsAnimating(true);
    setTimeout(() => {
      setShowPinForm(true);
      setIsAnimating(false);
    }, 400);
  };

  const handleParentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPinError(null);

    if (!selectedParent) return;

    const pin = String(new FormData(e.currentTarget).get("pin") || "").trim();
    if (!pin) {
      setPinError("Vui lòng nhập mã PIN");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/profiles/verify-parent-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileId: selectedParent.id,
          pin,
        }),
      });

      const payload: ApiResponse<unknown> = await res.json();
      const isSuccess = payload.success ?? payload.isSuccess;

      if (!isSuccess) {
        setPinError(payload.message ?? "Mã PIN không đúng");
        return;
      }

      router.push(parentPath);
    } catch {
      setPinError("Mã PIN không đúng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    clearRefreshToken();
    window.location.href = localizePath("/", safeLocale);
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-purple-500 to-blue-400 relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-3xl font-bold text-white mb-16">Select user</h1>

        <div className="relative">
          <div
            className={`flex gap-8 transition-all duration-500 ${
              isAnimating || showPinForm
                ? "opacity-0 scale-75 pointer-events-none"
                : "opacity-100 scale-100"
            }`}
          >
            {loading && <p className="text-white">Loading...</p>}
            {!loading && errorMessage && (
              <p className="text-white">{errorMessage}</p>
            )}

            {!loading &&
              !errorMessage &&
              studentProfiles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStudentSelect(s)}
                  className="flex flex-col items-center gap-3"
                >
                  <Avatar className="w-32 h-32 border-4 border-white">
                    <AvatarFallback>
                      {initialAvatar(s.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white">{s.displayName}</span>
                </button>
              ))}

            {!loading &&
              !errorMessage &&
              parentProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleParentClick(p)}
                  className="flex flex-col items-center gap-3"
                >
                  <Avatar className="w-32 h-32 border-4 border-white">
                    <AvatarFallback>
                      {initialAvatar(p.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white">{p.displayName}</span>
                </button>
              ))}
          </div>

          {(isAnimating || showPinForm) && selectedParent && (
            <div className="absolute left-1/2 -translate-x-1/2 top-0">
              <Avatar className="w-32 h-32 border-4 border-white">
                <AvatarFallback>
                  {initialAvatar(selectedParent.displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {showPinForm && selectedParent && (
          <Card className="mt-10 w-[360px] relative">
            <button
              onClick={() => setShowPinForm(false)}
              className="absolute top-3 right-3"
            >
              <X />
            </button>
            <CardContent>
              <form
                ref={formRef}
                onSubmit={handleParentSubmit}
                className="space-y-4"
              >
                <Input
                  ref={pinRef}
                  name="pin"
                  maxLength={4}
                  inputMode="numeric"
                  className="text-center text-2xl"
                />
                {pinError && (
                  <p className="text-red-500 text-sm">{pinError}</p>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        <div className="absolute bottom-8">
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
