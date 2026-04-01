"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Tooltip } from "@mui/material";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "@/hooks/use-toast";
import { type Locale, localizePath, pickLocaleFromPath } from "@/lib/i18n";

export default function LanguageToggle() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const current = (pickLocaleFromPath(pathname) ?? "vi") as Locale;
  const target: Locale = current === "vi" ? "en" : "vi";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastLocale = localStorage.getItem("lastLocale");
    if (lastLocale && lastLocale !== current) {
      toast.success({
        title: "Language updated",
        description:
          current === "vi"
            ? "Vietnamese is now active."
            : "English is now active.",
        duration: 3000,
      });
      localStorage.removeItem("lastLocale");
    }
  }, [current]);

  const onSwitch = () => {
    if (loading) return;
    setLoading(true);

    const nextPath = localizePath(pathname, target);
    const qs = search.toString();
    const url = qs ? `${nextPath}?${qs}` : nextPath;

    document.cookie = `locale=${target};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.setAttribute("lang", target);
    localStorage.setItem("lastLocale", current);

    router.push(url);
  };

  const tooltipTitle =
    current === "vi" ? "Switch to English" : "Switch to Vietnamese";
  const flagSrc = target === "vi" ? "/flags/vi.svg" : "/flags/en.svg";
  const label = target.toUpperCase();
  const hoverBorder =
    target === "vi" ? "hover:border-rose-300" : "hover:border-blue-300";
  const loaderColor = target === "vi" ? "text-red-500" : "text-blue-500";

  return (
    <Tooltip title={tooltipTitle} arrow>
      <button
        onClick={onSwitch}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-1.5
          h-9 px-3 rounded-lg border text-sm font-semibold
          border-slate-200 bg-white
          hover:shadow-sm ${hoverBorder}
          transition-all duration-200 ease-out mr-2
          ${loading ? "cursor-wait opacity-70" : ""}
        `}
        aria-label="Switch language"
      >
        {loading ? (
          <Loader2 className={`w-4 h-4 animate-spin ${loaderColor}`} />
        ) : (
          <>
            <Image
              src={flagSrc}
              alt={target === "vi" ? "Vietnam flag" : "English flag"}
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
