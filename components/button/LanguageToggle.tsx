"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tooltip } from "@mui/material";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { type Locale, pickLocaleFromPath, localizePath } from "@/lib/i18n/i18n";

export default function LanguageToggle() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const current = (pickLocaleFromPath(pathname) ?? "en") as Locale;
  const target: Locale = current === "vi" ? "en" : "vi";

  // Hiện toast sau khi đổi ngôn ngữ thật
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastLocale = localStorage.getItem("lastLocale");
      if (lastLocale && lastLocale !== current) {
        toast.success(
          current === "vi"
            ? "Đã chuyển ngôn ngữ sang Tiếng Việt"
            : "Switched to English Language",
          { duration: 3000 }
        );
        localStorage.removeItem("lastLocale");
      }
    }
  }, [current]);

  const onSwitch = () => {
    if (loading) return;
    setLoading(true);

    const nextPath = localizePath(pathname, target);
    const qs = search.toString();
    const url = qs ? `${nextPath}?${qs}` : nextPath;

    document.cookie = `locale=${target};path=/;max-age=31536000;samesite=lax`;
    localStorage.setItem("lastLocale", current);

    router.push(url);
  };

  const tooltipTitle =
    current === "vi"
      ? "Chuyển ngôn ngữ sang tiếng Anh"
      : "Switch to Vietnamese language";

  // ✅ Hiện cờ và chữ của NGÔN NGỮ SẮP CHUYỂN ĐẾN
  const flagSrc = target === "vi" ? "/flags/vi.svg" : "/flags/en.svg";
  const label = target.toUpperCase();

  return (
    <Tooltip title={tooltipTitle} arrow>
      <button
        onClick={onSwitch}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2
          h-9 px-3 rounded-lg border text-sm font-semibold
          border-slate-200 bg-white
          hover:shadow-sm hover:scale-[1.02]
          active:scale-[0.98]
          transition-all duration-200 ease-out mr-2
          ${loading ? "cursor-wait opacity-70" : ""}
        `}
        aria-label="Switch language"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <>
            <Image
              src={flagSrc}
              alt={target === "vi" ? "Vietnam Flag" : "UK Flag"}
              width={20}
              height={20}
              className="object-cover"
              priority
            />
            <span>{label}</span>
          </>
        )}
      </button>
    </Tooltip>
  );
}
