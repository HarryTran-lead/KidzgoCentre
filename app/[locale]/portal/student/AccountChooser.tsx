"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { ROLES } from "@/lib/role";
import type { UserProfile } from "@/types/auth";
import { clearAccessToken, clearRefreshToken } from "@/lib/store/authToken";
import * as authService from "@/lib/api/authService";
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

// Use canonical shared types

type Profile = UserProfile;

/* ================= CONST ================= */
 
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
    () => localizePath(ROLES.Student, safeLocale),
    [safeLocale]
  );
  const parentPath = useMemo(
    () => localizePath(ROLES.Parent, safeLocale),
    [safeLocale]
  );

  /* ================= FETCH PROFILES ================= */

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await authService.getProfiles();
        console.log("Full API Response:", response);
        
        // BE returns isSuccess (not success)
        const isSuccess = response.isSuccess ?? false;

        if (!isSuccess) {
          setErrorMessage(response.message ?? DEFAULT_ERROR_MESSAGE);
          console.log("Failed payload:", response);
          return;
        }

        // BE returns data as array directly or nested in profiles
        const fetchedProfiles = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.profiles ?? []);
        
        console.log("Fetched profiles:", fetchedProfiles);
        setProfiles(fetchedProfiles);
      } catch (error: any) {
        console.error("Fetch error:", error);
        
        // Handle 401 - token expired
        if (error?.response?.status === 401) {
          setErrorMessage("Phiên đăng nhập đã hết hạn.");
        } else {
          setErrorMessage(error?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  /* ================= FILTER ================= */

  const studentProfiles = useMemo(
    () => profiles.filter((p) => p.profileType === "Student"),
    [profiles]
  );

  const parentProfiles = useMemo(
    () => profiles.filter((p) => p.profileType === "Parent"),
    [profiles]
  );

  /* ================= EFFECT ================= */

  useEffect(() => {
    if (showPinForm && !isAnimating) {
      setTimeout(() => pinRef.current?.focus(), 600);
    }
  }, [showPinForm, isAnimating]);

  /* ================= ACTIONS ================= */

  const setServerSession = async (payload: { role: string; name: string; avatar: string }) => {
    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}
  };

  const handleStudentSelect = async (profile: Profile) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await authService.selectStudent({ profileId: profile.id });
      const isSuccess = response.isSuccess ?? response.success ?? false;
      
      if (!isSuccess) {
        console.error("Select student failed:", response);
        return;
      }

      // Update server-side role cookie to allow portal access
      await setServerSession({
        role: "STUDENT",
        name: profile.displayName,
        avatar: profile.avatarUrl || "",
      });
      router.push(studentPath);
    } catch (error) {
      console.error("Select student error:", error);
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

  const handleParentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPinError(null);

    if (!selectedParent) return;

    const pin = String(new FormData(e.currentTarget).get("pin") || "").trim();
    if (!pin) {
      setPinError("Vui lòng nhập mã PIN");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyParentPin({
        profileId: selectedParent.id,
        pin,
      });

      const isSuccess = response.isSuccess ?? response.success ?? false;

      if (!isSuccess) {
        setPinError(response.message ?? "Mã PIN không đúng");
        return;
      }

      // Update server-side role cookie to allow portal access
      await setServerSession({
        role: "PARENT",
        name: selectedParent.displayName,
        avatar: selectedParent.avatarUrl || "",
      });
      router.push(parentPath);
    } catch (error: any) {
      setPinError(error?.response?.data?.message || "Mã PIN không đúng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Clear all tokens and auth data
    clearAccessToken();
    clearRefreshToken();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProfile');
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
    }
    
    window.location.href = localizePath("/", safeLocale);
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-blue-400 relative overflow-hidden">
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
          {/* Loading & Error States */}
          {loading && (
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Đang tải...</p>
            </div>
          )}
          
          {!loading && errorMessage && (
            <div className="text-white text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md">
              <p className="text-lg font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Profiles - Hidden when animating or showing PIN form */}
          {!loading && !errorMessage && (
            <div
              className={`flex items-center gap-8 transition-all duration-500 ${
                isAnimating || showPinForm
                  ? "opacity-0 scale-75 pointer-events-none"
                  : "opacity-100 scale-100"
              }`}
            >
              {studentProfiles.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  disabled={isSubmitting}
                  className="flex flex-col items-center gap-3 group"
                >
                  <Avatar className="w-35 h-35 border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                    <AvatarImage src={student.avatarUrl || undefined} alt={student.displayName} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
                      {initialAvatar(student.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white font-medium max-w-[120px] truncate">
                    {student.displayName}
                  </span>
                </button>
              ))}

              {parentProfiles.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => handleParentClick(parent)}
                  disabled={isAnimating || showPinForm || isSubmitting}
                  className="flex flex-col items-center gap-3 group"
                >
                  <Avatar className="w-35 h-35 border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                    <AvatarImage src={parent.avatarUrl || undefined} alt={parent.displayName} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
                      {initialAvatar(parent.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white font-medium max-w-[120px] truncate">
                    {parent.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Parent Avatar Centered - Show during animation or PIN form */}
          {(isAnimating || showPinForm) && selectedParent && (
            <div
              className={`absolute left-1/2 top-0 -translate-x-1/2 transition-all duration-500 ${
                showPinForm ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-35 h-35 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedParent.avatarUrl || undefined} alt={selectedParent.displayName} />
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-3xl font-bold">
                    {initialAvatar(selectedParent.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-medium">{selectedParent.displayName}</span>
              </div>
            </div>
          )}
        </div>

        {/* PIN Form - Show after animation */}
        {showPinForm && selectedParent && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="w-[400px] max-w-[90vw] relative">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setShowPinForm(false);
                  setSelectedParent(null);
                  setPinError(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <CardContent className="p-6 pt-8">
                <form ref={formRef} onSubmit={handleParentSubmit} className="space-y-4">
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
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {pinError && (
                    <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      {pinError}
                    </p>
                  )}
                  
                  {isSubmitting && (
                    <p className="text-sm text-slate-600 text-center">
                      Đang xác thực...
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
            className="bg-white/90 backdrop-blur-sm hover:bg-white border-white/50 px-8 py-6 text-base shadow-lg"
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

      